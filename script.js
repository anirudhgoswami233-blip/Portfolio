const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', () => navLinks.classList.remove('open')));
}

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ===== Lenis smooth scroll (inertia) =====
let lenis = null;
if (window.Lenis && !reduceMotion) {
  lenis = new Lenis({
    duration: 1.15,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.4,
  });
  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);

  // Eased anchor-link jumps
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    const id = a.getAttribute('href');
    if (id.length > 1) {
      a.addEventListener('click', e => {
        const target = document.querySelector(id);
        if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -72, duration: 1.2 }); }
      });
    }
  });
}

// ===== Custom cursor glow (lerped) =====
const cursorGlow = document.getElementById('cursorGlow');
if (cursorGlow && finePointer) {
  let cx = 0, cy = 0, tx = 0, ty = 0;
  document.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
  (function loop() {
    cx += (tx - cx) * 0.12;
    cy += (ty - cy) * 0.12;
    cursorGlow.style.left = cx + 'px';
    cursorGlow.style.top = cy + 'px';
    requestAnimationFrame(loop);
  })();
}

// ===== Spotlight on cards =====
document.querySelectorAll('[data-spotlight]').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--spot-x', (e.clientX - r.left) + 'px');
    card.style.setProperty('--spot-y', (e.clientY - r.top) + 'px');
  });
});

// ===== Smoothed tilt (rAF lerp, no snapping) =====
if (finePointer && !reduceMotion) {
  document.querySelectorAll('[data-tilt]').forEach(card => {
    let tx = 0, ty = 0, cx = 0, cy = 0, scale = 1, tScale = 1, raf = null, active = false;
    const MAX = 6;
    function render() {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      scale += (tScale - scale) * 0.12;
      card.style.transform = `perspective(900px) rotateY(${cx}deg) rotateX(${-cy}deg) scale(${scale})`;
      const settled = Math.abs(tx - cx) < 0.02 && Math.abs(ty - cy) < 0.02 && Math.abs(tScale - scale) < 0.001;
      if (settled && !active) { card.style.transform = ''; raf = null; return; }
      raf = requestAnimationFrame(render);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(render); }
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * MAX * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * MAX * 2;
      tScale = 1.012; active = true; kick();
    });
    card.addEventListener('mouseleave', () => { tx = 0; ty = 0; tScale = 1; active = false; kick(); });
  });
}

// ===== Magnetic buttons (lerped) =====
if (finePointer && !reduceMotion) {
  document.querySelectorAll('.btn').forEach(btn => {
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = null, active = false;
    function render() {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      btn.style.transform = `translate(${cx}px, ${cy}px)`;
      if (!active && Math.abs(cx) < 0.1 && Math.abs(cy) < 0.1) { btn.style.transform = ''; raf = null; return; }
      raf = requestAnimationFrame(render);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(render); }
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      tx = (e.clientX - r.left - r.width / 2) * 0.25;
      ty = (e.clientY - r.top - r.height / 2) * 0.35;
      active = true; kick();
    });
    btn.addEventListener('mouseleave', () => { tx = 0; ty = 0; active = false; kick(); });
  });
}

// ===== Count-up animation on stats =====
const countObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = parseInt(el.dataset.count, 10);
    const prefix = el.dataset.prefix || '';
    const duration = 1600;
    const start = performance.now();
    (function update(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = prefix + Math.round(eased * target);
      if (p < 1) requestAnimationFrame(update);
    })(start);
    countObserver.unobserve(el);
  });
}, { threshold: 0.5 });
document.querySelectorAll('[data-count]').forEach(el => countObserver.observe(el));

// ===== Scroll reveals with staggered grids =====
const STAGGER_GRIDS = ['stats-grid', 'projects-row', 'stack-grid', 'contact-links'];
document.querySelectorAll('.fade-up').forEach(el => {
  const isGrid = STAGGER_GRIDS.some(c => el.classList.contains(c));
  if (isGrid && el.children.length > 1) {
    el.classList.remove('fade-up');
    [...el.children].forEach((child, i) => {
      child.classList.add('fade-up');
      child.style.transitionDelay = (i * 0.09) + 's';
    });
  }
});

const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('.fade-up').forEach(el => fadeObserver.observe(el));
