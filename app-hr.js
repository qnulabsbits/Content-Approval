/* ═══════════════════════════════════════════════════
   HR MODULE — Job Postings + Applications
   HR posts directly to Webflow (no designer needed)
═══════════════════════════════════════════════════ */

const HR_WEBFLOW_COLLECTION = '6afec0ac4612e299b5a39967';
const HR_CAREERS_URL = 'https://staging-qnu.webflow.io/job-listings/';

let hrPosts = [], hrFilter = 'all', hrActive = null, hrPublishMode = 'draft';
let hrApplications = [], hrActiveJobId = null;
let hrEmailSettings = {};

// Department options matching Webflow
const HR_DEPARTMENTS = ['Engineering','Product','Marketing','Sales','Operations','HR','Finance','Legal','Design','Other'];
const HR_WORK_MODES  = ['Onsite','Remote','Hybrid'];
const HR_EMP_TYPES   = ['Full-time','Part-time','Contract','Internship'];

// ── Load ──────────────────────────────────────────────────────────
async function loadHR() {
  const c=$('hrTable');
  if(c) c.innerHTML='<div class="loading-row"><span class="spinner"></span> Loading...</div>';
  try {
    hrPosts = await sbFetch('hr_posts?order=created_at.desc&select=*') || [];
    renderHRStats();
    renderHRTable();
  } catch(e) {
    if(c) c.innerHTML=`<div class="empty-state"><div class="empty-title">Could not load</div><div class="empty-sub">${esc(e.message)}</div></div>`;
  }
}

function renderHRStats() {
  const s=(id,v)=>{const el=$(id);if(el)el.textContent=v;};
  s('hrs0', hrPosts.length);
  s('hrs1', hrPosts.filter(p=>p.posted_to_webflow&&p.webflow_status==='live').length);
  s('hrs2', hrPosts.filter(p=>p.posted_to_webflow&&p.webflow_status!=='live').length);
  s('hrs3', hrPosts.filter(p=>!p.posted_to_webflow).length);
}

function hrGetStatus(p) {
  if (p.posted_to_webflow && p.webflow_status==='live') return 'live';
  if (p.posted_to_webflow) return 'draft';
  if (p.webflow_item_id) return 'unpublished';
  return 'draft-local';
}

function hrStatusBadge(s) {
  const map = {
    'live':         { label:'● Live',        color:'#059669', bg:'#D1FAE5' },
    'draft':        { label:'◉ Draft',       color:'#D97706', bg:'#FEF3C7' },
    'unpublished':  { label:'↓ Unpublished', color:'#6B7280', bg:'#F3F4F6' },
    'draft-local':  { label:'✎ Not Posted',  color:'#3B82F6', bg:'#EFF6FF' },
  };
  const st = map[s] || map['draft-local'];
  return `<span style="background:${st.bg};color:${st.color};border:1px solid ${st.color}44;border-radius:12px;padding:3px 10px;font-size:11px;font-weight:700">${st.label}</span>`;
}

function renderHRTable() {
  const c=$('hrTable'); if(!c) return;
  const role = SESSION?.role;
  const isHR = role==='hr'||role==='admin';

  const filterMap = {
    live:   p=>p.posted_to_webflow&&p.webflow_status==='live',
    draft:  p=>p.posted_to_webflow&&p.webflow_status!=='live',
    local:  p=>!p.posted_to_webflow
  };
  const rows = hrFilter==='all' ? hrPosts : hrPosts.filter(filterMap[hrFilter]||Boolean);

  if (!rows.length) {
    c.innerHTML='<div class="empty-state"><div class="empty-icon">💼</div><div class="empty-title">No job postings yet</div><div class="empty-sub">Click "+ New Job Posting" to create one.</div></div>';
    return;
  }

  let h='<table><thead><tr><th>#</th><th>Job Title</th><th>Dept</th><th>Location</th><th>Work Mode</th><th>Type</th><th>Posted</th><th>Status</th><th>Applications</th><th>Actions</th></tr></thead><tbody>';
  rows.forEach((p,i)=>{
    const st=hrGetStatus(p);
    const appCount = hrApplications.filter(a=>a.webflow_item_id===p.webflow_item_id||a.job_title===p.title).length;
    h+=`<tr data-hrid="${p.id}" style="cursor:pointer">
      <td class="td-num">${i+1}</td>
      <td style="font-weight:700">${esc(p.title||'-')}</td>
      <td style="font-size:12px">${esc(p.department||'-')}</td>
      <td style="font-size:12px">${esc(p.location||'-')}</td>
      <td style="font-size:12px">${esc(p.work_mode||'-')}</td>
      <td style="font-size:12px">${esc(p.employment_type||'-')}</td>
      <td style="font-size:12px;color:var(--muted)">${formatDate(p.posted_date||p.created_at)}</td>
      <td>${hrStatusBadge(st)}</td>
      <td><button onclick="hrViewApplications('${p.id}',event)" class="btn btn-secondary btn-xs"${appCount?'':' style="color:var(--muted)"'}>
        ${appCount?`📋 ${appCount} application${appCount!==1?'s':''}` : '0 applications'}
      </button></td>
      <td><div style="display:flex;gap:6px">
        <button onclick="openHRModal('${p.id}',event)" class="btn btn-primary btn-xs">Edit & Post</button>
        <button onclick="hrDeletePost('${p.id}',event)" class="btn btn-secondary btn-xs" style="color:var(--accent)">Delete</button>
      </div></td>
    </tr>`;
  });
  h+='</tbody></table>';
  c.innerHTML=h;
}

