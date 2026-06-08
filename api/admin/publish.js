import { requireAuth } from "../_lib/auth.js";
import {
  HTML_FILES,
  normalizeContact,
  publicContact,
  updateContactBlock,
  verifyIndexContact,
  verifyPublishedContact,
} from "../_lib/contact.js";
import {
  commitFiles,
  readCommitFiles,
  readFiles,
  validateGithubAccess,
} from "../_lib/github.js";
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
    await validateGithubAccess();
    console.info("[admin/publish] Normalize edilmiş iletişim verisi", {
      phone: contact.phone,
      phoneHref: contact.phoneHref,
      whatsapp: contact.whatsapp,
      whatsappHref: contact.whatsappHref,
      email: contact.email,
      emailHref: contact.emailHref,
      address: contact.address,
    });
    const currentFiles = await readFiles(HTML_FILES);
    const updatedFiles = Object.fromEntries(
      Object.entries(currentFiles).map(([path, html]) => [path, updateContactBlock(html, contact)]),
    );
    verifyPublishedContact(updatedFiles, contact);
    verifyIndexContact(updatedFiles["index.html"], contact);

    console.info("[admin/publish] GitHub commitine hazırlanıyor", {
      branch: process.env.GITHUB_BRANCH,
      fileCount: Object.keys(updatedFiles).length,
      files: Object.keys(updatedFiles),
    });

    const result = await commitFiles(
      updatedFiles,
      `İletişim bilgilerini güncelle (${new Date().toISOString().slice(0, 10)})`,
    );
    const committedPaths = await readCommitFiles(result.sha);
    const missingCommitFiles = HTML_FILES.filter((path) => !committedPaths.includes(path));
    if (missingCommitFiles.length) {
      const error = new Error(`GitHub commitinde beklenen HTML dosyaları eksik: ${missingCommitFiles.join(", ")}`);
      error.statusCode = 500;
      throw error;
    }

    const committedFiles = await readFiles(HTML_FILES, result.sha);
    verifyPublishedContact(committedFiles, contact);
    verifyIndexContact(committedFiles["index.html"], contact);

    console.info("[admin/publish] GitHub commit doğrulandı", {
      sha: result.sha,
      branch: result.branch,
      fileCount: committedPaths.length,
      files: committedPaths,
    });

    const vercelDeployCheckUrl = process.env.VERCEL_DEPLOYMENTS_URL?.trim() || "https://vercel.com/dashboard";
    const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

    json(res, 200, {
      ok: true,
      contact: publicContact(contact),
      commit: {
        ...result,
        files: committedPaths,
      },
      updatedFiles: HTML_FILES,
      verifiedFiles: Object.keys(committedFiles),
      updatedFileCount: committedPaths.length,
      vercelDeployCheckUrl,
      productionUrl: productionHost ? `https://${productionHost}` : null,
      message: `${Object.keys(committedFiles).length} HTML dosyası GitHub commitinde doğrulandı. Vercel dağıtımı otomatik başlayacak.`,
    });
  } catch (error) {
    handleError(res, error);
  }
}
