'use strict';

/* ═══════════════════════════════════════════════════
   CONFIG
═══════════════════════════════════════════════════ */
const SUPA_URL = 'https://imtoahbuliuywiljxvpg.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltdG9haGJ1bGl1eXdpbGp4dnBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMjU5NjIsImV4cCI6MjEwNTgwMTk2Mn0.xQAsTj5JWRScHpAflWc42X7LzU6LiZZVD6nu47u9Bxo';
const SUPA_STORAGE = SUPA_URL + '/storage/v1';
const BUCKET = 'content-images';
const WEBFLOW_EDGE = SUPA_URL + '/functions/v1/post-to-webflow';
const REMINDER_EDGE = SUPA_URL + '/functions/v1/rapid-endpoint';

/* ═══════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════ */
let SESSION = null;
let toastTimer = null;
let notifTimer = null;

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const safeJSON = (s, fb) => {
  if (s === null || s === undefined) return fb;
  if (typeof s === 'object') return s;
  try { return JSON.parse(s); } catch (_) { return fb; }
};
const safeId = (s) => String(s).replace(/[^a-zA-Z0-9]/g,'_');
const slugify = (t) => String(t||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'untitled';
const formatDate = (s) => { if (!s) return '-'; const d = new Date(s); return isNaN(d) ? '-' : d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); };
const formatDateTime = (s) => { const d = new Date(s); return isNaN(d) ? '-' : d.toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}); };
const dateInput = (v) => { if (!v) return ''; if (/^\d{4}-\d{2}-\d{2}/.test(String(v))) return String(v).slice(0,10); const d = new Date(v); return isNaN(d) ? '' : d.toISOString().slice(0,10); };
const daysUntil = (d) => { if (!d) return null; const diff = new Date(d) - new Date(); return Math.ceil(diff / 86400000); };
const firstLetter = (s) => String(s||'?').trim()[0].toUpperCase();
const pct = (cur, tgt) => tgt > 0 ? Math.min(100, Math.round(cur / tgt * 100)) : 0;

function toast(msg, type) {
  const t = $('toast'); $('toastMsg').textContent = msg;
  t.className = 'toast ' + (type||'success') + ' show';
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 4000);
}
function showModal(id) { $(id).classList.add('show'); }
function closeModal(id) { $(id).classList.remove('show'); }
function closeAllModals() { document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show')); }

/* ═══════════════════════════════════════════════════
   SESSION
═══════════════════════════════════════════════════ */
function readSession() {
  try { const s = safeJSON(localStorage.getItem('mo_session'), null); return s && s.access_token ? s : null; }
  catch (_) { return null; }
}
function saveSession() { try { localStorage.setItem('mo_session', JSON.stringify(SESSION)); } catch (_) {} }

async function refreshToken() {
  if (!SESSION || !SESSION.refresh_token) return false;
  try {
    const r = await fetch(SUPA_URL + '/auth/v1/token?grant_type=refresh_token', {
      method:'POST', headers:{ apikey:SUPA_KEY, 'Content-Type':'application/json' },
      body: JSON.stringify({ refresh_token: SESSION.refresh_token })
    });
    const d = await r.json();
    if (!r.ok || !d.access_token) return false;
    SESSION.access_token = d.access_token;
    SESSION.refresh_token = d.refresh_token || SESSION.refresh_token;
    SESSION.expires_at = d.expires_at || (Math.floor(Date.now()/1000) + (d.expires_in||3600));
    saveSession(); return true;
  } catch (_) { return false; }
}

async function getToken() {
  if (!SESSION) return SUPA_KEY;
  if (SESSION.expires_at && SESSION.expires_at - Date.now()/1000 < 60) {
    const ok = await refreshToken();
    if (!ok) { forceLogout('Your session expired. Please sign in again.'); throw new Error('Session expired'); }
  }
  return SESSION.access_token;
}

/* ═══════════════════════════════════════════════════
   SUPABASE API
═══════════════════════════════════════════════════ */
async function sbFetch(path, opts) {
  opts = opts || {};
  const isWrite = opts.method && opts.method !== 'GET';
  const token = await getToken();
  const headers = { apikey:SUPA_KEY, Authorization:'Bearer '+token, 'Content-Type':'application/json' };
  if (isWrite) headers.Prefer = 'return=representation';
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(SUPA_URL+'/rest/v1/'+path, Object.assign({}, opts, { headers, signal:ctrl.signal }));
    if (!r.ok) { let e = await r.text(); try { e = JSON.parse(e).message || e; } catch (_) {} throw new Error(e); }
    const t = await r.text(); return t ? JSON.parse(t) : null;
  } catch(e) {
    if (e && e.name === 'AbortError') throw new Error('Request timed out.');
    throw e;
  } finally { clearTimeout(timer); }
}
const dbGet = (t, q) => sbFetch(t + (q||'') + (q && q.includes('?') ? '&select=*' : '?select=*'));
const dbInsert = (t, d) => sbFetch(t, { method:'POST', body:JSON.stringify(d) });
const dbUpdate = (t, id, d) => sbFetch(t+'?id=eq.'+id, { method:'PATCH', body:JSON.stringify(d) });
const dbDelete = (t, id) => sbFetch(t+'?id=eq.'+id, { method:'DELETE' });

