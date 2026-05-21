// ══ AUDIO
let audioCtx = null, soundOn = true;

function getCtx() {
    if (!audioCtx) { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

function tone(freq, type, dur, vol = 0.28, delay = 0) {
    if (!soundOn) return;
    try {
        const c = getCtx(), o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = type; o.frequency.setValueAtTime(freq, c.currentTime + delay);
        g.gain.setValueAtTime(0, c.currentTime + delay);
        g.gain.linearRampToValueAtTime(vol, c.currentTime + delay + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + dur);
        o.start(c.currentTime + delay); o.stop(c.currentTime + delay + dur);
    } catch (e) {}
}

function sfxClick()      { tone(600, 'square', .07, .12); }
function sfxError()      { tone(180, 'sawtooth', .18, .2); }
function sfxToast()      { tone(700, 'sine', .1, .15); }
function sfxPlaceX()     { tone(440, 'sine', .13, .22); tone(880, 'square', .05, .06); }
function sfxPlaceO()     { tone(523, 'sine', .25, .2); tone(659, 'sine', .18, .1, .06); }
function sfxWin()        { [523, 659, 784, 1047].forEach((f, i) => tone(f, 'triangle', .28, .28, i * .1)); }
function sfxDraw()       { tone(392, 'sawtooth', .2, .18); tone(330, 'sawtooth', .25, .15, .12); tone(262, 'sawtooth', .35, .12, .26); }
function sfxMatchWin()   { [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 'triangle', .38, .32, i * .08)); }
function sfxGridSelect() { tone(800, 'sine', .08, .22); tone(1200, 'sine', .12, .18, .05); }
function sfxIntro()      { [261, 329, 392, 523].forEach((f, i) => tone(f, 'triangle', .35, .25, i * .09)); }
function sfxGoSound()    { tone(1046, 'sine', .15, .3); tone(784, 'sine', .2, .15, .08); }

function toggleSound() {
    soundOn = !soundOn;
    const b = document.getElementById('sound-btn');
    b.textContent = soundOn ? '🔊 SFX' : '🔇 SFX';
    b.classList.toggle('on', soundOn);
    sfxClick();
}

let users = JSON.parse(localStorage.getItem('ttt_users') || '{"demo":{"pass":"1234","stats":{"wins":0,"losses":0,"high":0}}}');
let currentUser = null, gameMode = 'human', gridSize = 3, matchTarget = 3, gridTargetVal = 3;
let board = [], currentPlayer = 'X', gameActive = false, pageHistory = ['login'];
let stats = { X: { wins: 0, losses: 0, high: 0 }, O: { wins: 0, losses: 0, high: 0 } };
let p1Name = 'PLAYER 1', p2Name = 'PLAYER 2';

function winLen() { return gridSize === 3 ? 3 : gridSize === 5 ? 4 : 5; }

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id + '-page').classList.add('active');
    document.getElementById('back-btn').style.display = id !== 'login' ? 'flex' : 'none';
    if (id === 'grid') {
        const cards = document.querySelectorAll('.grid-card');
        cards.forEach(c => { c.classList.remove('pop-in'); void c.offsetWidth; c.classList.add('pop-in'); });
    }
}

function goBack() { sfxClick(); pageHistory.pop(); showPage(pageHistory[pageHistory.length - 1]); }
function navigate(id) { sfxClick(); pageHistory.push(id); showPage(id); }

// AUTH
function switchTab(t) {
    sfxClick();
    document.getElementById('tab-login').classList.toggle('active', t === 'login');
    document.getElementById('tab-register').classList.toggle('active', t === 'register');
    document.getElementById('login-form').style.display = t === 'login' ? 'block' : 'none';
    document.getElementById('register-form').style.display = t === 'register' ? 'block' : 'none';
    document.getElementById('login-error').textContent = '';
}

function setErr(m) { document.getElementById('login-error').textContent = m; sfxError(); }
function saveUsers() { localStorage.setItem('ttt_users', JSON.stringify(users)); }

