/* ═══════════════════════════════════════════════════
   LEAVES MODULE
═══════════════════════════════════════════════════ */

const LEAVE_TYPES = {
  CL:  { label:'Casual Leave',              color:'#3B82F6', bg:'#EFF6FF' },
  SL:  { label:'Sick Leave',                color:'#EF4444', bg:'#FEF2F2' },
  WFH: { label:'Work From Home',            color:'#10B981', bg:'#ECFDF5' },
  OD:  { label:'On Duty Outside Office',    color:'#F59E0B', bg:'#FFFBEB' },
  PL:  { label:'Privilege Leave',           color:'#8B5CF6', bg:'#F5F3FF' },
  Other:{ label:'Other',                    color:'#6B7280', bg:'#F9FAFB' }
};

const LEAVE_STATUS = {
  pending:  { label:'Pending',  color:'#F59E0B', bg:'#FFFBEB' },
  approved: { label:'Approved', color:'#10B981', bg:'#ECFDF5' },
  rejected: { label:'Rejected', color:'#EF4444', bg:'#FEF2F2' }
};

let leaves = [], leavesFilter = 'all', leavesCalMonth = new Date(), leavesTeamMode = false;

// ── Load & Render ─────────────────────────────────────────────────
async function loadLeaves() {
  const role = SESSION?.role;
  const isApprover = role === 'cmo' || role === 'admin';
  let url = 'leaves?order=created_at.desc&select=*';
  if (!isApprover) url += '&user_id=eq.' + SESSION.user_id;
  try {
    leaves = await sbFetch(url) || [];
    renderLeavesPage();
  } catch(e) { toast('Could not load leaves: ' + e.message, 'error'); }
}

function renderLeavesPage() {
  const role = SESSION?.role;
  const isApprover = role === 'cmo' || role === 'admin';
  const pg = $('pg-leaves'); if (!pg) return;

  // Filter
  const filtered = leavesFilter === 'all' ? leaves :
    leaves.filter(l => l.status === leavesFilter);

  // Stats
  const myLeaves = leaves.filter(l => l.user_id === SESSION.user_id);
  const s = (id, v) => { const el=$(id); if(el) el.textContent=v; };
  s('lv_total',   myLeaves.length);
  s('lv_pending', myLeaves.filter(l=>l.status==='pending').length);
  s('lv_approved',myLeaves.filter(l=>l.status==='approved').length);
  s('lv_wfh',     myLeaves.filter(l=>l.leave_type==='WFH'&&l.status==='approved').length);

  // Approver pending badge
  if (isApprover) {
    const pendingAll = leaves.filter(l=>l.status==='pending').length;
    s('lv_pending_all', pendingAll);
    const badge = $('lvApproverBadge');
    if (badge) badge.style.display = pendingAll > 0 ? 'inline-flex' : 'none';
  }

  // Table
  const tb = $('leavesTable'); if (!tb) return;
  if (!filtered.length) {
    tb.innerHTML = '<div class="empty-state"><div class="empty-icon">🗓</div><div class="empty-title">No leave requests</div><div class="empty-sub">No requests match this filter.</div></div>';
    return;
  }
  let h = '<table><thead><tr>';
  h += '<th>#</th><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Duration</th><th>Reason</th><th>Status</th>';
  if (isApprover) h += '<th>Action</th>';
  h += '</tr></thead><tbody>';
  filtered.forEach((l, i) => {
    const lt = LEAVE_TYPES[l.leave_type] || LEAVE_TYPES.Other;
    const st = LEAVE_STATUS[l.status] || LEAVE_STATUS.pending;
    const days = leaveDays(l.from_date, l.to_date, l.duration);
    const typeBadge = `<span style="background:${lt.bg};color:${lt.color};border:1px solid ${lt.color}33;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700">${lt.label}</span>`;
    const stBadge = `<span style="background:${st.bg};color:${st.color};border:1px solid ${st.color}33;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700">${st.label}</span>`;
    const durLabel = l.duration === 'first_half' ? 'First Half' : l.duration === 'second_half' ? 'Second Half' : 'Full Day';
    h += `<tr>
      <td class="td-num">${i+1}</td>
      <td style="font-weight:600">${esc(l.user_name||'-')}</td>
      <td>${typeBadge}</td>
      <td>${formatDate(l.from_date)}</td>
      <td>${formatDate(l.to_date)}</td>
      <td style="text-align:center;font-weight:700">${days}</td>
      <td style="font-size:12px;color:var(--muted)">${durLabel}</td>
      <td style="font-size:12px;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${esc(l.reason||'')}">${esc(l.reason||'-')}</td>
      <td>${stBadge}${l.approver_comment?`<div style="font-size:10px;color:var(--muted);margin-top:2px">${esc(l.approver_comment)}</div>`:''}</td>
      ${isApprover && l.status==='pending' ? `<td><div style="display:flex;gap:6px">
        <button onclick="leaveApprove('${l.id}')" class="btn btn-primary btn-xs">✓ Approve</button>
        <button onclick="leaveReject('${l.id}')" class="btn btn-secondary btn-xs" style="color:var(--accent)">✗ Reject</button>
      </div></td>` : isApprover ? '<td><span style="font-size:11px;color:var(--muted)">Done</span></td>' : ''}
    </tr>`;
  });
  h += '</tbody></table>';
  tb.innerHTML = h;
}

