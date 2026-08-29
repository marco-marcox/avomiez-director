import{AVOMIEZ_LOCK,callM3,enforcePost,send}from'../lib/gmi.js';
import{VIDEO_PROMPT_MAX_CHARS,enforceVideoPromptLimit}from'../lib/prompt-limit.js';
import{toneOverlayText,normalizeToneOverlay}from'../lib/tone-overlay.js';
import{normalizeVideoDuration,shotCountForDuration,durationPromptGuidance,softPromptTargetForDuration}from'../lib/duration-policy.js';

const system=`You are the Reimagine Director inside AvoMiez Director V2.8. Rethink an analyzed short-form video using its source mechanics, preserve/change locks, optional references, selected remix mode, custom 5–30 second duration, current editable idea, current prompt and optional SECONDARY TONE OVERLAY. ${AVOMIEZ_LOCK}\nThe tone overlay is additive and may be blended with any primary genre; never replace story logic, reference roles or character identity. Preserve only what the creator explicitly locks. Prioritize first-second hook, visual clarity, retention, readable action, payoff, replay potential and model-executable choreography. Longer duration should use compact time blocks, not more prose. Never claim guaranteed virality. Avoid engagement bait, unsafe challenges, copyrighted-character imitation and unnecessary text overlays. Every final h3Prompt must stay within ${VIDEO_PROMPT_MAX_CHARS} characters. Return valid JSON only.`;

const modeRules={
  viral:`Strengthen the opening 0.5–1.5 seconds, visible progression, payoff and replay trigger. No engagement bait.`,
  funnier:`Increase visual comedy through deadpan feline contrast, reaction timing, escalation and one memorable visual gag.`,
  cinematic:`Increase premium cinematography, lighting logic, camera intention, composition, depth and elegant progression without bloating the prompt.`,
  action:`Add clearer physical escalation and readable momentum while preserving natural feline anatomy.`,
  emotional:`Add a concise emotional thread, relationship beat or protective motive without slowing the hook.`,
  loop:`Engineer the ending to visually/logically rhyme with the opening when appropriate.`,
  different:`Keep only locked mechanics. Change setting, genre, conflict and payoff aggressively while staying coherent.`,
  inspire:`Create a fresh cousin concept that preserves the strongest underlying mechanics but changes the surface story.`,
  surprise:`Preserve the useful mechanic but jump to an unexpected setting, role, object, conflict or reveal.`,
  adopt:`Treat CURRENT IDEA as the chosen direction and polish it while respecting locks and references.`
};

function referenceMap(refs=[]){return refs.slice(0,9).map((r,i)=>`@image${i+1} = ${(r.type||'reference').toUpperCase()} REFERENCE — ${r.label||'optional visual reference'}`)}

function user(b){
  const mode=String(b.mode||'viral'),keep=b.keep||{},refs=Array.isArray(b.references)?b.references.slice(0,9):[],source=b.sourceAnalysis||{};
  const d=normalizeVideoDuration(b.duration),shots=shotCountForDuration(d),soft=softPromptTargetForDuration(d),refMap=referenceMap(refs);
  return `REIMAGINE MODE: ${mode}\nMODE DIRECTIVE: ${modeRules[mode]||modeRules.viral}\nTARGET: exactly ${d}s, vertical 9:16.\n\n${toneOverlayText(b.toneOverlay)}\n\nSOURCE ANALYSIS:\n${JSON.stringify(source)}\n\nCURRENT EDITABLE IDEA:\n${b.currentIdea||'none'}\n\nCURRENT H3 PROMPT:\n${b.currentPrompt||'none'}\n\nCREATOR NOTE:\n${b.creatorNote||'none'}\n\nPRESERVE LOCKS:\n${JSON.stringify(keep)}\n\nREFERENCE METADATA:\n${JSON.stringify(refs)}\nREFERENCE MAP LABELS:\n${refMap.join('\n')||'No optional references. @image1 should still be the strict AvoMiez master identity reference if supplied in the video tool.'}\n\n${durationPromptGuidance(d)}\nTONE RULE: weave the selected overlay through hook, lighting, reactions, sound design and payoff according to its strength. It remains a secondary flavor layered over the chosen direction.\nHARD PROMPT LIMIT: h3Prompt must be <= ${VIDEO_PROMPT_MAX_CHARS} characters; for ${d}s aim around ${soft} or less. Preserve reference IDs, identity locks, selected tone, exact timing, choreography and payoff before decorative detail.\n\nReturn exactly {"mode":"${mode}","changeSummary":"1-3 concise sentences","hook":"strong revised hook","idea":"complete editable revised idea","whyItWorks":"why structure improves clarity/retention without guaranteeing virality","referenceMap":["@image1 = ..."],"toneApplication":["2-4 concise notes"],"variants":[{"id":"A","title":"Viral Remix","strength":"Retention","idea":"alternate direction","promptDirection":"short instruction"},{"id":"B","title":"Cinematic Remix","strength":"Visual quality","idea":"alternate direction","promptDirection":"short instruction"},{"id":"C","title":"Wildcard Remix","strength":"Surprise","idea":"alternate direction","promptDirection":"short instruction"}],"storyboard":[{"shot":1,"start":0,"end":1.5,"title":"Cold Open","camera":"","action":"","purpose":"Hook","emotion":""}],"h3Prompt":"complete production-ready reference-to-video prompt within the character limit; state exact duration, primary direction and active secondary tone; include reference map, timing, camera, action, continuity, native audio and concise negative constraints"}. Storyboard must contain exactly ${shots} shots covering all ${d}s with no timing gaps.`;
}

export default async function handler(req,res){
  if(!enforcePost(req,res))return;
  try{
    const b=req.body||{};
    if(!b.currentIdea&&!b.sourceAnalysis)return send(res,400,{error:'Analyze a video or provide a current idea first.'});
    const duration=normalizeVideoDuration(b.duration),refs=Array.isArray(b.references)?b.references.slice(0,9):[],imgs=Array.isArray(b.referenceImages)?b.referenceImages.slice(0,9):[],tone=normalizeToneOverlay(b.toneOverlay);
    const content=[{type:'text',text:user({...b,duration,references:refs,toneOverlay:tone})}];
    imgs.forEach(url=>{if(typeof url==='string'&&url.startsWith('data:image/'))content.push({type:'image_url',image_url:{url},detail:'low'})});
    const r=await callM3({messages:[{role:'system',content:system},{role:'user',content}],temperature:['surprise','different','inspire'].includes(b.mode)?.78:.52,maxTokens:3500});
    const data={...r.data};
    const fit=await enforceVideoPromptLimit(data.h3Prompt,{label:'Reimagine Studio video prompt',duration});
    data.h3Prompt=fit.prompt;
    return send(res,200,{...data,_meta:{model:r.model,usage:r.usage,duration,referencesAnalyzed:imgs.length,toneOverlay:tone,promptLimit:VIDEO_PROMPT_MAX_CHARS,promptSoftTarget:fit.softTarget,promptChars:fit.finalChars,promptOriginalChars:fit.originalChars,promptCompacted:fit.compacted,promptCompaction:fit.method}});
  }catch(e){return send(res,500,{error:e.message||'Reimagine failed'})}
}