function doLogin() {
    const u = document.getElementById('login-user').value.trim(), p = document.getElementById('login-pass').value;
    if (!u || !p) return setErr('Fill in all fields!');
    if (!users[u]) return setErr('User not found. Register first!');
    if (users[u].pass !== p) return setErr('Wrong password!');
    currentUser = u;
    if (!users[u].stats) users[u].stats = { wins: 0, losses: 0, high: 0 };
    document.getElementById('welcome-name').textContent = u.toUpperCase();
    document.getElementById('login-error').textContent = '';
    navigate('mode');
}

function doRegister() {
    const u = document.getElementById('reg-user').value.trim(), p = document.getElementById('reg-pass').value;
    if (!u || !p) return setErr('Fill in all fields!');
    if (p.length < 4) return setErr('Password must be 4+ chars!');
    if (users[u]) return setErr('Username taken!');
    users[u] = { pass: p, stats: { wins: 0, losses: 0, high: 0 } };
    saveUsers();
    switchTab('login');
    document.getElementById('login-user').value = u;
    document.getElementById('login-error').style.color = '#4ade80';
    document.getElementById('login-error').textContent = '✓ Account created! Login now.';
}

// MODE
function selectMode(m) { gameMode = m; navigate('grid'); }

function adjGridTarget(d) {
    sfxClick();
    gridTargetVal = Math.max(1, Math.min(10, gridTargetVal + d));
    document.getElementById('grid-target-num').textContent = gridTargetVal;
}

function adjTarget(d) {
    sfxClick();
    gridTargetVal = Math.max(1, Math.min(10, gridTargetVal + d));
    document.getElementById('tm-num').textContent = gridTargetVal;
    document.getElementById('grid-target-num').textContent = gridTargetVal;
}

function openTargetModal() {
    sfxClick();
    document.getElementById('tm-num').textContent = gridTargetVal;
    document.getElementById('target-modal').classList.add('show');
}

function closeTargetModal() {
    sfxClick();
    matchTarget = gridTargetVal;
    document.getElementById('target-num-badge').textContent = matchTarget;
    document.getElementById('target-modal').classList.remove('show');
    updateBars();
}

// MATCH INTRO
function showMatchIntro() {
    const descs = {
        3: 'Classic quick match — get 3 in a row to win!',
        5: 'Strategic mode — get 4 in a row to win!',
        7: 'Epic battle — get 5 in a row to win!'
    };
    document.getElementById('mi-grid-title').textContent = `${gridSize}×${gridSize}`;
    document.getElementById('mi-grid-title').style.animation = 'none';
    void document.getElementById('mi-grid-title').offsetWidth;
    document.getElementById('mi-grid-title').style.animation = 'miPop .6s cubic-bezier(.34,1.8,.64,1) both';
    document.getElementById('mi-desc').textContent = descs[gridSize] || '';
    document.getElementById('mi-target').textContent = `🏆 FIRST TO ${matchTarget} WINS`;
    document.getElementById('mi-p1').textContent = p1Name;
    document.getElementById('mi-p2').textContent = p2Name;
    document.getElementById('match-intro').classList.add('show');
    sfxIntro();
}

function dismissIntro() {
    sfxGoSound();
    document.getElementById('match-intro').classList.remove('show');
    initGame();
}

/* GRID*/
function selectGrid(size) {
    sfxGridSelect();
    gridSize = size;
    matchTarget = gridTargetVal;
    p1Name = currentUser ? currentUser.toUpperCase() : 'PLAYER 1';
    p2Name = gameMode === 'cpu' ? 'COMPUTER' : 'PLAYER 2';
    stats = { X: { wins: 0, losses: 0, high: 0 }, O: { wins: 0, losses: 0, high: 0 } };
    document.getElementById('mode-badge').textContent = gameMode === 'cpu' ? 'VS COMPUTER' : 'VS HUMAN';
    document.getElementById('grid-badge').textContent = `${gridSize}×${gridSize}`;
    document.getElementById('target-num-badge').textContent = matchTarget;
    ['p1-name', 'p1-name-m'].forEach(id => document.getElementById(id).textContent = p1Name);
    ['p2-name', 'p2-name-m'].forEach(id => document.getElementById(id).textContent = p2Name);
    pageHistory.push('game');
    showPage('game');
    showMatchIntro();
}

