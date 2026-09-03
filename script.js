/* ── WINDOW MANAGER ───────────────────────────────────────── */
let zTop = 10;
const winState = {}; // id → { minimized, maximized, prevRect }

function getWin(id) { return document.getElementById(id); }

function openWindow(id) {
  const w = getWin(id);
  if (!w) return;
  focusWindow(id);
  w.classList.add('open');
  if (!winState[id]) winState[id] = { minimized: false, maximized: false };
  winState[id].minimized = false;
  addTaskbarBtn(id);
  if (id === 'win-congrats') runCongratsProgress();
}

function closeWindow(id) {
  const w = getWin(id);
  if (!w) return;
  w.classList.remove('open', 'maximized');
  if (winState[id]) winState[id] = { minimized: false, maximized: false };
  removeTaskbarBtn(id);
}

function minimizeWindow(id) {
  const w = getWin(id);
  if (!w) return;
  w.classList.remove('open');
  winState[id].minimized = true;
  const btn = document.querySelector(`.taskbar-window-btn[data-id="${id}"]`);
  if (btn) btn.classList.add('minimized');
}

function maximizeWindow(id) {
  const w = getWin(id);
  if (!w) return;
  if (!winState[id]) winState[id] = {};
  if (winState[id].maximized) {
    const r = winState[id].prevRect || {};
    w.style.left   = r.left   || '80px';
    w.style.top    = r.top    || '60px';
    w.style.width  = r.width  || '';
    w.style.height = r.height || '';
    w.classList.remove('maximized');
    winState[id].maximized = false;
  } else {
    winState[id].prevRect = {
      left: w.style.left, top: w.style.top,
      width: w.style.width, height: w.style.height
    };
    w.classList.add('maximized');
    winState[id].maximized = true;
  }
}

function focusWindow(id) {
  zTop++;
  const w = getWin(id);
  if (!w) return;
  w.style.zIndex = zTop;
  document.querySelectorAll('.taskbar-window-btn').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`.taskbar-window-btn[data-id="${id}"]`);
  if (btn) btn.classList.add('active');
}

/* ── TASKBAR BUTTONS ─────────────────────────────────────── */
const titles = {
  'win-ourstory': 'Our Story.txt',
  'win-photos':   'Photos.exe',
  'win-letter':   'Love Letter.doc',
  'win-congrats': 'Congratulations!.exe',
  'win-recycle':  'Recycle Bin',
};

function addTaskbarBtn(id) {
  if (document.querySelector(`.taskbar-window-btn[data-id="${id}"]`)) return;
  const btn = document.createElement('button');
  btn.className = 'taskbar-window-btn';
  btn.dataset.id = id;
  btn.textContent = titles[id] || id;
  btn.onclick = () => {
    if (winState[id]?.minimized) {
      openWindow(id);
    } else {
      focusWindow(id);
    }
  };
  document.getElementById('taskbar-windows').appendChild(btn);
}

function removeTaskbarBtn(id) {
  const btn = document.querySelector(`.taskbar-window-btn[data-id="${id}"]`);
  if (btn) btn.remove();
}

