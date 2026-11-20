/* Advon «Ξεκινάμε» prototype — shared behaviour. Nothing is sent anywhere; data stays in this tab (sessionStorage). */
(function () {
  var d = document, h = d.documentElement;
  h.classList.add('js');
  // sticky header sits under the yellow draft bar
  var bar = d.querySelector('.dbar');
  function dbh() { h.style.setProperty('--dbh', (bar ? bar.offsetHeight : 0) + 'px'); }
  dbh(); addEventListener('resize', dbh);
  // reveals (visible without JS; safety net for background tabs)
  var rv = [].slice.call(d.querySelectorAll('.rv'));
  if ('IntersectionObserver' in window && !d.hidden) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: .04 });
    rv.forEach(function (el, i) { el.style.transitionDelay = Math.min((i % 4) * 60, 180) + 'ms'; io.observe(el); });
    setTimeout(function () { rv.forEach(function (el) { el.classList.add('in'); }); }, 4000);
  } else rv.forEach(function (el) { el.classList.add('in'); });
  // phone CTA bar after the first screen
  var mb = d.querySelector('.mbar');
  if (mb) {
    var stop = d.getElementById('final');
    var onS = function () {
      var past = scrollY > innerHeight * .7;
      var atEnd = stop ? stop.getBoundingClientRect().top < innerHeight * .9 : false;
      mb.classList.toggle('show', past && !atEnd);
    };
    addEventListener('scroll', onS, { passive: true }); onS();
  }
  window.advToast = function (t) {
    var el = d.querySelector('.toast');
    if (!el) { el = d.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); d.body.appendChild(el); }
    el.textContent = t; el.classList.add('show');
    clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove('show'); }, 3200);
  };
  window.advStore = {
    get: function () { try { return JSON.parse(sessionStorage.getItem('adv-start') || '{}'); } catch (e) { return {}; } },
    set: function (o) { try { sessionStorage.setItem('adv-start', JSON.stringify(o)); } catch (e) {} }
  };
})();
