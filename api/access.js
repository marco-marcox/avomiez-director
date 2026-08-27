import{accessConfigured,clearGuest,clearOwner,getAccess,issueGuest,issueOwner,ownerConfigured,safeEqual}from'../lib/access.js';

export default function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method==='GET'){
    const a=getAccess(req);
    return res.status(200).json({mode:a.mode,firecrawlConnected:a.firecrawlAvailable,guestExpiresAt:a.guestExpiresAt,ownerExpiresAt:a.ownerExpiresAt,guestSessionsAvailable:accessConfigured(),ownerLoginAvailable:ownerConfigured(),ownerFirecrawlConfigured:Boolean(process.env.FIRECRAWL_API_KEY)});
  }
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const action=String(req.body?.action||'');
  if(action==='connect-firecrawl'){
    if(!accessConfigured())return res.status(503).json({error:'Guest sessions are not configured yet. Add ACCESS_SESSION_SECRET in Vercel.'});
    const k=String(req.body?.apiKey||'').trim();
    if(k.length<12)return res.status(400).json({error:'Please enter a valid Firecrawl API key.'});
    const exp=issueGuest(res,k);return res.status(200).json({ok:true,mode:'guest',expiresAt:exp});
  }
  if(action==='disconnect-firecrawl'){clearGuest(res);return res.status(200).json({ok:true})}
  if(action==='owner-login'){
    if(!ownerConfigured())return res.status(503).json({error:'Owner access is not configured yet.'});
    if(!safeEqual(req.body?.passkey,process.env.APP_OWNER_PASSKEY))return res.status(401).json({error:'Incorrect creator passkey.'});
    const exp=issueOwner(res);return res.status(200).json({ok:true,mode:'owner',expiresAt:exp});
  }
  if(action==='owner-logout'){clearOwner(res);return res.status(200).json({ok:true})}
  return res.status(400).json({error:'Unknown access action'});
}
