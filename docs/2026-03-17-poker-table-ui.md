# Poker Table UI Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the stacked-screen layout with a persistent oval poker table game board, keeping the existing purple/violet theme and all game logic intact.

**Architecture:** A reusable `renderTable(options)` JS function generates the oval table + player seats for 5 screens (lobby, round-start, card-selection, judging, scoreboard). Each screen injects different center content and below-table controls. Server gets one small addition: `avatar` field on player objects.

**Tech Stack:** Vanilla JS, CSS3, Express + Socket.io (server unchanged except avatar assignment)

**Spec:** `docs/superpowers/specs/2026-03-17-poker-table-ui-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `server.js` | Modify (lines 230-236, 246, 404) | Add `ANIMAL_AVATARS` array, assign avatar on create/join |
| `public/index.html` | Modify | Restructure lobby, round-start, card-selection, judging, scoreboard screens with table containers |
| `public/style.css` | Modify (major) | Add poker table, seat, fan-hand, card-back, and animation styles |
| `public/game.js` | Modify (major) | Add `renderTable()`, update all 5 table-screen render functions, add avatar handling |

No new files created. All changes are to existing files.

---

## Task 1: Server — Add Avatar System

**Files:**
- Modify: `server.js` (lines 230-236 for constants, line 246 for createRoom, line 404 for join-room)

- [ ] **Step 1: Add ANIMAL_AVATARS constant**

After `AVATAR_COLORS` (line 230), add:

```javascript
const ANIMAL_AVATARS = ['🐱','🐻','🦊','🐸','🐼','🐨','🦁','🐯'];
```

- [ ] **Step 2: Add avatar picker helper**

After `ANIMAL_AVATARS`, add:

```javascript
function pickAvatar(room) {
  const used = room.players.map(p => p.avatar);
  const available = ANIMAL_AVATARS.filter(a => !used.includes(a));
  if (available.length === 0) return ANIMAL_AVATARS[Math.floor(Math.random() * ANIMAL_AVATARS.length)];
  return available[Math.floor(Math.random() * available.length)];
}
```

- [ ] **Step 3: Assign avatar on room creation**

In `createRoom()` (line 246), change the player object from:
```javascript
const player = { id: hostSocket.id, name, color: AVATAR_COLORS[0], score: 0 };
```
to:
```javascript
const player = { id: hostSocket.id, name, color: AVATAR_COLORS[0], score: 0, avatar: null };
```
Then right after creating the room object (after line 253), before `hostSocket.join(code)`, add:
```javascript
player.avatar = pickAvatar(rooms[code]);
```

Wait — the player is already in the room's players array at that point. Simpler approach: just pick from ANIMAL_AVATARS directly since it's the first player:

```javascript
const player = { id: hostSocket.id, name, color: AVATAR_COLORS[0], score: 0, avatar: ANIMAL_AVATARS[Math.floor(Math.random() * ANIMAL_AVATARS.length)] };
```

- [ ] **Step 4: Assign avatar on join**

In the `join-room` handler (near line 404), change:
```javascript
const player = { id: socket.id, name, color, score: 0 };
```
to:
```javascript
const avatar = pickAvatar(room);
const player = { id: socket.id, name, color, score: 0, avatar };
```

- [ ] **Step 5: Test manually**

Run: `node server.js`
Open browser, create room, check console/network to verify player objects include `avatar` field.

- [ ] **Step 6: Commit**

```bash
git add server.js
git commit -m "feat: add animal avatar assignment to player objects"
```

---

## Task 2: HTML — Restructure Table Screens

**Files:**
- Modify: `public/index.html`

The key change: each table screen gets a `.poker-table-wrapper` div containing the `.poker-table` oval and `.table-seat` slots. Screen-specific content goes inside `.table-center-content` and below the table wrapper.

- [ ] **Step 1: Replace lobby screen HTML**

Replace the entire `<!-- ═══ LOBBY ═══ -->` section (lines 56-78) with:

```html
<!-- ═══ LOBBY ═══ -->
<div id="screen-lobby" class="screen">
  <div class="table-screen-container">
    <div class="poker-table-wrapper">
      <div class="poker-table">
        <div class="table-center-content" id="lobby-center">
          <p class="label">ROOM CODE</p>
          <div class="room-code" id="lobby-code"></div>
          <p class="hint">Share this code with friends</p>
        </div>
      </div>
      <div class="table-seats" id="lobby-seats"></div>
    </div>

    <div class="below-table">
      <div id="lobby-host-controls" class="hidden">
        <div class="rounds-picker">
          <label class="label">ROUNDS</label>
          <div class="stepper">
            <button class="stepper-btn" id="rounds-minus">-</button>
            <span id="rounds-value" class="stepper-value">4</span>
            <button class="stepper-btn" id="rounds-plus">+</button>
          </div>
        </div>
        <button id="btn-start" class="btn btn-primary btn-large">Start Game</button>
        <p class="hint" style="margin-top: 8px">You can play solo or with up to 4 players</p>
      </div>
      <p id="lobby-waiting" class="hint">Waiting for host to start...</p>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Replace round-start screen HTML**

