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
  for (const tab of ["Blog", "SEO Blog Paketi", "Instagram", "Carousel", "Facebook", "LinkedIn Uzun", "X Flood", "Video", "Podcast", "SSS"]) {
    assert.match(html, new RegExp(`>${tab}<\\/button>`));
  }
  assert.match(html, /data-content-output="linkedinArticle"/);
  assert.match(html, /data-content-output="contentCalendar"/);
  assert.match(html, /data-copy-tab="podcast"/);
  assert.match(html, /data-content-panel="seo-blog"/);
  assert.match(html, /data-content-panel="linkedin-long"/);
  assert.equal((html.match(/data-download-tab=/g) || []).length, 10);
  assert.match(html, /Tek Tuş Uzman Paketi/);
  assert.match(html, />UZMAN PAKETİ OLUŞTUR<\/button>/);
  for (const item of ["Blog", "SEO Blog Paketi", "Instagram Post", "Carousel", "Facebook", "LinkedIn Uzun Makale", "X Flood", "Reels Senaryosu", "SSS", "Podcast"]) {
    assert.match(html, new RegExp(`<span>${item}<\\/span>`));
  }
  assert.ok(vercel.rewrites.some((route) => (
    route.source === "/admin/content" && route.destination === "/admin/content/index.html"
  )));
  assert.ok(vercel.rewrites.some((route) => (
    route.source === "/admin/content/" && route.destination === "/admin/content/index.html"
  )));
});
