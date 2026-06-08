import assert from "node:assert/strict";
import test from "node:test";
import {
  approveContentKit,
  generateContentKit,
} from "../api/_lib/content-kit.js";

test("blog ve tüm kanal taslaklarını tek pakette üretir", () => {
  const draft = generateContentKit("Antidepresanlar hakkında sık sorulanlar");

  assert.equal(draft.status, "draft");
  assert.match(draft.blog, /## Konuya genel bakış/);
  assert.match(draft.blog, /## Ne zaman profesyonel destek düşünülmeli/);
  assert.match(draft.instagram, /genel bilgilendirme amaçlıdır/i);
  assert.match(draft.facebook, /kişisel tedavi önerisi yerine geçmez/i);
  assert.match(draft.linkedin, /klinik değerlendirme yerine geçmez/i);
  assert.ok(draft.x.length <= 280);
  assert.match(draft.video, /0-3 sn/);
  assert.ok(draft.hashtags.length >= 5 && draft.hashtags.length <= 8);
  assert.match(draft.visualSuggestion, /7 slaytlık sade bir carousel/);
  assert.match(draft.physicianNote, /Hekim kontrolü zorunludur/);
});

test("genişletilmiş içerik türlerini istenen yapıda üretir", () => {
  const draft = generateContentKit("Kaygı belirtilerini anlamak");
  const linkedinWordCount = draft.linkedinArticle.trim().split(/\s+/).length;

  assert.equal((draft.carousel.match(/^Slayt \d+:/gm) || []).length, 7);
  assert.match(draft.carousel, /Son CTA slaytı:/);
  assert.equal((draft.xFlood.match(/\d\/8/g) || []).length, 8);
  assert.ok(linkedinWordCount >= 800 && linkedinWordCount <= 1200);
  assert.match(draft.linkedinArticle, /Giriş/);
  assert.match(draft.linkedinArticle, /Sonuç/);
  assert.match(draft.linkedinArticle, /Kaynak önerileri/);
  assert.match(draft.facebookLong, /bir sabah alarm çalar/i);
  assert.match(draft.blogSeoPackage, /SEO BAŞLIK/);
  assert.match(draft.blogSeoPackage, /META DESCRIPTION/);
  assert.match(draft.blogSeoPackage, /URL SLUG/);
  assert.match(draft.blogSeoPackage, /BLOG İÇERİĞİ/);
  assert.equal((draft.faq.match(/^\d+\./gm) || []).length, 10);
  assert.match(draft.videoScripts, /60 SANİYELİK KONUŞMA METNİ/);
  assert.match(draft.videoScripts, /3 DAKİKALIK KONUŞMA METNİ/);
  assert.match(draft.videoScripts, /10 DAKİKALIK KONUŞMA METNİ/);
  assert.match(draft.podcast, /GİRİŞ MÜZİĞİ ANONSU/);
  assert.match(draft.podcast, /ANA İÇERİK/);
  assert.match(draft.podcast, /KAPANIŞ/);
  assert.match(draft.brochure, /A4/);
  assert.equal((draft.contentCalendar.match(/^\d+\. Gün/gm) || []).length, 7);
});

test("uzman paketi tek üretimde Faz 1 çıktılarının tamamını döndürür", () => {
  const draft = generateContentKit("Antidepresanlar bağımlılık yapar mı?");

  for (const field of ["blog", "instagram", "carousel", "facebook", "linkedinArticle", "xFlood", "video", "faq", "podcast", "blogSeoPackage"]) {
    assert.ok(draft[field], `${field} çıktısı eksik`);
  }
});

test("hekim onayı olmadan içerik paketi dışa aktarıma açılamaz", () => {
  assert.throws(
    () => approveContentKit({
      title: "Uyku düzeni hakkında genel bilgiler",
      physicianApproved: false,
    }),
    /hekim onayı gereklidir/i,
  );
});

test("hekim onayı sonrası yalnızca onaylı taslak üretir", () => {
  const approved = approveContentKit({
    title: "Uyku düzeni hakkında genel bilgiler",
    physicianApproved: true,
  });

  assert.equal(approved.status, "physician-approved");
  assert.ok(approved.approvedAt);
  assert.equal(approved.hashtags.length, 7);
});

test("yanıltıcı sağlık vaadi içeren başlığı reddeder", () => {
  assert.throws(
    () => generateContentKit("Kaygıya kesin tedavi garantisi"),
    /kesin sonuç, garanti/,
  );
});