Replace the entire `<!-- ═══ ROUND START ═══ -->` section (lines 80-100) with:

```html
<!-- ═══ ROUND START ═══ -->
<div id="screen-round-start" class="screen">
  <div class="table-screen-container">
    <p class="label" id="round-label">ROUND 1 OF 4</p>
    <div class="poker-table-wrapper">
      <div class="poker-table">
        <div class="table-center-content" id="round-start-center">
          <div class="product-card-reveal" id="product-reveal">
            <div class="product-card-inner">
              <div class="product-card-back"></div>
              <div class="product-card-front">
                <div class="product-img-wrap" id="product-img-wrap">
                  <img id="product-img" class="product-img" alt="">
                  <div class="product-icon" id="product-icon"></div>
                </div>
                <h2 class="product-name" id="product-name"></h2>
                <p class="product-desc" id="product-desc"></p>
                <span class="product-category" id="product-category"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="table-seats" id="round-start-seats"></div>
    </div>
    <p class="judge-label" id="judge-label"></p>
  </div>
</div>
```

- [ ] **Step 3: Replace card-selection screen HTML**

Replace the entire `<!-- ═══ CARD SELECTION ═══ -->` section (lines 102-123) with:

```html
<!-- ═══ CARD SELECTION ═══ -->
<div id="screen-card-selection" class="screen">
  <div class="table-screen-container selection-layout">
    <div class="poker-table-wrapper table-compact">
      <div class="poker-table">
        <div class="table-center-content" id="selection-center">
          <div class="product-mini" id="mini-product"></div>
          <div class="timer-ring" id="timer-selection">
            <svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="36" class="timer-bg"/><circle cx="40" cy="40" r="36" class="timer-fg" id="timer-fg-selection"/></svg>
            <span class="timer-text" id="timer-text-selection">30</span>
          </div>
        </div>
      </div>
      <div class="table-seats" id="selection-seats"></div>
    </div>

    <div class="below-table">
      <p class="instruction" id="selection-instruction">Tap <strong>3 cards</strong> to define your render's vibe</p>
      <p class="selection-count">Selected: <span id="selected-count">0</span>/3</p>
      <div class="hand" id="player-hand"></div>
      <button id="btn-lock-cards" class="btn btn-primary btn-large" disabled>Lock In Cards</button>
    </div>
  </div>
</div>
```

- [ ] **Step 4: Replace judging screen HTML**

Replace the entire `<!-- ═══ JUDGING ═══ -->` section (lines 165-173) with:

```html
<!-- ═══ JUDGING ═══ -->
<div id="screen-judging" class="screen">
  <div class="table-screen-container">
    <div class="poker-table-wrapper">
      <div class="poker-table">
        <div class="table-center-content" id="judging-center">
          <h2 class="section-title" id="judging-title">Pick Your Favorite</h2>
        </div>
      </div>
      <div class="table-seats" id="judging-seats"></div>
    </div>
    <div class="below-table">
      <p class="hint" id="judging-hint">Click a submission to crown the winner</p>
      <div class="submissions-grid" id="submissions-grid"></div>
      <button id="btn-pick-winner" class="btn btn-primary btn-large hidden">Crown the Winner</button>
    </div>
  </div>
</div>
```

- [ ] **Step 5: Replace scoreboard screen HTML**

Replace the entire `<!-- ═══ SCOREBOARD ═══ -->` section (lines 175-185) with:

