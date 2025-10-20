(() => {
  /* ------------------------------ Config -------------------------------- */
  const DB = (typeof baseURL !== "undefined" && baseURL) || "https://join-1323-default-rtdb.europe-west1.firebasedatabase.app/";

  /* ------------------------------ DOM Utils ----------------------------- */
  const $id = (id) => document.getElementById(id);
  const $qs = (sel, root = document) => root.querySelector(sel);
  const $qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const on = (el, ev, fn, opt) => el && el.addEventListener(ev, fn, opt);

  function setText(el, txt) {
    if (el) el.textContent = txt;
  }
  function setHTML(el, html) {
    if (el) el.innerHTML = html;
  }
  function show(el, disp = "block") {
    if (el) el.style.display = disp;
  }
  function hide(el) {
    if (el) el.style.display = "none";
  }

  /* ------------------------------ HTTP Utils ---------------------------- */
  async function getJSON(path) {
    const r = await fetch(DB + path);
    if (!r.ok) throw new Error(`GET ${path} -> ${r.status}`);
    return r.json();
  }

  async function postJSON(path, body) {
    const r = await fetch(DB + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`POST ${path} -> ${r.status}`);
    return r.json();
  }

  async function patchJSON(path, body) {
    const r = await fetch(DB + path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`PATCH ${path} -> ${r.status}`);
    return r.json();
  }

  /* ------------------------------ Colors/Initials ----------------------- */
  const COLOR_VARS = [
    "--contact-bg-blue",
    "--contact-bg-light-blue",
    "--contact-bg-light-green",
    "--contact-bg-purple",
    "--contact-bg-lilac",
    "--contact-bg-green",
    "--contact-bg-pink",
    "--contact-bg-red",
    "--contact-bg-rose",
    "--contact-bg-peach",
    "--contact-bg-orange",
    "--contact-bg-light-orange",
    "--contact-bg-dark-yellow",
    "--contact-bg-medium-yellow",
    "--contact-bg-yellow",
  ];

  function initials(name) {
    const parts = (name || "").trim().split(/\s+/);
    const f = parts[0]?.[0] || "",
      l = parts.length > 1 ? parts.at(-1)[0] : "";
    return (f + l).toUpperCase();
  }

  function colorForName(name = "") {
    const sum = [...name.trim().toLowerCase()].reduce((acc, ch) => acc + ch.codePointAt(0), 0);
    return `var(${COLOR_VARS[sum % COLOR_VARS.length]})`;
  }

  /* ------------------------------ Tasks API ----------------------------- */
  async function getTasks() {
    try {
      const data = await getJSON("tasks.json");
      return data || {};
    } catch (e) {
      console.error("Could not get tasks:", e);
      return null;
    }
  }

  async function saveTask(path, data) {
    return postJSON(path + ".json", data);
  }

  /* ------------------------------ Category Dropdown --------------------- */
  function initCategoryDropdown() {
    const dd = $id("assignedToDropdownCategory");
    const arrow = $id("dropdown-arrow-subtasks");
    const list = $id("dropdown-list-category");
    if (!dd || !arrow || !list) return;

    let open = false;
    on(dd, "click", (ev) => {
      ev.stopPropagation();
      open = !open;
      dd.classList.toggle("open", open);
      arrow.style.transform = open ? "translateY(-50%) rotate(180deg)" : "translateY(-50%) rotate(0deg)";
    });

    $qsa(".dropdown-item-category", list).forEach((item, idx) => {
      on(item, "click", (ev) => {
        ev.stopPropagation();
        selectCategory(idx);
        open = false;
        dd.classList.remove("open");
        arrow.style.transform = "translateY(-50%) rotate(0deg)";
      });
    });

    on(document, "click", () => {
      if (!open) return;
      dd.classList.remove("open");
      arrow.style.transform = "translateY(-50%) rotate(0deg)";
      open = false;
    });
  }

  function selectCategory(index) {
    const categories = ["Userstory", "Technical Task"];
    const dd = $id("assignedToDropdownCategory");
    const ph = $id("categoryPlaceholder");
    window.selectedCategory = categories[index];
    setText(ph, window.selectedCategory);
    dd?.classList.add("selected-red");
    resetSubtasksSpacing();
  }

  function initCategoryDropdownSubtask() {
    const dd = document.getElementById("assignedToDropdownCategory");
    const arrow = document.getElementById("dropdown-arrow-subtasks");
    const list = document.getElementById("dropdown-list-category");

    if (!dd || !arrow || !list) return;

    let open = false;
    let __subtasksBox = document.getElementById("subtasks");
    const __subtasksStyles = {
      marginTop: __subtasksBox?.style.marginTop || "24px",
      paddingBottom: __subtasksBox?.style.paddingBottom || "50px",
    };

    dd.addEventListener("click", (ev) => {
      ev.stopPropagation();
      open = !open;
      dd.classList.toggle("open", open);
      arrow.style.transform = open ? "translateY(-50%) rotate(180deg)" : "translateY(-50%) rotate(0deg)";

      if (open) {
        if (__subtasksBox) {
          const dropdownHeight = list.offsetHeight;
          __subtasksBox.style.marginTop = dropdownHeight + 16 + "px"; // add extra spacing
          __subtasksBox.style.paddingBottom = "50px";
        }
        const outsideClickHandler = (e) => {
          if (!dd.contains(e.target)) {
            dd.classList.remove("open");
            arrow.style.transform = "translateY(-50%) rotate(0deg)";
            __subtasksBox.style.marginTop = __subtasksStyles.marginTop;
            document.removeEventListener("click", outsideClickHandler);
            open = false;
          }
        };
        document.addEventListener("click", outsideClickHandler);
      } else {
        if (__subtasksBox) __subtasksBox.style.marginTop = __subtasksStyles.marginTop;
      }
    });

    list.querySelectorAll(".dropdown-item-category").forEach((item) => {
      item.addEventListener("click", () => {
        if (__subtasksBox) __subtasksBox.style.marginTop = __subtasksStyles.marginTop;
        dd.classList.remove("open");
        arrow.style.transform = "translateY(-50%) rotate(0deg)";
        open = false;
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initCategoryDropdownSubtask();
  });

  /* ------------------------------ Contacts Dropdown --------------------- */
  function dropdownFunction(arrow, dropDown, select, items, onSelect) {
    let open = false;
    on(select, "click", (ev) => {
      ev.stopPropagation();
      open = !open;
      dropDown.style.display = open ? "block" : "none";
      arrow.style.transform = open ? "translateY(-50%) rotate(180deg)" : "translateY(-50%) rotate(0deg)";
    });
    Array.from(items).forEach((item) => {
      on(item, "click", (ev) => {
        ev.stopPropagation();
        open = false;
        dropDown.style.display = "none";
        arrow.style.transform = "translateY(-50%) rotate(0deg)";
        onSelect && onSelect(item);
      });
    });
    on(document, "click", () => {
      if (!open) return;
      open = false;
      dropDown.style.display = "none";
      arrow.style.transform = "translateY(-50%) rotate(0deg)";
    });
  }

  function updateDropdownText() {
    const span = $qs("#assignedToDropdownContacts .dropdown-selected span");
    if (!span) return;
    if (!Array.isArray(window.assignedContacts) || !window.assignedContacts.length) {
      span.textContent = "Select contacts";
      return;
    }
    const names = [...window.assignedContacts];
    let out = [];
    for (let i = 0; i < names.length; i++) {
      out.push(names[i]);
      span.textContent = out.join(", ");
      if (span.scrollWidth > span.clientWidth) {
        out.pop();
        break;
      }
    }
    span.textContent = out.join(", ");
  }

  function updateDropdownHighlight() {
    const dropDown = $id("dropdown-list-contacts");
    if (!dropDown) return;
    $qsa("label.dropdown-checkbox", dropDown).forEach((label) => {
      const name = $qs("span.contact-name", label)?.textContent?.trim() || "";
      const img = $qs("img.checkbox-svg", label);
      const sel = window.assignedContacts?.includes(name);
      const item = label.closest(".dropdown-item-contact");

      if (img) {
        img.src = sel ? "../assets/svg/checked.svg" : "../assets/svg/check_button.svg";
        img.classList.toggle("checked", sel);
      }
      label.style.color = sel ? "white" : "";

      // toggle background color on the parent item
      if (item) {
        item.classList.toggle("selected", sel);
      }
    });
  }

  function updateDropdownBackground(dropdownId) {
    const dropdown = $id(dropdownId);
    if (!dropdown) return;
    const checked = dropdown.querySelectorAll("img[src*='checked.svg']").length > 0;
    dropdown.classList.toggle("selected", checked);
  }

  function toggleContact(name) {
    const list = Array.isArray(window.assignedContacts) ? window.assignedContacts : (window.assignedContacts = []);
    const i = list.indexOf(name);
    if (i >= 0) list.splice(i, 1);
    else list.push(name);

    const dd = $id("assignedToDropdownContacts");
    const isOpen = dd && dd.classList.contains("open");
    let beforeHeight;

    if (isOpen) {
      ensureLayoutRefs();
      beforeHeight = __categoryBox ? __categoryBox.offsetTop : 0;
    }

    updateDropdownText();
    renderAssignedContacts();
    updateDropdownHighlight();
    updateDropdownBackground("assignedToDropdownContacts");

    if (isOpen && __categoryBox && beforeHeight !== undefined) {
      const afterHeight = __categoryBox.offsetTop;
      const delta = afterHeight - beforeHeight;
      // Get current margin (prefer inline style, fallback to computed)
      const currentMargin = parseFloat(__categoryBox.style.marginTop) || parseFloat(getComputedStyle(__categoryBox).marginTop) || 0;
      // Counteract the delta to keep position fixed (prevent negative margin)
      const newMargin = Math.max(0, currentMargin - delta);
      __categoryBox.style.marginTop = newMargin + "px";
    }
  }

  function renderAssignedContacts() {
    const box = $id("assignedToInitials");
    if (!box) return;
    setHTML(box, "");
    const names = Array.isArray(window.assignedContacts) ? window.assignedContacts : [];
    if (!names.length) {
      hide(box);
      return;
    }
    show(box, "flex");
    const max = Math.min(names.length, 3);
    for (let i = 0; i < max; i++) {
      const span = document.createElement("span");
      span.className = "contact-initial";
      span.textContent = initials(names[i]);
      span.style.backgroundColor = colorForName(names[i]);
      box.appendChild(span);
    }
    if (names.length > 3) {
      const more = document.createElement("span");
      more.className = "contact-initial more-count";
      more.textContent = `+${names.length - 3}`;
      more.style.backgroundColor = "#999";
      box.appendChild(more);
    }
  }

  /* ------------------------------ Contacts Load & Render ----------------- */
  async function loadContactsInAddTask() {
    try {
      const contacts = await getJSON("contacts.json");
      const list = $id("dropdown-list-contacts");
      if (!contacts || !list) return;
      window.loadedContacts = contacts;
      window.allContacts = Object.values(contacts)
        .map((c) => c.name)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      renderContacts(window.allContacts, contacts);
    } catch (e) {
      console.error("Could not load contacts:", e);
    }
  }

  function renderContacts(contactNames, contacts) {
    const list = $id("dropdown-list-contacts");
    if (!list) return;
    setHTML(list, "");
    contactNames.forEach((name) => {
      const entry = Object.values(contacts).find((c) => c.name === name);
      if (!entry) return;
      list.appendChild(contactOption(entry));
    });
  }

  function contactOption(contact) {
    const li = document.createElement("li");
    li.className = "dropdown-item-contact";
    const label = document.createElement("label");
    label.className = "dropdown-checkbox";

    const av = document.createElement("span");
    av.className = "contact-initial";
    av.textContent = initials(contact.name);
    av.style.backgroundColor = colorForName(contact.name);

    const nm = document.createElement("span");
    nm.className = "contact-name";
    nm.textContent = contact.name;

    const img = document.createElement("img");
    img.className = "checkbox-svg";
    const sel = window.assignedContacts?.includes(contact.name);
    img.src = sel ? "../assets/svg/checked.svg" : "../assets/svg/check_button.svg";

    on(label, "click", (e) => {
      e.stopPropagation();
      const nowChecked = img.src.includes("check_button.svg");
      img.src = nowChecked ? "../assets/svg/checked.svg" : "../assets/svg/check_button.svg";
      toggleContact(contact.name);
    });

    label.append(av, nm, img);
    li.appendChild(label);
    return li;
  }

  /* ------------------------------ Contacts Dropdown Init ---------------- */
  async function initContactsDropdown() {
    const select = $id("assignedToDropdownContacts");
    const arrow = $id("dropdown-arrow-contacts");
    const drop = $id("dropdown-list-contacts");
    if (!select || !arrow || !drop) return;

    try {
      const contacts = await getJSON("contacts.json");
      window.loadedContacts = contacts;
      const names = Object.values(contacts)
        .map((c) => c.name)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      setHTML(drop, "");
      names.forEach((n) => drop.appendChild(contactOption({ name: n })));
      const items = document.getElementsByClassName("dropdown-item-contact");
      dropdownFunction(arrow, drop, select, items, null);
    } catch (e) {
      console.error("initContactsDropdown failed:", e);
    }
  }

  /* ------------------------------ Subtasks/Category Spacing ------------- */

  let __subtasksBox = null,
    __subtasksStyles = null,
    __categoryBox = null,
    __categoryStyles = null;

  function ensureLayoutRefs() {
    if (!__subtasksBox) {
      __subtasksBox = $id("subtasks");
      __subtasksStyles = {
        marginTop: __subtasksBox?.style.marginTop || "24px",
        paddingBottom: __subtasksBox?.style.paddingBottom || "50px",
      };
    }
    if (!__categoryBox) {
      __categoryBox = $id("category");
      __categoryStyles = { marginTop: __categoryBox?.style.marginTop || "24px" };
    }
  }

  function resetSubtasksSpacing() {
    ensureLayoutRefs();
    if (__subtasksBox && __subtasksStyles) {
      __subtasksBox.style.marginTop = __subtasksStyles.marginTop;
      __subtasksBox.style.paddingBottom = __subtasksStyles.paddingBottom;
    }
    if (__categoryBox && __categoryStyles) {
      __categoryBox.style.marginTop = __categoryStyles.marginTop;
    }
  }

  let outsideClickHandler = null; // Global reference to the handler for removal

  function toggleAssignedDropdown(ev) {
    const dd = $id("assignedToDropdownContacts");
    if (!dd) return;
    ev?.stopPropagation();
    ensureLayoutRefs();

    const open = !dd.classList.contains("open");
    dd.classList.toggle("open", open);

    if (open) {
      // Remove any existing handler before adding a new one
      if (outsideClickHandler) {
        document.removeEventListener("click", outsideClickHandler);
      }

      // Define the outside click handler
      outsideClickHandler = (e) => {
        // Ignore clicks within the dropdown itself
        if (dd.contains(e.target)) return;

        // Close the dropdown
        dd.classList.remove("open");
        resetAssignedDropdown(); // This moves category and subtasks back to original positions

        // Remove the listener
        document.removeEventListener("click", outsideClickHandler);
        outsideClickHandler = null;
      };

      // Add the listener (added after the current event has been handled, so it won't trigger immediately on open)
      document.addEventListener("click", outsideClickHandler);

      // Move category and subtasks when opening
      if (__categoryBox) __categoryBox.style.marginTop = "264px";
      if (__subtasksBox) {
        __subtasksBox.style.marginTop = "24px";
        __subtasksBox.style.paddingBottom = "50px";
      }
    } else {
      // Ensure listener is removed on manual close
      if (outsideClickHandler) {
        document.removeEventListener("click", outsideClickHandler);
        outsideClickHandler = null;
      }
      resetAssignedDropdown(); // This moves category and subtasks back to original positions
    }
  }

  function resetAssignedDropdown() {
    resetSubtasksSpacing();
  }

  /* ------------------------------ Exports --------------------------------*/
  window.initials = window.initials || initials;
  window.colorForName = window.colorForName || colorForName;
  window.getTasks = window.getTasks || getTasks;
  window.saveTask = window.saveTask || saveTask;

  window.initCategoryDropdown = window.initCategoryDropdown || initCategoryDropdown;
  window.selectCategory = window.selectCategory || selectCategory;

  window.dropdownFunction = window.dropdownFunction || dropdownFunction;
  window.updateDropdownText = window.updateDropdownText || updateDropdownText;
  window.updateDropdownHighlight = window.updateDropdownHighlight || updateDropdownHighlight;
  window.updateDropdownBackground = window.updateDropdownBackground || updateDropdownBackground;

  window.toggleContact = window.toggleContact || toggleContact;
  window.renderAssignedContacts = window.renderAssignedContacts || renderAssignedContacts;

  window.loadContactsInAddTask = window.loadContactsInAddTask || loadContactsInAddTask;
  window.renderContacts = window.renderContacts || renderContacts;
  window.initContactsDropdown = window.initContactsDropdown || initContactsDropdown;

  window.toggleAssignedDropdown = window.toggleAssignedDropdown || toggleAssignedDropdown;
  window.resetAssignedDropdown = window.resetAssignedDropdown || resetAssignedDropdown;
  window.initialiseSavePrioImg = window.initialiseSavePrioImg || initialiseSavePrioImg;
})();
