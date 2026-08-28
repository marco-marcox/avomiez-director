import{callM3}from'./gmi.js';

export const VIDEO_PROMPT_MAX_CHARS=5000;
const COMPACT_TARGET_CHARS=4600;

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

export async function enforceVideoPromptLimit(prompt,{label='video prompt'}={}){
  const source=String(prompt||'').trim();
  const originalChars=source.length;
  if(originalChars<=VIDEO_PROMPT_MAX_CHARS)return{prompt:source,compacted:false,method:'none',originalChars,finalChars:originalChars};

  const system=`You are the V2.6 prompt compression editor for AvoMiez Director. Compress an already complete AI-video generation prompt without changing its story, reference identities, shot order, timing, continuity or required output behavior. Return JSON only.`;
  const user=`Compress this ${label} to AT MOST ${COMPACT_TARGET_CHARS} characters, leaving safety room below the hard ${VIDEO_PROMPT_MAX_CHARS}-character limit.\n\nPRESERVE IN THIS PRIORITY ORDER:\n1. REFERENCE MAP and every @image / @video identifier and assigned role.\n2. AvoMiez identity and recurring-character consistency.\n3. Exact duration, format, shot order and important timing.\n4. Core action, camera choreography, interactions and payoff.\n5. Essential audio and negative constraints.\n\nREMOVE OR MERGE FIRST:\n- repeated adjectives and repeated photorealism/style wording\n- duplicate continuity statements\n- verbose explanations and rationale\n- redundant camera adjectives or repeated environment details\n\nDo not invent new story elements. Do not renumber or remove referenced images merely to shorten the prompt. Keep it production-ready, concise and readable. Return exactly {"h3Prompt":"..."}.\n\nSOURCE PROMPT (${originalChars} chars):\n${source}`;

  try{
    const r=await callM3({system,user,temperature:.2,maxTokens:2800});
    const candidate=String(r.data?.h3Prompt||'').trim();
    if(candidate){
      const fitted=boundaryTrim(candidate,VIDEO_PROMPT_MAX_CHARS);
      return{prompt:fitted,compacted:true,method:candidate.length<=VIDEO_PROMPT_MAX_CHARS?'m3-smart':'m3-smart+safety-trim',originalChars,finalChars:fitted.length};
    }
  }catch{}

  const fitted=boundaryTrim(source,VIDEO_PROMPT_MAX_CHARS);
  return{prompt:fitted,compacted:true,method:'safety-trim',originalChars,finalChars:fitted.length};
}
