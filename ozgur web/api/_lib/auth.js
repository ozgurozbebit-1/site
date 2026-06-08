import crypto from "node:crypto";

const COOKIE_NAME = "ozgur_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    const error = new Error(`${name} ortam değişkeni tanımlı değil.`);
    error.statusCode = 500;
    throw error;
  }
  if (name === "ADMIN_SESSION_SECRET" && value.length < 32) {
    const error = new Error("ADMIN_SESSION_SECRET en az 32 karakter olmalıdır.");
    error.statusCode = 500;
    throw error;
  }
  if (name === "ADMIN_PASSWORD" && value.length < 12) {
    const error = new Error("ADMIN_PASSWORD en az 12 karakter olmalıdır.");
    error.statusCode = 500;
    throw error;
  }
  return value;
}

function encode(value) {
  return Buffer.from(value).toString("base64url");
}

function sign(payload) {
  return crypto
    .createHmac("sha256", requiredEnv("ADMIN_SESSION_SECRET"))
    .update(payload)
    .digest("base64url");
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function parseCookies(req) {
  return Object.fromEntries(
    String(req.headers.cookie || "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return index === -1
          ? [part, ""]
          : [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      }),
  );
}

export function verifyPassword(password) {
  return safeEqual(password, requiredEnv("ADMIN_PASSWORD"));
}

export function createSessionCookie(req) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const nonce = crypto.randomBytes(18).toString("base64url");
  const payload = encode(JSON.stringify({ expiresAt, nonce }));
  const value = `${payload}.${sign(payload)}`;
  const secure = isSecureRequest(req);

  return [
    `${COOKIE_NAME}=${encodeURIComponent(value)}`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    `Max-Age=${SESSION_TTL_SECONDS}`,
    secure ? "Secure" : "",
  ].filter(Boolean).join("; ");
}

export function clearSessionCookie(req) {
  const secure = isSecureRequest(req);
  return [
    `${COOKIE_NAME}=`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    "Max-Age=0",
    secure ? "Secure" : "",
  ].filter(Boolean).join("; ");
}

function isSecureRequest(req) {
  const forwardedProtocol = req.headers["x-forwarded-proto"];
  if (forwardedProtocol) return forwardedProtocol === "https";
  const host = String(req.headers.host || "");
  return !(host.startsWith("localhost") || host.startsWith("127.0.0.1"));
}

export function isAuthenticated(req) {
  const value = parseCookies(req)[COOKIE_NAME];
  if (!value) return false;

  const [payload, signature] = value.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return false;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Number.isFinite(session.expiresAt) && session.expiresAt > Date.now() / 1000;
  } catch {
    return false;
  }
}

export function requireAuth(req) {
  if (!isAuthenticated(req)) {
    const error = new Error("Oturum açmanız gerekiyor.");
    error.statusCode = 401;
    throw error;
  }
}
