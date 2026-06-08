import { normalizeSocialTitle } from "./social-content.js";

function topicHashtag(title) {
  const normalized = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .slice(0, 28);
  return normalized ? `#${normalized}` : "#RuhSagligi";
}

export function generateContentKit(value) {
  const title = normalizeSocialTitle(value);
  const shortTitle = title.length > 72 ? `${title.slice(0, 69)}...` : title;
  const hashtags = [
    topicHashtag(title),
    "#RuhSagligi",
    "#Psikiyatri",
    "#Psikoeğitim",
    "#BilimselBilgi",
    "#PsikolojikİyiOluş",
    "#DidimPsikiyatri",
  ];
  const disclaimer = "Bu içerik genel bilgilendirme amaçlıdır; tanı koymaz ve kişisel tedavi önerisi yerine geçmez.";

  return {
    title,
    status: "draft",
    blog: `# ${title}

## Konuya genel bakış

${title}, ruh sağlığı alanında sık merak edilen başlıklardan biridir. Belirtiler ve yaşanan güçlükler her kişide aynı biçimde ortaya çıkmayabilir. Süre, şiddet, günlük yaşama etkisi, bedensel sağlık, yaşam koşulları ve kişinin öyküsü birlikte değerlendirilmelidir.

## Değerlendirme neden önemlidir?

Tek bir belirti veya internette karşılaşılan kısa bir bilgi kesin tanı için yeterli değildir. Psikiyatrik değerlendirme; yakınmaların ne zaman başladığını, hangi koşullarda arttığını, işlevselliği nasıl etkilediğini ve eşlik eden başka durumların bulunup bulunmadığını anlamayı amaçlar.

## Destek ve takip

Uygun yaklaşım kişiye göre değişir. Bilgilendirme, yaşam düzenlemeleri, psikoterapi seçenekleri, gerektiğinde ilaç tedavisi ve düzenli takip ancak kapsamlı değerlendirme sonrasında ele alınabilir. Kişisel tedavi planı bir ruh sağlığı uzmanıyla birlikte oluşturulmalıdır.

## Ne zaman profesyonel destek düşünülmeli?

Yakınmalar uzun sürüyor, belirgin sıkıntıya yol açıyor veya iş, okul, ilişkiler, uyku ve öz bakım gibi günlük yaşam alanlarını etkiliyorsa profesyonel değerlendirme yararlı olabilir. Acil risk veya kendine zarar verme düşüncesi varsa en yakın acil sağlık hizmetine başvurulmalıdır.

${disclaimer}`,
    instagram: `${title} hakkında tek bir belirtiyle kesin sonuca varılamaz. Belirtilerin süresi, şiddeti ve günlük yaşama etkisi birlikte değerlendirilmelidir.\n\nKişisel farklılıkları gözeten bilimsel bir değerlendirme, doğru destek seçeneklerini konuşmak için önemlidir.\n\n${disclaimer}\n\n${hashtags.join(" ")}`,
    facebook: `${title}\n\nRuhsal belirtiler kişiden kişiye farklılık gösterebilir. İnternetteki bilgiler farkındalık sağlayabilir; ancak tanı için kişinin öyküsü, belirtilerin seyri ve günlük yaşam üzerindeki etkisi birlikte değerlendirilmelidir.\n\nYakınmalar yaşam kalitesini veya işlevselliği etkiliyorsa bir ruh sağlığı uzmanından destek alınabilir.\n\n${disclaimer}`,
    linkedin: `${title} hakkında etik ve bilimsel iletişim, kişisel farklılıkları koruyan dengeli bir dil gerektirir.\n\nRuh sağlığı içerikleri farkındalık oluşturabilir; ancak klinik değerlendirme yerine geçmez. Tanı ve tedavi kararlarında kişinin öyküsü, belirtilerin işlevselliğe etkisi, bedensel sağlık ve izlem süreci birlikte ele alınmalıdır.\n\n${disclaimer}`,
    x: `${shortTitle}: Tek bir belirti kesin tanı için yeterli değildir. Süre, şiddet ve günlük yaşama etkisi birlikte değerlendirilir. Bilgilendirme kişisel muayenenin yerini tutmaz. #RuhSagligi #Psikiyatri`,
    video: `0-3 sn: Başlık: “${title}”\n3-8 sn: “Bu konuda tek bir belirtiyle kesin sonuca varılamaz.”\n8-16 sn: “Belirtilerin süresi, şiddeti ve günlük yaşam üzerindeki etkisi önemlidir.”\n16-24 sn: “İnternetteki bilgiler farkındalık sağlar; kişisel değerlendirme yerine geçmez.”\n24-32 sn: “Yakınmalar yaşamınızı etkiliyorsa bir ruh sağlığı uzmanına başvurabilirsiniz.”\n32-36 sn: Kapanış kartı: “Genel bilgilendirme”`,
    hashtags,
    visualSuggestion: `7 slaytlık sade bir carousel:
1. Kapak: “${title}”
2. Konuya kısa ve tarafsız giriş
3. Tek belirtiyle tanı konulamayacağı
4. Süre ve şiddetin önemi
5. Günlük işlevselliğe etkisi
6. Ne zaman profesyonel destek düşünülebileceği
7. “Genel bilgilendirme, kişisel öneri değildir” kapanışı

Renkler sakin ve erişilebilir olmalı; dramatik hasta fotoğrafları, korku dili ve sonuç garantisi kullanılmamalıdır.`,
    physicianNote: "Hekim kontrolü zorunludur: Bilimsel doğruluk, güncel terminoloji, kapsam, acil durum yönlendirmesi ve yanlış anlaşılma riski kontrol edilmelidir. Kişisel ilaç/doz önerisi, kesin tanı, tedavi garantisi veya yanıltıcı başarı vaadi bulunmamalıdır.",
    disclaimer,
  };
}

export function approveContentKit(input) {
  if (input?.physicianApproved !== true) {
    const error = new Error("Kopyalama veya indirme için hekim onayı gereklidir.");
    error.statusCode = 400;
    throw error;
  }
  return {
    ...generateContentKit(input.title),
    status: "physician-approved",
    approvedAt: new Date().toISOString(),
  };
}
