/* ═══════════════════════════════════════════════════════════
   REPORTS MODULE — app-reports.js
   CEO Reports / CMO Reports / Weekly Marketing Team Reports
═══════════════════════════════════════════════════════════ */

// ── Supabase tables needed: ───────────────────────────────────────
// reports_library  : id, type (ceo/cmo), month, year, title, files(json), html_content, created_at, created_by
// weekly_submissions: id, user_email, user_name, week_start, work_done, status, kpi_impact, plans_next_week, submitted_at
// weekly_team_members: id, name, email, role, active (admin-managed)

const REPORTS_STORAGE_BUCKET = 'reports-files';

// ── Main loader ───────────────────────────────────────────────────
function loadReports() {
  const c = $('pg-reports');
  if (!c) return;
  c.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Reports</div>
        <div class="page-sub">CEO · CMO · Weekly Marketing Team</div>
      </div>
    </div>
    <div class="rpt-landing">
      <div class="rpt-landing-card" onclick="loadReportType('ceo')">
        <div class="rpt-landing-icon">👔</div>
        <div class="rpt-landing-title">CEO Reports</div>
        <div class="rpt-landing-sub">Monthly marketing reports for CEO. Upload PPT, Word, PDF. View full HTML report by month.</div>
      </div>
      <div class="rpt-landing-card" onclick="loadReportType('cmo')">
        <div class="rpt-landing-icon">📊</div>
        <div class="rpt-landing-title">CMO Reports</div>
        <div class="rpt-landing-sub">Monthly CMO dashboard. Upload reports. View compiled weekly team PPTs.</div>
      </div>
      <div class="rpt-landing-card" onclick="loadWeeklyReports()">
        <div class="rpt-landing-icon">📝</div>
        <div class="rpt-landing-title">Weekly Marketing Reports</div>
        <div class="rpt-landing-sub">Team members submit weekly updates. Compiled into a 4-slide PPT every Tuesday 10 AM for CMO.</div>
      </div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════
// CEO / CMO REPORTS
// ═══════════════════════════════════════════════════════════
let currentReportType = 'ceo';

async function loadReportType(type) {
  currentReportType = type;
  const c = $('pg-reports');
  if (!c) return;
  c.innerHTML = `
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:10px">
        <button onclick="loadReports()" class="btn btn-secondary btn-sm">← Back</button>
        <div>
          <div class="page-title">${type === 'ceo' ? 'CEO' : 'CMO'} Reports</div>
          <div class="page-sub">Monthly reports · Click a month to view · Download PPT / Word / PDF</div>
        </div>
      </div>
      <div class="page-actions">
        <button onclick="rptUploadDialog('${type}')" class="btn btn-primary btn-sm">+ Upload Report</button>
      </div>
    </div>
    <div id="rptLibraryContent"><div class="loading-row"><span class="spinner"></span> Loading reports...</div></div>
    ${buildRptModal()}
  `;
  await rptLoadLibrary(type);
}

async function rptLoadLibrary(type) {
  const c = $('rptLibraryContent');
  try {
    const token = await getToken();
    const res = await sbFetch(`reports_library?type=eq.${type}&order=year.desc,month.desc&select=*`);
    const rows = await res.json();

    // Add November 2026 default if no records yet
    const months = rows && rows.length > 0 ? rows : [{
      id: 'nov2026-default', type, month: 'November', year: 2026,
      title: 'Monthly Marketing Report — November 2026',
      files: [], has_html: true, created_at: new Date().toISOString()
    }];

    const grouped = {};
    months.forEach(r => {
      const yr = r.year || 2026;
      if (!grouped[yr]) grouped[yr] = [];
      grouped[yr].push(r);
    });

    let html = '';
    Object.keys(grouped).sort((a,b) => b-a).forEach(yr => {
      html += `<div class="rpt-year-label">${yr}</div>
      <table class="table">
        <thead><tr>
          <th>Month</th><th>Report Title</th><th>Files</th><th>Actions</th>
        </tr></thead>
        <tbody>`;
      grouped[yr].forEach(r => {
        const files = Array.isArray(r.files) ? r.files : (r.files ? JSON.parse(r.files) : []);
        const hasHtml = r.has_html || r.id === 'nov2026-default';
        html += `<tr>
          <td style="font-weight:700;white-space:nowrap">${r.month} ${r.year}</td>
          <td>${esc(r.title || 'Monthly Report')}</td>
          <td>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              ${files.map(f => `<a href="${esc(f.url)}" target="_blank" class="btn btn-secondary btn-xs" style="text-decoration:none" download>
                ${f.type === 'pptx' ? '📊' : f.type === 'docx' ? '📄' : f.type === 'pdf' ? '📋' : '📁'} ${f.type?.toUpperCase() || 'File'}
              </a>`).join('')}
              ${files.length === 0 ? '<span style="font-size:12px;color:var(--muted)">No files yet</span>' : ''}
            </div>
          </td>
          <td>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              ${hasHtml ? `<button onclick="rptOpenHtmlReport('${r.id}')" class="btn btn-primary btn-xs">View Report</button>` : ''}
              <button onclick="rptUploadToMonth('${r.id}','${r.month}','${r.year}')" class="btn btn-secondary btn-xs">+ Upload File</button>
              ${files.length > 0 ? `<button onclick="rptDownloadAll('${r.id}')" class="btn btn-secondary btn-xs">⬇ All</button>` : ''}
            </div>
          </td>
        </tr>`;
      });
      html += `</tbody></table>`;
    });
    if (c) c.innerHTML = html;
  } catch(e) {
    if (c) c.innerHTML = `<div class="empty-state"><div class="empty-title">Could not load reports</div><div class="empty-sub">${esc(e.message)}</div><button onclick="rptLoadLibrary('${type}')" class="btn btn-primary btn-sm" style="margin-top:12px">Retry</button></div>`;
  }
}

// ── Upload dialog ─────────────────────────────────────────────────
function rptUploadDialog(type) {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const years = [2026, 2027];
  showModal('rptUploadModal');
  const body = $('rptUploadModalBody');
  if (!body) {
    // Create modal dynamically
    const overlay = document.createElement('div');
    overlay.id = 'rptUploadModal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
    overlay.innerHTML = `
      <div style="background:var(--surface);border-radius:12px;max-width:520px;width:100%;box-shadow:0 8px 40px rgba(0,0,0,0.25)">
        <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
          <div style="font-size:15px;font-weight:700">Upload ${type.toUpperCase()} Report</div>
          <button onclick="this.closest('[style*=fixed]').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--muted)">✕</button>
        </div>
        <div style="padding:20px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
            <div>
              <div class="field-label">Month *</div>
              <select id="rptUpMonth" class="field-select">
                ${months.map(m=>`<option value="${m}"${m==='November'?' selected':''}>${m}</option>`).join('')}
              </select>
            </div>
            <div>
              <div class="field-label">Year *</div>
              <select id="rptUpYear" class="field-select">
                ${years.map(y=>`<option value="${y}"${y===2026?' selected':''}>${y}</option>`).join('')}
              </select>
            </div>
          </div>
          <div style="margin-bottom:14px">
            <div class="field-label">Report Title</div>
            <input id="rptUpTitle" class="field-input" placeholder="e.g. Monthly Marketing Report — November 2026" value="Monthly Marketing Report — November 2026"/>
          </div>
          <div style="margin-bottom:14px">
            <div class="field-label">Upload Files (PPT, Word, PDF, HTML)</div>
            <input type="file" id="rptUpFiles" accept=".pptx,.ppt,.docx,.doc,.pdf,.html" multiple
              style="width:100%;padding:10px;border:1.5px dashed var(--border);border-radius:8px;font-size:13px;cursor:pointer"/>
            <div style="font-size:11px;color:var(--muted);margin-top:4px">Multiple files allowed · Max 50MB each</div>
          </div>
          <div id="rptUpProgress" style="display:none;margin-bottom:14px">
            <div style="font-size:13px;color:var(--muted)" id="rptUpProgressText">Uploading...</div>
            <div style="background:var(--border);border-radius:100px;height:6px;margin-top:6px"><div id="rptUpBar" style="background:var(--accent);height:6px;border-radius:100px;width:0%;transition:width 0.3s"></div></div>
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end">
            <button onclick="this.closest('[style*=fixed]').remove()" class="btn btn-secondary">Cancel</button>
            <button onclick="rptDoUpload('${type}')" class="btn btn-primary" id="rptUpBtn">Upload & Save</button>
          </div>
        </div>
      </div>`;
    overlay.onclick = e => { if(e.target===overlay) overlay.remove(); };
    document.body.appendChild(overlay);
    return;
  }
}

async function rptDoUpload(type) {
  const month = $('rptUpMonth')?.value;
  const year  = parseInt($('rptUpYear')?.value);
  const title = $('rptUpTitle')?.value.trim() || `Monthly Marketing Report — ${month} ${year}`;
  const filesInput = $('rptUpFiles');
  const btn = $('rptUpBtn');
  const prog = $('rptUpProgress');
  const bar  = $('rptUpBar');
  const progTxt = $('rptUpProgressText');

  if (!month || !year) { toast('Please select month and year.', 'error'); return; }

  const files = filesInput ? Array.from(filesInput.files) : [];
  if (!files.length) { toast('Please select at least one file.', 'error'); return; }

  if (btn) btn.disabled = true;
  if (prog) prog.style.display = 'block';

  const uploadedFiles = [];
  let hasHtml = false;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (progTxt) progTxt.textContent = `Uploading ${i+1} of ${files.length}: ${file.name}`;
    if (bar) bar.style.width = `${Math.round((i/files.length)*80)}%`;

    const ext = file.name.split('.').pop().toLowerCase();
    const fname = `${type}/${year}/${month}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;

    try {
      const uploadRes = await fetch(`${SUPA_URL}/storage/v1/object/${REPORTS_STORAGE_BUCKET}/${fname}`, {
        method: 'POST',
        headers: {
          'apikey': SUPA_KEY,
          'Authorization': 'Bearer ' + (SESSION?.access_token || SUPA_KEY),
          'Content-Type': file.type || 'application/octet-stream',
          'x-upsert': 'true'
        },
        body: file
      });

      if (uploadRes.ok) {
        const url = `${SUPA_URL}/storage/v1/object/public/${REPORTS_STORAGE_BUCKET}/${fname}`;
        uploadedFiles.push({ name: file.name, url, type: ext, size: file.size });
        if (ext === 'html') hasHtml = true;
      } else {
        const err = await uploadRes.text();
        console.warn('Upload failed:', err);
        toast(`Failed to upload ${file.name}`, 'error');
      }
    } catch(e) {
      console.error('Upload error:', e);
    }
  }

  if (bar) bar.style.width = '90%';
  if (progTxt) progTxt.textContent = 'Saving to database...';

  try {
    // Check if record for this month/year/type exists
    const existing = await (await sbFetch(`reports_library?type=eq.${type}&month=eq.${month}&year=eq.${year}&select=id,files`)).json();

    if (existing && existing.length > 0) {
      // Merge files
      const existingFiles = Array.isArray(existing[0].files) ? existing[0].files : (existing[0].files ? JSON.parse(existing[0].files) : []);
      const merged = [...existingFiles, ...uploadedFiles];
      await sbFetch(`reports_library?id=eq.${existing[0].id}`, {
        method: 'PATCH',
        headers: {'Content-Type':'application/json', 'Prefer':'return=minimal'},
        body: JSON.stringify({ files: merged, has_html: hasHtml || existing[0].has_html, title })
      });
    } else {
      await sbFetch('reports_library', {
        method: 'POST',
        headers: {'Content-Type':'application/json', 'Prefer':'return=minimal'},
        body: JSON.stringify({ type, month, year, title, files: uploadedFiles, has_html: hasHtml, created_by: SESSION?.email || '' })
      });
    }

    if (bar) bar.style.width = '100%';
    setTimeout(() => {
      document.querySelector('[style*="position:fixed"][style*="z-index:99999"]')?.remove();
      toast(`${uploadedFiles.length} file(s) uploaded to ${month} ${year} ${type.toUpperCase()} Report.`);
      rptLoadLibrary(type);
    }, 500);
  } catch(e) {
    toast('Database save failed: ' + e.message, 'error');
    if (btn) btn.disabled = false;
  }
}

function rptUploadToMonth(id, month, year) {
  rptUploadDialog(currentReportType);
  setTimeout(() => {
    if ($('rptUpMonth')) $('rptUpMonth').value = month;
    if ($('rptUpYear')) $('rptUpYear').value = year;
  }, 100);
}

function rptOpenHtmlReport(id) {
  if (id === 'nov2026-default') {
    // Open the built-in November 2026 HTML report
    const win = window.open('', '_blank');
    win.document.write(buildNovemberReportHTML());
    win.document.close();
    return;
  }
  // For uploaded HTML files, open from storage
  toast('Loading report...', 'info');
}

function rptDownloadAll(id) {
  toast('Preparing download...', 'info');
}

// ═══════════════════════════════════════════════════════════
// WEEKLY MARKETING REPORTS
// ═══════════════════════════════════════════════════════════
let weeklyTeamMembers = [];
let weeklySubmissions = [];

async function loadWeeklyReports() {
  const c = $('pg-reports');
  if (!c) return;

  const isAdmin = SESSION?.role === 'admin' || SESSION?.role === 'cmo';
  const isCMO   = SESSION?.role === 'cmo';
  const userEmail = SESSION?.email || '';

  c.innerHTML = `
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:10px">
        <button onclick="loadReports()" class="btn btn-secondary btn-sm">← Back</button>
        <div>
          <div class="page-title">Weekly Marketing Reports</div>
          <div class="page-sub">Submit by Monday · Compiled PPT sent to CMO every Tuesday 10 AM</div>
        </div>
      </div>
      <div class="page-actions">
        ${isAdmin ? `<button onclick="rptManageTeam()" class="btn btn-secondary btn-sm">⚙ Manage Team</button>` : ''}
        ${isCMO   ? `<button onclick="rptCompileNow()" class="btn btn-primary btn-sm">Compile & Download PPT</button>` : ''}
      </div>
    </div>
    <div id="weeklyContent"><div class="loading-row"><span class="spinner"></span> Loading...</div></div>
    ${buildRptModal()}
  `;

  await rptLoadWeeklyContent(isAdmin, isCMO, userEmail);
}

async function rptLoadWeeklyContent(isAdmin, isCMO, userEmail) {
  const c = $('weeklyContent');
  try {
    // Load team members
    const tmRes = await sbFetch('weekly_team_members?active=eq.true&order=name.asc&select=*');
    weeklyTeamMembers = await tmRes.json() || [];

    // Load this week's submissions
    const weekStart = getWeekStart();
    const subRes = await sbFetch(`weekly_submissions?week_start=eq.${weekStart}&select=*`);
    weeklySubmissions = await subRes.json() || [];

    // Determine what to show
    const mySubmission = weeklySubmissions.find(s => s.user_email === userEmail);
    const isMember = weeklyTeamMembers.some(m => m.email === userEmail);

    let html = `
    <!-- Week selector -->
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap">
      <div style="font-size:13px;font-weight:600;color:var(--muted)">Week of:</div>
      <div style="font-size:14px;font-weight:700">${formatDate(weekStart)} – ${formatDate(getWeekEnd(weekStart))}</div>
      <div class="rpt-sched-info" style="display:flex;gap:12px;flex-wrap:wrap">
        <div class="rpt-sched-pill rpt-sched-fri">📧 Friday: Team notified to submit</div>
        <div class="rpt-sched-pill rpt-sched-mon">📧 Monday: Reminder sent</div>
        <div class="rpt-sched-pill rpt-sched-tue">📊 Tuesday 10AM: PPT compiled → CMO</div>
      </div>
    </div>`;

    // If user is a team member — show their submission form
    if (isMember || isAdmin) {
      const sub = mySubmission;
      html += `
      <div style="margin-bottom:20px">
        <div class="card">
          <div style="font-size:14px;font-weight:700;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between">
            <span>Your Weekly Update${sub ? ' <span style="font-size:11px;font-weight:400;color:var(--green)">✓ Submitted</span>' : ''}</span>
            ${sub ? `<button onclick="rptEditSubmission()" class="btn btn-secondary btn-sm">Edit</button>` : ''}
          </div>
          <div id="weeklyFormWrap">
            ${sub ? rptSubmissionView(sub) : rptSubmissionForm(weekStart, userEmail)}
          </div>
        </div>
      </div>`;
    }

    // If CMO or Admin — show all submissions as a table
    if (isCMO || isAdmin) {
      html += `
      <div class="card">
        <div style="font-size:14px;font-weight:700;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between">
          <span>Team Submissions — Week of ${formatDate(weekStart)}</span>
          <button onclick="rptCompileNow()" class="btn btn-primary btn-sm">📊 Compile PPT</button>
        </div>
        <table class="table">
          <thead><tr><th>Team Member</th><th>Status</th><th>Work Done</th><th>KPI / Impact</th><th>Next Week Plan</th><th>Submitted</th></tr></thead>
          <tbody>`;

      // Show all team members, submitted or not
      const allMembers = weeklyTeamMembers.length > 0 ? weeklyTeamMembers :
        [{name:'Soumya',email:'soumya@qnulabs.com'},{name:'Sumanth',email:'sumanth@qnulabs.com'},{name:'Bilal',email:'bilal@qnulabs.com'},{name:'Aditya',email:'aditya.p@qnulabs.com'}];

      allMembers.forEach(m => {
        const s = weeklySubmissions.find(x => x.user_email === m.email);
        if (s) {
          const statusColors = {'in-progress':'var(--accent)','to-do':'#F59E0B','done':'var(--green)','blocked':'#EF4444'};
          html += `<tr>
            <td style="font-weight:600">${esc(m.name)}</td>
            <td><span style="font-size:11px;font-weight:600;color:${statusColors[s.status]||'var(--muted)'};background:rgba(0,0,0,0.05);padding:2px 8px;border-radius:20px">${(s.status||'').replace('-',' ').toUpperCase()}</span></td>
            <td style="font-size:12px;max-width:200px">${esc(s.work_done||'—')}</td>
            <td style="font-size:12px;max-width:150px">${esc(s.kpi_impact||'—')}</td>
            <td style="font-size:12px;max-width:150px">${esc(s.plans_next_week||s.work_done||'—')}</td>
            <td style="font-size:11px;color:var(--muted)">${s.submitted_at ? formatDate(s.submitted_at) : '—'}</td>
          </tr>`;
        } else {
          html += `<tr>
            <td style="font-weight:600">${esc(m.name)}</td>
            <td><span style="font-size:11px;color:var(--muted);background:#F3F4F6;padding:2px 8px;border-radius:20px">NOT SUBMITTED</span></td>
            <td colspan="4" style="font-size:12px;color:var(--muted)">Pending</td>
          </tr>`;
        }
      });

      html += `</tbody></table>
      </div>`;
    }

    if (c) c.innerHTML = html;
  } catch(e) {
    if (c) c.innerHTML = `<div class="empty-state"><div class="empty-title">Could not load weekly reports</div><div class="empty-sub">${esc(e.message)}</div></div>`;
  }
}

function rptSubmissionForm(weekStart, userEmail) {
  return `
  <div style="display:grid;gap:14px">
    <div>
      <div class="field-label">Work done this week <span style="color:var(--accent)">*</span></div>
      <textarea id="wk_work_done" class="field-textarea" rows="3" placeholder="Describe what you worked on this week..."></textarea>
    </div>
    <div>
      <div class="field-label">Status</div>
      <select id="wk_status" class="field-select">
        <option value="in-progress">In Progress</option>
        <option value="done">Done</option>
        <option value="to-do">To Do</option>
        <option value="blocked">Blocked</option>
      </select>
    </div>
    <div>
      <div class="field-label">Impact / KPI</div>
      <textarea id="wk_kpi" class="field-textarea" rows="2" placeholder="e.g. 96,813 LinkedIn impressions, 22 companies clicked through..."></textarea>
    </div>
    <div>
      <div class="field-label">Plans for next week</div>
      <textarea id="wk_plans" class="field-textarea" rows="2" placeholder="Leave blank to auto-fill from 'In Progress' work above..."></textarea>
      <div style="font-size:11px;color:var(--muted);margin-top:4px">If left blank, your In Progress work will be carried forward automatically.</div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button onclick="rptSubmitWeekly('${weekStart}','${userEmail}')" class="btn btn-primary">Submit Update</button>
    </div>
  </div>`;
}

function rptSubmissionView(s) {
  const statusColors = {'in-progress':'var(--accent)','to-do':'#F59E0B','done':'var(--green)','blocked':'#EF4444'};
  return `
  <div style="display:grid;gap:10px">
    <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:rgba(16,185,129,0.08);border-radius:8px;font-size:13px">
      ✓ Submitted on ${formatDate(s.submitted_at)}
    </div>
    <table style="width:100%;font-size:13px">
      <tr><td style="font-weight:600;padding:6px 0;width:160px;color:var(--muted)">Work Done</td><td style="padding:6px 0">${esc(s.work_done||'—')}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0;color:var(--muted)">Status</td><td><span style="font-size:11px;font-weight:700;color:${statusColors[s.status]||'var(--muted)'}">${(s.status||'').replace('-',' ').toUpperCase()}</span></td></tr>
      <tr><td style="font-weight:600;padding:6px 0;color:var(--muted)">KPI / Impact</td><td style="padding:6px 0">${esc(s.kpi_impact||'—')}</td></tr>
      <tr><td style="font-weight:600;padding:6px 0;color:var(--muted)">Next Week Plan</td><td style="padding:6px 0">${esc(s.plans_next_week||s.work_done||'—')}</td></tr>
    </table>
  </div>`;
}

function rptEditSubmission() {
  const myEmail = SESSION?.email || '';
  const weekStart = getWeekStart();
  const sub = weeklySubmissions.find(s => s.user_email === myEmail);
  const wrap = $('weeklyFormWrap');
  if (!wrap) return;
  wrap.innerHTML = rptSubmissionForm(weekStart, myEmail);
  if (sub) {
    if ($('wk_work_done')) $('wk_work_done').value = sub.work_done || '';
    if ($('wk_status'))    $('wk_status').value    = sub.status    || 'in-progress';
    if ($('wk_kpi'))       $('wk_kpi').value       = sub.kpi_impact || '';
    if ($('wk_plans'))     $('wk_plans').value     = sub.plans_next_week || '';
  }
}

async function rptSubmitWeekly(weekStart, userEmail) {
  const workDone = ($('wk_work_done')?.value || '').trim();
  const status   = $('wk_status')?.value || 'in-progress';
  const kpi      = ($('wk_kpi')?.value || '').trim();
  const plans    = ($('wk_plans')?.value || '').trim() || workDone; // auto-fill

  if (!workDone) { toast('Please fill in work done this week.', 'error'); return; }

  const name = weeklyTeamMembers.find(m => m.email === userEmail)?.name || SESSION?.full_name || userEmail;

  const payload = {
    user_email: userEmail,
    user_name: name,
    week_start: weekStart,
    work_done: workDone,
    status,
    kpi_impact: kpi,
    plans_next_week: plans,
    submitted_at: new Date().toISOString()
  };

  try {
    // Upsert — update if exists, insert if not
    const existing = weeklySubmissions.find(s => s.user_email === userEmail);
    if (existing) {
      await sbFetch(`weekly_submissions?id=eq.${existing.id}`, {
        method: 'PATCH',
        headers: {'Content-Type':'application/json','Prefer':'return=minimal'},
        body: JSON.stringify(payload)
      });
    } else {
      await sbFetch('weekly_submissions', {
        method: 'POST',
        headers: {'Content-Type':'application/json','Prefer':'return=minimal'},
        body: JSON.stringify(payload)
      });
    }
    toast('Weekly update submitted ✓');
    await loadWeeklyReports();
  } catch(e) {
    toast('Submit failed: ' + e.message, 'error');
  }
}

// ── Admin: Manage team members ────────────────────────────────────
async function rptManageTeam() {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';

  const tmRes = await sbFetch('weekly_team_members?order=name.asc&select=*').catch(() => ({json:()=>[]}));
  const members = await tmRes.json() || [];

  overlay.innerHTML = `
    <div style="background:var(--surface);border-radius:12px;max-width:560px;width:100%;box-shadow:0 8px 40px rgba(0,0,0,0.25)">
      <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
        <div style="font-size:15px;font-weight:700">Manage Weekly Report Team</div>
        <button onclick="this.closest('[style*=fixed]').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--muted)">✕</button>
      </div>
      <div style="padding:20px">
        <table class="table" style="margin-bottom:16px">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Active</th><th></th></tr></thead>
          <tbody id="teamMemberRows">
          ${members.map(m => `<tr>
            <td>${esc(m.name)}</td>
            <td style="font-size:12px">${esc(m.email)}</td>
            <td style="font-size:12px">${esc(m.role||'')}</td>
            <td>${m.active ? '✓' : '—'}</td>
            <td><button onclick="rptToggleMember('${m.id}',${!m.active})" class="btn btn-secondary btn-xs">${m.active?'Deactivate':'Activate'}</button></td>
          </tr>`).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--muted)">No members yet</td></tr>'}
          </tbody>
        </table>
        <div style="border-top:1px solid var(--border);padding-top:14px">
          <div style="font-size:13px;font-weight:600;margin-bottom:10px">Add Team Member</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
            <input id="newMemberName" class="field-input" placeholder="Full name"/>
            <input id="newMemberEmail" class="field-input" placeholder="email@qnulabs.com" type="email"/>
          </div>
          <input id="newMemberRole" class="field-input" placeholder="Role (e.g. Content Manager)" style="margin-bottom:10px"/>
          <div style="display:flex;gap:10px;justify-content:flex-end">
            <button onclick="this.closest('[style*=fixed]').remove()" class="btn btn-secondary">Done</button>
            <button onclick="rptAddMember()" class="btn btn-primary">Add Member</button>
          </div>
        </div>
      </div>
    </div>`;
  overlay.onclick = e => { if(e.target===overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}

async function rptAddMember() {
  const name  = ($('newMemberName')?.value || '').trim();
  const email = ($('newMemberEmail')?.value || '').trim();
  const role  = ($('newMemberRole')?.value || '').trim();
  if (!name || !email) { toast('Name and email required.', 'error'); return; }
  try {
    await sbFetch('weekly_team_members', {
      method: 'POST',
      headers: {'Content-Type':'application/json','Prefer':'return=minimal'},
      body: JSON.stringify({ name, email, role, active: true })
    });
    toast(`${name} added to weekly reports team.`);
    document.querySelector('[style*="position:fixed"][style*="z-index:99999"]')?.remove();
    rptManageTeam();
  } catch(e) { toast('Failed: ' + e.message, 'error'); }
}

async function rptToggleMember(id, active) {
  await sbFetch(`weekly_team_members?id=eq.${id}`, {
    method: 'PATCH',
    headers: {'Content-Type':'application/json','Prefer':'return=minimal'},
    body: JSON.stringify({ active })
  });
  document.querySelector('[style*="position:fixed"][style*="z-index:99999"]')?.remove();
  rptManageTeam();
}

// ── Compile PPT ───────────────────────────────────────────────────
async function rptCompileNow() {
  const weekStart = getWeekStart();
  const subRes = await sbFetch(`weekly_submissions?week_start=eq.${weekStart}&select=*`).catch(()=>({json:()=>[]}));
  const subs = await subRes.json() || [];

  const members = weeklyTeamMembers.length > 0 ? weeklyTeamMembers :
    [{name:'Soumya',email:'soumya@qnulabs.com'},{name:'Sumanth',email:'sumanth@qnulabs.com'},{name:'Bilal',email:'bilal@qnulabs.com'},{name:'Aditya',email:'aditya.p@qnulabs.com'}];

  if (subs.length === 0) { toast('No submissions yet for this week.', 'error'); return; }

  toast('Compiling PPT...');
  await rptGenerateWeeklyPPT(subs, members, weekStart);
}

async function rptGenerateWeeklyPPT(subs, members, weekStart) {
  // Build HTML-based "PPT" that opens in browser — proper PPTX needs server-side
  const slides = members.map(m => {
    const s = subs.find(x => x.user_email === m.email);
    if (!s) return `
      <div class="ppt-slide">
        <div class="ppt-slide-header"><div class="ppt-slide-name">${esc(m.name)}</div><div class="ppt-slide-week">Week of ${formatDate(weekStart)}</div></div>
        <div style="display:flex;align-items:center;justify-content:center;height:60%;color:rgba(255,255,255,0.4);font-size:14px">No submission received</div>
      </div>`;

    const statusColor = {'in-progress':'#E8460A','done':'#10B981','to-do':'#F59E0B','blocked':'#EF4444'}[s.status] || '#6B7280';
    return `
      <div class="ppt-slide">
        <div class="ppt-slide-header">
          <div class="ppt-slide-name">${esc(s.user_name || m.name)}</div>
          <div class="ppt-slide-week">Week of ${formatDate(weekStart)}</div>
        </div>
        <div class="ppt-slide-body">
          <div class="ppt-section">
            <div class="ppt-section-label">WORK DONE THIS WEEK</div>
            <div class="ppt-section-text">${esc(s.work_done||'—')}</div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <div class="ppt-section">
              <div class="ppt-section-label">STATUS</div>
              <div class="ppt-status-badge" style="background:${statusColor}">${(s.status||'').replace('-',' ').toUpperCase()}</div>
            </div>
            <div class="ppt-section">
              <div class="ppt-section-label">KPI / IMPACT</div>
              <div class="ppt-section-text">${esc(s.kpi_impact||'—')}</div>
            </div>
          </div>
          <div class="ppt-section">
            <div class="ppt-section-label">PLANS FOR NEXT WEEK</div>
            <div class="ppt-section-text">${esc(s.plans_next_week || s.work_done||'—')}</div>
          </div>
        </div>
      </div>`;
  }).join('');

  const pptHTML = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<title>QNu Labs Weekly Marketing Report — Week of ${formatDate(weekStart)}</title>
<style>
body{margin:0;background:#1a1a1a;font-family:'Inter',system-ui,sans-serif;padding:20px}
.ppt-wrap{max-width:960px;margin:0 auto}
.ppt-title-slide{background:#0E2841;border-radius:8px;padding:48px;text-align:center;margin-bottom:16px;color:#fff}
.ppt-title-slide h1{font-size:32px;font-weight:800;margin-bottom:8px}
.ppt-title-slide p{font-size:14px;color:rgba(255,255,255,0.6)}
.ppt-slide{background:#0E2841;border-radius:8px;padding:0;margin-bottom:16px;overflow:hidden;aspect-ratio:16/9;display:flex;flex-direction:column}
.ppt-slide-header{background:#E8460A;padding:14px 24px;display:flex;align-items:center;justify-content:space-between}
.ppt-slide-name{font-size:18px;font-weight:800;color:#fff}
.ppt-slide-week{font-size:12px;color:rgba(255,255,255,0.8)}
.ppt-slide-body{flex:1;padding:24px;display:flex;flex-direction:column;gap:14px}
.ppt-section{background:rgba(255,255,255,0.05);border-radius:6px;padding:12px 14px}
.ppt-section-label{font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#E8460A;margin-bottom:6px}
.ppt-section-text{font-size:13px;color:#fff;line-height:1.5}
.ppt-status-badge{display:inline-block;padding:6px 16px;border-radius:20px;font-size:11px;font-weight:700;color:#fff}
.print-btn{position:fixed;bottom:20px;right:20px;background:#E8460A;color:#fff;border:none;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
@media print{.print-btn{display:none}.ppt-slide{page-break-after:always;break-after:page}}
</style></head><body>
<div class="ppt-wrap">
  <div class="ppt-title-slide">
    <h1>Weekly Marketing Report</h1>
    <p>Week of ${formatDate(weekStart)} · QNu Labs Marketing Team · Compiled: ${new Date().toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'})}</p>
  </div>
  ${slides}
</div>
<button class="print-btn" onclick="window.print()">🖨 Print / Save as PDF</button>
</body></html>`;

  const win = window.open('', '_blank');
  if (win) { win.document.write(pptHTML); win.document.close(); }
  else toast('Pop-up blocked. Please allow pop-ups and try again.', 'error');
}

// ── Date helpers ──────────────────────────────────────────────────
function getWeekStart(date) {
  const d = date ? new Date(date) : new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const mon = new Date(d.setDate(diff));
  return mon.toISOString().slice(0,10);
}

function getWeekEnd(weekStart) {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0,10);
}

