#!/usr/bin/env node
/**
 * Vaikų Žaidimai — Automatinis patikros skriptas (Verification Script)
 *
 * Šis skriptas atlieka išsamią repozitorijos patikrą:
 * 1. JavaScript sintaksės patikra (shared/common.js ir inline skriptai per vm.Script).
 * 2. JSX / Babel blokų sintaksinis balansas (skliaustų {}, [], () poravimas).
 * 3. HTML struktūros ir gairių (tags) vientisumas.
 * 4. Resursų nuorodų (<link href="..."> ir <script src="...">) egzistavimas diske.
 * 5. Portalo (index.html) ir žaidimų katalogų tarpusavio atitikimas.
 * 6. Git konfliktų žymių (<<<<<<<, =======, >>>>>>>) patikra.
 *
 * Naudojimas:
 *   node scripts/verify.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');

const COLORS = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

let errorsCount = 0;
let warningsCount = 0;

function logError(msg) {
    console.error(`  ${COLORS.red}✗ [KLAIDA]${COLORS.reset} ${msg}`);
    errorsCount++;
}

function logWarn(msg) {
    console.warn(`  ${COLORS.yellow}⚠ [ĮSPĖJIMAS]${COLORS.reset} ${msg}`);
    warningsCount++;
}

function logSuccess(msg) {
    console.log(`  ${COLORS.green}✓${COLORS.reset} ${msg}`);
}

// 1. Rasti visus žaidimų katalogus ir HTML failus
function getGameFiles() {
    const entries = fs.readdirSync(ROOT_DIR, { withFileTypes: true });
    const htmlFiles = [];

    // index.html
    const rootIndex = path.join(ROOT_DIR, 'index.html');
    if (fs.existsSync(rootIndex)) {
        htmlFiles.push({ file: 'index.html', fullPath: rootIndex, isPortal: true });
    }

    for (const entry of entries) {
        if (entry.isDirectory() && entry.name.endsWith('-main')) {
            const dirPath = path.join(ROOT_DIR, entry.name);
            const subEntries = fs.readdirSync(dirPath);
            const indexFile = subEntries.find(f => f.toLowerCase() === 'index.htm' || f.toLowerCase() === 'index.html');
            if (indexFile) {
                htmlFiles.push({
                    file: path.join(entry.name, indexFile),
                    fullPath: path.join(dirPath, indexFile),
                    dir: entry.name,
                    isPortal: false
                });
            } else {
                logError(`Kataloge ${entry.name} nerastas index.htm failas!`);
            }
        }
    }
    return htmlFiles;
}

// 2. Patikrinti git konfliktų žymes
function checkConflictMarkers(relPath, content) {
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
        if (line.startsWith('<<<<<<< ') || line.startsWith('>>>>>>> ') || line === '=======') {
            logError(`${relPath}:${idx + 1} Rasta Git konflikto žymė: ${line}`);
        }
    });
}

// 3. Patikrinti HTML struktūrą
function checkHtmlStructure(relPath, content) {
    const lower = content.toLowerCase();
    if (!lower.includes('<html') || !lower.includes('</html>')) {
        logError(`${relPath}: Trūksta <html> arba </html> žymės.`);
    }
    if (!lower.includes('<body') || !lower.includes('</body>')) {
        logError(`${relPath}: Trūksta <body> arba </body> žymės.`);
    }

    const scriptOpenCount = (content.match(/<script\b/gi) || []).length;
    const scriptCloseCount = (content.match(/<\/script>/gi) || []).length;
    if (scriptOpenCount !== scriptCloseCount) {
        logError(`${relPath}: Nesutampa <script> (${scriptOpenCount}) ir </script> (${scriptCloseCount}) kiekis.`);
    }

    const styleOpenCount = (content.match(/<style\b/gi) || []).length;
    const styleCloseCount = (content.match(/<\/style>/gi) || []).length;
    if (styleOpenCount !== styleCloseCount) {
        logError(`${relPath}: Nesutampa <style> (${styleOpenCount}) ir </style> (${styleCloseCount}) kiekis.`);
    }
}

// 4. Patikrinti vietines nuorodas (<link href="..."> ir <script src="...">)
function checkLocalResources(relPath, fullPath, content) {
    const dir = path.dirname(fullPath);

    // <script src="...">
    const scriptSrcRegex = /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = scriptSrcRegex.exec(content)) !== null) {
        const src = match[1];
        if (!src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('//') && !src.startsWith('data:')) {
            const targetPath = path.resolve(dir, src.split('?')[0]);
            if (!fs.existsSync(targetPath)) {
                logError(`${relPath}: Nerastas skripto resursas "${src}" (ieškota: ${targetPath})`);
            }
        }
    }

    // <link rel="stylesheet" href="...">
    const linkHrefRegex = /<link\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi;
    while ((match = linkHrefRegex.exec(content)) !== null) {
        const href = match[1];
        if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('//') && !href.startsWith('data:')) {
            const targetPath = path.resolve(dir, href.split('?')[0]);
            if (!fs.existsSync(targetPath)) {
                logError(`${relPath}: Nerastas stiliaus resursas "${href}" (ieškota: ${targetPath})`);
            }
        }
    }
}

// 5. Patikrinti JavaScript sintaksę
function checkInlineScripts(relPath, content) {
    const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
    let match;
    let scriptIdx = 0;

    while ((match = scriptRegex.exec(content)) !== null) {
        scriptIdx++;
        const attrs = match[1] || '';
        const code = match[2];

        // Jei tai išorinis skriptas su src="", jo turinys tuščias
        if (/\bsrc\s*=/i.test(attrs)) continue;
        if (!code || !code.trim()) continue;

        // Nustatome eilutės numerį faile
        const lineOffset = content.substring(0, match.index).split('\n').length;

        // Jei tai Babel/JSX skriptas
        if (/type\s*=\s*["']text\/babel["']/i.test(attrs)) {
            checkBabelBrackets(relPath, code, lineOffset);
            continue;
        }

        // Įprastas JavaScript per vm.Script
        try {
            new vm.Script(code, {
                filename: `${relPath} (skriptas #${scriptIdx}, eil. ~${lineOffset})`,
                displayErrors: true
            });
        } catch (err) {
            logError(`${relPath}: JS sintaksės klaida skripte #${scriptIdx} (ties eil. ~${lineOffset}): ${err.message}`);
        }
    }
}

// 6. Patikrinti skliaustų balansą Babel/JSX skriptuose
function checkBabelBrackets(relPath, code, startLine) {
    const stack = [];
    let inString = null;
    let inComment = false;
    let inBlockComment = false;

    for (let i = 0; i < code.length; i++) {
        const ch = code[i];
        const next = code[i + 1];

        if (inComment) {
            if (ch === '\n') inComment = false;
            continue;
        }
        if (inBlockComment) {
            if (ch === '*' && next === '/') {
                inBlockComment = false;
                i++;
            }
            continue;
        }

        if (inString) {
            if (ch === '\\') { i++; continue; }
            if (ch === inString) inString = null;
            continue;
        }

        if (ch === '/' && next === '/') { inComment = true; i++; continue; }
        if (ch === '/' && next === '*') { inBlockComment = true; i++; continue; }

        if (ch === '"' || ch === "'" || ch === '`') {
            inString = ch;
            continue;
        }

        if (ch === '{' || ch === '(' || ch === '[') {
            stack.push({ ch, pos: i });
        } else if (ch === '}' || ch === ')' || ch === ']') {
            if (stack.length === 0) {
                const line = startLine + code.substring(0, i).split('\n').length - 1;
                logError(`${relPath}:${line} Perteklinis uždarantis skliaustas '${ch}'`);
                return;
            }
            const last = stack.pop();
            const pairs = { '}': '{', ')': '(', ']': '[' };
            if (last.ch !== pairs[ch]) {
                const line = startLine + code.substring(0, i).split('\n').length - 1;
                logError(`${relPath}:${line} Nesutampantis skliaustas: atidarytas '${last.ch}', uždarytas '${ch}'`);
                return;
            }
        }
    }

    if (stack.length > 0) {
        const last = stack[stack.length - 1];
        const line = startLine + code.substring(0, last.pos).split('\n').length - 1;
        logError(`${relPath}:${line} Neuždarytas skliaustas '${last.ch}'`);
    }
}

// 7. Patikrinti portalo (index.html) žaidimų sąrašą
function checkPortalMapping(gameFiles) {
    const portal = gameFiles.find(g => g.isPortal);
    if (!portal) return;

    const portalContent = fs.readFileSync(portal.fullPath, 'utf8');
    const diskGameFiles = gameFiles.filter(g => !g.isPortal);

    // Kiekvienas žaidimas diske turi būti paminėtas index.html
    for (const game of diskGameFiles) {
        const needle = game.file;
        if (!portalContent.includes(needle)) {
            logWarn(`Žaidimas "${game.file}" diske nėra tiesiogiai įtrauktas į index.html sąrašą!`);
        }
    }

    // Kiekvienas showGame(...) iškvietimas index.html turi rodyti į egzistuojantį failą
    const showGameRegex = /showGame\(['"]([^'"]+)['"]/g;
    let match;
    while ((match = showGameRegex.exec(portalContent)) !== null) {
        const target = match[1];
        const exists = diskGameFiles.some(g => g.file.toLowerCase() === target.toLowerCase());
        if (!exists) {
            logError(`index.html nuoroda showGame('${target}') nerasta tarp disko žaidimų failų!`);
        }
    }
}

// 8. Patikrinti standalone JS failus (shared/common.js)
function checkStandaloneScripts() {
    const commonJsPath = path.join(ROOT_DIR, 'shared', 'common.js');
    if (fs.existsSync(commonJsPath)) {
        try {
            const code = fs.readFileSync(commonJsPath, 'utf8');
            new vm.Script(code, { filename: 'shared/common.js', displayErrors: true });
            logSuccess('shared/common.js sintaksė teisinga.');
        } catch (err) {
            logError(`shared/common.js sintaksės klaida: ${err.message}`);
        }
    } else {
        logError('Nerastas privalomas failas shared/common.js!');
    }
}

// === PAGRINDINIS VYKDYMAS ===
function run() {
    console.log(`\n${COLORS.bold}${COLORS.cyan}=== VAIKŲ ŽAIDIMAI — REPOZITORIJOS PATIKRA ===${COLORS.reset}\n`);

    checkStandaloneScripts();

    const allGameFiles = getGameFiles();
    const args = process.argv.slice(2).filter(a => !a.startsWith('-'));

    let filesToCheck;
    if (args.length > 0) {
        filesToCheck = [];
        for (const arg of args) {
            const resolved = path.resolve(ROOT_DIR, arg);
            const found = allGameFiles.find(g => path.resolve(ROOT_DIR, g.file) === resolved || g.fullPath === resolved);
            if (found) {
                filesToCheck.push(found);
            } else if (fs.existsSync(resolved)) {
                filesToCheck.push({
                    file: path.relative(ROOT_DIR, resolved),
                    fullPath: resolved,
                    isPortal: path.basename(resolved).toLowerCase() === 'index.html'
                });
            } else {
                logError(`Nurodytas failas nerastas: ${arg}`);
            }
        }
        console.log(`Tikrinami nurodyti failai: ${COLORS.bold}${filesToCheck.length}${COLORS.reset}.\n`);
    } else {
        filesToCheck = allGameFiles;
        console.log(`Rasta HTML failų: ${COLORS.bold}${filesToCheck.length}${COLORS.reset} (1 portalas + ${filesToCheck.length - 1} žaidimai).\n`);
    }

    for (const g of filesToCheck) {
        try {
            const content = fs.readFileSync(g.fullPath, 'utf8');
            checkConflictMarkers(g.file, content);
            checkHtmlStructure(g.file, content);
            checkLocalResources(g.file, g.fullPath, content);
            checkInlineScripts(g.file, content);
        } catch (err) {
            logError(`Nepavyko nuskaityti ${g.file}: ${err.message}`);
        }
    }

    if (args.length === 0 || filesToCheck.some(f => f.isPortal)) {
        checkPortalMapping(allGameFiles);
    }

    console.log('\n----------------------------------------');
    if (errorsCount === 0) {
        console.log(`${COLORS.green}${COLORS.bold}✓ PATIKRA SĖKMINGA! Klaidų nerasta.${COLORS.reset}`);
        if (warningsCount > 0) {
            console.log(`${COLORS.yellow}Pastebėta įspėjimų: ${warningsCount}${COLORS.reset}`);
        }
        console.log('Galima saugiai atlikti commit.\n');
        process.exit(0);
    } else {
        console.error(`${COLORS.red}${COLORS.bold}✗ PATIKRA NEPAVYKO! Rasta klaidų: ${errorsCount}.${COLORS.reset}`);
        if (warningsCount > 0) {
            console.error(`${COLORS.yellow}Įspėjimų: ${warningsCount}${COLORS.reset}`);
        }
        console.error('Prieš darant commit, būtina ištaisyti nurodytas klaidas!\n');
        process.exit(1);
    }
}

run();
