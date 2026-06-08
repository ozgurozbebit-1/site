import { requireAuth } from "../_lib/auth.js";
import { handleError, json, methodNotAllowed } from "../_lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  try {
    requireAuth(req);
    json(res, 200, { authenticated: true });
  } catch (error) {
    handleError(res, error);
  }
}
