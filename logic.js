/* Rechen-Fuchs – aufgaben- und hilfelogik (ohne oberfläche, damit sie sich testen lässt) */
(function (root) {
  'use strict';

  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

  const MINUS = '−';
  const TIER_MAX = 8;
  const TARGET_QUOTE = 0.95;

  const mk = (op, a, b) => ({
    kind: op,
    a,
    b,
    answer: op === 'add' ? a + b : a - b,
    text: `${a} ${op === 'add' ? '+' : MINUS} ${b}`,
  });

  function find(op, aMin, aMax, bMin, bMax, pred) {
    for (let i = 0; i < 4000; i++) {
      const a = R(aMin, aMax);
      const b = R(bMin, bMax);
      if (op === 'sub' && b >= a) continue;
      const r = op === 'add' ? a + b : a - b;
      if (pred(a, b, r)) return mk(op, a, b);
    }
    return op === 'add' ? mk('add', 12, 5) : mk('sub', 17, 5);
  }

  // stufen 0..8: von "bis 20" bis "über 100 hinaus"
  const TIERS = [
    // 0: bis 20, ohne zehnerübergang
    (op) => op === 'add'
      ? find('add', 1, 15, 1, 9, (a, b, r) => r <= 20 && (a % 10) + b <= 10)
      : find('sub', 11, 20, 1, 9, (a, b) => a % 10 >= b),
    // 1: bis 20, mit zehnerübergang
    (op) => op === 'add'
      ? find('add', 3, 9, 3, 9, (a, b) => a + b > 10)
      : find('sub', 11, 18, 2, 9, (a, b) => a % 10 < b),
    // 2: ZE ± E ohne übergang
    (op) => op === 'add'
      ? find('add', 11, 95, 1, 9, (a, b, r) => r <= 100 && (a % 10) + b <= 10)
      : find('sub', 21, 99, 1, 9, (a, b) => a % 10 >= b),
    // 3: ZE ± E mit übergang
    (op) => op === 'add'
      ? find('add', 15, 95, 2, 9, (a, b, r) => r <= 100 && (a % 10) + b > 10)
      : find('sub', 21, 99, 2, 9, (a, b) => a % 10 < b),
    // 4: ZE ± reine zehner
    (op) => op === 'add'
      ? find('add', 11, 89, 10, 80, (a, b, r) => b % 10 === 0 && r <= 100)
      : find('sub', 20, 99, 10, 80, (a, b) => b % 10 === 0),
    // 5: ZE ± ZE ohne übergang
    (op) => op === 'add'
      ? find('add', 11, 89, 11, 89, (a, b, r) => r <= 100 && b % 10 !== 0 && (a % 10) + (b % 10) <= 10)
      : find('sub', 21, 99, 11, 89, (a, b) => b % 10 !== 0 && a % 10 >= b % 10),
    // 6: ZE ± ZE mit übergang
    (op) => op === 'add'
      ? find('add', 11, 89, 11, 89, (a, b, r) => r <= 100 && (a % 10) + (b % 10) > 10)
      : find('sub', 21, 99, 11, 89, (a, b) => a % 10 < b % 10),
    // 7: ergänzen bis 100 / von 100 abziehen
    (op) => {
      if (op === 'add') {
        const a = R(11, 89);
        return mk('add', a, 100 - a);
      }
      return mk('sub', 100, R(11, 89));
    },
    // 8: über 100 hinaus
    (op) => op === 'add'
      ? find('add', 41, 99, 21, 99, (a, b, r) => r > 100 && r <= 160)
      : find('sub', 101, 160, 11, 99, () => true),
  ];

  const PLURAL = {
    2: 'Zweier', 3: 'Dreier', 4: 'Vierer', 5: 'Fünfer', 6: 'Sechser',
    7: 'Siebener', 8: 'Achter', 9: 'Neuner', 10: 'Zehner',
  };

  // steigerung: gleiche zahlen (bis 10) mehrfach addieren
  function rep(ability) {
    const easy = [2, 5, 10, 3, 4];
    const pool = ability < 8.5 ? easy : [2, 3, 4, 5, 6, 7, 8, 9, 10];
    const maxCount = ability < 7.5 ? 4 : ability < 8.5 ? 5 : ability < 9.5 ? 6 : 8;
    for (let i = 0; i < 100; i++) {
      const n = pick(pool);
      const count = R(3, maxCount);
      if (n * count <= 100) {
        return {
          kind: 'rep', a: n, b: null, n, count,
          answer: n * count,
          text: new Array(count).fill(n).join(' + '),
        };
      }
    }
    return { kind: 'rep', a: 3, b: null, n: 3, count: 3, answer: 9, text: '3 + 3 + 3' };
  }

  function build(ability) {
    const repChance = ability < 6 ? 0 : clamp((ability - 6) * 0.12, 0, 0.45);
    if (Math.random() < repChance) return rep(ability);

    let tier;
    if (ability >= 4 && Math.random() < 0.06) {
      tier = TIER_MAX; // ab und zu schon mal über 100
    } else {
      let d = ability + (Math.random() - 0.5) * 1.2;
      if (Math.random() < 0.15) d -= R(1, 2); // zwischendurch etwas wiederholen
      tier = clamp(Math.floor(d), 0, TIER_MAX);
    }
    return TIERS[tier](Math.random() < 0.5 ? 'add' : 'sub');
  }

  function makeTask(ability, lastText) {
    let t = build(ability);
    for (let i = 0; i < 10 && t.text === lastText; i++) t = build(ability);
    return t;
  }

  // zielt auf ca. 95 % richtige antworten (treppenverfahren mit passenden schrittweiten)
  function update(state, firstTryCorrect, usedHelp) {
    const hist = state.history;
    hist.push(firstTryCorrect ? 1 : 0);
    while (hist.length > 40) hist.shift();
    const recent = hist.slice(-20);
    const quote = recent.reduce((s, x) => s + x, 0) / recent.length;

    if (firstTryCorrect) {
      let up = 0.12;
      if (recent.length >= 10) {
        if (quote >= 0.97) up = 0.25;
        else if (quote < 0.9) up = 0.05;
      }
      if (usedHelp) up *= 0.3;
      state.ability += up;
    } else {
      state.ability -= 1.5;
    }
    state.ability = clamp(state.ability, 0.5, 9.9);
    return quote;
  }

  function quote(state) {
    const recent = state.history.slice(-20);
    if (!recent.length) return null;
    return recent.reduce((s, x) => s + x, 0) / recent.length;
  }

  // ---------- hilfe: halbschriftlich in zehnerschritten ----------

  function pieces(n) {
    return { h: Math.floor(n / 100), t: Math.floor((n % 100) / 10), o: n % 10 };
  }

  function helpSteps(task) {
    if (task.kind === 'rep') return repSteps(task);

    const { kind: op, a, b } = task;
    const sign = op === 'add' ? '+' : MINUS;
    const steps = [{ type: 'start', n: a, label: `Wir legen ${a} hin.`, text: `${a}` }];
    let c = a;

    const push = (label, amount) => {
      const to = op === 'add' ? c + amount : c - amount;
      steps.push({ type: 'op', op, from: c, amount, to, label, text: `${c} ${sign} ${amount} = ${to}` });
      c = to;
    };

    const bt = b - (b % 10);
    const bo = b % 10;
    if (bt > 0) push(op === 'add' ? 'Erst die Zehner dazu:' : 'Erst die Zehner weg:', bt);
    if (bo > 0) {
      const u = c % 10;
      if (op === 'add' && u > 0 && u + bo > 10) {
        push('Erst bis zum nächsten Zehner:', 10 - u);
        push('Dann den Rest:', bo - (10 - u));
      } else if (op === 'sub' && u > 0 && u < bo) {
        push('Erst bis zum vollen Zehner zurück:', u);
        push('Dann den Rest:', bo - u);
      } else {
        push(bt > 0 ? 'Dann die Einer:' : 'Die Einer:', bo);
      }
    }
    return steps;
  }

  function repSteps(task) {
    const { n, count, answer } = task;
    const name = PLURAL[n];
    const run = [];
    for (let i = 1; i <= count; i++) run.push(i * n);
    return [
      { type: 'rep', stage: 1, n, count, label: `Das sind ${count} gleiche Gruppen: ${count} ${name}!`, text: `${count} × ${n}` },
      { type: 'rep', stage: 2, n, count, label: `Zähle in ${name}-Schritten weiter:`, text: run.join(' – ') },
      {
        type: 'rep', stage: 3, n, count,
        label: 'Das geht kürzer als Plus – mit Mal:',
        text: `${count} · ${n} = ${answer}`,
        hint: `${count} mal die ${n}`,
      },
    ];
  }

  root.RechenLogic = { makeTask, update, quote, helpSteps, pieces, PLURAL, TARGET_QUOTE, TIERS, rep };
  if (typeof module !== 'undefined') module.exports = root.RechenLogic;
})(typeof window !== 'undefined' ? window : globalThis);
