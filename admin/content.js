const loginPanel = document.querySelector("[data-login-panel]");
const loginForm = document.querySelector("[data-login-form]");
const logoutButton = document.querySelector("[data-logout]");
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

let contentDraft = null;
let toastTimer;

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

function contentValue(draft, field) {
  const value = draft[field];
  return Array.isArray(value) ? value.join(" ") : String(value || "");
}

function renderContentDraft(draft) {
  for (const field of ["blog", "instagram", "facebook", "linkedin", "x", "video"]) {
    document.querySelector(`[data-content-${field}]`).textContent = draft[field];
  }
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

function enableExports(enabled) {
  for (const button of document.querySelectorAll("[data-copy-field]")) {
    button.disabled = !enabled;
  }
  contentExportActions.hidden = !enabled;
}

function showEditor() {
  loginPanel.hidden = true;
  contentEditor.hidden = false;
  logoutButton.hidden = false;
}

async function loadSession() {
  try {
    await api("/api/admin/session");
    showEditor();
  } catch (error) {
    if (error.status !== 401) showToast(error.message, true);
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
    showEditor();
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
    contentDraft = null;
    contentEditor.hidden = true;
    logoutButton.hidden = true;
    loginPanel.hidden = false;
  }
});

contentForm.addEventListener("input", () => {
  contentDraft = null;
  contentDraftSection.hidden = true;
  contentConfirm.checked = false;
  contentApproveButton.disabled = true;
  enableExports(false);
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
    renderContentDraft(contentDraft);
    contentConfirm.checked = false;
    contentApproveButton.disabled = true;
    enableExports(false);
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
      body: JSON.stringify({ title: contentDraft.title, physicianApproved: true }),
    });
    contentDraft = body.approvedDraft;
    renderContentDraft(contentDraft);
    enableExports(true);
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
    if (contentDraft?.status !== "physician-approved") return;
    const field = button.dataset.copyField;
    await copyText(contentValue(contentDraft, field));
    showToast(`${contentLabels[field]} kopyalandı.`);
  });
}

contentCopyAllButton.addEventListener("click", async () => {
  if (contentDraft?.status !== "physician-approved") return;
  await copyText(formatContentKit(contentDraft));
  showToast("İçerik paketinin tamamı kopyalandı.");
});

contentDownloadButton.addEventListener("click", () => {
  if (contentDraft?.status !== "physician-approved") return;
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

loadSession();
