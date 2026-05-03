// ===== UNISYNC APP.JS =====
// ===== AUTH GUARD =====
(function () {
  const token = sessionStorage.getItem('unisync_token');
  if (!token) { window.location.href = 'login.html'; }
})();

// ===== API LAYER =====
const API_BASE = (window.location.protocol === 'file:' || window.location.hostname === '')
  ? 'http://localhost:3001'
  : window.location.origin;

async function apiGet(path) {
  const token = sessionStorage.getItem('unisync_token');
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (res.status === 401) { sessionStorage.clear(); window.location.href = 'login.html'; return null; }
  return res.json();
}

async function apiPost(path, body) {
  const token = sessionStorage.getItem('unisync_token');
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(body)
  });
  if (res.status === 401) { sessionStorage.clear(); window.location.href = 'login.html'; return null; }
  return res.json();
}

async function apiPut(path, body) {
  const token = sessionStorage.getItem('unisync_token');
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(body)
  });
  if (res.status === 401) { sessionStorage.clear(); window.location.href = 'login.html'; return null; }
  return res.json();
}

async function apiDelete(path) {
  const token = sessionStorage.getItem('unisync_token');
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (res.status === 401) { sessionStorage.clear(); window.location.href = 'login.html'; return null; }
  return res.json();
}

// ===== STATE =====
const state = {
  page: 'home',
  exploreTab: 'events',
  favTab: 'events',
  recTab: 'open',
  filterCat: 'all',
  applications: {},
  joinRequests: {},   // clubId -> { status, interviewMsg, requestId }
  heroIdx: 0,
  heroTimer: null,
  chatOpen: null,
  currentEventId: null,
  currentClubId: null,
  paymentEventId: null,
  paymentMethod: 'card',
  selectedCategories: [],
  execClubs: [],      // clubs this executive owns
  profile: {
    firstName: 'Hammad',
    lastName: 'Khan',
    email: 'i242539@isb.nu.edu.pk',
    phone: '+92 300 1234567',
    studentId: 'L20-4567',
    university: 'FAST NUCES',
    campus: 'Islamabad',
    department: 'Computer Science',
    program: 'BSc Computer Science',
    year: '3',
    semester: '6',
    bio: '',
    linkedin: '',
    github: '',
    interests: [],
    avatarUrl: '',
    role: 'student',
  },
};

const INTERESTS = ['Programming', 'Design', 'Music', 'Sports', 'Business', 'Photography', 'Drama', 'Debate', 'Research', 'AI/ML', 'Gaming', 'Travel'];

// ===== ROUTER =====
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('page-' + page);
  if (el) el.classList.add('active');
  state.page = page;

  // Nav button highlights (mobile bottom nav)
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const navMap = { home: 'nav-home', explore: 'nav-explore', calendar: 'nav-calendar', messages: 'nav-messages', favorites: 'nav-favorites', profile: 'nav-profile' };
  if (navMap[page]) document.getElementById(navMap[page])?.classList.add('active');

  // Sidebar nav highlights (desktop)
  document.querySelectorAll('.sidebar-btn[id^="snav-"]').forEach(b => b.classList.remove('active'));
  const sidebarMap = { home: 'snav-home', explore: 'snav-explore', calendar: 'snav-calendar', messages: 'snav-messages', favorites: 'snav-favorites', profile: 'snav-profile', recruitment: 'snav-recruitment' };
  if (sidebarMap[page]) document.getElementById(sidebarMap[page])?.classList.add('active');


  // Render page
  if (page === 'home') renderHome();
  if (page === 'explore') renderExplore();
  if (page === 'calendar') renderCalendar();
  if (page === 'messages') renderMessages();
  if (page === 'favorites') renderFavorites();
  if (page === 'profile') renderProfile();
  if (page === 'recruitment') renderRecruitment();
}

// ===== TOAST =====
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ===== PANELS =====
function openPanel(id) {
  document.getElementById(id).classList.add('open');
  document.getElementById('panelOverlay').classList.add('open');
  if (id === 'notifPanel') refreshNotifications();
}
function closePanel(id) {
  document.getElementById(id).classList.remove('open');
  document.getElementById('panelOverlay').classList.remove('open');
}
function closeAllPanels() {
  document.querySelectorAll('.side-panel').forEach(p => p.classList.remove('open'));
  document.getElementById('panelOverlay').classList.remove('open');
}

// ===== FILTER SHEET =====
function openFilterSheet() {
  renderFilterGrid();
  document.getElementById('filterSheet').classList.add('open');
  document.getElementById('sheetOverlay').classList.add('open');
}
function closeFilterSheet() {
  document.getElementById('filterSheet').classList.remove('open');
  document.getElementById('sheetOverlay').classList.remove('open');
}
function renderFilterGrid() {
  const grid = document.getElementById('filterGrid');
  grid.innerHTML = CATEGORIES.map(c => `
    <div class="filter-item ${state.selectedCategories.includes(c.id) ? 'selected' : ''}" onclick="toggleCategory('${c.id}')">
      <span class="fi-emoji">${c.emoji}</span>
      <span>${c.label}</span>
    </div>`).join('');
}
function toggleCategory(id) {
  if (id === 'all') { state.selectedCategories = []; }
  else {
    const idx = state.selectedCategories.indexOf(id);
    if (idx > -1) state.selectedCategories.splice(idx, 1);
    else state.selectedCategories.push(id);
  }
  renderFilterGrid();
}
function applyFilter() {
  closeFilterSheet();
  if (state.page === 'home') navigate('explore');
  renderExplore();
  showToast(state.selectedCategories.length ? `Filter: ${state.selectedCategories.join(', ')}` : 'Showing all');
}
function setToggle(type, btn) {
  state.exploreTab = type;
  document.querySelectorAll('.toggle-pill').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  else document.querySelector(`.toggle-pill[data-type="${type}"]`)?.classList.add('active');
  navigate('explore');
}

// ===== HOME PAGE =====
function renderHome() {
  renderHeroCarousel();

  const role = state.profile.role || sessionStorage.getItem('unisync_role') || 'student';
  const execPanel = document.getElementById('homeExecPanel');
  if (execPanel) {
    execPanel.innerHTML = '';
  }

  renderUpcomingEvents();
  renderHomeCategories();
  renderFeaturedClubs();
  renderTrendingEvents();
  renderHomePositions();
}

const ICON_CLR = 'rgba(255,255,255,0.7)';
const CAT_ICONS = {
  technical: `<svg viewBox="0 0 24 24" fill="none" stroke="${ICON_CLR}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  social: `<svg viewBox="0 0 24 24" fill="none" stroke="${ICON_CLR}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  sports: `<svg viewBox="0 0 24 24" fill="none" stroke="${ICON_CLR}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l4.24 4.24"/><path d="M14.83 9.17l4.24-4.24"/><path d="M14.83 14.83l4.24 4.24"/><path d="M9.17 14.83l-4.24 4.24"/></svg>`,
  cultural: `<svg viewBox="0 0 24 24" fill="none" stroke="${ICON_CLR}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  arts: `<svg viewBox="0 0 24 24" fill="none" stroke="${ICON_CLR}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>`,
  business: `<svg viewBox="0 0 24 24" fill="none" stroke="${ICON_CLR}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="17"/><line x1="9" y1="14.5" x2="15" y2="14.5"/></svg>`,
  education: `<svg viewBox="0 0 24 24" fill="none" stroke="${ICON_CLR}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
  technology: `<svg viewBox="0 0 24 24" fill="none" stroke="${ICON_CLR}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  community: `<svg viewBox="0 0 24 24" fill="none" stroke="${ICON_CLR}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  music: `<svg viewBox="0 0 24 24" fill="none" stroke="${ICON_CLR}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
};


function renderHomeCategories() {
  const el = document.getElementById('homeCategories');
  if (!el) return;
  el.innerHTML = CATEGORIES.filter(c => c.id !== 'all').map(c => `
    <div class="category-tile cat-${c.id}" onclick="navigate('explore');setToggle('events');state.selectedCategories=['${c.id}'];renderExplore()">
      <div class="category-icon">${CAT_ICONS[c.id] || CAT_ICONS.technical}</div>
      <div class="category-label">${c.label}</div>
    </div>`).join('');
}
function renderTrendingEvents() {
  const el = document.getElementById('trendingEvents');
  if (!el) return;
  const trending = [...EVENTS].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 6);
  el.innerHTML = trending.map(ev => `
    <div class="event-card-h" onclick="openEventDetail(${ev.id})">
      <div class="img-wrap">
        <img src="${ev.img}" alt="${ev.name}" loading="lazy"/>
        <span class="card-tag">${ev.tag}</span>
      </div>
      <div class="card-body">
        <div class="card-name">${ev.name}</div>
        <div class="card-meta-row"><span>${ev.club}</span>${ev.prize ? `<span>${ev.prize}</span>` : ''}</div>
      </div>
    </div>`).join('');
}
function renderHeroCarousel() {
  const c = document.getElementById('heroCarousel');
  const featured = EVENTS.slice(0, 4);
  c.innerHTML = featured.map((ev, i) => `
    <div class="hero-slide ${i === 0 ? 'visible' : 'hidden'}" data-idx="${i}">
      <img class="hero-img" src="${ev.img}" alt="${ev.name}" loading="lazy"/>
      <div class="hero-overlay"></div>
      <div class="hero-meta">
        <span class="hero-tag">${ev.date}</span>
        <span class="hero-tag">${ev.time.split('–')[0].trim()}</span>
        <span class="hero-tag">${ev.location.split(',')[0]}</span>
      </div>
      <div class="hero-content" onclick="openEventDetail(${ev.id})">
        <div class="hero-name">${ev.name.toUpperCase()}</div>
        <div class="hero-sub">${ev.club}</div>
      </div>
      <div class="hero-actions">
        <button class="hero-action-btn hero-share" onclick="event.stopPropagation();showToast('Link copied!')"><svg viewBox="0 0 24 24" fill="none" stroke="white" width="16" height="16" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg></button>
        <button class="hero-action-btn hero-like" onclick="event.stopPropagation();toggleEventSaved(${ev.id},this)">${ev.saved ? '<svg viewBox="0 0 24 24" fill="#e05555" stroke="#e05555" width="16" height="16" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="white" width="16" height="16" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'}</button>
      </div>
    </div>`).join('') +
    `<div class="hero-dots">${featured.map((_, i) => `<div class="hero-dot ${i === 0 ? 'active' : ''}"></div>`).join('')}</div>`;
  startHeroTimer(featured.length);
}
function startHeroTimer(count) {
  clearInterval(state.heroTimer);
  state.heroTimer = setInterval(() => {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-dot');
    if (!slides.length) return;
    slides[state.heroIdx].classList.remove('visible'); slides[state.heroIdx].classList.add('hidden');
    dots[state.heroIdx].classList.remove('active');
    state.heroIdx = (state.heroIdx + 1) % count;
    slides[state.heroIdx].classList.add('visible'); slides[state.heroIdx].classList.remove('hidden');
    dots[state.heroIdx].classList.add('active');
  }, 3500);
}
function renderUpcomingEvents() {
  const el = document.getElementById('upcomingEvents');
  el.innerHTML = EVENTS.slice(0, 5).map(ev => `
    <div class="event-card-h" onclick="openEventDetail(${ev.id})">
      <div class="img-wrap">
        <img src="${ev.img}" alt="${ev.name}" loading="lazy"/>
        <span class="card-tag">${ev.tag}</span>
      </div>
      <div class="card-body">
        <div class="card-name">${ev.name}</div>
        <div class="card-meta-row"><span>${ev.date}</span>${ev.prize ? `<span>${ev.prize}</span>` : ''}</div>
      </div>
    </div>`).join('');
}
function renderFeaturedClubs() {
  const el = document.getElementById('featuredClubs');
  el.innerHTML = CLUBS.slice(0, 5).map(cl => `
    <div class="club-card-h" onclick="navigateToClubRecruitment('${cl.name.replace(/'/g, "\\'")}')">
      <div class="club-emoji">${cl.emoji}</div>
      <div class="card-name">${cl.name}</div>
      <div class="card-members">${cl.members} members</div>
    </div>`).join('');
}
function renderHomePositions() {
  const el = document.getElementById('homePositions');
  el.innerHTML = POSITIONS.slice(0, 3).map(p => `
    <div class="event-card-h" onclick="navigate('recruitment')" style="width:220px">
      <div class="card-body" style="padding:14px">
        <div class="card-name">${p.pos}</div>
        <div class="card-meta-row"><span>${p.club}</span></div>
        <div class="card-meta-row" style="margin-top:6px"><span class="recruit-tag">${p.type}</span></div>
      </div>
    </div>`).join('');
}

// ===== EXPLORE PAGE =====
function switchExploreTab(tab) {
  state.exploreTab = tab;
  document.querySelectorAll('.explore-tab[id^="tab-"]').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  renderExplore();
}
function renderExplore() {
  const q = (document.getElementById('exploreSearch')?.value || '').toLowerCase();
  const cats = state.selectedCategories;
  const el = document.getElementById('exploreContent');
  if (state.exploreTab === 'events') {
    let evs = EVENTS.filter(e => {
      const matchQ = !q || e.name.toLowerCase().includes(q) || e.club.toLowerCase().includes(q);
      const matchCat = !cats.length || cats.includes(e.category);
      return matchQ && matchCat;
    });
    el.innerHTML = evs.length ? evs.map(ev => renderEventCardFull(ev)).join('') : '<div class="empty-state"><div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="40" height="40" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div><div class="empty-title">No events found</div><div class="empty-sub">Try a different search or filter</div></div>';
  } else if (state.exploreTab === 'clubs') {
    let cls = CLUBS.filter(c => {
      const matchQ = !q || c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
      const matchCat = !cats.length || cats.some(cat => c.category.toLowerCase().includes(cat));
      return matchQ && matchCat;
    });
    el.innerHTML = cls.length ? cls.map(cl => renderClubCardFull(cl)).join('') : '<div class="empty-state"><div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="40" height="40" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div><div class="empty-title">No clubs found</div></div>';
  } else {
    renderRecruitment();
    return;
  }
}
function renderEventCardFull(ev) {
  const tagClass = { technical: 'tag-technical', social: 'tag-social', sports: 'tag-sports', cultural: 'tag-cultural' }[ev.category] || 'tag-social';
  const isPaid = ev.paid && ev.price > 0;
  return `<div class="event-card-full">
    <div class="img-wrap" onclick="openEventDetail(${ev.id})">
      <img src="${ev.img}" alt="${ev.name}" loading="lazy"/>
      <div class="img-overlay"></div>
      <div class="img-tags">
        <span class="img-tag ${tagClass}">${ev.tag}</span>
        ${isPaid ? `<span class="img-tag tag-paid">Paid</span>` : ''}
      </div>
      <div class="img-actions">
        <button class="img-action-btn" style="background:rgba(0,0,0,.4)" onclick="event.stopPropagation();showToast('Link copied!')"><svg viewBox="0 0 24 24" fill="none" stroke="white" width="14" height="14" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg></button>
        <button class="img-action-btn like-btn ${ev.saved ? 'liked' : ''}" style="background:${ev.saved ? '#e05555' : 'rgba(0,0,0,.4)'}" onclick="event.stopPropagation();toggleEventSaved(${ev.id},this)"><svg viewBox="0 0 24 24" fill="${ev.saved ? 'white' : 'none'}" stroke="white" width="14" height="14" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button>
      </div>
    </div>
    <div class="card-body" onclick="openEventDetail(${ev.id})">
      <div class="card-name">${ev.name}</div>
      <div class="card-meta-grid">
        <span class="card-meta-item">${ev.date}</span>
        <span class="card-meta-item">${ev.time}</span>
        <span class="card-meta-item">${ev.location}</span>
        <span class="card-meta-item">${ev.club}</span>
        ${ev.prize ? `<span class="prize-badge">${ev.prize}</span>` : ''}
        ${isPaid ? `<span class="prize-badge" style="border-color:#ef4444;color:#ef4444;background:rgba(239,68,68,0.1)">Rs ${ev.price}</span>` : ''}
      </div>
    </div>
    <div class="card-body" style="padding-top:0">
      <div class="card-actions-row">
        ${isPaid
      ? `<button class="btn-rsvp paid-event ${ev.rsvp ? 'registered' : ''}" id="rsvp-${ev.id}" onclick="${ev.rsvp ? `openQRModal(${ev.id})` : `openPayment(${ev.id})`}">${ev.rsvp ? 'View Ticket' : 'Buy Ticket'}</button>`
      : `<button class="btn-rsvp ${ev.rsvp ? 'registered' : ''}" id="rsvp-${ev.id}" onclick="rsvpEvent(${ev.id})">${ev.rsvp ? 'Booked' : 'Book'}</button>`}
      </div>
    </div>
  </div>`;
}
function renderClubCardFull(cl) {
  const role = state.profile.role || sessionStorage.getItem('unisync_role') || 'student';
  // Check if current user is the owner using the new mapped executiveId
  const storedUser = JSON.parse(sessionStorage.getItem('unisync_user') || '{}');
  const userId = storedUser.id;
  const isExecOwner = role === 'executive' && cl.executiveId === userId;
  const joinReqData = state.joinRequests[cl.id];
  const joinStatus = joinReqData?.status;
  let joinBtn = '';
  if (cl.joined) {
    joinBtn = `<button class="btn-join joined" id="join-${cl.id}" onclick="toggleJoin(${cl.id},this)">Joined</button>`;
  } else if (joinStatus === 'pending') {
    joinBtn = `<button class="btn-join" style="opacity:.6" disabled>Application Pending</button>`;
  } else if (joinStatus === 'interview') {
    joinBtn = `<button class="btn-join" style="opacity:.6;background:linear-gradient(135deg,#0d7a5b,#14a37c)" disabled>Interview Scheduled</button>`;
  } else {
    joinBtn = `<button class="btn-join" id="join-${cl.id}" onclick="navigateToClubRecruitment('${cl.name.replace(/'/g, "\\'").replace(/"/g, "&quot;")}')">See Positions</button>`;
  }
  return `<div class="club-card-full">
    <div class="club-card-full-header" onclick="openClubDetail(${cl.id})">
      <div class="club-icon-lg">${cl.photoUrl ? `<img src="${cl.photoUrl}" style="width:56px;height:56px;border-radius:12px;object-fit:cover"/>` : cl.emoji}</div>
      <div class="club-info">
        <div class="club-name-lg">${cl.name}</div>
        <div class="club-cat">${cl.category}</div>
      </div>
    </div>
    <div class="club-desc" onclick="openClubDetail(${cl.id})">${(cl.desc || '').slice(0, 100)}...</div>
    <div class="club-stats-row">
      <div class="club-stat"><strong>${cl.members}</strong> Members</div>
      <div class="club-stat"><strong>${cl.leadership.length}</strong> Leaders</div>
    </div>
    <div style="display:flex;gap:8px">
      ${isExecOwner
      ? `<button class="btn-join joined" onclick="openExecDashboard(${cl.id})">Manage Club</button>`
      : joinBtn}
      ${(cl.joined || isExecOwner) ? `<button class="chat-join-btn" onclick="openChat('${cl.chatId}','${cl.name}',${cl.members})">Chat</button>` : ''}
    </div>
  </div>`;
}

