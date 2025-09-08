document.addEventListener("DOMContentLoaded", () => initBoard());

const BASE_URL =
  "https://join-1323-default-rtdb.europe-west1.firebasedatabase.app";
const COL_TO_STATE = {
  todo: "toDo",
  "in-progress": "in progress",
  "await-feedback": "await feedback",
  done: "done",
};
const STATE_TO_COL = Object.fromEntries(
  Object.entries(COL_TO_STATE).map(([c, s]) => [s, c])
);

let dragged = null;

async function initBoard() {
  await renderAllTasks();
  initDnd();
  highlightJustCreated?.();
}

function highlightJustCreated() {
  const params = new URLSearchParams(window.location.search);
  const newId = params.get("newTask");
  if (!newId) return;

  const el = document.querySelector(`.task-container[data-id="${newId}"]`);
  if (el) {
    el.classList.add("highlight");
    setTimeout(() => el.classList.remove("highlight"), 2000);
  }
}

function initDnd() {
  if (window.__dndInitialized) return;
  window.__dndInitialized = true;

  document.addEventListener("dragstart", (e) => {
    const container = e.target.closest(".task-container");
    if (!container) return;

    dragged = container;
    container.classList.add("is-dragging");

    const innerCard = container.querySelector(".card");
    if (innerCard) innerCard.classList.add("is-dragging");

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", container.dataset.id || "");
    }
  });

  document.addEventListener("dragend", (e) => {
    const container = e.target.closest(".task-container");
    if (!container) return;

    const innerCard = container.querySelector(".card");
    if (innerCard) innerCard.classList.remove("is-dragging");

    container.classList.remove("is-dragging");
    dragged = null;

    document
      .querySelectorAll(".dropzone.is-over")
      .forEach((z) => z.classList.remove("is-over"));
  });

  document.querySelectorAll(".dropzone").forEach((zone) => {
    if (zone.__dndBound) return;

    zone.addEventListener("dragover", (e) => {
      if (!dragged) return;
      e.preventDefault();
      zone.classList.add("is-over");
      placeByMouse(zone, e.clientY);
    });

    zone.addEventListener("dragleave", () => {
      zone.classList.remove("is-over");
    });

    zone.addEventListener("drop", async (e) => {
      e.preventDefault();
      zone.classList.remove("is-over");
      if (!dragged) return;

      placeByMouse(zone, e.clientY);
      const newState = COL_TO_STATE[zone.id];
      const taskId = dragged.dataset.id;
      if (taskId && newState) {
        await updateTaskState(taskId, newState);
      }
    });

    zone.__dndBound = true;
  });
}

function placeByMouse(container, mouseY) {
  const others = [
    ...container.querySelectorAll(".task-container:not(.is-dragging)"),
  ];
  const after = others.reduce(
    (acc, el) => {
      const box = el.getBoundingClientRect();
      const offset = mouseY - box.top - box.height / 2;
      return offset < 0 && offset > acc.offset ? { offset, el } : acc;
    },
    { offset: -Infinity, el: null }
  ).el;
  after
    ? container.insertBefore(dragged, after)
    : container.appendChild(dragged);
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
    return Object.fromEntries(data.map((t, i) => [i, t]).filter(([, t]) => t));
  return data;
}

async function fetchSingleTask(id) {
  const res = await fetch(`${BASE_URL}/tasks/${id}.json`);
  return (await res.json()) || {};
}

async function deleteTask(id) {
  await fetch(`${BASE_URL}/tasks/${id}.json`, { method: "DELETE" });
}