// ── Applications ──────────────────────────────────────────────────
async function hrLoadApplications() {
  try {
    hrApplications = await sbFetch('job_applications?order=applied_at.desc&select=*') || [];
    renderHRTable();
  } catch(_) {}
}

async function hrViewApplications(jobId, e) {
  if(e) e.stopPropagation();
  const post = hrPosts.find(p=>String(p.id)===String(jobId));
  if (!post) return;
  hrActiveJobId = jobId;
  const apps = hrApplications.filter(a=>a.job_title===post.title||a.webflow_item_id===post.webflow_item_id);

  const overlay = document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
  overlay.innerHTML=`<div style="background:var(--surface);border-radius:14px;max-width:900px;width:100%;max-height:88vh;overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,0.25)">
    <div style="padding:18px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:var(--surface);z-index:1">
      <div>
        <div style="font-size:15px;font-weight:700">Applications — ${esc(post.title)}</div>
        <div style="font-size:12px;color:var(--muted)">${apps.length} application(s) received</div>
      </div>
      <div style="display:flex;gap:8px">
        <button onclick="hrExportApplications('${esc(post.title)}')" class="btn btn-secondary btn-sm">📊 Export Excel</button>
        <button onclick="this.closest('[style*=fixed]').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--muted)">✕</button>
      </div>
    </div>
    <div style="padding:16px 24px">
    ${!apps.length?'<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">No applications yet</div></div>':`
      <table>
        <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Location</th><th>Notice</th><th>Current CTC</th><th>Expected CTC</th><th>Applied</th><th>Resume</th></tr></thead>
        <tbody>${apps.map((a,i)=>`<tr>
          <td class="td-num">${i+1}</td>
          <td style="font-weight:600">${esc(a.full_name||'-')}</td>
          <td><a href="mailto:${esc(a.email||'')}" style="color:var(--accent)">${esc(a.email||'-')}</a></td>
          <td>${esc(a.phone||'-')}</td>
          <td>${esc(a.location||'-')}</td>
          <td>${esc(a.notice_period||'-')}</td>
          <td>${esc(a.current_ctc||'-')}</td>
          <td>${esc(a.expected_ctc||'-')}</td>
          <td style="font-size:11px;color:var(--muted)">${formatDate(a.applied_at)}</td>
          <td>${a.resume_url?`<a href="${esc(a.resume_url)}" target="_blank" class="btn btn-secondary btn-xs">View CV</a>`:'—'}</td>
        </tr>`).join('')}</tbody>
      </table>`}
    </div>
  </div>`;
  overlay.onclick=e=>{if(e.target===overlay)overlay.remove();};
  document.body.appendChild(overlay);
}

