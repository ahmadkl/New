/* =========================================================
   🎵 مُصنّع الكلام المدمج (Formant Synthesizer)
   يولّد الأصوات رياضياً بواسطة Web Audio — بدون ملفات صوتية
   وبدون إنترنت وبدون أصوات النظام.

   الاستخدام:
     VoiceSynth.speak("b A")           // نطق سلسلة رموز
     VoiceSynth.chime('ok' | 'no' | 'star' | 'click')
     VoiceSynth.stop()

   رموز الأصوات (مفصولة بمسافات):
     حروف علة:  a A  i I  u U  e  o  O  ae  uh  @   (الحرف الكبير = طويل)
     صوامت:     b t d k q ? g p  T D S Z (مفخّمة)
                th dh s z sh zh f v x gh H 3 h j ch
                m n l r(تكرار عربي) R(إنجليزي) w y
   ========================================================= */

const VoiceSynth = (function () {
  /* ---------- جدول الفورمانت (F1, F2, F3) ---------- */
  const V = {
    a:  { f: [750, 1300, 2500], d: 0.13, long: false },
    A:  { f: [720, 1200, 2450], d: 0.27, long: true  },
    i:  { f: [400, 2000, 2700], d: 0.12, long: false },
    I:  { f: [310, 2250, 3000], d: 0.27, long: true  },
    u:  { f: [400,  900, 2300], d: 0.12, long: false },
    U:  { f: [320,  750, 2300], d: 0.27, long: true  },
    e:  { f: [560, 1800, 2500], d: 0.15, long: false },
    o:  { f: [500,  900, 2400], d: 0.17, long: false },
    O:  { f: [610, 1000, 2400], d: 0.17, long: false },
    ae: { f: [700, 1700, 2500], d: 0.16, long: false },
    uh: { f: [620, 1200, 2500], d: 0.13, long: false },
    '@':{ f: [500, 1400, 2400], d: 0.09, long: false }
  };

  const EMPHATIC = { T: 1, D: 1, S: 1, Z: 1 };

  /* صوامت احتكاكية: c = مركز الضوضاء، q = حدّة، a = شدة، v = جهر، d = مدة */
  const FRIC = {
    s:  { c: 7200, q: 0.9, a: 1.0, v: 0,    d: 0.12 },
    S:  { c: 5200, q: 0.9, a: 1.1, v: 0,    d: 0.13 },
    z:  { c: 6800, q: 0.9, a: 0.6, v: 0.35, d: 0.10 },
    sh: { c: 3600, q: 1.0, a: 1.3, v: 0,    d: 0.13 },
    zh: { c: 3200, q: 1.0, a: 0.8, v: 0.35, d: 0.11 },
    f:  { c: 5000, q: 0.3, a: 0.5, v: 0,    d: 0.10 },
    v:  { c: 4500, q: 0.3, a: 0.3, v: 0.4,  d: 0.09 },
    th: { c: 6000, q: 0.3, a: 0.35, v: 0,   d: 0.11 },
    dh: { c: 5000, q: 0.3, a: 0.2, v: 0.4,  d: 0.09 },
    Z:  { c: 4200, q: 0.4, a: 0.25, v: 0.4, d: 0.10 },
    x:  { c: 2300, q: 1.2, a: 1.2, v: 0,    d: 0.12 },
    gh: { c: 1900, q: 1.0, a: 0.8, v: 0.35, d: 0.10 },
    H:  { c: 1800, q: 1.1, a: 1.0, v: 0.12, d: 0.11, f: [700, 1200, 2500] },
    h:  { c: 1600, q: 0.6, a: 0.7, v: 0,    d: 0.08 }
  };

  /* توقفات: burst = مركز الانفجار، voiced = جهر */
  const STOP = {
    b: { burst: 800,  voiced: true,  a: 0.5 },
    p: { burst: 800,  voiced: false, a: 0.6 },
    d: { burst: 4000, voiced: true,  a: 0.5 },
    t: { burst: 4200, voiced: false, a: 0.7 },
    D: { burst: 3000, voiced: true,  a: 0.6 },
    T: { burst: 3200, voiced: false, a: 0.8 },
    g: { burst: 2000, voiced: true,  a: 0.5 },
    k: { burst: 2200, voiced: false, a: 0.7 },
    q: { burst: 1200, voiced: false, a: 0.7 },
    '?': { burst: 0,  voiced: false, a: 0 }
  };

  /* رنّانات: nasal / liquid / glide */
  const SON = {
    m: { f: [250, 1000, 2300], a: 0.55, d: 0.09 },
    n: { f: [250, 1500, 2500], a: 0.55, d: 0.09 },
    l: { f: [350, 1100, 2600], a: 0.75, d: 0.09 },
    R: { f: [400, 1200, 1600], a: 0.8,  d: 0.11 },
    w: { f: [300,  700, 2300], a: 0.8,  d: 0.08 },
    y: { f: [280, 2200, 3000], a: 0.8,  d: 0.08 },
    '3': { f: [650, 1100, 2400], a: 0.5, d: 0.10 }
  };

  /* ---------- أدوات ---------- */
  function makeNoise(ctx) {
    const len = ctx.sampleRate | 0;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  function parse(str) {
    return String(str).trim().split(/\s+/).filter(Boolean);
  }

  /* ---------- الجدولة الرئيسية ----------
     ctx  : AudioContext أو OfflineAudioContext
     dest : عقدة الوجهة
     tokens: مصفوفة رموز
     t0   : زمن البداية
     opts : { f0, speed, gain }
     تُرجع { end, stop() } */
  function schedule(ctx, dest, tokens, t0, opts) {
    opts = opts || {};
    const speed = opts.speed || 1.1;       // >1 = أبطأ (مناسب للأطفال)
    const f0 = opts.f0 || 175;
    const gainAll = opts.gain == null ? 0.9 : opts.gain;
    const D = (x) => x * speed;

    /* سلسلة الصوت المجهور */
    const out = ctx.createGain();
    out.gain.value = gainAll;
    out.connect(dest);

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    const vGain = ctx.createGain(); vGain.gain.value = 0;
    const fil = [0, 1, 2].map(function (i) {
      const b = ctx.createBiquadFilter();
      b.type = 'bandpass';
      b.Q.value = [6, 9, 12][i];
      b.frequency.value = [500, 1500, 2500][i];
      return b;
    });
    const fGain = [1.0, 0.8, 0.45].map(function (g) { const n = ctx.createGain(); n.gain.value = g; return n; });
    fil.forEach(function (b, i) { osc.connect(b); b.connect(fGain[i]); fGain[i].connect(vGain); });
    vGain.connect(out);

    /* سلسلة الضوضاء */
    const nSrc = ctx.createBufferSource();
    nSrc.buffer = makeNoise(ctx);
    nSrc.loop = true;
    const nFil = ctx.createBiquadFilter();
    nFil.type = 'bandpass'; nFil.frequency.value = 3000; nFil.Q.value = 1;
    const nGain = ctx.createGain(); nGain.gain.value = 0;
    nSrc.connect(nFil); nFil.connect(nGain); nGain.connect(out);

    /* دوال ضبط */
    function setF(f, t, tc) {
      for (let i = 0; i < 3; i++) fil[i].frequency.setTargetAtTime(f[i], t, tc == null ? 0.02 : tc);
    }
    function setV(a, t, tc) { vGain.gain.setTargetAtTime(a, t, tc == null ? 0.012 : tc); }
    function setN(c, q, a, t, tc) {
      nFil.frequency.setValueAtTime(c, t);
      nFil.Q.setValueAtTime(q, t);
      nGain.gain.setTargetAtTime(a * 2.2, t, tc == null ? 0.006 : tc);
    }
    function noiseOff(t) { nGain.gain.setTargetAtTime(0, t, 0.008); }

    /* تحليل الرموز مع معرفة الرمز التالي */
    let t = t0 + 0.03;
    let emph = false;         // هل السابق مفخّم؟
    let lastVowel = null;

    function nextVowelF(i) {
      for (let k = i + 1; k < tokens.length && k < i + 3; k++) {
        if (V[tokens[k]]) return V[tokens[k]].f;
      }
      return [500, 1500, 2500];
    }

    /* خط النغمة */
    osc.frequency.setValueAtTime(f0 * 1.08, t);

    for (let i = 0; i < tokens.length; i++) {
      const tk = tokens[i];

      if (V[tk]) {
        const v = V[tk];
        let f = v.f.slice();
        if (emph) { f[0] *= 1.08; f[1] *= 0.78; }
        const dur = D(v.d);
        setF(f, t, 0.025);
        setV(0.95, t, 0.012);
        noiseOff(t);
        lastVowel = f;
        t += dur;
        emph = false;
        continue;
      }

      if (FRIC[tk]) {
        const s = FRIC[tk];
        const dur = D(s.d);
        const nf = nextVowelF(i);
        if (s.f) setF(s.f, t, 0.02); else setF(nf, t, 0.02);
        setN(s.c, s.q, s.a, t);
        setV(s.v, t, 0.01);
        t += dur;
        noiseOff(t);
        if (!s.v) setV(0, t, 0.006);
        emph = !!EMPHATIC[tk];
        continue;
      }

      if (STOP[tk]) {
        const s = STOP[tk];
        const nf = nextVowelF(i);
        const clos = D(tk === '?' ? 0.035 : 0.05);
        // إغلاق
        setF(s.voiced ? [260, 900, 2200] : nf, t, 0.01);
        setV(s.voiced ? 0.18 : 0, t, 0.006);
        noiseOff(t);
        t += clos;
        // انفجار
        if (s.a > 0) {
          setN(s.burst, 1.2, s.a, t, 0.003);
          t += D(0.018);
          noiseOff(t);
          // نفَس (aspiration) للصوامت المهموسة
          if (!s.voiced) {
            setF(nf, t, 0.01);
            setN(1800, 0.8, 0.22, t, 0.006);
            setV(0.35, t, 0.006);
            t += D(0.025);
            noiseOff(t);
          }
        }
        emph = !!EMPHATIC[tk];
        continue;
      }

      if (tk === 'j' || tk === 'ch') {                 // مركّبات: توقف + احتكاك
        const nf = nextVowelF(i);
        const voiced = tk === 'j';
        setF(voiced ? [260, 1000, 2200] : nf, t, 0.01);
        setV(voiced ? 0.18 : 0, t, 0.006);
        noiseOff(t);
        t += D(0.045);
        setN(3400, 1.0, voiced ? 0.9 : 1.2, t, 0.004);
        setF(nf, t, 0.015);
        if (voiced) setV(0.3, t, 0.006);
        t += D(0.095);
        noiseOff(t);
        emph = false;
        continue;
      }

      if (tk === 'r') {                                // راء عربية مكرّرة
        setF([450, 1300, 2300], t, 0.015);
        noiseOff(t);
        for (let k = 0; k < 3; k++) {
          setV(0.8, t, 0.004); t += D(0.022);
          setV(0.12, t, 0.004); t += D(0.014);
        }
        setV(0.85, t, 0.006);
        emph = false;
        continue;
      }

      if (SON[tk]) {
        const s = SON[tk];
        setF(s.f, t, 0.02);
        setV(s.a, t, 0.01);
        noiseOff(t);
        t += D(s.d);
        emph = false;
        continue;
      }

      /* رمز غير معروف: تجاهل مع وقفة قصيرة */
      t += D(0.04);
    }

    /* نهاية: خفض الصوت */
    setV(0, t, 0.02);
    noiseOff(t);
    const end = t + 0.12;

    /* منحنى النغمة: يهبط تدريجياً */
    osc.frequency.cancelScheduledValues(t0);
    osc.frequency.setValueAtTime(f0 * 1.08, t0);
    osc.frequency.linearRampToValueAtTime(f0 * 0.82, Math.max(t0 + 0.05, t));

    osc.start(t0);
    nSrc.start(t0);
    osc.stop(end);
    nSrc.stop(end);

    return {
      end: end,
      stop: function () {
        try { osc.stop(); nSrc.stop(); } catch (e) { /* مُتوقف أصلاً */ }
        try { out.disconnect(); } catch (e) { /* ignore */ }
      }
    };
  }

  /* ---------- مؤثرات (نغمات بسيطة) ---------- */
  function tones(ctx, dest, notes, t0, type, vol) {
    const out = ctx.createGain();
    out.gain.value = vol == null ? 0.25 : vol;
    out.connect(dest);
    let end = t0;
    notes.forEach(function (n) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type || 'sine';
      o.frequency.value = n[0];
      const s = t0 + n[1], d = n[2];
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(1, s + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, s + d);
      o.connect(g); g.connect(out);
      o.start(s); o.stop(s + d + 0.02);
      end = Math.max(end, s + d + 0.02);
    });
    return end;
  }

  const CHIMES = {
    ok:    { notes: [[523.25, 0, 0.16], [659.25, 0.1, 0.16], [783.99, 0.2, 0.28]], type: 'triangle' },
    no:    { notes: [[220, 0, 0.18], [185, 0.14, 0.3]], type: 'square', vol: 0.12 },
    star:  { notes: [[784, 0, 0.12], [988, 0.09, 0.12], [1175, 0.18, 0.12], [1568, 0.27, 0.4]], type: 'triangle' },
    click: { notes: [[660, 0, 0.06]], type: 'sine', vol: 0.15 },
    win:   { notes: [[523.25, 0, 0.14], [659.25, 0.12, 0.14], [783.99, 0.24, 0.14], [1046.5, 0.36, 0.5]], type: 'triangle' }
  };

  /* ---------- واجهة الاستخدام في المتصفح ---------- */
  let ctx = null, master = null, current = null, muted = false, timer = null;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(comp);
      comp.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }

  function stop() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (current) { current.stop(); current = null; }
  }

  function speak(str, onEnd, opts) {
    stop();
    if (muted || !ensure()) { if (onEnd) onEnd(); return; }
    const tokens = Array.isArray(str) ? str : parse(str);
    const r = schedule(ctx, master, tokens, ctx.currentTime + 0.02, opts);
    current = r;
    timer = setTimeout(function () {
      current = null; timer = null;
      if (onEnd) onEnd();
    }, (r.end - ctx.currentTime) * 1000 + 30);
    return r;
  }

  function chime(name) {
    if (muted || !ensure()) return;
    const c = CHIMES[name]; if (!c) return;
    tones(ctx, master, c.notes, ctx.currentTime + 0.01, c.type, c.vol);
  }

  function setMuted(m) { muted = !!m; if (muted) stop(); }
  function isMuted() { return muted; }
  /* فتح الصوت على الأجهزة التي تشترط تفاعل المستخدم */
  function unlock() { ensure(); }

  return { speak: speak, chime: chime, stop: stop, setMuted: setMuted, isMuted: isMuted,
           unlock: unlock, schedule: schedule, parse: parse, tones: tones, _tables: { V: V, FRIC: FRIC, STOP: STOP, SON: SON } };
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = VoiceSynth; }
