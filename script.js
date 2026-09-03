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

/* ── USELESS BUTTON ──────────────────────────────────────── */
function uselessBtn() { alert('Useless button hahahaha'); }

/* ── DESKTOP ICONS: SELECT & DRAG ────────────────────────── */
(function initIcons() {
  const desktop = document.getElementById('desktop');
  const desktopRect = desktop.getBoundingClientRect();

  // Read ALL positions before modifying any, so flex reflow doesn't shift later icons
  const icons = [...document.querySelectorAll('.icon')];
  const frozenPositions = icons.map(ic => {
    const r = ic.getBoundingClientRect();
    return { left: r.left - desktopRect.left, top: r.top - desktopRect.top };
  });
  icons.forEach((ic, i) => {
    ic.style.position = 'absolute';
    ic.style.left = frozenPositions[i].left + 'px';
    ic.style.top  = frozenPositions[i].top  + 'px';
  });

  icons.forEach(icon => {
    icon.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      e.stopPropagation();

      // Selection: if not already selected, clear and select only this icon
      if (!icon.classList.contains('selected')) {
        icons.forEach(i => i.classList.remove('selected'));
        icon.classList.add('selected');
      }

      const dragOriginX = e.clientX;
      const dragOriginY = e.clientY;

      // Snapshot starting positions of all selected icons
      const selected = icons.filter(i => i.classList.contains('selected'));
      const startPositions = selected.map(ic => ({ ic, left: ic.offsetLeft, top: ic.offsetTop }));

      function onMove(e) {
        const dx = e.clientX - dragOriginX;
        const dy = e.clientY - dragOriginY;
        startPositions.forEach(({ ic, left, top }) => {
          const maxX = desktop.clientWidth  - ic.offsetWidth;
          const maxY = desktop.clientHeight - ic.offsetHeight;
          ic.style.left = Math.max(0, Math.min(left + dx, maxX)) + 'px';
          ic.style.top  = Math.max(0, Math.min(top  + dy, maxY)) + 'px';
        });
      }

      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  });

  // Deselect all when releasing click on empty desktop
  desktop.addEventListener('mouseup', e => {
    if (!e.target.closest('.icon')) {
      icons.forEach(i => i.classList.remove('selected'));
    }
  });
})();

/* ── MARQUEE RECTANGLE SELECTOR ──────────────────────────── */
(function initMarquee() {
  const desktop = document.getElementById('desktop');
  const selRect = document.getElementById('sel-rect');
  let startX, startY, selecting = false;

  desktop.addEventListener('mousedown', e => {
    if (e.button !== 0 || e.target.closest('.icon')) return;
    selecting = true;
    startX = e.clientX;
    startY = e.clientY;
    selRect.style.display = 'block';
    selRect.style.left   = startX + 'px';
    selRect.style.top    = startY + 'px';
    selRect.style.width  = '0';
    selRect.style.height = '0';
    document.querySelectorAll('.icon').forEach(i => i.classList.remove('selected'));
  });

  document.addEventListener('mousemove', e => {
    if (!selecting) return;
    const x = Math.min(e.clientX, startX);
    const y = Math.min(e.clientY, startY);
    const w = Math.abs(e.clientX - startX);
    const h = Math.abs(e.clientY - startY);
    selRect.style.left   = x + 'px';
    selRect.style.top    = y + 'px';
    selRect.style.width  = w + 'px';
    selRect.style.height = h + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (!selecting) return;
    selecting = false;
    const box = selRect.getBoundingClientRect();
    selRect.style.display = 'none';
    document.querySelectorAll('.icon').forEach(icon => {
      const ib = icon.getBoundingClientRect();
      if (ib.left < box.right && ib.right > box.left &&
          ib.top  < box.bottom && ib.bottom > box.top) {
        icon.classList.add('selected');
      }
    });
  });
})();

/* ── FOCUS WINDOW ON CLICK ───────────────────────────────── */
document.querySelectorAll('.win95-window').forEach(w => {
  w.addEventListener('mousedown', () => focusWindow(w.id), true);
});
