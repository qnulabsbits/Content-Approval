/* ═══════════════════════════════════════════════════
   SUBTASK FUNCTIONS
═══════════════════════════════════════════════════ */
function onTepKPIChange(val){
  var w=$('tepKPIOtherWrap');
  if(w) w.style.display=(val==='__other__')?'block':'none';
}

function toggleAddSubtask() {
  const form=$('addSubtaskForm');
  if(!form) return;
  const isOpen=form.style.display!=='none';
  form.style.display=isOpen?'none':'block';
  if(!isOpen){
    $('subtaskTitle').value='';
    $('subtaskAssignee').value='';
    if($('subtaskDue')) $('subtaskDue').value='';
    $('subtaskPriority').value='medium';
    // Populate assignee datalist
    loadUsersForAssignee().then(function(users){
      const dl=$('subtaskAssigneeList'); if(!dl) return;
      const mkt=users.filter(u=>(u.department||'').toLowerCase().indexOf('marketing')!==-1);
      const rest=users.filter(u=>(u.department||'').toLowerCase().indexOf('marketing')===-1)
        .sort((a,b)=>(a.full_name||'').localeCompare(b.full_name||''));
      dl.innerHTML=[...mkt,...rest].map(function(u){
        const displayName=normaliseName(u.full_name)||u.full_name;
        return '<option value="'+esc(displayName)+'" label="'+esc(displayName+(u.department?' ('+u.department+')':''))+'"></option>';
      }).join('');
    });
    $('addSubtaskBtn').textContent='— Close';
  } else {
    $('addSubtaskBtn').textContent='+ Add Sub-task';
  }
}

async function loadSubtasks(parentTaskId, projId) {
  const list=$('subtaskList'); if(!list) return;
  try {
    const subs=await sbFetch('project_tasks?parent_task_id=eq.'+parentTaskId+'&order=created_at.asc&select=*')||[];
    if(!subs.length){
      list.innerHTML='<div style="font-size:12px;color:var(--muted);padding:4px 0">No sub-tasks yet. Click "+ Add Sub-task" above.</div>';
      return;
    }
    list.innerHTML=subs.map(function(s){
      const done=s.status==='done';
      return '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--surface2);border-radius:7px;border:1px solid var(--border)">'
        +'<input type="checkbox" '+(done?'checked':'')
        +' onchange="toggleSubtask('+s.id+',this.checked,'+parentTaskId+','+projId+')"'
        +' style="flex-shrink:0"/>'
        +'<div style="flex:1;min-width:0">'
        +'<div style="font-size:12px;font-weight:600;'+(done?'text-decoration:line-through;color:var(--muted)':'')+'">'+esc(s.title)+'</div>'
        +'<div style="font-size:11px;color:var(--muted);margin-top:1px">'
        +esc(s.assignee_name||'Unassigned')
        +(s.due_date?' · '+formatDate(s.due_date):'')
        +'<span class="badge '+(s.priority||'medium')+'" style="font-size:9px;margin-left:6px">'+esc(s.priority||'medium')+'</span>'
        +'</div>'
        +'</div>'
        +'<button onclick="deleteSubtask('+s.id+','+parentTaskId+','+projId+')" '
        +'style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:16px;padding:0 4px" title="Delete">×</button>'
        +'</div>';
    }).join('');
  } catch(e) {
    list.innerHTML='<div style="font-size:12px;color:var(--muted)">Could not load sub-tasks.</div>';
  }
}

async function saveSubtask() {
  const m=$('taskEditModal'); if(!m) return;
  const parentId=m.getAttribute('data-panelfor');
  const projId=m.getAttribute('data-projid');
  const title=($('subtaskTitle')?.value||'').trim();
  if(!title){toast('Please enter a sub-task title.','error');return;}
  const assigneeName=($('subtaskAssignee')?.value||'').trim();
  const btn=$('subtaskSaveBtn');
  if(btn){btn.disabled=true;btn.textContent='Adding...';}
  try {
    await dbInsert('project_tasks',{
      project_id:parseInt(projId),
      parent_task_id:parseInt(parentId),
      title,
      status:'todo',
      priority:$('subtaskPriority')?.value||'medium',
      assignee_name:assigneeName,
      due_date:$('subtaskDue')?.value||null,
      description:'',
      helpers:'[]',
      sort_order:999
    });
    // Notify assignee if different from current user
    if(assigneeName){
      const users=window._allUsers||[];
      const u=users.find(x=>(x.full_name||'').toLowerCase()===assigneeName.toLowerCase());
      if(u&&u.id!==SESSION?.user_id){
        await assignTask(u.id,u.full_name,title,'Sub-task of: '+($('tep_title')?.value||''),'projects',parseInt(projId));
        toast('Sub-task added and assigned to '+assigneeName+'.');
      } else {
        toast('Sub-task added.');
      }
    } else {
      toast('Sub-task added.');
    }
    await loadSubtasks(parentId, projId);
    await loadProjects();
    // Clear form
    $('subtaskTitle').value=''; $('subtaskAssignee').value='';
    if($('subtaskDue')) $('subtaskDue').value='';
    $('subtaskPriority').value='medium';
  } catch(e){toast('Error: '+e.message,'error');}
  finally{if(btn){btn.disabled=false;btn.textContent='Add Sub-task';}}
}

