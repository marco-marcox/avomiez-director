import{publicModelProfiles,MODEL_PROFILES_VERIFIED_AT,recommendVideoModel}from'../lib/video-models.js';
import{send}from'../lib/gmi.js';
export default async function handler(req,res){
  if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
  const q=req.query||{};
  const recommendation=recommendVideoModel({duration:+q.duration||12,referenceCount:+q.refs||0,motion:q.motion==='1',audio:q.audio!=='0'});
  return send(res,200,{verifiedAt:MODEL_PROFILES_VERIFIED_AT,profiles:publicModelProfiles(),recommendation});
}
