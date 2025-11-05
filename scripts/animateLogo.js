/**
 * @fileoverview Handles splash screen animation, logo transitions,
 * and page reveal for both desktop and mobile views.
 */

const LOGO_KEY = "logoAnimated";

/* ─────────────── Visibility Control ─────────────── */

/**
 * Reveals hidden elements and shows the login screen.
 * @returns {void}
 */
function revealHidden() {
  document.querySelectorAll(".hidden").forEach((el) => el.classList.remove("hidden"));
  const loginScreen = document.querySelector("#loginScreen");
  if (loginScreen) loginScreen.classList.remove("d_none");
}

/**
 * Hides all splash-related elements (desktop, mobile, and overlays).
 * @returns {void}
 */
function hideAllSplash() {
  [".startLogo", ".startLogoMobile", ".startLogoMobileBg"].forEach((sel) => {
    const el = document.querySelector(sel);
    if (el) el.classList.add("d_none");
  });
}

/**
 * Makes all logo images visible on the page.
 * @returns {void}
 */
function unlockLogos() {
  document.querySelectorAll(".logo img, .mobileLogo img").forEach((el) => {
    el.style.visibility = "visible";
  });
}

/* ─────────────── Fade & Animation ─────────────── */

/**
 * Fades in key page elements like header and login screen.
 * @returns {void}
 */
function fadeInElements() {
  const header = document.querySelector(".indexHeader");
  const loginScreen = document.querySelector("#loginScreen");
  [header, loginScreen].forEach(fadeInElement);
}

/**
 * Applies a fade-in transition to an element.
 * @param {HTMLElement|null} el - The element to animate.
 * @returns {void}
 */
function fadeInElement(el) {
  if (!el) return;
  el.classList.remove("hidden", "d_none");
  el.classList.add("fade-in");
  setTimeout(() => el.classList.add("visible"), 50);
}

/**
 * Calculates translation and scaling values
 * between two bounding boxes for smooth animation.
 * @param {DOMRect} startRect - Starting element bounding box.
 * @param {DOMRect} targetRect - Target element bounding box.
 * @returns {{deltaX: number, deltaY: number, scale: number}}
 */
function calculateTransform(startRect, targetRect) {
  const startCenterX = startRect.left + startRect.width / 2;
  const startCenterY = startRect.top + startRect.height / 2;
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;
  return {
    deltaX: targetCenterX - startCenterX,
    deltaY: targetCenterY - startCenterY,
    scale: targetRect.width / startRect.width,
  };
}

/**
 * Animates logo transformation using calculated deltas.
 * @param {HTMLElement} startLogo - The starting splash logo element.
 * @param {number} deltaX - Horizontal translation in pixels.
 * @param {number} deltaY - Vertical translation in pixels.
 * @param {number} scale - Scaling factor for logo size.
 * @returns {void}
 */
function animateLogo(startLogo, deltaX, deltaY, scale) {
  requestAnimationFrame(() => {
    startLogo.style.transform = `translate(-50%, -50%) translate(${deltaX}px, ${deltaY}px) scale(${scale})`;
  });
}

/* ─────────────── Splash Finish Logic ─────────────── */

/**
 * Completes splash animation, hides logos, and sets session flag.
 * @param {HTMLElement|null} startLogo - The splash logo element.
 * @param {Function} [onDone] - Optional callback executed after completion.
 * @returns {void}
 */
function finishSplash(startLogo, onDone) {
  revealHidden();
  unlockLogos();
  if (startLogo) {
    startLogo.style.opacity = "0";
    setTimeout(() => startLogo.classList.add("d_none"), 400);
  }
  sessionStorage.setItem(LOGO_KEY, "true");
  if (typeof onDone === "function") onDone();
}

/**
 * Ensures splash finalization runs only once.
 * @param {boolean} finished - Whether splash is already finalized.
 * @param {HTMLElement|null} startLogo - The splash logo element.
 * @param {Function} [onDone] - Callback after finalization.
 * @returns {boolean} Updated finished state.
 */
