import{callM3,enforcePost,send}from'../lib/gmi.js';
import{getAccess}from'../lib/access.js';

function resolveFirecrawlKey(req){
  const a=getAccess(req);
  if(a.isOwner&&process.env.FIRECRAWL_API_KEY)return{key:process.env.FIRECRAWL_API_KEY,mode:'owner'};
  if(a.guestFirecrawlKey)return{key:a.guestFirecrawlKey,mode:'guest',expiresAt:a.guestExpiresAt};
  return{key:'',mode:'public'};
}
async function searchFirecrawl(query,key){
  const r=await fetch('https://api.firecrawl.dev/v2/search',{
    method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
    body:JSON.stringify({query,limit:6,sources:['web'],tbs:'qdr:w',location:'Germany',country:'DE'})
  });
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(j?.error||j?.message||`Firecrawl search failed (${r.status})`);
  const data=j?.data||j,web=data?.web||data?.data||[];
  return Array.isArray(web)?web.slice(0,6).map(x=>({title:x.title||'',url:x.url||'',description:x.description||x.snippet||'',markdown:(x.markdown||'').slice(0,1800)})):[];
}
const system=`You are the Trend Pulse analyst inside AvoMiez Director. Analyze fresh web search results from Germany from the last 7 days. Extract only actionable, plausible social-content signals for AI-generated short-form animal/cat videos. Do not claim a trend is viral unless evidence supports momentum. Distinguish platform-specific patterns. Avoid politics, dangerous challenges, copyrighted character imitation, spam tactics, fake engagement, and unsupported claims. Return JSON only.`;
export default async function handler(req,res){
  if(!enforcePost(req,res))return;
  try{
    const access=resolveFirecrawlKey(req);
    if(!access.key)return send(res,200,{configured:false,accessMode:'public',signals:[],message:'Trend Pulse needs Creator access or a guest Firecrawl key. Guest keys can be connected for 60 minutes.'});
    const topic=(req.body?.topic||'cats animals comedy cinematic AI video').slice(0,400);
    const queries=[`TikTok Instagram Reels YouTube Shorts trends Germany last 7 days ${topic}`,`LinkedIn creator video trends Germany last 7 days AI creative storytelling ${topic}`,`X Twitter video trends Germany last 7 days creators AI ${topic}`];
    const results=await Promise.all(queries.map(q=>searchFirecrawl(q,access.key)));
    const flat=results.flat();
    const r=await callM3({system,user:`TOPIC: ${topic}\n\nFRESH SEARCH EVIDENCE:\n${JSON.stringify(flat)}\n\nReturn exactly {"summary":"2-4 sentences","signals":[{"platform":"TikTok|Instagram|YouTube Shorts|LinkedIn|X|Cross-platform","signal":"","whyItMatters":"","confidence":"low|medium|high","keywords":[""],"captionImplication":""}],"avoid":[""],"sourceUrls":[""]}. Keep only 5-10 useful signals. sourceUrls must be URLs actually present in the evidence.`,temperature:.35,maxTokens:2400});
    return send(res,200,{configured:true,accessMode:access.mode,guestExpiresAt:access.expiresAt||null,...r.data,refreshedAt:new Date().toISOString()});
  }catch(e){return send(res,500,{error:e.message||'Trend Pulse failed'})}
}
