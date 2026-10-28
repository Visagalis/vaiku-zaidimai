# AGENTS.md

Instructions, conventions, and quality gates for AI coding agents working on the **Vaikų Žaidimai** repository.

> **TL;DR for agents**
> - Static site, **no build step, no package.json, no npm install**. Every game is one self-contained HTML file.
> - All UI text is **Lithuanian** (`lang="lt"`, UTF-8). Keep diacritics (ą č ę ė į š ų ū ž) intact.
> - Reuse helpers from [`shared/common.js`](shared/common.js) and styles from [`shared/common.css`](shared/common.css) instead of re-implementing them.
> - Wrap every dynamically rendered Lithuanian word or phrase in `${_col(text)}`.
> - Run `node scripts/verify.js` before every commit. It must print `✓ PATIKRA SĖKMINGA! Klaidų nerasta.`

---

## 1. Pre-Commit Quality Gate (MANDATORY)

> [!IMPORTANT]
> **Before creating any `git commit` or finishing your task**, you **MUST** run the verification script. It must exit with code `0` and report no errors:
>
> ```bash
> node scripts/verify.js
> ```
>
> While you work, you can check just the files you edited:
> ```bash
> node scripts/verify.js path/to/file1.htm path/to/file2.htm
> ```
> However, **the full run (`node scripts/verify.js` with no arguments) must pass before any commit**.

### What `scripts/verify.js` checks
1. **JavaScript syntax**:
   - Parses `shared/common.js` with Node.js `vm.Script`.
   - Extracts and parses every inline `<script>` block in all `.htm` and `.html` files.
   - Checks that brackets, braces, and parentheses balance in Babel JSX scripts (`type="text/babel"`).
2. **HTML structure and integrity**:
   - Checks that the root tags are present (`<html>`, `<body>`, and their closing tags).
   - Checks that `<script>`/`</script>` and `<style>`/`</style>` counts match.
   - Looks for leftover Git merge conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`).
3. **Local resource links**:
   - Resolves every local `<link href="...">` and `<script src="...">` path relative to its file and confirms the file exists on disk.
4. **Portal mapping**:
   - Warns if a game folder on disk has no card in `index.html`.
   - Errors if a `showGame(...)` target in `index.html` points to a file that doesn't exist.

### What it does NOT check (verify these yourself)
- **Runtime errors**: calling a function that isn't defined, typos in globals, or wrong DOM ids. `vm.Script` only parses code; it never runs it.
- **JSX semantics**: it only checks bracket balance. Babel compiles JSX in the browser at runtime.
- **Visual output**: layout, dark mode, mobile sizes, Tailwind classes.
- **Lithuanian spelling and syllable correctness.**

For anything beyond trivial text edits, also do a **manual browser check** (see §3.3).

---

## 2. Project Overview

| Aspect | Details |
| --- | --- |
| Purpose | Educational mini-games for Lithuanian pre-school and early-primary children (math, reading, money, logic). |
| Hosting | GitHub Pages: <https://visagalis.github.io/vaiku-zaidimai/>. Pushing to the default branch deploys. |
| Stack | Plain HTML + vanilla JS (ES2015+) + **Tailwind CSS Play CDN** (`https://cdn.tailwindcss.com`) + Google Fonts (Nunito, plus Fredoka/Quicksand in RaidziuDelione). |
| React games | `SkaitymoZaidimas` and `MokomesRasyti` use **React 18 UMD + Babel Standalone** from unpkg (`<script type="text/babel">`). |
| Build / deps | **None.** Don't add bundlers, npm packages, TypeScript, or ES modules. Node.js is only needed for `scripts/verify.js`. |
| Persistence | `localStorage` only (see §4.3). There is no backend. |
| Target devices | Mostly tablets and phones held by children, in portrait or landscape. Desktop is secondary. |

---

## 3. Project Architecture

### 3.1 Directory layout
```
/
├── index.html              # Portal: categorized game grid + settings modal + iframe game host
├── shared/
│   ├── common.css          # Syllable color vars, dark mode, animations, coins/bills, mobile layout
│   └── common.js           # Syllables, coloring, theme, sounds, zoom guard, array helpers
├── scripts/
│   └── verify.js           # Pre-commit verification (run with Node)
├── <GameName>-main/
│   └── index.htm           # One self-contained game (HTML + <style> + <script>)
├── AGENTS.md
└── README.md
```

