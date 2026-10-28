/**
 * Vaikų Žaidimai — Bendra funkcionalumo biblioteka (shared/common.js)
 *
 * Šiame faile aprašytos funkcijos, naudojamos visuose žaidimuose:
 * 1. Lietuviškų žodžių skiemenavimas (`_syl`) ir spalvinimas (`_col`, `getWordLetterColors`).
 * 2. Garso efektų sistema (Web Audio API: `playSound`, `playTone`, `playCorrectSound`, ir kt.).
 * 3. Apsauga nuo priartinimo gestais (`preventZoom`).
 * 4. Pagalbinės masyvų funkcijos (`shuffle`, `shuffleArray`, `pickRandom`).
 */
(function (global) {
    'use strict';

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
    global.shuffle = shuffle;
    global.shuffleArray = shuffle;
    global.pickRandom = pickRandom;
    global.preventZoom = preventZoom;
})(typeof window !== 'undefined' ? window : this);
