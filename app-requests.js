/* ══════════════════════════════════════════════════════
   COLLATERAL REQUESTS MODULE
══════════════════════════════════════════════════════ */
const RESEND_KEY='re_A9y5ieMa_FQSLzVQjCyowMQpRKSJ6aCrM';
let crActiveTab='all', crStatusFilter='', _crAll=[];

function switchReqTab(tab){
  crActiveTab=tab;
  ['all','assigned','mine'].forEach(t=>{
    const btn=document.querySelector('.req-tab[data-tab="'+t+'"]');
    const sec=$('req'+(t==='all'?'All':t==='assigned'?'Assigned':'Mine')+'Section');
    if(btn) btn.classList.toggle('active',t===tab);
    if(sec) sec.style.display=t===tab?'':'none';
  });
  if(tab==='all')      loadAllCR();
  if(tab==='assigned') loadAssignedCR();
  if(tab==='mine')     loadMineCR();
}

function loadRequestsPage(){
  const isPriv=SESSION?.role==='admin'||SESSION?.role==='cmo';
  // Admin/CMO: all 3 tabs. Others: Assigned + Mine only
  const allTab=document.querySelector('.req-tab[data-tab="all"]');
  if(allTab) allTab.style.display=isPriv?'':'none';
  const pa=$('reqPageActions');
  if(pa) pa.innerHTML='<a href="request-form.html" target="_blank" class="btn btn-primary btn-sm">Share Request Form ↗</a>';
  if(isPriv) switchReqTab('all'); else switchReqTab('assigned');
}

function filterCRByStatus(val){
  crStatusFilter=val;
  renderCRList(_crAll,$('reqAllList'),true);
}

async function loadAllCR(){
  const c=$('reqAllList');if(!c)return;
  c.innerHTML='<div class="loading-row"><span class="spinner"></span></div>';
  try{
    _crAll=await sbFetch('collateral_requests?order=created_at.desc&select=*')||[];
    renderCRList(_crAll,c,true);
  }catch(e){c.innerHTML='<div class="empty-state"><div class="empty-title">Could not load</div><div class="empty-sub">'+esc(e.message)+'</div></div>';}
}

async function loadAssignedCR(){
  const c=$('reqAssignedList');if(!c)return;
  c.innerHTML='<div class="loading-row"><span class="spinner"></span></div>';
  try{
    const reqs=await sbFetch('collateral_requests?assigned_to=eq.'+SESSION.user_id+'&order=created_at.desc&select=*')||[];
    renderCRList(reqs,c,false);
  }catch(e){c.innerHTML='<div class="empty-state"><div class="empty-title">Could not load</div></div>';}
}

async function loadMineCR(){
  const c=$('reqMineList');if(!c)return;
  c.innerHTML='<div class="loading-row"><span class="spinner"></span></div>';
  try{
    const reqs=await sbFetch('collateral_requests?submitted_by=eq.'+SESSION.user_id+'&order=created_at.desc&select=*')||[];
    renderCRList(reqs,c,false);
  }catch(e){c.innerHTML='<div class="empty-state"><div class="empty-title">Could not load</div></div>';}
}

function renderCRList(reqs,c,isPriv){
  let list=reqs;
  if(crStatusFilter) list=reqs.filter(r=>r.status===crStatusFilter);
  if(!list.length){c.innerHTML='<div class="empty-state"><div class="empty-title">No requests'+(crStatusFilter?' with this status':' yet')+'</div></div>';return;}
  c.innerHTML=list.map(r=>renderCRCard(r,isPriv)).join('');
  setTimeout(()=>populateCRAssignDropdowns(),80);
}

