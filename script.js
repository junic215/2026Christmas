/* =========================================================
   CHRISTMAS PARTY 2026 — script.js
   Snow · Scroll Animations · iPod Classic Player
   ========================================================= */

'use strict';

// ─────────────────────────────────────────────────────────
// 1. SNOW PARTICLE SYSTEM
// ─────────────────────────────────────────────────────────
(function initSnow() {
  const canvas = document.getElementById('snow-canvas');
  const ctx    = canvas.getContext('2d');

  // Snowflake shapes (unicode) drawn as text
  const SHAPES = ['❄', '❅', '❆', '•'];
  const COUNT  = 55;

  let W, H;
  const flakes = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  class Flake {
    constructor(init) {
      this.shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      this.reset(init);
    }
    reset(fromTop) {
      this.x       = Math.random() * W;
      this.y       = fromTop ? Math.random() * -100 : Math.random() * H;
      this.size    = Math.random() * 9 + 4;
      this.speed   = Math.random() * 0.8 + 0.3;
      this.wind    = Math.random() * 0.4 - 0.2;
      this.wobble  = Math.random() * Math.PI * 2;
      this.wobbleS = Math.random() * 0.025 + 0.008;
      this.opacity = Math.random() * 0.55 + 0.15;
      this.rotate  = Math.random() * 360;
      this.rotateS = (Math.random() - 0.5) * 0.4;
    }
    update() {
      this.wobble  += this.wobbleS;
      this.y       += this.speed;
      this.x       += this.wind + Math.sin(this.wobble) * 0.35;
      this.rotate  += this.rotateS;
      if (this.y > H + 20 || this.x < -30 || this.x > W + 30) this.reset(true);
    }
    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotate * Math.PI) / 180);
      ctx.font = `${this.size}px serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.shape, 0, 0);
      ctx.restore();
    }
  }

  for (let i = 0; i < COUNT; i++) flakes.push(new Flake(false));

  function tick() {
    ctx.clearRect(0, 0, W, H);
    for (const f of flakes) { f.update(); f.draw(ctx); }
    requestAnimationFrame(tick);
  }
  tick();
})();

// ─────────────────────────────────────────────────────────
// 2. SPARKLE EFFECT (background gold stars)
// ─────────────────────────────────────────────────────────
(function initSparkles() {
  const container = document.getElementById('sparkles');
  const NUM = 25;

  for (let i = 0; i < NUM; i++) {
    const el = document.createElement('div');
    el.className = 'sparkle';
    el.style.left   = Math.random() * 100 + 'vw';
    el.style.top    = Math.random() * 100 + 'vh';
    el.style.width  = el.style.height = (Math.random() * 4 + 2) + 'px';
    el.style.animationDelay    = (Math.random() * 4) + 's';
    el.style.animationDuration = (Math.random() * 3 + 2) + 's';
    container.appendChild(el);
  }
})();

// ─────────────────────────────────────────────────────────
// 3. HERO PARALLAX
// ─────────────────────────────────────────────────────────
(function initParallax() {
  const wrap = document.querySelector('.hero-parallax-wrap');
  if (!wrap) return;

  function onScroll() {
    const y = window.scrollY;
    wrap.style.transform = `translateY(${y * 0.3}px)`;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
})();

// ─────────────────────────────────────────────────────────
// 4. TIMELINE SCROLL ANIMATIONS
// ─────────────────────────────────────────────────────────
(function initScrollAnimations() {
  const items = document.querySelectorAll('[data-animate]');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  items.forEach((el, i) => {
    // Stagger delay
    el.style.transitionDelay = (i * 0.08) + 's';
    observer.observe(el);
  });
})();

// ─────────────────────────────────────────────────────────
// 5. iPOD CLASSIC PLAYER
// ─────────────────────────────────────────────────────────

// ── Playlist Configuration ──────────────────────────────
// 曲を追加する場合は、ここに追記してください。
// { title: '曲名', artist: 'アーティスト名', file: 'ファイル名.mp3' }
const PLAYLIST = [
  {
    title:  'miyasakosenpai',
    artist: 'みやさこ先輩',
    file:   'miyasakosenpai.mp3',
    art:    '🎵',
  },
  // ← ここに追加 例:
  // { title: 'Jingle Bells', artist: 'Unknown', file: 'jinglebells.mp3', art: '🎶' },
];

class iPodClassic {
  constructor() {
    // ── DOM References ──
    this.screenEl = document.getElementById('ipod-screen');
    this.wheelEl  = document.getElementById('ipod-wheel');

    // ── Audio Engine ──
    this.audio          = new Audio();
    this.audio.preload  = 'metadata';

    // ── Player State ──
    this.playlist       = PLAYLIST;
    this.currentTrack   = 0;
    this.isPlaying      = false;
    this.volume         = 0.8;
    this.audio.volume   = this.volume;
    this.isShuffle      = false;
    this.isRepeat       = false;

    // ── Navigation State ──
    //   screen: 'menu' | 'songs' | 'nowplaying'
    this.screen         = 'menu';
    this.menuStack      = []; // stack of { items, index }
    this.selectedIndex  = 0;

    // Build the menu tree
    this.MENUS = {
      main: [
        { label: 'Music',        icon: '♪', action: () => this._pushMenu('music') },
        { label: 'Now Playing',  icon: '▶', action: () => this._goNowPlaying() },
        { label: 'Shuffle Songs',icon: '⇄', action: () => this._shufflePlay() },
        { label: 'Settings',     icon: '⚙', action: () => this._pushMenu('settings') },
      ],
      music: [
        { label: 'Songs',        icon: '♫', action: () => this._goSongs() },
        { label: 'Playlists',    icon: '≡', action: () => this._pushMenu('playlists') },
        { label: 'Shuffle',      icon: '⇄', action: () => this._shufflePlay() },
      ],
      settings: [
        { label: 'Repeat',       icon: '↺', action: () => this._toggleRepeat(),
          note: () => this.isRepeat ? 'On' : 'Off' },
        { label: 'Shuffle',      icon: '⇄', action: () => this._toggleShuffle(),
          note: () => this.isShuffle ? 'On' : 'Off' },
        { label: 'Volume',       icon: '♬', action: () => {},
          note: () => Math.round(this.volume * 100) + '%' },
      ],
      playlists: [
        { label: 'All Songs',    icon: '♫', action: () => this._goSongs() },
      ],
    };

    this.currentMenu = this.MENUS.main;

    // ── Click Wheel State ──
    this._wheelStart     = null;
    this._wheelAccum     = 0;
    this._SCROLL_DEG     = 26;   // degrees per scroll step
    this._isMouseDown    = false;

    this._setupAudio();
    this._setupButtons();
    this._setupWheel();

    // Boot animation then show menu
    setTimeout(() => this._renderScreen(), 900);
  }

  // ── Audio Setup ─────────────────────────────────────────
  _setupAudio() {
    this.audio.addEventListener('timeupdate', () => {
      if (this.screen === 'nowplaying') this._renderScreen();
    });
    this.audio.addEventListener('ended', () => {
      if (this.isRepeat) {
        this.audio.currentTime = 0;
        this.audio.play();
      } else {
        this._nextTrack();
      }
    });
    this.audio.addEventListener('loadedmetadata', () => {
      if (this.screen === 'nowplaying') this._renderScreen();
    });
    // Preload first track
    if (this.playlist.length > 0) {
      this.audio.src = this.playlist[0].file;
    }
  }

  _loadTrack(index, play = false) {
    this.currentTrack = index;
    this.audio.src    = this.playlist[index].file;
    this.audio.load();
    if (play) {
      this.audio.play().catch(() => {});
      this.isPlaying = true;
    }
  }

  _togglePlay() {
    if (this.audio.paused) {
      if (!this.audio.src || this.audio.src === window.location.href) {
        this._loadTrack(this.currentTrack, true);
        return;
      }
      this.audio.play().catch(() => {});
      this.isPlaying = true;
    } else {
      this.audio.pause();
      this.isPlaying = false;
    }
    this._renderScreen();
  }

  _nextTrack() {
    let next;
    if (this.isShuffle) {
      next = Math.floor(Math.random() * this.playlist.length);
    } else {
      next = (this.currentTrack + 1) % this.playlist.length;
    }
    this._loadTrack(next, this.isPlaying);
    this._renderScreen();
  }

  _prevTrack() {
    if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
      this._renderScreen();
      return;
    }
    const prev = (this.currentTrack - 1 + this.playlist.length) % this.playlist.length;
    this._loadTrack(prev, this.isPlaying);
    this._renderScreen();
  }

  _shufflePlay() {
    this.isShuffle = true;
    const i = Math.floor(Math.random() * this.playlist.length);
    this._loadTrack(i, true);
    this._goNowPlaying();
  }

  _toggleRepeat() {
    this.isRepeat = !this.isRepeat;
    this._renderScreen();
  }

  _toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    this._renderScreen();
  }

  // ── Navigation ──────────────────────────────────────────
  _pushMenu(name) {
    this.menuStack.push({ items: this.currentMenu, index: this.selectedIndex });
    this.currentMenu   = this.MENUS[name];
    this.selectedIndex = 0;
    this.screen        = 'menu';
    this._renderScreen();
  }

  _popMenu() {
    if (this.screen !== 'menu') {
      this.screen = 'menu';
      this._renderScreen();
      return;
    }
    if (this.menuStack.length > 0) {
      const prev         = this.menuStack.pop();
      this.currentMenu   = prev.items;
      this.selectedIndex = prev.index;
      this._renderScreen();
    }
  }

  _goNowPlaying() {
    this.screen = 'nowplaying';
    this._renderScreen();
  }

  _goSongs() {
    this.selectedIndex = this.currentTrack;
    this.screen        = 'songs';
    this._renderScreen();
  }

  _selectCurrent() {
    if (this.screen === 'menu') {
      const item = this.currentMenu[this.selectedIndex];
      if (item) item.action();
    } else if (this.screen === 'songs') {
      this._loadTrack(this.selectedIndex, true);
      this._goNowPlaying();
    } else if (this.screen === 'nowplaying') {
      this._togglePlay();
    }
  }

  _scrollList(dir) {
    if (this.screen === 'menu') {
      const len          = this.currentMenu.length;
      this.selectedIndex = (this.selectedIndex + dir + len) % len;
      this._renderScreen();
    } else if (this.screen === 'songs') {
      const len          = this.playlist.length;
      this.selectedIndex = (this.selectedIndex + dir + len) % len;
      this._renderScreen();
    } else if (this.screen === 'nowplaying') {
      // Wheel controls volume on now-playing screen
      this.volume = Math.max(0, Math.min(1, this.volume + dir * 0.05));
      this.audio.volume = this.volume;
      this._renderScreen();
    }
  }

  // ── Button Wiring ───────────────────────────────────────
  _setupButtons() {
    const btn = (id, fn) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('click', (e) => { e.stopPropagation(); fn(); });
      el.addEventListener('touchend', (e) => { e.preventDefault(); e.stopPropagation(); fn(); }, { passive: false });
    };

    btn('btn-menu',    () => this._popMenu());
    btn('btn-play',    () => this._togglePlay());
    btn('btn-forward', () => this._nextTrack());
    btn('btn-back',    () => this._prevTrack());
    btn('btn-center',  () => this._selectCurrent());
  }

  // ── Click Wheel ─────────────────────────────────────────
  _setupWheel() {
    const wheel = this.wheelEl;

    const getCenter = () => {
      const r = wheel.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2 };
    };

    const getAngle = (clientX, clientY) => {
      const c = getCenter();
      return Math.atan2(clientY - c.y, clientX - c.x) * (180 / Math.PI);
    };

    const isRing = (clientX, clientY) => {
      const c   = getCenter();
      const dx  = clientX - c.x;
      const dy  = clientY - c.y;
      const d   = Math.sqrt(dx * dx + dy * dy);
      return d > c.r * 0.38 && d <= c.r * 0.98;
    };

    const onStart = (x, y) => {
      if (!isRing(x, y)) return false;
      this._wheelStart = getAngle(x, y);
      this._wheelAccum = 0;
      return true;
    };

    const onMove = (x, y) => {
      if (this._wheelStart === null) return;
      if (!isRing(x, y)) return;
      let delta = getAngle(x, y) - this._wheelStart;
      if (delta > 180)  delta -= 360;
      if (delta < -180) delta += 360;
      this._wheelAccum += delta;
      this._wheelStart  = getAngle(x, y);

      while (this._wheelAccum >= this._SCROLL_DEG) {
        this._scrollList(1);
        this._wheelAccum -= this._SCROLL_DEG;
        if (navigator.vibrate) navigator.vibrate(8);
      }
      while (this._wheelAccum <= -this._SCROLL_DEG) {
        this._scrollList(-1);
        this._wheelAccum += this._SCROLL_DEG;
        if (navigator.vibrate) navigator.vibrate(8);
      }
    };

    const onEnd = () => { this._wheelStart = null; };

    // Touch events
    wheel.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      onStart(t.clientX, t.clientY);
    }, { passive: true });

    wheel.addEventListener('touchmove', (e) => {
      const t = e.touches[0];
      if (isRing(t.clientX, t.clientY)) e.preventDefault();
      onMove(t.clientX, t.clientY);
    }, { passive: false });

    wheel.addEventListener('touchend', onEnd, { passive: true });

    // Mouse events (desktop support)
    wheel.addEventListener('mousedown', (e) => {
      if (onStart(e.clientX, e.clientY)) {
        this._isMouseDown = true;
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (!this._isMouseDown) return;
      onMove(e.clientX, e.clientY);
    });

    document.addEventListener('mouseup', () => {
      this._isMouseDown = false;
      onEnd();
    });
  }

  // ── Helpers ─────────────────────────────────────────────
  _fmtTime(sec) {
    if (!sec || isNaN(sec)) return '--:--';
    const s = Math.floor(sec);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  _menuTitle() {
    if (this.menuStack.length === 0) return 'iPod';
    const names = { main: 'iPod', music: 'Music', settings: 'Settings', playlists: 'Playlists' };
    // Find the name of currentMenu
    for (const [key, val] of Object.entries(this.MENUS)) {
      if (val === this.currentMenu) return names[key] || 'Menu';
    }
    return 'Menu';
  }

  // ── Screen Rendering ────────────────────────────────────
  _renderScreen() {
    const el = this.screenEl;

    if (this.screen === 'menu') {
      this._renderMenu(el);
    } else if (this.screen === 'songs') {
      this._renderSongs(el);
    } else if (this.screen === 'nowplaying') {
      this._renderNowPlaying(el);
    }
  }

  _renderMenu(el) {
    const items   = this.currentMenu;
    const title   = this._menuTitle();
    const battery = '🔋';
    const time    = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

    // Determine scroll window (show max 5 items at a time)
    const VISIBLE = 5;
    const start   = Math.max(0, Math.min(this.selectedIndex - 2, items.length - VISIBLE));
    const visible = items.slice(start, start + VISIBLE);
    const visIdx  = this.selectedIndex - start;

    el.innerHTML = `
      <div class="screen-header">
        <span class="screen-title">${title}</span>
        <span class="screen-icons">${time} ${battery}</span>
      </div>
      <div class="screen-menu">
        ${visible.map((item, i) => {
          const note = item.note ? item.note() : '';
          return `<div class="menu-item ${i === visIdx ? 'selected' : ''}">
            <span class="menu-label">${item.icon} ${item.label}</span>
            ${note ? `<span class="menu-note">${note}</span>` : ''}
            <span class="menu-arrow">›</span>
          </div>`;
        }).join('')}
      </div>
    `;
  }

  _renderSongs(el) {
    const VISIBLE = 5;
    const start   = Math.max(0, Math.min(this.selectedIndex - 2, this.playlist.length - VISIBLE));
    const visible = this.playlist.slice(start, start + VISIBLE);
    const visIdx  = this.selectedIndex - start;
    const time    = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

    el.innerHTML = `
      <div class="screen-header">
        <span class="screen-title">Songs</span>
        <span class="screen-icons">${time} 🔋</span>
      </div>
      <div class="screen-menu">
        ${visible.map((song, i) => {
          const isActive = (start + i) === this.currentTrack;
          return `<div class="menu-item ${i === visIdx ? 'selected' : ''}">
            <span class="menu-label">${isActive ? '♪ ' : ''}${song.title}</span>
            <span class="menu-arrow">›</span>
          </div>`;
        }).join('')}
      </div>
    `;
  }

  _renderNowPlaying(el) {
    const track    = this.playlist[this.currentTrack];
    const cur      = this.audio.currentTime;
    const dur      = this.audio.duration;
    const progress = dur && !isNaN(dur) ? (cur / dur) : 0;
    const pct      = (progress * 100).toFixed(2);
    const tpct     = (progress * 100).toFixed(2);
    const volPct   = (this.volume * 100).toFixed(0);
    const playIcon = this.isPlaying ? '▶' : '❚❚';
    const shuffIco = this.isShuffle ? ' ⇄' : '';
    const repIco   = this.isRepeat  ? ' ↺' : '';

    const titleLen = track.title.length;
    const scrollClass = titleLen > 14 ? 'scrolling' : '';

    el.innerHTML = `
      <div class="now-playing-screen">
        <div class="np-header">
          <span>${this.currentTrack + 1} of ${this.playlist.length}${shuffIco}${repIco}</span>
          <span>Now Playing 🔋</span>
        </div>
        <div class="np-body">
          <div class="album-art-box">${track.art || '🎵'}</div>
          <div class="np-track-info">
            <div class="np-title ${scrollClass}">${track.title}</div>
            <div class="np-artist">${track.artist}</div>
          </div>
          <div class="np-progress">
            <div class="np-time-row">
              <span>${this._fmtTime(cur)}</span>
              <span>${this._fmtTime(dur)}</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width:${pct}%"></div>
              <div class="progress-thumb" style="left:${tpct}%"></div>
            </div>
          </div>
          <div class="np-status-row">
            <span class="np-play-icon">${playIcon}</span>
            <div class="vol-row">
              <span class="vol-icon">🔈</span>
              <div class="vol-track">
                <div class="vol-fill" style="width:${volPct}%"></div>
              </div>
              <span class="vol-icon">🔊</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// ─────────────────────────────────────────────────────────
// 6. INITIALISE
// ─────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Launch iPod
  new iPodClassic();

  // Scroll hint click
  const hint = document.querySelector('.scroll-hint');
  if (hint) {
    hint.addEventListener('click', () => {
      document.getElementById('schedule').scrollIntoView({ behavior: 'smooth' });
    });
  }
});