- **Central portal**: [`index.html`](index.html), the categorized hub for all games.
- **Games (21 mini-games)**: each game lives in its own `<GameName>-main/` folder with one entry HTML file.
- **Casing note**: `RaidziuDelione-main/Index.htm` uses a capital `Index.htm`. All other games use lowercase `index.htm`. **Always keep the exact casing.** macOS is case-insensitive but GitHub Pages is not, so a wrong case breaks only in production.

### 3.2 Game catalogue

| Folder | Portal title | Category (`data-cat`) | Tech |
| --- | --- | --- | --- |
| `Pinigai-main` | 💰 Pinigėliai | `money` | Vanilla |
| `Parduotuve-main` | 🛒 Mažoji Parduotuvė | `money` | Vanilla |
| `Graza-main` | 🏧 Kasininkas ir Grąža | `money` | Vanilla |
| `Taupykle-main` | 🐷 Taupyklė ir Piniginės | `money` | Vanilla |
| `LinksmiSkaiciai-main` | 🔢 Linksmoji Matematika | `math` | Vanilla + canvas-confetti |
| `LaikrodzioZaidimas-main` | 🕐 Laikrodžio Žaidimas | `math` | Vanilla |
| `DidesnisMazesnis-main` | ⚖️ Didesnis ar Mažesnis | `math` | Vanilla |
| `SkaiciuEilute-main` | 🔢 Skaičių Eilutė | `math` | Vanilla |
| `TekstiniaiUzdaviniai-main` | 🍎 Tekstiniai Uždavinukai | `math` | Vanilla |
| `MokomesRasyti-main` | ✍️ Mokomės Rašyti | `lang` | **React + Babel** |
| `RaidziuDelione-main` (`Index.htm`) | 🧩 Raidžių Dėlionė | `lang` | Vanilla, own dark toggle |
| `SkaitymoZaidimas-main` | 📖 Skaitymo Žaidimas | `lang` | **React + Babel** |
| `TrukstaRaides-main` | 🔤 Trūksta Raidės | `lang` | Vanilla |
| `AtmintiesZaidimas-main` | 🃏 Atminties Žaidimas | `lang` | Vanilla |
| `ZodziuTvarka-main` | 📐 Žodžių Tvarka | `lang` | Vanilla |
| `Priesingybes-main` | ⚖️ Priešingybės | `lang` | Vanilla |
| `SpalvosFormos-main` | 🟡 Spalvos ir Formos | `world` | Vanilla |
| `KaireDesine-main` | 🧭 Kairė ar Dešinė? | `world` | Vanilla |
| `GyvunaiVaikeliai-main` | 🐾 Gyvūnai ir Vaikeliai | `world` | Vanilla |
| `MetuLaikai-main` | 🗓️ Metų Laikai ir Kalendorius | `world` | Vanilla |
| `Rusiuotojas-main` | ♻️ Šiukšlių Rūšiuotojas | `world` | Vanilla |

### 3.3 Running locally
There is nothing to build. Serve the repo root over HTTP:
```bash
python3 -m http.server 8000
# open http://localhost:8000/
```
> [!NOTE]
> Use HTTP, not `file://`. The portal loads games in a **same-origin `<iframe>`** and reaches into `iframe.contentDocument` to sync the theme, syllable coloring, and zoom guard. Over `file://`, browsers treat each file as its own origin, so those features silently fail.

When you check by hand, open the game **through the portal** (iframe mode) *and* directly (`/Pinigai-main/index.htm`). Check a narrow phone width (≈360px), landscape (height ≤ 520px), and both light and dark themes.

### 3.4 How the portal hosts games
- Each card in `#games-grid` is a `<button data-cat="..." onclick="showGame('<Folder>/index.htm', '<emoji> <Title>')">`.
- `showGame()` loads the game into `#game-frame` with a cache-busting `?_t=<timestamp>`. The portal header supplies 🏠 Meniu, ⚙️ settings, and 🔄 reload.
- On iframe `load`, the portal calls `preventZoom(fDoc)`, `syncFrameTheme()`, and `syncFrameSyllableColoring()`.
- The category pills show **hard-coded counts** (`🌟 Visi (21)`, `💰 Pinigai (4)`, …). **Update them** whenever you add, remove, or recategorize a game.
- Every game must also work **standalone** (opened directly), so don't depend on anything from the parent window.

