function escapeHtml(s) {
    return (s || "").replace(/[&<>"']/g, (m) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]
    ));
  }
  
  function normalizePrio(prio) {
    const p = String(prio || "").toLowerCase();
    if (p.startsWith("urg")) return "urgent";
    if (p.startsWith("med")) return "medium";
    if (p.startsWith("low")) return "low";
    return "medium"; //
  }
  
  // Macht aus der Priorität ein "schönes Label", also erstes Zeichen groß.
  // Beispiel: "urgent" → "Urgent"
  function getPriorityLabel(prio) {
    const p = normalizePrio(prio);
    return p.charAt(0).toUpperCase() + p.slice(1);
  }
  
  // Formatiert ein Datum ins Format "TT/MM/JJJJ".
  // Akzeptiert sowohl echte Date-Objekte als auch Text wie "2023-10-02".
  function formatDate(value) {
    if (!value) return "-";
    let d;
    if (value instanceof Date) d = value;             // Fall 1: schon ein Date-Objekt
    else if (/^\d{4}-\d{2}-\d{2}/.test(value)) {      // Fall 2: yyyy-mm-dd
      const [y, m, dd] = value.split("-").map(Number);
      d = new Date(y, m - 1, dd);
    } else {                                          // Fall 3: etwas anderes
      d = new Date(value);
      if (Number.isNaN(+d)) return escapeHtml(String(value));
    }
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  
  // Einheitliche Farbquelle: delegiere immer an standardFunctions.js → colorForName
  function bgForNameOrIndex(name, i) {
    if (typeof window !== "undefined" && typeof window.colorForName === "function") {
      return window.colorForName(name || "");
    }
    return "#999";
  }
  
  // Gibt ein kleines Icon für die Priorität zurück.
  // Urgent = roter Pfeil nach oben, Medium = Doppellinien, Low = grüner Pfeil nach unten.
  function getPriorityIcon(prio) {
    switch ((prio || "").toLowerCase()) {
      case "urgent": return `<img src="../assets/svg/double_arrow_red.svg" alt="Urgent" class="priority-icon" />`;
      case "medium": return `<img src="../assets/svg/double_lines.svg" alt="Medium" class="priority-icon" />`;
      case "low":    return `<img src="../assets/svg/double_arrow_down.svg" alt="Low" class="priority-icon" />`;
      default:       return "";
    }
  }
  
  // Baut ein "Badge" (Label mit Text + Icon) für die Priorität.
  // Beispiel: "Urgent" → zeigt "Urgent" + roter Pfeil.
  function getPriorityBadge(prio) {
    const p = normalizePrio(prio);
    const label = getPriorityLabel(p);
    let icon = "";
    switch (p) {
      case "urgent": icon = `<img src="../assets/svg/double_arrow_red.svg" alt="${label}" class="priority-icon" />`; break;
      case "medium": icon = `<img src="../assets/svg/double_lines.svg" alt="${label}" class="priority-icon" />`; break;
      case "low":    icon = `<img src="../assets/svg/double_arrow_down.svg" alt="${label}" class="priority-icon" />`; break;
    }
    return `<span class="priority"><span class="priority-text">${label}</span>${icon}</span>`;
  }
  
  // Baut eine Reihe aus Avataren + dem Icon der Priorität.
  // Also: links Kreise für Nutzer, rechts Symbol für Priorität.
  function renderAvatarsWithPriority(names = [], prio) {
    const avatars = names
      .map((n, i) => `<div class="av" style="background:${bgForNameOrIndex(n, i)}">${initials(n)}</div>`)
      .join("");
    const prioIcon = getPriorityIcon(prio);
    return `
      <div class="row">
        <div class="avatars">${avatars}</div>
        <div class="priority-slot">${prioIcon || ""}</div>
      </div>
    `;
  }
  