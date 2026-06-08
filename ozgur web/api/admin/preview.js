import { requireAuth } from "../_lib/auth.js";
import { HTML_FILES, normalizeContact, publicContact } from "../_lib/contact.js";
import { assertSameOrigin, handleError, json, methodNotAllowed, readJson } from "../_lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  try {
    requireAuth(req);
    assertSameOrigin(req);
    const payload = await readJson(req);
    const contact = normalizeContact(payload.contact || {});

    json(res, 200, {
      preview: publicContact(contact),
      affectedFiles: HTML_FILES,
      summary: `${HTML_FILES.length} HTML dosyasındaki iletişim verileri güncellenecek.`,
    });
  } catch (error) {
    handleError(res, error);
  }
}
