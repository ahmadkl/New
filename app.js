/* =========================================================
   لعبة الحروف — منطق التطبيق
   يعتمد على: data.js (البيانات) و synth.js (الصوت المدمج)
   ========================================================= */
(function () {
  'use strict';

  const $ = function (id) { return document.getElementById(id); };
  const QUIZ_LENGTH = 10;

  const state = {
    lang: 'ar', letterIndex: 0, speakIndex: 0, speakOk: 0,
    mode: 'practice', score: 0, qNum: 0, current: null, locked: false,
    deck: [], deckPos: 0
  };

  /* ---------- أدوات عامة ---------- */
  function letters() { return state.lang === 'ar' ? AR_LETTERS : EN_LETTERS; }
  function t(key) { return I18N[state.lang][key]; }
  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, val);
    } catch (e) { /* التخزين غير متاح */ }
    return null;
  }

  /* مؤقّتات تُلغى عند تغيير الشاشة */
  const timers = [];
  function later(fn, ms) {
    const h = setTimeout(function () {
      const i = timers.indexOf(h); if (i >= 0) timers.splice(i, 1);
      fn();
    }, ms);
    timers.push(h);
    return h;
  }

  function stopVoice() {
    VoiceSynth.stop();
    document.querySelectorAll('.speaking').forEach(function (n) { n.classList.remove('speaking'); });
  }

  /* تشغيل عدة مقاطع صوتية بالتتابع مع إبراز البطاقة */
  function playSeq(items) {
    stopVoice();
    let i = 0;
    function step() {
      if (i >= items.length) return;
      const it = items[i++];
      if (it.el) it.el.classList.add('speaking');
      VoiceSynth.speak(it.tokens, function () {
        if (it.el) it.el.classList.remove('speaking');
        later(step, 220);
      });
    }
    step();
  }

  /* ---------- اللغة والواجهة ---------- */
  function applyI18n() {
    const d = I18N[state.lang];
    document.documentElement.lang = state.lang;
    document.documentElement.dir = d.dir;
    document.querySelectorAll('[data-i18n]').forEach(function (n) {
      const v = d[n.getAttribute('data-i18n')];
      if (typeof v === 'string') n.textContent = v;
    });
    $('menu-lang').textContent = d.langName;
    updateMuteBtn();
  }

  function setLang(lang) {
    state.lang = lang;
    applyI18n();
  }

  function showScreen(name) {
    stopAll();
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
    $('screen-' + name).classList.add('active');
    if (name === 'home') {
      document.documentElement.lang = 'ar';
      document.documentElement.dir = 'rtl';
    }
  }

  function stopAll() {
    timers.forEach(clearTimeout); timers.length = 0;
    stopVoice();
    stopRecognition();
  }

  function updateMuteBtn() {
    const m = VoiceSynth.isMuted();
    const b = $('mute-btn');
    b.textContent = m ? '🔇' : '🔊';
    const label = m ? I18N[state.lang].unmute : I18N[state.lang].mute;
    b.setAttribute('aria-label', label);
    b.title = label;
  }

  /* ---------- شاشة التعلّم ---------- */
  function fillWord(node, L) {
    node.textContent = L.w;
    node.className = 'word-text' + (state.lang === 'en' ? ' en' : '');
  }

  function renderLearn(auto) {
    const list = letters(), L = list[state.letterIndex];
    $('learn-letter').textContent = L.l;
    $('learn-emoji').textContent = L.e;
    fillWord($('learn-word'), L);
    $('learn-progress').textContent = (state.letterIndex + 1) + ' / ' + list.length;
    $('prev-btn').disabled = state.letterIndex === 0;
    $('next-btn').disabled = state.letterIndex === list.length - 1;
    if (auto) playSeq([{ tokens: L.nm, el: $('letter-card') }, { tokens: L.wp, el: $('word-card') }]);
  }

  function startLearn() {
    state.letterIndex = 0;
    showScreen('learn');
    renderLearn(true);
  }

  /* ---------- شاشة النطق ---------- */
  let recognition = null, listening = false;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  function setHint(msg, cls) {
    const h = $('mic-hint');
    h.textContent = msg;
    h.className = 'mic-hint' + (cls ? ' ' + cls : '');
  }

  function micAvailable() { return !!SR && navigator.onLine !== false; }

  function renderSpeak(auto) {
    const list = letters(), L = list[state.speakIndex];
    $('speak-letter').textContent = L.l;
    $('speak-emoji').textContent = L.e;
    fillWord($('speak-word'), L);
    $('speak-hud').textContent = state.speakOk + ' ✅';
    $('heard-box').textContent = '';
    const warn = $('speak-warn');
    if (!micAvailable()) {
      $('mic-btn').style.display = 'none';
      setHint('');
      warn.style.display = 'block';
      warn.textContent = t('micOffline');
    } else {
      $('mic-btn').style.display = '';
      warn.style.display = 'none';
      setHint(t('micIdle'));
    }
    if (auto) playSeq([{ tokens: L.nm, el: $('speak-letter-card') }]);
  }

  function startSpeak() {
    state.speakIndex = 0; state.speakOk = 0;
    showScreen('speak');
    renderSpeak(true);
  }

  function moveSpeak(delta) {
    const n = letters().length;
    state.speakIndex = (state.speakIndex + delta + n) % n;
    stopAll();
    renderSpeak(true);
  }

  function speakSuccess() {
    state.speakOk++;
    $('speak-hud').textContent = state.speakOk + ' ✅';
    VoiceSynth.chime('ok');
    later(function () { moveSpeak(1); }, 1100);
  }

  function normalize(s) {
    return String(s).toLowerCase()
      .replace(/[ً-ٰٟـ]/g, '')
      .replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
      .replace(/[.,!?؟،'"]/g, '').trim();
  }

  function matchesHeard(L, heardList) {
    const ok = [L.l, L.w].concat(L.n || []).map(normalize);
    return heardList.some(function (h) {
      const nh = normalize(h);
      if (ok.indexOf(nh) >= 0) return true;
      return nh.split(/\s+/).some(function (tok) { return ok.indexOf(tok) >= 0; });
    });
  }

  function stopRecognition() {
    if (recognition) { try { recognition.abort(); } catch (e) { /* ignore */ } }
    recognition = null; listening = false;
    const b = $('mic-btn'); if (b) b.classList.remove('listening');
  }

  function toggleListening() {
    if (listening) { stopRecognition(); setHint(t('micIdle')); return; }
    if (!micAvailable()) { setHint(t('micOffline'), 'no'); return; }
    stopVoice();
    const L = letters()[state.speakIndex];
    recognition = new SR();
    recognition.lang = state.lang === 'ar' ? 'ar-SA' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;
    recognition.onstart = function () {
      listening = true;
      $('mic-btn').classList.add('listening');
      setHint(t('micListen'), 'listen');
    };
    recognition.onresult = function (ev) {
      const heard = [];
      for (let i = 0; i < ev.results.length; i++) {
        for (let j = 0; j < ev.results[i].length; j++) heard.push(ev.results[i][j].transcript);
      }
      const box = $('heard-box');
      box.textContent = t('heard') + ' ';
      box.appendChild(el('b', null, heard[0] || '…'));
      if (matchesHeard(L, heard)) { setHint(t('micOk'), 'ok'); speakSuccess(); }
      else { setHint(t('micNo'), 'no'); VoiceSynth.chime('no'); }
    };
    recognition.onerror = function (ev) {
      if (ev.error === 'no-speech' || ev.error === 'aborted') { setHint(t('micNo'), 'no'); return; }
      setHint(t('micOffline'), 'no');
    };
    recognition.onend = function () {
      listening = false;
      $('mic-btn').classList.remove('listening');
    };
    try { recognition.start(); } catch (e) { setHint(t('micOffline'), 'no'); }
  }

  /* ---------- التدريب والاختبار ---------- */
  function startGame(mode) {
    state.mode = mode; state.score = 0; state.qNum = 0; state.locked = false;
    state.deck = shuffle(letters().map(function (_, i) { return i; }));
    state.deckPos = 0;
    showScreen('game');
    nextQuestion();
  }

  function nextTarget() {
    if (state.deckPos >= state.deck.length) {
      const last = state.deck[state.deck.length - 1];
      state.deck = shuffle(letters().map(function (_, i) { return i; }));
      if (state.deck[0] === last) state.deck.push(state.deck.shift());
      state.deckPos = 0;
    }
    return state.deck[state.deckPos++];
  }

  function updateGameHud() {
    $('game-hud').textContent = state.mode === 'quiz'
      ? '⭐ ' + state.score + '  |  ' + Math.min(state.qNum, QUIZ_LENGTH) + '/' + QUIZ_LENGTH
      : '⭐ ' + state.score;
  }

  function nextQuestion() {
    if (state.mode === 'quiz' && state.qNum >= QUIZ_LENGTH) { showResult(); return; }
    state.qNum++; state.locked = false;
    updateGameHud();
    $('feedback').textContent = ''; $('feedback').className = 'feedback';

    const list = letters();
    const ti = nextTarget();
    const target = list[ti];
    const others = shuffle(list.filter(function (_, i) { return i !== ti; })).slice(0, 3);
    const options = shuffle([target].concat(others));
    const type = pick(['l2w', 'w2l', 's2l']);
    state.current = { type: type, target: target };

    const q = $('question-text'), area = $('prompt-area'), opts = $('options-area');
    area.textContent = ''; opts.textContent = '';
    area.onclick = null;

    if (type === 'l2w') {
      q.textContent = t('qLetterToWord');
      area.appendChild(el('div', 'prompt-letter', target.l));
      area.onclick = function () { playSeq([{ tokens: target.nm, el: area }]); };
    } else if (type === 'w2l') {
      q.textContent = t('qWordToLetter');
      area.appendChild(el('div', 'prompt-emoji', target.e));
      area.appendChild(el('div', 'prompt-word' + (state.lang === 'en' ? ' en' : ''), target.w));
      area.onclick = function () { playSeq([{ tokens: target.wp, el: area }]); };
    } else {
      q.textContent = t('qSoundToLetter');
      area.appendChild(el('div', 'prompt-speaker', '🔊'));
      area.onclick = function () { playSeq([{ tokens: target.nm, el: area }]); };
    }

    options.forEach(function (o) {
      const b = el('button', 'opt');
      b.type = 'button';
      if (type === 'l2w') {
        b.classList.add('word-opt');
        b.appendChild(el('span', 'opt-emoji', o.e));
        b.appendChild(el('span', 'opt-word', o.w));
      } else {
        b.classList.add('letter-opt');
        b.textContent = o.l;
      }
      b.onclick = function () { answer(b, o === target); };
      opts.appendChild(b);
    });

    if (type === 's2l') later(function () { playSeq([{ tokens: target.nm, el: area }]); }, 350);
    if (type === 'l2w') later(function () { playSeq([{ tokens: target.nm, el: area }]); }, 350);
  }

  function revealCorrect() {
    const target = state.current.target;
    document.querySelectorAll('#options-area .opt').forEach(function (b) {
      const txt = state.current.type === 'l2w' ? b.querySelector('.opt-word').textContent : b.textContent;
      const want = state.current.type === 'l2w' ? target.w : target.l;
      if (txt === want) b.classList.add('correct');
    });
  }

  function answer(btn, isRight) {
    if (state.locked) return;
    const fb = $('feedback');
    const target = state.current.target;

    if (isRight) {
      state.locked = true;
      state.score++;
      btn.classList.add('correct');
      document.querySelectorAll('#options-area .opt').forEach(function (b) { b.disabled = true; });
      fb.textContent = pick(t('right')); fb.className = 'feedback ok';
      updateGameHud();
      VoiceSynth.chime('ok');
      later(function () { playSeq([{ tokens: target.nm }, { tokens: target.wp }]); }, 650);
      later(nextQuestion, 2600 + (target.wp.split(' ').length * 60));
      return;
    }

    VoiceSynth.chime('no');
    btn.classList.add('wrong');
    btn.disabled = true;
    if (state.mode === 'quiz') {
      state.locked = true;
      document.querySelectorAll('#options-area .opt').forEach(function (b) { b.disabled = true; });
      revealCorrect();
      fb.textContent = t('wrongShow') + ' ' + (state.current.type === 'l2w' ? target.w : target.l);
      fb.className = 'feedback no';
      later(nextQuestion, 2200);
    } else {
      fb.textContent = t('wrong'); fb.className = 'feedback no';
    }
  }

  /* ---------- النتيجة ---------- */
  function showResult() {
    showScreen('result');
    const s = state.score;
    $('result-title').textContent = t('resultTitle');
    const starsN = s >= 9 ? 3 : s >= 6 ? 2 : s >= 3 ? 1 : 0;
    const stars = $('result-stars'); stars.textContent = '';
    for (let i = 0; i < 3; i++) {
      const sp = el('span', null, i < starsN ? '⭐' : '☆');
      sp.style.animationDelay = (i * 0.2) + 's';
      stars.appendChild(sp);
    }
    $('result-score').textContent = s + ' / ' + QUIZ_LENGTH;
    $('result-msg').textContent = t('msgs')[s < 5 ? 0 : s < 8 ? 1 : s < 10 ? 2 : 3];
    const key = 'letters-game-best-' + state.lang;
    const prev = parseInt(store(key), 10) || 0;
    const best = Math.max(prev, s);
    store(key, String(best));
    $('result-best').textContent = '🏅 ' + t('best') + ': ' + best + ' / ' + QUIZ_LENGTH;
    VoiceSynth.chime(s >= 5 ? 'win' : 'click');
  }

  /* ---------- الأحداث ---------- */
  function bind() {
    $('btn-ar').onclick = function () { VoiceSynth.chime('click'); setLang('ar'); showScreen('menu'); };
    $('btn-en').onclick = function () { VoiceSynth.chime('click'); setLang('en'); showScreen('menu'); };
    $('menu-home').onclick = function () { showScreen('home'); };
    $('m-learn').onclick = startLearn;
    $('m-speak').onclick = startSpeak;
    $('m-practice').onclick = function () { startGame('practice'); };
    $('m-quiz').onclick = function () { startGame('quiz'); };
    document.querySelectorAll('[data-back]').forEach(function (b) { b.onclick = function () { showScreen('menu'); }; });

    $('letter-card').onclick = function () { playSeq([{ tokens: letters()[state.letterIndex].nm, el: $('letter-card') }]); };
    $('word-card').onclick = function () { playSeq([{ tokens: letters()[state.letterIndex].wp, el: $('word-card') }]); };
    $('prev-btn').onclick = function () { if (state.letterIndex > 0) { state.letterIndex--; stopAll(); renderLearn(true); } };
    $('next-btn').onclick = function () {
      if (state.letterIndex < letters().length - 1) { state.letterIndex++; stopAll(); renderLearn(true); }
    };

    $('speak-letter-card').onclick = function () { playSeq([{ tokens: letters()[state.speakIndex].nm, el: $('speak-letter-card') }]); };
    $('speak-word-card').onclick = function () { playSeq([{ tokens: letters()[state.speakIndex].wp, el: $('speak-word-card') }]); };
    $('listen-btn').onclick = function () {
      const L = letters()[state.speakIndex];
      playSeq([{ tokens: L.nm, el: $('speak-letter-card') }, { tokens: L.wp, el: $('speak-word-card') }]);
    };
    $('said-btn').onclick = function () { stopRecognition(); setHint(t('micOk'), 'ok'); speakSuccess(); };
    $('mic-btn').onclick = toggleListening;
    $('speak-prev').onclick = function () { moveSpeak(-1); };
    $('speak-next').onclick = function () { moveSpeak(1); };

    $('again-btn').onclick = function () { startGame('quiz'); };
    $('result-menu').onclick = function () { showScreen('menu'); };

    $('mute-btn').onclick = function () {
      VoiceSynth.setMuted(!VoiceSynth.isMuted());
      store('letters-game-muted', VoiceSynth.isMuted() ? '1' : '0');
      updateMuteBtn();
      if (!VoiceSynth.isMuted()) VoiceSynth.chime('click');
    };

    /* دعم لوحة المفاتيح للبطاقات */
    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.getAttribute &&
          e.target.getAttribute('role') === 'button') {
        e.preventDefault(); e.target.click();
      }
    });

    /* فتح الصوت عند أول لمس (شرط المتصفحات) */
    document.addEventListener('pointerdown', function () { VoiceSynth.unlock(); }, { once: true });
  }

  /* ---------- PWA: العمل بدون إنترنت ---------- */
  function setupPWA() {
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').then(function () {
        return navigator.serviceWorker.ready;
      }).then(function () {
        $('offline-badge').classList.add('show');
      }).catch(function () { /* تسجيل غير ممكن (مثلاً file://) */ });
    }
    let deferred = null;
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault(); deferred = e;
      $('install-btn').classList.add('show');
    });
    $('install-btn').onclick = function () {
      if (!deferred) return;
      deferred.prompt();
      deferred.userChoice.then(function () { deferred = null; $('install-btn').classList.remove('show'); });
    };
    window.addEventListener('appinstalled', function () { $('install-btn').classList.remove('show'); });
  }

  /* ---------- بدء التشغيل ---------- */
  VoiceSynth.setMuted(store('letters-game-muted') === '1');
  bind();
  applyI18n();
  setupPWA();
})();