function hrExportApplications(jobTitle) {
  const apps = hrApplications.filter(a=>a.job_title===jobTitle);
  if(!apps.length){toast('No applications to export','error');return;}
  const rows=apps.map(a=>({'Job':a.job_title||'','Name':a.full_name||'','Email':a.email||'','Phone':a.phone||'','Location':a.location||'','Notice Period':a.notice_period||'','Current CTC':a.current_ctc||'','Expected CTC':a.expected_ctc||'','LinkedIn':a.linkedin||'','Cover Note':a.cover_note||'','Resume':a.resume_url||'','Applied':formatDate(a.applied_at)}));
  const ws=XLSX.utils.json_to_sheet(rows);
  const _wb={SheetNames:['Applications'],Sheets:{}}; _wb.Sheets['Applications']=ws;
  const _o=XLSX.write(_wb,{bookType:'xlsx',type:'binary'}),_b=new ArrayBuffer(_o.length),_v=new Uint8Array(_b);
  for(let i=0;i<_o.length;i++) _v[i]=_o.charCodeAt(i)&0xFF;
  const _a=document.createElement('a'); _a.href=URL.createObjectURL(new Blob([_b],{type:'application/octet-stream'})); _a.download=jobTitle.replace(/[^a-z0-9]/gi,'_').slice(0,40)+'_Applications.xlsx';
  document.body.appendChild(_a); _a.click(); document.body.removeChild(_a); setTimeout(()=>URL.revokeObjectURL(_a.href),1500);
  toast('Applications exported.');
}

// ── Open/Edit Modal ───────────────────────────────────────────────
async function openHRModal(id, e) {
  if(e) e.stopPropagation();
  const post = hrPosts.find(p=>String(p.id)===String(id));
  if (!post) return;
  hrActive = post;

  // Fill all fields
  const set=(id,v)=>{const el=$(id);if(el)el.value=v||'';};
  const setRich=(id,v)=>{const el=$(id);if(el)el.innerHTML=v||'';};
  const setChk=(id,v)=>{const el=$(id);if(el)el.checked=!!v;};

  set('hrfs_title',       post.title);
  set('hrfs_job_id',      post.job_id);
  set('hrfs_department',  post.department);
  set('hrfs_location',    post.location);
  set('hrfs_work_mode',   post.work_mode);
  set('hrfs_emp_type',    post.employment_type);
  set('hrfs_experience',  post.experience);
  set('hrfs_short_desc',  post.short_description);
  set('hrfs_reports_to',  post.reports_to);
  set('hrfs_team_size',   post.team_size);
  set('hrfs_works_with',  post.works_with);
  set('hrfs_major_req',   post.major_requirement);
  set('hrfs_closing',     post.closing_line);
  set('hrfs_posted_date', dateInput(post.posted_date));
  setChk('hrfs_new_badge', post.show_new_badge);
  setRich('hrfs_about',          post.about_the_role||'');
  setRich('hrfs_responsibilities', post.responsibilities||'');
  setRich('hrfs_qualifications',   post.qualifications||'');
  setRich('hrfs_benefits',         post.benefits_and_culture||'');

  // Post section state
  const st = hrGetStatus(post);
  const isLive = st==='live';
  const postBtn=$('hrfsPostBtn');
  if(postBtn){
    postBtn.disabled = isLive;
    postBtn.textContent = isLive?'Live on Webflow': (post.webflow_item_id?'Re-publish to Webflow':'Post to Webflow');
  }
  const unpBtn=$('hrfsUnpublishBtn');
  if(unpBtn) unpBtn.style.display = isLive?'inline-flex':'none';
  const result=$('hrfsPostResult');
  if(result){
    result.textContent = st==='live'?'✓ Live on website.':st==='draft'?'✓ Saved as draft.':st==='unpublished'?'Currently unpublished.':'';
    result.style.color = st==='live'?'var(--green)':st==='draft'?'var(--yellow)':'var(--muted)';
  }
  hrSelectPublish('draft');

  $('hrFS').classList.add('show');
  document.body.style.overflow='hidden';
}

function closeHRFS() {
  $('hrFS').classList.remove('show');
  document.body.style.overflow='';
  hrActive=null;
  loadHR();
  hrLoadApplications();
}

