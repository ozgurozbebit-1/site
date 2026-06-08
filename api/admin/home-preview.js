import { requireAuth } from "../_lib/auth.js";
import { normalizeHome } from "../_lib/homepage.js";
import { assertSameOrigin, handleError, json, methodNotAllowed, readJson } from "../_lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  try {
    requireAuth(req);
    assertSameOrigin(req);
    const payload = await readJson(req);
    json(res, 200, {
      preview: normalizeHome(payload.home || {}),
      affectedFiles: ["index.html"],
      summary: "Ana sayfa metinleri ve SEO alanları index.html içinde güncellenecek.",
    });
  } catch (error) {
    handleError(res, error);
  }
}