function leaveDays(from, to, duration) {
  if (!from || !to) return 1;
  const f = new Date(from), t = new Date(to);
  const diff = Math.round((t - f) / (1000*60*60*24)) + 1;
  if (duration === 'first_half' || duration === 'second_half') return 0.5;
  return diff;
}

// ── Apply Leave ───────────────────────────────────────────────────
async function leaveSubmit() {
  const type     = $('lvType').value;
  const from     = $('lvFrom').value;
  const to       = $('lvTo').value;
  const duration = $('lvDuration').value;
  const reason   = $('lvReason').value.trim();
  if (!type)   { toast('Please select leave type.', 'error'); return; }
  if (!from)   { toast('Please select from date.', 'error'); return; }
  if (!to)     { toast('Please select to date.', 'error'); return; }
  if (!reason) { toast('Please enter a reason.', 'error'); return; }
  if (new Date(to) < new Date(from)) { toast('To date cannot be before from date.', 'error'); return; }
  const btn = $('lvSubmitBtn'); if(btn){btn.disabled=true;btn.textContent='Submitting...';}
  try {
    await dbInsert('leaves', {
      user_id: SESSION.user_id,
      user_name: SESSION.full_name || SESSION.email,
      user_email: SESSION.email,
      department: SESSION.department || '',
      leave_type: type,
      from_date: from,
      to_date: to,
      duration,
      reason,
      status: 'pending'
    });
    toast('Leave request submitted.');
    // Reset form
    ['lvType','lvFrom','lvTo','lvDuration','lvReason'].forEach(id => { const el=$(id); if(el) el.value = id==='lvDuration'?'full':''; });
    $('lvApplyPanel').style.display = 'none';
    await loadLeaves();
    // Notify approvers
    notifyApprovers(type, from, to, reason);
  } catch(e) { toast('Could not submit: '+e.message, 'error'); }
  finally { if(btn){btn.disabled=false;btn.textContent='Submit Request';} }
}

async function notifyApprovers(type, from, to, reason) {
  try {
    const approvers = await sbFetch('user_profiles?role=in.(cmo,admin)&select=id,full_name').catch(()=>[]) || [];
    for (const a of approvers) {
      await sendNotification(a.id, 'Leave Request',
        `${SESSION.full_name||SESSION.email} has applied for ${LEAVE_TYPES[type]?.label||type} from ${from} to ${to}.`,
        'info', 'leaves', null);
    }
  } catch(_) {}
}

// ── Approve / Reject ──────────────────────────────────────────────
async function leaveApprove(id) {
  const leave = leaves.find(l => String(l.id) === String(id)); if (!leave) return;
  try {
    await sbFetch('leaves?id=eq.'+id, { method:'PATCH', body:JSON.stringify({
      status: 'approved',
      approved_by: SESSION.full_name || SESSION.email,
      approved_by_id: SESSION.user_id,
      approved_at: new Date().toISOString()
    })});
    toast('Leave approved.');
    await sendNotification(leave.user_id, 'Leave Approved',
      `Your ${LEAVE_TYPES[leave.leave_type]?.label||leave.leave_type} request from ${leave.from_date} to ${leave.to_date} has been approved.`,
      'success', 'leaves', null);
    await loadLeaves();
    renderLeavesCalendar();
  } catch(e) { toast('Error: '+e.message, 'error'); }
}

