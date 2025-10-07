
  function initDropzoneCarousel(dropzone) {
    if (dropzone.dataset.carouselInit === 'true') return;
    dropzone.dataset.carouselInit = 'true';

    dropzone.tabIndex = dropzone.tabIndex || 0;
    dropzone.classList.add('dz-enabled');

    let isDown = false;
    let startX;
    let scrollLeft;

    dropzone.addEventListener('pointerdown', (e) => {
      isDown = true;
      dropzone.setPointerCapture(e.pointerId);
      startX = e.clientX;
      scrollLeft = dropzone.scrollLeft;
      dropzone.classList.add('dz-dragging');
    });

    dropzone.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      const walk = startX - e.clientX;
      dropzone.scrollLeft = scrollLeft + walk;
    });

    ['pointerup', 'pointercancel', 'pointerleave'].forEach(evt => {
      dropzone.addEventListener(evt, (e) => {
        if (!isDown) return;
        isDown = false;
        try { dropzone.releasePointerCapture(e.pointerId); } catch (_) {}
        dropzone.classList.remove('dz-dragging');
      });
    });

    // Tastatur-Scroll (Arrow Keys)
    dropzone.addEventListener('keydown', (e) => {
      const step = dropzone.clientWidth * 0.8; 
      if (e.key === 'ArrowRight') { e.preventDefault(); dropzone.scrollBy({ left: step, behavior: 'smooth' }); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); dropzone.scrollBy({ left: -step, behavior: 'smooth' }); }
    });
  }

  function initAllDropzones() {
    document.querySelectorAll('.dropzone').forEach(initDropzoneCarousel);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllDropzones);
  } else {
    initAllDropzones();
  }

  window.dropzoneCarousel = { init: initDropzoneCarousel };
