/**
 * Vaikų Žaidimai — Bendra funkcionalumo biblioteka (shared/common.js)
 *
 * Šiame faile aprašytos funkcijos, naudojamos visuose žaidimuose:
 * 1. Lietuviškų žodžių skiemenavimas (`_syl`) ir spalvinimas (`_col`, `getWordLetterColors`),
 *    įskaitant spalvinimo įjungimo/išjungimo nustatymą (`setSyllableColoringEnabled`).
 * 2. Garso efektų sistema (Web Audio API: `playSound`, `playTone`, `playCorrectSound`, ir kt.).
 * 3. Apsauga nuo priartinimo gestais (`preventZoom`).
 * 4. Pagalbinės masyvų funkcijos (`shuffle`, `shuffleArray`, `pickRandom`).
 */
(function (global) {
    'use strict';

    // Užtikriname, kad Tailwind Play CDN naudotų 'class' pagrindu veikiančią tamsiąją temą
    // vietoje sistemos @media užklausų, kad šviesi tema niekada netyčia neįgautų tamsių elementų.
    try {
        if (typeof global !== 'undefined') {
            global.tailwind = global.tailwind || {};
            global.tailwind.config = global.tailwind.config || {};
            global.tailwind.config.darkMode = 'class';
        }
    } catch (e) {}

    // === 1. SKIEMENŲ SPALVINIMAS ===
    var _V = 'aeėęiįyouųūąAEĖĘIĮYOUŲŪĄ';
    var _D = new Set(['ai','au','ei','eu','ui','oi','ie','uo','ia','io','iu']);
    var _L = /[a-ząčęėįšųūžA-ZĄČĘĖĮŠŲŪŽ]/;
    var _O = new Set([
        'bl','br','dr','dv','fl','fr','gl','gn','gr','kl','kn','kr','kv',
        'pl','pr','sk','sl','sm','sn','sp','sr','st','sv','šl','šm','šn',
        'šp','št','šv','tr','tv','vr','žl','žv','str','skr','spr','škr','ždr'
    ]);
    var _SC = [
        'var(--sc-0, #dc2626)',
        'var(--sc-1, #1d4ed8)',
        'var(--sc-2, #15803d)',
        'var(--sc-3, #c2410c)',
        'var(--sc-4, #7e22ce)',
        'var(--sc-5, #be185d)'
    ];
    var SYLLABLE_COLORS = _SC;

    function _syl(word) {
        if (!word || word.length <= 1) return [word || ''];
        var r = [];
        var s = '', i = 0, n = word.length;
        while (i < n) {
            var c = word[i];
            if (!_L.test(c)) { s += c; i++; continue; }
            if (!_V.includes(c)) {
                s += c;
                i++;
            } else {
                s += c;
                i++;
                if (i < n && _V.includes(word[i]) && _D.has((c + word[i]).toLowerCase())) {
                    s += word[i];
                    i++;
                }
                var j = i;
                while (j < n && !_V.includes(word[j]) && _L.test(word[j])) j++;
                if (j >= n || !_L.test(word[j])) {
                    s += word.slice(i, j);
                    i = j;
                    while (i < n && !_L.test(word[i])) { s += word[i]; i++; }
                    if (i >= n) { r.push(s); s = ''; }
                } else {
                    var cl = word.slice(i, j);
                    var u = [];
                    for (var k = 0; k < cl.length;) {
                        var p = cl.slice(k, k + 2).toLowerCase();
                        if (p === 'dz' || p === 'dž' || p === 'ch') {
                            u.push(cl.slice(k, k + 2));
                            k += 2;
                        } else {
                            u.push(cl[k]);
                            k++;
                        }
                    }
                    if (u.length === 0) {
                        r.push(s);
                        s = '';
                    } else if (u.length === 1) {
                        r.push(s);
                        s = u[0];
                        i = j;
                    } else {
                        var sp = u.length - 1;
                        if (u.length >= 2) {
                            var l2 = (u[u.length - 2] + u[u.length - 1]).toLowerCase();
                            var l3 = u.length >= 3 ? (u[u.length - 3] + l2).toLowerCase() : '';
                            if (l3 && _O.has(l3)) sp = u.length - 3;
                            else if (_O.has(l2)) sp = u.length - 2;
                        }
                        s += u.slice(0, sp).join('');
                        r.push(s);
                        s = u.slice(sp).join('');
                        i = j;
                    }
                }
            }
        }
        if (s) r.push(s);
        return r.filter(function (x) { return x.length > 0; });
    }

    function _col(text) {
        if (!text) return '';
        return String(text).split(/(\s+)/).map(function (token) {
            if (!token.trim() || !/[a-ząčęėįšųūžA-ZĄČĘĖĮŠŲŪŽ]/.test(token)) return token;
            var syls = _syl(token);
            return syls.map(function (s, i) {
                return '<span style="color:' + _SC[i % _SC.length] + '">' + s + '</span>';
            }).join('');
        }).join('');
    }

    // --- Skiemenų spalvinimo nustatymas (įjungta / išjungta) ---
    // Saugoma localStorage, todėl galioja visiems žaidimams. Išjungus, ant <html>
    // uždedama klasė `syl-off`, kuri (shared/common.css) skiemenų spalvas pakeičia
    // į įprastą teksto spalvą — žaidimų kodo keisti nereikia.
    var SYL_STORAGE_KEY = 'vz-syllable-colors';

    function isSyllableColoringEnabled() {
        try {
            return global.localStorage.getItem(SYL_STORAGE_KEY) !== '0';
        } catch (e) {
            return true;
        }
    }

    function applySyllableColoring(enabled, doc) {
        doc = doc || (typeof document !== 'undefined' ? document : null);
        if (!doc || !doc.documentElement) return;
        if (enabled === undefined) enabled = isSyllableColoringEnabled();
        doc.documentElement.classList.toggle('syl-off', !enabled);
    }

    function setSyllableColoringEnabled(enabled) {
        try {
            global.localStorage.setItem(SYL_STORAGE_KEY, enabled ? '1' : '0');
        } catch (e) {}
        applySyllableColoring(!!enabled);
    }

    // --- 1.1 Ekrano temos (šviesios / tamsios / auto) nustatymas ---
    // Saugoma localStorage (raktas 'vz-theme-mode': 'auto' | 'light' | 'dark').
    // Galioja visame portale ir žaidimuose. Pritaiko klases ant <html> bei <body>,
    // ir dinamiškai valdo @media (prefers-color-scheme: dark) taisykles.
    var THEME_STORAGE_KEY = 'vz-theme-mode';

    function getThemeMode() {
        try {
            return global.localStorage.getItem(THEME_STORAGE_KEY) || 'auto';
        } catch (e) {
            return 'auto';
        }
    }

    function isDarkMode(mode) {
        if (mode === undefined) mode = getThemeMode();
        if (mode === 'dark') return true;
        if (mode === 'light') return false;
        if (typeof window !== 'undefined' && window.matchMedia) {
            try {
                return window.matchMedia('(prefers-color-scheme: dark)').matches;
            } catch (e) {
                return false;
            }
        }
        return false;
    }

    function applyTheme(mode, doc) {
        doc = doc || (typeof document !== 'undefined' ? document : null);
        if (!doc || !doc.documentElement) return;
        if (mode === undefined) mode = getThemeMode();
        var isDark = isDarkMode(mode);

        var root = doc.documentElement;
        var body = doc.body;

        if (mode === 'dark') {
            root.classList.add('dark', 'dark-theme', 'dark-mode');
            root.classList.remove('light', 'light-theme');
            if (body) {
                body.classList.add('dark-mode');
                body.classList.remove('light-mode');
            }
        } else if (mode === 'light') {
            root.classList.add('light', 'light-theme');
            root.classList.remove('dark', 'dark-theme', 'dark-mode');
            if (body) {
                body.classList.remove('dark-mode');
                body.classList.add('light-mode');
            }
        } else {
            root.classList.remove('light-theme', 'dark-theme');
            root.classList.toggle('dark', isDark);
            root.classList.toggle('dark-mode', isDark);
            if (body) {
                body.classList.toggle('dark-mode', isDark);
                body.classList.toggle('light-mode', !isDark);
            }
        }

        // Valdome CSS Media taisykles (@media (prefers-color-scheme: dark))
        try {
            var sheets = doc.styleSheets;
            if (sheets) {
                for (var i = 0; i < sheets.length; i++) {
                    try {
                        var rules = sheets[i].cssRules || sheets[i].rules;
                        if (!rules) continue;
                        for (var j = 0; j < rules.length; j++) {
                            var rule = rules[j];
                            if (rule && rule.media && rule.media.mediaText) {
                                var mText = rule.media.mediaText;
                                if (mText.indexOf('prefers-color-scheme') !== -1 || rule._vzOrigMedia) {
                                    if (!rule._vzOrigMedia) rule._vzOrigMedia = mText;
                                    if (mode === 'dark') {
                                        rule.media.mediaText = 'all';
                                    } else if (mode === 'light') {
                                        rule.media.mediaText = 'not all';
                                    } else {
                                        rule.media.mediaText = rule._vzOrigMedia;
                                    }
                                }
                            }
                        }
                    } catch (sheetErr) {
                        // Apsauga nuo CORS klaidų
                    }
                }
            }
        } catch (e) {}

        // Specialus palaikymas žaidimams su savo mygtukais (pvz. RaidziuDelione)
        if (body) {
            var toggleBtn = body.querySelector('#dark-toggle');
            if (toggleBtn) {
                if (isDark) {
                    toggleBtn.innerHTML = '☀️ Diena';
                    toggleBtn.className = 'bg-indigo-600 text-white border-2 border-indigo-400 px-3 py-1.5 rounded-xl font-bold hover:bg-indigo-500 transition-colors text-xs shadow-sm';
                } else {
                    toggleBtn.innerHTML = '🌙 Naktis';
                    toggleBtn.className = 'bg-slate-800 text-white border-2 border-slate-600 px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm';
                }
            }
        }
    }

    function setThemeMode(mode) {
        try {
            global.localStorage.setItem(THEME_STORAGE_KEY, mode);
        } catch (e) {}
        applyTheme(mode);
    }

    if (typeof document !== 'undefined') {
        applySyllableColoring();
        applyTheme();
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                applyTheme();
            });
        }
        // Jei nustatymas pakeičiamas kitame lange / iframe, pritaikome iškart
        global.addEventListener('storage', function (e) {
            if (e.key === SYL_STORAGE_KEY) applySyllableColoring();
            if (e.key === THEME_STORAGE_KEY) applyTheme();
        });
        // Kai režimas 'auto', reaguojame į sistemos pasikeitimą (pvz., atėjus vakarui)
        if (global.matchMedia) {
            try {
                global.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
                    if (getThemeMode() === 'auto') applyTheme('auto');
                });
            } catch (e) {}
        }
    }

    function getWordLetterColors(word) {
        if (!word) return [];
        var syls = _syl(word);
        var colors = [];
        syls.forEach(function (s, i) {
            var c = _SC[i % _SC.length];
            for (var k = 0; k < s.length; k++) {
                colors.push(c);
            }
        });
        while (colors.length < word.length) {
            colors.push(_SC[0]);
        }
        return colors;
    }

    // === 2. GARSO SISTEMA (Web Audio API + Lietuviškas TTS) ===
    var _audioCtx = null;
    var SOUND_STORAGE_KEY = 'vz-sound-enabled';
    var PROGRESS_STORAGE_KEY = 'vz-progress';
    var _gameTimers = [];

    function isSoundEnabled() {
        try {
            var v = localStorage.getItem(SOUND_STORAGE_KEY);
            return v === null ? true : v !== '0';
        } catch (e) {
            return true;
        }
    }

    function setSoundEnabled(enabled) {
        try {
            localStorage.setItem(SOUND_STORAGE_KEY, enabled ? '1' : '0');
            if (!enabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        } catch (e) {}
    }

    function getAudioCtx() {
        if (!_audioCtx) {
            var AudioCtx = global.AudioContext || global.webkitAudioContext;
            if (AudioCtx) _audioCtx = new AudioCtx();
        }
        if (_audioCtx && _audioCtx.state === 'suspended') {
            _audioCtx.resume();
        }
        return _audioCtx;
    }

    function initAudio() {
        return getAudioCtx();
    }

    function playTone(freq, type, duration, startTime, vol) {
        if (!isSoundEnabled()) return;
        if (startTime === undefined) startTime = 0;
        if (vol === undefined) vol = 0.15;
        try {
            var ctx = getAudioCtx();
            if (!ctx) return;
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
            gain.gain.setValueAtTime(vol, ctx.currentTime + startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + startTime);
            osc.stop(ctx.currentTime + startTime + duration);
        } catch (e) {}
    }

    function playSound(type) {
        if (!isSoundEnabled()) return;
        try {
            var ctx = getAudioCtx();
            if (!ctx) return;
            var now = ctx.currentTime;
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'coin') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(950, now);
                osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
                osc.start(now);
                osc.stop(now + 0.12);
            } else if (type === 'remove') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(380, now + 0.08);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
            } else if (type === 'click' || type === 'tap') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(680, now);
                osc.frequency.exponentialRampToValueAtTime(1080, now + 0.07);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
                osc.start(now);
                osc.stop(now + 0.09);
            } else if (type === 'tick') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(750, now);
                osc.frequency.exponentialRampToValueAtTime(1100, now + 0.05);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
                osc.start(now);
                osc.stop(now + 0.06);
            } else if (type === 'pop') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(520, now);
                osc.frequency.exponentialRampToValueAtTime(120, now + 0.11);
                gain.gain.setValueAtTime(0.28, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
                osc.start(now);
                osc.stop(now + 0.12);
            } else if (type === 'hop') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(340, now);
                osc.frequency.exponentialRampToValueAtTime(760, now + 0.13);
                gain.gain.setValueAtTime(0.22, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
            } else if (type === 'correct') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.setValueAtTime(554.37, now + 0.08);
                osc.frequency.setValueAtTime(659.25, now + 0.16);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                osc.start(now);
                osc.stop(now + 0.35);
            } else if (type === 'wrong' || type === 'error') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(280, now);
                osc.frequency.exponentialRampToValueAtTime(150, now + 0.22);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
                osc.start(now);
                osc.stop(now + 0.28);
            } else if (type === 'hint') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, now);
                osc.frequency.setValueAtTime(783.99, now + 0.08);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === 'win') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.setValueAtTime(554.37, now + 0.1);
                osc.frequency.setValueAtTime(659.25, now + 0.2);
                osc.frequency.setValueAtTime(880, now + 0.3);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
                osc.start(now);
                osc.stop(now + 0.6);
            }
        } catch (e) {}
    }

    function playCorrectSound() {
        playTone(440, 'sine', 0.15, 0);
        playTone(554.37, 'sine', 0.15, 0.08);
        playTone(659.25, 'sine', 0.25, 0.16);
    }

    function playWrongSound() {
        playTone(280, 'sawtooth', 0.2, 0);
        playTone(200, 'sawtooth', 0.25, 0.1);
    }

    function playWinSound() {
        [440, 554.37, 659.25, 880].forEach(function (freq, idx) {
            playTone(freq, 'sine', 0.25, idx * 0.12);
        });
    }

    function playSelectSound() {
        playTone(520, 'sine', 0.08, 0);
    }

    function playPickSound() {
        playTone(520, 'sine', 0.08, 0);
    }

    function playPopSound() {
        playTone(587.33, 'sine', 0.12, 0, 0.18);
        playTone(880, 'sine', 0.12, 0.06, 0.15);
    }

    function playStepSound(stepIdx) {
        if (typeof stepIdx === 'number') {
            var notes = [440, 493.88, 523.25, 587.33, 659.25];
            playTone(notes[stepIdx % notes.length], 'sine', 0.14, 0);
        } else {
            playTone(520, 'sine', 0.09, 0, 0.14);
            playTone(660, 'sine', 0.09, 0.05, 0.12);
        }
    }

    function playTapSound() {
        playTone(460, 'sine', 0.09, 0, 0.08);
    }

    function playReturnSound() {
        playTone(320, 'sine', 0.09, 0, 0.08);
    }

    function playHintSound() {
        playTone(523.25, 'sine', 0.12, 0, 0.16);
        playTone(783.99, 'sine', 0.18, 0.08, 0.16);
    }

    // Lietuviškas įgarsinimas (Text-to-Speech)
    function hasLithuanianTTS() {
        try {
            if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
            var voices = window.speechSynthesis.getVoices() || [];
            if (voices.length === 0) return true; // dar kraunasi balsai
            for (var i = 0; i < voices.length; i++) {
                if (voices[i].lang && voices[i].lang.toLowerCase().indexOf('lt') === 0) return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    function speakLT(text, rate) {
        if (!isSoundEnabled() || !text) return;
        try {
            if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
            window.speechSynthesis.cancel();
            // Pašaliname HTML žymes, jaustukus (emoji) ir perteklinius simbolius, bei paverčiame mažosiomis raidėmis
            var clean = String(text)
                .replace(/<[^>]+>/g, ' ')
                .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, ' ')
                .replace(/[\u2600-\u27BF\uFE0F\u20E3❓❔➕➖✖️➗➔⬅️➡️⬆️⬇️🔗]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .toLowerCase();
            if (!clean) return;
            var utter = new SpeechSynthesisUtterance(clean);
            utter.lang = 'lt-LT';
            utter.rate = rate || 0.9;
            var voices = window.speechSynthesis.getVoices() || [];
            for (var i = 0; i < voices.length; i++) {
                if (voices[i].lang && voices[i].lang.toLowerCase().indexOf('lt') === 0) {
                    utter.voice = voices[i];
                    break;
                }
            }
            window.speechSynthesis.speak(utter);
        } catch (e) {}
    }

    function renderSpeakBtn(text, extraClass) {
        if (!text) return '';
        var safe = String(text).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        var cls = 'speak-btn' + (extraClass ? ' ' + extraClass : '');
        return '<button type="button" onclick="speakLT(\'' + safe + '\')" class="' + cls + '" title="Klausyti">🔊</button>';
    }

    // Saugūs žaidimo laikmačiai (automatiškai išvalomi grįžtant į meniu)
    function setGameTimeout(fn, delay) {
        var id = setTimeout(function () {
            var idx = _gameTimers.indexOf(id);
            if (idx !== -1) _gameTimers.splice(idx, 1);
            fn();
        }, delay);
        _gameTimers.push(id);
        return id;
    }

    function clearGameTimers() {
        while (_gameTimers.length > 0) {
            clearTimeout(_gameTimers.pop());
        }
    }

    // === 3. PAGALBINĖS MASYVŲ IR UI FUNKCIJOS ===
    function shuffle(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = a[i];
            a[i] = a[j];
            a[j] = tmp;
        }
        return a;
    }

    function pickRandom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    // Bendra atsiliepimo (#feedback) eilutės atvaizdavimo funkcija
    function showFeedback(text, type, elId) {
        if (typeof document === 'undefined') return;
        var el = document.getElementById(elId || 'feedback');
        if (!el) return;
        var colorClass = 'text-slate-700';
        if (type === 'success' || type === 'correct') colorClass = 'text-green-600';
        else if (type === 'error' || type === 'wrong') colorClass = 'text-red-500';
        else if (type === 'info' || type === 'hint') colorClass = 'text-amber-600';

        el.innerHTML = '<span>' + _col(text) + '</span>';
        el.classList.remove('opacity-0', 'text-green-600', 'text-red-500', 'text-amber-600', 'text-slate-700');
        el.classList.add('opacity-100', colorClass);
    }

    // Bendra 50/50 neteisingų atsakymų atmetimo funkcija viktorinoms
    function eliminateWrongOptions(selector, isCorrectFn, count) {
        if (typeof document === 'undefined') return;
        var nodes = document.querySelectorAll(selector);
        var candidates = [];
        for (var i = 0; i < nodes.length; i++) {
            var btn = nodes[i];
            if (!btn.disabled && !isCorrectFn(btn, i)) {
                candidates.push(btn);
            }
        }
        var toDisable = shuffle(candidates).slice(0, count || 2);
        for (var j = 0; j < toDisable.length; j++) {
            toDisable[j].disabled = true;
            toDisable[j].classList.add('opacity-35', 'line-through', 'pointer-events-none');
        }
    }

    // Lengvas šventinis konfeti fejerverkas (be išorinių bibliotekų)
    function celebrateWin(stars) {
        if (stars !== undefined && stars < 2) return;
        try {
            if (typeof global.confetti === 'function') {
                global.confetti({ particleCount: stars >= 3 ? 65 : 35, spread: 80, origin: { y: 0.55 } });
                return;
            }
            if (typeof document === 'undefined' || !document.body) return;
            var colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#eab308'];
            var count = (stars === 2) ? 20 : 38;
            var pieces = [];
            for (var i = 0; i < count; i++) {
                var p = document.createElement('div');
                p.className = 'vz-confetti-piece';
                p.style.left = (8 + Math.random() * 84) + 'vw';
                p.style.backgroundColor = colors[i % colors.length];
                p.style.animationDelay = (Math.random() * 0.35) + 's';
                p.style.setProperty('--vz-dx', Math.round((Math.random() - 0.5) * 140) + 'px');
                p.style.setProperty('--vz-rot', Math.round(360 + Math.random() * 540) + 'deg');
                document.body.appendChild(p);
                pieces.push(p);
            }
            setTimeout(function () {
                for (var k = 0; k < pieces.length; k++) {
                    if (pieces[k] && pieces[k].parentNode) {
                        pieces[k].parentNode.removeChild(pieces[k]);
                    }
                }
            }, 2200);
        } catch (e) {}
    }

    // === 3B. ŽAIDIMŲ PROGRESO IR ŽVAIGŽDUČIŲ SAUGOJIMAS (vz-progress) ===
    // Kelių dalių (režimų) žaidimų sąrašas: visoms 3 žaidimo žvaigždutėms surinkti reikia pereiti visas dalis
    var GAME_MODES = {
        'AtmintiesZaidimas-main': ['6', '8', '10'],
        'DidesnisMazesnis-main': ['croc', 'baskets', 'stairs'],
        'Graza-main': ['cents', 'euros', 'quiz'],
        'GyvunaiVaikeliai-main': ['babies', 'homes', 'matching'],
        'KaireDesine-main': ['left-right', 'spatial', 'puppy'],
        'LaikrodzioZaidimas-main': ['hours', 'minutes', 'interactive', 'routine'],
        'LinksmiSkaiciai-main': ['objects', 'scale', 'balloons'],
        'MetuLaikai-main': ['seasons', 'calendar', 'train'],
        'Misles-main': ['nature', 'items', 'detective'],
        'Parduotuve-main': ['single', 'basket', 'afford'],
        'Pinigai-main': ['cents', 'euros', 'collect'],
        'Priesingybes-main': ['easy', 'hard', 'pairs'],
        'RaskRima-main': ['rhyme', 'sound', 'syllables'],
        'Rusiuotojas-main': ['3bins', '4bins', 'meadow'],
        'SaugusKelyje-main': ['traffic', 'signs', 'safe_or_not'],
        'Simetrija-main': ['houses', 'sequences', 'mirror'],
        'SkaiciuEilute-main': ['train', 'frog', 'neighbors'],
        'SpalvosFormos-main': ['recognize', 'necklace', 'hunt'],
        'Taupykle-main': ['compare', 'exchange', 'piggy'],
        'TekstiniaiUzdaviniai-main': ['easy', 'hard', 'money'],
        'ZodziuTvarka-main': ['short', 'long', 'fill']
    };

    var _activeGameMode = null;

    function detectGameId() {
        try {
            if (typeof location === 'undefined' || !location.pathname) return null;
            var m = location.pathname.match(/([A-Za-z0-9_-]+-main)/);
            return m ? m[1] : null;
        } catch (e) {
            return null;
        }
    }

    function detectCurrentMode(explicitMode) {
        if (explicitMode !== undefined && explicitMode !== null && String(explicitMode) !== '') {
            return String(explicitMode);
        }
        try {
            if (typeof state !== 'undefined' && state && state.mode !== undefined && state.mode !== null) {
                return String(state.mode);
            }
        } catch (e) {}
        try {
            if (typeof gameState !== 'undefined' && gameState && gameState.mode !== undefined && gameState.mode !== null) {
                return String(gameState.mode);
            }
        } catch (e) {}
        try {
            if (typeof currentPairs !== 'undefined' && currentPairs !== undefined && currentPairs !== null) {
                return String(currentPairs);
            }
        } catch (e) {}
        if (_activeGameMode !== null && _activeGameMode !== undefined) {
            return String(_activeGameMode);
        }
        return null;
    }

    function computeOverallGameStars(gameId, modesObj, legacyStars) {
        var req = GAME_MODES[gameId];
        if (!req || !req.length) {
            return Math.min(3, Math.max(0, legacyStars || 0));
        }
        var modes = modesObj || {};
        var completed = 0;
        var sumStars = 0;
        for (var i = 0; i < req.length; i++) {
            var s = modes[req[i]] || 0;
            if (s > 0) {
                completed++;
                sumStars += s;
            }
        }
        if (completed === 0) {
            return legacyStars > 0 ? 1 : 0;
        }
        if (completed === 1) return 1;
        if (completed < req.length) return 2;
        return (sumStars >= req.length * 2) ? 3 : 2;
    }

    function normalizeGameEntry(id, entry) {
        var e = entry || { stars: 0, bestScore: 0, plays: 0, modes: {} };
        var req = GAME_MODES[id];
        if (req && req.length) {
            var modes = e.modes || {};
            var completed = 0;
            for (var i = 0; i < req.length; i++) {
                if ((modes[req[i]] || 0) > 0) completed++;
            }
            e.modes = modes;
            e.completedModes = completed;
            e.totalModes = req.length;
            e.stars = computeOverallGameStars(id, modes, e.stars);
        }
        return e;
    }

    function getGameProgress(gameId) {
        try {
            var raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
            var data = raw ? JSON.parse(raw) : {};
            var k;
            for (k in data) {
                if (Object.prototype.hasOwnProperty.call(data, k)) {
                    data[k] = normalizeGameEntry(k, data[k]);
                }
            }
            if (!gameId) return data;
            return normalizeGameEntry(gameId, data[gameId]);
        } catch (e) {
            return gameId ? normalizeGameEntry(gameId, null) : {};
        }
    }

    function saveGameProgress(gameId, stars, score, total, mode) {
        var id = gameId || detectGameId();
        if (!id) return;
        try {
            var raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
            var all = raw ? JSON.parse(raw) : {};
            var prev = all[id] || { stars: 0, bestScore: 0, plays: 0, modes: {} };
            var roundStars = Math.min(3, Math.max(1, stars || 1));
            var modes = prev.modes || {};
            var curMode = detectCurrentMode(mode);
            if (curMode !== null && curMode !== undefined && String(curMode) !== '') {
                var mKey = String(curMode);
                modes[mKey] = Math.max(modes[mKey] || 0, roundStars);
            }
            var overallStars;
            if (GAME_MODES[id]) {
                overallStars = computeOverallGameStars(id, modes, roundStars);
            } else {
                overallStars = Math.max(prev.stars || 0, roundStars);
            }
            var newBest = Math.max(prev.bestScore || 0, score || 0);
            all[id] = {
                stars: overallStars,
                modes: modes,
                bestScore: newBest,
                total: total || prev.total || 10,
                plays: (prev.plays || 0) + 1,
                updatedAt: Date.now()
            };
            localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(all));
            setTimeout(decorateModeButtons, 20);
        } catch (e) {}
    }

    function clearGameProgress() {
        try {
            localStorage.removeItem(PROGRESS_STORAGE_KEY);
            setTimeout(decorateModeButtons, 20);
        } catch (e) {}
    }

    // Automatinis režimų mygtukų žvaigždučių atvaizdavimas žaidimo pradžios ekrane
    var _isDecoratingModes = false;
    function decorateModeButtons() {
        if (_isDecoratingModes || typeof document === 'undefined') return;
        var id = detectGameId();
        if (!id || !GAME_MODES[id]) return;
        var req = GAME_MODES[id];
        _isDecoratingModes = true;
        try {
            var prog = getGameProgress(id);
            var modes = (prog && prog.modes) ? prog.modes : {};
            var btns = document.querySelectorAll('button[onclick*="startGame("]');
            var matchedBtns = [];
            for (var i = 0; i < btns.length; i++) {
                var btn = btns[i];
                var onclick = btn.getAttribute('onclick') || '';
                var m = onclick.match(/^startGame\(\s*(?:'([^']+)'|"([^"]+)"|(\d+))\s*\)$/);
                if (!m) continue;
                var modeKey = m[1] || m[2] || m[3];
                if (req.indexOf(modeKey) === -1) continue;
                matchedBtns.push(btn);

                var mStars = modes[modeKey] || 0;
                if (btn.getAttribute('data-vz-stars') === String(mStars) && btn.querySelector('.vz-mode-stars')) {
                    continue;
                }
                btn.setAttribute('data-vz-stars', String(mStars));
                var badge = btn.querySelector('.vz-mode-stars');
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'vz-mode-stars ml-auto pl-2 text-xs sm:text-sm font-black tracking-tight shrink-0 select-none';
                    btn.appendChild(badge);
                }
                var sHtml = '';
                for (var s = 0; s < 3; s++) {
                    if (s < mStars) {
                        sHtml += '<span>⭐</span>';
                    } else {
                        sHtml += '<span style="opacity:0.25">⭐</span>';
                    }
                }
                badge.innerHTML = sHtml;
            }

            if (matchedBtns.length > 0 && matchedBtns[0].parentNode) {
                var parent = matchedBtns[0].parentNode;
                var doneCount = prog.completedModes || 0;
                var totalCount = req.length;
                var overStars = prog.stars || 0;
                var sumKey = doneCount + '/' + totalCount + ':' + overStars;
                var summaryEl = parent.querySelector('.vz-modes-summary');
                if (!summaryEl || summaryEl.getAttribute('data-vz-sum') !== sumKey) {
                    if (!summaryEl) {
                        summaryEl = document.createElement('div');
                        summaryEl.className = 'vz-modes-summary mt-1.5 px-3 py-1.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-600 text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-200 text-center shadow-sm';
                        parent.appendChild(summaryEl);
                    }
                    summaryEl.setAttribute('data-vz-sum', sumKey);
                    var starStr = '';
                    for (var k = 0; k < 3; k++) {
                        starStr += (k < overStars) ? '⭐' : '<span style="opacity:0.25">⭐</span>';
                    }
                    if (doneCount >= totalCount && overStars === 3) {
                        summaryEl.innerHTML = '🏆 ' + _col('Visos dalys pereitos!') + ' (' + doneCount + '/' + totalCount + ') ' + starStr;
                    } else {
                        summaryEl.innerHTML = '🧩 ' + _col('Pereita dalių:') + ' <b>' + doneCount + ' / ' + totalCount + '</b> • ' + starStr;
                    }
                }
            }
        } catch (e) {}
        _isDecoratingModes = false;
    }

    // === 4. APSAUGA NUO PRIARTINIMO GESTAIS (PINCH TO ZOOM) ===
    function preventZoom(doc) {
        if (!doc) return;
        try {
            doc.addEventListener('gesturestart', function (e) { e.preventDefault(); }, { passive: false });
            doc.addEventListener('gesturechange', function (e) { e.preventDefault(); }, { passive: false });
            doc.addEventListener('gestureend', function (e) { e.preventDefault(); }, { passive: false });
            doc.addEventListener('touchstart', function (e) {
                if (e.touches && e.touches.length > 1) {
                    e.preventDefault();
                }
            }, { passive: false });
            doc.addEventListener('touchmove', function (e) {
                if (e.touches && e.touches.length > 1) {
                    e.preventDefault();
                }
            }, { passive: false });
            doc.addEventListener('wheel', function (e) {
                if (e.ctrlKey) {
                    e.preventDefault();
                }
            }, { passive: false });
        } catch (err) {}
    }

    // === 5. PINIGŲ PAGALBINĖS FUNKCIJOS IR DUOMENYS ===
    var MONEY = {
        centCoins: [
            { cents: 1, label: '1c', class: 'coin coin-copper coin-1c' },
            { cents: 2, label: '2c', class: 'coin coin-copper coin-2c' },
            { cents: 5, label: '5c', class: 'coin coin-copper coin-5c' },
            { cents: 10, label: '10c', class: 'coin coin-gold coin-10c' },
            { cents: 20, label: '20c', class: 'coin coin-gold coin-20c' },
            { cents: 50, label: '50c', class: 'coin coin-gold coin-50c' }
        ],
        euroCoins: [
            { cents: 100, label: '1€', class: 'coin coin-1e' },
            { cents: 200, label: '2€', class: 'coin coin-2e' }
        ],
        bills: [
            { cents: 500, label: '5€', class: 'bill bill-5e' },
            { cents: 1000, label: '10€', class: 'bill bill-10e' },
            { cents: 2000, label: '20€', class: 'bill bill-20e' }
        ]
    };

    function formatMoneyCents(cents) {
        if (cents < 100) return cents + ' c';
        if (cents % 100 === 0) return (cents / 100) + ' €';
        return (cents / 100).toFixed(2).replace('.', ',') + ' €';
    }

    // === 6. BENDRAS VIRŠUTINĖS JUOSTOS IR PABAIGOS EKRANO RENDERINIMAS ===
    function calculateStars(score, total) {
        if (!total || total <= 0) return 1;
        var ratio = score / total;
        if (ratio >= 0.8) return 3;
        if (ratio >= 0.5) return 2;
        return 1;
    }

    function renderTopBar(opts) {
        opts = opts || {};
        var homeFn = opts.homeFn || 'renderStartScreen()';
        var safeHomeFn = 'clearGameTimers(); ' + homeFn;
        var homeTitle = opts.homeTitle || 'Lygio pasirinkimas';
        var score = (opts.score !== undefined) ? opts.score : 0;
        var current = opts.current;
        var total = opts.total;
        var streak = (opts.streak !== undefined) ? opts.streak : null;
        var theme = opts.theme || 'sky'; // spalvų paletė: sky, emerald, teal, orange, amber, purple, pink, blue, fuchsia
        var inIframe = false;
        try { inIframe = (global.self !== global.top); } catch (e) { inIframe = true; }
        var homeIcon = opts.homeIcon || (inIframe ? '🔙' : '🏠');

        var html = '<div class="top-bar bg-' + theme + '-100 border-b-2 border-' + theme + '-300 text-slate-800 px-3 sm:px-5 py-2 sm:py-2.5 flex justify-between items-center font-black text-sm sm:text-base shadow-sm shrink-0">';
        
        // Kairė: Pradžios mygtukas ir taškai
        html += '<div class="flex items-center gap-2 sm:gap-3">';
        html += '<button onclick="' + safeHomeFn + '" class="top-badge bg-white/90 hover:bg-' + theme + '-200 border border-' + theme + '-300 px-2.5 py-1 rounded-xl text-base sm:text-xl transition active:scale-95" title="' + homeTitle + '">' + homeIcon + '</button>';
        html += '<span class="flex items-center gap-1.5 text-base sm:text-lg">⭐ <span class="text-' + theme + '-700 dark:text-amber-300 font-black text-lg sm:text-xl">' + score + '</span></span>';
        html += '</div>';

        // Centras: Klausimo progresas
        if (current !== undefined && total !== undefined) {
            html += '<div class="top-badge bg-white/90 border border-' + theme + '-300 px-3 py-1 rounded-xl font-black text-' + theme + '-700 dark:text-amber-300 text-sm sm:text-base">🎯 ' + current + ' / ' + total + '</div>';
        }

        // Dešinė: Streak (jei pateiktas)
        if (streak !== null && streak !== undefined) {
            html += '<div class="flex items-center gap-1.5 text-base sm:text-lg">🔥 <span class="text-' + theme + '-700 dark:text-amber-300 font-black text-lg sm:text-xl">' + streak + '</span></div>';
        } else {
            html += '<div></div>';
        }

        html += '</div>';
        return html;
    }

    function renderEndScreen(opts) {
        opts = opts || {};
        clearGameTimers();
        var score = (opts.score !== undefined) ? opts.score : 0;
        var total = (opts.total !== undefined) ? opts.total : 10;
        var stars = opts.stars || calculateStars(score, total);
        var restartFn = opts.restartFn || 'renderStartScreen()';
        var restartText = opts.restartText || 'Dar kartą';
        var menuFn = opts.menuFn !== undefined ? opts.menuFn : 'renderStartScreen()';
        var menuText = opts.menuText || 'Kitas lygis';
        var retryFn = opts.retryFn || null;
        var mistakesCount = opts.mistakesCount || 0;
        var title = opts.title || 'Šaunuolis!';
        
        var message = opts.message;
        if (!message) {
            if (stars === 3) message = 'Puikiai padirbėta!';
            else if (stars === 2) message = 'Geras rezultatas!';
            else message = 'Neblogai, bandyk dar kartą!';
        }

        try {
            saveGameProgress(opts.gameId, stars, score, total, opts.mode);
            playWinSound();
            if (opts.celebrate !== false) {
                celebrateWin(stars);
            }
        } catch (e) {}

        var starHtml = '';
        for (var i = 0; i < 3; i++) {
            if (i < stars) {
                starHtml += '<span class="text-4xl sm:text-5xl text-yellow-400 bounce drop-shadow-md" style="animation-delay: ' + (i * 0.2) + 's">⭐</span>';
            } else {
                starHtml += '<span class="text-4xl sm:text-5xl text-gray-400 opacity-40 drop-shadow-md">⭐</span>';
            }
        }

        var modeProgressHtml = '';
        var gId = opts.gameId || detectGameId();
        var reqModes = gId ? GAME_MODES[gId] : null;
        if (reqModes && reqModes.length > 1) {
            var prog = getGameProgress(gId);
            var doneModes = prog.completedModes || 1;
            var totalModes = reqModes.length;
            var overallStars = prog.stars || 1;
            var overallStarsHtml = '';
            for (var mIdx = 0; mIdx < 3; mIdx++) {
                overallStarsHtml += (mIdx < overallStars) ? '⭐' : '<span style="opacity:0.25">⭐</span>';
            }
            if (doneModes >= totalModes && overallStars === 3) {
                modeProgressHtml = '<div class="mb-3 px-3.5 py-2 rounded-2xl bg-emerald-50 dark:bg-slate-800 border-2 border-emerald-400 text-xs sm:text-sm font-extrabold text-emerald-900 dark:text-emerald-200 max-w-xs w-full">' +
                    '<div>🏆 ' + _col('Visos žaidimo dalys pereitos!') + ' (' + doneModes + '/' + totalModes + ')</div>' +
                    '<div class="mt-0.5">' + _col('Žaidimo žvaigždutės:') + ' ' + overallStarsHtml + '</div>' +
                '</div>';
            } else {
                modeProgressHtml = '<div class="mb-3 px-3.5 py-2 rounded-2xl bg-amber-50 dark:bg-slate-800 border-2 border-amber-300 dark:border-slate-600 text-xs sm:text-sm font-extrabold text-amber-900 dark:text-amber-200 max-w-xs w-full">' +
                    '<div>🧩 ' + _col('Pereita žaidimo dalių:') + ' <span class="font-black">' + doneModes + ' / ' + totalModes + '</span> • ' + overallStarsHtml + '</div>' +
                    '<div class="text-[11px] sm:text-xs opacity-85 mt-0.5">' + _col('Pereik visas dalis, kad surinktum visas 3 žvaigždutes!') + '</div>' +
                '</div>';
            }
        }

        var retryBtnHtml = '';
        if (retryFn && mistakesCount > 0) {
            retryBtnHtml = '<button onclick="' + retryFn + '" class="btn-3d w-full py-2.5 sm:py-3 px-4 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-black text-sm sm:text-base shadow-md transition transform active:scale-95 border-2 border-b-4 border-amber-400">' +
                '🛠️ ' + _col('Pataisyti klaidas') + ' (' + mistakesCount + ')' +
            '</button>';
        }

        var menuBtnHtml = '';
        if (menuFn && !opts.hideMenuBtn && restartFn !== menuFn) {
            menuBtnHtml = '<button onclick="' + menuFn + '" class="btn-tinted w-full py-2.5 sm:py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm sm:text-base shadow transition transform active:scale-95 border-2 border-b-4 border-slate-300">' +
                '🎛️ ' + _col(menuText) +
            '</button>';
        }

        return '<div class="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center fade-in">' +
            '<div class="text-4xl sm:text-6xl mb-1">🎉</div>' +
            '<h2 class="text-2xl sm:text-3xl font-black text-green-600 dark:text-green-400 mb-1">' + _col(title) + '</h2>' +
            '<div class="flex justify-center gap-2 mb-1">' + starHtml + '</div>' +
            '<p class="text-base sm:text-xl font-bold text-slate-700 dark:text-slate-200 mb-1">' + _col(message) + ' 🏆</p>' +
            '<p class="text-sm sm:text-lg text-slate-600 dark:text-slate-300 mb-2.5">' + _col('Šioje dalyje surinkai:') + ' <span class="font-black text-green-500 text-lg sm:text-xl">' + score + ' / ' + total + '</span></p>' +
            modeProgressHtml +
            '<div class="flex flex-col gap-2 w-full max-w-xs">' +
                retryBtnHtml +
                '<button onclick="' + restartFn + '" class="btn-tinted w-full py-3 sm:py-3.5 px-4 rounded-2xl bg-blue-100 hover:bg-blue-200 text-slate-800 font-black text-base sm:text-lg shadow-lg transition transform active:scale-95 border-2 border-b-4 border-blue-400">' +
                    '🔄 ' + _col(restartText) +
                '</button>' +
                menuBtnHtml +
            '</div>' +
        '</div>';
    }

    if (typeof document !== 'undefined') {
        preventZoom(document);
        try {
            document.addEventListener('click', function (e) {
                var t = e.target;
                while (t && t !== document) {
                    if (t.tagName === 'BUTTON' && t.getAttribute) {
                        var oc = t.getAttribute('onclick') || '';
                        var m = oc.match(/^startGame\(\s*(?:'([^']+)'|"([^"]+)"|(\d+))\s*\)$/);
                        if (m) {
                            _activeGameMode = m[1] || m[2] || m[3];
                            break;
                        }
                    }
                    t = t.parentNode;
                }
            }, true);

            var initModeObserver = function () {
                decorateModeButtons();
                if (typeof MutationObserver !== 'undefined' && document.body) {
                    var obs = new MutationObserver(function () {
                        decorateModeButtons();
                    });
                    obs.observe(document.body, { childList: true, subtree: true });
                }
            };
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initModeObserver);
            } else {
                setTimeout(initModeObserver, 0);
            }
        } catch (err) {}
    }

    // Eksportuojame į globalią erdvę (window)
    global.GAME_MODES = GAME_MODES;
    global.decorateModeButtons = decorateModeButtons;
    global._V = _V;
    global._D = _D;
    global._L = _L;
    global._O = _O;
    global._SC = _SC;
    global.SYLLABLE_COLORS = SYLLABLE_COLORS;
    global._syl = _syl;
    global._col = _col;
    global.getWordLetterColors = getWordLetterColors;
    global.isSyllableColoringEnabled = isSyllableColoringEnabled;
    global.setSyllableColoringEnabled = setSyllableColoringEnabled;
    global.applySyllableColoring = applySyllableColoring;
    global.getThemeMode = getThemeMode;
    global.setThemeMode = setThemeMode;
    global.isDarkMode = isDarkMode;
    global.applyTheme = applyTheme;
    global.getAudioCtx = getAudioCtx;
    global.initAudio = initAudio;
    global.playTone = playTone;
    global.playSound = playSound;
    global.playCorrectSound = playCorrectSound;
    global.playWrongSound = playWrongSound;
    global.playWinSound = playWinSound;
    global.playSelectSound = playSelectSound;
    global.playPickSound = playPickSound;
    global.playPopSound = playPopSound;
    global.playStepSound = playStepSound;
    global.playTapSound = playTapSound;
    global.playReturnSound = playReturnSound;
    global.playHintSound = playHintSound;
    global.isSoundEnabled = isSoundEnabled;
    global.setSoundEnabled = setSoundEnabled;
    global.hasLithuanianTTS = hasLithuanianTTS;
    global.speakLT = speakLT;
    global.renderSpeakBtn = renderSpeakBtn;
    global.setGameTimeout = setGameTimeout;
    global.clearGameTimers = clearGameTimers;
    global.showFeedback = showFeedback;
    global.eliminateWrongOptions = eliminateWrongOptions;
    global.celebrateWin = celebrateWin;
    global.detectGameId = detectGameId;
    global.getGameProgress = getGameProgress;
    global.saveGameProgress = saveGameProgress;
    global.clearGameProgress = clearGameProgress;
    global.shuffle = shuffle;
    global.shuffleArray = shuffle;
    global.pickRandom = pickRandom;
    global.preventZoom = preventZoom;
    global.MONEY = MONEY;
    global.formatMoneyCents = formatMoneyCents;
    global.calculateStars = calculateStars;
    global.renderTopBar = renderTopBar;
    global.renderTopBarHelper = renderTopBar;
    global.renderEndScreen = renderEndScreen;
    global.renderEndScreenHelper = renderEndScreen;
})(typeof window !== 'undefined' ? window : this);
