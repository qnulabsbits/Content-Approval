const CONTENT_TABLE = 'content_approvals';
const MAIN_SLUG = { Blog:'blog-content', Whitepaper:'whitepaper-content', Newsletter:'pr-description', Other:'casestudy-content' };
const IMAGE_SLUG = { Blog:'blog-Image', Whitepaper:'whitepaper-image', Newsletter:'pr-bg-img', Other:'whitepaper-image' };
const SECTION_NAMES = { Blog:'Blogs', Whitepaper:'Whitepapers', Newsletter:'Newsroom', Other:'Case Studies' };
const BELL_SVG = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
const CONTENT_REMIND = { 'with-seo':{to:'seo',label:'SEO team'}, 'with-cmo':{to:'cmo',label:'CMO'}, 'with-designer':{to:'designer',label:'Designer'}, 'ready':{to:'designer',label:'Designer'} };

const COLLECTION_FIELDS = {
  Blog:[
    {label:'Title (Name)',slug:'name',type:'text',required:true},
    {label:'Meta Title',slug:'meta-title',type:'text'},
    {label:'Meta Description',slug:'meta-description',type:'textarea'},
    {label:'Author Name',slug:'author-name',type:'text'},
    {label:'Blog Content',slug:'blog-content',type:'richtext'},
    {label:'Blog Image',slug:'blog-Image',type:'image'},
    {label:'Date',slug:'date-and-Time',type:'date'},
    {label:'FAQ 1 Question',slug:'faq01',type:'text'},
    {label:'FAQ 1 Answer',slug:'faqdes01',type:'textarea'},
    {label:'FAQ 2 Question',slug:'faq02',type:'text'},
    {label:'FAQ 2 Answer',slug:'faqdes02',type:'textarea'}
  ],
  Whitepaper:[
    {label:'Title (Name)',slug:'name',type:'text',required:true},
    {label:'Meta Title',slug:'meta-title',type:'text'},
    {label:'Meta Description',slug:'meta-description',type:'textarea'},
    {label:'Short Para',slug:'short-para',type:'textarea'},
    {label:'Whitepaper Content',slug:'whitepaper-content',type:'richtext'},
    {label:'Whitepaper Image',slug:'whitepaper-image',type:'image'},
    {label:'Whitepaper Date',slug:'whitepaper-date',type:'date'},
    {label:'FAQ 1 Question',slug:'faq01',type:'text'},
    {label:'FAQ 1 Answer',slug:'faq-descp',type:'textarea'},
    {label:'FAQ 2 Question',slug:'faq02',type:'text'},
    {label:'FAQ 2 Answer',slug:'faq-descp2',type:'textarea'},
    {label:'FAQ 3 Question',slug:'faq03',type:'text'},
    {label:'FAQ 3 Answer',slug:'faq-descp3',type:'textarea'},
    {label:'FAQ 4 Question',slug:'faq04',type:'text'},
    {label:'FAQ 4 Answer',slug:'faq-descp4',type:'textarea'}
  ],
  Newsletter:[
    {label:'Title (Name)',slug:'name',type:'text',required:true},
    {label:'News PR Name',slug:'news-pr-name',type:'text'},
    {label:'PR Description',slug:'pr-description',type:'textarea'},
    {label:'PR Source Link',slug:'pr-source-link',type:'text'},
    {label:'Description (Internal)',slug:'description---internal',type:'textarea'},
    {label:'PR PDF Link',slug:'pr-pdf-link',type:'text'},
    {label:'PR Published Date',slug:'pr-published-date',type:'date'},
    {label:'PR Background Image',slug:'pr-bg-img',type:'image'},
    {label:'FAQ 1 Question',slug:'faq1',type:'text'},
    {label:'FAQ 1 Answer',slug:'faq-descp',type:'textarea'},
    {label:'FAQ 2 Question',slug:'faq2',type:'text'},
    {label:'FAQ 2 Answer',slug:'faq-descp2',type:'textarea'}
  ],
  Other:[
    {label:'Title (Name)',slug:'name',type:'text',required:true},
    {label:'Meta Title',slug:'meta-title',type:'text'},
    {label:'Meta Description',slug:'meta-description',type:'textarea'},
    {label:'Small Info',slug:'small-info',type:'text'},
    {label:'Case Study Content',slug:'casestudy-content',type:'richtext'},
    {label:'Case Study Image',slug:'whitepaper-image',type:'image'},
    {label:'Case Study Date',slug:'whitepaper-date',type:'date'},
    {label:'About the Client',slug:'about-the-client',type:'textarea'},
    {label:'Testimonial',slug:'testimonial',type:'text'},
    {label:'Testimonial Name',slug:'testimonial-name',type:'text'},
    {label:'FAQ 1 Question',slug:'faq01',type:'text'},
    {label:'FAQ 1 Answer',slug:'faq-t01',type:'textarea'},
    {label:'FAQ 2 Question',slug:'faq02',type:'text'},
    {label:'FAQ 2 Answer',slug:'faq-t02',type:'textarea'}
  ]
};

const CONTENT_ROLE_CFG = {
  writer: {label:'Writer',field:'writer_approved',toggleCls:'',approveCls:'accent',approveLabel:'Approve for SEO Review',approveSub:'SEO team will be notified.',readOnly:false,canOpen:()=>true,fieldsTitle:'All Webflow Fields'},
  seo: {label:'SEO',field:'seo_approved',toggleCls:'seo',approveCls:'yellow',approveLabel:'Approve for CMO Review',approveSub:'Save edits first, then approve.',readOnly:false,canOpen:r=>!!r.writer_approved,fieldsTitle:'All Webflow Fields - Edit'},
  cmo: {label:'CMO',field:'cmo_approved',toggleCls:'cmo',approveCls:'purple',approveLabel:'Approve for Designer',approveSub:'Designer will post to Webflow.',readOnly:false,canOpen:r=>!!r.seo_approved,fieldsTitle:'All Webflow Fields - SEO Version'},
  designer: {label:'Designer',field:'designer_approved',toggleCls:'designer',approveCls:'blue',approveLabel:'Designer Approval',approveSub:'Approve before posting to Webflow.',readOnly:true,canOpen:r=>!!r.cmo_approved,fieldsTitle:'All Webflow Fields (Read-only)'}
};

// Content state
let contentRows=[], contentFilter='all', contentActive=null, contentPendingImages={}, contentPublishMode='draft';
let contentFetchSeq=0, contentPolling=null;

// ── Review/Comment state ──
let reviewComments = [];      // loaded comments for current content
let reviewMode = false;       // SEO review mode active

function contentGetStatus(row) {
  if (row.posted_to_webflow) return 'posted';
  if (row.designer_approved) return 'ready';
  if (row.cmo_approved) return 'with-designer';
  if (row.seo_approved) return 'with-cmo';
  if (row.needs_revision) return 'needs-revision';
  if (row.writer_approved) return 'with-seo';
  if (row.content && String(row.content).trim()) return 'submitted';
  return 'draft';
}

function contentBadge(s) {
  const m={
    draft:'Draft', submitted:'Submitted',
    'needs-revision':'Needs Revision',
    'with-seo':'With SEO', 'with-cmo':'With CMO',
    'with-designer':'With Designer', ready:'Ready to Post', posted:'Posted'
  };
  return `<span class="badge ${s}"><span class="badge-dot"></span>${m[s]||'Draft'}</span>`;
}

