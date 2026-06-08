import { requireAuth } from "../_lib/auth.js";
import { generateContentKit } from "../_lib/content-kit.js";
import { assertSameOrigin, handleError, json, methodNotAllowed, readJson } from "../_lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  try {
    requireAuth(req);
    assertSameOrigin(req);
    const payload = await readJson(req);
    json(res, 200, {
      draft: generateContentKit(payload.title),
      message: "İçerik paketi taslak olarak oluşturuldu. Otomatik yayın yapılmadı.",
    });
  } catch (error) {
    handleError(res, error);
  }
}
