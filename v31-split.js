(()=>{
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const previousFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    let path='';try{path=new URL(typeof input==='string'?input:input.url,location.href).pathname}catch{}
    const response=await previousFetch(input,init);
    if(['/api/extend','/api/reimagine'].includes(path))response.clone().json().then(j=>{if(j&&!j.error)setTimeout(()=>render(path,j),140)}).catch(()=>{});
    return response;
  };
  const esc=s=>String(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  async function copyText(t,b){try{await navigator.clipboard.writeText(t||'');const o=b.textContent;b.textContent='Copied ✓';setTimeout(()=>b.textContent=o,900)}catch{}}
  function render(path,j){
    const cont=Array.isArray(j.continuationPrompts)?j.continuationPrompts:[],meta=j._meta||{},anchor=path==='/api/extend'?$('#eContent'):$('#aContent');if(!anchor)return;
    const id=path==='/api/extend'?'v31ExtendSplit':'v31ReimagineSplit';let box=$('#'+id);if(!box){box=document.createElement('div');box.id=id;box.className='v31Output';anchor.appendChild(box)}
    box.innerHTML=`<h4>V3.1 Model Optimization</h4><div class="tiny"><b>${esc(meta.targetModelLabel||j.modelOptimization?.targetModel||'Target model')}</b> · profile verified ${esc(meta.modelProfilesVerifiedAt||'2026-08-29')} · cap ${esc(meta.targetPromptMax||5000)} chars</div>${cont.length?`<div class="v31Warn">The selected model needs ${cont.length+1} generations for this runtime. The normal prompt above is clip 1.</div>${cont.map((x,i)=>`<div class="v31Part"><div class="v31PartTop"><span>PART ${esc(x.part||i+2)} · ${esc(x.duration)}s</span><button type="button" class="btn v31CopySplit" data-i="${i}">📋 COPY</button></div><pre>${esc(x.prompt)}</pre></div>`).join('')}`:`<div class="v31Ok">✓ Single-generation duration fits the selected model profile.</div>`}`;
    $$('#'+id+' .v31CopySplit').forEach(b=>{const x=cont[+b.dataset.i];b.onclick=()=>copyText(x?.prompt||'',b)});
  }
})();