async function uploadImage(file) {
  const ext = (file.name.split('.').pop()||'png').toLowerCase();
  const path = 'images/'+Date.now()+'_'+Math.random().toString(36).slice(2)+'.'+ext;
  const token = await getToken();
  const r = await fetch(SUPA_STORAGE+'/object/'+BUCKET+'/'+path, {
    method:'POST',
    headers:{ apikey:SUPA_KEY, Authorization:'Bearer '+token, 'Content-Type':file.type||'application/octet-stream', 'x-upsert':'true' },
    body:file
  });
  if (!r.ok) { let e = await r.text(); try { e = JSON.parse(e).message||e; } catch(_){} throw new Error(e); }
  return SUPA_STORAGE+'/object/public/'+BUCKET+'/'+path;
}

async function logActivity(action, details, rowId, rowTitle) {
  if (!SESSION) return;
  sbFetch('activity_log', { method:'POST', body:JSON.stringify({ user_id:SESSION.user_id, user_email:SESSION.email, user_role:SESSION.role, action, details:details||'', row_id:rowId||null, row_title:rowTitle||null }) }).catch(()=>{});
}

async function sendNotification(userId, title, message, type, module, refId) {
  sbFetch('notifications', { method:'POST', body:JSON.stringify({ user_id:userId, title, message, type:type||'info', module:module||'', ref_id:refId||null }) }).catch(()=>{});
}

/* ═══════════════════════════════════════════════════
   SCREENS
═══════════════════════════════════════════════════ */
function setScreen(name) {
  const isLogin = name === 'login';
  $('v-login').style.display = isLogin ? 'flex' : 'none';
  $('v-app').style.display = isLogin ? 'none' : 'grid';
  document.body.style.overflow = '';
  if (!isLogin && SESSION) updateTopbar();
  const fab=$('chatFab'); if(fab) fab.style.display=isLogin?'none':'flex';
  const tb=document.getElementById('taskAssignBox'); if(tb) tb.style.display=isLogin?'none':'block';
}

function updateTopbar() {
  if (!SESSION) return;
  $('topUserName').textContent = SESSION.full_name || SESSION.email || '';
  $('topUserRole').textContent = SESSION.role;
  $('topUserInitial').textContent = firstLetter(SESSION.full_name || SESSION.email || '?');
  updateNotifCount();
}

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(s => s.classList.remove('active'));
  const pg = $('pg-'+pageId);
  if (pg) pg.classList.add('active');
  const si = document.querySelector('.sidebar-item[data-page="'+pageId+'"]');
  if (si) si.classList.add('active');
  const loaders = { content:loadContent, projects:loadProjects, inventory:loadInventory, hr:loadHR, admin:loadAdmin, settings:loadSettings, requests:loadRequestsPage };
  if (loaders[pageId]) loaders[pageId]();
}

function goHome() {
  if (!SESSION) { setScreen('login'); return; }
  if (SESSION.role === 'admin') showPage('projects');
  else {
    const perms = SESSION.module_permissions || {};
    const preferredOrder = ['projects','content','crm','analytics','reports','inventory','hr','requests'];
    const first = preferredOrder.find(m => perms[m]);
    if (first) showPage(first); else showPage('no-access');
  }
}