// GAME
function initGame() {
    board = Array(gridSize * gridSize).fill(null);
    currentPlayer = 'X';
    gameActive = true;
    renderBoard();
    updateTurn();
    setPanels();
    document.getElementById('overlay').classList.remove('show');
    updateBars();
    if (gameMode === 'cpu' && currentPlayer === 'O') setTimeout(cpuMove, 600);
}

function renderBoard() {
    const el = document.getElementById('board'), cs = cellSize();
    el.style.gridTemplateColumns = `repeat(${gridSize},${cs}px)`;
    el.style.gap = gridSize <= 3 ? '8px' : gridSize <= 5 ? '6px' : '4px';
    el.innerHTML = '';
    board.forEach((v, i) => {
        const c = document.createElement('div');
        c.className = 'cell' + (v ? ' taken' : '');
        c.style.width = cs + 'px';
        c.style.height = cs + 'px';
        c.dataset.index = i;
        if (v) placeSymbol(c, v, cs, true);
        c.addEventListener('click', () => handleClick(i));
        el.appendChild(c);
    });
}

function cellSize() {
    const mw = Math.min(window.innerWidth - 260, 520), mh = window.innerHeight - 220;
    const max = Math.min(mw, mh), gap = gridSize <= 3 ? 8 : gridSize <= 5 ? 6 : 4;
    return Math.max(34, Math.floor((max - gap * (gridSize - 1)) / gridSize));
}

function placeSymbol(cell, val, cs, instant) {
    if (val === 'X') {
        const s = document.createElement('span');
        s.className = 'cell-x' + (instant ? ' show' : '');
        s.style.fontSize = Math.floor(cs * .52) + 'px';
        s.textContent = '✕';
        cell.appendChild(s);
        if (!instant) setTimeout(() => s.classList.add('show'), 10);
    } else {
        const s = document.createElement('div');
        s.className = 'cell-o' + (instant ? ' show' : '');
        const sz = Math.floor(cs * .56);
        const bw = Math.max(4, Math.floor(sz * .14));
        s.style.width = sz + 'px';
        s.style.height = sz + 'px';
        s.style.borderWidth = bw + 'px';
        cell.appendChild(s);
        if (!instant) setTimeout(() => s.classList.add('show'), 10);
    }
}

function handleClick(i) {
    if (!gameActive || board[i]) return;
    if (gameMode === 'cpu' && currentPlayer === 'O') return;
    makeMove(i);
}

function makeMove(i) {
    if (!gameActive || board[i]) return;
    board[i] = currentPlayer;
    const cells = document.querySelectorAll('.cell');
    cells[i].classList.add('taken');
    placeSymbol(cells[i], currentPlayer, cellSize(), false);
    currentPlayer === 'X' ? sfxPlaceX() : sfxPlaceO();

    const res = checkWin();
    if (res) { gameActive = false; setTimeout(() => endGame(res), 450); return; }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateTurn();
    setPanels();
    if (gameMode === 'cpu' && currentPlayer === 'O' && gameActive) setTimeout(cpuMove, 480);
}

function updateTurn() {
    const el = document.getElementById('turn-indicator'), nm = currentPlayer === 'X' ? p1Name : p2Name;
    el.textContent = `${nm}'S TURN`;
    el.className = 'turn-indicator ' + (currentPlayer === 'X' ? 'turn-x' : 'turn-o');
}

function setPanels() {
    const isX = currentPlayer === 'X';
    document.getElementById('p1-panel').classList.toggle('active', isX);
    document.getElementById('p2-panel').classList.toggle('active', !isX);
    document.getElementById('p1-panel-m').classList.toggle('active', isX);
    document.getElementById('p2-panel-m').classList.toggle('active', !isX);
}

