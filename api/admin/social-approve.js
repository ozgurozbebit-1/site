import { requireAuth } from "../_lib/auth.js";
import { approveSocialDraft } from "../_lib/social-content.js";
import { assertSameOrigin, handleError, json, methodNotAllowed, readJson } from "../_lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  try {
    requireAuth(req);
    assertSameOrigin(req);
    const payload = await readJson(req);
    json(res, 200, {
      approvedDraft: approveSocialDraft(payload),
      message: "Hekim onaylı taslak hazırlandı. Otomatik yayın yapılmadı.",
    });
  } catch (error) {
    handleError(res, error);
  }
}
