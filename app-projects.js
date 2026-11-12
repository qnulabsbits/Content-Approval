let projects=[], projectFilter='all', projectFilterMode='all', projectSortMode='default', projectView='table', activeProject=null, activeTask=null;
let projectKPICache={}, projectTasksCache={}, pendingImportChanges=[];

const PROJECT_STATUSES=['todo','inprogress','review','done'];
const STATUS_LABELS={todo:'To Do',inprogress:'In Progress',review:'Review',done:'Done'};
const PRIORITY_COLORS={high:'var(--accent)',medium:'var(--yellow)',low:'var(--green)'};

let projectTaskCounts = {}; // projectId → {total, done}

async function loadProjects() {
  loadUsersForAssignee().then(function(u){ if(u&&u.length) populateOwnerFilterDropdown(u); });
  var ss=$('projSortSelect'); if(ss) ss.value=projectSortMode;
  // Sync view toggle buttons
  ['kanban','table'].forEach(v=>{
    const btn=$('projView_'+v);
    if(btn) btn.classList.toggle('active',v===projectView);
    if(btn) btn.style.background=(v===projectView)?'var(--surface)':'transparent';
  });
  try {
    projects = await sbFetch('projects?order=created_at.desc&select=*')||[];
    // Fetch task counts for all projects in one call
    try {
      const allTasks=await sbFetch('project_tasks?select=*')||[];
      projectTasksCache={};
      projectTaskCounts = {};
      allTasks.forEach(t=>{
        if(!projectTaskCounts[t.project_id]) projectTaskCounts[t.project_id]={total:0,done:0};
        projectTaskCounts[t.project_id].total++;
        if(t.status==='done') projectTaskCounts[t.project_id].done++;
        if(!projectTasksCache[t.project_id]) projectTasksCache[t.project_id]=[];
        projectTasksCache[t.project_id].push(t);
      });
      const allKPIs=await sbFetch('project_kpis?select=*')||[];
      projectKPICache={};
      allKPIs.forEach(k=>{if(!projectKPICache[k.project_id])projectKPICache[k.project_id]=[];projectKPICache[k.project_id].push(k);});
    } catch(_){}
    renderProjectStats();
    if(projectView==='kanban') renderKanban();
    else renderProjectTable();
  } catch(e){
    const c=$('projectContent');
    if(c) c.innerHTML=`<div class="empty-state"><div class="empty-title">Could not load projects</div><div class="empty-sub">${esc(e.message)}</div></div>`;
  }
}

function renderProjectStats() {
  // Render immediately from local array (fast), then refresh from DB
  _renderProjectStatCards(projects);
  // Then fetch fresh status to catch any DB changes
  sbFetch('projects?select=id,status,due_date').then(function(fresh){
    if(!fresh||!fresh.length) return;
    var changed=false;
    fresh.forEach(function(f){
      var p=projects.find(function(x){return x.id===f.id;});
      if(p&&p.status!==f.status){p.status=f.status;changed=true;}
      // Also add any project in DB not yet in local array
      if(!p){projects.push(f);changed=true;}
    });
    if(changed) _renderProjectStatCards(projects);
  }).catch(function(){});
}

function _renderProjectStatCards(list) {
  const total  = list.length;
  const inprog = list.filter(function(p){return p.status==='inprogress';}).length;
  const dueSoon= list.filter(function(p){var d=p.due_date;return d&&daysUntil(d)<=3&&daysUntil(d)>=0&&p.status!=='done';}).length;
  const done   = list.filter(function(p){return p.status==='done';}).length;
  function setCard(id,val,filter,label){
    var el=$(id); if(!el) return;
    el.textContent=val;
    var card=el.closest('.stat-card'); if(!card) return;
    card.style.cursor='pointer';
    card.title='Click to show: '+label;
    card.onclick=function(){
      document.querySelectorAll('.stat-card').forEach(function(c){c.classList.remove('stat-active');});
      card.classList.add('stat-active');
      applyProjectFilter(filter);
    };
  }
  setCard('ps0',total,   'all',              'All Projects');
  setCard('ps1',inprog,  'status:inprogress','In Progress');
  setCard('ps2',dueSoon, 'status:duesoon',   'Due Soon');
  setCard('ps3',done,    'status:done',       'Completed');
  var cardMap={'all':'ps0','status:inprogress':'ps1','status:duesoon':'ps2','status:done':'ps3'};
  var activeId=cardMap[projectFilterMode];
  if(activeId){var el=$(activeId);if(el&&el.closest('.stat-card'))el.closest('.stat-card').classList.add('stat-active');}
}

function taskCountHTML(pid) {
  const tc=projectTaskCounts[pid];
  if(!tc||!tc.total) return '<span style="font-size:10px;color:var(--border2)">No tasks</span>';
  const p=Math.round(tc.done/tc.total*100);
  const col=p===100?'var(--green)':p>=50?'var(--yellow)':'var(--muted)';
  return `<div style="display:flex;align-items:center;gap:6px">
    <div style="flex:1;height:4px;background:var(--border);border-radius:4px;overflow:hidden;min-width:40px">
      <div style="height:100%;width:${p}%;background:${col};border-radius:4px"></div>
    </div>
    <span style="font-size:10px;color:${col};font-weight:600;white-space:nowrap">${tc.done}/${tc.total}</span>
  </div>`;
}

function renderKanban() {
  const c=$('projectContent'); if(!c) return;
  let html='<div class="kanban-board">';
  PROJECT_STATUSES.forEach(status=>{
    const cols=projects.filter(p=>{
      if(projectFilter!=='all'&&p.type!==projectFilter) return false;
      if(projectFilterMode&&projectFilterMode.startsWith('status:')){
        const sk=projectFilterMode.slice(7);
        if(sk==='duesoon'){const d=p.due_date;return p.status===status&&d&&daysUntil(d)<=3&&daysUntil(d)>=0&&p.status!=='done';}
        return p.status===status&&p.status===sk;
      }
      return p.status===status;
    });
    html+=`<div class="kanban-col"><div class="kanban-col-header"><div class="kanban-col-title">${STATUS_LABELS[status]}</div><span class="kanban-col-count">${cols.length}</span></div><div class="kanban-cards">`;
    cols.forEach(p=>{
      const d=p.due_date, days=daysUntil(d);
      const overdue=days!==null&&days<0&&p.status!=='done';
      const soon=days!==null&&days>=0&&days<=3&&p.status!=='done';
      html+=`<div class="kanban-card" data-popen="${p.id}">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px">
          <div class="kanban-card-title">${esc(p.title)}</div>
          <span class="badge ${p.priority||'medium'}" style="flex-shrink:0">${esc(p.priority||'medium')}</span>
        </div>
        <div style="margin-bottom:8px">${taskCountHTML(p.id)}</div>
        <div class="kanban-card-meta">
          <div class="kanban-card-owner">${esc(p.owner_name||'-')}</div>
          <div class="kanban-card-date${overdue?' overdue':''}">${d?formatDate(d):''}</div>
        </div>
        ${soon&&!overdue?`<div style="font-size:10px;color:var(--yellow);font-weight:600;margin-top:4px">Due in ${days}d</div>`:''}
        ${overdue?`<div style="font-size:10px;color:var(--accent);font-weight:600;margin-top:4px">Overdue</div>`:''}
      </div>`;
    });
    if(!cols.length) html+=`<div style="padding:20px;text-align:center;font-size:12px;color:var(--border2)">No projects</div>`;
    html+='</div></div>';
  });
  html+='</div>';
  c.innerHTML=html;
}

