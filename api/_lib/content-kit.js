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

function slugify(title) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function buildLinkedInArticle(title, disclaimer) {
  const sections = [
    `Giriş\n\n${title}, ruh sağlığı iletişiminde hem bilimsel doğruluk hem de anlaşılır dil gerektiren bir konudur. İnsanlar çoğu zaman yaşadıkları belirtileri anlamlandırmak, neyin olağan bir zorlanma olduğunu ve ne zaman profesyonel destek düşünmeleri gerektiğini öğrenmek ister. Bu merak son derece anlaşılırdır. Bununla birlikte kısa paylaşımlar, kontrol listeleri veya tek bir belirti üzerinden kesin sonuca varmak doğru değildir. Sağlıklı bir çerçeve; kişinin öyküsünü, belirtilerin süresini, şiddetini, günlük yaşama etkisini ve eşlik eden koşulları birlikte ele alır.`,
    `Gelişme: Belirti ile tanı arasındaki fark\n\nBir belirtinin varlığı tek başına psikiyatrik tanı anlamına gelmez. Uyku değişikliği, dikkat güçlüğü, kaygı, isteksizlik veya bedensel yakınmalar farklı yaşam dönemlerinde ve farklı nedenlerle görülebilir. Klinik değerlendirme, belirtileri yalnızca saymak yerine bunların ne zaman başladığını, hangi durumlarda arttığını, kişinin işlevselliğini nasıl etkilediğini ve zaman içindeki seyrini anlamaya çalışır. Bedensel hastalıklar, kullanılan ilaçlar, madde kullanımı, yaşam olayları ve sosyal destek sistemi de değerlendirmeye dahil edilir.`,
    `Gelişme: İşlevselliği birlikte değerlendirmek\n\nRuh sağlığında önemli göstergelerden biri işlevselliktir. Kişi işini veya eğitimini sürdürebiliyor mu, ilişkilerinde belirgin bir zorlanma yaşıyor mu, uyku ve öz bakım düzeni nasıl, daha önce keyif aldığı etkinliklerden uzaklaşıyor mu? Bu sorular tanı koymak için tek başına yeterli değildir; ancak yaşanan güçlüğün kapsamını anlamaya yardım eder. Aynı belirti iki kişide farklı sonuçlar doğurabilir. Bu nedenle kişiselleştirilmiş değerlendirme, genelleyici internet içeriklerinden daha güvenilir bir yol sunar.`,
    `Gelişme: Bilimsel bilginin sınırları\n\nBilimsel içerik, olasılıkları ve genel ilkeleri açıklayabilir; kişisel muayenenin yerini tutamaz. Araştırmalarda gruplar üzerinden elde edilen sonuçlar, her birey için aynı biçimde geçerli olmayabilir. Yaş, eşlik eden hastalıklar, önceki tedavi deneyimleri, gebelik durumu, aile öyküsü ve kişinin tercihleri karar sürecini etkileyebilir. Bu nedenle sağlık iletişiminde kesinlik bildiren ifadelerden, hızlı çözüm vaatlerinden ve herkese uyan tek bir yöntem varmış izlenimi oluşturmaktan kaçınmak gerekir.`,
    `Gelişme: Destek seçenekleri nasıl ele alınır?\n\nUygun destek planı değerlendirme sonrasında belirlenir. Psikoeğitim, günlük yaşam düzenlemeleri, psikoterapi yaklaşımları, sosyal desteklerin güçlendirilmesi, gerektiğinde ilaç tedavisi ve düzenli takip seçenekleri birlikte konuşulabilir. Her seçeneğin amacı, olası yararı, sınırlılıkları ve izlem gereksinimi vardır. Tedavi kararı kişinin ihtiyaçları ve tercihleri gözetilerek, hekim ile danışan arasında ortaklaşa verilmelidir. Kişisel ilaç veya doz önerileri genel içerik üzerinden yapılmamalıdır.`,
    `Gelişme: Takibin önemi\n\nRuh sağlığı desteği tek görüşmelik bir sonuçtan ibaret değildir. Belirtilerin değişimi, işlevsellik, yan etkiler, uyum, yaşam olayları ve hedefler zaman içinde yeniden değerlendirilir. Düzenli takip, işe yarayan noktaları güçlendirmeyi ve gerektiğinde planı güncellemeyi sağlar. İyileşme her zaman doğrusal ilerlemeyebilir; dönemsel dalgalanmalar görülebilir. Bu dalgalanmaları başarısızlık olarak yorumlamak yerine, izlem sürecinin bir parçası olarak ele almak daha gerçekçi ve destekleyicidir.`,
    `Gelişme: Damgalayıcı dilden kaçınmak\n\nKullanılan dil, yardım arama davranışını doğrudan etkileyebilir. Kişiyi tanısıyla özdeşleştiren, suçlayan veya irade eksikliği ima eden ifadeler ruh sağlığı damgalamasını artırır. Bunun yerine kişinin yaşadığı güçlüğü tanımlayan, değişimin mümkün olduğunu ancak kişiden kişiye farklı ilerlediğini kabul eden bir dil tercih edilmelidir. Yakınların yaklaşımı da önemlidir: dinlemek, yargılamamak, sınırları korumak ve profesyonel desteğe erişimi kolaylaştırmak çoğu zaman hazır nasihatlerden daha yararlıdır.`,
    `Gelişme: Yakınlar nasıl destek olabilir?\n\nYakınların görevi tanı koymak veya tedaviyi yönetmek değildir. Sakin biçimde dinlemek, kişinin yaşadıklarını küçümsememek ve yardım arama sürecinde pratik destek sunmak daha uygundur. “Bunu kafana takma” ya da “biraz güçlü ol” gibi iyi niyetli ifadeler, kişinin anlaşılmadığını hissetmesine yol açabilir. Bunun yerine “Seni dinliyorum”, “Bu durum günlük yaşamını nasıl etkiliyor?” ve “İstersen uygun desteği birlikte araştırabiliriz” gibi açık uçlu cümleler kullanılabilir. Aynı zamanda yakınların kendi sınırlarını ve iyilik hâlini koruması da önemlidir. Destek olmak, bütün sorumluluğu tek başına üstlenmek anlamına gelmez.`,
    `Gelişme: Dijital içerikleri değerlendirirken\n\nRuh sağlığı alanında çok sayıda video, kontrol listesi ve kişisel deneyim paylaşımı bulunmaktadır. Bir içeriği değerlendirirken kaynağın kim olduğu, bilginin hangi tarihte yayımlandığı, bilimsel kaynak gösterilip gösterilmediği ve kişisel deneyimin genellenip genellenmediği sorgulanmalıdır. “Herkeste işe yarar”, “kesin çözüm” veya “şu belirti varsa mutlaka bu tanı vardır” gibi ifadeler güvenilir sağlık iletişimiyle uyumlu değildir. Nitelikli içerik kendi sınırını açıklar, belirsizliği saklamaz ve gerektiğinde profesyonel değerlendirmeye yönlendirir. Sosyal medya algoritmalarının dikkat çekici ve keskin iddiaları öne çıkarabildiği de unutulmamalıdır.`,
    `Gelişme: Ne zaman profesyonel destek düşünülmeli?\n\nBelirtiler uzun sürüyor, giderek artıyor veya iş, okul, ilişkiler, uyku, beslenme ve öz bakım gibi alanları etkiliyorsa profesyonel değerlendirme düşünülebilir. Kişinin kendine zarar verme düşüncesi, gerçeklikle değerlendirmede belirgin bozulma, ağır ajitasyon, ciddi madde kullanımı ya da güvenliği tehdit eden başka bir durum varsa rutin randevu beklenmemeli; en yakın acil sağlık hizmetine başvurulmalıdır. Acil durum bilgisi, bilgilendirici içeriklerde açık ve görünür biçimde yer almalıdır.`,
    `Sonuç\n\n${title} hakkında güvenilir bilgi sunmanın amacı, insanları kendi kendine tanı koymaya yöneltmek değil; belirtileri daha doğru gözlemlemelerine, yanlış bilgiden korunmalarına ve gerektiğinde uygun desteğe ulaşmalarına yardımcı olmaktır. Bilimsel doğruluk, kişisel farklılıklara saygı, anlaşılır dil ve açık sınırlar birlikte korunmalıdır. Sağlık profesyonelleri için iyi içerik üretimi de bu nedenle yayın öncesi kaynak kontrolü, güncel terminoloji ve etik değerlendirme gerektirir.`,
    `Kaynak önerileri\n\n- T.C. Sağlık Bakanlığı ve bağlı resmi sağlık kuruluşlarının güncel bilgilendirmeleri\n- Dünya Sağlık Örgütü ruh sağlığı bilgi sayfaları\n- Ulusal ve uluslararası psikiyatri meslek örgütlerinin hasta bilgilendirme kaynakları\n- Hakemli dergilerde yayımlanan güncel sistematik derlemeler ve klinik kılavuzlar\n- Acil durumlar için yerel sağlık hizmetlerinin resmi yönlendirmeleri\n\n${disclaimer}`,
  ];
  return sections.join("\n\n");
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
  const linkedinArticle = buildLinkedInArticle(title, disclaimer);
  const slug = slugify(title);
  const keywords = [title, "ruh sağlığı", "psikiyatri", "psikoeğitim", "Didim psikiyatri"];
  const carousel = `Kapak: ${title}

Slayt 1: Bu konu neden önemlidir?
Yaşanan güçlüğü anlamak, doğru bilgiye ulaşmanın ilk adımıdır.

Slayt 2: Tek belirti yeterli değildir
Bir belirti tek başına tanı koydurmaz; süre, şiddet ve bağlam birlikte değerlendirilir.

Slayt 3: Günlük yaşama etkisi
İş, okul, ilişkiler, uyku ve öz bakım alanlarındaki değişimler önemlidir.

Slayt 4: Kişisel farklılıklar
Aynı yakınma farklı kişilerde farklı nedenlerle ve farklı yoğunlukta görülebilir.

Slayt 5: Bilgi ile değerlendirme aynı şey değildir
İnternet içerikleri farkındalık sağlar; kişisel psikiyatrik değerlendirmenin yerini tutmaz.

Slayt 6: Destek seçenekleri
Psikoeğitim, psikoterapi, yaşam düzenlemeleri ve gerektiğinde tıbbi takip kişiye göre ele alınır.

Slayt 7: Ne zaman başvurmalı?
Yakınmalar uzun sürüyor veya işlevselliği etkiliyorsa profesyonel destek düşünülebilir.

Son CTA slaytı: Sorularınızı not alın ve değerlendirme sırasında hekiminizle paylaşın.
${disclaimer}`;
  const xFlood = [
    `1/8 ${shortTitle}: Bu başlıkta tek bir belirtiyle kesin sonuca varılamaz.`,
    "2/8 Belirtilerin ne kadar süredir devam ettiği, ne kadar yoğun olduğu ve günlük yaşamı nasıl etkilediği birlikte değerlendirilir.",
    "3/8 Uyku, dikkat, kaygı veya isteksizlik gibi yakınmalar farklı nedenlerle ortaya çıkabilir. Bağlam önemlidir.",
    "4/8 İnternetteki kontrol listeleri farkındalık sağlayabilir; klinik görüşme ve kişisel öykünün yerini tutmaz.",
    "5/8 Uygun destek herkeste aynı değildir. Psikoeğitim, psikoterapi, yaşam düzenlemeleri ve tıbbi takip kişiye göre planlanır.",
    "6/8 Ruh sağlığı desteğinde takip önemlidir. Belirtiler, işlevsellik, hedefler ve olası yan etkiler zaman içinde yeniden değerlendirilir.",
    "7/8 Yakınmalar iş, okul, ilişkiler veya öz bakımı belirgin biçimde etkiliyorsa profesyonel değerlendirme düşünülebilir.",
    `8/8 ${disclaimer} #RuhSagligi #Psikiyatri`,
  ].join("\n\n");
  const facebookLong = `${title} hakkında konuşurken bazen küçük bir günlük yaşam sahnesi çok şey anlatır.

Bir sabah alarm çalar; kişi yataktan kalkmakta zorlanır. Başka bir gün toplantıda dikkatini toplamak güçleşir ya da gece zihnindeki düşünceler nedeniyle uykuya dalamaz. Bu deneyimlerin her biri gerçek ve önemlidir, ancak tek başına kesin bir tanı anlamına gelmez.

Ruhsal belirtileri anlamak için yalnızca “var mı, yok mu?” diye bakmak yetmez. Ne zamandır sürdüğü, ne kadar yoğun olduğu, hangi koşullarda arttığı ve günlük yaşamı nasıl etkilediği önemlidir. Bazen yaşam olayları, bedensel sağlık sorunları, kullanılan ilaçlar veya uyku düzenindeki değişiklikler benzer yakınmalara yol açabilir.

Kendinizde ya da bir yakınınızda bu tür değişimler fark ettiğinizde hemen etiket koymak yerine gözlem yapmak yararlı olabilir. Sorularınızı not edebilir, belirtilerin seyrini takip edebilir ve yaşam kalitesini etkileyen bir durum varsa bir ruh sağlığı uzmanıyla görüşebilirsiniz.

Destek istemek güçsüzlük değildir. Amaç hızlı bir etiket bulmak değil; yaşananları bütüncül biçimde anlamak ve kişiye uygun seçenekleri birlikte değerlendirmektir.

${disclaimer}`;
  const videoScripts = `60 SANİYELİK KONUŞMA METNİ

“Bugün ${title} hakkında konuşalım. Bu konuda en önemli nokta, tek bir belirtiyle kesin sonuca varılamayacağıdır. Belirtilerin süresi, şiddeti ve günlük yaşama etkisi birlikte değerlendirilir. İnternetteki bilgiler farkındalık sağlayabilir ancak kişisel psikiyatrik değerlendirmenin yerini tutmaz. Yakınmalar işinizi, ilişkilerinizi, uykunuzu veya öz bakımınızı etkiliyorsa bir ruh sağlığı uzmanından destek alabilirsiniz. Bu içerik genel bilgilendirme amaçlıdır.”

3 DAKİKALIK KONUŞMA METNİ

“${title}, birçok kişinin merak ettiği bir başlık. Öncelikle şunu ayıralım: Bir belirti yaşamak ile psikiyatrik tanı almak aynı şey değildir. Değerlendirmede belirtilerin ne zaman başladığı, hangi koşullarda arttığı, ne kadar sürdüğü ve işlevselliği nasıl etkilediği ele alınır.

Uyku, dikkat, kaygı, enerji ve istek düzeyindeki değişimler farklı nedenlerle ortaya çıkabilir. Bedensel sağlık, kullanılan ilaçlar, yaşam olayları ve sosyal koşullar da önemlidir. Bu nedenle kısa testler veya sosyal medya paylaşımları kesin tanı aracı değildir.

Uygun destek kişiye göre değişir. Psikoeğitim, psikoterapi, yaşam düzenlemeleri, gerektiğinde ilaç tedavisi ve düzenli takip seçenekleri ancak kişisel değerlendirme sonrasında konuşulabilir. Yakınmalar günlük yaşamınızı etkiliyorsa profesyonel destek düşünebilirsiniz. Acil risk varsa en yakın acil sağlık hizmetine başvurulmalıdır. Bu içerik kişisel tedavi önerisi değildir.”

10 DAKİKALIK KONUŞMA METNİ

“Bu uzun bölümde ${title} konusunu belirtiler, günlük işlevsellik, bilimsel bilginin sınırları, destek seçenekleri ve profesyonel başvuru zamanlaması açısından ele alacağız. Amacımız kişisel tanı koymak değil; güvenilir bir değerlendirme çerçevesi sunmak.”

${linkedinArticle}

“Özetle, ruh sağlığıyla ilgili belirtiler tek başına değil, kişinin yaşam koşulları ve öyküsü içinde değerlendirilmelidir. Sorularınızı not etmek ve kişisel durumunuzu bir ruh sağlığı uzmanıyla paylaşmak en güvenilir yoldur.”`;
  const podcast = `GİRİŞ MÜZİĞİ ANONSU

[Yumuşak, kısa giriş müziği]
“Ruh sağlığına bilimsel, sade ve yargılamayan bir dille yaklaştığımız programa hoş geldiniz. Bugünkü konumuz: ${title}.”

ANA İÇERİK

“Bu bölümde bir belirti üzerinden kesin tanıya gitmeden, konuyu nasıl daha güvenli değerlendirebileceğimizi konuşacağız. Belirtilerin süresi, şiddeti, ortaya çıktığı koşullar ve günlük yaşam üzerindeki etkisi önemlidir. Kişisel öykü, bedensel sağlık, kullanılan ilaçlar ve yaşam olayları değerlendirmeye dahil edilir.

İnternette karşılaşılan bilgiler farkındalık sağlayabilir; ancak herkes için geçerli tek bir açıklama veya çözüm yoktur. Uygun destek seçenekleri kişisel değerlendirme sonrasında, kişinin ihtiyaçları ve tercihleri gözetilerek konuşulur. Düzenli takip de değişimi anlamanın ve planı gerektiğinde güncellemenin önemli bir parçasıdır.

Yakınmalar uzun sürüyor ya da iş, okul, ilişkiler, uyku ve öz bakım alanlarını etkiliyorsa profesyonel değerlendirme düşünülebilir. Acil risk veya kendine zarar verme düşüncesi varsa en yakın acil sağlık hizmetine başvurulmalıdır.”

KAPANIŞ

“Dinlediğiniz için teşekkür ederiz. Bir sonraki bölümde görüşmek üzere. ${disclaimer}”
[Kısa kapanış müziği]`;
  const faq = Array.from({ length: 10 }, (_, index) => {
    const questions = [
      `${title} tek bir belirtiyle anlaşılır mı?`,
      "Belirtilerin süresi neden önemlidir?",
      "İnternetteki testler tanı koyar mı?",
      "Günlük işlevsellik nasıl değerlendirilir?",
      "Bedensel hastalıklar benzer belirtiler yapabilir mi?",
      "Profesyonel destek ne zaman düşünülmeli?",
      "Tedavi seçenekleri herkeste aynı mıdır?",
      "İlaç tedavisi her durumda gerekir mi?",
      "Takip görüşmeleri neden önemlidir?",
      "Acil durumda ne yapılmalıdır?",
    ];
    const answers = [
      "Hayır. Süre, şiddet, bağlam, kişisel öykü ve işlevsellik birlikte değerlendirilir.",
      "Geçici zorlanmalar ile kalıcı veya tekrarlayan güçlükleri ayırt etmeye yardımcı olur.",
      "Hayır. Tarama araçları farkındalık sağlayabilir; klinik değerlendirmenin yerini tutmaz.",
      "İş, okul, ilişkiler, uyku, öz bakım ve günlük sorumluluklardaki değişimler ele alınır.",
      "Evet. Bu nedenle gerektiğinde bedensel nedenler ve kullanılan ilaçlar da gözden geçirilir.",
      "Yakınmalar uzun sürüyor, artıyor veya yaşam kalitesini etkiliyorsa değerlendirme yararlı olabilir.",
      "Hayır. Plan kişinin ihtiyaçlarına, öyküsüne, tercihlerine ve klinik değerlendirmeye göre belirlenir.",
      "Hayır. İlaç gereksinimi ancak hekim değerlendirmesiyle ve kişisel koşullar dikkate alınarak belirlenir.",
      "Belirtileri, işlevselliği, hedefleri ve olası yan etkileri zaman içinde değerlendirmeyi sağlar.",
      "Kendine zarar verme düşüncesi veya güvenliği tehdit eden bir durum varsa en yakın acil sağlık hizmetine başvurulmalıdır.",
    ];
    return `${index + 1}. ${questions[index]}\n${answers[index]}`;
  }).join("\n\n");
  const brochure = `HASTA BİLGİLENDİRME BROŞÜRÜ — A4

${title}

BU KONU HAKKINDA
- Belirtiler kişiden kişiye farklılık gösterebilir.
- Tek bir belirti kesin tanı için yeterli değildir.
- Süre, şiddet, bağlam ve günlük yaşama etki birlikte değerlendirilir.

DEĞERLENDİRMEDE NELER ELE ALINIR?
- Kişisel ve aile öyküsü
- Uyku, iştah, enerji ve dikkat değişimleri
- İş, okul, ilişkiler ve öz bakım
- Bedensel sağlık ve kullanılan ilaçlar
- Yaşam olayları ve sosyal destekler

DESTEK SEÇENEKLERİ
- Psikoeğitim
- Yaşam düzenlemeleri
- Psikoterapi seçenekleri
- Gerektiğinde ilaç tedavisi
- Düzenli psikiyatrik takip

NE ZAMAN BAŞVURMALI?
- Yakınmalar uzun sürüyorsa
- Günlük yaşam belirgin biçimde etkileniyorsa
- Belirtiler giderek artıyorsa
- Güvenlikle ilgili bir risk varsa acil sağlık hizmetine başvurun

${disclaimer}`;
  const contentCalendar = `7 GÜNLÜK İÇERİK TAKVİMİ — ${title}

1. Gün — Blog: Konuya genel bakış ve temel kavramlar
2. Gün — Instagram: Tek belirtiyle tanı konulamayacağını anlatan kısa gönderi
3. Gün — Carousel: Süre, şiddet, bağlam ve işlevsellik için 7 slayt
4. Gün — X Flood: Konuyu sekiz kısa bilimsel mesajla açıklayan zincir
5. Gün — Video: 60 saniyelik “en sık yanlış anlaşılan nokta” anlatımı
6. Gün — SSS: Takipçilerden gelen 10 temel soruya kısa cevap
7. Gün — LinkedIn/Facebook: Profesyonel değerlendirme ve destek seçeneklerini anlatan uzun içerik

Her paylaşımda genel bilgilendirme uyarısı ve gerektiğinde profesyonel destek yönlendirmesi bulunmalıdır.`;
  const blog = `# ${title}

## Konuya genel bakış

${title}, ruh sağlığı alanında sık merak edilen başlıklardan biridir. Belirtiler ve yaşanan güçlükler her kişide aynı biçimde ortaya çıkmayabilir. Süre, şiddet, günlük yaşama etkisi, bedensel sağlık, yaşam koşulları ve kişinin öyküsü birlikte değerlendirilmelidir.

## Değerlendirme neden önemlidir?

Tek bir belirti veya internette karşılaşılan kısa bir bilgi kesin tanı için yeterli değildir. Psikiyatrik değerlendirme; yakınmaların ne zaman başladığını, hangi koşullarda arttığını, işlevselliği nasıl etkilediğini ve eşlik eden başka durumların bulunup bulunmadığını anlamayı amaçlar.

## Destek ve takip

Uygun yaklaşım kişiye göre değişir. Bilgilendirme, yaşam düzenlemeleri, psikoterapi seçenekleri, gerektiğinde ilaç tedavisi ve düzenli takip ancak kapsamlı değerlendirme sonrasında ele alınabilir. Kişisel tedavi planı bir ruh sağlığı uzmanıyla birlikte oluşturulmalıdır.

## Ne zaman profesyonel destek düşünülmeli?

Yakınmalar uzun sürüyor, belirgin sıkıntıya yol açıyor veya iş, okul, ilişkiler, uyku ve öz bakım gibi günlük yaşam alanlarını etkiliyorsa profesyonel değerlendirme yararlı olabilir. Acil risk veya kendine zarar verme düşüncesi varsa en yakın acil sağlık hizmetine başvurulmalıdır.

${disclaimer}`;

  return {
    title,
    status: "draft",
    blog,
    instagram: `${title} hakkında tek bir belirtiyle kesin sonuca varılamaz. Belirtilerin süresi, şiddeti ve günlük yaşama etkisi birlikte değerlendirilmelidir.\n\nKişisel farklılıkları gözeten bilimsel bir değerlendirme, doğru destek seçeneklerini konuşmak için önemlidir.\n\n${disclaimer}\n\n${hashtags.join(" ")}`,
    facebook: `${title}\n\nRuhsal belirtiler kişiden kişiye farklılık gösterebilir. İnternetteki bilgiler farkındalık sağlayabilir; ancak tanı için kişinin öyküsü, belirtilerin seyri ve günlük yaşam üzerindeki etkisi birlikte değerlendirilmelidir.\n\nYakınmalar yaşam kalitesini veya işlevselliği etkiliyorsa bir ruh sağlığı uzmanından destek alınabilir.\n\n${disclaimer}`,
    facebookLong,
    linkedin: `${title} hakkında etik ve bilimsel iletişim, kişisel farklılıkları koruyan dengeli bir dil gerektirir.\n\nRuh sağlığı içerikleri farkındalık oluşturabilir; ancak klinik değerlendirme yerine geçmez. Tanı ve tedavi kararlarında kişinin öyküsü, belirtilerin işlevselliğe etkisi, bedensel sağlık ve izlem süreci birlikte ele alınmalıdır.\n\n${disclaimer}`,
    linkedinArticle,
    x: `${shortTitle}: Tek bir belirti kesin tanı için yeterli değildir. Süre, şiddet ve günlük yaşama etkisi birlikte değerlendirilir. Bilgilendirme kişisel muayenenin yerini tutmaz. #RuhSagligi #Psikiyatri`,
    xFlood,
    video: `0-3 sn: Başlık: “${title}”\n3-8 sn: “Bu konuda tek bir belirtiyle kesin sonuca varılamaz.”\n8-16 sn: “Belirtilerin süresi, şiddeti ve günlük yaşam üzerindeki etkisi önemlidir.”\n16-24 sn: “İnternetteki bilgiler farkındalık sağlar; kişisel değerlendirme yerine geçmez.”\n24-32 sn: “Yakınmalar yaşamınızı etkiliyorsa bir ruh sağlığı uzmanına başvurabilirsiniz.”\n32-36 sn: Kapanış kartı: “Genel bilgilendirme”`,
    videoScripts,
    carousel,
    podcast,
    faq,
    brochure,
    contentCalendar,
    blogSeoPackage: `SEO BAŞLIK\n${title} | Psikiyatrik Bilgilendirme\n\nMETA DESCRIPTION\n${title} hakkında belirtiler, değerlendirme, destek seçenekleri ve ne zaman profesyonel yardım düşünülebileceğine ilişkin bilimsel bilgilendirme.\n\nURL SLUG\n/${slug}\n\nANAHTAR KELİMELER\n${keywords.join(", ")}\n\nBLOG İÇERİĞİ\n${blog}`,
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
