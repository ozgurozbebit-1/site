import { requireAuth } from "../_lib/auth.js";
import { extractContact, publicContact } from "../_lib/contact.js";
import { readFile } from "../_lib/github.js";
import { handleError, json, methodNotAllowed } from "../_lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  try {
    requireAuth(req);
    const html = await readFile("index.html");
    json(res, 200, { contact: publicContact(extractContact(html)) });
  } catch (error) {
    handleError(res, error);
  }
}
