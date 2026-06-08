export const CONTACT_START = "<!-- SITE_CONTACT_START -->";
export const CONTACT_END = "<!-- SITE_CONTACT_END -->";
const PLACEHOLDER_PATTERN = /g(?:ü|u)ncelleniyor/gi;

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

function footerContactMarkup() {
  return `      <!-- SITE_FOOTER_CONTACT_START -->
      <p class="footer-contact">
        <a data-contact-href="phone" data-contact-text="phone" href="#">Telefon</a>
        <a data-contact-href="whatsapp" data-contact-visible="whatsapp" href="#" hidden>WhatsApp: <span data-contact-text="whatsapp"></span></a>
        <a data-contact-href="email" data-contact-text="email" href="#">E-posta</a>
        <span data-contact-text="address">Adres</span>
        <a data-contact-href="instagram" data-contact-visible="instagram" href="#" target="_blank" rel="noreferrer" hidden>Instagram</a>
        <a data-contact-href="linkedin" data-contact-visible="linkedin" href="#" target="_blank" rel="noreferrer" hidden>LinkedIn</a>
      </p>
      <!-- SITE_FOOTER_CONTACT_END -->
`;
}

function ensureFooterContact(html) {
  const start = "<!-- SITE_FOOTER_CONTACT_START -->";
  const end = "<!-- SITE_FOOTER_CONTACT_END -->";
  const startIndex = html.indexOf(start);
  const endIndex = html.indexOf(end);
  const markup = footerContactMarkup();

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    return `${html.slice(0, startIndex)}${markup.trimEnd()}${html.slice(endIndex + end.length)}`;
  }

  if (html.includes("</footer>")) {
    return html.replace("</footer>", `${markup}    </footer>`);
  }
  if (html.includes("</body>")) {
    return html.replace("</body>", `${markup}</body>`);
  }
  return `${html}\n${markup}`;
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

function replaceLegacyPlaceholders(html, contact) {
  return html
    .replace(
      /href="tel:\+?g(?:ü|u)ncelleniyor"/gi,
      `href="${escapeAttribute(contact.phoneHref)}"`,
    )
    .replace(
      /href="mailto:g(?:ü|u)ncelleniyor\?subject=Randevu%20Talebi"/gi,
      `href="${escapeAttribute(contact.emailAppointmentHref)}"`,
    )
    .replace(
      /href="mailto:g(?:ü|u)ncelleniyor"/gi,
      `href="${escapeAttribute(contact.emailHref)}"`,
    );
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
  const normalized = normalizeContact(contact);
  const hrefs = {
    phone: normalized.phoneHref,
    whatsapp: normalized.whatsappHref,
    email: normalized.emailHref,
    emailAppointment: normalized.emailAppointmentHref,
    instagram: normalized.instagram,
    linkedin: normalized.linkedin,
  };
  const texts = {
    phone: normalized.phone,
    whatsapp: normalized.whatsapp,
    email: normalized.email,
    address: normalized.address,
  };

  let next = replaceLegacyPlaceholders(ensureFooterContact(html), normalized);
  for (const [key, href] of Object.entries(hrefs)) next = updateHref(next, key, href);
  for (const [key, text] of Object.entries(texts)) next = updateText(next, key, text);
  for (const key of ["whatsapp", "instagram", "linkedin"]) {
    next = updateVisibility(next, key, Boolean(hrefs[key]));
  }
  return updateStructuredData(next, normalized);
}

export function verifyPublishedContact(files, contact) {
  const failures = [];

  for (const [path, html] of Object.entries(files)) {
    const placeholders = html.match(PLACEHOLDER_PATTERN);
    PLACEHOLDER_PATTERN.lastIndex = 0;
    if (placeholders?.length) {
      failures.push(`${path}: "güncelleniyor" placeholder'ı kaldı`);
      continue;
    }

    const requiredValues = [
      contact.phone,
      contact.phoneHref,
      contact.email,
      contact.emailHref,
      contact.address,
      '"@type":"Physician"',
      `"telephone":${JSON.stringify(contact.phone)}`,
      `"email":${JSON.stringify(contact.email)}`,
      `"streetAddress":${JSON.stringify(contact.address)}`,
      "SITE_FOOTER_CONTACT_START",
    ];

    if (contact.whatsapp) requiredValues.push(contact.whatsapp, contact.whatsappHref);
    if (contact.instagram) requiredValues.push(contact.instagram);
    if (contact.linkedin) requiredValues.push(contact.linkedin);

    const missing = requiredValues.filter((value) => !html.includes(value));
    if (missing.length) failures.push(`${path}: ${missing.join(", ")}`);
  }

  if (failures.length) {
    const error = new Error(`HTML iletişim doğrulaması başarısız: ${failures.join(" | ")}`);
    error.statusCode = 500;
    throw error;
  }

  return true;
}

export function verifyIndexContact(html, contact) {
  const normalized = normalizeContact(contact);
  const phoneHref = escapeRegExp(escapeAttribute(normalized.phoneHref));
  const phoneText = escapeRegExp(escapeText(normalized.phone));
  const emailHref = escapeRegExp(escapeAttribute(normalized.emailHref));
  const emailText = escapeRegExp(escapeText(normalized.email));
  const visiblePhone = new RegExp(
    `<a(?=[^>]*data-contact-text="phone")(?=[^>]*href="${phoneHref}")[^>]*>${phoneText}<\\/a>`,
    "i",
  );
  const visibleEmail = new RegExp(
    `<a(?=[^>]*data-contact-text="email")(?=[^>]*href="${emailHref}")[^>]*>${emailText}<\\/a>`,
    "i",
  );

  PLACEHOLDER_PATTERN.lastIndex = 0;
  if (PLACEHOLDER_PATTERN.test(html)) {
    PLACEHOLDER_PATTERN.lastIndex = 0;
    const error = new Error('index.html içinde "güncelleniyor" placeholder değeri kaldı.');
    error.statusCode = 500;
    throw error;
  }
  PLACEHOLDER_PATTERN.lastIndex = 0;

  if (!visiblePhone.test(html) || !visibleEmail.test(html)) {
    const error = new Error("index.html içinde yeni telefon ve e-posta görünür alanlarda doğrulanamadı.");
    error.statusCode = 500;
    throw error;
  }

  return true;
}

export function updateContactBlock(html, contact) {
  const normalized = normalizeContact(contact);
  const block = contactBlock(normalized);
  const start = html.indexOf(CONTACT_START);
  const end = html.indexOf(CONTACT_END);

  if (start !== -1 && end !== -1 && end > start) {
    return applyContactToMarkup(
      `${html.slice(0, start)}${block}${html.slice(end + CONTACT_END.length)}`,
      normalized,
    );
  }

  return applyContactToMarkup(html.replace("</head>", `${block}
  </head>`), normalized);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
