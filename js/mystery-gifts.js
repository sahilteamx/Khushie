(() => {
  "use strict";
  const $=s=>document.querySelector(s), P=window.KhushiProgress;
  if(!P)return;
  const data=[
    ["01","A tiny reminder","No matter how many chapters happen, some people simply make ordinary days feel special. ❤️"],
    ["02","The chaos box","Congratulations. You opened a box containing absolutely no serious business. 😂"],
    ["03","A little clue","The next chapter is waiting. You already know where to go. ✨"],
    ["04","Bonus sparkle","A few extra Fun Score points, because apparently opening gifts is now a skill. 😁"],
    ["05","One more thing","A birthday wish: keep smiling, keep being you, and keep making memories. 🥰"]
  ];
  const grid=$("#mysteryGrid"), result=$("#mysteryResult");
  function render(){const s=P.get(); grid.innerHTML=""; data.forEach(([id,title,text],i)=>{const n=String(i+1); const b=document.createElement("button"); b.type="button"; b.className="mystery-gift"; if(s.gifts.includes(n))b.classList.add("is-open"); b.dataset.id=n; b.setAttribute("aria-label",s.gifts.includes(n)?`Gift ${n}, already opened`:`Open mystery gift ${n}`); b.innerHTML=`<span class="gift-number">${id}</span><span class="gift-emoji">🎁</span><span class="gift-lid"></span><span class="gift-ribbon"></span><span class="gift-name">${s.gifts.includes(n)?title:"Mystery gift"}</span>`; b.addEventListener("click",()=>open(b,i),{once:!s.gifts.includes(n)}); grid.appendChild(b);}); $("#giftCount").textContent=s.gifts.length; $("#secretCount").textContent=`Secrets ${s.secrets.length} / 5`; $("#giftProgressBar").style.width=`${s.gifts.length*20}%`; $("#finalGift").toggleAttribute("hidden",s.gifts.length<5); }
  function open(btn,i){const id=String(i+1); const before=P.get().gifts.length; P.discoverGift(id); if(P.get().gifts.length===before)return; btn.classList.add("is-opening"); setTimeout(()=>{btn.classList.add("is-open"); const [_,title,text]=data[i]; $("#resultTitle").textContent=title; $("#resultText").textContent=text; result.classList.add("is-revealed"); render();},220);}
  function final(){if(P.get().gifts.length<5)return; const title="The last little surprise"; $("#resultTitle").textContent=title; $("#resultText").textContent="You found every gift. Now the cake is waiting. 🎂❤️"; result.classList.add("is-revealed"); P.unlockSecret("all-gifts"); $("#finalBox").classList.add("is-open"); $("#finalText").textContent="Secret unlocked. The next chapter is the celebration.";}
  $("#openFinal")?.addEventListener("click",final); $("#finalBox")?.addEventListener("click",final); $("#finalBox")?.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();final();}});
  $("#resetGifts")?.addEventListener("click",()=>{if(!confirm("Reset your birthday gifts and discovered secrets?"))return;P.reset();render();$("#resultTitle").textContent="Choose a gift.";$("#resultText").textContent="The contents stay hidden until you open one.";});
  render();
})();