---

## 4. Shared Library Reference

### 4.1 `shared/common.js` (global functions, attached to `window`)

| Area | API | Notes |
| --- | --- | --- |
| Syllables | `_syl(word) → string[]` | Lithuanian syllable splitter (handles diphthongs, `dz`/`dž`/`ch`, onset clusters). |
| Coloring | `_col(text) → htmlString` | Wraps each syllable in `<span style="color:var(--sc-N)">`. Whitespace and non-letter tokens pass through. |
| Coloring | `getWordLetterColors(word) → string[]` | One CSS color per letter (used in letter-by-letter games such as TrukstaRaides and RaidziuDelione). |
| Coloring | `SYLLABLE_COLORS` / `_SC` | Array of 6 `var(--sc-N, fallback)` colors. Use it when syllables are hand-authored (SkaitymoZaidimas). |
| Syllable setting | `isSyllableColoringEnabled()`, `setSyllableColoringEnabled(bool)`, `applySyllableColoring(enabled?, doc?)` | Toggles the `syl-off` class on `<html>`. Game code needs no changes. |
| Theme | `getThemeMode()`, `setThemeMode('auto'\|'light'\|'dark')`, `isDarkMode(mode?)`, `applyTheme(mode?, doc?)` | See §4.3. |
| Audio | `getAudioCtx()` / `initAudio()` | Lazily creates and resumes the `AudioContext`. Call it in the first user gesture (e.g. `startGame`). |
| Audio | `playTone(freq, type, duration, startTime=0, vol=0.15)` | Low-level oscillator beep. |
| Audio | `playSound(type)` | `'coin' 'remove' 'click' 'tap' 'tick' 'pop' 'hop' 'correct' 'wrong'/'error' 'win'` |
| Audio | `playCorrectSound()`, `playWrongSound()`, `playWinSound()`, `playSelectSound()`, `playPickSound()`, `playPopSound()`, `playStepSound(idx?)`, `playTapSound()`, `playReturnSound()` | Preferred high-level feedback sounds. |
| Arrays | `shuffle(arr)` (alias `shuffleArray`), `pickRandom(arr)` | `shuffle` returns a **new** array (Fisher–Yates). It doesn't mutate the input. |
| Money | `formatMoneyCents(cents) → string`, `MONEY` | Canonical euro coin/bill data (`centCoins`, `euroCoins`, `bills`) and money formatting (`10 c`, `1 €`, `1,50 €`). |
| UI Components | `renderTopBar(opts) → htmlString` | Standard game top bar with 🏠, ⭐ score, 🎯 progress, and 🔥 streak badges. |
| UI Components | `calculateStars(score, total) → number`, `renderEndScreen(opts) → htmlString` | Standard star rating (≥80% 3★, ≥50% 2★, else 1★) and end screen template with restart button. |
| Input | `preventZoom(doc)` | Blocks pinch, gesture, and ctrl+wheel zoom. Runs automatically on load. |

**Rules for editing `common.js`:**
- Keep the **ES5 IIFE style** (`var`, `function`, no arrow functions or template literals). It's loaded by every page, including old tablet browsers.
- Any new public helper must be **exported** at the bottom (`global.myHelper = myHelper;`) and documented in the header comment and in this table.
- Wrap browser APIs (`localStorage`, `AudioContext`, `matchMedia`) in `try/catch` so that private mode and old browsers never throw.
- **Never rename or remove an exported global.** 21 games call these names directly. If you must change one, keep the old name as an alias.
- Guard DOM access with `typeof document !== 'undefined'` so `vm.Script` verification and future Node tests still work.

### 4.2 `shared/common.css`
- `--sc-0 … --sc-5`: syllable colors. They have light and dark variants and become `currentColor` under `.syl-off`.
- Animations: `.bounce`, `.shake` / `.shake-anim`, `.bounce-anim`, `.fade-in`, `.pop-in`.
- Money: `.coin` + `.coin-copper` / `.coin-gold` + `.coin-1c … .coin-50c`, `.coin-1e`, `.coin-2e`; `.bill` + `.bill-5e/10e/20e`. Use these for every euro coin and bill.
- Structural hooks the mobile rules depend on: **`#app`** (or `#main-app`, `.app-card`, `.glass-panel`) as the root game card, **`.top-bar`** / **`.top-badge`** for the stats bar, **`#feedback`** for the feedback line, and `.counter-tray`, `.money-tray`, `.change-tray`, `.piggy-box` for money trays. Keep these ids and class names when you refactor, or the small-screen layout breaks.
- `.btn-tinted`, `.top-bar`, `.top-badge` get dark-mode styling automatically.
- `body` has `touch-action: manipulation` and `user-select: none` globally.

