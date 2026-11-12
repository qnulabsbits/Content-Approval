/* ═══════════════════════════════════════════════════════════════
   CHAT SYSTEM — Supabase Realtime
═══════════════════════════════════════════════════════════════ */
const CHAT_BUCKET = 'chat-files';
const EMOJI_LIST = ['👍','❤️','😂','😮','😢','🔥','✅','👏','🎉','💡','❓','⚠️','🙌','💪','🤝'];

let chatOpen = false;
let chatView = 'list'; // 'list' | 'messages' | 'new-dm' | 'new-group'
let activeConvId = null;
let conversations = [];
let convMessages = {};       // convId → messages[]
let convMembers = {};        // convId → members[]
let chatRealtime = null;
let typingTimer = null;
let typingUsers = {};        // convId → {userId: {name, ts}}
let replyingTo = null;       // message object
let selectedUsers = [];      // for new DM / group
let chatUnreadTotal = 0;
let chatInitDone = false;

/* ── helpers ── */
const chatEsc = s => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const cq = id => document.getElementById(id);
const chatFmt = s => { const d=new Date(s); return isNaN(d)?'':d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}); };
const chatFmtDay = s => { const d=new Date(s); return isNaN(d)?'':d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); };
const sameDay = (a,b) => new Date(a).toDateString()===new Date(b).toDateString();
const fileSize = b => b>1048576?(b/1048576).toFixed(1)+' MB':b>1024?(b/1024).toFixed(0)+' KB':b+' B';
const isImage = t => t&&t.startsWith('image/');

/* ── init ── */
async function initChat() {
  if(!SESSION||chatInitDone) return;
  chatInitDone = true;
  await loadConversations();
  subscribeRealtime();
  loadTaskAssignments();
  setInterval(loadTaskAssignments, 30000);
  setInterval(cleanExpiredTyping, 4000);
  setInterval(loadConversations, 15000);
  cleanOldMessages();
}

async function initChatBadge() {
  if(!SESSION) return;
  try {
    const memberships=await sbFetch('chat_members?user_id=eq.'+SESSION.user_id+'&select=conversation_id,last_read_at')||[];
    if(!memberships.length) return;
    const ids=memberships.map(m=>m.conversation_id);
    const lastMsgs=await sbFetch('chat_messages?conversation_id=in.('+ids.join(',')+')'
      +'&order=created_at.desc&select=conversation_id,sender_id,created_at')||[];
    let unread=0;
    for(const m of memberships){
      const last=lastMsgs.find(msg=>msg.conversation_id===m.conversation_id);
      if(last&&last.sender_id!==SESSION.user_id&&new Date(last.created_at)>new Date(m.last_read_at)) unread++;
    }
    const badge=cq('chatFabBadge');
    if(badge){
      const prev=parseInt(badge.textContent)||0, n=Math.min(99,unread);
      badge.textContent=n>9?'9+':n; badge.classList.toggle('show',n>0);
      if(n>prev&&n>0){badge.style.animation='none';requestAnimationFrame(function(){badge.style.animation='';});}
    }
  } catch(_){}
}

async function cleanOldMessages() {
  // Delete messages older than 15 days — runs silently on login
  try {
    const cutoff = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
    await sbFetch('chat_messages?created_at=lt.'+encodeURIComponent(cutoff), {
      method: 'DELETE'
    });
  } catch(_) { /* non-critical, ignore errors */ }
}

