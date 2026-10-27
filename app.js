/* Rechen-Fuchs – oberfläche */
(function () {
  'use strict';
  const L = window.RechenLogic;
  const KEY = 'rechenfuchs-v1';
  const ROUND = 10;

  const $ = (id) => document.getElementById(id);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // ---------- speicher ----------
  const defaults = () => ({ ability: 2.5, history: [], stars: 0, rounds: 0 });
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && typeof s.ability === 'number') return Object.assign(defaults(), s);
    } catch (e) { /* ohne speicher läuft die app trotzdem */ }
    return defaults();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignorieren */ }
  }
  let state = load();

  // ---------- rundenzustand ----------
  let round, task, tries, usedHelp, input, locked, helpSteps, helpIdx, lastText = '';

  function show(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
  }
  const starText = () => `⭐ ${state.stars}`;
  function refreshStars() { $('stars').textContent = starText(); $('homeStars').textContent = starText(); }

  // ---------- zahlenfeld ----------
  function buildPad() {
    const pad = $('pad');
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'];
    keys.forEach((k) => {
      const b = document.createElement('button');
      b.textContent = k;
      b.dataset.k = k;
      if (k === '⌫') b.className = 'back';
      if (k === '✓') b.className = 'go';
      pad.appendChild(b);
    });
    pad.addEventListener('click', (e) => {
      const k = e.target.closest('button')?.dataset.k;
      if (k) press(k);
    });
    document.addEventListener('keydown', (e) => {
      if (!$('game').classList.contains('active') || !$('sheet').hidden) return;
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('⌫');
      else if (e.key === 'Enter') press('✓');
    });
  }

  function press(k) {
    if (locked) return;
    if (k === '⌫') input = input.slice(0, -1);
    else if (k === '✓') { submit(); return; }
    else if (input.length < 3) input += k;
    renderAnswer();
  }
  function renderAnswer() {
    const a = $('answer');
    a.textContent = input;
    a.classList.remove('ok', 'shake');
  }

  // ---------- runde ----------
  function startRound() {
    round = { i: 0, correct: 0, marks: [] };
    $('dots').innerHTML = '<i></i>'.repeat(ROUND);
    refreshStars();
    show('game');
    nextTask();
  }

  function renderDots() {
    [...$('dots').children].forEach((d, i) => {
      d.className = i < round.marks.length ? (round.marks[i] ? 'ok' : 'miss') : i === round.i ? 'now' : '';
    });
  }

  function nextTask() {
    if (round.i >= ROUND) return finishRound();
    task = L.makeTask(state.ability, lastText);
    lastText = task.text;
    tries = 0; usedHelp = false; input = ''; locked = false;
    const t = $('task');
    t.textContent = task.text;
    t.className = 'task' + (task.text.length > 26 ? ' xlong' : task.text.length > 12 ? ' long' : '');
    setFox('🦊');
    $('msg').textContent = '';
    renderAnswer();
    renderDots();
  }

  function setFox(e, hop) {
    const f = $('fox');
    f.textContent = e;
    f.classList.remove('hop');
    if (hop) { void f.offsetWidth; f.classList.add('hop'); }
  }

  function submit() {
    if (input === '') return;
    const guess = parseInt(input, 10);
    if (guess === task.answer) return onCorrect();
    tries++;
    if (tries === 1) {
      $('answer').classList.add('shake');
      $('msg').textContent = 'Fast! Versuch es noch einmal 💪';
      setFox('🤔', true);
      input = '';
      setTimeout(() => { if (!locked) renderAnswer(); }, 450);
    } else {
      onGiveUp();
    }
  }

  function onCorrect() {
    locked = true;
    const first = tries === 0;
    $('answer').classList.add('ok');
    $('msg').textContent = pick(['Super!', 'Toll gemacht!', 'Richtig!', 'Prima!', 'Klasse!', 'Spitze!', 'Genau!']) + ' 🎉';
    setFox('🤩', true);
    confetti();
    state.stars += 1;
    L.update(state, first, usedHelp);
    save();
    refreshStars();
    round.marks.push(first);
    if (first) round.correct++;
    renderDots();
    setTimeout(() => { round.i++; nextTask(); }, 1100);
  }

  function onGiveUp() {
    locked = true;
    $('msg').textContent = `Die Lösung ist ${task.answer}. Schau mal, wie es geht!`;
    setFox('🤗');
    L.update(state, false, true);
    save();
    round.marks.push(false);
    renderDots();
    openHelp(() => { round.i++; nextTask(); });
  }

  function finishRound() {
    state.rounds++;
    save();
    const c = round.correct;
    $('resultFox').textContent = c >= 9 ? '🏆' : c >= 7 ? '🎉' : '🦊';
    $('resultTitle').textContent = c >= 9 ? 'Mega gut!' : c >= 7 ? 'Super gemacht!' : 'Prima geübt!';
    $('resultStars').textContent = '⭐'.repeat(c) + '☆'.repeat(ROUND - c);
    $('resultText').textContent = `${c} von ${ROUND} gleich richtig!`;
    const q = L.quote(state);
    $('resultInfo').textContent = `Rechenstufe ${Math.floor(state.ability) + 1}` +
      (q == null ? '' : ` · Trefferquote ${Math.round(q * 100)} %`);
    confetti();
    show('result');
  }

  // ---------- hilfe ----------
  let afterHelp = null;

  function openHelp(done) {
    if (!task) return;
    if (!done) usedHelp = true;
    afterHelp = done || null;
    helpSteps = L.helpSteps(task);
    helpIdx = 0;
    $('steps').innerHTML = '';
    $('sheet').hidden = false;
    renderHelp();
  }

  function renderHelp() {
    const s = helpSteps[helpIdx];
    $('viz').innerHTML = vizFor(s);
    const box = $('steps');
    if (s.type !== 'start') {
      const div = document.createElement('div');
      div.className = `line ${s.type === 'op' ? s.op : 'rep'}`;
      div.innerHTML = `<small>${s.label}</small><b>${s.text}</b>${s.hint ? `<em>👉 ${s.hint}</em>` : ''}`;
      box.appendChild(div);
    } else {
      const div = document.createElement('div');
      div.className = 'line';
      div.innerHTML = `<small>${s.label}</small>`;
      box.appendChild(div);
    }
    const last = helpIdx === helpSteps.length - 1;
    $('nextStep').textContent = last ? 'Verstanden ✓' : 'Weiter ▶';
  }

  function closeHelp() {
    $('sheet').hidden = true;
    const cb = afterHelp;
    afterHelp = null;
    if (cb) cb();
  }

  const cubes = (n, cls = '') => `<div class="cube ${cls}"></div>`.repeat(n);
  const rods = (n, cls = '') => `<div class="rod ${cls}"></div>`.repeat(n);
  const plates = (n, cls = '') => `<div class="plate ${cls}">100</div>`.repeat(n);
  const zone = (html, cls = '') => (html ? `<div class="zone ${cls}">${html}</div>` : '');

  function vizFor(s) {
    if (s.type === 'start') {
      const p = L.pieces(s.n);
      return zone(plates(p.h)) + zone(rods(p.t)) + zone(cubes(p.o), 'ones');
    }
    if (s.type === 'rep') return repViz(s);

    if (s.op === 'add') {
      const p = L.pieces(s.from);
      const q = L.pieces(s.amount);
      return zone(plates(p.h) + plates(q.h, 'new')) +
        zone(rods(p.t) + rods(q.t, 'new')) +
        zone(cubes(p.o) + cubes(q.o, 'new'), 'ones');
    }
    // subtraktion: zehner/hunderter bei bedarf aufbrechen
    let { h, t, o } = L.pieces(s.from);
    const tg = Math.floor(s.amount / 10);
    const og = s.amount % 10;
    if (tg > t) { h--; t += 10; }
    if (og > o) {
      if (t === 0) { h--; t += 10; }
      t--; o += 10;
    }
    return zone(plates(h)) +
      zone(rods(t - tg) + rods(tg, 'gone')) +
      zone(cubes(o - og) + cubes(og, 'gone'), 'ones');
  }

  function repViz(s) {
    const showSums = s.stage >= 2;
    let out = '';
    for (let i = 1; i <= s.count; i++) {
      out += `<div class="gwrap"><div class="group">${cubes(s.n)}</div><span>${showSums ? i * s.n : ''}</span></div>`;
    }
    return out;
  }

  // ---------- konfetti ----------
  function confetti() {
    const box = $('confetti');
    const set = ['⭐', '🎉', '✨', '🌟', '🎈'];
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('span');
      s.textContent = pick(set);
      s.style.left = Math.random() * 92 + '%';
      s.style.animationDelay = Math.random() * 0.4 + 's';
      box.appendChild(s);
      setTimeout(() => s.remove(), 2200);
    }
  }

  // ---------- start ----------
  buildPad();
  refreshStars();
  $('startBtn').onclick = startRound;
  $('againBtn').onclick = startRound;
  $('homeBtn').onclick = () => { refreshStars(); show('home'); };
  $('helpBtn').onclick = () => { if (!locked) openHelp(); };
  $('nextStep').onclick = () => {
    if (helpIdx < helpSteps.length - 1) { helpIdx++; renderHelp(); } else closeHelp();
  };
  $('resetBtn').onclick = () => {
    if (confirm('Wirklich ganz von vorne anfangen? Sterne und Rechenstufe werden zurückgesetzt.')) {
      state = defaults();
      save();
      refreshStars();
    }
  };

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
