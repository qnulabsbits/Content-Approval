/* ═══════════════════════════════════════════════════
   INVENTORY MODULE
═══════════════════════════════════════════════════ */
let inventoryItems=[], invFilter='all';
let inventoryCart={};
const INV_CATEGORIES=['banners','brochures','merchandise','digital','other'];

async function loadInventory() {
  try {
    inventoryItems=await sbFetch('inventory_items?order=name.asc&select=*')||[];
    renderInventoryStats();
    renderInventoryTable();
  } catch(e){
    const c=$('inventoryTable');
    if(c) c.innerHTML=`<div class="empty-state"><div class="empty-title">Could not load inventory</div><div class="empty-sub">${esc(e.message)}</div></div>`;
  }
}

function renderInventoryStats() {
  const s=(id,v)=>{const el=$(id);if(el)el.textContent=v;};
  s('is0',inventoryItems.length);
  s('is1',inventoryItems.reduce((a,i)=>a+(i.quantity||0),0));
  s('is2',inventoryItems.filter(i=>i.quantity>0&&i.quantity<=i.quantity_min).length);
  s('is3',inventoryItems.filter(i=>(i.quantity||0)===0).length);
}

function cartAdj(itemId,delta){
  if(!inventoryCart) inventoryCart={};
  const item=inventoryItems.find(x=>x.id===itemId); if(!item) return;
  const max=item.quantity||0;
  const cur=inventoryCart[itemId]||0;
  const next=Math.max(0,Math.min(max,cur+delta));
  if(next===0) delete inventoryCart[itemId]; else inventoryCart[itemId]=next;
  renderInventoryTable();
}
function clearCart(){inventoryCart={};renderInventoryTable();}
function openCartCheckout(){
  const lines=Object.entries(inventoryCart||{}).filter(([,v])=>v>0).map(([id,qty])=>{
    const it=inventoryItems.find(x=>String(x.id)===String(id));
    return it?it.name+' x '+qty+' ('+it.unit+')':'';
  }).filter(Boolean);
  if(!lines.length){toast('Cart is empty','error');return;}
  $('reqItemId').value='__cart__';
  $('reqItemName').textContent='Cart: '+lines.join(', ');
  $('reqAvailable').textContent=lines.length+' item type(s) selected';
  const qf=$('reqQty')?.closest('.field-group'); if(qf) qf.style.display='none';
  if($('reqPurpose')) $('reqPurpose').value='';
  if($('reqEventName')) $('reqEventName').value='';
  if($('reqEventDate')) $('reqEventDate').value='';
  if($('reqLocation')) $('reqLocation').value='';
  if($('reqExcelStatus')) $('reqExcelStatus').textContent='';
  showModal('requestItemModal');
}
function renderInventoryTable() {
  const c=$('inventoryTable'); if(!c) return;
  const rows=invFilter==='all'?inventoryItems:inventoryItems.filter(i=>i.category===invFilter);
  if(!rows.length){c.innerHTML='<div class="empty-state"><div class="empty-title">No items yet</div><div class="empty-sub">Add inventory items to get started.</div></div>';return;}
  const canEdit=SESSION?.role==='admin'||canWriteInventory();
  const cartTotal=Object.values(inventoryCart||{}).reduce((a,v)=>a+v,0);
  let h='';
  if(cartTotal>0){
    const lines=Object.entries(inventoryCart).filter(([,v])=>v>0).map(([id,qty])=>{
      const it=inventoryItems.find(x=>String(x.id)===String(id));
      return it?esc(it.name)+' x'+qty:'';
    }).filter(Boolean).join(' | ');
    h+='<div style="background:var(--surface);border:1.5px solid var(--green);border-radius:10px;padding:12px 16px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">'
      +'<div><div style="font-weight:700;font-size:13px;color:var(--green)">Cart ('+cartTotal+' item'+(cartTotal>1?'s':'')+')</div>'
      +'<div style="font-size:11px;color:var(--muted);margin-top:2px">'+lines+'</div></div>'
      +'<div style="display:flex;gap:8px"><button class="btn btn-secondary btn-sm" onclick="clearCart()">Clear</button>'
      +'<button class="btn btn-primary btn-sm" onclick="openCartCheckout()">Checkout</button></div></div>';
  }
  h+='<table><thead><tr>'+['#','Item','Category','Available','Location','Request Qty',''].map(x=>'<th>'+x+'</th>').join('')+'</tr></thead><tbody>';
  rows.forEach((item,i)=>{
    const qty=item.quantity||0,min=item.quantity_min||0;
    const qtyCls=qty===0?'out':qty<=min?'low':'ok';
    const qtyLabel=qty===0?'Out':qty<=min?'Low':'In stock';
    const cartQty=(inventoryCart||{})[item.id]||0;
    const unavail=qty===0;
    h+='<tr style="'+(unavail?'opacity:0.6':'')+'">'
      +'<td class="td-num">'+(i+1)+'</td>'
      +'<td><div style="font-weight:600">'+esc(item.name)+'</div>'+(item.notes?'<div class="td-muted" style="font-size:11px">'+esc(item.notes.slice(0,60))+'</div>':'')+'</td>'
      +'<td class="td-muted" style="font-size:12px">'+esc(item.category||'-')+'</td>'
      +'<td><span class="qty-badge '+qtyCls+'">'+qty+' '+esc(item.unit||'pcs')+'<br><span style="font-size:10px">'+qtyLabel+'</span></span></td>'
      +'<td class="td-muted">'+esc(item.location||'-')+'</td>'
      +'<td><div style="display:flex;align-items:center;gap:6px">'
      +'<button class="btn btn-secondary btn-xs" style="font-size:16px;padding:1px 8px;line-height:1" onclick="cartAdj('+item.id+',-1)" '+(unavail||cartQty===0?'disabled':'')+'>&#8722;</button>'
      +'<span style="min-width:24px;text-align:center;font-weight:700;font-size:13px;color:'+(cartQty>0?'var(--green)':'var(--muted)')+'">'+cartQty+'</span>'
      +'<button class="btn btn-secondary btn-xs" style="font-size:16px;padding:1px 8px;line-height:1" onclick="cartAdj('+item.id+',+1)" '+(unavail?'disabled':'')+'>+</button>'
      +'</div></td>'
      +'<td>'+(canEdit?'<div style="display:flex;gap:4px"><button class="btn btn-secondary btn-xs" onclick="openEditItem('+item.id+')">Edit</button><button class="btn btn-secondary btn-xs" style="color:var(--accent)" onclick="deleteItem('+item.id+')">Del</button></div>':'')+'</td>'
      +'</tr>';
  });
  h+='</tbody></table>';
  c.innerHTML=h;
}


