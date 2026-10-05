(() => {
  "use strict";
  const $ = s => document.querySelector(s);
  const P = window.KhushiProgress;
  const canvas = $("#studioCanvas");
  if (!canvas) return;
  const MAX = 20, STORAGE = "khushiStickerStudio";
  const stickers = [
    ["cake", "🎂"],["balloon", "🎈"],["gift", "🎁"],["flower", "🌸"],["star", "⭐"],["heart", "❤️"],
    ["butterfly", "🦋"],["sparkle", "✨"],["ribbon", "🎀"],["cupcake", "🍰"],["party", "🎉"],["glow", "💫"]
  ];
  const byId = new Map(); let items = []; let selected = null; let idCounter = 0; let drag = null;
  const presets = {
    sweet: [["cake",20,25,1,0],["heart",76,27,.9,-8],["balloon",12,65,.85,-8],["sparkle",84,74,.8,10],["flower",22,78,.75,6]],
    starry: [["star",15,24,.8,-10],["sparkle",28,16,.7,8],["star",79,19,.7,8],["butterfly",78,71,.85,-6],["glow",15,73,.8,12]],
    cute: [["heart",20,30,.9,-8],["flower",78,29,.82,8],["cupcake",50,30,.95,0],["gift",27,73,.8,-7],["sparkle",74,73,.75,6]]
  };
  function save(){ try{localStorage.setItem(STORAGE,JSON.stringify(items));}catch{} }
  function load(){ try{const raw=JSON.parse(localStorage.getItem(STORAGE)||"[]"); if(Array.isArray(raw)) items=raw.slice(0,MAX);}catch{items=[];} }
  function makeItem(type,x=50,y=50,scale=1,rotation=0){return {id:`s${++idCounter}`,type,x,y,scale,rotation};}
  function render(){
    canvas.querySelectorAll(".studio-sticker").forEach(el=>el.remove());
    items.forEach(item=>{
      const emoji = byId.get(item.type) || "✨";
      const el=document.createElement("button"); el.type="button"; el.className="studio-sticker"; el.textContent=emoji; el.dataset.id=item.id; el.setAttribute("aria-label",`Sticker ${item.type}`);
      el.style.left=`${item.x}%`; el.style.top=`${item.y}%`; el.style.setProperty("--scale",item.scale); el.style.setProperty("--rot",`${item.rotation}deg`); el.tabIndex=0;
      if(selected===item.id) el.classList.add("is-selected");
      el.addEventListener("pointerdown",onPointerDown); el.addEventListener("click",e=>{e.stopPropagation();select(item.id);});
      el.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();select(item.id)} if(e.key==="Delete"||e.key==="Backspace"){e.preventDefault();removeSelected()}});
      canvas.appendChild(el);
    });
    updateControls();
  }
  function select(id){selected=id;render();}
  function selectedItem(){return items.find(i=>i.id===selected)||null;}
  function updateControls(){
    const active=!!selectedItem(); ["studioRotate","studioScaleUp","studioScaleDown","studioDelete","studioDuplicate","studioLayerUp","studioLayerDown"].forEach(id=>{const b=$("#"+id);if(b)b.disabled=!active;});
    const status=$("#studioStatus"); if(status)status.textContent=active?`Selected ${selectedItem().type}. Drag to move, or use the controls.`:"Add a sticker, then select it to edit.";
  }
  function onPointerDown(e){
    if(e.button!==undefined && e.button!==0)return;
    const id=e.currentTarget.dataset.id; selected=id; canvas.querySelectorAll('.studio-sticker').forEach(el=>el.classList.toggle('is-selected',el.dataset.id===id)); updateControls();
    const item=selectedItem(); if(!item)return;
    const rect=canvas.getBoundingClientRect(); drag={id,pointerId:e.pointerId,rect}; e.currentTarget.setPointerCapture?.(e.pointerId); e.preventDefault();
  }
  canvas.addEventListener("pointermove",e=>{
    if(!drag||e.pointerId!==drag.pointerId)return; const item=items.find(i=>i.id===drag.id); if(!item)return;
    item.x=Math.min(96,Math.max(4,((e.clientX-drag.rect.left)/drag.rect.width)*100)); item.y=Math.min(96,Math.max(6,((e.clientY-drag.rect.top)/drag.rect.height)*100));
    const el=canvas.querySelector(`[data-id="${CSS.escape(item.id)}"]`); if(el){el.style.left=`${item.x}%`;el.style.top=`${item.y}%`;}
  });
  const endDrag=()=>{if(drag){drag=null;save();P?.markCreative("stickerStudio");}};
  canvas.addEventListener("pointerup",endDrag); canvas.addEventListener("pointercancel",endDrag); canvas.addEventListener("pointerleave",()=>{});
  canvas.addEventListener("click",e=>{if(e.target===canvas){selected=null;render();}});
  stickers.forEach(([id,emoji])=>{byId.set(id,emoji);const b=document.createElement("button");b.type="button";b.className="sticker-tool";b.textContent=emoji;b.title=`Add ${id}`;b.setAttribute("aria-label",`Add ${id}`);b.addEventListener("click",()=>{if(items.length>=MAX){setStatus("The canvas is full. Remove a sticker before adding another.","error");return;} const item=makeItem(id,50+((items.length*7)%22)-11,53+((items.length*11)%26)-13,1,0);items.push(item);select(item.id);P?.markCreative("stickerStudio");save();});$("#stickerTray")?.appendChild(b);});
  function setStatus(text,state=""){const el=$("#studioStatus");if(el){el.textContent=text;el.dataset.state=state;}}
  $("#studioRotate")?.addEventListener("click",()=>{const i=selectedItem();if(!i)return;i.rotation=(i.rotation+15)%360;render();save();});
  $("#studioScaleUp")?.addEventListener("click",()=>{const i=selectedItem();if(!i)return;i.scale=Math.min(1.8,+(i.scale+.1).toFixed(2));render();save();});
  $("#studioScaleDown")?.addEventListener("click",()=>{const i=selectedItem();if(!i)return;i.scale=Math.max(.55,+(i.scale-.1).toFixed(2));render();save();});
  function removeSelected(){if(!selected)return;items=items.filter(i=>i.id!==selected);selected=null;render();save();setStatus("Sticker removed.");}
  $("#studioDelete")?.addEventListener("click",removeSelected);
  $("#studioDuplicate")?.addEventListener("click",()=>{const i=selectedItem();if(!i||items.length>=MAX)return;const copy={...i,id:`s${++idCounter}`,x:Math.min(92,i.x+6),y:Math.min(92,i.y+6)};items.push(copy);select(copy.id);save();});
  $("#studioLayerUp")?.addEventListener("click",()=>{const idx=items.findIndex(i=>i.id===selected);if(idx<0||idx===items.length-1)return;[items[idx],items[idx+1]]=[items[idx+1],items[idx]];render();save();});
  $("#studioLayerDown")?.addEventListener("click",()=>{const idx=items.findIndex(i=>i.id===selected);if(idx<=0)return;[items[idx],items[idx-1]]=[items[idx-1],items[idx]];render();save();});
  $("#studioSave")?.addEventListener("click",()=>{save();P?.markCreative("stickerStudio");setStatus("Creation saved in this browser." );});
  $("#studioLoad")?.addEventListener("click",()=>{load();selected=null;render();setStatus(items.length?"Saved creation loaded.":"No saved stickers yet.");});
  $("#studioReset")?.addEventListener("click",()=>{if(!confirm("Reset this Sticker Studio canvas?"))return;items=[];selected=null;save();render();setStatus("Canvas reset.");});
  document.querySelectorAll("[data-preset]").forEach(btn=>btn.addEventListener("click",()=>{
    if(items.length && !confirm("Replace your current canvas with this preset?"))return;
    const preset=presets[btn.dataset.preset]||[]; items=preset.map(([type,x,y,s,r])=>makeItem(type,x,y,s,r));selected=null;save();render();P?.markCreative("stickerStudio");setStatus(`${btn.textContent.trim()} preset loaded.`);
  }));
  function exportPNG(){
    const c=document.createElement("canvas"); c.width=1000;c.height=1250;const ctx=c.getContext("2d"); if(!ctx){setStatus("Canvas export is not supported in this browser.","error");return;}
    const g=ctx.createLinearGradient(0,0,c.width,c.height);g.addColorStop(0,"#17121a");g.addColorStop(1,"#08090d");ctx.fillStyle=g;ctx.fillRect(0,0,c.width,c.height);
    const rg=ctx.createRadialGradient(220,190,40,220,190,320);rg.addColorStop(0,"rgba(215,169,109,.17)");rg.addColorStop(1,"rgba(215,169,109,0)");ctx.fillStyle=rg;ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle="rgba(255,255,255,.88)";ctx.font="600 68px Georgia";ctx.fillText("For Khushi",60,110);ctx.fillStyle="rgba(255,255,255,.48)";ctx.font="16px Arial";ctx.fillText("A tiny birthday creation",62,142);
    items.forEach(item=>{const emoji=byId.get(item.type)||"✨";ctx.save();ctx.translate(item.x/100*c.width,item.y/100*c.height);ctx.rotate(item.rotation*Math.PI/180);ctx.scale(item.scale,item.scale);ctx.font="68px serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(emoji,0,0);ctx.restore();});
    c.toBlob(blob=>{if(!blob){setStatus("Could not create the image export.","error");return;} const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="khushi-birthday-creation.png";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);setStatus("Your creation is ready to save.");P?.markCreative("stickerStudio");},"image/png");
  }
  $("#studioExport")?.addEventListener("click",exportPNG);
  $("#studioClearSelection")?.addEventListener("click",()=>{selected=null;render();});
  function renderProgress(){ if(!P) return; const state=P.get(); const a=$("#studioProgressPercent"), b=$("#studioUsedState"); if(a) a.textContent=`${P.completion}%`; if(b) b.textContent=state.creative.stickerStudio?"Saved":"Not yet"; }
  load();
  idCounter=Math.max(0,...items.map(i=>Number(String(i.id).slice(1))||0));
  render();
  renderProgress();
  window.addEventListener("khushi:progress",renderProgress);
})();
