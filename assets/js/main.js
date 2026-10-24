/* Grainful homepage (Himon template) – interactions, no dependencies. Without JS every product panel and every review
   shows, the header stays readable, and nothing is hidden. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header: transparent over the hero, white once the page scrolls or the menu opens ---------- */
  var hdr = document.querySelector('[data-hdr]');
  var burger = document.querySelector('[data-burger]');
  var nav = document.getElementById('nav');
  var setSolid = function () {
    if (!hdr) return;
    var open = burger && burger.getAttribute('aria-expanded') === 'true';
    hdr.classList.toggle('is-solid', open || window.scrollY > 40);
  };
  window.addEventListener('scroll', setSolid, { passive: true });
  setSolid();

  /* ---------- Hero (cominvi.com.mx): intro, then grainful.in's three photos switch every 6s. Each new photo opens out
     of a small white frame in the middle of the screen (clip-path + frame, 1.8s) while it settles from 120%; the shown
     photo drifts slowly. Pause / Play button; switching also waits while the tab is hidden or the hero is off screen.
     The photos move down at 30% of the scroll speed. Reduced motion: no intro, no switching, no parallax. ---------- */
  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var hSlides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var hBg = hero.querySelector('[data-hero-bg]'), hFrame = hero.querySelector('.hero-frame');
    var hPause = hero.querySelector('[data-hero-pause]'), hPauseLabel = hero.querySelector('[data-hero-pause-label]');
    var hCur = 0, hTimer = 0, hBusy = false, hPaused = false, hSeen = true;
    var DWELL = 6000, OPEN = 1800;
    var setFrameBox = function () {
      // a 3:2 frame, 16rem wide (half the width on small screens), in the middle of the hero
      var W = hero.clientWidth, H = hero.clientHeight, fw = Math.min(256, W * 0.5), fh = fw * 2 / 3;
      hero.style.setProperty('--hf-x', ((W - fw) / 2).toFixed(1) + 'px');
      hero.style.setProperty('--hf-y', ((H - fh) / 2).toFixed(1) + 'px');
    };
    var openSlide = function (k, done) {
      var next = hSlides[k], prev = hSlides[hCur];
      hBusy = true;
      setFrameBox();
      next.classList.remove('is-on', 'is-drift');
      next.classList.add('is-enter');
      hFrame.classList.add('is-on');
      void next.offsetWidth; // apply the start state before transitioning
      next.classList.add('is-go'); hFrame.classList.add('is-go');
      window.setTimeout(function () {
        if (prev !== next) prev.classList.remove('is-on', 'is-drift');
        next.classList.remove('is-enter', 'is-go');
        next.classList.add('is-on');
        if (!hPaused) next.classList.add('is-drift');
        hFrame.classList.remove('is-on', 'is-go');
        hCur = k; hBusy = false;
        if (done) done();
      }, OPEN + 50);
    };
    var schedule = function () {
      window.clearTimeout(hTimer);
      if (hPaused || !hSeen || document.hidden || hBusy) return;
      hTimer = window.setTimeout(function () { openSlide((hCur + 1) % hSlides.length, schedule); }, DWELL);
    };
    if (!reduceMotion && hSlides.length > 1) {
      // start once the first photo is ready (or after 1.5s), two frames after the start state has painted
      var hStarted = false, hFirst = hSlides[0].querySelector('img');
      var hStart = function () {
        if (hStarted) return;
        hStarted = true;
        window.requestAnimationFrame(function () { window.requestAnimationFrame(function () {
          openSlide(0, schedule);
          hero.classList.add('is-intro');
        }); });
      };
      if (hFirst.complete) hStart(); else { hFirst.addEventListener('load', hStart); hFirst.addEventListener('error', hStart); }
      window.setTimeout(hStart, 1500);
      hPause.hidden = false;
      hPause.addEventListener('click', function () {
        hPaused = !hPaused;
        hPause.classList.toggle('is-paused', hPaused);
        hPauseLabel.textContent = hPaused ? 'Play' : 'Pause';
        hSlides[hCur].classList.toggle('is-drift', !hPaused);
        schedule();
      });
      document.addEventListener('visibilitychange', schedule);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) { hSeen = en[0].isIntersecting; schedule(); }).observe(hero);
      }
      var hTick = false;
      window.addEventListener('scroll', function () {
        if (hTick) return;
        hTick = true;
        window.requestAnimationFrame(function () {
          hTick = false;
          var y = Math.min(window.scrollY, hero.offsetHeight);
          hBg.style.transform = y > 0 ? 'translate3d(0,' + (y * 0.3).toFixed(1) + 'px,0)' : '';
        });
      }, { passive: true });
    } else {
      hero.classList.add('is-intro', 'is-static');
    }
  }

  /* ---------- Mobile menu ---------- */
  if (burger && nav) {
    var setMenu = function (open) {
      burger.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      setSolid();
    };
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { setMenu(false); burger.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 860) setMenu(false); });
  }

  /* ---------- About cards: the title button opens the rest of the text (tap and keyboard; pointers also open it on
     hover, in CSS). The photo is outside the cards, so it never changes size. ---------- */
  document.querySelectorAll('[data-about] .ab-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var card = btn.closest('.ab-card');
      var open = !card.classList.contains('is-open');
      card.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* ---------- Why Choose Us (Millwright "How an order runs"): on wide screens with motion allowed the stage is
     pinned and the track moves sideways with the scroll (a short hold first, as in the template). The panel showing
     most becomes active; the intro fades as the panels arrive; the rail fills with progress and its stops jump to their
     panel. Elsewhere (phones, short screens, reduced motion) the panels stack as a plain list. ---------- */
  var why = document.querySelector('[data-why]');
  if (why) {
    var wyPin = why.querySelector('[data-wy-pin]');
    var wyTrack = why.querySelector('[data-wy-track]');
    var wyIntro = why.querySelector('[data-wy-intro]');
    var wyFill = why.querySelector('[data-wy-fill]');
    var wyPanels = Array.prototype.slice.call(why.querySelectorAll('[data-wy-panel]'));
    var wyStops = Array.prototype.slice.call(why.querySelectorAll('[data-wy-stop]'));
    var wyMq = window.matchMedia('(min-width: 992px) and (min-height: 600px)');
    var wyTravel = 0, wyHold = 0, wyAct = -1, wyTick = false;
    var wySetActive = function (i) {
      if (i === wyAct) return;
      wyAct = i;
      wyPanels.forEach(function (p, k) { p.classList.toggle('is-on', k === i); });
      wyStops.forEach(function (b, k) { b.classList.toggle('is-on', k === i); b.classList.toggle('is-done', k < i); });
    };
    var wyMeasure = function () {
      var pin = wyMq.matches && !reduceMotion;
      why.classList.toggle('is-pin', pin);
      if (!pin) { wyPin.style.height = ''; wyTrack.style.transform = ''; wyIntro.style.opacity = ''; wySetActive(0); return; }
      var vw = why.querySelector('.wy-stage').clientWidth, vh = why.querySelector('.wy-stage').clientHeight;
      wyTravel = Math.max(0, wyTrack.scrollWidth - vw);
      wyHold = vh * 0.38; // the intro and first panel stay still for a moment before the track moves
      wyPin.style.height = (vh + wyHold + wyTravel) + 'px';
      wyUpdate();
    };
    var wyUpdate = function () {
      wyTick = false;
      if (!why.classList.contains('is-pin')) return;
      var scrolled = Math.max(0, -wyPin.getBoundingClientRect().top);
      var x = Math.max(0, Math.min(wyTravel, scrolled - wyHold));
      wyTrack.style.transform = 'translate3d(' + (-x).toFixed(1) + 'px,0,0)';
      wyIntro.style.opacity = String(Math.max(0, 1 - Math.max(0, scrolled - wyHold) / (window.innerHeight * 0.35)));
      var p = wyTravel ? x / wyTravel : 0, n = wyPanels.length;
      wyFill.style.transform = 'scaleX(' + (1 / n + (1 - 1 / n) * p).toFixed(4) + ')';
      // the panel with the most of itself on screen is the active one
      var vw = window.innerWidth, best = 0, bestW = -1;
      wyPanels.forEach(function (pn, k) { var r = pn.getBoundingClientRect(); var w = Math.min(vw, r.right) - Math.max(0, r.left); if (w > bestW) { bestW = w; best = k; } });
      wySetActive(best);
    };
    window.addEventListener('scroll', function () { if (!wyTick) { wyTick = true; window.requestAnimationFrame(wyUpdate); } }, { passive: true });
    window.addEventListener('resize', wyMeasure);
    wyStops.forEach(function (b, k) {
      b.setAttribute('aria-label', 'Show ' + b.querySelector('.wy-nm').textContent);
      b.addEventListener('click', function () {
        if (!why.classList.contains('is-pin')) { wyPanels[k].scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); return; }
        // scroll to where this panel sits in view (its left edge just after the intro has gone)
        var target = wyPanels[k].offsetLeft - (window.innerWidth - wyPanels[k].offsetWidth) / 2;
        var x = Math.max(0, Math.min(wyTravel, target));
        var y = wyPin.getBoundingClientRect().top + window.scrollY + wyHold + x;
        window.scrollTo({ top: y, behavior: 'smooth' });
      });
    });
    // keyboard users moving through the panels' text get the panel brought into view
    wyMeasure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(wyMeasure);
  }

  /* ---------- Manufacturing facility (Wonder theme "Shop the room"): on wide screens each + marker opens its card next
     to it (hover or focus with a pointer, click or tap otherwise; Esc or a click elsewhere closes). The card sits under
     the marker, or above it for markers in the lower half, kept inside the photo and clear of the other markers and the
     heading; its pointer aims at the marker.
     On wide screens the photo also holds under the header while the scroll opens the three cards in turn.
     Below 1024px: the cards stay a list under the photo and a marker highlights its card. ---------- */
  var hs = document.querySelector('[data-hotspots]');
  if (hs) {
    var hsWrap = hs.querySelector('.hs-wrap');
    var hsCopy = hs.querySelector('[data-hs-copy] .hs-copy-in'); // the heading block, which cards must not cover
    var hsDots = Array.prototype.slice.call(hs.querySelectorAll('[data-hs]'));
    var hsTips = Array.prototype.slice.call(hs.querySelectorAll('[data-hs-tip]'));
    var hsMq = window.matchMedia('(min-width: 1024px)'); // below this the photo is too small for floating cards
    var hsOpen = -1, hsTimer = null;
    var hsPlace = function (i) {
      var tip = hsTips[i], dot = hsDots[i];
      var W = hsWrap.clientWidth, H = hs.querySelector('.hs-media').clientHeight;
      var dx = dot.offsetLeft, dy = dot.offsetTop, tw = tip.offsetWidth, th = tip.offsetHeight, gap = 30;
      var prefUp = dy > H * 0.55;
      // try centred, then shifted left or right, above or below; take the first spot that covers no other marker
      var clampX = function (x) { return Math.max(12, Math.min(W - tw - 12, x)); };
      var wr = hsWrap.getBoundingClientRect(), cr = hsCopy ? hsCopy.getBoundingClientRect() : null;
      var covers = function (l, t) {
        var onCopy = cr && cr.width && l < cr.right - wr.left + 16 && l + tw > cr.left - wr.left - 16 && t < cr.bottom - wr.top + 16 && t + th > cr.top - wr.top - 16;
        return onCopy || hsDots.some(function (o, k) {
          if (k === i) return false;
          var ox = o.offsetLeft, oy = o.offsetTop, r = 32; // a marker with its ring reaches about 28px from its centre
          return ox > l - r && ox < l + tw + r && oy > t - r && oy < t + th + r;
        });
      };
      var pick = null;
      [prefUp, !prefUp].forEach(function (up) {
        [dx - tw / 2, dx - tw + 40, dx - 40, dx - tw + 16, dx - 16].forEach(function (x) {
          if (pick) return;
          var l = clampX(x), t = up ? dy - th - gap : dy + gap;
          if (t < 8 || t + th > H - 8) return;
          if (!covers(l, t)) pick = { l: l, t: t, up: up };
        });
      });
      if (!pick) pick = { l: clampX(dx - tw / 2), t: prefUp ? dy - th - gap : dy + gap, up: prefUp };
      tip.classList.toggle('is-up', pick.up);
      tip.style.left = pick.l + 'px'; tip.style.top = pick.t + 'px';
      tip.style.setProperty('--hs-x', Math.max(14, Math.min(tw - 14, dx - pick.l)) + 'px');
    };
    var hsSet = function (i) {
      hsOpen = i;
      hsDots.forEach(function (d, k) { d.classList.toggle('is-open', k === i); d.setAttribute('aria-expanded', String(k === i)); });
      hsTips.forEach(function (t, k) { t.classList.toggle('is-open', k === i); });
      if (i >= 0 && hsWrap.classList.contains('is-float')) hsPlace(i);
    };
    // each marker carries its point on the photo (data-ix / data-iy, fractions of the source image); this works out where
    // that point lands under object-fit: cover and the current object-position, so markers stay put at any size
    var hsImg = hs.querySelector('.hs-media img');
    var hsPin = function () {
      var m = hsImg.parentElement, W = m.clientWidth, H = m.clientHeight, iw = hsImg.naturalWidth || 694, ih = hsImg.naturalHeight || 520;
      var sc = Math.max(W / iw, H / ih), dw = iw * sc, dh = ih * sc;
      var pos = getComputedStyle(hsImg).objectPosition.split(' ').map(function (v) { return parseFloat(v) / 100; });
      var ox = (W - dw) * (isNaN(pos[0]) ? .5 : pos[0]), oy = (H - dh) * (isNaN(pos[1]) ? .5 : pos[1]);
      // where the heading lies over the photo (wide screens), a marker that would touch it moves just below it
      var cr = hs.classList.contains('is-steps') && hsCopy ? hsCopy.getBoundingClientRect() : null, mr = m.getBoundingClientRect();
      hsDots.forEach(function (d) {
        var x = ox + parseFloat(d.getAttribute('data-ix')) * dw, y = oy + parseFloat(d.getAttribute('data-iy')) * dh, pad = 40;
        x = Math.max(28, Math.min(W - 28, x)); y = Math.max(28, Math.min(H - 28, y)); // a tall frame crops the photo's sides
        if (cr && cr.width && x > cr.left - mr.left - pad && x < cr.right - mr.left + pad && y > cr.top - mr.top - pad && y < cr.bottom - mr.top + pad) y = cr.bottom - mr.top + pad;
        d.style.left = x.toFixed(1) + 'px';
        d.style.top = y.toFixed(1) + 'px';
      });
    };
    // scroll steps: while the photo is held (wide screens), the scroll opens card 1, 2, 3 in turn
    var hsStep = -2;
    var hsScroll = function () {
      if (!hsMq.matches) return;
      var top = parseFloat(getComputedStyle(hsWrap).top) || 0, r = hs.getBoundingClientRect();
      var run = hs.offsetHeight - hsWrap.offsetHeight;
      var step = r.top > top + 1 ? -1 : Math.min(hsTips.length - 1, Math.floor(Math.max(0, (top - r.top) / run) * hsTips.length));
      if (step !== hsStep) { hsStep = step; clearTimeout(hsTimer); hsSet(step); }
    };
    window.addEventListener('scroll', hsScroll, { passive: true });
    var hsMode = function () {
      hs.classList.toggle('is-steps', hsMq.matches); // changes the photo's height, so before the markers are placed
      hsPin();
      hsWrap.classList.toggle('is-float', hsMq.matches);
      hsStep = -2; hsScroll();
      if (hsOpen >= 0 && hsMq.matches) hsPlace(hsOpen);
    };
    hsDots.forEach(function (d, k) {
      d.addEventListener('click', function (ev) { ev.stopPropagation(); hsSet(hsOpen === k ? -1 : k); });
      d.addEventListener('mouseenter', function () { if (window.matchMedia('(hover: hover)').matches && hsMq.matches) { clearTimeout(hsTimer); hsSet(k); } });
      d.addEventListener('mouseleave', function () { if (window.matchMedia('(hover: hover)').matches && hsMq.matches) hsTimer = setTimeout(function () { hsSet(-1); }, 250); });
      d.addEventListener('focus', function () { if (hsMq.matches) hsSet(k); });
    });
    hsTips.forEach(function (t) {
      t.addEventListener('mouseenter', function () { clearTimeout(hsTimer); });
      t.addEventListener('mouseleave', function () { if (window.matchMedia('(hover: hover)').matches && hsMq.matches) hsTimer = setTimeout(function () { hsSet(-1); }, 250); });
    });
    document.addEventListener('click', function (ev) { if (hsOpen >= 0 && !ev.target.closest('.hs-tip')) hsSet(-1); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && hsOpen >= 0) { var d = hsDots[hsOpen]; hsSet(-1); d.focus(); } });
    window.addEventListener('resize', hsMode);
    if (!hsImg.complete) hsImg.addEventListener('load', hsMode);
    hsMode();
  }

  /* ---------- How We Work (polpharmabiologics.com "We know" stage). From 1024px without reduced motion the section
     pins for 920vh. t = screens scrolled since the section reached the top:
       from -0.55    "How We Work" rises in, very large in the middle (as it comes into view)
       0.2 – 1.1     it shrinks into the title column (scroll-linked); the blurred first photo fades in
       0.75          the intro rises in beside it
       stage k       from t = 1.75 + 0.9 (k - 1) its panel wipes up in full (1s, whatever the scrolling does), the photo
                     settling from 112%, while the title, description and number swap line by line; scrolling back reverses it
       7.2 – 8.2     the stage dims while Our Assurance slides over it
     Everything else (phones, reduced motion, no JS) is a plain list. ---------- */
  var wk = document.querySelector('[data-work]');
  if (wk) {
    var wkLayers = wk.querySelector('[data-wk-layers]'), wkBig = wk.querySelector('.wk-big');
    var wkIntro = wk.querySelector('.wk-intro');
    var wkTitles = Array.prototype.slice.call(wk.querySelectorAll('.wk-t'));
    var wkDescs = Array.prototype.slice.call(wk.querySelectorAll('.wk-d'));
    var wkNums = Array.prototype.slice.call(wk.querySelectorAll('.wk-n'));
    var wkTexts = Array.prototype.slice.call(wk.querySelectorAll('[data-wk-text]'));
    var wkOn = false, wkTick = false, wkState = -2, wkSplitW = 0, wkPanels = [];
    var wkClamp = function (v) { return Math.max(0, Math.min(1, v)); };
    // split text into its rendered lines, each in a mask
    var wkOrig = wkTexts.map(function (el) { return el.textContent; });
    var wkSplit = function () {
      var w = wk.clientWidth; if (w === wkSplitW) return; wkSplitW = w;
      wkTexts.forEach(function (el, k) {
        el.textContent = '';
        var words = wkOrig[k].split(' ').map(function (wd, i) { if (i) el.appendChild(document.createTextNode(' ')); var sp = document.createElement('span'); sp.textContent = wd; el.appendChild(sp); return sp; });
        var lines = [], top = null;
        words.forEach(function (sp) { if (sp.offsetTop !== top) { lines.push([]); top = sp.offsetTop; } lines[lines.length - 1].push(sp.textContent); });
        el.textContent = '';
        lines.forEach(function (ws, i) {
          var m = document.createElement('span'); m.className = 'wk-ln';
          var inn = document.createElement('span'); inn.className = 'wk-ln-in'; inn.textContent = ws.join(' ');
          inn.style.setProperty('--d', (i * 0.035).toFixed(3) + 's'); m.appendChild(inn); el.appendChild(m);
        });
      });
      wkNums.forEach(function (n) { if (!n.querySelector('.wk-ln')) { var m = document.createElement('span'); m.className = 'wk-ln'; var inn = document.createElement('span'); inn.className = 'wk-ln-in'; while (n.firstChild) inn.appendChild(n.firstChild); m.appendChild(inn); n.appendChild(m); } });
    };
    var wkUnsplit = function () { wkTexts.forEach(function (el, k) { el.textContent = wkOrig[k]; }); wkSplitW = 0; };
    var wkBuild = function () {
      if (wkPanels.length) return;
      var imgs = Array.prototype.slice.call(wk.querySelectorAll('.wk-photo img'));
      [imgs[0]].concat(imgs).forEach(function (img, k) {
        var layer = document.createElement('div'); layer.className = 'wk-layer wk-layer--' + (k % 2 ? 'cream' : 'mist');
        var circle = document.createElement('div'); circle.className = 'wk-frame';
        var im = document.createElement('img'); im.src = img.currentSrc || img.src; im.alt = ''; im.decoding = 'async';
        circle.appendChild(im); layer.appendChild(circle); wkLayers.appendChild(layer); wkPanels.push(layer);
      });
    };
    var wkSwap = function (list, idx) {
      list.forEach(function (el, k) {
        if (k === idx) { el.classList.remove('is-out'); el.classList.add('is-on'); }
        else if (el.classList.contains('is-on')) {
          el.classList.remove('is-on'); el.classList.add('is-out');
          window.setTimeout(function () { if (!el.classList.contains('is-on')) el.classList.remove('is-out'); }, 1100);
        }
      });
    };
    var wkSetState = function (st) {
      if (st === wkState) return; wkState = st;
      wkBig.classList.toggle('is-up', st >= -1);
      wkBig.classList.toggle('is-gone', st >= 1);
      wkSwap([wkIntro].concat(wkDescs), st >= 0 ? st : -1);
      wkSwap(wkTitles, st >= 1 ? st - 1 : -1);
      wkSwap(wkNums, st >= 1 ? st - 1 : -1);
    };
    var wkUpdate = function () {
      wkTick = false;
      if (!wkOn) return;
      var vh = window.innerHeight, t = -wk.getBoundingClientRect().top / vh;
      // big title: from the middle into the title column
      var slot = wkTitles[0], sr = slot.getBoundingClientRect(), stage = wk.querySelector('.wk-stage').getBoundingClientRect();
      var big = parseFloat(getComputedStyle(wkBig).fontSize), small = parseFloat(getComputedStyle(slot).fontSize);
      var k = wkClamp((t - 0.2) / 0.9), ease = k * k * (3 - 2 * k);
      var tx = (sr.left + sr.width / 2) - (stage.left + stage.width / 2), ty = (sr.top + small * 0.55) - (stage.top + stage.height / 2);
      wkBig.style.setProperty('--bx', (tx * ease).toFixed(1) + 'px');
      wkBig.style.setProperty('--by', (ty * ease).toFixed(1) + 'px');
      wkBig.style.setProperty('--bs', (1 + (small / big - 1) * ease).toFixed(4));
      wkPanels[0].style.setProperty('--fade', wkClamp((t - 0.2) / 0.9).toFixed(3));
      // panels wipe up, one per stage
      var st = t < -0.55 ? -2 : t < 0.75 ? -1 : 0; // the title rises as it comes into view, not after an empty band
      for (var i = 1; i < wkPanels.length; i++) {
        // past its point a stage's panel plays its whole wipe (CSS transition), so it never stops halfway when the
        // scrolling stops; scrolling back plays it in reverse. Text, photo and number change together.
        var on = t >= 1.75 + 0.9 * (i - 1);
        wkPanels[i].classList.toggle('is-shown', on);
        if (on) st = i;
      }
      wkSetState(st);
      wk.style.setProperty('--dim', (0.45 * wkClamp(t - 7.2)).toFixed(3));
    };
    var wkReq = function () { if (!wkTick) { wkTick = true; window.requestAnimationFrame(wkUpdate); } };
    var wkMode = function () {
      var want = !reduceMotion && window.innerWidth >= 1024 && window.innerHeight >= 560;
      if (want !== wkOn) {
        wkOn = want;
        wk.classList.toggle('is-pin', wkOn);
        if (wkOn) { wkBuild(); wkState = -2; }
        else { wkUnsplit(); wkTexts.concat(wkNums).forEach(function (el) { el.classList.remove('is-on', 'is-out'); }); wkState = -2; }
      }
      if (wkOn) { wkSplit(); var cur = wkState; wkState = -3; wkSetState(cur); }
      wkReq();
    };
    window.addEventListener('scroll', wkReq, { passive: true });
    var wkResize = 0;
    window.addEventListener('resize', function () { window.clearTimeout(wkResize); wkResize = window.setTimeout(wkMode, 150); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (wkOn) { wkSplitW = 0; wkSplit(); var cur = wkState; wkState = -3; wkSetState(cur); } });
    wkMode();
  }

  /* ---------- Reveal on scroll ---------- */
  var reveal = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        // a masked element starts clipped out of sight inside its mask, so the mask is what gets watched
        (en.target.__reveal || en.target).classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveal.forEach(function (el) {
      var watch = el;
      if (el.getAttribute('data-reveal') === 'mask') { watch = el.parentElement; watch.__reveal = el; }
      // cards that grow in come one after another (100 ms apart, as in Harvestam)
      if (el.getAttribute('data-reveal') === 'grow') {
        el.style.transitionDelay = (Array.prototype.indexOf.call(el.parentElement.children, el) * 100 + 100) + 'ms';
        setTimeout(function () { el.style.transitionDelay = ''; }, 3000);
      }
      io.observe(watch);
    });
  } else {
    reveal.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Private Label (studiors.be strip): from 861px without reduced motion the section pins (210vh) and the
     scroll (0–1 over the pinned part) moves a focus point 0 → 4 along the boxes; the rail slides so the box in focus
     sits from 30% (first box) to 70% (last box) of the width, always on screen, and drifts from +3vh to -3vh. The rail
     starts just below the heading. By distance from the focus each box scales 1 / .94 / .89 and moves +24 / -8 / -28 /
     -40 (px at a 900px-high screen), so the box in focus is the big, lower one. ---------- */
  var pl = document.querySelector('[data-pl]');
  if (pl) {
    var plHead = pl.querySelector('.pl-head'), plRail = pl.querySelector('[data-pl-rail]'), plCards = Array.prototype.slice.call(pl.querySelectorAll('[data-pl-card]'));
    var plOn = false, plTick = false, plN = plCards.length;
    var lerp = function (a, b, t) { return a + (b - a) * t; };
    var plLevel = function (d, vals) { // piecewise linear over distance 0, 1, 2, 3+
      var i = Math.min(Math.floor(d), vals.length - 1), t = d - i;
      return i >= vals.length - 1 ? vals[vals.length - 1] : lerp(vals[i], vals[i + 1], t);
    };
    var plProgress = function () {
      var r = pl.getBoundingClientRect(), run = pl.offsetHeight - window.innerHeight;
      return run > 0 ? Math.max(0, Math.min(1, -r.top / run)) : 0;
    };
    var plUpdate = function () {
      plTick = false;
      if (!plOn) return;
      var vw = window.innerWidth, vh = window.innerHeight, k = vh / 900, p = plProgress();
      var step = vw * 0.02, f = p * (plN - 1);
      plRail.style.top = (plHead.offsetTop + plHead.offsetHeight + 40) + 'px';
      var mid = function (i) { var cd = plCards[i]; return cd.offsetLeft + i * step + cd.offsetWidth / 2; };
      var i0 = Math.floor(f), i1 = Math.min(plN - 1, i0 + 1), focusX = lerp(mid(i0), mid(i1), f - i0);
      plRail.style.transform = 'translate3d(' + (vw * (0.3 + 0.4 * p) - focusX).toFixed(1) + 'px,' + lerp(vh * 0.03, -vh * 0.03, p).toFixed(1) + 'px,0)';
      plCards.forEach(function (card, i) {
        var d = Math.abs(i - f);
        var sc = plLevel(d, [1, 0.94, 0.89]), y = plLevel(d, [24, -8, -28, -40]) * k;
        card.style.transform = 'perspective(1200px) translate3d(' + (i * step).toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotateZ(var(--rz)) rotateY(var(--ry)) scale(' + sc.toFixed(4) + ')';
        card.style.zIndex = String(10 - Math.round(d));
      });    };
    var plReq = function () { if (!plTick) { plTick = true; window.requestAnimationFrame(plUpdate); } };
    var plMode = function () {
      var want = !reduceMotion && window.innerWidth > 860;
      if (want === plOn) { plReq(); return; }
      plOn = want;
      pl.classList.toggle('is-pin', plOn);
      if (!plOn) { plRail.style.transform = ''; plRail.style.top = ''; plCards.forEach(function (card) { card.style.transform = ''; card.style.zIndex = ''; }); }
      plReq();
    };
    window.addEventListener('scroll', plReq, { passive: true });
    window.addEventListener('resize', plMode);
    plMode();
  }

  /* ---------- Our Assurance (elespacio.net stacking cards): each card sticks; while the next card travels its last
     card-height-plus-gap up to the sticking line, the cards under it shrink towards 95% per card and move up 1.125rem
     per card (transform origin: top centre), so their top edges show above the newest card. Reduced motion: none. ---- */
  var stk = document.querySelector('[data-stack]');
  if (stk && !reduceMotion) {
    var sCards = Array.prototype.slice.call(stk.querySelectorAll('[data-stack-card]'));
    var sTick = false;
    var sUpdate = function () {
      sTick = false;
      var rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      var line = parseFloat(getComputedStyle(sCards[0]).top) || 0;
      var gap = parseFloat(getComputedStyle(stk.querySelector('.as-cards')).rowGap) || 0;
      var prog = sCards.map(function (card) {
        var dist = card.offsetHeight + gap;
        return Math.max(0, Math.min(1, (line + dist - card.getBoundingClientRect().top) / dist));
      });
      sCards.forEach(function (card, i) {
        var d = 0;
        for (var k = i + 1; k < sCards.length; k++) d += prog[k];
        card.style.transform = d > 0 ? 'translateY(' + (-d * 1.125 * rem).toFixed(2) + 'px) scale(' + Math.pow(0.95, d).toFixed(4) + ')' : '';
      });
    };
    var sReq = function () { if (!sTick) { sTick = true; window.requestAnimationFrame(sUpdate); } };
    window.addEventListener('scroll', sReq, { passive: true });
    window.addEventListener('resize', sReq);
    sUpdate();
  }

  /* ---------- Contact form (Contact Us page): the site is static, so sending opens the visitor's email app with the
     enquiry filled in, addressed to mail@grainful.in. The browser checks the required email first. The phone and subject
     fields are used when the form has them; the subject line is the visitor's own, or "Enquiry from" their name. ---- */
  var cf = document.querySelector('[data-contact-form]');
  if (cf) {
    cf.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var val = function (n) { var f = cf.elements[n]; return f ? f.value.trim() : ''; };
      var name = val('name'), email = val('email'), phone = val('phone'), subject = val('subject'), msg = val('message');
      var body = 'Name: ' + name + '\nEmail: ' + email + (phone ? '\nPhone: ' + phone : '') + '\n\n' + msg;
      window.location.href = 'mailto:mail@grainful.in?subject=' + encodeURIComponent(subject || ('Enquiry from ' + (name || email))) + '&body=' + encodeURIComponent(body);
      var st = cf.querySelector('[data-contact-status]');
      if (st) st.textContent = 'Your email app should open with your message to mail@grainful.in.';
    });
  }

  /* ---------- Rice varieties (Basmati / Non-Basmati pages): in each variety the grade whose top has passed the middle of
     the screen is the current one (full colour, the others dimmed) and its photo wipes up over the earlier ones in the
     held frame, as How We Work. Phones show each grade's own photo, so there the frame is not used. ---------- */
  var vStages = Array.prototype.slice.call(document.querySelectorAll('[data-vstage]')).map(function (stg) {
    return { items: stg.querySelectorAll('[data-vitem]'), layers: stg.querySelectorAll('.vg-layer'), on: 0 };
  });
  if (vStages.length) {
    var vTick = false;
    var vUpdate = function () {
      vTick = false;
      var mid = window.innerHeight * 0.5;
      vStages.forEach(function (st) {
        var on = 0;
        Array.prototype.forEach.call(st.items, function (it, i) { if (it.getBoundingClientRect().top < mid) on = i; });
        if (on === st.on) return;
        st.on = on;
        var layer = +st.items[on].getAttribute('data-vitem');
        Array.prototype.forEach.call(st.items, function (it, i) { it.classList.toggle('is-on', i === on); });
        Array.prototype.forEach.call(st.layers, function (l, i) { l.classList.toggle('is-shown', i <= layer); });
      });
    };
    var vReq = function () { if (!vTick) { vTick = true; window.requestAnimationFrame(vUpdate); } };
    window.addEventListener('scroll', vReq, { passive: true });
    window.addEventListener('resize', vReq);
    vUpdate();
  }

  /* ---------- Open / close (About's list rows, We Make Your Brand's tiles): the button opens its item and says so ---- */
  document.querySelectorAll('[data-acc-btn]').forEach(function (b) {
    var item = b.closest('[data-acc-item]');
    b.addEventListener('click', function () {
      var open = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      item.classList.toggle('is-open', open);
    });
  });

  /* ---------- Fill (About's opening sentence): its words darken one by one as it scrolls up the screen ---------- */
  var fills = Array.prototype.slice.call(document.querySelectorAll('[data-fill]'));
  if (fills.length && !reduceMotion) {
    fills.forEach(function (f) { f.classList.add('is-filling'); });
    var fTick = false;
    var fUpdate = function () {
      fTick = false;
      var vh = window.innerHeight;
      fills.forEach(function (f) {
        var r = f.getBoundingClientRect(), w = f.querySelectorAll('.fw');
        // starts as the sentence enters the lower fifth of the screen, complete when it reaches the upper third
        var p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 0.55)));
        var lit = Math.round(p * w.length);
        Array.prototype.forEach.call(w, function (x, i) { x.classList.toggle('is-lit', i < lit); });
      });
    };
    var fReq = function () { if (!fTick) { fTick = true; window.requestAnimationFrame(fUpdate); } };
    window.addEventListener('scroll', fReq, { passive: true });
    window.addEventListener('resize', fReq);
    fUpdate();
  }

  /* ---------- Rail (We Make Your Brand's advantages). Wide screens, motion allowed, and the heading and cards fit the
     screen: the section holds (its stage sticks) while the page scroll slides the cards sideways, one pixel across per
     pixel down, until the last card is fully in view; then the page goes on. The arrows then scroll the page one card.
     Otherwise the rail scrolls itself (drag, trackpad, keyboard) and the arrows move it one card. Either way the
     arrows are off at the ends. ---------- */
  document.querySelectorAll('[data-rail]').forEach(function (rail) {
    var sec = rail.closest('[data-rail-sec]'), stage = sec && sec.querySelector('.rail-stage');
    var prev = document.querySelector('[data-rail-prev][aria-controls="' + rail.id + '"]');
    var next = document.querySelector('[data-rail-next][aria-controls="' + rail.id + '"]');
    var pinned = false, dist = 0, rTick = false;
    var step = function () { var c = rail.querySelector('li'); return c ? c.getBoundingClientRect().width + parseFloat(getComputedStyle(rail).columnGap || 0) : rail.clientWidth; };
    var progress = function () { return dist > 0 ? Math.max(0, Math.min(1, -sec.getBoundingClientRect().top / dist)) : 0; };
    var ends = function () {
      var atStart = pinned ? progress() <= 0.001 : rail.scrollLeft <= 2;
      var atEnd = pinned ? progress() >= 0.999 : rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 2;
      if (prev) prev.disabled = atStart;
      if (next) next.disabled = atEnd;
    };
    var slide = function () { rTick = false; if (pinned) rail.style.transform = 'translate3d(' + (-progress() * dist).toFixed(1) + 'px,0,0)'; ends(); };
    var req = function () { if (!rTick) { rTick = true; window.requestAnimationFrame(slide); } };
    var mode = function () {
      if (!sec || !stage) { ends(); return; }
      sec.style.height = ''; rail.style.transform = ''; pinned = false;
      sec.classList.add('is-pin'); // measured in the held layout (compact on short screens)
      var head = sec.querySelector('.rail-head');
      var need = parseFloat(getComputedStyle(stage).paddingTop) + head.offsetHeight + parseFloat(getComputedStyle(head).marginBottom) + rail.offsetHeight + 16; // room under the header, heading, cards, air
      if (!reduceMotion && window.innerWidth > 860 && need <= window.innerHeight) {
        pinned = true;
        // slide until the last card ends at the page's margin (the rail's end padding is not in its scroll width)
        var last = rail.lastElementChild, padR = parseFloat(getComputedStyle(rail).paddingRight) || 0;
        dist = Math.max(0, Math.ceil(last.getBoundingClientRect().right + padR - document.documentElement.clientWidth));
        sec.style.height = (window.innerHeight + dist) + 'px';
      } else sec.classList.remove('is-pin');
      req();
    };
    var go = function (dir) {
      if (pinned) window.scrollBy({ top: dir * step(), behavior: reduceMotion ? 'auto' : 'smooth' });
      else rail.scrollBy({ left: dir * step(), behavior: reduceMotion ? 'auto' : 'smooth' });
    };
    if (prev) prev.addEventListener('click', function () { go(-1); });
    if (next) next.addEventListener('click', function () { go(1); });
    rail.addEventListener('scroll', ends, { passive: true });
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', mode);
    window.addEventListener('load', mode); // measure again once the fonts and photos are in (text sets a touch taller)
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(mode);
    mode();
  });

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