function renderCRCard(r,isPriv){
  const SL={pending:'Pending Review',accepted:'Accepted',assigned:'Assigned',inprogress:'In Progress',
            inreview:'In Review',delivered:'Delivered',onhold:'On Hold',rejected:'Rejected',
            done:'Delivered',p1_pending:'Awaiting P1 Approval'};
  const SC={pending:'var(--yellow)',accepted:'var(--blue)',assigned:'var(--blue)',inprogress:'var(--blue)',
            inreview:'var(--purple)',delivered:'var(--green)',onhold:'var(--yellow)',
            rejected:'var(--accent)',done:'var(--green)',p1_pending:'var(--accent)'};
  const col=SC[r.status]||'var(--muted)';
  const days=r.deadline?daysUntil(r.deadline):null;
  const overdue=days!==null&&days<0&&r.status!=='delivered'&&r.status!=='done';
  const isCMAdmin=SESSION?.role==='admin'||SESSION?.role==='cmo';
  const isAssigned=r.assigned_to===SESSION?.user_id;
  let kpiHTML='';
  try{const kpis=JSON.parse(r.kpis_selected||'[]');if(kpis.length)kpiHTML='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">'+kpis.map(k=>'<span style="background:#EFF6FF;color:var(--blue);border:1px solid #BFDBFE;padding:2px 7px;border-radius:12px;font-size:10px;font-weight:600">'+esc(k)+'</span>').join('')+'</div>';}catch(e){}
  let actions='';
  if(isCMAdmin&&r.status==='p1_pending'){
    actions='<div style="background:#FEF3C7;border:1px solid #FCD34D;border-radius:8px;padding:10px 12px;margin-top:10px">'
      +'<div style="font-size:11px;font-weight:700;color:#92400E;margin-bottom:6px">P1 APPROVAL REQUIRED</div>'
      +'<div style="font-size:12px;color:#78350F;margin-bottom:8px">Justification: '+esc(r.p1_justification||'(none provided)')+'</div>'
      +'<div style="display:flex;gap:6px;flex-wrap:wrap">'
      +'<button class="btn btn-green btn-sm" onclick="approveP1CR('+r.id+')">Approve P1</button>'
      +'<button class="btn btn-secondary btn-sm" style="color:var(--yellow)" onclick="downgradeCRP1('+r.id+')">Downgrade to P2</button>'
      +'<button class="btn btn-secondary btn-sm" style="color:var(--accent)" onclick="openRejectCR('+r.id+')">Reject</button>'
      +'</div></div>';
  } else if(isCMAdmin&&r.status==='pending'){
    actions='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">'
      +'<button class="btn btn-green btn-sm" onclick="acceptCR('+r.id+')">Accept</button>'
      +'<button class="btn btn-secondary btn-sm" style="color:var(--accent)" onclick="openRejectCR('+r.id+')">Reject</button>'
      +'</div>';
  } else if(isCMAdmin&&r.status==='accepted'){
    actions='<div style="margin-top:10px"><div style="font-size:11px;font-weight:600;color:var(--muted);margin-bottom:4px;text-transform:uppercase">Assign to Team Member</div>'
      +'<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">'
      +'<select class="field-select" style="font-size:12px;min-width:200px" id="crAssign_'+r.id+'" onchange="assignCR('+r.id+',this.value)"><option value="">Select person...</option></select>'
      +'<button class="btn btn-secondary btn-xs" style="color:var(--accent)" onclick="openRejectCR('+r.id+')">Reject</button>'
      +'</div></div>';
  } else if(isCMAdmin&&(r.status==='assigned'||r.status==='inprogress'||r.status==='inreview')){
    var reAssignSel='<select class="field-select" style="font-size:12px;min-width:200px" id="crAssign_'+r.id+'" onchange="assignCR('+r.id+',this.value)"><option value="">Select person to re-assign...</option></select>';
    var rejectBtn='<button class="btn btn-secondary btn-xs" style="color:var(--accent)" onclick="openRejectCR('+r.id+')">Reject</button>';
    actions='<div style="margin-top:10px">'
      +'<div style="font-size:11px;font-weight:600;color:var(--muted);margin-bottom:4px;text-transform:uppercase">Re-assign</div>'
      +'<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:8px">'+reAssignSel+'</div>'
      +'<div style="display:flex;gap:6px;flex-wrap:wrap">'
      +crStatusBtn(r.id,'inreview','Move to Review','btn-secondary')
      +crStatusBtn(r.id,'delivered','Mark Delivered','btn-green')
      +rejectBtn+'</div></div>';
  }
  
  if(isAssigned&&r.status==='assigned'){
    actions+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">'
      +'<button class="btn btn-primary btn-sm" onclick="openConvertToProject('+r.id+')">Convert to Project &#8594;</button>'
      +'<button class="btn btn-secondary btn-sm" style="color:var(--accent)" onclick="openRejectCR('+r.id+')">Reject</button>'
      +'</div>';
  }
  if(isAssigned&&(r.status==='inprogress'||r.status==='inreview')&&!isCMAdmin){
    actions+='<div style="margin-top:8px">'
      +(r.project_id?'<button class="btn btn-secondary btn-xs" onclick="showPage(&quot;projects&quot;)" style="margin-right:6px">View Project</button>':'')
      +'<button class="btn btn-secondary btn-xs" style="color:var(--accent)" onclick="openRejectCR('+r.id+')">Reject</button></div>';
  }
  if((r.status==='delivered'||r.status==='done')&&r.deliverable_link){
    actions+='<div style="margin-top:8px"><a href="'+esc(r.deliverable_link)+'" target="_blank" class="btn btn-secondary btn-sm">View Deliverable</a></div>';
  }
  if(isCMAdmin&&r.status==='rejected'&&r.rejection_reason){
    actions+='<div style="margin-top:8px"><button class="btn btn-secondary btn-xs" style="color:var(--accent)" onclick="openRejEmailFromCard('+r.id+')">Send Rejection Email</button></div>';
  }
  let triageHTML='';
  if(isCMAdmin||isAssigned){
    triageHTML='<div style="margin-top:12px;padding:12px 14px;background:var(--surface2);border-radius:8px;border:1px solid var(--border)">'
      +'<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Triage</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
      +(isCMAdmin?
        '<div><div style="font-size:10px;color:var(--muted);font-weight:600;margin-bottom:3px">STATUS</div>'
        +'<select class="field-select" style="font-size:12px" onchange="updateCRStatusDirect('+r.id+',this.value)">'
        +['pending','p1_pending','accepted','assigned','inprogress','inreview','delivered','onhold','rejected']
          .map(s=>'<option value="'+s+'"'+(r.status===s?' selected':'')+'>'+(SL[s]||s)+'</option>').join('')+'</select></div>'
        +'<div><div style="font-size:10px;color:var(--muted);font-weight:600;margin-bottom:3px">HUB</div>'
        +'<select class="field-select" style="font-size:12px" onchange="updateCRHub('+r.id+',this.value)">'
        +'<option value="">Assign hub...</option>'
        +['Digital & Brand','Marketing Excellence','Design & Creative','Content & Thought Leadership']
          .map(h=>'<option'+(r.assigned_hub===h?' selected':'')+'>'+h+'</option>').join('')+'</select></div>'
        +'<div><div style="font-size:10px;color:var(--muted);font-weight:600;margin-bottom:3px">EFFORT (days)</div>'
        +'<input class="field-input" type="number" style="font-size:12px" value="'+(r.effort_estimate||'')+'" placeholder="e.g. 3" onblur="updateCRField('+r.id+',\'effort_estimate\',this.value)" min="0.5" step="0.5"/></div>'
        +'<div><div style="font-size:10px;color:var(--muted);font-weight:600;margin-bottom:3px">COMMITTED DATE</div>'
        +'<input class="field-date" type="date" style="font-size:12px" value="'+(r.committed_date||'')+'" onblur="updateCRField('+r.id+',\'committed_date\',this.value)"/></div>'
        :'')
      +'<div style="grid-column:1/-1"><div style="font-size:10px;color:var(--muted);font-weight:600;margin-bottom:3px">DELIVERABLE LINK</div>'
      +'<input class="field-input" style="font-size:12px" value="'+(r.deliverable_link||'')+'" placeholder="Paste link to delivered work..." onblur="updateCRField('+r.id+',\'deliverable_link\',this.value)"/></div>'
      +'<div><div style="font-size:10px;color:var(--muted);font-weight:600;margin-bottom:3px">DELIVERED DATE</div>'
      +'<input class="field-date" type="date" style="font-size:12px" value="'+(r.delivered_date||'')+'" onblur="updateCRField('+r.id+',\'delivered_date\',this.value)"/></div>'
      +'</div></div>';
  }
  return '<div class="cr-card">'
    +'<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">'
    +'<div style="flex:1;min-width:0">'
    +'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">'
    +'<span class="cr-token">'+esc(r.token)+'</span>'
    +'<span class="cr-status-badge" style="background:'+col+'22;color:'+col+';border-color:'+col+'55">'+(SL[r.status]||r.status)+'</span>'
    +(r.priority?'<span class="cr-status-badge" style="background:'+(r.priority==='P1'?'#DC262222':r.priority==='P2'?'#D9770622':'#16A34A22')+';color:'+(r.priority==='P1'?'#DC2626':r.priority==='P2'?'#D97706':'#16A34A')+';border-color:transparent">'+esc(r.priority)+'</span>':'')
    +(r.is_rush?'<span class="cr-status-badge" style="background:#DC262222;color:#DC2626;border-color:#DC262255">Rush</span>':'')
    +(overdue?'<span class="cr-status-badge" style="background:#DC262222;color:#DC2626;border-color:#DC262255">Overdue</span>':'')
    +'</div>'
    +'<div style="font-weight:700;font-size:14px;margin-bottom:2px">'+esc(r.title||r.collaterals_needed||'(no title)')+'</div>'
    +'<div style="font-size:12px;color:var(--muted);margin-bottom:6px">'+esc(r.name)+'&nbsp;&middot;&nbsp;'+esc(r.email)+'&nbsp;&middot;&nbsp;'+esc(r.department||'')+(r.region?'&nbsp;&middot;&nbsp;'+esc(r.region):'')+'</div>'
    +(r.deliverable_type?'<div style="font-size:12px;margin-bottom:4px"><strong>Type:</strong> '+esc(r.deliverable_type)+'</div>':'')
    +(r.why_needed?'<div style="font-size:12px;margin-bottom:3px"><strong>Why:</strong> '+esc(r.why_needed)+'</div>':'')
    +(r.what_expected?'<div style="font-size:12px;margin-bottom:3px"><strong>What:</strong> '+esc(r.what_expected)+'</div>':'')
    +'<div style="font-size:12px;margin-top:4px;color:'+(overdue?'#DC2626':'var(--muted)')+';font-weight:'+(overdue?'700':'400')+'">Deadline: '+formatDate(r.deadline)+(days!==null&&r.status!=='delivered'&&r.status!=='done'?' — '+Math.abs(days)+'d '+(days<0?'overdue':'left'):'')+'</div>'
    +(r.assigned_to_name?'<div style="font-size:12px;color:var(--blue);margin-top:4px">Assigned: <strong>'+esc(r.assigned_to_name)+'</strong>'+(r.assigned_hub?' ('+esc(r.assigned_hub)+')':'')+'</div>':'')
    +(r.committed_date?'<div style="font-size:12px;color:var(--muted);margin-top:2px">Committed: '+formatDate(r.committed_date)+'</div>':'')
    +kpiHTML
    +(r.expected_outcome?'<div style="font-size:12px;color:var(--muted);margin-top:4px">Expected: '+esc(r.expected_outcome)+'</div>':'')
    +(r.rejection_reason?'<div style="font-size:11px;color:var(--accent);margin-top:6px;border-left:3px solid var(--accent);padding-left:8px">'+esc(r.rejection_reason)+'</div>':'')
    +(r.attachment_url?'<a href="'+esc(r.attachment_url)+'" target="_blank" style="font-size:12px;color:var(--accent);margin-top:6px;display:inline-block">Attachment</a>':'')
    +(r.drive_link?'&nbsp;<a href="'+esc(r.drive_link)+'" target="_blank" style="font-size:12px;color:var(--blue)">Drive</a>':'')
    +renderUpdateLog(r.update_log)
    +'</div></div>'+actions+triageHTML
    +'<div style="font-size:10px;color:var(--border2);margin-top:10px;padding-top:8px;border-top:1px solid var(--border)">Submitted '+formatDateTime(r.created_at)+'</div>'
    +'</div>';
}