function canWriteInventory() {
  const perms=SESSION?.module_permissions||{};
  return perms.inventory_write===true;
}

function openAddItem() {
  ['invName','invCategory','invQty','invMinQty','invUnit','invLocation','invNotes'].forEach(id=>{ const el=$(id); if(el) el.value=''; });
  $('invCategory').value='other'; $('invUnit').value='pcs';
  showModal('addItemModal');
}

async function saveNewItem() {
  const name=$('invName').value.trim();
  if(!name){toast('Please enter an item name.','error');return;}
  const btn=$('invSaveBtn'); btn.disabled=true; btn.textContent='Saving...';
  try {
    await dbInsert('inventory_items',{
      name, category:$('invCategory').value,
      quantity:parseInt($('invQty').value)||0,
      quantity_min:parseInt($('invMinQty').value)||0,
      unit:$('invUnit').value||'pcs',
      location:$('invLocation').value,
      notes:$('invNotes').value,
      created_by:SESSION?.user_id, updated_by:SESSION?.user_id
    });
    toast('Item added.');
    logActivity('created','Added inventory item: '+name);
    closeModal('addItemModal');
    await loadInventory();
  } catch(e){toast('Could not add item: '+e.message,'error');}
  finally{btn.disabled=false;btn.textContent='Add Item';}
}

async function openEditItem(id) {
  const item=inventoryItems.find(i=>String(i.id)===String(id)); if(!item) return;
  $('editInvId').value=id;
  $('editInvName').value=item.name||'';
  $('editInvCategory').value=item.category||'other';
  $('editInvQty').value=item.quantity||0;
  $('editInvMinQty').value=item.quantity_min||0;
  $('editInvUnit').value=item.unit||'pcs';
  $('editInvLocation').value=item.location||'';
  $('editInvNotes').value=item.notes||'';
  showModal('editItemModal');
}

async function saveEditItem() {
  const id=$('editInvId').value;
  const name=$('editInvName').value.trim();
  if(!name){toast('Please enter an item name.','error');return;}
  const btn=$('editInvSaveBtn'); btn.disabled=true; btn.textContent='Saving...';
  try {
    await dbUpdate('inventory_items',id,{
      name, category:$('editInvCategory').value,
      quantity:parseInt($('editInvQty').value)||0,
      quantity_min:parseInt($('editInvMinQty').value)||0,
      unit:$('editInvUnit').value||'pcs',
      location:$('editInvLocation').value,
      notes:$('editInvNotes').value,
      updated_by:SESSION?.user_id, updated_at:new Date().toISOString()
    });
    toast('Item updated.');
    logActivity('edited','Updated inventory item: '+name);
    closeModal('editItemModal');
    await loadInventory();
  } catch(e){toast('Could not update: '+e.message,'error');}
  finally{btn.disabled=false;btn.textContent='Save Changes';}
}

