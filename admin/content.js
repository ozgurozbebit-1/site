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

function enableExports(enabled) {
  for (const button of document.querySelectorAll("[data-copy-field], [data-copy-tab], [data-download-tab]")) {
    button.disabled = !enabled;
  }
  contentExportActions.hidden = !enabled;
}

for (const tab of document.querySelectorAll("[data-content-tab]")) {
  tab.addEventListener("click", () => activateContentTab(tab.dataset.contentTab));
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
  setBusy(contentGenerateButton, true, "UZMAN PAKETİ HAZIRLANIYOR", "UZMAN PAKETİ OLUŞTUR");
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

for (const button of document.querySelectorAll("[data-copy-tab]")) {
  button.addEventListener("click", async () => {
    if (contentDraft?.status !== "physician-approved") return;
    const tabName = button.dataset.copyTab;
    await copyText(formatContentFields(contentDraft, contentTabFields[tabName]));
    showToast(`${button.textContent.replace(" Kopyala", "")} kopyalandı.`);
  });
}

for (const button of document.querySelectorAll("[data-download-tab]")) {
  button.addEventListener("click", () => {
    if (contentDraft?.status !== "physician-approved") return;
    const tabName = button.dataset.downloadTab;
    const text = formatContentFields(contentDraft, contentTabFields[tabName]);
    downloadText(text, `${fileSlug(contentDraft.title)}-${tabName}.txt`);
    showToast(`${tabName} sekmesi TXT olarak indirildi.`);
  });
}

contentCopyAllButton.addEventListener("click", async () => {
  if (contentDraft?.status !== "physician-approved") return;
  await copyText(formatContentKit(contentDraft));
  showToast("İçerik paketinin tamamı kopyalandı.");
});

contentDownloadButton.addEventListener("click", () => {
  if (contentDraft?.status !== "physician-approved") return;
  downloadText(formatContentKit(contentDraft), `${fileSlug(contentDraft.title)}.txt`);
  showToast("İçerik paketi indirildi.");
});

loadSession();
