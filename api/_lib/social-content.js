const PROHIBITED_PATTERNS = [
  /kesin (?:tanı|tedavi|çözüm)/i,
  /garanti/i,
  /% ?100/i,
  /mucize/i,
  /(?:ilaç|doz|tedavi) öner/i,
  /(?:hemen|tamamen) iyileştir/i,
  /doktor(?:a)? gerek yok/i,
];

function validationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

export function normalizeSocialTitle(value) {
  const title = String(value ?? "").trim().replace(/\s+/g, " ").slice(0, 140);
  if (title.length < 3) throw validationError("Başlık en az 3 karakter olmalıdır.");
  if (PROHIBITED_PATTERNS.some((pattern) => pattern.test(title))) {
    throw validationError("Başlık kesin sonuç, garanti veya kişisel tedavi önerisi içeremez.");
  }
  return title;
}

function topicHashtag(title) {
  const normalized = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-zA-Z0-9çÇğĞöÖşŞüÜİ]+/g, "")
    .slice(0, 28);
  return normalized ? `#${normalized}` : "#RuhSagligi";
}

export function generateSocialDraft(value) {
  const title = normalizeSocialTitle(value);
  const hashtags = [
    topicHashtag(title),
    "#RuhSagligi",
    "#Psikiyatri",
    "#Psikoeğitim",
    "#BilimselBilgi",
  ];

  return {
    title,
    status: "draft",
    instagram: `${title} hakkında doğru bilgiye ulaşmak, belirtileri anlamlandırmak ve gerektiğinde profesyonel değerlendirmeye başvurmak önemlidir.\n\nHer kişinin yaşadığı süreç farklıdır. Bu paylaşım genel bilgilendirme amaçlıdır; tanı koymaz ve kişisel tedavi önerisi yerine geçmez.\n\n${hashtags.join(" ")}`,
    facebook: `${title}\n\nRuhsal belirtiler kişiden kişiye farklı biçimde görülebilir. Değerlendirme; kişinin öyküsü, yaşam koşulları, bedensel sağlığı ve belirtilerin günlük yaşama etkisi birlikte ele alınarak yapılır.\n\nBu içerik genel bilgilendirme amaçlıdır. Kesin tanı veya tedavi vaadi içermez; kişisel değerlendirme için bir ruh sağlığı uzmanına başvurulmalıdır.`,
    linkedin: `${title} konusunda bilimsel ve etik sağlık iletişimi, belirtileri genellemeden ve kişisel farklılıkları göz ardı etmeden bilgi sunmayı gerektirir.\n\nRuh sağlığı alanında tanı ve tedavi kararları yalnızca sosyal medya içeriklerine dayanarak verilemez. Klinik görüşme, kapsamlı değerlendirme ve gerektiğinde düzenli takip esastır.\n\nBu paylaşım mesleki bilgilendirme amaçlıdır; kişisel tıbbi öneri değildir.`,
    tiktok: `0-3 sn: Ekran başlığı: “${title}”\n3-10 sn: “Bu konuda tek bir belirtiyle kesin sonuca varılamaz.”\n10-20 sn: “Belirtilerin süresi, şiddeti ve günlük yaşama etkisi birlikte değerlendirilir.”\n20-28 sn: “İnternetteki bilgiler kişisel muayenenin yerini tutmaz.”\n28-35 sn: Kapanış: “Bilgi edinin, belirtiler yaşamınızı etkiliyorsa bir uzmana başvurun.”`,
    hashtags,
    visualSuggestion: `${title} temasını sakin ve güven veren bir görsel dille anlatan; insan yüzünü dramatize etmeyen, açık renkli, sade tipografili ve mahremiyeti koruyan bir bilgilendirme kartı. Görsel üzerinde en fazla bir kısa başlık ve “Genel bilgilendirme” ibaresi kullanılmalı.`,
    physicianNote: "Hekim kontrolü: Metindeki bilimsel doğruluk, güncel terminoloji, kapsam sınırları ve olası yanlış anlaşılmalar kontrol edilmelidir. İçerik tanı koymamalı, tedavi garantisi vermemeli, kişisel ilaç/doz önerisi içermemeli ve acil durumlarda profesyonel yardım gerekliliğini gölgelememelidir.",
    disclaimer: "Bu içerik genel bilgilendirme amaçlıdır; tanı veya kişisel tedavi önerisi değildir.",
  };
}

export function approveSocialDraft(input) {
  if (input?.physicianApproved !== true) {
    const error = new Error("Hekim onayı olmadan taslak onaylanamaz.");
    error.statusCode = 400;
    throw error;
  }
  return {
    ...generateSocialDraft(input.title),
    status: "physician-approved",
    approvedAt: new Date().toISOString(),
  };
}
