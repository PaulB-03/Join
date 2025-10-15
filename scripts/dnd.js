let dragged = null;       // currently dragged card (container)
let placeholder = null;   // placeholder while dragging

// Initialize Drag & Drop only once
function initDnd() {
  if (window.__dndInitialized) return;
  window.__dndInitialized = true;
  makePlaceholder();
  bindGlobalDrag();
  bindColumns();
}

// Create the placeholder element
function makePlaceholder() {
  placeholder = document.createElement("div");
  placeholder.className = "task-placeholder";
}

// Bind global drag start/end listeners
function bindGlobalDrag() {
  document.addEventListener("dragstart", onDragStart);
  document.addEventListener("dragend", onDragEnd);
}

// On start: remember dragged card and add styles
function onDragStart(e) {
  const box = e.target.closest(".task-container");
  if (!box) return;
  dragged = box;
  box.classList.add("is-dragging");
  box.querySelector(".card")?.classList.add("is-dragging");
  e.dataTransfer?.setData("text/plain", box.dataset.id || "");
}

// On end: clear styles and reset state
function onDragEnd(e) {
  const box = e.target.closest(".task-container");
  if (!box) return;
  box.classList.remove("is-dragging");
  box.querySelector(".card")?.classList.remove("is-dragging");
  document.querySelectorAll(".dropzone.is-over").forEach((z) => z.classList.remove("is-over"));
  placeholder.remove();
  dragged = null;
}

// Prepare drop zones (dragover, drop, leave)
function bindColumns() {
  document.querySelectorAll(".dropzone").forEach((zone) => {
    if (zone.__bound) return;
    zone.addEventListener("dragover", (ev) => onDragOver(ev, zone));
    zone.addEventListener("dragleave", () => zone.classList.remove("is-over"));
    zone.addEventListener("drop", (ev) => onDrop(ev, zone));
    zone.__bound = true;
  });
}

// Gentle autoscroll near top/bottom edges of the column
function autoScroll(zone, clientY) {
  const r = zone.getBoundingClientRect(),
    thr = 24;
  if (clientY < r.top + thr) zone.scrollTop -= 10;
  else if (clientY > r.bottom - thr) zone.scrollTop += 10;
}

// While dragging: position placeholder accordingly
function onDragOver(e, zone) {
  if (!dragged) return;
  e.preventDefault();
  zone.classList.add("is-over");
  if (!zone.contains(placeholder)) zone.appendChild(placeholder);
  autoScroll(zone, e.clientY);
  insertPlaceholder(zone, e.clientY);
}

// Replace placeholder with the dragged card
function insertDraggedInto(zone, mouseY) {
  insertPlaceholder(zone, mouseY);
  placeholder.replaceWith(dragged);
}

// After drop: save state to RTDB and update empty states
async function persistDragState(id, zone) {
  await updateTaskState(id, COL_TO_STATE[zone.id]);
  updateEmptyState(zone);
}

// Drop handler: move, persist, and revert on error
async function onDrop(e, zone) {
  e.preventDefault();
  zone.classList.remove("is-over");
  if (!dragged) return;
  const prev = dragged.parentElement;
  insertDraggedInto(zone, e.clientY);
  try {
    await persistDragState(dragged.dataset.id, zone);
    updateEmptyState(prev);
  } catch (err) {
    console.error(err);
    prev.appendChild(dragged);
    updateEmptyState(prev);
    updateEmptyState(zone);
  }
}

// Compute placeholder position inside a column
function insertPlaceholder(container, mouseY) {
  const items = [...container.querySelectorAll(".task-container:not(.is-dragging)")];
  if (!container.contains(placeholder)) container.appendChild(placeholder);
  const target = items.reduce(
    (acc, el) => {
      const box = el.getBoundingClientRect();
      const off = mouseY - box.top - box.height / 2;
      return off < 0 && off > acc.offset ? { offset: off, el } : acc;},
    { offset: -Infinity, el: null }
  ).el;
  target ? container.insertBefore(placeholder, target) : container.appendChild(placeholder);
}