// ── November 2026 HTML Report ─────────────────────────────────────
function buildNovemberReportHTML() {
  // Open the full report in a new window using existing module data
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/><title>QNu Labs · Monthly Marketing Report · November 2026</title>
<style>body{font-family:system-ui,sans-serif;background:#f3f4f6;padding:20px;color:#111}
.wrap{max-width:1000px;margin:0 auto}
.header{background:#0E2841;border-radius:8px;padding:24px 28px;color:#fff;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between}
h1{font-size:22px;font-weight:800;margin:0}
p{font-size:12px;color:rgba(255,255,255,0.6);margin:4px 0 0}
.kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}
.kpi{background:#fff;border:1.5px solid #E5E7EB;border-radius:8px;padding:16px}
.kpi-num{font-size:26px;font-weight:800;color:#E8460A}
.kpi-label{font-size:12px;font-weight:600;margin-top:2px}
.kpi-sub{font-size:11px;color:#6B7280}
.section{background:#fff;border-radius:8px;padding:16px;margin-bottom:12px}
.section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#E8460A;margin-bottom:12px;padding-bottom:6px;border-bottom:1.5px solid #FCD9CC}
table{width:100%;border-collapse:collapse;font-size:12px}
th{background:#0E2841;color:#fff;padding:7px 10px;text-align:left;font-size:11px}
td{padding:7px 10px;border-bottom:1px solid #E5E7EB}
tr:hover td{background:#FFF3EE}
.badge{display:inline-block;font-size:10px;font-weight:600;padding:2px 8px;border-radius:20px}
.hot{background:#FEE2E2;color:#DC2626}
.intl{background:#DBEAFE;color:#1E40AF}
</style></head><body>
<div class="wrap">
  <div class="header">
    <div><h1>Monthly Marketing Report — November 2026</h1><p>QNu Labs · Strictly Private & Confidential · qnulabs.com</p></div>
    <div style="font-size:30px;font-weight:800;color:#E8460A">₹39 Cr</div>
  </div>
  <div class="kpi-row">
    <div class="kpi"><div class="kpi-num">₹39 Cr</div><div class="kpi-label">International Pipeline</div><div class="kpi-sub">Cannes ₹35 Cr + Luxembourg ₹4 Cr</div></div>
    <div class="kpi"><div class="kpi-num">9</div><div class="kpi-label">Hot Enterprise Accounts</div><div class="kpi-sub">From events this month</div></div>
    <div class="kpi"><div class="kpi-num">96,813</div><div class="kpi-label">LinkedIn Impressions</div><div class="kpi-sub">▲ 26.8% QoQ · Zero paid</div></div>
    <div class="kpi"><div class="kpi-num">80</div><div class="kpi-label">November Leads</div><div class="kpi-sub">Event & digital combined</div></div>
  </div>
  <div class="section">
    <div class="section-title">Cannes Festival — ₹35 Cr Pipeline Leads</div>
    <table><thead><tr><th>#</th><th>Company</th><th>Sector</th><th>Country</th><th>Est. Pipeline</th><th>Signal</th></tr></thead><tbody>
    <tr><td>1</td><td><strong>Schneider Electric</strong></td><td>Energy / Industrial</td><td><span class="badge intl">France</span></td><td style="color:#E8460A;font-weight:700">₹5 Cr</td><td>Critical infrastructure</td></tr>
    <tr><td>2</td><td><strong>TotalEnergies</strong></td><td>Energy</td><td><span class="badge intl">France</span></td><td style="color:#E8460A;font-weight:700">₹5 Cr</td><td>OT/IT convergence</td></tr>
    <tr><td>3</td><td><strong>Jefferies</strong></td><td>Investment Banking</td><td><span class="badge intl">USA/UK</span></td><td style="color:#E8460A;font-weight:700">₹7 Cr</td><td>BFSI regulatory driver</td></tr>
    <tr><td>4</td><td><strong>Intesa Sanpaolo</strong></td><td>Banking</td><td><span class="badge intl">Italy</span></td><td style="color:#E8460A;font-weight:700">₹6 Cr</td><td>PQC migration mandate</td></tr>
    <tr><td>5</td><td><strong>UBS</strong></td><td>Banking / Wealth Mgmt</td><td><span class="badge intl">Switzerland</span></td><td style="color:#E8460A;font-weight:700">₹6 Cr</td><td>NIST PQC adoption</td></tr>
    <tr><td>6</td><td><strong>Capgemini</strong></td><td>IT Services</td><td><span class="badge intl">France</span></td><td style="color:#E8460A;font-weight:700">₹4 Cr</td><td>QKD deployment</td></tr>
    <tr><td>7</td><td><strong>France Quantum Institute</strong></td><td>Research / Government</td><td><span class="badge intl">France</span></td><td style="color:#E8460A;font-weight:700">₹2 Cr</td><td>Research partnership</td></tr>
    </tbody></table>
  </div>
  <div class="section">
    <div class="section-title">LinkedIn Performance</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
    ${[['96,813','Total Impressions','▲ 26.8%'],['+ 194.8%','Reactions Growth','Zero paid'],['+ 355.6%','Comments Surge','Organic']].map(([n,l,s])=>`<div style="background:#FFF7F5;border:1.5px solid #FCD9CC;border-radius:6px;padding:12px;text-align:center"><div style="font-size:20px;font-weight:800;color:#E8460A">${n}</div><div style="font-size:12px;font-weight:600">${l}</div><div style="font-size:11px;color:#6B7280">${s}</div></div>`).join('')}
    </div>
  </div>
  <div style="text-align:center;padding:16px;font-size:11px;color:#9CA3AF">Monthly Marketing Report · November 2026 · QNu Labs</div>
</div>
</body></html>`;
}

// ── Modal helper (reused) ─────────────────────────────────────────
function buildRptModal() {
  return `<div id="rptOverlay" style="position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99999;display:none;align-items:flex-start;justify-content:center;padding:40px 16px;overflow-y:auto" onclick="if(event.target===this)rptCloseModal()">
    <div style="background:#fff;border-radius:10px;width:100%;max-width:980px;margin:auto;box-shadow:0 24px 64px rgba(0,0,0,0.3)">
      <div style="background:#0E2841;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;border-radius:10px 10px 0 0;border-bottom:3px solid var(--accent)">
        <div><div id="rptMTitle" style="font-size:15px;font-weight:700;color:#fff"></div><div id="rptMSub" style="font-size:12px;color:rgba(255,255,255,0.55);margin-top:2px"></div></div>
        <button onclick="rptCloseModal()" style="width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,0.12);border:none;color:#fff;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center">✕</button>
      </div>
      <div id="rptMBody" style="padding:20px;max-height:72vh;overflow-y:auto"></div>
    </div>
  </div>`;
}

function rptCloseModal() {
  const o = $('rptOverlay');
  if (o) o.style.display = 'none';
  document.body.style.overflow = '';
}
