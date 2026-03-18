/* ══════════════════════════════════════════════════════════════════════════════
   RENDER ROYALE — Client
   ══════════════════════════════════════════════════════════════════════════════ */

const socket = io();

const CATEGORY_ICONS = {
  automotive:'\u{1F3CE}\uFE0F', electronics:'\u{1F4F1}', fashion:'\u{1F45F}',
  furniture:'\u{1FA91}', sports:'\u{1F3C0}', kitchen:'\u2615',
  tools:'\u{1F527}', gaming:'\u{1F3AE}', musical:'\u{1F3B8}', wild:'\u2728',
  lighting:'\u{1F4A1}', style:'\u{1F3A8}', material:'\u{1F48E}',
  camera:'\u{1F4F7}', palette:'\u{1F308}', environment:'\u{1F30D}', mood:'\u{1F319}',
};

const CATEGORY_LABELS = {
  lighting:'Lighting', style:'Style', material:'Material',
  camera:'Camera', palette:'Color', environment:'Scene', mood:'Mood',
};

// ── Product Image Helper ────────────────────────────────────────────────────

function productImgUrl(photoId, w = 400, h = 300) {
  if (!photoId) return null;
  return `https://images.unsplash.com/${photoId}?w=${w}&h=${h}&fit=crop&auto=format&q=80`;
}

// ── State ────────────────────────────────────────────────────────────────────

let state = {
  myId: null, roomCode: null, hostId: null, isHost: false,
  players: [], hand: [], selected: [], product: null,
  judgeId: null, isJudge: false, soloMode: false,
  round: 0, totalRounds: 0,
  uploadedImage: null, pickedSubmission: null, judgingData: null,
};

let rounds = 4;

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// ── Screen Management ────────────────────────────────────────────────────────

function showScreen(id) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  const el = $(`#screen-${id}`);
  if (el) {
    el.classList.add('active');
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = '';
  }
}

// ── Toast ────────────────────────────────────────────────────────────────────

function showToast(msg, type = 'error') {
  const toast = $('#error-toast');
  toast.textContent = msg;
  toast.className = `toast ${type}`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.className = 'toast hidden', 3500);
}

// ── Poker Table — Seat Layout ────────────────────────────────────────────────

const SEAT_POSITIONS = ['seat-bottom', 'seat-top', 'seat-left', 'seat-right'];

function getSeatLayout(players, myId) {
  // "You" always sits at the bottom, others fill top/left/right
  const me = players.find(p => p.id === myId);
  const others = players.filter(p => p.id !== myId);
  const seats = [];

  if (me) seats.push({ ...me, position: SEAT_POSITIONS[0] }); // bottom
  others.forEach((p, i) => {
    seats.push({ ...p, position: SEAT_POSITIONS[i + 1] || SEAT_POSITIONS[1] });
  });

  return seats;
}

function renderTable(containerId, opts = {}) {
  const {
    players = state.players,
    myId = state.myId,
    hostId = null,
    judgeId = null,
    winnerId = null,
    showScore = false,
    selectedIds = null,  // Set of player IDs who locked cards
  } = opts;

  const container = $(`#${containerId}`);
  if (!container) return;

  const seats = getSeatLayout(players, myId);

  container.innerHTML = seats.map((p, i) => {
    const isMe = p.id === myId;
    const isHost = p.id === hostId;
    const isJudge = p.id === judgeId;
    const isWinner = p.id === winnerId;
    const hasSelected = selectedIds && selectedIds.has(p.id);

    let badges = '';
    if (isMe) badges += '<span class="seat-badge">You</span> ';
    if (isHost) badges += '<span class="seat-badge" style="background:var(--cat-lighting)">Host</span> ';
    if (isJudge) badges += '<span class="seat-badge" style="background:var(--cat-palette)">Judge</span> ';

    let info = '';
    if (showScore) info = `<span class="seat-info">${p.score || 0} pt${(p.score || 0) !== 1 ? 's' : ''}</span>`;
    if (hasSelected) info += '<span class="seat-check">\u2713</span>';

    const avatar = p.avatar || '\u{1F3AE}';

    return `
      <div class="table-seat ${p.position} ${isWinner ? 'seat-winner' : ''}" style="animation-delay: ${i * 0.1}s">
        <div class="seat-avatar" style="background: linear-gradient(135deg, ${p.color}40, ${p.color}20)">
          ${isWinner ? '<span class="seat-crown">\u{1F451}</span>' : ''}
          ${avatar}
        </div>
        <span class="seat-name">${esc(p.name)}</span>
        ${badges}
        ${info}
      </div>
    `;
  }).join('');
}

