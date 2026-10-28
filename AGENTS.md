# AGENTS.md

Instructions, conventions, and quality gates for AI coding agents working on the **Vaikų Žaidimai** repository.

---

## 1. Pre-Commit Quality Gate (MANDATORY)

> [!IMPORTANT]
> **Before creating any `git commit` or concluding your task**, you **MUST** run the verification script and ensure it exits with code `0` and reports no errors:
>
> ```bash
> node scripts/verify.js
> ```
>
> If you only edited specific files during development, you can test them individually:
> ```bash
> node scripts/verify.js path/to/file1.htm path/to/file2.htm
> ```
> However, **the full verification (`node scripts/verify.js` with no arguments) must pass cleanly before any commit**.

### What `scripts/verify.js` Checks:
1. **JavaScript Syntax**:
   - Parses `shared/common.js` via Node.js `vm.Script`.
   - Extracts and verifies all inline `<script>` blocks across all `.htm` and `.html` files.
   - Verifies bracket/brace/parentheses balancing for Babel JSX scripts (`type="text/babel"`).
2. **HTML Structure & Integrity**:
   - Verifies required root tags (`<html>`, `<head>`, `<body>`, and their closing tags).
   - Checks matching tag counts for `<script>`/`</script>` and `<style>`/`</style>`.
   - Checks for accidental Git merge conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`).
3. **Resource Links Existence**:
   - Resolves all local `<link rel="stylesheet" href="...">` and `<script src="...">` paths relative to each file and asserts they exist on disk.
4. **Portal Mapping Consistency**:
   - Verifies that every game on disk is indexed in `index.html`, and every `showGame(...)` target in `index.html` points to a real file.

---

## 2. Project Architecture & Conventions

### Directory Layout
- **Central Portal**: [`index.html`](file:///Users/eglerente/Documents/GitHub/vaiku-zaidimai/index.html) (categorized hub for all games).
- **Shared Libraries**:
  - [`shared/common.css`](file:///Users/eglerente/Documents/GitHub/vaiku-zaidimai/shared/common.css): CSS variables for syllable colors, dark mode overrides, button press animations, and coin styles.
  - [`shared/common.js`](file:///Users/eglerente/Documents/GitHub/vaiku-zaidimai/shared/common.js): Syllable splitter (`_syl`), syllable colorizer (`_col`), syllable toggle (`setSyllableColoringEnabled`), Web Audio API sound synthesizers (`playSound`, `playTone`, `playCorrectSound`, `playWrongSound`, `playWinSound`), and array helpers (`shuffle`, `pickRandom`).
- **Games (21 mini-games)**:
  - Each game lives in its own `<GameName>-main/` folder with an entrypoint HTML file.
  - *Note on casing*: `RaidziuDelione-main/Index.htm` uses capital `Index.htm`. All other games use lowercase `index.htm`. Always preserve exact casing.

### UI/UX & Non-Reader Accessibility Guidelines
- **Child-Friendly Minimal Text**: Keep instructions, controls, and feedback intuitive using large emojis, icons, numbers, and visual cues. Non-reading children should be able to play without needing adult assistance.
- **Reading Games Exception**: In language and reading games (`SkaitymoZaidimas`, `RaidziuDelione`, `MokomesRasyti`, `TrukstaRaides`, `ZodziuTvarka`, `Priesingybes`, `AtmintiesZaidimas`, and story problems in `TekstiniaiUzdaviniai`), **preserve the actual reading text, syllables, and words**. Only streamline the surrounding UI chrome.
- **Consistent UI Controls**:
  - Top bar: `🏠` (return home/menu), `⭐ {score}`, `🎯 {current}/{total}`, `🔥 {streak}`.
  - Reset / Clear: `🗑️` or `🔄`.
  - Confirmation: `✅` or `✅ Patvirtinti`.
  - End screen: `🎉 Šaunuolis!`, star rating (`⭐`), `⭐ {score} / {total}`, `🔄 Dar kartą`.
- **Syllable Coloring (`_col`)**:
  - Whenever Lithuanian words or text are rendered dynamically in HTML, wrap them with `${_col(text)}` so that syllable coloring remains functional and respects user preferences.

---

## 3. Workflow Checklist for Agents

When making changes to any game or library:
1. Edit the relevant files preserving documentation integrity and Lithuanian typography.
2. Run `node scripts/verify.js` to ensure zero syntax or link breakages.
3. If errors are found, fix them immediately and re-run `node scripts/verify.js`.
4. Only when `✓ PATIKRA SĖKMINGA! Klaidų nerasta.` is printed, proceed with git staging and commit.
