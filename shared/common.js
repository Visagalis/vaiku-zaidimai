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

    // === 2. GARSO SISTEMA (Web Audio API) ===
    var _audioCtx = null;

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

    // === 3. PAGALBINĖS MASYVŲ FUNKCIJOS ===
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
        html += '<button onclick="' + homeFn + '" class="top-badge bg-white/90 hover:bg-' + theme + '-200 border border-' + theme + '-300 px-2.5 py-1 rounded-xl text-base sm:text-xl transition active:scale-95" title="' + homeTitle + '">' + homeIcon + '</button>';
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
        var score = (opts.score !== undefined) ? opts.score : 0;
        var total = (opts.total !== undefined) ? opts.total : 10;
        var stars = opts.stars || calculateStars(score, total);
        var restartFn = opts.restartFn || 'renderStartScreen()';
        var restartText = opts.restartText || 'Dar kartą';
        var title = opts.title || 'Šaunuolis!';
        
        var message = opts.message;
        if (!message) {
            if (stars === 3) message = 'Puikiai padirbėta!';
            else if (stars === 2) message = 'Geras rezultatas!';
            else message = 'Neblogai, bandyk dar kartą!';
        }

        try {
            playWinSound();
        } catch (e) {}

        var starHtml = '';
        for (var i = 0; i < 3; i++) {
            if (i < stars) {
                starHtml += '<span class="text-5xl sm:text-6xl text-yellow-400 bounce drop-shadow-md" style="animation-delay: ' + (i * 0.2) + 's">⭐</span>';
            } else {
                starHtml += '<span class="text-5xl sm:text-6xl text-gray-400 opacity-40 drop-shadow-md">⭐</span>';
            }
        }

        return '<div class="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 text-center fade-in">' +
            '<div class="text-6xl sm:text-7xl mb-2">🎉</div>' +
            '<h2 class="text-3xl sm:text-4xl font-black text-green-600 dark:text-green-400 mb-3">' + _col(title) + '</h2>' +
            '<div class="flex justify-center gap-2 mb-3">' + starHtml + '</div>' +
            '<p class="text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-200 mb-2">' + _col(message) + ' 🏆</p>' +
            '<p class="text-lg sm:text-xl text-slate-600 dark:text-slate-300 mb-6">' + _col('Surinkai:') + ' <span class="font-black text-green-500 text-xl sm:text-2xl">' + score + ' / ' + total + '</span></p>' +
            '<div class="flex flex-col sm:flex-row gap-3 w-full max-w-xs">' +
                '<button onclick="' + restartFn + '" class="btn-tinted w-full py-3.5 sm:py-4 px-4 rounded-2xl bg-blue-100 hover:bg-blue-200 text-slate-800 font-black text-lg sm:text-xl shadow-lg transition transform active:scale-95 border-2 border-b-4 border-blue-400">' +
                    '🔄 ' + _col(restartText) +
                '</button>' +
            '</div>' +
        '</div>';
    }

    if (typeof document !== 'undefined') {
        preventZoom(document);
    }

    // Eksportuojame į globalią erdvę (window)
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
    global.shuffle = shuffle;
    global.shuffleArray = shuffle;
    global.pickRandom = pickRandom;
    global.preventZoom = preventZoom;
    global.MONEY = MONEY;
    global.formatMoneyCents = formatMoneyCents;
    global.calculateStars = calculateStars;
    global.renderTopBar = renderTopBar;
    global.renderEndScreen = renderEndScreen;
    global.renderEndScreenHelper = renderEndScreen;
})(typeof window !== 'undefined' ? window : this);
