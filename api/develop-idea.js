import{AVOMIEZ_LOCK,callM3,enforcePost,send}from'../lib/gmi.js';
import{normalizeVideoDuration,durationPromptGuidance}from'../lib/duration-policy.js';
import{normalizeToneOverlay,toneOverlayText}from'../lib/tone-overlay.js';

const system=`You are the Creative Mixer / Idea Workshop inside AvoMiez Director V2.9. ${AVOMIEZ_LOCK}\nTurn a creator's RAW STORY IDEA plus the CURRENT CREATIVE MIX into stronger, visually executable short-form video directions before the final production prompt is written. Preserve the creator's core premise, named relationships, secret reveals and important jokes. Do not flatten unusual ideas into generic cat content. Use the selected duration, primary style, secondary tone overlay, loop choice, reference roles, motion-reference intent and director notes as one coherent creative brief.\n\nCreate strong first-second curiosity, readable escalation, at least one memorable visual turn, a satisfying payoff/reveal and replay value where appropriate. For 16–30 second videos, use the extra runtime for progression and setup/payoff rather than bloated description. Keep concepts realistic for one Seedance 2.5 / MiniMax H3 / PixVerse generation. Never promise guaranteed virality. Return JSON only.`;

function refsText(refs=[]){
  if(!refs.length)return'No image references attached.';
  return refs.slice(0,9).map((r,i)=>`${r.id||'@image'+(i+1)} = ${r.label||r.type||'reference'} | role: ${r.type||'other'} | instruction: ${r.hint||'use only for its assigned role'}`).join('\n');
}

function user(b){
  const duration=normalizeVideoDuration(b.duration);
  const tone=normalizeToneOverlay(b.toneOverlay);
  const refs=Array.isArray(b.references)?b.references.slice(0,9):[];
  return`RAW STORY IDEA:\n${String(b.idea||'').trim()}\n\nCURRENT CREATIVE MIX:\n- Duration: ${duration}s, vertical 9:16\n- Primary style / genre: ${b.style||'cinematic'}\n- Audio direction: ${b.audio||'native synchronized sound'}\n- Seamless loop requested: ${b.loop?'yes':'no / optional'}\n- Motion reference: ${b.motionReference?'yes — use only for the assigned motion/camera/timing purpose':'none'}\n- Director notes: ${b.directorNotes||'none'}\n\n${toneOverlayText(tone)}\n\nACTIVE REFERENCE MAP / ROLES:\n${refsText(refs)}\n\n${durationPromptGuidance(duration)}\n\nTASK:\n1. First, identify the strongest hook, secret/reveal, emotional/comedic engine and visual escalation already hidden inside the raw idea.\n2. Develop THREE meaningfully different directions from the SAME core premise:\n   A = Viral/Punchy: fastest curiosity + strongest retention progression.\n   B = Cinematic Story: strongest atmosphere, character relationship and premium visual arc.\n   C = Wildcard: surprising but coherent escalation, still executable and faithful to the premise.\n3. Every direction must use the CURRENT CREATIVE MIX rather than ignoring it. If a Tone Overlay is active, weave it into the story beats.\n4. Respect reference roles. Character refs control identity; scene/style/prop/vehicle/outfit refs only influence their assigned elements.\n5. Do NOT write the final <=5000-character generation prompt yet. This step develops the story that will later be sent to Director.\n\nReturn exactly:\n{\n  "mixSummary":"one concise line describing the settings actually used",\n  "coreEngine":{"hook":"","secretOrReveal":"","relationship":"","escalation":"","payoff":""},\n  "variants":[\n    {"id":"A","title":"","strength":"Viral / Punchy","hook":"0-2s hook","story":"complete upgraded editable story in 3-6 concise sentences","beats":[{"time":"0-3s","beat":""}],"whyItWorks":"","directorNote":"short note to carry into final Director prompt"},\n    {"id":"B","title":"","strength":"Cinematic Story","hook":"","story":"","beats":[{"time":"0-3s","beat":""}],"whyItWorks":"","directorNote":""},\n    {"id":"C","title":"","strength":"Wildcard","hook":"","story":"","beats":[{"time":"0-3s","beat":""}],"whyItWorks":"","directorNote":""}\n  ],\n  "recommendedVariant":"A|B|C",\n  "recommendationWhy":"one concise sentence"\n}\n\nBeat timing for each variant must cover the full ${duration}s with no gaps, but stay concise.`;
}

export default async function handler(req,res){
  if(!enforcePost(req,res))return;
  try{
    const b=req.body||{};
    if(!String(b.idea||'').trim())return send(res,400,{error:'Write your story idea first.'});
    const refs=Array.isArray(b.references)?b.references.slice(0,9):[];
    const imgs=Array.isArray(b.referenceImages)?b.referenceImages.slice(0,9):[];
    const prompt=user({...b,references:refs});
    let r;
    if(imgs.length){
      const content=[{type:'text',text:prompt}];
      imgs.forEach((url,i)=>{
        if(typeof url!=='string'||!url.startsWith('data:image/'))return;
        content.push({type:'text',text:`Creative Mixer reference ${i+1}: ${refs[i]?.id||'@image'+(i+1)} = ${refs[i]?.label||refs[i]?.type||'reference'}; role ${refs[i]?.type||'other'}.`});
        content.push({type:'image_url',image_url:{url},detail:'low'});
      });
      r=await callM3({messages:[{role:'system',content:system},{role:'user',content}],temperature:.72,maxTokens:3300});
    }else{
      r=await callM3({system,user:prompt,temperature:.72,maxTokens:3000});
    }
    return send(res,200,{...r.data,_meta:{model:r.model,usage:r.usage,duration:normalizeVideoDuration(b.duration),referencesAnalyzed:imgs.length,toneOverlay:normalizeToneOverlay(b.toneOverlay)}});
  }catch(e){return send(res,500,{error:e.message||'Idea development failed'})}
}