### 4.3 Settings, theme, and `localStorage` keys

| Key | Values | Owner |
| --- | --- | --- |
| `vz-syllable-colors` | `'1'` (default) / `'0'` | `setSyllableColoringEnabled` |
| `vz-theme-mode` | `'auto'` (default) / `'light'` / `'dark'` | `setThemeMode` |

New keys must use the **`vz-` prefix**. The `storage` event listener in `common.js` keeps open iframes in sync.

**How the theme system works** (read this before touching dark mode):
1. `applyTheme()` toggles classes on `<html>` (`dark`, `dark-theme`, `dark-mode`, `light`, `light-theme`) and on `<body>` (`dark-mode` / `light-mode`).
2. It also **rewrites `@media (prefers-color-scheme: dark)` rules in place** in every same-origin stylesheet. In `dark` mode they become `all`; in `light` mode they become `not all`. So a game's own dark CSS only needs to live in `@media (prefers-color-scheme: dark) { … }` inside its `<style>` block.
3. For portal-level or shared CSS, also add the class-based selectors (`html.dark …, html.dark-theme …, .dark-mode …`), the way `index.html` and `common.css` do.

> [!WARNING]
> Tailwind `dark:` utilities (used in some games) follow the **media** strategy, because no `tailwind.config` sets `darkMode: 'class'`. The Tailwind CDN regenerates its `<style>` tag whenever it sees new classes, which can **reset** the in-place media rewrite. That means `dark:` utilities may ignore the manual theme toggle. For anything important, put the dark override in the game's `<style>` block instead.

---

## 5. Anatomy of a Game (Standard Template)

New games should follow this structure. The closest references are [`Priesingybes-main/index.htm`](Priesingybes-main/index.htm) (quiz plus pair matching) and [`Pinigai-main/index.htm`](Pinigai-main/index.htm) (money with `renderTopBar()`).

### 5.1 `<head>` boilerplate (keep this order)
```html
<!DOCTYPE html>
<html lang="lt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
    <title>🎲 Žaidimo Pavadinimas</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@600;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../shared/common.css">
    <script src="../shared/common.js"></script>
    <style>
        body { font-family: 'Nunito', sans-serif; /* + game-specific background */ }
        /* game-specific CSS */
        @media (prefers-color-scheme: dark) { /* dark overrides (toggled by applyTheme) */ }
    </style>
</head>
```
- Load `common.css` and `common.js` **in `<head>`**, before game code, so `_col`, `shuffle`, and the sound helpers exist when the game script runs. That also lets the theme apply before first paint, which avoids a flash.
- Paths to shared files are **relative** (`../shared/...` from games, `shared/...` from the portal). Don't use root-absolute `/shared/...`, because GitHub Pages serves the site from `/vaiku-zaidimai/`.

### 5.2 `<body>` and script structure (vanilla games)
```html
<body class="h-screen max-h-screen flex items-center justify-center p-2 sm:p-4 overflow-hidden transition-colors duration-200">
    <div id="app" class="w-full max-w-2xl ... rounded-3xl shadow-xl flex flex-col relative overflow-hidden max-h-full"></div>
    <script>
        // 1. Data (word lists, items) in UPPER_SNAKE_CASE constants
        const EASY_ITEMS = [ { word: "KATĖ", emoji: "🐱" }, /* ... */ ];

        // 2. Single mutable state object
        let state = { mode: 'easy', questions: [], currentIndex: 0, totalPossible: 10,
                      score: 0, streak: 0, firstTry: true, waiting: false };

        const appEl = document.getElementById('app');

        // 3. Screens: renderStartScreen → startGame(mode) → renderQuestion/renderGameScreen → renderEndScreen
        function renderStartScreen() { appEl.innerHTML = `...`; }
        function startGame(mode) { getAudioCtx(); /* reset state, build questions with shuffle() */ }
        function renderTopBar() { return `...`; }        // shared by all in-game screens
        function handleAnswer(value, btn) { if (state.waiting) return; /* ... */ }
        function renderEndScreen() { playWinSound(); /* ... */ }

        renderStartScreen();
    </script>
</body>
```

