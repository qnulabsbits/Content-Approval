async function loadLoginBanner(){
  if(!SESSION) return;
  if(SESSION._bannerDismissed) return;
  try{if(sessionStorage.getItem('banner_dismissed')==='1') return;}catch(_){}
  const items=[];
  try{
    const tasks=await sbFetch("task_assignments?assigned_to=eq."+SESSION.user_id+"&completed=eq.false&dismissed=eq.false&select=*")||[];
    tasks.forEach(t=>{if(t.task_title&&t.task_title.trim()) items.push({html:"<b>Task from "+esc(t.assigned_by_name||"Admin")+"</b>: "+esc(t.task_title),type:"task",id:t.id});});
  }catch(_){}
  try{
    const role=SESSION.role;
    const fm={seo:"writer_approved=eq.true&seo_approved=eq.false",cmo:"seo_approved=eq.true&cmo_approved=eq.false",designer:"cmo_approved=eq.true&designer_approved=eq.false",writer:"writer_approved=eq.false"};
    if(fm[role]){
      const pending=await sbFetch("content_approvals?"+fm[role]+"&select=id,title")||[];
      pending.slice(0,5).forEach(c=>{if(c.title&&c.title.trim()) items.push({html:"<b>Content pending your review</b>: "+esc(c.title),type:"content",id:c.id});});
    }
  }catch(_){}
  try{
    if(SESSION.full_name){
      const pt=await sbFetch("project_tasks?assignee_name=eq."+encodeURIComponent(SESSION.full_name)+"&status=neq.done&select=id,title,project_id")||[];
      pt.slice(0,5).forEach(t=>{if(t.title&&t.title.trim()) items.push({html:"<b>Project task assigned to you</b>: "+esc(t.title),type:"project",id:t.project_id});});
    }
  }catch(_){}
  if(!items.length) return;
  const track=document.getElementById("bannerTrack"), banner=document.getElementById("loginBanner");
  if(!track||!banner) return;
  const all=[...items,...items,...items];
  track.innerHTML=all.map(it=>"<div class=\"banner-item\" onclick=\"bannerClick('"+it.type+"','"+it.id+"')\">"+it.html+"</div>").join("");
  banner.classList.add("show");
  const am=document.querySelector(".app-main"); if(am) am.style.marginTop="34px";
}
function bannerClick(type,id){
  if(type==="content") showPage("content");
  else { showPage("projects"); if(id&&id!=="undefined") setTimeout(function(){try{openProjectModal(id);}catch(_){}},600); }
}
function closeBanner(){
  var b=document.getElementById("loginBanner"); if(b) b.classList.remove("show");
  var am=document.querySelector(".app-main"); if(am) am.style.marginTop="";
  if(SESSION) SESSION._bannerDismissed=true;
  try{sessionStorage.setItem('banner_dismissed','1');}catch(_){}
}
