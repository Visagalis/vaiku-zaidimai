/**
 * Vaikų Žaidimai — Pinigų ir valiutos biblioteka (shared/money.js)
 *
 * Šiame faile aprašyti eurų monetų ir banknotų duomenys, centų sumavimas,
 * pinigų sumų formatavimas ir realaus laiko užuominų skaičiavimas:
 * 1. `MONEY` objektas: `centCoins`, `euroCoins`, `bills`, `allCoins`, `allMoney`.
 * 2. `formatMoneyCents(cents)`: formatai '10 c', '1 €', '1,50 €'.
 * 3. `formatMoneyDiffHint(currentCents, targetCents)`: realaus laiko užuominos.
 * 4. `sumCoins(items)`: saugi centų suma.
 */
(function (global) {
    'use strict';

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

    MONEY.allCoins = MONEY.centCoins.concat(MONEY.euroCoins);
    MONEY.allMoney = MONEY.allCoins.concat(MONEY.bills);

    MONEY.c1 = MONEY.centCoins[0];
    MONEY.c2 = MONEY.centCoins[1];
    MONEY.c5 = MONEY.centCoins[2];
    MONEY.c10 = MONEY.centCoins[3];
    MONEY.c20 = MONEY.centCoins[4];
    MONEY.c50 = MONEY.centCoins[5];
    MONEY.e1 = MONEY.euroCoins[0];
    MONEY.e2 = MONEY.euroCoins[1];
    MONEY.e5 = MONEY.bills[0];
    MONEY.e10 = MONEY.bills[1];
    MONEY.e20 = MONEY.bills[2];

    function formatMoneyCents(cents) {
        if (typeof cents !== 'number' || isNaN(cents)) return '0 c';
        if (cents < 100) return cents + ' c';
        if (cents % 100 === 0) return (cents / 100) + ' €';
        return (cents / 100).toFixed(2).replace('.', ',') + ' €';
    }

    function formatMoneyDiffHint(currentCents, targetCents) {
        var cur = typeof currentCents === 'number' ? currentCents : 0;
        var tar = typeof targetCents === 'number' ? targetCents : 0;
        var diff = tar - cur;
        var colFn = (typeof global._col === 'function') ? global._col : function (t) { return t; };

        var status = 'exact';
        var text = '';
        if (diff > 0) {
            status = 'missing';
            text = colFn('Dar trūksta:') + ' ' + formatMoneyCents(diff);
        } else if (diff === 0) {
            status = 'exact';
            text = colFn('Jau pakanka!') + ' ✔️';
        } else {
            status = 'excess';
            text = colFn('Per daug:') + ' +' + formatMoneyCents(Math.abs(diff));
        }

        return {
            status: status,
            diff: diff,
            text: text,
            html: '<span class="hint-box py-1 px-2.5 text-xs sm:text-sm">💡 ' + text + '</span>'
        };
    }

    function sumCoins(items) {
        if (!items || !items.length) return 0;
        var sum = 0;
        for (var i = 0; i < items.length; i++) {
            if (items[i] && typeof items[i].cents === 'number') {
                sum += items[i].cents;
            }
        }
        return sum;
    }

    function renderCoinButton(coin, onClickAttr, extraClass) {
        if (!coin) return '';
        var cls = coin.class + (extraClass ? ' ' + extraClass : '');
        var action = onClickAttr ? ' onclick="' + onClickAttr + '"' : '';
        return '<button type="button"' + action + ' class="' + cls + '">' + coin.label + '</button>';
    }

    function renderBillButton(bill, onClickAttr, extraClass) {
        if (!bill) return '';
        var cls = bill.class + (extraClass ? ' ' + extraClass : '');
        var action = onClickAttr ? ' onclick="' + onClickAttr + '"' : '';
        return '<button type="button"' + action + ' class="' + cls + '">' + bill.label + '</button>';
    }

    global.MONEY = MONEY;
    global.formatMoneyCents = formatMoneyCents;
    global.formatMoneyDiffHint = formatMoneyDiffHint;
    global.sumCoins = sumCoins;
    global.renderCoinButton = renderCoinButton;
    global.renderBillButton = renderBillButton;
})(typeof window !== 'undefined' ? window : this);
