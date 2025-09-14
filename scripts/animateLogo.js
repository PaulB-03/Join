(function () {
  const LOGO_KEY = "logoAnimated";

  function revealHidden() {
    document.querySelectorAll(".hidden").forEach((el) => el.classList.remove("hidden"));
    const loginScreen = document.querySelector("#loginScreen");
    if (loginScreen) loginScreen.classList.remove("d_none");
  }

  function fadeInElements() {
    const header = document.querySelector(".indexHeader");
    const loginScreen = document.querySelector("#loginScreen");

    [header, loginScreen].forEach((el) => {
      if (!el) return;
      el.classList.add("fade-in");
      setTimeout(() => el.classList.add("visible"), 50);
    });
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
    requestAnimationFrame(() => {
      startLogo.style.transform = `translate(-50%, -50%) translate(${deltaX}px, ${deltaY}px) scale(${scale})`;
    });
  }

  function showHiddenElements(startLogo, finalLogo, onDone) {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;

      revealHidden();

      // Show final logo
      if (finalLogo) finalLogo.style.visibility = "visible";

      if (startLogo) {
        startLogo.style.opacity = "0";
        setTimeout(() => startLogo.classList.add("d_none"), 400);
      }

      if (typeof onDone === "function") onDone();
    };

    if (!startLogo) {
      finish();
      return;
    }

    const onTransitionEnd = (e) => {
      if (e.propertyName && e.propertyName !== "transform") return;
      finish();
    };

    startLogo.addEventListener("transitionend", onTransitionEnd, { once: true });

    // fallback if transitionend never fires
    setTimeout(finish, 2200);
  }

  function hideAllSplash() {
    const desktopLogo = document.querySelector(".startLogo");
    const mobileLogo = document.querySelector(".startLogoMobile");
    const mobileBg = document.querySelector(".startLogoMobileBg");

    if (desktopLogo) desktopLogo.classList.add("d_none");
    if (mobileLogo) mobileLogo.classList.add("d_none");
    if (mobileBg) mobileBg.classList.add("d_none");
  }

  function startAnimation() {
    const isMobile = window.matchMedia("(max-width: 496px)").matches;

    const startLogo = isMobile ? document.querySelector(".startLogoMobile") : document.querySelector(".startLogo");
    const finalLogo = isMobile ? document.querySelector(".mobileLogo img") : document.querySelector(".logo img");
    const overlay = isMobile ? document.querySelector(".startLogoMobileBg") : null;

    if (!startLogo || !finalLogo) {
      revealHidden();
      hideAllSplash();
      return;
    }

    if (sessionStorage.getItem(LOGO_KEY)) {
      revealHidden();
      hideAllSplash();
      finalLogo.style.visibility = "visible";
      return;
    }

    // delay 1000ms
    setTimeout(() => {
      // Fade in header and login screen
      const header = document.querySelector(".indexHeader");
      const loginScreen = document.querySelector("#loginScreen");
      [header, loginScreen].forEach((el) => {
        if (!el) return;
        el.classList.remove("hidden", "d_none");
        el.classList.add("fade-in");
        setTimeout(() => el.classList.add("visible"), 50);
      });

      const startRect = startLogo.getBoundingClientRect();
      const targetRect = finalLogo.getBoundingClientRect();
      startLogo.style.transition = "transform 1.2s ease-in-out, opacity 0.4s ease";

      const { deltaX, deltaY, scale } = calculateTransform(startRect, targetRect);
      animateLogo(startLogo, deltaX, deltaY, scale);

      if (isMobile && overlay) {
        overlay.classList.add("fade-out");
        setTimeout(() => overlay.classList.add("d_none"), 450);
        setTimeout(() => (startLogo.src = "./assets/svg/join_logo_small.svg"), 600);
      }

      // Reveal target logo **after start logo animation**
      showHiddenElements(startLogo, finalLogo, () => {
        hideAllSplash();
        if (finalLogo) finalLogo.style.visibility = "visible"; // reveal here
        sessionStorage.setItem(LOGO_KEY, "true");
      });
    }, 1000);
  }

  window.addEventListener("load", startAnimation);
  window.addEventListener("pageshow", startAnimation);

  window.matchMedia("(max-width: 496px)").addEventListener("change", () => {
    if (!sessionStorage.getItem(LOGO_KEY)) startAnimation();
  });
})();