// ── Save edits ────────────────────────────────────────────────────
async function hrSaveEdits(quiet) {
  const get=(id)=>$(id)?.value?.trim()||'';
  const getRich=(id)=>$(id)?.innerHTML||'';
  const title = get('hrfs_title');
  if (!title) { toast('Job title is required.','error'); return false; }

  const data = {
    title,
    job_id:          get('hrfs_job_id'),
    department:      get('hrfs_department'),
    location:        get('hrfs_location'),
    work_mode:       get('hrfs_work_mode'),
    employment_type: get('hrfs_emp_type'),
    experience:      get('hrfs_experience'),
    short_description: get('hrfs_short_desc'),
    about_the_role:    getRich('hrfs_about'),
    responsibilities:  getRich('hrfs_responsibilities'),
    qualifications:    getRich('hrfs_qualifications'),
    benefits_and_culture: getRich('hrfs_benefits'),
    reports_to:      get('hrfs_reports_to'),
    team_size:       get('hrfs_team_size'),
    works_with:      get('hrfs_works_with'),
    major_requirement: get('hrfs_major_req'),
    closing_line:    get('hrfs_closing'),
    posted_date:     get('hrfs_posted_date')||new Date().toISOString(),
    show_new_badge:  !!$('hrfs_new_badge')?.checked,
    slug:            slugify(title),
  };

  try {
    if (!hrActive) {
      // New posting — create in Supabase
      const inserted = await dbInsert('hr_posts', {
        ...data,
        submitted_by: SESSION?.user_id,
        submitted_by_name: SESSION?.full_name||SESSION?.email,
        posted_to_webflow: false, hr_approved: false, designer_approved: false
      });
      await loadHR();
      // Set hrActive to the newly created post
      hrActive = hrPosts.find(p=>p.title===title&&!p.posted_to_webflow) || hrPosts[0];
      logActivity('created','New job posting: '+title);
      if(!quiet) toast('Job posting created.');
    } else {
      // Update existing
      await dbUpdate('hr_posts', hrActive.id, data);
      Object.assign(hrActive, data);
      if(!quiet) toast('Saved.');
    }
    return true;
  } catch(e) { toast('Save failed: '+e.message,'error'); return false; }
}

// ── Post to Webflow ───────────────────────────────────────────────
async function hrPost() {
  if (!hrActive) return;
  const ok = await hrSaveEdits(true);
  if (!ok) return;
  const btn=$('hrfsPostBtn'), result=$('hrfsPostResult');
  btn.disabled=true; btn.textContent='Posting...'; result.textContent='';

  try {
    // Build Webflow payload with all CMS fields
    const jobSlug = slugify(hrActive.title);
    const applyLink = HR_CAREERS_URL + jobSlug;
    const existingItemId = hrActive.webflow_item_id || null;

    const payload = {
      action: existingItemId ? 'update' : 'create',
      item_id: existingItemId,
      collection: HR_WEBFLOW_COLLECTION,
      publish_mode: hrPublishMode,
      row: { ...hrActive },
      fields: {
        'name':                hrActive.title,
        'job-id':              hrActive.job_id||'',
        'department':          hrActive.department||'',
        'location':            hrActive.location||'',
        'work-mode':           hrActive.work_mode||'',
        'employment-type':     hrActive.employment_type||'',
        'experience':          hrActive.experience||'',
        'short-description':   hrActive.short_description||'',
        'about-the-role':      hrActive.about_the_role||'',
        'responsibilities':    hrActive.responsibilities||'',
        'qualifications':      hrActive.qualifications||'',
        'benefits-and-culture': hrActive.benefits_and_culture||'',
        'apply-link':          applyLink,
        'posted-date':         hrActive.posted_date ? new Date(hrActive.posted_date).toISOString() : new Date().toISOString(),
        'show-new-badge':      !!hrActive.show_new_badge,
        'reports-to':          hrActive.reports_to||'',
        'team-size':           hrActive.team_size||'',
        'works-with':          hrActive.works_with||'',
        'major-requirement':   hrActive.major_requirement||'',
        'closing-line':        hrActive.closing_line||'',
      }
    };

    const r = await fetch(WEBFLOW_EDGE, {
      method:'POST',
      headers:{'Content-Type':'application/json',Authorization:'Bearer '+SUPA_KEY,apikey:SUPA_KEY},
      body:JSON.stringify(payload)
    });
    const d = await r.json();
    if(!d.success) throw new Error(d.error||'Webflow rejected the post.');

    const finalItemId = d.item_id || existingItemId;
    await dbUpdate('hr_posts', hrActive.id, {
      posted_to_webflow: true,
      webflow_item_id: finalItemId,
      webflow_status: d.status,
      apply_link: applyLink
    });
    hrActive.posted_to_webflow=true;
    hrActive.webflow_item_id=finalItemId;
    hrActive.webflow_status=d.status;
    hrActive.apply_link=applyLink;

    const live=d.status==='live';
    toast(live?'Job posted live on Webflow. ✓':'Job saved as draft in Webflow. ✓');
    result.textContent=live?'✓ Live on website.':'✓ Saved as draft.';
    result.style.color=live?'var(--green)':'var(--yellow)';
    btn.disabled=true;
    btn.textContent=live?'Live on Webflow':'Re-publish to Webflow';
    const unpBtn=$('hrfsUnpublishBtn');
    if(unpBtn&&live) unpBtn.style.display='inline-flex';
    logActivity('posted','HR job posted to Webflow: '+d.status,hrActive.id,hrActive.title);
    await loadHR();
  } catch(e) {
    toast('Webflow error: '+e.message,'error');
    btn.disabled=false; btn.textContent='Post to Webflow';
  }
}

