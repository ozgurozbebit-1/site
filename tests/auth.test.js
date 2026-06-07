import assert from "node:assert/strict";
import test from "node:test";
import {
  clearSessionCookie,
  createSessionCookie,
  isAuthenticated,
  verifyPassword,
} from "../api/_lib/auth.js";

process.env.ADMIN_PASSWORD = "uzun-ve-guvenli-parola";
process.env.ADMIN_SESSION_SECRET = "12345678901234567890123456789012";

test("parolayı zaman sabitli karşılaştırmayla doğrular", () => {
  assert.equal(verifyPassword("uzun-ve-guvenli-parola"), true);
  assert.equal(verifyPassword("yanlis-parola"), false);
});

test("imzalı HttpOnly oturum çerezi üretir ve doğrular", () => {
  const req = { headers: { host: "localhost:3000" } };
  const cookie = createSessionCookie(req);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);
  assert.doesNotMatch(cookie, /Secure/);

  const value = cookie.split(";")[0];
  assert.equal(isAuthenticated({ headers: { cookie: value } }), true);
  assert.equal(isAuthenticated({ headers: { cookie: `${value}x` } }), false);
});

test("canlı ortam çerezini Secure olarak temizler", () => {
  const cookie = clearSessionCookie({
    headers: { host: "example.com", "x-forwarded-proto": "https" },
  });
  assert.match(cookie, /Max-Age=0/);
  assert.match(cookie, /Secure/);
});
