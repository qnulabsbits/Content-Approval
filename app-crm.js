/* ═══════════════════════════════════════════════════
   CRM DASHBOARD MODULE
   - Leads from Zoho CRM (required fields + filters)
   - Deals from Zoho CRM (required fields + filters)
   - Business Card Scanner
   - Whitepaper Download Analytics
═══════════════════════════════════════════════════ */

const ZOHO_CRM_EDGE = SUPA_URL + '/functions/v1/zoho-crm';

let crmLeads = [], crmDeals = [], crmTab = 'leads';
let crmLeadsPage = 1, crmDealsPage = 1;
let crmLeadsPerPage = 25, crmDealsPerPage = 25;
let crmLeadsFilters = {}, crmDealsFilters = {};
let crmLeadsTotal = 0, crmDealsTotal = 0;

// ── Required fields ───────────────────────────────────────────────
const LEADS_FIELDS = [
  { key: 'Full_Name',                    label: 'Full Name' },
  { key: 'Company',                      label: 'Company' },
  { key: 'Phone',                        label: 'Phone' },
  { key: 'Phone_2',                      label: 'Phone 2' },
  { key: 'Email',                        label: 'Email' },
  { key: 'Lead_Source',                  label: 'Lead Source' },
  { key: 'SP_Source',                    label: 'SP Source' },
  { key: 'Customer_Segment',             label: 'Customer Segment' },
  { key: 'Owner',                        label: 'Lead Owner', render: v => v?.name||'-' },
  { key: 'Created_By',                   label: 'Lead Generator', render: v => v?.name||'-' },
  { key: 'Average_Time_Spent_Minutes',   label: 'Avg Time Spent (min)' },
  { key: 'Description',                  label: 'Description' },
  { key: 'Message',                      label: 'Message' },
  { key: 'Created_Time',                 label: 'Created Time', render: v => formatDateTime(v) },
];

const DEALS_FIELDS = [
  { key: 'Deal_Name',                    label: 'Deal Name' },
  { key: 'Stage',                        label: 'Stage' },
  { key: 'Owner',                        label: 'Deal Owner', render: v => v?.name||'-' },
  { key: 'Product_Family',               label: 'Product Family' },
  { key: 'Product_Category',             label: 'Product Category' },
  { key: 'Product_Specification',        label: 'Product Specification' },
  { key: 'Amount_In_Crores',             label: 'Amount In Crores' },
  { key: 'Amount',                       label: 'Amount' },
  { key: 'Customer_Segment',             label: 'Customer Segment' },
  { key: 'Confidence',                   label: 'Confidence' },
  { key: 'Quarter',                      label: 'Quarter' },
  { key: 'Probability',                  label: 'Probability (%)' },
  { key: 'Level_of_Stage',               label: 'Level of Stage' },
  { key: 'Lead_Conversion_Time',         label: 'Lead Conversion Time' },
  { key: 'Lead_Source',                  label: 'Lead Source' },
  { key: 'Targeted_Booking_PO_Date',     label: 'Targeted Booking (PO) Date', render: v => v ? formatDate(v) : '-' },
  { key: 'Targeted_Revenue_Date',        label: 'Targeted Revenue Date', render: v => v ? formatDate(v) : '-' },
  { key: 'Closing_Date',                 label: 'Closing Date', render: v => v ? formatDate(v) : '-' },
  { key: 'Modified_Time',                label: 'Modified Time', render: v => formatDateTime(v) },
  { key: 'Created_Time',                 label: 'Created Time', render: v => formatDateTime(v) },
];

// ── Load ──────────────────────────────────────────────────────────
async function loadCRM() {
  crmTab = 'leads';
  renderCRMPage();
  await crmFetchLeads();
}

async function crmFetchLeads() {
  const wrap = $('crmLeadsTable');
  if (wrap) wrap.innerHTML = '<div class="loading-row"><span class="spinner"></span> Loading leads from Zoho CRM...</div>';
  try {
    const token = await getToken();
    const res = await fetch(ZOHO_CRM_EDGE, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+token, 'apikey':SUPA_KEY },
      body: JSON.stringify({ action:'get_leads', page: crmLeadsPage, per_page: crmLeadsPerPage })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch leads');
    crmLeads = data.leads || [];
    renderCRMLeadsTable();
  } catch(e) {
    if (wrap) wrap.innerHTML = `<div class="empty-state"><div class="empty-title">Could not load leads</div><div class="empty-sub">${esc(e.message)}</div><div style="margin-top:12px"><button onclick="crmFetchLeads()" class="btn btn-primary btn-sm">Retry</button></div></div>`;
  }
}

async function crmFetchDeals() {
  const wrap = $('crmDealsTable');
  if (wrap) wrap.innerHTML = '<div class="loading-row"><span class="spinner"></span> Loading deals from Zoho CRM...</div>';
  try {
    const token = await getToken();
    const res = await fetch(ZOHO_CRM_EDGE, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+token, 'apikey':SUPA_KEY },
      body: JSON.stringify({ action:'get_deals', page: crmDealsPage, per_page: crmDealsPerPage })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch deals');
    crmDeals = data.deals || [];
    renderCRMDealsTable();
  } catch(e) {
    if (wrap) wrap.innerHTML = `<div class="empty-state"><div class="empty-title">Could not load deals</div><div class="empty-sub">${esc(e.message)}</div></div>`;
  }
}

// ── Page render ───────────────────────────────────────────────────
function renderCRMPage() {
  ['leads','deals'].forEach(t => {
    const el = $('crmTab_'+t);
    if (el) el.classList.toggle('active', t === crmTab);
    const pg = $('crmPane_'+t);
    if (pg) pg.style.display = t === crmTab ? 'block' : 'none';
  });
}

function crmSetTab(tab) {
  crmTab = tab;
  renderCRMPage();
  if (tab === 'leads') crmFetchLeads();
  else if (tab === 'deals') crmFetchDeals();
}