/* ── CLOCK ───────────────────────────────────────────────── */
function updateClock() {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  const el = document.getElementById('taskbar-clock');
  el.textContent = `${h}:${m}`;
  el.title = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
updateClock();
setInterval(updateClock, 15000);

/* ── START MENU ──────────────────────────────────────────── */
function toggleStartMenu() {
  const m = document.getElementById('start-menu');
  const b = document.getElementById('start-btn');
  const hidden = m.classList.toggle('hidden');
  b.classList.toggle('active', !hidden);
}

document.addEventListener('mousedown', e => {
  const m = document.getElementById('start-menu');
  const b = document.getElementById('start-btn');
  if (!m.classList.contains('hidden') && !m.contains(e.target) && e.target !== b) {
    m.classList.add('hidden');
    b.classList.remove('active');
  }
});

/* ── DRAG ────────────────────────────────────────────────── */
function startDrag(e, id) {
  if (e.button !== 0) return;
  e.preventDefault();
  const w = getWin(id);
  focusWindow(id);
  if (winState[id]?.maximized) return;
  const startX = e.clientX - w.offsetLeft;
  const startY = e.clientY - w.offsetTop;

  function onMove(e) {
    const maxX = window.innerWidth  - w.offsetWidth;
    const maxY = window.innerHeight - 28 - w.offsetHeight;
    w.style.left = Math.max(0, Math.min(e.clientX - startX, maxX)) + 'px';
    w.style.top  = Math.max(0, Math.min(e.clientY - startY, maxY)) + 'px';
  }
  function onUp() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

function startDragTouch(e, id) {
  const w = getWin(id);
  focusWindow(id);
  if (winState[id]?.maximized) return;
  const t = e.touches[0];
  const startX = t.clientX - w.offsetLeft;
  const startY = t.clientY - w.offsetTop;

  function onMove(e) {
    const t = e.touches[0];
    const maxX = window.innerWidth  - w.offsetWidth;
    const maxY = window.innerHeight - 28 - w.offsetHeight;
    w.style.left = Math.max(0, Math.min(t.clientX - startX, maxX)) + 'px';
    w.style.top  = Math.max(0, Math.min(t.clientY - startY, maxY)) + 'px';
  }
  function onEnd() {
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onEnd);
  }
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend', onEnd);
}

/* ── PHOTO VIEWER ────────────────────────────────────────── */
// ✏️  Add your image paths here
const photos = [
  'assets/images/placeholder.svg',
  'assets/images/placeholder.svg',
  'assets/images/placeholder.svg',
];
let photoIndex = 0;

function showPhoto(idx) {
  const img = document.getElementById('photo-display');
  img.classList.add('fade');
  setTimeout(() => {
    img.src = photos[idx];
    img.classList.remove('fade');
    document.getElementById('photo-counter').textContent = `${idx + 1} / ${photos.length}`;
  }, 200);
}

function prevPhoto() {
  photoIndex = (photoIndex - 1 + photos.length) % photos.length;
  showPhoto(photoIndex);
}
function nextPhoto() {
  photoIndex = (photoIndex + 1) % photos.length;
  showPhoto(photoIndex);
}

/* ── CONGRATS PROGRESS BAR ───────────────────────────────── */
const installSteps = [
  [10,  'Scanning for love...'],
  [25,  'Downloading commitment...'],
  [42,  'Installing happiness.dll...'],
  [60,  'Configuring inside jokes...'],
  [75,  'Building shared future...'],
  [90,  'Finalizing vows...'],
  [100, 'Installation complete!'],
];

let progressRan = false;
function runCongratsProgress() {
  if (progressRan) return;
  progressRan = true;
  const fill  = document.getElementById('progress-fill');
  const label = document.getElementById('progress-label');
  let i = 0;
  function step() {
    if (i >= installSteps.length) {
      document.getElementById('congrats-complete').style.display = 'flex';
      document.getElementById('congrats-complete').style.flexDirection = 'column';
      document.getElementById('congrats-complete').style.alignItems = 'center';
      document.getElementById('congrats-complete').style.gap = '8px';
      return;
    }
    const [pct, msg] = installSteps[i++];
    fill.style.width = pct + '%';
    label.textContent = msg;
    setTimeout(step, 600 + Math.random() * 400);
  }
  setTimeout(step, 400);
}

/* ── HEART PARTICLES ─────────────────────────────────────── */
const emojis = ['♥', '💍', '✨', '🌸', '💕'];

function spawnParticle(x, y) {
  const container = document.getElementById('particles');
  const span = document.createElement('span');
  span.className = 'particle';
  span.textContent = emojis[Math.floor(Math.random() * emojis.length)];
  span.style.left = (x + (Math.random() - 0.5) * 60) + 'px';
  span.style.top  = y + 'px';
  span.style.animationDuration = (1 + Math.random() * 0.6) + 's';
  container.appendChild(span);
  span.addEventListener('animationend', () => span.remove());
}

function launchHearts() {
  const count = 40;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      spawnParticle(
        Math.random() * window.innerWidth,
        Math.random() * (window.innerHeight - 28)
      );
    }, i * 40);
  }
}

/* Desktop click spawns a small burst of hearts */
document.getElementById('desktop').addEventListener('click', e => {
  for (let i = 0; i < 3; i++) {
    setTimeout(() => spawnParticle(e.clientX, e.clientY), i * 80);
  }
});

/* ── RECYCLE BIN EASTER EGG ──────────────────────────────── */
function recycleBinNo() {
  document.getElementById('recycle-msg').style.display = 'block';
}

/* ── SCROLL REVEAL (IntersectionObserver inside windows) ── */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.win-content p, .win-content img').forEach(el => {
  el.classList.add('reveal');
  revealObserver.observe(el);
});

/* ── ICON SINGLE-CLICK SELECTION ─────────────────────────── */
document.querySelectorAll('.icon').forEach(icon => {
  icon.addEventListener('click', () => {
    document.querySelectorAll('.icon').forEach(i => i.classList.remove('selected'));
    icon.classList.add('selected');
  });
});
document.getElementById('desktop').addEventListener('click', e => {
  if (!e.target.closest('.icon')) {
    document.querySelectorAll('.icon').forEach(i => i.classList.remove('selected'));
  }
});

/* ── FOCUS WINDOW ON CLICK ───────────────────────────────── */
document.querySelectorAll('.win95-window').forEach(w => {
  w.addEventListener('mousedown', () => focusWindow(w.id), true);
});
