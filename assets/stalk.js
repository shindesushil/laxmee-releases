// "Inside the app": one plant grows down the page as you read. A drawn stem joins four growth
// stages (the app's art), passing through each image's own stem where it enters and leaves.
// Scrolling grows or shrinks it; stages unfurl when the stem reaches them. With reduced motion
// (or without this script) the plant is simply shown fully grown.
(function () {
  var section = document.getElementById('features');
  if (!section) return;
  var wrap = section.querySelector('.wrap');
  var svg = wrap.querySelector('.stem');
  var path = svg && svg.querySelector('path');
  var nodes = Array.prototype.slice.call(wrap.querySelectorAll('.node'));
  if (!path || nodes.length === 0) return;

  var STEM_RATIO = 32 / 1024; // the art's stem thickness, as a share of its width
  var LEAD_IN = 140;          // stem drawn above the first stage
  var TIP = 0.6;              // the stem's tip follows 60% down the screen
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var samples = [];           // [y, length] along the path, for mapping scroll to length
  var triggers = [];          // y where each stage unfurls
  var total = 0;
  var shown = false;          // stem is laid out (desktop layout)

  function layout() {
    shown = getComputedStyle(svg).display !== 'none';
    if (!shown) return;
    var box = wrap.getBoundingClientRect();
    var pts = nodes.map(function (n) {
      var r = n.getBoundingClientRect();
      return {
        top: { x: r.left - box.left + r.width * Number(n.dataset.top), y: r.top - box.top },
        bottom: { x: r.left - box.left + r.width * Number(n.dataset.bottom), y: r.bottom - box.top },
        w: r.width,
        h: r.height,
      };
    });
    var d = 'M' + pts[0].top.x + ' ' + (pts[0].top.y - LEAD_IN) + ' L' + pts[0].top.x + ' ' + pts[0].top.y;
    pts.forEach(function (p, i) {
      // Behind the stage image, where the art draws its own stem.
      d += ' L' + p.bottom.x + ' ' + p.bottom.y;
      var next = pts[i + 1];
      if (!next) return;
      // A gentle S between stages.
      var k = (next.top.y - p.bottom.y) * 0.45;
      var sway = (i % 2 === 0 ? 1 : -1) * Math.min(28, p.w * 0.12);
      d += ' C' + (p.bottom.x + sway) + ' ' + (p.bottom.y + k) + ' ' + (next.top.x - sway) + ' ' + (next.top.y - k) + ' ' + next.top.x + ' ' + next.top.y;
    });
    svg.setAttribute('viewBox', '0 0 ' + box.width + ' ' + box.height);
    path.setAttribute('d', d);
    path.style.strokeWidth = String(Math.max(3, pts[0].w * STEM_RATIO));

    total = path.getTotalLength();
    samples = [];
    for (var i = 0; i <= 240; i++) {
      var len = (total * i) / 240;
      samples.push([path.getPointAtLength(len).y, len]);
    }
    triggers = pts.map(function (p) { return p.top.y + p.h * 0.3; });
    path.style.strokeDasharray = String(total);
  }

  function lengthAt(y) {
    if (y <= samples[0][0]) return 0;
    for (var i = 1; i < samples.length; i++) {
      if (samples[i][0] >= y) {
        var a = samples[i - 1], b = samples[i];
        var t = b[0] === a[0] ? 1 : (y - a[0]) / (b[0] - a[0]);
        return a[1] + (b[1] - a[1]) * t;
      }
    }
    return total;
  }

  function grow() {
    if (!shown) return;
    if (reduce.matches) {
      path.style.strokeDashoffset = '0';
      return;
    }
    var tip = window.innerHeight * TIP - wrap.getBoundingClientRect().top;
    path.style.strokeDashoffset = String(total - lengthAt(tip));
    nodes.forEach(function (n, i) { n.classList.toggle('grown', tip >= triggers[i]); });
  }

  var queued = false;
  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; grow(); });
  }

  function setMode() {
    section.classList.toggle('stalk-live', !reduce.matches);
    layout();
    grow();
  }

  setMode();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { layout(); grow(); });
  window.addEventListener('load', function () { layout(); grow(); });
  if (reduce.addEventListener) reduce.addEventListener('change', setMode);
})();
