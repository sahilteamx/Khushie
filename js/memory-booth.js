(() => {
  "use strict";
  const $=s=>document.querySelector(s), P=window.KhushiProgress;
  const video=$("#boothVideo"), canvas=$("#boothCanvas"), demo=$("#boothDemo"), overlay=$("#boothOverlay"), caption=$("#boothCaptionInput"), captionOutput=$("#boothCaption"), status=$("#boothStatus");
  if(!video||!canvas)return;
  let stream=null, photoMode=false, activeFrame="classic", activeSticker="⭐";
  const prefsKey="khushiMemoryBoothPrefs";
  const frames={classic:"Classic Birthday",midnight:"Midnight Glow",soft:"Soft Celebration",stars:"Stars & Hearts",minimal:"Minimal"};
  function setStatus(t,state=""){if(status){status.textContent=t;status.dataset.state=state;}}
  function stopCamera(){if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;} video.srcObject=null;}
  function setFrame(frame){activeFrame=frame;overlay.className=`booth-overlay booth-frame--${frame}`;document.querySelectorAll(".frame-button").forEach(b=>b.classList.toggle("is-active",b.dataset.frame===frame));savePrefs();}
  function addSticker(emoji){activeSticker=emoji;overlay.querySelectorAll(".booth-sticker").forEach((el,i)=>{if(i===0)el.textContent=emoji;});if(!overlay.querySelector(".booth-sticker")){const el=document.createElement("span");el.className="booth-sticker s1";el.textContent=emoji;overlay.appendChild(el);}savePrefs();}
  function savePrefs(){try{localStorage.setItem(prefsKey,JSON.stringify({frame:activeFrame,caption:caption?.value||"",sticker:activeSticker}));}catch{}}
  function syncCaption(){if(captionOutput)captionOutput.textContent=(caption?.value||"Birthday memories ✨").slice(0,120);}
  function loadPrefs(){try{const p=JSON.parse(localStorage.getItem(prefsKey)||"null");if(p?.frame)setFrame(p.frame);if(p?.caption&&caption)caption.value=p.caption;syncCaption();if(p?.sticker){activeSticker=p.sticker;addSticker(p.sticker);}}catch{}}
  function showDemo(){photoMode=false;stopCamera();video.style.display="none";canvas.style.display="none";demo.style.display="block";setStatus("Demo Memory is ready — customize it, then download your creation.");}
  async function startCamera(){
    if(!navigator.mediaDevices?.getUserMedia){showDemo();setStatus("Camera access is not supported here. Demo Memory is available instead.","error");return;}
    try{
      stopCamera(); stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"user"},width:{ideal:1280},height:{ideal:1600}},audio:false});
      video.srcObject=stream;video.playsInline=true;video.muted=true;await video.play();photoMode=true;demo.style.display="none";canvas.style.display="none";video.style.display="block";setStatus("Camera ready. Capture when you're happy with the frame.");P?.markCreative("memoryBooth");
    }catch(err){showDemo();setStatus(err?.name==="NotAllowedError"?"Camera permission was declined. Demo Memory is still available.":"Camera could not be started. Demo Memory is available instead.","error");}
  }
  function capture(){
    if(!stream||video.readyState<2){setStatus("Start the camera first.","error");return;}
    const w=Math.min(video.videoWidth||1080,1200), h=Math.round(w*1.25); canvas.width=w;canvas.height=h;const ctx=canvas.getContext("2d"); if(!ctx)return;
    ctx.save();ctx.translate(w,0);ctx.scale(-1,1);const scale=Math.max(w/(video.videoWidth||w),h/(video.videoHeight||h));const dw=(video.videoWidth||w)*scale,dh=(video.videoHeight||h)*scale;ctx.drawImage(video,(w-dw)/2,(h-dh)/2,dw,dh);ctx.restore();
    canvas.style.display="block";video.style.display="none";stopCamera();photoMode=true;setStatus("Photo captured. Retake or download your memory.");P?.markCreative("memoryBooth");
  }
  function drawExport(){
    const out=document.createElement("canvas");out.width=1000;out.height=1250;out.style.width="100%";out.style.height="auto";const ctx=out.getContext("2d");if(!ctx)return null;
    const src = canvas.style.display!=="none" && canvas.width ? canvas : demo;
    if(src===canvas){ctx.drawImage(canvas,0,0,1000,1250);}else{ctx.drawImage(demo,0,0,1000,1250);}
    // frame
    ctx.strokeStyle="rgba(255,255,255,.18)";ctx.lineWidth=20;ctx.strokeRect(22,22,956,1206);
    const shade=ctx.createLinearGradient(0,0,0,1250);shade.addColorStop(.55,"rgba(8,9,13,0)");shade.addColorStop(1,"rgba(8,9,13,.7)");ctx.fillStyle=shade;ctx.fillRect(0,0,1000,1250);
    ctx.fillStyle="#fff";ctx.textAlign="center";ctx.font="600 34px Georgia";ctx.fillText((caption?.value||"Birthday memories ✨").slice(0,80),500,1165);
    ctx.font="42px serif";ctx.fillText(activeSticker,110,130);ctx.fillText("✨",875,130);ctx.fillText("💫",140,1040);ctx.fillText("❤️",860,1040);
    return out;
  }
  function download(){const out=drawExport();if(!out){setStatus("This browser cannot export the Memory Booth creation.","error");return;}out.toBlob(blob=>{if(!blob){setStatus("Could not create the download.","error");return;}const a=document.createElement("a");const url=URL.createObjectURL(blob);a.href=url;a.download="khushi-memory-booth.png";a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);setStatus("Your Memory Booth creation is ready.");P?.markCreative("memoryBooth");},"image/png");}
  function retake(){canvas.style.display="none";showDemo();startCamera();}
  function usePhoto(){if(canvas.style.display!=="block"){setStatus("Capture a photo first.","error");return;}setStatus("Photo kept only in this page. It is not uploaded.");P?.markCreative("memoryBooth");}
  document.querySelectorAll(".mode-tab").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".mode-tab").forEach(x=>x.classList.toggle("is-active",x===b));if(b.dataset.mode==="camera")startCamera();else showDemo();}));
  document.querySelectorAll(".frame-button").forEach(b=>b.addEventListener("click",()=>setFrame(b.dataset.frame)));
  document.querySelectorAll(".booth-sticker-pick button").forEach(b=>b.addEventListener("click",()=>addSticker(b.dataset.sticker)));
  document.querySelectorAll(".caption-preset").forEach(b=>b.addEventListener("click",()=>{if(caption){caption.value=b.dataset.caption;syncCaption();}savePrefs();}));
  $("#boothCapture")?.addEventListener("click",capture);$("#boothDownload")?.addEventListener("click",download);$("#boothRetake")?.addEventListener("click",retake);$("#boothUsePhoto")?.addEventListener("click",usePhoto);
  $("#boothSaveSettings")?.addEventListener("click",()=>{savePrefs();P?.markCreative("memoryBooth");setStatus("Your frame, sticker and caption settings are saved locally. Photo data is not saved.");});
  caption?.addEventListener("input",()=>{if(caption.value.length>120)caption.value=caption.value.slice(0,120);syncCaption();savePrefs();});
  window.addEventListener("pagehide",stopCamera);window.addEventListener("beforeunload",stopCamera);document.addEventListener("visibilitychange",()=>{if(document.hidden)stopCamera();});
  setFrame("classic");showDemo();loadPrefs();syncCaption();
})();
