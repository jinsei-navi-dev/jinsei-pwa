const form = document.getElementById("form");
const list = document.getElementById("list");
const q = document.getElementById("q");

const titleEl = document.getElementById("title");
const urlEl = document.getElementById("url");
const tagsEl = document.getElementById("tags");
const memoEl = document.getElementById("memo");

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
