import { createSessionCookie, verifyPassword } from "../_lib/auth.js";
import { assertSameOrigin, handleError, json, methodNotAllowed, readJson } from "../_lib/http.js";

const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function clientKey(req) {
  return String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown")
    .split(",")[0]
    .trim();
}

function checkRateLimit(req) {
  const key = clientKey(req);
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 0, resetAt: now + WINDOW_MS });
    return key;
  }
  if (current.count >= MAX_ATTEMPTS) {
    const error = new Error("Çok fazla başarısız giriş denemesi. 15 dakika sonra tekrar deneyin.");
    error.statusCode = 429;
    throw error;
  }
  return key;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  try {
    assertSameOrigin(req);
    const key = checkRateLimit(req);
    const { password } = await readJson(req, 2_048);
    if (!verifyPassword(password)) {
      const current = attempts.get(key);
      attempts.set(key, { ...current, count: current.count + 1 });
      return json(res, 401, { error: "Parola hatalı." });
    }

    attempts.delete(key);
    json(res, 200, { ok: true }, { "Set-Cookie": createSessionCookie(req) });
  } catch (error) {
    handleError(res, error);
  }
}