function contentTypePill(row) {
  const label = row.content_type==='Other'?(row.content_type_other||'Case Study'):(row.content_type||'');
  if (!label) return '<span class="td-muted">-</span>';
  const cls={Blog:'blog',Whitepaper:'whitepaper',Newsletter:'newsletter',Other:'other'}[row.content_type]||'other';
  return `<span class="type-pill ${cls}">${esc(label)}</span>`;
}

function contentGetFields(row) {
  const ct = row.content_type||'Blog';
  const ef = safeJSON(row.extra_fields,'{}');
  ef.name = row.title||'';
  ef[MAIN_SLUG[ct]||'blog-content'] = row.content||'';
  if (row.image_url && !ef[IMAGE_SLUG[ct]]) ef[IMAGE_SLUG[ct]] = row.image_url;
  return ef;
}

function contentBuildForm(ct, data, readOnly, prefix) {
  const fields = COLLECTION_FIELDS[ct]||COLLECTION_FIELDS.Blog;
  let html='', inFaq=false;
  fields.forEach(f => {
    const isFaq = f.slug.indexOf('faq')===0;
    if (isFaq&&!inFaq) { html+='<div class="field-group full" style="margin-top:8px"><div style="font-size:12px;font-weight:700;padding:8px 0 6px;border-bottom:1px solid var(--border);margin-bottom:10px;">FAQ Section</div></div>'; inFaq=true; }
    const val = data[f.slug]==null?'':String(data[f.slug]);
    const req = f.required?'<span class="req">*</span>':'';
    const ro = readOnly?' readonly disabled':'';
    const ss = safeId(f.slug);
    if (f.type==='richtext') {
      const tb = readOnly?'':'<div class="richtext-toolbar">'+['bold|<b>B</b>','italic|<i>I</i>','underline|<u>U</u>','formatBlock|H2|h2','insertUnorderedList|List','removeFormat|Clear'].map(s=>{const p=s.split('|');return `<button type="button" class="rt-btn" data-target="${prefix}rtf_${ss}" data-cmd="${p[0]}"${p[2]?' data-val="'+p[2]+'"':''}>${p[1]}</button>`;}).join('')+'</div>';
      html+=`<div class="field-group full"><div class="field-label">${esc(f.label)}${req}</div><div class="richtext-wrap">${tb}<div class="richtext-editor" id="${prefix}rtf_${ss}"${readOnly?'':' contenteditable="true"'}>${val}</div></div></div>`;
    } else if (f.type==='textarea') {
      html+=`<div class="field-group full"><div class="field-label">${esc(f.label)}${req}</div><textarea class="field-textarea" id="${prefix}ff_${ss}"${ro}>${esc(val)}</textarea></div>`;
    } else if (f.type==='image') {
      html+=`<div class="field-group full"><div class="field-label">${esc(f.label)}</div><div id="${prefix}slot_${ss}">${val?`<img style="max-height:140px;border-radius:8px;object-fit:cover;max-width:100%;margin-bottom:8px" src="${esc(val)}" alt=""/>`:''}</div>${readOnly?'':
        `<div class="upload-area" style="border:2px dashed var(--border);border-radius:8px;padding:12px;text-align:center;cursor:pointer;" data-pick="${prefix}img_${ss}"><input type="file" id="${prefix}img_${ss}" accept="image/*" data-imgslug="${esc(f.slug)}" data-prefix="${prefix}" style="display:none"/><span style="font-size:12px;color:var(--muted)">Click to <span style="color:var(--accent);font-weight:600">upload image</span></span></div>`
      }</div>`;
    } else if (f.type==='date') {
      html+=`<div class="field-group"><div class="field-label">${esc(f.label)}${req}</div><input type="date" class="field-date" id="${prefix}ff_${ss}" value="${esc(dateInput(val))}"${ro}/></div>`;
    } else {
      const wide = f.slug==='name'||f.slug.includes('title')||f.slug.includes('description');
      html+=`<div class="field-group${wide?' full':''}"><div class="field-label">${esc(f.label)}${req}</div><input type="text" class="field-input" id="${prefix}ff_${ss}" value="${esc(val)}"${ro}/></div>`;
    }
  });
  return html;
}

function contentCollect(ct, prefix) {
  const fields = COLLECTION_FIELDS[ct]||COLLECTION_FIELDS.Blog, data={};
  fields.forEach(f => {
    if (f.type==='image') return;
    const ss=safeId(f.slug);
    if (f.type==='richtext'){const el=$(prefix+'rtf_'+ss);if(el)data[f.slug]=el.innerHTML;}
    else{const el=$(prefix+'ff_'+ss);if(el)data[f.slug]=el.value||'';}
  });
  return data;
}

async function loadContent() {
  const writerForm=$('contentWriterForm');
  if(writerForm){
    const r=SESSION?.role;
    if(r==='writer'||r==='admin'){
      writerForm.style.display='block';
      const wi=$('contentNewWriter');
      if(wi&&!wi.value&&SESSION) wi.value=SESSION.full_name||'';
    } else { writerForm.style.display='none'; }
  }
  const c = $('contentTable');
  if (c) c.innerHTML='<div class="loading-row"><span class="spinner"></span> Loading...</div>';
  const seq=++contentFetchSeq;
  try {
    contentRows = await sbFetch(CONTENT_TABLE+'?order=created_at.asc&select=*')||[];
    if (seq!==contentFetchSeq) return;
    contentUpdateStats();
    contentRenderTable();
    const lu=$('contentLastUpdated');
    if (lu) lu.textContent='Updated '+new Date().toLocaleTimeString();
    if(SESSION?.role==='admin'){const b=$('contentBulkBar');if(b)b.style.display='flex';}
    if (!contentPolling) contentPolling=setInterval(()=>loadContent(),20000);
  } catch(e) {
    if (c) c.innerHTML=`<div class="empty-state"><div class="empty-title">Could not load</div><div class="empty-sub">${esc(e.message)}</div></div>`;
  }
}

function contentUpdateStats() {
  const r=contentRows;
  const s=(id,v)=>{const el=$(id);if(el)el.textContent=v;};
  s('cs0',r.length);
  s('cs1',r.filter(x=>x.writer_approved&&!x.seo_approved&&!x.needs_revision).length);
  s('cs2',r.filter(x=>x.seo_approved&&!x.cmo_approved).length);
  s('cs3',r.filter(x=>x.cmo_approved&&!x.posted_to_webflow).length);
  s('cs4',r.filter(x=>x.posted_to_webflow).length);
}