async function acceptCR(id){
  try{
    const cr=_crAll.find(r=>String(r.id)===String(id));
    if(cr&&cr.priority==='P1'&&cr.status==='pending'){
      await sbFetch('collateral_requests?id=eq.'+id,{method:'PATCH',body:JSON.stringify({status:'p1_pending'})});
      toast('P1 request flagged for approval. CMO/Admin must approve before assigning.');
    } else {
      await sbFetch('collateral_requests?id=eq.'+id,{method:'PATCH',body:JSON.stringify({status:'accepted',accepted_at:new Date().toISOString()})});
      toast('Request accepted. Now assign to a team member.');
    }
    loadAllCR();
  }catch(e){toast('Error: '+e.message,'error');}
}

function openRejectCR(id){
  $('rejectCRId').value=id;
  $('rejectCRReason').value='';
  showModal('rejectCRModal');
}

async function submitCRRejection(){
  const id=$('rejectCRId').value;
  const reason=($('rejectCRReason')?.value||'').trim();
  if(!reason){toast('Please enter a rejection reason.','error');return;}
  const btn=$('rejectCRBtn');btn.disabled=true;btn.textContent='Saving...';
  try{
    const cr=_crAll.find(x=>String(x.id)===String(id))||{};
    const prevRejected=JSON.parse(cr.rejected_by||'[]');
    const newRejected=[...new Set([...prevRejected,SESSION.user_id])];
    await sbFetch('collateral_requests?id=eq.'+id,{method:'PATCH',body:JSON.stringify({
      status:'rejected',rejection_reason:reason,rejected_by:JSON.stringify(newRejected)
    })});
    // Notify other admin/CMO to also review
    const privs=await sbFetch('user_profiles?role=in.(admin,cmo)&select=id')||[];
    const others=privs.filter(u=>u.id!==SESSION.user_id);
    const allRejected=privs.every(u=>newRejected.includes(u.id));
    for(const o of others){
      await sendNotification(o.id,allRejected?'Rejection Email Needed':'Rejection Review Needed',
        SESSION.full_name+(allRejected?' rejected and needs email sent to requester':' rejected request '+(cr.token||id)+'. Your review is needed.'),
        'info','requests',parseInt(id));
    }
    closeModal('rejectCRModal');
    if(allRejected){
      // Both rejected — open email composer
      $('rejEmailCRId').value=id;
      $('rejEmailTo').value=cr.email||'';
      $('rejEmailSubject').value='Your Request '+(cr.token||id)+' — Update';
      $('rejEmailBody').value='Dear '+(cr.name||'Requester')+',\n\nThank you for submitting your request (Token: '+(cr.token||id)+').\n\nAfter review, we are unable to fulfil the following request at this time:\n'+(cr.collaterals_needed||'')+'.\n\nReason: '+reason+'\n\nPlease feel free to reach out if you have questions or would like to revise and resubmit.\n\nBest regards,\nQNu Labs Marketing Team';
      toast('Both have rejected — please send the rejection email.');
      showModal('rejEmailModal');
    } else {
      toast('Rejection recorded. The other Admin/CMO has been notified to review.');
    }
    loadAllCR();
  }catch(e){toast('Error: '+e.message,'error');}
  finally{btn.disabled=false;btn.textContent='Confirm Rejection';}
}

