const loginPanel = document.querySelector("[data-login-panel]");
const loginForm = document.querySelector("[data-login-form]");
const contentEntry = document.querySelector("[data-content-entry]");
const contentLinks = document.querySelectorAll('a[href="/admin/content/"]');
const editor = document.querySelector("[data-editor]");
const contactForm = document.querySelector("[data-contact-form]");
const logoutButton = document.querySelector("[data-logout]");
const statusElement = document.querySelector("[data-status]");
const previewButton = document.querySelector("[data-preview-button]");
const publishBox = document.querySelector("[data-publish-box]");
const publishButton = document.querySelector("[data-publish]");
const confirmCheckbox = document.querySelector("[data-confirm]");
const affectedFiles = document.querySelector("[data-affected-files]");
const previewSummary = document.querySelector("[data-preview-summary]");
const publishResult = document.querySelector("[data-publish-result]");
const resultSha = document.querySelector("[data-result-sha]");
const resultCount = document.querySelector("[data-result-count]");
const resultFiles = document.querySelector("[data-result-files]");
const resultCommitLink = document.querySelector("[data-result-commit-link]");
const resultVercelLink = document.querySelector("[data-result-vercel-link]");
const resultProductionLink = document.querySelector("[data-result-production-link]");
const homeEditor = document.querySelector("[data-home-editor]");
const homeForm = document.querySelector("[data-home-form]");
const homeStatus = document.querySelector("[data-home-status]");
const homePreviewButton = document.querySelector("[data-home-preview-button]");
const homePublishBox = document.querySelector("[data-home-publish-box]");
const homePublishButton = document.querySelector("[data-home-publish]");
const homeConfirmCheckbox = document.querySelector("[data-home-confirm]");
const homePreviewSummary = document.querySelector("[data-home-preview-summary]");
const homePublishResult = document.querySelector("[data-home-publish-result]");
const homeResultSha = document.querySelector("[data-home-result-sha]");
const homeResultCount = document.querySelector("[data-home-result-count]");
const homeResultCommitLink = document.querySelector("[data-home-result-commit-link]");
const homeResultVercelLink = document.querySelector("[data-home-result-vercel-link]");
const homeResultProductionLink = document.querySelector("[data-home-result-production-link]");
const socialEditor = document.querySelector("[data-social-editor]");
const socialForm = document.querySelector("[data-social-form]");
const socialStatus = document.querySelector("[data-social-status]");
const socialGenerateButton = document.querySelector("[data-social-generate]");
const socialDraftSection = document.querySelector("[data-social-draft]");
const socialConfirm = document.querySelector("[data-social-confirm]");
const socialApproveButton = document.querySelector("[data-social-approve]");
const contentEditor = document.querySelector("[data-content-editor]");
const contentForm = document.querySelector("[data-content-form]");
const contentStatus = document.querySelector("[data-content-status]");
const contentGenerateButton = document.querySelector("[data-content-generate]");
const contentDraftSection = document.querySelector("[data-content-draft]");
const contentConfirm = document.querySelector("[data-content-confirm]");
const contentApproveButton = document.querySelector("[data-content-approve]");
const contentExportActions = document.querySelector("[data-content-export-actions]");
const contentCopyAllButton = document.querySelector("[data-content-copy-all]");
const contentDownloadButton = document.querySelector("[data-content-download]");
const toast = document.querySelector("[data-toast]");

let approvedContact = null;
let approvedHome = null;
let socialDraft = null;
let contentDraft = null;
let toastTimer;

for (const link of contentLinks) {
  link.addEventListener("click", () => {
    sessionStorage.setItem("admin:last-section", "content");
  });
}

const fields = ["phone", "whatsapp", "email", "address", "instagram", "linkedin"];
const homeFields = [
  "eyebrow",
  "heroTitle",
  "heroDescription",
  "appointmentButton",
  "servicesButton",
  "approachTitle",
  "approachDescription",
  "processTitle",
  "processDescription",
];

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const diagnostics = [];
    if (body.githubStatus) diagnostics.push(`GitHub status: ${body.githubStatus}`);
    if (body.githubMessage) diagnostics.push(`GitHub mesajı: ${body.githubMessage}`);
    if (body.details?.environment) {
      const env = body.details.environment;
      diagnostics.push(`Token: ${env.tokenConfigured ? "tanımlı" : "tanımlı değil"}`);
      diagnostics.push(`Owner: ${env.owner || "tanımlı değil"}`);
      diagnostics.push(`Repo: ${env.repo || "tanımlı değil"}`);
      diagnostics.push(`Branch: ${env.branch || "tanımlı değil"}`);
    }
    const error = new Error(
      [body.error || "İşlem tamamlanamadı.", ...diagnostics].join("\n"),
    );
    error.status = response.status;
    throw error;
  }
  return body;
}

