const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const toggle = document.querySelector("[data-nav-toggle]");
const year = document.querySelector("[data-year]");
const chatbox = document.querySelector("[data-chatbox]");
const chatToggle = document.querySelector("[data-chat-toggle]");
const chatClose = document.querySelector("[data-chat-close]");
const phqRoot = document.querySelector("[data-phq]");
const mdqRoot = document.querySelector("[data-mdq]");
const gadRoot = document.querySelector("[data-gad]");
const contactDataElement = document.querySelector("#site-contact-data");

if (contactDataElement) {
  try {
    const contact = JSON.parse(contactDataElement.textContent);
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

    Object.entries(hrefs).forEach(([key, href]) => {
      document.querySelectorAll(`[data-contact-href="${key}"]`).forEach((element) => {
        if (href) element.setAttribute("href", href);
      });
    });

    Object.entries(texts).forEach(([key, text]) => {
      document.querySelectorAll(`[data-contact-text="${key}"]`).forEach((element) => {
        element.textContent = text;
      });
    });

    ["whatsapp", "instagram", "linkedin"].forEach((key) => {
      document.querySelectorAll(`[data-contact-visible="${key}"]`).forEach((element) => {
        element.hidden = !hrefs[key];
      });
    });
  } catch (error) {
    console.error("İletişim bilgileri okunamadı.", error);
  }
}

const syncHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 16);
};

year.textContent = new Date().getFullYear();
syncHeader();

window.addEventListener("scroll", syncHeader, { passive: true });

toggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  header.classList.toggle("is-open", isOpen);
  toggle.setAttribute("aria-expanded", String(isOpen));
  toggle.setAttribute("aria-label", isOpen ? "Menüyü kapat" : "Menüyü aç");
});

nav.addEventListener("click", (event) => {
  if (event.target.tagName !== "A") return;
  nav.classList.remove("is-open");
  header.classList.remove("is-open");
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", "Menüyü aç");
});

if (chatbox && chatToggle && chatClose) {
  const setChatOpen = (isOpen) => {
    chatbox.classList.toggle("is-open", isOpen);
    chatToggle.setAttribute("aria-expanded", String(isOpen));
    chatToggle.setAttribute("aria-label", isOpen ? "İletişim kutusunu kapat" : "İletişim kutusunu aç");
  };

  chatToggle.addEventListener("click", () => {
    setChatOpen(!chatbox.classList.contains("is-open"));
  });

  chatClose.addEventListener("click", () => setChatOpen(false));
}

