'use strict';
// Portable OFFLINE production-module audit. All browser/search/purchase dependencies are stubs.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir=__dirname,metadata=JSON.parse(fs.readFileSync(path.join(dir,'SOURCE_METADATA.json'),'utf8'));
const context=vm.createContext({console,structuredClone,services:{Notification:{clearAll(){}}}}),modules={};
for(const name of fs.readdirSync(dir).filter(name=>/^\d+-.*\.cjs$/.test(name))){context.module={exports:{}};vm.runInContext(fs.readFileSync(path.join(dir,name),'utf8'),context);modules[Number(name.split('-')[0])]=context.module.exports;}
const cache={},records=[];
const settings={searchSetting:{autoFindNewest:true,startingSearchPage:1,searchResultPageLimit:39,useRandomMinBuy:false},buySetting:{buyPrice:400000,findBuyPrice:false,findBidPrice:false},safeSetting:{}};
const data={cache:{filter:{currentFilter:'SCREAM',changesMade:false},nextPageNumber:1}};
const stored={traderSettings:settings,traderData:data,enhancerSettings:{multiRarities:new Set()}};
const logger={writeToLog(){}};
const stubs={32024:{InMemoryStore:{instance:{get:k=>stored[k]}}},51477:{Logger:logger},71446:{filterResult:x=>x},47751:{runAutoActionsMiddlewares:async()=>{}},98003:{TransferFactory:{instance:{getTransferOrchestrator:()=>orchestrator}}}};
function requireModule(id){if(stubs[id])return stubs[id];if(cache[id])return cache[id];if(id===99007){const m={exports:{}};cache[id]=m.exports;modules[id](m,m.exports,requireModule);return m.exports}return{}}
const orchestrator={searchMarket:async(criteria,page)=>{records.push(structuredClone(criteria));requireModule(99007).record(criteria,{kind:'success'});return[]},handleTransferResults:async()=>[],handleWonItems:async()=>{},handleTransferList:async()=>{},handleWatchList:async()=>{}};
const m={exports:{}};modules[61400](m,m.exports,requireModule);
const processor=Object.create(m.exports.TraderProcessor.prototype);Object.assign(processor,{isStarted:true,traderSettings:settings,traderData:data,controllerInstance:{viewmodel:{searchCriteria:{type:'player',rarities:[4242],defId:[],minBuy:0,minBid:0}},toggleElementsState(){}},statsProcessor:{updateTempStat(){},getTempStats:()=>({tlWlCheckCycle:1000})},checkBotState:async()=>false,listCheckCount:0});
(async()=>{
 await processor.runActions(10);
 assert.equal(settings.buySetting.buyPrice,400000);assert.equal(Object.hasOwn(records[0],'maxBuy'),false);
 processor.controllerInstance.viewmodel.searchCriteria.maxBuy=250000;await processor.runActions(10);assert.equal(records[1].maxBuy,250000);
 processor.controllerInstance.viewmodel.searchCriteria.maxBuy=900000;await processor.runActions(10);assert.equal(records[2].maxBuy,900000);
 // Execute the existing price middleware independently, with no purchase executor.
 let continued=0,rejected=0;const mod={exports:{}};modules[30804](mod,mod.exports,()=>({writeBuyPriceGreaterLog(){rejected++}}));
 await mod.exports.checkBuyPrice({data:{_auction:{buyNowPrice:500000}},params:{calculatedPriceToBin:400000}},()=>{continued++;return{response:true}});
 assert.equal(rejected,1);assert.equal(continued,0);
 await mod.exports.checkBuyPrice({data:{_auction:{buyNowPrice:400000}},params:{calculatedPriceToBin:400000}},()=>{continued++;return{response:true}});assert.equal(continued,1);
 const report={sourceFile:'FC Enhancer v7.2 js/main.js',sha256:metadata.sha256,tests:[
  {case:'BuySetting=400000, controller maxBuy absent',outgoingMaxBuy:'absent',passed:true},
  {case:'BuySetting=400000, controller maxBuy=250000',outgoingMaxBuy:records[1].maxBuy,passed:true},
  {case:'BuySetting=400000, controller maxBuy=900000',outgoingMaxBuy:records[2].maxBuy,passed:true},
  {case:'production checkBuyPrice rejects 500000 above 400000',passed:true},
  {case:'production checkBuyPrice accepts price equality 400000',passed:true}],
  execution:'actual production runActions/helper with stubbed external search/handlers; actual checkBuyPrice; no network or purchases',liveEA:false};
 fs.writeFileSync(path.join(dir,'AUDIT_TEST_RESULTS.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
})().catch(error=>{console.error(error);process.exitCode=1});
