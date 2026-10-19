import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import trends from '../api/trends.js';
import captions from '../api/captions.js';
import {encrypt} from '../lib/access.js';
import * as markets from '../lib/markets.js';

function response(){return {statusCode:0,status(n){this.statusCode=n;return this},setHeader(){return this},json(data){this.data=data}}}
function storage(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}}
const signal=market=>({configured:true,market,searchScope:markets.marketProfile(market).searchScope,signals:[{platform:'TikTok',signal:`${market} evidence`}],refreshedAt:'2026-10-19T10:00:00Z'});

// No real network transport is reachable in these tests, including the LLM.
async function withMock(fn){
  const oldFetch=globalThis.fetch,oldEnv={...process.env};
  const calls=[];
  process.env.ACCESS_SESSION_SECRET='test-only-session-secret';
  process.env.FIRECRAWL_API_KEY='test-only-firecrawl';
  process.env.GMI_API_KEY='test-only-gmi';
  globalThis.fetch=async(url,options)=>{
    const body=JSON.parse(options.body);calls.push({url,body});
    if(url==='https://api.firecrawl.dev/v2/search')return {ok:true,json:async()=>({data:{web:[{title:'Mock evidence',url:'https://example.test/trend',description:'Simulated signal'}]}})};
    if(url.endsWith('/chat/completions'))return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({market:'WRONG',configured:false,summary:'Simulated summary',signals:[]})}}]})};
    throw Error(`Unexpected network request: ${url}`);
  };
  try{await fn(calls)}finally{globalThis.fetch=oldFetch;process.env=oldEnv}
}

for(const market of ['Germany','DACH','Global']){
  test(`Trend API: ${market} search parameters, evidence and authoritative metadata`,()=>withMock(async calls=>{
    const res=response();
    await trends({method:'POST',body:{market,topic:'pizza cat'},headers:{cookie:`avomiez_owner=${encrypt({role:'owner',exp:Date.now()+60000})}`}},res);
    assert.equal(res.statusCode,200);assert.equal(res.data.market,market);assert.equal(res.data.configured,true);
    const searches=calls.filter(c=>c.url.includes('firecrawl'));
    assert.equal(searches.length,market==='DACH'?9:3);
    const countries=market==='DACH'?['DE','AT','CH']:market==='Germany'?['DE']:[];
    assert.deepEqual([...new Set(searches.map(c=>c.body.country).filter(Boolean))],countries);
    for(const {body} of searches){
      assert.equal(body.tbs,'qdr:w');assert.match(body.query,/pizza cat/);
      if(market==='Global'){
        assert.ok(!('location' in body));assert.ok(!('country' in body));
        assert.match(body.query,/worldwide international/);assert.doesNotMatch(body.query,/Germany|Deutschland/);
      }else {
        assert.match(body.query,new RegExp(body.location));
        assert.equal(body.country,{Germany:'DE',Austria:'AT',Switzerland:'CH'}[body.location]);
      }
    }
    const messages=calls.at(-1).body.messages;
    assert.match(messages[1].content,new RegExp(`TARGET MARKET: ${market}`));
    assert.match(messages[1].content,/searchRegion/);
    assert.match(messages[0].content,/country-specific evidence is not proof/);
  }));

  test(`Caption API: ${market} audience applies to all platforms and preserves language`,()=>withMock(async calls=>{
    const res=response();await captions({method:'POST',body:{idea:'cat makes pizza',market,language:'English',trendContext:signal(market)}},res);
    assert.equal(res.statusCode,200);assert.equal(res.data._meta.market,market);assert.equal(res.data._meta.trendMarket,market);
    const prompt=calls[0].body.messages[1].content;
    assert.match(prompt,new RegExp(`Target market for ALL FIVE platforms: ${market}`));
    for(const platform of ['TikTok','Instagram Reels','YouTube Shorts','LinkedIn','X'])assert.ok(prompt.includes(platform));
    assert.match(prompt,/Language: English/);assert.match(prompt,/Language is independent of market/);
    assert.ok(prompt.includes(`${market} evidence`));
    assert.ok(prompt.includes(markets.marketProfile(market).audience));
  }));
}

test('Caption API discards mismatched and legacy trend contexts, including image requests',()=>withMock(async calls=>{
  for(const trendContext of [signal('Germany'),{configured:true,signals:['legacy German evidence']},signal('Global')]){
    const res=response();
    await captions({method:'POST',body:{market:'DACH',frames:['data:image/jpeg;base64,TEST'],trendContext}},res);
    assert.equal(res.data._meta.trendMarket,null);
    const content=calls.at(-1).body.messages[1].content;
    assert.match(content[0].text,/Fresh Trend Pulse context: none/);
    assert.match(content[0].text,/Target market for ALL FIVE platforms: DACH/);
    assert.equal(content[1].type,'image_url');
  }
}));