// ── Filter helpers ────────────────────────────────────────────────
function crmGetFilteredLeads() {
  return crmLeads.filter(lead => {
    return Object.entries(crmLeadsFilters).every(([key, val]) => {
      if (!val || val === '') return true;
      const field = LEADS_FIELDS.find(f => f.key === key);
      let cellVal = lead[key];
      if (typeof cellVal === 'object' && cellVal !== null) cellVal = cellVal.name || '';
      return String(cellVal||'').toLowerCase().includes(val.toLowerCase());
    });
  });
}

function crmGetFilteredDeals() {
  return crmDeals.filter(deal => {
    return Object.entries(crmDealsFilters).every(([key, val]) => {
      if (!val || val === '') return true;
      let cellVal = deal[key];
      if (typeof cellVal === 'object' && cellVal !== null) cellVal = cellVal.name || '';
      return String(cellVal||'').toLowerCase().includes(val.toLowerCase());
    });
  });
}

function crmSetLeadFilter(key, val) {
  crmLeadsFilters[key] = val;
  renderCRMLeadsTable();
}

function crmSetDealFilter(key, val) {
  crmDealsFilters[key] = val;
  renderCRMDealsTable();
}

function crmClearLeadFilters() {
  crmLeadsFilters = {};
  document.querySelectorAll('.crm-lead-filter').forEach(el => el.value = '');
  renderCRMLeadsTable();
}

function crmClearDealFilters() {
  crmDealsFilters = {};
  document.querySelectorAll('.crm-deal-filter').forEach(el => el.value = '');
  renderCRMDealsTable();
}

// ── Per page selector ─────────────────────────────────────────────
function crmPerPageSelector(current, onchange) {
  return `<select onchange="${onchange}" class="field-select" style="font-size:12px;width:auto;padding:6px 10px">
    ${[25,50,75,100].map(n => `<option value="${n}"${current===n?' selected':''}>${n} per page</option>`).join('')}
  </select>`;
}

// ── Leads Table ───────────────────────────────────────────────────
function renderCRMLeadsTable() {
  const wrap = $('crmLeadsTable'); if (!wrap) return;
  const filtered = crmGetFilteredLeads();
  const activeFilters = Object.values(crmLeadsFilters).filter(v=>v&&v!=='').length;

  let h = `
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <div style="font-size:13px;color:var(--muted)">${filtered.length} of ${crmLeads.length} leads · Page ${crmLeadsPage}</div>
      ${activeFilters ? `<button onclick="crmClearLeadFilters()" class="btn btn-secondary btn-sm" style="color:#DC2626">✕ Clear ${activeFilters} filter${activeFilters>1?'s':''}</button>` : ''}
    </div>
    <div style="display:flex;gap:8px;align-items:center">
      ${crmPerPageSelector(crmLeadsPerPage, `crmLeadsPerPage=parseInt(this.value);crmLeadsPage=1;crmFetchLeads()`)}
      <button onclick="crmExportLeadsExcel()" class="btn btn-secondary btn-sm">📊 Export</button>
      <button onclick="crmLeadsPage=Math.max(1,crmLeadsPage-1);crmFetchLeads()" class="btn btn-secondary btn-sm"${crmLeadsPage===1?' disabled':''}>◀</button>
      <button onclick="crmLeadsPage++;crmFetchLeads()" class="btn btn-secondary btn-sm"${crmLeads.length<crmLeadsPerPage?' disabled':''}>▶</button>
    </div>
  </div>
  <div style="overflow-x:auto">
  <table>
    <thead>
      <tr>${LEADS_FIELDS.map(f => `<th style="white-space:nowrap">${f.label}</th>`).join('')}</tr>
      <tr class="filter-row">${LEADS_FIELDS.map(f => `
        <th style="padding:4px 6px;background:var(--surface2)">
          <input type="text" class="crm-lead-filter field-input" placeholder="Filter..." 
            style="font-size:11px;padding:4px 6px;min-width:80px;width:100%"
            value="${esc(crmLeadsFilters[f.key]||'')}"
            oninput="crmSetLeadFilter('${f.key}',this.value)"/>
        </th>`).join('')}
      </tr>
    </thead>
    <tbody>`;

  if (!filtered.length) {
    h += `<tr><td colspan="${LEADS_FIELDS.length}" style="text-align:center;padding:32px;color:var(--muted)">No leads match the current filters</td></tr>`;
  } else {
    filtered.forEach(lead => {
      h += `<tr style="cursor:pointer" onclick="crmShowLeadDetail(${JSON.stringify(JSON.stringify(lead))})">`;
      LEADS_FIELDS.forEach(f => {
        let val = lead[f.key];
        const display = f.render ? f.render(val) : (val == null ? '-' : esc(String(val)));
        h += `<td style="white-space:nowrap;max-width:200px;overflow:hidden;text-overflow:ellipsis" title="${typeof display==='string'?display:''}">${display||'-'}</td>`;
      });
      h += `</tr>`;
    });
  }

  h += `</tbody></table></div>`;
  wrap.innerHTML = h;
}

