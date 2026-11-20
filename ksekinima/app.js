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
/* uploads: three drop boxes (photos / logo / docs), thumbnails with remove. Files stay in the browser — nothing is uploaded in the draft. */
window.advUploads = function (form, thumbs, onCount) {
  var store = { photos: [], logo: [], docs: [] };
  function total() { return store.photos.length + store.logo.length + store.docs.length; }
  function render() {
    thumbs.innerHTML = '';
    Object.keys(store).forEach(function (k) {
      var box = form.querySelector('.up[data-k=' + k + ']');
      box.classList.toggle('has', store[k].length > 0); box.querySelector('.cnt').textContent = store[k].length;
      store[k].forEach(function (it, i) {
        var fg = document.createElement('figure');
        if (it.url) { var im = document.createElement('img'); im.src = it.url; im.alt = ''; fg.appendChild(im); }
        else { var s = document.createElement('span'); s.className = 'doc'; s.textContent = (it.f.name.split('.').pop() || 'FILE').toUpperCase(); fg.appendChild(s); }
        var c = document.createElement('figcaption'); c.textContent = it.f.name; fg.appendChild(c);
        var x = document.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', 'Αφαίρεση ' + it.f.name); x.textContent = '×';
        x.onclick = function () { if (it.url) URL.revokeObjectURL(it.url); store[k].splice(i, 1); render(); };
        fg.appendChild(x); thumbs.appendChild(fg);
      });
    });
    if (onCount) onCount(total());
  }
  function add(k, files) {
    [].forEach.call(files, function (f) {
      if (total() >= 60) return;
      store[k].push({ f: f, url: /^image\//.test(f.type) && !/heic/i.test(f.type) ? URL.createObjectURL(f) : null });
    });
    render();
  }
  [].forEach.call(form.querySelectorAll('.up'), function (box) {
    var k = box.dataset.k, inp = box.querySelector('input');
    inp.addEventListener('change', function () { add(k, inp.files); inp.value = ''; });
    ['dragenter', 'dragover'].forEach(function (t) { box.addEventListener(t, function (e) { e.preventDefault(); box.classList.add('ov'); }); });
    ['dragleave', 'drop'].forEach(function (t) { box.addEventListener(t, function (e) { e.preventDefault(); box.classList.remove('ov'); if (t === 'drop' && e.dataTransfer) add(k, e.dataTransfer.files); }); });
  });
  render();
  return { counts: function () { return { photos: store.photos.length, logo: store.logo.length, docs: store.docs.length }; } };
};
