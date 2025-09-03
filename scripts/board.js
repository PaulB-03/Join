document.addEventListener("DOMContentLoaded", () => {
  initDragAndDrop();
  loadBoardFromLocalStorage();
});

const STORAGE_KEY = "join.boardState";

let draggedTaskCard = null;
let sourceColumn = null;

function initDragAndDrop() {
  const allColumns = document.querySelectorAll(".dropzone");
  const allTaskCards = document.querySelectorAll(".card");

  allTaskCards.forEach((taskCard) => {
    taskCard.setAttribute("draggable", "true");
    taskCard.addEventListener("dragstart", onTaskDragStart);
    taskCard.addEventListener("dragend", onTaskDragEnd);
  });

  allColumns.forEach((column) => {
    column.addEventListener("dragover", onColumnDragOver);
    column.addEventListener("dragleave", onColumnDragLeave);
    column.addEventListener("drop", onColumnDrop);
  });
}

function onTaskDragStart(e) {
  draggedTaskCard = e.currentTarget;
  sourceColumn = draggedTaskCard.closest(".dropzone");

  e.dataTransfer.effectAllowed = "move";
  try {
    e.dataTransfer.setData("text/plain", draggedTaskCard.dataset.id || "");
  } catch {}

  draggedTaskCard.classList.add("is-dragging");
}

function onTaskDragEnd() {
  if (draggedTaskCard) draggedTaskCard.classList.remove("is-dragging");
  document
    .querySelectorAll(".dropzone")
    .forEach((col) => col.classList.remove("is-over"));

  draggedTaskCard = null;
  sourceColumn = null;
}

function onColumnDragOver(e) {
  if (!draggedTaskCard) return;
  e.preventDefault();

  this.classList.add("is-over");

  const elementAfter = getTaskAfterMousePosition(this, e.clientY);
  if (elementAfter == null) {
    this.appendChild(draggedTaskCard);
  } else {
    this.insertBefore(draggedTaskCard, elementAfter);
  }
}

function onColumnDragLeave() {
  this.classList.remove("is-over");
}

function onColumnDrop(e) {
  e.preventDefault();
  this.classList.remove("is-over");
  if (!draggedTaskCard) return;

  const elementAfter = getTaskAfterMousePosition(this, e.clientY);
  if (elementAfter == null) {
    this.appendChild(draggedTaskCard);
  } else {
    this.insertBefore(draggedTaskCard, elementAfter);
  }

  saveBoardToLocalStorage();
}

function getTaskAfterMousePosition(container, mouseY) {
  const otherCards = [...container.querySelectorAll(".card:not(.is-dragging)")];
  let closest = { offset: Number.NEGATIVE_INFINITY, element: null };

  for (const card of otherCards) {
    const box = card.getBoundingClientRect();
    const offset = mouseY - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      closest = { offset, element: card };
    }
  }
  return closest.element;
}

/* ---------------- Speicher-Funktionen ---------------- */

function saveBoardToLocalStorage() {
  const boardState = {};
  document.querySelectorAll(".dropzone").forEach((column) => {
    const columnId = column.id || "unknown";
    boardState[columnId] = [...column.querySelectorAll(".card")].map(
      (card) => ({
        id: card.dataset.id || null,
        html: card.outerHTML,
      })
    );
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(boardState));
}

function loadBoardFromLocalStorage() {
  const savedState = localStorage.getItem(STORAGE_KEY);
  if (!savedState) return;

  try {
    const boardState = JSON.parse(savedState);
    Object.entries(boardState).forEach(([columnId, cards]) => {
      const column = document.getElementById(columnId);
      if (!column) return;

      column.innerHTML = "";
      cards.forEach((card) => {
        column.insertAdjacentHTML("beforeend", card.html);
      });
    });

    initDragAndDrop();
  } catch (err) {
    console.error("Fehler beim Laden des Boards:", err);
  }
}