function openRejEmailFromCard(id){
  const cr=_crAll.find(x=>String(x.id)===String(id))||{};
  $('rejEmailCRId').value=id;
  $('rejEmailTo').value=cr.email||'';
  $('rejEmailSubject').value='Your Request '+(cr.token||id)+' — Update';
  $('rejEmailBody').value='Dear '+(cr.name||'Requester')+',\n\nThank you for your request (Token: '+(cr.token||id)+').\n\nAfter careful review, we are unable to fulfil this request.\n\nReason: '+(cr.rejection_reason||'')+'\n\nPlease feel free to reach out if you have questions.\n\nBest regards,\nQNu Labs Marketing Team';
  showModal('rejEmailModal');
}

async function populateCRAssignDropdowns(){
  const selects=document.querySelectorAll('[id^="crAssign_"]');
  if(!selects.length) return;
  const users=window._allUsers||await loadUsersForAssignee()||[];
  selects.forEach(sel=>{
    if(sel.options.length>1) return;
    sel.innerHTML='<option value="">Select person...</option>'+users.map(u=>'<option value="'+esc(u.id)+'__'+esc(u.full_name)+'">'+esc(u.full_name)+(u.department?' ('+esc(u.department)+')':'')+'</option>').join('');
  });
}

async function assignCR(id,val){
  if(!val) return;
  const[userId,userName]=val.split('__');
  try{
    await sbFetch('collateral_requests?id=eq.'+id,{method:'PATCH',body:JSON.stringify({assigned_to:userId,assigned_to_name:userName,status:'assigned'})});
    await sendNotification(userId,'Collateral Request Assigned to You','New request assigned. Go to Requests → Assigned to Me.','info','requests',id);
    toast('Assigned to '+userName+'.');
    loadAllCR();
  }catch(e){toast('Error: '+e.message,'error');}
}