// ── HOME ─────────────────────────────────────────────────────────────────────

const nameInput = $('#player-name');
const btnCreate = $('#btn-create');
const btnJoinToggle = $('#btn-join-toggle');
const joinSection = $('#join-section');
const codeInput = $('#room-code-input');
const btnJoin = $('#btn-join');

nameInput.addEventListener('input', () => {
  const valid = nameInput.value.trim().length >= 1;
  btnCreate.disabled = !valid;
  btnJoinToggle.disabled = !valid;
});

btnCreate.addEventListener('click', () => {
  const name = nameInput.value.trim();
  if (!name) return;
  socket.emit('create-room', { name });
});

btnJoinToggle.addEventListener('click', () => {
  joinSection.classList.toggle('hidden');
  if (!joinSection.classList.contains('hidden')) codeInput.focus();
});

codeInput.addEventListener('input', () => {
  codeInput.value = codeInput.value.toUpperCase().replace(/[^A-Z]/g, '');
});

btnJoin.addEventListener('click', () => {
  const name = nameInput.value.trim();
  const code = codeInput.value.trim();
  if (!name || code.length !== 4) return;
  socket.emit('join-room', { code, name });
});

nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !btnCreate.disabled) btnCreate.click();
});
codeInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') btnJoin.click();
});

// ── LOBBY ────────────────────────────────────────────────────────────────────

