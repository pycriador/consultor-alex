/* ===== THEME TOGGLE ===== */
const themeToggle = document.getElementById('themeToggle');
const STORAGE_KEY = 'alx-theme';

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
  themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro');
}

function getPreferredTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const savedTheme = getPreferredTheme();
setTheme(savedTheme);

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  setTheme(current === 'dark' ? 'light' : 'dark');
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    setTheme(e.matches ? 'dark' : 'light');
  }
});

/* ===== MENU MOBILE ===== */
const hamburger = document.getElementById('hamburger');
const nav = document.getElementById('nav');
hamburger.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', isOpen);
  hamburger.setAttribute('aria-label', isOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
});
document.querySelectorAll('.nav a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Abrir menu de navegação');
  });
});

/* ===== HEADER SCROLL ===== */
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ===== ACTIVE NAV LINK ===== */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav a[href^="#"]');

function updateActiveLink() {
  let current = '';
  sections.forEach(section => {
    const top = section.offsetTop - 120;
    if (window.scrollY >= top) current = section.getAttribute('id');
  });
  navLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === '#' + current);
  });
}
window.addEventListener('scroll', updateActiveLink, { passive: true });
window.addEventListener('load', updateActiveLink);

/* ===== SCROLL REVEAL ===== */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => {
  revealObserver.observe(el);
});

/* ===== SERVICE CAROUSEL ===== */
const track = document.querySelector('.carousel-track');
const slides = document.querySelectorAll('.carousel-slide');
const dots = document.querySelectorAll('.carousel-dot');
const prevBtn = document.querySelector('.carousel-btn.prev');
const nextBtn = document.querySelector('.carousel-btn.next');
const carousel = document.querySelector('.services-carousel');
let currentSlide = 0;

function updateDots() {
  dots.forEach((dot, i) => {
    const isActive = i === currentSlide;
    dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
    dot.classList.toggle('active', isActive);
    dot.setAttribute('tabindex', isActive ? '0' : '-1');
  });
}

function goToSlide(index) {
  if (index < 0) index = slides.length - 1;
  if (index >= slides.length) index = 0;
  currentSlide = index;
  if (track) track.style.transform = `translateX(-${currentSlide * 100}%)`;
  updateDots();
}

function startCarousel() {
  if (window.carouselInterval) clearInterval(window.carouselInterval);
  window.carouselInterval = setInterval(() => goToSlide(currentSlide + 1), 5000);
}

function stopCarousel() {
  if (window.carouselInterval) {
    clearInterval(window.carouselInterval);
    window.carouselInterval = null;
  }
}

if (dots.length) {
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      stopCarousel();
      goToSlide(i);
      startCarousel();
    });
    dot.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        stopCarousel();
        goToSlide(i);
        startCarousel();
      }
    });
  });
}

if (prevBtn) {
  prevBtn.addEventListener('click', () => {
    stopCarousel();
    goToSlide(currentSlide - 1);
    startCarousel();
  });
}

if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    stopCarousel();
    goToSlide(currentSlide + 1);
    startCarousel();
  });
}

if (carousel) {
  carousel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      stopCarousel();
      goToSlide(currentSlide - 1);
      startCarousel();
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      stopCarousel();
      goToSlide(currentSlide + 1);
      startCarousel();
    }
  });
  startCarousel();
  carousel.addEventListener('mouseenter', stopCarousel);
  carousel.addEventListener('mouseleave', startCarousel);
  carousel.addEventListener('focusin', stopCarousel);
  carousel.addEventListener('focusout', (e) => {
    if (!carousel.contains(e.relatedTarget)) startCarousel();
  });
}

/* ===== LIGHTBOX ===== */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');
let lastFocusedElement = null;

document.querySelectorAll('.gallery-item img').forEach(img => {
  img.addEventListener('click', () => {
    openLightbox(img);
  });
  img.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openLightbox(img);
    }
  });
  img.setAttribute('tabindex', '0');
  img.setAttribute('role', 'button');
});

function openLightbox(img) {
  lastFocusedElement = document.activeElement;
  lightboxImg.src = img.src;
  lightbox.setAttribute('aria-hidden', 'false');
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
  lightboxClose.focus();
}

function closeLightbox() {
  lightbox.setAttribute('aria-hidden', 'true');
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
  if (lastFocusedElement) lastFocusedElement.focus();
}

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && lightbox.classList.contains('active')) closeLightbox();
  if (e.key === 'Tab' && lightbox.classList.contains('active')) {
    const focusable = lightbox.querySelectorAll('button, img');
    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === firstFocusable) {
      e.preventDefault();
      lastFocusable.focus();
    } else if (!e.shiftKey && document.activeElement === lastFocusable) {
      e.preventDefault();
      firstFocusable.focus();
    }
  }
});

/* ===== FORM VALIDATION ===== */
const form = document.getElementById('contactForm');
const successMsg = document.getElementById('formSuccess');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  let valid = true;

  const fields = [
    { el: document.getElementById('nome'), type: 'text', errorId: 'nome-error' },
    { el: document.getElementById('email'), type: 'email', errorId: 'email-error' },
    { el: document.getElementById('mensagem'), type: 'text', errorId: 'mensagem-error' }
  ];

  fields.forEach(({ el, type, errorId }) => {
    const group = el.closest('.form-group');
    group.classList.remove('invalid');
    const errorEl = document.getElementById(errorId);
    if (errorEl) errorEl.textContent = type === 'email' ? 'Informe um e-mail válido' : 'Campo obrigatório';
    const val = el.value.trim();

    if (!val) {
      group.classList.add('invalid');
      if (errorEl) errorEl.textContent = 'Campo obrigatório';
      valid = false;
    } else if (type === 'email') {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(val)) {
        group.classList.add('invalid');
        if (errorEl) errorEl.textContent = 'Informe um e-mail válido';
        valid = false;
      }
    }
  });

  if (!valid) {
    const firstInvalid = form.querySelector('.form-group.invalid input, .form-group.invalid textarea');
    if (firstInvalid) firstInvalid.focus();
    return;
  }

  form.style.display = 'none';
  successMsg.classList.add('show');
  successMsg.focus();

  setTimeout(() => {
    form.reset();
    form.style.display = 'block';
    successMsg.classList.remove('show');
    successMsg.innerHTML = 'Mensagem enviada com sucesso! Entraremos em contato em breve.';
  }, 4000);
});

/* ===== COUNTER ANIMATION ===== */
function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-target'), 10);
  if (isNaN(target)) return;
  const suffix = el.getAttribute('data-suffix') || '';
  const duration = 2000;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(eased * target);
    el.textContent = current + suffix;
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target + suffix;
  }
  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el));

/* ===== BACK TO TOP ===== */
const backToTop = document.getElementById('backToTop');
if (backToTop) {
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelector('h1')?.focus({ preventScroll: true });
  });
}

/* ===== SMOOTH SCROLL FOR ANCHOR LINKS ===== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const targetId = anchor.getAttribute('href');
    if (targetId === '#') return;
    const target = document.querySelector(targetId);
    if (target) {
      e.preventDefault();
      const headerHeight = header ? header.offsetHeight : 0;
      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
      window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  });
});