async function leaveReject(id) {
  const leave = leaves.find(l => String(l.id) === String(id)); if (!leave) return;
  // Show comment input
  const comment = await leaveRejectPrompt();
  if (comment === null) return; // cancelled
  try {
    await sbFetch('leaves?id=eq.'+id, { method:'PATCH', body:JSON.stringify({
      status: 'rejected',
      approved_by: SESSION.full_name || SESSION.email,
      approved_by_id: SESSION.user_id,
      approved_at: new Date().toISOString(),
      approver_comment: comment
    })});
    toast('Leave rejected.');
    await sendNotification(leave.user_id, 'Leave Rejected',
      `Your ${LEAVE_TYPES[leave.leave_type]?.label||leave.leave_type} request from ${leave.from_date} to ${leave.to_date} has been rejected.${comment?' Reason: '+comment:''}`,
      'error', 'leaves', null);
    await loadLeaves();
  } catch(e) { toast('Error: '+e.message, 'error'); }
}

function leaveRejectPrompt() {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:999999;display:flex;align-items:center;justify-content:center';
    overlay.innerHTML = `<div style="background:var(--surface);border-radius:14px;padding:28px;max-width:400px;width:90%;box-shadow:0 8px 40px rgba(0,0,0,0.25)">
      <div style="font-size:15px;font-weight:700;margin-bottom:8px">Reject Leave Request</div>
      <div style="font-size:13px;color:var(--muted);margin-bottom:14px">Please provide a reason for rejection (optional)</div>
      <textarea id="lvRejectComment" style="width:100%;border:1.5px solid var(--border);border-radius:8px;padding:10px;font-size:13px;font-family:Inter,sans-serif;resize:none;min-height:80px;box-sizing:border-box" placeholder="Reason for rejection..."></textarea>
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px">
        <button id="lvRejectCancel" style="padding:9px 20px;border-radius:8px;border:1.5px solid var(--border);background:var(--surface);cursor:pointer;font-size:13px;font-weight:600;font-family:Inter,sans-serif">Cancel</button>
        <button id="lvRejectConfirm" style="padding:9px 20px;border-radius:8px;border:none;background:#DC2626;color:#fff;cursor:pointer;font-size:13px;font-weight:700;font-family:Inter,sans-serif">Reject</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#lvRejectConfirm').onclick = () => {
      const comment = overlay.querySelector('#lvRejectComment').value.trim();
      document.body.removeChild(overlay);
      resolve(comment);
    };
    overlay.querySelector('#lvRejectCancel').onclick = () => { document.body.removeChild(overlay); resolve(null); };
  });
}

// ── Filter tabs ───────────────────────────────────────────────────
function leavesSetFilter(f, btn) {
  leavesFilter = f;
  document.querySelectorAll('#leavesFilterTabs .ftab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderLeavesPage();
}

// ── Calendar ──────────────────────────────────────────────────────
function renderLeavesCalendar() {
  const cal = $('leavesCalendar'); if (!cal) return;
  const year = leavesCalMonth.getFullYear();
  const month = leavesCalMonth.getMonth();
  const monthName = leavesCalMonth.toLocaleString('default', { month:'long', year:'numeric' });

  // Which leaves to show
  const showLeaves = leavesTeamMode ? leaves : leaves.filter(l => l.user_id === SESSION.user_id);
  const approvedLeaves = showLeaves.filter(l => l.status === 'approved' || l.status === 'pending');

  // Build day map
  const dayMap = {};
  approvedLeaves.forEach(l => {
    const f = new Date(l.from_date), t = new Date(l.to_date);
    for (let d = new Date(f); d <= t; d.setDate(d.getDate()+1)) {
      if (d.getFullYear() === year && d.getMonth() === month) {
        const key = d.getDate();
        if (!dayMap[key]) dayMap[key] = [];
        dayMap[key].push(l);
      }
    }
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const today = new Date();

  let h = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding:0 4px">
    <button onclick="leavesCalPrev()" style="background:none;border:1.5px solid var(--border);border-radius:8px;padding:6px 14px;cursor:pointer;font-size:14px;font-weight:700;color:var(--text)">◀</button>
    <div style="font-size:16px;font-weight:700">${monthName}</div>
    <button onclick="leavesCalNext()" style="background:none;border:1.5px solid var(--border);border-radius:8px;padding:6px 14px;cursor:pointer;font-size:14px;font-weight:700;color:var(--text)">▶</button>
  </div>
  <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:8px">
    ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<div style="text-align:center;font-size:11px;font-weight:700;color:var(--muted);padding:4px">${d}</div>`).join('')}
  </div>
  <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">`;

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) h += '<div></div>';

  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = today.getFullYear()===year && today.getMonth()===month && today.getDate()===day;
    const dayLeaves = dayMap[day] || [];
    const dots = dayLeaves.slice(0,3).map(l => {
      const lt = LEAVE_TYPES[l.leave_type] || LEAVE_TYPES.Other;
      const opacity = l.status === 'pending' ? '0.5' : '1';
      return `<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${lt.color};opacity:${opacity};margin:0 1px" title="${esc(l.user_name||'')} - ${lt.label}"></span>`;
    }).join('');
    const hasMore = dayLeaves.length > 3;
    h += `<div onclick="leavesCalDayClick(${year},${month+1},${day})" 
      style="min-height:68px;border-radius:8px;padding:6px;cursor:${dayLeaves.length?'pointer':'default'};
      background:${isToday?'var(--accent)':'var(--surface2)'};
      border:1.5px solid ${isToday?'var(--accent)':'var(--border)'};
      transition:all 0.15s">
      <div style="font-size:13px;font-weight:${isToday?'700':'600'};color:${isToday?'#fff':'var(--text)'}">${day}</div>
      <div style="margin-top:3px">${dots}${hasMore?`<span style="font-size:9px;color:var(--muted)">+${dayLeaves.length-3}</span>`:''}</div>
    </div>`;
  }
  h += '</div>';

  // Legend
  h += `<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;padding:12px;background:var(--surface2);border-radius:8px">`;
  Object.entries(LEAVE_TYPES).forEach(([k,v]) => {
    h += `<span style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text)">
      <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${v.color}"></span>${v.label}
    </span>`;
  });
  h += '</div>';

  cal.innerHTML = h;
}