function renderLobby() {
  $('#lobby-code').textContent = state.roomCode;

  renderTable('lobby-seats', {
    hostId: state.hostId,
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

$('#rounds-minus').addEventListener('click', () => {
  rounds = Math.max(1, rounds - 1);
  $('#rounds-value').textContent = rounds;
});
$('#rounds-plus').addEventListener('click', () => {
  rounds = Math.min(10, rounds + 1);
  $('#rounds-value').textContent = rounds;
});

$('#btn-start').addEventListener('click', () => {
  socket.emit('start-game', { rounds });
});

// ── ROUND START ──────────────────────────────────────────────────────────────

const selectedPlayers = new Set();

function showRoundStart(data) {
  state.round = data.round;
  state.totalRounds = data.totalRounds;
  state.product = data.product;
  state.judgeId = data.judgeId;
  state.isJudge = data.judgeId === state.myId;
  state.soloMode = data.soloMode || false;
  state.hand = data.hand || [];
  state.selected = [];
  state.uploadedImage = null;
  state.pickedSubmission = null;
  selectedPlayers.clear();

  $('#round-label').textContent = `ROUND ${data.round} OF ${data.totalRounds}`;

  renderTable('round-start-seats', {
    judgeId: data.judgeId,
  });

  if (state.soloMode) {
    $('#judge-label').innerHTML = 'You\u2019re playing solo \u2014 pick your cards and render!';
  } else {
    const judgeName = state.players.find(p => p.id === data.judgeId)?.name || '???';
    if (state.isJudge) {
      $('#judge-label').innerHTML = 'You are the <strong>Judge</strong> this round \u2014 sit back and watch!';
    } else {
      $('#judge-label').innerHTML = `<strong>${esc(judgeName)}</strong> is judging. You\u2019re creating!`;
    }
  }

  const icon = CATEGORY_ICONS[data.product.category] || '\u{1F4E6}';
  const imgUrl = productImgUrl(data.product.img);
  const imgEl = $('#product-img');
  const iconEl = $('#product-icon');
  const wrapEl = $('#product-img-wrap');

  if (imgUrl) {
    imgEl.src = imgUrl;
    imgEl.alt = data.product.name;
    imgEl.classList.remove('hidden');
    iconEl.classList.add('hidden');
    wrapEl.classList.add('has-img');
    imgEl.onerror = () => {
      imgEl.classList.add('hidden');
      iconEl.classList.remove('hidden');
      wrapEl.classList.remove('has-img');
      iconEl.textContent = icon;
    };
  } else {
    imgEl.classList.add('hidden');
    iconEl.classList.remove('hidden');
    wrapEl.classList.remove('has-img');
    iconEl.textContent = icon;
  }

  $('#product-name').textContent = data.product.name;
  $('#product-desc').textContent = data.product.desc;
  $('#product-category').textContent = data.product.category;

  const inner = document.querySelector('.product-card-inner');
  inner.style.animation = 'none';
  inner.offsetHeight;
  inner.style.animation = '';

  showScreen('round-start');
}

// ── CARD SELECTION ───────────────────────────────────────────────────────────

function showCardSelection() {
  if (state.isJudge && !state.soloMode) {
    showRenderScreen();
    return;
  }

  renderTable('selection-seats', {
    judgeId: state.judgeId,
    selectedIds: selectedPlayers,
  });

  const miniImg = productImgUrl(state.product.img, 64, 64);
  const miniIcon = CATEGORY_ICONS[state.product.category] || '\u{1F4E6}';
  $('#mini-product').innerHTML = miniImg
    ? `<img class="product-mini-img" src="${miniImg}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'product-mini-icon',textContent:'${miniIcon}'}))"> ${esc(state.product.name)}`
    : `<span class="product-mini-icon">${miniIcon}</span> ${esc(state.product.name)}`;

  state.selected = [];
  $('#selected-count').textContent = '0';
  $('#btn-lock-cards').disabled = true;
  $('#btn-lock-cards').textContent = 'Lock In Cards';
  $('#selection-instruction').innerHTML = 'Tap <strong>3 cards</strong> to define your render\u2019s vibe';

  const hand = $('#player-hand');
  const cardCount = state.hand.length;
  const maxFanAngle = 20; // degrees total fan spread
  const angleStep = cardCount > 1 ? maxFanAngle / (cardCount - 1) : 0;
  const startAngle = -maxFanAngle / 2;

  hand.innerHTML = state.hand.map((card, i) => {
    const rotation = cardCount > 1 ? startAngle + (angleStep * i) : 0;
    return `
      <div class="prompt-card" data-id="${card.id}" data-category="${card.category}"
           style="--fan-rotation: ${rotation}deg; transform: rotate(${rotation}deg); animation-delay: ${i * 0.06}s">
        <div class="card-category-tag">${CATEGORY_ICONS[card.category] || ''} ${CATEGORY_LABELS[card.category] || card.category}</div>
        <div class="card-name">${esc(card.name)}</div>
        <div class="card-desc">${esc(card.desc)}</div>
      </div>
    `;
  }).join('');

  hand.querySelectorAll('.prompt-card').forEach(el => {
    el.addEventListener('click', () => {
      if (el.classList.contains('locked')) return;
      const id = el.dataset.id;
      if (el.classList.contains('selected')) {
        el.classList.remove('selected');
        state.selected = state.selected.filter(s => s !== id);
      } else {
        if (state.selected.length >= 3) {
          showToast('You can only pick 3 cards! Deselect one first.', 'info');
          return;
        }
        el.classList.add('selected');
        state.selected.push(id);
      }
      $('#selected-count').textContent = state.selected.length;
      $('#btn-lock-cards').disabled = state.selected.length !== 3;

      // Update instruction text dynamically
      const remaining = 3 - state.selected.length;
      const instr = $('#selection-instruction');
      if (instr) {
        if (remaining === 0) {
          instr.innerHTML = 'Looking good! Hit <strong>Lock In</strong> when ready';
        } else {
          instr.innerHTML = `Pick <strong>${remaining} more card${remaining > 1 ? 's' : ''}</strong> to define your render`;
        }
      }
    });
  });

  showScreen('card-selection');
}

$('#btn-lock-cards').addEventListener('click', () => {
  if (state.selected.length !== 3) return;
  socket.emit('select-cards', { cardIds: state.selected });
  $('#player-hand').querySelectorAll('.prompt-card').forEach(el => {
    el.classList.add('locked');
  });
  $('#btn-lock-cards').disabled = true;
  $('#btn-lock-cards').textContent = 'Locked In \u2713';
  showToast(state.soloMode ? 'Cards locked! Time to render!' : 'Cards locked! Waiting for others...', 'success');
});

// ── RENDERING ────────────────────────────────────────────────────────────────

function showRenderScreen() {
  const rMiniImg = productImgUrl(state.product.img, 64, 64);
  const rMiniIcon = CATEGORY_ICONS[state.product.category] || '\u{1F4E6}';
  $('#render-product').innerHTML = rMiniImg
    ? `<img class="product-mini-img" src="${rMiniImg}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'product-mini-icon',textContent:'${rMiniIcon}'}))"> ${esc(state.product.name)}`
    : `<span class="product-mini-icon">${rMiniIcon}</span> ${esc(state.product.name)}`;

  if (state.isJudge && !state.soloMode) {
    $('#render-upload-zone').classList.add('hidden');
    $('#btn-submit-render').classList.add('hidden');
    $('#render-my-cards').classList.add('hidden');
    $('#render-status').classList.add('hidden');
    $('#render-instructions').classList.add('hidden');
    $('#judge-waiting').classList.remove('hidden');
    showScreen('rendering');
    return;
  }

  $('#judge-waiting').classList.add('hidden');
  $('#render-upload-zone').classList.remove('hidden');
  $('#btn-submit-render').classList.remove('hidden');
  $('#render-my-cards').classList.remove('hidden');
  $('#render-status').classList.remove('hidden');
  $('#render-instructions').classList.remove('hidden');
  $('#btn-submit-render').disabled = true;
  $('#btn-submit-render').textContent = 'Submit Render';

  state.uploadedImage = null;
  $('#upload-preview').classList.add('hidden');
  $('#upload-preview').src = '';
  $('#upload-content').classList.remove('hidden');

  showScreen('rendering');
}

function showMySelectedCards(selections) {
  if (state.isJudge && !state.soloMode) return;
  const myCards = selections[state.myId] || [];
  const container = $('#render-my-cards');
  container.innerHTML = '<p class="label" style="margin-bottom:8px">YOUR PROMPT CARDS</p>' +
    myCards.map(card => `
      <div class="prompt-card mini-prompt" data-category="${card.category}">
        <div class="card-category-tag">${CATEGORY_ICONS[card.category] || ''} ${CATEGORY_LABELS[card.category] || card.category}</div>
        <div class="card-name">${esc(card.name)}</div>
      </div>
    `).join('');
}

// Upload zone
const uploadZone = $('#render-upload-zone');
const fileInput = $('#file-input');

uploadZone.addEventListener('click', (e) => {
  if (e.target.closest('#upload-preview')) {
    fileInput.click();
    return;
  }
  fileInput.click();
});

uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('dragover');
});
uploadZone.addEventListener('dragleave', () => {
  uploadZone.classList.remove('dragover');
});
uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) handleImageFile(file);
});

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (file) handleImageFile(file);
});

