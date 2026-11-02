'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const adapterPath=path.join(__dirname,'../src/trader-integration.js');
test('production v8 adapter exists',()=>assert.ok(fs.existsSync(adapterPath)));
if(fs.existsSync(adapterPath)){
 const {PriceScopePlanner}=require('../src/planner.cjs');
 function harness(overrides={}){
  const logs=[],requests=[],marks=new WeakSet(),diags=new WeakMap(),out={};let previewCalls=0;
  const legacy={semantic:({offset,count,start,num,...rest})=>rest,markFresh:c=>marks.add(c),getDiagnostics:c=>diags.get(c),getAllowed:()=>undefined,wire:c=>overrides.wire?overrides.wire(c):({fields:{num:2},transport:'xhr',status:200}),endRun(){},controllerChanged(){},filterRotationDecision:()=> 'allow',noteFilterDecision(){},run:async()=>({items:[]})};
  const enhancer={multiRarities:new Set()},helpers={roundToNearestStep:n=>Math.round(n/100)*100,getBeforeStepValue:n=>n-100,getNextStepValue:n=>n+100};
  const deps={99007:legacy,99009:{PriceScopePlanner},99013:require('../src/scope-pager.cjs'),99012:{preview:async()=>{previewCalls++;return {response:true,purchaseAuthorized:false}},execute:async()=>({purchaseAuthorized:false})},32024:{InMemoryStore:{instance:{get:()=>enhancer}}},27988:helpers,71446:{filterResult:items=>items}};
  require(adapterPath)({},out,id=>{if(!(id in deps))throw Error('Forbidden dependency '+id);return deps[id]});
  const criteria={type:'player',rarities:[4242],defId:[],minBuy:0,maxBuy:800};
  const processor={isStarted:true,traderSettings:{searchSetting:{autoFindNewest:true,v8SnipeMaximum:900},buySetting:{buyPrice:900}},traderData:{cache:{filter:{currentFilter:'SCREAM'},cachedBids:new Set()}},controllerInstance:{viewmodel:{searchCriteria:criteria}},cancellationToken:{isCancelled:false}};
  const item=(id='1',price=700,expires=3559,rarity=4242)=>{const auction={tradeId:id,buyNowPrice:price,expires};return {_auction:auction,rareflag:rarity,type:'player',getAuctionData:()=>auction,getStaticData:()=>({name:'Synthetic <player>'})}};
  let items=[item()];
  const orchestrator={searchMarket:async(c,page)=>{assert.ok(marks.has(c));requests.push({criteria:structuredClone(c),page});if(overrides.search)return overrides.search(c,page,diags,processor);diags.set(c,{kind:'success'});return items}};
  const cycle=()=>out.run(processor,criteria,orchestrator,s=>logs.push(s));
  return {out,processor,criteria,cycle,requests,logs,item,setItems:x=>items=x,previewCalls:()=>previewCalls,enhancer};
 }
 test('production search uses all-player rarity criteria and stricter native ceiling at page one',async()=>{
  const h=harness();const result=await h.cycle();assert.equal(h.requests[0].page,1);assert.equal(h.requests[0].criteria.maxBuy,800);assert.deepEqual(h.requests[0].criteria.defId,[]);assert.deepEqual(h.requests[0].criteria.rarities,[4242]);assert.equal(result.items.length,0);assert.equal(h.previewCalls(),1);assert.equal(h.criteria.maxBuy,800);assert.match(h.logs.join('\n'),/buying=DISABLED/);
 });
 test('over-ceiling, wrong-rarity, old and duplicate items never reach native purchase preview',async()=>{
  const h=harness();h.setItems([h.item('1',801),h.item('2',700,3559,99),h.item('3',700,59),h.item('4'),h.item('4')]);await h.cycle();assert.equal(h.previewCalls(),1);await h.cycle();assert.equal(h.previewCalls(),1);
 });
 test('missing maximum and selected player fail before a native market request',async()=>{
  for(const change of [h=>delete h.processor.traderSettings.searchSetting.v8SnipeMaximum,h=>h.criteria.defId=[1]]){const h=harness();change(h);assert.equal((await h.cycle()).stop,true);assert.equal(h.requests.length,0);}
 });
 test('invalid native buy maximum cannot be silently broadened',async()=>{const h=harness();h.processor.traderSettings.buySetting.buyPrice='600';assert.equal((await h.cycle()).stop,true);assert.equal(h.requests.length,0);});
 test('stop while native response is pending discards late candidates',async()=>{
  let resolve;const h=harness({search:(c,p,d)=>new Promise(r=>{resolve=()=>{d.set(c,{kind:'success'});r([h.item()])}})});const run=h.cycle();h.processor.isStarted=false;h.processor.cancellationToken.isCancelled=true;h.out.endRun(h.processor,'test-stop');resolve();await run;assert.equal(h.previewCalls(),0);
 });
 test('native HTTP failures stop without empty-result retries',async()=>{
  const h=harness({search:async(c,p,d)=>{d.set(c,{kind:'service-error',status:429});return undefined}});assert.equal((await h.cycle()).stop,true);assert.equal(h.requests.length,1);assert.equal(h.previewCalls(),0);
 });
 test('price or rarity changes during an awaited response discard candidates',async()=>{
  const h=harness({search:async(c,p,d,processor)=>{processor.traderSettings.searchSetting.v8SnipeMaximum=600;d.set(c,{kind:'success'});return[h.item()]}});assert.equal((await h.cycle()).stop,true);assert.equal(h.previewCalls(),0);
 });
 test('production adapter validates native sequential pages with legitimate overlap and unchanged cap',async()=>{
  const h=harness({wire:c=>({offset:c.offset,status:200,transport:'xhr',fields:{num:2}}),search:async(c,page,d)=>{c.offset=page-1;d.set(c,{kind:'success'});return[h.item(String(page)),h.item(String(page+1))]}});
  for(let i=0;i<4;i++)await h.cycle();assert.deepEqual(h.requests.map(r=>r.page),[1,2,1,2]);assert.equal(h.requests[3].criteria.maxBuy,800);assert.equal(h.requests[3].criteria.minBuy,700);assert.match(h.logs.join('\n'),/page=2 offset=1/);assert.equal(h.previewCalls(),3);
 });
 test('replaying a completed old-listing traversal eventually cools down rather than inventing progress',async()=>{
  const h=harness({wire:c=>({offset:c.offset,status:200,transport:'xhr',fields:{num:2}}),search:async(c,page,d)=>{c.offset=page-1;d.set(c,{kind:'success'});return[h.item(String(page),700,59),h.item(String(page+1),700,59)]}});
  for(let i=0;i<60;i++)await h.cycle();assert.ok(h.requests.length<60);assert.equal(h.previewCalls(),0);
 });
 test('stale native response is rejected before safety preview',async t=>{let now=0;t.mock.method(Date,'now',()=>now);const h=harness({search:async(c,p,d)=>{now=16000;d.set(c,{kind:'success'});return[h.item()]}});assert.equal((await h.cycle()).stop,true);assert.equal(h.previewCalls(),0);assert.equal(h.out.getStatus(h.processor).error,'stale-native-response');});
 test('unexpected market errors stop safely and a new healthy session can recover',async()=>{for(const status of [401,429,500,503]){let failed=true;const h=harness({search:async(c,p,d)=>{d.set(c,failed?{kind:'service-error',status}:{kind:'success'});return failed?undefined:[h.item()]}});assert.equal((await h.cycle()).stop,true);assert.equal(h.previewCalls(),0);failed=false;h.processor.cancellationToken={isCancelled:false};await h.cycle();assert.equal(h.previewCalls(),1);}});
 test('status accounts for fresh, price, rarity, age and duplicate rejections without changing query bounds',async()=>{const h=harness();h.setItems([h.item('1',801),h.item('2',700,3559,99),h.item('3',700,59),h.item('4'),h.item('4')]);await h.cycle();const s=h.out.getStatus(h.processor);assert.equal(s.freshCount,2);assert.equal(s.rejectedCount,4);assert.equal(s.rejectionReasons['Outside price limits'],1);assert.equal(s.rejectionReasons['Wrong rarity'],1);assert.equal(s.rejectionReasons['Duplicate trade ID'],1);assert.equal(s.freshCandidates.length,1);assert.equal(s.configuredMaximum,900);assert.equal(s.effectiveMaximum,800);h.out.endRun(h.processor,'test-stop');assert.equal(h.out.getStatus(h.processor).freshCount,2);});
}