// ===== EVENT DETAIL =====
function openEventDetail(id) {
  const ev = EVENTS.find(e => e.id === id);
  if (!ev) return;
  state.currentEventId = id;
  fetch(`${API_BASE}/api/events/${id}/view`, { method: 'POST' }).then(() => {
    ev.viewCount = (ev.viewCount || 0) + 1;
  }).catch(() => {});
  const isPaid = ev.paid && ev.price > 0;
  const tagClass = { technical: 'tag-technical', social: 'tag-social', sports: 'tag-sports', cultural: 'tag-cultural' }[ev.category] || 'tag-social';
  document.getElementById('eventDetailContent').innerHTML = `
    <div class="detail-hero">
      <img src="${ev.img}" alt="${ev.name}"/>
      <div class="detail-hero-overlay"></div>
      <button class="detail-back" onclick="history.back?navigateBack():navigate('explore')">←</button>
      <button class="detail-save" onclick="toggleEventSaved(${ev.id},this)"><svg viewBox="0 0 24 24" fill="${ev.saved ? '#e05555' : 'none'}" stroke="${ev.saved ? '#e05555' : 'white'}" width="18" height="18" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button>
    </div>
    <div class="detail-body">
      <div class="detail-category"><span class="img-tag ${tagClass}" style="font-size:11px">${ev.tag}</span></div>
      <div class="detail-name">${ev.name}</div>
      <div class="detail-sub">by ${ev.club}</div>
      <div class="detail-meta-row">
        <span class="detail-meta-item">${ev.date}</span>
        <span class="detail-meta-item">${ev.time}</span>
        <span class="detail-meta-item">${ev.location}</span>
      </div>
      ${ev.prize ? `<div class="prize-highlight"><div class="prize-amount">${ev.prize}</div><div class="prize-label">Prize Money</div></div>` : ''}
      ${isPaid ? `<div class="prize-highlight" style="background:rgba(239,68,68,0.08);border-color:#ef4444"><div class="prize-amount" style="color:#ef4444">Rs ${ev.price}</div><div class="prize-label">Entry Fee</div></div>` : ''}
      <div class="detail-tabs">
        <button class="detail-tab active" onclick="switchDetailTab('about',this)">About</button>
        <button class="detail-tab" onclick="switchDetailTab('details',this)">Details</button>
        <button class="detail-tab" onclick="switchDetailTab('reviews',this)">Reviews</button>
      </div>
      <div id="detail-about" class="detail-tab-content active">
        <div class="detail-section"><div class="detail-section-title">About</div><div class="detail-desc">${ev.desc}</div></div>
        <div class="detail-section"><div class="detail-section-title">When &amp; Where</div>
          <div class="detail-desc">${ev.date}<br>${ev.time}<br>${ev.location}</div></div>
      </div>
      <div id="detail-details" class="detail-tab-content">
        <div class="detail-section"><div class="detail-section-title">Organizer</div><div class="detail-desc">${ev.club}</div></div>
        <div class="detail-section"><div class="detail-section-title">Category</div><div class="detail-desc">${ev.tag}</div></div>
        ${isPaid ? `<div class="detail-section"><div class="detail-section-title">Entry Fee</div><div class="detail-desc">Rs ${ev.price} per person</div></div>` : '<div class="detail-section"><div class="detail-section-title">Entry</div><div class="detail-desc">Free — Booking required</div></div>'}
      </div>
      <div id="detail-reviews" class="detail-tab-content">
        ${ev.reviews.length ? ev.reviews.map(r => `<div class="review-item"><div class="stars">${'<svg viewBox="0 0 24 24" fill="var(--gold)" width="14" height="14"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'.repeat(r.stars)}</div><div class="review-author">${r.author}</div><div class="review-text">${r.text}</div></div>`).join('') : '<div class="empty-state"><div class="empty-title">No reviews yet</div></div>'}
      </div>
      <div class="detail-cta">
        <div class="detail-cta-row">
          ${isPaid
      ? `<button class="btn-primary" id="cta-${ev.id}" onclick="${ev.rsvp ? `openQRModal(${ev.id})` : `openPayment(${ev.id})`}">${ev.rsvp ? 'View Ticket' : 'Buy Ticket'}</button>`
      : `<button class="btn-primary ${ev.rsvp ? 'registered' : ''}" id="cta-${ev.id}" onclick="rsvpEvent(${ev.id})">${ev.rsvp ? 'Booked' : 'Book'}</button>`}
          <button class="chat-join-btn" onclick="showToast('Link copied!')">Share</button>
        </div>
      </div>
    </div>`;
  navigate('event-detail');
}
function switchDetailTab(tab, btn) {
  document.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.detail-tab-content').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('detail-' + tab)?.classList.add('active');
}
function navigateBack() {
  if (state.page === 'event-detail') navigate('explore');
  else if (state.page === 'club-detail') navigate('explore');
  else navigate('home');
}

// ===== RSVP =====
async function rsvpEvent(id) {
  const ev = EVENTS.find(e => e.id === id);
  if (!ev) return;
  try {
    const result = await apiPost('/api/user/rsvp', { eventId: id, paid: false });
    if (result && !result.error) {
      ev.rsvp = true;
      showToast('Registered successfully');
      document.querySelectorAll(`#rsvp-${id},#cta-${id}`).forEach(b => {
        if (b) { b.textContent = 'Booked'; b.classList.add('registered'); }
      });
      renderProfile();
    } else {
      showToast(result?.error || 'Failed to register');
    }
  } catch (e) {
    // Optimistic update if offline
    ev.rsvp = true;
    showToast('Registered! (offline mode)');
  }
}

// ===== SAVED / FAVORITES =====
async function toggleEventSaved(id, btn) {
  const ev = EVENTS.find(e => e.id === id);
  if (!ev) return;
  ev.saved = !ev.saved; // optimistic
  if (btn) btn.innerHTML = ev.saved ? '<svg viewBox="0 0 24 24" fill="#e05555" stroke="#e05555" width="16" height="16" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="white" width="16" height="16" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
  showToast(ev.saved ? 'Saved to favorites' : 'Removed from favorites');
  try {
    await apiPost('/api/user/save-event', { eventId: id });
  } catch (e) { /* already updated optimistically */ }
}
async function toggleJoin(id, btn) {
  const cl = CLUBS.find(c => c.id === id);
  if (!cl) return;
  cl.joined = !cl.joined; // optimistic
  showToast(cl.joined ? `Joined ${cl.name}` : `Left ${cl.name}`);
  if (btn) { btn.textContent = cl.joined ? 'Joined' : 'Join'; btn.classList.toggle('joined', cl.joined); }
  if (state.page === 'profile') renderProfile();
  try {
    await apiPost('/api/user/join-club', { clubId: id });
  } catch (e) { /* optimistic */ }
}

// ===== FAVORITES PAGE =====
function switchFavTab(tab) {
  state.favTab = tab;
  document.querySelectorAll('[id^="fav-tab-"]').forEach(t => t.classList.remove('active'));
  document.getElementById('fav-tab-' + tab).classList.add('active');
  renderFavorites();
}
function renderFavorites() {
  const el = document.getElementById('favContent');
  if (state.favTab === 'events') {
    const saved = EVENTS.filter(e => e.saved);
    el.innerHTML = saved.length ? saved.map(ev => renderEventCardFull(ev)).join('') : '<div class="empty-state"><div class="empty-title">No saved events</div><div class="empty-sub">Tap the heart on any event to save it</div></div>';
  } else if (state.favTab === 'clubs') {
    const joined = CLUBS.filter(c => c.joined);
    el.innerHTML = joined.length ? joined.map(cl => renderClubCardFull(cl)).join('') : '<div class="empty-state"><div class="empty-title">No joined clubs</div><div class="empty-sub">Join clubs to see them here</div></div>';
  } else {
    const ticketed = EVENTS.filter(e => e.rsvp && e.paid);
    el.innerHTML = ticketed.length ? ticketed.map(ev => `
      <div class="event-card-full">
        <div class="img-wrap" onclick="openQRModal(${ev.id})">
          <img src="${ev.img}" alt="${ev.name}"/>
          <div class="img-overlay"></div>
          <div class="img-tags"><span class="img-tag tag-paid">E-Ticket</span></div>
        </div>
        <div class="card-body" onclick="openQRModal(${ev.id})">
          <div class="card-name">${ev.name}</div>
          <div class="card-meta-grid">
            <span class="card-meta-item">${ev.date}</span>
            <span class="card-meta-item">${ev.time}</span>
          </div>
        </div>
        <div class="card-body" style="padding-top:0">
          <button class="btn-rsvp registered" onclick="openQRModal(${ev.id})">View Ticket</button>
        </div>
      </div>`).join('') : '<div class="empty-state"><div class="empty-title">No tickets yet</div><div class="empty-sub">Buy tickets for paid events to see them here</div></div>';
  }
}

// ===== CLUB DETAIL =====
function openJoinClubModal(id) {
  const cl = CLUBS.find(c => c.id === id);
  if (!cl) return;
  document.getElementById('applyTitle').textContent = `Join ${cl.name}`;
  document.getElementById('applyContent').innerHTML = `
    <div style="font-size:13px;color:var(--gray);margin-bottom:12px;">Please write a short paragraph on why you would be suitable for this club:</div>
    <div class="form-row"><textarea class="form-input" id="join_message" style="min-height:100px" placeholder="I am very passionate about..."></textarea></div>
    <button class="btn-primary" onclick="submitJoinClub(${id})" style="margin-top:8px">Submit Request</button>`;
  document.getElementById('applyModal').classList.add('open');
}

async function submitJoinClub(id) {
  const cl = CLUBS.find(c => c.id === id);
  const msg = document.getElementById('join_message')?.value.trim();
  if (!msg) { showToast('Please provide a reason'); return; }

  const btn = document.querySelector('.apply-modal .btn-primary');
  if (btn) { btn.textContent = 'Sending...'; btn.disabled = true; }
  try {
    const res = await apiPost('/api/user/request-join', { clubId: id, message: msg });
    if (res && !res.error) {
      state.joinRequests[id] = { status: 'pending', interviewMsg: '', requestId: null };
      showToast(`Join request sent to ${cl.name}`);
      closeApply();
      // Update UI button
      const detailBtn = document.getElementById(`join-detail-${id}`);
      if (detailBtn) { detailBtn.outerHTML = `<button class="btn-join" style="flex:1;opacity:.6" disabled>Request Pending</button>`; }
    } else {
      showToast(res?.error || 'Failed to send request');
      if (btn) { btn.textContent = 'Submit Request'; btn.disabled = false; }
    }
  } catch (e) {
    showToast('Failed to send request');
    if (btn) { btn.textContent = 'Submit Request'; btn.disabled = false; }
  }
}
function openClubDetail(id) {
  const cl = CLUBS.find(c => c.id === id);
  if (!cl) return;
  state.currentClubId = id;
  const clubEvents = EVENTS.filter(e => e.clubId === id);
  const role = state.profile.role || sessionStorage.getItem('unisync_role') || 'student';
  const storedUser = JSON.parse(sessionStorage.getItem('unisync_user') || '{}');
  const userId = storedUser.id;
  const isExecOwner = role === 'executive' && cl.executiveId === userId;
  const joinReqData = state.joinRequests[id];
  const joinStatus = joinReqData?.status;
  let actionBtn = '';
  if (isExecOwner) {
    actionBtn = `<button class="btn-join joined" onclick="openExecDashboard(${id})" style="flex:1">Manage Club</button>`;
  } else if (cl.joined) {
    actionBtn = `<button class="btn-join joined" id="join-detail-${id}" onclick="toggleJoin(${id},this)" style="flex:1">Joined</button>`;
  } else if (joinStatus === 'pending') {
    actionBtn = `<button class="btn-join" style="flex:1;opacity:.6" disabled>Application Pending</button>`;
  } else if (joinStatus === 'interview') {
    actionBtn = `<button class="btn-join" style="flex:1;opacity:.7;background:linear-gradient(135deg,#0d7a5b,#14a37c)" disabled>Interview Scheduled</button>`;
  } else {
    actionBtn = `<button class="btn-join" id="join-detail-${id}" onclick="navigateToClubRecruitment('${cl.name.replace(/'/g, "\\'").replace(/"/g, "&quot;")}')" style="flex:1">See Available Positions</button>`;
  }
  const heroImg = cl.photoUrl
    ? `<img src="${cl.photoUrl}" style="width:100%;height:200px;object-fit:cover"/>`
    : `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:80px">${cl.emoji}</div>`;
  document.getElementById('clubDetailContent').innerHTML = `
    <div class="detail-hero" style="height:200px;background:linear-gradient(135deg,var(--navy),#0d1a3a);">
      ${heroImg}
      <div class="detail-hero-overlay"></div>
      <button class="detail-back" onclick="navigateBack()">&#8592;</button>
      <button class="detail-save" onclick="toggleClubSaved(${cl.id},this)"><svg viewBox="0 0 24 24" fill="${cl.saved ? '#e05555' : 'none'}" stroke="${cl.saved ? '#e05555' : 'white'}" width="18" height="18" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button>
    </div>
    <div class="detail-body">
      <div class="detail-category">${cl.category}</div>
      <div class="detail-name">${cl.name}</div>
      <div class="detail-meta-row">
        <span class="detail-meta-item">${cl.members} Members</span>
        <span class="detail-meta-item">${cl.leadership.length} Leaders</span>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:20px">
        ${actionBtn}
        ${(cl.joined || isExecOwner) ? `<button class="chat-join-btn" onclick="openChat('${cl.chatId}','${cl.name}',${cl.members})">Chat</button>` : ''}
      </div>
      <div class="detail-tabs">
        <button class="detail-tab active" onclick="switchDetailTab('cabout',this)">About</button>
        <button class="detail-tab" onclick="switchDetailTab('cevents',this)">Events</button>
        <button class="detail-tab" onclick="switchDetailTab('cteam',this)">Team</button>
        <button class="detail-tab" onclick="switchDetailTab('cmembers',this);loadClubMembers(${id})">Members</button>
      </div>
      <div id="detail-cabout" class="detail-tab-content active">
        <div class="detail-section"><div class="detail-section-title">About</div><div class="detail-desc">${cl.desc || ''}</div></div>
        ${cl.accountNumber ? `<div class="detail-section"><div class="detail-section-title">Payment Details</div><div class="detail-desc"><strong>Account:</strong> ${cl.accountNumber}<br><strong>Name:</strong> ${cl.accountName || ''}<br><em>${cl.paymentInfo || ''}</em></div></div>` : ''}
        <div class="detail-section"><div class="detail-section-title">Announcements</div>
          ${(cl.announcements || []).map(a => `<div class="announce-card"><div class="announce-text">${a}</div></div>`).join('') || '<div style="color:var(--gray);font-size:13px">No announcements yet.</div>'}
        </div>
        ${cl.socials && (cl.socials.ig || cl.socials.linkedin) ? `<div class="detail-section"><div class="detail-section-title">Social</div>
          ${Object.entries(cl.socials).filter(([, v]) => v).map(([k, v]) => `<span class="chip gold-chip">${k === 'ig' ? 'Instagram' : 'LinkedIn'}: ${v}</span>`).join('')}
        </div>` : ''}
      </div>
      <div id="detail-cevents" class="detail-tab-content">
        ${clubEvents.length ? clubEvents.map(ev => `
          <div class="event-card-full" style="margin-bottom:14px" onclick="openEventDetail(${ev.id})">
            <div class="img-wrap"><img src="${ev.img}" alt="${ev.name}" style="height:120px"/><div class="img-overlay"></div></div>
            <div class="card-body"><div class="card-name">${ev.name}</div><div class="card-meta-grid"><span class="card-meta-item">${ev.date}</span></div></div>
          </div>`).join('') : '<div class="empty-state"><div class="empty-title">No events yet</div></div>'}
      </div>
      <div id="detail-cteam" class="detail-tab-content">
        ${(cl.leadership || []).map(l => `<div class="leader-card"><img src="${l.img || getAvatarUrl('', l.name, '', 60)}" class="leader-avatar" alt="${l.name}"/><div><div class="leader-name">${l.name}</div><div class="leader-role">${l.role}</div></div></div>`).join('')}
      </div>
      <div id="detail-cmembers" class="detail-tab-content">
        <div id="clubMembersList" style="padding:10px 0"><div style="color:var(--gray);font-size:13px;padding:10px">Loading members...</div></div>
      </div>
    </div>`;
  navigate('club-detail');
}
async function loadClubMembers(clubId) {
  const el = document.getElementById('clubMembersList');
  if (!el) return;
  try {
    const data = await apiGet(`/api/clubs/${clubId}/members`);
    if (!data || data.error || !data.length) {
      el.innerHTML = '<div style="color:var(--gray);font-size:13px;padding:10px">No members found.</div>'; return;
    }
    el.innerHTML = data.map(m => {
      const u = m.users || {};
      const av = getAvatarUrl(u.avatar_url, u.first_name, u.last_name, 60);
      return `<div class="leader-card" onclick="openUserProfile('${u.id}')" style="cursor:pointer">
        <img src="${av}" class="leader-avatar" style="width:44px;height:44px;border-radius:50%;object-fit:cover" alt="${u.first_name}"/>
        <div>
          <div class="leader-name">${u.first_name} ${u.last_name}</div>
          <div class="leader-role">${u.department || ''} ${u.year ? '· Year ' + u.year : ''}</div>
        </div>
        <div style="margin-left:auto;font-size:11px;color:var(--gold);">View →</div>
      </div>`;
    }).join('');
  } catch (e) {
    el.innerHTML = '<div style="color:var(--gray);font-size:13px;padding:10px">Failed to load members.</div>';
  }
}
async function openUserProfile(userId) {
  try {
    const u = await apiGet(`/api/user/${userId}/public`);
    if (!u || u.error) { showToast('Could not load profile'); return; }
    const av = getAvatarUrl(u.avatar_url, u.first_name, u.last_name, 200);
    document.getElementById('applyContent').innerHTML = `
      <div style="text-align:center;padding-bottom:16px">
        <img src="${av}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid var(--gold);margin-bottom:10px"/>
        <div style="font-size:18px;font-weight:700">${u.first_name} ${u.last_name}</div>
        <div style="font-size:12px;color:var(--gold);font-weight:600;margin-top:2px">${u.role === 'executive' ? 'Executive' : 'Student'}</div>
      </div>
      <div style="font-size:12px;color:var(--gray);margin-bottom:6px">${u.program || ''} ${u.year ? '· Year ' + u.year : ''} · ${u.university || ''}</div>
      <div style="font-size:13px;color:var(--gray);margin-bottom:12px">${u.bio || 'No bio yet.'}</div>
      ${u.department ? `<div style="font-size:12px;margin-bottom:6px"><strong>Department:</strong> ${u.department}</div>` : ''}
      ${u.email ? `<div style="font-size:12px;margin-bottom:6px"><strong>Email:</strong> ${u.email}</div>` : ''}
      ${u.linkedin ? `<div style="font-size:12px;margin-bottom:6px"><a href="${u.linkedin}" target="_blank" style="color:var(--gold)">${u.linkedin}</a></div>` : ''}
      ${(u.interests || []).length ? `<div style="margin-top:8px">${u.interests.map(i => `<span class="chip">${i}</span>`).join('')}</div>` : ''}`;
    document.getElementById('applyTitle').textContent = `${u.first_name}'s Profile`;
    document.getElementById('applyModal').classList.add('open');
  } catch (e) { showToast('Could not load profile'); }
}
function toggleClubSaved(id, btn) {
  const cl = CLUBS.find(c => c.id === id);
  if (!cl) return;
  cl.saved = !cl.saved;
  showToast(cl.saved ? 'Saved!' : 'Removed');
  if (btn) btn.innerHTML = cl.saved ? '<svg viewBox="0 0 24 24" fill="#e05555" stroke="#e05555" width="18" height="18" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="white" width="18" height="18" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
}

// Navigate to recruitment portal pre-filtered by club name
function navigateToClubRecruitment(clubName) {
  const el = document.getElementById('recruitSearch');
  if (el) el.value = clubName;
  switchRecTab('open');
  navigate('recruitment');
}

