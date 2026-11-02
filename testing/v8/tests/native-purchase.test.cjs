'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const main=path.resolve(__dirname,'../../../.local/v8-trader-validation/js/main.js');
test('production Trader validation bundle is built',()=>assert.ok(fs.existsSync(main)));
if(fs.existsSync(main)){
 const {load}=require('./bundle-loader.cjs');
 function harness(buyOverrides={},mockExecution=false,dynamicPrice=undefined){
  const {modules}=load(main,{DEFAULT_PLAYSTYLE_ID:0,ItemSubType:{TRAINING_PLAYERSTYLE_GOALKEEPER_5:9}});
  let executions=0,cacheWrites=0,terminalParams;const settings={buySetting:{buyPrice:1000,bidPrice:0,...buyOverrides},searchSetting:{ratingRange:[10,99]}},data={cache:{cachedBids:new Set(),filter:{currentFilter:'SCREAM'}}};
  const stubs={32024:{InMemoryStore:{instance:{get:k=>k==='traderSettings'?settings:data}}},27988:{getLocalization:()=>({})},26735:{UINotificationTypeEnum:{}},44669:{translate:()=>''},51477:{Logger:{writeToLog(){}}},99398:{writeBuyPriceGreaterLog(){}},99611:{getBidPrice:()=>100},53799:{getRealTimePrice:async()=>dynamicPrice},13808:{getSquadPlayerIds:async()=>new Set()},91414:{addToCache:async()=>{cacheWrites++;throw Error('cache mutation forbidden')}},83847:{bidItem:async()=>{executions++;throw Error('execution forbidden')}},9514:{runMiddlewares:async(context,chain)=>{const next=async(index,value)=>index<chain.length?chain[index](value,v=>next(index+1,v)):{response:true};return next(0,context)}}};
  if(mockExecution){settings.searchSetting.autoFindNewest=true;settings.searchSetting.v8SnipeMaximum=900;stubs[91414].addToCache=async(e,next)=>{cacheWrites++;return next(e)};stubs[83847].bidItem=async(e,next)=>{executions++;terminalParams=e.params;return next(e)};}
  const cache=new Map();const requireNative=id=>{if(id in stubs)return stubs[id];if(cache.has(id))return cache.get(id).exports;const m={exports:{}};cache.set(id,m);modules[id](m,m.exports,requireNative);return m.exports};
  const auction={tradeId:'1',expires:3559,buyNowPrice:700,isExpired:()=>false};const item={_auction:auction,rating:85,preferredPosition:1,playStyle:1,getAuctionData:()=>auction,getStaticData:()=>({name:'Synthetic'})};
  return{native:requireNative(7520),item,settings,data,terminalParams:()=>terminalParams,counters:()=>({executions,cacheWrites})};
 }
 test('full original native safety preview excludes cache and bid terminal steps',async()=>{const h=harness();assert.equal((await h.native.previewBidMiddlewares(h.item,false,900)).response,true);assert.deepEqual(h.counters(),{executions:0,cacheWrites:0});});
 test('native preview rejects above fixed cap and preserves tighter native buy limit',async()=>{for(const [price,limit]of [[901,1000],[700,600]]){const h=harness({buyPrice:limit});h.item._auction.buyNowPrice=price;assert.equal((await h.native.previewBidMiddlewares(h.item,false,900)).response,false);assert.deepEqual(h.counters(),{executions:0,cacheWrites:0});}});
 test('native duplicate and dynamic-price-unavailable checks fail closed',async()=>{const a=harness();a.data.cache.cachedBids.add('1');assert.equal((await a.native.previewBidMiddlewares(a.item,false,900)).response,false);const b=harness({findBuyPrice:true});assert.equal((await b.native.previewBidMiddlewares(b.item,false,900)).response,false);});
 test('native profitability-derived maximum remains stricter than the configured fixed ceiling',async()=>{const h=harness({findBuyPrice:true},false,600);assert.equal((await h.native.previewBidMiddlewares(h.item,false,900)).response,false);h.item._auction.buyNowPrice=500;assert.equal((await h.native.previewBidMiddlewares(h.item,false,900)).response,true);assert.deepEqual(h.counters(),{executions:0,cacheWrites:0});});
 test('authorized-flow fixture reaches only mocked native purchase terminals after all checks',async()=>{const h=harness({},true);assert.equal((await h.native.runBidMiddlewares(h.item,false)).response,true);assert.deepEqual(h.counters(),{executions:1,cacheWrites:1});});
 test('native execution pipeline independently rejects above v8 maximum before mocked purchase',async()=>{const h=harness({},true);h.item._auction.buyNowPrice=950;assert.equal((await h.native.runBidMiddlewares(h.item,false)).response,false);assert.deepEqual(h.counters(),{executions:0,cacheWrites:0});});
 test('v8 maximum alone supplies a BIN price without permitting bidding',async()=>{const h=harness({buyPrice:0,bidPrice:500},true);h.item._auction.buyNowPrice=700;assert.equal((await h.native.runBidMiddlewares(h.item,false)).response,true);assert.equal(h.terminalParams().calculatedPriceToBin,900);assert.equal(h.terminalParams().calculatedPriceToBid,0);});
 test('purchase bridge routes a separately authorized fixture through the existing orchestrator and original safety chain',async()=>{
  const h=harness({},true),bridge={},policy={validationComplete:true,purchaseEnabled:true,userAuthorized:true};let routed=0;
  require('../src/purchase-bridge.js')({},bridge,id=>id===7520?h.native:id===99014?{policy}:require('../src/purchase-preflight.cjs'));
  const processor={isStarted:true,cancellationToken:{isCancelled:false},traderSettings:h.settings};
  const orchestrator={handleTransferResults:async items=>{routed++;assert.equal((await h.native.runBidMiddlewares(items[0],false)).response,true);return[]},handleWonItems:async()=>{throw Error('No won items in fixture')}};
  const result=await bridge.execute(h.item,{maximum:900,processor,orchestrator,balance:10000,perSearch:{attempts:0}});assert.equal(result.purchaseAuthorized,true);assert.equal(routed,1);assert.deepEqual(h.counters(),{executions:1,cacheWrites:1});
 });
 test('purchase policy requires validation, a distinct enable switch and separate user authorization',async()=>{
  for(const flag of ['validationComplete','purchaseEnabled','userAuthorized']){const h=harness({},true),bridge={},policy={validationComplete:true,purchaseEnabled:true,userAuthorized:true,[flag]:false};require('../src/purchase-bridge.js')({},bridge,id=>id===7520?h.native:{policy});const r=await bridge.execute(h.item,{maximum:900,processor:{isStarted:true,traderSettings:h.settings,cancellationToken:{isCancelled:false}},orchestrator:{handleTransferResults:async()=>{throw Error('Must not execute')}}});assert.equal(r.purchaseAuthorized,false);assert.deepEqual(h.counters(),{executions:0,cacheWrites:0});}
 });
}
