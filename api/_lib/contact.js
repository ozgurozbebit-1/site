export const CONTACT_START = "<!-- SITE_CONTACT_START -->";
export const CONTACT_END = "<!-- SITE_CONTACT_END -->";

export const HTML_FILES = [
  "index.html",
  "yaklasim.html",
  "surec.html",
  "olcekler.html",
  "depresyon-duygudurum.html",
  "anksiyete-bozukluklari.html",
  "obsesif-kompulsif-bozukluk.html",
  "bipolar-bozukluk.html",
  "dikkat-ve-islevsellik.html",
  "uyku-ve-stres.html",
  "ilac-tedavisi-ve-takip.html",
  "okb-bilissel-model.html",
  "okb-psikodinamik-model.html",
];

export const DEFAULT_CONTACT = Object.freeze({
  phone: "+90 000 000 00 00",
  whatsapp: "",
  email: "info@ozgurozbebit.com",
  address: "Adres bilgisi eklenecek",
  instagram: "",
  linkedin: "",
});

function cleanText(value, maxLength) {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function normalizePhone(value, required = false) {
  const display = cleanText(value, 40);
  if (!display && !required) return "";
  const digits = display.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) {
    throw validationError("Telefon numarası 10-15 rakam içermelidir.");
  }
  const internationalDigits = digits.startsWith("0")
    ? `90${digits.slice(1)}`
    : digits.length === 10
      ? `90${digits}`
      : digits;
  return {
    display,
    tel: `+${internationalDigits}`,
    digits: internationalDigits,
  };
}

function normalizeUrl(value, label, allowedHosts) {
  const raw = cleanText(value, 240);
  if (!raw) return "";
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  let url;
  try {
    url = new URL(candidate);
  } catch {
    throw validationError(`${label} bağlantısı geçersiz.`);
  }

  if (url.protocol !== "https:" || !allowedHosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) {
    throw validationError(`${label} bağlantısı güvenli ve geçerli bir ${allowedHosts[0]} adresi olmalıdır.`);
  }

  url.hash = "";
  return url.toString();
}

function validationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

export function normalizeContact(input) {
  const phone = normalizePhone(input.phone, true);
  const whatsapp = normalizePhone(input.whatsapp);
  const email = cleanText(input.email, 160).toLowerCase();
  const address = cleanText(input.address, 320);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw validationError("Geçerli bir e-posta adresi girin.");
  }
  if (address.length < 5) {
    throw validationError("Adres alanı en az 5 karakter olmalıdır.");
  }

  return {
    phone: phone.display,
    phoneHref: `tel:${phone.tel}`,
    whatsapp: whatsapp ? whatsapp.display : "",
    whatsappHref: whatsapp ? `https://wa.me/${whatsapp.digits}` : "",
    email,
    emailHref: `mailto:${email}`,
    emailAppointmentHref: `mailto:${email}?subject=Randevu%20Talebi`,
    address,
    instagram: normalizeUrl(input.instagram, "Instagram", ["instagram.com"]),
    linkedin: normalizeUrl(input.linkedin, "LinkedIn", ["linkedin.com"]),
  };
}

export function publicContact(contact) {
  return {
    phone: contact.phone,
    whatsapp: contact.whatsapp,
    email: contact.email,
    address: contact.address,
    instagram: contact.instagram,
    linkedin: contact.linkedin,
  };
}

export function contactBlock(contact) {
  const json = JSON.stringify(contact).replaceAll("<", "\\u003c");
  return `${CONTACT_START}
    <script type="application/json" id="site-contact-data">${json}</script>
    ${CONTACT_END}`;
}

