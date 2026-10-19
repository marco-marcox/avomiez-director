import{callM3,enforcePost,send}from'../lib/gmi.js';
import{getAccess}from'../lib/access.js';
import{marketProfile}from'../lib/markets.js';

function resolveFirecrawlKey(req){
  const a=getAccess(req);
  if(a.isOwner&&process.env.FIRECRAWL_API_KEY)return{key:process.env.FIRECRAWL_API_KEY,mode:'owner'};
  if(a.guestFirecrawlKey)return{key:a.guestFirecrawlKey,mode:'guest',expiresAt:a.guestExpiresAt};
  return{key:'',mode:'public'};
}
async function searchFirecrawl(query,key,region){
  const r=await fetch('https://api.firecrawl.dev/v2/search',{
    method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
    body:JSON.stringify({query,limit:6,sources:['web'],tbs:'qdr:w',...region})
  });
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(j?.error||j?.message||`Firecrawl search failed (${r.status})`);
  const data=j?.data||j,web=data?.web||data?.data||[];
  return Array.isArray(web)?web.slice(0,6).map(x=>({title:x.title||'',url:x.url||'',description:x.description||x.snippet||'',markdown:(x.markdown||'').slice(0,1800)})):[];
}
const system=`You are the Trend Pulse analyst inside AvoMiez Director. Analyze fresh web search results for the requested target market from the last 7 days. Respect evidence geography: country-specific evidence is not proof of a regional or worldwide trend. For Global, prioritize internationally applicable signals and disclose limited regional coverage. For DACH, distinguish Germany, Austria and Switzerland where coverage differs. Extract only actionable, plausible social-content signals for AI-generated short-form animal/cat videos. Do not claim a trend is viral unless evidence supports momentum. Distinguish platform-specific patterns. Avoid politics, dangerous challenges, copyrighted character imitation, spam tactics, fake engagement, and unsupported claims. Return JSON only.`;
export default async function handler(req,res){
  if(!enforcePost(req,res))return;
  try{
    let profile;
    try{profile=marketProfile(req.body?.market)}catch(e){return send(res,400,{error:e.message})}
    const {market,regions,searchScope}=profile;
    const access=resolveFirecrawlKey(req);
    if(!access.key)return send(res,200,{market,searchScope,configured:false,accessMode:'public',signals:[],message:'Trend Pulse needs Creator access or a guest Firecrawl key. Guest keys can be connected for 60 minutes.'});
    const topic=(req.body?.topic||'cats animals comedy cinematic AI video').slice(0,400);
    const platforms=['TikTok Instagram Reels YouTube Shorts','LinkedIn creator AI creative storytelling','X Twitter creators AI'];
    const searches=regions.flatMap(region=>platforms.map(platform=>({
      region,
      query:`${platform} video trends ${market==='Global'?'worldwide international':region.location} last 7 days ${topic}`
    })));
    const results=await Promise.all(searches.map(async ({query,region})=>
      (await searchFirecrawl(query,access.key,region)).map(result=>({...result,searchRegion:region.location||'International query (provider default region may apply)'}))
    ));
    const flat=results.flat();
    const r=await callM3({system,user:`TARGET MARKET: ${market}\nAUDIENCE: ${profile.audience}\nSEARCH SCOPE: ${searchScope}\nTOPIC: ${topic}\n\nFRESH SEARCH EVIDENCE:\n${JSON.stringify(flat)}\n\nReturn exactly {"summary":"2-4 sentences","signals":[{"platform":"TikTok|Instagram|YouTube Shorts|LinkedIn|X|Cross-platform","signal":"","whyItMatters":"","confidence":"low|medium|high","keywords":[""],"captionImplication":""}],"avoid":[""],"sourceUrls":[""]}. Keep only 5-10 useful signals. sourceUrls must be URLs actually present in the evidence.`,temperature:.35,maxTokens:2400});
    return send(res,200,{...r.data,configured:true,market,searchScope,accessMode:access.mode,guestExpiresAt:access.expiresAt||null,refreshedAt:new Date().toISOString()});
  }catch(e){return send(res,500,{error:e.message||'Trend Pulse failed'})}
}