function triggerSplashFinish(finished, startLogo, onDone) {
  if (!finished) {
    finishSplash(startLogo, onDone);
    return true;
  }
  return finished;
}

/**
 * Waits for a CSS transition or timeout before calling the handler.
 * @param {HTMLElement|null} startLogo - Element being animated.
 * @param {Function} onFinish - Callback when transition completes.
 * @param {number} [timeout=2200] - Fallback timeout in milliseconds.
 * @returns {void}
 */
function waitForTransitionOrTimeout(startLogo, onFinish, timeout = 2200) {
  if (!startLogo) return onFinish();
  startLogo.addEventListener(
    "transitionend",
    (e) => {
      if (!e.propertyName || e.propertyName === "transform") onFinish();
    },
    { once: true }
  );
  setTimeout(onFinish, timeout);
}

/**
 * Waits for logo animation to complete, then reveals the page.
 * @param {HTMLElement|null} startLogo - Splash logo element.
 * @param {Function} [onDone] - Callback after splash completion.
 * @returns {void}
 */
function showHiddenElements(startLogo, onDone) {
  let finished = false;
  const handleFinish = () => {
    finished = triggerSplashFinish(finished, startLogo, onDone);
  };
  waitForTransitionOrTimeout(startLogo, handleFinish);
}

/* ─────────────── Mobile Overlay ─────────────── */

/**
 * Fades out mobile overlay and swaps splash logo.
 * @param {HTMLElement} startLogo - Mobile splash logo element.
 * @param {HTMLElement} overlay - Background overlay element.
 * @returns {void}
 */
function handleMobileOverlay(startLogo, overlay) {
  overlay.classList.add("fade-out");
  setTimeout(() => overlay.classList.add("d_none"), 450);
  setTimeout(() => (startLogo.src = "./assets/svg/join_logo_small.svg"), 200);
}

/* ─────────────── Main Splash Logic ─────────────── */

/**
 * Runs splash sequence with logo animation and transitions.
 * @param {HTMLElement} startLogo - Splash logo element.
 * @param {HTMLElement} finalLogo - Target logo element.
 * @param {HTMLElement|null} overlay - Optional mobile overlay.
 * @param {boolean} isMobile - Whether device is mobile-sized.
 * @returns {void}
 */
function runSplash(startLogo, finalLogo, overlay, isMobile) {
  setTimeout(() => {
    fadeInElements();
    const startRect = startLogo.getBoundingClientRect();
    const targetRect = finalLogo.getBoundingClientRect();
    startLogo.style.transition = "transform 0.7s ease-in-out, opacity 0.1s ease";
    const { deltaX, deltaY, scale } = calculateTransform(startRect, targetRect);
    animateLogo(startLogo, deltaX, deltaY, scale);
    if (isMobile && overlay) handleMobileOverlay(startLogo, overlay);
    showHiddenElements(startLogo, () => {
      hideAllSplash();
      unlockLogos();
    });
  }, 1000);
}

/* ─────────────── Entry Point ─────────────── */

/**
 * Initializes splash animation depending on device and session state.
 * @returns {void}
 */
function startAnimation() {
  const isMobile = window.matchMedia("(max-width: 496px)").matches;
  const startLogo = document.querySelector(isMobile ? ".startLogoMobile" : ".startLogo");
  const finalLogo = document.querySelector(isMobile ? ".mobileLogo img" : ".logo img");
  const overlay = isMobile ? document.querySelector(".startLogoMobileBg") : null;

  if (!startLogo || !finalLogo) {
    revealHidden();
    hideAllSplash();
    return;
  }

  if (sessionStorage.getItem(LOGO_KEY)) {
    revealHidden();
    hideAllSplash();
    unlockLogos();
    return;
  }

  runSplash(startLogo, finalLogo, overlay, isMobile);
}

/**
 * Binds splash initialization to browser page load or cache restore.
 */
window.addEventListener("pageshow", startAnimation);