```html
<!-- ═══ SCOREBOARD ═══ -->
<div id="screen-scoreboard" class="screen">
  <div class="table-screen-container">
    <div class="winner-announce" id="winner-announce">
      <p class="label">ROUND WINNER</p>
      <h2 class="winner-name" id="winner-name"></h2>
    </div>
    <div class="poker-table-wrapper">
      <div class="poker-table">
        <div class="table-center-content" id="scoreboard-center"></div>
      </div>
      <div class="table-seats" id="scoreboard-seats"></div>
    </div>
    <div class="below-table">
      <button id="btn-next-round" class="btn btn-primary btn-large hidden">Next Round</button>
    </div>
  </div>
</div>
```

- [ ] **Step 6: Verify no broken IDs**

Check that all element IDs used in game.js still exist: `lobby-code`, `lobby-host-controls`, `lobby-waiting`, `rounds-minus`, `rounds-plus`, `rounds-value`, `btn-start`, `round-label`, `product-reveal`, `product-img-wrap`, `product-img`, `product-icon`, `product-name`, `product-desc`, `product-category`, `judge-label`, `mini-product`, `timer-fg-selection`, `timer-text-selection`, `selection-instruction`, `selected-count`, `player-hand`, `btn-lock-cards`, `judging-title`, `judging-hint`, `submissions-grid`, `btn-pick-winner`, `winner-name`, `btn-next-round`.

- [ ] **Step 7: Commit**

```bash
git add public/index.html
git commit -m "feat: restructure HTML screens with poker table containers"
```

---

## Task 3: CSS — Poker Table and Seat Styles

**Files:**
- Modify: `public/style.css`

- [ ] **Step 1: Add table screen container styles**

After the `.screen.active` rule (~line 91), add:

```css
/* ── Poker Table Layout ───────────────────────────────────────────────── */

.table-screen-container {
  width: 100%; max-width: 900px;
  display: flex; flex-direction: column; align-items: center; gap: 24px;
}

.poker-table-wrapper {
  position: relative;
  width: 100%; max-width: 700px;
  margin: 0 auto;
}

.poker-table {
  width: 100%; height: 320px;
  background: linear-gradient(145deg, #1e1b2e, #16141f);
  border: 3px solid rgba(139,92,246,0.25);
  border-radius: 50%;
  box-shadow: 0 0 80px rgba(139,92,246,0.12), inset 0 2px 30px rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  position: relative;
  overflow: visible;
}

.table-center-content {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  text-align: center;
  padding: 20px;
  max-width: 300px;
}

.table-compact .poker-table {
  height: 200px;
}
.table-compact .table-center-content {
  gap: 8px;
  padding: 12px;
}

.below-table {
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  width: 100%; max-width: 800px;
}
```

- [ ] **Step 2: Add seat positioning styles**

Immediately after the table styles, add:

```css
/* ── Table Seats ──────────────────────────────────────────────────────── */

.table-seats {
  position: absolute; inset: 0;
  pointer-events: none;
}

.table-seat {
  position: absolute;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  pointer-events: auto;
  animation: seatAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
}

@keyframes seatAppear {
  from { transform: scale(0.5); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.seat-bottom { bottom: -28px; left: 50%; transform: translateX(-50%); }
.seat-top { top: -28px; left: 50%; transform: translateX(-50%); }
.seat-left { top: 50%; left: -20px; transform: translateY(-50%); }
.seat-right { top: 50%; right: -20px; transform: translateY(-50%); }

.seat-avatar {
  width: 48px; height: 48px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px;
  border: 3px solid var(--bg);
  position: relative;
}

.seat-crown {
  position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
  font-size: 16px;
}

.seat-name {
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.seat-info {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--text-dim);
}

.seat-badge {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  padding: 1px 6px;
  border-radius: var(--radius-xs);
  background: var(--primary-dim);
  color: white;
}

.seat-check {
  color: var(--success);
  font-size: 14px;
  font-weight: 700;
}

.seat-disconnected {
  opacity: 0.35;
}

.seat-winner .seat-avatar {
  box-shadow: 0 0 20px rgba(251,191,36,0.5);
  animation: winnerPulse 1.5s ease-in-out infinite;
}

@keyframes winnerPulse {
  0%, 100% { box-shadow: 0 0 20px rgba(251,191,36,0.3); }
  50% { box-shadow: 0 0 40px rgba(251,191,36,0.6); }
}
```