function contentRenderTable() {
  const c=$('contentTable'); if(!c) return;
  const role=SESSION?.role;
  const cfg=CONTENT_ROLE_CFG[role];
  const filterMap={
    pending:r=>!r.writer_approved&&!r.needs_revision,
    review:r=>r.writer_approved&&!r.posted_to_webflow,
    needs:r=>(role==='seo'?r.writer_approved&&!r.seo_approved:role==='cmo'?r.seo_approved&&!r.cmo_approved:r.cmo_approved&&!r.posted_to_webflow),
    posted:r=>!!r.posted_to_webflow,ready:r=>r.cmo_approved&&!r.posted_to_webflow
  };
  const rows=contentFilter==='all'?contentRows:contentRows.filter(filterMap[contentFilter]||Boolean);
  if (!rows.length){c.innerHTML='<div class="empty-state"><div class="empty-icon">📄</div><div class="empty-title">Nothing here yet</div><div class="empty-sub">No content matches this filter.</div></div>';return;}
  const status=r=>contentGetStatus(r);
  const infoForRemind=s=>CONTENT_REMIND[s];
  const isAdminView=SESSION?.role==='admin';
  let h='<table><thead><tr>'+(isAdminView?'<th></th>':'');
  const cols=['#','Title','Type','Writer','Date','Approve','Download','Status'];
  if (role==='cmo') cols.splice(4,0,'SEO');
  if (role==='designer') { cols.splice(3,1,'Section'); cols.splice(4,0,'Webflow'); }
  h+=cols.map(x=>`<th>${x}</th>`).join('')+'</tr></thead><tbody>';
  rows.forEach((row,i)=>{
    const can=cfg?cfg.canOpen(row):true;
    const s=status(row);
    const info=infoForRemind(s);
    const bell=info?`<button class="bell-btn" data-act="bell" data-id="${row.id}" title="Remind ${esc(info.label)}">${BELL_SVG}</button>`:'';
    const dl=`<button class="btn btn-secondary btn-xs" data-act="cdl" data-id="${row.id}">Word</button>`;
    // Show revision badge if needs revision
    const revBadge = row.needs_revision ? ' <span style="font-size:10px;background:#FEF3C7;color:#92400E;border:1px solid #FCD34D;border-radius:10px;padding:1px 7px;font-weight:700">Revision</span>' : '';
    let cells=`<td class="td-num">${i+1}</td><td style="font-weight:600">${esc(row.title||'-')}${revBadge}</td><td>${contentTypePill(row)}</td>`;
    if (role!=='designer') cells+=`<td class="td-muted">${esc(row.writer_name||'-')}</td>`;
    else cells+=`<td style="font-size:12px;font-weight:600;color:var(--blue)">${esc(SECTION_NAMES[row.content_type]||'Case Studies')}</td>`;
    cells+=`<td class="td-muted">${formatDate(row.created_at)}</td>`;
    if (role==='cmo') cells+=`<td>${row.seo_approved?'<span style="color:var(--green);font-size:12px;font-weight:600">Done</span>':'<span class="td-muted">Pending</span>'}</td>`;
    if (!cfg) { cells+=`<td>-</td>`; }
    else if (can) {
      cells+=`<td data-noopen="1"><div class="toggle-wrap"><label class="toggle ${cfg.toggleCls}" id="ctog_${row.id}"><input type="checkbox" data-ctoggle="${role}" data-id="${row.id}"${row[cfg.field]?' checked':''}/><span class="toggle-slider"></span></label><span class="toggle-label">${row[cfg.field]?'Approved':'Pending'}</span></div></td>`;
    } else {
      cells+=`<td data-noopen="1"><span class="td-muted" style="font-size:11px">Awaiting prev.</span></td>`;
    }
    cells+=`<td data-noopen="1">${dl}</td>`;
    if (role==='designer') cells+=`<td>${row.posted_to_webflow?`<span style="color:var(--green);font-size:12px;font-weight:600">${row.webflow_status==='live'?'Live':'Draft'}</span>`:'<span class="td-muted">Not posted</span>'}</td>`;
    cells+=`<td><div style="display:flex;align-items:center;gap:6px">${contentBadge(s)}${bell}</div></td>`;
    const chkCell=isAdminView?`<td data-noopen="1"><input type="checkbox" class="contentChk" value="${row.id}"/></td>`:'';
    h+=`<tr${can?` data-copen="${row.id}"`:' class="disabled-row"'}>${chkCell}${cells}</tr>`;
  });
  h+='</tbody></table>';
  c.innerHTML=h;
}

// Content table clicks
document.addEventListener('click', e => {
  if (!$('pg-content')?.classList.contains('active')) return;
  const act=e.target.closest('[data-act]');
  if (act) {
    e.stopPropagation();
    const a=act.getAttribute('data-act'), id=act.getAttribute('data-id');
    if (a==='cdl') contentDownloadRow(id);
    else if (a==='bell') contentSendReminder(id);
    return;
  }
  if (e.target.closest('[data-noopen]')) return;
  const tr=e.target.closest('tr[data-copen]');
  if (tr) contentOpenModal(tr.getAttribute('data-copen'));
});
document.addEventListener('change', e => {
  const inp=e.target.closest('input[data-ctoggle]');
  if (inp) contentHandleToggle(inp);
  const imgInp=e.target.closest('input[data-imgslug]');
  if (imgInp) contentHandleImage(imgInp);
});
document.addEventListener('click', e => {
  const pick=e.target.closest('[data-pick]');
  if (pick&&!e.target.closest('input')) { const inp=$(pick.getAttribute('data-pick'));if(inp)inp.click(); }
  const rtBtn=e.target.closest('.rt-btn');
  if (rtBtn) { const ed=$(rtBtn.getAttribute('data-target'));if(ed){ed.focus();document.execCommand(rtBtn.getAttribute('data-cmd'),false,rtBtn.getAttribute('data-val')||null);} }
});
document.addEventListener('mousedown', e => { if(e.target.closest('.rt-btn')) e.preventDefault(); });

async function contentHandleToggle(input) {
  const id=input.getAttribute('data-id'), role=input.getAttribute('data-ctoggle');
  const cfg=CONTENT_ROLE_CFG[role]; if(!cfg) return;
  const row=contentRows.find(r=>String(r.id)===id), lbl=$('ctog_'+id);
  if (!row) return;
  if (lbl) lbl.classList.add('saving');
  try {
    const data={}; data[cfg.field]=input.checked;
    if (role==='writer'&&input.checked&&row.content) data.original_content=row.content;
    await dbUpdate(CONTENT_TABLE, id, data);
    toast(input.checked?'Approved.':'Approval removed.');
    logActivity(input.checked?'approved':'unapproved', cfg.label+' approval', row.id, row.title);
    await loadContent();
  } catch(e) { input.checked=!input.checked; toast('Could not save: '+e.message,'error'); }
  finally { if(lbl) lbl.classList.remove('saving'); }
}

async function contentHandleImage(input) {
  const file=input.files[0]; if(!file) return;
  const slug=input.getAttribute('data-imgslug'), prefix=input.getAttribute('data-prefix');
  try {
    toast('Uploading image...');
    const url=await uploadImage(file);
    const slot=$(prefix+'slot_'+safeId(slug));
    if (slot) slot.innerHTML=`<img style="max-height:140px;border-radius:8px;object-fit:cover;max-width:100%;margin-bottom:8px" src="${esc(url)}" alt=""/>`;
    if (prefix==='cm_'&&contentActive) {
      const ef=safeJSON(contentActive.extra_fields,'{}'); ef[slug]=url;
      await dbUpdate(CONTENT_TABLE, contentActive.id, {extra_fields:JSON.stringify(ef),image_url:url});
      contentActive.extra_fields=JSON.stringify(ef); contentActive.image_url=url;
    } else { contentPendingImages[slug]=url; }
    toast('Image uploaded.');
  } catch(e) { toast('Image upload failed: '+e.message,'error'); }
  input.value='';
}