/* ── conversations ── */
async function loadConversations() {
  try {
    // Get all conversation IDs this user is a member of
    const memberships = await sbFetch('chat_members?user_id=eq.'+SESSION.user_id+'&select=conversation_id')||[];
    const isAdmin = SESSION.role==='admin';

    let convIds;
    if(isAdmin) {
      // Admin sees all conversations
      const allConvs = await sbFetch('chat_conversations?order=updated_at.desc&select=id')||[];
      convIds = allConvs.map(c=>c.id);
    } else {
      convIds = memberships.map(m=>m.conversation_id);
    }

    if(!convIds.length){ conversations=[]; renderConvList(); return; }

    const convData = await sbFetch('chat_conversations?id=in.('+convIds.join(',')+')&order=updated_at.desc&select=*')||[];
    conversations = convData;

    // Load members for each conv
    for(const conv of conversations){
      const members = await sbFetch('chat_members?conversation_id=eq.'+conv.id+'&select=*')||[];
      convMembers[conv.id] = members;
    }

    // Load last message for each conv
    for(const conv of conversations){
      const msgs = await sbFetch('chat_messages?conversation_id=eq.'+conv.id+'&order=created_at.desc&limit=1&select=*')||[];
      conv._lastMsg = msgs[0]||null;
    }

    updateChatUnread();
    renderConvList();
  } catch(e){ console.error('loadConversations',e); }
}

async function updateChatUnread() {
  let total=0;
  for(const conv of conversations){
    const myMember = (convMembers[conv.id]||[]).find(m=>m.user_id===SESSION.user_id);
    if(!myMember||!conv._lastMsg) continue;
    const lastRead = myMember.last_read_at;
    if(conv._lastMsg.sender_id!==SESSION.user_id && new Date(conv._lastMsg.created_at)>new Date(lastRead)) total++;
  }
  chatUnreadTotal = total;
  const badge = cq('chatFabBadge');
  if(badge){ badge.textContent=total>9?'9+':total; badge.classList.toggle('show',total>0); }
}

/* ── render conversation list ── */
function renderConvList() {
  const c=cq('chatConvList'); if(!c) return;
  if(!conversations.length){
    c.innerHTML='<div style="text-align:center;padding:32px 16px;color:var(--muted);font-size:13px">No conversations yet.<br>Start a new chat below.</div>';
    return;
  }
  c.innerHTML = conversations.map(conv=>{
    const isGroup = conv.type==='group';
    const members = convMembers[conv.id]||[];
    const myMember = members.find(m=>m.user_id===SESSION.user_id);
    const otherMembers = members.filter(m=>m.user_id!==SESSION.user_id);
    const name = isGroup ? conv.name : (otherMembers[0]?.user_name||'Unknown');
    const initials = isGroup ? (conv.name||'G').slice(0,2).toUpperCase() : (name||'?')[0].toUpperCase();
    const lastMsg = conv._lastMsg;
    const preview = lastMsg ? (lastMsg.file_name?'📎 '+lastMsg.file_name:(lastMsg.content||'')).slice(0,40) : 'No messages yet';
    const time = lastMsg ? chatFmt(lastMsg.created_at) : '';
    const isUnread = myMember && lastMsg && lastMsg.sender_id!==SESSION.user_id && new Date(lastMsg.created_at)>new Date(myMember.last_read_at);
    return `<div class="chat-conv-item${activeConvId===conv.id?' active':''}" onclick="openConversation(${conv.id})">
      <div class="chat-conv-avatar${isGroup?' group':''}">${chatEsc(initials)}</div>
      <div class="chat-conv-info">
        <div class="chat-conv-name">${chatEsc(name)}${isGroup?` <span style="font-size:9px;color:var(--muted)">(${members.length})</span>`:''}</div>
        <div class="chat-conv-preview">${chatEsc(preview)}</div>
      </div>
      <div class="chat-conv-meta">
        <div class="chat-conv-time">${chatEsc(time)}</div>
        ${isUnread?'<div class="chat-unread">1</div>':''}
      </div>
    </div>`;
  }).join('');
}

/* ── open a conversation ── */
async function openConversation(convId) {
  activeConvId = convId;
  chatView = 'messages';
  renderConvList(); // update active highlight
  const conv = conversations.find(c=>c.id===convId);
  const members = convMembers[convId]||[];
  const isGroup = conv?.type==='group';
  const otherMembers = members.filter(m=>m.user_id!==SESSION.user_id);
  const name = isGroup ? conv?.name : (otherMembers[0]?.user_name||'Unknown');
  const initials = isGroup?(conv?.name||'G').slice(0,2).toUpperCase():(name||'?')[0].toUpperCase();
  cq('chatConvView').style.display='none';
  const mv = cq('chatMsgView');
  mv.classList.add('show');
  cq('chatMsgName').textContent=name||'Chat';
  cq('chatMsgAvatar').textContent=initials;
  cq('chatMsgAvatar').className='chat-msg-avatar'+(isGroup?' group':'');
  const memberNames = members.map(m=>m.user_name).join(', ');
  cq('chatMsgMembers').textContent=isGroup?memberNames:'';
  replyingTo=null; cq('chatReplyPreview').style.display='none';
  await loadMessages(convId);
  markRead(convId);
  cq('chatMsgInput').focus();
}