async function hrUnpublish() {
  if(!hrActive) return;
  if(!(await cConfirm('Unpublish this job posting from Webflow?<br><span style="font-size:12px;color:var(--muted)">It will be removed from the careers page. You can re-post later.</span>','Unpublish','#DC2626'))) return;
  const btn=$('hrfsUnpublishBtn');
  if(btn){btn.disabled=true;btn.textContent='Unpublishing...';}
  try {
    if(hrActive.webflow_item_id) {
      await fetch(WEBFLOW_EDGE,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+SUPA_KEY,apikey:SUPA_KEY},
        body:JSON.stringify({action:'unpublish',item_id:hrActive.webflow_item_id,row:hrActive})}).catch(()=>{});
    }
    await dbUpdate('hr_posts',hrActive.id,{posted_to_webflow:false,webflow_status:null});
    hrActive.posted_to_webflow=false; hrActive.webflow_status=null;
    const postBtn=$('hrfsPostBtn');
    if(postBtn){postBtn.disabled=false;postBtn.textContent='Re-publish to Webflow';}
    if(btn){btn.style.display='none';btn.disabled=false;btn.textContent='Unpublish from Webflow';}
    const result=$('hrfsPostResult');
    if(result){result.textContent='Unpublished — click Re-publish to restore.';result.style.color='var(--muted)';}
    toast('Job unpublished from Webflow.');
    await loadHR();
  } catch(e){toast('Error: '+e.message,'error');if(btn){btn.disabled=false;btn.textContent='Unpublish from Webflow';}}
}

function hrSelectPublish(mode) {
  hrPublishMode=mode;
  $('hrfsOptDraft').className='publish-opt'+(mode==='draft'?' selected-draft':'');
  $('hrfsOptLive').className='publish-opt'+(mode==='live'?' selected-live':'');
  $('hrfsPublishMode').textContent=mode==='draft'?'Save as Draft':'Publish Live';
}

// ── Create new job posting — opens fullscreen directly ───────────
function openAddJobPosting() {
  // Set hrActive to null = new posting mode
  hrActive = null;
  // Clear all fields
  const clear = (id,val='') => { const el=$(id); if(el) el.value=val; };
  const clearRich = id => { const el=$(id); if(el) el.innerHTML=''; };
  clear('hrfs_title'); clear('hrfs_job_id'); clear('hrfs_location');
  clear('hrfs_experience'); clear('hrfs_short_desc'); clear('hrfs_reports_to');
  clear('hrfs_team_size'); clear('hrfs_works_with'); clear('hrfs_major_req');
  clear('hrfs_closing');
  // Set defaults
  clear('hrfs_department','Engineering');
  clear('hrfs_work_mode','Onsite');
  clear('hrfs_emp_type','Full-time');
  // Set today's date
  clear('hrfs_posted_date', new Date().toISOString().slice(0,10));
  const chk = $('hrfs_new_badge'); if(chk) chk.checked = true;
  clearRich('hrfs_about'); clearRich('hrfs_responsibilities');
  clearRich('hrfs_qualifications'); clearRich('hrfs_benefits');
  // Post section
  const postBtn=$('hrfsPostBtn');
  if(postBtn){postBtn.disabled=false;postBtn.textContent='Post to Webflow';}
  const unpBtn=$('hrfsUnpublishBtn');
  if(unpBtn) unpBtn.style.display='none';
  const result=$('hrfsPostResult');
  if(result){result.textContent='';result.style.color='';}
  hrSelectPublish('draft');
  // Open fullscreen
  $('hrFS').classList.add('show');
  document.body.style.overflow='hidden';
  setTimeout(()=>$('hrfs_title')?.focus(),100);
}