async function contentSendReminder(id) {
  const row=contentRows.find(r=>String(r.id)===id); if(!row) return;
  const info=CONTENT_REMIND[contentGetStatus(row)];
  if(!info){toast('Nothing to remind for this item.','error');return;}
  logActivity('reminder','Reminder sent to '+info.label, row.id, row.title);
  try { await fetch(REMINDER_EDGE,{method:'POST',headers:{apikey:SUPA_KEY,Authorization:'Bearer '+(await getToken()),'Content-Type':'application/json'},body:JSON.stringify({type:'reminder',stage:info.to,row_id:row.id,row_title:row.title,sent_by:SESSION.email})}); toast('Reminder sent to '+info.label+'.'); }
  catch(_) { toast('Reminder logged.'); }
}

function contentDownloadRow(id) {
  const row=contentRows.find(r=>String(r.id)===id); if(!row) return;
  const ef=contentGetFields(row), fields=COLLECTION_FIELDS[row.content_type||'Blog']||[];
  let body=`<h1>${esc(row.title||'Untitled')}</h1><p style="color:#666">Type: ${esc(row.content_type||'-')} | Writer: ${esc(row.writer_name||'-')} | Date: ${formatDate(row.created_at)}</p><hr>`;
  fields.forEach(f=>{ if(f.type==='image') return; const v=String(ef[f.slug]||'').trim(); if(v) body+=`<label>${esc(f.label.toUpperCase())}:</label><p>${esc(v)}</p>`; });
  saveBlob(toWord(row.title,body),'application/msword',slugify(row.title)+'.doc');
  toast('Word file downloaded.');
}

// ═══════════════════════════════════════════════════════════════════
// REVIEW & COMMENT SYSTEM
// ═══════════════════════════════════════════════════════════════════

async function reviewLoadComments(contentId) {
  try {
    reviewComments = await sbFetch('content_comments?content_id=eq.'+contentId+'&order=created_at.asc&select=*') || [];
  } catch(e) { reviewComments = []; }
}

function reviewRenderPanel() {
  const panel = $('reviewCommentPanel');
  if (!panel) return;
  if (!reviewComments.length) {
    panel.innerHTML = '<div style="padding:20px;text-align:center;font-size:12px;color:var(--muted)">No comments yet.</div>';
    return;
  }
  const role = SESSION?.role;
  const isWriter = role === 'writer' || role === 'admin';
  panel.innerHTML = reviewComments.map(c => {
    const isOpen = c.status === 'open';
    const bgColor = isOpen ? '#FEF9C3' : '#D1FAE5';
    const borderColor = isOpen ? '#FCD34D' : '#6EE7B7';
    const statusDot = isOpen
      ? '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#F59E0B;margin-right:5px"></span>'
      : '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10B981;margin-right:5px"></span>';
    return `<div id="comment_card_${c.id}" style="background:${bgColor};border:1.5px solid ${borderColor};border-radius:10px;padding:12px 14px;margin-bottom:10px;transition:all 0.2s">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <div style="font-size:11px;font-weight:700;color:#374151">${statusDot}${esc(c.created_by_name||'SEO')} · ${formatDate(c.created_at)}</div>
        ${isOpen&&isWriter?`<button onclick="reviewScrollToAnchor('${esc(c.id)}')" style="background:none;border:none;cursor:pointer;font-size:11px;color:var(--accent);font-weight:600">Go to text ↗</button>`:''}
      </div>
      ${c.text_anchor?`<div style="font-size:11px;color:#6B7280;font-style:italic;background:rgba(0,0,0,0.05);border-radius:5px;padding:4px 8px;margin-bottom:6px">"${esc(c.text_anchor.slice(0,80))}${c.text_anchor.length>80?'…':''}"</div>`:''}
      <div style="font-size:13px;color:#1F2937;line-height:1.5">${esc(c.comment_text)}</div>
      ${c.reply_text?`<div style="margin-top:8px;padding:8px 10px;background:rgba(255,255,255,0.7);border-radius:7px;border-left:3px solid #10B981">
        <div style="font-size:10px;font-weight:700;color:#065F46;margin-bottom:3px">↩ ${esc(c.reply_by||'Writer')} replied:</div>
        <div style="font-size:12px;color:#374151">${esc(c.reply_text)}</div>
      </div>`:''}
      ${isOpen&&isWriter&&!c.reply_text?`<div style="margin-top:8px">
        <textarea id="reply_input_${c.id}" placeholder="Type your correction or reply..." style="width:100%;font-size:12px;border:1px solid #D1D5DB;border-radius:6px;padding:6px 8px;resize:none;font-family:Inter,sans-serif;min-height:60px;box-sizing:border-box"></textarea>
        <div style="display:flex;gap:6px;margin-top:6px">
          <button onclick="reviewReplyComment(${c.id})" class="btn btn-primary btn-xs">Send Reply & Mark Done</button>
          <button onclick="reviewResolveComment(${c.id})" class="btn btn-secondary btn-xs">Mark Resolved</button>
        </div>
      </div>`:''}
      ${isOpen&&(role==='seo'||role==='admin')?`<div style="margin-top:8px">
        <button onclick="reviewDeleteComment(${c.id})" class="btn btn-secondary btn-xs" style="color:var(--accent)">Remove Comment</button>
      </div>`:''}
    </div>`;
  }).join('');
}

function reviewApplyHighlights() {
  if (!reviewComments.length) return;
  // Apply to all richtext editors
  document.querySelectorAll('.richtext-editor').forEach(editor => {
    let html = editor.innerHTML;
    // First clear existing highlights
    html = html.replace(/<span class="review-anchor[^"]*"[^>]*>(.*?)<\/span>/gi, '$1');
    editor.innerHTML = html;
    // Now apply highlights for each open comment with a text_anchor
    reviewComments.forEach(c => {
      if (!c.text_anchor) return;
      const color = c.status === 'open' ? '#FEF3C7' : '#D1FAE5';
      const border = c.status === 'open' ? '#F59E0B' : '#10B981';
      const escaped = c.text_anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      try {
        editor.innerHTML = editor.innerHTML.replace(
          new RegExp(escaped, 'g'),
          `<span class="review-anchor" data-comment-id="${c.id}" style="background:${color};border-bottom:2px solid ${border};border-radius:2px;cursor:pointer" title="${esc(c.comment_text)}">${c.text_anchor}</span>`
        );
      } catch(_) {}
    });
  });
  // Click on highlight scrolls to comment card
  document.querySelectorAll('.review-anchor').forEach(span => {
    span.addEventListener('click', function() {
      reviewScrollToComment(this.getAttribute('data-comment-id'));
    });
  });
}

function reviewScrollToComment(commentId) {
  const card = document.getElementById('comment_card_'+commentId);
  if (card) { card.scrollIntoView({behavior:'smooth',block:'center'}); card.style.boxShadow='0 0 0 3px var(--accent)'; setTimeout(()=>card.style.boxShadow='',2000); }
}

function reviewScrollToAnchor(commentId) {
  const span = document.querySelector(`.review-anchor[data-comment-id="${commentId}"]`);
  if (span) { span.scrollIntoView({behavior:'smooth',block:'center'}); }
}

