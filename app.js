const form = document.getElementById("form");
const input = document.getElementById("text");
const list = document.getElementById("list");

const KEY = "jinsei_memos_v1";

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
}
function save(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}
function render() {
  const items = load();
  list.innerHTML = "";
  for (const item of items) {
    const li = document.createElement("li");
    li.textContent = item.text;
    list.appendChild(li);
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  const items = load();
  items.unshift({ text, createdAt: Date.now() });
  save(items);
  input.value = "";
  render();
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js");
}

render();
