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
const toast = document.querySelector("[data-toast]");

let approvedContact = null;
let toastTimer;

const fields = ["phone", "whatsapp", "email", "address", "instagram", "linkedin"];

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
    const error = new Error(body.error || "İşlem tamamlanamadı.");
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
    loginPanel.hidden = false;
    editor.hidden = true;
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

loadContact();
