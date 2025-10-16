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
  if (value instanceof Date) d = value; // Fall 1: schon ein Date-Objekt
  else if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    // Fall 2: yyyy-mm-dd
    const [y, m, dd] = value.split("-").map(Number);
    d = new Date(y, m - 1, dd);
  } else {
    // Fall 3: etwas anderes
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
    case "urgent":
      return `<img src="../assets/svg/double_arrow_red.svg" alt="Urgent" class="priority-icon" />`;
    case "medium":
      return `<img src="../assets/svg/double_lines.svg" alt="Medium" class="priority-icon" />`;
    case "low":
      return `<img src="../assets/svg/double_arrow_down.svg" alt="Low" class="priority-icon" />`;
    default:
      return "";
  }
}

// Baut ein "Badge" (Label mit Text + Icon) für die Priorität.
// Beispiel: "Urgent" → zeigt "Urgent" + roter Pfeil.
function getPriorityBadge(prio) {
  const p = normalizePrio(prio);
  const label = getPriorityLabel(p);
  let icon = "";
  switch (p) {
    case "urgent":
      icon = `<img src="../assets/svg/double_arrow_red.svg" alt="${label}" class="priority-icon" />`;
      break;
    case "medium":
      icon = `<img src="../assets/svg/double_lines.svg" alt="${label}" class="priority-icon" />`;
      break;
    case "low":
      icon = `<img src="../assets/svg/double_arrow_down.svg" alt="${label}" class="priority-icon" />`;
      break;
  }
  return `<span class="priority"><h6 class="priority-text">${label}</h6>${icon}</span>`;
}

function swapState(event) {
  event.stopPropagation();
  let id = event.target.closest("article").getAttribute("data-id");
  let taskForMenu = document.querySelectorAll(`[data-id=${id}]`);
  if (document.getElementsByClassName("swapMenu")) {
    closeSwapMenu();
  }
  taskForMenu[1].innerHTML += getSwapTemplate();
  addEventlistenerOnSwapMenu(id);
}

function checkSwapMenu() {
  let body = document.getElementById("body");
  body.addEventListener("click", closeSwapMenu);
}

function addEventlistenerOnSwapMenu(id) {
  let swapMenu = document.getElementById("swapMenu");
  let toDo = document.getElementById("swapMenu").getElementsByTagName("li")[1];
  let inProgress = document.getElementById("swapMenu").getElementsByTagName("li")[2];
  let awaitFeedback = document.getElementById("swapMenu").getElementsByTagName("li")[3];
  let done = document.getElementById("swapMenu").getElementsByTagName("li")[4];
  swapMenu.addEventListener("click", swapMenuLinks);
  toDo.addEventListener("mousedown", () => addInState(id, event, "toDo"));
  inProgress.addEventListener("mousedown", () => addInState(id, event, "in progress"));
  awaitFeedback.addEventListener("mousedown", () => addInState(id, event, "await feedback"));
  done.addEventListener("mousedown", () => addInState(id, event, "done"));
}

function swapMenuLinks(event) {
  event.stopPropagation();
}

async function addInState(id, event, state) {
  event.stopPropagation();
  await updateTaskState(id, state);
  init();
  closeSwapMenu();
  console.log("addInProgress");
}

function closeSwapMenu() {
  if (document.getElementById("swapMenu")) {
    let swapMenu = document.getElementById("swapMenu");
    swapMenu.remove();
  }
}