function renderProjectTable() {
  const c=$('projectContent'); if(!c) return;
  const isAdmin=SESSION?.role==='admin';

  /* ── Action bar ── */
  let actionBar='<div id="projActionBar" style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap">';
  if(isAdmin){
    actionBar+='<button class="btn btn-secondary btn-sm" id="projDeleteToggle" onclick="toggleProjectDeleteMode()" style="color:#DC2626;border-color:#FECACA;font-size:12px">Delete</button>'
      +'<span id="projDeleteControls" style="display:none">'
      +'<input type="checkbox" id="selectAllProj" onchange="toggleSelectAll(this,\'projectChk\')" title="Select all"/>'
      +'<label for="selectAllProj" style="font-size:12px;color:var(--muted);margin-right:4px">Select all</label>'
      +'<button class="btn btn-sm" style="background:#DC2626;color:#fff;font-size:12px" onclick="bulkDeleteProjects()">Delete Selected</button>'
      +'<button class="btn btn-secondary btn-sm" style="color:#DC2626;border-color:#FECACA;font-size:12px" onclick="deleteAllProjects()">Delete All</button>'
      +'<button class="btn btn-secondary btn-sm" style="font-size:12px" onclick="toggleProjectDeleteMode()">Cancel</button>'
      +'</span>';
  }
  // Show "Clear filter" pill when a stat filter is active
  if(projectFilterMode&&projectFilterMode.startsWith('status:')){
    const statusLabels2={'status:inprogress':'In Progress','status:done':'Completed','status:duesoon':'Due Soon'};
    actionBar+='<button class="btn btn-secondary btn-sm" onclick="applyProjectFilter(&quot;all&quot;)" style="font-size:11px;display:flex;align-items:center;gap:4px">'
      +'Showing: <strong>'+(statusLabels2[projectFilterMode]||projectFilterMode)+'</strong> &nbsp;&#10005;</button>';
  }
  actionBar+='<div style="display:flex;align-items:center;gap:6px;margin-left:auto">'
  +'<label style="font-size:11px;color:var(--muted);font-weight:600">Sort:</label>'
  +'<select id="projSortSelect" onchange="applyProjectSort(this.value)" style="font-size:12px;padding:5px 8px;border:1px solid var(--border);border-radius:6px;background:var(--surface)">'
  +'<option value="default">Default</option>'
  +'<option value="duedate_asc">Due Date ↑</option>'
  +'<option value="duedate_desc">Due Date ↓</option>'
  +'<option value="priority_high">Priority (High first)</option>'
  +'<option value="priority_low">Priority (Low first)</option>'
  +'<option value="status">Status</option>'
  +'</select>'
  
  +'</div></div>';

  var projList=sortedProjects(projects);
  const filtered=projList.filter(function(p){
    if(!projectFilterMode||projectFilterMode==='all') return true;
    const tasks=projectTasksCache[p.id]||[];
    const allUsers=window._allUsers||[];
    if(projectFilterMode.startsWith('div:')){
      const divKey=projectFilterMode.slice(4).toLowerCase();
      const allOwners=[p.owner_name,...tasks.map(function(t){return t.assignee_name||'';})].filter(Boolean);
      // Also match if no allUsers loaded yet — fall through to show all
      if(!allUsers.length) return true;
      return allOwners.some(function(name){
        const u=allUsers.find(function(x){return (x.full_name||'').toLowerCase()===(name||'').toLowerCase();});
        if(!u) return false;
        const dept=(u.department||'').toLowerCase();
        return dept.indexOf(divKey)!==-1 ||
          (divKey.indexOf('excellence')!==-1 && (dept.indexOf('excellence')!==-1||dept.indexOf('digital')!==-1)) ||
          (divKey.indexOf('design')!==-1 && (dept.indexOf('design')!==-1||dept.indexOf('creative')!==-1)) ||
          (divKey.indexOf('content')!==-1 && (dept.indexOf('content')!==-1||dept.indexOf('thought')!==-1)) ||
          (divKey.indexOf('brand')!==-1 && (dept.indexOf('brand')!==-1||dept.indexOf('marcom')!==-1));
      });
    }
    if(projectFilterMode.startsWith('owner:')){
      const ownerName=projectFilterMode.slice(6).toLowerCase();
      return (p.owner_name||'').toLowerCase()===ownerName
        ||tasks.some(function(t){return(t.assignee_name||'').toLowerCase()===ownerName;});
    }
    if(projectFilterMode.startsWith('status:')){
      const statusKey=projectFilterMode.slice(7);
      if(statusKey==='duesoon'){
        const d=p.due_date;
        return d&&daysUntil(d)<=3&&daysUntil(d)>=0&&p.status!=='done';
      }
      return p.status===statusKey;
    }
    return true;
  });
  if(!filtered.length){ c.innerHTML=actionBar+'<div class="empty-state"><div class="empty-title">No projects yet</div></div>'; return; }

  /* ── Table ── */
  const COLS=['Theme / Project','Item','Status','Priority','Primary Owner','Assignee','KPI','Detailed Comments and Notes','Source'];
  let h=actionBar+'<div class="table-wrap" style="overflow-x:auto"><table style="min-width:1200px"><thead><tr>'
    +(isAdmin?'<th class="projChkHdr" style="width:32px;display:none"></th>':'')
    +COLS.map(function(x){return '<th style="white-space:nowrap;font-size:11px;padding:10px 12px">'+x+'</th>';}).join('')
    +'</tr></thead><tbody>';

  filtered.forEach(function(p){
    const pkpis=projectKPICache[p.id]||[];
    const tasks=projectTasksCache[p.id]||[];
    const tags=(function(){try{return JSON.parse(p.tags||'[]');}catch(_){return [];}})();
    const source=tags[0]||'—';
    const indKPIs=pkpis.filter(function(k){return k.kpi_type==='individual';}).map(function(k){return k.title;}).join('; ')||'—';
    const teamKPIs=pkpis.filter(function(k){return k.kpi_type==='team';}).map(function(k){return k.title;}).join('; ')||'—';
    const sharedKPIs=pkpis.filter(function(k){return k.kpi_type==='shared';}).map(function(k){return k.title;}).join('; ')||'—';

    if(!tasks.length){
      /* Project with no tasks — one row */
      h+='<tr data-popen="'+p.id+'" class="proj-row" onclick="openProjectModal('+p.id+')" style="cursor:pointer">'
        +(isAdmin?'<td class="projChkCell" data-noopen="1" onclick="event.stopPropagation()" style="display:none"><input type="checkbox" class="projectChk" value="'+p.id+'"/></td>':'')
        +'<td style="font-weight:700;min-width:170px;vertical-align:top;padding:10px 12px">'+esc(p.title)+'</td>'
        +'<td style="font-size:12px;color:var(--muted);padding:10px 12px">—</td>'
        +'<td style="padding:10px 12px"><span class="badge '+(p.status||'todo')+'">'+(STATUS_LABELS[p.status]||p.status)+'</span></td>'
        +'<td style="padding:10px 12px"><span class="badge '+(p.priority||'medium')+'">'+esc(p.priority||'medium')+'</span></td>'
        +'<td style="font-size:12px;font-weight:600;padding:10px 12px">'+esc(p.owner_name||'—')+'</td>'
        +'<td style="font-size:12px;color:var(--muted);padding:10px 12px">—</td>'
        +'<td style="font-size:11px;color:var(--muted);padding:10px 12px">—</td>'
        +'<td style="font-size:11px;color:var(--muted);max-width:220px;white-space:normal;padding:10px 12px">'+esc((p.description||'').slice(0,120)||'—')+'</td>'
        +'<td style="font-size:11px;color:var(--muted);padding:10px 12px">'+esc(source)+'</td>'
        +'</tr>';
    } else {
      /* One row per task — theme name only on first row */
      tasks.forEach(function(t,ti){
        const isFirst=ti===0;
        const rowspan=tasks.length;
        /* Gather this task's own source from description field */
        const taskDesc=t.description||'';
        const taskSource=taskDesc.match(/Source: (.+)/)?.[1]||source;
        const cleanDesc=taskDesc.replace(/\nSource: .+$/,'').replace(/\nIndividual KPI: .+$/,'').replace(/\nTeam KPI: .+$/,'').replace(/\nShared KPI: .+$/,'');
        /* Per-task KPIs stored in description lines */
        const tIndKPI=taskDesc.match(/Individual KPI: ([^\n]+)/)?.[1]||'';
        const tTeamKPI=taskDesc.match(/Team KPI: ([^\n]+)/)?.[1]||'';
        const tSharedKPI=taskDesc.match(/Shared KPI: ([^\n]+)/)?.[1]||'';
        const overdue=t.due_date&&daysUntil(t.due_date)<0&&t.status!=='done';
        h+='<tr data-taskopen="'+t.id+'" data-projid="'+p.id+'" class="task-row"'  +' onclick="openTaskEditModal('+t.id+','+p.id+')"'  +' style="cursor:pointer;border-top:'+(isFirst?'2px solid var(--border2)':'1px solid var(--border)')+'">';  
        if(isAdmin){
          h+='<td class="projChkCell" data-noopen="1" onclick="event.stopPropagation()" style="display:none">'
            +(isFirst?'<input type="checkbox" class="projectChk" value="'+p.id+'"/>':'')
            +'</td>';
        }
        /* Theme/Project — only on first row, spans all task rows visually */
        if(isFirst){
          h+='<td style="font-weight:700;font-size:14px;min-width:170px;vertical-align:top;padding:12px 12px 10px;background:var(--surface2);border-right:2px solid var(--border)" rowspan="'+rowspan+'">'
            +'<div style="line-height:1.4">'+esc(p.title)+'</div>'
            +'<button onclick="event.stopPropagation();openProjectModal('+p.id+')" '
            +'style="margin-top:10px;font-size:10px;background:#444;color:#fff;border:none;border-radius:4px;padding:3px 10px;cursor:pointer;font-family:Inter,sans-serif">'
            +'Edit Project</button>'
            +'</td>';
        }
                /* Task item — whole row is clickable via TR listener */
        h+='<td style="font-size:13px;font-weight:500;min-width:200px;padding:10px 12px">'
          +'<div style="font-weight:600">'+esc(t.title)+'</div>'
          +'<div style="font-size:11px;color:var(--muted);margin-top:3px">'
          +esc(t.assignee_name||'Unassigned')
          +(t.due_date?'  ·  <span style="'+(overdue?'color:#DC2626;font-weight:600':'')+'">'+formatDate(t.due_date)+'</span>':'')
          +'</div>'
          +'</td>'
        /* Status */
        +'<td style="padding:10px 12px"><span class="badge '+(t.status||'todo')+'">'+(STATUS_LABELS[t.status]||t.status)+'</span></td>'
        /* Priority */
        +'<td style="padding:10px 12px"><span class="badge '+(t.priority||'medium')+'">'+esc(t.priority||'medium')+'</span></td>'
        /* Primary Owner (project, rowspan on first row) + Assignee (task) */
        +(isFirst?'<td style="font-size:12px;font-weight:600;padding:10px 12px" rowspan="'+rowspan+'">'+esc(normaliseName(p.owner_name)||'—')+'</td>':'')
        +'<td style="font-size:12px;color:var(--muted);padding:10px 12px">'+esc(normaliseName(t.assignee_name)||'—')+'</td>'
        /* KPI — blank in table; add via Edit Task */
        +'<td style="font-size:11px;color:var(--muted);padding:10px 12px">—</td>'
        +''  // placeholder
        /* Notes */
        +'<td style="font-size:11px;color:var(--muted);max-width:220px;white-space:normal;padding:10px 12px">'+esc(cleanDesc.slice(0,150)||(isFirst?(p.description||'').slice(0,150):'')||'—')+'</td>'
        /* Source */
        +'<td style="font-size:11px;color:var(--muted);padding:10px 12px">'+esc(taskSource)+'</td>'
        +'</tr>';
      });
    }
  });
  h+='</tbody></table></div>';
  c.innerHTML=h;
}

