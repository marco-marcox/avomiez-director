(()=>{
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  window.AVOMIEZ_UI_VERSION='V3.4';document.title='AvoMiez Director V3.4';
  let seq=0;

  function installStyle(){if($('#v34Style'))return;const s=document.createElement('style');s.id='v34Style';s.textContent=`
    .top h1::after{content:'AvoMiez Director V3.4'!important}
    .v34Pix{margin:9px 0;border:1px solid #68513b;border-radius:13px;background:linear-gradient(180deg,#18110c,#0a111a);overflow:hidden}.v34Pix>summary{padding:10px 11px!important;display:flex!important;flex-direction:column;gap:2px}.v34PixTitle{font-weight:900;color:#ffd6b1}.v34PixSub{font-size:9px;color:#9fa9b9}.v34Body{padding:0 10px 10px}.v34Row{display:grid;grid-template-columns:1.2fr .7fr;gap:6px}.v34Check{display:flex;align-items:center;gap:6px;font-size:10px;color:#bdc7d5;margin:7px 0}.v34Check input{width:auto}.v34Info{font-size:9px;color:#8fa0b6;line-height:1.45;margin:7px 0}.v34Info b{color:#ffd99a}.v34Status{font-size:10px;margin-top:7px;padding:7px;border-radius:9px;border:1px solid #31523e;background:#0d1a14;color:#9ee6b8}.v34Status.work{border-color:#72562c;background:#1b1409;color:#ffd99a}.v34Status.err{border-color:#673737;background:#2a1417;color:#ffb2b2}.v34Result{margin-top:8px;display:grid;gap:7px}.v34Meta{font-size:10px;color:#9fb0c6}.v34Notes{font-size:10px;color:#c5cfdb}.v34Part{border:1px solid #33435a;background:#070d15;border-radius:11px;padding:8px}.v34PartTop{display:flex;align-items:center;justify-content:space-between;gap:7px;font-size:10px;font-weight:900}.v34Code{white-space:pre-wrap;background:#04080d;border:1px solid #26354a;border-radius:8px;padding:8px;max-height:350px;overflow:auto;font:10px/1.45 ui-monospace,monospace;margin-top:7px}.v34Actions{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}.v34Actions .btn{min-height:31px;padding:5px 8px;font-size:9px}.v34Verified{font-size:9px;color:#8798af;margin-top:7px}.v34Verified a{color:#9fc9ff}
    @media(max-width:760px){.v34Row{grid-template-columns:1fr}.v34Actions{display:grid;grid-template-columns:1fr 1fr}.v34Actions .btn{width:100%}}
  `;document.head.appendChild(s)}

  function parseDuration(text,block){
    const t=String(text||'');
    const patterns=[/\bexactly\s+(\d{1,3})\s*s\b/i,/\b(\d{1,3})[- ]second\b/i,/\b(\d{1,3})\s*seconds\b/i,/\b(\d{1,3})\s*s\b/i];
    for(const r of patterns){const m=t.match(r);if(m){const n=+m[1];if(n>=1&&n<=120)return n}}
    if(block.id==='extPrompt')return Number($('#extDuration')?.value)||15;
    if(block.id==='anaPrompt')return Number($('#remixDuration')?.value||$('#anDuration')?.value)||12;
    if(block.closest('#prompt'))return Number($('#duration')?.value)||12;
    const clip=block.closest('.v33mClip');if(clip){const m=clip.textContent.match(/·\s*(\d{1,3})s/);if(m)return +m[1]}
    return 12;
  }
  function refCount(text){const s=new Set((String(text||'').match(/@(?:image|video)\d+/gi)||[]).map(x=>x.toLowerCase()));return s.size}
  function eligible(block){if(!block||block.dataset.v34Attached)return false;const text=String(block.textContent||'').trim();if(text.length<45)return false;if(block.closest('.v34Pix'))return false;return true}

  function shell(block){
    const id='v34-'+(++seq),text=String(block.textContent||'').trim(),duration=parseDuration(text,block),refs=refCount(text);
    block.dataset.v34Attached=id;
    const d=document.createElement('details');d.className='v34Pix';d.dataset.target=id;
    d.innerHTML=`<summary><span class="v34PixTitle">✨ PixVerse V6 Final Optimizer</span><span class="v34PixSub">Final pass based on official V6 prompting guidance · 1–15s per generation · ≤5,000 chars</span></summary><div class="v34Body"><div class="v34Row"><div><div class="label">PixVerse workflow</div><select class="v34Mode"><option value="auto" selected>🧠 Auto detect</option><option value="text-to-video">Text-to-Video</option><option value="image-to-video">Image-to-Video</option><option value="fusion-omni">Fusion / Omni references</option><option value="transition-extension">Transition / Extension</option></select></div><div><div class="label">Story duration</div><input class="v34Duration" type="number" min="1" max="120" value="${duration}"></div></div><label class="v34Check"><input class="v34Audio" type="checkbox" checked> Preserve / optimize native audio cues</label><div class="v34Info"><b>V6 cleanup:</b> strongest instruction first · subject/action/location · one primary camera move per shot · concrete lens/light cues · physical motion instead of vague “fast” · positive stability constraints · reference-aware I2V/Fusion wording. ${refs?`Detected ${refs} @reference token${refs===1?'':'s'}.`:''}</div><button type="button" class="btn gold full v34Run">✨ OPTIMIZE FINAL PROMPT FOR PIXVERSE V6</button><div class="v34Status">Ready. Your original prompt stays unchanged until you explicitly replace it.</div><div class="v34Result"></div><div class="v34Verified">Official guidance checked 31 Aug 2026 · <a href="https://docs.platform.pixverse.ai/v6-released-2056814m0" target="_blank" rel="noopener">V6 docs ↗</a> · <a href="https://pixverse.ai/en/blog/ai-video-prompt-guide-7-tested-fixes" target="_blank" rel="noopener">PixVerse prompt research ↗</a></div></div>`;
    block.insertAdjacentElement('afterend',d);
    d.querySelector('.v34Run').onclick=()=>run(block,d);
    return d;
  }

  async function run(block,panel){
    const source=String(block.textContent||'').trim(),status=panel.querySelector('.v34Status'),btn=panel.querySelector('.v34Run'),out=panel.querySelector('.v34Result');
    if(!source){status.textContent='No prompt found.';status.className='v34Status err';return}
    const old=btn.textContent;btn.disabled=true;btn.textContent='PixVerse V6 optimizing…';status.textContent='Applying V6-specific prompt structure and checking 15s clip limits…';status.className='v34Status work';out.innerHTML='';
    try{
      const body={action:'pixverse-v6-optimize',currentPrompt:source,duration:Number(panel.querySelector('.v34Duration').value)||12,pixverseMode:panel.querySelector('.v34Mode').value,referenceCount:refCount(source),audio:panel.querySelector('.v34Audio').checked};
      const r=await fetch('/api/director',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const j=await r.json().catch(()=>({}));if(!r.ok)throw Error(j.error||'PixVerse optimization failed');
      render(j,block,panel);status.textContent=`PixVerse V6 optimization ready · ${j.parts?.length||1} generation${(j.parts?.length||1)===1?'':'s'} ✓`;status.className='v34Status';
    }catch(e){status.textContent=e.message||String(e);status.className='v34Status err'}finally{btn.disabled=false;btn.textContent=old}
  }

  function render(j,block,panel){
    const out=panel.querySelector('.v34Result'),parts=Array.isArray(j.parts)?j.parts:[];
    const notes=(j.optimizationNotes||[]).map(x=>`<div>• ${esc(x)}</div>`).join('');
    const settings=j.recommendedSettings||{};
    out.innerHTML=`<div class="v34Meta"><b>${esc(j.pixverseMode||'PixVerse V6')}</b> · ${esc(j.summary||'Final prompt optimized for V6.')}</div>${notes?`<div class="v34Notes">${notes}</div>`:''}<div class="v34Meta">Recommended: ${esc(settings.model||'v6')} · ${esc(settings.aspectRatio||'9:16')} · ${esc(settings.quality||'1080p')} · audio ${settings.audio===false?'off':'on'}</div>${parts.map((p,i)=>`<div class="v34Part" data-i="${i}"><div class="v34PartTop"><span>PIXVERSE PART ${p.part||i+1} · ${p.duration||''}s · ${p.promptChars||String(p.prompt||'').length} chars</span></div><div class="v34Code">${esc(p.prompt||'')}</div>${p.continuityBridge?`<div class="v34Meta" style="margin-top:6px"><b>Bridge:</b> ${esc(p.continuityBridge)}</div>`:''}<div class="v34Actions"><button type="button" class="btn v34Copy" data-i="${i}">📋 Copy</button>${parts.length===1?`<button type="button" class="btn v34Replace" data-i="${i}">↺ Replace current prompt</button>`:''}</div></div>`).join('')}`;
    out.querySelectorAll('.v34Copy').forEach(b=>b.onclick=()=>copy(parts[+b.dataset.i]?.prompt||'',b));
    out.querySelectorAll('.v34Replace').forEach(b=>b.onclick=()=>{const p=parts[+b.dataset.i]?.prompt||'';if(!p)return;block.textContent=p;block.dispatchEvent(new Event('input',{bubbles:true}));const old=b.textContent;b.textContent='Replaced ✓';setTimeout(()=>b.textContent=old,1000)});
  }
  async function copy(text,b){try{await navigator.clipboard.writeText(text);const old=b.textContent;b.textContent='Copied ✓';setTimeout(()=>b.textContent=old,900)}catch{}}

  function scan(){
    installStyle();
    const selectors=['#prompt .code','#extPrompt','#anaPrompt','#v31DirectorOutput pre','.v33mPrompt'];
    const seen=new Set();selectors.forEach(sel=>$$(sel).forEach(b=>{if(!seen.has(b)&&eligible(b)){seen.add(b);shell(b)}}));
    const h=$('.top h1');if(h)h.textContent='AvoMiez Director V3.4';const p=$('.top p');if(p)p.textContent='Voice Idea → Micro Drama → Model Intelligence → Reference Builder → PixVerse V6 Final Optimizer';
  }
  let timer;const obs=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(scan,110)});obs.observe(document.body,{subtree:true,childList:true});scan();
  console.log('AvoMiez Director V3.4 PixVerse V6 Final Optimizer ready');
})();