function switchRecTab(tab) {
  state.recTab = tab;
  document.querySelectorAll('[id^="rec-tab-"]').forEach(t => t.classList.remove('active'));
  document.getElementById('rec-tab-' + tab).classList.add('active');
  renderRecruitment();
}
function renderRecruitment() {
  if (state.exploreTab === 'recruitment') {
    const el = document.getElementById('exploreContent');
    const q = (document.getElementById('exploreSearch')?.value || '').toLowerCase();
    el.innerHTML = POSITIONS.map(p => renderRecruitCard(p, q)).join('');
    return;
  }
  const el = document.getElementById('recruitmentContent');
  if (!el) return;
  const q = (document.getElementById('recruitSearch')?.value || '').toLowerCase();
  if (state.recTab === 'open') {
    const filtered = POSITIONS.filter(p => !q || p.pos.toLowerCase().includes(q) || p.club.toLowerCase().includes(q));
    el.innerHTML = filtered.length ? filtered.map(p => renderRecruitCard(p, q)).join('') : '<div class="empty-state"><div class="empty-title">No positions found</div></div>';
  } else {
    const applied = POSITIONS.filter(p => state.applications[p.id]);
    el.innerHTML = applied.length ? applied.map(p => renderAppStatus(p)).join('') : '<div class="empty-state"><div class="empty-title">No applications yet</div><div class="empty-sub">Apply for open positions to track your status</div></div>';
  }
}
function renderRecruitCard(p) {
  const appData = state.applications[p.id];
  const appStatus = typeof appData === 'object' ? appData.status : appData;
  return `<div class="recruit-card" onclick="openPositionDetail(${p.id})" style="cursor:pointer">
    <div class="recruit-header">
      <div><div class="recruit-pos">${p.pos}</div><div class="recruit-club">${p.club}</div></div>
      <span class="recruit-badge badge-open">Open</span>
    </div>
    <div class="recruit-desc">${(p.desc || '').slice(0, 120)}...</div>
    <div class="recruit-meta">
      <span class="recruit-tag">${p.type}</span>
      <span class="recruit-tag">Deadline: ${p.deadline}</span>
    </div>
    ${(p.requirements || []).slice(0, 2).map(r => `<span class="chip">${r}</span>`).join('')}
    <div style="margin-top:12px" onclick="event.stopPropagation()">
      ${appStatus
      ? `<button class="btn-apply applied-btn">Applied — ${appStatus === 'Final Decision' ? 'Approved' : appStatus}</button>`
      : `<button class="btn-apply" onclick="openPositionDetail(${p.id})">View Details →</button>`}
    </div>
  </div>`;
}

function openPositionDetail(posId) {
  const p = POSITIONS.find(x => x.id === posId);
  if (!p) return;
  const appData = state.applications[p.id];
  const appStatus = typeof appData === 'object' ? appData.status : appData;
  document.getElementById('applyTitle').textContent = p.pos;
  document.getElementById('applyContent').innerHTML = `
    <div style="background:rgba(201,162,39,0.08);border:1px solid rgba(201,162,39,0.2);border-radius:12px;padding:14px;margin-bottom:14px">
      <div style="font-size:16px;font-weight:700;margin-bottom:4px">${p.pos}</div>
      <div style="font-size:13px;color:var(--gold);margin-bottom:10px">${p.club}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
        <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:8px">
          <div style="font-size:10px;color:var(--gray);margin-bottom:2px">TYPE</div>
          <div style="font-size:13px;font-weight:600">${p.type}</div>
        </div>
        <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:8px">
          <div style="font-size:10px;color:var(--gray);margin-bottom:2px">DEADLINE</div>
          <div style="font-size:13px;font-weight:600;color:#e05555">${p.deadline}</div>
        </div>
      </div>
    </div>
    ${p.desc ? `<div style="margin-bottom:14px">
      <div style="font-size:11px;color:var(--gold);font-weight:700;margin-bottom:6px;letter-spacing:.5px">ABOUT THIS ROLE</div>
      <div style="font-size:13px;line-height:1.7;color:rgba(255,255,255,0.85)">${p.desc}</div>
    </div>` : ''}
    ${(p.requirements || []).length ? `<div style="margin-bottom:16px">
      <div style="font-size:11px;color:var(--gold);font-weight:700;margin-bottom:8px;letter-spacing:.5px">REQUIREMENTS</div>
      <div>${p.requirements.map(r => `<span class="chip" style="margin-bottom:4px">${r}</span>`).join('')}</div>
    </div>` : ''}
    <div style="margin-top:8px">
      ${appStatus
      ? `<button class="btn-apply applied-btn" style="width:100%;padding:12px">Applied — ${appStatus}</button>`
      : `<button class="btn-primary" style="width:100%" onclick="closeApply();setTimeout(()=>openApply(${posId}),80)">Apply for this Position →</button>`}
    </div>`;
  document.getElementById('applyModal').classList.add('open');
}
function renderAppStatus(p) {
  const appData = state.applications[p.id];
  const status = (typeof appData === 'object' ? appData.status : appData) || 'Submitted';
  const iMsg = typeof appData === 'object' ? (appData.interviewMsg || '') : '';
  const steps = ['Submitted', 'Under Review', 'Shortlisted', 'Interview', 'Approved'];
  // Map DB status to pipeline step
  const statusToStep = { 'Submitted': 0, 'Under Review': 1, 'Shortlisted': 2, 'Interview': 3, 'Final Decision': 4, 'Approved': 4, 'Rejected': 4 };
  const stepIdx = statusToStep[status] ?? 0;
  const dispLabel = status === 'Final Decision' ? 'Approved' : status === 'Rejected' ? 'Rejected' : status;
  const badgeClass = status === 'Final Decision' ? 'badge-accepted' : status === 'Rejected' ? 'badge-rejected' : 'badge-applied';
  return `<div class="app-status-card">
    <div class="app-status-header"><div><div class="recruit-pos">${p.pos}</div><div class="recruit-club">${p.club}</div></div><span class="recruit-badge ${badgeClass}">${dispLabel}</span></div>
    <div class="status-steps">
      ${steps.map((s, i) => `
        <div class="status-step ${i < stepIdx ? 'done' : i === stepIdx ? 'active' : ''}">
          <div class="status-step-dot">${i < stepIdx ? '✓' : i + 1}</div>
          <div class="status-step-label">${s}</div>
        </div>
        ${i < steps.length - 1 ? `<div class="status-line ${i < stepIdx ? 'done' : ''}"></div>` : ''}`).join('')}
    </div>
    ${status === 'Interview' && iMsg ? `
      <button onclick="openInterviewDetails('${encodeURIComponent(iMsg)}')" style="margin-top:10px;width:100%;background:linear-gradient(135deg,#0d7a5b,#14a37c);border:none;color:white;border-radius:10px;padding:8px 0;font-size:13px;font-weight:600;cursor:pointer">
        View Interview Details
      </button>` : ''}
    ${status === 'Final Decision' ? `
      <div style="margin-top:10px;padding:10px;background:rgba(76,175,130,0.1);border:1px solid rgba(76,175,130,0.3);border-radius:10px;text-align:center;font-size:13px;color:#4caf82;font-weight:600">
        Congratulations! You have been accepted.
      </div>` : ''}
  </div>`;
}

// ===== JOIN REQUEST TRACKER (student view) =====
function renderJoinRequestTracker(clubId) {
  const cl = CLUBS.find(c => c.id === clubId);
  const reqData = state.joinRequests[clubId];
  if (!reqData) return '';
  const status = reqData.status;
  const interviewMsg = reqData.interviewMsg || '';
  const steps = ['Submitted', 'Interview', 'Decision'];
  // Map status to step index
  const stepMap = { pending: 0, interview: 1, accepted: 2, rejected: 2 };
  const stepIdx = stepMap[status] ?? 0;
  const statusLabel = status === 'accepted' ? 'Accepted' : status === 'rejected' ? 'Rejected' : status === 'interview' ? 'Interview' : 'Pending';
  const badgeColor = status === 'accepted' ? '#4caf82' : status === 'rejected' ? '#e05555' : status === 'interview' ? '#14a37c' : 'var(--gold)';
  return `<div class="app-status-card">
    <div class="app-status-header">
      <div>
        <div class="recruit-pos">${cl?.name || 'Club'}</div>
        <div class="recruit-club">${cl?.category || ''}</div>
      </div>
      <span class="recruit-badge" style="background:${badgeColor}20;color:${badgeColor};border-color:${badgeColor}">${statusLabel}</span>
    </div>
    <div class="status-steps">
      ${steps.map((s, i) => `
        <div class="status-step ${i < stepIdx ? 'done' : i === stepIdx ? 'active' : ''}">
          <div class="status-step-dot">${i < stepIdx ? '✓' : i + 1}</div>
          <div class="status-step-label">${s}</div>
        </div>
        ${i < steps.length - 1 ? `<div class="status-line ${i < stepIdx ? 'done' : ''}"></div>` : ''}
      `).join('')}
    </div>
    ${status === 'interview' && interviewMsg ? `
      <button onclick="openInterviewDetails('${encodeURIComponent(interviewMsg)}')" style="margin-top:10px;width:100%;background:linear-gradient(135deg,#0d7a5b,#14a37c);border:none;color:white;border-radius:10px;padding:8px 0;font-size:13px;font-weight:600;cursor:pointer">
        View Interview Details
      </button>` : ''}
  </div>`;
}

function openInterviewDetails(encodedMsg) {
  const msg = decodeURIComponent(encodedMsg);
  document.getElementById('applyTitle').textContent = 'Your Interview Details';
  document.getElementById('applyContent').innerHTML = `
    <div style="background:rgba(13,122,91,0.08);border:1px solid rgba(13,122,91,0.4);border-radius:12px;padding:16px;margin-bottom:12px">
      <div style="font-size:11px;color:#4caf82;font-weight:700;margin-bottom:8px;letter-spacing:0.5px">INTERVIEW SCHEDULE</div>
      <div style="font-size:14px;line-height:1.6;color:rgba(255,255,255,0.9)">${msg.replace(/\n/g, '<br/>')}</div>
    </div>
    <div style="font-size:11px;color:var(--gray);text-align:center">Sent by your club executive. Good luck!</div>`;
  document.getElementById('applyModal').classList.add('open');
}

// ===== APPLY MODAL =====
function openApply(posId) {
  const p = POSITIONS.find(x => x.id === posId);
  if (!p) return;
  document.getElementById('applyTitle').textContent = `Apply: ${p.pos}`;
  document.getElementById('applyContent').innerHTML = `
    <div class="apply-pos-info">
      <div class="apply-pos-name">${p.pos}</div>
      <div class="apply-club-name">${p.club} · ${p.type}</div>
    </div>
    <div class="apply-step">
      <div class="apply-step-title">Why do you think you'd be a good fit for this position?</div>
      <textarea class="form-input" id="applyWhy" style="min-height:120px" placeholder="Tell us in a few sentences why you'd be a great addition to this role..."></textarea>
    </div>
    ${(p.requirements || []).length ? `<div style="margin-top:6px;margin-bottom:14px;font-size:12px;color:var(--gray)">Requirements: ${p.requirements.join(' · ')}</div>` : '<div style="margin-bottom:14px"></div>'}
    <button class="btn-primary" onclick="submitApplication(${posId})">Submit Application</button>`;
  document.getElementById('applyModal').classList.add('open');
}
function closeApply() { document.getElementById('applyModal').classList.remove('open'); }
async function submitApplication(posId) {
  const why = document.getElementById('applyWhy')?.value.trim() || '';
  if (!why) { showToast('Please tell us why you\'d be a good fit'); return; }
  closeApply();
  try {
    const res = await apiPost('/api/user/apply', { positionId: posId, why });
    if (res && !res.error) {
      state.applications[posId] = 'Under Review';
      showToast('Application submitted');
    } else {
      state.applications[posId] = 'Under Review'; // optimistic
      showToast(res?.error || 'Application submitted (offline)!');
    }
  } catch (e) {
    state.applications[posId] = 'Under Review';
    showToast('Application submitted');
  }
  renderProfile();
  renderRecruitment();
}

// ===== PAYMENT MODAL =====
function openPayment(eventId) {
  const ev = EVENTS.find(e => e.id === eventId);
  if (!ev) return;
  state.paymentEventId = eventId;
  state.paymentMethod = 'card';
  document.getElementById('paymentContent').innerHTML = `
    <div class="payment-event-info">
      <img class="pay-event-img" src="${ev.img}" alt="${ev.name}"/>
      <div><div class="pay-event-name">${ev.name}</div><div style="font-size:12px;color:var(--gray);margin-top:2px">${ev.date} · ${ev.location.split(',')[0]}</div><div class="pay-event-price">Rs ${ev.price}</div></div>
    </div>
    <div class="payment-methods">
      <div class="pay-method-title">Select Payment Method</div>
      <div class="pay-method-list">
        ${[
      { key: 'card', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20" stroke-width="1.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>', name: 'Credit / Debit Card', desc: 'Visa, Mastercard, UnionPay' },
      { key: 'easypaisa', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20" stroke-width="1.5"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>', name: 'Easypaisa', desc: 'Mobile wallet' },
      { key: 'jazzcash', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20" stroke-width="1.5"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>', name: 'JazzCash', desc: 'Mobile wallet' },
      { key: 'cash', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20" stroke-width="1.5"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg>', name: 'Cash on Arrival', desc: 'Pay at the gate (not recommended)' },
    ].map(m => `
          <div class="pay-method-item ${state.paymentMethod === m.key ? 'selected' : ''}" onclick="selectPayMethod('${m.key}')">
            <span class="pay-icon">${m.icon}</span>
            <div><div class="pay-name">${m.name}</div><div class="pay-desc">${m.desc}</div></div>
            <div class="pay-radio"></div>
          </div>`).join('')}
      </div>
    </div>
    <div class="card-form" id="cardForm">
      <div class="card-form-title">Card Details</div>
      <div class="form-row"><label class="form-label">Card Number</label><input class="form-input" placeholder="1234 5678 9012 3456" maxlength="19"/></div>
      <div class="form-row-2">
        <div class="form-row"><label class="form-label">Expiry</label><input class="form-input" placeholder="MM/YY" maxlength="5"/></div>
        <div class="form-row"><label class="form-label">CVV</label><input class="form-input" placeholder="123" maxlength="3" type="password"/></div>
      </div>
      <div class="form-row"><label class="form-label">Cardholder Name</label><input class="form-input" placeholder="Your name"/></div>
    </div>
    <button class="btn-primary" onclick="processPayment()">Pay Rs ${ev.price} →</button>`;
  document.getElementById('paymentModal').classList.add('open');
}
function selectPayMethod(method) {
  state.paymentMethod = method;
  document.querySelectorAll('.pay-method-item').forEach(el => el.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
  event.currentTarget.querySelector('.pay-radio').style.background = 'var(--gold)';
  document.getElementById('cardForm').style.display = method === 'card' ? 'block' : 'none';
}
function closePayment() { document.getElementById('paymentModal').classList.remove('open'); }
async function processPayment() {
  const ev = EVENTS.find(e => e.id === state.paymentEventId);
  if (!ev) return;
  closePayment();
  try {
    await apiPost('/api/user/rsvp', { eventId: ev.id, paid: true });
  } catch (e) { }
  ev.rsvp = true;
  showToast('Payment successful! Generating ticket...');
  setTimeout(() => {
    openQRModal(ev.id);
    sendTicketEmail(ev);
  }, 600);
  renderProfile();
}

async function sendTicketEmail(ev) {
  try {
    const sessionEmail = sessionStorage.getItem('unisync_email');
    const userEmail = sessionEmail || state.profile?.email || 'i242539@isb.nu.edu.pk';

    let userName = `${state.profile?.firstName || 'UniSync'} ${state.profile?.lastName || 'User'}`;
    const sessionUserStr = sessionStorage.getItem('unisync_user');
    if (sessionUserStr) {
      try {
        const u = JSON.parse(sessionUserStr);
        if (u.firstName) userName = `${u.firstName} ${u.lastName || ''}`;
      } catch (e) { }
    }

    const ticketId = 'US-' + String(ev.id).padStart(3, '0') + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    
    // Generate QR Code URL dynamically for the email
    const qrData = encodeURIComponent(`UNISYNC|${ticketId}|${ev.name}|${userName}`);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${qrData}&bgcolor=ffffff&color=0a0a0f&margin=6`;

    const ticketHtml = `
<div style="font-family: 'Arial Black', Arial, sans-serif; background-color: #1A1A24; padding: 40px 10px; text-align: center;">
  <table cellpadding="0" cellspacing="0" style="margin: 0 auto; width: 100%; max-width: 600px; background: linear-gradient(135deg, #EFEBE3 0%, #D5CBB8 100%); border: 8px solid #D35400; border-radius: 16px; border-collapse: collapse; box-shadow: 0 15px 35px rgba(201,162,39,0.3), inset 0 0 15px rgba(0,0,0,0.2);">
    <tr>
      <td style="padding: 20px; border-right: 3px dashed #D35400; width: 70%; vertical-align: top;">
        <table cellpadding="0" cellspacing="0" style="width: 100%;">
          <tr>
            <td style="width: 70px; vertical-align: top;">
              <div style="background-color: #1A1A24; border-radius: 12px; padding: 5px; width: 60px; height: 60px; text-align: center; display: table;">
                <div style="display: table-cell; vertical-align: middle; color: #C9A227; font-size: 10px; font-weight: 900; letter-spacing: 1px;">UNI<br/>SYNC</div>
              </div>
            </td>
            <td style="text-align: right; vertical-align: middle;">
              <h1 style="margin: 0; font-size: 26px; text-transform: uppercase; font-weight: 900; color: #D35400; line-height: 1.1;">${ev.name}</h1>
              <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: 900; letter-spacing: 4px; color: #000;">TICKET</p>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top: 20px;">
              <div style="background-color: #1A1A24; color: #fff; padding: 12px; text-align: center; text-transform: uppercase; letter-spacing: 2px; font-size: 16px; border-radius: 4px;">
                ${userName}
              </div>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top: 20px;">
              <table cellpadding="0" cellspacing="0" style="width: 100%; text-align: center;">
                <tr>
                  <td style="border-right: 1px solid #ccc; width: 33%;">
                    <div style="font-size: 11px; color: #777; letter-spacing: 1px; text-transform: uppercase;">DATE</div>
                    <div style="font-size: 14px; font-weight: bold; color: #000; margin-top: 5px;">${ev.date}</div>
                  </td>
                  <td style="border-right: 1px solid #ccc; width: 33%;">
                    <div style="font-size: 11px; color: #777; letter-spacing: 1px; text-transform: uppercase;">TIME</div>
                    <div style="font-size: 14px; font-weight: bold; color: #000; margin-top: 5px;">${ev.time.split(' ')[0]}</div>
                  </td>
                  <td style="width: 33%;">
                    <div style="font-size: 11px; color: #777; letter-spacing: 1px; text-transform: uppercase;">VENUE</div>
                    <div style="font-size: 14px; font-weight: bold; color: #000; margin-top: 5px;">${ev.location}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
      <td style="padding: 20px 10px; width: 30%; text-align: center; vertical-align: middle;">
        <img src="${qrUrl}" alt="QR Ticket" style="width: 100px; height: 100px; border: 3px solid #1A1A24; padding: 4px; background: #fff; border-radius: 8px;" />
        <div style="margin-top: 15px; font-size: 14px; font-weight: 900; color: #D35400; letter-spacing: 2px;">ADMIT ONE</div>
        <div style="margin-top: 5px; font-size: 12px; color: #555; letter-spacing: 1px;">No. ${ticketId.split('-')[2] || ticketId}</div>
      </td>
    </tr>
  </table>
</div>
`;

    const templateParams = {
      to_email: userEmail,
      email: userEmail,
      user_email: userEmail,
      reply_to: userEmail,
      to_name: userName,
      event_name: ev.name,
      event_date: ev.date,
      event_time: ev.time,
      event_venue: ev.location,
      ticket_id: ticketId,
      organizer: ev.club,
      ticket_price: ev.paid ? `Rs ${ev.price}` : 'Free',
      qr_url: qrUrl,
      ticket_html: ticketHtml
    };
    if (typeof emailjs !== 'undefined') {
      await emailjs.send('service_zwhe6qr', 'template_3a13chp', templateParams, 'YYMG77F1uSLFcnwbZ');
      showToast(`✓ Ticket confirmation sent to ${userEmail}`);
    } else {
      console.warn('EmailJS not loaded');
      showToast('Ticket ready! (email service not loaded)');
    }
  } catch (err) {
    console.error('Email send failed:', err);
    const errMsg = err?.text || err?.message || 'unknown error';
    showToast(`Email failed: ${errMsg}`);
  }
}

// Send a test ticket email immediately — call from browser console: sendTestTicket()
async function sendTestTicket() {
  const testEv = {
    id: 99, name: 'FAST Hackathon 2026', date: 'Mar 25, 2026',
    time: '9:00 AM – 9:00 PM', location: 'CS Block, FAST NUCES',
    club: 'CS Society', paid: true, price: 500
  };
  await sendTicketEmail(testEv);
}


// ===== QR TICKET MODAL (using qrserver.com API for reliable QR generation) =====
function openQRModal(eventId) {
  const ev = EVENTS.find(e => e.id === eventId);
  if (!ev) return;
  const ticketId = 'US-' + String(eventId).padStart(3, '0') + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  const qrData = encodeURIComponent(`UNISYNC|${ticketId}|${ev.name}|${state.profile.firstName} ${state.profile.lastName}`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${qrData}&bgcolor=ffffff&color=0a0a0f&margin=6`;
  document.getElementById('qrContent').innerHTML = `
    <div class="ticket-card">
      <div class="ticket-event-name">${ev.name}</div>
      <div class="ticket-holder">Ticket Holder: ${state.profile.firstName} ${state.profile.lastName}</div>
      <div class="qr-container">
        <img src="${qrUrl}" width="156" height="156" alt="QR Code" style="border-radius:8px;display:block"
          onerror="this.outerHTML='<div style=\'width:156px;height:156px;background:#fff;border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:11px;color:#000;word-break:break-all;padding:10px\'>${ticketId}</div>'"/>
      </div>
      <hr class="ticket-divider"/>
      <div class="ticket-meta">
        <div class="ticket-meta-item"><div class="ticket-meta-label">Date</div><div class="ticket-meta-val">${ev.date}</div></div>
        <div class="ticket-meta-item"><div class="ticket-meta-label">Time</div><div class="ticket-meta-val">${ev.time.split('–')[0].trim()}</div></div>
        <div class="ticket-meta-item"><div class="ticket-meta-label">Venue</div><div class="ticket-meta-val">${ev.location.split(',')[0]}</div></div>
      </div>
      <hr class="ticket-divider"/>
    <div class="ticket-id">${ticketId}</div>
    </div>
    <button class="btn-outline" onclick="showToast('Ticket shared!')">Share Ticket</button>`;
  document.getElementById('qrModal').classList.add('open');
}
function closeQR() { document.getElementById('qrModal').classList.remove('open'); }


// ===== CHAT =====
async function openChat(chatId, name, members) {
  state.chatOpen = chatId;
  document.getElementById('chatModalTitle').textContent = name;
  document.getElementById('chatMemberCount').textContent = members + ' members';
  
  // 1. Open modal INSTANTLY
  const modal = document.getElementById('chatModal');
  modal.classList.add('open');
  
  // 2. Render cached messages immediately if they exist
  renderChatMessages(chatId);
  
  // 3. Start background polling/realtime
  startChatPolling(chatId);

  // 4. Fetch latest from API without blocking the UI
  try {
    const user = JSON.parse(sessionStorage.getItem('unisync_user') || '{}');
    const myName = ((user.firstName || '') + ' ' + (user.lastName || '')).trim();
    
    const res = await fetch(`${API_BASE}/api/chat/${chatId}`);
    const msgs = await res.json();
    if (Array.isArray(msgs)) {
      CHAT_MESSAGES[chatId] = msgs.map(m => ({
        sender: m.sender,
        text: m.text,
        time: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        mine: m.sender.trim() === myName,
        avatarUrl: m.avatar_url || '',
      }));
      // Re-render once data arrives
      renderChatMessages(chatId);
    }
  } catch (e) { console.error('Chat load error:', e); }
}
// Alias for backwards compatibility
function openChatModal(clubId, name) {
  const cl = CLUBS.find(c => c.id === clubId);
  if (cl) openChat(cl.chatId, name || cl.name, cl.members);
}
function closeChatModal() {
  document.getElementById('chatModal').classList.remove('open');
  if (chatPollInterval) { clearInterval(chatPollInterval); chatPollInterval = null; }
  state.chatOpen = null;
}
function renderChatMessages(chatId) {
  const msgs = CHAT_MESSAGES[chatId] || [];
  const el = document.getElementById('chatMessages');
  el.innerHTML = msgs.map(m => {
    // Use avatar_url from DB message, fallback to ui-avatars
    const avatarSrc = m.avatarUrl && m.avatarUrl.length > 0
      ? m.avatarUrl
      : getAvatarUrl('', m.sender ? m.sender.split(' ')[0] : '?', m.sender ? m.sender.split(' ').slice(1).join(' ') : '', 60);
    const av = `<img src="${avatarSrc}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;flex-shrink:0" onerror="this.src='${getAvatarUrl('', m.sender ? m.sender.split(' ')[0] : '?', '', 60)}'"/>`;
    return `<div class="chat-msg ${m.mine ? 'mine' : 'other'}">
      ${!m.mine ? `<div style="display:flex;align-items:flex-end;gap:6px">${av}<div><div class="chat-sender">${m.sender}</div><div class="chat-bubble">${m.text}</div></div></div>` : `<div class="chat-bubble">${m.text}</div>`}
      <div class="chat-msg-meta">${m.time}</div>
    </div>`;
  }).join('');
  el.scrollTop = el.scrollHeight;
}
async function sendChatMsg() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text || !state.chatOpen) return;
  const now = new Date();
  const time = now.getHours() + ':' + (String(now.getMinutes()).padStart(2, '0'));
  // Optimistic UI update
  if (!CHAT_MESSAGES[state.chatOpen]) CHAT_MESSAGES[state.chatOpen] = [];
  const user = JSON.parse(sessionStorage.getItem('unisync_user') || '{}');
  const myName = ((user.firstName || 'You') + (user.lastName ? ' ' + user.lastName : '')).trim();
  const myAvatar = state.profile.avatarUrl || '';
  CHAT_MESSAGES[state.chatOpen].push({ sender: myName, text, time, mine: true, avatarUrl: myAvatar });
  input.value = '';
  renderChatMessages(state.chatOpen);
  // Persist to API
  try {
    await apiPost(`/api/chat/${state.chatOpen}`, { text });
  } catch (e) { /* optimistic already shown */ }
}

