import { clearSessionCookie } from "../_lib/auth.js";
import { assertSameOrigin, handleError, json, methodNotAllowed } from "../_lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  try {
    assertSameOrigin(req);
    json(res, 200, { ok: true }, { "Set-Cookie": clearSessionCookie(req) });
  } catch (error) {
    handleError(res, error);
  }
}
