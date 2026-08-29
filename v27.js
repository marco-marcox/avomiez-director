(()=>{
  const $=s=>document.querySelector(s);
  const LABELS={none:'None',comedy:'Comedy',horror:'Horror','horror-splatter':'Horror / Splatter','dark-comedy':'Dark Comedy',emotional:'Emotional',epic:'Epic',romantic:'Romantic',suspense:'Suspense','creepy-cute':'Creepy Cute',absurd:'Absurd / Surreal',chaotic:'Chaotic',wholesome:'Wholesome',noir:'Noir',custom:'Custom'};
  const EMOJI={none:'○',comedy:'😂',horror:'👻','horror-splatter':'🩸','dark-comedy':'🖤',emotional:'❤️',epic:'⚡',romantic:'💕',suspense:'😶‍🌫️','creepy-cute':'🧸',absurd:'🌀',chaotic:'💥',wholesome:'☀️',noir:'🌑',custom:'🎛️'};
  window.AVOMIEZ_UI_VERSION=window.AVOMIEZ_UI_VERSION||'V2.7';
  document.title='AvoMiez Director '+window.AVOMIEZ_UI_VERSION;

  const state={last:{create:null,extend:null,analyze:null}};
  window.AvoMiezV27=state;

  const toneOptions=Object.entries(LABELS).map(([v,l])=>`<option value="${v}">${EMOJI[v]} ${l}</option>`).join('');
  const strengthOptions='<option value="light">Light</option><option value="medium" selected>Medium</option><option value="strong">Strong</option>';
  const expressionOptions='<option value="social-safe">Social-safe</option><option value="balanced" selected>Balanced</option><option value="cinematic-intense">Cinematic intense</option>';

  function panel(scope,title,subtitle){
    const wrap=document.createElement('div');
    wrap.id='v27Tone-'+scope;
    const v=window.AVOMIEZ_UI_VERSION||'V2.7';
    wrap.innerHTML=`<div style="margin-top:12px;padding:10px;border:1px solid #58401f;border-radius:13px;background:linear-gradient(180deg,#171109,#0d1119)">
      <div class="analysisBadge" style="background:#241a0d;color:#ffd98a">${v} TONE OVERLAY</div>
      <div class="label">${title}</div>
      <div class="tiny" style="margin-bottom:7px">${subtitle} This is a secondary flavor and works on top of every primary genre/style.</div>
      <div class="row"><div><div class="label">Overlay</div><select id="v27-${scope}-tone">${toneOptions}</select></div><div><div class="label">Strength</div><select id="v27-${scope}-strength">${strengthOptions}</select></div></div>
      <div class="label">Expression</div><select id="v27-${scope}-expression">${expressionOptions}</select>
      <div class="label">Custom tone note <span class="muted">optional</span></div>
      <textarea id="v27-${scope}-note" style="min-height:68px" placeholder="Example: keep the deadpan comedy, but add oppressive rain, distant screams, practical-effects splatter and a sudden absurd payoff..."></textarea>
      <div id="v27-${scope}-info" class="tiny" style="margin-top:6px">No secondary overlay — primary genre stays unchanged.</div>
    </div>`;
    return wrap;
  }

  function installPanels(){
    const createAnchor=$('#v25ReferenceDirector');
    if(createAnchor&&!$('#v27Tone-create'))createAnchor.insertAdjacentElement('beforebegin',panel('create','Secondary vibe / genre flavor','Examples: Action + Horror/Splatter, Cute + Dark Comedy, Cinematic + Comedy.'));

    const extendAnchor=$('#v25ExtendReferences');
    if(extendAnchor&&!$('#v27Tone-extend'))extendAnchor.insertAdjacentElement('beforebegin',panel('extend','Part 2 / Part 3 tone','Inherited tone can continue, or you can deliberately turn the next episode darker, funnier, more romantic or more chaotic.'));

    const analyzeBtn=$('#analyzeBtn');
    if(analyzeBtn&&!$('#v27Tone-analyze'))analyzeBtn.insertAdjacentElement('beforebegin',panel('analyze','Reimagine tone overlay','The source mechanics stay separate from this creative flavor, so the same analyzed video can become horror, comedy, epic, noir and more.'));

    ['create','extend','analyze'].forEach(bindScope);
  }

  function getTone(scope){
    return{
      name:$(`#v27-${scope}-tone`)?.value||'none',
      strength:$(`#v27-${scope}-strength`)?.value||'medium',
      expression:$(`#v27-${scope}-expression`)?.value||'balanced',
      note:$(`#v27-${scope}-note`)?.value||''
    };
  }

  function setTone(scope,t){
    if(!t)return;
    const tone=$(`#v27-${scope}-tone`),strength=$(`#v27-${scope}-strength`),expression=$(`#v27-${scope}-expression`),note=$(`#v27-${scope}-note`);
    if(tone&&LABELS[t.name])tone.value=t.name;
    if(strength&&['light','medium','strong'].includes(t.strength))strength.value=t.strength;
    if(expression&&['social-safe','balanced','cinematic-intense'].includes(t.expression))expression.value=t.expression;
    if(note)note.value=t.note||'';
    updateInfo(scope);
  }

  function updateInfo(scope){
    const t=getTone(scope),box=$(`#v27-${scope}-info`);
    if(!box)return;
    if(t.name==='none')box.textContent='No secondary overlay — primary genre stays unchanged.';
    else box.textContent=`${EMOJI[t.name]} ${LABELS[t.name]} · ${t.strength} · ${t.expression}${t.note.trim()?' · custom note active':''}`;
  }

  function bindScope(scope){
    const box=$('#v27Tone-'+scope);if(!box||box.dataset.bound)return;box.dataset.bound='1';
    ['tone','strength','expression','note'].forEach(k=>{const el=$(`#v27-${scope}-${k}`);if(el){el.addEventListener('input',()=>updateInfo(scope));el.addEventListener('change',()=>updateInfo(scope));}});
    updateInfo(scope);
  }

  function copyTone(from,to){setTone(to,getTone(from));}

  document.addEventListener('click',e=>{
    if(e.target.closest('#v25ContinueExtend'))setTimeout(()=>copyTone('create','extend'),0);
    if(e.target.closest('#useCont'))setTimeout(()=>copyTone('analyze','extend'),0);
  },true);

  const nativeFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    try{
      const url=new URL(typeof input==='string'?input:input.url,location.href);
      const method=String(init?.method||'GET').toUpperCase();
      if(method==='POST'&&typeof init?.body==='string'){
        const scope=url.pathname==='/api/director'||url.pathname==='/api/improve'?'create':url.pathname==='/api/extend'?'extend':url.pathname==='/api/reimagine'?'analyze':null;
        if(scope){
          const body=JSON.parse(init.body);
          const tone=getTone(scope);
          body.toneOverlay=tone;
          state.last[scope]={...tone};
          init={...init,body:JSON.stringify(body)};
        }
      }
    }catch{}
    return nativeFetch(input,init);
  };

  function toneBadge(scope,id,anchorSelector){
    const t=state.last[scope],anchor=$(anchorSelector);if(!t||!anchor)return;
    let b=$('#'+id);
    if(!b){b=document.createElement('div');b.id=id;b.style.cssText='margin:7px 0;padding:7px 10px;border:1px solid #58401f;border-radius:10px;background:#171109;color:#ffd98a;font-size:11px;font-weight:800';anchor.insertAdjacentElement('afterend',b);}
    b.textContent=t.name==='none'?'Tone overlay: None':`${EMOJI[t.name]} Tone: ${LABELS[t.name]} · ${t.strength} · ${t.expression}`;
  }

  function refresh(){
    installPanels();
    const v=window.AVOMIEZ_UI_VERSION||'V2.7';
    const h=$('.top h1');if(h&&h.textContent!=='AvoMiez Director '+v)h.textContent='AvoMiez Director '+v;
    toneBadge('create','v27CreateToneBadge','#v26CreateMeter');
    toneBadge('extend','v27ExtendToneBadge','#v26ExtendMeter');
    toneBadge('analyze','v27AnalyzeToneBadge','#v26AnalyzeMeter');
  }

  let timer;
  const obs=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(refresh,30)});
  obs.observe(document.body,{subtree:true,childList:true,characterData:true});
  refresh();
  console.log('AvoMiez Director universal tone overlay ready · '+window.AVOMIEZ_UI_VERSION);
})();