// SEO: add a comment by selecting text
function reviewEnableSelectionMode() {
  reviewMode = true;
  document.querySelectorAll('.richtext-editor').forEach(ed => {
    ed.style.cursor = 'text';
    ed.setAttribute('data-review-mode', '1');
  });
  toast('Select any text in the content to add a comment.');
}

function reviewDisableSelectionMode() {
  reviewMode = false;
  document.querySelectorAll('.richtext-editor').forEach(ed => {
    ed.removeAttribute('data-review-mode');
    ed.style.cursor = '';
  });
  const addBox = $('reviewAddBox');
  if (addBox) addBox.style.display = 'none';
}

// When SEO selects text in review mode
document.addEventListener('mouseup', function(e) {
  const editor = e.target.closest('[data-review-mode]');
  if (!editor) return;
  const sel = window.getSelection();
  const selectedText = sel ? sel.toString().trim() : '';
  if (!selectedText || selectedText.length < 2) return;
  const addBox = $('reviewAddBox');
  if (!addBox) return;
  addBox.setAttribute('data-anchor', selectedText);
  addBox.style.display = 'block';
  $('reviewNewCommentText').value = '';
  $('reviewNewCommentText').focus();
});

async function reviewSaveNewComment() {
  if (!contentActive) return;
  const addBox = $('reviewAddBox');
  const anchor = addBox ? addBox.getAttribute('data-anchor') : '';
  const text = ($('reviewNewCommentText')?.value || '').trim();
  if (!text) { toast('Please enter a comment.', 'error'); return; }
  const btn = $('reviewSaveCommentBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
  try {
    await dbInsert('content_comments', {
      content_id: contentActive.id,
      created_by: SESSION.user_id,
      created_by_name: SESSION.full_name || SESSION.email,
      role: SESSION.role,
      text_anchor: anchor || '',
      comment_text: text,
      status: 'open'
    });
    if (addBox) addBox.style.display = 'none';
    toast('Comment added.');
    await reviewLoadComments(contentActive.id);
    reviewRenderPanel();
    reviewApplyHighlights();
    // Update open count badge
    reviewUpdateBadge();
  } catch(e) { toast('Could not save comment: '+e.message, 'error'); }
  finally { if(btn) { btn.disabled=false; btn.textContent='Add Comment'; } }
}

async function reviewReplyComment(commentId) {
  const replyText = ($('reply_input_'+commentId)?.value || '').trim();
  if (!replyText) { toast('Please type a reply.', 'error'); return; }
  try {
    await sbFetch('content_comments?id=eq.'+commentId, {method:'PATCH', body:JSON.stringify({
      reply_text: replyText,
      reply_by: SESSION.full_name || SESSION.email,
      reply_at: new Date().toISOString(),
      status: 'resolved'
    })});
    toast('Reply sent.');
    await reviewLoadComments(contentActive.id);
    reviewRenderPanel();
    reviewApplyHighlights();
    reviewUpdateBadge();
    // Check if all resolved → show re-submit button
    reviewCheckAllResolved();
  } catch(e) { toast('Error: '+e.message, 'error'); }
}

async function reviewResolveComment(commentId) {
  try {
    await sbFetch('content_comments?id=eq.'+commentId, {method:'PATCH', body:JSON.stringify({status:'resolved'})});
    toast('Marked resolved.');
    await reviewLoadComments(contentActive.id);
    reviewRenderPanel();
    reviewApplyHighlights();
    reviewUpdateBadge();
    reviewCheckAllResolved();
  } catch(e) { toast('Error: '+e.message, 'error'); }
}

async function reviewDeleteComment(commentId) {
  if (!confirm('Remove this comment?')) return;
  try {
    await sbFetch('content_comments?id=eq.'+commentId, {method:'DELETE'});
    toast('Comment removed.');
    await reviewLoadComments(contentActive.id);
    reviewRenderPanel();
    reviewApplyHighlights();
    reviewUpdateBadge();
  } catch(e) { toast('Error: '+e.message, 'error'); }
}

function reviewUpdateBadge() {
  const open = reviewComments.filter(c => c.status === 'open').length;
  const badge = $('reviewCommentBadge');
  if (badge) {
    badge.textContent = open > 0 ? open+' open' : '✓ All resolved';
    badge.style.background = open > 0 ? '#FEF3C7' : '#D1FAE5';
    badge.style.color = open > 0 ? '#92400E' : '#065F46';
    badge.style.border = open > 0 ? '1px solid #FCD34D' : '1px solid #6EE7B7';
  }
}

function reviewCheckAllResolved() {
  const openCount = reviewComments.filter(c => c.status === 'open').length;
  const resubBtn = $('reviewResubmitBtn');
  if (resubBtn) {
    if (openCount === 0 && reviewComments.length > 0) {
      resubBtn.style.display = 'inline-flex';
    } else {
      resubBtn.style.display = 'none';
    }
  }
}

// SEO: send content back to writer for revision
async function reviewSendBackToWriter() {
  if (!contentActive) return;
  const openCount = reviewComments.filter(c => c.status === 'open').length;
  if (!openCount) { toast('No open comments to send back. Add at least one comment first.', 'error'); return; }
  if (!confirm('Send this content back to the writer with '+openCount+' comment(s)?')) return;
  try {
    await dbUpdate(CONTENT_TABLE, contentActive.id, {
      needs_revision: true,
      writer_approved: false,
      revision_round: (contentActive.revision_round || 0) + 1
    });
    // Notify writer
    const writers = await sbFetch('user_profiles?role=eq.writer&select=id,full_name').catch(()=>null) || [];
    for (const w of writers) {
      await sendNotification(w.id, 'Content Revision Needed',
        'SEO has reviewed "'+contentActive.title+'" and left '+openCount+' comment(s). Please review and correct.',
        'info', 'content', contentActive.id);
    }
    toast('Sent back to writer with '+openCount+' comment(s).');
    logActivity('revision_sent', 'Sent back to writer: '+contentActive.title, contentActive.id, contentActive.title);
    reviewDisableSelectionMode();
    $('contentFS').classList.remove('show');
    document.body.style.overflow = '';
    contentActive = null;
    await loadContent();
  } catch(e) { toast('Error: '+e.message, 'error'); }
}

// Writer: re-submit after addressing all comments
async function reviewResubmitToSEO() {
  if (!contentActive) return;
  const openCount = reviewComments.filter(c => c.status === 'open').length;
  if (openCount > 0) { toast('Please resolve all '+openCount+' open comment(s) first.', 'error'); return; }
  if (!confirm('Re-submit to SEO? All comments are marked resolved.')) return;
  const ok = await contentSaveEdits(true);
  if (!ok) return;
  try {
    await dbUpdate(CONTENT_TABLE, contentActive.id, {
      writer_approved: true,
      needs_revision: false
    });
    toast('Re-submitted to SEO with corrections. ✓');
    logActivity('resubmitted', 'Writer resubmitted after revision: '+contentActive.title, contentActive.id, contentActive.title);
    $('contentFS').classList.remove('show');
    document.body.style.overflow = '';
    contentActive = null;
    await loadContent();
  } catch(e) { toast('Error: '+e.message, 'error'); }
}

// ═══════════════════════════════════════════════════════════════════
// FULLSCREEN OVERLAY
// ═══════════════════════════════════════════════════════════════════

async function contentOpenModal(id) {
  const row = contentRows.find(r => String(r.id) === id);
  if (!row) return;
  const role = SESSION?.role, cfg = CONTENT_ROLE_CFG[role];
  contentActive = row;
  reviewMode = false;

  // Load comments
  await reviewLoadComments(row.id);

  $('cfsTitle').textContent = row.title || 'Untitled';
  $('cfsSub').textContent = 'By '+(row.writer_name||'-')+' - '+formatDate(row.created_at);
  $('cfsMeta1').innerHTML = contentTypePill(row);
  $('cfsMeta2').innerHTML = contentBadge(contentGetStatus(row));
  $('cfsFieldsTitle').textContent = cfg ? cfg.fieldsTitle : 'All Fields';
  $('cfsFieldsWrap').innerHTML = contentBuildForm(row.content_type||'Blog', contentGetFields(row), cfg?cfg.readOnly:true, 'cm_');

  // Apply highlights from existing comments
  setTimeout(() => { reviewApplyHighlights(); }, 100);

  // Approve section
  if (cfg) {
    $('cfsApproveSection').style.display = 'block';
    const inner = $('cfsApproveInner');
    inner.className = 'approve-inner '+cfg.approveCls;
    $('cfsApproveLabel').className = 'approve-label '+cfg.approveCls;
    $('cfsApproveLabel').textContent = cfg.approveLabel;
    $('cfsApproveSub').textContent = cfg.approveSub;
    $('cfsToggle').className = 'toggle '+cfg.toggleCls;
    $('cfsToggleInput').checked = !!row[cfg.field];
    $('cfsToggleLabel').textContent = row[cfg.field] ? 'Approved' : 'Pending';
  } else { $('cfsApproveSection').style.display = 'none'; }

  // Show/hide revision-specific UI
  const isWriter = role === 'writer' || role === 'admin';
  const isSEO = role === 'seo' || role === 'admin';
  const hasRevision = row.needs_revision;

  // Revision notice for writer
  const revNotice = $('cfsRevisionNotice');
  if (revNotice) {
    if (hasRevision && isWriter) {
      revNotice.style.display = 'block';
      revNotice.innerHTML = `<div style="background:#FEF3C7;border:2px solid #FCD34D;border-radius:10px;padding:14px 16px;margin-bottom:16px">
        <div style="font-size:13px;font-weight:700;color:#92400E;margin-bottom:4px">⚠️ Revision Requested by SEO</div>
        <div style="font-size:12px;color:#78350F">SEO has left ${reviewComments.filter(c=>c.status==='open').length} comment(s) on this content. 
        Review each highlighted section, make corrections, and re-submit when done.</div>
      </div>`;
    } else {
      revNotice.style.display = 'none';
    }
  }

  // SEO review toolbar
  const reviewToolbar = $('cfsReviewToolbar');
  if (reviewToolbar) {
    if (isSEO && row.writer_approved && !row.seo_approved) {
      reviewToolbar.style.display = 'block';
    } else {
      reviewToolbar.style.display = 'none';
    }
  }

  // Comment panel
  const commentPanel = $('cfsCommentSidebar');
  if (commentPanel) {
    const showPanel = reviewComments.length > 0 || (isSEO && row.writer_approved && !row.seo_approved) || hasRevision;
    commentPanel.style.display = showPanel ? 'flex' : 'none';
    if (showPanel) {
      reviewRenderPanel();
      reviewUpdateBadge();
    }
  }

  // Re-submit button (writer)
  const resubBtn = $('reviewResubmitBtn');
  if (resubBtn) {
    const showResub = isWriter && hasRevision;
    resubBtn.style.display = 'none'; // hidden until all resolved
    if (showResub) {
      reviewCheckAllResolved();
    }
  }

  // Add comment box — hidden by default
  const addBox = $('reviewAddBox');
  if (addBox) addBox.style.display = 'none';

  // Designer post section
  const isDesigner = role === 'designer';
  $('cfsPostSection').style.display = isDesigner ? 'block' : 'none';
  $('cfsSaveBtn').style.display = cfg&&!cfg.readOnly ? 'inline-flex' : 'none';
  $('cfsUploadBtn').style.display = cfg&&!cfg.readOnly ? 'inline-flex' : 'none';

  if (isDesigner) {
    $('cfsSection').textContent = SECTION_NAMES[row.content_type] || 'Case Studies';
    $('cfsPostBtn').disabled = !row.designer_approved || !!row.posted_to_webflow;
    $('cfsPostBtn').textContent = 'Post to Webflow';
    const pr = $('cfsPostResult');
    if (row.posted_to_webflow) {
      pr.textContent = row.webflow_status==='live' ? 'Already posted live.' : 'Already saved as draft.';
      pr.style.color = row.webflow_status==='live' ? 'var(--green)' : 'var(--yellow)';
    } else pr.textContent = '';
    contentSelectPublish('draft');
  }

  $('contentFS').classList.add('show');
  document.body.style.overflow = 'hidden';
}

async function contentSaveEdits(quiet) {
  if(!contentActive) return true;
  const role=SESSION?.role, cfg=CONTENT_ROLE_CFG[role];
  if(!cfg||cfg.readOnly) return true;
  const ct=contentActive.content_type||'Blog';
  const collected=contentCollect(ct,'cm_');
  const ef=Object.assign({},safeJSON(contentActive.extra_fields,'{}'),collected);
  const content=collected[MAIN_SLUG[ct]]||'';
  const title=String(collected.name||contentActive.title||'').trim();
  if(!title){toast('Title cannot be empty.','error');return false;}
  try {
    await dbUpdate(CONTENT_TABLE,contentActive.id,{title,content,extra_fields:JSON.stringify(ef)});
    contentActive.title=title; contentActive.content=content; contentActive.extra_fields=JSON.stringify(ef);
    $('cfsTitle').textContent=title;
    if(!quiet) toast('Saved.');
    return true;
  } catch(e){toast('Save failed: '+e.message,'error');return false;}
}

async function cfsBack() {
  const role=SESSION?.role, cfg=CONTENT_ROLE_CFG[role];
  if(cfg&&!cfg.readOnly){const ok=await contentSaveEdits(true);if(!ok&&!confirm('Changes could not be saved. Leave anyway?'))return;}
  reviewDisableSelectionMode();
  $('contentFS').classList.remove('show'); document.body.style.overflow='';
  contentActive=null; reviewComments=[]; await loadContent();
}

function cfsDownloadWord() {
  if(!contentActive) return;
  const ct=contentActive.content_type||'Blog', fields=COLLECTION_FIELDS[ct]||[];
  let body=`<h1>${esc(contentActive.title||'Untitled')}</h1><hr>`;
  fields.forEach(f=>{
    if(f.type==='image') return;
    const ss=safeId(f.slug);
    let v='';
    if(f.type==='richtext'){const el=$('cm_rtf_'+ss);v=el?el.innerText:'';}
    else{const el=$('cm_ff_'+ss);v=el?el.value:'';}
    if(v.trim()) body+=`<label>${esc(f.label.toUpperCase())}:</label><p>${esc(v)}</p>`;
  });
  saveBlob(toWord(contentActive.title,body),'application/msword',slugify(contentActive.title)+'.doc');
  toast('Word downloaded.');
}

async function cfsUploadWord(input) {
  const file=input.files[0]; if(!file||!contentActive) return;
  const reader=new FileReader();
  reader.onload=function(){
    const ct=contentActive.content_type||'Blog', fields=COLLECTION_FIELDS[ct]||[];
    const text=new DOMParser().parseFromString(String(reader.result),'text/html').body?.textContent||'';
    let filled=0;
    fields.forEach((f,i)=>{
      if(f.type==='image') return;
      const label=f.label.toUpperCase()+':';
      const nf=fields.slice(i+1).find(x=>x.type!=='image');
      const nextLabel=nf?nf.label.toUpperCase()+':':null;
      const start=text.indexOf(label); if(start===-1) return;
      const vs=start+label.length;
      const end=nextLabel?text.indexOf(nextLabel,vs):text.length;
      const v=text.substring(vs,end!==-1?end:undefined).trim(); if(!v) return;
      const ss=safeId(f.slug);
      if(f.type==='richtext'){const el=$('cm_rtf_'+ss);if(el){el.innerHTML=esc(v).replace(/\n/g,'<br>');filled++;}}
      else{const el=$('cm_ff_'+ss);if(el){el.value=f.type==='text'?v.replace(/\s*\n\s*/g,' '):v;filled++;}}
    });
    toast(filled?filled+' field(s) loaded from Word.':'No labelled fields found in this file.', filled?'success':'error');
  };
  reader.readAsText(file); input.value='';
}

async function cfsToggle() {
  if(!contentActive) return;
  const role=SESSION?.role, cfg=CONTENT_ROLE_CFG[role]; if(!cfg) return;
  const box=$('cfsToggleInput'), checked=box.checked, wrap=$('cfsToggle');
  $('cfsToggleLabel').textContent=checked?'Approved':'Pending';
  wrap.classList.add('saving');
  try {
    if(!cfg.readOnly){const ok=await contentSaveEdits(true);if(!ok)throw new Error('Could not save edits.');}
    const data={}; data[cfg.field]=checked;
    if(role==='writer'&&checked&&contentActive.content) data.original_content=contentActive.content;
    await dbUpdate(CONTENT_TABLE,contentActive.id,data);
    contentActive[cfg.field]=checked;
    toast(checked?'Approved.':'Approval removed.');
    logActivity(checked?'approved':'unapproved',cfg.label+' approval',contentActive.id,contentActive.title);
    $('cfsMeta2').innerHTML=contentBadge(contentGetStatus(contentActive));
    if(role==='designer') $('cfsPostBtn').disabled=!checked;
    await loadContent();
  } catch(e){box.checked=!checked;$('cfsToggleLabel').textContent=!checked?'Approved':'Pending';toast('Could not save: '+e.message,'error');}
  finally{wrap.classList.remove('saving');}
}

function contentSelectPublish(mode) {
  contentPublishMode=mode;
  $('cfsOptDraft').className='publish-opt'+(mode==='draft'?' selected-draft':'');
  $('cfsOptLive').className='publish-opt'+(mode==='live'?' selected-live':'');
  $('cfsOptDraft').querySelector('.publish-opt-title').style.color=mode==='draft'?'var(--blue)':'var(--text)';
  $('cfsOptLive').querySelector('.publish-opt-title').style.color=mode==='live'?'var(--green)':'var(--text)';
  $('cfsPublishMode').textContent=mode==='draft'?'Save as Draft':'Publish Live';
}

async function cfsPost() {
  if(!contentActive?.designer_approved){toast('Please approve first.','error');return;}
  const btn=$('cfsPostBtn'), result=$('cfsPostResult');
  btn.disabled=true; btn.textContent='Posting...'; result.textContent='';
  try {
    const ct=contentActive.content_type||'Blog';
    const ef=contentGetFields(contentActive);
    const r=await fetch(WEBFLOW_EDGE,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+SUPA_KEY,apikey:SUPA_KEY},body:JSON.stringify({extra_fields:ef,row:{...contentActive,extra_fields:JSON.stringify(ef)},publish_mode:contentPublishMode})});
    const d=await r.json();
    if(!d.success) throw new Error(d.error||'Webflow rejected the post.');
    await dbUpdate(CONTENT_TABLE,contentActive.id,{posted_to_webflow:true,webflow_item_id:d.item_id,webflow_status:d.status});
    contentActive.posted_to_webflow=true; contentActive.webflow_status=d.status;
    const live=d.status==='live';
    toast(live?'Posted live on Webflow.':'Saved as draft in Webflow.');
    result.textContent=live?'Live on website.':'Saved as draft.'; result.style.color=live?'var(--green)':'var(--yellow)';
    logActivity('posted','Posted to Webflow as '+d.status,contentActive.id,contentActive.title);
    $('cfsMeta2').innerHTML=contentBadge(contentGetStatus(contentActive));
    await loadContent();
  } catch(e){toast('Webflow error: '+e.message,'error');result.textContent='Error: '+e.message;result.style.color='var(--accent)';btn.disabled=false;btn.textContent='Post to Webflow';}
}

