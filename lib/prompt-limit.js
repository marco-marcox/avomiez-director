import{callM3}from'./gmi.js';
import{normalizeVideoDuration,softPromptTargetForDuration}from'./duration-policy.js';

export const VIDEO_PROMPT_MAX_CHARS=5000;

function boundaryTrim(value,max=VIDEO_PROMPT_MAX_CHARS){
  const text=String(value||'').trim();
  if(text.length<=max)return text;
  const slice=text.slice(0,max);
  const floor=Math.floor(max*.78);
  const boundaries=['\n\n','\n','. ','; ',': ',', '];
  let best=-1,extra=0;
  for(const mark of boundaries){
    const i=slice.lastIndexOf(mark);
    if(i>=floor&&i>best){best=i;extra=mark.trim()?mark.length:0;}
  }
  return (best>=floor?slice.slice(0,Math.min(max,best+extra)):slice).trimEnd();
}

export async function enforceVideoPromptLimit(prompt,{label='video prompt',duration=12,maxChars=VIDEO_PROMPT_MAX_CHARS,modelLabel='selected video model'}={}){
  const source=String(prompt||'').trim();
  const originalChars=source.length;
  const d=normalizeVideoDuration(duration);
  const hardMax=Math.max(500,Math.min(VIDEO_PROMPT_MAX_CHARS,Number(maxChars)||VIDEO_PROMPT_MAX_CHARS));
  const durationSoft=softPromptTargetForDuration(d);
  const softTarget=Math.min(durationSoft,Math.max(500,Math.floor(hardMax*.92)));
  if(originalChars<=softTarget)return{prompt:source,compacted:false,method:'none',originalChars,finalChars:originalChars,softTarget,hardMax,duration:d};

  const system=`You are the V3.1 model-aware prompt compression editor for AvoMiez Director. Compress an already complete AI-video generation prompt without changing its story, reference identities, target video model, active tone overlay, shot order, timing, continuity or required output behavior. Return JSON only.`;
  const user=`Compress this ${label} for ${modelLabel} and a ${d}-second video to AT MOST ${softTarget} characters. The hard limit for this target is ${hardMax} characters and the app-wide ceiling is ${VIDEO_PROMPT_MAX_CHARS}. Longer videos intentionally use a leaner prompt budget: more runtime does not require more prose.\n\nPRESERVE IN THIS PRIORITY ORDER:\n1. TARGET VIDEO MODEL and its essential model-specific instructions.\n2. REFERENCE MAP and every @image / @video identifier and assigned role that the target model can actually use.\n3. AvoMiez identity and recurring-character consistency.\n4. PRIMARY GENRE plus SECONDARY TONE OVERLAY.\n5. Exact clip duration, time blocks, shot order and important timing.\n6. Core action, camera choreography, interactions and payoff.\n7. Essential audio and negative constraints.\n\nREMOVE OR MERGE FIRST:\n- repeated adjectives and repeated photorealism/style wording\n- duplicate continuity or tone statements\n- verbose explanations and rationale\n- redundant camera adjectives or repeated environment details\n- prose that does not change what the target video model should render\n\nDo not invent new story elements. Do not silently remove an active tone overlay. Keep it production-ready and readable. Return exactly {"h3Prompt":"..."}.\n\nSOURCE PROMPT (${originalChars} chars):\n${source}`;

  try{
    const r=await callM3({system,user,temperature:.2,maxTokens:2600});
    const candidate=String(r.data?.h3Prompt||'').trim();
    if(candidate){
      const fitted=boundaryTrim(candidate,hardMax);
      return{prompt:fitted,compacted:true,method:candidate.length<=hardMax?'m3-model-aware':'m3-model-aware+safety-trim',originalChars,finalChars:fitted.length,softTarget,hardMax,duration:d};
    }
  }catch{}

  if(originalChars<=hardMax)return{prompt:source,compacted:false,method:'soft-budget-fallback',originalChars,finalChars:originalChars,softTarget,hardMax,duration:d};
  const fitted=boundaryTrim(source,hardMax);
  return{prompt:fitted,compacted:true,method:'hard-safety-trim',originalChars,finalChars:fitted.length,softTarget,hardMax,duration:d};
}
