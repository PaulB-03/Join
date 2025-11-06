/**
 * Renders avatar bubbles with background colors and a priority icon.
 * @param {string[]} [names=[]] - Array of assigned contact names.
 * @param {string} prio - Priority level (e.g. "urgent", "medium", "low").
 * @returns {string} HTML markup for avatar row and priority icon.
 */
function renderAvatarsWithPriority(names = [], prio) {
  const MAX_AVATARS = 3;
  const shown = names.slice(0, MAX_AVATARS);
  const extra = names.length - shown.length;
  const avatars = shown.map((n) => `<div class="av" style="background-color:${colorForName(n)}">${initials(n)}</div>`).join("");
  const more = extra > 0 ? `<div class="av more">+${extra}</div>` : "";
  const prioIcon = getPriorityIcon(prio);
  return avatarRowTemplate(avatars, more, prioIcon);
}

/**
 * Creates the HTML for the task detail overlay view.
 * Displays all metadata, assignees, subtasks, and action buttons.
 * @param {string} id - Task ID.
 * @param {Object} [t={}] - Task data object.
 * @returns {string} HTML markup for the task detail overlay.
 */
function taskDetailTemplate(id, t = {}) {
  const title = escapeHtml(t.title);
  const desc = escapeHtml(t.description || "");
  const cat = escapeHtml(t.category);
  const date = formatDate(t.date);
  const assigned = (t.assignedContacts || []).map((n) => taskAssignedItemTemplate(n)).join("") || `<div class="task-assigned__item" style="opacity:.6">No assignees</div>`;
  const subtasks =
    (t.subtasks || [])
      .map((s, i) => {
        const txt = typeof s === "string" ? s : s?.text || "";
        const done = typeof s === "object" ? !!s?.done : false;
        const idc = `subtask-${id}-${i}`;
        subtasksItemTemplate(idc, i, done, txt);
      })
      .join("") || `<div class="subtasks__item" style="opacity:.6">No subtasks</div>`;
  taskDetailTemplate(id, t, cat, title, desc, date, assigned, subtasks);
}

/**
 * Briefly highlights a newly created task card if the current URL contains ?newTask=ID.
 * @returns {void}
 */
function highlightNewTask() {
  const id = new URLSearchParams(location.search).get("newTask");
  /** @type {HTMLElement|null} */
  const el = id && document.querySelector(`.task-container[data-id="${id}"]`);
  if (!el) return;
  el.classList.add("highlight");
  setTimeout(() => el.classList.remove("highlight"), 2000);
}

/**
 * Updates the "empty state" message in a given dropzone column.
 * Displays a "No tasks ..." message if there are no task cards.
 * @param {HTMLElement} zone - The dropzone element representing a board column.
 * @returns {void}
 */
function updateEmptyState(zone) {
  if (!zone) return;
  const hasTask = zone.querySelector(".task-container");
  const empty = zone.querySelector(".empty");
  if (!hasTask && !empty) {
    const title = zone.previousElementSibling?.textContent?.trim() || "";
    zone.innerHTML = `<div class="empty">No tasks ${title}</div>`;
  } else if (hasTask && empty) {
    empty.remove();
  }
}

/**
 * Updates the empty state for all dropzones on the board.
 * Ensures each column shows the "No tasks ..." placeholder when empty.
 * @returns {void}
 */
function updateAllEmptyStates() {
  document.querySelectorAll(".dropzone").forEach(updateEmptyState);
}

/**
 * Clears all board columns and displays their corresponding empty state messages.
 * @returns {void}
 */
function clearColumns() {
  document.querySelectorAll(".dropzone").forEach((z) => {
    const title = z.previousElementSibling?.textContent?.trim() || "";
    z.innerHTML = `<div class="empty">No tasks ${title}</div>`;
  });
}

/**
 * Global assignments for backward compatibility.
 * Ensures existing code using window references continues to work.
 * @type {void}
 */
taskCardInnerHtml = taskCardInnerHtml;
taskDetailTemplate = taskDetailTemplate;
getSwapTemplate = getSwapTemplate;
renderAvatarsWithPriority = renderAvatarsWithPriority;
