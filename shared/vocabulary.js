/**
 * VAIKŲ ŽAIDIMAI — Centralizuotas žodžių ir sąvokų žodynas (vocabulary.js)
 *
 * Kanoninė lietuviškų žodžių, skiemenų ir asociatyvių emoji duomenų bazė vaikų edukaciniams žaidimams.
 * Suderinta su ES5 (IIFE), saugi senoms naršyklėms ir planšetėms.
 */
(function (global) {
    'use strict';

    var VOCABULARY = [
        { word: "AGURKAS", syllables: ["A","GUR","KAS"], emoji: "🥒", category: "food", difficulty: 3 },
        { word: "AKIS", syllables: ["A","KIS"], emoji: "👁️", category: "body", difficulty: 1 },
        { word: "AKMUO", syllables: ["AK","MUO"], emoji: "🪨", category: "nature", difficulty: 2 },
        { word: "ANTIS", syllables: ["AN","TIS"], emoji: "🦆", category: "animals", difficulty: 2 },
        { word: "APELSINAS", syllables: ["A","PEL","SI","NAS"], emoji: "🍊", category: "food", difficulty: 3 },
        { word: "ARBATA", syllables: ["AR","BA","TA"], emoji: "☕", category: "food", difficulty: 2 },
        { word: "ARBŪZAS", syllables: ["AR","BŪ","ZAS"], emoji: "🍉", category: "food", difficulty: 3 },
        { word: "ARKLYS", syllables: ["AR","KLYS"], emoji: "🐴", category: "animals", difficulty: 2 },
        { word: "AUSIS", syllables: ["AU","SIS"], emoji: "👂", category: "body", difficulty: 2 },
        { word: "AUTOBUSAS", syllables: ["AU","TO","BU","SAS"], emoji: "🚌", category: "transport", difficulty: 3 },
        { word: "BALIONAS", syllables: ["BA","LIO","NAS"], emoji: "🎈", category: "home", difficulty: 3 },
        { word: "BANANAS", syllables: ["BA","NA","NAS"], emoji: "🍌", category: "food", difficulty: 3 },
        { word: "BATAI", syllables: ["BA","TAI"], emoji: "👟", category: "home", difficulty: 2 },
        { word: "BATAS", syllables: ["BA","TAS"], emoji: "👞", category: "home", difficulty: 2 },
        { word: "BEŽDŽIONĖ", syllables: ["BEŽ","DŽIO","NĖ"], emoji: "🐒", category: "animals", difficulty: 3 },
        { word: "BITĖ", syllables: ["BI","TĖ"], emoji: "🐝", category: "animals", difficulty: 1 },
        { word: "BRAŠKĖ", syllables: ["BRAŠ","KĖ"], emoji: "🍓", category: "food", difficulty: 2 },
        { word: "BULVĖ", syllables: ["BUL","VĖ"], emoji: "🥔", category: "food", difficulty: 2 },
        { word: "BURNA", syllables: ["BUR","NA"], emoji: "👄", category: "body", difficulty: 2 },
        { word: "CITRINA", syllables: ["CIT","RI","NA"], emoji: "🍋", category: "food", difficulty: 3 },
        { word: "DEBESIS", syllables: ["DE","BE","SIS"], emoji: "☁️", category: "nature", difficulty: 3 },
        { word: "DOVANA", syllables: ["DO","VA","NA"], emoji: "🎁", category: "home", difficulty: 2 },
        { word: "DRAMBLYS", syllables: ["DRAM","BLYS"], emoji: "🐘", category: "animals", difficulty: 3 },
        { word: "DRUGELIS", syllables: ["DRU","GE","LIS"], emoji: "🦋", category: "animals", difficulty: 3 },
        { word: "DUONA", syllables: ["DUO","NA"], emoji: "🍞", category: "food", difficulty: 2 },
        { word: "DURYS", syllables: ["DU","RYS"], emoji: "🚪", category: "home", difficulty: 2 },
        { word: "DVIRATIS", syllables: ["DVI","RA","TIS"], emoji: "🚲", category: "transport", difficulty: 3 },
        { word: "EŽYS", syllables: ["E","ŽYS"], emoji: "🦔", category: "animals", difficulty: 1 },
        { word: "GĖLĖ", syllables: ["GĖ","LĖ"], emoji: "🌸", category: "nature", difficulty: 1 },
        { word: "GYVATĖ", syllables: ["GY","VA","TĖ"], emoji: "🐍", category: "animals", difficulty: 2 },
        { word: "JŪRA", syllables: ["JŪ","RA"], emoji: "🌊", category: "nature", difficulty: 1 },
        { word: "KALNAS", syllables: ["KAL","NAS"], emoji: "⛰️", category: "nature", difficulty: 2 },
        { word: "KAMUOLYS", syllables: ["KA","MUO","LYS"], emoji: "⚽", category: "home", difficulty: 3 },
        { word: "KARVĖ", syllables: ["KAR","VĖ"], emoji: "🐄", category: "animals", difficulty: 2 },
        { word: "KATĖ", syllables: ["KA","TĖ"], emoji: "🐱", category: "animals", difficulty: 1 },
        { word: "KĖDĖ", syllables: ["KĖ","DĖ"], emoji: "🪑", category: "home", difficulty: 1 },
        { word: "KELIAS", syllables: ["KE","LIAS"], emoji: "🛣️", category: "transport", difficulty: 2 },
        { word: "KELNĖS", syllables: ["KEL","NĖS"], emoji: "👖", category: "home", difficulty: 2 },
        { word: "KEPURĖ", syllables: ["KE","PU","RĖ"], emoji: "🧢", category: "home", difficulty: 2 },
        { word: "KIAULĖ", syllables: ["KIA","U","LĖ"], emoji: "🐷", category: "animals", difficulty: 2 },
        { word: "KIAUŠINIS", syllables: ["KIA","U","ŠI","NIS"], emoji: "🥚", category: "food", difficulty: 3 },
        { word: "KNYGA", syllables: ["KNY","GA"], emoji: "📖", category: "home", difficulty: 2 },
        { word: "KOJA", syllables: ["KO","JA"], emoji: "🦵", category: "body", difficulty: 1 },
        { word: "KRIAUŠĖ", syllables: ["KRIA","U","ŠĖ"], emoji: "🍐", category: "food", difficulty: 3 },
        { word: "KROKODILAS", syllables: ["KRO","KO","DI","LAS"], emoji: "🐊", category: "animals", difficulty: 3 },
        { word: "KUPRINĖ", syllables: ["KU","PRI","NĖ"], emoji: "🎒", category: "home", difficulty: 3 },
        { word: "LAIKRODIS", syllables: ["LAI","KRO","DIS"], emoji: "⌚", category: "home", difficulty: 3 },
        { word: "LAIVAS", syllables: ["LAI","VAS"], emoji: "🚢", category: "transport", difficulty: 2 },
        { word: "LAMA", syllables: ["LA","MA"], emoji: "🦙", category: "animals", difficulty: 1 },
        { word: "LANGAS", syllables: ["LAN","GAS"], emoji: "🪟", category: "home", difficulty: 2 },
        { word: "LAPAI", syllables: ["LA","PAI"], emoji: "🍃", category: "nature", difficulty: 2 },
        { word: "LAPAS", syllables: ["LA","PAS"], emoji: "🍁", category: "nature", difficulty: 2 },
        { word: "LAPĖ", syllables: ["LA","PĖ"], emoji: "🦊", category: "animals", difficulty: 1 },
        { word: "LAŠAS", syllables: ["LA","ŠAS"], emoji: "💧", category: "nature", difficulty: 2 },
        { word: "LEDAI", syllables: ["LE","DAI"], emoji: "🍦", category: "food", difficulty: 2 },
        { word: "LEDAS", syllables: ["LE","DAS"], emoji: "🧊", category: "nature", difficulty: 2 },
        { word: "LĖKTUVAS", syllables: ["LĖK","TU","VAS"], emoji: "✈️", category: "transport", difficulty: 3 },
        { word: "LĖLĖ", syllables: ["LĖ","LĖ"], emoji: "🎎", category: "home", difficulty: 1 },
        { word: "LIETUS", syllables: ["LIE","TUS"], emoji: "🌧️", category: "nature", difficulty: 2 },
        { word: "LIŪTAS", syllables: ["LI","Ū","TAS"], emoji: "🦁", category: "animals", difficulty: 2 },
        { word: "LOKYS", syllables: ["LO","KYS"], emoji: "🐻", category: "animals", difficulty: 2 },
        { word: "LOVA", syllables: ["LO","VA"], emoji: "🛌", category: "home", difficulty: 1 },
        { word: "LŪPA", syllables: ["LŪ","PA"], emoji: "👄", category: "body", difficulty: 1 },
        { word: "MAMA", syllables: ["MA","MA"], emoji: "👩", category: "people", difficulty: 1 },
        { word: "MAŠINA", syllables: ["MA","ŠI","NA"], emoji: "🚗", category: "transport", difficulty: 2 },
        { word: "MEDIS", syllables: ["ME","DIS"], emoji: "🌳", category: "nature", difficulty: 2 },
        { word: "MĖNULIS", syllables: ["MĖ","NU","LIS"], emoji: "🌙", category: "nature", difficulty: 3 },
        { word: "MĖSA", syllables: ["MĖ","SA"], emoji: "🥩", category: "food", difficulty: 1 },
        { word: "MEŠKA", syllables: ["MEŠ","KA"], emoji: "🐻", category: "animals", difficulty: 2 },
        { word: "MIŠKAS", syllables: ["MIŠ","KAS"], emoji: "🌲🌳", category: "nature", difficulty: 2 },
        { word: "MORKA", syllables: ["MOR","KA"], emoji: "🥕", category: "food", difficulty: 2 },
        { word: "MUSĖ", syllables: ["MU","SĖ"], emoji: "🪰", category: "animals", difficulty: 1 },
        { word: "NAMAS", syllables: ["NA","MAS"], emoji: "🏠", category: "home", difficulty: 2 },
        { word: "NOSIS", syllables: ["NO","SIS"], emoji: "👃", category: "body", difficulty: 2 },
        { word: "OBUOLYS", syllables: ["O","BUO","LYS"], emoji: "🍎", category: "food", difficulty: 3 },
        { word: "ORAS", syllables: ["O","RAS"], emoji: "💨", category: "nature", difficulty: 1 },
        { word: "OŽYS", syllables: ["O","ŽYS"], emoji: "🐐", category: "animals", difficulty: 1 },
        { word: "PASPIRTUKAS", syllables: ["PAS","PIR","TU","KAS"], emoji: "🛴", category: "transport", difficulty: 3 },
        { word: "PĖDA", syllables: ["PĖ","DA"], emoji: "🦶", category: "body", difficulty: 1 },
        { word: "PEILIS", syllables: ["PEI","LIS"], emoji: "🔪", category: "home", difficulty: 2 },
        { word: "PELĖ", syllables: ["PE","LĖ"], emoji: "🐭", category: "animals", difficulty: 1 },
        { word: "PELĖDA", syllables: ["PE","LĖ","DA"], emoji: "🦉", category: "animals", difficulty: 2 },
        { word: "PICA", syllables: ["PI","CA"], emoji: "🍕", category: "food", difficulty: 1 },
        { word: "PIENAS", syllables: ["PIE","NAS"], emoji: "🥛", category: "food", difficulty: 2 },
        { word: "PIEŠTUKAS", syllables: ["PIE","ŠTU","KAS"], emoji: "✏️", category: "home", difficulty: 3 },
        { word: "PILIS", syllables: ["PI","LIS"], emoji: "🏰", category: "home", difficulty: 2 },
        { word: "PINGVINAS", syllables: ["PING","VI","NAS"], emoji: "🐧", category: "animals", difficulty: 3 },
        { word: "POMIDORAS", syllables: ["PO","MI","DO","RAS"], emoji: "🍅", category: "food", difficulty: 3 },
        { word: "RAKETA", syllables: ["RA","KE","TA"], emoji: "🚀", category: "transport", difficulty: 2 },
        { word: "RAKTAS", syllables: ["RAK","TAS"], emoji: "🔑", category: "home", difficulty: 2 },
        { word: "RANKA", syllables: ["RAN","KA"], emoji: "✋", category: "body", difficulty: 2 },
        { word: "RATAS", syllables: ["RA","TAS"], emoji: "🛞", category: "transport", difficulty: 2 },
        { word: "ROŽĖ", syllables: ["RO","ŽĖ"], emoji: "🌹", category: "nature", difficulty: 1 },
        { word: "SALDAINIS", syllables: ["SAL","DAI","NIS"], emoji: "🍬", category: "food", difficulty: 3 },
        { word: "SAULĖ", syllables: ["SAU","LĖ"], emoji: "☀️", category: "nature", difficulty: 2 },
        { word: "SAUSAINIS", syllables: ["SAU","SAI","NIS"], emoji: "🍪", category: "food", difficulty: 3 },
        { word: "SNIEGAS", syllables: ["SNIE","GAS"], emoji: "🌨️", category: "nature", difficulty: 3 },
        { word: "SRAIGĖ", syllables: ["SRAI","GĖ"], emoji: "🐌", category: "animals", difficulty: 2 },
        { word: "SRAIGTASPARNIS", syllables: ["SRAIG","TA","SPAR","NIS"], emoji: "🚁", category: "transport", difficulty: 3 },
        { word: "SRIUBA", syllables: ["SRIU","BA"], emoji: "🥣", category: "food", difficulty: 2 },
        { word: "SUKNELĖ", syllables: ["SU","KNE","LĖ"], emoji: "👗", category: "home", difficulty: 3 },
        { word: "SŪRIS", syllables: ["SŪ","RIS"], emoji: "🧀", category: "food", difficulty: 2 },
        { word: "ŠAUKŠTAS", syllables: ["ŠAUK","ŠTAS"], emoji: "🥄", category: "home", difficulty: 3 },
        { word: "ŠOKOLADAS", syllables: ["ŠO","KO","LA","DAS"], emoji: "🍫", category: "food", difficulty: 3 },
        { word: "ŠUO", syllables: ["ŠUO"], emoji: "🐶", category: "animals", difficulty: 1 },
        { word: "TELEFONAS", syllables: ["TE","LE","FO","NAS"], emoji: "📱", category: "home", difficulty: 3 },
        { word: "TĖTIS", syllables: ["TĖ","TIS"], emoji: "👨", category: "people", difficulty: 2 },
        { word: "TIGRAS", syllables: ["TIG","RAS"], emoji: "🐅", category: "animals", difficulty: 2 },
        { word: "TORTAS", syllables: ["TOR","TAS"], emoji: "🎂", category: "food", difficulty: 2 },
        { word: "TRAUKINYS", syllables: ["TRAU","KI","NYS"], emoji: "🚂", category: "transport", difficulty: 3 },
        { word: "UGNIS", syllables: ["U","GNIS"], emoji: "🔥", category: "nature", difficulty: 2 },
        { word: "UOGA", syllables: ["UO","GA"], emoji: "🫐", category: "food", difficulty: 1 },
        { word: "UPĖ", syllables: ["U","PĖ"], emoji: "🏞️", category: "nature", difficulty: 1 },
        { word: "VAIKAS", syllables: ["VAI","KAS"], emoji: "👶", category: "people", difficulty: 2 },
        { word: "VAIVORYKŠTĖ", syllables: ["VAI","VO","RYKŠ","TĖ"], emoji: "🌈", category: "nature", difficulty: 3 },
        { word: "VARLĖ", syllables: ["VAR","LĖ"], emoji: "🐸", category: "animals", difficulty: 2 },
        { word: "VĖLIAVA", syllables: ["VĖ","LIA","VA"], emoji: "🇱🇹", category: "home", difficulty: 3 },
        { word: "VĖŽLYS", syllables: ["VĖ","ŽLYS"], emoji: "🐢", category: "animals", difficulty: 2 },
        { word: "VILKAS", syllables: ["VIL","KAS"], emoji: "🐺", category: "animals", difficulty: 2 },
        { word: "VYNUOGĖS", syllables: ["VY","NUO","GĖS"], emoji: "🍇", category: "food", difficulty: 3 },
        { word: "VYŠNIA", syllables: ["VY","ŠNIA"], emoji: "🍒", category: "food", difficulty: 2 },
        { word: "VIŠTA", syllables: ["VI","ŠTA"], emoji: "🐔", category: "animals", difficulty: 2 },
        { word: "VORAS", syllables: ["VO","RAS"], emoji: "🕷️", category: "animals", difficulty: 2 },
        { word: "ZEBRAS", syllables: ["ZEB","RAS"], emoji: "🦓", category: "animals", difficulty: 2 },
        { word: "ZUIKIS", syllables: ["ZUI","KIS"], emoji: "🐰", category: "animals", difficulty: 2 },
        { word: "ŽAIBAS", syllables: ["ŽAI","BAS"], emoji: "⚡", category: "nature", difficulty: 2 },
        { word: "ŽAISLAS", syllables: ["ŽAI","SLAS"], emoji: "🧸", category: "home", difficulty: 3 },
        { word: "ŽĄSIS", syllables: ["ŽĄ","SIS"], emoji: "🪿", category: "animals", difficulty: 2 },
        { word: "ŽEMĖ", syllables: ["ŽE","MĖ"], emoji: "🌍", category: "nature", difficulty: 1 },
        { word: "ŽIRAFA", syllables: ["ŽI","RA","FA"], emoji: "🦒", category: "animals", difficulty: 2 },
        { word: "ŽUVIS", syllables: ["ŽU","VIS"], emoji: "🐟", category: "animals", difficulty: 2 },
        { word: "ŽVAIGŽDĖ", syllables: ["ŽVAIGŽ","DĖ"], emoji: "⭐", category: "nature", difficulty: 3 },
    ];

    /**
     * Filtruoja žodyną pagal nurodytus kriterijus.
     * @param {Object} [options]
     * @param {string} [options.category] - 'animals' | 'food' | 'nature' | 'home' | 'transport' | 'body' | 'people'
     * @param {number} [options.difficulty] - 1 (lengvas), 2 (vidutinis), 3 (sunkus)
     * @param {number} [options.minDifficulty]
     * @param {number} [options.maxDifficulty]
     * @param {number} [options.minLength]
     * @param {number} [options.maxLength]
     * @param {number} [options.syllableCount]
     * @returns {Array<Object>}
     */
    function getVocabulary(options) {
        options = options || {};
        var list = VOCABULARY.slice();
        if (options.category) {
            list = list.filter(function (item) {
                return item.category === options.category;
            });
        }
        if (typeof options.difficulty === 'number') {
            list = list.filter(function (item) {
                return item.difficulty === options.difficulty;
            });
        }
        if (typeof options.minDifficulty === 'number') {
            list = list.filter(function (item) {
                return item.difficulty >= options.minDifficulty;
            });
        }
        if (typeof options.maxDifficulty === 'number') {
            list = list.filter(function (item) {
                return item.difficulty <= options.maxDifficulty;
            });
        }
        if (typeof options.minLength === 'number') {
            list = list.filter(function (item) {
                return item.word.length >= options.minLength;
            });
        }
        if (typeof options.maxLength === 'number') {
            list = list.filter(function (item) {
                return item.word.length <= options.maxLength;
            });
        }
        if (typeof options.syllableCount === 'number') {
            list = list.filter(function (item) {
                return item.syllables.length === options.syllableCount;
            });
        }
        return list;
    }

    /**
     * Grąžina atsitiktinius žodžius pagal nurodytus kriterijus.
     * @param {number} count
     * @param {Object} [options]
     * @returns {Array<Object>}
     */
    function getRandomWords(count, options) {
        var list = getVocabulary(options);
        if (typeof global.shuffle === 'function') {
            list = global.shuffle(list);
        } else {
            for (var i = list.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var temp = list[i];
                list[i] = list[j];
                list[j] = temp;
            }
        }
        if (typeof count === 'number' && count > 0) {
            return list.slice(0, count);
        }
        return list;
    }

    /**
     * Randa žodžio objektą pagal tekstą.
     * @param {string} text
     * @returns {Object|null}
     */
    function getWordByText(text) {
        if (!text) return null;
        var clean = String(text).trim().toUpperCase();
        for (var i = 0; i < VOCABULARY.length; i++) {
            if (VOCABULARY[i].word.toUpperCase() === clean) {
                return VOCABULARY[i];
            }
        }
        return null;
    }

    /**
     * Grąžina žodžius pagal temą/kategoriją.
     * @param {string} category
     * @returns {Array<Object>}
     */
    function getWordsByCategory(category) {
        return getVocabulary({ category: category });
    }

    // Eksportas į globalią erdvę
    global.VOCABULARY = VOCABULARY;
    global.VZ_VOCABULARY = VOCABULARY;
    global.getVocabulary = getVocabulary;
    global.getRandomWords = getRandomWords;
    global.getWordByText = getWordByText;
    global.getWordsByCategory = getWordsByCategory;

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