function getContact() {
  const formData = new FormData(contactForm);
  return Object.fromEntries(fields.map((field) => [field, formData.get(field) || ""]));
}

function fillForm(contact) {
  for (const field of fields) {
    contactForm.elements[field].value = contact[field] || "";
  }
  renderPreview(contact);
}

function getHome() {
  const formData = new FormData(homeForm);
  return Object.fromEntries(homeFields.map((field) => [field, formData.get(field) || ""]));
}

function renderHomePreview(home) {
  document.querySelector("[data-home-preview-eyebrow]").textContent = home.eyebrow || "";
  document.querySelector("[data-home-preview-title]").textContent = home.heroTitle || "Hero başlığı";
  document.querySelector("[data-home-preview-description]").textContent = home.heroDescription || "";
  document.querySelector("[data-home-preview-appointment]").textContent = home.appointmentButton || "";
  document.querySelector("[data-home-preview-services]").textContent = home.servicesButton || "";
  document.querySelector("[data-home-preview-approach-title]").textContent = home.approachTitle || "";
  document.querySelector("[data-home-preview-approach-description]").textContent = home.approachDescription || "";
  document.querySelector("[data-home-preview-process-title]").textContent = home.processTitle || "";
  document.querySelector("[data-home-preview-process-description]").textContent = home.processDescription || "";
}

function fillHomeForm(home) {
  for (const field of homeFields) {
    homeForm.elements[field].value = home[field] || "";
  }
  renderHomePreview(home);
}

function setLink(element, href, text) {
  element.hidden = !href;
  element.removeAttribute("href");
  if (href) element.href = href;
  if (text) element.textContent = text;
}

function phoneHref(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  return `tel:+${digits.startsWith("0") ? `90${digits.slice(1)}` : digits}`;
}

