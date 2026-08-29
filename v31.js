(()=>{
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  window.AVOMIEZ_UI_VERSION='V3.1';
  document.title='AvoMiez Director V3.1';

  const state={profiles:[],selected:'auto',recommendation:null,lastDirector:null,verifiedAt:'',loading:false};
  window.AvoMiezV31=state;

  const fallback=[
    {key:'seedance-2.5',label:'Seedance 2.5',maker:'ByteDance Seed',maxDuration:30,promptMax:5000,nativeAudio:true,imageRefs:30,videoRefs:10,motionReference:true,bestFor:'30s storytelling + multimodal references'},
    {key:'kling-3',label:'Kling Video 3.0',maker:'Kuaishou / Kling AI',maxDuration:15,promptMax:5000,nativeAudio:true,imageRefs:6,videoRefs:1,motionReference:true,bestFor:'precise 3–15s cinematic shot design'},
    {key:'kling-3-omni',label:'Kling 3.0 Omni',maker:'Kuaishou / Kling AI',maxDuration:15,promptMax:5000,nativeAudio:true,imageRefs:6,videoRefs:2,motionReference:true,bestFor:'multimodal 3–15s generation/editing'},
    {key:'minimax-h3',label:'MiniMax H3',maker:'MiniMax',maxDuration:15,promptMax:5000,nativeAudio:true,imageRefs:9,videoRefs:3,motionReference:true,bestFor:'omni-reference + native stereo audio'},
    {key:'pixverse-v6',label:'PixVerse V6',maker:'PixVerse',maxDuration:15,promptMax:5000,nativeAudio:true,imageRefs:10,videoRefs:2,motionReference:true,bestFor:'multi-shot/audio + Fusion + extension'},
    {key:'happyhorse-1.1',label:'HappyHorse 1.1',maker:'Happy Horse',maxDuration:15,promptMax:2000,nativeAudio:true,imageRefs:1,videoRefs:0,motionReference:false,bestFor:'concise 3–15s cinematic generation'},
    {key:'generic',label:'Generic / Universal',maker:'Universal',maxDuration:30,promptMax:5000,nativeAudio:true,imageRefs:9,videoRefs:1,motionReference:true,bestFor:'portable prompt for an unspecified tool'}
  ];

  const duration=()=>Math.max(1,Number($('#duration')?.value)||12);
  const refCount=()=>window.AvoMiezV25?.createRefs?.filter(x=>x?.data)?.length||0;
  const hasMotion=()=>!!$('#v25MotionFile')?.files?.[0];
  function profile(key){return state.profiles.find(p=>p.key===key)||fallback.find(p=>p.key===key)||fallback[6];}
  function split(total,max){const parts=Math.ceil(total/max);if(parts<=1)return[total];const base=Math.floor(total/parts),rest=total-base*parts;return Array.from({length:parts},(_,i)=>base+(i<rest?1:0));}
  function selectedProfile(){const key=state.selected==='auto'?(state.recommendation?.key||'seedance-2.5'):state.selected;return profile(key)}
  function scoreFor(key){return state.recommendation?.ranking?.find(x=>x.key===key)?.score||0}

  async function loadProfiles(){
    if(state.loading)return;state.loading=true;
    try{
      const q=new URLSearchParams({duration:String(duration()),refs:String(refCount()),motion:hasMotion()?'1':'0',audio:'1'});
      const r=await fetch('/api/model-profiles?'+q.toString(),{cache:'no-store'});const j=await r.json();
      if(r.ok){state.profiles=j.profiles||fallback;state.recommendation=j.recommendation||null;state.verifiedAt=j.verifiedAt||'';}
    }catch{if(!state.profiles.length)state.profiles=fallback;}
    finally{state.loading=false;renderSelect();renderInfo();}
  }

  function installStyle(){if($('#v31Style'))return;const s=document.createElement('style');s.id='v31Style';s.textContent=`
    .top h1::after{content:'AvoMiez Director V3.1'!important}
    #v31ModelFold{border-color:#36506d;background:#0a121d}.v31ModelBody{padding:0 10px 11px}.v31ModelRow{display:grid;grid-template-columns:1fr;gap:7px}.v31Info{margin-top:8px;border:1px solid #31435d;border-radius:11px;padding:9px;background:#08111c}.v31Hero{display:flex;gap:8px;align-items:flex-start;justify-content:space-between}.v31Hero b{color:#dfeaff}.v31Fit{white-space:nowrap;color:#8ee4ae;font-weight:900;font-size:11px}.v31Facts{display:flex;gap:5px;flex-wrap:wrap;margin:7px 0}.v31Fact{font-size:9px;border:1px solid #2d3d53;border-radius:999px;padding:3px 6px;color:#b8c5d8}.v31Warn{margin-top:6px;padding:7px 8px;border:1px solid #72562c;border-radius:9px;background:#1b1409;color:#ffd99a;font-size:10px}.v31Ok{margin-top:6px;color:#8ee4ae;font-size:10px}.v31Source{margin-top:7px;font-size:9px;color:#7f91ab}.v31Source a{color:#9fc9ff}.v31Rank{display:grid;gap:4px;margin-top:8px}.v31RankLine{display:grid;grid-template-columns:1fr auto;gap:8px;font-size:9px;color:#9fb0c6}.v31RankLine b{color:#d8e5f5}.v31Output{margin:8px 0;padding:10px;border:1px solid #36506d;border-radius:12px;background:#09121d}.v31Output h4{margin:0 0 6px;color:#a9d4ff;font-size:11px;text-transform:uppercase}.v31Part{margin-top:8px;border:1px solid #2b3a4e;border-radius:10px;padding:8px}.v31PartTop{display:flex;justify-content:space-between;gap:8px;align-items:center;font-size:10px;font-weight:800}.v31Part pre{white-space:pre-wrap;max-height:260px;overflow:auto;font:10px/1.45 ui-monospace,monospace;background:#060b12;border-radius:8px;padding:8px}.v31Copy{min-height:31px!important;padding:5px 8px!important;font-size:9px!important}
  `;document.head.appendChild(s)}

  function shell(){
    const d=document.createElement('details');d.id='v31ModelFold';d.className='v29Fold';d.open=false;
    d.innerHTML=`<summary><span>🎬 Target Video Model</span><span id="v31Summary" class="v29FoldSummary">AUTO · checking best match…</span></summary><div class="v31ModelBody"><div class="label">Prompt optimized for</div><select id="v31ModelSelect"></select><div id="v31ModelInfo" class="v31Info"></div></div>`;
    return d;
  }

  function installPanel(){
    if($('#v31ModelFold'))return;
    const anchor=$('#v29CreativeMix')||$('#v29Workshop');if(!anchor)return;
    anchor.insertAdjacentElement('afterend',shell());
    $('#v31ModelSelect').addEventListener('change',e=>{state.selected=e.target.value;renderInfo();});
    loadProfiles();
  }

  function renderSelect(){
    const sel=$('#v31ModelSelect');if(!sel)return;
    const ps=state.profiles.length?state.profiles:fallback;
    const recommended=state.recommendation?.key||'seedance-2.5';
    const options=[`<option value="auto">🧠 AUTO / Best Match → ${profile(recommended).label}</option>`].concat(ps.filter(p=>p.key!=='generic').map(p=>`<option value="${p.key}">${p.label}</option>`),['<option value="generic">Generic / Universal</option>']);
    sel.innerHTML=options.join('');sel.value=state.selected;
  }

  function renderInfo(){
    const box=$('#v31ModelInfo'),sum=$('#v31Summary');if(!box||!sum)return;
    const p=selectedProfile(),d=duration(),refs=refCount(),parts=split(d,p.maxDuration),auto=state.selected==='auto',score=scoreFor(p.key);
    sum.textContent=`${auto?'AUTO → ':''}${p.label} · ${d}s · ${parts.length>1?'split '+parts.join('+')+'s':'single clip'} · cap ${p.promptMax.toLocaleString()} chars`;
    const warnings=[];
    if(d>p.maxDuration)warnings.push(`${d}s exceeds ${p.label}'s ${p.maxDuration}s single-generation limit → V3.1 will build ${parts.length} continuity-linked prompts (${parts.join('s + ')}s).`);
    if(refs>p.imageRefs)warnings.push(`${refs} image references exceed this profile's ${p.imageRefs}-image capacity. Identity-critical references will need priority.`);
    if(hasMotion()&&!p.motionReference)warnings.push('Dedicated motion-reference input is not available in this profile; motion will be translated into text choreography.');
    const source=p.source?`<a href="${p.source}" target="_blank" rel="noopener">Official source ↗</a>`:'Universal profile';
    const ranking=state.recommendation?.ranking?.slice(0,3)||[];
    box.innerHTML=`<div class="v31Hero"><div><b>${p.label}</b><div class="tiny">${p.maker||''} · ${p.bestFor||''}</div></div>${auto&&score?`<div class="v31Fit">${score}% fit</div>`:''}</div><div class="v31Facts"><span class="v31Fact">max ${p.maxDuration}s</span><span class="v31Fact">prompt ≤${p.promptMax}</span><span class="v31Fact">images ${p.imageRefs}</span><span class="v31Fact">video refs ${p.videoRefs||0}</span><span class="v31Fact">${p.nativeAudio?'native audio':'no native audio'}</span></div>${warnings.length?warnings.map(x=>`<div class="v31Warn">⚠ ${x}</div>`).join(''):`<div class="v31Ok">✓ Current ${d}s / ${refs} reference setup fits the selected profile.</div>`}<div class="v31Source">Profile verified ${state.verifiedAt||'2026-08-29'} · ${source}</div>${auto&&ranking.length?`<div class="v31Rank">${ranking.map((x,i)=>`<div class="v31RankLine"><b>${i+1}. ${profile(x.key).label}</b><span>${x.score}% fit</span></div>`).join('')}</div>`:''}`;
    const direct=$('#direct');if(direct)direct.textContent=`🔥 BUILD FINAL · ${auto?'AUTO → ':''}${p.label.toUpperCase()}`;
  }

  const previousFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    let path='';try{path=new URL(typeof input==='string'?input:input.url,location.href).pathname}catch{}
    try{
      const method=String(init?.method||'GET').toUpperCase();
      if(method==='POST'&&typeof init?.body==='string'&&['/api/director','/api/improve','/api/extend','/api/reimagine','/api/develop-idea'].includes(path)){
        const body=JSON.parse(init.body);body.targetModel=state.selected||'auto';init={...init,body:JSON.stringify(body)};
      }
    }catch{}
    const response=await previousFetch(input,init);
    if(path==='/api/director'){
      response.clone().json().then(j=>{if(j&&!j.error){state.lastDirector=j;setTimeout(renderDirectorModelOutput,120)}}).catch(()=>{});
    }
    return response;
  };

  async function copyText(text,button){try{await navigator.clipboard.writeText(text||'');const old=button.textContent;button.textContent='Copied ✓';setTimeout(()=>button.textContent=old,1000)}catch{}}
  function renderDirectorModelOutput(){
    const j=state.lastDirector;if(!j)return;
    const prompt=$('#prompt');if(!prompt)return;
    let box=$('#v31DirectorOutput');if(!box){box=document.createElement('div');box.id='v31DirectorOutput';box.className='v31Output';prompt.appendChild(box)}
    const m=j._meta||{},opt=j.modelOptimization||{},cont=Array.isArray(j.continuationPrompts)?j.continuationPrompts:[];
    box.innerHTML=`<h4>V3.1 Model Optimization</h4><div class="tiny"><b>${m.targetModelLabel||opt.targetModel||selectedProfile().label}</b> · official profile verified ${m.modelProfilesVerifiedAt||state.verifiedAt||'2026-08-29'} · prompt cap ${m.targetPromptMax||selectedProfile().promptMax} chars</div>${opt.why?`<div class="v31Ok">${opt.why}</div>`:''}${cont.length?`<div class="v31Warn">This story needs ${cont.length+1} separate generations for the selected model. Clip 1 is the normal Final Prompt above; use the continuation prompts below in order.</div>${cont.map(x=>`<div class="v31Part"><div class="v31PartTop"><span>PART ${x.part} · ${x.duration}s</span><button type="button" class="btn v31Copy" data-part="${x.part}">📋 COPY</button></div><pre>${String(x.prompt||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</pre></div>`).join('')}`:`<div class="v31Ok">✓ Single-generation prompt fits the selected model's current duration profile.</div>`}`;
    $$('#v31DirectorOutput .v31Copy').forEach(b=>{const item=cont.find(x=>String(x.part)===b.dataset.part);b.onclick=()=>copyText(item?.prompt||'',b)});
  }

  function refresh(){installStyle();installPanel();const h=$('.top h1');if(h)h.textContent='AvoMiez Director V3.1';const p=$('.top p');if(p)p.textContent='Voice Idea → Creative Mixer → Model Intelligence → references → model-optimized final prompt';renderInfo();}
  let profileTimer,installTimer;
  document.addEventListener('change',e=>{if(e.target.matches('#duration,#v25RefFiles,#v25MotionFile')){clearTimeout(profileTimer);profileTimer=setTimeout(loadProfiles,120)}});
  document.addEventListener('click',e=>{if(e.target.closest('.v25Remove')){clearTimeout(profileTimer);profileTimer=setTimeout(loadProfiles,120)}});
  const obs=new MutationObserver(()=>{clearTimeout(installTimer);installTimer=setTimeout(refresh,100)});obs.observe(document.body,{subtree:true,childList:true});
  refresh();
  console.log('AvoMiez Director V3.1 Model Intelligence ready');
})();