// ── Deals Table ───────────────────────────────────────────────────
function renderCRMDealsTable() {
  const wrap = $('crmDealsTable'); if (!wrap) return;
  const filtered = crmGetFilteredDeals();
  const activeFilters = Object.values(crmDealsFilters).filter(v=>v&&v!=='').length;

  let h = `
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <div style="font-size:13px;color:var(--muted)">${filtered.length} of ${crmDeals.length} deals · Page ${crmDealsPage}</div>
      ${activeFilters ? `<button onclick="crmClearDealFilters()" class="btn btn-secondary btn-sm" style="color:#DC2626">✕ Clear ${activeFilters} filter${activeFilters>1?'s':''}</button>` : ''}
    </div>
    <div style="display:flex;gap:8px;align-items:center">
      ${crmPerPageSelector(crmDealsPerPage, `crmDealsPerPage=parseInt(this.value);crmDealsPage=1;crmFetchDeals()`)}
      <button onclick="crmExportDealsExcel()" class="btn btn-secondary btn-sm">📊 Export</button>
      <button onclick="crmDealsPage=Math.max(1,crmDealsPage-1);crmFetchDeals()" class="btn btn-secondary btn-sm"${crmDealsPage===1?' disabled':''}>◀</button>
      <button onclick="crmDealsPage++;crmFetchDeals()" class="btn btn-secondary btn-sm"${crmDeals.length<crmDealsPerPage?' disabled':''}>▶</button>
    </div>
  </div>
  <div style="overflow-x:auto">
  <table>
    <thead>
      <tr>${DEALS_FIELDS.map(f => `<th style="white-space:nowrap">${f.label}</th>`).join('')}</tr>
      <tr class="filter-row">${DEALS_FIELDS.map(f => `
        <th style="padding:4px 6px;background:var(--surface2)">
          <input type="text" class="crm-deal-filter field-input" placeholder="Filter..."
            style="font-size:11px;padding:4px 6px;min-width:80px;width:100%"
            value="${esc(crmDealsFilters[f.key]||'')}"
            oninput="crmSetDealFilter('${f.key}',this.value)"/>
        </th>`).join('')}
      </tr>
    </thead>
    <tbody>`;

  if (!filtered.length) {
    h += `<tr><td colspan="${DEALS_FIELDS.length}" style="text-align:center;padding:32px;color:var(--muted)">No deals match the current filters</td></tr>`;
  } else {
    filtered.forEach(deal => {
      h += `<tr style="cursor:pointer" onclick="crmShowDealDetail(${JSON.stringify(JSON.stringify(deal))})">`;
      DEALS_FIELDS.forEach(f => {
        let val = deal[f.key];
        const display = f.render ? f.render(val) : (val == null ? '-' : esc(String(val)));
        h += `<td style="white-space:nowrap;max-width:200px;overflow:hidden;text-overflow:ellipsis" title="${typeof display==='string'?display:''}">${display||'-'}</td>`;
      });
      h += `</tr>`;
    });
  }

  h += `</tbody></table></div>`;
  wrap.innerHTML = h;
}

