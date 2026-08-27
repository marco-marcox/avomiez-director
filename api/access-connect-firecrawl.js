import{accessConfigured,issueGuest}from'../lib/access.js';
export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(!accessConfigured())return res.status(503).json({error:'Guest sessions are not configured yet. Add ACCESS_SESSION_SECRET in Vercel.'});
  const k=String(req.body?.apiKey||'').trim();
  if(k.length<12)return res.status(400).json({error:'Please enter a valid Firecrawl API key.'});
  const exp=issueGuest(res,k);
  res.status(200).setHeader('Cache-Control','no-store').json({ok:true,mode:'guest',expiresAt:exp});
}