function checkWin() {
    const wl = winLen(), N = gridSize;
    for (let r = 0; r < N; r++) for (let c = 0; c <= N - wl; c++) if (chkLine(r, c, 0, 1, wl)) return { w: board[r * N + c], cells: lineIdx(r, c, 0, 1, wl) };
    for (let c = 0; c < N; c++) for (let r = 0; r <= N - wl; r++) if (chkLine(r, c, 1, 0, wl)) return { w: board[r * N + c], cells: lineIdx(r, c, 1, 0, wl) };
    for (let r = 0; r <= N - wl; r++) for (let c = 0; c <= N - wl; c++) if (chkLine(r, c, 1, 1, wl)) return { w: board[r * N + c], cells: lineIdx(r, c, 1, 1, wl) };
    for (let r = 0; r <= N - wl; r++) for (let c = wl - 1; c < N; c++) if (chkLine(r, c, 1, -1, wl)) return { w: board[r * N + c], cells: lineIdx(r, c, 1, -1, wl) };
    if (board.every(v => v)) return { w: null, cells: [] };
    return null;
}

function chkLine(r, c, dr, dc, len) {
    const N = gridSize, f = board[r * N + c];
    if (!f) return false;
    for (let i = 1; i < len; i++) if (board[(r + dr * i) * N + (c + dc * i)] !== f) return false;
    return true;
}

function lineIdx(r, c, dr, dc, len) {
    const N = gridSize;
    return Array.from({ length: len }, (_, i) => (r + dr * i) * N + (c + dc * i));
}

function endGame(res) {
    if (res.w) {
        document.querySelectorAll('.cell').forEach((c, i) => { if (res.cells.includes(i)) c.classList.add('win-cell'); });
        const w = res.w, l = w === 'X' ? 'O' : 'X', wName = w === 'X' ? p1Name : p2Name;
        stats[w].wins++;
        stats[l].losses++;
        stats[w].high = Math.max(stats[w].high, stats[w].wins);
        if (currentUser && w === 'X') {
            users[currentUser].stats.wins++;
            users[currentUser].stats.high = Math.max(users[currentUser].stats.high, stats.X.wins);
            saveUsers();
        }
        updateStatUI(); updateBars(); sfxWin(); confetti();

        const needed = matchTarget - stats[w].wins;
        const toastMsg = needed > 0
            ? `${wName} wins! ${stats[w].wins}/${matchTarget} — needs ${needed} more`
            : `${wName} clinches the match! 🏆`;
        showToast('🏆', toastMsg, w === 'X' ? 'var(--x-color)' : 'var(--o-color)');

        if (stats[w].wins >= matchTarget) { setTimeout(() => endMatch(w, wName), 1200); return; }

        renderPips(w);
        showOverlay('overlay', '🏆', `${wName} WINS THE ROUND!`,
            `${wName} leads ${stats[w].wins}–${stats[l].wins}. First to ${matchTarget} wins the match.`);
    } else {
        document.getElementById('board').style.animation = 'shake .5s ease';
        setTimeout(() => document.getElementById('board').style.animation = '', 500);
        sfxDraw();
        showToast('🤝', "It's a draw! Board is full.", 'var(--text-muted)');
        renderPips(null);
        showOverlay('overlay', '🤝', "IT'S A DRAW!", "The board is completely full — no winner this round.");
    }
}

function endMatch(w, name) {
    sfxMatchWin(); confetti(); confetti();
    document.getElementById('match-emoji').textContent = w === 'X' ? '👑' : '🥇';
    document.getElementById('match-title').textContent = `${name} WINS THE MATCH!`;
    document.getElementById('match-sub').textContent = `${name} reached ${matchTarget} wins first — an absolute champion!`;
    document.getElementById('overlay').classList.remove('show');
    document.getElementById('match-overlay').classList.add('show');
    showToast('👑', `${name} wins the entire match!`, w === 'X' ? 'var(--x-color)' : 'var(--o-color)');
}

function freshMatch() {
    sfxClick();
    stats = { X: { wins: 0, losses: 0, high: 0 }, O: { wins: 0, losses: 0, high: 0 } };
    updateStatUI(); updateBars();
    document.getElementById('match-overlay').classList.remove('show');
    showMatchIntro();
}

function renderPips(w) {
    const c = document.getElementById('prog-pips');
    c.innerHTML = '';
    for (let i = 0; i < matchTarget; i++) {
        const p = document.createElement('div');
        p.className = 'pip';
        if (w && i < stats[w].wins) p.classList.add(w === 'X' ? 'filled-x' : 'filled-o');
        c.appendChild(p);
    }
}