### 5.3 Game-flow conventions
- **Rendering**: each screen rebuilds `appEl.innerHTML` from a template literal. Event handlers are inline `onclick="fnName(...)"` attributes, so **handler functions must be top-level globals** (plain `function` declarations in a classic, non-module `<script>`).
- **Input lock**: set `state.waiting = true` during feedback animations or timeouts, and return early from handlers while it's set. This stops double taps from scoring twice.
- **Scoring**: a point counts only on the **first try** (`state.firstTry`). `streak` increments on first-try success and resets to `0` on any mistake.
- **Wrong answer**: `playWrongSound()`, add `shake-anim` + red classes, often `btn.disabled = true`. Let the child retry; don't reveal the answer immediately.
- **Correct answer**: `playCorrectSound()`, green classes (`bg-green-500 text-white`) + `bounce-anim`, then `setTimeout(next, ~1000–1200ms)`.
- **Feedback line**: `<div id="feedback">`. Set `feedback.innerHTML = \`<span>${_col('Puiku!')} 🎉</span>\`` and toggle `opacity-0` / `opacity-100`. Always wrap the message in a single `<span>` so spaces survive inside the flex container.
- **Stars on the end screen**: `ratio = score / totalPossible`. ⭐⭐⭐ if `≥ 0.8`, ⭐⭐ if `≥ 0.5`, otherwise ⭐.
- **Rounds**: typically **10 questions per round**, each with 2–4 answer options shuffled with `shuffle()`.
- **Audio**: call `getAudioCtx()` inside the first click handler (`startGame`), because browsers block audio until a user gesture.

### 5.4 React / Babel games (`SkaitymoZaidimas`, `MokomesRasyti`)
- Code lives in `<script type="text/babel">` and mounts via `ReactDOM.createRoot(document.getElementById('root'))`.
- Destructure hooks from the global: `const { useState, useEffect, useCallback, useRef } = React;`.
- To render syllable-colored HTML, use `<span dangerouslySetInnerHTML={{ __html: _col(text) }} />`, or map hand-authored syllables with `SYLLABLE_COLORS[i % SYLLABLE_COLORS.length]`.
- Shared helpers are globals, so call them directly (`playCorrectSound()`, `shuffle()`).
- Keep these games in React. Don't convert vanilla games to React or the other way round unless the user asks for it.

---

## 6. Coding Guidelines

