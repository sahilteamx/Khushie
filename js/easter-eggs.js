(() => {
  "use strict";
  const P = window.KhushiProgress;
  if (!P) return;
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  function toast(msg) {
    let el = document.getElementById("globalSecretToast");
    if (!el) { el = document.createElement("div"); el.id = "globalSecretToast"; el.className = "global-secret-toast"; el.setAttribute("role","status"); el.setAttribute("aria-live","polite"); document.body.appendChild(el); }
    el.textContent = msg; el.classList.add("is-visible"); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("is-visible"), 2600);
  }
  function confetti() {
    if (reduced) return;
    for (let i=0;i<16;i++) { const x=document.createElement("span"); x.className="global-confetti"; x.style.left=`${Math.random()*100}vw`; x.style.setProperty("--x",`${(Math.random()-.5)*160}px`); x.style.animationDelay=`${Math.random()*.15}s`; document.body.appendChild(x); setTimeout(()=>x.remove(),2600); }
  }
  function unlock(id, msg) { const before=P.get().secrets.length; P.unlockSecret(id); if (P.get().secrets.length > before) { toast(msg); confetti(); } }
  const star=document.getElementById("secretStar");
  if (star) { let taps=0; star.addEventListener("click",()=>{ taps++; if(taps>=3){ unlock("star","Three taps. You found a tiny secret. ✦"); taps=0; }}); }
  let seq=""; window.addEventListener("keydown", e=>{ if(e.key.length!==1)return; seq=(seq+e.key.toLowerCase()).slice(-6); if(seq==="khushi"){unlock("khushi","Secret word accepted. ❤️"); seq="";} });
  if (location.pathname.endsWith("fun-zone.html")) P.visit("fun");
  if (location.pathname.endsWith("memories.html")) P.visit("memories");
  if (location.pathname.endsWith("story.html")) P.visit("story");
  if (location.pathname.endsWith("mystery-gifts.html")) P.visit("gifts");
  if (location.pathname.endsWith("cake-celebration.html")) P.visit("cake");
  const s=P.get(); if(s.visits.includes("fun")&&s.visits.includes("memories")&&s.visits.includes("story")&&s.visits.includes("gifts")) unlock("explorer","You explored the whole little universe. ✨");
  if(s.gifts.length>=5) unlock("all-gifts","Every gift found. One last secret unlocked. 🎁");
  window.addEventListener("khushi:progress",()=>{ const now=P.get(); if(now.gifts.length>=5) unlock("all-gifts","Every gift found. One last secret unlocked. 🎁"); });
})();