// ── Detail panels ─────────────────────────────────────────────────
function crmShowLeadDetail(jsonStr) {
  const lead = JSON.parse(jsonStr);
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
  let rows = LEADS_FIELDS.map(f => {
    let val = lead[f.key];
    const display = f.render ? f.render(val) : (val == null ? '-' : String(val));
    return `<tr><td style="font-size:12px;font-weight:600;color:var(--muted);padding:8px 12px;border-bottom:1px solid var(--border);white-space:nowrap;width:200px">${f.label}</td>
      <td style="font-size:13px;padding:8px 12px;border-bottom:1px solid var(--border)">${display||'-'}</td></tr>`;
  }).join('');
  overlay.innerHTML = `<div style="background:var(--surface);border-radius:14px;max-width:680px;width:100%;max-height:88vh;overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,0.25)">
    <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:var(--surface)">
      <div style="font-size:15px;font-weight:700">👤 ${esc(lead.Full_Name||lead.Last_Name||'Lead')}</div>
      <button onclick="this.closest('[style*=fixed]').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--muted)">✕</button>
    </div>
    <table style="width:100%">${rows}</table>
  </div>`;
  overlay.onclick = e => { if(e.target===overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}

function crmShowDealDetail(jsonStr) {
  const deal = JSON.parse(jsonStr);
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
  let rows = DEALS_FIELDS.map(f => {
    let val = deal[f.key];
    const display = f.render ? f.render(val) : (val == null ? '-' : String(val));
    return `<tr><td style="font-size:12px;font-weight:600;color:var(--muted);padding:8px 12px;border-bottom:1px solid var(--border);white-space:nowrap;width:220px">${f.label}</td>
      <td style="font-size:13px;padding:8px 12px;border-bottom:1px solid var(--border)">${display||'-'}</td></tr>`;
  }).join('');
  overlay.innerHTML = `<div style="background:var(--surface);border-radius:14px;max-width:680px;width:100%;max-height:88vh;overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,0.25)">
    <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:var(--surface)">
      <div style="font-size:15px;font-weight:700">💼 ${esc(deal.Deal_Name||'Deal')}</div>
      <button onclick="this.closest('[style*=fixed]').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--muted)">✕</button>
    </div>
    <table style="width:100%">${rows}</table>
  </div>`;
  overlay.onclick = e => { if(e.target===overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}

// ── Export ────────────────────────────────────────────────────────
function crmExportLeadsExcel() {
  const filtered = crmGetFilteredLeads();
  const headers = LEADS_FIELDS.map(f => f.label);
  const rows = filtered.map(lead =>
    LEADS_FIELDS.map(f => {
      let val = lead[f.key];
      if (typeof val === 'object' && val !== null) val = val.name || '';
      return val == null ? '' : String(val);
    })
  );
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = headers.map(() => ({ wch: 20 }));
  const wb = { SheetNames:['Leads'], Sheets:{ Leads: ws } };
  const out = XLSX.write(wb, { bookType:'xlsx', type:'binary' });
  const buf = new ArrayBuffer(out.length);
  const view = new Uint8Array(buf);
  for (let i=0; i<out.length; i++) view[i] = out.charCodeAt(i) & 0xFF;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([buf], { type:'application/octet-stream' }));
  a.download = 'CRM_Leads_' + new Date().toISOString().slice(0,10) + '.xlsx';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  toast('Leads exported.');
}

function crmExportDealsExcel() {
  const filtered = crmGetFilteredDeals();
  const headers = DEALS_FIELDS.map(f => f.label);
  const rows = filtered.map(deal =>
    DEALS_FIELDS.map(f => {
      let val = deal[f.key];
      if (typeof val === 'object' && val !== null) val = val.name || '';
      return val == null ? '' : String(val);
    })
  );
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = headers.map(() => ({ wch: 20 }));
  const wb = { SheetNames:['Deals'], Sheets:{ Deals: ws } };
  const out = XLSX.write(wb, { bookType:'xlsx', type:'binary' });
  const buf = new ArrayBuffer(out.length);
  const view = new Uint8Array(buf);
  for (let i=0; i<out.length; i++) view[i] = out.charCodeAt(i) & 0xFF;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([buf], { type:'application/octet-stream' }));
  a.download = 'CRM_Deals_' + new Date().toISOString().slice(0,10) + '.xlsx';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  toast('Deals exported.');
}


// ── Analytics page loader (called from app-core.js showPage) ──────
async function loadAnalyticsPage() {
  const wrap = $('crmAnalyticsPane');
  if (!wrap) return;
  wrap.innerHTML = '<div class="loading-row"><span class="spinner"></span> Loading analytics...</div>';
  try {
    wpDownloads = await sbFetch('whitepaper_downloads?order=downloaded_at.desc&select=*') || [];
    renderWPAnalytics();
  } catch(e) {
    wrap.innerHTML = `<div class="empty-state"><div class="empty-title">Could not load</div><div class="empty-sub">${esc(e.message)}</div></div>`;
  }
}

// ── Analytics (Whitepaper Downloads) ─────────────────────────────
let wpDownloads = [], wpAnalyticsExpanded = null;

async function crmLoadAnalytics() {
  const wrap = $('crmAnalyticsPane'); if (!wrap) return;
  wrap.innerHTML = '<div class="loading-row"><span class="spinner"></span> Loading analytics...</div>';
  try {
    const rows = await sbFetch('whitepaper_downloads?order=downloaded_at.desc&select=*') || [];
    wpDownloads = rows;
    renderWPAnalytics();
  } catch(e) { wrap.innerHTML = `<div class="empty-state"><div class="empty-title">Error</div><div class="empty-sub">${esc(e.message)}</div></div>`; }
}

function renderWPAnalytics() {
  const wrap = $('crmAnalyticsPane'); if (!wrap) return;
  if (!wpDownloads.length) {
    wrap.innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><div class="empty-title">No downloads yet</div><div class="empty-sub">Downloads will appear here once users submit the whitepaper form.</div></div>';
    return;
  }
  // Group by whitepaper title
  const grouped = {};
  wpDownloads.forEach(d => {
    const t = d.whitepaper_title || 'Unknown';
    if (!grouped[t]) grouped[t] = [];
    grouped[t].push(d);
  });
  const sorted = Object.entries(grouped).sort((a,b) => b[1].length - a[1].length);
  let h = `<div style="display:flex;justify-content:flex-end;margin-bottom:12px">
    <button onclick="wpExportAllExcel()" class="btn btn-secondary btn-sm">📊 Export All to Excel</button>
  </div>`;
  sorted.forEach(([title, dls]) => {
    const isOpen = wpAnalyticsExpanded === title;
    const last = formatDate(dls[0]?.downloaded_at);
    h += `<div style="border:1px solid var(--border);border-radius:10px;margin-bottom:10px;overflow:hidden">
      <div onclick="wpToggleAnalytics('${esc(title).replace(/'/g,"\\'")}',this)" style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;cursor:pointer;background:var(--surface);transition:background 0.15s">
        <div>
          <div style="font-size:14px;font-weight:700">${esc(title)}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">Last download: ${last}</div>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <div style="background:var(--accent);color:#fff;border-radius:20px;padding:4px 14px;font-size:13px;font-weight:700">${dls.length} download${dls.length!==1?'s':''}</div>
          <span style="font-size:16px;transition:transform 0.2s">${isOpen?'▲':'▼'}</span>
        </div>
      </div>
      ${isOpen ? `<div style="padding:0 0 12px">
        <table style="width:100%"><thead><tr>
          <th>#</th><th>Name</th><th>Company</th><th>Designation</th><th>Email</th><th>Phone</th><th>How Heard</th><th>Date</th>
        </tr></thead><tbody>
        ${dls.map((d,i) => `<tr>
          <td class="td-num">${i+1}</td>
          <td style="font-weight:600">${esc(d.full_name||'-')}</td>
          <td>${esc(d.company||'-')}</td>
          <td>${esc(d.designation||'-')}</td>
          <td><a href="mailto:${esc(d.email||'')}" style="color:var(--accent)">${esc(d.email||'-')}</a></td>
          <td>${esc(d.phone||'-')}</td>
          <td>${esc(d.how_heard||'-')}</td>
          <td>${formatDate(d.downloaded_at)}</td>
        </tr>`).join('')}
        </tbody></table>
        <div style="padding:8px 16px">
          <button onclick="wpExportTitleExcel('${esc(title).replace(/'/g,"\\'")}',event)" class="btn btn-secondary btn-xs">📊 Export this whitepaper</button>
        </div>
      </div>` : ''}
    </div>`;
  });
  wrap.innerHTML = h;
}

function wpToggleAnalytics(title) {
  wpAnalyticsExpanded = wpAnalyticsExpanded === title ? null : title;
  renderWPAnalytics();
}

function wpExportAllExcel() {
  if (!wpDownloads.length) { toast('No data to export','error'); return; }
  const rows = wpDownloads.map(d => ({ 'Whitepaper':d.whitepaper_title||'', 'Name':d.full_name||'', 'Company':d.company||'', 'Designation':d.designation||'', 'Email':d.email||'', 'Phone':d.phone||'', 'How Heard':d.how_heard||'', 'Date':formatDate(d.downloaded_at) }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const _wb={SheetNames:['Downloads'],Sheets:{}}; _wb.Sheets['Downloads']=ws;
  const _o=XLSX.write(_wb,{bookType:'xlsx',type:'binary'}),_b=new ArrayBuffer(_o.length),_v=new Uint8Array(_b);
  for(let i=0;i<_o.length;i++) _v[i]=_o.charCodeAt(i)&0xFF;
  const _a=document.createElement('a'); _a.href=URL.createObjectURL(new Blob([_b],{type:'application/octet-stream'})); _a.download='Whitepaper_Downloads_'+new Date().toISOString().slice(0,10)+'.xlsx';
  document.body.appendChild(_a); _a.click(); document.body.removeChild(_a); setTimeout(()=>URL.revokeObjectURL(_a.href),1500);
  toast('All downloads exported.');
}

function wpExportTitleExcel(title, e) {
  if(e) e.stopPropagation();
  const rows = wpDownloads.filter(d=>d.whitepaper_title===title).map(d=>({'Name':d.full_name||'','Company':d.company||'','Designation':d.designation||'','Email':d.email||'','Phone':d.phone||'','How Heard':d.how_heard||'','Date':formatDate(d.downloaded_at)}));
  if (!rows.length) { toast('No data','error'); return; }
  const ws=XLSX.utils.json_to_sheet(rows);
  const _wb={SheetNames:['Downloads'],Sheets:{}}; _wb.Sheets['Downloads']=ws;
  const _o=XLSX.write(_wb,{bookType:'xlsx',type:'binary'}),_b=new ArrayBuffer(_o.length),_v=new Uint8Array(_b);
  for(let i=0;i<_o.length;i++) _v[i]=_o.charCodeAt(i)&0xFF;
  const _a=document.createElement('a'); _a.href=URL.createObjectURL(new Blob([_b],{type:'application/octet-stream'})); _a.download=title.replace(/[^a-z0-9]/gi,'_').slice(0,40)+'_Downloads.xlsx';
  document.body.appendChild(_a); _a.click(); document.body.removeChild(_a); setTimeout(()=>URL.revokeObjectURL(_a.href),1500);
  toast('Exported.');
}


// ── Upload Leads page (sub-item of CRM) ──────────────────────────
async function loadUploadLeads() {
  // Load cards and render into the upload-leads page
  try {
    bizCards = await sbFetch('business_cards?order=created_at.desc&select=*') || [];
  } catch(e) { bizCards = []; }
  const wrap = $('crmCardsPane2');
  if (!wrap) return;
  // Temporarily point renderBusinessCards at crmCardsPane2
  const orig = $('crmCardsPane');
  if (orig) orig.id = '_crmCardsPane_hidden';
  wrap.id = 'crmCardsPane';
  renderBusinessCards();
  wrap.id = 'crmCardsPane2';
  if (orig) orig.id = 'crmCardsPane';
}

/* ═══════════════════════════════════════════════════
   BUSINESS CARD SCANNER
═══════════════════════════════════════════════════ */

let bizCards = [], currentEventName = '', bizScanSession = null;

async function loadBusinessCards() {
  const wrap = $('crmCardsPane'); if (!wrap) return;
  try {
    bizCards = await sbFetch('business_cards?order=created_at.desc&select=*') || [];
    renderBusinessCards();
  } catch(e) { console.error('Cards load error:', e); }
}

function renderBusinessCards() {
  const wrap = $('crmCardsPane'); if (!wrap) return;
  let h = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px">
    <div style="font-size:13px;color:var(--muted)">${bizCards.length} card(s) scanned</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button onclick="bizCardsExportExcel()" class="btn btn-secondary btn-sm">📊 Export Excel</button>
      <button onclick="bizStartScan()" class="btn btn-primary btn-sm">+ Add Cards</button>
    </div>
  </div>`;
  if (!bizCards.length) {
    h += '<div class="empty-state"><div class="empty-icon">📇</div><div class="empty-title">No cards scanned yet</div><div class="empty-sub">Click "Add Cards" to scan or upload business cards.</div></div>';
  } else {
    h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">';
    bizCards.forEach(c => {
      const statusColor = c.crm_status==='synced'?'#10B981':c.crm_status==='failed'?'#EF4444':'#F59E0B';
      h += `<div style="background:var(--surface);border:1.5px solid var(--border);border-radius:12px;padding:14px;cursor:pointer" onclick="bizShowCard(${c.id})">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <span style="font-size:10px;font-weight:700;color:${statusColor};background:${statusColor}22;border:1px solid ${statusColor}44;border-radius:10px;padding:2px 8px;text-transform:uppercase">${c.crm_status||'pending'}</span>
          ${c.event_name?`<span style="font-size:10px;color:var(--muted);font-style:italic">📍${esc(c.event_name)}</span>`:''}
        </div>
        <div style="font-size:14px;font-weight:700;margin-bottom:2px">${esc(c.full_name||'Unknown')}</div>
        <div style="font-size:12px;color:var(--accent);font-weight:600">${esc(c.designation||'')}</div>
        <div style="font-size:12px;color:var(--muted)">${esc(c.company||'')}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:4px">${esc(c.email||'')}${c.phone?' · '+esc(c.phone):''}</div>
        <div style="font-size:10px;color:var(--muted);margin-top:6px">${formatDate(c.created_at)}</div>
      </div>`;
    });
    h += '</div>';
  }
  wrap.innerHTML = h;
}

// ── Start scan session ────────────────────────────────────────────
function bizStartScan() {
  const overlay = document.createElement('div');
  overlay.id = 'bizScanOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
  overlay.innerHTML = `<div style="background:var(--surface);border-radius:14px;max-width:460px;width:100%;box-shadow:0 8px 40px rgba(0,0,0,0.3);overflow:hidden">
    <div style="padding:20px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
      <div style="font-size:16px;font-weight:700">Add Business Cards</div>
      <button onclick="document.getElementById('bizScanOverlay').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--muted)">✕</button>
    </div>
    <div style="padding:20px 24px">
      <!-- Event name question -->
      <div style="background:#EFF6FF;border:1.5px solid #BFDBFE;border-radius:10px;padding:14px;margin-bottom:16px">
        <div style="font-size:13px;font-weight:700;color:#1D4ED8;margin-bottom:8px">📍 Are these cards from an event?</div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <button onclick="bizEventYes()" id="bizEvtYesBtn" class="btn btn-secondary btn-sm">Yes, from an event</button>
          <button onclick="bizEventNo()" id="bizEvtNoBtn" class="btn btn-secondary btn-sm">No, general scan</button>
        </div>
        <div id="bizEventNameRow" style="display:none;margin-top:8px">
          <input type="text" id="bizEventNameInput" class="field-input" placeholder="Event name (e.g. CyberSec Summit 2026)" style="width:100%;box-sizing:border-box"/>
        </div>
      </div>
      <!-- Upload options -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
        <div onclick="bizTriggerCamera()" style="border:2px dashed var(--border);border-radius:10px;padding:20px 10px;text-align:center;cursor:pointer;transition:all 0.15s" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
          <div style="font-size:28px;margin-bottom:6px">📷</div>
          <div style="font-size:12px;font-weight:700">Take Photo</div>
          <div style="font-size:10px;color:var(--muted)">Use camera</div>
        </div>
        <div onclick="bizTriggerUpload()" style="border:2px dashed var(--border);border-radius:10px;padding:20px 10px;text-align:center;cursor:pointer;transition:all 0.15s" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
          <div style="font-size:28px;margin-bottom:6px">📸</div>
          <div style="font-size:12px;font-weight:700">Upload Photo</div>
          <div style="font-size:10px;color:var(--muted)">From gallery</div>
        </div>
        <div onclick="bizTriggerExcel()" style="border:2px dashed var(--border);border-radius:10px;padding:20px 10px;text-align:center;cursor:pointer;transition:all 0.15s" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
          <div style="font-size:28px;margin-bottom:6px">📊</div>
          <div style="font-size:12px;font-weight:700">Excel Import</div>
          <div style="font-size:10px;color:var(--muted)">Bulk upload</div>
        </div>
      </div>
      <input type="file" id="bizCameraInput" accept="image/*" capture="environment" style="display:none" onchange="bizProcessImage(this)"/>
      <input type="file" id="bizUploadInput" accept="image/*" style="display:none" onchange="bizProcessImage(this)"/>
      <input type="file" id="bizExcelInput" accept=".xlsx,.xls,.csv" style="display:none" onchange="bizProcessExcel(this)"/>
    </div>
  </div>`;
  document.body.appendChild(overlay);
}

function bizEventYes() {
  document.getElementById('bizEventNameRow').style.display = 'block';
  document.getElementById('bizEvtYesBtn').style.background = 'var(--accent)';
  document.getElementById('bizEvtYesBtn').style.color = '#fff';
  document.getElementById('bizEvtNoBtn').style.background = '';
  document.getElementById('bizEvtNoBtn').style.color = '';
}
function bizEventNo() {
  document.getElementById('bizEventNameRow').style.display = 'none';
  document.getElementById('bizEventNameInput') && (document.getElementById('bizEventNameInput').value = '');
  document.getElementById('bizEvtNoBtn').style.background = 'var(--accent)';
  document.getElementById('bizEvtNoBtn').style.color = '#fff';
  document.getElementById('bizEvtYesBtn').style.background = '';
  document.getElementById('bizEvtYesBtn').style.color = '';
}

function bizGetEventName() {
  const inp = document.getElementById('bizEventNameInput');
  return inp ? inp.value.trim() : '';
}

function bizTriggerCamera() { document.getElementById('bizCameraInput')?.click(); }
function bizTriggerUpload() { document.getElementById('bizUploadInput')?.click(); }
function bizTriggerExcel()  { document.getElementById('bizExcelInput')?.click(); }

// ── OCR Processing ────────────────────────────────────────────────
async function bizProcessImage(input) {
  const file = input.files[0]; if (!file) return;
  const eventName = bizGetEventName();
  document.getElementById('bizScanOverlay')?.remove();
  toast('Reading business card...');

  // Load Tesseract.js from CDN
  if (!window.Tesseract) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/4.1.1/tesseract.min.js';
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // Show processing overlay
  const procOverlay = document.createElement('div');
  procOverlay.id = 'bizProcOverlay';
  procOverlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff';
  procOverlay.innerHTML = `<div style="font-size:40px;margin-bottom:16px">🔍</div>
    <div style="font-size:16px;font-weight:700;margin-bottom:8px">Reading business card...</div>
    <div id="bizOCRProgress" style="font-size:12px;opacity:0.7">Starting OCR engine...</div>`;
  document.body.appendChild(procOverlay);

  try {
    // Convert to base64 for display
    const imgUrl = URL.createObjectURL(file);

    // Run OCR
    const result = await Tesseract.recognize(file, 'eng', {
      logger: m => {
        const prog = document.getElementById('bizOCRProgress');
        if (prog && m.status) prog.textContent = m.status + (m.progress ? ' ' + Math.round(m.progress*100)+'%' : '');
      }
    });

    document.getElementById('bizProcOverlay')?.remove();
    const text = result.data.text;
    const extracted = bizExtractFields(text);
    bizShowReviewForm(extracted, imgUrl, eventName);
  } catch(e) {
    document.getElementById('bizProcOverlay')?.remove();
    toast('OCR failed: '+e.message, 'error');
  }
  input.value = '';
}

// ── Extract fields from OCR text ──────────────────────────────────
function bizExtractFields(text) {
  const lines = text.split('\n').map(l=>l.trim()).filter(Boolean);
  const emailRx = /[\w._%+-]+@[\w.-]+\.[a-z]{2,}/i;
  const phoneRx = /(?:\+?\d[\d\s\-().]{7,}\d)/;
  const webRx = /(?:www\.|https?:\/\/)[^\s]+/i;
  const linkedinRx = /linkedin\.com\/in\/[^\s]+/i;
  const result = { full_name:'', company:'', designation:'', email:'', phone:'', website:'', linkedin:'' };
  lines.forEach(line => {
    if (!result.email) { const m=line.match(emailRx); if(m) result.email=m[0]; }
    if (!result.phone) { const m=line.match(phoneRx); if(m) result.phone=m[0].replace(/\s+/g,' ').trim(); }
    if (!result.website && !result.email.includes(line)) { const m=line.match(webRx); if(m) result.website=m[0]; }
    if (!result.linkedin) { const m=line.match(linkedinRx); if(m) result.linkedin=m[0]; }
  });
  // Name heuristic: first long line without special chars that isn't email/phone/web
  const nameRx = /^[A-Z][a-z]+(?: [A-Z][a-z]+)+$/;
  for (const line of lines) {
    if (!result.full_name && nameRx.test(line) && !line.includes('@')) { result.full_name = line; break; }
  }
  // Company: often after name, contains Ltd/Inc/Pvt etc or is ALL CAPS
  const companyRx = /(?:Ltd|Limited|Inc|Corp|Pvt|Private|Technologies|Solutions|Systems|Labs|Group)/i;
  const allCaps = /^[A-Z\s&.]{4,}$/;
  for (const line of lines) {
    if (!result.company && (companyRx.test(line) || allCaps.test(line)) && !line.includes('@')) {
      result.company = line; break;
    }
  }
  // Designation heuristics
  const titleRx = /(?:CEO|CTO|CMO|CFO|Manager|Director|Engineer|Developer|Designer|Head|VP|President|Officer|Executive|Analyst|Consultant|Specialist|Lead)/i;
  for (const line of lines) {
    if (!result.designation && titleRx.test(line) && line.length < 60) { result.designation = line; break; }
  }
  return result;
}

// ── Review form before saving ─────────────────────────────────────
function bizShowReviewForm(fields, imgUrl, eventName) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto';
  const flds = ['full_name','company','designation','email','phone','website','linkedin'];
  const labels = {full_name:'Full Name',company:'Company',designation:'Designation',email:'Email',phone:'Phone',website:'Website',linkedin:'LinkedIn'};
  overlay.innerHTML = `<div style="background:var(--surface);border-radius:14px;max-width:600px;width:100%;box-shadow:0 8px 40px rgba(0,0,0,0.3)">
    <div style="padding:18px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
      <div style="font-size:15px;font-weight:700">Review Extracted Details</div>
      <button onclick="this.closest('[style*=fixed]').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--muted)">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">
      <div style="padding:16px 20px;border-right:1px solid var(--border)">
        <img src="${imgUrl}" style="width:100%;border-radius:8px;max-height:200px;object-fit:contain;background:#f5f5f5"/>
        ${eventName?`<div style="margin-top:10px;font-size:12px;color:var(--accent);font-weight:600">📍 Event: ${esc(eventName)}</div>`:''}
      </div>
      <div style="padding:16px 20px">
        <div style="font-size:11px;color:var(--muted);margin-bottom:10px">Review and correct if needed:</div>
        ${flds.map(f=>`<div style="margin-bottom:8px">
          <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-bottom:2px">${labels[f]}</div>
          <input type="${f==='email'?'email':'text'}" id="biz_${f}" value="${esc(fields[f]||'')}" class="field-input" style="width:100%;font-size:12px;box-sizing:border-box"/>
        </div>`).join('')}
      </div>
    </div>
    <div style="padding:14px 24px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:10px">
      <button onclick="this.closest('[style*=fixed]').remove()" class="btn btn-secondary">Discard</button>
      <button onclick="bizSaveCard(this,'${esc(eventName)}','${imgUrl}')" class="btn btn-primary">💾 Save & Add to CRM</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
}

async function bizSaveCard(btn, eventName, imgUrl) {
  const getVal = id => (document.getElementById(id)?.value||'').trim();
  const name = getVal('biz_full_name');
  if (!name) { toast('Please enter a name.','error'); return; }
  btn.disabled = true; btn.textContent = 'Saving...';
  try {
    const cardData = {
      event_name: eventName || null,
      scanned_by: SESSION.user_id,
      scanned_by_name: SESSION.full_name || SESSION.email,
      image_url: imgUrl,
      full_name: name,
      company: getVal('biz_company'),
      designation: getVal('biz_designation'),
      email: getVal('biz_email'),
      phone: getVal('biz_phone'),
      website: getVal('biz_website'),
      linkedin: getVal('biz_linkedin'),
      crm_status: 'pending'
    };
    // Save to Supabase
    const saved = await dbInsert('business_cards', cardData);
    // Push to Zoho CRM
    await bizSyncToCRM(saved?.id || Date.now(), cardData);
    btn.closest('[style*=fixed]').remove();
    toast('Card saved and synced to Zoho CRM. ✓');
    await loadBusinessCards();
  } catch(e) {
    toast('Error: '+e.message,'error');
    btn.disabled=false; btn.textContent='Save & Add to CRM';
  }
}

async function bizSyncToCRM(cardId, data) {
  try {
    const token = await getToken();
    const res = await fetch(ZOHO_CRM_EDGE, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+token, 'apikey':SUPA_KEY },
      body: JSON.stringify({
        action: 'create_lead',
        lead: {
          full_name: data.full_name,
          company: data.company,
          designation: data.designation,
          email: data.email,
          phone: data.phone,
          lead_source: data.event_name ? 'Event' : 'Business Card',
          description: (data.event_name ? 'Event: '+data.event_name+'\n' : '') + (data.website?'Website: '+data.website+'\n':'') + (data.linkedin?'LinkedIn: '+data.linkedin:'')
        }
      })
    });
    const d = await res.json();
    if (d.success && cardId) {
      await sbFetch('business_cards?id=eq.'+cardId, {method:'PATCH', body:JSON.stringify({crm_status:'synced', crm_lead_id:d.result?.data?.[0]?.details?.id||''})});
    }
  } catch(e) {
    console.warn('CRM sync failed:', e.message);
    if (cardId) await sbFetch('business_cards?id=eq.'+cardId, {method:'PATCH', body:JSON.stringify({crm_status:'failed'})}).catch(()=>{});
  }
}

// ── Excel import for bulk cards ───────────────────────────────────
async function bizProcessExcel(input) {
  const file = input.files[0]; if (!file) return;
  const eventName = bizGetEventName();
  document.getElementById('bizScanOverlay')?.remove();
  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const wb = XLSX.read(e.target.result, {type:'binary'});
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {defval:''});
      if (!rows.length) { toast('No data found','error'); return; }
      // Show preview
      bizShowExcelPreview(rows, eventName);
    } catch(err) { toast('Could not read file: '+err.message,'error'); }
  };
  reader.readAsBinaryString(file);
  input.value = '';
}

