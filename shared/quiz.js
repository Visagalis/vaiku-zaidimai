/**
 * Vaikų Žaidimai — Viktorinų ir klausimynų būsenos variklis (shared/quiz.js)
 *
 * Šiame faile aprašyti viktorinų ir pasirinkimo žaidimų komponentai:
 * 1. Semantiniai mygtukų būsenų valdikliai (`markAnswerCorrect`, `markAnswerWrong`, `resetAnswerButton`).
 * 2. Viktorinos eigos ir būsenos valdiklis (`createQuizController` / `VZQuizEngine`).
 */
(function (global) {
    'use strict';

    function markAnswerCorrect(btn, extraClass) {
        if (!btn) return;
        btn.classList.remove('quiz-opt-wrong', 'shake', 'animate-shake');
        btn.classList.add('quiz-opt-correct');
        if (extraClass) btn.classList.add(extraClass);
    }

    function markAnswerWrong(btn, extraClass) {
        if (!btn) return;
        btn.disabled = true;
        btn.classList.add('quiz-opt-wrong');
        if (extraClass) btn.classList.add(extraClass);
    }

    function resetAnswerButton(btn) {
        if (!btn) return;
        btn.disabled = false;
        btn.classList.remove('quiz-opt-correct', 'quiz-opt-wrong', 'quiz-eliminated');
    }

    function eliminateWrongQuizOptions(containerSelector, isCorrectFn, count) {
        var root = typeof document !== 'undefined' ? document : null;
        if (!root) return;
        var nodes = root.querySelectorAll(containerSelector);
        var wrongNodes = [];
        for (var i = 0; i < nodes.length; i++) {
            var btn = nodes[i];
            if (!btn.disabled && !isCorrectFn(btn, i)) {
                wrongNodes.push(btn);
            }
        }
        var shuffleFn = global.shuffle || function (a) { return a.slice(); };
        var toEliminate = shuffleFn(wrongNodes).slice(0, count || 2);
        for (var j = 0; j < toEliminate.length; j++) {
            toEliminate[j].disabled = true;
            toEliminate[j].classList.add('quiz-eliminated');
        }
    }

    /**
     * Sukuria viktorinos eigos valdiklį (VZQuizEngine)
     */
    function createQuizController(config) {
        config = config || {};
        var maxLimit = config.maxQuestions || 10;
        var advanceDelay = config.advanceDelay || 1100;

        var state = {
            mode: config.mode || 'default',
            deck: [],
            currentIndex: 0,
            currentQuestion: null,
            totalPossible: maxLimit,
            score: 0,
            streak: 0,
            firstTry: true,
            waiting: false,
            hintUsed: false,
            missedQuestions: []
        };

        var controller = {
            state: state,
            start: function (mode, questions) {
                if (typeof global.getAudioCtx === 'function') global.getAudioCtx();
                if (typeof global.clearGameTimers === 'function') global.clearGameTimers();

                state.mode = mode || state.mode;
                var pool = (questions && questions.length) ? questions : (config.questions || []);
                var shuffleFn = global.shuffle || function (a) { return a.slice(); };
                state.deck = shuffleFn(pool).slice(0, maxLimit);
                state.totalPossible = state.deck.length;
                state.currentIndex = 0;
                state.score = 0;
                state.streak = 0;
                state.missedQuestions = [];

                controller.loadQuestion();
            },
            loadQuestion: function () {
                state.waiting = false;
                state.firstTry = true;
                state.hintUsed = false;

                if (state.currentIndex >= state.deck.length) {
                    controller.finish();
                    return;
                }

                state.currentQuestion = state.deck[state.currentIndex];
                if (typeof config.onRenderQuestion === 'function') {
                    config.onRenderQuestion(state.currentQuestion, state, controller);
                }
            },
            handleAnswer: function (isCorrect, btnEl, customPraise) {
                if (state.waiting) return false;

                if (isCorrect) {
                    state.waiting = true;
                    if (typeof global.playCorrectSound === 'function') global.playCorrectSound();

                    if (state.firstTry) {
                        state.score++;
                        state.streak++;
                    }

                    if (btnEl) markAnswerCorrect(btnEl);

                    var praiseText = customPraise;
                    if (!praiseText && typeof global.pickPraise === 'function') {
                        praiseText = global.pickPraise();
                    }
                    if (typeof global.showFeedback === 'function') {
                        global.showFeedback(praiseText ? (praiseText + ' 🌟') : 'Puiku! 🌟', 'success');
                    }

                    if (typeof config.onAnswer === 'function') {
                        config.onAnswer(true, state.currentQuestion, state);
                    }

                    var timerFn = global.setGameTimeout || setTimeout;
                    timerFn(function () {
                        state.currentIndex++;
                        controller.loadQuestion();
                    }, advanceDelay);

                    return true;
                } else {
                    state.firstTry = false;
                    state.streak = 0;
                    if (typeof global.playWrongSound === 'function') global.playWrongSound();

                    if (state.currentQuestion && state.missedQuestions.indexOf(state.currentQuestion) === -1) {
                        state.missedQuestions.push(state.currentQuestion);
                    }

                    if (btnEl) markAnswerWrong(btnEl);

                    if (typeof global.showFeedback === 'function') {
                        global.showFeedback('Bandyk dar kartą! 🤔', 'error');
                    }

                    if (typeof config.onAnswer === 'function') {
                        config.onAnswer(false, state.currentQuestion, state);
                    }

                    return false;
                }
            },
            retryMistakes: function () {
                if (!state.missedQuestions || !state.missedQuestions.length) {
                    controller.start(state.mode);
                    return;
                }
                var shuffleFn = global.shuffle || function (a) { return a.slice(); };
                state.deck = shuffleFn(state.missedQuestions.slice());
                state.totalPossible = state.deck.length;
                state.currentIndex = 0;
                state.score = 0;
                state.streak = 0;
                state.missedQuestions = [];

                controller.loadQuestion();
            },
            finish: function () {
                if (typeof config.onFinish === 'function') {
                    config.onFinish(state, controller);
                } else if (typeof global.renderEndScreenHelper === 'function') {
                    var app = config.appEl || document.getElementById('app');
                    if (app) {
                        app.innerHTML = global.renderEndScreenHelper({
                            score: state.score,
                            total: state.totalPossible,
                            mode: state.mode,
                            mistakesCount: state.missedQuestions.length,
                            restartFn: config.restartFn || 'startGame("' + state.mode + '")',
                            retryFn: (state.missedQuestions.length > 0 && config.retryFn) ? config.retryFn : null,
                            menuFn: config.menuFn || 'renderStartScreen()'
                        });
                    }
                }
            }
        };

        return controller;
    }

    global.markAnswerCorrect = markAnswerCorrect;
    global.markAnswerWrong = markAnswerWrong;
    global.resetAnswerButton = resetAnswerButton;
    global.eliminateWrongQuizOptions = eliminateWrongQuizOptions;
    global.createQuizController = createQuizController;
    global.VZQuizEngine = createQuizController;
})(typeof window !== 'undefined' ? window : this);
