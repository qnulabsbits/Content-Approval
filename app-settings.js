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

/* ═══════════════════════════════════════════════════
   EMAIL TEMPLATES MODULE (inside Settings)
═══════════════════════════════════════════════════ */

let emailTemplates = {};

async function loadEmailTemplates() {
  try {
    const rows = await sbFetch('email_templates?select=*') || [];
    rows.forEach(r => emailTemplates[r.template_key] = r);
    renderEmailTemplates();
  } catch(e) { toast('Could not load templates: '+e.message,'error'); }
}

function renderEmailTemplates() {
  const wrap = $('emailTemplatesWrap'); if (!wrap) return;
  const isAdmin = SESSION?.role === 'admin';
  if (!isAdmin) { wrap.innerHTML='<div class="empty-state"><div class="empty-title">Admin only</div></div>'; return; }

  const t1 = emailTemplates['whitepaper_user']    || {};
  const t2 = emailTemplates['whitepaper_internal'] || {};

  wrap.innerHTML = `
    <!-- Template 1: User thank you email -->
    <div class="card card-pad" style="margin-bottom:20px">
      <div class="card-title" style="margin-bottom:4px">📧 User Thank You Email</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:16px">Sent to the person who downloads the whitepaper. Use variables: <code>{{full_name}}</code> <code>{{whitepaper_title}}</code> <code>{{pdf_url}}</code> <code>{{company}}</code></div>
      <div class="field-grid">
        <div class="field-group full">
          <div class="field-label">Email Subject</div>
          <input type="text" class="field-input" id="et_user_subject" value="${esc(t1.subject||'Download | {{whitepaper_title}}')}"/>
        </div>
        <div class="field-group full">
          <div class="field-label">Email Body (HTML)</div>
          <textarea class="field-textarea" id="et_user_body" style="min-height:200px;font-family:monospace;font-size:12px">${esc(t1.body_html||'')}</textarea>
        </div>
      </div>
      <button onclick="saveEmailTemplate('whitepaper_user')" class="btn btn-primary btn-sm" style="margin-top:12px">Save User Template</button>
    </div>

    <!-- Template 2: Internal notification -->
    <div class="card card-pad">
      <div class="card-title" style="margin-bottom:4px">📬 Internal Notification Email</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:16px">Sent to your team when someone downloads a whitepaper. Variables: <code>{{full_name}}</code> <code>{{email}}</code> <code>{{company}}</code> <code>{{designation}}</code> <code>{{phone}}</code> <code>{{how_heard}}</code> <code>{{whitepaper_title}}</code></div>
      <div class="field-grid">
        <div class="field-group full">
          <div class="field-label">Recipient Emails <span style="font-size:11px;color:var(--muted)">(comma separated)</span></div>
          <input type="text" class="field-input" id="et_internal_recipients" value="${esc(t2.recipients||'')}" placeholder="email1@qnulabs.com, email2@qnulabs.com"/>
        </div>
        <div class="field-group full">
          <div class="field-label">Email Subject</div>
          <input type="text" class="field-input" id="et_internal_subject" value="${esc(t2.subject||'New Whitepaper Download | {{whitepaper_title}}')}"/>
        </div>
        <div class="field-group full">
          <div class="field-label">Email Body (HTML)</div>
          <textarea class="field-textarea" id="et_internal_body" style="min-height:200px;font-family:monospace;font-size:12px">${esc(t2.body_html||'')}</textarea>
        </div>
      </div>
      <button onclick="saveEmailTemplate('whitepaper_internal')" class="btn btn-primary btn-sm" style="margin-top:12px">Save Internal Template</button>
    </div>
  `;
}

async function saveEmailTemplate(key) {
  const isUser = key === 'whitepaper_user';
  const subject    = $(isUser ? 'et_user_subject'    : 'et_internal_subject')?.value.trim();
  const body       = $(isUser ? 'et_user_body'       : 'et_internal_body')?.value.trim();
  const recipients = isUser ? '' : ($('et_internal_recipients')?.value.trim() || '');
  if (!subject || !body) { toast('Subject and body are required.','error'); return; }
  try {
    const existing = emailTemplates[key];
    if (existing?.id) {
      await sbFetch('email_templates?id=eq.'+existing.id, {method:'PATCH', body:JSON.stringify({
        subject, body_html:body, recipients,
        updated_by: SESSION.full_name||SESSION.email,
        updated_at: new Date().toISOString()
      })});
    } else {
      await dbInsert('email_templates', {
        template_key:key, subject, body_html:body, recipients,
        updated_by: SESSION.full_name||SESSION.email
      });
    }
    toast('Template saved.');
    await loadEmailTemplates();
  } catch(e) { toast('Save failed: '+e.message,'error'); }
}
