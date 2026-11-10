/* ------------------------------------------------------------------
   0xMASON Portfolio Template — animations
   Mirrors the reference behaviour: GSAP loader, custom cursor,
   scroll reveals, shrinking header, scroll progress, mission board,
   active rail, crate toggles and page-veil transitions.
------------------------------------------------------------------ */
(function () {
  'use strict';

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;

  if (!gsap) {
    console.warn('GSAP not loaded — animations disabled.');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  var doc = document;
  var html = doc.documentElement;
  var body = doc.body;

  /* ---------- elements ---------- */
  var $ = function (sel) { return doc.querySelector(sel); };
  var $$ = function (sel) { return Array.from(doc.querySelectorAll(sel)); };

  var loader = $('[data-loader]');
  var loaderCount = $('.loader__count');
  var loaderWord = $('.loader__word');
  var loaderMark = $('.loader__mark path');
  var veil = $('.page-veil');
  var cursor = $('.cursor');
  var cursorDot = $('.cursor__dot');
  var cursorRing = $('.cursor__ring');
  var cursorLabel = $('.cursor__label');
  var header = $('.site-header');
  var progress = $('.scroll-progress');
  var burger = $('.burger');
  var menu = $('.site-menu');
  var skipStory = $('.skip-story');
  var railLinks = $$('.rail a');
  var sections = $$('main section[id]');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ease = 'cubic-bezier(0.22,1,0.36,1)';

  /* ---------- helpers ---------- */
  var isNight = function () { return html.dataset.night === '1' || body.dataset.night === '1'; };

  function lerpLabel(target) {
    var text = target.dataset.cursor || target.getAttribute('aria-label') || target.textContent || '';
    cursorLabel.textContent = text.toUpperCase();
  }

  /* ---------- loader ---------- */
  function initLoader() {
    if (!loader) return;
    var count = 0;
    var interval = setInterval(function () {
      count += Math.random() * 6;
      if (count > 100) count = 100;
      loaderCount.textContent = Math.floor(count) + '<span>%</span>';
      loaderCount.innerHTML = Math.floor(count) + '<span>%</span>';
      if (count === 100) {
        clearInterval(interval);
        setTimeout(finishLoader, 350);
      }
    }, 40);
  }

  function finishLoader() {
    try { sessionStorage.setItem('mason-loader', '1'); } catch (e) {}
    html.classList.add('is-loader-seen');
    gsap.to([loaderCount, loaderWord], { opacity: 0, duration: 0.35 });
    gsap.to(loader, {
      opacity: 0,
      duration: 0.5,
      ease: ease,
      onComplete: function () {
        loader.style.display = 'none';
        body.classList.remove('is-loading');
        body.style.height = '';
        body.style.overflow = '';
        revealIntro();
      }
    });
  }

  function revealIntro() {
    gsap.fromTo(
      '[data-reveal=up]',
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: '[data-reveal=up]', start: 'top 92%', once: true }
      }
    );
    gsap.fromTo(
      '[data-reveal=clip]',
      { clipPath: 'inset(0 0 100% 0)' },
      {
        clipPath: 'inset(0 0 0 0)',
        duration: 1,
        ease: ease,
        scrollTrigger: { trigger: '[data-reveal=clip]', start: 'top 90%', once: true }
      }
    );
  }

  /* ---------- cursor ---------- */
  var mouse = { x: 0, y: 0 };
  var pos = { x: 0, y: 0 };
  var ringPos = { x: 0, y: 0 };

  function initCursor() {
    if (!cursor || reduced) return;
    var dotX = gsap.quickTo(cursorDot, 'x', { duration: 0.12, ease: 'power3' });
    var dotY = gsap.quickTo(cursorDot, 'y', { duration: 0.12, ease: 'power3' });
    var ringX = gsap.quickTo(cursorRing, 'x', { duration: 0.5, ease: 'power3' });
    var ringY = gsap.quickTo(cursorRing, 'y', { duration: 0.5, ease: 'power3' });

    doc.addEventListener('mousemove', function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    gsap.ticker.add(function () {
      pos.x += (mouse.x - pos.x) * 0.18;
      pos.y += (mouse.y - pos.y) * 0.18;
      ringPos.x += (mouse.x - ringPos.x) * 0.09;
      ringPos.y += (mouse.y - ringPos.y) * 0.09;
      dotX(pos.x);
      dotY(pos.y);
      ringX(ringPos.x);
      ringY(ringPos.y);
    });

    var focusable = 'a,button,.button,.mission,.board__item,.shop';
    doc.addEventListener('mouseover', function (e) {
      var target = e.target.closest(focusable);
      if (target) {
        cursor.classList.add('is-active');
        cursorRing.style.transform = 'translate(-50%,-50%) scale(1.45)';
        lerpLabel(target);
        gsap.to(cursorLabel, { opacity: 1, duration: 0.25 });
      }
    });
    doc.addEventListener('mouseout', function (e) {
      var target = e.target.closest(focusable);
      if (target && !e.relatedTarget || !e.target.closest(focusable)) {
        cursor.classList.remove('is-active');
        cursorRing.style.transform = 'translate(-50%,-50%) scale(0.6)';
        gsap.to(cursorLabel, { opacity: 0, duration: 0.2 });
      }
    });
  }

  /* ---------- header / scroll ---------- */
  var lastScroll = 0;
  function initHeader() {
    if (!header) return;
    var stuck = false;
    var handle = function () {
      var s = window.pageYOffset || doc.documentElement.scrollTop;
      // scroll progress
      if (progress) {
        var h = doc.documentElement.scrollHeight - doc.documentElement.clientHeight;
        var p = h ? Math.min(1, s / h) : 0;
        gsap.to(progress, { scaleX: p, duration: 0.2, overwrite: true });
      }
      // stuck / tucked header
      if (s > 60 && !stuck) {
        stuck = true;
        header.classList.add('is-stuck');
      } else if (s <= 60 && stuck) {
        stuck = false;
        header.classList.remove('is-stuck');
      }
      if (s > lastScroll && s > 100) {
        header.classList.add('is-tucked');
      } else {
        header.classList.remove('is-tucked');
      }
      lastScroll = s;
      railSync();
    };
    window.addEventListener('scroll', handle, { passive: true });
    handle();
  }

  /* ---------- rail active state ---------- */
  function railSync() {
    if (!railLinks.length) return;
    var s = window.pageYOffset || doc.documentElement.scrollTop;
    var innerH = window.innerHeight;
    var current = null;
    sections.forEach(function (sec) {
      var top = sec.offsetTop;
      var bottom = top + sec.offsetHeight;
      if (s + innerH * 0.25 >= top && s + innerH * 0.25 < bottom) current = sec.id;
    });
    railLinks.forEach(function (a) {
      var active = a.getAttribute('href') === '#' + current;
      a.classList.toggle('is-active', active);
    });
  }

  /* ---------- reveals on scroll ---------- */
  function initReveals() {
    if (reduced) {
      $$('[data-reveal]').forEach(function (el) {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.clipPath = 'none';
      });
      return;
    }
    $$('[data-reveal=up]').forEach(function (el) {
      gsap.fromTo(
        el,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true }
        }
      );
    });
    $$('[data-reveal=clip]').forEach(function (el) {
      gsap.fromTo(
        el,
        { clipPath: 'inset(0 0 100% 0)' },
        {
          clipPath: 'inset(0 0 0 0)',
          duration: 1,
          ease: ease,
          scrollTrigger: { trigger: el, start: 'top 90%', once: true }
        }
      );
    });
  }

  /* ---------- mission board ---------- */
  function initMissions() {
    $$('.mission').forEach(function (card) {
      card.addEventListener('click', function () {
        var picked = card.classList.contains('is-picked');
        $$('.mission').forEach(function (c) {
          c.classList.remove('is-picked', 'is-dimmed');
        });
        if (!picked) {
          card.classList.add('is-picked');
          $$('.mission').forEach(function (c) {
            if (c !== card) c.classList.add('is-dimmed');
          });
        }
      });
    });
  }

  /* ---------- factory crates ---------- */
  $$('.crate').forEach(function (crate) {
    crate.addEventListener('click', function () {
      var done = crate.classList.toggle('is-done');
      var stamp = crate.querySelector('.crate__stamp');
      if (done && stamp) stamp.textContent = 'Done';
    });
  });

  /* ---------- board items (toggle press) ---------- */
  $$('.board__item').forEach(function (item) {
    item.addEventListener('click', function () {
      var pressed = item.getAttribute('aria-pressed') === 'true';
      item.setAttribute('aria-pressed', String(!pressed));
    });
  });

  /* ---------- filters ---------- */
  $$('.filters button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      $$('.filters button').forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
    });
  });

  /* ---------- page veil transitions ---------- */
  function veilTransition(href) {
    if (!veil) return;
    gsap.to(veil, {
      translateY: 0,
      duration: 0.5,
      ease: ease,
      onComplete: function () {
        window.location.href = href;
      }
    });
  }
  $$('a[href]').forEach(function (a) {
    var href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    if (href.startsWith(window.location.origin) || href.startsWith('/')) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        veilTransition(href);
      });
    }
  });

  /* ---------- burger menu ---------- */
  var menuOpen = false;
  function toggleMenu() {
    menuOpen = !menuOpen;
    burger.classList.toggle('is-open', menuOpen);
    menu.classList.toggle('is-open', menuOpen);
    gsap.to(menu, {
      clipPath: menuOpen ? 'inset(0 0 0% 0)' : 'inset(0 0 100% 0)',
      duration: 0.6,
      ease: ease
    });
    body.style.overflow = menuOpen ? 'hidden' : '';
  }
  if (burger) burger.addEventListener('click', toggleMenu);
  $$('.site-menu a').forEach(function (a) { a.addEventListener('click', function () { if (menuOpen) toggleMenu(); }); });

  /* ---------- skip story ---------- */
  if (skipStory) {
    skipStory.addEventListener('click', function () {
      skipStory.classList.toggle('is-on');
      var work = $('#work');
      if (work) work.scrollIntoView({ behavior: 'smooth' });
    });
  }

  /* ---------- init ---------- */
  function init() {
    initLoader();
    initCursor();
    initHeader();
    initReveals();
    initMissions();
    railSync();
    window.addEventListener('scroll', railSync, { passive: true });
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
