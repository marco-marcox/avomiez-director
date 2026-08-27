import{accessConfigured,getAccess,ownerConfigured}from'../lib/access.js';
export default function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const a=getAccess(req);
  res.status(200).setHeader('Cache-Control','no-store').json({
    mode:a.mode,
    firecrawlConnected:a.firecrawlAvailable,
    guestExpiresAt:a.guestExpiresAt,
    ownerExpiresAt:a.ownerExpiresAt,
    guestSessionsAvailable:accessConfigured(),
    ownerLoginAvailable:ownerConfigured(),
    ownerFirecrawlConfigured:Boolean(process.env.FIRECRAWL_API_KEY)
  });
}
