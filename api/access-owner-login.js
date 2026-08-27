import{issueOwner,ownerConfigured,safeEqual}from'../lib/access.js';
export default function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(!ownerConfigured())return res.status(503).json({error:'Owner access is not configured yet.'});
  if(!safeEqual(req.body?.passkey,process.env.APP_OWNER_PASSKEY))return res.status(401).json({error:'Incorrect creator passkey.'});
  const exp=issueOwner(res);res.status(200).setHeader('Cache-Control','no-store').json({ok:true,mode:'owner',expiresAt:exp});
}