// Real-time chat polling (every 4 seconds, only when modal is open)
let chatPollInterval = null;
let _lastChatMsgId = null;
async function startChatPolling(chatId) {
  if (chatPollInterval) clearInterval(chatPollInterval);
  _lastChatMsgId = null;
  chatPollInterval = setInterval(async () => {
    if (!state.chatOpen || !document.getElementById('chatModal')?.classList.contains('open')) return;
    try {
      const res = await fetch(`${API_BASE}/api/chat/${chatId}`);
      if (!res.ok) return;
      const msgs = await res.json();
      if (!Array.isArray(msgs) || msgs.length === 0) return;
      const latestId = msgs[msgs.length - 1]?.id;
      if (latestId === _lastChatMsgId) return; // no new messages
      _lastChatMsgId = latestId;
      const user = JSON.parse(sessionStorage.getItem('unisync_user') || '{}');
      const myName = ((user.firstName || '') + ' ' + (user.lastName || '')).trim();
      CHAT_MESSAGES[chatId] = msgs.map(m => ({
        sender: m.sender,
        text: m.text,
        time: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        mine: m.sender.trim() === myName,
        avatarUrl: m.avatar_url || '',
      }));
      renderChatMessages(chatId);
    } catch (e) { }
  }, 1500);
}

// ── Real-time SSE connection ──────────────────────────────────────────────
let sseSource = null;
function startSSE() {
  const token = sessionStorage.getItem('unisync_token');
  if (!token) return;
  if (sseSource) sseSource.close();

  // SSE requires auth token — we pass it as a query param since
  // EventSource doesn't support custom headers
  sseSource = new EventSource(`${API_BASE}/api/realtime/stream?token=${token}`);

  sseSource.addEventListener('notification', (e) => {
    try {
      const n = JSON.parse(e.data);
      // Prepend to local NOTIFICATIONS if not already present
      if (!NOTIFICATIONS.find(x => x.id === n.id)) {
        NOTIFICATIONS.unshift({ id: n.id, icon: n.icon, title: n.title, text: n.text, time: 'Just now', unread: true });
      }
      renderNotifications();
      playNotifChime();
      showToast(`${n.title}`);
      if (document.getElementById('notifPanel')?.classList.contains('open')) renderNotifications();
    } catch (err) { }
  });

  sseSource.addEventListener('membership_changed', (e) => {
    try {
      const { clubId, joined, chatId } = JSON.parse(e.data);
      const cl = CLUBS.find(c => c.id === clubId);
      if (cl) {
        cl.joined = joined;
        if (joined) { if (chatId) cl.chatId = chatId; state.joinRequests[clubId] = { status: 'accepted', interviewMsg: '', requestId: null }; }
        else { delete state.joinRequests[clubId]; }
      }
      if (state.page === 'explore' && state.exploreTab === 'clubs') renderExplore();
      if (state.page === 'favorites') renderFavorites();
      if (state.page === 'messages') renderMessages();
      if (state.page === 'profile') renderProfile();
    } catch (err) { }
  });

  sseSource.addEventListener('join_request_updated', (e) => {
    try {
      const { clubId, status } = JSON.parse(e.data);
      const existing = state.joinRequests[clubId] || {};
      state.joinRequests[clubId] = { ...existing, status };
      if (state.page === 'explore' && state.exploreTab === 'clubs') renderExplore();
      if (state.page === 'profile') renderProfile();
    } catch (err) { }
  });

  sseSource.addEventListener('interview_scheduled', (e) => {
    try {
      const { clubId, interviewMsg } = JSON.parse(e.data);
      const existing = state.joinRequests[clubId] || {};
      state.joinRequests[clubId] = { ...existing, status: 'interview', interviewMsg };
      showToast('Interview scheduled! Check your Club Applications.');
      if (state.page === 'profile') renderProfile();
      if (state.page === 'explore' && state.exploreTab === 'clubs') renderExplore();
    } catch (err) { }
  });

  sseSource.addEventListener('clubs_updated', (e) => {
    try {
      // Refresh clubs list from server
      fetch(`${API_BASE}/api/clubs`).then(r => r.json()).then(data => {
        if (!Array.isArray(data)) return;
        const myMemberships = CLUBS.filter(c => c.joined).map(c => c.id);
        const mySaved = CLUBS.filter(c => c.saved).map(c => c.id);
        CLUBS.length = 0;
        data.forEach(cl => {
          const mapped = mapClubFromApi(cl);
          mapped.joined = myMemberships.includes(mapped.id);
          mapped.saved = mySaved.includes(mapped.id);
          CLUBS.push(mapped);
        });
        // Also refresh exec clubs
        const role = state.profile.role || sessionStorage.getItem('unisync_role') || 'student';
        if (role === 'executive') {
          apiGet('/api/executive/clubs/my').then(execData => {
            if (Array.isArray(execData)) state.execClubs = execData;
          }).catch(() => { });
        }
        if (state.page === 'explore' && state.exploreTab === 'clubs') renderExplore();
        if (state.page === 'home') renderFeaturedClubs();
        if (state.page === 'profile') renderProfile();
      }).catch(() => { });
    } catch (err) { }
  });

  sseSource.addEventListener('club_announcement', (e) => {
    try {
      const { clubId, text } = JSON.parse(e.data);
      const cl = CLUBS.find(c => c.id === clubId);
      if (cl) {
        if (!cl.announcements) cl.announcements = [];
        cl.announcements.unshift(text);
      }
    } catch (err) { }
  });

  sseSource.addEventListener('event_post', (e) => {
    try {
      const { clubId, post } = JSON.parse(e.data);
      showToast(`New update: ${post.title}`);
    } catch (err) { }
  });

  sseSource.addEventListener('new_join_request', (e) => {
    try {
      const { clubId, requesterName, requesterId, requesterAvatar } = JSON.parse(e.data);
      showToast(`${requesterName} wants to join your club!`);
      // Only refresh if exec is already viewing requests for this specific club
      const titleEl = document.getElementById('applyTitle');
      const listEl = document.getElementById('execRequestList');
      if (listEl && titleEl && titleEl.textContent.includes('Join Requests')) {
        openExecTab('requests', clubId);
      }
    } catch (err) { }
  });

  sseSource.addEventListener('positions_updated', (e) => {
    try {
      // Re-fetch positions and refresh recruitment page if open
      apiGet('/api/positions').then(data => {
        if (!Array.isArray(data)) return;
        POSITIONS.length = 0;
        data.forEach(p => POSITIONS.push({
          id: p.id, clubId: p.club_id, club: p.club_name,
          pos: p.position, type: p.type, deadline: p.deadline,
          desc: p.description || '', requirements: p.requirements || [], status: p.status,
        }));
        if (state.page === 'recruitment') renderRecruitment();
      }).catch(() => { });
    } catch (err) { }
  });
  sseSource.addEventListener('new_application', (e) => {
    try {
      const { clubId, positionName, applicantName } = JSON.parse(e.data);
      showToast(`\ud83d\udcdd ${applicantName} applied for "${positionName}"`);
      const titleEl = document.getElementById('applyTitle');
      const listEl = document.getElementById('execAppList');
      if (listEl && titleEl && titleEl.textContent.includes('Applications')) {
        openExecTab('applications', clubId);
      }
    } catch (err) { }
  });

  sseSource.addEventListener('application_updated', (e) => {
    try {
      const { positionId, status, interviewMsg } = JSON.parse(e.data);
      if (status) {
        // Store as object so we can keep interviewMsg alongside status
        const existing = state.applications[positionId];
        const prevMsg = typeof existing === 'object' ? existing.interviewMsg : '';
        state.applications[positionId] = {
          status,
          interviewMsg: interviewMsg || prevMsg || ''
        };
      }
      if (status === 'Interview' && interviewMsg) {
        showToast('Interview scheduled! Check My Applications.');
      }
      if (status === 'Final Decision') {
        showToast('Congratulations! Your application was accepted!');
      }
      if (state.page === 'profile') renderProfile();
      if (state.page === 'recruitment') renderRecruitment();
    } catch (err) { }
  });

  sseSource.addEventListener('avatar_updated', (e) => {
    try {
      const { avatarUrl } = JSON.parse(e.data);
      state.profile.avatarUrl = avatarUrl;
      syncTopBarProfile();
    } catch (err) { }
  });

  sseSource.addEventListener('user_avatar_updated', (e) => {
    try {
      const { userId, avatarUrl } = JSON.parse(e.data);
      // Update any rendered chat messages from that user
      document.querySelectorAll(`[data-user-id="${userId}"] img`).forEach(img => { img.src = avatarUrl; });
    } catch (err) { }
  });

  sseSource.onerror = () => {
    // Reconnect after 5s on error
    setTimeout(() => { if (sessionStorage.getItem('unisync_token')) startSSE(); }, 5000);
  };
}

// Fallback polling every 30 seconds (SSE handles real-time, this is backup)
let notifPollInterval = null;
function startNotificationPolling() {
  if (notifPollInterval) clearInterval(notifPollInterval);
  notifPollInterval = setInterval(async () => {
    try {
      const prevUnread = NOTIFICATIONS.filter(n => n.unread).length;
      const [notifData, memData, appData] = await Promise.all([
        apiGet('/api/user/notifications'),
        apiGet('/api/user/memberships'),
        apiGet('/api/user/applications')
      ]);
      if (Array.isArray(notifData)) {
        NOTIFICATIONS.length = 0;
        notifData.forEach(n => NOTIFICATIONS.push({
          id: n.id, icon: n.icon, title: n.title,
          text: n.text, time: timeAgo(n.created_at), unread: n.unread
        }));
      }
      if (Array.isArray(memData)) {
        memData.forEach(clubId => {
          const cl = CLUBS.find(c => c.id === clubId);
          if (cl && !cl.joined) {
            cl.joined = true;
            if (state.joinRequests[clubId]) state.joinRequests[clubId] = { ...state.joinRequests[clubId], status: 'accepted' };
          }
        });
      }
      if (Array.isArray(appData)) {
        appData.forEach(app => {
          state.applications[app.position_id] = {
            status: app.status,
            interview_msg: app.interview_msg || ''
          };
        });
        if (state.page === 'recruitment') renderRecruitment();
      }
      const newUnread = NOTIFICATIONS.filter(n => n.unread).length;
      updateAllNotifBadges(newUnread);
      if (newUnread > prevUnread) {
        if (document.getElementById('notifPanel')?.classList.contains('open')) renderNotifications();
      }
    } catch (e) { }
  }, 30000);
}

