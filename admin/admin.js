const loginPanel = document.querySelector("[data-login-panel]");
const loginForm = document.querySelector("[data-login-form]");
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
const toast = document.querySelector("[data-toast]");

let approvedContact = null;
let approvedHome = null;
let toastTimer;

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
    fillForm(body.contact);
    statusElement.textContent = "GitHub ile güncel";
    await loadHome();
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

loadContact();
