/**
 * Vaikų Žaidimai — Lietuviškų raidžių ir žodžių biblioteka (shared/words.js)
 *
 * Skirta žaidimams: Trūksta Raidės, Raidžių Dėlionė, Mokomės Rašyti, Skaitymo Žaidimas.
 */
(function (global) {
    'use strict';

    var LITHUANIAN_ALPHABET = [
        'A', 'Ą', 'B', 'C', 'Č', 'D', 'E', 'Ę', 'Ė', 'F',
        'G', 'H', 'I', 'Į', 'Y', 'J', 'K', 'L', 'M', 'N',
        'O', 'P', 'R', 'S', 'Š', 'T', 'U', 'Ų', 'Ū', 'V',
        'Z', 'Ž'
    ];

    function renderVirtualKeyboard(container, onLetterClick, options) {
        if (!container) return;
        options = options || {};
        var disabledList = options.disabledLetters || [];
        var keyClass = options.keyClass || 'w-full h-11 sm:h-13 flex items-center justify-center text-lg sm:text-2xl font-bold rounded-lg sm:rounded-xl shadow-sm border-b-[3px] active:border-b-0 active:translate-y-[3px] transition-all bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200';
        var disabledClass = options.disabledClass || 'bg-gray-100 text-gray-400 border-gray-200 opacity-30 cursor-not-allowed pointer-events-none';

        container.innerHTML = '';
        for (var i = 0; i < LITHUANIAN_ALPHABET.length; i++) {
            var letter = LITHUANIAN_ALPHABET[i];
            var isDisabled = disabledList.indexOf(letter) !== -1;

            var btn = document.createElement('button');
            btn.type = 'button';
            btn.id = 'key-' + letter;
            btn.textContent = letter;
            btn.className = keyClass + (isDisabled ? ' ' + disabledClass : '');
            btn.disabled = isDisabled;

            (function (l) {
                btn.onclick = function () {
                    if (typeof onLetterClick === 'function') {
                        onLetterClick(l);
                    }
                };
            })(letter);

            container.appendChild(btn);
        }
    }

    global.LITHUANIAN_ALPHABET = LITHUANIAN_ALPHABET;
    global.renderVirtualKeyboard = renderVirtualKeyboard;
})(typeof window !== 'undefined' ? window : this);
