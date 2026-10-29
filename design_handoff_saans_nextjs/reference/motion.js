(function () {
  if (window.__saansMotion) return;
  window.__saansMotion = true;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const KEY = 'saans-nav';
  const coarse = matchMedia('(pointer: coarse)').matches;
  const ease = 'cubic-bezier(.65,0,.35,1)';
  const LOGO = '<svg width="64" height="70" viewBox="50 38 170 186" aria-hidden="true"><path d="M50 129V102C50 68 80 53 110 53H170V82C170 114 140 129 112 129Z" fill="currentColor"></path><path d="M70 224V197C70 163 100 148 130 148H190V177C190 209 160 224 132 224Z" fill="currentColor" opacity=".55"></path><circle cx="204.5" cy="53.5" r="15" fill="#FF5E00"></circle></svg>';
  const css = document.createElement('style');
  css.textContent = '::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal}' +
    '.sm-ripple{position:absolute;border-radius:50%;pointer-events:none;background:currentColor;opacity:.22;transform:scale(0);z-index:0}' +
    'html.sm-theming,html.sm-theming *{transition:background-color .6s ease,color .6s ease,border-color .6s ease,fill .6s ease!important}';
  document.head.appendChild(css);
  const dark = () => document.documentElement.getAttribute('data-theme') === 'dark';
  let px = innerWidth / 2, py = innerHeight / 2;
  addEventListener('pointerdown', e => { px = e.clientX; py = e.clientY; }, true);

  function veil(x, y) {
    const v = document.createElement('div');
    v.setAttribute('aria-hidden', 'true');
    const bg = dark() ? '#2A2440' : '#5E5480';
    v.style.cssText = 'position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;pointer-events:none;background:' + bg + ';color:' + (dark() ? '#C9C0E6' : '#F7F5FA') + ';clip-path:circle(0px at ' + x + 'px ' + y + 'px)';
    v.innerHTML = LOGO;
    document.body.appendChild(v);
    return v;
  }
  const radius = (x, y) => Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 4;

  window.saansGo = function (url) {
    if (reduced) { location.href = url; return; }
    const x = px, y = py, r = radius(x, y);
    try { sessionStorage.setItem(KEY, JSON.stringify({ t: Date.now() })); } catch (e) {}
    const v = veil(x, y);
    const logo = v.firstChild;
    logo.animate([{ opacity: 0, transform: 'scale(.6) rotate(-20deg)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: 180, easing: 'cubic-bezier(.2,.9,.3,1.25)', fill: 'both' });
    v.animate([{ clipPath: 'circle(0px at ' + x + 'px ' + y + 'px)' }, { clipPath: 'circle(' + r + 'px at ' + x + 'px ' + y + 'px)' }], { duration: 620, easing: ease, fill: 'forwards' })
      .finished.then(() => setTimeout(nav, 140));
    let gone = false;
    function nav() { if (gone) return; gone = true; location.href = url; }
    setTimeout(nav, 1000);
  };

  function enter() {
    let nav = null;
    try { nav = JSON.parse(sessionStorage.getItem(KEY) || 'null'); sessionStorage.removeItem(KEY); } catch (e) {}
    if (!nav || Date.now() - nav.t > 8000 || reduced) return;
    const x = innerWidth / 2, y = innerHeight / 2, r = radius(x, y);
    const v = veil(x, y);
    v.style.clipPath = 'circle(' + r + 'px at ' + x + 'px ' + y + 'px)';
    const go = () => {
      v.firstChild.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(1.3)' }], { duration: 360, easing: 'ease-in', fill: 'forwards' });
      v.animate([{ clipPath: 'circle(' + r + 'px at ' + x + 'px ' + y + 'px)' }, { clipPath: 'circle(0px at ' + x + 'px ' + y + 'px)' }], { duration: 700, delay: 100, easing: ease, fill: 'forwards' })
        .finished.then(() => v.remove());
      setTimeout(() => v.remove(), 1600);
      const main = document.querySelector('main');
      if (main) main.animate([{ opacity: 0, transform: 'scale(.96) translateY(18px)', filter: coarse ? 'none' : 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'none' }], { duration: 800, delay: 180, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
    };
    (document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 900))]) : Promise.resolve()).then(() => setTimeout(go, 120));
    setTimeout(() => v.remove(), 3000);
  }
  if (document.body) enter(); else addEventListener('DOMContentLoaded', enter);

  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank') return;
    const href = a.getAttribute('href');
    if (!/\.dc\.html(\?|#|$)/.test(href)) return;
    e.preventDefault();
    window.saansGo(a.href);
  });

  document.addEventListener('pointerdown', e => {
    if (reduced || e.button !== 0) return;
    const el = e.target.closest && e.target.closest('button, a[href]');
    if (!el) return;
    const cs = getComputedStyle(el);
    const isBtn = el.tagName === 'BUTTON' || /flex|grid/.test(cs.display);
    if (!isBtn || el.offsetWidth < 30 || el.offsetHeight < 30) return;
    el.animate([{ transform: 'scale(1)' }, { transform: 'scale(.96)', offset: .3 }, { transform: 'scale(1)' }], { duration: 560, easing: 'cubic-bezier(.22,1,.36,1)', composite: 'add' });
    if (cs.position === 'static') el.style.position = 'relative';
    el.style.overflow = 'hidden'; el.style.isolation = 'isolate';
    const b = el.getBoundingClientRect(), s = Math.max(b.width, b.height) * 2.2;
    const r = document.createElement('span');
    r.className = 'sm-ripple';
    r.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (e.clientX - b.left - s / 2) + 'px;top:' + (e.clientY - b.top - s / 2) + 'px';
    el.appendChild(r);
    r.animate([{ transform: 'scale(0)', opacity: .28 }, { transform: 'scale(1)', opacity: 0 }], { duration: 900, easing: 'cubic-bezier(.22,1,.36,1)' }).finished.then(() => r.remove());
  }, true);

  window.saansTheme = function (t, e, apply) {
    const root = document.documentElement;
    const set = () => { root.setAttribute('data-theme', t); apply && apply(); };
    if (reduced) return set();
    const x = e && e.clientX ? e.clientX : innerWidth - 60, y = e && e.clientY ? e.clientY : 38;
    if (!document.startViewTransition) {
      root.classList.add('sm-theming'); set();
      setTimeout(() => root.classList.remove('sm-theming'), 650);
      return;
    }
    if (coarse || innerWidth < 900) {
      const vt0 = document.startViewTransition(set);
      vt0.ready.then(() => {
        root.animate({ opacity: [0, 1] }, { duration: 260, easing: 'ease-out', pseudoElement: '::view-transition-new(root)' });
        root.animate({ opacity: [1, 0] }, { duration: 260, easing: 'ease-out', pseudoElement: '::view-transition-old(root)' });
      }).catch(() => {});
      return;
    }
    const r = radius(x, y);
    const vt = document.startViewTransition(set);
    vt.ready.then(() => {
      root.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + r + 'px at ' + x + 'px ' + y + 'px)'], ...(coarse ? {} : { filter: ['blur(8px)', 'blur(0)'] }) }, { duration: 700, easing: ease, pseudoElement: '::view-transition-new(root)' });
      root.animate({ transform: ['scale(1)', 'scale(.96)'], filter: ['brightness(1)', 'brightness(.8)'] }, { duration: 700, easing: ease, pseudoElement: '::view-transition-old(root)' });
    });
  };
})();
