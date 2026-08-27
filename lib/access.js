import crypto from 'node:crypto';

const OWNER_COOKIE='avomiez_owner';
const GUEST_COOKIE='avomiez_fc_guest';

function secret(){return process.env.ACCESS_SESSION_SECRET||''}
function key(){const s=secret();if(!s)return null;return crypto.createHash('sha256').update(s).digest()}
function b64(b){return Buffer.from(b).toString('base64url')}
function unb64(s){return Buffer.from(s,'base64url')}

export function accessConfigured(){return Boolean(secret())}
export function ownerConfigured(){return Boolean(secret()&&process.env.APP_OWNER_PASSKEY)}

export function encrypt(payload){
  const k=key();if(!k)throw new Error('ACCESS_SESSION_SECRET is not configured.');
  const iv=crypto.randomBytes(12);
  const c=crypto.createCipheriv('aes-256-gcm',k,iv);
  const plain=Buffer.from(JSON.stringify(payload));
  const enc=Buffer.concat([c.update(plain),c.final()]);
  const tag=c.getAuthTag();
  return [b64(iv),b64(enc),b64(tag)].join('.');
}
export function decrypt(token){
  try{
    const k=key();if(!k||!token)return null;
    const [a,b,c]=token.split('.');if(!a||!b||!c)return null;
    const d=crypto.createDecipheriv('aes-256-gcm',k,unb64(a));
    d.setAuthTag(unb64(c));
    const out=Buffer.concat([d.update(unb64(b)),d.final()]);
    const obj=JSON.parse(out.toString('utf8'));
    if(obj?.exp&&Date.now()>obj.exp)return null;
    return obj;
  }catch{return null}
}
function cookies(req){
  const raw=req.headers?.cookie||'';const out={};
  for(const part of raw.split(';')){const i=part.indexOf('=');if(i<0)continue;out[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1).trim())}
  return out;
}
function secureCookie(name,value,maxAge){return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`}
function clearCookie(name){return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`}
export function setCookie(res,cookie){const prev=res.getHeader('Set-Cookie');res.setHeader('Set-Cookie',prev?[...(Array.isArray(prev)?prev:[prev]),cookie]:cookie)}
export function clearGuest(res){setCookie(res,clearCookie(GUEST_COOKIE))}
export function clearOwner(res){setCookie(res,clearCookie(OWNER_COOKIE))}

export function getAccess(req){
  const c=cookies(req);
  const owner=decrypt(c[OWNER_COOKIE]);
  const guest=decrypt(c[GUEST_COOKIE]);
  const isOwner=owner?.role==='owner';
  const guestKey=guest?.role==='guest'&&guest?.firecrawlKey?guest.firecrawlKey:null;
  return {
    mode:isOwner?'owner':guestKey?'guest':'public',
    isOwner,
    guestFirecrawlKey:guestKey,
    guestExpiresAt:guestKey?guest.exp:null,
    ownerExpiresAt:isOwner?owner.exp:null,
    firecrawlAvailable:isOwner?Boolean(process.env.FIRECRAWL_API_KEY):Boolean(guestKey)
  };
}
export function issueGuest(res,firecrawlKey){
  const exp=Date.now()+60*60*1000;
  setCookie(res,secureCookie(GUEST_COOKIE,encrypt({role:'guest',firecrawlKey,exp}),3600));
  return exp;
}
export function issueOwner(res){
  const seconds=24*60*60,exp=Date.now()+seconds*1000;
  setCookie(res,secureCookie(OWNER_COOKIE,encrypt({role:'owner',exp}),seconds));
  return exp;
}
export function safeEqual(a,b){
  const ah=crypto.createHash('sha256').update(String(a||'')).digest();
  const bh=crypto.createHash('sha256').update(String(b||'')).digest();
  return crypto.timingSafeEqual(ah,bh);
}