document.addEventListener('paste', (e) => {
  if (!$('#screen-rendering').classList.contains('active')) return;
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      handleImageFile(item.getAsFile());
      break;
    }
  }
});

function handleImageFile(file) {
  if (file.size > 5 * 1024 * 1024) {
    showToast('Image too large (max 5MB)');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    state.uploadedImage = e.target.result;
    $('#upload-preview').src = e.target.result;
    $('#upload-preview').classList.remove('hidden');
    $('#upload-content').classList.add('hidden');
    $('#btn-submit-render').disabled = false;
    showToast('Render loaded! Hit Submit when ready.', 'success');
  };
  reader.readAsDataURL(file);
}

$('#btn-submit-render').addEventListener('click', () => {
  if (!state.uploadedImage) return;
  socket.emit('submit-render', { image: state.uploadedImage });
  $('#btn-submit-render').disabled = true;
  $('#btn-submit-render').textContent = 'Submitted \u2713';
});

// ── JUDGING ──────────────────────────────────────────────────────────────────

function showJudging(data) {
  state.judgingData = data;
  state.pickedSubmission = null;

  renderTable('judging-seats', {
    judgeId: data.judgeId,
  });

  if (state.isJudge) {
    $('#judging-title').textContent = 'Pick Your Favorite';
    $('#judging-hint').textContent = 'Click a submission to crown the winner';
    $('#btn-pick-winner').classList.remove('hidden');
    $('#btn-pick-winner').disabled = true;
    $('#btn-pick-winner').textContent = 'Crown the Winner';
  } else {
    $('#judging-title').textContent = 'Judging Time';
    const judgeName = state.players.find(p => p.id === data.judgeId)?.name || 'The Judge';
    $('#judging-hint').textContent = `${judgeName} is choosing a winner...`;
    $('#btn-pick-winner').classList.add('hidden');
  }

  const grid = $('#submissions-grid');
  grid.innerHTML = data.submissions.map((sub, i) => {
    const imgHtml = sub.image
      ? `<div class="submission-image"><img src="${sub.image}" alt="Submission ${i+1}"></div>`
      : `<div class="submission-image"><span class="no-render">No render uploaded</span></div>`;

    const cardsHtml = (sub.cards || []).map(c =>
      `<span class="mini-tag" data-category="${c.category}">${esc(c.name)}</span>`
    ).join('');

    return `
      <div class="submission-card ${state.isJudge ? '' : 'not-judge'}" data-index="${sub.index}" style="animation-delay: ${i * 0.15}s">
        ${imgHtml}
        <div class="submission-cards">${cardsHtml}</div>
        <div class="submission-label">Submission ${String.fromCharCode(65 + i)}</div>
      </div>
    `;
  }).join('');

  if (state.isJudge) {
    grid.querySelectorAll('.submission-card').forEach(el => {
      el.addEventListener('click', () => {
        grid.querySelectorAll('.submission-card').forEach(c => c.classList.remove('picked'));
        el.classList.add('picked');
        state.pickedSubmission = parseInt(el.dataset.index);
        $('#btn-pick-winner').disabled = false;
      });
    });
  }

  showScreen('judging');
}

