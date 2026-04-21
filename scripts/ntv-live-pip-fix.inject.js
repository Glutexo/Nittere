(function(){
if(window.__ntvPiPFixInstalled)return 'already';
window.__ntvPiPFixInstalled=true;

const nativePause=HTMLMediaElement.prototype.pause;
const nativePlay=HTMLMediaElement.prototype.play;
const nativeSetPresentationMode=HTMLVideoElement.prototype.webkitSetPresentationMode;
const nativeExitPictureInPicture=Document.prototype.exitPictureInPicture;
const nativeDocHidden=Object.getOwnPropertyDescriptor(Document.prototype,'hidden');
const nativeDocVisibility=Object.getOwnPropertyDescriptor(Document.prototype,'visibilityState');
const state={lockedVideo:null,graceUntil:0};
const now=()=>Date.now();
const isPiP=video=>!!video&&(document.pictureInPictureElement===video||video.webkitPresentationMode==='picture-in-picture');
const isProtected=video=>!!video&&(isPiP(video)||(video===state.lockedVideo&&now()<state.graceUntil));
const hasProtectedVideo=()=>isProtected(state.lockedVideo);

function tryResume(video){
  if(!video)return;
  try{
    const playPromise=nativePlay.call(video);
    if(playPromise&&typeof playPromise.catch==='function')playPromise.catch(()=>{});
  }catch(error){}
}

function arm(video){
  state.lockedVideo=video;
  state.graceUntil=now()+8000;
  tryResume(video);
}

HTMLMediaElement.prototype.pause=function(){
  if(this instanceof HTMLVideoElement&&isProtected(this)){
    return Promise.resolve();
  }
  return nativePause.apply(this,arguments);
};

if(nativeSetPresentationMode){
  HTMLVideoElement.prototype.webkitSetPresentationMode=function(mode){
    if(mode==='picture-in-picture'){
      arm(this);
      return nativeSetPresentationMode.apply(this,arguments);
    }
    if(mode==='inline'&&isProtected(this)){
      return this.webkitPresentationMode||'picture-in-picture';
    }
    return nativeSetPresentationMode.apply(this,arguments);
  };
}

if(nativeExitPictureInPicture){
  Document.prototype.exitPictureInPicture=function(){
    if(hasProtectedVideo()){
      return Promise.resolve();
    }
    return nativeExitPictureInPicture.apply(this,arguments);
  };
}

const swallowEvent=event=>{
  if(!hasProtectedVideo())return;
  if(event.type==='visibilitychange'||event.type==='pagehide'||event.type==='blur'||event.type==='freeze'){
    event.stopImmediatePropagation();
    event.stopPropagation();
  }
};

['visibilitychange','pagehide','blur','freeze'].forEach(type=>{
  window.addEventListener(type,swallowEvent,true);
  document.addEventListener(type,swallowEvent,true);
});

try{
  Object.defineProperty(document,'hidden',{
    configurable:true,
    get(){
      return hasProtectedVideo()?false:(nativeDocHidden&&nativeDocHidden.get?nativeDocHidden.get.call(document):false);
    }
  });
}catch(error){}

try{
  Object.defineProperty(document,'visibilityState',{
    configurable:true,
    get(){
      return hasProtectedVideo()?'visible':(nativeDocVisibility&&nativeDocVisibility.get?nativeDocVisibility.get.call(document):'visible');
    }
  });
}catch(error){}

function bind(video){
  if(!video||video.__ntvPiPFixBound)return;
  video.__ntvPiPFixBound=true;
  video.disablePictureInPicture=false;
  video.playsInline=true;
  video.addEventListener('webkitpresentationmodechanged',()=>{
    if(video.webkitPresentationMode==='picture-in-picture'){
      arm(video);
    }
  },true);
  video.addEventListener('enterpictureinpicture',()=>arm(video),true);
  video.addEventListener('leavepictureinpicture',()=>{
    if(isProtected(video)){
      setTimeout(()=>tryResume(video),0);
    }
  },true);
  video.addEventListener('pause',()=>{
    if(isProtected(video)){
      setTimeout(()=>tryResume(video),0);
    }
  },true);
}

new MutationObserver(()=>document.querySelectorAll('video').forEach(bind)).observe(document.documentElement,{childList:true,subtree:true});
document.querySelectorAll('video').forEach(bind);
return 'installed';
})();