function updateBars() {
    const pct = v => Math.min(100, Math.round((v / matchTarget) * 100)) + '%';
    document.getElementById('p1-progress').style.width = pct(stats.X.wins);
    document.getElementById('p2-progress').style.width = pct(stats.O.wins);
}

function showOverlay(id, emoji, title, sub) {
    document.getElementById('ov-emoji').textContent = emoji;
    document.getElementById('ov-title').textContent = title;
    document.getElementById('ov-sub').textContent = sub;
    document.getElementById(id).classList.add('show');
}

function updateStatUI() {
    ['wins', 'losses', 'high'].forEach(k => {
        document.getElementById(`p1-${k}`).textContent = stats.X[k];
        document.getElementById(`p2-${k}`).textContent = stats.O[k];
        document.getElementById(`p1-${k}-m`).textContent = stats.X[k];
        document.getElementById(`p2-${k}-m`).textContent = stats.O[k];
    });
}

// TOAST
let toastTimer = null;

function showToast(icon, text, color = 'var(--accent)') {
    sfxToast();
    const t = document.getElementById('toast'), bar = document.getElementById('toast-bar');
    document.getElementById('toast-icon').textContent = icon;
    document.getElementById('toast-text').textContent = text;
    bar.style.background = color;
    bar.style.animation = 'none';
    void bar.offsetWidth;
    bar.style.animation = 'tp-shrink 3s linear forwards';
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3300);
}

function resetGame() {
    sfxClick();
    document.getElementById('overlay').classList.remove('show');
    currentPlayer = 'X';
    initGame();
}

function goToMenu() {
    sfxClick();
    ['overlay', 'match-overlay'].forEach(id => document.getElementById(id).classList.remove('show'));
    pageHistory = ['login', 'mode'];
    showPage('mode');
}

/* AI */
function cpuMove() {
    if (!gameActive) return;
    const N = gridSize, wl = winLen();
    let m = bestMove('O', wl);
    if (m === -1) m = bestMove('X', wl);
    if (m === -1) { const c = Math.floor(N / 2) * N + Math.floor(N / 2); if (!board[c]) m = c; }
    if (m === -1) { const cr = [0, N - 1, (N - 1) * N, N * N - 1].filter(i => !board[i]); if (cr.length) m = cr[Math.floor(Math.random() * cr.length)]; }
    if (m === -1) { const fr = board.map((v, i) => v ? -1 : i).filter(i => i !== -1); m = fr[Math.floor(Math.random() * fr.length)]; }
    if (m !== -1) makeMove(m);
}

function bestMove(player, wl) {
    for (let i = 0; i < board.length; i++) {
        if (board[i]) continue;
        board[i] = player;
        const r = checkWin();
        board[i] = null;
        if (r && r.w === player) return i;
    }
    return -1;
}

function confetti() {
    const cols = ['#00d4ff', '#ff006e', '#ffd700', '#7c3aed', '#4ade80', '#ffffff'];
    for (let i = 0; i < 55; i++) {
        const el = document.createElement('div');
        el.className = 'confetti-piece';
        el.style.left = Math.random() * 100 + 'vw';
        el.style.background = cols[Math.floor(Math.random() * cols.length)];
        el.style.width = (Math.random() * 7 + 5) + 'px';
        el.style.height = (Math.random() * 7 + 5) + 'px';
        el.style.borderRadius = Math.random() > .5 ? '50%' : '2px';
        el.style.animationDuration = (Math.random() * 2 + 2) + 's';
        el.style.animationDelay = (Math.random() * .5) + 's';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 4500);
    }
}

window.addEventListener('resize', () => {
    if (!document.getElementById('game-page').classList.contains('active')) return;
    const cs = cellSize();
    renderBoard();
    board.forEach((v, i) => {
        if (v) {
            const cells = document.querySelectorAll('.cell');
            cells[i].classList.add('taken');
            placeSymbol(cells[i], v, cs, true);
        }
    });
});

document.getElementById('login-pass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });