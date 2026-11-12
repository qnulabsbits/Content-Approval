/* ═══════════════════════════════════════════════════
   HR MODULE
═══════════════════════════════════════════════════ */
let hrPosts=[], hrFilter='all', hrActive=null, hrPublishMode='draft';

const HR_WEBFLOW_COLLECTION='';

async function loadHR() {
  try {
    hrPosts=await sbFetch('hr_posts?order=created_at.desc&select=*')||[];
    renderHRStats();
    renderHRTable();
  } catch(e){
    const c=$('hrTable');
    if(c) c.innerHTML=`<div class="empty-state"><div class="empty-title">Could not load</div><div class="empty-sub">${esc(e.message)}</div></div>`;
  }
}

function renderHRStats() {
  const s=(id,v)=>{const el=$(id);if(el)el.textContent=v;};
  s('hrs0',hrPosts.length);
  s('hrs1',hrPosts.filter(p=>!p.hr_approved).length);
  s('hrs2',hrPosts.filter(p=>p.hr_approved&&!p.designer_approved).length);
  s('hrs3',hrPosts.filter(p=>p.posted_to_webflow).length);
}

function hrGetStatus(post) {
  if(post.posted_to_webflow) return 'posted';
  if(post.designer_approved) return 'ready';
  if(post.hr_approved) return 'with-designer';
  if(post.title) return 'submitted';
  return 'draft';
}

function hrBadge(s) {
  const m={draft:'Draft',submitted:'Submitted','with-designer':'With Designer',ready:'Ready to Post',posted:'Posted'};
  return `<span class="badge ${s}"><span class="badge-dot"></span>${m[s]||'Draft'}</span>`;
}

function renderHRTable() {
  const c=$('hrTable'); if(!c) return;
  const role=SESSION?.role;
  const filterMap={
    pending:r=>!r.hr_approved,
    withdesigner:r=>r.hr_approved&&!r.designer_approved,
    posted:r=>r.posted_to_webflow
  };
  const rows=hrFilter==='all'?hrPosts:hrPosts.filter(filterMap[hrFilter]||Boolean);
  if(!rows.length){c.innerHTML='<div class="empty-state"><div class="empty-title">No job postings yet</div><div class="empty-sub">Add a new job posting to get started.</div></div>';return;}
  let h=`<table><thead><tr>${['#','Job Title','Department','Type','HR Approve','Designer','Webflow','Status'].map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>`;
  rows.forEach((post,i)=>{
    const s=hrGetStatus(post);
    const canHRApprove=role==='admin'||(role==='hr'||role==='writer');
    const canDesignApprove=role==='admin'||role==='designer';
    h+=`<tr data-hropen="${post.id}">
      <td class="td-num">${i+1}</td>
      <td style="font-weight:600">${esc(post.title)}</td>
      <td class="td-muted">${esc(post.department||'-')}</td>
      <td class="td-muted">${esc(post.job_type||'-')}</td>
      <td data-noopen="1">${canHRApprove?`<div class="toggle-wrap"><label class="toggle" id="hrtog_${post.id}"><input type="checkbox" data-hrtoggle="hr" data-id="${post.id}"${post.hr_approved?' checked':''}/><span class="toggle-slider"></span></label><span class="toggle-label">${post.hr_approved?'Approved':'Pending'}</span></div>`:'<span class="td-muted" style="font-size:11px">-</span>'}</td>
      <td data-noopen="1">${post.hr_approved&&canDesignApprove?`<div class="toggle-wrap"><label class="toggle designer" id="hrdtog_${post.id}"><input type="checkbox" data-hrtoggle="designer" data-id="${post.id}"${post.designer_approved?' checked':''}/><span class="toggle-slider"></span></label><span class="toggle-label">${post.designer_approved?'Approved':'Pending'}</span></div>`:'<span class="td-muted" style="font-size:11px">${post.hr_approved?"-":"Awaiting HR"}</span>'}</td>
      <td>${post.posted_to_webflow?`<span style="color:var(--green);font-size:12px;font-weight:600">${post.webflow_status==='live'?'Live':'Draft'}</span>`:'<span class="td-muted">Not posted</span>'}</td>
      <td>${hrBadge(s)}</td>
    </tr>`;
  });
  h+='</tbody></table>';
  c.innerHTML=h;
}

document.addEventListener('click', e=>{
  if(!$('pg-hr')?.classList.contains('active')) return;
  if(e.target.closest('[data-noopen]')) return;
  const tr=e.target.closest('tr[data-hropen]');
  if(tr) openHRModal(tr.getAttribute('data-hropen'));
});

