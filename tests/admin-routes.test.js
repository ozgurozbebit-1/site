import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("admin ana sayfasında görünür sekmeler ve içerik üret butonu bulunur", () => {
  const html = fs.readFileSync("admin.html", "utf8");
  assert.match(html, /href="\/admin"[^>]*>İletişim<\/a>/);
  assert.match(html, /href="\/admin\/content\/"[^>]*>İçerik Üret<\/a>/);
  assert.match(html, /İçerik Üret Modülünü Aç/);
});

test("/admin/content gerçek statik index dosyası ve route rewrite ile yayınlanır", () => {
  const html = fs.readFileSync("admin/content/index.html", "utf8");
  const vercel = JSON.parse(fs.readFileSync("vercel.json", "utf8"));
  assert.match(html, /<h1>İçerik Üret<\/h1>/);
  assert.match(html, /src="\/admin\/content\.js"/);
  assert.ok(vercel.rewrites.some((route) => (
    route.source === "/admin/content" && route.destination === "/admin/content/index.html"
  )));
  assert.ok(vercel.rewrites.some((route) => (
    route.source === "/admin/content/" && route.destination === "/admin/content/index.html"
  )));
});
