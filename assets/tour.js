/* Hương AI guided tour — shared component for every page except index.html.
 *
 * A page opts in by declaring its own stops before loading this file:
 *
 *   <link rel="stylesheet" href="assets/tour.css">
 *   <script>window.MAIDA_TOUR = {
 *     slug: 'songs',              // audio lives in voice/songs/
 *     mount: '.hctl',             // optional; button floats if the selector misses
 *     stops: [ { sel:'#tracklist', en:'…', vi:'…' }, … ]
 *   };</script>
 *   <script src="assets/tour.js" defer></script>
 *
 * Audio is read from voice/<slug>/stopN.mp3 in English and
 * voice/<slug>/vi/stopN.mp3 in Vietnamese, mirroring how index.html lays out
 * its own recordings.
 *
 * The tour is deliberately usable before any of that audio exists: the pages
 * ship first and the recordings arrive later. When a clip is missing the card
 * still shows the text and advances on a reading timer, and the whole page's
 * audio is switched off after the first failure so a six-stop tour cannot fire
 * six 404s. Nothing about the visible tour depends on the recordings being
 * there.
 */
(function () {
  'use strict';

  /* Shared narration player.
   *
   * commercial.html and data_melody.html already had their own guides, with
   * their own poses, walking animation and generated music. Rewriting those to
   * use the component below would risk the parts that already work, so instead
   * they call this helper for the one thing they lacked — a voice — and keep
   * everything else. It plays voice/<slug>/stopN.mp3 (or vi/stopN.mp3) and
   * calls done() when the clip ends, or after fallbackMs if there is no clip.
   *
   * Returns a cancel function so a guide can abort playback when the visitor
   * stops the tour mid-sentence.
   */
  var voiceOff = {};   // slug -> true once a clip 404s, so one miss silences the page

  window.MaidaTourVoice = function (slug, i, done, fallbackMs) {
    var en = (document.documentElement.getAttribute('lang') || '').slice(0, 2) === 'en';
    var fired = false, guard = null, a = null;

    function finish(viaError) {
      if (fired) return;
      fired = true;
      clearTimeout(guard);
      if (viaError) voiceOff[slug] = true;
      if (a) { a.onended = a.onerror = a.oncanplaythrough = null; try { a.pause(); a.src = ''; } catch (e) {} a = null; }
      setTimeout(done, 0);
    }
    function cancel() {
      fired = true;
      clearTimeout(guard);
      if (a) { a.onended = a.onerror = a.oncanplaythrough = null; try { a.pause(); a.src = ''; } catch (e) {} a = null; }
    }

    if (voiceOff[slug]) { guard = setTimeout(function () { finish(false); }, fallbackMs); return cancel; }

    a = new Audio('voice/' + slug + '/' + (en ? '' : 'vi/') + 'stop' + (i + 1) + '.mp3');
    a.preload = 'auto';
    a.onended = function () { finish(false); };
    a.onerror = function () { finish(true); };
    a.oncanplaythrough = function () {
      clearTimeout(guard);
      a.play().then(function () {
        guard = setTimeout(function () { finish(false); }, (a.duration || 30) * 1000 + 4000);
      }).catch(function () { finish(false); });
    };
    // No clip, or a slow one: fall back to the guide's own pacing.
    guard = setTimeout(function () { finish(false); }, fallbackMs);
    try { a.load(); } catch (e) { finish(true); }
    return cancel;
  };

  var cfg = window.MAIDA_TOUR;
  if (!cfg || !cfg.stops || !cfg.stops.length) return;

  var slug = cfg.slug || 'page';
  var stops = cfg.stops;

  // Roughly how long the text takes to read, used whenever audio is unavailable.
  // The floor keeps very short stops from flashing past.
  var MS_PER_CHAR = 68;
  var MIN_READ_MS = 3800;
  // If a clip neither loads nor errors, move on rather than hanging the tour.
  var STALL_MS = 9000;

  var idx = -1;
  var active = false;
  var muted = false;
  var timer = null;
  var audio = null;
  var audioOff = false;   // set once a clip 404s; suppresses the rest
  var focused = null;

  function isEN() {
    return (document.documentElement.getAttribute('lang') || '').slice(0, 2) === 'en';
  }
  function lineFor(stop) {
    var en = isEN();
    return (en ? stop.en : stop.vi) || stop.vi || stop.en || '';
  }
  function readTime(line) {
    return Math.max(MIN_READ_MS, line.length * MS_PER_CHAR);
  }
  function motionOff() {
    return document.documentElement.getAttribute('data-motion') === 'off' ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches);
  }

  // ---- chrome -------------------------------------------------------------

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'mtour-btn';
  btn.id = 'mtourBtn';
  btn.setAttribute('aria-pressed', 'false');
  btn.innerHTML = '&#127911;';

  var card = document.createElement('div');
  card.className = 'mtour-card';
  card.setAttribute('role', 'status');
  card.setAttribute('aria-live', 'polite');
  card.innerHTML =
    '<div class="mtour-head">' +
      '<span class="mtour-tag">HUONG AI &middot; GUIDED TOUR</span>' +
      '<span class="mtour-ctl">' +
        '<button type="button" id="mtourMute" aria-pressed="false">&#128266; VOICE</button>' +
        '<button type="button" id="mtourStop">&#10005; STOP</button>' +
      '</span>' +
    '</div>' +
    '<div class="mtour-body" id="mtourText"></div>' +
    '<div class="mtour-foot">' +
      '<span class="mtour-step" id="mtourStep"></span>' +
      '<span class="mtour-dots" id="mtourDots"></span>' +
    '</div>';

  function applyLabels() {
    var en = isEN();
    btn.setAttribute('aria-label', en ? 'Guided tour with Huong AI' : 'Nghe Hương AI dẫn tour');
    btn.title = en ? 'Guided tour (Huong AI)' : 'Hương AI dẫn tour';
    var stopBtn = card.querySelector('#mtourStop');
    stopBtn.setAttribute('aria-label', en ? 'Stop tour' : 'Dừng tour');
    var muteBtn = card.querySelector('#mtourMute');
    muteBtn.setAttribute('aria-label',
      muted ? (en ? 'Unmute voice' : 'Bật tiếng')
            : (en ? 'Mute voice, read only' : 'Tắt tiếng, chỉ đọc chữ'));
  }

  function mount() {
    var host = cfg.mount ? document.querySelector(cfg.mount) : null;
    if (host) host.appendChild(btn);
    else { btn.classList.add('mtour-float'); document.body.appendChild(btn); }
    document.body.appendChild(card);

    var dots = card.querySelector('#mtourDots');
    stops.forEach(function () { dots.appendChild(document.createElement('i')); });
    applyLabels();
  }

  // ---- playback -----------------------------------------------------------

  function killAudio() {
    if (!audio) return;
    audio.onended = audio.onerror = audio.oncanplaythrough = null;
    try { audio.pause(); audio.src = ''; } catch (e) {}
    audio = null;
  }

  function clearFocus() {
    if (focused) { focused.classList.remove('mtour-focus'); focused = null; }
  }

  function stop() {
    active = false;
    idx = -1;
    clearTimeout(timer); timer = null;
    killAudio();
    clearFocus();
    card.classList.remove('mtour-show');
    btn.setAttribute('aria-pressed', 'false');
  }

  // Play stop i's clip; fall back to a reading timer if it is missing or stalls.
  function speak(i, line, next) {
    if (muted || audioOff) { timer = setTimeout(next, readTime(line)); return; }

    var done = false, guard = null;
    function fallback(viaError) {
      if (done || !active) return;
      done = true;
      clearTimeout(guard);
      // One miss means the recordings for this page are not published yet;
      // stop asking for the rest so the tour degrades quietly to text.
      if (viaError) audioOff = true;
      killAudio();
      timer = setTimeout(next, readTime(line));
    }

    var src = 'voice/' + slug + '/' + (isEN() ? '' : 'vi/') + 'stop' + (i + 1) + '.mp3';
    var a = new Audio(src);
    audio = a;
    a.preload = 'auto';
    a.onended = function () {
      if (done || !active) return;
      done = true; clearTimeout(guard); next();
    };
    a.onerror = function () { fallback(true); };
    a.oncanplaythrough = function () {
      clearTimeout(guard);
      a.play().then(function () {
        guard = setTimeout(function () { fallback(false); }, (a.duration || 30) * 1000 + 4000);
      }).catch(function () { fallback(false); });
    };
    guard = setTimeout(function () { fallback(false); }, STALL_MS);
    try { a.load(); } catch (e) { fallback(true); }
  }

  function step() {
    if (!active) return;
    idx++;
    if (idx >= stops.length) { stop(); return; }

    var s = stops[idx];
    var line = lineFor(s);

    clearFocus();
    var el = s.sel ? document.querySelector(s.sel) : null;
    if (el) {
      el.scrollIntoView({ behavior: motionOff() ? 'auto' : 'smooth', block: 'start' });
      el.classList.add('mtour-focus');
      focused = el;
    }

    card.querySelector('#mtourText').textContent = line;
    card.querySelector('#mtourStep').textContent = (idx + 1) + ' / ' + stops.length;
    var dots = card.querySelectorAll('#mtourDots i');
    for (var k = 0; k < dots.length; k++) dots[k].classList.toggle('mtour-on', k === idx);

    var moved = false;
    function next() {
      if (moved || !active) return;
      moved = true;
      killAudio();
      timer = setTimeout(step, 650);
    }
    speak(idx, line, next);
  }

  function start() {
    active = true;
    idx = -1;
    audioOff = false;          // retry audio each run; it may have shipped since
    card.classList.add('mtour-show');
    btn.setAttribute('aria-pressed', 'true');
    step();
  }

  // ---- wiring -------------------------------------------------------------

  function init() {
    mount();

    btn.addEventListener('click', function () { active ? stop() : start(); });
    card.querySelector('#mtourStop').addEventListener('click', stop);

    card.querySelector('#mtourMute').addEventListener('click', function () {
      muted = !muted;
      this.innerHTML = muted ? '&#128263; MUTED' : '&#128266; VOICE';
      this.setAttribute('aria-pressed', String(muted));
      this.classList.toggle('mtour-muted', muted);
      applyLabels();
      if (!active) return;
      // Re-run the current stop under the new setting instead of waiting it out.
      clearTimeout(timer); killAudio();
      idx--; step();
    });

    // Esc closes the tour, matching how the rest of the site treats overlays.
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && active) stop();
    });

    // The language switch rewrites html[lang]; follow it so a mid-tour switch
    // shows the other language rather than stranding the card.
    if (window.MutationObserver) {
      new MutationObserver(function () {
        applyLabels();
        if (!active) return;
        card.querySelector('#mtourText').textContent = lineFor(stops[idx] || stops[0]);
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
