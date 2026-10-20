/**
 * GTVC Dargai - Lightbox Gallery Modal
 */

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.querySelector('.lightbox-modal');
  const modalImg = document.querySelector('.lightbox-img');
  const modalCaption = document.querySelector('.lightbox-caption');
  const closeBtn = document.querySelector('.lightbox-close');
  const galleryItems = document.querySelectorAll('.gallery-thumb-item');

  if (!modal || !modalImg) return;

  galleryItems.forEach((item) => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      const caption = item.getAttribute('data-caption') || img.alt || 'GTVC Dargai Campus Gallery';
      modalImg.src = img.src;
      modalCaption.textContent = caption;
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
});
