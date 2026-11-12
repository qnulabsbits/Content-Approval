/* ═══════════════════════════════════════════════════
   ADMIN MODULE
═══════════════════════════════════════════════════ */
let adminUsers=[];

async function loadAdmin() {
  try {
    adminUsers=await sbFetch('user_profiles?order=created_at.asc&select=id,email,full_name,role,department,module_permissions,last_login,created_at')||[];
    renderAdminUsers();
    loadAdminStats();
    loadInventoryRequests();
  } catch(e){toast('Could not load admin data: '+e.message,'error');}
}

function toggleCustomRole(customId, val) {
  const el=$(customId); if(!el) return;
  el.style.display = val==='custom' ? 'block' : 'none';
  if(val!=='custom') el.value='';
}

function toggleCustomDept(customId, val) {
  const el=$(customId); if(!el) return;
  el.style.display = val==='custom' ? 'block' : 'none';
  if(val!=='custom') el.value='';
}

async function loadUsersForAssignee() {
  // Always fetch fresh — deduplicate near-identical names (e.g. "Bilal" vs "Md Bilal")
  try {
    const users = await sbFetch('user_profiles?order=full_name.asc&select=id,full_name,email,department,role')||[];
    // Deduplicate: only remove exact duplicate emails (keep all unique users)
    const seen = new Set();
    const deduped = users.filter(function(u) {
      const key = (u.email||u.id||'').toLowerCase().trim();
      if(seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    window._allUsers = deduped; // cache deduped list
    return deduped;
  } catch(_){ return window._allUsers||[]; }
}

async function populateAssigneeDropdown() {
  const dl=$('ptAssigneeList');
  const inp=$('ptTaskAssigneeInput');
  if(!dl||!inp) return;
  const users = await loadUsersForAssignee();
  // Marketing users first, then rest sorted by dept+name
  const sorted=[
    ...users.filter(u=>(u.department||'').toLowerCase()==='marketing'),
    ...users.filter(u=>(u.department||'').toLowerCase()!=='marketing')
      .sort((a,b)=>(a.department||'').localeCompare(b.department||'')||(a.full_name||'').localeCompare(b.full_name||''))
  ];
  // Build datalist options — label shows name + dept
  dl.innerHTML=sorted.map(u=>
    `<option value="${esc(u.full_name)}" label="${esc(u.full_name+(u.department?' ('+u.department+')':''))}">`
  ).join('');
  // Sync hidden field when input changes
  inp.oninput=function(){ $('ptTaskAssignee').value=inp.value; };
  inp.onblur=function(){ $('ptTaskAssignee').value=inp.value; };
}

async function loadAdminStats() {
  try {
    const rows=await sbFetch('content_approvals?select=*')||[];
    const s=(id,v)=>{const el=$(id);if(el)el.textContent=v;};
    s('admS0',rows.length);
    s('admS1',rows.filter(r=>r.writer_approved&&!r.seo_approved).length);
    s('admS2',rows.filter(r=>r.seo_approved&&!r.cmo_approved).length);
    s('admS3',rows.filter(r=>r.cmo_approved&&!r.posted_to_webflow).length);
    s('admS4',rows.filter(r=>r.posted_to_webflow).length);
  } catch(_){}
}

function renderAdminUsers() {
  const c=$('adminUserList'); if(!c) return;
  if(!adminUsers.length){c.innerHTML='<div class="empty-state"><div class="empty-title">No users yet</div></div>';return;}
  const MODS=[
    {id:'content',label:'Content Approval'},
    {id:'projects',label:'Project Tracker'},
    {id:'crm',label:'CRM Dashboard'},
    {id:'analytics',label:'Analytics'},
    {id:'reports',label:'Monthly Reports'},
    {id:'inventory',label:'Inventory (View)'},
    {id:'inventory_write',label:'Inventory (Write)'},
    {id:'hr',label:'HR Module'},
    {id:'requests',label:'Requests'}
  ];
  const rColors={writer:'var(--accent)',seo:'var(--yellow)',cmo:'var(--purple)',designer:'var(--blue)',admin:'#1A1A1A',hr:'var(--teal)'};
  let h='';
  adminUsers.forEach(u=>{
    const perms=safeJSON(u.module_permissions,'{}');
    h+=`<div class="card card-pad" style="margin-bottom:14px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:14px">
        <div>
          <div style="font-size:14px;font-weight:700">${esc(u.full_name||'Unknown')}</div>
          <div style="font-size:12px;color:var(--muted)">${esc(u.email)}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">${u.department?'<span style="font-weight:600;color:var(--blue)">'+esc(u.department)+'</span> &middot; ':''} Last login: ${u.last_login?formatDateTime(u.last_login):'Never'} &middot; Joined: ${u.created_at?formatDate(u.created_at):'-'}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <span style="background:${rColors[u.role]||'var(--muted)'};color:#fff;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600">${esc(String(u.role).toUpperCase())}</span>
          <button class="btn btn-secondary btn-xs" onclick="openEditUser('${u.id}','${esc(u.full_name||'')}','${esc(u.email)}','${u.role}','${esc(u.department||'')}')">Edit</button>
          <button class="btn btn-secondary btn-xs" onclick="openResetPw('${u.id}','${esc(u.email)}')">Reset PW</button>
          <button class="btn btn-secondary btn-xs" style="color:var(--accent);border-color:var(--accent-border)" onclick="deleteUser('${u.id}','${esc(u.email)}')">Delete</button>
        </div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><div style="font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:0.4px">Module Permissions</div><div style="display:flex;gap:6px"><button class="btn btn-secondary btn-xs" onclick="grantAllPerms('${u.id}')">Grant All</button><button class="btn btn-secondary btn-xs" onclick="revokeAllPerms('${u.id}')">Revoke All</button></div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${MODS.map(m=>`<label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:12px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:4px 8px">
          <input type="checkbox" ${perms[m.id]?'checked':''} data-uid="${u.id}" data-mod="${m.id}" onchange="toggleModulePerm(this)"/>
          ${esc(m.label)}
        </label>`).join('')}
      </div>
      <button class="btn btn-secondary btn-sm" id="savePerms_${u.id}" onclick="saveUserPerms('${u.id}')" style="width:100%;margin-top:10px">Save Permissions</button>
    </div>`;
  });
  c.innerHTML=h;
}

function toggleModulePerm(input) {
  var uid=input.getAttribute('data-uid'), mod=input.getAttribute('data-mod');
  var user=adminUsers.find(function(u){return u.id===uid;}); if(!user) return;
  var perms=safeJSON(user.module_permissions,'{}');
  perms[mod]=input.checked;
  user.module_permissions=perms;
  var btn=document.getElementById('savePerms_'+uid);
  if(btn){btn.textContent='Save Changes';btn.style.background='#374151';btn.style.color='#fff';}
}

function grantAllPerms(uid){
  var user=adminUsers.find(function(u){return u.id===uid;}); if(!user) return;
  var perms={};
  ['content','projects','crm','analytics','reports','inventory','inventory_write','hr'].forEach(function(m){perms[m]=true;});
  user.module_permissions=perms;
  // Re-render checkboxes for this user
  document.querySelectorAll('input[data-uid="'+uid+'"]').forEach(function(cb){cb.checked=true;});
  var btn=document.getElementById('savePerms_'+uid);
  if(btn){btn.textContent='Save Changes';btn.style.background='#374151';btn.style.color='#fff';}
}
function revokeAllPerms(uid){
  var user=adminUsers.find(function(u){return u.id===uid;}); if(!user) return;
  user.module_permissions={};
  document.querySelectorAll('input[data-uid="'+uid+'"]').forEach(function(cb){cb.checked=false;});
  var btn=document.getElementById('savePerms_'+uid);
  if(btn){btn.textContent='Save Changes';btn.style.background='#374151';btn.style.color='#fff';}
}

async function saveUserPerms(uid) {
  var user=adminUsers.find(function(u){return u.id===uid;}); if(!user) return;
  var btn=document.getElementById('savePerms_'+uid);
  if(btn){btn.disabled=true;btn.textContent='Saving...';}
  try{
    // user.module_permissions is already the updated object (set by toggleModulePerm)
    var perms=user.module_permissions||{};
    if(typeof perms==='string') perms=JSON.parse(perms); // safety
    // Send to Supabase
    await sbFetch('user_profiles?id=eq.'+uid,{
      method:'PATCH',
      body:JSON.stringify({module_permissions:perms})
    });
    // Update local cache
    user.module_permissions=perms;
    // If this is the current logged-in user, update SESSION so sidebar rebuilds
    if(uid===SESSION?.user_id){
      SESSION.module_permissions=perms;
      saveSession();
      buildSidebar();
    }
    toast('Permissions saved for '+(user.full_name||user.email||'user')+'.');
    if(btn){btn.disabled=false;btn.textContent='Saved ✓';btn.style.background='var(--green)';btn.style.color='#fff';}
    // Reload users from DB so the UI reflects actual saved state
    setTimeout(async function(){
      await loadUsers();
      if(btn){btn.textContent='Save Permissions';btn.style.background='';btn.style.color='';}
    },2000);
  }catch(e){
    console.error('saveUserPerms error:',e);
    toast('Could not save: '+e.message,'error');
    if(btn){btn.disabled=false;btn.textContent='Save Permissions';btn.style.background='';btn.style.color='';}
  }
}

// Create/Edit/Reset/Delete user
let resetUserId=null;
function openCreateUser(){
  ['admNewName','admNewEmail','admNewPassword'].forEach(id=>{const el=$(id);if(el)el.value='';});
  $('admNewRole').value='writer';
  const crc=$('admNewRoleCustom'); if(crc){crc.value='';crc.style.display='none';}
  $('admNewDept').value=''; $('admNewDeptCustom').style.display='none'; $('admNewDeptCustom').value='';
  showModal('admCreateModal');
}
function openEditUser(id,name,email,role,dept){
  $('admEditId').value=id; $('admEditName').value=name; $('admEditEmail').value=email; $('admEditRole').value=role;
  const fixedDepts=['Marketing','Sales','Engineering','HR','Leadership','Finance','Operations'];
  if(!dept){$('admEditDept').value='';$('admEditDeptCustom').style.display='none';$('admEditDeptCustom').value='';}
  else if(fixedDepts.includes(dept)){$('admEditDept').value=dept;$('admEditDeptCustom').style.display='none';$('admEditDeptCustom').value='';}
  else{$('admEditDept').value='custom';$('admEditDeptCustom').style.display='block';$('admEditDeptCustom').value=dept;}
  showModal('admEditModal');
}
function openResetPw(id,email){
  resetUserId=id; $('admResetSub').textContent='New password for '+email; $('admResetPw').value=''; showModal('admResetModal');
}

async function adminCreateUser(){
  const name=$('admNewName').value.trim(), email=$('admNewEmail').value.trim(), password=$('admNewPassword').value;
  const roleRaw=$('admNewRole').value;
  const role=roleRaw==='custom'?($('admNewRoleCustom')?.value.trim()||'writer'):roleRaw;
  if(!name||!email||!password){toast('Please fill in all fields.','error');return;}
  if(password.length<6){toast('Password needs at least 6 characters.','error');return;}
  const btn=$('admCreateBtn'); btn.disabled=true; btn.textContent='Creating...';
  try {
    let uid=null;
    const token = await getToken();
    const newDept=$('admNewDept').value==='custom'?$('admNewDeptCustom').value.trim():$('admNewDept').value;
    const defaultPerms={content:false,projects:false,crm:false,analytics:false,reports:false,inventory:false,inventory_write:false,hr:false};
    defaultPerms[['content','projects','inventory'].includes(role)?role:'content']=true;
    if(role==='admin') Object.keys(defaultPerms).forEach(k=>defaultPerms[k]=true);

    // Step 1: Try admin endpoint (works with service_role key)
    const r1=await fetch(SUPA_URL+'/auth/v1/admin/users',{
      method:'POST',
      headers:{apikey:SUPA_KEY,'Authorization':'Bearer '+token,'Content-Type':'application/json'},
      body:JSON.stringify({email,password,email_confirm:true,app_metadata:{},user_metadata:{full_name:name}})
    });
    const d1=await r1.json();
    if(r1.ok&&(d1.id||d1.user?.id)){
      uid=d1.id||d1.user?.id;
    } else {
      // Step 2: Fallback signup
      const r2=await fetch(SUPA_URL+'/auth/v1/signup',{
        method:'POST',
        headers:{apikey:SUPA_KEY,'Content-Type':'application/json'},
        body:JSON.stringify({email,password,data:{full_name:name}})
      });
      const d2=await r2.json();
      uid=(d2.user?.id)||d2.id||null;

      if(!uid){
        const errMsg=(d2.msg||d2.message||d2.error_description||'').toLowerCase();
        const isAlreadyReg=errMsg.includes('already registered')||errMsg.includes('already been registered');

        if(isAlreadyReg){
          // Step 3: Auth user exists — find their UUID via a password-reset trick:
          // We can look them up in user_profiles by email
          btn.textContent='Checking profile...';
          const existProfile=await sbFetch('user_profiles?email=eq.'+encodeURIComponent(email)+'&select=id,email,full_name,role').catch(()=>null);
          if(existProfile&&existProfile.length){
            // Profile already exists — just update it with the new details
            uid=existProfile[0].id;
            await sbFetch('user_profiles?id=eq.'+uid,{method:'PATCH',
              body:JSON.stringify({full_name:name,role,department:newDept||null,module_permissions:defaultPerms})
            });
            toast('User "'+email+'" already existed — profile updated with new role and permissions.');
            logActivity('user_updated','Updated existing user '+email+' ('+role+')');
            closeModal('admCreateModal'); await loadAdmin();
            return;
          } else {
            // Auth user exists but NO profile — attempt to recover by re-signing them in
            // to get their UUID (only works if we know the password, which we just set)
            btn.textContent='Recovering UID...';
            const r3=await fetch(SUPA_URL+'/auth/v1/token?grant_type=password',{
              method:'POST',
              headers:{apikey:SUPA_KEY,'Content-Type':'application/json'},
              body:JSON.stringify({email,password})
            });
            const d3=await r3.json();
            uid=d3.user?.id||null;
            if(!uid){
              toast('Account exists in Supabase Auth but the password you entered may not match. Go to Supabase → Authentication → Users → find "'+email+'" → copy their UUID, then contact support to link it manually.','error');
              return;
            }
            // Got UID — create the missing profile
          }
        } else {
          toast('Auth error: '+(d2.msg||d2.message||d2.error_description||JSON.stringify(d2)),'error');
          return;
        }
      }
    }
    if(!uid){toast('Could not get user ID. Check Supabase Auth settings.','error');return;}

    // Step 4: Upsert profile
    const profileData={id:uid,email,full_name:name,role,department:newDept||null,module_permissions:defaultPerms};
    try {
      await dbInsert('user_profiles',profileData);
    } catch(profileErr) {
      // Already exists — patch instead
      const existing=await sbFetch('user_profiles?id=eq.'+uid+'&select=id').catch(()=>null);
      if(existing&&existing.length){
        await sbFetch('user_profiles?id=eq.'+uid,{method:'PATCH',
          body:JSON.stringify({full_name:name,role,department:newDept||null,module_permissions:defaultPerms})
        });
      } else {
        throw profileErr;
      }
    }
    toast('User "'+email+'" created successfully.');
    logActivity('user_created','Created user '+email+' ('+role+')');
    closeModal('admCreateModal'); await loadAdmin();
  } catch(e){toast('Error: '+e.message,'error');}
  finally{btn.disabled=false;btn.textContent='Create User';}
}

async function adminSaveEdit(){
  const id=$('admEditId').value, name=$('admEditName').value.trim(), email=$('admEditEmail').value.trim(), role=$('admEditRole').value;
  if(!name||!email){toast('Name and email required.','error');return;}
  const btn=$('admEditBtn'); btn.disabled=true; btn.textContent='Saving...';
  try{
    const editDept=$('admEditDept').value==='custom'?$('admEditDeptCustom').value.trim():$('admEditDept').value;
    await sbFetch('user_profiles?id=eq.'+id,{method:'PATCH',body:JSON.stringify({full_name:name,email,role,department:editDept||null})});
    toast('User updated.'); closeModal('admEditModal'); await loadAdmin();
  }catch(e){toast('Error: '+e.message,'error');}
  finally{btn.disabled=false;btn.textContent='Save';}
}

async function adminResetPw(){
  const pw=$('admResetPw').value;
  if(!pw||pw.length<6){toast('Password needs at least 6 characters.','error');return;}
  const btn=$('admResetBtn'); btn.disabled=true; btn.textContent='Resetting...';
  try{
    const r=await fetch(SUPA_URL+'/auth/v1/admin/users/'+resetUserId,{method:'PUT',headers:{apikey:SUPA_KEY,'Authorization':'Bearer '+(await getToken()),'Content-Type':'application/json'},body:JSON.stringify({password:pw})});
    const d=await r.json();
    if(!r.ok){toast(r.status===401||r.status===403?'Supabase blocks browser password resets. Add a server function.':'Error: '+(d.msg||d.message),'error');return;}
    toast('Password reset.'); closeModal('admResetModal');
  }catch(e){toast('Error: '+e.message,'error');}
  finally{btn.disabled=false;btn.textContent='Reset';}
}

async function deleteUser(id,email){
  if(!confirm('Remove '+email+'? They will lose access.')) return;
  try{
    await sbFetch('user_profiles?id=eq.'+id,{method:'DELETE'});
    toast('User removed.'); logActivity('user_deleted','Removed user '+email); await loadAdmin();
  }catch(e){toast('Error: '+e.message,'error');}
}

async function loadAdminActivityLog() {
  const c=$('adminActivityLog'); if(!c) return;
  try {
    const logs=await sbFetch('activity_log?order=created_at.desc&limit=100&select=*')||[];
    if(!logs.length){c.innerHTML='<div style="font-size:12px;color:var(--muted)">No activity yet.</div>';return;}
    const cls={login:'login',approved:'approved',edited:'edited',posted:'posted',reminder:'reminder',created:'created',request:'inprogress'};
    c.innerHTML='<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden">' +
    '<div style="display:grid;grid-template-columns:150px 200px 100px minmax(0,1fr);column-gap:12px;padding:10px 14px;background:var(--surface2);font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.4px"><div>Time</div><div>User</div><div>Action</div><div>Details</div></div>'+
    logs.map(l=>`<div style="display:grid;grid-template-columns:150px 200px 100px minmax(0,1fr);column-gap:12px;padding:10px 14px;border-bottom:1px solid var(--border);font-size:12px;align-items:start">
      <div style="color:var(--muted)">${formatDateTime(l.created_at)}</div>
      <div style="font-weight:600;word-break:break-word">${esc(l.user_email||'-')}<br><span style="color:var(--muted);font-weight:400;font-size:11px">${esc(l.user_role||'')}</span></div>
      <div><span class="badge ${cls[l.action]||'draft'}" style="font-size:10px">${esc(l.action)}</span></div>
      <div style="color:var(--muted);word-break:break-word">${esc(l.details||'')}${l.row_title?' - '+esc(l.row_title):''}</div>
    </div>`).join('')+'</div>';
  } catch(e){c.innerHTML=`<div style="font-size:12px;color:var(--muted)">Could not load: ${esc(e.message)}</div>`;}
}

function adminShowTab(tab) {
  ['users','activity','inventory-reqs'].forEach(t=>{
    const s=$('admTab-'+t); if(s) s.style.display=t===tab?'block':'none';
    const b=$('admTabBtn-'+t); if(b) b.classList.toggle('active',t===tab);
  });
  if(tab==='activity') loadAdminActivityLog();
  if(tab==='inventory-reqs') loadInventoryRequests();
}