/* ── Task edit MODAL ── */
async function openTaskEditModal(taskId, projId) {
  const taskIdStr=String(taskId), projIdStr=String(projId);
  const p=projects.find(x=>String(x.id)===projIdStr);
  if(!p){toast('Project not found — try refreshing.','error');return;}
  let tasks=projectTasksCache[p.id]||[];
  if(!tasks.length){
    try{
      tasks=await sbFetch('project_tasks?project_id=eq.'+p.id+'&order=sort_order.asc&select=*')||[];
      projectTasksCache[p.id]=tasks;
    }catch(_){}
  }
  const t=tasks.find(x=>String(x.id)===taskIdStr);
  if(!t){toast('Task not found — try refreshing.','error');return;}
  activeProject=p;

  const m=$('taskEditModal');
  if(!m) return;
  m.setAttribute('data-panelfor',taskId);
  m.setAttribute('data-projid',projId);

  // Fill fields
  $('tep_title').value=t.title||'';
  $('tep_status').value=t.status||'todo';
  $('tep_priority').value=t.priority||'medium';
  $('tep_assignee').value=normaliseName(t.assignee_name)||'';
  $('tep_due').value=dateInput(t.due_date||'');
  $('tep_notes').value=t.description||'';
  $('tep_project_name').textContent=p.title;

  // Source field
  const srcMatch=(t.description||'').match(/Source: ([^\n]+)/);
  if($('tep_source')) $('tep_source').value=srcMatch?srcMatch[1]:'';
  if($('tep_kpi')) $('tep_kpi').value='';
  if($('tepKPIOtherWrap')) $('tepKPIOtherWrap').style.display='none';
  if($('tep_kpi_other')) $('tep_kpi_other').value='';

  // Populate assignee datalist — Marketing first
  loadUsersForAssignee().then(function(users){
    const dl=$('tepAssigneeList');
    if(!dl) return;
    const mkt=users.filter(u=>(u.department||'').toLowerCase().indexOf('marketing')!==-1);
    const rest=users.filter(u=>(u.department||'').toLowerCase()!=='marketing')
      .sort((a,b)=>(a.department||'').localeCompare(b.department||'')||(a.full_name||'').localeCompare(b.full_name||''));
    dl.innerHTML=[...mkt,...rest].map(function(u){
      const displayName=normaliseName(u.full_name)||u.full_name;
      return '<option value="'+esc(displayName)+'" label="'+esc(displayName+(u.department?' ('+u.department+')':''))+'"></option>';
    }).join('');
  });

  // Load subtasks
  loadSubtasks(taskId, projId);

  showModal('taskEditModal');
}

// Keep old name as alias for any remaining calls
function openTaskEditPanel(taskId,projId){openTaskEditModal(taskId,projId);}

