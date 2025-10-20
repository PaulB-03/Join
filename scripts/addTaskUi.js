/* ------------------------------ Toast/UX -------------------------------- */
/**
 * Creates the toast element.
 * @returns {HTMLDivElement}
 */
function createToastMessage(){
    const msg=document.createElement("div");
    msg.className="task-added-message";
    msg.innerHTML=`Task added to board 
      <img src="../assets/svg/board.svg" alt="Board icon"
           style="width:30px;height:30px;margin-left:10px;vertical-align:middle">`;
    document.body.append(msg); return msg;
  }
  
  /**
   * Animates toast into view.
   * @param {HTMLElement} msg
   * @returns {void}
   */
  function animateToastIn(msg){
    requestAnimationFrame(()=>{ msg.style.transform="translate(-50%, -50%)"; });
  }
  
  /**
   * Shows toast and redirects to board.
   * @returns {void}
   */
  function showAddedToastAndRedirect(){
    const msg=createToastMessage(); animateToastIn(msg);
    setTimeout(()=>{ msg.remove(); location.href="board.html"; },900);
  }
  
  /* ---------------------------- Subtasks (Form) ---------------------------- */
  /**
   * Reads subtasks from overlay form (text + done).
   * @returns {{text:string,done:boolean}[]}
   */
  function getSubtasksFromForm(){
    const wrapper=document.querySelector(".addedSubtaskWrapper");
    if(!wrapper) return [];
    return Array.from(wrapper.querySelectorAll(".subtask, .subtaskTitle"))
      .map(el=>{ const text=el.textContent.trim(); if(!text) return null;
        const done=el.querySelector?.("input[type=checkbox]")?.checked||false; return {text,done}; })
      .filter(Boolean);
  }
  
  /* ---------------------------- Formular Reset ---------------------------- */
  /**
   * Resets category UI state.
   * @returns {void}
   */
  function resetCategoryUI(){
    selectedCategory=""; const ph=$id("categoryPlaceholder");
    if(ph) ph.textContent="Select task category";
    $id("assignedToDropdownCategory")?.classList.remove("selected-red");
    document.querySelectorAll("#dropdown-list-category input[type='checkbox']")
      .forEach(cb=>cb.checked=false);
  }
  
  /**
   * Resets assigned contacts UI.
   * @returns {void}
   */
  function resetAssignedUI(){
    window.assignedContacts=[]; selectedContact="";
    const initials=document.getElementById("assignedToInitials");
    if(initials) initials.innerHTML="";
    const span=document.querySelector("#assignedToDropdownContacts .dropdown-selected span");
    if(span) span.textContent="Select contact";
  }
  
  /* --------------------------- Kontakte / Suche ---------------------------- */
  /**
   * Loads contacts list (delegates to external loader).
   * @returns {Promise<void>}
   */
  async function loadContacts(){ if(typeof loadContactsInAddTask==="function") await loadContactsInAddTask(); }
  
  /**
   * Toggles contacts dropdown open/close.
   * @param {HTMLElement} drop
   * @param {HTMLElement} arrow
   * @param {boolean} show
   * @returns {boolean}
   */
  function toggleContactsDropdown(drop,arrow,show){
    drop.style.display=show?"block":"none";
    if(arrow) arrow.style.transform=`translateY(-50%) rotate(${show?180:0}deg)`;
    return show;
  }
  
  /**
   * Updates initials preview bubble.
   * @returns {void}
   */
  function updateInitialsPreview(){
    const initials=$id("assignedToInitials");
    if(initials){
      initials.style.display="block";
      initials.textContent=window.assignedContacts.map(x=>x.name[0]).join(", ");
    }
  }
  
  /**
   * Attaches click handler to one contact item.
   * @param {Element} it
   * @param {Function} closeFn
   * @returns {void}
   */
  function wireContactItem(it,closeFn){
    it.addEventListener("click",e=>{
      e.stopPropagation();
      const c={id:it.dataset.id,name:it.dataset.name};
      if(!window.assignedContacts.some(x=>x.id===c.id)) window.assignedContacts.push(c);
      updateInitialsPreview(); closeFn();
    });
  }
  
  /**
   * Initializes contacts dropdown trigger & list.
   * @returns {void}
   */
  function initContactsDropdownInput(){
    const sel=$id("assignedToDropdownContacts"),arrow=$id("dropdown-arrow-contacts"),drop=$id("dropdown-list-contacts");
    if(!sel||!arrow||!drop) return; let open=false;
    const toggle=(s)=>{ open=toggleContactsDropdown(drop,arrow,s); };
    sel.addEventListener("click",(e)=>{ e.stopPropagation(); toggle(!open); });
    document.addEventListener("click",()=>open&&toggle(false));
    drop.querySelectorAll(".dropdown-item-contact").forEach(it=>wireContactItem(it,()=>toggle(false)));
  }
  
  /* ---------------------------- Datepicker UX ------------------------------ */
  /**
   * Initializes min date and opens native picker.
   * @returns {void}
   */
  function initDateMinAndPicker(){
    const input=$id("date"); if(!input) return;
    input.min=new Date().toISOString().split("T")[0];
    input.addEventListener("click",()=>{
      try{
        const ua=navigator.userActivation; const canShow=ua?.isActive||ua?.hasBeenActive;
        input.showPicker?.call&&canShow?input.showPicker():input.focus();
      }catch{ input.focus(); }
    });
  }
  
  /* ----------------------------- Live Search ------------------------------- */
  /**
   * Filters contacts and toggles dropdown for results.
   * @returns {void}
   */
  function initContactSearch(){
    const search=$id("contactSearch"),drop=$id("dropdown-list-contacts");
    if(!search||!drop) return;
    const toggle=(s)=>drop.style.display=s?"block":"none";
    const filter=(q)=>window.allContacts.filter(n=>n.toLowerCase().includes(q));
    search.addEventListener("input",()=>{
      const q=search.value.toLowerCase().trim(), results=filter(q);
      if(window.loadedContacts) renderContacts(results,window.loadedContacts);
      toggle(q&&results.length);
    });
    document.addEventListener("click",(e)=>{ if(!drop.contains(e.target)&&e.target!==search) toggle(false); });
  }
  document.addEventListener("DOMContentLoaded",initContactSearch);
  
  /* ------------------------------ Bootstraps ------------------------------- */
  /**
   * Wires UI initializers on DOM ready.
   * @returns {void}
   */
  document.addEventListener("DOMContentLoaded",()=>{
    initDateMinAndPicker();
    initContactsDropdownInput();
    initContactSearch();
    loadContacts();
  });
  
  /* --------------------------- Category Dropdown --------------------------- */
  const CategoryDropdown=(()=>{
    /** @param {string} id */ const $=(id)=>document.getElementById(id);
    /** @param {string} s @param {ParentNode} r */ const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
    /** @param {Element} el @param {string} evt @param {Function} fn */ const on=(el,evt,fn)=>el?.addEventListener(evt,fn);
    const categories=["User  story","Technical Task"]; let open=false;
  
    /**
     * Applies selected category by index.
     * @param {number} index
     * @returns {void}
     */
    function selectCategory(index){
      const dd=$("assignedToDropdownCategory"), ph=$("categoryPlaceholder"), inputs=$$("input[name='category']");
      const category=categories[index]; window.selectedCategory=category;
      if(ph) ph.textContent=category; dd?.classList.add("selected-red");
      inputs.forEach((input,i)=>input.checked=i===index);
      dd&&(dd.style.border=""); const nxt=dd?.nextElementSibling;
      if(nxt&&nxt.classList.contains("error-message")) nxt.remove();
      if(typeof resetSubtasksSpacing==="function") resetSubtasksSpacing();
    }
  
    /**
     * Saves and closes.
     * @param {number} index
     * @returns {void}
     */
    function saveSelectedCategory(index){ selectCategory(index); closeDropdown(); }
  
    /** @returns {void} */
    function toggleDropdown(){ open?closeDropdown():openDropdown(); }
    /** @returns {void} */
    function openDropdown(){ const dd=$("assignedToDropdownCategory"),a=$("dropdown-arrow-subtasks");
      open=true; dd?.classList.add("open"); if(a) a.style.transform="translateY(-50%) rotate(180deg)"; dd?.setAttribute("aria-expanded","true"); }
    /** @returns {void} */
    function closeDropdown(){ const dd=$("assignedToDropdownCategory"),a=$("dropdown-arrow-subtasks");
      open=false; dd?.classList.remove("open"); if(a) a.style.transform="translateY(-50%) rotate(0deg)"; dd?.setAttribute("aria-expanded","false"); }
  
    /**
     * Initializes dropdown interactions.
     * @returns {void}
     */
    function init(){
      const dd=$("assignedToDropdownCategory"), list=$("dropdown-list-category"); if(!dd||!list) return;
      on(dd,"click",(ev)=>{ ev.stopPropagation(); toggleDropdown(); });
      on(dd,"keydown",(ev)=>{ if(["Enter"," "].includes(ev.key)){ ev.preventDefault(); toggleDropdown(); } else if(ev.key==="Escape"){ closeDropdown(); } });
      $$(".dropdown-item-category",list).forEach((item,idx)=>on(item,"click",(ev)=>{ ev.stopPropagation(); selectCategory(idx); closeDropdown(); }));
      on(document,"click",()=>{ if(open) closeDropdown(); }); window.saveSelectedCategory=saveSelectedCategory;
    }
    return { init, selectCategory, saveSelectedCategory };
  })();
  document.addEventListener("DOMContentLoaded",CategoryDropdown.init);
  
  /* --------------------------- Textarea Resize ----------------------------- */
  let _isResizing=false,_startY=0,_startH=0;
  /**
   * Begins textarea resize.
   * @param {MouseEvent} e
   * @returns {void}
   */
  function beginResize(e){
    const t=document.getElementById("descriptionInput"); if(!t) return;
    _isResizing=true; _startY=e.clientY; _startH=parseInt(getComputedStyle(t).height,10);
    document.addEventListener("mousemove",doResize); document.addEventListener("mouseup",endResize);
    e.preventDefault();
  }
  /**
   * Performs resize on mousemove.
   * @param {MouseEvent} e
   * @returns {void}
   */
  function doResize(e){
    if(!_isResizing) return; const t=document.getElementById("descriptionInput"); if(!t) return;
    const delta=e.clientY-_startY; let nh=_startH+delta;
    const min=parseInt(getComputedStyle(t).minHeight,10), max=parseInt(getComputedStyle(t).maxHeight,10);
    nh=Math.max(min,Math.min(max,nh)); t.style.height=nh+"px";
  }
  /**
   * Ends resize and unbinds listeners.
   * @returns {void}
   */
  function endResize(){
    _isResizing=false; document.removeEventListener("mousemove",doResize); document.removeEventListener("mouseup",endResize);
  }
  /**
   * Wires custom textarea resize handle.
   * @returns {void}
   */
  (function wireTextareaResize(){
    const textarea=document.getElementById("descriptionInput"); const handle=document.querySelector(".resize-handle");
    if(textarea&&handle) handle.addEventListener("mousedown",beginResize);
  })();
  
  /* ------------------------- Date Validation (flatpickr) ------------------- */
  /**
   * Validates manual date input as future date (DD/MM/YYYY).
   * @param {unknown} _ - unused
   * @param {string} dateStr
   * @param {{setDate:(d:Date,keep:boolean)=>void, clear:()=>void}} instance
   * @returns {void}
   */
  function validateFutureDate(_,dateStr,instance){
    const parts=dateStr.split("/"); if(parts.length!==3){ instance.clear(); return; }
    const [d,m,y]=parts; const typed=new Date(`${y}-${m}-${d}`); const today=new Date(); today.setHours(0,0,0,0);
    if(!isNaN(typed)&&typed>=today){ instance.setDate(typed,true); } else { instance.clear(); }
  }
  