async function deleteItem(id) {
  if(!confirm('Delete this inventory item? This cannot be undone.')) return;
  try {
    await dbDelete('inventory_items',id);
    toast('Item deleted.'); await loadInventory();
    logActivity('deleted','Deleted inventory item #'+id);
  } catch(e){toast('Could not delete: '+e.message,'error');}
}

function openRequestItem(id) {
  const item=inventoryItems.find(i=>String(i.id)===String(id)); if(!item) return;
  $('reqItemId').value=id;
  $('reqItemName').textContent=item.name;
  $('reqAvailable').textContent=(item.quantity||0)+' '+(item.unit||'pcs')+' available';
  $('reqQty').value=1;
  if($('reqPurpose')) $('reqPurpose').value='';
  if($('reqEventName')) $('reqEventName').value='';
  if($('reqEventDate')) $('reqEventDate').value='';
  if($('reqLocation')) $('reqLocation').value='';
  if($('reqExcelStatus')) $('reqExcelStatus').textContent='';
  showModal('requestItemModal');
}

function downloadRequestTemplate(e) {
  e.preventDefault();
  const ws=XLSX.utils.aoa_to_sheet([
    ['Item Name','Quantity','Event Name','Event Date','Location','Details / Particulars'],
    ['QNu Roll-up Banner',2,'QNu Annual Summit','2025-03-15','Bengaluru, Hotel XYZ','Need for main stage backdrop. Return after event.'],
  ]);
  ws['!cols']=[{wch:25},{wch:10},{wch:25},{wch:15},{wch:20},{wch:40}];
  var _wb4={SheetNames:['Request'],Sheets:{}}; _wb4.Sheets['Request']=ws;
  var _o4=XLSX.write(_wb4,{bookType:'xlsx',type:'binary'}),_b4=new ArrayBuffer(_o4.length),_v4=new Uint8Array(_b4);
  for(var _i4=0;_i4<_o4.length;_i4++) _v4[_i4]=_o4.charCodeAt(_i4)&0xFF;
  var _a4=document.createElement('a'); _a4.href=URL.createObjectURL(new Blob([_b4],{type:'application/octet-stream'})); _a4.download='Inventory_Request_Template.xlsx';
  document.body.appendChild(_a4); _a4.click(); document.body.removeChild(_a4); setTimeout(function(){URL.revokeObjectURL(_a4.href);},1500);
  toast('Template downloaded.');
}

function loadRequestFromExcel(input) {
  const file=input.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=function(e){
    try{
      const wb=XLSX.read(e.target.result,{type:'binary'});
      const ws=wb.Sheets[wb.SheetNames[0]];
      const rows=XLSX.utils.sheet_to_json(ws,{defval:''});
      if(!rows.length){toast('No data found.','error');return;}
      const row=rows[0]; // take first row as the request details
      const getV=(keys)=>{for(const k of keys){for(const rk of Object.keys(row)){if(rk.toLowerCase().includes(k.toLowerCase())&&String(row[rk]).trim())return String(row[rk]).trim();}}return '';};
      const qty=parseInt(getV(['quantity','qty']))||1;
      const event=getV(['event name','event','purpose','name']);
      const date=getV(['date']);
      const loc=getV(['location','venue','place']);
      const details=getV(['details','particulars','reason','notes']);
      if($('reqQty')) $('reqQty').value=qty;
      if($('reqEventName')) $('reqEventName').value=event;
      if($('reqEventDate')&&date){
        // Try to parse date
        try{const d=new Date(date);if(!isNaN(d))$('reqEventDate').value=d.toISOString().slice(0,10);}catch(_){}
      }
      if($('reqLocation')) $('reqLocation').value=loc;
      if($('reqPurpose')) $('reqPurpose').value=details;
      const status=$('reqExcelStatus');
      if(status) status.textContent='✓ Details loaded from Excel';
      toast('Request details loaded from Excel.');
      // If multiple rows, show summary
      if(rows.length>1) toast('Note: Only first row was loaded for single-item request.','error');
    }catch(err){toast('Could not read file: '+err.message,'error');}
  };
  reader.readAsBinaryString(file);
  input.value='';
}