async function saveTaskEdit(taskId, projId) {
  const title=$('tep_title')?.value.trim();
  if(!title){toast('Title cannot be empty.','error');return;}
  const newAssignee=($('tep_assignee')?.value||'').trim();
  const prevTask=(projectTasksCache[projId]||[]).find(x=>String(x.id)===String(taskId));
  const prevAssignee=prevTask?.assignee_name||'';
  const rawNotes=($('tep_notes')?.value||'').replace(/\nSource: [^\n]*/g,'').replace(/^Source: [^\n]*\n?/,'').trim();
  const sourceVal=($('tep_source')?.value||'').trim();
  const descWithSource=rawNotes+(sourceVal?'\nSource: '+sourceVal:'');
  const data={
    title,
    status:$('tep_status')?.value||'todo',
    priority:$('tep_priority')?.value||'medium',
    assignee_name:newAssignee,
    due_date:$('tep_due')?.value||null,
    description:descWithSource
  };
  const btn=$('tepSaveBtn');
  if(btn){btn.disabled=true;btn.textContent='Saving...';}
  try{
    await dbUpdate('project_tasks',taskId,data);
    if(newAssignee&&newAssignee!==prevAssignee){
      const users=window._allUsers||[];
      const assignedUser=users.find(u=>
        u.full_name===newAssignee||(u.full_name||'').toLowerCase()===newAssignee.toLowerCase()
      );
      if(assignedUser){
        await assignTask(assignedUser.id,assignedUser.full_name,title,data.description||'','projects',parseInt(projId));
      }
      toast('Task saved and assigned to '+newAssignee+'.');
    } else {
      toast('Task saved.');
    }
    // Save KPI if chosen
    const kpiVal=$('tep_kpi')?.value;
    if(kpiVal&&kpiVal!==''){
      const kpiTitle=(kpiVal==='__other__'?($('tep_kpi_other')?.value.trim()||''):kpiVal);
      if(kpiTitle){
        const dup=await sbFetch('project_kpis?project_id=eq.'+projId+'&title=eq.'+encodeURIComponent(kpiTitle)+'&select=id').catch(()=>null);
        if(!dup||!dup.length) await dbInsert('project_kpis',{project_id:parseInt(projId),title:kpiTitle,kpi_type:'individual',target_value:0,current_value:0,unit:'',owner_name:newAssignee||''}).catch(()=>{});
      }
    }
    // Update project source tag if source changed
    if(sourceVal){
      const cp=projects.find(x=>String(x.id)===String(projId));
      const ct=(()=>{try{return JSON.parse(cp?.tags||'[]');}catch(_){return [];}})();
      if(ct[0]!==sourceVal) await dbUpdate('projects',parseInt(projId),{tags:JSON.stringify([sourceVal])}).catch(()=>{});
    }
    logActivity('edited','Updated task: '+title,parseInt(projId));
    await checkProjectCompletion(projId);
    closeModal('taskEditModal');
    await loadProjects();
    if(projectView==='table') renderProjectTable();
    else renderKanban();
  }catch(e){
    toast('Error: '+e.message,'error');
  } finally {
    if(btn){btn.disabled=false;btn.textContent='Save Task';}
  }
}

async function deleteTaskFromModal(){
  const m=$('taskEditModal');
  if(!m) return;
  const taskId=m.getAttribute('data-panelfor');
  const projId=m.getAttribute('data-projid');
  if(!taskId){toast('No task selected','error');return;}
  if(!confirm('Delete this task? This cannot be undone.')) return;
  try{
    await sbFetch('project_tasks?id=eq.'+taskId,{method:'DELETE'});
    toast('Task deleted.');
    closeModal('taskEditModal');
    await loadProjects();
    if(projectView==='table') renderProjectTable();
  }catch(e){toast('Error: '+e.message,'error');}
}



async function deleteProjectFromModal(){
  if(!activeProject) return;
  if(!confirm('Delete project "'+activeProject.title+'" and ALL its tasks and KPIs? This cannot be undone.')) return;
  try{
    await sbFetch('project_tasks?project_id=eq.'+activeProject.id,{method:'DELETE'}).catch(function(){});
    await sbFetch('project_kpis?project_id=eq.'+activeProject.id,{method:'DELETE'}).catch(function(){});
    await sbFetch('projects?id=eq.'+activeProject.id,{method:'DELETE'});
    toast('Project deleted.'); closeModal('projectModal'); activeProject=null;
    logActivity('deleted','Deleted project: '+activeProject?.title||'');
    await loadProjects();
  }catch(e){toast('Error: '+e.message,'error');}
}

function toggleProjectDeleteMode(){
  const controls=document.getElementById('projDeleteControls');
  const toggle=document.getElementById('projDeleteToggle');
  const cells=document.querySelectorAll('.projChkCell');
  const hdrs=document.querySelectorAll('.projChkHdr');
  const isOn=controls&&controls.style.display!==''&&controls.style.display!=='none';
  if(isOn){
    if(controls){controls.style.display='none';}
    cells.forEach(function(c){c.style.display='none';});
    hdrs.forEach(function(h){h.style.display='none';});
    document.querySelectorAll('.projectChk').forEach(function(c){c.checked=false;});
    const sa=document.getElementById('selectAllProj'); if(sa) sa.checked=false;
  } else {
    if(controls){controls.style.display='inline-flex';controls.style.alignItems='center';controls.style.gap='6px';}
    cells.forEach(function(c){c.style.display='table-cell';});
    hdrs.forEach(function(h){h.style.display='table-cell';});
  }
}

async function deleteAllProjects(){
  if(!projects.length){toast('No projects to delete.','error');return;}
  if(!confirm('Delete ALL '+projects.length+' projects with all tasks and KPIs? This cannot be undone.')) return;
  try{
    for(const p of projects){
      await sbFetch('project_tasks?project_id=eq.'+p.id,{method:'DELETE'}).catch(function(){});
      await sbFetch('project_kpis?project_id=eq.'+p.id,{method:'DELETE'}).catch(function(){});
      await sbFetch('projects?id=eq.'+p.id,{method:'DELETE'}).catch(function(){});
    }
    toast('All projects deleted.'); logActivity('bulk_delete','Admin deleted all projects'); await loadProjects();
  }catch(e){toast('Error: '+e.message,'error');}
}


async function openProjectModal(id) {
  const p=projects.find(x=>String(x.id)===String(id)); if(!p) return;
  activeProject=p;
  $('pmTitle').textContent=p.title;
  const cBtn=$('pmCompleteBtn');if(cBtn){cBtn.textContent=p.status==='done'?'Reopen':'Mark Complete';cBtn.style.background=p.status==='done'?'var(--muted)':'var(--green)';}
  const descEl=$('pmDesc'); if(descEl) descEl.value=p.description||'';
  const _tags=(()=>{try{return JSON.parse(p.tags||'[]');}catch(_){return [];}})();
  if($('pmTitleEdit')) $('pmTitleEdit').value=p.title||'';
  if($('pmStatusEdit')) $('pmStatusEdit').value=p.status||'todo';
  if($('pmPriorityEdit')) $('pmPriorityEdit').value=p.priority||'medium';
  if($('pmOwnerEdit')) $('pmOwnerEdit').value=p.owner_name||'';
  if($('pmDueEdit')) $('pmDueEdit').value=dateInput(p.due_date||'');
  if($('pmTypeEdit')) $('pmTypeEdit').value=p.type||'campaign';
  if($('pmBudgetEdit')) $('pmBudgetEdit').value=p.budget||'';
  if($('pmSourceEdit')) $('pmSourceEdit').value=_tags.join(', ');
  await loadProjectTasks(p.id);
  await loadProjectKPIs(p.id);
  await populateAssigneeDropdown();
  showModal('projectModal');
}

async function loadProjectTasks(projectId) {
  const tasks=await sbFetch('project_tasks?project_id=eq.'+projectId+'&order=sort_order.asc&select=*')||[];
  const c=$('pmTasks');
  if(!tasks.length){c.innerHTML='<div style="font-size:12px;color:var(--muted);padding:8px 0">No tasks yet.</div>';return;}
  let h='';
  tasks.forEach(function(t){
    const days=daysUntil(t.due_date), overdue=days!==null&&days<0&&t.status!=='done';
    h+='<div style="padding:8px 0;border-bottom:1px solid var(--border)">'
      +'<div style="display:flex;align-items:flex-start;gap:10px">'
      +'<input type="checkbox" '+(t.status==='done'?'checked':'')+' data-taskid="'+t.id+'" onchange="toggleTask(this)" style="flex-shrink:0;margin-top:3px"/>'
      +'<div style="flex:1;min-width:0">'
      +'<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;cursor:pointer" onclick="openTaskEditModal('+t.id+','+projectId+')">'
      +'<div style="font-size:13px;font-weight:600;'+(t.status==='done'?'text-decoration:line-through;color:var(--muted)':'')+'">'+esc(t.title)+'</div>'
      +'<span class="badge '+(t.priority||'medium')+'" style="font-size:9px">'+esc(t.priority||'medium')+'</span>'
      +'<span class="badge '+(t.status||'todo')+'" style="font-size:9px">'+(STATUS_LABELS[t.status]||t.status)+'</span>'
      +'<span style="font-size:10px;color:var(--muted)">✏ Edit</span>'
      +'</div>'
      +'<div style="font-size:11px;color:var(--muted);margin-top:2px">'+esc(normaliseName(t.assignee_name)||'Unassigned')+(t.due_date?' · <span style="'+(overdue?'color:var(--accent);font-weight:600':'')+'">'+ formatDate(t.due_date)+'</span>':'')+'</div>'
      +(t.description?'<div style="font-size:11px;color:var(--muted);margin-top:4px;line-height:1.5;background:var(--surface2);border-radius:6px;padding:5px 8px;white-space:pre-wrap">'+esc(t.description)+'</div>':'')
      +'<button style="margin-top:6px;background:none;border:1px solid #FECACA;color:#DC2626;border-radius:5px;padding:2px 8px;font-size:10px;cursor:pointer;font-family:Inter,sans-serif" onclick="deleteTask('+t.id+',event)">Delete task</button>'
      +'</div></div></div>';
  });
  c.innerHTML=h;
}