function forceLogout(msg) {
  SESSION = null; try { localStorage.removeItem('mo_session'); } catch (_) {}
  const banner=document.getElementById('loginBanner');
  if(banner){banner.classList.remove('show');}
  const track=document.getElementById('bannerTrack');
  if(track){track.innerHTML='';}
  const am=document.querySelector('.app-main');
  if(am){am.style.marginTop='';}
  $('loginPw').value = '';
  $('loginErr').classList.remove('show');
  setScreen('login');
  if (msg) { $('loginErr').textContent = msg; $('loginErr').classList.add('show'); }
}
function logout() { forceLogout(''); }

/* ═══════════════════════════════════════════════════
   LOGIN
═══════════════════════════════════════════════════ */
function togglePw() {
  const pw = $('loginPw'), btn = $('eyeBtn');
  if (pw.type === 'password') { pw.type='text'; btn.textContent='Hide'; }
  else { pw.type='password'; btn.textContent='Show'; }
}
async function doLogin() {
  const email = $('loginEmail').value.trim();
  const password = $('loginPw').value;
  const btn = $('loginBtn'); $('loginErr').classList.remove('show');
  if (!email || !password) { $('loginErr').textContent='Please enter email and password.'; $('loginErr').classList.add('show'); return; }
  btn.disabled=true; btn.textContent='Signing in...';
  try {
    const r = await fetch(SUPA_URL+'/auth/v1/token?grant_type=password', {
      method:'POST', headers:{apikey:SUPA_KEY,'Content-Type':'application/json'}, body:JSON.stringify({email,password})
    });
    const d = await r.json();
    if (!r.ok || !d.access_token) { $('loginErr').textContent=d.error_description||d.msg||d.message||'Invalid email or password.'; $('loginErr').classList.add('show'); return; }
    const pr = await fetch(SUPA_URL+'/rest/v1/user_profiles?id=eq.'+d.user.id+'&select=*', { headers:{apikey:SUPA_KEY,'Authorization':'Bearer '+d.access_token} });
    const profiles = await pr.json();
    if (!profiles||!profiles.length) { $('loginErr').textContent='No role assigned. Contact admin.'; $('loginErr').classList.add('show'); return; }
    const p = profiles[0];
    SESSION = {
      user_id:d.user.id, email:d.user.email, access_token:d.access_token, refresh_token:d.refresh_token,
      expires_at:d.expires_at||(Math.floor(Date.now()/1000)+(d.expires_in||3600)),
      role:p.role, full_name:p.full_name,
      module_permissions: (typeof p.module_permissions==='object' && p.module_permissions!==null)
        ? p.module_permissions
        : (p.module_permissions ? JSON.parse(p.module_permissions) : {})
    };
    saveSession();
    $('loginPw').value='';
    logActivity('login','Signed in');
    setTimeout(initChatBadge, 2000);
    setTimeout(function(){if(typeof loadLoginBanner==='function')loadLoginBanner();},3000);
    initAutoLogout();
    sbFetch('user_profiles?id=eq.'+SESSION.user_id,{method:'PATCH',body:JSON.stringify({last_login:new Date().toISOString()})}).catch(()=>{});
    buildSidebar();
    setScreen('app');
    goHome();
  } catch(e) {
    $('loginErr').textContent='Could not connect ('+(e&&e.message?e.message:'check console')+').'; $('loginErr').classList.add('show');
  } finally { btn.disabled=false; btn.textContent='Sign In'; }
}