// Writer add form
function contentTypeChange() {
  const t=$('contentNewType').value;
  const wrap=$('contentDynFields'); const inner=$('contentDynFieldsInner');
  contentPendingImages={};
  if(!t){wrap.style.display='none';inner.innerHTML='';return;}
  inner.innerHTML=contentBuildForm(t,{},false,'n_');
  wrap.style.display='block';
}

async function contentSubmitNew() {
  const type=$('contentNewType').value, writer=$('contentNewWriter').value.trim();
  if(!type){toast('Please select a content type.','error');return;}
  if(!writer){toast('Please enter your name.','error');return;}
  const ef=Object.assign(contentCollect(type,'n_'),contentPendingImages);
  const title=String(ef.name||'').trim();
  if(!title){toast('Please enter a title.','error');return;}
  const content=ef[MAIN_SLUG[type]]||'';
  const btn=$('contentSubmitBtn'); btn.disabled=true; btn.textContent='Adding...';
  try {
    await dbInsert(CONTENT_TABLE,{title,content,writer_name:writer,content_type:type,content_type_other:null,extra_fields:JSON.stringify(ef),image_url:ef[IMAGE_SLUG[type]]||null,writer_approved:false,seo_approved:false,cmo_approved:false,designer_approved:false,posted_to_webflow:false,needs_revision:false,revision_round:0});
    toast('Content added.');
    logActivity('created','New content: '+title,null,title);
    $('contentNewType').value=''; $('contentNewWriter').value='';
    contentPendingImages={};
    $('contentDynFields').style.display='none'; $('contentDynFieldsInner').innerHTML='';
    await loadContent();
  } catch(e){toast('Could not add: '+e.message,'error');}
  finally{btn.disabled=false;btn.textContent='Add Content';}
}