function bizShowExcelPreview(rows, eventName) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
  const getVal = (row, keys) => { for(const k of keys){const v=row[k]||row[k.toLowerCase()];if(v)return String(v).trim();} return ''; };
  const mapped = rows.map(r => ({
    full_name: getVal(r,['Full Name','Name','full_name','name']),
    company:   getVal(r,['Company','Organization','company']),
    designation: getVal(r,['Designation','Title','Role','designation']),
    email:     getVal(r,['Email','Email Address','email']),
    phone:     getVal(r,['Phone','Mobile','phone']),
    website:   getVal(r,['Website','website']),
    linkedin:  getVal(r,['LinkedIn','linkedin'])
  })).filter(r => r.full_name || r.email);

  overlay.innerHTML = `<div style="background:var(--surface);border-radius:14px;max-width:700px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,0.3)">
    <div style="padding:18px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:var(--surface)">
      <div>
        <div style="font-size:15px;font-weight:700">Excel Import Preview</div>
        <div style="font-size:12px;color:var(--muted)">${mapped.length} contact(s) found${eventName?' · Event: '+esc(eventName):''}</div>
      </div>
      <button onclick="this.closest('[style*=fixed]').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--muted)">✕</button>
    </div>
    <div style="padding:16px 24px">
      <div style="overflow-x:auto;margin-bottom:16px"><table>
        <thead><tr><th>#</th><th>Name</th><th>Company</th><th>Designation</th><th>Email</th><th>Phone</th></tr></thead>
        <tbody>${mapped.map((r,i)=>`<tr><td class="td-num">${i+1}</td><td style="font-weight:600">${esc(r.full_name||'-')}</td><td>${esc(r.company||'-')}</td><td>${esc(r.designation||'-')}</td><td>${esc(r.email||'-')}</td><td>${esc(r.phone||'-')}</td></tr>`).join('')}</tbody>
      </table></div>
    </div>
    <div style="padding:14px 24px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:10px;position:sticky;bottom:0;background:var(--surface)">
      <button onclick="this.closest('[style*=fixed]').remove()" class="btn btn-secondary">Cancel</button>
      <button onclick="bizImportAllExcel(this,'${esc(eventName)}')" class="btn btn-primary">Import ${mapped.length} to CRM</button>
    </div>
  </div>`;
  overlay._mappedRows = mapped;
  overlay.onclick = e => { if(e.target===overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}

async function bizImportAllExcel(btn, eventName) {
  const overlay = btn.closest('[style*=fixed]');
  const rows = overlay._mappedRows;
  if (!rows?.length) return;
  btn.disabled = true; btn.textContent = `Importing 0/${rows.length}...`;
  let done = 0, errors = 0;
  for (const r of rows) {
    try {
      const saved = await dbInsert('business_cards', { ...r, event_name:eventName||null, scanned_by:SESSION.user_id, scanned_by_name:SESSION.full_name||SESSION.email, crm_status:'pending' });
      await bizSyncToCRM(saved?.id||null, {...r, event_name:eventName});
      done++;
    } catch(_) { errors++; }
    btn.textContent = `Importing ${done+errors}/${rows.length}...`;
  }
  overlay.remove();
  toast(`${done} contact(s) imported to CRM${errors?' ('+errors+' errors)':''}.`);
  await loadBusinessCards();
}

function bizShowCard(id) {
  const card = bizCards.find(c=>c.id===id); if (!card) return;
  crmShowDetailPanel('Business Card', card);
}

function bizCardsExportExcel() {
  if (!bizCards.length) { toast('No cards to export','error'); return; }
  const rows = bizCards.map(c=>({'Event':c.event_name||'','Name':c.full_name||'','Company':c.company||'','Designation':c.designation||'','Email':c.email||'','Phone':c.phone||'','Website':c.website||'','LinkedIn':c.linkedin||'','CRM Status':c.crm_status||'','Date':formatDate(c.created_at)}));
  const ws=XLSX.utils.json_to_sheet(rows);
  const _wb={SheetNames:['Business Cards'],Sheets:{}}; _wb.Sheets['Business Cards']=ws;
  const _o=XLSX.write(_wb,{bookType:'xlsx',type:'binary'}),_b=new ArrayBuffer(_o.length),_v=new Uint8Array(_b);
  for(let i=0;i<_o.length;i++) _v[i]=_o.charCodeAt(i)&0xFF;
  const _a=document.createElement('a'); _a.href=URL.createObjectURL(new Blob([_b],{type:'application/octet-stream'})); _a.download='Business_Cards_'+new Date().toISOString().slice(0,10)+'.xlsx';
  document.body.appendChild(_a); _a.click(); document.body.removeChild(_a); setTimeout(()=>URL.revokeObjectURL(_a.href),1500);
  toast('Business cards exported.');
}