function leavesCalPrev() {
  leavesCalMonth = new Date(leavesCalMonth.getFullYear(), leavesCalMonth.getMonth()-1, 1);
  renderLeavesCalendar();
}
function leavesCalNext() {
  leavesCalMonth = new Date(leavesCalMonth.getFullYear(), leavesCalMonth.getMonth()+1, 1);
  renderLeavesCalendar();
}

function leavesToggleTeam() {
  leavesTeamMode = !leavesTeamMode;
  const btn = $('lvTeamBtn');
  if (btn) {
    btn.textContent = leavesTeamMode ? '👤 My Calendar' : '👥 Team Calendar';
    btn.style.background = leavesTeamMode ? 'var(--accent)' : 'var(--surface)';
    btn.style.color = leavesTeamMode ? '#fff' : 'var(--text)';
  }
  if (leavesTeamMode) {
    // Load all leaves for team view
    sbFetch('leaves?order=created_at.desc&select=*').then(all => {
      leaves = all || [];
      renderLeavesCalendar();
      renderLeavesPage();
    });
  } else {
    loadLeaves();
  }
}

function leavesCalDayClick(year, month, day) {
  const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const dayLeaves = leaves.filter(l => {
    const f = new Date(l.from_date), t = new Date(l.to_date), d = new Date(dateStr);
    return d >= f && d <= t && (l.status==='approved'||l.status==='pending');
  });
  if (!dayLeaves.length) return;
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:999999;display:flex;align-items:center;justify-content:center';
  overlay.innerHTML = `<div style="background:var(--surface);border-radius:14px;padding:24px;max-width:380px;width:90%;box-shadow:0 8px 40px rgba(0,0,0,0.25)">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <div style="font-size:15px;font-weight:700">${new Date(dateStr+'T12:00:00').toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</div>
      <button onclick="this.closest('.fixed-overlay').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--muted)">✕</button>
    </div>
    ${dayLeaves.map(l => {
      const lt = LEAVE_TYPES[l.leave_type]||LEAVE_TYPES.Other;
      const st = LEAVE_STATUS[l.status]||LEAVE_STATUS.pending;
      return `<div style="padding:10px 12px;background:${lt.bg};border:1px solid ${lt.color}33;border-radius:8px;margin-bottom:8px">
        <div style="font-size:13px;font-weight:700;color:${lt.color}">${esc(l.user_name||'-')}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px">${lt.label} · <span style="color:${st.color};font-weight:600">${st.label}</span></div>
        ${l.reason?`<div style="font-size:11px;color:var(--text);margin-top:4px;font-style:italic">"${esc(l.reason)}"</div>`:''}
      </div>`;
    }).join('')}
  </div>`;
  overlay.classList.add('fixed-overlay');
  overlay.onclick = e => { if(e.target===overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}