// Content bulk download
async function contentBulkWord() {
  const from=$('cdlFrom').value, to=$('cdlTo').value;
  let rows=contentRows.slice();
  if(from) rows=rows.filter(r=>new Date(r.created_at)>=new Date(from+'T00:00:00'));
  if(to) rows=rows.filter(r=>new Date(r.created_at)<=new Date(to+'T23:59:59'));
  if(!rows.length){toast('No content in that date range.','error');return;}
  let body=`<h1>QNu Labs Content Export (${rows.length} items)</h1>`;
  rows.forEach((row,i)=>{
    const ef=contentGetFields(row), fields=COLLECTION_FIELDS[row.content_type||'Blog']||[];
    body+=`<h2>${i+1}. ${esc(row.title||'Untitled')} (${esc(row.content_type||'')})</h2><p style="color:#666">Writer: ${esc(row.writer_name||'-')} | Date: ${formatDate(row.created_at)}</p>`;
    fields.forEach(f=>{if(f.type==='image')return;const v=String(ef[f.slug]||'').trim();if(v)body+=`<label>${esc(f.label.toUpperCase())}:</label><p>${esc(v)}</p>`;});
    body+='<hr>';
  });
  saveBlob(toWord('QNu Labs Content Export',body),'application/msword','QNu_Content_Export_'+new Date().toISOString().slice(0,10)+'.doc');
  toast(`Downloaded ${rows.length} item(s).`);
}

