/** Currently dragged card (container). */
let dragged = null;
/** Placeholder element while dragging. */
let placeholder = null;

/**
 * Initializes Drag & Drop functionality only once.
 * Prevents re-binding duplicate listeners.
 * @returns {void}
 */
function initDnd() {
  if (window.__dndInitialized) return;
  window.__dndInitialized = true;
  makePlaceholder();
  bindGlobalDrag();
  bindColumns();
}

/**
 * Creates a placeholder element to show during dragging.
 * @returns {void}
 */
function makePlaceholder() {
  placeholder = document.createElement("div");
  placeholder.className = "task-placeholder";
}

/**
 * Binds global dragstart and dragend event listeners.
 * @returns {void}
 */
function bindGlobalDrag() {
  document.addEventListener("dragstart", onDragStart);
  document.addEventListener("dragend", onDragEnd);
}

/**
 * Creates a custom drag image used during dragging.
 * @param {HTMLElement} box - The element being dragged.
 * @returns {HTMLElement} clone - The cloned element used as drag image.
 */
function createDragImage(box) {
  const clone = box.cloneNode(true);
  clone.style.transform = "rotate(5deg)";
  clone.style.opacity = "1";
  clone.style.position = "absolute";
  clone.style.top = "-9999px";
  clone.style.pointerEvents = "none";
  clone.style.width = `${box.offsetWidth}px`;
  document.body.appendChild(clone);
  return clone;
}

/**
 * Triggered on drag start: sets styles, placeholder size, and drag data.
 * @param {DragEvent} e
 * @returns {void}
 */
function onDragStart(e) {
  const box = e.target.closest(".task-container");
  if (!box) return;
  dragged = box;

  box.classList.add("is-dragging");
  box.querySelector(".card")?.classList.add("is-dragging");

  const clone = createDragImage(box);
  e.dataTransfer.setDragImage(clone, clone.offsetWidth / 2, clone.offsetHeight / 2);
  e.dataTransfer?.setData("text/plain", box.dataset.id || "");

  placeholder.style.height = `${box.offsetHeight}px`;
  placeholder.style.width = `${box.offsetWidth}px`;
}

/**
 * Triggered on drag end: cleans up all drag-related styles and resets state.
 * @param {DragEvent} e
 * @returns {void}
 */
function onDragEnd(e) {
  const box = e.target.closest(".task-container");
  if (!box) return;
  box.classList.remove("is-dragging");
  box.querySelector(".card")?.classList.remove("is-dragging");
  document.querySelectorAll(".dropzone.is-over").forEach((z) => z.classList.remove("is-over"));
  placeholder.remove();
  dragged = null;
}

/**
 * Binds dragover, dragleave, and drop events to all task columns.
 * Ensures each column only binds once.
 * @returns {void}
 */
function bindColumns() {
  document.querySelectorAll(".dropzone").forEach((zone) => {
    if (zone.__bound) return;
    zone.addEventListener("dragover", (ev) => onDragOver(ev, zone));
    zone.addEventListener("dragleave", () => zone.classList.remove("is-over"));
    zone.addEventListener("drop", (ev) => onDrop(ev, zone));
    zone.__bound = true;
  });
}

/**
 * Automatically scrolls a dropzone when dragging near edges.
 * @param {HTMLElement} zone - The dropzone element.
 * @param {number} clientY - Current mouse Y position.
 * @returns {void}
 */
function autoScroll(zone, clientY) {
  const r = zone.getBoundingClientRect(),
    thr = 24;
  if (clientY < r.top + thr) zone.scrollTop -= 10;
  else if (clientY > r.bottom - thr) zone.scrollTop += 10;
}

/**
 * Handles dragover event: positions placeholder and manages styling.
 * @param {DragEvent} e
 * @param {HTMLElement} zone
 * @returns {void}
 */
function onDragOver(e, zone) {
  if (!dragged) return;
  e.preventDefault();
  zone.classList.add("is-over");
  if (!zone.contains(placeholder)) zone.appendChild(placeholder);
  autoScroll(zone, e.clientY);
  insertPlaceholder(zone, e.clientY);
}

/**
 * Inserts the dragged card at the placeholder’s current position.
 * @param {HTMLElement} zone
 * @param {number} mouseY
 * @returns {void}
 */
function insertDraggedInto(zone, mouseY) {
  insertPlaceholder(zone, mouseY);
  placeholder.replaceWith(dragged);
}

/**
 * Saves updated task state to Firebase and refreshes UI.
 * @param {string} id - Task ID.
 * @param {HTMLElement} zone - Target dropzone.
 * @returns {Promise<void>}
 */
async function persistDragState(id, zone) {
  await updateTaskState(id, COL_TO_STATE[zone.id]);
  updateEmptyState(zone);
}

/**
 * Handles the drop event: moves element, persists state, and reverts on error.
 * @param {DragEvent} e
 * @param {HTMLElement} zone
 * @returns {Promise<void>}
 */
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

/**
 * Calculates where to insert the placeholder within a dropzone.
 * @param {HTMLElement} container - Dropzone element.
 * @param {number} mouseY - Mouse Y position.
 * @returns {void}
 */
function insertPlaceholder(container, mouseY) {
  const items = [...container.querySelectorAll(".task-container:not(.is-dragging)")];
  if (!container.contains(placeholder)) container.appendChild(placeholder);
  const target = items.reduce(
    (acc, el) => {
      const box = el.getBoundingClientRect();
      const off = mouseY - box.top - box.height / 2;
      return off < 0 && off > acc.offset ? { offset: off, el } : acc;
    },
    { offset: -Infinity, el: null }
  ).el;
  target ? container.insertBefore(placeholder, target) : container.appendChild(placeholder);
}
