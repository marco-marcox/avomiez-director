(()=>{
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const TYPES=['Character','Style','Scene','Prop','Vehicle','Outfit','Secondary Character','Other'];

  const direct=$('#direct');
  if(!direct){console.error('V2.5: base Director UI not found');return;}

  const state={
    createRefs:[],
    inheritedRefs:[],
    extraRefs:[],
    inheritedReferenceMap:'',
    lastPart1Prompt:'',
    lastPart1Idea:'',
    lastCombinedRefs:[]
  };
  window.AvoMiezV25=state;

  function compressImage(file,max=700,quality=.68){
    return new Promise((resolve,reject)=>{
      const fr=new FileReader();
      fr.onload=()=>{
        const im=new Image();
        im.onload=()=>{
          try{
            const scale=Math.min(1,max/Math.max(im.width,im.height));
            const c=document.createElement('canvas');
            c.width=Math.max(1,Math.round(im.width*scale));
            c.height=Math.max(1,Math.round(im.height*scale));
            c.getContext('2d').drawImage(im,0,0,c.width,c.height);
            resolve(c.toDataURL('image/jpeg',quality));
          }catch(e){reject(e);}
        };
        im.onerror=()=>reject(Error('Could not read image'));
        im.src=fr.result;
      };
      fr.onerror=reject;
      fr.readAsDataURL(file);
    });
  }

  function normalizeRefs(items){
    return [...items]
      .filter(x=>x&&x.data)
      .sort((a,b)=>(a.type==='character'?-1:0)-(b.type==='character'?-1:0))
      .slice(0,9)
      .map((x,i)=>({...x,id:'@image'+(i+1)}));
  }

  function refsToPayload(items){
    const ordered=normalizeRefs(items);
    return {
      ordered,
      references:ordered.map((x,i)=>({
        id:'@image'+(i+1),
        type:x.type||'other',
        label:x.label||('Reference '+(i+1)),
        hint:x.hint||'use only for its assigned purpose',
        inherited:!!x.inherited
      })),
      referenceImages:ordered.map(x=>x.data)
    };
  }

  function sampleVideo(file,n=5){
    return new Promise((resolve,reject)=>{
      const v=document.createElement('video'),url=URL.createObjectURL(file);
      v.muted=true;v.playsInline=true;v.preload='metadata';v.src=url;
      v.onloadedmetadata=async()=>{
        try{
          const c=document.createElement('canvas'),ctx=c.getContext('2d'),out=[];
          for(let i=0;i<n;i++){
            const t=Math.max(0,Math.min(Math.max(0,v.duration-.08),v.duration*((i+.5)/n)));
            await new Promise((ok,bad)=>{v.onseeked=ok;v.onerror=bad;v.currentTime=t;});
            const sc=Math.min(1,560/v.videoWidth);
            c.width=Math.max(1,Math.round(v.videoWidth*sc));
            c.height=Math.max(1,Math.round(v.videoHeight*sc));
            ctx.drawImage(v,0,0,c.width,c.height);
            out.push(c.toDataURL('image/jpeg',.62));
          }
          URL.revokeObjectURL(url);resolve(out);
        }catch(e){URL.revokeObjectURL(url);reject(e);}
      };
      v.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Could not read motion video'));};
    });
  }

  async function postJson(url,body){
    const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json().catch(()=>({}));
    if(!r.ok)throw Error(j.error||'Request failed');
    return j;
  }

  const createPanel=document.createElement('div');
  createPanel.id='v25ReferenceDirector';
  createPanel.innerHTML=`<div style="margin-top:12px;padding:10px;border:1px solid #4a3b20;border-radius:13px;background:#0d1119">
    <div class="analysisBadge">V2.5 REFERENCE DIRECTOR</div>
    <div class="label">Image references <span class="muted">up to 9 · character, scene, style, prop, vehicle, outfit…</span></div>
    <input id="v25RefFiles" type="file" accept="image/*" multiple>
    <div class="tiny" style="margin-top:5px">Tip: choose the AvoMiez master sheet as <b>Character</b>. Character references are mapped first as @image1.</div>
    <div id="v25RefGrid" class="refGrid"></div>

    <div class="label">Motion reference <span class="muted">optional video · sampled locally into 5 keyframes</span></div>
    <input id="v25MotionFile" type="file" accept="video/*">
    <video id="v25MotionPreview" class="preview" controls playsinline muted></video>

    <div class="row"><div><div class="label">Motion preset</div><select id="v25MotionPreset"><option value="balanced" selected>Balanced</option><option value="close">Stay close</option><option value="wild">Go wild</option></select></div><div><div class="label">Reference mode</div><select id="v25RefMode"><option value="assigned" selected>Use only assigned roles</option><option value="strong">Stronger visual guidance</option></select></div></div>

    <div class="label">Preserve from motion reference</div>
    <div class="lockGrid"><label class="lock"><input id="v25KeepCamera" type="checkbox" checked> Camera</label><label class="lock"><input id="v25KeepTiming" type="checkbox" checked> Timing</label><label class="lock"><input id="v25KeepAction" type="checkbox" checked> Core action</label><label class="lock"><input id="v25KeepInteraction" type="checkbox" checked> Interactions</label><label class="lock"><input id="v25KeepSetting" type="checkbox"> Setting</label><label class="lock"><input id="v25KeepEnding" type="checkbox"> Ending</label></div>

    <div class="label">Creator direction <span class="muted">optional</span></div>
    <textarea id="v25CreatorNote" style="min-height:82px" placeholder="Keep AvoMiez identity exact. Use the video only for choreography/camera/timing. Change the setting, make the payoff stronger…"></textarea>
    <div id="v25Info" class="tiny" style="margin-top:6px">No extra references selected — standard Create still works.</div>
  </div>`;
  direct.parentNode.insertBefore(createPanel,direct);

  function updateCreateInfo(){
    const m=$('#v25MotionFile')?.files?.[0];
    const n=state.createRefs.length;
    $('#v25Info').textContent=n+' image reference'+(n===1?'':'s')+(m?' + motion video':'')+' ready for V2.5';
  }

  function renderCreateRefs(){
    const grid=$('#v25RefGrid');
    grid.innerHTML=state.createRefs.map((r,i)=>`<div class="refCard"><img src="${r.data}"><select class="v25Type" data-i="${i}">${TYPES.map(t=>`<option ${t.toLowerCase()===r.type?'selected':''}>${t}</option>`).join('')}</select><input class="v25Label" data-i="${i}" value="${esc(r.label)}" placeholder="Reference label"><input class="v25Hint" data-i="${i}" value="${esc(r.hint||'')}" placeholder="How should M3 use it?"><button class="btn v25Remove" data-i="${i}" style="width:100%;margin-top:5px;min-height:34px">Remove</button></div>`).join('');
    $$('.v25Type').forEach(x=>x.onchange=()=>{state.createRefs[+x.dataset.i].type=x.value.toLowerCase();});
    $$('.v25Label').forEach(x=>x.oninput=()=>{state.createRefs[+x.dataset.i].label=x.value;});
    $$('.v25Hint').forEach(x=>x.oninput=()=>{state.createRefs[+x.dataset.i].hint=x.value;});
    $$('.v25Remove').forEach(x=>x.onclick=()=>{state.createRefs.splice(+x.dataset.i,1);renderCreateRefs();updateCreateInfo();});
  }

  $('#v25RefFiles').onchange=async e=>{
    const files=[...(e.target.files||[])].slice(0,9);
    state.createRefs=[];
    for(let i=0;i<files.length;i++){
      try{
        state.createRefs.push({
          data:await compressImage(files[i]),
          type:i===0?'character':'other',
          label:i===0?'AvoMiez master character':files[i].name.replace(/\.[^.]+$/,''),
          hint:i===0?'strict identity anchor; do not redesign AvoMiez':'use only for its assigned role'
        });
      }catch(e){console.warn('Reference skipped',e);}
    }
    renderCreateRefs();updateCreateInfo();
  };

  $('#v25MotionFile').onchange=e=>{
    const f=e.target.files?.[0],v=$('#v25MotionPreview');
    if(f){v.src=URL.createObjectURL(f);v.style.display='block';}
    else{v.removeAttribute('src');v.style.display='none';}
    updateCreateInfo();
  };

  function installContinueCreateButton(j,ordered){
    setTimeout(()=>{
      const prompt=$('#prompt');
      if(!prompt)return;
      let b=$('#v25ContinueExtend');
      if(!b){
        b=document.createElement('button');
        b.id='v25ContinueExtend';
        b.className='btn full';
        b.textContent='🧩 Continue as Part 2 — keep references';
        prompt.appendChild(b);
      }
      b.onclick=()=>{
        state.inheritedRefs=ordered.map(x=>({...x,inherited:true,use:true}));
        state.inheritedReferenceMap=(j.referenceCheck||[]).join('\n');
        state.lastPart1Prompt=j.h3Prompt||'';
        state.lastPart1Idea=$('#idea').value;
        $('#part1Idea').value=state.lastPart1Idea;
        $('#part1Prompt').value=state.lastPart1Prompt;
        $('#nextDirection').value='';
        renderExtendRefs();
        if(typeof window.switchMode==='function')window.switchMode('extend');
      };
    },0);
  }

  const createButton=direct.cloneNode(true);
  direct.replaceWith(createButton);
  createButton.textContent='✨ DIRECT V2.5 WITH REFERENCES';
  createButton.onclick=async()=>{
    const errorBox=$('#createErr');
    errorBox.innerHTML='';createButton.disabled=true;
    createButton.textContent='M3 analyzing references…';
    try{
      const {ordered,references,referenceImages}=refsToPayload(state.createRefs);
      const mf=$('#v25MotionFile').files?.[0];
      let motionFrames=[];
      if(mf){createButton.textContent='Sampling motion keyframes…';motionFrames=await sampleVideo(mf,5);createButton.textContent='M3 directing V2.5…';}
      const preserve=[];
      if($('#v25KeepCamera').checked)preserve.push('camera');
      if($('#v25KeepTiming').checked)preserve.push('timing');
      if($('#v25KeepAction').checked)preserve.push('core action');
      if($('#v25KeepInteraction').checked)preserve.push('object interactions');
      if($('#v25KeepSetting').checked)preserve.push('setting');
      if($('#v25KeepEnding').checked)preserve.push('ending');
      const strong=$('#v25RefMode').value==='strong';
      const creatorNote=[$('#v25CreatorNote').value,strong?'Give assigned references stronger visual influence while preserving their roles.':''].filter(Boolean).join('\n');
      const motionReference=mf?{preset:$('#v25MotionPreset').value,preserve,note:mf.name,instructions:'Use sampled frames only as motion, choreography, camera and timing evidence. '+($('#v25KeepSetting').checked?'Preserve the source setting when visually supported.':'Do not preserve the source setting unless creator direction asks for it.')} : null;
      const j=await postJson('/api/director',{
        idea:$('#idea').value,duration:+$('#duration').value,style:$('#style').value,audio:$('#audio').value,loop:$('#loop').checked,
        creatorNote,references,referenceImages,motionReference,motionFrames
      });
      if(typeof window.renderDirector!=='function')throw Error('V2.5 renderer unavailable');
      window.renderDirector(j);
      const plan=$('#plan');
      if(j.referenceCheck?.length)plan.insertAdjacentHTML('beforeend',`<details class="acc" open><summary>V2.5 Reference Check</summary><div class="body"><ul>${j.referenceCheck.map(x=>'<li>'+esc(x)+'</li>').join('')}</ul></div></details>`);
      if(j.motionBlueprint?.length)plan.insertAdjacentHTML('beforeend',`<details class="acc"><summary>Motion Blueprint</summary><div class="body">${j.motionBlueprint.map(x=>`<details class="shot"><summary>${esc(x.time||'Beat')}</summary><div class="body"><b>Motion:</b> ${esc(x.motion||'')}<br><b>Camera:</b> ${esc(x.camera||'')}<br><b>Timing:</b> ${esc(x.timing||'')}</div></details>`).join('')}</div></details>`);
      installContinueCreateButton(j,ordered);
      if(typeof window.tab==='function')window.tab('prompt');
      setTimeout(()=>$('#createOutput')?.scrollIntoView({behavior:'smooth',block:'start'}),80);
    }catch(e){errorBox.innerHTML='<div class="error">'+esc(e.message)+'</div>';}
    finally{createButton.disabled=false;createButton.textContent='✨ DIRECT V2.5 WITH REFERENCES';}
  };

  const oldExtend=$('#extendBtn');
  if(oldExtend){
    const extendPanel=document.createElement('div');
    extendPanel.id='v25ExtendReferences';
    extendPanel.innerHTML=`<div style="margin-top:12px;padding:10px;border:1px solid #4a3b20;border-radius:13px;background:#0d1119">
      <div class="analysisBadge">V2.5 EXTEND REFERENCES</div>
      <div class="tiny">Keep Part 1 visually consistent, inherit its reference map, and optionally add new recurring elements for Part 2.</div>

      <div class="label">Inherited from Part 1 <span id="v25InheritedCount" class="muted"></span></div>
      <div id="v25InheritedGrid" class="refGrid"></div>
      <div class="buttons" style="margin-top:7px"><button id="v25UseAllInherited" class="btn">✓ Use all</button><button id="v25ClearInherited" class="btn">Clear inherited</button></div>

      <div class="label">Add references for Part 2 <span class="muted">combined maximum 9</span></div>
      <input id="v25ExtendFiles" type="file" accept="image/*" multiple>
      <div class="tiny" style="margin-top:5px">Add a new character, outfit, vehicle, prop, environment or style reference. Existing Part 1 references remain available above.</div>
      <div id="v25ExtraGrid" class="refGrid"></div>

      <div class="label">Continuity locks</div>
      <div class="lockGrid"><label class="lock"><input id="v25LockIdentity" type="checkbox" checked> AvoMiez identity</label><label class="lock"><input id="v25LockCharacters" type="checkbox" checked> Recurring characters</label><label class="lock"><input id="v25LockWorld" type="checkbox" checked> Scene / world</label><label class="lock"><input id="v25LockProps" type="checkbox" checked> Props / vehicles</label></div>
      <label class="lock" style="margin-top:6px"><input id="v25InheritMap" type="checkbox" checked> Carry Part 1 reference map into the new Part 2 prompt</label>

      <div class="label">Part 2 reference direction <span class="muted">optional</span></div>
      <textarea id="v25ExtendRefNote" style="min-height:76px" placeholder="Keep @image1 exact. Add the new vehicle from the extra reference, but preserve the same princess and neon world from Part 1…"></textarea>
      <div id="v25ExtendInfo" class="tiny" style="margin-top:6px">No inherited references yet. You can still add new ones.</div>
    </div>`;
    oldExtend.parentNode.insertBefore(extendPanel,oldExtend);

    function selectedInherited(){return state.inheritedRefs.filter(x=>x.use!==false);}
    function combinedExtendRefs(){return normalizeRefs([...selectedInherited(),...state.extraRefs]);}

    function updateExtendInfo(){
      const inherited=selectedInherited().length,extra=state.extraRefs.length,total=Math.min(9,inherited+extra);
      $('#v25InheritedCount').textContent='· '+state.inheritedRefs.length+' available';
      $('#v25ExtendInfo').textContent=inherited+' inherited + '+extra+' new = '+total+' reference'+(total===1?'':'s')+' will be sent to Part 2';
    }

    window.renderExtendRefs=function renderExtendRefsPublic(){renderExtendRefs();};
    function renderExtendRefs(){
      const ig=$('#v25InheritedGrid');
      ig.innerHTML=state.inheritedRefs.length?state.inheritedRefs.map((r,i)=>`<div class="refCard"><img src="${r.data}"><label class="lock" style="margin-top:5px"><input class="v25InheritedUse" data-i="${i}" type="checkbox" ${r.use===false?'':'checked'}> Use in Part 2</label><select class="v25InheritedType" data-i="${i}">${TYPES.map(t=>`<option ${t.toLowerCase()===r.type?'selected':''}>${t}</option>`).join('')}</select><input class="v25InheritedLabel" data-i="${i}" value="${esc(r.label||'')}"><div class="tiny" style="margin-top:5px">Inherited</div></div>`).join(''):'<div class="tiny">No inherited images yet. Use “Continue as Part 2” from Create/Analyze, or add new references below.</div>';
      $$('.v25InheritedUse').forEach(x=>x.onchange=()=>{state.inheritedRefs[+x.dataset.i].use=x.checked;updateExtendInfo();});
      $$('.v25InheritedType').forEach(x=>x.onchange=()=>{state.inheritedRefs[+x.dataset.i].type=x.value.toLowerCase();});
      $$('.v25InheritedLabel').forEach(x=>x.oninput=()=>{state.inheritedRefs[+x.dataset.i].label=x.value;});

      const eg=$('#v25ExtraGrid');
      eg.innerHTML=state.extraRefs.map((r,i)=>`<div class="refCard"><img src="${r.data}"><select class="v25ExtraType" data-i="${i}">${TYPES.map(t=>`<option ${t.toLowerCase()===r.type?'selected':''}>${t}</option>`).join('')}</select><input class="v25ExtraLabel" data-i="${i}" value="${esc(r.label||'')}" placeholder="Reference label"><input class="v25ExtraHint" data-i="${i}" value="${esc(r.hint||'')}" placeholder="How should Part 2 use it?"><button class="btn v25ExtraRemove" data-i="${i}" style="width:100%;margin-top:5px;min-height:34px">Remove</button></div>`).join('');
      $$('.v25ExtraType').forEach(x=>x.onchange=()=>{state.extraRefs[+x.dataset.i].type=x.value.toLowerCase();});
      $$('.v25ExtraLabel').forEach(x=>x.oninput=()=>{state.extraRefs[+x.dataset.i].label=x.value;});
      $$('.v25ExtraHint').forEach(x=>x.oninput=()=>{state.extraRefs[+x.dataset.i].hint=x.value;});
      $$('.v25ExtraRemove').forEach(x=>x.onclick=()=>{state.extraRefs.splice(+x.dataset.i,1);renderExtendRefs();});
      updateExtendInfo();
    }

    $('#v25UseAllInherited').onclick=()=>{state.inheritedRefs.forEach(x=>x.use=true);renderExtendRefs();};
    $('#v25ClearInherited').onclick=()=>{state.inheritedRefs=[];state.inheritedReferenceMap='';renderExtendRefs();};
    $('#v25ExtendFiles').onchange=async e=>{
      const available=Math.max(0,9-selectedInherited().length);
      const files=[...(e.target.files||[])].slice(0,available);
      state.extraRefs=[];
      for(let i=0;i<files.length;i++){
        try{
          state.extraRefs.push({data:await compressImage(files[i]),type:'other',label:files[i].name.replace(/\.[^.]+$/,''),hint:'new Part 2 reference; preserve inherited continuity unless this intentionally replaces an element'});
        }catch(err){console.warn('Extend reference skipped',err);}
      }
      renderExtendRefs();
    };

    function scrapeAnalyzeRefs(){
      const cards=$$('#refGrid .refCard');
      const found=cards.map(card=>({
        data:card.querySelector('img')?.src||'',
        type:(card.querySelector('.refType')?.value||'other').toLowerCase(),
        label:card.querySelector('.refLabel')?.value||'Analyze reference',
        hint:'inherited from Analyze/Reimagine Part 1',
        inherited:true,use:true
      })).filter(x=>x.data);
      if(found.length)state.inheritedRefs=found.slice(0,9);
      state.inheritedReferenceMap=$('#referenceMap')?.textContent||'';
      state.lastPart1Prompt=$('#anaPrompt')?.textContent||'';
      state.lastPart1Idea=$('#newIdea')?.value||$('#part1Idea')?.value||'';
    }

    const useCont=$('#useCont');
    if(useCont){
      useCont.addEventListener('click',()=>{
        scrapeAnalyzeRefs();
        setTimeout(()=>{
          if(state.lastPart1Prompt)$('#part1Prompt').value=state.lastPart1Prompt;
          renderExtendRefs();
        },0);
      },true);
    }

    const extendButton=oldExtend.cloneNode(true);
    oldExtend.replaceWith(extendButton);
    extendButton.textContent='🧩 DEVELOP NEXT PART + REFERENCES';
    extendButton.onclick=async()=>{
      const errBox=$('#extErr');
      errBox.innerHTML='';extendButton.disabled=true;extendButton.textContent='M3 extending continuity…';
      try{
        const {ordered,references,referenceImages}=refsToPayload(combinedExtendRefs());
        const continuityOptions={
          identity:$('#v25LockIdentity').checked,
          characters:$('#v25LockCharacters').checked,
          world:$('#v25LockWorld').checked,
          props:$('#v25LockProps').checked
        };
        const inheritedReferenceMap=$('#v25InheritMap').checked?state.inheritedReferenceMap:'';
        const j=await postJson('/api/extend',{
          part1Idea:$('#part1Idea').value,
          part1Prompt:$('#part1Prompt').value,
          nextDirection:$('#nextDirection').value,
          duration:+$('#extDuration').value,
          style:$('#extStyle').value,
          audio:'native synchronized sound',
          cliffhanger:$('#ending').value==='cliff',
          references,referenceImages,
          inheritedReferenceMap,
          continuityOptions,
          referenceDirection:$('#v25ExtendRefNote').value
        });
        $('#eEmpty').style.display='none';$('#eContent').style.display='block';
        $('#part2Idea').value=j.part2Idea||'';
        $('#bridgeHook').textContent=j.bridgeHook||'';
        $('#retention').innerHTML=(j.retentionBeats||[]).map(x=>`<details class="shot"><summary>${esc(x.time)}</summary><div class="body">${esc(x.beat)}</div></details>`).join('');
        $('#whyWatch').textContent=j.whyItKeepsWatching||'';
        $('#extPrompt').textContent=j.h3Prompt||'';
        $('#copyExt').onclick=()=>navigator.clipboard.writeText(j.h3Prompt||'');

        let info=$('#v25ExtendResult');
        if(!info){
          info=document.createElement('div');info.id='v25ExtendResult';
          const h3=[...$('#eContent').querySelectorAll('h3')].find(x=>x.textContent.trim()==='H3 Prompt');
          if(h3)$('#eContent').insertBefore(info,h3); else $('#eContent').prepend(info);
        }
        info.innerHTML=`<h3>Part 2 Reference Map</h3><div class="refMap">${esc((j.referenceMap||[]).join('\n')||'No image references supplied.')}</div><details class="acc" open><summary>Continuity Lock</summary><div class="body"><ul>${(j.continuityLock||[]).map(x=>'<li>'+esc(x)+'</li>').join('')}</ul></div></details>${j.referenceCheck?.length?`<details class="acc"><summary>Reference Check</summary><div class="body"><ul>${j.referenceCheck.map(x=>'<li>'+esc(x)+'</li>').join('')}</ul></div></details>`:''}`;

        state.lastCombinedRefs=ordered.map(x=>({...x,inherited:true,use:true}));
        state.inheritedReferenceMap=(j.referenceMap||[]).join('\n');
        state.lastPart1Prompt=j.h3Prompt||'';
        state.lastPart1Idea=j.part2Idea||'';

        let next=$('#v25NextEpisode');
        if(!next){
          next=document.createElement('button');next.id='v25NextEpisode';next.className='btn full';next.textContent='🧩 Continue to Part 3 — keep same references';
          $('#eContent').appendChild(next);
        }
        next.onclick=()=>{
          state.inheritedRefs=state.lastCombinedRefs.map(x=>({...x,use:true,inherited:true}));
          state.extraRefs=[];
          $('#part1Idea').value=state.lastPart1Idea;
          $('#part1Prompt').value=state.lastPart1Prompt;
          $('#nextDirection').value='';
          renderExtendRefs();
          document.querySelector('#extend')?.scrollIntoView({behavior:'smooth',block:'start'});
        };
        setTimeout(()=>$('#eContent').scrollIntoView({behavior:'smooth',block:'start'}),80);
      }catch(e){errBox.innerHTML='<div class="error">'+esc(e.message)+'</div>';}
      finally{extendButton.disabled=false;extendButton.textContent='🧩 DEVELOP NEXT PART + REFERENCES';}
    };

    renderExtendRefs();
  }

  console.log('AvoMiez Director V2.5 reference + continuity runtime ready');
})();
