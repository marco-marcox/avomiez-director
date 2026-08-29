(()=>{
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  const MIN=5,MAX=30;
  window.AVOMIEZ_UI_VERSION=window.AVOMIEZ_UI_VERSION||'V2.8';
  document.title='AvoMiez Director '+window.AVOMIEZ_UI_VERSION;

  const fileStore=new Map();
  const keyOf=f=>[f?.name||'',f?.size||0,f?.lastModified||0].join('|');
  const clamp=v=>Math.max(MIN,Math.min(MAX,Math.round(Number(v)||12)));
  const softBudget=d=>d<=15?4600:d<=20?4400:d<=25?4150:3900;

  function installAccumulator(selector,max){
    const input=$(selector);
    if(!input||input.dataset.v28Accumulator)return;
    input.dataset.v28Accumulator='1';
    const original=input.onchange;
    if(typeof original!=='function')return;
    fileStore.set(selector,[]);
    input.onchange=async function(e){
      const picked=[...(e.target.files||[])];
      if(!picked.length)return;
      const old=fileStore.get(selector)||[];
      const seen=new Set();
      const merged=[];
      for(const f of [...old,...picked]){
        const k=keyOf(f);
        if(seen.has(k))continue;
        seen.add(k);merged.push(f);
        if(merged.length>=max)break;
      }
      fileStore.set(selector,merged);
      await original.call(input,{target:{files:merged}});
      input.value='';
      updateRefStatus();
    };
  }

  function spliceStore(selector,index){
    const xs=fileStore.get(selector)||[];
    if(index>=0&&index<xs.length){xs.splice(index,1);fileStore.set(selector,xs)}
  }

  document.addEventListener('click',e=>{
    const c=e.target.closest('.v25Remove');
    if(c)spliceStore('#v25RefFiles',+c.dataset.i);
    const x=e.target.closest('.v25ExtraRemove');
    if(x)spliceStore('#v25ExtendFiles',+x.dataset.i);
    const a=e.target.closest('.refRemove');
    if(a)spliceStore('#refFiles',+a.dataset.i);
    setTimeout(updateRefStatus,20);
  },true);

  function ensureStatus(inputSelector,id,max,gridSelector){
    const input=$(inputSelector);if(!input)return;
    let b=$('#'+id);
    if(!b){
      b=document.createElement('div');b.id=id;b.className='tiny';
      b.style.cssText='margin-top:6px;padding:7px 9px;border:1px solid #31435d;border-radius:9px;background:#0b1320;color:#b9c9e5';
      input.insertAdjacentElement('afterend',b);
    }
    const n=$$(gridSelector+' .refCard').length;
    b.textContent=n?`${n} / ${max} reference${n===1?'':'s'} loaded · choose files again to ADD more. Existing sheets stay loaded.`:`0 / ${max} references · you can select one or several now, then add more later.`;
  }

  function updateRefStatus(){
    ensureStatus('#v25RefFiles','v28CreateRefStatus',9,'#v25RefGrid');
    ensureStatus('#v25ExtendFiles','v28ExtendRefStatus',9,'#v25ExtraGrid');
    ensureStatus('#refFiles','v28AnalyzeRefStatus',6,'#refGrid');
    const info=$('#v25Info');if(info&&window.AvoMiezV25){const n=window.AvoMiezV25.createRefs?.length||0;const motion=$('#v25MotionFile')?.files?.[0];info.textContent=`${n} image reference${n===1?'':'s'}${motion?' + motion video':''} ready for ${window.AVOMIEZ_UI_VERSION} · select files again anytime to add more.`}
  }

  function replaceDuration(id,title){
    const old=$('#'+id);if(!old||old.dataset.v28Duration)return;
    const value=clamp(old.value);
    const input=document.createElement('input');
    input.id=id;input.type='number';input.min=String(MIN);input.max=String(MAX);input.step='1';input.inputMode='numeric';input.value=String(value);input.dataset.v28Duration='1';
    old.replaceWith(input);
    const hint=document.createElement('div');hint.id='v28-'+id+'-hint';hint.className='tiny';hint.style.cssText='margin-top:6px;color:#a9bad4';
    input.insertAdjacentElement('afterend',hint);
    const quick=document.createElement('div');quick.className='buttons';quick.style.marginTop='6px';
    quick.innerHTML=[8,12,15,20,24,30].map(v=>`<button type="button" class="btn v28Quick" data-for="${id}" data-v="${v}" style="min-height:32px;padding:5px 8px;font-size:10px">${v}s</button>`).join('');
    hint.insertAdjacentElement('afterend',quick);
    const refresh=()=>{input.value=String(clamp(input.value));const d=+input.value;hint.textContent=`${title}: custom ${MIN}–${MAX}s · recommended prompt budget ≈ ${softBudget(d).toLocaleString('en-US')} chars · hard max 5,000.`};
    input.addEventListener('change',refresh);input.addEventListener('blur',refresh);refresh();
  }

  document.addEventListener('click',e=>{
    const b=e.target.closest('.v28Quick');if(!b)return;
    const input=$('#'+b.dataset.for);if(!input)return;
    input.value=String(clamp(b.dataset.v));input.dispatchEvent(new Event('change',{bubbles:true}));
  });

  function installDurationUI(){
    replaceDuration('duration','Create duration');
    replaceDuration('extDuration','Next-part duration');
    replaceDuration('anaDuration','Analyze / Reimagine duration');
  }

  const previousFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    try{
      const method=String(init?.method||'GET').toUpperCase();
      if(method==='POST'&&typeof init?.body==='string'){
        const body=JSON.parse(init.body);
        if(Object.prototype.hasOwnProperty.call(body,'duration'))body.duration=clamp(body.duration);
        init={...init,body:JSON.stringify(body)};
      }
    }catch{}
    return previousFetch(input,init);
  };

  function upgradeLabels(){
    const v=window.AVOMIEZ_UI_VERSION||'V2.8';
    document.title='AvoMiez Director '+v;
    const h=$('.top h1');if(h)h.textContent='AvoMiez Director '+v;
    const p=$('.top p');if(p&&v==='V2.8')p.textContent='MiniMax M3 → multi-reference add mode, custom 5–30s timing, adaptive prompt density, Tone Overlays & 5,000-char hard guard';
    $$('.analysisBadge').forEach(b=>{b.textContent=b.textContent.replace(/V2\.[5-8]/g,v)});
    const direct=$('#direct');if(direct)direct.textContent=direct.textContent.replace(/V2\.[5-8]/g,v);
    const createBanner=$('#v26CreateLimitBanner');if(createBanner)createBanner.textContent=`${v} · Hard maximum 5,000 characters. For longer 16–30s videos the backend automatically uses a leaner soft prompt budget while protecting references, identity, tone, timing and core action.`;
    const extBanner=$('#v26ExtendLimitBanner');if(extBanner)extBanner.textContent=`${v} · Part 2 / Part 3 supports custom 5–30s duration. Longer episodes use compact time blocks and an adaptive soft prompt budget; hard maximum remains 5,000 characters.`;
  }

  function install(){
    installAccumulator('#v25RefFiles',9);
    installAccumulator('#v25ExtendFiles',9);
    installAccumulator('#refFiles',6);
    installDurationUI();
    upgradeLabels();updateRefStatus();
  }

  let timer;
  const observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(install,30)});
  observer.observe(document.body,{subtree:true,childList:true});
  install();
  console.log('AvoMiez Director multi-reference + custom 5–30s runtime ready · '+window.AVOMIEZ_UI_VERSION);
})();