async function submitRequest() {
  const itemId=$('reqItemId').value;
  const qty=parseInt($('reqQty').value)||1;
  const eventName=($('reqEventName')?.value||'').trim();
  const eventDate=($('reqEventDate')?.value||'').trim();
  const location=($('reqLocation')?.value||'').trim();
  const purpose=($('reqPurpose')?.value||'').trim();
  if(!eventName){toast('Please enter the event or purpose name.','error');return;}
  if(!eventDate){toast('Please enter the event date.','error');return;}
  const item=inventoryItems.find(i=>String(i.id)===String(itemId));
  const btn=$('reqSubmitBtn'); btn.disabled=true; btn.textContent='Submitting...';
  const fullDetails=[
    purpose,
    location?'Location: '+location:'',
  ].filter(Boolean).join('\n');
  try {
    await dbInsert('inventory_requests',{
      item_id:parseInt(itemId), item_name:item?.name||'',
      quantity_requested:qty,
      purpose:fullDetails||eventName,
      event_name:eventName,
      event_date:eventDate||null,
      location:location||null,
      requested_by:SESSION?.user_id,
      requested_by_name:SESSION?.full_name||SESSION?.email,
      status:'pending'
    });
    // Notify all admins and CMOs
    try{
      const admins=await sbFetch('user_profiles?role=in.(admin,cmo)&select=id,full_name,role')||[];
      for(const a of admins){
        await sendNotification(a.id,'Inventory Request: '+eventName,
          (SESSION?.full_name||'Someone')+' requested '+qty+' x '+(item?.name||'item')+' for '+eventName,
          'info','inventory',parseInt(itemId));
      }
    }catch(_){}
    toast('Request submitted. Admin/CMO will be notified for approval.');
    logActivity('request','Requested '+qty+' '+(item?.unit||'pcs')+' of '+(item?.name||'item')+' for '+eventName);
    closeModal('requestItemModal');
  } catch(e){toast('Could not submit request: '+e.message,'error');}
  finally{btn.disabled=false;btn.textContent='Submit Request';}
}

// Admin: view and approve requests
async function loadInventoryRequests() {
  const c=$('invRequestsList'); if(!c) return;
  try {
    const reqs=await sbFetch('inventory_requests?order=created_at.desc&status=eq.pending&select=*')||[];
    if(!reqs.length){c.innerHTML='<div style="font-size:12px;color:var(--muted);padding:12px">No pending requests.</div>';return;}
    let h='';
    reqs.forEach(r=>{
      h+=`<div class="user-card" style="margin-bottom:8px;flex-direction:column;align-items:stretch;gap:8px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap">
          <div>
            <div style="font-weight:600">${esc(r.item_name||'-')} <span style="font-size:11px;color:var(--muted);font-weight:400">× ${r.quantity_requested}</span></div>
            <div style="font-size:12px;color:var(--muted);margin-top:2px">By: ${esc(r.requested_by_name||'-')} · ${formatDate(r.created_at)}</div>
            ${r.event_name?`<div style="font-size:12px;font-weight:600;color:var(--blue);margin-top:3px">📅 ${esc(r.event_name)}${r.event_date?' — '+formatDate(r.event_date):''}</div>`:''}
            ${r.location?`<div style="font-size:11px;color:var(--muted)">📍 ${esc(r.location)}</div>`:''}
            ${r.purpose?`<div style="font-size:11px;color:var(--muted);margin-top:3px;white-space:pre-wrap">${esc(r.purpose)}</div>`:''}
          </div>
          <div style="display:flex;gap:6px;flex-shrink:0">
            <button class="btn btn-green btn-xs" onclick="approveRequest(${r.id},${r.item_id},${r.quantity_requested})">Approve</button>
            <button class="btn btn-secondary btn-xs" style="color:var(--accent)" onclick="rejectRequest(${r.id})">Reject</button>
          </div>
        </div>
      </div>`;
    });
    c.innerHTML=h;
  } catch(e){c.innerHTML=`<div style="font-size:12px;color:var(--muted);padding:12px">Could not load: ${esc(e.message)}</div>`;}
}

async function approveRequest(reqId, itemId, qty) {
  try {
    const item=inventoryItems.find(i=>String(i.id)===String(itemId));
    const newQty=Math.max(0,(item?.quantity||0)-qty);
    await dbUpdate('inventory_requests',reqId,{status:'approved',approved_by:SESSION?.user_id,approved_by_name:SESSION?.full_name||SESSION?.email,approved_at:new Date().toISOString()});
    await dbUpdate('inventory_items',itemId,{quantity:newQty,updated_by:SESSION?.user_id,updated_at:new Date().toISOString()});
    toast('Request approved and stock updated.');
    logActivity('approved','Approved inventory request #'+reqId);
    await loadInventory(); await loadInventoryRequests();
  } catch(e){toast('Error: '+e.message,'error');}
}

async function rejectRequest(reqId) {
  try {
    await dbUpdate('inventory_requests',reqId,{status:'rejected',approved_by:SESSION?.user_id,approved_at:new Date().toISOString()});
    toast('Request rejected.');
    await loadInventoryRequests();
  } catch(e){toast('Error: '+e.message,'error');}
}
