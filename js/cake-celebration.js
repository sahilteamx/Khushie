(() => {
  "use strict";
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)], P=window.KhushiProgress;
  if(!P)return;
  let candles=new Set(), hasCut=false, dragging=false, reduced=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const status=$("#cakeStatus"), knife=$("#cakeKnife"), slice=$("#cakeSlice"), msg=$("#cakeMessage"), cutBtn=$("#cutCake");
  function reset(){candles.clear();hasCut=false;dragging=false; msg.hidden=true;cutBtn.disabled=true;status.textContent="Tap each candle to begin.";knife.classList.remove("is-cutting");slice.classList.remove("is-separated");$$('.cake-candle').forEach(c=>c.classList.remove("is-out"));}
  function extinguish(c){const id=c.dataset.candle;if(candles.has(id))return;candles.add(id);c.classList.add("is-out");status.textContent=`${candles.size} of 3 candles out.`;if(candles.size===3){cutBtn.disabled=false;status.textContent="All candles are out. Now cut the cake.";}}
  function celebrate(){hasCut=true;P.completeCake();knife.classList.add("is-cutting");setTimeout(()=>{slice.classList.add("is-separated");},reduced?80:480);setTimeout(()=>{msg.hidden=false;status.textContent="Cake cut! Happy Birthday, Khushi. ❤️";confetti();},reduced?180:850);}
  function confetti(){if(reduced)return;for(let i=0;i<22;i++){const p=document.createElement('span');p.className='cake-confetti';p.style.left=`${Math.random()*100}%`;p.style.setProperty('--x',`${(Math.random()-.5)*180}px`);p.style.animationDelay=`${Math.random()*.2}s`;$("#cakeStage").appendChild(p);setTimeout(()=>p.remove(),2600);}}
  function cut(){if(candles.size<3||hasCut)return;celebrate();}
  $$('.cake-candle').forEach(c=>{c.addEventListener('click',()=>extinguish(c));c.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();extinguish(c);}});});
  cutBtn.addEventListener('click',cut);
  // Accessible drag alternative: any horizontal pointer gesture across the cake triggers a cut.
  const stage=$("#cakeStage"); stage.addEventListener('pointerdown',e=>{if(candles.size<3||hasCut)return;dragging=true;stage.setPointerCapture?.(e.pointerId);knife.classList.add('is-cutting');}); stage.addEventListener('pointerup',e=>{if(!dragging)return;dragging=false;stage.releasePointerCapture?.(e.pointerId);cut();});
  $("#replayCake").addEventListener('click',reset); reset();
})();