/* Kanban card click */
document.addEventListener('click', function(e){
  if(!e.target.closest('#pg-projects')) return;
  if(e.target.closest('.modal-overlay')) return;
  if(e.target.closest('button')) return;
  const card=e.target.closest('.kanban-card[data-popen]');
  if(card) openProjectModal(card.getAttribute('data-popen'));
});
document.addEventListener('change', e=>{
  const inp=e.target.closest('input[data-hrtoggle]');
  if(inp) hrHandleToggle(inp);
});

async function hrHandleToggle(input) {
  const id=input.getAttribute('data-id'), type=input.getAttribute('data-hrtoggle');
  const post=hrPosts.find(p=>String(p.id)===id); if(!post) return;
  const field=type==='hr'?'hr_approved':'designer_approved';
  const lbl=$(type==='hr'?'hrtog_'+id:'hrdtog_'+id);
  if(lbl) lbl.classList.add('saving');
  try {
    await dbUpdate('hr_posts',id,{[field]:input.checked});
    toast(input.checked?'Approved.':'Approval removed.');
    logActivity(input.checked?'approved':'unapproved','HR '+type+' approval',post.id,post.title);
    await loadHR();
  } catch(e){input.checked=!input.checked;toast('Could not save: '+e.message,'error');}
  finally{if(lbl)lbl.classList.remove('saving');}
}

function openHRModal(id) {
  const post=hrPosts.find(p=>String(p.id)===String(id)); if(!post) return;
  hrActive=post;
  $('hrfsTitle').textContent=post.title;
  $('hrfsSub').textContent=(post.department||'-')+' · '+(post.job_type||'-')+' · '+formatDate(post.created_at);
  $('hrfsMeta1').innerHTML=hrBadge(hrGetStatus(post));
  $('hrfsDept').textContent=post.department||'-';
  $('hrfsType').textContent=post.job_type||'-';
  $('hrfsLocation').textContent=post.location||'-';
  $('hrfsSalary').textContent=post.salary_range||'-';
  $('hrfsDesc').innerHTML=post.description||'No description.';
  $('hrfsReq').innerHTML=post.requirements||'Not specified.';
  $('hrfsResp').innerHTML=post.responsibilities||'Not specified.';
  // Approval section based on role
  const role=SESSION?.role;
  const approveSection=$('hrfsApproveSection');
  if(role==='hr'||role==='writer'||role==='admin') {
    approveSection.style.display='block';
    $('hrfsApproveInner').className='approve-inner accent';
    $('hrfsApproveLabel').className='approve-label accent';
    $('hrfsApproveLabel').textContent='Approve for Designer';
    $('hrfsToggle').className='toggle';
    $('hrfsToggleInput').checked=!!post.hr_approved;
    $('hrfsToggleLabel').textContent=post.hr_approved?'Approved':'Pending';
  }
  if((role==='designer'||role==='admin')&&post.hr_approved) {
    approveSection.style.display='block';
    $('hrfsApproveInner').className='approve-inner blue';
    $('hrfsApproveLabel').className='approve-label blue';
    $('hrfsApproveLabel').textContent='Designer Approval';
    $('hrfsToggle').className='toggle designer';
    $('hrfsToggleInput').checked=!!post.designer_approved;
    $('hrfsToggleLabel').textContent=post.designer_approved?'Approved':'Pending';
    $('hrfsToggleInput').setAttribute('data-hrtype','designer');
  } else {
    $('hrfsToggleInput').setAttribute('data-hrtype','hr');
  }
  // Post section
  const isDesigner=role==='designer'||role==='admin';
  $('hrfsPostSection').style.display=(isDesigner&&post.hr_approved)?'block':'none';
  if(isDesigner&&post.hr_approved){
    $('hrfsPostBtn').disabled=!post.designer_approved||post.posted_to_webflow;
    $('hrfsPostResult').textContent='';
    if(post.posted_to_webflow){$('hrfsPostResult').textContent='Posted to Webflow as '+(post.webflow_status||'draft');$('hrfsPostResult').style.color='var(--green)';}
    hrSelectPublish('draft');
  }
  $('hrFS').classList.add('show');
  document.body.style.overflow='hidden';
}