async function hrDeletePost(id, e) {
  if(e) e.stopPropagation();
  const post = hrPosts.find(p=>String(p.id)===String(id));
  if(!(await cConfirm(`Delete job posting <strong>${esc(post?.title||'this posting')}</strong>?<br><span style="font-size:12px;color:var(--muted)">This cannot be undone.</span>`,'Delete','#DC2626'))) return;
  try {
    if(post?.webflow_item_id) {
      await fetch(WEBFLOW_EDGE,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+SUPA_KEY,apikey:SUPA_KEY},
        body:JSON.stringify({action:'delete',item_id:post.webflow_item_id,row:post})}).catch(()=>{});
    }
    await sbFetch('hr_posts?id=eq.'+id,{method:'DELETE'});
    toast('Job posting deleted.');
    await loadHR();
  } catch(e){toast('Error: '+e.message,'error');}
}

function hrSetFilter(f,btn) {
  hrFilter=f;
  document.querySelectorAll('#hrFilterTabs .ftab').forEach(t=>t.classList.remove('active'));
  if(btn) btn.classList.add('active');
  renderHRTable();
}

// ── HR Email Settings ─────────────────────────────────────────────
let hrEmailSettingsData = {};

async function hrOpenEmailSettings() {
  $('hrEmailSettingsFS').classList.add('show');
  document.body.style.overflow='hidden';
  await hrLoadEmailSettings();
}

function hrCloseEmailSettings() {
  $('hrEmailSettingsFS').classList.remove('show');
  document.body.style.overflow='';
}

async function hrLoadEmailSettings() {
  try {
    const rows = await sbFetch('hr_email_settings?select=*') || [];
    hrEmailSettingsData = {};
    rows.forEach(r => hrEmailSettingsData[r.setting_key] = r);
    const get = (key, def='') => hrEmailSettingsData[key]?.setting_value || def;
    if($('hrEsRecipients')) $('hrEsRecipients').value = get('notification_recipients','["careers@qnulabs.com"]').replace(/[\[\]"]/g,'').replace(/,/g,', ');
    if($('hrEsApplicantSubject')) $('hrEsApplicantSubject').value = get('applicant_subject','Thank you for applying to {{job_title}} at QNu Labs');
    if($('hrEsApplicantBody')) $('hrEsApplicantBody').value = get('applicant_body','');
    if($('hrEsNotifSubject')) $('hrEsNotifSubject').value = get('notification_subject','New Application: {{job_title}} from {{full_name}}');
    if($('hrEsNotifBody')) $('hrEsNotifBody').value = get('notification_body','');
  } catch(e) { console.warn('HR email settings load failed:', e); }
}

async function hrSaveEmailSettings() {
  const recipients = ($('hrEsRecipients')?.value||'').split(',').map(s=>s.trim()).filter(Boolean);
  const updates = {
    notification_recipients: JSON.stringify(recipients),
    applicant_subject: $('hrEsApplicantSubject')?.value.trim()||'',
    applicant_body: $('hrEsApplicantBody')?.value.trim()||'',
    notification_subject: $('hrEsNotifSubject')?.value.trim()||'',
    notification_body: $('hrEsNotifBody')?.value.trim()||''
  };
  try {
    for(const [key, value] of Object.entries(updates)) {
      const existing = hrEmailSettingsData[key];
      if(existing?.id) {
        await sbFetch('hr_email_settings?id=eq.'+existing.id,{method:'PATCH',body:JSON.stringify({setting_value:value,updated_by:SESSION.full_name||SESSION.email,updated_at:new Date().toISOString()})});
      } else {
        await dbInsert('hr_email_settings',{setting_key:key,setting_value:value,updated_by:SESSION.full_name||SESSION.email});
      }
    }
    toast('HR email settings saved. ✓');
    await hrLoadEmailSettings();
  } catch(e) { toast('Save failed: '+e.message,'error'); }
}

function hrPreviewEmailTemplate(which) {
  const bodyEl = which==='applicant' ? $('hrEsApplicantBody') : $('hrEsNotifBody');
  let body = bodyEl?.value || '';
  if(!body){toast('Nothing to preview — paste HTML first.','error');return;}
  const vars = {job_title:'Architect, Secure Communication', full_name:'Rahul Sharma', email:'rahul@example.com', phone:'+91 99999 99999', location:'Bengaluru', notice_period:'30 days', current_ctc:'24', expected_ctc:'30'};
  body = body.replace(/\{\{(\w+)\}\}/g,(_,k)=>vars[k]||'{{'+k+'}}');
  const win=window.open('','_blank','width=680,height=700');
  if(win){win.document.open();win.document.write(body);win.document.close();}
}