test('Invalid markets fail before any paid dependency; missing market defaults to Germany',()=>withMock(async calls=>{
  for(const handler of [trends,captions]){
    for(const market of ['France',{},42,'toString']){
      const res=response();await handler({method:'POST',body:{idea:'cat',market}},res);assert.equal(res.statusCode,400);
    }
  }
  assert.equal(calls.length,0);
  const res=response();await trends({method:'POST',body:{},headers:{}},res);
  assert.equal(res.data.market,'Germany');assert.equal(res.data.configured,false);assert.equal(calls.length,0);
  assert.equal(markets.resolveMarket(' global '),'Global');
}));

test('Cache isolates markets, rejects legacy/mislabeled/expired data and does not extend TTL on read',()=>{
  const cache=storage(),now=100000000;
  cache.setItem('avomiez_trends',JSON.stringify({savedAt:now,data:signal('Germany')}));
  assert.equal(markets.readTrendCache(cache,'Global',now),null);
  for(const market of ['Germany','DACH','Global'])markets.writeTrendCache(cache,signal(market),now);
  for(const market of ['Germany','DACH','Global']){
    assert.equal(markets.readTrendCache(cache,market,now+1000).market,market);
    assert.equal(markets.readTrendCache(cache,market,now+24*60*60*1000),null);
  }
  cache.setItem(markets.trendCacheKey('Global'),JSON.stringify({savedAt:now,data:signal('Germany')}));
  assert.equal(markets.readTrendCache(cache,'Global',now),null);
  cache.setItem(markets.trendCacheKey('DACH'),'invalid JSON');
  assert.equal(markets.readTrendCache(cache,'DACH',now),null);
});

function studio(){
  const elements=new Map();
  const get=id=>{if(!elements.has(id))elements.set(id,{value:'',checked:true,style:{},dataset:{},classList:{toggle(){},remove(){}},scrollIntoView(){},textContent:'',innerHTML:''});return elements.get(id)};
  get('#market').value='Germany';get('#language').value='English';get('#idea').value='Pizza cat';
  const cache=storage(),calls=[];let nextTrend;
  const context=vm.createContext({...markets,console,localStorage:cache,setTimeout(){},document:{querySelector:get,querySelectorAll:()=>[]},fetch:async(url,options)=>{
    if(!options)return {json:async()=>({firecrawlConnected:true})};
    const body=JSON.parse(options.body);calls.push({url,body});
    if(url==='/api/trends')return {ok:true,json:async()=>nextTrend?await nextTrend:signal(body.market)};
    if(url==='/api/captions')return {ok:true,json:async()=>({_meta:{market:body.market}})};
    throw Error('Unexpected fetch');
  }});
  const html=readFileSync(new URL('../captions.html',import.meta.url),'utf8');
  const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace(/^import[^\n]+\n/m,'');
  vm.runInContext(script,context);
  return {get,cache,calls,run:code=>vm.runInContext(code,context),setNext:p=>{nextTrend=p}};
}

test('Studio forwards selected market to both endpoints and restores isolated cache on change',async()=>{
  const ui=studio();
  for(const market of ['Germany','Global','DACH']){
    ui.get('#market').value=market;ui.get('#market').onchange();
    assert.equal(ui.run('trendContext'),null);assert.equal(ui.get('#trendList').innerHTML,'');
    await ui.get('#refreshTrend').onclick();
    assert.equal(ui.calls.at(-1).body.market,market);
    assert.ok(ui.get('#pulseText').textContent.includes(`Trend market: ${market}`));
    await ui.get('#generate').onclick();
    assert.equal(ui.calls.at(-1).body.market,market);assert.equal(ui.calls.at(-1).body.trendContext.market,market);
    assert.ok(ui.get('#trendUsed').innerHTML.includes(`Caption target market: ${market}`));
  }
  ui.get('#market').value='Global';ui.get('#market').onchange();
  assert.equal(ui.run('trendContext.market'),'Global');
  ui.get('#trendOn').checked=false;await ui.get('#generate').onclick();
  assert.equal(ui.calls.at(-1).body.trendContext,null);
});

test('Studio rejects legacy API data and late Germany response cannot become Global context',async()=>{
  const ui=studio();let finish;
  ui.setNext(new Promise(resolve=>{finish=resolve}));
  const pending=ui.get('#refreshTrend').onclick();
  ui.get('#market').value='Global';ui.get('#market').onchange();
  finish(signal('Germany'));await pending;
  assert.equal(ui.run('trendContext'),null);assert.equal(ui.get('#trendList').innerHTML,'');
  assert.ok(ui.get('#pulseText').textContent.includes('Selected market: Global'));
  await ui.get('#generate').onclick();assert.equal(ui.calls.at(-1).body.trendContext,null);
  assert.equal(markets.readTrendCache(ui.cache,'Germany').market,'Germany');
  ui.setNext({configured:true,signals:[]});await ui.get('#refreshTrend').onclick();
  assert.equal(ui.run('trendContext'),null);assert.match(ui.get('#err').innerHTML,/does not match/);
});