async function loadMessages(convId) {
  try {
    const msgs = await sbFetch('chat_messages?conversation_id=eq.'+convId+'&order=created_at.asc&limit=200&select=*')||[];
    convMessages[convId] = msgs;
    renderMessages(convId);
  } catch(e){ console.error('loadMessages',e); }
}

function renderMessages(convId) {
  const c=cq('chatMsgList'); if(!c||activeConvId!==convId) return;
  const msgs = convMessages[convId]||[];
  if(!msgs.length){ c.innerHTML='<div style="text-align:center;padding:24px;font-size:12px;color:var(--muted)">No messages yet. Say hello!</div>'; return; }
  let html='', lastDay='';
  msgs.forEach((msg,i)=>{
    if(msg.deleted_at){
      html+=`<div style="text-align:center;font-size:11px;color:var(--muted);padding:3px 0;font-style:italic">Message deleted</div>`;
      return;
    }
    const day=chatFmtDay(msg.created_at);
    if(day!==lastDay){ html+=`<div class="chat-msg-day">${chatEsc(day)}</div>`; lastDay=day; }
    const isMine = msg.sender_id===SESSION.user_id;
    const nextMsg = msgs[i+1];
    const isLast = !nextMsg||nextMsg.sender_id!==msg.sender_id;
    const reactions = msg.reactions||{};
    const reactionHtml = Object.entries(reactions).map(([emoji,users])=>{
      const myReact = users.includes(SESSION.user_id);
      return `<button class="chat-reaction-btn${myReact?' mine':''}" onclick="toggleReaction(${msg.id},'${chatEsc(emoji)}')">${emoji}<span class="chat-reaction-count">${users.length}</span></button>`;
    }).join('');

    html+=`<div class="chat-bubble-wrap ${isMine?'mine':'theirs'}" id="msg_${msg.id}">
      ${!isMine&&isLast?`<div class="chat-bubble-sender">${chatEsc(msg.sender_name||'')}</div>`:''}
      <div class="chat-bubble" ondblclick="startReply(${msg.id})">
        ${msg.reply_to_id?`<div class="chat-reply-ref"><div class="chat-reply-ref-name">${chatEsc(msg.reply_to_sender||'')}</div><div class="chat-reply-ref-text">${chatEsc(msg.reply_to_content||'')}</div></div>`:''}
        ${msg.file_url?renderFileInBubble(msg):''}
        ${msg.content?renderChatContent(msg.content):''}
      </div>
      ${reactionHtml?`<div class="chat-reactions">${reactionHtml}</div>`:''}
      <div class="chat-bubble-meta">
        <div class="chat-msg-actions">
          <button class="chat-msg-action" onclick="startReply(${msg.id})" title="Reply">↩</button>
          <button class="chat-msg-action" onclick="showEmojiReact(${msg.id})" title="React">😊</button>
          ${isMine?`<button class="chat-msg-action" style="color:var(--accent)" onclick="deleteMessage(${msg.id})" title="Delete">✕</button>`:''}
        </div>
        <div class="chat-bubble-time">${chatFmt(msg.created_at)}</div>
      </div>
    </div>`;
  });
  c.innerHTML=html;
  c.scrollTop=c.scrollHeight;
}

