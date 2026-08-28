(()=>{
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const direct=$('#direct');
  if(!direct){console.error('V2.4: base Director UI not found');return;}

  let refs=[];
  const TYPES=['Character','Style','Scene','Prop','Vehicle','Outfit','Secondary Character','Other'];

  const panel=document.createElement('div');
  panel.id='v24ReferenceDirector';
  panel.innerHTML=`<div style="margin-top:12px;padding:10px;border:1px solid #4a3b20;border-radius:13px;background:#0d1119">
    <div class="analysisBadge">V2.4 REFERENCE DIRECTOR</div>
    <div class="label">Image references <span class="muted">up to 9 · character, scene, style, prop, vehicle, outfit…</span></div>
    <input id="v24RefFiles" type="file" accept="image/*" multiple>
    <div class="tiny" style="margin-top:5px">Tip: choose the AvoMiez master sheet as <b>Character</b>. Character references are mapped first as @image1.</div>
    <div id="v24RefGrid" class="refGrid"></div>

    <div class="label">Motion reference <span class="muted">optional video · sampled locally into 5 keyframes</span></div>
    <input id="v24MotionFile" type="file" accept="video/*">
    <video id="v24MotionPreview" class="preview" controls playsinline muted></video>

    <div class="row"><div><div class="label">Motion preset</div><select id="v24MotionPreset"><option value="balanced" selected>Balanced</option><option value="close">Stay close</option><option value="wild">Go wild</option></select></div><div><div class="label">Reference mode</div><select id="v24RefMode"><option value="assigned" selected>Use only assigned roles</option><option value="strong">Stronger visual guidance</option></select></div></div>

    <div class="label">Preserve from motion reference</div>
    <div class="lockGrid"><label class="lock"><input id="v24KeepCamera" type="checkbox" checked> Camera</label><label class="lock"><input id="v24KeepTiming" type="checkbox" checked> Timing</label><label class="lock"><input id="v24KeepAction" type="checkbox" checked> Core action</label><label class="lock"><input id="v24KeepInteraction" type="checkbox" checked> Interactions</label><label class="lock"><input id="v24KeepSetting" type="checkbox"> Setting</label><label class="lock"><input id="v24KeepEnding" type="checkbox"> Ending</label></div>

    <div class="label">Creator direction <span class="muted">optional</span></div>
    <textarea id="v24CreatorNote" style="min-height:82px" placeholder="Keep AvoMiez identity exact. Use the video only for choreography/camera/timing. Change the setting, make the payoff stronger…"></textarea>
    <div id="v24Info" class="tiny" style="margin-top:6px">No extra references selected — standard Create still works.</div>
  </div>`;
  direct.parentNode.insertBefore(panel,direct);

  function updateInfo(){
    const m=$('#v24MotionFile')?.files?.[0];
    const n=refs.length;
    $('#v24Info').textContent=n+' image reference'+(n===1?'':'s')+(m?' + motion video':'')+' ready for V2.4';
  }

  function renderRefs(){
    const grid=$('#v24RefGrid');
    grid.innerHTML=refs.map((r,i)=>`<div class="refCard"><img src="${r.data}"><select class="v24Type" data-i="${i}">${TYPES.map(t=>`<option ${t.toLowerCase()===r.type?'selected':''}>${t}</option>`).join('')}</select><input class="v24Label" data-i="${i}" value="${esc(r.label)}" placeholder="Reference label"><input class="v24Hint" data-i="${i}" value="${esc(r.hint||'')}" placeholder="How should M3 use it?"><button class="btn v24Remove" data-i="${i}" style="width:100%;margin-top:5px;min-height:34px">Remove</button></div>`).join('');
    $$('.v24Type').forEach(x=>x.onchange=()=>{refs[+x.dataset.i].type=x.value.toLowerCase();});
    $$('.v24Label').forEach(x=>x.oninput=()=>{refs[+x.dataset.i].label=x.value;});
    $$('.v24Hint').forEach(x=>x.oninput=()=>{refs[+x.dataset.i].hint=x.value;});
    $$('.v24Remove').forEach(x=>x.onclick=()=>{refs.splice(+x.dataset.i,1);renderRefs();updateInfo();});
  }

  function compressImage(file){
    return new Promise((resolve,reject)=>{
      const fr=new FileReader();
      fr.onload=()=>{
        const im=new Image();
        im.onload=()=>{
          try{
            const max=700,scale=Math.min(1,max/Math.max(im.width,im.height));
            const c=document.createElement('canvas');
            c.width=Math.max(1,Math.round(im.width*scale));
            c.height=Math.max(1,Math.round(im.height*scale));
            c.getContext('2d').drawImage(im,0,0,c.width,c.height);
            resolve(c.toDataURL('image/jpeg',.68));
          }catch(e){reject(e);}
        };
        im.onerror=()=>reject(Error('Could not read image'));
        im.src=fr.result;
      };
      fr.onerror=reject;
      fr.readAsDataURL(file);
    });
  }

  $('#v24RefFiles').onchange=async e=>{
    const files=[...(e.target.files||[])].slice(0,9);
    refs=[];
    for(let i=0;i<files.length;i++){
      try{
        refs.push({
          data:await compressImage(files[i]),
          type:i===0?'character':'other',
          label:i===0?'AvoMiez master character':files[i].name.replace(/\.[^.]+$/,''),
          hint:i===0?'strict identity anchor; do not redesign AvoMiez':'use only for its assigned role'
        });
      }catch(e){console.warn('Reference skipped',e);}
    }
    renderRefs();updateInfo();
  };

  $('#v24MotionFile').onchange=e=>{
    const f=e.target.files?.[0],v=$('#v24MotionPreview');
    if(f){v.src=URL.createObjectURL(f);v.style.display='block';}
    else{v.removeAttribute('src');v.style.display='none';}
    updateInfo();
  };

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

  async function post(body){
    const r=await fetch('/api/director',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json().catch(()=>({}));
    if(!r.ok)throw Error(j.error||'Request failed');
    return j;
  }

  const fresh=direct.cloneNode(true);
  direct.replaceWith(fresh);
  fresh.textContent='✨ DIRECT V2.4 WITH REFERENCES';
  fresh.onclick=async()=>{
    const errorBox=$('#createErr');
    errorBox.innerHTML='';fresh.disabled=true;
    const original='✨ DIRECT V2.4 WITH REFERENCES';
    fresh.textContent='M3 analyzing references…';
    try{
      const ordered=[...refs].sort((a,b)=>(a.type==='character'?-1:0)-(b.type==='character'?-1:0));
      const references=ordered.map((x,i)=>({id:'@image'+(i+1),type:x.type,label:x.label||('Reference '+(i+1)),hint:x.hint||'use only for its assigned purpose'}));
      const referenceImages=ordered.map(x=>x.data);
      const mf=$('#v24MotionFile').files?.[0];
      let motionFrames=[];
      if(mf){fresh.textContent='Sampling motion keyframes…';motionFrames=await sampleVideo(mf,5);fresh.textContent='M3 directing V2.4…';}
      const preserve=[];
      if($('#v24KeepCamera').checked)preserve.push('camera');
      if($('#v24KeepTiming').checked)preserve.push('timing');
      if($('#v24KeepAction').checked)preserve.push('core action');
      if($('#v24KeepInteraction').checked)preserve.push('object interactions');
      if($('#v24KeepSetting').checked)preserve.push('setting');
      if($('#v24KeepEnding').checked)preserve.push('ending');
      const strong=$('#v24RefMode').value==='strong';
      const creatorNote=[$('#v24CreatorNote').value,strong?'Give assigned references stronger visual influence while preserving their roles.':''].filter(Boolean).join('\n');
      const motionReference=mf?{
        preset:$('#v24MotionPreset').value,
        preserve,
        note:mf.name,
        instructions:'Use sampled frames only as motion, choreography, camera and timing evidence. '+($('#v24KeepSetting').checked?'Preserve the source setting when visually supported.':'Do not preserve the source setting unless creator direction asks for it.')
      }:null;
      const j=await post({
        idea:$('#idea').value,
        duration:+$('#duration').value,
        style:$('#style').value,
        audio:$('#audio').value,
        loop:$('#loop').checked,
        creatorNote,references,referenceImages,motionReference,motionFrames
      });
      if(typeof window.renderDirector!=='function')throw Error('V2.4 renderer unavailable');
      window.renderDirector(j);
      const plan=$('#plan');
      if(j.referenceCheck?.length)plan.insertAdjacentHTML('beforeend',`<details class="acc" open><summary>V2.4 Reference Check</summary><div class="body"><ul>${j.referenceCheck.map(x=>'<li>'+esc(x)+'</li>').join('')}</ul></div></details>`);
      if(j.motionBlueprint?.length)plan.insertAdjacentHTML('beforeend',`<details class="acc"><summary>Motion Blueprint</summary><div class="body">${j.motionBlueprint.map(x=>`<details class="shot"><summary>${esc(x.time||'Beat')}</summary><div class="body"><b>Motion:</b> ${esc(x.motion||'')}<br><b>Camera:</b> ${esc(x.camera||'')}<br><b>Timing:</b> ${esc(x.timing||'')}</div></details>`).join('')}</div></details>`);
      if(typeof window.tab==='function')window.tab('prompt');
      setTimeout(()=>$('#createOutput')?.scrollIntoView({behavior:'smooth',block:'start'}),80);
    }catch(e){errorBox.innerHTML='<div class="error">'+esc(e.message)+'</div>';}
    finally{fresh.disabled=false;fresh.textContent=original;}
  };

  console.log('AvoMiez Director V2.4 reference runtime ready');
})();