async function toggleSubtaskDone(taskId, index, done) {
  const t = await fetchSingleTask(taskId);
  const subs = Array.isArray(t.subtasks) ? t.subtasks : [];
  if (subs[index] == null) return;

  if (typeof subs[index] === "string") {
    subs[index] = { text: subs[index], done: !!done };
  } else {
    subs[index].done = !!done;
  }

  await fetch(`${BASE_URL}/tasks/${taskId}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subtasks: subs }),
  });
}

async function renderAllTasks() {
  const tasks = await fetchTasks();
  clearColumns();
  Object.entries(tasks).forEach(([id, t]) => appendTaskCard(id, t));
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

  const wrapper = document.createElement("div");
  wrapper.className = "task-container";
  wrapper.dataset.id = id;
  wrapper.draggable = true;

  const card = document.createElement("article");
  card.className = "card";
  card.dataset.id = id;
  card.innerHTML = `
    <span class="pill ${
      t.category?.toLowerCase().includes("tech") ? "tech" : "user"
    }">${t.category || ""}</span>
    <div class="task-title">${escapeHtml(t.title || "")}</div>
    <div class="task-desc">${escapeHtml(t.description || "")}</div>
    ${t.assignedContacts?.length ? renderInitials(t.assignedContacts) : ""}
    ${t.date ? `<div class="meta"><span>Due: ${t.date}</span></div>` : ""}
  `;

  let wasDragged = false;
  wrapper.addEventListener("dragstart", () => (wasDragged = true));
  wrapper.addEventListener("dragend", () => {
    setTimeout(() => (wasDragged = false), 0);
  });
  card.addEventListener("click", () => {
    if (wasDragged) return;
    openTaskDetail?.(id);
  });

  wrapper.appendChild(card);
  zone.appendChild(wrapper);
}

async function openTaskDetail(id) {
  const overlay = document.getElementById("taskDetailOverlay");
  const content = document.getElementById("taskDetailContent");
  if (!overlay || !content) return;

  const task = await fetchSingleTask(id);
  content.innerHTML = taskDetailTemplate(id, task);

  document
    .getElementById("taskDetailClose")
    ?.addEventListener("click", closeTaskDetail, { once: true });
  overlay.addEventListener(
    "click",
    (e) => {
      if (e.target === overlay) closeTaskDetail();
    },
    { once: true }
  );

  document.getElementById("taskDelete")?.addEventListener("click", async () => {
    if (!confirm("Delete this task?")) return;
    await deleteTask(id);
    closeTaskDetail();
    await renderAllTasks();
  });

  document.getElementById("taskEdit")?.addEventListener("click", () => {
    closeTaskDetail();
    if (typeof openTaskOverlay === "function") {
      openTaskOverlay();
      if (typeof fillTaskFormFromExisting === "function") {
        fillTaskFormFromExisting(id, task);
      }
    }
  });

  content
    .querySelectorAll('input[type="checkbox"][data-sub-index]')
    .forEach((cb) => {
      cb.addEventListener("change", async (e) => {
        const idx = parseInt(e.target.dataset.subIndex, 10);
        await toggleSubtaskDone(id, idx, e.target.checked);
      });
    });

  document.addEventListener("keydown", onEscCloseOnce);
  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden", "false");
}

function closeTaskDetail() {
  const overlay = document.getElementById("taskDetailOverlay");
  if (!overlay) return;
  overlay.classList.remove("open");
  overlay.setAttribute("aria-hidden", "true");
  document.removeEventListener("keydown", onEscCloseOnce);
}

function onEscCloseOnce(e) {
  if (e.key === "Escape") closeTaskDetail();
}

function taskDetailTemplate(id, t = {}) {
  const title = escapeHtml(t.title || "");
  const desc = escapeHtml(t.description || "");
  const cat = escapeHtml(t.category || "Task");
  const date = escapeHtml(t.date || "-");
  const prio = (t.priority || "medium").toLowerCase(); // low | medium | urgent

  const assigned =
    (t.assignedContacts || [])
      .map(
        (n, i) => `
    <div class="task-assigned__item">
      <div class="av" style="background:${color(i)}">${initials(n)}</div>
      <div class="task-assigned__name">${escapeHtml(n)}</div>
    </div>
  `
      )
      .join("") ||
    `<div class="task-assigned__item" style="opacity:.6">No assignees</div>`;

  const subtasks =
    (t.subtasks || [])
      .map((s, i) => {
        const txt = typeof s === "string" ? s : s?.text || "";
        const done = typeof s === "object" ? !!s?.done : false;
        const idc = `subtask-${id}-${i}`;
        return `
      <label class="subtasks__item" for="${idc}">
        <input type="checkbox" id="${idc}" data-sub-index="${i}" ${
          done ? "checked" : ""
        }/>
        <span>${escapeHtml(txt)}</span>
      </label>
    `;
      })
      .join("") ||
    `<div class="subtasks__item" style="opacity:.6">No subtasks</div>`;

  return `
    <div class="task-detail" data-id="${id}">
      <span class="pill">${cat}</span>
      <h2 id="taskDetailTitle" class="task-detail__title">${title.replace(
        /\n/g,
        "<br>"
      )}</h2>

      ${desc ? `<p class="task-detail__desc">${desc}</p>` : ""}

      <dl class="task-meta">
        <dt>Due date</dt><dd>${date}</dd>
        <dt>Priority</dt>
        <dd><span class="priority priority--${prio}">
          <span class="priority-badge"></span>${
            prio.charAt(0).toUpperCase() + prio.slice(1)
          }
        </span></dd>
      </dl>

      <div class="task-assigned">
        <div class="section-title" style="font-weight:700;margin-bottom:6px;color:#6b7280">Assigned to:</div>
        <div class="task-assigned__list">${assigned}</div>
      </div>

      <div class="subtasks">
        <div class="section-title" style="font-weight:700;margin:14px 0 6px;color:#6b7280">Subtasks</div>
        <div class="subtasks__list">${subtasks}</div>
      </div>
    </div>

    <div class="task-actions">
  <button type="button" id="taskDelete" class="danger">
    <img class="icon" src="../assets/svg/delete.svg" alt="" aria-hidden="true" />
    <span>Delete</span>
  </button>
  <button type="button" id="taskEdit">
    <img class="icon" src="../assets/svg/edit_black.svg" alt="" aria-hidden="true" />
    <span>Edit</span>
  </button>
</div>
  `;
}

function renderInitials(names = []) {
  const html = names
    .map(
      (n, i) =>
        `<div class="av" style="background:${color(i)}">${initials(n)}</div>`
    )
    .join("");
  return `<div class="row"><div class="avatars">${html}</div></div>`;
}

const colors = [
  "#f44336",
  "#2196F3",
  "#FF9800",
  "#9C27B0",
  "#4CAF50",
  "#00BCD4",
  "#FFC107",
];
const color = (i) => colors[i % colors.length];
const initials = (n) =>
  (n || "")
    .trim()
    .split(/\s+/)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase();
const escapeHtml = (s) =>
  (s || "").replace(
    /[&<>"']/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        m
      ])
  );

function openTaskOverlay() {
  const ov = document.getElementById("taskOverlay");
  if (!ov) return;
  ov.classList.add("open");
  document.body.classList.add("modal-open");

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
  document
    .getElementById("openAddTask")
    ?.addEventListener("click", openTaskOverlay);
  document
    .querySelectorAll(".add-card-btn")
    .forEach((b) => b.addEventListener("click", openTaskOverlay));
  document
    .getElementById("closeTaskOverlay")
    ?.addEventListener("click", closeTaskOverlay);
  document
    .getElementById("cancelTask")
    ?.addEventListener("click", closeTaskOverlay);
  document.getElementById("taskOverlay")?.addEventListener("click", (e) => {
    if (e.target.id === "taskOverlay") closeTaskOverlay();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeTaskOverlay();
  });
});