async function toggleSubtask(subId, done, parentId, projId) {
  try {
    await dbUpdate('project_tasks', subId, {status:done?'done':'todo'});
    await loadSubtasks(parentId, projId);
    await loadProjects();
  } catch(e){toast('Error: '+e.message,'error');}
}

async function deleteSubtask(subId, parentId, projId) {
  if(!confirm('Delete this sub-task?')) return;
  try {
    await sbFetch('project_tasks?id=eq.'+subId, {method:'DELETE'});
    toast('Sub-task deleted.');
    await loadSubtasks(parentId, projId);
    await loadProjects();
  } catch(e){toast('Error: '+e.message,'error');}
}


function toggleApOther(val) {
  const wrap=$('apTypeOtherWrap');
  if(wrap) wrap.style.display=(val==='other')?'block':'none';
}

function onApKPIChange(val) {
  const wrap=$('apKPIOtherWrap');
  if(wrap) wrap.style.display=(val==='__other__')?'block':'none';
}


/* ── Chat chime ── */
function playChatChime(){
  try{
    const ac=new (window.AudioContext||window.webkitAudioContext)();
    const osc=ac.createOscillator();
    const gain=ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.type='sine'; osc.frequency.setValueAtTime(880,ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200,ac.currentTime+0.1);
    gain.gain.setValueAtTime(0.3,ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.4);
    osc.start(ac.currentTime); osc.stop(ac.currentTime+0.4);
  }catch(_){}
}

/* ── @mention rendering ── */
function renderChatContent(text) {
  if(!text) return '';
  // Highlight @mentions
  return chatEsc(text).replace(/@(\S+)/g, function(match, name) {
    const isMine = SESSION && (SESSION.full_name||'').toLowerCase().startsWith(name.toLowerCase());
    return '<span class="chat-mention'+(isMine?' me':'')+'">' + match + '</span>';
  });
}

/* ── @mention picker ── */
let mentionQuery = '';
let mentionActive = false;

function onChatInputMention(e) {
  const inp = cq('chatMsgInput');
  const val = inp.value;
  const pos = inp.selectionStart;
  // Find the @ symbol before cursor
  const before = val.slice(0, pos);
  const atIdx = before.lastIndexOf('@');
  if(atIdx !== -1 && (atIdx === 0 || /\s/.test(before[atIdx-1]))) {
    mentionQuery = before.slice(atIdx+1);
    if(mentionQuery.length >= 0) {
      showMentionPicker(mentionQuery);
      return;
    }
  }
  hideMentionPicker();
}

function showMentionPicker(query) {
  const picker = cq('mentionPicker');
  if(!picker) return;
  const users = window._allUsers || [];
  const q = query.toLowerCase();
  const matches = users.filter(u => {
    const name = (u.full_name||'').toLowerCase();
    return name.includes(q) && u.id !== SESSION.user_id;
  }).slice(0,8);
  if(!matches.length){hideMentionPicker();return;}
  picker.innerHTML = matches.map(u =>
    '<div class="mention-item" onmousedown="insertMention(event,\''+chatEsc(u.full_name)+'\')">'+
    '<div class="mention-item-avatar">'+(u.full_name||'?')[0].toUpperCase()+'</div>'+
    '<div><div style="font-size:13px;font-weight:600">'+chatEsc(u.full_name||'')+'</div>'+
    '<div style="font-size:11px;color:var(--muted)">'+chatEsc(u.department||u.role||'')+'</div></div></div>'
  ).join('');
  picker.style.display = 'block';
  mentionActive = true;
}

function hideMentionPicker() {
  const picker = cq('mentionPicker');
  if(picker) picker.style.display = 'none';
  mentionActive = false;
}

function insertMention(e, name) {
  if(e) e.preventDefault();
  const inp = cq('chatMsgInput');
  const val = inp.value;
  const pos = inp.selectionStart;
  const before = val.slice(0, pos);
  const atIdx = before.lastIndexOf('@');
  const after = val.slice(pos);
  inp.value = before.slice(0, atIdx) + '@' + name + ' ' + after;
  inp.focus();
  const newPos = atIdx + name.length + 2;
  inp.setSelectionRange(newPos, newPos);
  hideMentionPicker();
}

/* ── Auto-logout after 300s inactivity ── */
let _autoLogoutTimer = null;
const AUTO_LOGOUT_SECS = 300;

function resetAutoLogout() {
  if(!SESSION) return;
  if(_autoLogoutTimer) clearTimeout(_autoLogoutTimer);
  _autoLogoutTimer = setTimeout(function(){
    if(SESSION){
      toast('Session expired after 5 minutes of inactivity. Please sign in again.');
      setTimeout(function(){ forceLogout('Session expired. Please sign in again.'); }, 1500);
    }
  }, AUTO_LOGOUT_SECS * 1000);
}

function initAutoLogout() {
  ['mousemove','keydown','click','scroll','touchstart'].forEach(function(evt){
    document.addEventListener(evt, resetAutoLogout, {passive:true});
  });
  resetAutoLogout();
}

/* ── Name normalisation — treat short aliases as full names ── */
const NAME_ALIASES = {
  'bilal': 'Md Bilal',
  'md bilal': 'Md Bilal'
};
function normaliseName(name) {
  if(!name) return name;
  const key = name.trim().toLowerCase();
  return NAME_ALIASES[key] || name;
}

/* ── Sidebar collapse/expand toggle ── */
function toggleSidebar() {
  const sb = document.getElementById('appSidebar');
  if(!sb) return;
  sb.classList.toggle('expanded');
}