if (phqRoot) {
  const questions = [
    "Bir şeylere karşı ilgi veya zevk kaybı",
    "Kendini çökkün, depresif veya umutsuz hissetme",
    "Uykuya dalmakta güçlük, uykuyu sürdürmede zorlanma veya çok fazla uyuma",
    "Yorgun hissetme veya enerjinin az olması",
    "İştahsızlık veya aşırı yeme",
    "Kendini kötü hissetme, başarısız ya da kendini/aileni hayal kırıklığına uğratmış gibi hissetme",
    "Gazete okumak veya televizyon izlemek gibi işlere odaklanmakta güçlük",
    "Başkalarının fark edebileceği kadar yavaş hareket etme/konuşma ya da huzursuz/kıpır kıpır olma",
    "Ölüm düşünceleri veya kendine zarar verme düşünceleri",
  ];
  const options = [
    { value: 0, label: "Hiç" },
    { value: 1, label: "Birkaç gün" },
    { value: 2, label: "Günlerin yarısından fazlasında" },
    { value: 3, label: "Hemen hemen her gün" },
  ];
  const questionsWrap = phqRoot.querySelector("[data-phq-questions]");
  const form = phqRoot.querySelector("[data-phq-form]");
  const scoreEl = phqRoot.querySelector("[data-phq-score]");
  const levelEl = phqRoot.querySelector("[data-phq-level]");
  const progressEl = phqRoot.querySelector("[data-phq-progress]");
  const alertEl = phqRoot.querySelector("[data-phq-alert]");

  const getLevel = (score) => {
    if (score <= 4) return "Minimal düzey";
    if (score <= 9) return "Hafif düzey";
    if (score <= 14) return "Orta düzey";
    if (score <= 19) return "Orta-ağır düzey";
    return "Ağır düzey";
  };

  questions.forEach((question, index) => {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "phq-question";

    const legend = document.createElement("legend");
    legend.textContent = `${index + 1}. ${question}`;
    fieldset.appendChild(legend);

    const optionWrap = document.createElement("div");
    optionWrap.className = "phq-options";

    options.forEach((option) => {
      const label = document.createElement("label");
      label.className = "phq-option";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = `phq-${index}`;
      input.value = String(option.value);

      const text = document.createElement("span");
      text.textContent = `${option.value} = ${option.label}`;

      label.append(input, text);
      optionWrap.appendChild(label);
    });

    fieldset.appendChild(optionWrap);
    questionsWrap.appendChild(fieldset);
  });

  form.addEventListener("change", () => {
    const selected = [...form.querySelectorAll("input:checked")];
    const total = selected.reduce((sum, input) => sum + Number(input.value), 0);
    const ninthAnswer = form.querySelector('input[name="phq-8"]:checked');

    scoreEl.textContent = String(total);
    levelEl.textContent = getLevel(total);
    progressEl.textContent = `9 sorudan ${selected.length} tanesi yanıtlandı.`;
    alertEl.hidden = !(ninthAnswer && Number(ninthAnswer.value) > 0);
  });
}

if (mdqRoot) {
  const mdqQuestions = [
    "Kendinizi normalden çok daha iyi, enerjik veya taşkın hissettiğiniz dönemler oldu mu?",
    "Normalden daha az uyuduğunuz halde kendinizi dinlenmiş hissettiğiniz dönemler oldu mu?",
    "Her zamankinden daha konuşkan olduğunuz dönemler oldu mu?",
    "Düşüncelerinizin çok hızlı aktığını hissettiğiniz dönemler oldu mu?",
    "Dikkatinizin kolayca dağıldığı dönemler oldu mu?",
    "Aynı anda birden fazla işe başladığınız dönemler oldu mu?",
    "Normalde yapmayacağınız kadar riskli davranışlar yaptığınız dönemler oldu mu?",
    "Kendinize olan güveninizin belirgin şekilde arttığı dönemler oldu mu?",
    "Sosyal olarak daha aktif, daha girişken olduğunuz dönemler oldu mu?",
    "Daha fazla sinirli veya tahammülsüz olduğunuz dönemler oldu mu?",
    "Daha üretken, daha hızlı çalıştığınız dönemler oldu mu?",
    "Normalden daha fazla hareketli olduğunuz dönemler oldu mu?",
    "Cinsel isteğinizin belirgin arttığı dönemler oldu mu?",
  ];
  const questionsWrap = mdqRoot.querySelector("[data-mdq-questions]");
  const form = mdqRoot.querySelector("[data-mdq-form]");
  const yesCountEl = mdqRoot.querySelector("[data-mdq-yes-count]");
  const summaryEl = mdqRoot.querySelector("[data-mdq-summary]");
  const progressEl = mdqRoot.querySelector("[data-mdq-progress]");

  mdqQuestions.forEach((question, index) => {
    const row = document.createElement("div");
    row.className = "mdq-question";

    const text = document.createElement("p");
    text.textContent = `${index + 1}. ${question}`;

    const optionsWrap = document.createElement("div");
    optionsWrap.className = "mdq-options";

    ["Evet", "Hayır"].forEach((labelText) => {
      const label = document.createElement("label");
      label.className = "phq-option";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = `mdq-${index}`;
      input.value = labelText === "Evet" ? "yes" : "no";

      const labelSpan = document.createElement("span");
      labelSpan.textContent = labelText;

      label.append(input, labelSpan);
      optionsWrap.appendChild(label);
    });

    row.append(text, optionsWrap);
    questionsWrap.appendChild(row);
  });

  form.addEventListener("change", () => {
    const symptomAnswers = [...form.querySelectorAll('input[name^="mdq-"]:checked')]
      .filter((input) => input.name !== "mdq-same-period" && input.name !== "mdq-impact");
    const yesCount = symptomAnswers.filter((input) => input.value === "yes").length;
    const samePeriod = form.querySelector('input[name="mdq-same-period"]:checked');
    const impact = form.querySelector('input[name="mdq-impact"]:checked');
    const criteriaMet = yesCount >= 7 && samePeriod?.value === "yes" && Number(impact?.value ?? 0) >= 2;

    yesCountEl.textContent = String(yesCount);
    progressEl.textContent = `13 belirtiden ${symptomAnswers.length} tanesi yanıtlandı.`;
    summaryEl.textContent = criteriaMet
      ? "Bipolar spektrum açısından klinik değerlendirme önerilir."
      : "Yanıtlar klinik görüşme ile birlikte değerlendirilmelidir.";
  });
}