function renderFileInBubble(msg) {
  if(isImage(msg.file_type)){
    return `<img class="chat-file-img" src="${chatEsc(msg.file_url)}" alt="${chatEsc(msg.file_name)}" onclick="window.open('${chatEsc(msg.file_url)}','_blank')"/>`;
  }
  const icon = msg.file_type?.includes('pdf')?'📄':msg.file_type?.includes('word')||msg.file_type?.includes('doc')?'📝':msg.file_type?.includes('sheet')||msg.file_type?.includes('excel')||msg.file_type?.includes('xls')?'📊':'📎';
  return `<a class="chat-file-attach" href="${chatEsc(msg.file_url)}" target="_blank" download="${chatEsc(msg.file_name)}">
    <span class="chat-file-icon">${icon}</span>
    <div class="chat-file-info"><div class="chat-file-name">${chatEsc(msg.file_name)}</div><div class="chat-file-size">${fileSize(msg.file_size||0)}</div></div>
  </a>`;
}

/* ── send message ── */
async function sendChatMessage() {
  if(!activeConvId||!SESSION) return;
  const input=cq('chatMsgInput');
  const content=input.value.trim();
  const fileInput=cq('chatFileInput');
  const file=fileInput?.files[0];
  if(!content&&!file) return;
  const btn=cq('chatSendBtn'); btn.disabled=true;
  try {
    let fileUrl=null, fileName=null, fileType=null, fileBytes=null;
    if(file){
      if(file.size>5*1024*1024){toast('File must be under 5MB','error');btn.disabled=false;return;}
      const ext=(file.name.split('.').pop()||'bin').toLowerCase();
      const path='chat/'+Date.now()+'_'+Math.random().toString(36).slice(2)+'.'+ext;
      const token=await getToken();
      const r=await fetch(SUPA_STORAGE+'/object/'+CHAT_BUCKET+'/'+path,{
        method:'POST',headers:{apikey:SUPA_KEY,Authorization:'Bearer '+token,'Content-Type':file.type||'application/octet-stream','x-upsert':'true'},body:file
      });
      if(!r.ok){const e=await r.text();throw new Error(e);}
      fileUrl=SUPA_STORAGE+'/object/public/'+CHAT_BUCKET+'/'+path;
      fileName=file.name; fileType=file.type; fileBytes=file.size;
      fileInput.value=''; cq('chatFilePreview')?.remove();
    }
    const msgData={
      conversation_id:activeConvId,
      sender_id:SESSION.user_id,
      sender_name:SESSION.full_name||SESSION.email||'',
      content:content||'',
      reply_to_id:replyingTo?.id||null,
      reply_to_content:replyingTo?.content||replyingTo?.file_name||null,
      reply_to_sender:replyingTo?.sender_name||null,
      file_url:fileUrl, file_name:fileName, file_type:fileType, file_size:fileBytes,
      reactions:{}
    };
    await dbInsert('chat_messages',msgData);
    input.value='';
    replyingTo=null; cq('chatReplyPreview').style.display='none';
    // Update conv updated_at
    await sbFetch('chat_conversations?id=eq.'+activeConvId,{method:'PATCH',body:JSON.stringify({updated_at:new Date().toISOString()})});
    stopTyping();
  } catch(e){ toast('Send failed: '+e.message,'error'); }
  finally{ btn.disabled=false; }
}

/* ── reply ── */
function startReply(msgId) {
  const msgs=convMessages[activeConvId]||[];
  const msg=msgs.find(m=>m.id===msgId); if(!msg) return;
  replyingTo=msg;
  const prev=cq('chatReplyPreview');
  cq('chatReplyName').textContent=msg.sender_name||'';
  cq('chatReplyText').textContent=msg.content||msg.file_name||'';
  prev.style.display='flex';
  cq('chatMsgInput').focus();
}
function cancelReply(){ replyingTo=null; cq('chatReplyPreview').style.display='none'; }

