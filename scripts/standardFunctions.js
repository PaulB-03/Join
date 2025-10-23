(() => {
  /* ------------------------------ Config -------------------------------- */
  const DB = (typeof baseURL !== "undefined" && baseURL) || "https://join-1323-default-rtdb.europe-west1.firebasedatabase.app/";
  const COLOR_VARS = ["--contact-bg-blue","--contact-bg-light-blue","--contact-bg-light-green","--contact-bg-purple","--contact-bg-lilac","--contact-bg-green","--contact-bg-pink","--contact-bg-red","--contact-bg-rose","--contact-bg-peach","--contact-bg-orange","--contact-bg-light-orange","--contact-bg-dark-yellow","--contact-bg-medium-yellow","--contact-bg-yellow"];

  /* ------------------------------ DOM Utils ----------------------------- */
  /** @param {string} id @returns {HTMLElement|null} */
  const $id = (id) => document.getElementById(id);
  /** @param {string} s @param {ParentNode} r */
  const $qs = (s, r = document) => r.querySelector(s);
  /** @param {string} s @param {ParentNode} r */
  const $qsa = (s, r = document) => Array.from(r.querySelectorAll(s));
  /** @param {Element} el @param {string} ev @param {Function} fn @param {AddEventListenerOptions|boolean} [opt] */
  const on = (el, ev, fn, opt) => el && el.addEventListener(ev, fn, opt);
  /** @param {Element} el @param {string} t */
  const setText = (el, t) => el && (el.textContent = t);
  /** @param {Element} el @param {string} h */
  const setHTML = (el, h) => el && (el.innerHTML = h);
  /** @param {Element} el @param {string} d */
  const show = (el, d = "block") => el && (el.style.display = d);
  /** @param {Element} el */
  const hide = (el) => el && (el.style.display = "none");

  /* ------------------------------ HTTP Utils ---------------------------- */
  /** @param {string} path */
  async function getJSON(path) {
    const r = await fetch(DB + path);
    if (!r.ok) throw new Error(`GET ${path} -> ${r.status}`);
    return r.json();
  }
  /** @param {string} path @param {any} body */
  async function postJSON(path, body) {
    const r = await fetch(DB + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`POST ${path} -> ${r.status}`);
    return r.json();
  }
  /** @param {string} path @param {any} body */
  async function patchJSON(path, body) {
    const r = await fetch(DB + path, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`PATCH ${path} -> ${r.status}`);
    return r.json();
  }

  /* ------------------------------ Colors/Initials ----------------------- */
  /** @param {string} name */
  function initials(name = "") {
    const p = name.trim().split(/\s+/), f = p[0]?.[0] || "", l = p.length > 1 ? p.at(-1)[0] : "";
    return (f + l).toUpperCase();
  }
  /** @param {string} name */
  function colorForName(name = "") {
    const sum = [...name.trim().toLowerCase()].reduce((a, c) => a + c.codePointAt(0), 0);
    return `var(${COLOR_VARS[sum % COLOR_VARS.length]})`;
  }

  /* ------------------------------ Tasks API ----------------------------- */
  /** @returns {Promise<Object|null>} */
  async function getTasks() {
    try { return (await getJSON("tasks.json")) || {}; }
    catch (e) { console.error("Could not get tasks:", e); return null; }
  }
  /** @param {string} path @param {any} data */
  async function saveTask(path, data) { return postJSON(path + ".json", data); }

  /* ------------------------------ Layout Refs --------------------------- */
  /** Cache DOM boxes for spacing control. */
  function ensureLayoutRefs() {
    if (!window.__subtasksBox) {
      const sb = $id("subtasks");
      window.__subtasksBox = sb;
      window.__subtasksStyles = { marginTop: sb?.style.marginTop || "24px", paddingBottom: sb?.style.paddingBottom || "50px" };
    }
    if (!window.__categoryBox) {
      const cb = $id("category");
      window.__categoryBox = cb;
      window.__categoryStyles = { marginTop: cb?.style.marginTop || "24px" };
    }
  }
  /** Reset moved boxes to their original spacing. */
  window.resetSubtasksSpacing = function resetSubtasksSpacing() {
    ensureLayoutRefs();
    const sb = window.__subtasksBox, ss = window.__subtasksStyles, cb = window.__categoryBox, cs = window.__categoryStyles;
    if (sb && ss) { sb.style.marginTop = ss.marginTop; sb.style.paddingBottom = ss.paddingBottom; }
    if (cb && cs) cb.style.marginTop = cs.marginTop;
  }

  /* ------------------------------ Category Dropdown --------------------- */
  /** Initialize category dropdown (compact). */
  function initCategoryDropdown() {
    const dd = $id("assignedToDropdownCategory"), arrow = $id("dropdown-arrow-subtasks"), list = $id("dropdown-list-category");
    if (!dd || !arrow || !list) return;
    let open = false;
    on(dd, "click", (ev) => { ev.stopPropagation(); open = !open; dd.classList.toggle("open", open); arrow.style.transform = open ? "translateY(-50%) rotate(180deg)" : "translateY(-50%) rotate(0deg)"; if (open) adjustForDropdown(list); if (!open) resetSubtasksSpacing(); });
    $qsa(".dropdown-item-category", list).forEach((item, i) => on(item, "click", (ev) => { ev.stopPropagation(); selectCategory(i); close(); }));
    on(document, "click", () => open && close());
    function close(){ dd.classList.remove("open"); arrow.style.transform = "translateY(-50%) rotate(0deg)"; open=false; resetSubtasksSpacing(); }
    function adjustForDropdown(l){ ensureLayoutRefs(); const sb = window.__subtasksBox; if (sb) { sb.style.marginTop = l.offsetHeight + 16 + "px"; sb.style.paddingBottom = "50px"; } }
  }
  /** @param {number} index */
  function selectCategory(index) {
    const cats = ["Userstory", "Technical Task"], dd = $id("assignedToDropdownCategory"), ph = $id("categoryPlaceholder");
    window.selectedCategory = cats[index]; setText(ph, window.selectedCategory); dd?.classList.add("selected-red"); resetSubtasksSpacing();
  }

  /* ------------------------------ Contacts Dropdown Core ---------------- */
  /** Generic dropdown behavior. */
  function dropdownFunction(arrow, dropDown, select, items, onSelect) {
    let open = false;
    on(select, "click", (ev) => { ev.stopPropagation(); open = !open; dropDown.style.display = open ? "block" : "none"; arrow.style.transform = open ? "translateY(-50%) rotate(180deg)" : "translateY(-50%) rotate(0deg)"; });
    Array.from(items).forEach((it) => on(it, "click", (ev) => { ev.stopPropagation(); open=false; dropDown.style.display="none"; arrow.style.transform="translateY(-50%) rotate(0deg)"; onSelect&&onSelect(it); }));
    on(document, "click", () => { if (!open) return; open=false; dropDown.style.display="none"; arrow.style.transform="translateY(-50%) rotate(0deg)"; });
  }
  /** Keep selected names readable in the trigger. */
  function updateDropdownText() {
    const span = $qs("#assignedToDropdownContacts .dropdown-selected span");
    if (!span) return;
    const names = Array.isArray(window.assignedContacts) ? [...window.assignedContacts] : [];
    if (!names.length) return (span.textContent = "Select contacts");
    let out = []; for (let i = 0; i < names.length; i++) { out.push(names[i]); span.textContent = out.join(", "); if (span.scrollWidth > span.clientWidth) { out.pop(); break; } }
    span.textContent = out.join(", ");
  }
  /** Visual highlight of selected items. */
  function updateDropdownHighlight() {
    const dd = $id("dropdown-list-contacts"); if (!dd) return;
    $qsa("label.dropdown-checkbox", dd).forEach((label) => {
      const name = $qs("span.contact-name", label)?.textContent?.trim() || "";
      const img = $qs("img.checkbox-svg", label); const sel = window.assignedContacts?.includes(name);
      const item = label.closest(".dropdown-item-contact");
      if (img) { img.src = sel ? "../assets/svg/checked.svg" : "../assets/svg/check_button.svg"; img.classList.toggle("checked", sel); }
      label.style.color = sel ? "white" : ""; item && item.classList.toggle("selected", sel);
    });
  }
  /** Background of trigger if any selected. */
  function updateDropdownBackground(dropdownId) {
    const d = $id(dropdownId); if (!d) return;
    const checked = d.querySelectorAll("img[src*='checked.svg']").length > 0;
    d.classList.toggle("selected", checked);
  }

  /* ------------------------------ Contacts: Assign ---------------------- */
  /** @param {string} name Toggle selection and keep layout steady. */
  function toggleContact(name) {
    const list = Array.isArray(window.assignedContacts) ? window.assignedContacts : (window.assignedContacts = []);
    const i = list.indexOf(name); i >= 0 ? list.splice(i, 1) : list.push(name);
    const dd = $id("assignedToDropdownContacts"), isOpen = dd && dd.classList.contains("open"); ensureLayoutRefs();
    const before = isOpen && window.__categoryBox ? window.__categoryBox.offsetTop : 0;
    updateDropdownText(); renderAssignedContacts(); updateDropdownHighlight(); updateDropdownBackground("assignedToDropdownContacts");
    if (isOpen && window.__categoryBox) { const delta = window.__categoryBox.offsetTop - before; const cur = parseFloat(window.__categoryBox.style.marginTop) || parseFloat(getComputedStyle(window.__categoryBox).marginTop) || 0; window.__categoryBox.style.marginTop = Math.max(0, cur - delta) + "px"; }
  }
  /** Render up to 3 initials (+counter). */
  function renderAssignedContacts() {
    const box = $id("assignedToInitials"); if (!box) return; setHTML(box, "");
    const names = Array.isArray(window.assignedContacts) ? window.assignedContacts : []; if (!names.length) return hide(box);
    show(box, "flex"); const max = Math.min(names.length, 3);
    for (let i = 0; i < max; i++) { const s = document.createElement("span"); s.className = "contact-initial"; s.textContent = initials(names[i]); s.style.backgroundColor = colorForName(names[i]); box.appendChild(s); }
    if (names.length > 3) { const m = document.createElement("span"); m.className = "contact-initial more-count"; m.textContent = `+${names.length - 3}`; m.style.backgroundColor = "#999"; box.appendChild(m); }
  }

  /* ------------------------------ Contacts: Load & Render --------------- */
  /** Load contacts for Add Task dropdown. */
  async function loadContactsInAddTask() {
    try {
      const contacts = await getJSON("contacts.json"); const list = $id("dropdown-list-contacts");
      if (!contacts || !list) return;
      window.loadedContacts = contacts;
      window.allContacts = Object.values(contacts).map(c => c.name).filter(Boolean).sort((a,b)=>a.localeCompare(b));
      renderContacts(window.allContacts, contacts);
    } catch (e) { console.error("Could not load contacts:", e); }
  }
  /** @param {string[]} names @param {Object} contacts */
  function renderContacts(names, contacts) {
    const list = $id("dropdown-list-contacts"); if (!list) return; setHTML(list, "");
    names.forEach((name) => { const entry = Object.values(contacts).find(c => c.name === name); entry && list.appendChild(contactOption(entry)); });
  }
  /** @param {{name:string}} contact */
  function contactOption(contact) {
    const li = document.createElement("li"); li.className = "dropdown-item-contact";
    const label = document.createElement("label"); label.className = "dropdown-checkbox";
    const av = document.createElement("span"); av.className = "contact-initial"; av.textContent = initials(contact.name); av.style.backgroundColor = colorForName(contact.name);
    const nm = document.createElement("span"); nm.className = "contact-name"; nm.textContent = contact.name;
    const img = document.createElement("img"); img.className = "checkbox-svg"; img.src = (window.assignedContacts||[]).includes(contact.name) ? "../assets/svg/checked.svg" : "../assets/svg/check_button.svg";
    on(label, "click", (e) => { e.stopPropagation(); img.src = img.src.includes("check_button.svg") ? "../assets/svg/checked.svg" : "../assets/svg/check_button.svg"; toggleContact(contact.name); });
    label.append(av, nm, img); li.appendChild(label); return li;
  }
  /** Init contacts dropdown with data + behavior. */
  async function initContactsDropdown() {
    const select = $id("assignedToDropdownContacts"), arrow = $id("dropdown-arrow-contacts"), drop = $id("dropdown-list-contacts");
    if (!select || !arrow || !drop) return;
    try {
      const contacts = await getJSON("contacts.json"); window.loadedContacts = contacts;
      const names = Object.values(contacts).map(c=>c.name).filter(Boolean).sort((a,b)=>a.localeCompare(b));
      setHTML(drop, ""); names.forEach(n => drop.appendChild(contactOption({ name: n })));
      const items = document.getElementsByClassName("dropdown-item-contact"); dropdownFunction(arrow, drop, select, items, null);
    } catch (e) { console.error("initContactsDropdown failed:", e); }
  }

  /* ------------------------------ Assigned Dropdown (Spacing) ----------- */
  /** Toggle contacts dropdown and adjust layout. */
  function toggleAssignedDropdown(ev) {
    const dd = $id("assignedToDropdownContacts"); if (!dd) return; ev?.stopPropagation(); ensureLayoutRefs();
    const open = !dd.classList.contains("open"); dd.classList.toggle("open", open);
    if (open) {
      if (window.__categoryBox) window.__categoryBox.style.marginTop = "264px";
      if (window.__subtasksBox) { window.__subtasksBox.style.marginTop = "24px"; window.__subtasksBox.style.paddingBottom = "50px"; }
      const h = (e) => { if (dd.contains(e.target)) return; dd.classList.remove("open"); resetAssignedDropdown(); document.removeEventListener("click", h); };
      setTimeout(() => document.addEventListener("click", h), 0);
    } else resetAssignedDropdown();
  }
  /** Reset spacing after closing contacts dropdown. */
  function resetAssignedDropdown() { resetSubtasksSpacing(); }

  /* ------------------------------ Boot ---------------------------------- */
  document.addEventListener("DOMContentLoaded", () => { initCategoryDropdown(); });

  /* ------------------------------ Exports ------------------------------- */
  window.initials ??= initials;
  window.colorForName ??= colorForName;
  window.getTasks ??= getTasks;
  window.saveTask ??= saveTask;
  window.initCategoryDropdown ??= initCategoryDropdown;
  window.selectCategory ??= selectCategory;
  window.dropdownFunction ??= dropdownFunction;
  window.updateDropdownText ??= updateDropdownText;
  window.updateDropdownHighlight ??= updateDropdownHighlight;
  window.updateDropdownBackground ??= updateDropdownBackground;
  window.toggleContact ??= toggleContact;
  window.renderAssignedContacts ??= renderAssignedContacts;
  window.loadContactsInAddTask ??= loadContactsInAddTask;
  window.renderContacts ??= renderContacts;
  window.initContactsDropdown ??= initContactsDropdown;
  window.toggleAssignedDropdown ??= toggleAssignedDropdown;
  window.resetAssignedDropdown ??= resetAssignedDropdown;
  window.initialiseSavePrioImg ??= window.initialiseSavePrioImg; // belassen, falls extern definiert
})();
