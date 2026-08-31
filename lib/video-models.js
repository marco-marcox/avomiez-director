export const MODEL_PROFILES_VERIFIED_AT='2026-08-31';

export const VIDEO_MODELS={
  'seedance-2.5':{
    key:'seedance-2.5',label:'Seedance 2.5',maker:'ByteDance Seed',maxDuration:30,minDuration:1,promptMax:5000,nativeAudio:true,multiShot:true,imageRefs:30,videoRefs:10,audioRefs:10,motionReference:true,extension:true,
    source:'https://seed.bytedance.com/en/blog/one-take-creation-flexible-referencing-introducing-seedance-2-5',
    bestFor:'Long 16–30s stories, many multimodal references, motion/camera interpretation and native audio-video generation.',
    strategy:'Use concise timestamped story beats, explicit reference intent, clear subject/scene/action progression, native audio cues and smooth transitions. For 20–30s prompts, prefer compact time ranges over dense prose.'
  },
  'kling-3':{
    key:'kling-3',label:'Kling Video 3.0',maker:'Kuaishou / Kling AI',maxDuration:15,minDuration:3,promptMax:5000,nativeAudio:true,multiShot:true,imageRefs:6,videoRefs:1,audioRefs:1,motionReference:true,extension:false,
    source:'https://ir.kuaishou.com/news-releases/news-release-details/kling-ai-launches-30-model-ushering-era-where-everyone-can-be',
    bestFor:'Cinematic 3–15s clips, precise shot design, strong element consistency, multimodal reference control and native dialogue/audio.',
    strategy:'Use explicit shot-by-shot direction, clean element binding, readable camera transitions and exact dialogue speaker/order when speech matters. Avoid overloading a single shot with competing actions.'
  },
  'kling-3-omni':{
    key:'kling-3-omni',label:'Kling 3.0 Omni',maker:'Kuaishou / Kling AI',maxDuration:15,minDuration:3,promptMax:5000,nativeAudio:true,multiShot:true,imageRefs:6,videoRefs:2,audioRefs:2,motionReference:true,extension:false,
    source:'https://ir.kuaishou.com/news-releases/news-release-details/kling-ai-launches-30-model-ushering-era-where-everyone-can-be',
    bestFor:'Multimodal 3–15s workflows combining text, images, audio/video references, editing and consistent recurring elements.',
    strategy:'State the role of every reference, keep identity anchors separate from scene/style references, use precise multi-shot logic and specify audio/dialogue only where it changes the scene.'
  },
  'minimax-h3':{
    key:'minimax-h3',label:'MiniMax H3',maker:'MiniMax',maxDuration:15,minDuration:4,promptMax:5000,nativeAudio:true,multiShot:true,imageRefs:9,videoRefs:3,audioRefs:3,motionReference:true,extension:true,
    source:'https://www.minimax.io/news/minimax-h3-open-source',
    bestFor:'Omni-reference 4–15s generation, strong instruction following, image/video/audio references, motion transfer and native stereo audio.',
    strategy:'Use a strict reference map, explicit task intent, concise time blocks, camera/action causality and native stereo audio cues. Keep scene/style references from overriding character identity.'
  },
  'pixverse-v6':{
    key:'pixverse-v6',label:'PixVerse V6',maker:'PixVerse',maxDuration:15,minDuration:1,promptMax:5000,nativeAudio:true,multiShot:true,imageRefs:10,videoRefs:2,audioRefs:0,motionReference:true,extension:true,
    source:'https://docs.platform.pixverse.ai/v6-released-2056814m0',
    bestFor:'1–15s 1080p clips, strong camera/acting, native multi-shot + audio, Image-to-Video, Fusion/Omni references, Transition and Extension.',
    strategy:'Lead with subject + one main action + location. Keep the first instruction strongest; for many clips 50–80 words is a useful starting point and official docs broadly recommend 25–200 words. Use one primary camera move per shot, concrete lens/lighting/color/material cues instead of vague quality adjectives, physical cause/effect instead of repeating “fast”, positive stability constraints, and explicit audio. For Image-to-Video do not re-describe the uploaded image: prompt motion + camera + audio + one consistency rule. For Fusion/Omni map references explicitly and preserve exact @reference names/roles.'
  },
  'happyhorse-1.1':{
    key:'happyhorse-1.1',label:'HappyHorse 1.1',maker:'Happy Horse',maxDuration:15,minDuration:3,promptMax:2000,nativeAudio:true,multiShot:true,imageRefs:1,videoRefs:0,audioRefs:0,motionReference:false,extension:false,
    source:'https://www.happy-horse.net/api-docs/models',
    bestFor:'Concise cinematic 3–15s text/image/reference generation with 1080p output and fixed audio generation.',
    strategy:'Keep the prompt especially compact. Lead with scene, subject, movement, lighting and camera. Use one primary reference image and avoid reference-map complexity the endpoint cannot consume.'
  },
  'generic':{
    key:'generic',label:'Generic / Universal',maker:'Universal',maxDuration:30,minDuration:1,promptMax:5000,nativeAudio:true,multiShot:true,imageRefs:9,videoRefs:1,audioRefs:1,motionReference:true,extension:false,
    source:'',bestFor:'Portable prompts when the final video tool is not known yet.',
    strategy:'Use universal production language: references, exact duration, time blocks, subject/action/camera, lighting, sound and negative constraints without tool-specific syntax.'
  }
};

