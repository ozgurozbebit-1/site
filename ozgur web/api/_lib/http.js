export function json(res, status, body, extraHeaders = {}) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  for (const [key, value] of Object.entries(extraHeaders)) {
    res.setHeader(key, value);
  }
  res.end(JSON.stringify(body));
}

export async function readJson(req, maxBytes = 16_384) {
  let size = 0;
  const chunks = [];

  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) {
      const error = new Error("İstek gövdesi çok büyük.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  if (chunks.length === 0) return {};

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("Geçersiz JSON.");
    error.statusCode = 400;
    throw error;
  }
}

export function methodNotAllowed(res, allowed) {
  res.setHeader("Allow", allowed.join(", "));
  json(res, 405, { error: "Bu işlem desteklenmiyor." });
}

export function handleError(res, error) {
  const status = Number.isInteger(error.statusCode) ? error.statusCode : 500;
  const message = status >= 500
    ? "İşlem tamamlanamadı. Sunucu ayarlarını ve GitHub erişimini kontrol edin."
    : error.message;

  if (status >= 500) {
    console.error(error);
  }

  json(res, status, { error: message });
}

export function assertSameOrigin(req) {
  const origin = req.headers.origin;
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || "https";

  if (!origin || !host) {
    const error = new Error("İstek kaynağı doğrulanamadı.");
    error.statusCode = 403;
    throw error;
  }

  let parsed;
  try {
    parsed = new URL(origin);
  } catch {
    const error = new Error("İstek kaynağı geçersiz.");
    error.statusCode = 403;
    throw error;
  }

  const isLocal = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  const expectedProtocol = isLocal ? parsed.protocol : `${protocol}:`;
  if (parsed.host !== host || parsed.protocol !== expectedProtocol) {
    const error = new Error("Çapraz kaynaklı istek reddedildi.");
    error.statusCode = 403;
    throw error;
  }
}