function whatsappHref(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits.startsWith("0") ? `90${digits.slice(1)}` : digits}`;
}

function renderPreview(contact) {
  setLink(document.querySelector("[data-preview-phone]"), phoneHref(contact.phone), contact.phone || "Telefon eklenmedi");
  setLink(document.querySelector("[data-preview-whatsapp]"), whatsappHref(contact.whatsapp), `WhatsApp${contact.whatsapp ? `: ${contact.whatsapp}` : ""}`);
  setLink(document.querySelector("[data-preview-email]"), contact.email ? `mailto:${contact.email}` : "", contact.email || "E-posta eklenmedi");
  document.querySelector("[data-preview-address]").textContent = contact.address || "Adres eklenmedi";
  setLink(document.querySelector("[data-preview-instagram]"), contact.instagram, "Instagram");
  setLink(document.querySelector("[data-preview-linkedin]"), contact.linkedin, "LinkedIn");
}

function resetApproval() {
  approvedContact = null;
  publishBox.hidden = true;
  confirmCheckbox.checked = false;
  publishButton.disabled = true;
  statusElement.textContent = "Değişiklik var";
}

function resetHomeApproval() {
  approvedHome = null;
  homePublishBox.hidden = true;
  homeConfirmCheckbox.checked = false;
  homePublishButton.disabled = true;
  homeStatus.textContent = "Değişiklik var";
}

function renderPublishResult(body) {
  resultSha.textContent = body.commit.sha;
  resultCount.textContent = String(body.updatedFileCount);
  resultFiles.replaceChildren(
    ...body.commit.files.map((file) => {
      const item = document.createElement("li");
      item.textContent = file;
      return item;
    }),
  );
  resultCommitLink.href = body.commit.githubUrl;
  resultVercelLink.href = body.vercelDeployCheckUrl;
  resultProductionLink.hidden = !body.productionUrl;
  if (body.productionUrl) resultProductionLink.href = body.productionUrl;
  publishResult.hidden = false;
}

function renderHomePublishResult(body) {
  homeResultSha.textContent = body.commit.sha;
  homeResultCount.textContent = String(body.updatedFileCount);
  homeResultCommitLink.href = body.commit.githubUrl;
  homeResultVercelLink.href = body.vercelDeployCheckUrl;
  homeResultProductionLink.hidden = !body.productionUrl;
  if (body.productionUrl) homeResultProductionLink.href = body.productionUrl;
  homePublishResult.hidden = false;
}

function renderSocialDraft(draft) {
  document.querySelector("[data-social-instagram]").textContent = draft.instagram;
  document.querySelector("[data-social-facebook]").textContent = draft.facebook;
  document.querySelector("[data-social-linkedin]").textContent = draft.linkedin;
  document.querySelector("[data-social-tiktok]").textContent = draft.tiktok;
  document.querySelector("[data-social-hashtags]").textContent = draft.hashtags.join(" ");
  document.querySelector("[data-social-visual]").textContent = draft.visualSuggestion;
  document.querySelector("[data-social-physician-note]").textContent = draft.physicianNote;
  socialDraftSection.hidden = false;
}

const contentLabels = {
  blog: "WEB SİTESİ BLOG YAZISI",
  blogSeoPackage: "BLOG SEO PAKETİ",
  brochure: "HASTA BİLGİLENDİRME BROŞÜRÜ",
  contentCalendar: "7 GÜNLÜK İÇERİK TAKVİMİ",
  instagram: "INSTAGRAM GÖNDERİ METNİ",
  carousel: "INSTAGRAM CAROUSEL",
  facebook: "FACEBOOK GÖNDERİ METNİ",
  facebookLong: "FACEBOOK UZUN GÖNDERİ",
  linkedin: "LINKEDIN PROFESYONEL PAYLAŞIMI",
  linkedinArticle: "LINKEDIN UZUN MAKALE",
  x: "X KISA PAYLAŞIM METNİ",
  xFlood: "8 TWEETLİK X FLOOD",
  video: "TIKTOK / REELS KISA VİDEO SENARYOSU",
  videoScripts: "VİDEO KONUŞMA METİNLERİ",
  podcast: "PODCAST METNİ",
  faq: "SIK SORULAN SORULAR",
  hashtags: "HASHTAGLER",
  visualSuggestion: "GÖRSEL / CAROUSEL ÖNERİSİ",
  physicianNote: "HEKİM KONTROL NOTU",
};

const contentTabFields = {
  blog: ["blog", "brochure", "contentCalendar"],
  "seo-blog": ["blogSeoPackage"],
  instagram: ["instagram", "hashtags", "visualSuggestion"],
  carousel: ["carousel"],
  facebook: ["facebook", "facebookLong"],
  "linkedin-long": ["linkedinArticle"],
  "x-flood": ["xFlood"],
  video: ["video", "videoScripts"],
  podcast: ["podcast"],
  faq: ["faq"],
};

function contentValue(draft, field) {
  const value = draft[field];
  return Array.isArray(value) ? value.join(" ") : String(value || "");
}

function renderContentDraft(draft) {
  for (const output of document.querySelectorAll("[data-content-output]")) {
    output.textContent = contentValue(draft, output.dataset.contentOutput);
  }
  activateContentTab("blog");
  contentDraftSection.hidden = false;
}

function activateContentTab(tabName) {
  for (const tab of document.querySelectorAll("[data-content-tab]")) {
    const active = tab.dataset.contentTab === tabName;
    tab.setAttribute("aria-selected", String(active));
  }
  for (const panel of document.querySelectorAll("[data-content-panel]")) {
    panel.hidden = panel.dataset.contentPanel !== tabName;
  }
}

function formatContentFields(draft, fields) {
  return fields.map((field) => {
    const label = contentLabels[field];
    return `${label}\n${"=".repeat(label.length)}\n${contentValue(draft, field)}`;
  }).join("\n\n");
}

function formatContentKit(draft) {
  return `${draft.title}\n${"-".repeat(draft.title.length)}\n\n${formatContentFields(draft, Object.keys(contentLabels))}\n\nUYARI\n${draft.disclaimer}`;
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.append(area);
  area.select();
  document.execCommand("copy");
  area.remove();
}

function fileSlug(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "icerik-taslagi";
}

function downloadText(text, filename) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function setupTabExports() {
  for (const panel of document.querySelectorAll("[data-content-panel]")) {
    const tabName = panel.dataset.contentPanel;
    let actions = panel.querySelector(".tab-export-actions");
    if (!actions) {
      actions = document.createElement("div");
      actions.className = "tab-export-actions";
      panel.append(actions);
    }
    const copyButton = panel.querySelector("[data-copy-tab]");
    if (copyButton && copyButton.parentElement !== actions) actions.append(copyButton);
    if (!actions.querySelector("[data-download-tab]")) {
      const button = document.createElement("button");
      button.className = "quiet-button";
      button.type = "button";
      button.dataset.downloadTab = tabName;
      button.disabled = true;
      button.textContent = "TXT indir";
      actions.append(button);
    }
  }
}

setupTabExports();

function enableContentExports(enabled) {
  for (const button of document.querySelectorAll("[data-copy-field], [data-copy-tab], [data-download-tab]")) {
    button.disabled = !enabled;
  }
  contentExportActions.hidden = !enabled;
}

for (const tab of document.querySelectorAll("[data-content-tab]")) {
  tab.addEventListener("click", () => activateContentTab(tab.dataset.contentTab));
}

function setBusy(button, busy, busyText, idleText) {
  button.disabled = busy;
  button.textContent = busy ? busyText : idleText;
}

function showToast(message, isError = false) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.toggle("is-error", isError);
  toast.hidden = false;
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 6000);
}

async function loadContact() {
  try {
    const body = await api("/api/admin/contact");
    loginPanel.hidden = true;
    editor.hidden = false;
    logoutButton.hidden = false;
    contentEntry.hidden = false;
    fillForm(body.contact);
    statusElement.textContent = "GitHub ile güncel";
    await loadHome();
    socialEditor.hidden = false;
    contentEditor.hidden = false;
  } catch (error) {
    if (error.status === 401) {
      loginPanel.hidden = false;
      editor.hidden = true;
      logoutButton.hidden = true;
      return;
    }
    showToast(error.message, true);
  }
}

async function loadHome() {
  const body = await api("/api/admin/home");
  fillHomeForm(body.home);
  homeEditor.hidden = false;
  homeStatus.textContent = "GitHub ile güncel";
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = loginForm.querySelector("button");
  setBusy(button, true, "Giriş yapılıyor", "Giriş yap");
  try {
    await api("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ password: loginForm.elements.password.value }),
    });
    loginForm.reset();
    await loadContact();
  } catch (error) {
    showToast(error.message, true);
  } finally {
    setBusy(button, false, "Giriş yapılıyor", "Giriş yap");
  }
});

logoutButton.addEventListener("click", async () => {
  try {
    await api("/api/admin/logout", { method: "POST", body: "{}" });
  } finally {
    approvedContact = null;
    approvedHome = null;
    loginPanel.hidden = false;
    editor.hidden = true;
    homeEditor.hidden = true;
    socialEditor.hidden = true;
    contentEditor.hidden = true;
    contentEntry.hidden = true;
    logoutButton.hidden = true;
  }
});

contactForm.addEventListener("input", () => {
  renderPreview(getContact());
  resetApproval();
});

contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setBusy(previewButton, true, "Kontrol ediliyor", "Önizle");
  try {
    const body = await api("/api/admin/preview", {
      method: "POST",
      body: JSON.stringify({ contact: getContact() }),
    });
    approvedContact = body.preview;
    fillForm(body.preview);
    previewSummary.textContent = body.summary;
    affectedFiles.replaceChildren(
      ...body.affectedFiles.map((file) => {
        const item = document.createElement("li");
        item.textContent = file;
        return item;
      }),
    );
    publishBox.hidden = false;
    confirmCheckbox.checked = false;
    publishButton.disabled = true;
    statusElement.textContent = "Önizleme hazır";
    publishBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (error) {
    showToast(error.message, true);
  } finally {
    setBusy(previewButton, false, "Kontrol ediliyor", "Önizle");
  }
});

confirmCheckbox.addEventListener("change", () => {
  publishButton.disabled = !confirmCheckbox.checked || !approvedContact;
});

publishButton.addEventListener("click", async () => {
  if (!approvedContact || !confirmCheckbox.checked) return;
  setBusy(publishButton, true, "Yayınlanıyor", "Yayınla");
  try {
    const body = await api("/api/admin/publish", {
      method: "POST",
      body: JSON.stringify({ contact: approvedContact, confirm: true }),
    });
    statusElement.textContent = `Commit: ${body.commit.shortSha}`;
    renderPublishResult(body);
    approvedContact = null;
    confirmCheckbox.checked = false;
    publishBox.hidden = true;
    showToast(body.message);
  } catch (error) {
    showToast(error.message, true);
  } finally {
    setBusy(publishButton, false, "Yayınlanıyor", "Yayınla");
    publishButton.disabled = true;
  }
});

homeForm.addEventListener("input", () => {
  renderHomePreview(getHome());
  resetHomeApproval();
});

homeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setBusy(homePreviewButton, true, "Kontrol ediliyor", "Önizle");
  try {
    const body = await api("/api/admin/home-preview", {
      method: "POST",
      body: JSON.stringify({ home: getHome() }),
    });
    approvedHome = body.preview;
    fillHomeForm(body.preview);
    homePreviewSummary.textContent = body.summary;
    homePublishBox.hidden = false;
    homeConfirmCheckbox.checked = false;
    homePublishButton.disabled = true;
    homeStatus.textContent = "Önizleme hazır";
    homePublishBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (error) {
    showToast(error.message, true);
  } finally {
    setBusy(homePreviewButton, false, "Kontrol ediliyor", "Önizle");
  }
});

homeConfirmCheckbox.addEventListener("change", () => {
  homePublishButton.disabled = !homeConfirmCheckbox.checked || !approvedHome;
});

homePublishButton.addEventListener("click", async () => {
  if (!approvedHome || !homeConfirmCheckbox.checked) return;
  setBusy(homePublishButton, true, "Yayınlanıyor", "Yayınla");
  try {
    const body = await api("/api/admin/home-publish", {
      method: "POST",
      body: JSON.stringify({ home: approvedHome, confirm: true }),
    });
    homeStatus.textContent = `Commit: ${body.commit.shortSha}`;
    renderHomePublishResult(body);
    approvedHome = null;
    homeConfirmCheckbox.checked = false;
    homePublishBox.hidden = true;
    showToast(body.message);
  } catch (error) {
    showToast(error.message, true);
  } finally {
    setBusy(homePublishButton, false, "Yayınlanıyor", "Yayınla");
    homePublishButton.disabled = true;
  }
});

socialForm.addEventListener("input", () => {
  socialDraft = null;
  socialDraftSection.hidden = true;
  socialConfirm.checked = false;
  socialApproveButton.disabled = true;
  socialStatus.textContent = "Değişiklik var";
});

socialForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setBusy(socialGenerateButton, true, "Taslak hazırlanıyor", "Taslak Oluştur");
  try {
    const body = await api("/api/admin/social-draft", {
      method: "POST",
      body: JSON.stringify({ title: socialForm.elements.title.value }),
    });
    socialDraft = body.draft;
    renderSocialDraft(body.draft);
    socialConfirm.checked = false;
    socialApproveButton.disabled = true;
    socialStatus.textContent = "Hekim onayı bekliyor";
    showToast(body.message);
  } catch (error) {
    showToast(error.message, true);
  } finally {
    setBusy(socialGenerateButton, false, "Taslak hazırlanıyor", "Taslak Oluştur");
  }
});

socialConfirm.addEventListener("change", () => {
  socialApproveButton.disabled = !socialConfirm.checked || !socialDraft;
});

socialApproveButton.addEventListener("click", async () => {
  if (!socialDraft || !socialConfirm.checked) return;
  setBusy(socialApproveButton, true, "Onaylanıyor", "Hekim Onaylı Taslak Oluştur");
  try {
    const body = await api("/api/admin/social-approve", {
      method: "POST",
      body: JSON.stringify({
        title: socialDraft.title,
        physicianApproved: true,
      }),
    });
    socialDraft = body.approvedDraft;
    renderSocialDraft(body.approvedDraft);
    socialStatus.textContent = "Hekim onaylı taslak";
    socialConfirm.checked = false;
    showToast(body.message);
  } catch (error) {
    showToast(error.message, true);
  } finally {
    setBusy(socialApproveButton, false, "Onaylanıyor", "Hekim Onaylı Taslak Oluştur");
    socialApproveButton.disabled = true;
  }
});

contentForm.addEventListener("input", () => {
  contentDraft = null;
  contentDraftSection.hidden = true;
  contentConfirm.checked = false;
  contentApproveButton.disabled = true;
  enableContentExports(false);
  contentStatus.textContent = "Değişiklik var";
});

contentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setBusy(contentGenerateButton, true, "UZMAN PAKETİ HAZIRLANIYOR", "UZMAN PAKETİ OLUŞTUR");
  try {
    const body = await api("/api/admin/content-draft", {
      method: "POST",
      body: JSON.stringify({ title: contentForm.elements.title.value }),
    });
    contentDraft = body.draft;
    renderContentDraft(body.draft);
    contentConfirm.checked = false;
    contentApproveButton.disabled = true;
    enableContentExports(false);
    contentStatus.textContent = "Hekim onayı bekliyor";
    showToast(body.message);
  } catch (error) {
    showToast(error.message, true);
  } finally {
    setBusy(contentGenerateButton, false, "UZMAN PAKETİ HAZIRLANIYOR", "UZMAN PAKETİ OLUŞTUR");
  }
});

contentConfirm.addEventListener("change", () => {
  contentApproveButton.disabled = !contentConfirm.checked || !contentDraft;
});

contentApproveButton.addEventListener("click", async () => {
  if (!contentDraft || !contentConfirm.checked) return;
  setBusy(contentApproveButton, true, "Onaylanıyor", "Kopyalama ve İndirmeyi Aç");
  try {
    const body = await api("/api/admin/content-approve", {
      method: "POST",
      body: JSON.stringify({
        title: contentDraft.title,
        physicianApproved: true,
      }),
    });
    contentDraft = body.approvedDraft;
    renderContentDraft(contentDraft);
    enableContentExports(true);
    contentStatus.textContent = "Hekim onaylı taslak";
    contentConfirm.checked = false;
    showToast(body.message);
  } catch (error) {
    showToast(error.message, true);
  } finally {
    setBusy(contentApproveButton, false, "Onaylanıyor", "Kopyalama ve İndirmeyi Aç");
    contentApproveButton.disabled = true;
  }
});

for (const button of document.querySelectorAll("[data-copy-field]")) {
  button.addEventListener("click", async () => {
    if (!contentDraft || contentDraft.status !== "physician-approved") return;
    const field = button.dataset.copyField;
    await copyText(contentValue(contentDraft, field));
    showToast(`${contentLabels[field]} kopyalandı.`);
  });
}

for (const button of document.querySelectorAll("[data-copy-tab]")) {
  button.addEventListener("click", async () => {
    if (!contentDraft || contentDraft.status !== "physician-approved") return;
    const tabName = button.dataset.copyTab;
    await copyText(formatContentFields(contentDraft, contentTabFields[tabName]));
    showToast(`${button.textContent.replace(" Kopyala", "")} kopyalandı.`);
  });
}

for (const button of document.querySelectorAll("[data-download-tab]")) {
  button.addEventListener("click", () => {
    if (!contentDraft || contentDraft.status !== "physician-approved") return;
    const tabName = button.dataset.downloadTab;
    const text = formatContentFields(contentDraft, contentTabFields[tabName]);
    downloadText(text, `${fileSlug(contentDraft.title)}-${tabName}.txt`);
    showToast(`${tabName} sekmesi TXT olarak indirildi.`);
  });
}

contentCopyAllButton.addEventListener("click", async () => {
  if (!contentDraft || contentDraft.status !== "physician-approved") return;
  await copyText(formatContentKit(contentDraft));
  showToast("İçerik paketinin tamamı kopyalandı.");
});

contentDownloadButton.addEventListener("click", () => {
  if (!contentDraft || contentDraft.status !== "physician-approved") return;
  downloadText(formatContentKit(contentDraft), `${fileSlug(contentDraft.title)}.txt`);
  showToast("İçerik paketi indirildi.");
});

loadContact();
