/* ═══════════════════════════════════════════════════
   USER SETTINGS PAGE
═══════════════════════════════════════════════════ */
function loadSettings() {
  if(!SESSION) return;
  const n=$('settingsUserName'); if(n) n.textContent=SESSION.full_name||SESSION.email||'';
  const nameInput=$('settingsEditName'); if(nameInput) nameInput.value=SESSION.full_name||'';
  const e=$('settingsEmail'); if(e) e.textContent=SESSION.email||'';
  const r=$('settingsRole'); if(r) r.textContent=SESSION.role||'';
  const d=$('settingsDept'); if(d) d.textContent=SESSION.department||'—';
  // Clear password fields
  ['settingsNewPw','settingsConfirmPw','settingsCurrentPw'].forEach(function(id){
    const el=$(id); if(el) el.value='';
  });
  $('settingsPwMsg')&&($('settingsPwMsg').textContent='');
}

async function changeOwnPassword() {
  const newPw=($('settingsNewPw')?.value||'').trim();
  const confirmPw=($('settingsConfirmPw')?.value||'').trim();
  const msgEl=$('settingsPwMsg');
  if(!newPw||!confirmPw){
    if(msgEl){msgEl.textContent='Please fill in both fields.';msgEl.style.color='var(--accent)';}
    return;
  }
  if(newPw.length<6){
    if(msgEl){msgEl.textContent='Password must be at least 6 characters.';msgEl.style.color='var(--accent)';}
    return;
  }
  if(newPw!==confirmPw){
    if(msgEl){msgEl.textContent='Passwords do not match.';msgEl.style.color='var(--accent)';}
    return;
  }
  const btn=$('settingsPwBtn');
  if(btn){btn.disabled=true;btn.textContent='Saving...';}
  try{
    // Use Supabase auth PUT /user to update own password
    const token=await getToken();
    const res=await fetch(SUPA_URL+'/auth/v1/user',{
      method:'PUT',
      headers:{apikey:SUPA_KEY,'Authorization':'Bearer '+token,'Content-Type':'application/json'},
      body:JSON.stringify({password:newPw})
    });
    const d=await res.json();
    if(!res.ok) throw new Error(d.msg||d.message||d.error_description||'Could not update password');
    if(msgEl){msgEl.textContent='Password changed successfully.';msgEl.style.color='var(--green)';}
    $('settingsNewPw').value=''; $('settingsConfirmPw').value='';
    toast('Password updated.');
    logActivity('password_changed','User changed their own password');
  }catch(e){
    if(msgEl){msgEl.textContent='Error: '+e.message;msgEl.style.color='var(--accent)';}
    toast('Could not change password: '+e.message,'error');
  }finally{
    if(btn){btn.disabled=false;btn.textContent='Change Password';}
  }
}

async function updateOwnProfile() {
  const name=($('settingsEditName')?.value||'').trim();
  if(!name){toast('Name cannot be empty.','error');return;}
  const btn=$('settingsProfileBtn');
  if(btn){btn.disabled=true;btn.textContent='Saving...';}
  try{
    await sbFetch('user_profiles?id=eq.'+SESSION.user_id,{method:'PATCH',body:JSON.stringify({full_name:name})});
    SESSION.full_name=name;
    saveSession();
    updateTopbar();
    toast('Profile updated.');
    logActivity('profile_updated','Updated display name to: '+name);
    const n=$('settingsUserName'); if(n) n.textContent=name;
  }catch(e){toast('Could not update: '+e.message,'error');}
  finally{if(btn){btn.disabled=false;btn.textContent='Save Name';}}
}

function toggleSettingsPw(id,btn){const el=document.getElementById(id);if(!el)return;if(el.type==="password"){el.type="text";btn.textContent="Hide";}else{el.type="password";btn.textContent="Show";}}