async function hrFsToggle() {
  if(!hrActive) return;
  const type=$('hrfsToggleInput').getAttribute('data-hrtype')||'hr';
  const field=type==='designer'?'designer_approved':'hr_approved';
  const checked=$('hrfsToggleInput').checked;
  $('hrfsToggleLabel').textContent=checked?'Approved':'Pending';
  const wrap=$('hrfsToggle'); wrap.classList.add('saving');
  try {
    await dbUpdate('hr_posts',hrActive.id,{[field]:checked});
    hrActive[field]=checked;
    toast(checked?'Approved.':'Approval removed.');
    logActivity(checked?'approved':'unapproved','HR '+type+' approval',hrActive.id,hrActive.title);
    if(type==='designer') $('hrfsPostBtn').disabled=!checked;
    await loadHR();
  } catch(e){$('hrfsToggleInput').checked=!checked;$('hrfsToggleLabel').textContent=!checked?'Approved':'Pending';toast('Could not save: '+e.message,'error');}
  finally{wrap.classList.remove('saving');}
}

function hrSelectPublish(mode) {
  hrPublishMode=mode;
  $('hrOptDraft').className='publish-opt'+(mode==='draft'?' selected-draft':'');
  $('hrOptLive').className='publish-opt'+(mode==='live'?' selected-live':'');
  $('hrPublishMode').textContent=mode==='draft'?'Save as Draft':'Publish Live';
}

async function hrPost() {
  if(!hrActive?.designer_approved){toast('Please approve first.','error');return;}
  const btn=$('hrfsPostBtn'); btn.disabled=true; btn.textContent='Posting...';
  try {
    const fieldData={
      name:hrActive.title, slug:slugify(hrActive.title),
      'meta-title':hrActive.meta_title||hrActive.title,
      'meta-description':hrActive.meta_description||'',
      'job-description':hrActive.description||'',
      'requirements':hrActive.requirements||'',
      'responsibilities':hrActive.responsibilities||'',
      'department':hrActive.department||'',
      'job-type':hrActive.job_type||'',
      'location':hrActive.location||'',
      'salary-range':hrActive.salary_range||''
    };
    const r=await fetch(WEBFLOW_EDGE,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+SUPA_KEY,apikey:SUPA_KEY},
      body:JSON.stringify({extra_fields:fieldData,row:{...hrActive,content_type:'Job',extra_fields:JSON.stringify(fieldData)},publish_mode:hrPublishMode})
    });
    const d=await r.json();
    if(!d.success) throw new Error(d.error||'Webflow rejected the post.');
    await dbUpdate('hr_posts',hrActive.id,{posted_to_webflow:true,webflow_item_id:d.item_id,webflow_status:d.status});
    hrActive.posted_to_webflow=true; hrActive.webflow_status=d.status;
    const live=d.status==='live';
    toast(live?'Job posting published live.':'Job posting saved as draft.');
    $('hrfsPostResult').textContent=live?'Live on website.':'Saved as draft.';
    $('hrfsPostResult').style.color=live?'var(--green)':'var(--yellow)';
    logActivity('posted','HR post to Webflow: '+d.status,hrActive.id,hrActive.title);
    await loadHR();
  } catch(e){toast('Webflow error: '+e.message,'error');btn.disabled=false;btn.textContent='Post to Webflow';}
}

function closeHRFS() {
  $('hrFS').classList.remove('show'); document.body.style.overflow='';
  hrActive=null; loadHR();
}

function openAddJobPosting() {
  ['jpTitle','jpDept','jpLocation','jpSalary','jpDesc','jpReq','jpResp'].forEach(id=>{const el=$(id);if(el)el.value='';});
  $('jpJobType').value='full-time';
  $('jpSubmitter').value=SESSION?.full_name||'';
  showModal('addJobModal');
}

async function saveJobPosting() {
  const title=$('jpTitle').value.trim();
  if(!title){toast('Please enter a job title.','error');return;}
  const btn=$('jpSaveBtn'); btn.disabled=true; btn.textContent='Saving...';
  try {
    await dbInsert('hr_posts',{
      title, department:$('jpDept').value, location:$('jpLocation').value,
      job_type:$('jpJobType').value, salary_range:$('jpSalary').value,
      description:$('jpDesc').value, requirements:$('jpReq').value,
      responsibilities:$('jpResp').value,
      slug:slugify(title), submitted_by:SESSION?.user_id,
      submitted_by_name:SESSION?.full_name||SESSION?.email,
      hr_approved:false, designer_approved:false, posted_to_webflow:false, status:'draft'
    });
    toast('Job posting created.');
    logActivity('created','New job posting: '+title);
    closeModal('addJobModal');
    await loadHR();
  } catch(e){toast('Could not create: '+e.message,'error');}
  finally{btn.disabled=false;btn.textContent='Save Job Posting';}
}
