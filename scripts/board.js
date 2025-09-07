document.addEventListener("DOMContentLoaded", () => initBoard());

const BASE_URL = "https://join-1323-default-rtdb.europe-west1.firebasedatabase.app";
const COL_TO_STATE = { "todo": "toDo", "in-progress": "in progress", "await-feedback": "await feedback", "done": "done" };
const STATE_TO_COL = Object.fromEntries(Object.entries(COL_TO_STATE).map(([c, s]) => [s, c]));

let dragged = null;

async function initBoard() {
  await renderAllTasks();
  initDnd();
  highlightJustCreated();
}

function initDnd() {
  document.querySelectorAll(".card").forEach((c) => {
    c.draggable = true;
    c.addEventListener("dragstart", (e) => {
      dragged = c;
      c.classList.add("is-dragging");
    });
    c.addEventListener("dragend", () => {
      dragged.classList.remove("is-dragging");
      dragged = null;
    });
  });

  document.querySelectorAll(".dropzone").forEach((zone) => {
    zone.addEventListener("dragover", (e) => {
      if (!dragged) return;
      e.preventDefault();
      zone.classList.add("is-over");
      placeByMouse(zone, e.clientY);
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("is-over"));
    zone.addEventListener("drop", async (e) => {
      e.preventDefault();
      zone.classList.remove("is-over");
      if (!dragged) return;
      placeByMouse(zone, e.clientY);
      const newState = COL_TO_STATE[zone.id];
      const taskId = dragged.dataset.id;
      await updateTaskState(taskId, newState);
    });
  });
}

function placeByMouse(container, mouseY) {
  const others = [...container.querySelectorAll(".card:not(.is-dragging)")];
  const after = others.reduce(
    (acc, el) => {
      const box = el.getBoundingClientRect();
      const offset = mouseY - box.top - box.height / 2;
      return offset < 0 && offset > acc.offset ? { offset, el } : acc;
    },
    { offset: -Infinity, el: null }
  ).el;
  after ? container.insertBefore(dragged, after) : container.appendChild(dragged);
}

async function updateTaskState(id, state) {
  await fetch(`${BASE_URL}/tasks/${id}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state }),
  });
}

async function fetchTasks() {
  const res = await fetch(`${BASE_URL}/tasks.json`);
  const data = await res.json();
  if (!data) return {};
  if (Array.isArray(data))
    return Object.fromEntries(
      data.map((t, i) => [i, t]).filter(([, t]) => t)
    );
  return data;
}

async function renderAllTasks() {
  const tasks = await fetchTasks();
  clearColumns();
  Object.entries(tasks).forEach(([id, t]) => appendTaskCard(id, t));
  initDnd();
}

function clearColumns() {
  document.querySelectorAll(".dropzone").forEach((z) => {
    const colTitle = z.previousElementSibling?.textContent?.trim() || "";
    z.innerHTML = `<div class="empty">No tasks ${colTitle}</div>`;
  });
}

function appendTaskCard(id, t) {
  const colId = STATE_TO_COL[t.state] || "todo";
  const zone = document.getElementById(colId);
  zone.querySelector(".empty")?.remove();

  const card = document.createElement("article");
  card.className = "card";
  card.dataset.id = id;
  card.innerHTML = `
    <span class="pill ${t.category?.toLowerCase().includes("tech") ? "tech" : "user"}">${t.category || ""}</span>
    <div class="task-title">${escapeHtml(t.title || "")}</div>
    <div class="task-desc">${escapeHtml(t.description || "")}</div>
    ${t.assignedContacts?.length ? renderInitials(t.assignedContacts) : ""}
    ${t.date ? `<div class="meta"><span>Due: ${t.date}</span></div>` : ""}
  `;
  zone.appendChild(card);
}

function renderInitials(names = []) {
  const html = names
    .map((n, i) => `<div class="av" style="background:${color(i)}">${initials(n)}</div>`)
    .join("");
  return `<div class="row"><div class="avatars">${html}</div></div>`;
}

const colors = ["#f44336", "#2196F3", "#FF9800", "#9C27B0", "#4CAF50", "#00BCD4", "#FFC107"];
const color = (i) => colors[i % colors.length];
const initials = (n) =>
  (n || "")
    .trim()
    .split(/\s+/)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase();
const escapeHtml = (s) =>
  (s || "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));

function highlightJustCreated() {
  const lastId = localStorage.getItem("lastCreatedTaskId");
  if (!lastId) return;
  const el = document.querySelector(`.card[data-id="${lastId}"]`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.style.transition = "box-shadow .6s";
    el.style.boxShadow = "0 0 0 3px rgba(41,171,226,.6)";
    setTimeout(() => (el.style.boxShadow = ""), 900);
  }
  localStorage.removeItem("lastCreatedTaskId");
}

/* ===== Add Task Overlay Steuerung ===== */
function openTaskOverlay() {
  const ov = document.getElementById("taskOverlay");
  if (!ov) return;
  ov.classList.add("open");
  document.body.classList.add("modal-open");

  // Steuerelemente aus addTask.js initialisieren
  if (typeof initCategoryDropdown === "function") initCategoryDropdown();
  if (typeof initContactsDropdown === "function") initContactsDropdown();
  if (typeof initialiseSavePrioImg === "function") initialiseSavePrioImg();
}

function closeTaskOverlay() {
  const ov = document.getElementById("taskOverlay");
  if (!ov) return;
  ov.classList.remove("open");
  document.body.classList.remove("modal-open");
  if (typeof clearTask === "function") clearTask();
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("openAddTask")?.addEventListener("click", openTaskOverlay);
  document.querySelectorAll(".add-card-btn").forEach(b => b.addEventListener("click", openTaskOverlay));
  document.getElementById("closeTaskOverlay")?.addEventListener("click", closeTaskOverlay);
  document.getElementById("cancelTask")?.addEventListener("click", closeTaskOverlay);
  document.getElementById("taskOverlay")?.addEventListener("click", (e) => { if (e.target.id === "taskOverlay") closeTaskOverlay(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeTaskOverlay(); });
});

