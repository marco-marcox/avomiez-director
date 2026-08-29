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

export async function enforceVideoPromptLimit(prompt,{label='video prompt',duration=12}={}){
  const source=String(prompt||'').trim();
  const originalChars=source.length;
  const d=normalizeVideoDuration(duration);
  const softTarget=softPromptTargetForDuration(d);
  if(originalChars<=softTarget)return{prompt:source,compacted:false,method:'none',originalChars,finalChars:originalChars,softTarget,duration:d};

  const system=`You are the V2.8 prompt compression editor for AvoMiez Director. Compress an already complete AI-video generation prompt without changing its story, reference identities, active secondary tone overlay, shot order, timing, continuity or required output behavior. Return JSON only.`;
  const user=`Compress this ${label} for a ${d}-second video to AT MOST ${softTarget} characters. The absolute hard limit is ${VIDEO_PROMPT_MAX_CHARS} characters. Longer videos intentionally use a leaner prompt budget: more runtime does not require more prose.\n\nPRESERVE IN THIS PRIORITY ORDER:\n1. REFERENCE MAP and every @image / @video identifier and assigned role.\n2. AvoMiez identity and recurring-character consistency.\n3. PRIMARY GENRE plus SECONDARY TONE OVERLAY, its strength/expression and essential custom tone note.\n4. Exact duration, time blocks, shot order and important timing.\n5. Core action, camera choreography, interactions and payoff.\n6. Essential audio and negative constraints.\n\nREMOVE OR MERGE FIRST:\n- repeated adjectives and repeated photorealism/style wording\n- duplicate continuity or tone statements after they are clearly specified once\n- verbose explanations and rationale\n- redundant camera adjectives or repeated environment details\n- prose that does not change what the video model should render\n\nFor 21–30 second prompts, prefer compact time ranges and one clear action per beat rather than paragraph-heavy descriptions. Do not invent new story elements. Do not renumber or remove referenced images merely to shorten the prompt. Do not silently remove or change an active Horror/Splatter, Comedy, Dark Comedy or other tone overlay. Keep it production-ready and readable. Return exactly {"h3Prompt":"..."}.\n\nSOURCE PROMPT (${originalChars} chars):\n${source}`;

  try{
    const r=await callM3({system,user,temperature:.2,maxTokens:2600});
    const candidate=String(r.data?.h3Prompt||'').trim();
    if(candidate){
      const fitted=boundaryTrim(candidate,Math.min(softTarget,VIDEO_PROMPT_MAX_CHARS));
      return{prompt:fitted,compacted:true,method:candidate.length<=softTarget?'m3-adaptive':'m3-adaptive+safety-trim',originalChars,finalChars:fitted.length,softTarget,duration:d};
    }
  }catch{}

  if(originalChars<=VIDEO_PROMPT_MAX_CHARS)return{prompt:source,compacted:false,method:'soft-budget-fallback',originalChars,finalChars:originalChars,softTarget,duration:d};
  const fitted=boundaryTrim(source,VIDEO_PROMPT_MAX_CHARS);
  return{prompt:fitted,compacted:true,method:'hard-safety-trim',originalChars,finalChars:fitted.length,softTarget,duration:d};
}
