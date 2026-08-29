(()=>{
  const $=s=>document.querySelector(s);
  const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  window.AVOMIEZ_UI_VERSION='V3.0';
  document.title='AvoMiez Director V3.0';

  let recognition=null;
  let listening=false;
  let baseText='';
  let sessionFinal='';
  let interimText='';

  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function idea(){return $('#idea');}
  function currentLang(){
    const v=$('#v30VoiceLang')?.value||'auto';
    if(v==='de')return'de-DE';
    if(v==='en')return'en-US';
    const nav=String(navigator.language||'de-DE');
    return nav||'de-DE';
  }
  function mode(){return $('#v30VoiceMode')?.value||'append';}
  function status(text,type='idle'){
    const el=$('#v30VoiceStatus');if(!el)return;
    el.textContent=text;
    el.dataset.state=type;
  }
  function setButton(){
    const b=$('#v30VoiceBtn');if(!b)return;
    b.textContent=listening?'■ STOP VOICE':'🎙️ VOICE IDEA';
    b.classList.toggle('v30Listening',listening);
    b.setAttribute('aria-pressed',listening?'true':'false');
  }
  function cleanJoin(a,b){
    const left=String(a||'').trimEnd(),right=String(b||'').trim();
    if(!left)return right;
    if(!right)return left;
    return left+' '+right;
  }
  function applyTranscript(){
    const box=idea();if(!box)return;
    box.value=cleanJoin(baseText,sessionFinal);
    box.dispatchEvent(new Event('input',{bubbles:true}));
  }
  function releaseRecognition(){
    if(recognition){
      recognition.onstart=null;recognition.onresult=null;recognition.onerror=null;recognition.onend=null;
      recognition=null;
    }
    interimText='';
  }
  function finishSession(message='Voice idea added ✓'){
    listening=false;setButton();applyTranscript();
    status(message,'done');
    releaseRecognition();
  }
  function stopVoice({abort=false,silent=false}={}){
    if(!recognition){listening=false;setButton();return;}
    try{abort?recognition.abort():recognition.stop();}catch{}
    if(abort){
      listening=false;setButton();
      if(!silent)status(sessionFinal?'Voice session ended ✓':'Voice session cleared','done');
      releaseRecognition();
    }else if(!silent){status('Finishing transcription…','listening');}
  }
  function startVoice(){
    if(!SpeechRecognition){status('Voice input is not supported by this browser. Text input still works normally.','error');return;}
    const box=idea();if(!box)return;
    stopVoice({abort:true,silent:true});
    baseText=mode()==='append'?box.value:'';
    sessionFinal='';interimText='';
    const r=new SpeechRecognition();recognition=r;
    r.lang=currentLang();
    r.continuous=true;
    r.interimResults=true;
    r.maxAlternatives=1;
    r.onstart=()=>{listening=true;setButton();status('🔴 Listening… speak your video idea. Tap STOP when finished.','listening');};
    r.onresult=e=>{
      let interim='';
      for(let i=e.resultIndex;i<e.results.length;i++){
        const text=e.results[i]?.[0]?.transcript||'';
        if(e.results[i].isFinal){sessionFinal=cleanJoin(sessionFinal,text);applyTranscript();}
        else interim+=text;
      }
      interimText=interim.trim();
      status(interimText?'🔴 Listening… '+interimText:'🔴 Listening…','listening');
    };
    r.onerror=e=>{
      const code=String(e.error||'error');
      if(code==='aborted')return;
      listening=false;setButton();
      const msg=code==='not-allowed'?'Microphone permission was not granted.':code==='no-speech'?'No speech detected — try again.':'Voice input error: '+code;
      status(msg,'error');releaseRecognition();
    };
    r.onend=()=>{
      if(!recognition)return;
      if(sessionFinal)finishSession('Voice idea added ✓ · audio session released');
      else{listening=false;setButton();status('Voice session ended · no audio stored','idle');releaseRecognition();}
    };
    try{r.start();}catch(e){listening=false;setButton();status('Could not start microphone: '+(e.message||e),'error');releaseRecognition();}
  }

  function installStyle(){
    if($('#v30Style'))return;
    const s=document.createElement('style');s.id='v30Style';s.textContent=`
      .top h1{font-size:0!important}.top h1::after{content:'AvoMiez Director V3.0';font-size:20px}
      #v30VoiceIdea{margin:8px 0 10px;padding:9px;border:1px solid #31506f;border-radius:12px;background:#0a121d}
      .v30VoiceTop{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.v30VoiceTop .btn{flex:1;min-width:150px}.v30VoiceTop select{width:auto;min-width:108px;flex:1}
      #v30VoiceBtn.v30Listening{background:#3a1518;border-color:#8a3d43;color:#ffd4d6}
      #v30VoiceStatus{margin-top:6px;font-size:10px;color:#9fb1c9}#v30VoiceStatus[data-state='listening']{color:#ffb1b5}#v30VoiceStatus[data-state='done']{color:#8ee4ae}#v30VoiceStatus[data-state='error']{color:#ffb1b1}
      .v30Privacy{margin-top:6px;font-size:9px;color:#7f8da3;line-height:1.45}.v30Privacy b{color:#a9bad4}
      @media(max-width:760px){.v30VoiceTop{display:grid;grid-template-columns:1fr 1fr}.v30VoiceTop .btn{grid-column:1/-1;width:100%}.v30VoiceTop select{width:100%;min-width:0}}
    `;document.head.appendChild(s);
  }
  function panel(){
    const p=document.createElement('div');p.id='v30VoiceIdea';
    p.innerHTML=`<div class="v30VoiceTop"><button id="v30VoiceBtn" type="button" class="btn" aria-pressed="false">🎙️ VOICE IDEA</button><select id="v30VoiceLang" aria-label="Voice language"><option value="auto" selected>🌐 Auto</option><option value="de">🇩🇪 Deutsch</option><option value="en">🇬🇧 English</option></select><select id="v30VoiceMode" aria-label="Voice insert mode"><option value="append" selected>＋ Append</option><option value="replace">↺ Replace</option></select></div><div id="v30VoiceStatus" data-state="idle">Tap Voice Idea and speak. Your transcript goes directly into the Video Idea field.</div><div class="v30Privacy"><b>No audio file is created by AvoMiez Director.</b> The app keeps only the recognized text; the recognition session is released immediately after stop/end or when the page is left. Browser speech recognition may process speech through the browser/platform service.</div>`;
    return p;
  }
  function upgradeVersionLabels(){
    document.title='AvoMiez Director V3.0';
    const p=$('.top p');if(p)p.textContent='Voice Idea → Creative Mixer → references → custom 5–30s → final video prompt ≤5,000 chars';
    const badge=$('#v29Workshop .analysisBadge');if(badge)badge.textContent='V3.0 CREATIVE MIXER / IDEA WORKSHOP';
    const direct=$('#direct');if(direct)direct.textContent=direct.textContent.replace(/V2\.[5-9]/g,'V3.0');
    document.querySelectorAll('.analysisBadge').forEach(b=>{if(/V2\.[5-9]/.test(b.textContent))b.textContent=b.textContent.replace(/V2\.[5-9]/g,'V3.0')});
  }
  function install(){
    installStyle();
    const box=idea();if(!box)return;
    if(!$('#v30VoiceIdea')){
      const voice=panel();
      const workshop=$('#v29Workshop');
      if(workshop)workshop.insertAdjacentElement('beforebegin',voice);else box.insertAdjacentElement('afterend',voice);
      $('#v30VoiceBtn').addEventListener('click',()=>listening?stopVoice():startVoice());
      if(!SpeechRecognition){$('#v30VoiceBtn').disabled=true;status('Voice input is unavailable in this browser. Use the text field normally.','error');}
    }
    upgradeVersionLabels();
  }

  window.addEventListener('pagehide',()=>stopVoice({abort:true,silent:true}));
  window.addEventListener('beforeunload',()=>stopVoice({abort:true,silent:true}));
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&listening)stopVoice({abort:true,silent:true});});

  let timer;
  const obs=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{install();},90)});
  obs.observe(document.body,{subtree:true,childList:true});
  install();
  console.log('AvoMiez Director V3.0 Voice Idea Input ready · no app-side audio blob/cache');
})();
