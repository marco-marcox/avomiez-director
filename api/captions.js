import{AVOMIEZ_LOCK,callM3,enforcePost,send}from'../lib/gmi.js';
const system=`You are Caption Studio inside AvoMiez Director. ${AVOMIEZ_LOCK}\nCreate platform-native social copy for AI-generated short-form video. Optimize for clarity, curiosity, retention and relevant discoverability, never promise virality. Avoid spam, deceptive engagement bait, irrelevant hashtag stuffing, unsafe claims, copyrighted imitation, or fabricated facts. Respect each platform's format and tone. If fresh Trend Pulse evidence is provided, use it selectively and only when relevant. Return JSON only.`;
function textPart(s){return{type:'text',text:s}}
export default async function handler(req,res){
  if(!enforcePost(req,res))return;
  try{
    const b=req.body||{};
    if(!b.idea&&!b.h3Prompt&&!Array.isArray(b.frames))return send(res,400,{error:'Add a video idea, prompt, or video frames.'});
    const language=b.language||'German';
    const required=(b.requiredTags||'').slice(0,800);
    const trend=b.trendContext?JSON.stringify(b.trendContext).slice(0,12000):'none';
    const instructions=`Create captions for TikTok, Instagram Reels, YouTube Shorts, LinkedIn and X.\nLanguage: ${language}.\nVideo idea: ${b.idea||'unknown'}.\nH3/video prompt: ${(b.h3Prompt||'').slice(0,9000)}.\nCreator note: ${(b.note||'none').slice(0,1200)}.\nRequired campaign tags/mentions: ${required||'none'}.\nFresh Trend Pulse context: ${trend}.\n\nPlatform requirements:\n- TikTok: fast hook, concise natural caption, relevant search keywords, 3-6 focused hashtags, optional pinned first comment.\n- Instagram Reels: hook + short story/context + light CTA, 3-8 focused hashtags, optional first comment.\n- YouTube Shorts: provide a strong title (prefer <=70 chars), compact description, relevant hashtags; no clickbait that misrepresents the video.\n- LinkedIn: professional creator/process angle, readable short paragraphs, authentic discussion CTA, 2-5 relevant hashtags.\n- X: one post within 280 characters, punchy and native, 0-2 hashtags.\n- If AI disclosure or campaign disclosure appears relevant from supplied context, put guidance in complianceNote instead of inventing a legal requirement.\n\nReturn exactly {"videoSummary":"","trendUsed":[""],"tiktok":{"caption":"","hashtags":[""],"pinnedComment":"","complianceNote":""},"instagram":{"caption":"","hashtags":[""],"firstComment":"","complianceNote":""},"youtube":{"title":"","description":"","hashtags":[""],"complianceNote":""},"linkedin":{"caption":"","hashtags":[""],"complianceNote":""},"x":{"caption":"","hashtags":[""],"complianceNote":""}}.`;
    let messages;
    if(Array.isArray(b.frames)&&b.frames.length){
      const content=[textPart(instructions+'\nThe following images are chronological keyframes from the actual video. Base the copy on what is visibly happening, and use the text idea/prompt only as supporting context.')];
      for(const url of b.frames.slice(0,6))content.push({type:'image_url',image_url:{url}});
      messages=[{role:'system',content:system},{role:'user',content}];
    }
    const r=await callM3({system,user:instructions,messages,temperature:.7,maxTokens:3200});
    return send(res,200,{...r.data,_meta:{model:r.model,usage:r.usage}});
  }catch(e){return send(res,500,{error:e.message||'Caption generation failed'})}
}