async function loadProjectKPIs(projectId) {
  const kpis=await sbFetch('project_kpis?project_id=eq.'+projectId+'&order=created_at.asc&select=*')||[];
  const c=$('pmKPIs');
  if(!kpis.length){c.innerHTML='<div style="font-size:12px;color:var(--muted);padding:8px 0">No KPIs yet.</div>';return;}
  let h='<div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">';
  kpis.forEach((k,i)=>{
    h+=`<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--surface2);border-radius:7px;border:1px solid var(--border)">
      <div>
        <div style="font-size:12px;font-weight:600;color:var(--text)">${esc(k.title)}</div>
        ${k.owner_name?`<div style="font-size:11px;color:var(--muted);margin-top:2px">${esc(k.owner_name)}</div>`:''}
      </div>
      <button onclick="deleteKPI(${k.id})" style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:16px;padding:0 4px" title="Remove KPI">×</button>
    </div>`;
  });
  h+='</div>';
  c.innerHTML=h;
}

async function toggleTask(input) {
  const id=input.getAttribute('data-taskid'), done=input.checked;
  try{
    await dbUpdate('project_tasks',id,{status:done?'done':'todo',completed_at:done?new Date().toISOString():null});
    if(activeProject){
      await loadProjectTasks(activeProject.id);
      await checkProjectCompletion(activeProject.id);
    }
    await loadProjects();
  }catch(e){toast('Could not update task: '+e.message,'error');input.checked=!input.checked;}
}

async function checkProjectCompletion(projectId){
  try{
    const tasks=await sbFetch('project_tasks?project_id=eq.'+projectId+'&select=id,status,parent_task_id')||[];
    const mainTasks=tasks.filter(t=>!t.parent_task_id);
    if(!mainTasks.length) return;
    const allDone=mainTasks.every(t=>t.status==='done');
    const anyActive=mainTasks.some(t=>t.status==='inprogress');
    const proj=projects.find(p=>String(p.id)===String(projectId));
    if(!proj) return;
    const newStatus=allDone?'done':(anyActive?'inprogress':null);
    if(newStatus && proj.status!==newStatus){
      await dbUpdate('projects',projectId,{status:newStatus});
      proj.status=newStatus; // update local array immediately
      if(newStatus==='done') toast('All tasks done — project marked Completed! ✅');
      renderProjectStats(); // refresh stat boxes
    }
  }catch(_){}
}

async function deleteTask(taskId,evt){
  if(evt){evt.stopPropagation();evt.preventDefault();}
  if(!confirm('Delete this task? This cannot be undone.')) return;
  try{
    await sbFetch('project_tasks?id=eq.'+taskId,{method:'DELETE'});
    toast('Task deleted.');
    if(activeProject) await loadProjectTasks(activeProject.id);
    await loadProjects();
  }catch(e){toast('Error: '+e.message,'error');}
}

async function saveProjectTask() {
  if(!activeProject) return;
  const title=$('ptTaskTitle').value.trim();
  if(!title){toast('Please enter a task title.','error');return;}
  const btn=$('ptSaveBtn'); btn.disabled=true; btn.textContent='Saving...';
  // Get assignee from the text input (works with both datalist and free typing)
  const assigneeName = ($('ptTaskAssigneeInput')?.value||$('ptTaskAssignee')?.value||'').trim();
  try {
    await dbInsert('project_tasks',{
      project_id:activeProject.id, title, status:$('ptTaskStatus').value,
      priority:$('ptTaskPriority').value, assignee_name:assigneeName,
      assignee_id:null, due_date:$('ptTaskDue').value||null,
      description:$('ptTaskDesc')?.value||'', helpers:JSON.stringify([])
    });
    toast('Task added'+(assigneeName?' and assigned to '+assigneeName:'')+'.');
    // Clear form
    $('ptTaskTitle').value='';
    if($('ptTaskAssigneeInput')) $('ptTaskAssigneeInput').value='';
    $('ptTaskAssignee').value='';
    if($('ptTaskDue')) $('ptTaskDue').value='';
    if($('ptTaskDesc')) $('ptTaskDesc').value='';
    await loadProjectTasks(activeProject.id);
    await loadProjects();
  } catch(e){toast('Could not add task: '+e.message,'error');}
  finally{btn.disabled=false;btn.textContent='Add Task';}
}

function onKPICategoryChange(val) {
  var wrap=$('pkOtherWrap');
  if(wrap) wrap.style.display=(val==='__other__')?'block':'none';
}

async function saveProjectKPI() {
  if(!activeProject) return;
  const cat=$('pkKPICategory')?.value;
  if(!cat){toast('Please select a KPI.','error');return;}
  const title=(cat==='__other__'?($('pkKPITitle')?.value.trim()||''):cat);
  if(!title){toast('Please enter a KPI name.','error');return;}
  const btn=$('pkSaveBtn'); btn.disabled=true; btn.textContent='Saving...';
  try {
    await dbInsert('project_kpis',{
      project_id:activeProject.id, title, kpi_type:'individual',
      target_value:0, current_value:0, unit:'', owner_name:$('pkOwner')?.value||''
    });
    toast('KPI added.');
    if($('pkKPICategory')) $('pkKPICategory').value='';
    if($('pkKPITitle')) $('pkKPITitle').value='';
    if($('pkOwner')) $('pkOwner').value='';
    var w=$('pkOtherWrap'); if(w) w.style.display='none';
    await loadProjectKPIs(activeProject.id);
  } catch(e){toast('Could not add KPI: '+e.message,'error');}
  finally{btn.disabled=false;btn.textContent='Add KPI';}
}

function openAddProject() {
  $('apTitle').value=''; $('apType').value='campaign'; $('apStatus').value='todo';
  $('apPriority').value='medium'; $('apOwner').value=SESSION?.full_name||'';
  $('apStartDate').value=''; $('apDueDate').value=''; $('apBudget').value=''; $('apDesc').value='';
  if($('apKPI')) $('apKPI').value='';
  if($('apKPIOther')) $('apKPIOther').value='';
  if($('apKPIOtherWrap')) $('apKPIOtherWrap').style.display='none';
  if($('apTypeOtherWrap')) $('apTypeOtherWrap').style.display='none';
  if($('apTypeOther')) $('apTypeOther').value='';
  showModal('addProjectModal');
}

