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
  return `
    <div class="row">
      <div class="avatars">${avatars}${more}</div>
      <div class="priority-slot">${prioIcon || ""}</div>
    </div>
  `;
}

/**
 * Builds the HTML for a task card (board view).
 * Includes category pill, description, subtask progress, and avatars.
 * @param {Object} t - Task object.
 * @param {number} percent - Percent completed of subtasks.
 * @param {number} doneCount - Completed subtasks count.
 * @param {number} total - Total subtasks count.
 * @returns {string} HTML markup for task card.
 */
function taskCardInnerHtml(t, percent, doneCount, total) {
  return `
  <img onclick="swapState(event)" class="swapHoriz" src="../assets/svg/swap_horiz.svg" alt="Pfeil nach Oben und Nach unten">
    <span class="pill ${t?.category?.toLowerCase?.().includes("tech") ? "tech" : "user"}">
      ${escapeHtml(t?.category)}
    </span>
    <div class="task-title">${escapeHtml(t?.title || "")}</div>
    <div class="task-desc">${escapeHtml(t?.description || "")}</div>
    ${
      total
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

  const assigned =
    (t.assignedContacts || [])
      .map(
        (n) => `
      <div class="task-assigned__item">
        <div class="av" style="background-color:${colorForName(n)}">${initials(n)}</div>
        <h6 class="task-assigned__name">${escapeHtml(n)}</h6>
      </div>`
      )
      .join("") || `<div class="task-assigned__item" style="opacity:.6">No assignees</div>`;

  const subtasks =
    (t.subtasks || [])
      .map((s, i) => {
        const txt = typeof s === "string" ? s : s?.text || "";
        const done = typeof s === "object" ? !!s?.done : false;
        const idc = `subtask-${id}-${i}`;
        return `
        <label class="subtasks__item" for="${idc}">
          <input type="checkbox" id="${idc}" data-sub-index="${i}" ${done ? "checked" : ""}/>
          <div class="cb cb--unchecked" aria-hidden="true"></div>
          <div class="cb cb--checked" aria-hidden="true"></div>
          <span class="txt">${escapeHtml(txt)}</span>
        </label>`;
      })
      .join("") || `<div class="subtasks__item" style="opacity:.6">No subtasks</div>`;

  return `
    <div class="task-detail" data-id="${id}">
      <span class="pill ${t?.category?.toLowerCase?.().includes("tech") ? "tech" : "user"}">${cat}</span>
      <h1 id="taskDetailTitle" class="task-detail__title">${title.replace(/\n/g, "<br>")}</h1>

      ${desc ? `<h6 class="task-detail__desc">${desc}</h6>` : ""}

      <dl class="task-meta">
        <dt><h6>Due date:</h6></dt><dd><h6>${date}</h6></dd>
        <dt><h6>Priority:</h6></dt><dd>${getPriorityBadge(t.priority)}</dd>
      </dl>
      <div class="task-assigned">
        <h6 class="section-title">Assigned to:</h6></div>
        <div class="task-assigned__list task-name">${assigned}</div>
      </div>
      <div class="subtasks">
        <h6div class="section-title"><h6>Subtasks</h6></div>
        <div class="subtasks__list">${subtasks}</div>
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

/**
 * Returns HTML for the “Move To” swap menu template.
 * Used in the task card swap (state change) overlay.
 * @returns {string} HTML markup for the swap menu.
 */
function getSwapTemplate() {
  return `
         <ul class="swapMenu" id="swapMenu">
            <li class="swapMenuHeading">Move To</li>
            <div class="menuStates">
              <li>To-do</li>
              <li>In Progress</li>
              <li>Await Feedback</li>
              <li>Done</li>
            </div>
          </ul>
  `;
}

/**
 * Global assignments for backward compatibility.
 * Ensures existing code using window references continues to work.
 * @type {void}
 */
window.taskCardInnerHtml = taskCardInnerHtml;
window.taskDetailTemplate = taskDetailTemplate;
window.getSwapTemplate = getSwapTemplate;
window.renderAvatarsWithPriority = renderAvatarsWithPriority;
