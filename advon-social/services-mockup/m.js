(function(){var els=[].slice.call(document.querySelectorAll('.rv'));
if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion:reduce)').matches||document.hidden){els.forEach(function(e){e.classList.add('in')});return}
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.04});
els.forEach(function(e,i){e.style.transitionDelay=(i%3)*60+'ms';io.observe(e)});
setTimeout(function(){els.forEach(function(e){e.classList.add('in')})},4000);})();