export function getVideoModelProfile(key='auto'){
  if(key==='auto')return null;
  return VIDEO_MODELS[key]||VIDEO_MODELS.generic;
}

export function recommendVideoModel({duration=12,referenceCount=0,motion=false,audio=true}={}){
  const d=Number(duration)||12,refs=Number(referenceCount)||0;
  const score=(key)=>{
    const p=VIDEO_MODELS[key];let s=0;
    if(key==='seedance-2.5')s=84;
    if(key==='kling-3')s=80;
    if(key==='kling-3-omni')s=83;
    if(key==='minimax-h3')s=84;
    if(key==='pixverse-v6')s=82;
    if(key==='happyhorse-1.1')s=70;
    if(d>p.maxDuration)s-=45;else s+=8;
    if(d>15&&key==='seedance-2.5')s+=20;
    if(refs>0)s+=Math.min(10,p.imageRefs>=refs?refs*2:-12);
    if(refs>1&&p.imageRefs<refs)s-=25;
    if(motion)s+=p.motionReference?10:-18;
    if(audio)s+=p.nativeAudio?5:-8;
    if(d<=15&&['kling-3-omni','minimax-h3','pixverse-v6'].includes(key)&&refs>=2)s+=5;
    return Math.max(0,Math.min(99,s));
  };
  const keys=['seedance-2.5','kling-3','kling-3-omni','minimax-h3','pixverse-v6','happyhorse-1.1'];
  const ranking=keys.map(key=>({key,score:score(key)})).sort((a,b)=>b.score-a.score);
  return{key:ranking[0].key,score:ranking[0].score,ranking};
}

export function resolveTargetModel(requested='auto',context={}){
  const req=String(requested||'auto');
  const rec=recommendVideoModel(context);
  const key=req==='auto'?rec.key:(VIDEO_MODELS[req]?req:'generic');
  return{requested:req,key,profile:VIDEO_MODELS[key],recommendation:rec};
}

export function splitDurations(total,maxPerClip){
  const d=Math.max(1,Math.round(Number(total)||1)),max=Math.max(1,Math.round(Number(maxPerClip)||d));
  if(d<=max)return[d];
  const parts=Math.ceil(d/max),base=Math.floor(d/parts),rest=d-base*parts,out=[];
  for(let i=0;i<parts;i++)out.push(base+(i<rest?1:0));
  return out;
}

export function modelPromptGuidance(target,{duration=12,referenceCount=0,motion=false}={}){
  const p=target.profile||VIDEO_MODELS.generic;
  const split=splitDurations(duration,p.maxDuration);
  const splitText=split.length>1?`MODEL DURATION LIMIT: ${p.label} supports up to ${p.maxDuration}s per generation. The requested ${duration}s story therefore requires ${split.length} clips (${split.join('s + ')}s). Do not pretend one generation can exceed the model limit. Keep clip boundaries continuity-friendly.`:`MODEL DURATION: ${duration}s fits the current ${p.label} single-generation limit of ${p.maxDuration}s.`;
  const refText=referenceCount>p.imageRefs?`REFERENCE LIMIT WARNING: ${referenceCount} images are active, but this profile supports about ${p.imageRefs} image reference${p.imageRefs===1?'':'s'}. Prioritize identity-critical references and do not imply unsupported attachments.`:`REFERENCE CAPACITY: ${referenceCount} active image reference${referenceCount===1?'':'s'} fits this profile.`;
  const motionText=motion&&!p.motionReference?'MOTION REFERENCE WARNING: this profile does not expose a dedicated motion-reference capability; translate motion into concise text choreography instead.':motion?'MOTION REFERENCE: supported; state exactly which motion/camera/timing traits to preserve.':'';
  return`TARGET VIDEO MODEL: ${p.label} (${p.maker}).\nOFFICIAL PROFILE VERIFIED: ${MODEL_PROFILES_VERIFIED_AT}.\n${splitText}\n${refText}\n${motionText}\nMODEL-SPECIFIC PROMPT STRATEGY: ${p.strategy}\nMODEL PROMPT HARD CAP FOR THIS APP: ${p.promptMax} characters.`;
}

export function publicModelProfiles(){
  return Object.values(VIDEO_MODELS).map(({strategy,...p})=>({...p,verifiedAt:MODEL_PROFILES_VERIFIED_AT}));
}
