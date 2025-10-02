function vp() { return document.getElementById("boardViewport"); }
function cols() { return Array.from(document.querySelectorAll("#board .column")); }

function colWidth() {
  const c = cols()[0]; 
  return c ? c.getBoundingClientRect().width + 14 : vp().clientWidth;
}

function currentIndex() {
  const w = colWidth(), x = vp().scrollLeft;
  return Math.round(x / w);
}

function scrollToIndex(i) {
  const w = colWidth(), max = Math.max(cols().length - 1, 0);
  vp().scrollTo({ left: Math.min(Math.max(i,0), max) * w, behavior: "smooth" });
}

function initBoardSlider() {
  const nav = document.getElementById("boardSliderNav");
  if (!vp() || !nav) return;
  const isMobile = () => matchMedia("(max-width:920px)").matches;
  const toggle = () => nav.style.display = isMobile() ? "flex" : "none";
  document.getElementById("prevCol").onclick = () => scrollToIndex(currentIndex() - 1);
  document.getElementById("nextCol").onclick = () => scrollToIndex(currentIndex() + 1);
  addEventListener("resize", toggle, { passive: true }); toggle();
}

function enableTouchDrag() {
  const v = vp(); if (!v) return;
  const isInteractive = (el) =>
    !!el.closest('.card, .task-container, .add-card-btn, button, a, input, textarea, select');
  let active = false, pid = 0, sx = 0, sl = 0, dragging = false;
  const THRESHOLD = 6;

  v.addEventListener('pointerdown', e => {
    if (e.button !== 0 || isInteractive(e.target)) return; 
    active = true; pid = e.pointerId; sx = e.clientX; sl = v.scrollLeft; dragging = false;
  });

  v.addEventListener('pointermove', e => {
    if (!active || e.pointerId !== pid) return;
    const dx = e.clientX - sx;
    if (!dragging && Math.abs(dx) < THRESHOLD) return;    
    if (!dragging) { dragging = true; v.setPointerCapture(pid); }
    v.scrollLeft = sl - dx;
  });

  const end = (e) => {
    if (!active || (pid && e.pointerId !== pid)) return;
    active = false;
    if (dragging) { try { v.releasePointerCapture(pid); } catch {}
      dragging = false;
    }
  };
  v.addEventListener('pointerup', end);
  v.addEventListener('pointercancel', end);
}


document.addEventListener("DOMContentLoaded", () => {
  init();
  bindOverlayButtons();
  mountSubtaskCheckboxListener();
  mountDatePickerMinToday();
  initBoardSlider();
  enableTouchDrag(); 
});