async function saveNewProject() {
  const title=$('apTitle').value.trim();
  if(!title){toast('Please enter a project title.','error');return;}
  const btn=$('apSaveBtn'); btn.disabled=true; btn.textContent='Saving...';
  try {
    const apTypeVal=$('apType').value==='other'?($('apTypeOther')?.value.trim()||'other'):$('apType').value;
    const res=await dbInsert('projects',{
      title,type:apTypeVal,status:$('apStatus').value,priority:$('apPriority').value,
      owner_name:$('apOwner').value,owner_id:SESSION?.user_id,
      start_date:$('apStartDate').value||null,due_date:$('apDueDate').value||null,
      budget:$('apBudget').value||null,description:$('apDesc').value,
      created_by:SESSION?.user_id,team_members:JSON.stringify([])
    });
    const newId=Array.isArray(res)?res[0].id:res.id;
    // Save KPI if selected
    const kpiVal=$('apKPI')?.value;
    if(kpiVal&&kpiVal!==''){
      const kpiTitle=(kpiVal==='__other__'?($('apKPIOther')?.value.trim()||''):kpiVal);
      if(kpiTitle){
        await dbInsert('project_kpis',{
          project_id:newId, title:kpiTitle, kpi_type:'individual',
          target_value:0, current_value:0, unit:'', owner_name:$('apOwner').value||''
        }).catch(()=>{});
      }
    }
    toast('Project created.');
    logActivity('created','New project: '+title);
    closeModal('addProjectModal');
    await loadProjects();
  } catch(e){toast('Could not create project: '+e.message,'error');}
  finally{btn.disabled=false;btn.textContent='Create Project';}
}



function downloadSampleProjectExcel() {
  var rows=[
    ['Theme / Project','Item','Status','Priority','Primary Owner','Individual KPI','Team KPI','Shared KPI','Detailed Comments and Notes','Source'],
    ['Q1 Brand Campaign','Design social media kit','inprogress','high','Aditya Vastrad','Brand Awareness & Visibility','','','All formats needed by 15 Mar','Confluence'],
    ['Q1 Brand Campaign','Write blog post','todo','medium','Md Bilal','Content Production & Quality','','','SEO-optimised 1200 words','Confluence'],
    ['Partner Summit 2025','Design event banners','todo','high','Designer Name','Event Reach & Engagement','','','3 sizes: 3x6ft 2x4ft 1x2ft','Briefing doc'],
    ['Partner Summit 2025','Create invite emailer','todo','high','Content Name','','Integrated Marketing & Campaign Effectiveness','','HTML emailer 600px wide','Briefing doc'],
  ];
  var ws=XLSX.utils.aoa_to_sheet(rows);
  ws['!cols']=[22,30,12,10,18,30,20,20,45,20].map(function(w){return{wch:w};});
  var _wb2={SheetNames:['Weekly Tracker'],Sheets:{}}; _wb2.Sheets['Weekly Tracker']=ws;
  var _o2=XLSX.write(_wb2,{bookType:'xlsx',type:'binary'}),_b2=new ArrayBuffer(_o2.length),_v2=new Uint8Array(_b2);
  for(var _i2=0;_i2<_o2.length;_i2++) _v2[_i2]=_o2.charCodeAt(_i2)&0xFF;
  var _a2=document.createElement('a'); _a2.href=URL.createObjectURL(new Blob([_b2],{type:'application/octet-stream'})); _a2.download='QNu_Project_Tracker_Template.xlsx';
  document.body.appendChild(_a2); _a2.click(); document.body.removeChild(_a2); setTimeout(function(){URL.revokeObjectURL(_a2.href);},1500);
  toast('Template Excel downloaded.');
}

function downloadProjectsExcel(){
  const rows=[['Theme / Project','Item','Status','Priority','Primary Owner','KPI','Detailed Comments and Notes','Source']];
  for(const p of projects){
    const tags=(function(){try{return JSON.parse(p.tags||'[]');}catch(_){return [];}})();
    const pkpis=projectKPICache[p.id]||[];
    const tasks=projectTasksCache[p.id]||[];
    const indKPIs=pkpis.filter(k=>k.kpi_type==='individual').map(k=>k.title).join('; ');
    const teamKPIs=pkpis.filter(k=>k.kpi_type==='team').map(k=>k.title).join('; ');
    const sharedKPIs=pkpis.filter(k=>k.kpi_type==='shared').map(k=>k.title).join('; ');
    if(!tasks.length){
      const allKPIsStr=(projectKPICache[p.id]||[]).map(k=>k.title).join('; ');
      rows.push([p.title,'',STATUS_LABELS[p.status]||p.status,p.priority||'',p.owner_name||'',allKPIsStr,p.description||'',tags.join('; ')]);
    } else {
      const allKPIsStr=(projectKPICache[p.id]||[]).map(k=>k.title).join('; ');
      tasks.forEach(function(t,i){
        rows.push([i===0?p.title:'',t.title,STATUS_LABELS[t.status]||t.status,t.priority||'',t.assignee_name||'',
          i===0?allKPIsStr:'',t.description||'',i===0?tags.join('; '):'']);
      });
    }
  }
  const ws=XLSX.utils.aoa_to_sheet(rows);
  ws['!cols']=[22,30,12,10,18,30,45,20].map(w=>({wch:w}));
  var _wb3={SheetNames:['Weekly Tracker'],Sheets:{}}; _wb3.Sheets['Weekly Tracker']=ws;
  var _o3=XLSX.write(_wb3,{bookType:'xlsx',type:'binary'}),_b3=new ArrayBuffer(_o3.length),_v3=new Uint8Array(_b3);
  for(var _i3=0;_i3<_o3.length;_i3++) _v3[_i3]=_o3.charCodeAt(_i3)&0xFF;
  var _a3=document.createElement('a'); _a3.href=URL.createObjectURL(new Blob([_b3],{type:'application/octet-stream'})); _a3.download='QNu_Project_Tracker_'+new Date().toISOString().slice(0,10)+'.xlsx';
  document.body.appendChild(_a3); _a3.click(); document.body.removeChild(_a3); setTimeout(function(){URL.revokeObjectURL(_a3.href);},1500);
  toast('Excel downloaded.');
}


function applyProjectSort(val) {
  projectSortMode = val || 'default';
  if(projectView==='table') renderProjectTable(); else renderKanban();
}

function sortedProjects(list) {
  var arr = list.slice();
  var PRIO = {high:0,medium:1,low:2};
  var SORD = {todo:0,inprogress:1,review:2,done:3};
  switch(projectSortMode){
    case 'duedate_asc':
      return arr.sort(function(a,b){var da=a.due_date?new Date(a.due_date):new Date('9999-01-01');var db=b.due_date?new Date(b.due_date):new Date('9999-01-01');return da-db;});
    case 'duedate_desc':
      return arr.sort(function(a,b){var da=a.due_date?new Date(a.due_date):new Date('1970-01-01');var db=b.due_date?new Date(b.due_date):new Date('1970-01-01');return db-da;});
    case 'priority_high':
      return arr.sort(function(a,b){return (PRIO[a.priority]||1)-(PRIO[b.priority]||1);});
    case 'priority_low':
      return arr.sort(function(a,b){return (PRIO[b.priority]||1)-(PRIO[a.priority]||1);});
    case 'status':
      return arr.sort(function(a,b){return (SORD[a.status]||0)-(SORD[b.status]||0);});
    default:
      return arr;
  }
}

function applyProjectFilter(val) {
  projectFilterMode = val || 'all';
  document.querySelectorAll('.stat-card').forEach(c=>c.classList.remove('active'));
  const cardMap={'all':'ps0','status:inprogress':'ps1','status:duesoon':'ps2','status:done':'ps3'};
  const activeId=cardMap[projectFilterMode];
  if(activeId){const el=$(activeId);if(el)el.closest('.stat-card').classList.add('active');}
  if(projectView==='kanban') renderKanban(); else renderProjectTable();
}

