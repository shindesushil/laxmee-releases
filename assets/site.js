// Laxmee site: header tint on scroll, mobile menu, FAQ deep links, current year. No tracking.
(function () {
  var header = document.querySelector('.site-header');
  var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var btn = document.querySelector('.menu-btn');
  var menu = document.getElementById('mobile-menu');
  if (btn && menu) {
    var setOpen = function (open) {
      menu.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      btn.querySelector('use').setAttribute('href', open ? '#i-x' : '#i-menu');
      header.classList.toggle('scrolled', open || window.scrollY > 8);
    };
    btn.addEventListener('click', function () { setOpen(menu.hidden); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { setOpen(false); btn.focus(); }
    });
    window.matchMedia('(min-width: 861px)').addEventListener('change', function (m) { if (m.matches) setOpen(false); });
  }

  // "When can I get it?" and #faq-… links open the answer they point to.
  var openFaq = function (id) {
    var d = document.getElementById(id);
    if (d && d.tagName === 'DETAILS') d.open = true;
  };
  document.querySelectorAll('[data-open]').forEach(function (a) {
    a.addEventListener('click', function () { openFaq(a.getAttribute('data-open')); });
  });
  if (location.hash) openFaq(location.hash.slice(1));

  var calm = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EASE = 'cubic-bezier(.2, .8, .2, 1)';

  // FAQ answers: expand and collapse smoothly instead of jumping open.
  document.querySelectorAll('.faq-list details').forEach(function (d) {
    var summary = d.querySelector('summary');
    var answer = d.querySelector('.answer');
    if (!summary || !answer || !answer.animate) return;
    var running = null;
    summary.addEventListener('click', function (e) {
      if (!calm) return;
      e.preventDefault();
      if (running) running.cancel();
      var opening = !d.open;
      if (opening) d.open = true;
      var h = answer.scrollHeight;
      var duration = opening ? 380 : 260;
      var anim = answer.animate(
        opening
          ? [{ height: '0px', opacity: 0, transform: 'translateY(-6px)' }, { height: h + 'px', opacity: 1, transform: 'none' }]
          : [{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }],
        { duration: duration, easing: EASE, fill: opening ? 'none' : 'forwards' }
      );
      running = anim;
      var settled = false;
      var settle = function () {
        if (settled || running !== anim) return;
        settled = true;
        running = null;
        if (!opening) d.open = false;
        anim.cancel();
      };
      anim.onfinish = settle;
      // The finish event can be delayed (e.g. a background tab); never leave an answer half-closed.
      setTimeout(settle, duration + 60);
    });
  });

  // FAQ: the heading and questions rise in as they come into view. Only what starts below the
  // screen waits; anything already visible is simply shown.
  if (calm && 'IntersectionObserver' in window) {
    var items = Array.prototype.slice.call(document.querySelectorAll('.faq-head, .faq-list details'));
    var waiting = items.filter(function (el) { return el.getBoundingClientRect().top > window.innerHeight; });
    waiting.forEach(function (el) { el.classList.add('reveal-wait'); });
    var io = new IntersectionObserver(function (entries) {
      var shown = 0;
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.style.transitionDelay = shown++ * 70 + 'ms';
        en.target.classList.add('revealed');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    waiting.forEach(function (el) { io.observe(el); });
  }

  var y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());
})();
