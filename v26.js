(()=>{
  const MAX=5000;
  const $=s=>document.querySelector(s);

  document.title='AvoMiez Director V2.6';

  function addLimitBanner(){
    const createPanel=$('#v25ReferenceDirector>div');
    if(createPanel&&!$('#v26CreateLimitBanner')){
      const b=document.createElement('div');
      b.id='v26CreateLimitBanner';b.className='tiny';
      b.style.cssText='margin:8px 0;padding:8px 9px;border:1px solid #31523e;border-radius:10px;background:#0d1a14;color:#9ee6b8';
      b.textContent='V2.6 · Final video prompts are capped at 5,000 characters. If M3 goes over, the backend intelligently compacts the prompt while protecting references, identity, timing and core action.';
      createPanel.insertBefore(b,createPanel.children[1]||null);
    }
    const ext=$('#v25ExtendReferences>div');
    if(ext&&!$('#v26ExtendLimitBanner')){
      const b=document.createElement('div');
      b.id='v26ExtendLimitBanner';b.className='tiny';
      b.style.cssText='margin:8px 0;padding:8px 9px;border:1px solid #31523e;border-radius:10px;background:#0d1a14;color:#9ee6b8';
      b.textContent='V2.6 · Part 2 / Part 3 prompts: hard maximum 5,000 characters. Reference Map + continuity locks have priority during automatic compaction.';
      ext.insertBefore(b,ext.children[1]||null);
    }
  }

  function upgradeLabels(){
    const h=$('.top h1');if(h)h.textContent='AvoMiez Director V2.6';
    const c=$('#v25ReferenceDirector .analysisBadge');if(c)c.textContent='V2.6 REFERENCE DIRECTOR';
    const e=$('#v25ExtendReferences .analysisBadge');if(e)e.textContent='V2.6 EXTEND REFERENCES';
    const direct=$('#direct');if(direct&&direct.textContent.includes('V2.5'))direct.textContent=direct.textContent.replace('V2.5','V2.6');
    const info=$('#v25Info');if(info&&info.textContent.includes('V2.5'))info.textContent=info.textContent.replace('V2.5','V2.6');
  }

  function meterFor(target,id,label,anchor){
    if(!target)return;
    const text=target.textContent||'';
    const n=text.length;
    let meter=document.getElementById(id);
    if(!meter){
      meter=document.createElement('div');meter.id=id;
      meter.style.cssText='margin:7px 0 10px;padding:8px 10px;border-radius:10px;font-size:11px;font-weight:800;display:flex;gap:7px;justify-content:space-between;align-items:center';
      (anchor||target).insertAdjacentElement('afterend',meter);
    }
    const ok=n<=MAX;
    meter.style.border='1px solid '+(ok?'#31523e':'#7a3838');
    meter.style.background=ok?'#0d1a14':'#291416';
    meter.style.color=ok?'#9ee6b8':'#ffb1b1';
    meter.innerHTML='<span>'+label+'</span><span>'+n.toLocaleString('en-US')+' / '+MAX.toLocaleString('en-US')+(ok?' ✓':' ⚠')+'</span>';
  }

  function refreshMeters(){
    const createCode=$('#prompt .promptBox .code');
    const promptBox=$('#prompt .promptBox');
    if(createCode&&createCode.textContent.trim())meterFor(createCode,'v26CreateMeter','Prompt length',promptBox);
    else document.getElementById('v26CreateMeter')?.remove();

    const ext=$('#extPrompt');
    if(ext&&ext.textContent.trim())meterFor(ext,'v26ExtendMeter','Part 2 / episode prompt',ext);
    else document.getElementById('v26ExtendMeter')?.remove();

    const ana=$('#anaPrompt');
    if(ana&&ana.textContent.trim())meterFor(ana,'v26AnalyzeMeter','Analyze / Reimagine prompt',ana);
    else document.getElementById('v26AnalyzeMeter')?.remove();
  }

  let timer;
  function refresh(){
    clearTimeout(timer);
    timer=setTimeout(()=>{upgradeLabels();addLimitBanner();refreshMeters();},20);
  }

  const observer=new MutationObserver(refresh);
  observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  refresh();
  console.log('AvoMiez Director V2.6 prompt-limit UI ready · max '+MAX+' chars');
})();
