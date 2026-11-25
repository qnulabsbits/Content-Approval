/* ═══════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════ */
async function init() {
  SESSION=readSession();
  if(SESSION&&SESSION.expires_at&&SESSION.expires_at-Date.now()/1000<60){
    const ok=await refreshToken();
    if(!ok){SESSION=null;try{localStorage.removeItem('mo_session');}catch(_){}}
  }
  if(SESSION){buildSidebar();setScreen('app');goHome();}
  else setScreen('login');
  ['loginEmail','loginPw'].forEach(id=>{
    const el=$(id); if(el) el.addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});
  });
}
init().catch(e=>{console.error(e);try{setScreen('login');}catch(_){}});

// Show writer add form only for writers
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initChat, 1500);
});
