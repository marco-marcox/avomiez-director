(()=>{
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  window.AVOMIEZ_UI_VERSION='V2.9';
  document.title='AvoMiez Director V2.9';

  const state={result:null,baseDirectorNotes:'',installed:false};
  window.AvoMiezV29=state;

  function tone(){
    return{
      name:$('#v27-create-tone')?.value||'none',
      strength:$('#v27-create-strength')?.value||'medium',
      expression:$('#v27-create-expression')?.value||'balanced',
      note:$('#v27-create-note')?.value||''
    };
  }
  function toneLabel(){
    const t=tone();
    const labels={none:'None',comedy:'Comedy',horror:'Horror','horror-splatter':'Horror/Splatter','dark-comedy':'Dark Comedy',emotional:'Emotional',epic:'Epic',romantic:'Romantic',suspense:'Suspense','creepy-cute':'Creepy Cute',absurd:'Absurd',chaotic:'Chaotic',wholesome:'Wholesome',noir:'Noir',custom:'Custom'};
    return t.name==='none'?'No overlay':`${labels[t.name]||t.name} · ${t.strength}`;
  }
  function activeRefs(){
    const items=[...(window.AvoMiezV25?.createRefs||[])].filter(x=>x?.data);
    return items.sort((a,b)=>(a.type==='character'?-1:0)-(b.type==='character'?-1:0)).slice(0,9);
  }
  function currentMixText(){
    const d=Number($('#duration')?.value)||12;
    const style=$('#style')?.value||'Cinematic';
    const refs=activeRefs().length;
    const motion=$('#v25MotionFile')?.files?.[0]?'Motion ref':'No motion';
    const loop=$('#loop')?.checked?'Loop ON':'Loop optional';
    return`${d}s · ${style} · ${toneLabel()} · ${refs} ref${refs===1?'':'s'} · ${motion} · ${loop}`;
  }

  async function postJson(url,body){
    const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json().catch(()=>({}));
    if(!r.ok)throw Error(j.error||'Request failed');
    return j;
  }

  function detailsShell(id,title,subtitle){
    const d=document.createElement('details');d.id=id;d.className='v29Fold';
    d.innerHTML=`<summary><span>${title}</span><span class="v29FoldSummary">${subtitle}</span></summary><div class="v29FoldBody"></div>`;
    return d;
  }

  function moveCreateControls(card,workshop){
    if($('#v29CreativeMix'))return;
    const mix=detailsShell('v29CreativeMix','🎛 Creative Mix',currentMixText());
    const body=mix.querySelector('.v29FoldBody');
    const duration=$('#duration');
    const row=duration?.closest('.row');
    const audio=$('#audio'),audioLabel=audio?.previousElementSibling;
    const loop=$('#loop')?.closest('label');
    const tonePanel=$('#v27Tone-create');
    [row,audioLabel,audio,loop,tonePanel].forEach(x=>{if(x)body.appendChild(x)});
    workshop.insertAdjacentElement('afterend',mix);

    const refs=detailsShell('v29ReferencesFold','🖼 References & Motion','0 references · no motion');
    const refsBody=refs.querySelector('.v29FoldBody');
    const refPanel=$('#v25ReferenceDirector');
    if(refPanel)refsBody.appendChild(refPanel);
    mix.insertAdjacentElement('afterend',refs);

    const note=$('#v25CreatorNote');
    if(note){
      const oldLabel=[...refsBody.querySelectorAll('.label')].find(x=>x.textContent.toLowerCase().includes('creator direction'));
      if(oldLabel)oldLabel.style.display='none';
      const noteWrap=$('#v29DirectorNoteWrap');
      if(noteWrap){noteWrap.appendChild(note);note.placeholder='Optional: what must stay, what may change, special story rules, camera wishes…';}
    }
  }

  function workshopPanel(){
    const wrap=document.createElement('div');wrap.id='v29Workshop';
    wrap.innerHTML=`<div class="v29WorkshopCard">
      <div class="analysisBadge v29Badge">V2.9 CREATIVE MIXER / IDEA WORKSHOP</div>
      <div class="v29Title">Turn the raw idea into 3 stronger directions</div>
      <div class="tiny">Your story remains the core. V2.9 mixes in duration, style, Tone Overlay, references, motion intent and director notes before the final ≤5,000-character video prompt is built.</div>
      <div id="v29MixSummary" class="v29MixSummary"></div>
      <div class="label">Director notes <span class="muted">optional</span></div>
      <div id="v29DirectorNoteWrap"></div>
      <button id="v29Develop" class="btn gold full">✨ DEVELOP IDEA WITH CURRENT SETTINGS</button>
      <div id="v29Err"></div>
      <div id="v29Result" style="display:none"></div>
    </div>`;
    return wrap;
  }

  function renderResult(j){
    state.result=j;
    const out=$('#v29Result');if(!out)return;
    const engine=j.coreEngine||{};
    const vars=Array.isArray(j.variants)?j.variants:[];
    out.style.display='block';
    out.innerHTML=`
      <div class="v29ResultHead"><b>Creative directions ready</b><span>${esc(j.mixSummary||currentMixText())}</span></div>
      <details class="v29Engine"><summary>🧠 What makes this idea work</summary><div class="v29EngineGrid">
        <div><b>Hook</b>${esc(engine.hook||'')}</div><div><b>Secret / reveal</b>${esc(engine.secretOrReveal||'')}</div><div><b>Relationship</b>${esc(engine.relationship||'')}</div><div><b>Escalation</b>${esc(engine.escalation||'')}</div><div><b>Payoff</b>${esc(engine.payoff||'')}</div>
      </div></details>
      <div class="v29Recommended">⭐ Recommended: <b>${esc(j.recommendedVariant||'A')}</b>${j.recommendationWhy?' · '+esc(j.recommendationWhy):''}</div>
      <div class="v29Variants">${vars.map((v,i)=>variantHtml(v,i)).join('')}</div>`;
    $$('.v29Use').forEach(b=>b.onclick=()=>useVariant(+b.dataset.i,false));
    $$('.v29UseDirect').forEach(b=>b.onclick=()=>useVariant(+b.dataset.i,true));
  }

  function variantHtml(v,i){
    const beats=(v.beats||[]).map(x=>`<div class="v29Beat"><b>${esc(x.time||'Beat')}</b> ${esc(x.beat||'')}</div>`).join('');
    return`<div class="v29Variant" data-i="${i}">
      <div class="v29VariantTop"><span class="v29Letter">${esc(v.id||String.fromCharCode(65+i))}</span><div><b>${esc(v.title||'Direction')}</b><div class="tiny">${esc(v.strength||'')}</div></div></div>
      <div class="v29Hook">⚡ ${esc(v.hook||'')}</div>
      <textarea class="v29VariantStory" data-i="${i}">${esc(v.story||'')}</textarea>
      <details><summary>⏱ Beat sheet</summary><div class="v29Beats">${beats}</div></details>
      <div class="tiny v29Why">${esc(v.whyItWorks||'')}</div>
      <div class="buttons"><button class="btn v29Use" data-i="${i}">USE ${esc(v.id||String.fromCharCode(65+i))}</button><button class="btn gold v29UseDirect" data-i="${i}">🔥 USE + BUILD FINAL</button></div>
    </div>`;
  }

  function useVariant(i,directAfter){
    const v=state.result?.variants?.[i];if(!v)return;
    const edited=$(`.v29VariantStory[data-i="${i}"]`)?.value||v.story||'';
    $('#idea').value=edited;
    const note=$('#v25CreatorNote');
    if(note){
      const base=state.baseDirectorNotes.trim();
      const carry=String(v.directorNote||'').trim();
      note.value=[base,carry].filter(Boolean).join('\n');
    }
    refreshSummary();
    if(typeof window.toast==='function')window.toast('Creative direction loaded ✓');
    if(directAfter){
      setTimeout(()=>{$('#direct')?.click();},80);
    }else{
      $('#idea').scrollIntoView({behavior:'smooth',block:'center'});
    }
  }

  async function developIdea(){
    const idea=$('#idea')?.value?.trim();
    const err=$('#v29Err');err.innerHTML='';
    if(!idea){err.innerHTML='<div class="error">Write your raw story idea first.</div>';return;}
    const btn=$('#v29Develop');btn.disabled=true;const old=btn.textContent;btn.textContent='M3 mixing story + settings…';
    try{
      state.baseDirectorNotes=$('#v25CreatorNote')?.value||'';
      const refs=activeRefs();
      const preserve=[];
      if($('#v25KeepCamera')?.checked)preserve.push('camera');if($('#v25KeepTiming')?.checked)preserve.push('timing');if($('#v25KeepAction')?.checked)preserve.push('core action');if($('#v25KeepInteraction')?.checked)preserve.push('interactions');if($('#v25KeepSetting')?.checked)preserve.push('setting');if($('#v25KeepEnding')?.checked)preserve.push('ending');
      const j=await postJson('/api/develop-idea',{
        idea,duration:Number($('#duration')?.value)||12,style:$('#style')?.value||'cinematic',audio:$('#audio')?.value||'native synchronized sound',loop:!!$('#loop')?.checked,
        directorNotes:state.baseDirectorNotes,toneOverlay:tone(),
        references:refs.map((r,i)=>({id:'@image'+(i+1),type:r.type||'other',label:r.label||('Reference '+(i+1)),hint:r.hint||'use only for its assigned role'})),
        referenceImages:refs.map(r=>r.data),
        motionReference:$('#v25MotionFile')?.files?.[0]?{preset:$('#v25MotionPreset')?.value||'balanced',preserve}:null
      });
      renderResult(j);
      setTimeout(()=>$('#v29Result')?.scrollIntoView({behavior:'smooth',block:'start'}),80);
    }catch(e){err.innerHTML='<div class="error">'+esc(e.message)+'</div>';}
    finally{btn.disabled=false;btn.textContent=old;}
  }

  function refreshSummary(){
    const summary=currentMixText();
    const box=$('#v29MixSummary');if(box)box.innerHTML='<b>Current mix</b><span>'+esc(summary)+'</span>';
    const mixSum=$('#v29CreativeMix .v29FoldSummary');if(mixSum)mixSum.textContent=summary;
    const refs=activeRefs().length,motion=$('#v25MotionFile')?.files?.[0];
    const refSum=$('#v29ReferencesFold .v29FoldSummary');if(refSum)refSum.textContent=`${refs} reference${refs===1?'':'s'} · ${motion?'motion loaded':'no motion'}`;
  }

  function installStyle(){
    if($('#v29Style'))return;
    const s=document.createElement('style');s.id='v29Style';s.textContent=`
      .v29WorkshopCard{margin:12px 0;padding:12px;border:1px solid #79561f;border-radius:15px;background:linear-gradient(180deg,#1d160b,#0d131e)}
      .v29Badge{background:#2a1e0b!important;color:#ffe09b!important}.v29Title{font-size:17px;font-weight:900;margin:2px 0 5px}.v29MixSummary{margin:9px 0;padding:9px;border-radius:10px;border:1px solid #5a4624;background:#100d08;display:flex;flex-direction:column;gap:2px;font-size:11px}.v29MixSummary b{color:#ffd981}.v29MixSummary span{color:#d7deea}
      .v29Fold{border:1px solid #263044;background:#0c121c;border-radius:14px;margin:9px 0;overflow:hidden}.v29Fold>summary{display:flex!important;flex-direction:column;gap:2px;padding:12px!important;font-weight:900}.v29FoldSummary{font-size:10px;color:#94a0b5;font-weight:600}.v29FoldBody{padding:0 10px 11px}.v29FoldBody>#v27Tone-create,.v29FoldBody>#v25ReferenceDirector{margin:0}.v29FoldBody>#v27Tone-create>div,.v29FoldBody>#v25ReferenceDirector>div{margin-top:0!important;border:0!important;padding:4px 0!important;background:transparent!important}
      .v29ResultHead{margin-top:12px;padding:9px;border-radius:10px;background:#132116;border:1px solid #31523e;display:flex;flex-direction:column}.v29ResultHead span{font-size:10px;color:#a9cdb5}.v29Engine{margin-top:8px;border:1px solid #263044;border-radius:10px;background:#0b111b}.v29EngineGrid{display:grid;gap:6px;padding:0 9px 9px}.v29EngineGrid div{font-size:11px;color:#d6deea}.v29EngineGrid b{display:block;color:#ffd981;font-size:9px;text-transform:uppercase}.v29Recommended{font-size:11px;margin:9px 0;color:#ffd981}.v29Variants{display:grid;gap:9px}.v29Variant{border:1px solid #33415a;background:#0b111b;border-radius:13px;padding:10px}.v29VariantTop{display:flex;align-items:center;gap:8px}.v29Letter{width:28px;height:28px;border-radius:9px;display:grid;place-items:center;background:#2a1e0b;color:#ffe09b;font-weight:900}.v29Hook{font-size:11px;color:#ffd981;margin:8px 0}.v29VariantStory{min-height:120px;font-size:13px}.v29Variant details{margin:7px 0;border:1px solid #263044;border-radius:9px}.v29Variant details summary{font-size:11px;padding:8px 9px}.v29Beats{padding:0 8px 8px}.v29Beat{font-size:10px;margin:4px 0;color:#cbd5e5}.v29Beat b{color:#ffd981}.v29Why{margin:7px 0}
      @media(max-width:760px){.v29WorkshopCard{padding:10px}.v29Variant .buttons{display:grid;grid-template-columns:1fr}.v29Variant .btn{width:100%}}
    `;document.head.appendChild(s);
  }

  function install(){
    installStyle();
    const idea=$('#idea'),card=idea?.closest('.card');
    if(!idea||!card)return;
    if(!$('#v29Workshop')){
      const panel=workshopPanel();idea.insertAdjacentElement('afterend',panel);moveCreateControls(card,panel);
      $('#v29Develop').onclick=developIdea;
    }
    const h=$('.top h1');if(h)h.textContent='AvoMiez Director V2.9';
    const p=$('.top p');if(p)p.textContent='Idea Workshop → Creative Mix → references → final ≤5,000-char video prompt · custom 5–30s';
    $$('.analysisBadge').forEach(b=>{b.textContent=b.textContent.replace(/V2\.[5-8]/g,'V2.9')});
    const direct=$('#direct');if(direct)direct.textContent=direct.textContent.replace(/V2\.[5-8]/g,'V2.9');
    refreshSummary();
    state.installed=true;
  }

  document.addEventListener('input',e=>{if(e.target.matches('#duration,#style,#audio,#loop,#v27-create-tone,#v27-create-strength,#v27-create-expression,#v27-create-note'))refreshSummary();});
  document.addEventListener('change',()=>setTimeout(refreshSummary,20));
  document.addEventListener('click',e=>{if(e.target.closest('.v25Remove'))setTimeout(refreshSummary,30);});

  let timer;
  const obs=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(install,40)});
  obs.observe(document.body,{subtree:true,childList:true});
  install();
  console.log('AvoMiez Director V2.9 Creative Mixer / Idea Workshop ready');
})();
