import{AVOMIEZ_LOCK,callM3,enforcePost,send}from'../lib/gmi.js';

const system=`You are the Reimagine Director inside AvoMiez Director V2.3. Your task is NOT merely to append instructions or rewrite a prompt. You must rethink an analyzed short-form video using its source mechanics, the creator's preserve/change locks, optional references, selected remix mode, duration, current editable idea and current H3 prompt. ${AVOMIEZ_LOCK}\n\nCreate a genuinely improved or transformed 8–15 second vertical AI-video concept. Preserve only what the creator explicitly locks. Prioritize first-second hook, visual clarity, retention, escalating readable action, strong payoff, replay/loop potential, realistic model-executable choreography and strict AvoMiez consistency. Never claim guaranteed virality. Avoid engagement bait, unsafe challenges, copyrighted character imitation and unnecessary text overlays. Return valid JSON only.`;

const modeRules={
  viral:`Strengthen the first 0.5–1.5 seconds. Move the most visually intriguing beat earlier. Create an immediate unanswered visual question, visible progression every 1–3 seconds, a clearer payoff and a replay trigger or loop. No engagement bait.`,
  funnier:`Increase visual comedy through deadpan feline contrast, precise reaction timing, escalation and one memorable visual gag. Do not turn AvoMiez into a human or add forced dialogue.`,
  cinematic:`Increase premium cinematography, lighting logic, camera intention, composition, depth, hero close-ups and elegant progression while keeping the action easy for a video model to execute.`,
  action:`Add clearer physical escalation, faster visual progression and one standout action beat while preserving natural feline anatomy and readable choreography.`,
  emotional:`Add a concise emotional thread, relationship beat, protective motive or meaningful payoff without slowing the opening hook.`,
  loop:`Engineer the last 1–2 seconds to visually and logically rhyme with frame one so the replay feels intentional and nearly seamless.`,
  different:`Keep only the locked mechanics. Change setting, genre, conflict and payoff aggressively while retaining a coherent, executable 8–15 second story.`,
  inspire:`Create a fresh cousin concept that preserves the strongest underlying mechanics but changes the surface story enough to feel new.`,
  surprise:`Preserve the useful mechanic but jump to an unexpected setting, role, object, conflict or reveal. Aim for surprising but coherent shareability.`,
  adopt:`Treat CURRENT IDEA as the chosen direction. Polish it into the strongest production-ready version while respecting locks and references.`
};

function referenceMap(refs=[]){return refs.slice(0,6).map((r,i)=>`@image${i+1} = ${(r.type||'reference').toUpperCase()} REFERENCE — ${r.label||'optional visual reference'}`)}

function user(b){
  const mode=String(b.mode||'viral');
  const keep=b.keep||{};
  const refs=Array.isArray(b.references)?b.references.slice(0,6):[];
  const source=b.sourceAnalysis||{};
  const refMap=referenceMap(refs);
  return `REIMAGINE MODE: ${mode}\nMODE DIRECTIVE: ${modeRules[mode]||modeRules.viral}\nTARGET: ${Number(b.duration)||12}s, vertical 9:16.\n\nSOURCE ANALYSIS:\n${JSON.stringify(source)}\n\nCURRENT EDITABLE IDEA:\n${b.currentIdea||'none'}\n\nCURRENT H3 PROMPT:\n${b.currentPrompt||'none'}\n\nCREATOR NOTE:\n${b.creatorNote||'none'}\n\nPRESERVE LOCKS (true = preserve, false = may change):\n${JSON.stringify(keep)}\n\nREFERENCE METADATA:\n${JSON.stringify(refs)}\nREFERENCE MAP LABELS:\n${refMap.join('\n')||'No optional references. @image1 should still be the strict AvoMiez master identity reference if the creator supplies it in the video tool.'}\n\nReturn exactly this JSON shape:\n{\n  "mode":"${mode}",\n  "changeSummary":"1-3 concise sentences explaining what changed",\n  "hook":"strong revised first-second hook",\n  "idea":"complete editable revised video idea",\n  "whyItWorks":"why the revised structure improves clarity/retention without guaranteeing virality",\n  "referenceMap":["@image1 = ..."],\n  "variants":[\n    {"id":"A","title":"Viral Remix","strength":"Retention","idea":"alternate direction","promptDirection":"short instruction for converting this variant into a final prompt"},\n    {"id":"B","title":"Cinematic Remix","strength":"Visual quality","idea":"alternate direction","promptDirection":"short instruction"},\n    {"id":"C","title":"Wildcard Remix","strength":"Surprise","idea":"alternate direction","promptDirection":"short instruction"}\n  ],\n  "storyboard":[\n    {"shot":1,"start":0,"end":1.5,"title":"Cold Open","camera":"","action":"","purpose":"Hook","emotion":""}\n  ],\n  "h3Prompt":"complete production-ready Reference-to-Video MiniMax H3/PixVerse prompt. Begin with a clear REFERENCE MAP. If optional references exist, map them in supplied order. Keep @image1 as strict AvoMiez identity whenever the first supplied reference is Character. Include exact duration, 9:16, shot timing, camera, action, continuity, native audio guidance and negative constraints."\n}\n\nStoryboard must contain exactly 5 shots covering the full target duration with no timing gaps. Variants must be meaningfully different, not synonyms of the same idea.`;
}

export default async function handler(req,res){
  if(!enforcePost(req,res))return;
  try{
    const b=req.body||{};
    if(!b.currentIdea&&!b.sourceAnalysis)return send(res,400,{error:'Analyze a video or provide a current idea first.'});
    const refs=Array.isArray(b.references)?b.references.slice(0,6):[];
    const imgs=Array.isArray(b.referenceImages)?b.referenceImages.slice(0,6):[];
    const content=[{type:'text',text:user(b)}];
    imgs.forEach((url,i)=>{if(typeof url==='string'&&url.startsWith('data:image/'))content.push({type:'image_url',image_url:{url},detail:'low'})});
    const r=await callM3({messages:[{role:'system',content:system},{role:'user',content}],temperature:['surprise','different','inspire'].includes(b.mode)?.78:.52,maxTokens:3800});
    return send(res,200,{...r.data,_meta:{model:r.model,usage:r.usage,referencesAnalyzed:imgs.length}});
  }catch(e){return send(res,500,{error:e.message||'Reimagine failed'})}
}