- [ ] **Step 3: Add card back and product card flip styles**

```css
/* ── Card Backs & Flip ────────────────────────────────────────────────── */

.product-card-reveal {
  perspective: 800px;
  width: 200px; height: 280px;
}

.product-card-inner {
  width: 100%; height: 100%;
  position: relative;
  transform-style: preserve-3d;
  animation: cardFlipReveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes cardFlipReveal {
  0% { transform: rotateY(180deg); }
  100% { transform: rotateY(0deg); }
}

.product-card-front, .product-card-back {
  position: absolute; inset: 0;
  backface-visibility: hidden;
  border-radius: var(--radius);
}

.product-card-front {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 12px;
  padding: 24px;
  background: linear-gradient(145deg, var(--surface-2), var(--surface));
  border: 1px solid var(--border-bright);
  box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 60px var(--primary-glow);
}

.product-card-back {
  transform: rotateY(180deg);
  background: var(--surface);
  border: 1px solid rgba(139,92,246,0.2);
  background-image:
    repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(139,92,246,0.06) 10px, rgba(139,92,246,0.06) 11px),
    repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(139,92,246,0.06) 10px, rgba(139,92,246,0.06) 11px);
}
```

- [ ] **Step 4: Add fan hand styles**

Replace the existing `.hand` grid styles (line ~548-554) with:

```css
/* Cards in hand — fan layout */
.hand {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  position: relative;
  padding: 20px 0 0;
  min-height: 200px;
}

.hand .prompt-card {
  position: relative;
  width: 140px; min-width: 140px;
  margin-left: -50px;
  transform-origin: bottom center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
  animation: dealCardFan 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
}
.hand .prompt-card:first-child { margin-left: 0; }

.hand .prompt-card:hover:not(.locked) {
  transform: translateY(-16px) rotate(0deg) scale(1.08) !important;
  z-index: 10;
  box-shadow: 0 12px 32px rgba(0,0,0,0.5);
}

.hand .prompt-card.selected {
  transform: translateY(-10px) !important;
  z-index: 5;
}

@keyframes dealCardFan {
  from { transform: translateY(100px) rotate(0deg); opacity: 0; }
}
```

- [ ] **Step 5: Add room code table style**

The room code inside the table needs to be slightly smaller:

```css
/* Room code inside table */
.poker-table .room-code {
  font-size: 2.8rem;
  margin: 8px 0 0;
}
```

- [ ] **Step 6: Update responsive styles**

Replace the existing `@media (max-width: 600px)` block (line ~887) with:

```css
@media (max-width: 600px) {
  .poker-table { height: 180px; }
  .table-compact .poker-table { height: 140px; }
  .poker-table .room-code { font-size: 2rem; }
  .seat-avatar { width: 36px; height: 36px; font-size: 18px; }
  .seat-name { font-size: 0.65rem; }
  .seat-bottom { bottom: -22px; }
  .seat-top { top: -22px; }
  .seat-left { left: -14px; }
  .seat-right { right: -14px; }

  .hand .prompt-card {
    width: 120px; min-width: 120px;
    margin-left: -40px;
  }
  .hand .prompt-card .card-desc { display: none; }

  .product-card-reveal { width: 160px; height: 220px; }
  .product-card-front { padding: 16px; gap: 8px; }
  .product-name { font-size: 1.3rem; }

  .room-code { font-size: 2.5rem; }
  .title { font-size: 3rem; }
}
```

- [ ] **Step 7: Commit**

```bash
git add public/style.css
git commit -m "feat: add poker table, seat, fan-hand, and card-back CSS"
```

---

## Task 4: JavaScript — renderTable() and Avatar Handling

**Files:**
- Modify: `public/game.js`

- [ ] **Step 1: Add avatar constants to game.js**

After the existing `CATEGORY_LABELS` block (~line 18), add:

```javascript
const SEAT_POSITIONS = ['bottom', 'top', 'left', 'right'];

function getSeatLayout(players, myId) {
  // "You" always sit at bottom. Others fill top, left, right.
  const me = players.find(p => p.id === myId);
  const others = players.filter(p => p.id !== myId);
  const seats = [];
  if (me) seats.push({ ...me, position: 'bottom' });
  const otherPositions = ['top', 'left', 'right'];
  others.forEach((p, i) => {
    if (i < otherPositions.length) seats.push({ ...p, position: otherPositions[i] });
  });
  return seats;
}
```

