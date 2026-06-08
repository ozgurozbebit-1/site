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
  instagram: "INSTAGRAM GÖNDERİ METNİ",
  facebook: "FACEBOOK GÖNDERİ METNİ",
  linkedin: "LINKEDIN PROFESYONEL PAYLAŞIMI",
  x: "X KISA PAYLAŞIM METNİ",
  video: "TIKTOK / REELS KISA VİDEO SENARYOSU",
  hashtags: "HASHTAGLER",
  visualSuggestion: "GÖRSEL / CAROUSEL ÖNERİSİ",
  physicianNote: "HEKİM KONTROL NOTU",
};

function contentValue(draft, field) {
  const value = draft[field];
  return Array.isArray(value) ? value.join(" ") : String(value || "");
}

function renderContentDraft(draft) {
  document.querySelector("[data-content-blog]").textContent = draft.blog;
  document.querySelector("[data-content-instagram]").textContent = draft.instagram;
  document.querySelector("[data-content-facebook]").textContent = draft.facebook;
  document.querySelector("[data-content-linkedin]").textContent = draft.linkedin;
  document.querySelector("[data-content-x]").textContent = draft.x;
  document.querySelector("[data-content-video]").textContent = draft.video;
  document.querySelector("[data-content-hashtags]").textContent = draft.hashtags.join(" ");
  document.querySelector("[data-content-visual]").textContent = draft.visualSuggestion;
  document.querySelector("[data-content-physician-note]").textContent = draft.physicianNote;
  contentDraftSection.hidden = false;
}

function formatContentKit(draft) {
  const sections = Object.entries(contentLabels).map(([field, label]) => (
    `${label}\n${"=".repeat(label.length)}\n${contentValue(draft, field)}`
  ));
  return `${draft.title}\n${"-".repeat(draft.title.length)}\n\n${sections.join("\n\n")}\n\nUYARI\n${draft.disclaimer}`;
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

function enableContentExports(enabled) {
  for (const button of document.querySelectorAll("[data-copy-field]")) {
    button.disabled = !enabled;
  }
  contentExportActions.hidden = !enabled;
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
  setBusy(contentGenerateButton, true, "Paket hazırlanıyor", "İçerik Paketi Oluştur");
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
    setBusy(contentGenerateButton, false, "Paket hazırlanıyor", "İçerik Paketi Oluştur");
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

contentCopyAllButton.addEventListener("click", async () => {
  if (!contentDraft || contentDraft.status !== "physician-approved") return;
  await copyText(formatContentKit(contentDraft));
  showToast("İçerik paketinin tamamı kopyalandı.");
});

contentDownloadButton.addEventListener("click", () => {
  if (!contentDraft || contentDraft.status !== "physician-approved") return;
  const blob = new Blob([formatContentKit(contentDraft)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const slug = contentDraft.title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "icerik-taslagi";
  link.href = url;
  link.download = `${slug}.txt`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("İçerik paketi indirildi.");
});

loadContact();