function applyProjectFilterAndCascade(val) {
  applyProjectFilter(val);
  // If a subdomain is selected, cascade: show only users in that subdomain in the owner dropdown
  const opts = document.getElementById('projOwnerOptions');
  if(!opts) return;
  const users = window._allUsers || [];
  if(val && (val.startsWith('owner:') || val.startsWith('status:'))) return;
  if(!val || val === 'all') { populateOwnerFilterDropdown(); return; }
  if(val.startsWith('div:')) {
    const divKey = val.slice(4).toLowerCase();
    // Filter users whose department matches the subdomain
    const divUsers = users.filter(function(u){
      const dept = (u.department||'').toLowerCase();
      return dept.indexOf(divKey) !== -1 ||
        // Also handle abbreviated keys
        (divKey.indexOf('excellence') !== -1 && (dept.indexOf('excellence') !== -1 || dept.indexOf('digital') !== -1)) ||
        (divKey.indexOf('design') !== -1 && (dept.indexOf('design') !== -1 || dept.indexOf('creative') !== -1)) ||
        (divKey.indexOf('content') !== -1 && (dept.indexOf('content') !== -1 || dept.indexOf('thought') !== -1)) ||
        (divKey.indexOf('brand') !== -1 && (dept.indexOf('brand') !== -1 || dept.indexOf('marcom') !== -1));
    });
    if(divUsers.length) {
      opts.innerHTML = '<optgroup label="' + esc(val.slice(4)) + '">' +
        divUsers.map(function(u){
          return '<option value="owner:' + esc(u.full_name) + '">' + esc(u.full_name) + '</option>';
        }).join('') + '</optgroup>';
    } else {
      opts.innerHTML = '<option value="" disabled>No users in this team</option>';
    }
  }
}

function populateOwnerFilterDropdown(preloaded) {
  function _render(users) {
    var opts=document.getElementById('projOwnerOptions');
    if(!opts) return;
    if(!users||!users.length){opts.innerHTML='<option value="" disabled>No users found</option>';return;}
    var deptMap={};
    users.forEach(function(u){ var dept=u.department||'Other'; if(!deptMap[dept]) deptMap[dept]=[]; deptMap[dept].push(u); });
    var depts=Object.keys(deptMap).sort(function(a,b){
      var aM=a.toLowerCase().indexOf('marketing')!==-1,bM=b.toLowerCase().indexOf('marketing')!==-1;
      if(aM&&!bM) return -1; if(!aM&&bM) return 1; return a.localeCompare(b);
    });
    var html='';
    depts.forEach(function(dept){
      html+='<optgroup label="'+esc(dept)+'">';
      deptMap[dept].forEach(function(u){ html+='<option value="owner:'+esc(u.full_name)+'">'+esc(u.full_name)+'</option>'; });
      html+='</optgroup>';
    });
    opts.innerHTML=html||'<option value="" disabled>No users found</option>';
  }
  if(preloaded&&preloaded.length){ _render(preloaded); return; }
  if(window._allUsers&&window._allUsers.length){ _render(window._allUsers); return; }
  var o=document.getElementById('projOwnerOptions');
  if(o) o.innerHTML='<option value="" disabled>Loading...</option>';
  loadUsersForAssignee().then(function(u){ _render(u); });
}

function switchProjectView(view) {
  projectView=view;
  ['kanban','table'].forEach(function(v){
    const btn=$('projView_'+v);
    if(btn){
      btn.classList.toggle('active',v===view);
      btn.style.background=(v===view)?'var(--surface)':'transparent';
      btn.style.fontWeight=(v===view)?'600':'400';
    }
  });
  if(view==='kanban') renderKanban(); else renderProjectTable();
}

// ─────────────────────────────────────────────────────────────
// EXCEL IMPORT — QNu Weekly Project Tracker format
// Exact headers: Theme / Project | Item | Status | Primary Owner
//                Priority | Individual KPI | Team KPI | Shared KPI
//                Detailed Comments and Notes | Source
// ─────────────────────────────────────────────────────────────
function importProjectExcel(input) {
  const file=input.files[0]; if(!file) return;
  toast('Reading Excel file...');
  const reader=new FileReader();
  reader.onload=function(e){
    try {
      const wb=XLSX.read(e.target.result,{type:'binary'});
      // Always use first sheet (Weekly Tracker)
      const ws=wb.Sheets[wb.SheetNames[0]];
      const data=XLSX.utils.sheet_to_json(ws,{defval:''});
      if(!data.length){toast('No data found in the file.','error');return;}
      importProjectsFromData(data);
    } catch(err){toast('Could not read file: '+err.message,'error');}
  };
  reader.readAsBinaryString(file);
  input.value='';
}

/* Read a cell value — tries exact key then case-insensitive fallback */
function xlVal(row, keys) {
  for(const k of keys){
    const v=row[k];
    if(v!==undefined&&v!==null&&String(v).trim()!=='') return String(v).trim();
  }
  // case-insensitive fallback
  const lkeys=keys.map(k=>k.toLowerCase());
  for(const rk of Object.keys(row)){
    if(lkeys.includes(rk.toLowerCase())){
      const v=row[rk];
      if(v!==undefined&&v!==null&&String(v).trim()!=='') return String(v).trim();
    }
  }
  return '';
}

/* Status mapping — covers all values seen in the real file */
function xlStatus(raw) {
  if(!raw) return 'todo';
  const s=raw.toLowerCase().replace(/[\s_-]/g,'');
  if(s==='done'||s.includes('complet')||s.includes('finish')) return 'done';
  if(s.includes('inprogress')||s.includes('ongoing')||s.includes('active')||s==='wip') return 'inprogress';
  if(s.includes('review')) return 'review';
  if(s.includes('wait')||s.includes('pending')||s.includes('notstart')||s.includes('blocked')||s.includes('hold')) return 'review';
  return 'todo';
}

/* Priority mapping */
function xlPriority(raw) {
  if(!raw) return 'medium';
  const s=raw.toLowerCase();
  if(s.includes('high')||s.includes('urgent')||s.includes('critical')) return 'high';
  if(s.includes('low')||s.includes('minor')) return 'low';
  return 'medium';
}