function toggleSelectAll(chk,cls){document.querySelectorAll('.'+cls).forEach(c=>c.checked=chk.checked);}

async function bulkDeleteContent(){
  const ids=[...document.querySelectorAll('.contentChk:checked')].map(c=>c.value);
  if(!ids.length){toast('Select items to delete','error');return;}
  if(!confirm('Delete '+ids.length+' content item(s)? This cannot be undone.')) return;
  for(const id of ids) await sbFetch('content_approvals?id=eq.'+id,{method:'DELETE'}).catch(()=>{});
  toast(ids.length+' item(s) deleted.'); logActivity('bulk_delete','Deleted '+ids.length+' content items'); await loadContent();
}
async function bulkDeleteProjects(){
  const ids=[...document.querySelectorAll('.projectChk:checked')].map(c=>c.value);
  if(!ids.length){toast('Select projects to delete','error');return;}
  if(!confirm('Delete '+ids.length+' project(s) and all their tasks/KPIs?')) return;
  for(const id of ids){
    await sbFetch('project_tasks?project_id=eq.'+id,{method:'DELETE'}).catch(()=>{});
    await sbFetch('project_kpis?project_id=eq.'+id,{method:'DELETE'}).catch(()=>{});
    await sbFetch('projects?id=eq.'+id,{method:'DELETE'}).catch(()=>{});
  }
  toast(ids.length+' project(s) deleted.'); await loadProjects();
}
async function bulkDeleteInventory(){
  const ids=[...document.querySelectorAll('.invChk:checked')].map(c=>c.value);
  if(!ids.length){toast('Select items to delete','error');return;}
  if(!confirm('Delete '+ids.length+' inventory item(s)?')) return;
  for(const id of ids) await sbFetch('inventory_items?id=eq.'+id,{method:'DELETE'}).catch(()=>{});
  toast(ids.length+' item(s) deleted.'); await loadInventory();
}

/* ── Inventory Excel import ── */
function downloadInventoryTemplate(e) {
  e.preventDefault();
  const ws=XLSX.utils.aoa_to_sheet([
    ['Item Name','Item Type','Quantity'],
    ['QNu Roll-up Banner','banners',5],
    ['Product Brochure','brochures',100],
  ]);
  ws['!cols']=[{wch:30},{wch:20},{wch:12}];
  var _wb1={SheetNames:['Inventory'],Sheets:{}}; _wb1.Sheets['Inventory']=ws;
  var _o1=XLSX.write(_wb1,{bookType:'xlsx',type:'binary'}),_b1=new ArrayBuffer(_o1.length),_v1=new Uint8Array(_b1);
  for(var _i1=0;_i1<_o1.length;_i1++) _v1[_i1]=_o1.charCodeAt(_i1)&0xFF;
  var _a1=document.createElement('a'); _a1.href=URL.createObjectURL(new Blob([_b1],{type:'application/octet-stream'})); _a1.download='Inventory_Import_Template.xlsx';
  document.body.appendChild(_a1); _a1.click(); document.body.removeChild(_a1); setTimeout(function(){URL.revokeObjectURL(_a1.href);},1500);
  toast('Template downloaded.');
}

async function importInventoryExcel(input) {
  const file=input.files[0]; if(!file) return;
  toast('Reading file...');
  const reader=new FileReader();
  reader.onload=async function(e){
    try {
      const wb=XLSX.read(e.target.result,{type:'binary'});
      const ws=wb.Sheets[wb.SheetNames[0]];
      const rows=XLSX.utils.sheet_to_json(ws,{defval:''});
      if(!rows.length){toast('No data found in file.','error');return;}
      const getVal=(row,keys)=>{
        for(const k of keys){const v=row[k]; if(v!==undefined&&v!==null&&String(v).trim()!=='') return String(v).trim();}
        for(const rk of Object.keys(row)){if(keys.some(k=>k.toLowerCase()===rk.toLowerCase())){const v=row[rk]; if(v!==undefined&&v!==null&&String(v).trim()!=='') return String(v).trim();}}
        return '';
      };
      const validCats=['banners','brochures','merchandise','digital','other'];
      const normCat=(s)=>{const sl=s.toLowerCase().trim();return validCats.find(c=>sl.includes(c))||'other';};
      let created=0, skipped=0, errors=0;
      for(const row of rows){
        const name=getVal(row,['Item Name','item name','Name','name']);
        if(!name){skipped++;continue;}
        const catRaw=getVal(row,['Item Type','item type','Category','category','Type','type']);
        const qty=parseInt(getVal(row,['Quantity','quantity','Qty','qty']))||0;
        const cat=normCat(catRaw||'other');
        try{
          const exist=await sbFetch('inventory_items?name=eq.'+encodeURIComponent(name)+'&select=id,quantity').catch(()=>null);
          if(exist&&exist.length){
            await sbFetch('inventory_items?id=eq.'+exist[0].id,{method:'PATCH',body:JSON.stringify({quantity:exist[0].quantity+qty,updated_by:SESSION?.user_id,updated_at:new Date().toISOString()})});
          } else {
            await dbInsert('inventory_items',{name,category:cat,quantity:qty,quantity_min:0,unit:'pcs',location:'',notes:'',created_by:SESSION?.user_id,updated_by:SESSION?.user_id});
          }
          created++;
        }catch(err){console.error('Inv import row error',name,err);errors++;}
      }
      toast(created+' item(s) imported'+(errors?' ('+errors+' errors)':'')+'.',errors&&!created?'error':'success');
      logActivity('import','Imported '+created+' inventory items from Excel');
      await loadInventory();
    } catch(err){toast('Could not read file: '+err.message,'error');}
  };
  reader.readAsBinaryString(file);
  input.value='';
}

async function bulkDeleteHR(){
  const ids=[...document.querySelectorAll('.hrChk:checked')].map(c=>c.value);
  if(!ids.length){toast('Select postings to delete','error');return;}
  if(!confirm('Delete '+ids.length+' HR posting(s)?')) return;
  for(const id of ids) await sbFetch('hr_posts?id=eq.'+id,{method:'DELETE'}).catch(()=>{});
  toast(ids.length+' posting(s) deleted.'); await loadHR();
}

function contentSetFilter(f,btn) {
  contentFilter=f;
  document.querySelectorAll('#contentFilterTabs .ftab').forEach(t=>t.classList.remove('active'));
  if(btn) btn.classList.add('active');
  contentRenderTable();
}
