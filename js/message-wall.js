(() => {
  "use strict";
  const $=s=>document.querySelector(s), P=window.KhushiProgress;
  const grid=$("#publicMessageGrid"); if(!grid)return;
  const reactionKey="khushiMessageReactions"; const emojis=["❤️","✨","🎂"];
  let offset=0, limit=6, loading=false, hasMore=true;
  function reactions(){try{return JSON.parse(localStorage.getItem(reactionKey)||"{}")}catch{return {}}}
  function saveReactions(data){try{const keys=Object.keys(data).slice(-100);const out={};keys.forEach(k=>out[k]=data[k]);localStorage.setItem(reactionKey,JSON.stringify(out));}catch{}}
  function formatDate(v){const d=new Date(v.replace(" ","T")+(/[zZ]$/.test(v)?"":"Z")); if(Number.isNaN(d.getTime()))return v;return new Intl.DateTimeFormat(undefined,{day:"numeric",month:"short",year:"numeric"}).format(d);}
  function state(text){grid.innerHTML="";const el=document.createElement("div");el.className="wall-state";el.textContent=text;grid.appendChild(el);}
  function renderMessage(msg,index){
    const card=document.createElement("article");card.className="public-message-card";card.style.animationDelay=`${Math.min(index*60,240)}ms`;
    const meta=document.createElement("div");meta.className="public-message-meta";
    const name=document.createElement("strong");name.className="public-message-name";name.textContent=msg.name||"Birthday friend";
    const date=document.createElement("time");date.className="public-message-date";date.dateTime=msg.created_at||"";date.textContent=formatDate(msg.created_at||"");meta.append(name,date);
    const body=document.createElement("p");body.className="public-message-body";body.textContent=msg.message||"";
    const reactionsWrap=document.createElement("div");reactionsWrap.className="message-reactions";
    const saved=reactions(); const idKey=`${msg.created_at||""}:${msg.name||""}`; const counts=saved[idKey]||{};
    emojis.forEach(emoji=>{const b=document.createElement("button");b.type="button";b.className="reaction-button";b.textContent=`${emoji} ${Math.min(9,Number(counts[emoji]||0))||""}`;if(Number(counts[emoji]||0)>0)b.classList.add("is-active");b.setAttribute("aria-label",`React ${emoji}`);b.addEventListener("click",()=>{const next=reactions();next[idKey]=next[idKey]||{};next[idKey][emoji]=Math.min(9,Number(next[idKey][emoji]||0)+1);saveReactions(next);b.textContent=`${emoji} ${next[idKey][emoji]}`;b.classList.add("is-active");});reactionsWrap.appendChild(b);});
    card.append(meta,body,reactionsWrap);grid.appendChild(card);
  }
  async function load(reset=false){if(loading||(!hasMore&&!reset))return;loading=true;if(reset){offset=0;hasMore=true;state("Loading birthday messages…");}
    try{const res=await fetch(`php/public-messages.php?limit=${limit}&offset=${offset}`,{headers:{Accept:"application/json"},cache:"no-store"});const data=await res.json().catch(()=>({}));if(!res.ok||!data.success)throw new Error(data.error||"Messages unavailable");if(reset)grid.innerHTML="";if(Array.isArray(data.data)&&data.data.length){data.data.forEach((m,i)=>renderMessage(m,i));offset+=data.data.length;}else if(reset){state("No messages yet. Be the first to leave a little birthday love. ✨");}hasMore=Boolean(data.meta?.has_more);const btn=$("#loadMoreMessages");if(btn)btn.hidden=!hasMore;const count=$("#wallTotal");if(count)count.textContent=`${data.meta?.total||0} messages`;}
    catch(err){if(reset)state("Birthday messages are temporarily unavailable. Please try again later.");const s=$("#wallStatus");if(s)s.textContent=err instanceof Error?err.message:"Could not load messages.";}
    finally{loading=false;}
  }
  $("#loadMoreMessages")?.addEventListener("click",()=>load(false));
  window.addEventListener("khushi:message-sent",()=>{P?.markCreative("messageWall");load(true);});
  load(true);
})();
