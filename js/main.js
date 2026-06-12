/* ═══════════════════════════════════════════════════════════
   MATTHEW KO — Interactive JS
   GSAP 3 + ScrollTrigger + SplitText
   ═══════════════════════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger);

// ── UTILITIES ──────────────────────────────────────────────
const qs = (s, ctx = document) => ctx.querySelector(s);
const qsa = (s, ctx = document) => [...ctx.querySelectorAll(s)];

// ── PRELOADER ──────────────────────────────────────────────
function initPreloader() {
  const loader = qs('#preloader');
  const fill = qs('.pre-fill');
  const count = qs('.pre-count');
  const images = qsa('img:not([loading="lazy"])');
  let loaded = 0;
  let finished = false; // must be declared before forEach — cached images call finish() synchronously
  const total = images.length || 1;

  function finish() {
    if (finished) return;
    finished = true;
    count.textContent = 100;
    gsap.to(fill, { width: '100%', duration: 0.4, ease: 'power2.out', onComplete: () => {
      const inner = qs('.pre-inner', loader);
      const seam  = qs('.pre-seam',  loader);
      const glow  = qs('.pre-glow',  loader);
      const top   = qs('.pre-top',   loader);
      const bot   = qs('.pre-bot',   loader);
      // 1. Hold at 100% briefly, then name fades
      gsap.to(inner, { opacity: 0, y: -10, duration: 0.5, delay: 0.5, ease: 'power2.in' });
      // 2. Warm golden glow blooms from center — sunlight cresting
      gsap.to(glow, { opacity: 1, duration: 1.4, delay: 0.6, ease: 'power1.inOut' });
      // 3. Seam ignites along the horizon
      gsap.to(seam, { opacity: 1, duration: 0.9, delay: 1.1, ease: 'power2.out' });
      // 4. Curtains slowly split — dawn breaks
      gsap.to(top, { yPercent: -100, duration: 1.4, delay: 1.7, ease: 'power2.inOut' });
      gsap.to(bot, { yPercent: 100,  duration: 1.4, delay: 1.7, ease: 'power2.inOut', onComplete: () => {
        loader.style.display = 'none';
        ScrollTrigger.refresh();
        initHero();
      }});
    }});
  }

  function onLoad() {
    loaded++;
    const pct = Math.round((loaded / total) * 100);
    gsap.to(fill, { width: pct + '%', duration: 0.3, ease: 'power2.out' });
    count.textContent = pct;
    if (loaded >= total) finish();
  }

  images.forEach(img => {
    if (img.complete) onLoad();
    else { img.addEventListener('load', onLoad); img.addEventListener('error', onLoad); }
  });

  setTimeout(finish, 2500);
}

// ── CURSOR ─────────────────────────────────────────────────
function initCursor() {
  const dot = qs('#cursor');
  const ring = qs('#cursor-ring');
  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    gsap.to(dot, { left: mx, top: my, duration: 0, overwrite: true });
  });

  function animRing() {
    rx += (mx - rx) * 0.1;
    ry += (my - ry) * 0.1;
    gsap.set(ring, { left: rx, top: ry });
    requestAnimationFrame(animRing);
  }
  animRing();

  qsa('a, button, .proj, .hob, .tl-item, .h-pill').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-grow'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-grow'));
  });
}

// ── NAV ────────────────────────────────────────────────────
function initNav() {
  const nav = qs('#nav');
  const hero = qs('#hero');

  ScrollTrigger.create({
    trigger: hero,
    start: 'bottom 80px',
    onEnter: () => { nav.classList.remove('nav-hero'); nav.classList.add('nav-solid'); },
    onLeaveBack: () => { nav.classList.add('nav-hero'); nav.classList.remove('nav-solid'); },
  });
  nav.classList.add('nav-hero');

  // Active link highlight
  qsa('section[id]').forEach(sec => {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 50%',
      end: 'bottom 50%',
      onEnter: () => setActiveNav(sec.id),
      onEnterBack: () => setActiveNav(sec.id),
    });
  });

  function setActiveNav(id) {
    qsa('.nav-links a').forEach(a => a.classList.toggle('active', a.dataset.section === id));
  }

  // Mobile menu
  const btn = qs('#menuBtn');
  const menu = qs('#mobileMenu');
  if (btn) {
    btn.addEventListener('click', () => menu.classList.toggle('open'));
    qsa('.mm-link').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));
  }
}

// ── HERO ANIMATIONS ────────────────────────────────────────
function initHero() {
  // Hero name words — split and animate in
  const heroName = qs('.hero-name');
  if (heroName) {
    const words = qsa('.hn-word', heroName);
    words.forEach((word, i) => {
      const inner = document.createElement('span');
      inner.innerHTML = word.innerHTML;
      inner.style.display = 'block';
      word.innerHTML = '';
      word.style.overflow = 'hidden';
      word.appendChild(inner);
      gsap.from(inner, {
        yPercent: 110,
        duration: 1.1,
        delay: 0.5 + i * 0.12,
        ease: 'power4.out',
      });
    });
  }

  // Hero image subtle parallax
  const heroImg = qs('.hero-img');
  if (heroImg) {
    gsap.to(heroImg, {
      yPercent: 15,
      ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  }
}

// ── TITLE SPLIT REVEALS ────────────────────────────────────
function initTitleReveals() {
  qsa('.s-title').forEach(el => {
    // Split on explicit <br> tags (all s-title elements use these for line breaks)
    const parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map(part =>
      `<span class="split-line"><span class="split-inner">${part}</span></span>`
    ).join('');

    // GSAP owns the transform from creation — avoids CSS+GSAP doubling when
    // using yPercent (CSS % and GSAP matrix reads compound instead of override)
    gsap.set(qsa('.split-inner', el), { yPercent: 110 });

    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      onEnter: () => {
        qsa('.split-inner', el).forEach((ln, i) => {
          gsap.to(ln, { yPercent: 0, duration: 0.9, delay: i * 0.08, ease: 'power4.out' });
        });
      },
      once: true
    });
  });
}

// ── SCROLL REVEALS ─────────────────────────────────────────
function initScrollReveals() {
  qsa('.js-reveal').forEach(el => {
    const delay = el.classList.contains('js-reveal-delay') ? 0.15 : 0;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      onEnter: () => {
        // fromTo overrides CSS (opacity:0, translateY(32px)) explicitly.
        // gsap.from() alone would read the CSS as the "to" value → animates 0→0 (no-op).
        gsap.fromTo(el,
          { opacity: 0, y: 32 },
          { opacity: 1, y: 0, duration: 0.85, delay, ease: 'power3.out' }
        );
      },
      once: true
    });
  });
}

// ── COUNTER ANIMATIONS ─────────────────────────────────────
function initCounters() {
  qsa('.js-counter').forEach(item => {
    const numEl = qs('.stat-num', item);
    if (!numEl) return;
    const target = parseFloat(item.dataset.target);
    const suffix = item.dataset.suffix || '';
    const decimals = parseInt(item.dataset.decimals) || 0;
    const format = item.dataset.format;

    ScrollTrigger.create({
      trigger: item,
      start: 'top 80%',
      onEnter: () => {
        gsap.to({ val: 0 }, {
          val: target,
          duration: 1.4,
          ease: 'power2.out',
          onUpdate: function() {
            let v = this.targets()[0].val;
            let display = decimals > 0 ? v.toFixed(decimals) : Math.round(v).toString();
            if (format === 'comma') display = parseInt(display).toLocaleString();
            numEl.textContent = display + suffix;
            if (numEl.querySelector('sup')) {
              // re-add sup if it was there
            }
          }
        });
      },
      once: true
    });
  });
}

// ── MARQUEE PARALLAX ───────────────────────────────────────
function initMarquee() {
  const track = qs('.marquee-track');
  if (!track) return;
  const band = track.parentElement;
  band.addEventListener('mouseenter', () => gsap.to(track, { timeScale: 0, duration: 0.5, overwrite: true, ease: 'power2.out' }));
  band.addEventListener('mouseleave', () => gsap.to(track, { timeScale: 1, duration: 0.5, overwrite: true, ease: 'power2.in' }));
}

// ── PROJECT CARDS ──────────────────────────────────────────
function initProjectCards() {
  qsa('.proj').forEach(card => {
    const accent = qs('.proj-accent', card);
    card.addEventListener('mouseenter', () => gsap.to(accent, { height: '100%', duration: 0.5, ease: 'power3.out' }));
    card.addEventListener('mouseleave', () => gsap.to(accent, { height: 0, duration: 0.4, ease: 'power3.in' }));
  });
}

// ── WORLD CARD HOVER ───────────────────────────────────────
function initWorldCards() {
  qsa('.we').forEach(card => {
    const img = qs('img', card);
    if (!img) return;
    card.addEventListener('mouseenter', () => gsap.to(img, { scale: 1.06, duration: 0.7, ease: 'power2.out' }));
    card.addEventListener('mouseleave', () => gsap.to(img, { scale: 1, duration: 0.6, ease: 'power2.out' }));
  });
}

// ── HOBBY CARD HOVER ───────────────────────────────────────
function initHobbyCards() {
  qsa('.hob').forEach(card => {
    const imgs = qsa('img', card);
    if (!imgs.length) return;
    card.addEventListener('mouseenter', () => imgs.forEach(img => gsap.to(img, { scale: 1.05, duration: 0.7, ease: 'power2.out' })));
    card.addEventListener('mouseleave', () => imgs.forEach(img => gsap.to(img, { scale: 1, duration: 0.6, ease: 'power2.out' })));
  });
}

// ── SECTION AMBIENT ────────────────────────────────────────
function initSectionAmbient() {
  qsa('.s-label').forEach(label => {
    ScrollTrigger.create({
      trigger: label,
      start: 'top 80%',
      onEnter: () => {
        gsap.from(label, { letterSpacing: '0.4em', duration: 0.7, ease: 'power2.out' });
      },
      once: true
    });
  });
}

// ── MANIFESTO PARALLAX ─────────────────────────────────────
function initManifesto() {
  const quote = qs('.m-quote');
  if (!quote) return;
  gsap.to(quote, {
    yPercent: -5,
    ease: 'none',
    scrollTrigger: {
      trigger: '.manifesto-band',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1
    }
  });
}

// ── INIT ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  initCursor();
  initNav();
  initTitleReveals();
  initScrollReveals();
  initCounters();
  initMarquee();
  initProjectCards();
  initWorldCards();
  initHobbyCards();
  initSectionAmbient();
  initManifesto();
});
