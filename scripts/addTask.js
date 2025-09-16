document.addEventListener('DOMContentLoaded', () => {
    initCategoryDropdown();
    initContactsDropdown();
});

window.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('date');
  const today = new Date().toISOString().split('T')[0];
  dateInput.min = today;
  dateInput.addEventListener('click', () => {
    if (typeof dateInput.showPicker === 'function') {
      dateInput.showPicker();
    }
  });
});