import { requireAuth } from "../_lib/auth.js";
import { approveContentKit } from "../_lib/content-kit.js";
import { assertSameOrigin, handleError, json, methodNotAllowed, readJson } from "../_lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  try {
    requireAuth(req);
    assertSameOrigin(req);
    const payload = await readJson(req);
    json(res, 200, {
      approvedDraft: approveContentKit(payload),
      message: "Hekim onaylı içerik paketi kopyalama ve indirme için hazır. Otomatik yayın yapılmadı.",
    });
  } catch (error) {
    handleError(res, error);
  }
}