/* ── reactions ── */
function showEmojiReact(msgId) {
  const picker=cq('chatEmojiReactPicker');
  picker.innerHTML=EMOJI_LIST.map(e=>`<div class="emoji-item" onclick="toggleReaction(${msgId},'${e}');closeEmojiPickers()">${e}</div>`).join('');
  picker.style.display=picker.style.display==='grid'?'none':'grid';
  picker.dataset.msgId=msgId;
}
function closeEmojiPickers(){ ['chatEmojiPicker','chatEmojiReactPicker'].forEach(id=>{const el=cq(id);if(el)el.style.display='none';}); }
async function toggleReaction(msgId,emoji) {
  const msgs=convMessages[activeConvId]||[];
  const msg=msgs.find(m=>m.id===msgId); if(!msg) return;
  const reactions=JSON.parse(JSON.stringify(msg.reactions||{}));
  if(!reactions[emoji]) reactions[emoji]=[];
  const idx=reactions[emoji].indexOf(SESSION.user_id);
  if(idx>-1) reactions[emoji].splice(idx,1); else reactions[emoji].push(SESSION.user_id);
  if(!reactions[emoji].length) delete reactions[emoji];
  try{
    await dbUpdate('chat_messages',msgId,{reactions});
    msg.reactions=reactions;
    renderMessages(activeConvId);
  }catch(e){toast('Could not react','error');}
}

/* ── delete ── */
async function deleteMessage(msgId) {
  if(!confirm('Delete this message?')) return;
  try{
    await dbUpdate('chat_messages',msgId,{deleted_at:new Date().toISOString(),content:'',file_url:null});
    const msgs=convMessages[activeConvId]||[];
    const msg=msgs.find(m=>m.id===msgId);
    if(msg){msg.deleted_at=new Date().toISOString();msg.content='';msg.file_url=null;}
    renderMessages(activeConvId);
  }catch(e){toast('Could not delete','error');}
}

/* ── emoji input ── */
function toggleEmojiPicker(){
  const p=cq('chatEmojiPicker');
  if(p.style.display==='grid'){p.style.display='none';return;}
  p.innerHTML=EMOJI_LIST.map(e=>`<div class="emoji-item" onclick="insertEmoji('${e}')">${e}</div>`).join('');
  p.style.display='grid';
}
function insertEmoji(e){
  const inp=cq('chatMsgInput');
  const s=inp.selectionStart,en=inp.selectionEnd;
  inp.value=inp.value.slice(0,s)+e+inp.value.slice(en);
  inp.selectionStart=inp.selectionEnd=s+e.length;
  inp.focus(); closeEmojiPickers();
}

/* ── typing ── */
function onChatInput(){
  if(!activeConvId) return;
  clearTimeout(typingTimer);
  sbFetch('chat_typing',{method:'POST',body:JSON.stringify({conversation_id:activeConvId,user_id:SESSION.user_id,user_name:SESSION.full_name||SESSION.email||'',updated_at:new Date().toISOString()})}).catch(()=>{});
  typingTimer=setTimeout(stopTyping,3000);
}
function stopTyping(){
  if(!activeConvId) return;
  sbFetch('chat_typing?conversation_id=eq.'+activeConvId+'&user_id=eq.'+SESSION.user_id,{method:'DELETE'}).catch(()=>{});
}
function cleanExpiredTyping(){
  const now=Date.now();
  Object.keys(typingUsers).forEach(convId=>{
    Object.keys(typingUsers[convId]).forEach(uid=>{
      if(now-typingUsers[convId][uid].ts>4000) delete typingUsers[convId][uid];
    });
  });
  if(activeConvId) renderTyping();
}
function renderTyping(){
  const row=cq('chatTypingRow'); if(!row) return;
  const users=typingUsers[activeConvId]||{};
  const names=Object.values(users).filter(u=>u.uid!==SESSION.user_id).map(u=>u.name);
  if(!names.length){row.innerHTML='';return;}
  const label=names.length===1?names[0]+' is typing':names.length===2?names.join(' & ')+' are typing':names.length+' people are typing';
  row.innerHTML=`${chatEsc(label)}<div class="chat-typing-dots"><span></span><span></span><span></span></div>`;
}

/* ── mark read ── */
async function markRead(convId){
  if(!SESSION||!convId) return;
  const myMember=(convMembers[convId]||[]).find(m=>m.user_id===SESSION.user_id);
  if(!myMember) return;
  sbFetch('chat_members?conversation_id=eq.'+convId+'&user_id=eq.'+SESSION.user_id,{method:'PATCH',body:JSON.stringify({last_read_at:new Date().toISOString()})}).catch(()=>{});
  if(myMember) myMember.last_read_at=new Date().toISOString();
  updateChatUnread();
}