/* ═══════════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════════ */
const MODULES = [
  { id:'content',  label:'Content Approval', icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>' },
  { id:'projects', label:'Project Tracker',   icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' },
  { id:'crm',      label:'CRM Dashboard',     icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>', coming:true },
  { id:'analytics',label:'Analytics',         icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>', coming:true },
  { id:'reports',  label:'Monthly Reports',   icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>', coming:true },
  { id:'inventory',label:'Inventory',         icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>' },
  { id:'hr',       label:'HR Module',         icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>' },
  { id:'requests', label:'Requests', icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>' },
  { id:'settings', label:'My Settings',        icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>', alwaysShow:true },
];

function buildSidebar() {
  if (!SESSION) return;
  const perms = SESSION.module_permissions || {};
  const isAdmin = SESSION.role === 'admin';
  let html = '';
  MODULES.forEach(m => {
    const hasPerm = isAdmin || perms[m.id] || m.alwaysShow;
    if (!hasPerm && !m.coming) return;
    if (!hasPerm && m.coming) return;
    if (m.coming) {
      html += `<div class="sidebar-coming" title="${esc(m.label)} (Coming soon)"><span class="si-icon">${m.icon}</span><span class="si-label">${esc(m.label)}<span class="coming-tag">Soon</span></span></div>`;
    } else {
      html += `<div class="sidebar-item" data-page="${m.id}" onclick="showPage('${m.id}')" title="${esc(m.label)}"><span class="si-icon">${m.icon}</span><span class="si-label">${esc(m.label)}</span></div>`;
    }
  });
  if (isAdmin) {
    html += '<div class="sidebar-divider"></div>';
    html += `<div class="sidebar-item" data-page="admin" onclick="showPage('admin')" title="Admin Settings"><span class="si-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg></span><span class="si-label">Admin Settings</span></div>`;
  }
  $('sidebarNav').innerHTML = html;
}

/* ═══════════════════════════════════════════════════
   NOTIFICATIONS
═══════════════════════════════════════════════════ */
async function loadNotifications() {
  if (!SESSION) return;
  try {
    const notifs = await sbFetch('notifications?user_id=eq.'+SESSION.user_id+'&order=created_at.desc&limit=20&select=*') || [];
    const unread = notifs.filter(n => !n.read);
    const count = $('notifCount');
    if (unread.length > 0) { count.textContent = unread.length > 9 ? '9+' : unread.length; count.classList.add('show'); }
    else count.classList.remove('show');
    const panel = $('notifPanel');
    if (!notifs.length) { panel.innerHTML = '<div class="notif-header"><div class="notif-header-title">Notifications</div></div><div class="empty-state" style="padding:24px"><div class="empty-title">No notifications</div></div>'; return; }
    let h = '<div class="notif-header"><div class="notif-header-title">Notifications</div><button class="btn btn-secondary btn-xs" onclick="markAllRead()">Mark all read</button></div>';
    h += notifs.map(n => `<div class="notif-item ${n.read?'':'unread'}" onclick="markNotifRead(${n.id})">
      <div class="notif-msg">${esc(n.title)}</div>
      <div class="notif-time">${formatDateTime(n.created_at)}${n.message?'<br>'+esc(n.message):''}</div>
    </div>`).join('');
    panel.innerHTML = h;
  } catch(_) {}
}
async function markNotifRead(id) {
  await sbFetch('notifications?id=eq.'+id, { method:'PATCH', body:JSON.stringify({read:true}) }).catch(()=>{});
  loadNotifications();
}
async function markAllRead() {
  await sbFetch('notifications?user_id=eq.'+SESSION.user_id, { method:'PATCH', body:JSON.stringify({read:true}) }).catch(()=>{});
  loadNotifications();
}
function updateNotifCount() { loadNotifications(); }
function toggleNotifPanel() {
  const p = $('notifPanel');
  p.classList.toggle('show');
  if (p.classList.contains('show')) loadNotifications();
}
document.addEventListener('click', e => {
  if (!e.target.closest('#notifWrap')) $('notifPanel')?.classList.remove('show');
});
setInterval(loadNotifications, 60000);


function saveBlob(content, type, filename) {
  const blob = new Blob([content], {type});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function toWord(title, bodyHtml) {
  const shell = `\ufeff<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font-family:Arial;font-size:11pt;line-height:1.5;margin:30px}h1{font-size:16pt;color:#E8450A}h2{font-size:13pt;margin-top:22px;border-top:1px solid #ccc;padding-top:12px}p{margin:4px 0}label{font-size:8pt;font-weight:bold;color:#666;text-transform:uppercase;display:block;margin-top:12px}hr{border:none;border-top:1px solid #ddd;margin:20px 0}</style></head><body>${bodyHtml}</body></html>`;
  const blob = new Blob([shell], {type:'application/msword'});
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob), download: title+'.doc'
  });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
