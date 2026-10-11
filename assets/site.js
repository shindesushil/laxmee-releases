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

  var y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());
})();