/* ── Convert to Project ── */
let ctpTaskCount=0;
function onCtpKPIChange(v){const w=$('ctpKPIOtherWrap');if(w)w.style.display=(v==='__other__')?'':'none';}

async function openConvertToProject(crId){
  let cr=_crAll.find(r=>String(r.id)===String(crId));
  if(!cr){
    const res=await sbFetch('collateral_requests?id=eq.'+crId+'&select=*').catch(()=>null);
    cr=res&&res[0];
  }
  if(!cr){toast('Could not load request.','error');return;}
  $('ctpCRId').value=crId;
  $('ctpRequestInfo').textContent=cr.token+' · '+cr.name+' ('+cr.department+')';
  $('ctpTitle').value=(cr.event_name||cr.collaterals_needed||'').slice(0,80);
  $('ctpOwner').value=SESSION?.full_name||'';
  $('ctpDueDate').value=cr.deadline||'';
  $('ctpPriority').value='high';
  if($('ctpKPI')) $('ctpKPI').value='';
  const kw=$('ctpKPIOtherWrap');if(kw)kw.style.display='none';
  ctpTaskCount=0;
  $('ctpTasksList').innerHTML='';
  addCtpTask();
  // Populate owner datalist
  const users=window._allUsers||await loadUsersForAssignee()||[];
  const dl=$('ctpOwnerList');
  if(dl) dl.innerHTML=users.map(u=>'<option value="'+esc(u.full_name)+'">').join('');
  showModal('convertToProjectModal');
}

