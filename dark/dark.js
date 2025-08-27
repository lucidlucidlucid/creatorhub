// Custom circle cursor (desktop only)
if (window.matchMedia('(pointer: fine)').matches) {
  const cursor = document.createElement('div');
  cursor.id = 'circle-cursor';
  document.body.appendChild(cursor);
  document.body.style.cursor = 'none';
  Object.assign(cursor.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    pointerEvents: 'none',
    mixBlendMode: 'difference',
    background: '#fff',
    zIndex: 9999,
    transition: 'transform 0.08s cubic-bezier(.17,.67,.83,.67)',
    transform: 'translate(-50%, -50%)',
    boxShadow: '0 0 0 1px #fff',
    display: 'block',
  });
  window.addEventListener('mousemove', e => {
    cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  });
  // Hide on touch
  window.addEventListener('touchstart', () => {
    cursor.style.display = 'none';
    document.body.style.cursor = '';
  }, { once: true });
}

// Smooth scroll for nav links
window.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('#mainnav a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
      if (this.getAttribute('href') === '#aboutme') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});
