import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  extractHome,
  normalizeHome,
  updateHomePage,
  verifyHomePage,
} from "../api/_lib/homepage.js";

const home = {
  eyebrow: "Erişkin Ruh Sağlığı",
  heroTitle: "Yeni ana hero başlığı",
  heroDescription: "Yeni hero açıklaması ve SEO açıklaması.",
  appointmentButton: "Randevu Oluştur",
  servicesButton: "Uzmanlık Alanları",
  approachTitle: "Yeni yaklaşım başlığı",
  approachDescription: "Yeni yaklaşım açıklaması.",
  processTitle: "Yeni süreç başlığı",
  processDescription: "Yeni süreç açıklaması.",
};

test("ana sayfa metinlerini ve SEO alanlarını günceller", () => {
  const original = fs.readFileSync("index.html", "utf8");
  const contactBlock = original.match(/<!-- SITE_CONTACT_START -->[\s\S]*?<!-- SITE_CONTACT_END -->/)[0];
  const updated = updateHomePage(original, home);

  assert.equal(verifyHomePage(updated, home), true);
  assert.match(updated, /<h1 data-home-text="heroTitle">Yeni ana hero başlığı<\/h1>/);
  assert.match(updated, /<meta name="description" content="Yeni hero açıklaması ve SEO açıklaması\.">/);
  assert.match(updated, /<meta property="og:description" content="Yeni hero açıklaması ve SEO açıklaması\.">/);
  assert.match(updated, /<title>Yeni ana hero başlığı \| Uzm\. Dr\. Özgür Özbebit<\/title>/);
  assert.ok(updated.includes(contactBlock), "iletişim veri bloğu değişmeden korunmalı");
  assert.deepEqual(extractHome(updated), normalizeHome(home));
});

test("özel karakterleri HTML metni ve meta alanlarında güvenli yazar", () => {
  const original = fs.readFileSync("index.html", "utf8");
  const updated = updateHomePage(original, {
    ...home,
    heroTitle: 'Kaygı & Duygudurum <Değerlendirme>',
    heroDescription: 'Bilimsel "ve" güvenli & anlaşılır destek.',
  });

  assert.match(updated, /Kaygı &amp; Duygudurum &lt;Değerlendirme&gt;/);
  assert.match(updated, /content="Bilimsel &quot;ve&quot; güvenli &amp; anlaşılır destek\."/);
});