function addCtpTask(){
  ctpTaskCount++;
  const div=document.createElement('div');
  div.id='ctpTask_'+ctpTaskCount;
  div.style.cssText='display:grid;grid-template-columns:1fr 110px 130px 28px;gap:6px;margin-bottom:6px;align-items:center';
  div.innerHTML='<input class="field-input" placeholder="Task description..." style="font-size:12px"/>'
    +'<select class="field-select" style="font-size:12px"><option value="todo">To Do</option><option value="inprogress">In Progress</option></select>'
    +'<input type="date" class="field-date" style="font-size:12px" title="Task due date"/>'
    +'<button class="btn btn-secondary btn-xs" style="color:var(--accent);padding:4px 6px" onclick="this.parentElement.remove()">&#10005;</button>';
  $('ctpTasksList').appendChild(div);
}

async function saveConvertToProject(){
  const crId=$('ctpCRId').value;
  const title=($('ctpTitle')?.value||'').trim();
  const owner=($('ctpOwner')?.value||'').trim();
  const due=$('ctpDueDate')?.value||null;
  const prio=$('ctpPriority')?.value||'medium';
  const kpiVal=$('ctpKPI')?.value||'';
  const kpiTitle=kpiVal==='__other__'?($('ctpKPIOther')?.value.trim()||''):kpiVal;
  if(!title){toast('Please enter a project title.','error');return;}
  if(!due){toast('Please set a due date.','error');return;}
  const btn=$('ctpSaveBtn');btn.disabled=true;btn.textContent='Creating...';
  try{
    const cr=_crAll.find(r=>String(r.id)===String(crId))||{};
    const themeMap={'Corporate Deck':'Decks','Demand Gen Deck':'Decks','Sales Pitch Deck':'Decks','Battlecard':'Decks',
      'Blog':'Content','Whitepaper':'Content','Case Study':'Content','Newsletter':'Content','Press Release':'Content','Competitive Intelligence':'Content',
      'Collateral':'Design','Social Carousel':'Design','Video':'Design',
      'Website & Landing Page':'Digital','Email':'Digital','Outreach Campaign':'Digital',
      'Event Creative':'Events','Speaker Prep':'Events','Lead Update':'Events',
      'GTM':'Launch','Product Launch Deliverables':'Launch',
      'Analyst Briefing Material':'Analyst & PR','HR & Finance Communication':'Internal'};
    const projType=themeMap[cr.deliverable_type]||cr.deliverable_type||'campaign';
    const priMap={'P1':'high','P2':'medium','P3':'low'};
    const projRes=await dbInsert('projects',{
      title,type:projType,status:'inprogress',priority:priMap[cr.priority]||prio,
      owner_name:owner||SESSION?.full_name,owner_id:SESSION?.user_id,
      due_date:due,description:'From request '+(cr.token||crId)+(cr.why_needed?' | '+cr.why_needed:''),
      created_by:SESSION?.user_id,team_members:JSON.stringify([]),
      tags:JSON.stringify(cr.linked_account?[cr.linked_account]:[])
    });
    const projId=Array.isArray(projRes)?projRes[0].id:projRes.id;
    if(kpiTitle){
      await dbInsert('project_kpis',{project_id:projId,title:kpiTitle,kpi_type:'individual',target_value:0,current_value:0,unit:'',owner_name:owner||SESSION?.full_name}).catch(()=>{});
    }
    const taskRows=$('ctpTasksList').querySelectorAll('[id^="ctpTask_"]');
    for(const row of taskRows){
      const inputs=row.querySelectorAll('input,select');
      const tTitle=inputs[0]?.value?.trim();
      const tStatus=inputs[1]?.value||'todo';
      const tDue=inputs[2]?.value||null;
      if(!tTitle) continue;
      await dbInsert('project_tasks',{project_id:projId,title:tTitle,status:tStatus,priority:prio,due_date:tDue||null,assignee_name:owner||SESSION?.full_name,created_by:SESSION?.user_id}).catch(()=>{});
    }
    await sbFetch('collateral_requests?id=eq.'+crId,{method:'PATCH',body:JSON.stringify({status:'inprogress',project_id:projId})});
    // Notify admin/CMO
    const privs=await sbFetch('user_profiles?role=in.(admin,cmo)&select=id').catch(()=>[])||[];
    for(const p of privs){
      await sendNotification(p.id,'Project Created from Request',(owner||SESSION?.full_name)+' created "'+title+'" from '+(cr.token||crId)+' (due '+formatDate(due)+').','info','projects',projId);
    }
    toast('Project "'+title+'" created! ✅');
    logActivity('created','Project from request: '+title);
    closeModal('convertToProjectModal');
    await loadProjects();
    loadAllCR();
  }catch(e){toast('Error: '+e.message,'error');}
  finally{btn.disabled=false;btn.textContent='Create Project & Notify';}
}

