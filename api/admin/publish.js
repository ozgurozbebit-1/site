import { requireAuth } from "../_lib/auth.js";
import {
  HTML_FILES,
  normalizeContact,
  publicContact,
  updateContactBlock,
  verifyPublishedContact,
} from "../_lib/contact.js";
import { commitFiles, readFiles } from "../_lib/github.js";
import { assertSameOrigin, handleError, json, methodNotAllowed, readJson } from "../_lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  try {
    requireAuth(req);
    assertSameOrigin(req);
    const payload = await readJson(req);
    if (payload.confirm !== true) {
      const error = new Error("Yayınlama onayı gerekiyor.");
      error.statusCode = 400;
      throw error;
    }

    const contact = normalizeContact(payload.contact || {});
    const currentFiles = await readFiles(HTML_FILES);
    const updatedFiles = Object.fromEntries(
      Object.entries(currentFiles).map(([path, html]) => [path, updateContactBlock(html, contact)]),
    );
    verifyPublishedContact(updatedFiles, contact);

    const result = await commitFiles(
      updatedFiles,
      `İletişim bilgilerini güncelle (${new Date().toISOString().slice(0, 10)})`,
    );
    const committedFiles = await readFiles(HTML_FILES, result.sha);
    verifyPublishedContact(committedFiles, contact);

    json(res, 200, {
      ok: true,
      contact: publicContact(contact),
      commit: result,
      updatedFiles: HTML_FILES,
      verifiedFiles: Object.keys(committedFiles),
      message: `${Object.keys(committedFiles).length} HTML dosyası GitHub commitinde doğrulandı. Vercel dağıtımı otomatik başlayacak.`,
    });
  } catch (error) {
    handleError(res, error);
  }
}
