const form = document.getElementById("form");
const list = document.getElementById("list");
const q = document.getElementById("q");

const titleEl = document.getElementById("title");
const urlEl = document.getElementById("url");
const tagsEl = document.getElementById("tags");
const memoEl = document.getElementById("memo");
const backupExportBtn = document.getElementById("backup-export");
const backupImportInput = document.getElementById("backup-import");
const backupMessage = document.getElementById("backup-message");

const KEY = "jinsei_clips_v1";

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
}
function save(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}
function parseTags(s) {
  return (s || "")
    .split(",")
    .map(t => t.trim())
    .filter(Boolean);
}

function render() {
  const items = load();
  const needle = (q?.value || "").trim().toLowerCase();

  list.innerHTML = "";
  for (const item of items) {
    const hay = `${item.title} ${item.url} ${item.memo} ${(item.tags||[]).join(" ")}`.toLowerCase();
    if (needle && !hay.includes(needle)) continue;

    const li = document.createElement("li");
    li.innerHTML = `
      <div class="row">
        <strong>${escapeHtml(item.title || "(no title)")}</strong>
        <button class="fav" data-id="${item.id}">${item.favorite ? "★" : "☆"}</button>
      </div>
      <div class="meta">${(item.tags || []).map(t => `<span class="tag">#${escapeHtml(t)}</span>`).join(" ")}</div>
      <div class="url"><a href="${escapeAttr(item.url)}" target="_blank" rel="noopener">開く</a></div>
      ${item.memo ? `<div class="memo">${escapeHtml(item.memo)}</div>` : ""}
    `;
    list.appendChild(li);
  }

  // favorite toggle
  list.querySelectorAll("button.fav").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const items2 = load();
      const it = items2.find(x => x.id === id);
      if (!it) return;
      it.favorite = !it.favorite;
      save(items2);
      render();
    });
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}
function escapeAttr(str) {
  // minimal safe handling
  return String(str || "").replace(/"/g, "%22");
}

function setBackupMessage(text, isError = false) {
  if (!backupMessage) return;
  backupMessage.textContent = text;
  backupMessage.classList.toggle("error", Boolean(isError));
}

function exportBackup() {
  try {
    const raw = localStorage.getItem(KEY) || "[]";
    const parsed = JSON.parse(raw);
    const json = JSON.stringify(parsed, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `jinsei_backup_${date}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setBackupMessage("エクスポートしました。");
  } catch {
    setBackupMessage("エクスポートに失敗しました。JSONを確認してください。", true);
  }
}

if (backupExportBtn) {
  backupExportBtn.addEventListener("click", exportBackup);
}

if (backupImportInput) {
  backupImportInput.addEventListener("change", () => {
    const file = backupImportInput.files && backupImportInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || "");
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
          throw new Error("Invalid backup format");
        }
        localStorage.setItem(KEY, JSON.stringify(parsed));
        render();
        setBackupMessage("インポートしました。");
      } catch {
        setBackupMessage("インポートに失敗しました。JSONを確認してください。", true);
      } finally {
        backupImportInput.value = "";
      }
    };
    reader.onerror = () => {
      setBackupMessage("インポートに失敗しました。ファイルを読み込めません。", true);
      backupImportInput.value = "";
    };
    reader.readAsText(file);
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = titleEl.value.trim();
  const url = urlEl.value.trim();
  const memo = memoEl.value.trim();
  const tags = parseTags(tagsEl.value);

  if (!title && !url && !memo) return;

  const items = load();
  items.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    title,
    url,
    memo,
    tags,
    favorite: false,
    createdAt: Date.now()
  });
  save(items);

  titleEl.value = "";
  urlEl.value = "";
  memoEl.value = "";
  tagsEl.value = "";

  render();
});

q?.addEventListener("input", render);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js");
}

render();
