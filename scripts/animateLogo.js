(function () {
  const LOGO_KEY = "logoAnimated";

  /** ========== DOM HELPERS ========== */

  /**
   * Reveals all elements that were hidden at startup,
   * including the login screen.
   * @returns {void}
   */
  function revealHidden() {
    document.querySelectorAll(".hidden").forEach((el) => el.classList.remove("hidden"));
    const loginScreen = document.querySelector("#loginScreen");
    if (loginScreen) loginScreen.classList.remove("d_none");
  }

  /**
   * Fades in the header and login screen elements.
   * @returns {void}
   */
  function fadeInElements() {
    const header = document.querySelector(".indexHeader");
    const loginScreen = document.querySelector("#loginScreen");
    [header, loginScreen].forEach(fadeInElement);
  }

  /**
   * Applies fade-in animation to a single element.
   * @param {HTMLElement|null} el - The DOM element to fade in.
   * @returns {void}
   */
  function fadeInElement(el) {
    if (!el) return;
    el.classList.remove("hidden", "d_none");
    el.classList.add("fade-in");
    setTimeout(() => el.classList.add("visible"), 50);
  }

  /**
   * Makes both desktop and mobile logos visible.
   * @returns {void}
   */
  function unlockLogos() {
    document.querySelectorAll(".logo img, .mobileLogo img").forEach((el) => {
      el.style.visibility = "visible";
    });
  }

  /**
   * Hides all splash-related elements (desktop, mobile, overlay).
   * @returns {void}
   */
  function hideAllSplash() {
    [".startLogo", ".startLogoMobile", ".startLogoMobileBg"].forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) el.classList.add("d_none");
    });
  }

  /** ========== ANIMATION HELPERS ========== */

  /**
   * Calculates translation and scaling values to transform
   * the splash logo into the target logo position.
   * @param {DOMRect} startRect - Bounding box of the splash logo.
   * @param {DOMRect} targetRect - Bounding box of the final logo.
   * @returns {{deltaX: number, deltaY: number, scale: number}}
   */
  function calculateTransform(startRect, targetRect) {
    const startCenterX = startRect.left + startRect.width / 2;
    const startCenterY = startRect.top + startRect.height / 2;
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    const deltaX = targetCenterX - startCenterX;
    const deltaY = targetCenterY - startCenterY;
    const scale = targetRect.width / startRect.width;
    return { deltaX, deltaY, scale };
  }

  /**
   * Applies the transform animation to the splash logo.
   * @param {HTMLElement} startLogo - The splash logo element.
   * @param {number} deltaX - Horizontal movement in px.
   * @param {number} deltaY - Vertical movement in px.
   * @param {number} scale - Scale factor for resizing.
   * @returns {void}
   */
  function animateLogo(startLogo, deltaX, deltaY, scale) {
    requestAnimationFrame(() => {
      startLogo.style.transform = `translate(-50%, -50%) translate(${deltaX}px, ${deltaY}px) scale(${scale})`;
    });
  }

  /** ========== SPLASH HANDLING ========== */

  /**
   * Finalizes splash animation: reveals hidden content,
   * unlocks logos, fades out splash, and sets session flag.
   * @param {HTMLElement|null} startLogo - The splash logo.
   * @param {Function} [onDone] - Callback executed after completion.
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
   * Waits for splash logo animation to complete,
   * then triggers finalization.
   * @param {HTMLElement|null} startLogo - The splash logo element.
   * @param {Function} [onDone] - Callback after completion.
   * @returns {void}
   */
  function showHiddenElements(startLogo, onDone) {
    let finished = false;
    const finish = () => {
      if (!finished) {
        finished = true;
        finishSplash(startLogo, onDone);
      }
    };

    if (!startLogo) return finish();

    startLogo.addEventListener(
      "transitionend",
      (e) => {
        if (!e.propertyName || e.propertyName === "transform") finish();
      },
      { once: true }
    );

    setTimeout(finish, 2200); // fallback if no transition
  }

  /** ========== MAIN ANIMATION FLOW ========== */

  /**
   * Runs the splash sequence with delays, transitions,
   * and mobile-specific overlay handling.
   * @param {HTMLElement} startLogo - The splash logo element.
   * @param {HTMLElement} finalLogo - The target logo element.
   * @param {HTMLElement|null} overlay - Mobile overlay element.
   * @param {boolean} isMobile - True if mobile layout is active.
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

  /**
   * Handles fading out the mobile overlay
   * and swapping splash logo asset.
   * @param {HTMLElement} startLogo - The mobile splash logo.
   * @param {HTMLElement} overlay - Mobile overlay background.
   * @returns {void}
   */
  function handleMobileOverlay(startLogo, overlay) {
    overlay.classList.add("fade-out");
    setTimeout(() => overlay.classList.add("d_none"), 450);
    setTimeout(() => (startLogo.src = "./assets/svg/join_logo_small.svg"), 200);
  }

  /**
   * Entry point for splash animation logic.
   * Decides whether to run splash or skip it
   * based on device type and sessionStorage flag.
   * @returns {void}
   */
  function startAnimation() {
    const isMobile = window.matchMedia("(max-width: 496px)").matches;
    const startLogo = document.querySelector(isMobile ? ".startLogoMobile" : ".startLogo");
    const finalLogo = document.querySelector(isMobile ? ".mobileLogo img" : ".logo img");
    const overlay = isMobile ? document.querySelector(".startLogoMobileBg") : null;

    if (!startLogo || !finalLogo) return revealHidden(), hideAllSplash();

    if (sessionStorage.getItem(LOGO_KEY)) {
      revealHidden();
      hideAllSplash();
      unlockLogos();
      return;
    }

    runSplash(startLogo, finalLogo, overlay, isMobile);
  }

  /** ========== INIT ========== */

  /**
   * Initializes splash animation
   * when the page is shown or restored from cache.
   */
  window.addEventListener("pageshow", startAnimation);
})();
