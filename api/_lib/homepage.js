export const HOME_START = "<!-- SITE_HOME_START -->";
export const HOME_END = "<!-- SITE_HOME_END -->";

export const DEFAULT_HOME = Object.freeze({
  eyebrow: "Erişkin psikiyatrisi",
  heroTitle: "Mahremiyeti önemseyen, bilimsel ve insani psikiyatrik destek.",
  heroDescription: "Ruhsal zorlanmaları anlamak, güvenli bir değerlendirme yapmak ve kişiye uygun bir tedavi planı oluşturmak için yapılandırılmış psikiyatri görüşmeleri.",
  appointmentButton: "Randevu Al",
  servicesButton: "Çalışma Alanları",
  approachTitle: "Önce anlamak, sonra birlikte yol haritası oluşturmak.",
  approachDescription: "Psikiyatrik değerlendirme; belirtileri, yaşam öyküsünü, ilişkileri, bedensel sağlığı ve mevcut koşulları birlikte ele alır. Görüşmelerde tanı, tedavi seçenekleri, ilaç kullanımı, psikoterapi ihtiyacı ve takip planı açık ve anlaşılır biçimde değerlendirilir.",
  processTitle: "Net, sakin ve takip edilebilir bir süreç.",
  processDescription: "İlk değerlendirmeden düzenli takibe kadar süreç açık, anlaşılır ve kişiye özel biçimde planlanır.",
});

const LIMITS = {
  eyebrow: 80,
  heroTitle: 180,
  heroDescription: 420,
  appointmentButton: 50,
  servicesButton: 50,
  approachTitle: 180,
  approachDescription: 800,
  processTitle: 180,
  processDescription: 600,
};

function validationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function clean(value, key) {
  const text = String(value ?? "").trim().replace(/\s+/g, " ");
  if (!text) throw validationError(`${key} alanı boş bırakılamaz.`);
  return text.slice(0, LIMITS[key]);
}

export function normalizeHome(input) {
  return Object.fromEntries(
    Object.keys(DEFAULT_HOME).map((key) => [key, clean(input[key], key)]),
  );
}

export function homeBlock(content) {
  return `${HOME_START}
    <script type="application/json" id="site-home-data">${JSON.stringify(content).replaceAll("<", "\\u003c")}</script>
    ${HOME_END}`;
}

export function extractHome(html) {
  const start = html.indexOf(HOME_START);
  const end = html.indexOf(HOME_END);
  if (start === -1 || end === -1 || end <= start) return normalizeHome(DEFAULT_HOME);

  const block = html.slice(start, end);
  const match = block.match(/<script type="application\/json" id="site-home-data">([\s\S]*?)<\/script>/);
  if (!match) throw validationError("Ana sayfa içerik bloğu okunamadı.");

  try {
    return normalizeHome(JSON.parse(match[1]));
  } catch (error) {
    if (error.statusCode) throw error;
    throw validationError("Ana sayfa içerik verisi geçersiz.");
  }
}

function escapeText(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value) {
  return escapeText(value).replaceAll('"', "&quot;");
}

function replaceText(html, key, value) {
  const pattern = new RegExp(
    `(<([a-z0-9-]+)[^>]*data-home-text="${key}"[^>]*>)([\\s\\S]*?)(<\\/\\2>)`,
    "gi",
  );
  return html.replace(pattern, (full, opening, tag, current, closing) => (
    `${opening}${escapeText(value)}${closing}`
  ));
}

function replaceMeta(html, selector, value) {
  const pattern = new RegExp(`(<meta\\s+${selector}\\s+content=")[^"]*(")`, "i");
  return html.replace(pattern, (full, opening, closing) => (
    `${opening}${escapeAttribute(value)}${closing}`
  ));
}

function updateStructuredData(html, content, seoTitle) {
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
        if (!types.includes("WebPage")) continue;
        item.name = seoTitle;
        item.description = content.heroDescription;
        changed = true;
      }
      return changed
        ? `<script type="application/ld+json">${JSON.stringify(data).replaceAll("<", "\\u003c")}</script>`
        : full;
    },
  );
}

export function updateHomePage(html, input) {
  const content = normalizeHome(input);
  const block = homeBlock(content);
  const start = html.indexOf(HOME_START);
  const end = html.indexOf(HOME_END);
  let next;

  if (start !== -1 && end !== -1 && end > start) {
    next = `${html.slice(0, start)}${block}${html.slice(end + HOME_END.length)}`;
  } else {
    next = html.replace("</head>", `${block}\n  </head>`);
  }

  for (const [key, value] of Object.entries(content)) {
    next = replaceText(next, key, value);
  }

  const seoTitle = `${content.heroTitle} | Uzm. Dr. Özgür Özbebit`;
  next = next.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeText(seoTitle)}</title>`);
  next = replaceMeta(next, 'name="description"', content.heroDescription);
  next = replaceMeta(next, 'property="og:title"', seoTitle);
  next = replaceMeta(next, 'property="og:description"', content.heroDescription);
  next = replaceMeta(next, 'name="twitter:title"', seoTitle);
  next = replaceMeta(next, 'name="twitter:description"', content.heroDescription);
  return updateStructuredData(next, content, seoTitle);
}

export function verifyHomePage(html, input) {
  const content = normalizeHome(input);
  const required = [
    homeBlock(content),
    `<title>${escapeText(`${content.heroTitle} | Uzm. Dr. Özgür Özbebit`)}</title>`,
    `name="description" content="${escapeAttribute(content.heroDescription)}"`,
    `property="og:description" content="${escapeAttribute(content.heroDescription)}"`,
    `data-home-text="heroTitle">${escapeText(content.heroTitle)}</h1>`,
    `data-home-text="heroDescription">${escapeText(content.heroDescription)}</p>`,
    `data-home-text="eyebrow">${escapeText(content.eyebrow)}</p>`,
    `data-home-text="appointmentButton">${escapeText(content.appointmentButton)}</a>`,
    `data-home-text="servicesButton">${escapeText(content.servicesButton)}</a>`,
    `data-home-text="approachTitle">${escapeText(content.approachTitle)}</h2>`,
    `data-home-text="approachDescription">${escapeText(content.approachDescription)}</p>`,
    `data-home-text="processTitle">${escapeText(content.processTitle)}</h2>`,
    `data-home-text="processDescription">${escapeText(content.processDescription)}</p>`,
  ];
  const missing = required.filter((value) => !html.includes(value));
  if (missing.length) {
    const error = new Error(`Ana sayfa içeriği committe doğrulanamadı: ${missing.join(", ")}`);
    error.statusCode = 500;
    throw error;
  }
  return true;
}
