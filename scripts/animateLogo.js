(function () {
  const LOGO_KEY = "logoAnimated";

  function revealHidden() {
    document.querySelectorAll(".hidden").forEach((el) => el.classList.remove("hidden"));
    const loginScreen = document.querySelector("#loginScreen");
    if (loginScreen) loginScreen.classList.remove("d_none");
  }

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

  function animateLogo(startLogo, deltaX, deltaY, scale) {
    // 800ms before animation (like your original)
    setTimeout(() => {
      requestAnimationFrame(() => {
        startLogo.style.transform = `translate(-50%, -50%) translate(${deltaX}px, ${deltaY}px) scale(${scale})`;
      });
    }, 800);
  }

  function showHiddenElements(startLogo, onDone) {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      revealHidden();
      if (startLogo) {
        // fade out and remove like before
        startLogo.style.opacity = "0";
        setTimeout(() => startLogo.remove(), 400);
      }
      if (typeof onDone === "function") onDone();
    };

    if (!startLogo) {
      finish();
      return;
    }

    const onTransitionEnd = (e) => {
      // wait for transform to finish (guard in case other transitions fire)
      if (e.propertyName && e.propertyName !== "transform") return;
      finish();
    };

    startLogo.addEventListener("transitionend", onTransitionEnd, { once: true });

    // fallback if transitionend never fires
    setTimeout(finish, 2200);
  }

  function init() {
    const startLogo = document.querySelector(".startLogo");
    const targetLogo = document.querySelector(".logo img");

    // If required elements are missing, just reveal UI and bail out.
    if (!targetLogo) {
      revealHidden();
      if (startLogo) startLogo.remove();
      return;
    }

    // If we've already animated in this session, reveal UI and remove the start logo immediately
    if (sessionStorage.getItem(LOGO_KEY)) {
      revealHidden();
      if (startLogo) {
        // remove without animation to avoid flash
        startLogo.style.transition = "none";
        startLogo.style.opacity = "0";
        startLogo.remove();
      }
      return;
    }

    // If we get here, we should play the animation (first visit in this session)
    if (!startLogo) {
      // nothing to animate, just reveal
      revealHidden();
      sessionStorage.setItem(LOGO_KEY, "true");
      return;
    }

    // measure & animate
    const startRect = startLogo.getBoundingClientRect();
    const targetRect = targetLogo.getBoundingClientRect();

    // ensure the transform transition is set
    startLogo.style.transition = "transform 1.2s ease-in-out, opacity 0.4s ease";

    const { deltaX, deltaY, scale } = calculateTransform(startRect, targetRect);
    animateLogo(startLogo, deltaX, deltaY, scale);

    // when animation ends, reveal the rest and set the session flag
    showHiddenElements(startLogo, () => {
      sessionStorage.setItem(LOGO_KEY, "true");
    });
  }

  window.addEventListener("load", init);

  // pageshow handles bfcache/back-button restores
  window.addEventListener("pageshow", (e) => {
    // re-run init so we can remove the startLogo immediately when coming back
    init();
  });
})();
