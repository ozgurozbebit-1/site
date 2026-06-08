import { requireAuth } from "../_lib/auth.js";
import { extractHome } from "../_lib/homepage.js";
import { readFile } from "../_lib/github.js";
import { handleError, json, methodNotAllowed } from "../_lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  try {
    requireAuth(req);
    const html = await readFile("index.html");
    json(res, 200, { home: extractHome(html) });
  } catch (error) {
    handleError(res, error);
  }
}
