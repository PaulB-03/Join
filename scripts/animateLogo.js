window.addEventListener("load", () => {
  const startLogo = document.querySelector(".startLogo");
  const targetLogo = document.querySelector(".logo img");
  if (!startLogo || !targetLogo) return;
  // Position und Größe messen
  const startRect = startLogo.getBoundingClientRect();
  const targetRect = targetLogo.getBoundingClientRect();
  // Logo bleibt mittig (durch CSS geregelt)
  // wir setzen nur Transition sicherheitshalber
  startLogo.style.transition = "transform 1.2s ease-in-out, opacity 0.4s ease";
  // Bewegung berechnen und Animation starten
  const { deltaX, deltaY, scale } = calculateTransform(startRect, targetRect);
  animateLogo(startLogo, deltaX, deltaY, scale);
  showHiddenElements(startLogo);
});

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
  // 2 Sekunden warten, dann animieren
  setTimeout(() => {
    requestAnimationFrame(() => {
      startLogo.style.transform = `translate(-50%, -50%) translate(${deltaX}px, ${deltaY}px) scale(${scale})`;
    });
  }, 2000);
}

function showHiddenElements(startLogo) {
  startLogo.addEventListener("transitionend", (e) => {
    if (e.propertyName !== "transform") return; // Nach der Animation → Inhalte anzeigen
    document.querySelectorAll(".hidden").forEach((el) => el.classList.remove("hidden")); // alle .hidden entfernen
    const loginScreen = document.querySelector("#loginScreen");
    if (loginScreen) loginScreen.classList.remove("d_none"); // loginScreen sichtbar machen
    startLogo.style.opacity = "0";
    setTimeout(() => startLogo.remove(), 400); // Startlogo ausfaden und entfernen
  });
}
