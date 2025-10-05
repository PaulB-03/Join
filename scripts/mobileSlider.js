// ===============================
// Mobile Board Slider – stabil & anfängerfreundlich
// ===============================

/** Sichtbaren Board-Viewport holen (#boardViewport) */
function getBoardViewport() {
  return document.getElementById("boardViewport");
}

/** Alle Board-Spalten (#board .column) als Array */
function getBoardColumns() {
  return Array.from(document.querySelectorAll("#board .column"));
}

/**
 * Effektive Slot-Breite je Spalte berechnen:
 * - Breite der ersten Spalte
 * - plus tatsächlicher CSS-Gap (column-gap/gap) des #board-Containers
 * Fallback: Viewport-Breite, wenn keine Spalten existieren
 */
function getColumnSlotWidth() {
  const viewport = getBoardViewport();
  const cols = getBoardColumns();
  const first = cols[0];

  if (!viewport) return 0;
  if (!first) return viewport.clientWidth;

  const boardEl = document.getElementById("board");
  const cs = boardEl ? getComputedStyle(boardEl) : null;

  // column-gap/gap sicher lesen, Fallback 0
  const gap =
    cs && (parseFloat(cs.columnGap) || parseFloat(cs.gap)) || 0;

  const w = first.getBoundingClientRect().width;
  return w + (isFinite(gap) ? gap : 0);
}

/** Aktuell „angepeilte“ Spalte anhand scrollLeft bestimmen (gerundet) */
function getCurrentColumnIndex() {
  const viewport = getBoardViewport();
  if (!viewport) return 0;
  const slot = getColumnSlotWidth();
  if (!slot) return 0;
  return Math.round(viewport.scrollLeft / slot);
}

/** Sanft zur gewünschten Spalte scrollen (Index wird eingegrenzt) */
function scrollToColumn(index) {
  const viewport = getBoardViewport();
  const cols = getBoardColumns();
  if (!viewport || cols.length === 0) return;

  const slot = getColumnSlotWidth();
  if (!slot) return;

  const max = cols.length - 1;
  const safe = Math.min(Math.max(index, 0), max);

  viewport.scrollTo({
    left: safe * slot,
    behavior: "smooth",
  });
}

/** Pfeil-Navigation (‹ ›) für Mobile initialisieren und Sichtbarkeit steuern */
function initBoardSlider() {
  const viewport = getBoardViewport();
  const nav = document.getElementById("boardSliderNav");
  if (!viewport || !nav) return; // Kein Board? Nichts tun.

  const isMobile = () => matchMedia("(max-width:920px)").matches;
  const toggleArrows = () => { nav.style.display = isMobile() ? "flex" : "none"; };

  const prev = document.getElementById("prevCol");
  const next = document.getElementById("nextCol");

  if (prev) prev.onclick = () => scrollToColumn(getCurrentColumnIndex() - 1);
  if (next) next.onclick = () => scrollToColumn(getCurrentColumnIndex() + 1);

  addEventListener("resize", toggleArrows, { passive: true });
  toggleArrows(); // Startzustand prüfen
}

/**
 * Drag/Swipe-Scrollen aktivieren (Pointer Events):
 * - blockiert Interaktion nicht (Buttons etc. bleiben klickbar)
 * - Schwellwert gegen versehentliche Mini-Bewegungen
 * - Pointer Capture + preventDefault() während Drag
 */
function enableTouchScroll() {
  const viewport = getBoardViewport();
  if (!viewport) return;

  // Elemente, auf denen NICHT gescrollt, sondern interagiert werden soll
  const isInteractiveElement = (el) =>
    !!el.closest('.card, .board .task-container, .add-card-btn, button, a, input, textarea, select');

  let isPressed = false;
  let pointerId = 0;
  let startX = 0;
  let startScrollLeft = 0;
  let isDragging = false;

  const DRAG_THRESHOLD = 6; // ab hier „echtes“ Ziehen

  viewport.addEventListener("pointerdown", (e) => {
    // Nur primäre Taste (linke Maus / Finger) und nicht auf Controls
    if (e.button !== 0 || isInteractiveElement(e.target)) return;

    isPressed = true;
    pointerId = e.pointerId;
    startX = e.clientX;
    startScrollLeft = viewport.scrollLeft;
    isDragging = false;

    // Ab jetzt alle Pointer-Events an den Viewport binden
    viewport.setPointerCapture(pointerId);
  });

  viewport.addEventListener("pointermove", (e) => {
    if (!isPressed || e.pointerId !== pointerId) return;

    const dx = e.clientX - startX;

    // Erst ab Schwelle als Drag interpretieren
    if (!isDragging && Math.abs(dx) < DRAG_THRESHOLD) return;

    // Jetzt wirklich Drag
    if (!isDragging) {
      isDragging = true;
    }

    // Browser-Geste unterdrücken, solange wir selber scrollen
    e.preventDefault();

    // Scroll entsprechend Fingerbewegung
    viewport.scrollLeft = startScrollLeft - dx;
  });

  const endDrag = (e) => {
    if (!isPressed || (pointerId && e.pointerId !== pointerId)) return;

    isPressed = false;
    isDragging = false;

    try { viewport.releasePointerCapture(pointerId); } catch {}
  };

  viewport.addEventListener("pointerup", endDrag);
  viewport.addEventListener("pointercancel", endDrag);
}

/** Beim DOM-Ready initialisieren – aber nur, wenn ein Board vorhanden ist */
document.addEventListener("DOMContentLoaded", () => {
  const hasBoard = !!document.getElementById("boardViewport");
  if (!hasBoard) return;

  // Projektweite Initialisierung (aus deinen anderen Skripten)
  if (typeof init === "function") init();
  if (typeof bindOverlayButtons === "function") bindOverlayButtons();
  if (typeof mountSubtaskCheckboxListener === "function") mountSubtaskCheckboxListener();
  if (typeof mountDatePickerMinToday === "function") mountDatePickerMinToday();

  // Unser Slider & Drag
  initBoardSlider();
  enableTouchScroll();
});