// ===== CALENDAR =====
function renderCalendar() {
  const el = document.getElementById('calendarContainer');
  const months = [];
  const now = new Date(2026, 2, 18); // March 2026
  for (let m = 0; m < 3; m++) {
    months.push(new Date(now.getFullYear(), now.getMonth() + m, 1));
  }
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const eventsByDate = {};
  EVENTS.forEach(ev => {
    const d = new Date(ev.date);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!eventsByDate[key]) eventsByDate[key] = [];
    eventsByDate[key].push(ev);
  });
  el.innerHTML = months.map(month => {
    const year = month.getFullYear(), mo = month.getMonth();
    const monthName = month.toLocaleString('default', { month: 'long' });
    const firstDay = new Date(year, mo, 1).getDay();
    const daysInMonth = new Date(year, mo + 1, 0).getDate();
    const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    let cells = Array(firstDay).fill('<div class="cal-cell empty"><div class="cal-num"></div></div>');
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${mo}-${d}`;
      const evs = eventsByDate[key] || [];
      const isToday = key === todayKey;
      const hasEvent = evs.length > 0;
      cells.push(`<div class="cal-cell ${hasEvent ? 'has-event' : 'no-event'} ${isToday ? 'today' : ''}" ${hasEvent ? `onclick="openEventDetail(${evs[0].id})"` : ''}>${hasEvent ? `<div class="cal-event-thumb"><img src="${evs[0].img}" alt=""/></div>` : ''}<div class="cal-num">${d}</div></div>`);
    }
    return `<div class="cal-month-block"><div class="cal-month-name">${monthName} ${year}</div><div class="cal-grid">${dayNames.map(d => `<div class="cal-day-label">${d}</div>`).join('')}${cells.join('')}</div></div>`;
  }).join('');
}

// ===== NOTIFICATIONS =====
async function refreshNotifications() {
  try {
    const [notifData, memData] = await Promise.all([
      apiGet('/api/user/notifications'),
      apiGet('/api/user/memberships')
    ]);

    if (Array.isArray(notifData)) {
      NOTIFICATIONS.length = 0;
      notifData.forEach(n => {
        NOTIFICATIONS.push({
          id: n.id, icon: n.icon, title: n.title,
          text: n.text, time: timeAgo(n.created_at), unread: n.unread
        });
      });
    }

    if (Array.isArray(memData)) {
      memData.forEach(clubId => {
        const cl = CLUBS.find(c => c.id === clubId);
        if (cl && !cl.joined) {
          cl.joined = true;
          // Clean up join requests state if it was pending
          if (state.joinRequests[clubId]) {
            state.joinRequests[clubId] = 'accepted';
          }
          // Re-render explore/clubs if we are on that page
          if (state.page === 'explore' && state.exploreTab === 'clubs') {
            renderExplore();
          }
        }
      });
    }
  } catch (e) { }
  renderNotifications();
}
function renderNotifications() {
  const unread = NOTIFICATIONS.filter(n => n.unread);
  const read = NOTIFICATIONS.filter(n => !n.unread);
  const listEl = document.getElementById('notifList');
  if (listEl) {
    if (unread.length === 0 && read.length === 0) {
      listEl.innerHTML = '<div style="padding:32px;text-align:center;color:var(--gray)"><div style="margin-bottom:10px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="40" height="40" stroke-width="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></div><div>No notifications yet</div></div>';
    } else {
      listEl.innerHTML =
        (unread.length ? `<div style="display:flex;justify-content:space-between;align-items:center"><div class="notif-section-label">New</div><button onclick="markAllNotifsRead()" style="font-size:11px;background:none;border:none;color:var(--gold);cursor:pointer;padding:4px 8px">Mark all read</button></div>${unread.map(renderNotifItem).join('')}` : '') +
        (read.length ? `<div class="notif-section-label">Earlier</div>${read.map(renderNotifItem).join('')}` : '');
    }
  }
  updateAllNotifBadges(unread.length);
}
function updateAllNotifBadges(count) {
  const ids = ['notifBadge', 'sidebarNotifBadge', 'mobileNotifBadge', 'notifBadge2'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = count || '';
      el.style.display = count ? 'flex' : 'none';
    }
  });
}
function renderNotifItem(n) {
  return `<div class="notif-item" onclick="handleNotifClick(${n.id})" style="cursor:pointer">
    <div class="notif-icon">${n.icon}</div>
    <div class="notif-body">
      <div class="notif-title">${n.title}</div>
      <div class="notif-text">${n.text}</div>
      <div class="notif-time">${n.time}</div>
    </div>
    ${n.unread ? '<div class="notif-unread"></div>' : ''}
  </div>`;
}
function handleNotifClick(id) {
  markNotifRead(id);
  const n = NOTIFICATIONS.find(x => x.id === id);
  if (!n) return;
  closeAllPanels();
  const role = state.profile.role || sessionStorage.getItem('unisync_role') || 'student';
  // Smart navigation based on notification content
  if (n.title.includes('Join Request') || n.title.includes('New Join Request')) {
    const match = n.text.match(/wants to join ["«»]?([^"«»]+)["«»]?/);
    if (match && role === 'executive') {
      const clubName = match[1].trim();
      const cl = state.execClubs.find(c => c.name === clubName) || CLUBS.find(c => c.name === clubName);
      if (cl) { setTimeout(() => { openExecDashboard(cl.id); setTimeout(() => openExecTab('requests', cl.id), 200); }, 150); return; }
    }
  } else if (n.title.includes('Registration Confirmed') || n.title.includes('Ticket')) {
    setTimeout(() => { navigate('favorites'); switchFavTab('tickets'); }, 150); return;
  } else if (n.title.includes('Application') || n.title.includes('Shortlisted') || n.title.includes('Interview') || n.title.includes('Position')) {
    setTimeout(() => { navigate('recruitment'); switchRecTab('applied'); }, 150); return;
  } else if (n.title.includes('Event Reminder') || n.title.includes('New Event')) {
    setTimeout(() => navigate('explore'), 150); return;
  } else if (n.title.includes('Announcement') || n.title.includes('Meeting')) {
    setTimeout(() => navigate('messages'), 150); return;
  } else if (n.title.includes('Join Request Sent')) {
    setTimeout(() => navigate('profile'), 150); return;
  }
}
async function markNotifRead(id) {
  const n = NOTIFICATIONS.find(x => x.id === id);
  if (n) n.unread = false;
  renderNotifications();
  try { await apiPost('/api/user/notifications/read', { notifId: id }); } catch (e) { }
}
async function markAllNotifsRead() {
  NOTIFICATIONS.forEach(n => n.unread = false);
  renderNotifications();
  try { await apiPost('/api/user/notifications/read', {}); } catch (e) { }
}

// ===== PROFILE =====
function getAvatarUrl(avatarUrl, firstName, lastName, size) {
  if (avatarUrl && avatarUrl.length > 0) return avatarUrl;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent((firstName || '?') + '+' + (lastName || '?'))}&background=1a2b5e&color=c9a227&bold=true&size=${size || 200}`;
}
function syncTopBarProfile() {
  const p = state.profile;
  const topBarName = document.getElementById('topBarName');
  if (topBarName) topBarName.textContent = p.firstName;
  const av = getAvatarUrl(p.avatarUrl, p.firstName, p.lastName, 200);
  const topAvatar = document.getElementById('topBarAvatar');
  const profileImg = document.getElementById('profileAvatarImg');
  const sidebarAvatar = document.getElementById('sidebarAvatar');
  const sidebarName = document.getElementById('sidebarName');
  const sidebarRole = document.getElementById('sidebarRole');
  if (topAvatar) topAvatar.src = av;
  if (profileImg) profileImg.src = av;
  if (sidebarAvatar) sidebarAvatar.src = av;
  if (sidebarName) sidebarName.textContent = `${p.firstName} ${p.lastName}`;
  const role = p.role || sessionStorage.getItem('unisync_role') || 'student';
  if (sidebarRole) sidebarRole.textContent = role === 'executive' ? 'Executive' : 'Student';
  const rt = document.getElementById('roleTag');
  if (rt) { rt.style.display = role === 'executive' ? 'flex' : 'none'; }
  const createClubBtn = document.getElementById('snav-create-club');
  if (createClubBtn) { createClubBtn.style.display = role === 'executive' ? 'flex' : 'none'; }
}
function renderProfile() {
  syncTopBarProfile();
  const p = state.profile;
  const role = p.role || sessionStorage.getItem('unisync_role') || 'student';
  const joinedClubs = CLUBS.filter(c => c.joined);
  const registeredEvents = EVENTS.filter(e => e.rsvp);
  const appCount = Object.keys(state.applications).length;
  const av = getAvatarUrl(p.avatarUrl, p.firstName, p.lastName, 200);

  // ── Build clubs section ──────────────────────────────────────
  let clubsHtml = '';
  if (role === 'executive') {
    const execIds = new Set(state.execClubs.map(c => c.id));
    const managedClubs = state.execClubs;
    const memberOnlyClubs = joinedClubs.filter(c => !execIds.has(c.id));
    const hasAny = managedClubs.length || memberOnlyClubs.length;
    clubsHtml = `
      <div class="profile-clubs-grid">
        ${managedClubs.map(cl => `
          <div class="profile-club-managed" onclick="openExecDashboard(${cl.id})">
            <span class="pcm-emoji">${cl.emoji || ''}</span>
            <span class="pcm-name">${cl.name}</span>
            <span class="pcm-manage"><svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>Manage</span>
          </div>`).join('')}
        ${memberOnlyClubs.map(cl => `
          <div class="profile-club-member" onclick="openClubDetail(${cl.id})">
            <span class="pcm-emoji">${cl.emoji || ''}</span>
            <span class="pcm-name">${cl.name}</span>
          </div>`).join('')}
        ${!hasAny ? '<div style="color:var(--gray);font-size:13px">No clubs yet. Create your first club!</div>' : ''}
      </div>`;
  } else {
    clubsHtml = joinedClubs.length ? `<div class="profile-clubs-grid">${joinedClubs.map(cl => `
      <div class="profile-club-member" onclick="openClubDetail(${cl.id})">
        <span class="pcm-emoji">${cl.emoji || ''}</span>
        <span class="pcm-name">${cl.name}</span>
      </div>`).join('')}</div>`
      : '<div style="color:var(--gray);font-size:13px">Not a member of any clubs yet.</div>';
  }

  // ── Build applications section ──────────────────────────────
  const statusColors = { 'pending': 'rgba(201,162,39,0.15)', 'Under Review': 'rgba(201,162,39,0.15)', 'Interview': 'rgba(76,175,130,0.15)', 'Shortlisted': 'rgba(45,212,191,0.15)', 'Final Decision': 'rgba(76,175,130,0.15)', 'Rejected': 'rgba(224,85,85,0.15)' };
  const statusTextColors = { 'pending': 'var(--gold)', 'Under Review': 'var(--gold)', 'Interview': '#4caf82', 'Shortlisted': '#2dd4bf', 'Final Decision': '#4caf82', 'Rejected': 'var(--danger)' };
  const statusLabels = { 'pending': 'Submitted', 'Under Review': 'Under Review', 'Interview': 'Interview', 'Shortlisted': 'Shortlisted', 'Final Decision': 'Approved', 'Rejected': 'Rejected' };

  const appsHtml = Object.entries(state.applications).length ? POSITIONS.filter(p2 => state.applications[p2.id]).map(p2 => {
    const appData = state.applications[p2.id];
    const appStatus = typeof appData === 'object' ? (appData.status || 'Under Review') : appData;
    const bgCol = statusColors[appStatus] || 'rgba(201,162,39,0.15)';
    const txtCol = statusTextColors[appStatus] || 'var(--gold)';
    const label = statusLabels[appStatus] || appStatus;
    return `<div class="profile-app-item">
      <div><div class="profile-app-pos">${p2.pos}</div><div class="profile-app-club">${p2.club}</div></div>
      <span class="profile-app-badge" style="background:${bgCol};color:${txtCol}">${label}</span>
    </div>`;
  }).join('') : '<div style="color:var(--gray);font-size:13px">No applications yet.</div>';

  // ── Build join requests section ─────────────────────────────
  const pendingJoinClubIds = Object.keys(state.joinRequests).filter(cid => {
    const s = state.joinRequests[cid]?.status;
    return s === 'pending' || s === 'interview';
  }).map(Number);
  const joinReqHtml = pendingJoinClubIds.length ? `
    <div style="margin-bottom:28px;">
      <div class="profile-sec-title">Club Applications</div>
      ${pendingJoinClubIds.map(cid => renderJoinRequestTracker(cid)).join('')}
    </div>` : '';

  // ── Render full profile ─────────────────────────────────────
  document.getElementById('profile-content').innerHTML = `
    <!-- Hero Card -->
    <div class="profile-hero">
      <div class="profile-hero-top">
        <div class="profile-avatar-wrap">
          <img class="profile-avatar" src="${av}" alt="Avatar"/>
          <div class="profile-edit-btn" onclick="openEditProfile()">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </div>
        </div>
        <div style="flex:1;min-width:0;">
          <div class="profile-name">${p.firstName} ${p.lastName}</div>
          <div class="profile-meta">${p.program || ''} · Year ${p.year || ''} · ${p.university || ''}</div>
          <div class="profile-bio">${p.bio || 'Add a bio in Edit Profile'}</div>
        </div>
      </div>
      <div class="profile-hero-divider"></div>
      <div class="profile-stats">
        <div class="profile-stat"><div class="profile-stat-num">${registeredEvents.length}</div><div class="profile-stat-label">Events</div></div>
        <div class="profile-stat"><div class="profile-stat-num">${joinedClubs.length}</div><div class="profile-stat-label">Clubs</div></div>
        <div class="profile-stat"><div class="profile-stat-num">${appCount}</div><div class="profile-stat-label">Applications</div></div>
      </div>
    </div>

    <!-- Profile Action Row -->
    <div class="profile-action-row">
      <button class="profile-edit-action" onclick="openEditProfile()">Edit Profile</button>
      ${role === 'executive' ? `<button class="profile-newclub-action" onclick="openCreateClubModal()">+ New Club</button>` : ''}
    </div>

    <!-- My Clubs -->
    <div style="margin-bottom:28px;">
      <div class="profile-sec-title">${role === 'executive' ? 'My Clubs' : 'Joined Clubs'}</div>
      ${clubsHtml}
    </div>

    ${joinReqHtml}

    <!-- My Applications -->
    <div style="margin-bottom:28px;">
      <div class="profile-sec-row">
        <div class="profile-sec-title">My Applications</div>
        <button class="profile-sec-link" onclick="navigate('recruitment');switchRecTab('applied')">See all →</button>
      </div>
      ${appsHtml}
    </div>

    <!-- Settings -->
    <div>
      <div class="profile-sec-title">Settings</div>
      <div class="settings-card">
        <div class="settings-item" onclick="this.querySelector('.toggle-sw').classList.toggle('on')">
          <div><div class="settings-item-label">Push Notifications</div><div class="settings-item-desc">Get notified about events and updates</div></div>
          <div class="toggle-sw on"></div>
        </div>
        <div class="settings-item" onclick="this.querySelector('.toggle-sw').classList.toggle('on')">
          <div><div class="settings-item-label">Email Notifications</div><div class="settings-item-desc">Weekly digest and important alerts</div></div>
          <div class="toggle-sw"></div>
        </div>
        <div class="settings-item" onclick="openPrivacySettings()">
          <div><div class="settings-item-label">Privacy Settings</div></div>
          <div class="settings-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></div>
        </div>
        <div class="settings-item" onclick="openAppearanceSettings()">
          <div><div class="settings-item-label">Appearance</div></div>
          <div class="settings-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></div>
        </div>
        <div class="settings-item" onclick="openAccountSecurity()">
          <div><div class="settings-item-label">Account Security</div></div>
          <div class="settings-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></div>
        </div>
        <div class="settings-item" onclick="openAboutModal()">
          <div><div class="settings-item-label">About UniSync</div></div>
          <div class="settings-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></div>
        </div>
        <div class="settings-item" onclick="openHelpSupport()">
          <div><div class="settings-item-label">Help &amp; Support</div></div>
          <div class="settings-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></div>
        </div>
        <div class="settings-item danger" onclick="logout()" style="border-top:1px solid rgba(255,255,255,0.06)">
          <div class="settings-item-label">Log Out</div>
        </div>
      </div>
    </div>
  `;
}

// ===== EDIT PROFILE =====
function openEditProfile() {
  const p = state.profile;
  const av = getAvatarUrl(p.avatarUrl, p.firstName, p.lastName, 200);
  document.getElementById('editProfileContent').innerHTML = `
    <div class="ep-avatar-section">
      <div style="position:relative;display:inline-block">
        <img class="ep-avatar" src="${av}" alt="Avatar" id="epAvatar" style="width:90px;height:90px;border-radius:50%;object-fit:cover;border:3px solid var(--gold)"/>
        <label for="avatarFileInput" style="position:absolute;bottom:0;right:0;background:var(--gold);border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer"><svg viewBox="0 0 24 24" fill="none" stroke="#0a0a0f" width="14" height="14" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></label>
        <input type="file" id="avatarFileInput" accept="image/*" style="display:none" onchange="handleAvatarUpload(this)"/>
      </div>
      <div style="font-size:11px;color:var(--gray);margin-top:6px">Tap icon to change photo</div>
    </div>

    <div class="ep-section-title">Personal Information</div>
    <div class="form-row-2">
      <div class="form-row"><label class="form-label">First Name</label><input class="form-input" id="ep_fn" value="${p.firstName}"/></div>
      <div class="form-row"><label class="form-label">Last Name</label><input class="form-input" id="ep_ln" value="${p.lastName}"/></div>
    </div>
    <div class="form-row"><label class="form-label">Student ID</label><input class="form-input" id="ep_sid" value="${p.studentId}"/></div>
    <div class="form-row"><label class="form-label">Email Address</label><input class="form-input" id="ep_email" type="email" value="${p.email}"/></div>
    <div class="form-row"><label class="form-label">Phone Number</label><input class="form-input" id="ep_phone" type="tel" value="${p.phone}"/></div>
    <div class="form-row"><label class="form-label">Bio / About Me</label><textarea class="form-input" id="ep_bio" placeholder="Tell others about yourself...">${p.bio}</textarea></div>

    <div class="ep-section-title">Academic Details</div>
    <div class="form-row"><label class="form-label">University</label><input class="form-input" id="ep_uni" value="${p.university}"/></div>
    <div class="form-row"><label class="form-label">Campus</label>
      <select class="form-input" id="ep_campus">
        ${['Lahore', 'Karachi', 'Islamabad', 'Peshawar', 'Chiniot-Faisalabad'].map(c => `<option ${p.campus === c ? 'selected' : ''}>${c}</option>`).join('')}
      </select></div>
    <div class="form-row"><label class="form-label">Department</label><input class="form-input" id="ep_dept" value="${p.department}"/></div>
    <div class="form-row"><label class="form-label">Program</label><input class="form-input" id="ep_prog" value="${p.program}"/></div>
    <div class="form-row-2">
      <div class="form-row"><label class="form-label">Year</label>
        <select class="form-input" id="ep_year">
          ${['1', '2', '3', '4'].map(y => `<option ${p.year === y ? 'selected' : ''}>${y}</option>`).join('')}
        </select></div>
      <div class="form-row"><label class="form-label">Semester</label>
        <select class="form-input" id="ep_sem">
          ${['1', '2', '3', '4', '5', '6', '7', '8'].map(s => `<option ${p.semester === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select></div>
    </div>

    <div class="ep-section-title">Social Links</div>
    <div class="form-row"><label class="form-label">LinkedIn URL</label><input class="form-input" id="ep_linkedin" placeholder="linkedin.com/in/username" value="${p.linkedin}"/></div>
    <div class="form-row"><label class="form-label">GitHub Username</label><input class="form-input" id="ep_github" placeholder="github.com/username" value="${p.github}"/></div>

    <div class="ep-section-title">Interests</div>
    <div class="ep-interests" id="epInterests">
      ${INTERESTS.map(i => `<button class="interest-chip ${p.interests.includes(i) ? 'selected' : ''}" onclick="toggleInterest('${i}',this)">${i}</button>`).join('')}
    </div>

    <button class="btn-primary" onclick="saveProfile()" style="margin-top:8px">Save Changes</button>`;
  document.getElementById('editProfileModal').classList.add('open');
}
function closeEditProfile() { document.getElementById('editProfileModal').classList.remove('open'); }
function toggleInterest(interest, btn) {
  const idx = state.profile.interests.indexOf(interest);
  if (idx > -1) state.profile.interests.splice(idx, 1);
  else state.profile.interests.push(interest);
  btn.classList.toggle('selected', state.profile.interests.includes(interest));
}
async function handleAvatarUpload(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { showToast('Image must be under 2MB'); return; }
  const reader = new FileReader();
  reader.onload = async (e) => {
    const dataUrl = e.target.result;
    state.profile.avatarUrl = dataUrl;
    const epAv = document.getElementById('epAvatar');
    if (epAv) epAv.src = dataUrl;
    syncTopBarProfile();
    try {
      await apiPut('/api/user/avatar', { avatarUrl: dataUrl });
      showToast('Profile photo updated');
    } catch (err) { showToast('Photo saved locally'); }
    const stored = JSON.parse(sessionStorage.getItem('unisync_user') || '{}');
    stored.avatarUrl = dataUrl;
    sessionStorage.setItem('unisync_user', JSON.stringify(stored));
  };
  reader.readAsDataURL(file);
}

async function saveProfile() {
  const p = state.profile;
  p.firstName = document.getElementById('ep_fn').value.trim() || p.firstName;
  p.lastName = document.getElementById('ep_ln').value.trim() || p.lastName;
  p.studentId = document.getElementById('ep_sid').value.trim();
  p.email = document.getElementById('ep_email').value.trim();
  p.phone = document.getElementById('ep_phone').value.trim();
  p.bio = document.getElementById('ep_bio').value.trim();
  p.university = document.getElementById('ep_uni').value.trim();
  p.campus = document.getElementById('ep_campus').value;
  p.department = document.getElementById('ep_dept').value.trim();
  p.program = document.getElementById('ep_prog').value.trim();
  p.year = document.getElementById('ep_year').value;
  p.semester = document.getElementById('ep_sem').value;
  p.linkedin = document.getElementById('ep_linkedin').value.trim();
  p.github = document.getElementById('ep_github').value.trim();
  closeEditProfile();
  renderProfile();
  showToast('Profile updated successfully');
  const stored = JSON.parse(sessionStorage.getItem('unisync_user') || '{}');
  Object.assign(stored, {
    firstName: p.firstName, lastName: p.lastName, studentId: p.studentId,
    phone: p.phone, bio: p.bio, university: p.university, campus: p.campus,
    department: p.department, program: p.program, year: p.year, semester: p.semester,
    linkedin: p.linkedin, github: p.github, interests: p.interests
  });
  sessionStorage.setItem('unisync_user', JSON.stringify(stored));
  try {
    await apiPut('/api/user/profile', {
      firstName: p.firstName, lastName: p.lastName, studentId: p.studentId,
      phone: p.phone, bio: p.bio, university: p.university, campus: p.campus,
      department: p.department, program: p.program, year: p.year, semester: p.semester,
      linkedin: p.linkedin, github: p.github, interests: p.interests
    });
  } catch (e) { }
}

// ===== MESSAGES (Global Chat Rooms) =====
function renderMessages() {
  const container = document.getElementById('messagesContent');
  if (!container) return;
  const role = state.profile.role || sessionStorage.getItem('unisync_role') || 'student';
  let accessibleClubs = CLUBS.filter(c => c.joined);
  if (role === 'executive') {
    state.execClubs.forEach(ec => {
      if (!accessibleClubs.find(c => c.id === ec.id)) {
        const cl = CLUBS.find(c => c.id === ec.id);
        if (cl) accessibleClubs.push(cl);
        else accessibleClubs.push({ id: ec.id, name: ec.name, emoji: ec.emoji || '', chatId: ec.chat_id, members: ec.members || 0 });
      }
    });
  }
  if (accessibleClubs.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="40" height="40"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke-width="1.5"/></svg></div><div class="empty-title">No club chats yet</div><div class="empty-sub">Join clubs to access their chat rooms</div></div>';
    return;
  }
  container.innerHTML = '<div class="msg-list-pane" id="msgListPane">' +
    accessibleClubs.map(cl => {
      const chatId = cl.chatId || ('club_' + cl.id);
      const safeName = (cl.name || '').replace(/'/g, "\'").replace(/"/g, '&quot;');
      const msgs = CHAT_MESSAGES[chatId] || [];
      const last = msgs[msgs.length - 1];
      const lastText = last ? (last.mine ? 'You: ' : last.sender.split(' ')[0] + ': ') + last.text : 'Tap to open chat';
      const initials = (cl.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      const avatarHtml = cl.photoUrl
        ? '<img src="' + cl.photoUrl + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover"/>'
        : '<span style="font-size:16px;font-weight:700;color:var(--gold)">' + initials + '</span>';
      return '<div class="msg-channel-item" onclick="openChat(\'' + chatId + '\',\'' + safeName + '\',' + (cl.members || 0) + ')" id="msgItem-' + chatId + '">' +
        '<div class="msg-channel-avatar" style="background:linear-gradient(135deg,var(--navy),#2d4a8a)">' + avatarHtml + '</div>' +
        '<div class="msg-channel-info"><div class="msg-channel-name">' + cl.name + '</div><div class="msg-channel-preview">' + lastText + '</div></div>' +
        '<div class="msg-channel-meta"><div class="msg-channel-time">' + (last ? last.time || '' : '') + '</div></div></div>';
    }).join('') +
    '</div><div class="msg-chat-pane" id="msgChatPane"></div>';
}


// ===== INIT =====
async function init() {
  // ── Load user profile from sessionStorage (fast) ──────────────────
  const storedUser = sessionStorage.getItem('unisync_user');
  if (storedUser) {
    try {
      const u = JSON.parse(storedUser);
      state.profile.firstName = u.firstName || state.profile.firstName;
      state.profile.lastName = u.lastName || state.profile.lastName;
      state.profile.email = u.email || state.profile.email;
      state.profile.studentId = u.studentId || state.profile.studentId;
      state.profile.phone = u.phone || state.profile.phone;
      state.profile.bio = u.bio || state.profile.bio;
      state.profile.university = u.university || state.profile.university;
      state.profile.campus = u.campus || state.profile.campus;
      state.profile.department = u.department || state.profile.department;
      state.profile.program = u.program || state.profile.program;
      state.profile.year = u.year || state.profile.year;
      state.profile.semester = u.semester || state.profile.semester;
      state.profile.linkedin = u.linkedin || state.profile.linkedin;
      state.profile.github = u.github || state.profile.github;
      state.profile.interests = u.interests || [];
      state.profile.avatarUrl = u.avatarUrl || '';
      state.profile.role = u.role || sessionStorage.getItem('unisync_role') || 'student';
    } catch (e) { }
  }

  // ── Splash animation (fast) ────────────────────────────────────────
  setTimeout(() => {
    const splash = document.getElementById('splash');
    const app = document.getElementById('app');
    splash.style.transition = 'opacity 0.4s ease';
    splash.style.opacity = '0';
    setTimeout(() => {
      splash.style.display = 'none';
      app.style.display = '';
      navigate('home');
    }, 400);
  }, 1200);

  // ── Fetch ALL data from API (runs in background) ───────────────────
  try {
    const [eventsData, clubsData, positionsData] = await Promise.all([
      fetch(`${API_BASE}/api/events`).then(r => r.json()),
      fetch(`${API_BASE}/api/clubs`).then(r => r.json()),
      fetch(`${API_BASE}/api/positions`).then(r => r.json()),
    ]);

    // Map API data to local EVENTS array format
    if (Array.isArray(eventsData)) {
      EVENTS.length = 0;
      eventsData.forEach(ev => {
        EVENTS.push({
          id: ev.id,
          name: ev.name,
          category: ev.category,
          tag: ev.tag,
          club: ev.club_name,
          clubId: ev.club_id,
          date: ev.event_date,
          time: ev.event_time,
          location: ev.location,
          desc: ev.description,
          prize: ev.prize || '',
          paid: ev.paid,
          price: ev.price,
          img: ev.img,
          rsvp: false,
          saved: false,
          viewCount: ev.view_count || 0,
          reviews: (ev.event_reviews || []).map(r => ({ author: r.author, stars: r.stars, text: r.text })),
        });
      });
    }

    // Map API data to local CLUBS array format
    if (Array.isArray(clubsData)) {
      CLUBS.length = 0;
      clubsData.forEach(cl => { CLUBS.push(mapClubFromApi(cl)); });
    }

    // Map positions
    if (Array.isArray(positionsData)) {
      POSITIONS.length = 0;
      positionsData.forEach(p => {
        POSITIONS.push({
          id: p.id,
          clubId: p.club_id,
          club: p.club_name,
          pos: p.position,
          type: p.type,
          deadline: p.deadline,
          desc: p.description,
          requirements: p.requirements || [],
          status: p.status,
        });
      });
    }

    // ── Fetch user-specific state ────────────────────────────────────
    const userRole = state.profile.role || sessionStorage.getItem('unisync_role') || 'student';
    const extraFetches = [
      apiGet('/api/user/rsvps'),
      apiGet('/api/user/saved-events'),
      apiGet('/api/user/memberships'),
      apiGet('/api/user/applications'),
      apiGet('/api/user/notifications'),
      apiGet('/api/user/join-requests'),
    ];
    if (userRole === 'executive') extraFetches.push(apiGet('/api/executive/clubs/my'));
    const [rsvps, saved, memberships, applications, notifications, joinReqs, execClubs] = await Promise.all(extraFetches);

    if (Array.isArray(rsvps)) {
      rsvps.forEach(r => {
        const ev = EVENTS.find(e => e.id === r.event_id);
        if (ev) ev.rsvp = true;
      });
    }
    if (Array.isArray(saved)) {
      saved.forEach(id => {
        const ev = EVENTS.find(e => e.id === id);
        if (ev) ev.saved = true;
      });
    }
    if (Array.isArray(memberships)) {
      memberships.forEach(id => {
        const cl = CLUBS.find(c => c.id === id);
        if (cl) cl.joined = true;
      });
    }
    if (Array.isArray(applications)) {
      applications.forEach(a => {
        // Store as object so interviewMsg is accessible in the pipeline
        state.applications[a.position_id] = {
          status: a.status,
          interviewMsg: a.interview_msg || '',
        };
      });
    }
    if (Array.isArray(notifications)) {
      NOTIFICATIONS.length = 0;
      notifications.forEach(n => {
        NOTIFICATIONS.push({
          id: n.id, icon: n.icon, title: n.title,
          text: n.text, time: timeAgo(n.created_at), unread: n.unread
        });
      });
    }
    if (Array.isArray(joinReqs)) {
      joinReqs.forEach(r => {
        state.joinRequests[r.club_id] = {
          status: r.status,
          interviewMsg: r.interview_msg || '',
          requestId: r.id,
        };
      });
    }
    if (Array.isArray(execClubs)) {
      state.execClubs = execClubs;
    }

    // Also fetch full profile to get avatar_url
    try {
      const profileData = await apiGet('/api/user/profile');
      if (profileData && !profileData.error) {
        state.profile.avatarUrl = profileData.avatar_url || '';
        state.profile.role = profileData.role || state.profile.role;
        const stored = JSON.parse(sessionStorage.getItem('unisync_user') || '{}');
        stored.avatarUrl = profileData.avatar_url || '';
        stored.role = profileData.role;
        sessionStorage.setItem('unisync_user', JSON.stringify(stored));
        syncTopBarProfile();
      }
    } catch (e) { }

    // Re-render current page with live data
    if (state.page === 'home') renderHome();
    else navigate(state.page);

    // Update notification badge
    renderNotifications();

    // Start SSE for real-time push events
    startSSE();

    // Start fallback polling
    startNotificationPolling();

  } catch (err) {
    console.warn('API fetch failed, using cached data:', err.message);
    // Still start SSE even if initial fetch failed
    startSSE();
    startNotificationPolling();
    setTimeout(() => { showToast('Running in offline mode'); }, 5000);
  }
}

// ── timeAgo helper ─────────────────────────────────────────────────────────
function timeAgo(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} minutes ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d > 1 ? 's' : ''} ago`;
  return new Date(isoString).toLocaleDateString();
}

// ── Logout ─────────────────────────────────────────────────────────────────
function logout() {
  if (sseSource) { sseSource.close(); sseSource = null; }
  if (chatPollInterval) clearInterval(chatPollInterval);
  if (notifPollInterval) clearInterval(notifPollInterval);
  sessionStorage.clear();
  window.location.href = 'login.html';
}

// ===== EXECUTIVE DASHBOARD =====
let execActiveClubId = null;

function openExecDashboard(clubId) {
  const cl = state.execClubs.find(c => c.id === clubId) || CLUBS.find(c => c.id === clubId);
  if (!cl) { showToast('Club not found'); return; }
  execActiveClubId = clubId;
  document.getElementById('execModalTitle').textContent = 'Executive Dashboard';
  document.getElementById('execModalSub').textContent = cl.name;
  document.getElementById('execEditClubBtn').onclick = () => openCreateClubModal(clubId);

  const tiles = [
    { id: 'applications', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>', label: 'Applications' },
    { id: 'members', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>', label: 'Members' },
    { id: 'positions', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>', label: 'Positions' },
    { id: 'posts', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>', label: 'Post Update' },
    { id: 'announce', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 8.5c0 2.2-4 4.5-10 4.5S2 10.7 2 8.5 6 4 12 4s10 2.3 10 4.5z"/><path d="M2 8.5C2 14.3 6 18 12 18s10-3.7 10-9.5" stroke-linecap="round"/></svg>', label: 'Announce' },
  ];

  document.getElementById('execGrid').innerHTML = tiles.map(t => `
    <div class="exec-tile" id="etile-${t.id}" onclick="openExecTab('${t.id}',${clubId})">
      <div class="exec-tile-icon">${t.icon}</div>
      <div class="exec-tile-label">${t.label}</div>
    </div>`).join('') + `
    <div class="exec-tile" style="border-color:var(--danger);opacity:.7" onclick="deleteClub(${clubId})">
      <div class="exec-tile-icon"><svg viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></div>
      <div class="exec-tile-label" style="color:var(--danger)">Delete Club</div>
    </div>`;

  openExecTab('applications', clubId);
  document.getElementById('execModal').classList.add('open');
}

async function deleteClub(clubId) {
  const cl = CLUBS.find(c => c.id === clubId);
  if (!confirm(`Are you sure you want to permanently delete "${cl?.name || 'this club'}"? This will remove all members, events, positions, and chat history. This cannot be undone.`)) return;
  try {
    const res = await apiDelete(`/api/executive/clubs/${clubId}`);
    if (res && !res.error) {
      showToast('Club deleted');
      closeExecModal();
      const idx = CLUBS.findIndex(c => c.id === clubId);
      if (idx !== -1) CLUBS.splice(idx, 1);
      state.execClubs = state.execClubs.filter(c => c.id !== clubId);
      renderHome();
    } else showToast(res?.error || 'Failed to delete club');
  } catch (e) { showToast('Failed to delete club'); }
}

function closeExecModal() {
  document.getElementById('execModal').classList.remove('open');
  execActiveClubId = null;
}

async function openExecTab(tab, clubId) {
  document.querySelectorAll('.exec-tile').forEach(t => t.classList.remove('active'));
  document.getElementById('etile-' + tab)?.classList.add('active');
  const contentEl = document.getElementById('execTabContent');

  if (tab === 'posts') {
    contentEl.innerHTML = `<div style="padding:0 24px 24px">
      <div style="font-family:var(--font2);font-size:16px;font-weight:700;margin-bottom:12px">Post Event Update</div>
      <div class="form-row"><label class="form-label">Title</label><input class="form-input" id="ep_post_title" placeholder="Event name or update title"/></div>
      <div class="form-row"><label class="form-label">Message / Details</label><textarea class="form-input" id="ep_post_body" style="min-height:80px" placeholder="Describe the event, rules, schedule..."></textarea></div>
      <div class="form-row"><label class="form-label">Entry Price (Rs, 0 if free)</label><input class="form-input" id="ep_post_price" type="number" value="0" min="0"/></div>
      <div class="form-row"><label class="form-label">Account Number (for payment)</label><input class="form-input" id="ep_post_acc" placeholder="e.g. 0301-1234567"/></div>
      <div class="form-row"><label class="form-label">Account Name</label><input class="form-input" id="ep_post_accname" placeholder="JazzCash / Easypaisa name"/></div>
      <div class="form-row"><label class="form-label">Payment Deadline</label><input class="form-input" id="ep_post_deadline" placeholder="e.g. April 30"/></div>
      <button class="btn-primary" onclick="submitExecPost(${clubId})" style="margin-top:8px;width:100%">Publish Update</button>
    </div>`;
  }
  else if (tab === 'members') {
    contentEl.innerHTML = `<div style="padding:0 24px 24px">
      <div style="font-family:var(--font2);font-size:16px;font-weight:700;margin-bottom:12px">Members</div>
      <div style="position:relative;margin-bottom:12px">
        <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);pointer-events:none;opacity:0.45"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
        <input class="form-input" id="memberSearch" placeholder="Search members..." style="padding-left:32px" oninput="filterExecMembers(this.value)"/>
      </div>
      <div id="execMemberList"><div style="color:var(--gray);font-size:13px">Loading...</div></div>`;
    const data = await apiGet(`/api/executive/clubs/${clubId}/members`).catch(() => []);
    const listEl = document.getElementById('execMemberList');
    if (!listEl) return;
    if (!data || !data.length) { listEl.innerHTML = '<div style="color:var(--gray);font-size:13px">No members yet.</div>'; return; }
    window._execMembersData = { clubId, members: data };
    listEl.innerHTML = data.map(m => {
      const u = m.users || {};
      const av = getAvatarUrl(u.avatar_url, u.first_name, u.last_name, 40);
      const name = `${u.first_name || ''} ${u.last_name || ''}`.trim();
      return `<div class="exec-member-row" data-name="${name.toLowerCase()}" data-email="${(u.email||'').toLowerCase()}" style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
        <img src="${av}" style="width:36px;height:36px;border-radius:50%;object-fit:cover"/>
        <div style="flex:1"><div style="font-weight:600;font-size:13px">${name}</div><div style="font-size:11px;color:var(--gray)">${u.email || ''}</div></div>
        <button onclick="execRemoveMember(${clubId},'${u.id}',this)" style="background:#e05555;border:none;color:white;border-radius:8px;padding:5px 10px;font-size:11px;cursor:pointer">Remove</button>
      </div>`;
    }).join('');
  }
  else if (tab === 'requests') {
    contentEl.innerHTML = `<div style="padding:0 24px 24px">
      <div style="font-family:var(--font2);font-size:16px;font-weight:700;margin-bottom:12px">Join Requests</div>
      <div id="execRequestList"><div style="color:var(--gray);font-size:13px">Loading...</div></div>`;
    const data = await apiGet(`/api/executive/clubs/${clubId}/requests`).catch(() => []);
    const listEl = document.getElementById('execRequestList');
    if (!listEl) return;
    if (!data || !data.length) {
      listEl.innerHTML = '<div style="color:var(--gray);font-size:13px;padding:16px 0;text-align:center">No pending join requests.</div>';
      return;
    }
    listEl.innerHTML = data.map(r => {
      const u = r.users || {};
      const av = getAvatarUrl(u.avatar_url, u.first_name, u.last_name, 40);
      const isPending = r.status === 'pending';
      const isInterview = r.status === 'interview';
      const stageBadge = isPending
        ? `<span style="background:rgba(201,162,39,0.15);color:var(--gold);border:1px solid var(--gold);border-radius:20px;font-size:10px;padding:2px 8px">Pending</span>`
        : `<span style="background:rgba(13,122,91,0.15);color:#4caf82;border:1px solid #4caf82;border-radius:20px;font-size:10px;padding:2px 8px">Interview Sent</span>`;
      const actionBtns = isPending
        ? `<button onclick="execOpenInterviewForm(${r.id},${clubId})" style="background:linear-gradient(135deg,#0d7a5b,#14a37c);border:none;color:white;border-radius:8px;padding:5px 10px;font-size:11px;cursor:pointer;white-space:nowrap">Schedule Interview</button>
           <button onclick="execHandleRequest(${r.id},'reject',this,${clubId})" style="background:#e05555;border:none;color:white;border-radius:8px;padding:5px 10px;font-size:11px;cursor:pointer">Reject</button>`
        : `<button onclick="execHandleRequest(${r.id},'accept',this,${clubId})" style="background:#4caf82;border:none;color:white;border-radius:8px;padding:5px 10px;font-size:11px;cursor:pointer">Accept</button>
           <button onclick="execHandleRequest(${r.id},'reject',this,${clubId})" style="background:#e05555;border:none;color:white;border-radius:8px;padding:5px 10px;font-size:11px;cursor:pointer">Reject</button>`;
      return `<div style="padding:12px 0;border-bottom:1px solid var(--border)" id="req-${r.id}">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <img src="${av}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0"/>
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;font-size:13px">${u.first_name || ''} ${u.last_name || ''} ${stageBadge}</div>
            <div style="font-size:11px;color:var(--gray);margin-top:2px">${u.email || ''} · Year ${u.year || '?'}</div>
          </div>
        </div>
        <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:8px 10px;margin-bottom:8px">
          <div style="font-size:10px;color:var(--gold);font-weight:600;margin-bottom:3px">REASON</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.8);font-style:italic">${r.message || '(No reason provided)'}</div>
        </div>
        ${isInterview ? `<div style="background:rgba(13,122,91,0.08);border:1px solid rgba(13,122,91,0.3);border-radius:8px;padding:8px 10px;margin-bottom:8px">
          <div style="font-size:10px;color:#4caf82;font-weight:600;margin-bottom:3px">INTERVIEW DETAILS SENT</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.8)">${r.interview_msg}</div>
        </div>` : ''}
        <div style="display:flex;gap:6px;flex-wrap:wrap">${actionBtns}</div>
      </div>`;
    }).join('');
  }
  else if (tab === 'applications') {
    contentEl.innerHTML = `<div style="padding:0 24px 24px">
      <div style="font-family:var(--font2);font-size:16px;font-weight:700;margin-bottom:12px">Applications</div>
      <div id="execAppList"><div style="color:var(--gray);font-size:13px">Loading...</div></div>`;
    const data = await apiGet(`/api/executive/clubs/${clubId}/applications`).catch(() => []);
    const listEl = document.getElementById('execAppList');
    if (!listEl) return;
    if (!data || !data.length) {
      listEl.innerHTML = '<div style="color:var(--gray);font-size:13px;padding:16px 0;text-align:center">No applications yet. Publish a position first.</div>';
      return;
    }
    listEl.innerHTML = data.map(a => {
      const u = a.users || {};
      const p = a.positions || {};
      const av = getAvatarUrl(u.avatar_url, u.first_name, u.last_name, 40);
      const statusColors = { 'Under Review': 'var(--gold)', 'Interview': '#14a37c', 'Shortlisted': '#7c3aed' };
      const sc = statusColors[a.status] || 'var(--gray)';
      const isInterview = a.status === 'Interview';
      const actionBtns = isInterview
        ? `<button onclick="execHandleApp(${a.id},'accept',this,${clubId})" style="background:#4caf82;border:none;color:white;border-radius:8px;padding:5px 10px;font-size:11px;cursor:pointer">Accept</button>
           <button onclick="execHandleApp(${a.id},'reject',this,${clubId})" style="background:#e05555;border:none;color:white;border-radius:8px;padding:5px 10px;font-size:11px;cursor:pointer">Reject</button>`
        : `<button onclick="execOpenAppInterviewForm(${a.id},${clubId})" style="background:linear-gradient(135deg,#0d7a5b,#14a37c);border:none;color:white;border-radius:8px;padding:5px 10px;font-size:11px;cursor:pointer;white-space:nowrap">Schedule Interview</button>
           <button onclick="execHandleApp(${a.id},'reject',this,${clubId})" style="background:#e05555;border:none;color:white;border-radius:8px;padding:5px 10px;font-size:11px;cursor:pointer">Reject</button>`;
      return `<div style="padding:12px 0;border-bottom:1px solid var(--border)" id="app-${a.id}">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <img src="${av}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0"/>
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;font-size:13px">${u.first_name || ''} ${u.last_name || ''} <span style="background:${sc}20;color:${sc};border:1px solid ${sc};border-radius:20px;font-size:10px;padding:1px 7px">${a.status}</span></div>
            <div style="font-size:11px;color:var(--gold);margin-top:1px">${p.position || 'Position'}</div>
            <div style="font-size:11px;color:var(--gray)">${u.email || ''} · Year ${u.year || '?'}</div>
          </div>
        </div>
        <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:8px 10px;margin-bottom:8px">
          <div style="font-size:10px;color:var(--gold);font-weight:600;margin-bottom:3px">WHY THIS ROLE?</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.8);font-style:italic">${a.why || '(No reason provided)'}</div>
        </div>
        ${isInterview && a.interview_msg ? `<div style="background:rgba(13,122,91,0.08);border:1px solid rgba(13,122,91,0.3);border-radius:8px;padding:8px 10px;margin-bottom:8px">
          <div style="font-size:10px;color:#4caf82;font-weight:600;margin-bottom:3px">INTERVIEW SENT</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.8)">${a.interview_msg}</div>
        </div>` : ''}
        <div style="display:flex;gap:6px;flex-wrap:wrap">${actionBtns}</div>
      </div>`;
    }).join('');
  }
  else if (tab === 'announce') {
    contentEl.innerHTML = `<div style="padding:0 24px 24px">
      <div style="font-family:var(--font2);font-size:16px;font-weight:700;margin-bottom:12px">Send Announcement</div>
      <div class="form-row"><label class="form-label">Announcement Text</label><textarea class="form-input" id="ep_announce_text" style="min-height:100px" placeholder="Announce something to all club members..."></textarea></div>
      <button class="btn-primary" onclick="submitExecAnnouncement(${clubId})" style="margin-top:8px;width:100%">Send to All Members</button>
    </div>`;
  }
  else if (tab === 'positions') {
    contentEl.innerHTML = `<div style="padding:0 24px 24px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px"><div style="font-family:var(--font2);font-size:16px;font-weight:700">Positions</div></div>
      <div id="execPosList"><div style="color:var(--gray);font-size:13px">Loading...</div></div>`;
    const posData = await apiGet(`/api/executive/clubs/${clubId}/positions`).catch(() => []);
    const listEl = document.getElementById('execPosList');
    if (!listEl) return;
    listEl.innerHTML = `
      <button class="btn-primary" onclick="execOpenCreatePositionForm(${clubId})" style="width:100%;margin-bottom:14px;background:linear-gradient(135deg,#1a2b5e,#2d4a8a)">+ Create New Position</button>
      <div id="execPosCreateForm" style="display:none"></div>
      ${(posData && posData.length) ? posData.map(pos => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)" id="epos-${pos.id}">
          <div style="flex:1">
            <div style="font-weight:600;font-size:13px">${pos.position}</div>
            <div style="font-size:11px;color:var(--gray)">${pos.type} \u00b7 Deadline: ${pos.deadline}</div>
            <div style="font-size:10px;margin-top:2px"><span style="background:${pos.status === 'open' ? 'rgba(76,175,130,0.15)' : 'rgba(255,255,255,0.05)'};color:${pos.status === 'open' ? '#4caf82' : 'var(--gray)'};border-radius:20px;padding:1px 7px">${pos.status}</span></div>
          </div>
          ${pos.status === 'open' ? `<button onclick="execClosePosition(${pos.id},${clubId})" style="background:rgba(224,85,85,0.15);border:1px solid #e05555;color:#e05555;border-radius:8px;padding:5px 10px;font-size:11px;cursor:pointer">Close</button>` : ''}
        </div>`).join('') : '<div style="color:var(--gray);font-size:13px;padding:12px 0">No positions created yet.</div>'}`;
  }
}

async function submitExecPost(clubId) {
  const title = document.getElementById('ep_post_title')?.value.trim();
  const body = document.getElementById('ep_post_body')?.value.trim();
  const price = parseInt(document.getElementById('ep_post_price')?.value || '0');
  const acc = document.getElementById('ep_post_acc')?.value.trim();
  const accname = document.getElementById('ep_post_accname')?.value.trim();
  const deadline = document.getElementById('ep_post_deadline')?.value.trim();
  if (!title || !body) { showToast('Title and message are required'); return; }
  try {
    const res = await apiPost(`/api/executive/clubs/${clubId}/posts`, { title, body, price, accountNumber: acc, accountName: accname, paymentDeadline: deadline });
    if (res && !res.error) { showToast('Update posted and members notified!'); closeApply(); }
    else showToast(res?.error || 'Failed to post update');
  } catch (e) { showToast('Failed to post update'); }
}

async function execAddMember(clubId) {
  const email = document.getElementById('addMemberEmail')?.value.trim();
  if (!email) { showToast('Enter an email address'); return; }
  try {
    const res = await apiPost(`/api/executive/clubs/${clubId}/members`, { email });
    if (res && !res.error) { showToast(`${res.user?.name || 'Member'} added!`); openExecTab('members', clubId); }
    else showToast(res?.error || 'Failed to add member');
  } catch (e) { showToast('Failed to add member'); }
}

function filterExecMembers(query) {
  const q = query.toLowerCase().trim();
  document.querySelectorAll('#execMemberList .exec-member-row').forEach(row => {
    const name = row.dataset.name || '';
    const email = row.dataset.email || '';
    row.style.display = (!q || name.includes(q) || email.includes(q)) ? '' : 'none';
  });
}

async function execRemoveMember(clubId, userId, btn) {
  if (!confirm('Remove this member from the club?')) return;
  try {
    const res = await apiDelete(`/api/executive/clubs/${clubId}/members/${userId}`);
    if (res && !res.error) { showToast('Member removed'); btn.closest('div[style*="display:flex"]').remove(); }
    else showToast(res?.error || 'Failed');
  } catch (e) { showToast('Failed to remove member'); }
}

// Opens interview scheduling form inside the exec modal
function execOpenInterviewForm(requestId, clubId) {
  const reqEl = document.getElementById(`req-${requestId}`);
  if (!reqEl) return;
  // Replace action buttons with inline form
  const existingForm = reqEl.querySelector('.interview-form-inline');
  if (existingForm) { existingForm.remove(); return; } // toggle
  const formHtml = `<div class="interview-form-inline" style="background:rgba(13,122,91,0.1);border:1px solid rgba(13,122,91,0.4);border-radius:10px;padding:12px;margin-top:8px">
    <div style="font-size:11px;color:#4caf82;font-weight:700;margin-bottom:6px">SCHEDULE INTERVIEW</div>
    <textarea id="interviewMsgInput_${requestId}" class="form-input" style="min-height:70px;font-size:12px;margin-bottom:8px" placeholder="e.g. Your interview is on Thursday May 8 at 3:00 PM in Room CS-201. Please bring your student card."></textarea>
    <div style="display:flex;gap:6px">
      <button onclick="execSubmitInterview(${requestId},${clubId})" style="background:linear-gradient(135deg,#0d7a5b,#14a37c);border:none;color:white;border-radius:8px;padding:6px 14px;font-size:12px;cursor:pointer;font-weight:600">Send to Student</button>
      <button onclick="this.closest('.interview-form-inline').remove()" style="background:rgba(255,255,255,0.08);border:1px solid var(--border);color:white;border-radius:8px;padding:6px 12px;font-size:12px;cursor:pointer">Cancel</button>
    </div>
  </div>`;
  reqEl.insertAdjacentHTML('beforeend', formHtml);
}

async function execSubmitInterview(requestId, clubId) {
  const textarea = document.getElementById(`interviewMsgInput_${requestId}`);
  const msg = textarea?.value.trim();
  if (!msg) { showToast('Please write the interview details'); return; }
  const sendBtn = textarea.parentElement.querySelector('button');
  if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = 'Sending...'; }
  try {
    const res = await apiPut(`/api/executive/requests/${requestId}/interview`, { interviewMsg: msg });
    if (res && !res.error) {
      showToast('Interview details sent to student');
      // Refresh the requests list to show updated status
      openExecTab('requests', clubId);
    } else {
      showToast(res?.error || 'Failed to send interview');
      if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = 'Send to Student'; }
    }
  } catch (e) {
    showToast('Failed to send interview');
    if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = 'Send to Student'; }
  }
}

async function execHandleRequest(requestId, action, btn, clubId) {
  btn.disabled = true; btn.textContent = '...';
  try {
    const res = await apiPut(`/api/executive/requests/${requestId}`, { action });
    if (res && !res.error) {
      showToast(action === 'accept' ? 'Request accepted' : 'Request rejected');
      document.getElementById(`req-${requestId}`)?.remove();
      // Show empty state if no more requests
      const listEl = document.getElementById('execRequestList');
      if (listEl && !listEl.querySelector('[id^="req-"]')) {
        listEl.innerHTML = '<div style="color:var(--gray);font-size:13px;padding:16px 0;text-align:center">No pending join requests.</div>';
      }
    } else {
      showToast(res?.error || 'Failed');
      btn.disabled = false;
      btn.textContent = action === 'accept' ? 'Accept' : 'Reject';
    }
  } catch (e) { showToast('Failed'); btn.disabled = false; }
}

async function submitExecAnnouncement(clubId) {
  const text = document.getElementById('ep_announce_text')?.value.trim();
  if (!text) { showToast('Enter announcement text'); return; }
  try {
    const res = await apiPost(`/api/executive/clubs/${clubId}/announcements`, { text });
    if (res && !res.error) { showToast('Announcement posted to all members!'); closeApply(); }
    else showToast(res?.error || 'Failed');
  } catch (e) { showToast('Failed to post announcement'); }
}

function execOpenAppInterviewForm(appId, clubId) {
  const appEl = document.getElementById(`app-${appId}`);
  if (!appEl) return;
  const existing = appEl.querySelector('.app-interview-form');
  if (existing) { existing.remove(); return; }
  appEl.insertAdjacentHTML('beforeend', `
    <div class="app-interview-form" style="background:rgba(13,122,91,0.1);border:1px solid rgba(13,122,91,0.4);border-radius:10px;padding:12px;margin-top:8px">
      <div style="font-size:11px;color:#4caf82;font-weight:700;margin-bottom:6px">SCHEDULE INTERVIEW</div>
      <textarea id="appInterviewMsg_${appId}" class="form-input" style="min-height:70px;font-size:12px;margin-bottom:8px" placeholder="e.g. Interview on Friday May 9 at 2:00 PM in Room B-204. Please bring your CV."></textarea>
      <div style="display:flex;gap:6px">
        <button onclick="execSubmitAppInterview(${appId},${clubId})" style="background:linear-gradient(135deg,#0d7a5b,#14a37c);border:none;color:white;border-radius:8px;padding:6px 14px;font-size:12px;cursor:pointer;font-weight:600">Send to Applicant</button>
        <button onclick="this.closest('.app-interview-form').remove()" style="background:rgba(255,255,255,0.08);border:1px solid var(--border);color:white;border-radius:8px;padding:6px 12px;font-size:12px;cursor:pointer">Cancel</button>
      </div>
    </div>`);
}

async function execSubmitAppInterview(appId, clubId) {
  const textarea = document.getElementById(`appInterviewMsg_${appId}`);
  const msg = textarea?.value.trim();
  if (!msg) { showToast('Please write the interview details'); return; }
  const sendBtn = textarea.parentElement.querySelector('button');
  if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = 'Sending...'; }
  try {
    const res = await apiPut(`/api/executive/clubs/${clubId}/applications/${appId}`, { action: 'interview', interviewMsg: msg });
    if (res && !res.error) {
      showToast('Interview details sent');
      openExecTab('applications', clubId);
    } else {
      showToast(res?.error || 'Failed');
      if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = 'Send to Applicant'; }
    }
  } catch (e) { showToast('Failed'); if (sendBtn) { sendBtn.disabled = false; } }
}

async function execHandleApp(appId, action, btn, clubId) {
  btn.disabled = true; btn.textContent = '...';
  try {
    const res = await apiPut(`/api/executive/clubs/${clubId}/applications/${appId}`, { action });
    if (res && !res.error) {
      showToast(action === 'accept' ? 'Applicant accepted and added to club' : 'Application rejected');
      document.getElementById(`app-${appId}`)?.remove();
      const listEl = document.getElementById('execAppList');
      if (listEl && !listEl.querySelector('[id^="app-"]')) {
        listEl.innerHTML = '<div style="color:var(--gray);font-size:13px;padding:16px 0;text-align:center">No pending applications.</div>';
      }
    } else {
      showToast(res?.error || 'Failed');
      btn.disabled = false;
      btn.textContent = action === 'accept' ? 'Accept' : 'Reject';
    }
  } catch (e) { showToast('Failed'); btn.disabled = false; }
}

function execOpenCreatePositionForm(clubId) {
  const formEl = document.getElementById('execPosCreateForm');
  if (!formEl) return;
  if (formEl.style.display !== 'none') { formEl.style.display = 'none'; return; }
  formEl.innerHTML = `
    <div style="background:rgba(26,43,94,0.3);border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:14px">
      <div style="font-size:12px;color:var(--gold);font-weight:700;margin-bottom:10px">NEW POSITION</div>
      <div class="form-row"><label class="form-label">Position Title *</label><input class="form-input" id="np_title" placeholder="e.g. Head of Marketing"/></div>
      <div class="form-row"><label class="form-label">Type *</label>
        <select class="form-input" id="np_type">
          <option>Full-time</option><option>Part-time</option><option>Volunteer</option><option>Lead</option><option>Internship</option>
        </select></div>
      <div class="form-row"><label class="form-label">Application Deadline *</label><input class="form-input" id="np_deadline" placeholder="e.g. May 20, 2026"/></div>
      <div class="form-row"><label class="form-label">Description</label><textarea class="form-input" id="np_desc" style="min-height:70px" placeholder="Describe the role and responsibilities..."></textarea></div>
      <div class="form-row"><label class="form-label">Requirements (comma-separated)</label><input class="form-input" id="np_reqs" placeholder="e.g. Leadership, Design Skills, Communication"/></div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button class="btn-primary" onclick="execSubmitPosition(${clubId})" style="flex:1">Publish Position</button>
        <button onclick="document.getElementById('execPosCreateForm').style.display='none'" style="background:rgba(255,255,255,0.06);border:1px solid var(--border);color:white;border-radius:10px;padding:10px 14px;cursor:pointer">Cancel</button>
      </div>
    </div>`;
  formEl.style.display = 'block';
}

async function execSubmitPosition(clubId) {
  const title = document.getElementById('np_title')?.value.trim();
  const type = document.getElementById('np_type')?.value;
  const deadline = document.getElementById('np_deadline')?.value.trim();
  const desc = document.getElementById('np_desc')?.value.trim();
  const reqsRaw = document.getElementById('np_reqs')?.value.trim();
  const reqs = reqsRaw ? reqsRaw.split(',').map(r => r.trim()).filter(Boolean) : [];
  if (!title || !deadline) { showToast('Position title and deadline are required'); return; }
  try {
    const res = await apiPost(`/api/executive/clubs/${clubId}/positions`, {
      position: title, type, deadline, description: desc, requirements: reqs
    });
    if (res && !res.error) {
      showToast('Position published');
      // Add to local POSITIONS array immediately
      POSITIONS.unshift({
        id: res.position.id, clubId, club: res.position.club_name,
        pos: title, type, deadline, desc, requirements: reqs, status: 'open',
      });
      openExecTab('positions', clubId);
    } else showToast(res?.error || 'Failed to create position');
  } catch (e) { showToast('Failed to create position'); }
}

async function execClosePosition(posId, clubId) {
  if (!confirm('Close this position? Students will no longer be able to apply.')) return;
  try {
    const res = await apiDelete(`/api/executive/clubs/${clubId}/positions/${posId}`);
    if (res && !res.error) {
      showToast('Position closed');
      const el = document.getElementById(`epos-${posId}`);
      if (el) el.querySelector('button')?.remove();
      const idx = POSITIONS.findIndex(p => p.id === posId);
      if (idx > -1) POSITIONS.splice(idx, 1);
    } else showToast(res?.error || 'Failed');
  } catch (e) { showToast('Failed'); }
}

// ===== CREATE / EDIT CLUB (Executive) =====
function openCreateClubModal(existingClubId) {
  const isEdit = !!existingClubId;
  // Merge exec club DB data with local CLUBS data (local has all mapped fields like rules, photoUrl)
  const execClubDb = isEdit ? state.execClubs.find(c => c.id === existingClubId) : {};
  const localClub = isEdit ? CLUBS.find(c => c.id === existingClubId) : {};
  const ec = { ...localClub, ...execClubDb } || {};
  document.getElementById('applyTitle').textContent = isEdit ? 'Edit Club' : 'Create New Club';
  document.getElementById('applyContent').innerHTML = `
    <div class="form-row"><label class="form-label">Club Name *</label><input class="form-input" id="cc_name" value="${ec.name || ''}"/></div>
    <div class="form-row"><label class="form-label">Category *</label>
      <select class="form-input" id="cc_cat">
        ${['Technology', 'Sports', 'Arts & Culture', 'Business', 'Music', 'Drama', 'Debate', 'Research', 'Social'].map(c => `<option ${(ec.category || '') == c ? 'selected' : ''}>${c}</option>`).join('')}
      </select></div>
    <div class="form-row"><label class="form-label">Emoji Icon</label><input class="form-input" id="cc_emoji" value="${ec.emoji || ''}" placeholder="Optional emoji"/></div>
    <div class="form-row"><label class="form-label">Description</label><textarea class="form-input" id="cc_desc" style="min-height:70px">${ec.desc || ec.description || ''}</textarea></div>
    <div class="form-row">
      <label class="form-label">Club Photo</label>
      <div style="display:flex;align-items:center;gap:12px">
        <img id="cc_photo_preview" src="${ec.photoUrl || ec.photo_url || getAvatarUrl('', ec.name || 'Club', '', 60)}" style="width:60px;height:60px;border-radius:12px;object-fit:cover;border:1px solid var(--border)"/>
        <label for="cc_photo_file" class="btn-outline" style="cursor:pointer;padding:8px 16px;font-size:12px">Upload Image</label>
        <input type="file" id="cc_photo_file" accept="image/*" style="display:none" onchange="handleClubPhotoUpload(this)"/>
        <input type="hidden" id="cc_photo" value="${ec.photoUrl || ec.photo_url || ''}"/>
      </div>
    </div>
    <div class="form-row"><label class="form-label">Instagram Handle</label><input class="form-input" id="cc_ig" value="${ec.socials?.ig || ec.ig_handle || ''}" placeholder="@clubname"/></div>
    <div class="form-row"><label class="form-label">LinkedIn URL</label><input class="form-input" id="cc_li" value="${ec.socials?.linkedin || ec.linkedin || ''}" placeholder="linkedin.com/company/..."/></div>
    <div style="font-size:12px;color:var(--gold);font-weight:700;margin:10px 0 6px">Payment Details</div>
    <div class="form-row"><label class="form-label">Account Number</label><input class="form-input" id="cc_acc" value="${ec.accountNumber || ec.account_number || ''}" placeholder="0301-1234567"/></div>
    <div class="form-row"><label class="form-label">Account Name</label><input class="form-input" id="cc_accname" value="${ec.accountName || ec.account_name || ''}" placeholder="Muhammad Ali (JazzCash)"/></div>
    <div class="form-row"><label class="form-label">Payment Instructions</label><textarea class="form-input" id="cc_payinfo" placeholder="Send screenshot to exec after payment...">${ec.paymentInfo || ec.payment_info || ''}</textarea></div>
    <div class="form-row"><label class="form-label">Club Rules</label><textarea class="form-input" id="cc_rules" placeholder="1. Respect all members...">${ec.rules || ''}</textarea></div>
    <button class="btn-primary" onclick="${isEdit ? `saveClubEdit(${existingClubId})` : 'createClub()'}" style="margin-top:8px;background:linear-gradient(135deg,#7c3aed,#9f6ddc)">${isEdit ? 'Save Changes' : 'Create Club'}</button>`;
  document.getElementById('applyModal').classList.add('open');
}

async function handleClubPhotoUpload(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { showToast('Image must be under 2MB'); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    document.getElementById('cc_photo').value = dataUrl;
    document.getElementById('cc_photo_preview').src = dataUrl;
  };
  reader.readAsDataURL(file);
}

async function createClub() {
  const name = document.getElementById('cc_name')?.value.trim();
  const cat = document.getElementById('cc_cat')?.value;
  const emoji = document.getElementById('cc_emoji')?.value.trim() || '';
  if (!name) { showToast('Club name is required'); return; }
  const payload = {
    name, category: cat, emoji,
    description: document.getElementById('cc_desc')?.value.trim(),
    photoUrl: document.getElementById('cc_photo')?.value.trim(),
    igHandle: document.getElementById('cc_ig')?.value.trim(),
    linkedin: document.getElementById('cc_li')?.value.trim(),
    accountNumber: document.getElementById('cc_acc')?.value.trim(),
    accountName: document.getElementById('cc_accname')?.value.trim(),
    paymentInfo: document.getElementById('cc_payinfo')?.value.trim(),
    rules: document.getElementById('cc_rules')?.value.trim(),
  };
  try {
    const res = await apiPost('/api/executive/clubs', payload);
    if (res && !res.error) {
      showToast('Club created successfully');
      // Add to execClubs
      state.execClubs.push(res.club);
      // Add to local CLUBS array for instant rendering
      const newClub = {
        id: res.club.id, name: res.club.name, category: res.club.category,
        emoji: res.club.emoji, members: 1, desc: res.club.description || '',
        leadership: [], joined: true, saved: false, announcements: [],
        chatId: res.club.chat_id, photoUrl: res.club.photo_url || '',
        accountNumber: res.club.account_number || '', accountName: res.club.account_name || '',
        paymentInfo: res.club.payment_info || '', rules: res.club.rules || '',
        socials: { ig: res.club.ig_handle, linkedin: res.club.linkedin }
      };
      CLUBS.push(newClub);
      closeApply();
      renderProfile();
      navigate('explore');
      switchExploreTab('clubs');
    } else showToast(res?.error || 'Failed to create club');
  } catch (e) { showToast('Failed to create club'); }
}

async function saveClubEdit(clubId) {
  const payload = {
    name: document.getElementById('cc_name')?.value.trim(),
    category: document.getElementById('cc_cat')?.value,
    emoji: document.getElementById('cc_emoji')?.value.trim(),
    description: document.getElementById('cc_desc')?.value.trim(),
    photoUrl: document.getElementById('cc_photo')?.value.trim(),
    igHandle: document.getElementById('cc_ig')?.value.trim(),
    linkedin: document.getElementById('cc_li')?.value.trim(),
    accountNumber: document.getElementById('cc_acc')?.value.trim(),
    accountName: document.getElementById('cc_accname')?.value.trim(),
    paymentInfo: document.getElementById('cc_payinfo')?.value.trim(),
    rules: document.getElementById('cc_rules')?.value.trim(),
  };
  try {
    const res = await apiPut(`/api/executive/clubs/${clubId}`, payload);
    if (res && !res.error) {
      // Update local execClubs state
      const idx = state.execClubs.findIndex(c => c.id === clubId);
      if (idx > -1) state.execClubs[idx] = { ...state.execClubs[idx], ...res.club };
      // Update local CLUBS array
      const ci = CLUBS.findIndex(c => c.id === clubId);
      if (ci > -1) {
        CLUBS[ci].name = payload.name || CLUBS[ci].name;
        CLUBS[ci].desc = payload.description || CLUBS[ci].desc;
        CLUBS[ci].photoUrl = payload.photoUrl || CLUBS[ci].photoUrl;
        CLUBS[ci].category = payload.category || CLUBS[ci].category;
        CLUBS[ci].emoji = payload.emoji || CLUBS[ci].emoji;
        CLUBS[ci].accountNumber = payload.accountNumber || CLUBS[ci].accountNumber;
        CLUBS[ci].accountName = payload.accountName || CLUBS[ci].accountName;
        CLUBS[ci].paymentInfo = payload.paymentInfo || CLUBS[ci].paymentInfo;
      }
      showToast('Club updated');
      closeApply();
      renderProfile();
    } else showToast(res?.error || 'Failed to update club');
  } catch (e) { showToast('Failed to update club'); }
}

// ===== MAPS CLUBS TO LOCAL FORMAT INCLUDING NEW FIELDS =====
function mapClubFromApi(cl) {
  return {
    id: cl.id,
    name: cl.name,
    category: cl.category,
    emoji: cl.emoji,
    members: cl.members,
    desc: cl.description,
    leadership: (cl.club_leaders || []).map(l => ({ name: l.name, role: l.role, img: l.img || '' })),
    joined: false,
    saved: false,
    announcements: (cl.club_announcements || []).map(a => a.text),
    chatId: cl.chat_id,
    photoUrl: cl.photo_url || '',
    accountNumber: cl.account_number || '',
    accountName: cl.account_name || '',
    paymentInfo: cl.payment_info || '',
    rules: cl.rules || '',
    executiveId: cl.executive_id || '',
    socials: { ig: cl.ig_handle, linkedin: cl.linkedin },
  };
}

window.addEventListener('DOMContentLoaded', init);
window.addEventListener('popstate', () => { /* handled */ });

// ===== NOTIFICATION AUDIO CHIME =====
let _audioCtx = null;
function playNotifChime() {
  try {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = _audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1108, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) { }
}

// Patch showToast to play chime for notification toasts
const _origShowToast = showToast;
window.showToast = function (msg, isNotif) {
  if (isNotif) playNotifChime();
  _origShowToast(msg);
};

// ===== CALENDAR BACKGROUND ANIMATION (optimised) =====
let _calCanvas = null, _calAnimFrame = null;
function initCalendarBackground() {
  if (_calCanvas) return; // already running
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;opacity:0.45;';
  canvas.id = 'calBg';
  document.body.appendChild(canvas);
  _calCanvas = canvas;
  const ctx = canvas.getContext('2d');
  let W, H, particles;
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  function initParticles() {
    // 30 particles instead of 60 — halves render cost
    particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 2 + 1, alpha: Math.random() * 0.5 + 0.15,
    }));
  }
  resize(); initParticles();
  const onResize = () => { resize(); initParticles(); };
  window.addEventListener('resize', onResize);
  function draw() {
    if (!_calCanvas) return;
    ctx.clearRect(0, 0, W, H);
    const n = particles.length;
    for (let i = 0; i < n; i++) {
      const p = particles[i];
      // Only check next 8 neighbours to avoid O(n²)
      for (let j = i + 1; j < Math.min(i + 9, n); j++) {
        const q = particles[j];
        const dx = p.x - q.x, dy = p.y - q.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(201,162,39,${0.1 * (1 - dist / 130)})`;
          ctx.lineWidth = 0.7;
          ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(201,162,39,${p.alpha})`;
      ctx.fill();
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
    }
    _calAnimFrame = requestAnimationFrame(draw);
  }
  draw();
}
function destroyCalendarBackground() {
  if (_calCanvas) { _calCanvas.remove(); _calCanvas = null; }
  if (_calAnimFrame) { cancelAnimationFrame(_calAnimFrame); _calAnimFrame = null; }
}

// Patch navigate to start/stop calendar background
const _origNavigate = navigate;
window.navigate = function (page) {
  if (page === 'calendar') initCalendarBackground();
  else destroyCalendarBackground();
  _origNavigate(page);
};

// ===== PROFILE SETTINGS MODALS =====
function openPrivacySettings() {
  const prefs = JSON.parse(localStorage.getItem('unisync_privacy') || '{}');
  document.getElementById('applyTitle').textContent = 'Privacy Settings';
  document.getElementById('applyContent').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:0">
      ${[
      { key: 'showEmail', label: 'Show email to members', icon: 'envelope' },
      { key: 'showPhone', label: 'Show phone number', icon: 'phone' },
      { key: 'showLinkedIn', label: 'Show LinkedIn profile', icon: 'link' },
      { key: 'showInterests', label: 'Show interests', icon: 'tag' },
    ].map(item => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.07)">
        <span style="font-size:14px;font-weight:500">${item.label}</span>
        <label class="toggle-switch"><input type="checkbox" id="priv_${item.key}" ${prefs[item.key] !== false ? 'checked' : ''}><span class="slider"></span></label>
      </div>`).join('')}
    </div>
    <div style="margin-top:8px">
      <div style="font-size:12px;color:var(--gray);margin-bottom:8px;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Profile Visibility</div>
      ${['Public', 'Connections Only', 'Private'].map(v => `
        <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;cursor:pointer;margin-bottom:4px;background:${(prefs.visibility || 'Public') === v ? 'rgba(201,162,39,0.1)' : 'transparent'};border:1px solid ${(prefs.visibility || 'Public') === v ? 'var(--gold)' : 'transparent'}">
          <input type="radio" name="visibility" value="${v}" ${(prefs.visibility || 'Public') === v ? 'checked' : ''} style="accent-color:var(--gold)">
          <span style="font-size:14px">${v}</span>
        </label>`).join('')}
    </div>
    <button class="btn-primary" onclick="savePrivacySettings()" style="margin-top:16px">Save Privacy Settings</button>`;
  document.getElementById('applyModal').classList.add('open');
}
function savePrivacySettings() {
  const prefs = {};
  ['showEmail', 'showPhone', 'showLinkedIn', 'showInterests'].forEach(k => {
    prefs[k] = document.getElementById('priv_' + k)?.checked;
  });
  const vis = document.querySelector('input[name="visibility"]:checked');
  prefs.visibility = vis ? vis.value : 'Public';
  localStorage.setItem('unisync_privacy', JSON.stringify(prefs));
  closeApply();
  showToast('Privacy settings saved');
}

function openAppearanceSettings() {
  const prefs = JSON.parse(localStorage.getItem('unisync_appearance') || '{}');
  const accents = [
    { key: 'gold', label: 'Gold', color: '#c9a227' },
    { key: 'teal', label: 'Teal', color: '#2dd4bf' },
    { key: 'violet', label: 'Violet', color: '#7c3aed' },
    { key: 'coral', label: 'Coral', color: '#f97316' },
    { key: 'sky', label: 'Sky', color: '#38bdf8' },
  ];
  document.getElementById('applyTitle').textContent = 'Appearance';
  document.getElementById('applyContent').innerHTML = `
    <div style="margin-bottom:20px">
      <div style="font-size:12px;color:var(--gray);margin-bottom:12px;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Accent Color</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        ${accents.map(a => `
          <button onclick="setAccentColor('${a.color}','${a.key}',this)" style="width:44px;height:44px;border-radius:50%;background:${a.color};border:3px solid ${(prefs.accent || 'gold') === a.key ? 'white' : 'transparent'};cursor:pointer;transition:all .2s" title="${a.label}" data-key="${a.key}"></button>`).join('')}
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.07)">
      <span style="font-size:14px;font-weight:500">Compact Mode</span>
      <label class="toggle-switch"><input type="checkbox" id="pref_compact" ${prefs.compact ? 'checked' : ''}><span class="slider"></span></label>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.07)">
      <span style="font-size:14px;font-weight:500">Reduce Animations</span>
      <label class="toggle-switch"><input type="checkbox" id="pref_reduceanim" ${prefs.reduceAnimations ? 'checked' : ''}><span class="slider"></span></label>
    </div>
    <button class="btn-primary" onclick="saveAppearanceSettings()" style="margin-top:16px">Apply Settings</button>`;
  document.getElementById('applyModal').classList.add('open');
}
function setAccentColor(color, key, btn) {
  document.querySelectorAll('[data-key]').forEach(b => b.style.borderColor = 'transparent');
  btn.style.borderColor = 'white';
  document.documentElement.style.setProperty('--gold', color);
}
function saveAppearanceSettings() {
  const prefs = {
    compact: document.getElementById('pref_compact')?.checked,
    reduceAnimations: document.getElementById('pref_reduceanim')?.checked,
  };
  localStorage.setItem('unisync_appearance', JSON.stringify(prefs));
  if (prefs.compact) document.body.classList.add('compact-mode');
  else document.body.classList.remove('compact-mode');
  closeApply();
  showToast('Appearance updated');
}

function openAccountSecurity() {
  document.getElementById('applyTitle').textContent = 'Account Security';
  document.getElementById('applyContent').innerHTML = `
    <div style="background:rgba(201,162,39,0.07);border:1px solid rgba(201,162,39,0.2);border-radius:12px;padding:14px;margin-bottom:20px">
      <div style="font-size:13px;color:var(--gray);line-height:1.5">Change your account password. You must provide your current password to set a new one.</div>
    </div>
    <div class="form-row"><label class="form-label">Current Password</label><input class="form-input" id="sec_curr" type="password" placeholder="Current password"/></div>
    <div class="form-row"><label class="form-label">New Password</label><input class="form-input" id="sec_new" type="password" placeholder="Min. 8 characters"/></div>
    <div class="form-row"><label class="form-label">Confirm New Password</label><input class="form-input" id="sec_conf" type="password" placeholder="Repeat new password"/></div>
    <button class="btn-primary" onclick="submitChangePassword()" style="margin-top:8px">Update Password</button>`;
  document.getElementById('applyModal').classList.add('open');
}
async function submitChangePassword() {
  const curr = document.getElementById('sec_curr')?.value;
  const newP = document.getElementById('sec_new')?.value;
  const conf = document.getElementById('sec_conf')?.value;
  if (!curr || !newP) { showToast('All fields are required'); return; }
  if (newP.length < 8) { showToast('Password must be at least 8 characters'); return; }
  if (newP !== conf) { showToast('New passwords do not match'); return; }
  const btn = document.querySelector('#applyContent .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Updating...'; }
  try {
    const res = await apiPut('/api/auth/change-password', { currentPassword: curr, newPassword: newP });
    if (res && !res.error) { closeApply(); showToast('Password updated successfully'); }
    else { showToast(res?.error || 'Failed to update password'); if (btn) { btn.disabled = false; btn.textContent = 'Update Password'; } }
  } catch (e) { showToast('Failed to update password'); if (btn) { btn.disabled = false; btn.textContent = 'Update Password'; } }
}

function openAboutModal() {
  document.getElementById('applyTitle').textContent = 'About UniSync';
  document.getElementById('applyContent').innerHTML = `
    <div style="text-align:center;padding:16px 0 24px">
      <svg viewBox="0 0 50 60" width="60" height="72" style="filter:drop-shadow(0 4px 16px rgba(201,162,39,0.5));margin-bottom:12px">
        <polygon points="25,2 48,14 48,46 25,58 2,46 2,14" fill="none" stroke="#c9a227" stroke-width="2"/>
        <polygon points="25,8 42,17 42,43 25,52 8,43 8,17" fill="rgba(201,162,39,0.08)" stroke="rgba(201,162,39,0.3)" stroke-width="1"/>
        <text x="25" y="36" text-anchor="middle" font-size="18" font-weight="800" fill="#c9a227" font-family="Outfit,sans-serif">U</text>
      </svg>
      <div style="font-family:var(--font2);font-size:24px;font-weight:800"><span style="color:white">Uni</span><span style="color:var(--gold)">Sync</span></div>
      <div style="font-size:13px;color:var(--gray);margin-top:4px">Version 1.0.0</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${[
      ['Platform', 'University Clubs & Societies Hub'],
      ['Developed for', 'FAST NUCES'],
      ['Technology', 'Node.js · Supabase · Vanilla JS'],
      ['License', 'Academic Use Only'],
    ].map(([k, v]) => `
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
          <span style="font-size:13px;color:var(--gray)">${k}</span>
          <span style="font-size:13px;font-weight:600">${v}</span>
        </div>`).join('')}
    </div>`;
  document.getElementById('applyModal').classList.add('open');
}

function openHelpSupport() {
  const faqs = [
    { q: 'How do I join a club?', a: 'Go to Explore → Clubs, find a club you like, and tap "See Positions". Submit an application for an available position.' },
    { q: 'How do I track my application?', a: 'Go to Recruitment → My Applications. You\'ll see a live status tracker with your current stage.' },
    { q: 'How do I access club chat?', a: 'Once accepted as a member, go to the Messages tab to access all club chat rooms you are part of.' },
    { q: 'I can\'t see my interview details', a: 'Go to Recruitment → My Applications and tap "View Interview Details" on the relevant application.' },
    { q: 'How do I update my profile?', a: 'Go to Profile and tap "Edit Profile". You can update your photo, bio, academic info, and social links.' },
    { q: 'Who do I contact for support?', a: 'Email support@unisync.nu.edu.pk or visit the Student Affairs office.' },
  ];
  document.getElementById('applyTitle').textContent = 'Help & Support';
  document.getElementById('applyContent').innerHTML = `
    <div style="margin-bottom:16px">
      ${faqs.map((f, i) => `
        <div style="border-bottom:1px solid rgba(255,255,255,0.07);overflow:hidden">
          <button onclick="toggleFaq(${i})" style="width:100%;background:none;border:none;color:white;text-align:left;padding:14px 0;font-size:14px;font-weight:600;cursor:pointer;display:flex;justify-content:space-between;align-items:center">
            ${f.q}
            <svg id="faq-arrow-${i}" viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16" style="flex-shrink:0;transition:transform .2s"><polyline points="6,9 12,15 18,9" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
          <div id="faq-ans-${i}" style="display:none;font-size:13px;color:var(--gray);padding:0 0 14px;line-height:1.6">${f.a}</div>
        </div>`).join('')}
    </div>
    <button class="btn-primary" onclick="closeApply()">Close</button>`;
  document.getElementById('applyModal').classList.add('open');
}
function toggleFaq(i) {
  const ans = document.getElementById('faq-ans-' + i);
  const arrow = document.getElementById('faq-arrow-' + i);
  if (!ans) return;
  const open = ans.style.display !== 'none';
  ans.style.display = open ? 'none' : 'block';
  if (arrow) arrow.style.transform = open ? '' : 'rotate(180deg)';
}