async function sendRejectionEmail(){
  const id=$('rejEmailCRId').value;
  const to=($('rejEmailTo')?.value||'').trim();
  const subject=($('rejEmailSubject')?.value||'').trim();
  const body=($('rejEmailBody')?.value||'').trim();
  if(!to||!subject||!body){toast('Please fill all fields.','error');return;}
  const btn=$('rejEmailBtn');btn.disabled=true;btn.textContent='Sending...';
  try{
    const res=await fetch('https://api.resend.com/emails',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+RESEND_KEY},
      body:JSON.stringify({from:'One View <noreply@qnulabs.com>',to:[to],subject,text:body})
    });
    const d=await res.json();
    if(!res.ok) throw new Error(d.message||JSON.stringify(d));
    toast('Email sent to '+to+'.');
    closeModal('rejEmailModal');
    loadAllCR();
  }catch(e){toast('Could not send email: '+e.message,'error');}
  finally{btn.disabled=false;btn.textContent='Send Email';}
}


async function approveP1CR(id){
  try{await sbFetch('collateral_requests?id=eq.'+id,{method:'PATCH',body:JSON.stringify({status:'accepted',accepted_at:new Date().toISOString()})});toast('P1 approved. Now assign to a team member.');loadAllCR();}catch(e){toast('Error: '+e.message,'error');}
}
async function downgradeCRP1(id){
  try{await sbFetch('collateral_requests?id=eq.'+id,{method:'PATCH',body:JSON.stringify({priority:'P2',status:'pending'})});toast('Priority downgraded to P2.');loadAllCR();}catch(e){toast('Error: '+e.message,'error');}
}
async function updateCRStatusDirect(id,status){
  try{const p={status};if(status==='delivered')p.delivered_date=new Date().toISOString().slice(0,10);await sbFetch('collateral_requests?id=eq.'+id,{method:'PATCH',body:JSON.stringify(p)});toast('Status: '+status);loadAllCR();}catch(e){toast('Error: '+e.message,'error');}
}
async function updateCRHub(id,hub){
  if(!hub)return;try{await sbFetch('collateral_requests?id=eq.'+id,{method:'PATCH',body:JSON.stringify({assigned_hub:hub})});toast('Hub: '+hub);loadAllCR();}catch(e){toast('Error: '+e.message,'error');}
}
async function updateCRField(id,field,value){
  if(value===''||value===null||value===undefined)return;
  try{const p={};p[field]=field==='effort_estimate'?parseFloat(value):value;await sbFetch('collateral_requests?id=eq.'+id,{method:'PATCH',body:JSON.stringify(p)});}catch(e){console.error('CR field',e);}
}

function renderUpdateLog(logJson){
  if(!logJson) return '';
  let entries=[];
  try{entries=JSON.parse(logJson);}catch(_){return '';}
  if(!entries.length) return '';
  let h='<div style="margin-top:10px;border-top:1px dashed var(--border);padding-top:8px">'
    +'<div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Update History ('+entries.length+')</div>';
  entries.slice().reverse().forEach(function(e){
    const dt=new Date(e.updated_at);
    const dtStr=isNaN(dt)?e.updated_at:dt.toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
    h+='<div style="font-size:11px;background:#F9FAFB;border-radius:7px;padding:8px 10px;margin-bottom:5px;border:1px solid var(--border)">'
      +'<div style="font-weight:600;color:var(--text);margin-bottom:4px">'+esc(e.updated_by||'Requester')+' · '+esc(dtStr)+'</div>';
    const changes=e.changes||[];
    if(changes.length){
      h+=changes.map(function(c){
        return '<div style="font-size:11px;color:var(--muted);display:flex;gap:4px;align-items:flex-start;margin-bottom:2px">'
          +'<span style="font-weight:600;color:var(--text);min-width:100px;flex-shrink:0">'+esc(c.field)+':</span>'
          +'<span style="color:#DC2626;text-decoration:line-through;margin-right:4px">'+esc(c.from.slice(0,80))+'</span>'
          +'<span style="color:#16A34A">&#8594; '+esc(c.to.slice(0,80))+'</span></div>';
      }).join('');
    } else {
      h+='<div style="font-size:11px;color:var(--muted)">Additional information added.</div>';
    }
    h+='</div>';
  });
  h+='</div>';
  return h;
}

