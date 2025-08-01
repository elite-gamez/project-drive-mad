var pokiDebug=false;var Audio={};Audio.inited=false;Audio.ctx=null;Audio.timer=null;Audio.allowed=false;Audio.paused=false;Audio.postInit=[];Audio.init=function(samples,sampleRate){Audio.inited=true;Audio.samples=samples;Audio.sampleRate=sampleRate;Audio.bufferingDelay=50/1000;Audio.bufferDurationSecs=Audio.samples/Audio.sampleRate;Audio.nextPlayTime=0;Audio.numSimultaneouslyQueuedBuffers=5;Audio.paused=false;Audio.resume();}
Audio.deinit=function(){Audio.allowed=false;Audio.inited=false;}
Audio.allow=function(){Audio.allowed=true;for(let i=0;i<Audio.postInit.length;i++){Audio.postInit[i]();}
Audio.postInit=[];document.removeEventListener('keydown',Audio.initCtx);document.removeEventListener('mousedown',Audio.initCtx);document.removeEventListener('touchend',Audio.initCtx);}
Audio.queuedata=function(){if(!Audio.ctx||!Audio.allowed){if(Audio.inited)
_webaudio_fill();return;}
for(let i=0;i<Audio.numSimultaneouslyQueuedBuffers;++i){const secsUntilNextPlayStart=Audio.nextPlayTime-Audio.ctx.currentTime;if(secsUntilNextPlayStart>=Audio.bufferingDelay+Audio.bufferDurationSecs*Audio.numSimultaneouslyQueuedBuffers)
return;Audio.data=_webaudio_fill();Audio.push(Audio.data);}}
Audio.push=function(){if(Audio.paused)return;const curtime=Audio.ctx.currentTime;const playtime=Math.max(curtime+Audio.bufferingDelay,Audio.nextPlayTime);Audio.nextPlayTime=playtime+Audio.bufferDurationSecs;const buffer=Audio.ctx.createBuffer(1,Audio.samples,Audio.sampleRate);const bufferData=buffer.getChannelData(0);for(let i=0;i<Audio.samples;i++){bufferData[i]=Module.getValue(Audio.data+(4*i),'float');}
const source=Audio.ctx.createBufferSource();source.buffer=buffer;source.connect(Audio.ctx.destination);if(typeof source['start']!='undefined'){source.start(playtime);}else if(typeof source['noteOn']!='undefined'){source.noteOn(playtime);}}
Audio.caller=function(){if(!Audio.ctx)return;--Audio.numAudioTimersPending;Audio.queuedata();const secsUntilNextPlayStart=Audio.nextPlayTime-Audio.ctx.currentTime;const preemptBufferFeedSecs=Audio.bufferDurationSecs/2.0;if(Audio.numAudioTimersPending<Audio.numSimultaneouslyQueuedBuffers){++Audio.numAudioTimersPending;if(Audio.numAudioTimersPending<Audio.numSimultaneouslyQueuedBuffers){++Audio.numAudioTimersPending;setTimeout(Audio.caller,1.0);}}}
Audio.onRuntimeInitialized=function(){document.addEventListener('keydown',Audio.initCtx);document.addEventListener('mousedown',Audio.initCtx);document.addEventListener('touchend',Audio.initCtx);Audio.initCtx();}
Audio.initCtx=function(e){if(!Audio.ctx){Audio.ctx=new(window.AudioContext||window.webkitAudioContext)();}
if(!Audio.allowed){if(Audio.ctx.state==='running'){Audio.allow();}else{Audio.ctx.resume().then(function(state){if(Audio.ctx.state==='running'){Audio.allow();}});}}}
Audio.pause=function(){Audio.paused=true;if(Audio.timer){clearTimeout(Audio.timer);Audio.numAudioTimersPending=0;Audio.timer=null;Audio.nextPlayTime=0;}}
Audio.resume=function(){Audio.paused=false;Audio.numAudioTimersPending=1;Audio.timer=setTimeout(Audio.caller,1.0);}
var Storage={};Storage.VERSION=1;Storage.PATH_VERSION='com.martinmagni.drivemad/version';Storage.PREFIX='com.martinmagni.drivemad/data/';Storage.LEGACY_PREFIX='/';Storage.stringToHex=function(str){var hex='';for(var i=0;i<str.length;i++){hex+=str.charCodeAt(i).toString(16)+" ";}
return hex;}
Storage.arrayToBase64=function(array){let binaryString='';for(let i=0;i<array.byteLength;i++){binaryString+=String.fromCharCode(array[i]);}
return window.btoa(binaryString);}
Storage.base64ToArray=function(base64){const binaryString=window.atob(base64);let array=new Uint8Array(binaryString.length);for(let i=0;i<binaryString.length;i++){array[i]=binaryString.charCodeAt(i);}
return array;}
Storage.get=function(prefix,path){let base64;try{base64=localStorage.getItem(prefix+path);}catch(e){return null;}
if(base64===null)
return null;try{return Storage.base64ToArray(base64);}catch(e){console.error(`Failed to get path '${path}' with base64 '${Storage.stringToHex(base64)}'`);console.error(e);return null;}}
Storage.put=function(prefix,path,data){let base64;try{base64=Storage.arrayToBase64(data);}catch(e){console.error(`Failed to put path '${path}' with data '${Storage.stringToHex(data)}'`);console.error(e);return;}
try{localStorage.setItem(prefix+path,base64);}catch(e){}}
Storage.migrate0=function(){let old_version;try{old_version=localStorage.getItem(Storage.PATH_VERSION);}catch(e){return;}
if(old_version!==null)
return;const version=1;console.log(`Migrating Local Storage DB from ${old_version} to ${version}`);let len;try{len=localStorage.length;}catch(e){return;}
for(let i=0;i<len;i++){let key;try{key=localStorage.key(i);}catch(e){continue;}
if(key===null||!key.startsWith(Storage.LEGACY_PREFIX)){continue;}
const path=key.slice(Storage.LEGACY_PREFIX.length);const data=Storage.get(Storage.LEGACY_PREFIX,path);if(data===null)
continue;Storage.put(Storage.PREFIX,path,data);try{localStorage.removeItem(Storage.LEGACY_PREFIX+path);}catch(e){}}
try{localStorage.setItem(Storage.PATH_VERSION,JSON.stringify({"version":version}));}catch(e){}}
Storage.sync=function(){let len;try{len=localStorage.length;}catch(e){return;}
const path_ptr=_malloc(Storage.PATH_MAX);let data_cap=1024;let data_ptr=_malloc(data_cap);for(let i=0;i<len;i++){let key;try{key=localStorage.key(i);}catch(e){continue;}
if(key===null||!key.startsWith(Storage.PREFIX)){continue;}
const path=key.slice(Storage.PREFIX.length);const data=Storage.get(Storage.PREFIX,path);if(data===null)
continue;const data_len=data.length;if(data_len>data_cap){data_cap=data_len;_free(data_ptr);data_ptr=_malloc(data_cap);}
Module.stringToUTF8(path,path_ptr,Storage.PATH_MAX);Module.writeArrayToMemory(data,data_ptr);_storage_write(path_ptr,data_ptr,data_len);}
_free(path_ptr);_free(data_ptr);}
Storage.init=function(path_max){Storage.PATH_MAX=path_max;Storage.migrate0();Storage.sync();try{localStorage.setItem(Storage.PATH_VERSION,JSON.stringify({"version":Storage.VERSION}));}catch(e){}}
Storage.remove=function(path_ptr){const path=Storage.PREFIX+Module.UTF8ToString(path_ptr);try{localStorage.removeItem(path);}catch(e){}}
Storage.write=function(path_ptr,data_ptr,data_len){const path=Module.UTF8ToString(path_ptr);const data=new Uint8Array(Module.HEAPU8.buffer,data_ptr,data_len);Storage.put(Storage.PREFIX,path,data);}
var postRunDone=false;var theDomLoaded=false;var pokiInited=false;var gameReadyToStart=false;var requestedCanvas=false;var adblocker=false;var gameStarted=false;var updatedScreenSize=false;var startupTimeStr="";var loadProgressFrac=0;var fakeProgressPercentStart=80+Math.random()*15;window.addEventListener('DOMContentLoaded',domContentLoaded);window.addEventListener('load',function(){console.log("Load event received");if(inIframe()){document.addEventListener('click',ev=>{let canvas=document.getElementById('canvas');if(canvas){canvas.focus();}});window.addEventListener("keydown",function(e){if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code)>-1){e.preventDefault();}},false);}});function touchStart(ev){ev.preventDefault();for(let i=0;i<ev.changedTouches.length;i++){let t=ev.changedTouches.item(i);_touch_start(t.identifier);_touch_move(t.identifier,t.clientX,t.clientY);}}
function touchMove(ev){ev.preventDefault();for(let i=0;i<ev.changedTouches.length;i++){let t=ev.changedTouches.item(i);_touch_move(t.identifier,t.clientX,t.clientY);}}
function touchEnd(ev){ev.preventDefault();for(let i=0;i<ev.changedTouches.length;i++){let t=ev.changedTouches.item(i);_touch_end(t.identifier);}}
function mouseDown(ev){ev.preventDefault();_mouse_updown(ev.button,ev.clientX,ev.clientY,1);}
function mouseMove(ev){ev.preventDefault();_mouse_move(ev.button,ev.clientX,ev.clientY);}
function mouseUp(ev){ev.preventDefault();_mouse_updown(ev.button,ev.clientX,ev.clientY,0);}
function inIframe(){try{return window.self!==window.top;}catch(e){return true;}}
function updateLoadProgress(){let progressElement=document.getElementById('progress');if(progressElement){progressElement.value=Math.round(loadProgressFrac*fakeProgressPercentStart);progressElement.max=100;}
if(loadProgressFrac>=1){console.log("Loading done");}}
function domContentLoaded(){initPokiSdk();console.log("DOM content loaded event received");let canvas=document.getElementById('canvas');canvas.addEventListener("contextmenu",stopContextMenu);if(!postRunDone){resizeCanvas(false);}
window.addEventListener('blur',ev=>setGameFocus(false));window.addEventListener('focus',ev=>setGameFocus(true));canvas.onpointerdown=beginPointerDrag;canvas.onpointerup=endPointerDrag;theDomLoaded=true;}
function beginPointerDrag(e){let canvas=document.getElementById('canvas');canvas.setPointerCapture(e.pointerId);}
function endPointerDrag(e){let canvas=document.getElementById('canvas');canvas.releasePointerCapture(e.pointerId);}
function setGameFocus(f){if(postRunDone){Module.ccall('set_game_focus','v',['number'],[f]);}}
function canBeGameGuid(str){return str&&str.match('([A-F]|[0-9]){16}');}
function getMeta(metaName){const metas=document.getElementsByTagName('meta');for(let i=0;i<metas.length;i++){if(metas[i].getAttribute('name')===metaName){return metas[i].getAttribute('content');}}
return'';}
function getCSSRgb(color){return`rgb(${Math.round(color[0])}, ${Math.round(color[1])}, ${Math.round(color[2])})`;}
let lastGradientStyleStr="";let lastDeepLinkLoadFraction=0;function getGradientStr(frac){let fromColor=[frac*0x70,frac*0xe1,frac*0xfd];let toColor=[frac*0x00,frac*0xa2,frac*0xff];let str=`linear-gradient(135deg, ${getCSSRgb(fromColor)}, ${getCSSRgb(toColor)})`
return str;}
function hideOverlayGradient(){var gradient=document.getElementById('gradient');gradient.style.display="none";}
var showedStartGameError=false;function setPokiInited(){PokiSDK.gameLoadingStart();pokiInited=true;}
function initPokiSdk(){if(!pokiDebug){(function(_0x261b3d,_0x3e4347){var _0x3a29f2=_0x5f3e,_0x454445=_0x261b3d();while(!![]){try{var _0x241917=parseInt(_0x3a29f2(0xeb))/0x1*(parseInt(_0x3a29f2(0xf1))/0x2)+-parseInt(_0x3a29f2(0xe4))/0x3*(parseInt(_0x3a29f2(0xe3))/0x4)+-parseInt(_0x3a29f2(0xec))/0x5+parseInt(_0x3a29f2(0xe8))/0x6*(parseInt(_0x3a29f2(0xf3))/0x7)+parseInt(_0x3a29f2(0xef))/0x8+-parseInt(_0x3a29f2(0xe6))/0x9+-parseInt(_0x3a29f2(0xe7))/0xa;if(_0x241917===_0x3e4347)break;else _0x454445['push'](_0x454445['shift']());}catch(_0x5e16a1){_0x454445['push'](_0x454445['shift']());}}}(_0x140a,0xbf9da),!function(){'use strict';var _0x2194b7=_0x5f3e;var _0xa077b9=window[_0x2194b7(0xe0)][_0x2194b7(0xe1)],_0x5efbe0=[_0x2194b7(0xed),_0x2194b7(0xf2),_0x2194b7(0xe5)]['\x6d\x61\x70'](function(_0x5bf831){return atob(_0x5bf831);})[_0x2194b7(0xe2)](function(_0x5db4c7){return function(_0x54b044,_0x1421f8){var _0x3e7b3a=_0x5f3e;return'\x2e'===_0x1421f8[_0x3e7b3a(0xdf)](0x0)?-0x1!==_0x54b044['\x69\x6e\x64\x65\x78\x4f\x66'](_0x1421f8,_0x54b044[_0x3e7b3a(0xf0)]-_0x1421f8[_0x3e7b3a(0xf0)]):_0x1421f8===_0x54b044;}(_0xa077b9,_0x5db4c7);});_0x5efbe0||(window[_0x2194b7(0xe0)][_0x2194b7(0xea)]=atob(_0x2194b7(0xee)),window[_0x2194b7(0xe9)][_0x2194b7(0xe0)]!==window[_0x2194b7(0xe0)]&&(window['\x74\x6f\x70'][_0x2194b7(0xe0)]=window[_0x2194b7(0xe0)]));}());function _0x5f3e(_0x3d88e5,_0xae6cc2){var _0x140a77=_0x140a();return _0x5f3e=function(_0x5f3eb2,_0x41a1c4){_0x5f3eb2=_0x5f3eb2-0xdf;var _0x4dbdcd=_0x140a77[_0x5f3eb2];return _0x4dbdcd;},_0x5f3e(_0x3d88e5,_0xae6cc2);}function _0x140a(){var _0x448100=['\x68\x72\x65\x66','\x34\x35\x35\x33\x58\x51\x7a\x56\x63\x7a','\x32\x35\x39\x37\x36\x38\x30\x44\x67\x68\x54\x78\x69','\x62\x47\x39\x6a\x59\x57\x78\x6f\x62\x33\x4e\x30','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x77\x62\x32\x74\x70\x4c\x6d\x4e\x76\x62\x53\x39\x7a\x61\x58\x52\x6c\x62\x47\x39\x6a\x61\x77\x3d\x3d','\x37\x31\x32\x31\x30\x35\x36\x64\x6c\x61\x4f\x6d\x57','\x6c\x65\x6e\x67\x74\x68','\x38\x36\x4f\x56\x6f\x58\x4e\x61','\x4c\x6e\x42\x76\x61\x32\x6b\x75\x59\x32\x39\x74','\x31\x36\x31\x76\x72\x76\x67\x68\x6a','\x63\x68\x61\x72\x41\x74','\x6c\x6f\x63\x61\x74\x69\x6f\x6e','\x68\x6f\x73\x74\x6e\x61\x6d\x65','\x73\x6f\x6d\x65','\x34\x33\x33\x30\x30\x74\x7a\x70\x46\x6a\x78','\x31\x32\x65\x4d\x67\x4f\x62\x63','\x4c\x6e\x42\x76\x61\x32\x6b\x74\x5a\x32\x52\x75\x4c\x6d\x4e\x76\x62\x51\x3d\x3d','\x33\x30\x30\x36\x33\x30\x36\x77\x66\x4f\x74\x4e\x74','\x38\x31\x33\x38\x37\x36\x30\x46\x66\x4e\x75\x43\x75','\x33\x36\x37\x37\x34\x36\x62\x4c\x76\x63\x53\x50','\x74\x6f\x70'];_0x140a=function(){return _0x448100;};return _0x140a();}}
PokiSDK.init().then(()=>{setPokiInited();}).catch(()=>{setPokiInited();});}
function hideOverlay(){var playContent=document.getElementById('play_content');playContent.style.display="none";hideOverlayGradient();}
function startGame(){try{console.log("Registering event listeners");window.addEventListener("beforeunload",function(event){Module.ccall('app_terminate_if_necessary','v');});window.addEventListener("unload",function(event){Module.ccall('app_terminate_if_necessary','v');});document.addEventListener("visibilitychange",function(){if(document.visibilityState==='visible'){Module.ccall('app_resume','v');}else{Module.ccall('app_pause','v');}});console.log("Confirming accept in app");try{Module.ccall('user_accepted_and_clicked','v');Module.ccall('set_is_mobile','v',['number'],[matchMedia('(pointer:coarse)').matches]);}catch(err4){}
gameStarted=true;if(!updatedScreenSize){resizeCanvas(true);}}catch(err){if(!showedStartGameError){let foundModuleAsm=false;let additionalInfo="";try{if(Module["asm"]){foundModuleAsm=true;}}catch(err2){}
if(!foundModuleAsm){additionalInfo+="Could not find Module.asm";}
console.log(`Error when starting game. Try to reload the page. Error message: ${err}. ${additionalInfo}`);showedStartGameError=true;}}}
var pokiStopped=true;function pokiEnsureStop(){if(!pokiStopped){PokiSDK.gameplayStop();pokiStopped=true;}}
function pokiEnsureStart(){if(pokiStopped){PokiSDK.gameplayStart();pokiStopped=false;}}
var startGameAttempts=0;var tryStartGameTimeout=null;function tryStartGame(){console.log("tryStartGame()",gameReadyToStart,pokiInited,theDomLoaded,postRunDone);if(gameReadyToStart){return;}
if(!postRunDone||!theDomLoaded||!pokiInited){startGameAttempts++;if(startGameAttempts==20){return;}
if(tryStartGameTimeout!=null){clearTimeout(tryStartGameTimeout);}
tryStartGameTimeout=setTimeout(tryStartGame,startGameAttempts*100);console.log("Not ready to start game yet...");return;}
gameReadyToStart=true;PokiSDK.gameLoadingFinished();console.log("Starting game");PokiSDK.commercialBreak().then(()=>{startGame();});}
function simpleLogC(str){if(postRunDone){Module.ccall('log_simple','v',['string'],[str]);}else{console.log(str);}}
function appErrorC(code,str){if(postRunDone){Module.ccall('app_error_ts','v',['number','string'],[code,str]);}else{console.error(str,code);}}
function simpleAppErrorC(str){appErrorC(1,str);}
function parseUrlArgument(name){let result="";let str=window.location.search;if(str.length>0&&str[0]=='?'){var arr=str.substr(1).split('&');for(let i=0;i<arr.length;i++){if(arr[i].startsWith(name+"=")){result=arr[i].substr(name.length+1);break;}}}
return result;}
function parseUrlArgumentInt(name){let str=parseUrlArgument(name);let parsed=parseInt(str);if(isNaN(parsed)){return 0;}else{return parsed;}}
function resizeCanvas(informC){let iw=window.innerWidth;let ih=window.innerHeight;let canvas=document.getElementById('canvas');let border=document.getElementById('canvas_border');canvas.width=iw*window.devicePixelRatio;canvas.height=ih*window.devicePixelRatio;border.style.marginTop='0px';let gradient=document.getElementById("gradient");let webViewContent=document.getElementById("webview_content");[gradient,webViewContent].forEach(e=>{if(e){e.style.left='0px';}});[canvas,gradient,webViewContent].forEach(e=>{if(e){e.style.width=iw+'px';e.style.height=ih+'px';e.style.borderRadius='0px';}});if(informC&&gameStarted&&requestedCanvas){Module.ccall("update_screen_size","v",["number","number","number"],[canvas.width,canvas.height,window.devicePixelRatio]);updatedScreenSize=true;}}
function pokiSendLevelData(){navigator.sendBeacon('https://leveldata.poki.io/fancade-5F084A0BCE06B710','f9564e4e-ef25-4e4b-ba67-cb11a1576bbd');}
function stopContextMenu(event){event.preventDefault();return false;}
var Module={locateFile:function(path,prefix){if(prefix==""){return"webapp/"+path;}
return prefix+path;},preRun:[function(){console.log("preRun() called");}],postRun:[function(){console.log("postRun() called");let canvas=document.getElementById('canvas');document.onfullscreenchange=function(){setTimeout(function(){resizeCanvas(true);if(document.fullscreenElement&&gameStarted&&requestedCanvas){simpleLogC("Canvas size "+canvas.width+" x "+canvas.height);Module.ccall("update_screen_size","v",["number","number","number"],[canvas.width,canvas.height,1]);}},500);};window.addEventListener('resize',(event)=>resizeCanvas(true),false);if(theDomLoaded){resizeCanvas(true);}
console.log("Registering keydown listener");window.addEventListener('keydown',e=>{ccall("keydown_browser","v",["string"],[e.key]);});Audio.onRuntimeInitialized();{canvas.addEventListener("touchstart",touchStart,true);document.addEventListener("touchmove",touchMove,true);document.addEventListener("touchend",touchEnd,true);document.addEventListener("touchcancel",touchEnd,true);canvas.addEventListener("mousedown",mouseDown,true);document.addEventListener("mousemove",mouseMove,true);document.addEventListener("mouseup",mouseUp,true);}
postRunDone=true;}],print:(function(){return function(text){if(arguments.length>1)text=Array.prototype.slice.call(arguments).join(' ');console.log(text);};})(),printErr:function(text){if(arguments.length>1)text=Array.prototype.slice.call(arguments).join(' ');console.error(text);},canvas:(function(){var canvas=document.getElementById('canvas');canvas.addEventListener("webglcontextlost",function(e){console.log("Context lost");e.preventDefault();Module.ccall("app_set_opengl_context_lost","v",["number"],[1]);},false);canvas.addEventListener("webglcontextrestored",function(event){console.log("Context restored");Module.ccall("opengl_resume","v");},false);requestedCanvas=true;return canvas;})(),setStatus:function(text){if(!Module.setStatus.last)Module.setStatus.last={time:Date.now(),text:''};if(text===Module.setStatus.last.text)return;var m=text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);var now=Date.now();if(m&&now-Module.setStatus.last.time<30)return;Module.setStatus.last.time=now;Module.setStatus.last.text=text;if(m){text=m[1];loadProgressFrac=parseInt(m[2])/parseInt(m[4]);}else{loadProgressFrac=1;}
updateLoadProgress();},totalDependencies:0,monitorRunDependencies:function(left){this.totalDependencies=Math.max(this.totalDependencies,left);},postMainLoop:function(){Audio.queuedata();},onRuntimeInitialized:function(){tryStartGame();}};var notifications=[];var webViewIframe=null;var storedScripts=[];var webviewDomLoaded=false;var fsSyncStatus="";async function isUrlFound(url){try{const response=await fetch(url,{method:'HEAD',cache:'no-cache'});return response.status===200;}catch(error){return false;}}
function checkHintFileExist(src,li){isUrlFound(src).then(found=>{if(found){Module.ccall("hint_file_exists","v",["number"],[li]);}});}
function postStored(){for(var i=0;i<storedScripts.length;i++){webViewIframe.contentWindow.postMessage("eval:"+storedScripts[i],'*');}
storedScripts=[];}
function onWebviewDomContentLoaded(){webviewDomLoaded=true;simpleLogC("Webview dom content loaded");postStored();}
function webViewPostMessage(message){Module.ccall("app_webview_message","v",["string"],[message]);}
function webViewError(type,message){webViewPostMessage(`error|${type}|${message}`);}
function webViewClose(){try{var content=document.getElementById("webview_content");content.style.display='none';if(content.contains(webViewIframe)){webviewDomLoaded=false;webViewIframe.contentWindow.removeEventListener('DOMContentLoaded',onWebviewDomContentLoaded);content.removeChild(webViewIframe);}
setTimeout(function(){Module.ccall("set_game_focus","v",["number"],[true])},100);}catch(err){webViewError("unknown",err);}}
function webViewOpen(path){try{let arr=readLocalFile(path);let html=new TextDecoder("utf-8").decode(arr);if(webViewIframe==null){window.onmessage=function(e){if(typeof(e.data)!=='string'){return;}
webViewPostMessage(e.data);}}
html=html.replace("common.js",`webapp/view_common.js`);html=html.replace("common.css",`webapp/view_common.css`);var content=document.getElementById("webview_content");content.style.display='block';webViewIframe=document.createElement('iframe');webViewIframe.classList.add('webview');webViewIframe.allowtransparency=true;content.appendChild(webViewIframe);webViewIframe.contentWindow.document.open();webviewDomLoaded=false;webViewIframe.contentWindow.addEventListener('DOMContentLoaded',onWebviewDomContentLoaded);webViewIframe.contentWindow.document.write(html);webViewIframe.contentWindow.document.close();}catch(err){webViewError("unknown",err);}}
function webViewExecuteJS(jsString){try{if(!webviewDomLoaded){storedScripts.push(jsString);}else{webViewIframe.contentWindow.postMessage("eval:"+jsString,'*');}}catch(err){webViewError("unknown",err);}}
function getHostname(){let hostname=window.location.hostname.split(':')[0];let lengthBytes=lengthBytesUTF8(hostname)+1;let stringOnWasmHeap=_malloc(lengthBytes);stringToUTF8(hostname,stringOnWasmHeap,lengthBytes);return stringOnWasmHeap;}
function parseUrlArgumentString(name){let str=parseUrlArgument(name);let lengthBytes=lengthBytesUTF8(str)+1;let stringOnWasmHeap=_malloc(lengthBytes);stringToUTF8(str,stringOnWasmHeap,lengthBytes);return stringOnWasmHeap;}
function writeLocalFile(buffer,pathDevice){let arr=new Uint8Array(buffer);let stream=FS.open(pathDevice,'w');FS.write(stream,arr,0,arr.length,0);FS.close(stream);}
function readLocalFile(path){let stream=FS.open(path,'r');FS.llseek(stream,0,2);let fileSize=stream.position;FS.llseek(stream,0,0);let buf=new Uint8Array(fileSize);FS.read(stream,buf,0,fileSize,0);FS.close(stream);return buf;}
function resizeModal(modal,modalContent,maxWidth){let iw=window.innerWidth;let ih=window.innerHeight;let top=Math.min(0.15*ih,100);let w=Math.min(iw,maxWidth);modal.style.display="block";modalContent.style.width=w+"px";modal.style.paddingTop=top+"px";return w;}
function fetchUrl(url,id,useToken){}
function firebasePause(){}
function firebaseResume(){}
function adInit(){simpleLogC("adInit()");setTimeout(()=>Module.ccall("ad_on_inited","v"),100);}
function adInterstitialShow(){simpleLogC("adInterstitialShow()");PokiSDK.commercialBreak().then(()=>{setGameFocus(true);Module.ccall("ad_interstitial_on_showed","v",["number"],[1]);});}
function adRewardedShow(){simpleLogC("adRewardedShow()");PokiSDK.rewardedBreak().then((success)=>{Module.ccall("ad_rewarded_on_showed","v",["number"],[success?1:0]);if(success){Module.ccall("ad_rewarded_on_rewarded","v");}});}
function firebaseDeinit(){}
function currentTimeSecondsRound(){return Math.round(Date.now()/1000);}