async function importProjectsFromData(rows) {
  if(!rows.length){toast('No data found in file.','error');return;}

  // ── STEP 1: Group all rows by Theme / Project ──────────────────────────────
  // Important: same theme can appear in non-contiguous blocks (e.g. "Events"
  // appears twice in the real file). We merge them into ONE project.
  const groups = new Map(); // normalised-key → { theme:string, rows:[] }
  let lastTheme = '';

  for(const row of rows){
    const rawTheme = xlVal(row, ['Theme / Project','Theme/Project','Theme','Project']);
    const theme = rawTheme || lastTheme;
    if(!theme) continue;
    lastTheme = theme;
    const key = theme.toLowerCase().trim();
    if(!groups.has(key)) groups.set(key, {theme, rows:[]});
    groups.get(key).rows.push(row);
  }

  if(!groups.size){
    toast('Could not find "Theme / Project" column. Make sure your first sheet has the correct headers.','error');
    return;
  }

  let projectsCreated=0, projectsUpdated=0, tasksCreated=0, tasksUpdated=0, errors=0;

  // Re-fetch current projects fresh so we get the latest IDs
  let currentProjects=[];
  try{ currentProjects=await sbFetch('projects?order=created_at.desc&select=*')||[]; }catch(_){}

  for(const [key, group] of groups){
    const theme = group.theme;

    // ── STEP 2: Derive project-level summary from all rows in this group ──
    // Overall status = worst-case (if any task not done, project is not done)
    const allStatuses = group.rows.map(r=>xlVal(r,['Status','status']));
    const hasDone      = allStatuses.some(s=>xlStatus(s)==='done');
    const hasProgress  = allStatuses.some(s=>xlStatus(s)==='inprogress');
    const hasReview    = allStatuses.some(s=>xlStatus(s)==='review');
    const projectStatus = hasProgress?'inprogress':hasReview?'review':hasDone?'done':'todo';

    // Overall priority = highest across tasks
    const allPriorities = group.rows.map(r=>xlVal(r,['Priority','priority']));
    const projectPriority = allPriorities.some(p=>xlPriority(p)==='high')?'high':
                            allPriorities.some(p=>xlPriority(p)==='medium')?'medium':'low';

    // Primary owner from first row
    const firstRow   = group.rows[0];
    const projectOwner = xlVal(firstRow,['Primary Owner','Owner','primary owner','owner']);
    const source       = xlVal(firstRow,['Source','source']);

    // Collect all KPIs and notes into description
    const descParts=[];
    group.rows.forEach(r=>{
      const note=xlVal(r,['Detailed Comments and Notes','Notes / Next Step','Notes','notes']);
      const indKPI=xlVal(r,['Individual KPI','individual kpi']);
      const teamKPI=xlVal(r,['Team KPI','team kpi']);
      const sharedKPI=xlVal(r,['Shared KPI','shared kpi']);
      if(note) descParts.push(note);
      if(indKPI||teamKPI||sharedKPI){
        const kpiStr=[indKPI&&'Individual: '+indKPI, teamKPI&&'Team: '+teamKPI, sharedKPI&&'Shared: '+sharedKPI].filter(Boolean).join(' | ');
        descParts.push('KPI — '+kpiStr);
      }
    });

    const projectData={
      title:        theme,
      type:         'campaign',
      status:       projectStatus,
      priority:     projectPriority,
      owner_name:   projectOwner,
      description:  descParts.slice(0,3).join('\n'),  // first 3 notes as project description
      created_by:   SESSION?.user_id,
      owner_id:     SESSION?.user_id,
      team_members: '[]',
      tags:         source?JSON.stringify([source]):'[]'
    };

    // ── STEP 3: Create or update the project ──────────────────────────────────
    let projectId=null;
    const existing=currentProjects.find(p=>p.title.toLowerCase().trim()===key);
    try{
      if(existing){
        await dbUpdate('projects',existing.id,projectData);
        projectId=existing.id;
        projectsUpdated++;
      } else {
        const res=await dbInsert('projects',projectData);
        projectId=Array.isArray(res)?res[0].id:res.id;
        projectsCreated++;
        // Add to local list so duplicate themes in same file resolve correctly
        currentProjects.push({...projectData, id:projectId});
      }
    } catch(e){ console.error('Project insert/update error',theme,e); errors++; continue; }

    // ── STEP 4: Fetch existing tasks then add / update per Item row ───────────
    let existingTasks=[];
    try{ existingTasks=await sbFetch('project_tasks?project_id=eq.'+projectId+'&select=*')||[]; }catch(_){}

    let sortOrder=0;
    for(const row of group.rows){
      const item=xlVal(row,['Item','item','Task','task','Name','name']);
      if(!item) continue;  // blank item = carry-row, skip

      const taskStatus   = xlStatus(xlVal(row,['Status','status']));
      const taskPriority = xlPriority(xlVal(row,['Priority','priority']));
      const taskOwner    = xlVal(row,['Primary Owner','Owner','primary owner','owner']);
      const taskSource   = xlVal(row,['Source','source']);
      const taskNotes    = xlVal(row,['Detailed Comments and Notes','Notes / Next Step','Notes','notes']);
      const indKPI       = xlVal(row,['Individual KPI','individual kpi']);
      const teamKPI      = xlVal(row,['Team KPI','team kpi']);
      const sharedKPI    = xlVal(row,['Shared KPI','shared kpi']);

      // Build task description from notes + KPIs + source
      const taskDescParts=[];
      if(taskNotes)   taskDescParts.push(taskNotes);
      if(indKPI)      taskDescParts.push('Individual KPI: '+indKPI);
      if(teamKPI)     taskDescParts.push('Team KPI: '+teamKPI);
      if(sharedKPI)   taskDescParts.push('Shared KPI: '+sharedKPI);
      if(taskSource)  taskDescParts.push('Source: '+taskSource);

      const taskData={
        project_id:    projectId,
        title:         item,
        status:        taskStatus,
        priority:      taskPriority,
        assignee_name: taskOwner,
        description:   taskDescParts.join('\n'),
        helpers:       '[]',
        sort_order:    sortOrder++
      };
      for(const [ktype,kval] of [['individual',indKPI],['team',teamKPI],['shared',sharedKPI]]){
        if(!kval) continue;
        const dup=await sbFetch('project_kpis?project_id=eq.'+projectId+'&kpi_type=eq.'+ktype+'&title=eq.'+encodeURIComponent(kval)+'&select=id').catch(()=>null);
        if(!dup||!dup.length) await dbInsert('project_kpis',{project_id:projectId,title:kval,kpi_type:ktype,owner_name:taskOwner,target_value:1,current_value:0,unit:''}).catch(()=>{});
      }

      try{
        const existingTask=existingTasks.find(t=>t.title.toLowerCase().trim()===item.toLowerCase().trim());
        if(existingTask){
          const changed=[];
          if(existingTask.status!==taskStatus) changed.push('Status: "'+((STATUS_LABELS[existingTask.status])||existingTask.status)+'" → "'+(STATUS_LABELS[taskStatus]||taskStatus)+'"');
          if((existingTask.priority||'medium')!==(taskPriority||'medium')) changed.push('Priority: "'+(existingTask.priority||'medium')+'" → "'+(taskPriority||'medium')+'"');
          if((existingTask.assignee_name||'')!==(taskOwner||'')) changed.push('Owner: "'+(existingTask.assignee_name||'—')+'" → "'+(taskOwner||'—')+'"');
          if(changed.length){ pendingImportChanges.push({existingId:existingTask.id,newData:taskData,item,project:theme,changes:changed}); }
          else { await dbUpdate('project_tasks',existingTask.id,taskData); tasksUpdated++; }
        } else {
          await dbInsert('project_tasks',taskData);
          tasksCreated++;
        }
      } catch(e){ console.error('Task error',item,e); errors++; }
    }
  }

  // ── STEP 5: Refresh + summary toast ──────────────────────────────────────
  window._allUsers=null;
  await loadProjects();

  const parts=[];
  if(projectsCreated) parts.push(projectsCreated+' project'+(projectsCreated>1?'s':'')+' created');
  if(projectsUpdated) parts.push(projectsUpdated+' project'+(projectsUpdated>1?'s':'')+' updated');
  if(tasksCreated)    parts.push(tasksCreated+' task'+(tasksCreated>1?'s':'')+' created');
  if(tasksUpdated)    parts.push(tasksUpdated+' task'+(tasksUpdated>1?'s':'')+' updated');
  if(errors)          parts.push(errors+' error'+(errors>1?'s':'')+'(check console)');
  toast(parts.length?parts.join(', ')+'.':'Nothing imported — check headers.', errors&&!projectsCreated?'error':'success');
  if(pendingImportChanges.length) setTimeout(showImportChangesDialog,600);
}

function showImportChangesDialog(){
  const modal=$('importChangesModal'),list=$('importChangesList');
  if(!modal||!list) return;
  list.innerHTML=pendingImportChanges.map((c,i)=>`<div id="icd_${i}" style="padding:10px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px"><div style="font-weight:600;font-size:13px">${esc(c.item)}</div><div style="font-size:11px;color:var(--muted);margin-bottom:6px">in ${esc(c.project)}</div>${c.changes.map(ch=>`<div style="font-size:11px;background:var(--yellow-light);border-radius:4px;padding:3px 8px;margin-bottom:3px">${esc(ch)}</div>`).join('')}<div style="display:flex;gap:6px;margin-top:8px"><button class="btn btn-primary btn-xs" onclick="applyImportChange(${i})">Apply Change</button><button class="btn btn-secondary btn-xs" onclick="skipImportChange(${i})">Keep Original</button></div></div>`).join('');
  modal.classList.add('show');
}
async function applyImportChange(i){
  const c=pendingImportChanges[i];if(!c)return;
  try{await dbUpdate('project_tasks',c.existingId,c.newData);const el=$('icd_'+i);if(el){el.style.opacity='0.4';el.querySelectorAll('button').forEach(b=>b.disabled=true);}toast('Applied: '+c.item);await loadProjects();}catch(e){toast('Error: '+e.message,'error');}
}
function skipImportChange(i){const el=$('icd_'+i);if(el){el.style.opacity='0.4';el.querySelectorAll('button').forEach(b=>b.disabled=true);}toast('Kept original: '+(pendingImportChanges[i]?.item||''));}
function closeImportChanges(){$('importChangesModal')?.classList.remove('show');pendingImportChanges=[];}
