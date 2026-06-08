import assert from "node:assert/strict";
import test from "node:test";
import {
  extractContact,
  normalizeContact,
  publicContact,
  updateContactBlock,
  verifyIndexContact,
  verifyPublishedContact,
} from "../api/_lib/contact.js";

const validInput = {
  phone: "0555 111 22 33",
  whatsapp: "+90 555 444 33 22",
  email: "INFO@EXAMPLE.COM",
  address: "Yeni Mahalle, Didim / Aydın",
  instagram: "instagram.com/ornek",
  linkedin: "https://www.linkedin.com/in/ornek",
};

test("iletişim verisini normalize eder", () => {
  const result = normalizeContact(validInput);
  assert.equal(result.phoneHref, "tel:+905551112233");
  assert.equal(result.whatsappHref, "https://wa.me/905554443322");
  assert.equal(result.email, "info@example.com");
  assert.equal(result.instagram, "https://instagram.com/ornek");
  assert.equal(result.linkedin, "https://www.linkedin.com/in/ornek");
});

test("başında sıfır olmayan 10 haneli Türkiye numarasına ülke kodu ekler", () => {
  const result = normalizeContact({ ...validInput, phone: "555 111 22 33" });
  assert.equal(result.phoneHref, "tel:+905551112233");
});

test("güvenilmeyen sosyal medya alan adını reddeder", () => {
  assert.throws(
    () => normalizeContact({ ...validInput, instagram: "https://example.com/fake" }),
    /Instagram bağlantısı/,
  );
});

test("HTML veri bloğunu, görünür alanları ve Physician şemasını günceller", () => {
  const html = `<!doctype html>
<head>
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Physician","email":"old@example.com"}]}</script>
</head>
<body>
<a data-contact-href="phone" data-contact-text="phone" href="tel:+900">Eski telefon</a>
<a data-contact-href="whatsapp" data-contact-visible="whatsapp" href="#" hidden>WhatsApp</a>
<span data-contact-text="address">Eski adres</span>
</body>`;
  const contact = normalizeContact(validInput);
  const updated = updateContactBlock(html, contact);

  assert.match(updated, /SITE_CONTACT_START/);
  assert.match(updated, /href="tel:\+905551112233"/);
  assert.match(updated, />0555 111 22 33<\/a>/);
  assert.match(updated, /href="https:\/\/wa\.me\/905554443322"/);
  assert.doesNotMatch(updated, /data-contact-visible="whatsapp"[^>]*hidden/);
  assert.match(updated, /Yeni Mahalle, Didim \/ Aydın/);
  assert.match(updated, /SITE_FOOTER_CONTACT_START/);
  assert.match(updated, /data-contact-href="email" data-contact-text="email" href="mailto:info@example\.com"/);

  const schema = JSON.parse(updated.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const physician = schema["@graph"][0];
  assert.equal(physician.email, "info@example.com");
  assert.equal(physician.telephone, "0555 111 22 33");
  assert.deepEqual(physician.sameAs, [
    "https://instagram.com/ornek",
    "https://www.linkedin.com/in/ornek",
  ]);

  assert.deepEqual(publicContact(extractContact(updated)), {
    phone: "0555 111 22 33",
    whatsapp: "+90 555 444 33 22",
    email: "info@example.com",
    address: "Yeni Mahalle, Didim / Aydın",
    instagram: "https://instagram.com/ornek",
    linkedin: "https://www.linkedin.com/in/ornek",
  });
});

test("eski güncelleniyor placeholder bağlantılarını gerçek form değerleriyle değiştirir", () => {
  const html = `<!doctype html>
<head>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Physician"}</script>
</head>
<body>
<a data-contact-href="phone" data-contact-text="phone" href="tel:+güncelleniyor">güncelleniyor</a>
<a data-contact-href="whatsapp" href="https://wa.me/guncelleniyor">WhatsApp</a>
<a data-contact-href="email" data-contact-text="email" href="mailto:güncelleniyor">güncelleniyor</a>
<a data-contact-href="emailAppointment" href="mailto:güncelleniyor?subject=Randevu%20Talebi">E-posta Gönder</a>
<span data-contact-text="address">güncelleniyor</span>
<footer></footer>
</body>`;
  const updated = updateContactBlock(html, validInput);

  assert.doesNotMatch(updated, /g(?:ü|u)ncelleniyor/i);
  assert.match(updated, /href="tel:\+905551112233"/);
  assert.match(updated, /href="https:\/\/wa\.me\/905554443322"/);
  assert.match(updated, /href="mailto:info@example\.com"/);
  assert.match(updated, /href="mailto:info@example\.com\?subject=Randevu%20Talebi"/);
  assert.match(updated, />0555 111 22 33<\/a>/);
  assert.match(updated, />info@example\.com<\/a>/);
  assert.match(updated, />Yeni Mahalle, Didim \/ Aydın<\/span>/);
});

test("üretilen ana sayfa ve hizmet sayfalarında telefon ile e-posta görünür", () => {
  const contact = normalizeContact(validInput);
  const source = `<!doctype html>
<head>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Physician"}</script>
</head>
<body><main>İçerik</main><footer><p>Bilgilendirme</p></footer></body>`;
  const files = {
    "index.html": updateContactBlock(source, contact),
    "depresyon-duygudurum.html": updateContactBlock(source, contact),
    "anksiyete-bozukluklari.html": updateContactBlock(source, contact),
  };

  assert.equal(verifyPublishedContact(files, contact), true);
  assert.equal(verifyIndexContact(files["index.html"], contact), true);
  for (const html of Object.values(files)) {
    assert.match(html, />0555 111 22 33<\/a>/);
    assert.match(html, />info@example\.com<\/a>/);
    assert.match(html, /href="tel:\+905551112233"/);
    assert.match(html, /href="mailto:info@example\.com"/);
  }
});

test("index.html görünür telefon veya e-posta içermiyorsa yayını reddeder", () => {
  const contact = normalizeContact(validInput);
  const onlyDataBlock = `<head>${contactBlockForTest(contact)}</head><body></body>`;
  assert.throws(
    () => verifyIndexContact(onlyDataBlock, contact),
    /index\.html içinde yeni telefon ve e-posta/,
  );
});

test("index.html içinde güncelleniyor kaldıysa yayını reddeder", () => {
  const contact = normalizeContact(validInput);
  const html = updateContactBlock(
    `<head><script type="application/ld+json">{"@type":"Physician"}</script></head>
    <body><p>güncelleniyor</p><footer></footer></body>`,
    contact,
  );
  assert.throws(
    () => verifyIndexContact(html, contact),
    /güncelleniyor/,
  );
});

function contactBlockForTest(contact) {
  return `<script type="application/json" id="site-contact-data">${JSON.stringify(contact)}</script>`;
}

test("boş sosyal bağlantıları gizli tutar", () => {
  const html = `<head></head><a data-contact-href="instagram" data-contact-visible="instagram" href="https://instagram.com/test">Instagram</a>`;
  const contact = normalizeContact({ ...validInput, instagram: "", linkedin: "", whatsapp: "" });
  const updated = updateContactBlock(html, contact);
  assert.match(updated, /data-contact-visible="instagram"[^>]*hidden/);
});
