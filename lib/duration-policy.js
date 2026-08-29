export const VIDEO_DURATION_MIN_SECONDS=5;
export const VIDEO_DURATION_MAX_SECONDS=30;

export function normalizeVideoDuration(value,fallback=12){
  const n=Math.round(Number(value));
  if(!Number.isFinite(n))return fallback;
  return Math.max(VIDEO_DURATION_MIN_SECONDS,Math.min(VIDEO_DURATION_MAX_SECONDS,n));
}

export function shotCountForDuration(value){
  const d=normalizeVideoDuration(value);
  if(d<=15)return 5;
  if(d<=22)return 6;
  return 7;
}

export function softPromptTargetForDuration(value){
  const d=normalizeVideoDuration(value);
  if(d<=15)return 4600;
  if(d<=20)return 4400;
  if(d<=25)return 4150;
  return 3900;
}

export function durationPromptGuidance(value){
  const d=normalizeVideoDuration(value);
  const target=softPromptTargetForDuration(d);
  if(d<=15)return`DURATION DENSITY: ${d}s short-form. Use concise but detailed shot instructions. Soft prompt target about ${target} characters; hard maximum remains 5000.`;
  if(d<=20)return`DURATION DENSITY: ${d}s. Keep the prompt leaner than a short clip: describe each beat once, avoid repeated atmosphere/adjectives, and reserve detail for references, timing, interactions and payoff. Soft prompt target about ${target} characters; hard maximum 5000.`;
  if(d<=25)return`DURATION DENSITY: ${d}s extended single generation. Favor clear time ranges and compact action verbs over prose. Do not fill the extra seconds with extra adjectives or redundant camera language. Soft prompt target about ${target} characters; hard maximum 5000.`;
  return`DURATION DENSITY: ${d}s extended single generation. Use a deliberately compact production prompt: clear time blocks, one main action per beat, concise camera/audio cues, no duplicate descriptions. More runtime does NOT require more prompt text. Soft prompt target about ${target} characters; hard maximum 5000.`;
}
