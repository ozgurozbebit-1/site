import { requireAuth } from "../_lib/auth.js";
import { generateSocialDraft } from "../_lib/social-content.js";
import { assertSameOrigin, handleError, json, methodNotAllowed, readJson } from "../_lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  try {
    requireAuth(req);
    assertSameOrigin(req);
    const payload = await readJson(req);
    json(res, 200, {
      draft: generateSocialDraft(payload.title),
      message: "Taslak oluşturuldu. Hiçbir sosyal medya hesabında yayınlanmadı.",
    });
  } catch (error) {
    handleError(res, error);
  }
}