$('#btn-pick-winner').addEventListener('click', () => {
  if (state.pickedSubmission === null) return;
  socket.emit('judge-pick', { index: state.pickedSubmission });
  $('#btn-pick-winner').disabled = true;
  $('#btn-pick-winner').textContent = 'Picking...';
});

// ── SCOREBOARD ───────────────────────────────────────────────────────────────

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
    winnerId: data.winnerId,
    showScore: true,
  });

  // Show scoreboard in table center
  const center = $('#scoreboard-center');
  const sorted = [...data.scores].sort((a, b) => b.score - a.score);
  center.innerHTML = `
    <p class="label">SCORES</p>
    ${sorted.map((p, i) => `
      <div style="display:flex;align-items:center;gap:10px;font-size:0.9rem;${p.id === data.winnerId ? 'color:#fbbf24;font-weight:700' : ''}">
        <span style="font-family:var(--font-mono);width:20px;text-align:right">${i+1}.</span>
        <span style="flex:1;text-align:left">${esc(p.name)}</span>
        <span style="font-family:var(--font-mono);font-weight:700">${p.score}</span>
      </div>
    `).join('')}
  `;

  const btn = $('#btn-next-round');
  if (state.isHost) {
    btn.classList.remove('hidden');
    btn.textContent = data.round >= data.totalRounds ? 'See Final Results' : 'Next Round \u2192';
  } else {
    btn.classList.add('hidden');
  }

  showScreen('scoreboard');
}

$('#btn-next-round').addEventListener('click', () => {
  socket.emit('next-round');
});

// ── GAME OVER ────────────────────────────────────────────────────────────────