export function extractContact(html) {
  const start = html.indexOf(CONTACT_START);
  const end = html.indexOf(CONTACT_END);

  if (start === -1 || end === -1 || end <= start) {
    return normalizeContact(DEFAULT_CONTACT);
  }

  const block = html.slice(start, end);
  const match = block.match(/<script type="application\/json" id="site-contact-data">([\s\S]*?)<\/script>/);
  if (!match) throw validationError("İletişim veri bloğu okunamadı.");

  try {
    const stored = JSON.parse(match[1]);
    return normalizeContact(stored);
  } catch (error) {
    if (error.statusCode) throw error;
    throw validationError("İletişim verisi geçersiz.");
  }
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeText(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function updateHref(html, key, href) {
  const pattern = new RegExp(`(<[^>]+data-contact-href="${key}"[^>]*)(>)`, "g");
  return html.replace(pattern, (match, opening, close) => {
    const next = /\shref="[^"]*"/.test(opening)
      ? opening.replace(/\shref="[^"]*"/, ` href="${escapeAttribute(href || "#")}"`)
      : `${opening} href="${escapeAttribute(href || "#")}"`;
    return `${next}${close}`;
  });
}

function updateText(html, key, text) {
  const pattern = new RegExp(`(<([a-z0-9-]+)[^>]*data-contact-text="${key}"[^>]*>)([\\s\\S]*?)(<\\/\\2>)`, "gi");
  return html.replace(pattern, (match, opening, tag, current, closing) => (
    `${opening}${escapeText(text)}${closing}`
  ));
}

function updateVisibility(html, key, visible) {
  const pattern = new RegExp(`(<[^>]+data-contact-visible="${key}"[^>]*)(>)`, "g");
  return html.replace(pattern, (match, opening, close) => {
    const withoutHidden = opening.replace(/\shidden(?:="hidden")?/g, "");
    return `${visible ? withoutHidden : `${withoutHidden} hidden`}${close}`;
  });
}

function updateStructuredData(html, contact) {
  return html.replace(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    (full, json) => {
      let data;
      try {
        data = JSON.parse(json);
      } catch {
        return full;
      }

      const candidates = Array.isArray(data?.["@graph"]) ? data["@graph"] : [data];
      let changed = false;
      for (const item of candidates) {
        const types = Array.isArray(item?.["@type"]) ? item["@type"] : [item?.["@type"]];
        if (!types.includes("Physician")) continue;
        item.email = contact.email;
        item.telephone = contact.phone;
        item.address = {
          "@type": "PostalAddress",
          streetAddress: contact.address,
          addressLocality: "Didim",
          addressRegion: "Aydın",
          addressCountry: "TR",
        };
        item.sameAs = [contact.instagram, contact.linkedin].filter(Boolean);
        changed = true;
      }

      return changed
        ? `<script type="application/ld+json">${JSON.stringify(data).replaceAll("<", "\\u003c")}</script>`
        : full;
    },
  );
}

export function applyContactToMarkup(html, contact) {
  const hrefs = {
    phone: contact.phoneHref,
    whatsapp: contact.whatsappHref,
    email: contact.emailHref,
    emailAppointment: contact.emailAppointmentHref,
    instagram: contact.instagram,
    linkedin: contact.linkedin,
  };
  const texts = {
    phone: contact.phone,
    whatsapp: contact.whatsapp,
    email: contact.email,
    address: contact.address,
  };

  let next = html;
  for (const [key, href] of Object.entries(hrefs)) next = updateHref(next, key, href);
  for (const [key, text] of Object.entries(texts)) next = updateText(next, key, text);
  for (const key of ["whatsapp", "instagram", "linkedin"]) {
    next = updateVisibility(next, key, Boolean(hrefs[key]));
  }
  return updateStructuredData(next, contact);
}

export function updateContactBlock(html, contact) {
  const block = contactBlock(contact);
  const start = html.indexOf(CONTACT_START);
  const end = html.indexOf(CONTACT_END);

  if (start !== -1 && end !== -1 && end > start) {
    return applyContactToMarkup(
      `${html.slice(0, start)}${block}${html.slice(end + CONTACT_END.length)}`,
      contact,
    );
  }

  return applyContactToMarkup(html.replace("</head>", `${block}
  </head>`), contact);
}
