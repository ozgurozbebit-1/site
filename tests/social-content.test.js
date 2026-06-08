import assert from "node:assert/strict";
import test from "node:test";
import {
  approveSocialDraft,
  generateSocialDraft,
  normalizeSocialTitle,
} from "../api/_lib/social-content.js";

test("başlıktan tüm sosyal medya taslaklarını üretir", () => {
  const draft = generateSocialDraft("Panik atak hakkında sık sorulanlar");

  assert.equal(draft.status, "draft");
  assert.match(draft.instagram, /genel bilgilendirme amaçlıdır/i);
  assert.match(draft.facebook, /Kesin tanı veya tedavi vaadi içermez/i);
  assert.match(draft.linkedin, /kişisel tıbbi öneri değildir/i);
  assert.match(draft.tiktok, /0-3 sn/);
  assert.equal(draft.hashtags.length, 5);
  assert.ok(draft.visualSuggestion.length > 40);
  assert.match(draft.physicianNote, /Hekim kontrolü/);
});

test("kesin tedavi veya garanti vadeden başlığı reddeder", () => {
  for (const title of [
    "Depresyona kesin tedavi",
    "Kaygıyı %100 bitiren yöntem",
    "Mucize ilaç önerisi",
    "Panik atağı garanti çözüm",
  ]) {
    assert.throws(() => normalizeSocialTitle(title), /kesin sonuç, garanti/);
  }
});

test("hekim onayı olmadan onaylı taslak oluşturmaz", () => {
  assert.throws(
    () => approveSocialDraft({
      title: "Uyku sorunları hakkında genel bilgiler",
      physicianApproved: false,
    }),
    /Hekim onayı olmadan/,
  );
});

test("hekim onayı yalnızca onaylı taslak durumu oluşturur", () => {
  const approved = approveSocialDraft({
    title: "Uyku sorunları hakkında genel bilgiler",
    physicianApproved: true,
  });

  assert.equal(approved.status, "physician-approved");
  assert.ok(approved.approvedAt);
  assert.match(approved.disclaimer, /tanı veya kişisel tedavi önerisi değildir/);
});