function crStatusBtn(id,status,label,cls){
  return '<button class="btn '+cls+' btn-sm" onclick="updateCRStatusDirect('+id+',\''+status+'\'">'+ label +'</button>';
}
function toggleExcelDrop(){var d=document.getElementById('excelDrop');if(d)d.style.display=d.style.display==='block'?'none':'block';}
document.addEventListener('click',function(e){if(!e.target.closest('#excelDropWrap')){var d=document.getElementById('excelDrop');if(d)d.style.display='none';}});
async function markProjectComplete(){
  if(!activeProject) return;
  const isDone=activeProject.status==='done';
  const target=isDone?'inprogress':'done';
  if(!confirm(isDone?'Reopen "'+activeProject.title+'" as In Progress?':'Mark "'+activeProject.title+'" as Completed?')) return;
  try{
    await dbUpdate('projects',activeProject.id,{status:target});
    activeProject.status=target;
    const p=projects.find(x=>String(x.id)===String(activeProject.id));
    if(p) p.status=target;
    const btn=$('pmCompleteBtn');
    if(btn){btn.textContent=target==='done'?'Reopen':'Mark Complete';btn.style.background=target==='done'?'var(--muted)':'var(--green)';}
    toast(target==='done'?'Project marked Completed ✅':'Project reopened.');
    renderProjectStats();
    if(projectView==='table') renderProjectTable(); else renderKanban();
  }catch(e){toast('Error: '+e.message,'error');}
}

async function saveProjectDetails() {
  if(!activeProject) return;
  const title=($('pmTitleEdit')?.value||'').trim();
  if(!title){toast('Title cannot be empty.','error');return;}
  const btn=document.querySelector('#projectModal .btn-primary');
  try{
    const typeVal=$('pmTypeEdit')?.value||'campaign';
    await dbUpdate('projects',activeProject.id,{
      title,
      status:$('pmStatusEdit')?.value||'todo',
      priority:$('pmPriorityEdit')?.value||'medium',
      owner_name:$('pmOwnerEdit')?.value||'',
      due_date:$('pmDueEdit')?.value||null,
      type:typeVal,
      budget:$('pmBudgetEdit')?.value||null,
      description:$('pmDesc')?.value||'',
      tags:$('pmSourceEdit')?.value?JSON.stringify([$('pmSourceEdit').value]):activeProject.tags||'[]'
    });
    activeProject.title=title;
    const p=projects.find(x=>String(x.id)===String(activeProject.id));
    if(p){p.title=title;p.status=$('pmStatusEdit')?.value||'todo';}
    $('pmTitle').textContent=title;
    toast('Project saved.');
    logActivity('edited','Updated project: '+title,activeProject.id,title);
    renderProjectStats();
    if(projectView==='table') renderProjectTable(); else renderKanban();
  }catch(e){toast('Could not save: '+e.message,'error');}
}

async function saveProjectDesc() {
  if(!activeProject) return;
  const desc=$('pmDesc')?.value||'';
  try{
    await dbUpdate('projects',activeProject.id,{description:desc});
    activeProject.description=desc;
    toast('Notes saved.');
  }catch(e){toast('Could not save: '+e.message,'error');}
}

async function deleteKPI(kpiId) {
  if(!confirm('Remove this KPI?')) return;
  try{
    await sbFetch('project_kpis?id=eq.'+kpiId,{method:'DELETE'});
    toast('KPI removed.');
    if(activeProject) await loadProjectKPIs(activeProject.id);
  }catch(e){toast('Could not remove: '+e.message,'error');}
}

function toggleHdrExcel(evt){
  if(evt) evt.stopPropagation();
  var m=document.getElementById('hdrExcelMenu');
  if(!m) return;
  if(m.style.display==='block'){ m.style.display='none'; return; }
  var btn=document.getElementById('hdrExcelBtn');
  if(btn){ var r=btn.getBoundingClientRect(); m.style.position='fixed'; m.style.top=(r.bottom+4)+'px'; m.style.left=Math.max(0,r.right-184)+'px'; m.style.zIndex='999999'; }
  m.style.display='block';
}
document.addEventListener('click',function(e){
  if(!e.target.closest('#hdrExcelWrap')){
    var m=document.getElementById('hdrExcelMenu');
    if(m) m.style.display='none';
  }
});
