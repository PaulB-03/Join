function normalizePrio(prio) {
  const p = String(prio || "").toLowerCase();
  if (p.startsWith("urg")) return "urgent";
  if (p.startsWith("med")) return "medium";
  if (p.startsWith("low")) return "low";
  return "medium"; //
}

// Macht aus der Priorität ein "schönes Label", also erstes Zeichen groß.
// Beispiel: "urgent" → "Urgent"
function getPriorityLabel(prio) {
  const p = normalizePrio(prio);
  return p.charAt(0).toUpperCase() + p.slice(1);
}

// Formatiert ein Datum ins Format "TT/MM/JJJJ".
// Akzeptiert sowohl echte Date-Objekte als auch Text wie "2023-10-02".
function formatDate(value) {
  if (!value) return "-";
  let d;
  if (value instanceof Date) d = value;             // Fall 1: schon ein Date-Objekt
  else if (/^\d{4}-\d{2}-\d{2}/.test(value)) {      // Fall 2: yyyy-mm-dd
    const [y, m, dd] = value.split("-").map(Number);
    d = new Date(y, m - 1, dd);
  } else {                                          // Fall 3: etwas anderes
    d = new Date(value);
    if (Number.isNaN(+d)) return escapeHtml(String(value));
  }
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// Einheitliche Farbquelle: delegiere immer an standardFunctions.js → colorForName
function bgForNameOrIndex(name, i) {
  if (typeof window !== "undefined" && typeof window.colorForName === "function") {
    return window.colorForName(name || "");
  }
  return "#999";
}

// Gibt Icon für die Priorität zurück.
function getPriorityIcon(prio) {
  switch ((prio || "").toLowerCase()) {
    case "urgent": return `<img src="../assets/svg/double_arrow_red.svg" alt="Urgent" class="priority-icon" />`;
    case "medium": return `<img src="../assets/svg/double_lines.svg" alt="Medium" class="priority-icon" />`;
    case "low": return `<img src="../assets/svg/double_arrow_down.svg" alt="Low" class="priority-icon" />`;
    default: return "";
  }
}

// Baut ein "Badge" (Label mit Text + Icon) für die Priorität.
// Beispiel: "Urgent" → zeigt "Urgent" + roter Pfeil.
function getPriorityBadge(prio) {
  const p = normalizePrio(prio);
  const label = getPriorityLabel(p);
  let icon = "";
  switch (p) {
    case "urgent": icon = `<img src="../assets/svg/double_arrow_red.svg" alt="${label}" class="priority-icon" />`; break;
    case "medium": icon = `<img src="../assets/svg/double_lines.svg" alt="${label}" class="priority-icon" />`; break;
    case "low": icon = `<img src="../assets/svg/double_arrow_down.svg" alt="${label}" class="priority-icon" />`; break;
  }
  return `<span class="priority"><span class="priority-text">${label}</span>${icon}</span>`;
}

// Baut eine Reihe aus Avataren + dem Icon der Priorität.
function renderAvatarsWithPriority(names = [], prio) {
  const avatars = names
    .map((n, i) => `<div class="av" style="background:${bgForNameOrIndex(n, i)}">${initials(n)}</div>`)
    .join("");
  const prioIcon = getPriorityIcon(prio);
  return `
    <div class="row">
      <div class="avatars">${avatars}</div>
      <div class="priority-slot">${prioIcon || ""}</div>
    </div>
  `;
}


function taskCardInnerHtml(t, percent, doneCount, total) {
  return `
  <img onclick="swapState(event)" class="swapHoriz" src="../assets/svg/swap_horiz.svg" alt="Pfeil nach Oben und Nach unten">
    <span class="pill ${t?.category?.toLowerCase?.().includes("tech") ? "tech" : "user"}">
      ${escapeHtml(t?.category || "")}
    </span>
    <div class="task-title">${escapeHtml(t?.title || "")}</div>
    <div class="task-desc">${escapeHtml(t?.description || "")}</div>

    ${total
      ? `
      <div class="meta-container">
        <div class="progress">
          <div class="bar" style="width:${percent}%"></div>
        </div>
        <div class="meta">
          <span>${doneCount}/${total} Subtasks</span>
          <span></span>
        </div>
      </div>
    `
      : `
      <div class="meta-container">
        <div class="meta"><span></span><span></span></div>
      </div>
    `
    }

    ${renderAvatarsWithPriority(t?.assignedContacts || [], t?.priority)}
  `;
}

function taskDetailTemplate(id, t = {}) {
  const title = escapeHtml(t.title || "");
  const desc = escapeHtml(t.description || "");
  const cat = escapeHtml(t.category || "Task");
  const date = formatDate(t.date || "-");

  const assigned =
    (t.assignedContacts || [])
      .map((n, i) => `
      <div class="task-assigned__item">
        <div class="av" style="background:${(window.colorForName && window.colorForName(n)) || bgForNameOrIndex(n, i)}">${initials(n)}</div>
        <div class="task-assigned__name">${escapeHtml(n)}</div>
      </div>`)
      .join("") ||
    `<div class="task-assigned__item" style="opacity:.6">No assignees</div>`;

  const subtasks =
    (t.subtasks || [])
      .map((s, i) => {
        const txt = typeof s === "string" ? s : (s?.text || "");
        const done = typeof s === "object" ? !!s?.done : false;
        const idc = `subtask-${id}-${i}`;
        return `
        <label class="subtasks__item" for="${idc}">
          <input type="checkbox" id="${idc}" data-sub-index="${i}" ${done ? "checked" : ""}/>
          <span class="cb cb--unchecked" aria-hidden="true"></span>
          <img class="cb cb--checked" src="../assets/svg/checked.svg" alt="" aria-hidden="true" />
          <span class="txt">${escapeHtml(txt)}</span>
        </label>`;
      })
      .join("") ||
    `<div class="subtasks__item" style="opacity:.6">No subtasks</div>`;

  return `
    <div class="task-detail" data-id="${id}">
      <span class="pill">${cat}</span>
      <h2 id="taskDetailTitle" class="task-detail__title">${title.replace(/\n/g, "<br>")}</h2>

      ${desc ? `<p class="task-detail__desc">${desc}</p>` : ""}

      <dl class="task-meta">
        <dt>Due date</dt><dd>${date}</dd>
        <dt>Priority</dt><dd>${getPriorityBadge(t.priority)}</dd>
      </dl>

      <div class="task-assigned">
        <div class="section-title">Assigned to:</div>
        <div class="task-assigned__list task-name">${assigned}</div>
      </div>

      <div class="subtasks">
        <div class="section-title">Subtasks</div>
        <div class="subtasks__list task-name">${subtasks}</div>
      </div>

      <div class="task-actions">
        <button type="button" id="taskDelete" class="danger">
          <img class="icon" src="../assets/svg/subdelete.svg" alt="" aria-hidden="true" />
          <span>Delete</span>
        </button>
      <div class="task-divider"></div>
        <button type="button" id="taskEdit" class="primary">
          <img class="icon" src="../assets/svg/subedit.svg" alt="" aria-hidden="true" />
          <span>Edit</span>
        </button>
   </div>

  `;
}

function swapState(event) {
  event.stopPropagation();
  let id = event.target.closest('article').getAttribute('data-id');
  let taskForMenu = document.querySelectorAll(`[data-id=${id}]`);
  if (document.getElementsByClassName('swapMenu')) {
    closeSwapMenu()
  }
  taskForMenu[1].innerHTML += getSwapTemplate()
  addEventlistenerOnSwapMenu(id)
}

function checkSwapMenu() {
  let body = document.getElementById('body')
  body.addEventListener("click", closeSwapMenu);
}

function addEventlistenerOnSwapMenu(id) {
  let swapMenu = document.getElementById('swapMenu')
  let toDo = document.getElementById('swapMenu').getElementsByTagName('li')[1]
  let inProgress = document.getElementById('swapMenu').getElementsByTagName('li')[2]
  let awaitFeedback = document.getElementById('swapMenu').getElementsByTagName('li')[3]
  let done = document.getElementById('swapMenu').getElementsByTagName('li')[4]
  swapMenu.addEventListener("click", swapMenuLinks)
  toDo.addEventListener("mousedown", () => addInState(id, event, "toDo"))
  inProgress.addEventListener("mousedown", () => addInState(id, event, "in progress"))
  awaitFeedback.addEventListener("mousedown", () => addInState(id, event, "await feedback"))
  done.addEventListener("mousedown", () => addInState(id, event, "done"))
}

function swapMenuLinks(event) {
  event.stopPropagation();
}

async function addInState(id, event, state) {
  event.stopPropagation();
  await updateTaskState(id, state)
  init()
  closeSwapMenu()
  console.log("addInProgress");
}

function closeSwapMenu() {
  if (document.getElementById('swapMenu')) {
    let swapMenu = document.getElementById('swapMenu')
    swapMenu.remove()
  }
}

function getSwapTemplate() {
  return `
         <ul class="swapMenu" id="swapMenu">
            <li class"swapMenuHeading">Move To</li>
            <div class="menuStates">
              <li>To-do</li>
              <li>In Progress</li>
              <li>Await Feedback</li>
              <li>Done</li>
            </div>
          </ul>
          `
}