if (gadRoot) {
  const gadQuestions = [
    "Kendinizi sinirli, kaygılı veya gergin hissetme",
    "Endişeyi durduramama veya kontrol edememe",
    "Farklı konular hakkında çok fazla endişelenme",
    "Gevşemekte zorlanma",
    "Yerinizde duramayacak kadar huzursuz olma",
    "Kolayca sinirlenme veya tahammülsüzleşme",
    "Sanki kötü bir şey olacakmış gibi korku hissetme",
  ];
  const options = [
    { value: 0, label: "Hiç" },
    { value: 1, label: "Birkaç gün" },
    { value: 2, label: "Günlerin yarısından fazlasında" },
    { value: 3, label: "Hemen hemen her gün" },
  ];
  const questionsWrap = gadRoot.querySelector("[data-gad-questions]");
  const form = gadRoot.querySelector("[data-gad-form]");
  const scoreEl = gadRoot.querySelector("[data-gad-score]");
  const levelEl = gadRoot.querySelector("[data-gad-level]");
  const progressEl = gadRoot.querySelector("[data-gad-progress]");
  const noteEl = gadRoot.querySelector("[data-gad-note]");

  const getGadLevel = (score) => {
    if (score <= 4) return "Minimal düzey";
    if (score <= 9) return "Hafif düzey";
    if (score <= 14) return "Orta düzey";
    return "Ağır düzey";
  };

  gadQuestions.forEach((question, index) => {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "phq-question";

    const legend = document.createElement("legend");
    legend.textContent = `${index + 1}. ${question}`;
    fieldset.appendChild(legend);

    const optionWrap = document.createElement("div");
    optionWrap.className = "phq-options";

    options.forEach((option) => {
      const label = document.createElement("label");
      label.className = "phq-option";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = `gad-${index}`;
      input.value = String(option.value);

      const text = document.createElement("span");
      text.textContent = `${option.value} = ${option.label}`;

      label.append(input, text);
      optionWrap.appendChild(label);
    });

    fieldset.appendChild(optionWrap);
    questionsWrap.appendChild(fieldset);
  });

  form.addEventListener("change", () => {
    const selected = [...form.querySelectorAll('input[name^="gad-"]:checked')]
      .filter((input) => input.name !== "gad-difficulty");
    const total = selected.reduce((sum, input) => sum + Number(input.value), 0);

    scoreEl.textContent = String(total);
    levelEl.textContent = getGadLevel(total);
    progressEl.textContent = `7 sorudan ${selected.length} tanesi yanıtlandı.`;
    noteEl.textContent = total >= 8
      ? "8 ve üzeri puanlarda daha ayrıntılı klinik değerlendirme önerilir."
      : "Sonuçlar klinik görüşme ve günlük yaşam etkisiyle birlikte değerlendirilmelidir.";
  });
}
