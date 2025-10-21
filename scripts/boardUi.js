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
   * (Optional) Returns the correct dropzone element for a given task state.
   * Uses the global STATE_TO_COL mapping (from board.js) and defaults to "todo" if missing.
   * @param {{state?: string}} t - The task object containing a state property.
   * @returns {HTMLElement} The dropzone element that corresponds to the task state.
   */
  function getZoneForTask(t) {
    const colId = (typeof STATE_TO_COL !== "undefined" && STATE_TO_COL[t?.state]) || "todo";
    return document.getElementById(colId);
  }