/* ── realtime ── */
function subscribeRealtime(){
  if(chatRealtime) return;
  const {createClient} = window.supabase||{};
  // Use native Supabase JS if available, else fall back to polling
  if(window.RealtimeChannel) {
    chatRealtime=true;
    // Subscribe via supabase-js v2 global if loaded
    return;
  }
  // Polling fallback — refresh every 5s when chat is open
  setInterval(async()=>{
    initChatBadge();
    if(!chatOpen) return;
    if(activeConvId&&chatView==='messages'){
      const msgs=await sbFetch('chat_messages?conversation_id=eq.'+activeConvId+'&order=created_at.asc&limit=200&select=*').catch(()=>null);
      if(msgs){
        const prev=convMessages[activeConvId]||[];
        if(msgs.length!==prev.length||(msgs[msgs.length-1]?.id!==prev[prev.length-1]?.id)){
          const hadNew=msgs.length>prev.length&&msgs[msgs.length-1]?.sender_id!==SESSION.user_id;
          convMessages[activeConvId]=msgs;
          renderMessages(activeConvId);
          markRead(activeConvId);
          if(hadNew) playChatChime();
        }
      }
      // Typing
      const typing=await sbFetch('chat_typing?conversation_id=eq.'+activeConvId+'&user_id=neq.'+SESSION.user_id+'&select=*').catch(()=>null);
      if(typing){
        typingUsers[activeConvId]={};
        typing.forEach(t=>{
          if(Date.now()-new Date(t.updated_at).getTime()<5000){
            typingUsers[activeConvId][t.user_id]={name:t.user_name,uid:t.user_id,ts:new Date(t.updated_at).getTime()};
          }
        });
        renderTyping();
      }
    }
    await loadConversations();
  },3000);
}

/* ── create DM ── */
async function openNewDM(){
  chatView='new-dm'; selectedUsers=[];
  await renderUserPickerModal('new-dm','New Direct Message','Select a person to message','Start Chat',startDM);
}
async function startDM(){
  if(!selectedUsers.length){toast('Please select a user','error');return;}
  const other=selectedUsers[0];
  // Check if DM already exists
  for(const conv of conversations){
    if(conv.type==='dm'){
      const members=convMembers[conv.id]||[];
      if(members.length===2&&members.some(m=>m.user_id===other.id)&&members.some(m=>m.user_id===SESSION.user_id)){
        closeChatModal(); openConversation(conv.id); return;
      }
    }
  }
  try{
    const conv=await dbInsert('chat_conversations',{type:'dm',created_by:SESSION.user_id});
    const cid=Array.isArray(conv)?conv[0].id:conv.id;
    await dbInsert('chat_members',{conversation_id:cid,user_id:SESSION.user_id,user_name:SESSION.full_name||SESSION.email||''});
    await dbInsert('chat_members',{conversation_id:cid,user_id:other.id,user_name:other.name});
    await loadConversations(); closeChatModal(); openConversation(cid);
    toast('Chat started with '+other.name+'.');
  }catch(e){toast('Could not start chat: '+e.message,'error');}
}

/* ── create group ── */
async function openNewGroup(){
  chatView='new-group'; selectedUsers=[];
  await renderUserPickerModal('new-group','New Group Chat','Select members (2 or more)','Create Group',createGroup,true);
}
async function createGroup(){
  const groupName=cq('chatGroupName')?.value.trim();
  if(!groupName){toast('Please enter a group name','error');return;}
  if(selectedUsers.length<1){toast('Select at least one other member','error');return;}
  try{
    const conv=await dbInsert('chat_conversations',{type:'group',name:groupName,created_by:SESSION.user_id});
    const cid=Array.isArray(conv)?conv[0].id:conv.id;
    await dbInsert('chat_members',{conversation_id:cid,user_id:SESSION.user_id,user_name:SESSION.full_name||SESSION.email||''});
    for(const u of selectedUsers){
      await dbInsert('chat_members',{conversation_id:cid,user_id:u.id,user_name:u.name});
    }
    await loadConversations(); closeChatModal(); openConversation(cid);
    toast('Group "'+groupName+'" created.');
  }catch(e){toast('Could not create group: '+e.message,'error');}
}

