/* ═══════════════════════════════════════════════════════════════
   TASK ASSIGNMENT FLOATING BOX
═══════════════════════════════════════════════════════════════ */
let shownTaskIds = new Set();

async function loadTaskAssignments(){
  if(!SESSION) return;
  try{
    const tasks=await sbFetch('task_assignments?assigned_to=eq.'+SESSION.user_id+'&completed=eq.false&dismissed=eq.false&order=created_at.desc&select=*')||[];
    renderTaskAssignments(tasks);
  }catch(e){ console.error('loadTaskAssignments',e); }
}

function renderTaskAssignments(tasks){
  const box=cq('taskAssignBox'); if(!box) return;
  if(!tasks.length){ box.innerHTML=''; return; }
  box.innerHTML=tasks.map(t=>`
    <div class="task-assign-card" id="ta_${t.id}">
      <div class="task-assign-header">
        <div>
          <div class="task-assign-label">Task Assigned to You</div>
          <div class="task-assign-title">${chatEsc(t.task_title)}</div>
          <div class="task-assign-by">By ${chatEsc(t.assigned_by_name||'Someone')} · ${formatDate(t.created_at)}</div>
        </div>
        <button class="task-assign-close" onclick="dismissTaskCard(${t.id})" title="Dismiss">✕</button>
      </div>
      ${t.task_description?`<div class="task-assign-desc">${chatEsc(t.task_description)}</div>`:''}
      <div class="task-assign-footer">
        <button class="task-assign-done" onclick="markTaskDone(${t.id})">Mark Complete</button>
        <button class="task-assign-snooze" onclick="dismissTaskCard(${t.id})">Dismiss</button>
      </div>
    </div>`).join('');
}

async function dismissTaskCard(id){
  cq('ta_'+id)?.remove();
  await sbFetch('task_assignments?id=eq.'+id,{method:'PATCH',body:JSON.stringify({dismissed:true})}).catch(()=>{});
}
async function markTaskDone(id){
  cq('ta_'+id)?.remove();
  await sbFetch('task_assignments?id=eq.'+id,{method:'PATCH',body:JSON.stringify({completed:true,dismissed:true})}).catch(()=>{});
  toast('Task marked complete.');
}

/* Assign task to a user — call this from anywhere in the app */
async function assignTask(assignedToId, assignedToName, taskTitle, taskDesc, module, refId){
  if(!SESSION) return;
  try{
    await dbInsert('task_assignments',{
      assigned_to:assignedToId, assigned_to_name:assignedToName,
      assigned_by:SESSION.user_id, assigned_by_name:SESSION.full_name||SESSION.email||'',
      task_title:taskTitle, task_description:taskDesc||'',
      ref_module:module||null, ref_id:refId||null,
      dismissed:false, completed:false
    });
    toast('Task assigned to '+assignedToName+'.');
    logActivity('task_assigned','Assigned task to '+assignedToName+': '+taskTitle);
  }catch(e){ toast('Could not assign task: '+e.message,'error'); }
}
