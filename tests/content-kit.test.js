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