- [ ] **Step 2: Add renderTable() function**

After `getSeatLayout`, add:

```javascript
function renderTable(containerId, options = {}) {
  const { players = [], myId = null, judgeId = null, winnerId = null, showScore = false, showCheck = null } = options;
  const seats = getSeatLayout(players, myId);
  const container = $(`#${containerId}`);
  if (!container) return;

  container.innerHTML = seats.map((p, i) => {
    const isJudge = p.id === judgeId;
    const isWinner = p.id === winnerId;
    const isChecked = showCheck && showCheck.has(p.id);
    const classes = [
      'table-seat',
      `seat-${p.position}`,
      isWinner ? 'seat-winner' : '',
    ].filter(Boolean).join(' ');

    return `
      <div class="${classes}" style="animation-delay: ${i * 0.1}s">
        <div class="seat-avatar" style="background: linear-gradient(135deg, ${p.color}, ${p.color}dd); box-shadow: 0 0 12px ${p.color}44;">
          ${p.avatar || p.name[0].toUpperCase()}
          ${isJudge ? '<span class="seat-crown">👑</span>' : ''}
        </div>
        <span class="seat-name" style="color: ${p.color}">${esc(p.name)}</span>
        ${p.id === myId ? '<span class="seat-info">You</span>' : ''}
        ${isChecked ? '<span class="seat-check">✓</span>' : ''}
        ${showScore ? `<span class="seat-info">${p.score} pt${p.score !== 1 ? 's' : ''}</span>` : ''}
        ${options.showHost && p.id === options.hostId ? '<span class="seat-badge">HOST</span>' : ''}
      </div>
    `;
  }).join('');
}
```

- [ ] **Step 3: Update renderLobby() to use table**

Replace the entire `renderLobby()` function with:

```javascript
function renderLobby() {
  $('#lobby-code').textContent = state.roomCode;

  renderTable('lobby-seats', {
    players: state.players, myId: state.myId,
    showHost: true, hostId: state.hostId,
  });

  const hostControls = $('#lobby-host-controls');
  const waiting = $('#lobby-waiting');
  if (state.isHost) {
    hostControls.classList.remove('hidden');
    waiting.classList.add('hidden');
  } else {
    hostControls.classList.add('hidden');
    waiting.classList.remove('hidden');
  }
}
```

- [ ] **Step 4: Update showRoundStart() to use table**

In `showRoundStart()`, after the existing state setup and product image logic, replace the card inner animation reset and `showScreen('round-start')` section. Add a call to `renderTable` before showing the screen:

After the line `$('#product-category').textContent = data.product.category;` and before `showScreen('round-start')`, add:

```javascript
renderTable('round-start-seats', {
  players: state.players, myId: state.myId,
  judgeId: state.judgeId,
});
```

- [ ] **Step 5: Update showCardSelection() to use table**

At the start of `showCardSelection()`, after the judge check, add the table render:

```javascript
renderTable('selection-seats', {
  players: state.players, myId: state.myId,
  judgeId: state.judgeId,
});
```

Also add fan rotation to the card rendering. Replace the hand innerHTML generation with:

```javascript
const hand = $('#player-hand');
const cardCount = state.hand.length;
const fanStep = 3; // degrees between cards
hand.innerHTML = state.hand.map((card, i) => {
  const centerIndex = (cardCount - 1) / 2;
  const rotation = (i - centerIndex) * fanStep;
  return `
    <div class="prompt-card" data-id="${card.id}" data-category="${card.category}"
         style="--fan-rotation: ${rotation}deg; transform: rotate(${rotation}deg); animation-delay: ${i * 0.06}s; z-index: ${i};">
      <div class="card-category-tag">${CATEGORY_ICONS[card.category] || ''} ${CATEGORY_LABELS[card.category] || card.category}</div>
      <div class="card-name">${esc(card.name)}</div>
      <div class="card-desc">${esc(card.desc)}</div>
    </div>
  `;
}).join('');
```

- [ ] **Step 6: Wire up player-selected to update seat checkmarks**

Replace the no-op `socket.on('player-selected', () => {});` with:

```javascript
socket.on('player-selected', (data) => {
  selectedPlayers.add(data.playerId);
  // Re-render selection seats if on that screen
  if ($('#screen-card-selection').classList.contains('active')) {
    renderTable('selection-seats', {
      players: state.players, myId: state.myId,
      judgeId: state.judgeId, showCheck: selectedPlayers,
    });
  }
});
```

And add a `selectedPlayers` set near `submittedPlayers`:

```javascript
const selectedPlayers = new Set();
```

In `showRoundStart()`, add `selectedPlayers.clear();` alongside `submittedPlayers.clear();`.

- [ ] **Step 7: Update showJudging() to use table**

In `showJudging()`, after setting up state, add:

```javascript
renderTable('judging-seats', {
  players: state.players, myId: state.myId,
  judgeId: data.judgeId,
});
```

- [ ] **Step 8: Update showScoreboard() to use table**

Replace the scoreboard rendering. Instead of the scores list, use the table with scores shown at seats:

```javascript
function showScoreboard(data) {
  state.players = data.scores.map(s => ({
    ...state.players.find(p => p.id === s.id),
    ...s,
  }));

  if (data.soloMode) {
    $('#winner-name').textContent = 'Nice render!';
  } else {
    $('#winner-name').textContent = data.winnerName;
  }

  renderTable('scoreboard-seats', {
    players: state.players, myId: state.myId,
    winnerId: data.winnerId, showScore: true,
  });

  const btn = $('#btn-next-round');
  if (state.isHost) {
    btn.classList.remove('hidden');
    btn.textContent = data.round >= data.totalRounds ? 'See Final Results' : 'Next Round →';
  } else {
    btn.classList.add('hidden');
  }

  showScreen('scoreboard');
}
```

Remove the old `$('#scores-list')` rendering since that element no longer exists.

- [ ] **Step 9: Commit**

```bash
git add public/game.js
git commit -m "feat: add renderTable(), avatar handling, fan-hand layout"
```

---

## Task 5: Polish — Animations, Cleanup, and Testing

**Files:**
- Modify: `public/game.js`, `public/style.css`

- [ ] **Step 1: Remove old unused CSS**

Remove or comment out these CSS rules that are replaced by the table layout:
- `.lobby-container` styles (the old stacked lobby)
- `.round-start-container` styles
- `.selection-container`, `.selection-header` (replaced by table layout)
- `.judging-container` (replaced by table layout)
- `.scoreboard-container`, `.scores-list`, `.score-row` (replaced by table seats with scores)
- `.player-row`, `.player-avatar`, `.player-name`, `.player-badge` (replaced by seat styles)
- The old `.product-card-reveal` sizing (280x400 → now 200x280 to fit inside table)
- The old `@keyframes cardReveal` (replaced by `cardFlipReveal`)

Keep: `.players-list` is no longer used (was lobby), can remove.

- [ ] **Step 2: Ensure rendering screen still works**

The rendering screen (no table) uses elements that may share old class names. Verify:
- `#render-product` (product-mini) still styled correctly
- `#timer-rendering` still works
- `#render-my-cards` still shows locked prompt cards
- Upload zone still functions
- Judge waiting view still shows

- [ ] **Step 3: End-to-end test — solo mode**

1. Open browser, enter name, create room
2. Start game (1 round)
3. Verify: Lobby shows table with single seat (you) at bottom, room code in center
4. Verify: Round start shows table with your seat, product card flips in center
5. Verify: Card selection shows compact table at top, cards fanned below
6. Pick 3 cards, lock in
7. Verify: Rendering screen is full-width (no table), upload zone works
8. Submit a test image
9. Verify: Scoreboard shows table with your seat glowing, "Nice render!"
10. Verify: Game Over screen unchanged

- [ ] **Step 4: End-to-end test — multiplayer (2 tabs)**

1. Tab 1: create room, note code
2. Tab 2: join room with code
3. Verify: Both tabs show table with 2 seats (bottom = you, top = other)
4. Start game
5. Verify: Round start shows judge crown on the correct seat
6. Card selection: verify seat checkmarks appear when other player locks in
7. Both submit renders
8. Verify: Judging screen shows table + submissions below
9. Judge picks winner
10. Verify: Scoreboard shows winner glow on correct seat

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete poker table UI redesign"
```

- [ ] **Step 6: Push to GitHub**

```bash
git push
```
