'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const factoryPath=path.join(__dirname,'../src/offline-integration.js');
test('offline integration controller is available',()=>assert.equal(fs.existsSync(factoryPath),true));
if(fs.existsSync(factoryPath)) {
 const {load,moduleExports}=require('./bundle-loader.cjs');
 const {modules}=load(path.join(process.env.FC_EXTENSION_DIR,'js/main.js'),{DEFAULT_PLAYSTYLE_ID:0,ItemSubType:{TRAINING_PLAYERSTYLE_GOALKEEPER_5:9}});
 const deps={26735:{UINotificationTypeEnum:{}},44669:{translate:()=>''},51477:{Logger:{writeToLog(){}}},99398:{writeBuyPriceGreaterLog(){}}};
 const safety={};require('../src/safety-module.js')({},safety,id=>moduleExports(modules,id,deps));
 function setup(){
  const logs=[],out={};require(factoryPath)({},out,id=>{
   if(id===99009)return require('../src/planner.cjs');
   if(id===99010)return safety;
   if(id===51477)return {Logger:{writeToLog:text=>logs.push(text)}};
   throw Error('Forbidden integration dependency '+id);
  });
  const session=new out.OfflineIntegration({criteria:{type:'player',rarities:[4242]},verifiedRarityIds:[4242],snipeMaximum:900});
  return {session,logs};
 }
 const settings={buySetting:{buyPrice:900,findBuyPrice:false},searchSetting:{ratingRange:[10,99]}};
 const item=(id='900000000000000001',price=700)=>{const a={tradeId:id,buyNowPrice:price,expires:3559,isExpired:()=>false};return {_auction:a,rating:85,preferredPosition:1,playStyle:1,getAuctionData:()=>a,getStaticData:()=>({name:'<img src=x onerror=alert(1)>'})}};
 test('planner to native safety to logger remains read-only and deduplicates',async()=>{
  const {session,logs}=setup(),data={cache:{cachedBids:new Set()}};
  const first=await session.replay({intentId:session.next().id,items:[item()],settings,data,safetyOptions:{balance:10000}});
  assert.equal(first.records[0].safety.status,'pass');assert.equal(first.records[0].purchaseAuthorized,false);
  assert.match(logs[0],/&lt;img/);assert.equal(data.cache.cachedBids.size,0);
  const second=await session.replay({intentId:session.next().id,items:[item()],settings,data,safetyOptions:{balance:10000}});
  assert.equal(second.records.length,0);assert.equal(logs.length,1);
 });
 test('stale responses and stopped sessions cannot evaluate or log candidates',async()=>{
  const {session,logs}=setup();session.next();
  await assert.rejects(session.replay({intentId:'wrong',items:[item()]}),/intent/);
  session.stop();await assert.rejects(session.replay({intentId:'intent-1',items:[item()]}),/stopped/);assert.equal(logs.length,0);
 });
 test('caller cannot loosen fixed cap or enable pricing lookups',async()=>{
  const {session}=setup();const r=await session.replay({intentId:session.next().id,items:[item('2',950)],settings,data:{cache:{cachedBids:new Set()}},safetyOptions:{fixedMaximum:100000,allowPricingLookup:true,balance:10000}});
  assert.equal(r.records[0].safety.status,'reject');assert.equal(r.records[0].purchaseAuthorized,false);
 });
}
