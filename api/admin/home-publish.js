import { requireAuth } from "../_lib/auth.js";
import { normalizeHome, updateHomePage, verifyHomePage } from "../_lib/homepage.js";
import {
  commitFiles,
  readCommitFiles,
  readFile,
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

    const home = normalizeHome(payload.home || {});
    await validateGithubAccess();
    const currentHtml = await readFile("index.html");
    const updatedHtml = updateHomePage(currentHtml, home);
    verifyHomePage(updatedHtml, home);

    const result = await commitFiles(
      { "index.html": updatedHtml },
      `Ana sayfa içeriğini güncelle (${new Date().toISOString().slice(0, 10)})`,
    );
    const committedPaths = await readCommitFiles(result.sha);
    if (!committedPaths.includes("index.html")) {
      const error = new Error("GitHub commitinde index.html bulunamadı.");
      error.statusCode = 500;
      throw error;
    }

    const committedHtml = await readFile("index.html", result.sha);
    verifyHomePage(committedHtml, home);

    const vercelDeployCheckUrl = process.env.VERCEL_DEPLOYMENTS_URL?.trim() || "https://vercel.com/dashboard";
    const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
    json(res, 200, {
      ok: true,
      home,
      commit: { ...result, files: committedPaths },
      updatedFileCount: 1,
      vercelDeployCheckUrl,
      productionUrl: productionHost ? `https://${productionHost}` : null,
      message: "index.html GitHub commitinde yeniden okunarak doğrulandı. Vercel dağıtımı otomatik başlayacak.",
    });
  } catch (error) {
    handleError(res, error);
  }
}