/* ── user picker modal ── */
async function renderUserPickerModal(mode,title,sub,btnLabel,onConfirm,isGroup=false){
  const modal=cq('chatInnerModal'); modal.classList.add('show');
  const users=await loadUsersForAssignee()||[];
  const others=users.filter(u=>u.id!==SESSION.user_id);
  modal.innerHTML=`
    <div class="chat-modal-header">
      <button class="chat-msg-back" onclick="closeChatModal()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
      <div><div class="chat-header-title">${chatEsc(title)}</div><div style="font-size:11px;color:var(--muted)">${chatEsc(sub)}</div></div>
    </div>
    <div class="chat-modal-body">
      ${isGroup?`<div class="field-group" style="margin-bottom:12px"><div class="field-label">Group Name</div><input class="field-input" id="chatGroupName" placeholder="e.g. Marketing Team"/></div>`:''}
      <div id="chatUserPickList">${others.map(u=>`
        <div class="chat-user-item" id="cup_${u.id}" onclick="toggleChatUser('${u.id}','${chatEsc(u.full_name||u.name||u.email||'')}',this)">
          <div class="chat-user-check" id="cupcheck_${u.id}">✓</div>
          <div class="chat-conv-avatar" style="width:30px;height:30px;font-size:11px;flex-shrink:0">${chatEsc((u.full_name||u.name||'?')[0].toUpperCase())}</div>
          <div>
            <div style="font-size:13px;font-weight:600">${chatEsc(u.full_name||u.name||'')}</div>
            <div style="font-size:11px;color:var(--muted)">${chatEsc(u.department||u.role||'')}</div>
          </div>
        </div>`).join('')}
      </div>
    </div>
    <div class="chat-modal-footer">
      <button class="btn btn-primary" style="width:100%" onclick="chatConfirmAction()">${chatEsc(btnLabel)}</button>
    </div>`;
  window._chatConfirmAction=onConfirm;
}
function chatConfirmAction(){ if(window._chatConfirmAction) window._chatConfirmAction(); }
function toggleChatUser(uid,name,el){
  const idx=selectedUsers.findIndex(u=>u.id===uid);
  if(idx>-1){ selectedUsers.splice(idx,1); el.classList.remove('selected'); }
  else{ selectedUsers.push({id:uid,name}); el.classList.add('selected'); }
}
function closeChatModal(){ cq('chatInnerModal').classList.remove('show'); cq('chatInnerModal').innerHTML=''; }

/* ── file attach ── */
function onChatFileSelect(input){
  const file=input.files[0]; if(!file) return;
  if(file.size>5*1024*1024){toast('File must be under 5MB','error');input.value='';return;}
  const prev=cq('chatFilePreviewWrap');
  if(prev){ prev.remove(); }
  const wrap=document.createElement('div');
  wrap.id='chatFilePreviewWrap';
  wrap.style.cssText='display:flex;align-items:center;gap:8px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:6px 10px;margin-bottom:6px;font-size:12px;';
  wrap.innerHTML=`<span>📎 ${chatEsc(file.name)} (${fileSize(file.size)})</span><button onclick="clearChatFile()" style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:14px">✕</button>`;
  cq('chatInputArea').insertBefore(wrap,cq('chatInputArea').firstChild);
}
function clearChatFile(){
  cq('chatFileInput').value='';
  cq('chatFilePreviewWrap')?.remove();
}

/* ── toggle chat panel ── */
function toggleChat(){
  chatOpen=!chatOpen;
  const panel=cq('chatPanel');
  if(chatOpen){ panel.classList.add('show'); initChat(); }
  else{ panel.classList.remove('show'); closeEmojiPickers(); stopTyping(); }
}
function backToConvList(){
  activeConvId=null; chatView='list'; stopTyping();
  cq('chatMsgView').classList.remove('show');
  cq('chatConvView').style.display='block';
}