function showGameOver(data) {
  const sorted = [...data.scores].sort((a, b) => b.score - a.score);
  const container = $('#final-scores');
  container.innerHTML = sorted.map((p, i) => {
    const fullPlayer = state.players.find(pl => pl.id === p.id);
    const avatar = fullPlayer?.avatar || '\u{1F3AE}';
    return `
      <div class="final-row ${i === 0 ? 'champion' : ''}" style="animation: fadeIn 0.5s ease-out ${i * 0.1}s backwards">
        <span class="final-rank">${i === 0 ? '\u{1F451}' : `#${i+1}`}</span>
        <div class="seat-avatar" style="background: linear-gradient(135deg, ${p.color}40, ${p.color}20); width:44px; height:44px; font-size:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0">${avatar}</div>
        <span class="final-name">${esc(p.name)}</span>
        <span class="final-score">${p.score} pt${p.score !== 1 ? 's' : ''}</span>
      </div>
    `;
  }).join('');

  if (state.isHost) {
    $('#btn-play-again').classList.remove('hidden');
  } else {
    $('#btn-play-again').classList.add('hidden');
  }

  showScreen('game-over');
}

$('#btn-play-again').addEventListener('click', () => {
  socket.emit('play-again');
});

// ── Timer Updates ────────────────────────────────────────────────────────────

function updateTimer(data) {
  const circumference = 2 * Math.PI * 36;
  const fraction = data.remaining / data.total;
  const offset = circumference * (1 - fraction);

  let fgEl, textEl;
  if (data.phase === 'card-selection') {
    fgEl = $('#timer-fg-selection');
    textEl = $('#timer-text-selection');
    if (textEl) textEl.textContent = data.remaining;
  } else if (data.phase === 'rendering') {
    fgEl = $('#timer-fg-rendering');
    textEl = $('#timer-text-rendering');
    if (textEl) {
      const mins = Math.floor(data.remaining / 60);
      const secs = data.remaining % 60;
      textEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  }

  if (fgEl) {
    fgEl.style.strokeDashoffset = offset;
    fgEl.classList.remove('warning', 'danger');
    if (fraction < 0.15) fgEl.classList.add('danger');
    else if (fraction < 0.35) fgEl.classList.add('warning');
  }
}

// ── Render Status Pips ───────────────────────────────────────────────────────

function updateRenderStatus(submittedIds) {
  const nonJudge = state.players.filter(p => p.id !== state.judgeId);
  const html = nonJudge.map(p => `
    <div class="status-pip">
      <div class="status-dot ${submittedIds.has(p.id) ? 'done' : ''}"></div>
      ${esc(p.name)}
    </div>
  `).join('');
  $('#render-status').innerHTML = html;
  const judgeStatus = $('#judge-render-status');
  if (judgeStatus) judgeStatus.innerHTML = html;
}

const submittedPlayers = new Set();

// ── Socket Events ────────────────────────────────────────────────────────────

socket.on('room-created', (data) => {
  state.myId = data.you;
  state.roomCode = data.code;
  state.players = data.players;
  state.hostId = data.you;
  state.isHost = true;
  renderLobby();
  showScreen('lobby');
});

socket.on('room-joined', (data) => {
  state.myId = data.you;
  state.roomCode = data.code;
  state.players = data.players;
  state.hostId = data.hostId;
  state.isHost = data.hostId === data.you;
  renderLobby();
  showScreen('lobby');
});

socket.on('player-joined', (data) => {
  state.players = data.players;
  renderLobby();
  showToast(`${data.player.name} joined!`, 'success');
});

socket.on('player-left', (data) => {
  state.players = data.players;
  state.hostId = data.hostId;
  state.isHost = data.hostId === state.myId;
  renderLobby();
});

socket.on('error-msg', (data) => {
  showToast(data.message);
});

socket.on('game-started', (data) => {
  state.totalRounds = data.totalRounds;
});

socket.on('round-started', (data) => {
  state.players = data.players;
  submittedPlayers.clear();
  showRoundStart(data);
});

socket.on('phase-change', (data) => {
  if (data.phase === 'card-selection') {
    showCardSelection();
  } else if (data.phase === 'rendering') {
    showRenderScreen();
  }
});

socket.on('all-selected', (data) => {
  showMySelectedCards(data.selections);
});

socket.on('auto-selected', (data) => {
  state.selected = data.cards.map(c => c.id);
  showToast('Time\u2019s up! Cards auto-selected for you.', 'info');
});

socket.on('player-selected', (data) => {
  if (data.playerId) {
    selectedPlayers.add(data.playerId);
    // Re-render selection seats to show checkmark
    renderTable('selection-seats', {
      judgeId: state.judgeId,
      selectedIds: selectedPlayers,
    });
  }
});

socket.on('player-submitted', (data) => {
  submittedPlayers.add(data.playerId);
  updateRenderStatus(submittedPlayers);
});

socket.on('timer-tick', updateTimer);
socket.on('judging-start', showJudging);
socket.on('round-result', showScoreboard);
socket.on('game-over', showGameOver);

socket.on('back-to-lobby', (data) => {
  state.players = data.players;
  renderLobby();
  showScreen('lobby');
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