### 6.1 JavaScript
- **Vanilla, no dependencies.** If it's already in `common.js`, use it. Don't redefine `shuffle`, `playTone`, sound helpers, or syllable logic locally. (Some older games still have local copies. Don't add more, and prefer the shared one when you touch that code.)
- In game files, use `const` by default, `let` when reassigning, and never `var`. In `shared/common.js`, use ES5 `var` (see §4.1).
- Naming: `camelCase` for functions and variables, `UPPER_SNAKE_CASE` for constant data tables, verb-first function names (`renderX`, `startGame`, `handleAnswer`, `checkX`, `updateXUI`).
- Keep one `state` object per game rather than scattered globals.
- **Escape values interpolated into inline handlers**: `onclick="handleAnswer('${opt.replace(/'/g, "\\'")}', this)"`. Better still, pass an index (`checkAnswer(${idx})`) and look up the value in `state`.
- Look up DOM elements after each re-render (`document.getElementById(...)`). References cached before `innerHTML` is replaced go stale.
- Clear or guard timers (`setTimeout`, `setInterval`) when the user goes back to the start screen (🏠) mid-animation, so a stale callback can't advance a new game.
- Never leave `console.log` debugging, `debugger`, or commented-out code blocks in committed files.
- Don't write a literal `</script>` inside JS strings. It ends the script block and breaks `verify.js`. Split it as `'<\/script>'` if you really need it.

### 6.2 HTML and CSS
- Style with **Tailwind utility classes first**. Arbitrary values are fine (the Play CDN JIT compiles them), e.g. `shadow-[0_5px_0_#1d4ed8]`, `min-[360px]:text-2xl`.
- Put game-specific custom CSS in that game's single `<style>` block. If a style is needed by **2+ games**, move it into `shared/common.css`.
- Use `!important` sparingly. It's acceptable in dark-mode and mobile overrides, where it has to beat Tailwind utilities, which is the existing pattern.
- Design **mobile-first**: base classes for phones, then `sm:` (≥640px) and up. Respect `dvh` units and `env(safe-area-inset-bottom)`.
- The 3D button look is `border-b-4` / `shadow-[0_5px_0_<darker>]` plus `active:translate-y-*` / `active:shadow-none`. Keep new buttons consistent with it.
- Every color you add for light mode needs a readable **dark-mode** counterpart (`#0b1120` / `#0f172a` / `#1e293b` backgrounds, `#f8fafc` text). Check contrast on both themes.

### 6.3 Lithuanian content and typography
- Files must stay **UTF-8**. Never transliterate (`Zaidimas` ➜ `Žaidimas`). Folder names are the only ASCII exception.
- Game data words are usually **UPPERCASE** (`"KATĖ"`, `"DRUGELIS"`). Follow the casing of the surrounding data set.
- Use correct Lithuanian grammar and natural child-friendly phrasing (`Puiku!`, `Šaunuolis!`, `Bandyk dar kartą!`). Double-check new words for spelling and diacritics.
- Where syllables are hand-authored (`SkaitymoZaidimas` `WORDS_DATA[].syllables`), they must join back exactly into `word`.
- If `_syl()` splits a new word incorrectly, choose a different word or hand-author its syllables. Only change the splitter in `common.js` if the fix is general, and then retest words across several games.

### 6.4 Comments and documentation
- Code comments in `shared/` and `scripts/` are written in **Lithuanian**. Match the language of the surrounding code in game files (some older sections are in English).
- Keep existing comments and docstrings unless your change makes them wrong.
- When you add a shared helper, a `localStorage` key, a game, or a CSS hook, **update this file** (tables in §3.2, §4.1, §4.3).

---

## 7. UI/UX & Non-Reader Accessibility Guidelines

- **Child-friendly, minimal text**: make instructions, controls, and feedback clear through large emojis, icons, numbers, and visual cues. A child who can't read yet should be able to play without an adult.
- **Reading games exception**: in language and reading games (`SkaitymoZaidimas`, `RaidziuDelione`, `MokomesRasyti`, `TrukstaRaides`, `ZodziuTvarka`, `Priesingybes`, `AtmintiesZaidimas`, and the story problems in `TekstiniaiUzdaviniai`), **keep the actual reading text, syllables, and words**. Only simplify the surrounding UI chrome.
- **Consistent UI controls**:
  - Top bar: `🏠` (back to home/menu), `⭐ {score}`, `🎯 {current}/{total}`, `🔥 {streak}`.
  - Reset / clear: `🗑️` or `🔄`.
  - Confirm: `✅` or `✅ Patvirtinti`.
  - End screen: `🎉 Šaunuolis!`, star rating (`⭐`), `⭐ {score} / {total}`, `🔄 Dar kartą`.
- **Syllable coloring (`_col`)**:
  - Whenever Lithuanian words or text are rendered dynamically into HTML, wrap them in `${_col(text)}` so syllable coloring keeps working and respects the user's setting.
  - Don't wrap numbers, emojis, or prices. `_col` already skips tokens without letters, but avoid wrapping HTML markup.
  - Don't hard-code syllable colors. Always go through `--sc-N` variables, `_col`, `SYLLABLE_COLORS`, or `getWordLetterColors`, so dark mode and the `syl-off` setting keep working.
- **Touch targets**: interactive elements should be at least **~48px** tall (`min-h-[48px]`) with enough spacing for small fingers. No hover-only interactions.
- **No failure states that punish**: no timers that end the game, no lost lives. Mistakes give gentle feedback and allow a retry.
- **Small screens**: nothing important may overflow on a 360×640 phone or in landscape (≤520px height). The game must fit without page-level scrolling where possible. Inner areas may scroll.
- **Parent-only areas** (e.g. the PIN-protected setup in `MokomesRasyti`) may use normal text, because adults use them.

---

## 8. Common Task Recipes

### Add a new game
1. Create `<NewGame>-main/index.htm` (lowercase `index.htm`). Start from the template in §5 or copy the closest existing game.
2. Link `../shared/common.css` and `../shared/common.js`. Follow the flow `renderStartScreen → startGame → … → renderEndScreen`.
3. In [`index.html`](index.html), add a card button to `#games-grid` with the right `data-cat` (`money` | `math` | `lang` | `world`), an emoji, a title, and a short subtitle. Its `showGame('<NewGame>-main/index.htm', '<emoji> <Title>')` must match the file path exactly.
4. Update the **category pill counts** (`Visi (N)` and the category's count).
5. Add the game to the table in §3.2 of this file and update the "21 mini-games" count.
6. Run `node scripts/verify.js` and check the game by hand in the portal, in light and dark, on a phone width.

### Change shared behavior (`common.js` / `common.css`)
- A change here affects **all 21 games and the portal**. Grep for every usage first:
  `grep -rn "functionOrClassName" --include="*.htm" --include="*.html" .`
- Keep backward compatibility (see §4.1). Spot-check at least one vanilla game, one React game, one money game, and the portal.

### Add or replace word or question data
- Edit the constant arrays at the top of the game's `<script>`. Keep the object shape identical (e.g. `{ word, emoji, correct, wrong: [...] }`).
- Make sure each entry has enough distinct wrong options and that the emoji clearly shows the word for non-readers.

### Add a sound
- Prefer existing helpers. If a new sound is reusable, add a `playXSound()` in `common.js` (ES5, wrapped in `try/catch`) and export it. Use one-off `playTone(...)` calls only for game-specific effects.

---

## 9. Known Pitfalls

| Pitfall | Avoid it by |
| --- | --- |
| Path casing (`Index.htm` vs `index.htm`) works locally but 404s on GitHub Pages | Copy paths from `git ls-files`. Never "normalize" `RaidziuDelione-main/Index.htm`. |
| Handler called from `onclick="..."` is not global | Declare it with top-level `function` in a classic `<script>`, not inside a block, module, or IIFE. |
| Lost spaces in feedback text inside flex containers | Wrap the whole message in one `<span>…</span>`. |
| Tailwind `dark:` ignoring the manual theme toggle | Put dark overrides in `@media (prefers-color-scheme: dark)` inside the game's `<style>`. |
| Double scoring from fast taps | Use the `state.waiting` lock and disable the clicked buttons. |
| Audio silent on iOS/Safari | Call `getAudioCtx()` in the first user gesture. |
| Mobile layout broken after refactor | Keep the `#app`, `.top-bar`, `.top-badge`, `#feedback`, and tray class hooks (§4.2). |
| Hard-coded portal category counts out of date | Update the pill labels whenever the game list changes. |
| `RaidziuDelione` has its own `#dark-toggle` button | `applyTheme()` updates that button's label and classes too. Keep the id if you edit it. |

---

## 10. Git & Commit Conventions

- Use **Conventional Commits** with a short **Lithuanian** description in the imperative, matching recent history:
  - `feat(settings): pridėti šviesios ir tamsios temos perjungimą nustatymuose`
  - `fix(ui): sumažinti monetų padėklus ir suvienodinti patvirtinimo mygtuką`
  - Types: `feat`, `fix`, `refactor`, `style`, `docs`, `chore`. Optional scopes: `ui`, `settings`, `shared`, `portal`, `verify`, or a game folder name (e.g. `fix(Pinigai): ...`).
- Keep each commit focused. Don't mix unrelated games or reformat whole files in a functional change.
- Don't commit `.DS_Store`, editor folders, or logs (they're covered by `.gitignore`).
- Only commit when the user asks you to. Never force-push or rewrite published history.

---

## 11. Workflow Checklist for Agents

When making changes to any game or library:
1. **Orient**: read this file, then the target game file(s). For shared changes, grep for every usage across games.
2. **Edit** the relevant files. Keep documentation intact and Lithuanian typography correct. Follow the conventions in §5–§7.
3. **Verify syntax**: run `node scripts/verify.js` (or pass specific files while iterating) to catch syntax or link breakage.
4. **Fix** any errors right away and run `node scripts/verify.js` again.
5. **Manual check** (anything beyond trivial text): serve with `python3 -m http.server`, open the game via the portal and directly, in light and dark themes, at phone width.
6. **Update docs**: if you added a game, shared helper, storage key, or CSS hook, update the relevant section of this file.
7. **Commit** only after `✓ PATIKRA SĖKMINGA! Klaidų nerasta.` is printed by the full `node scripts/verify.js` run, using the commit format in §10.
