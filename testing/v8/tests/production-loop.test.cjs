'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const root=path.resolve(__dirname,'../../..'),bundle=path.join(root,'.local/v8-trader-validation/js/main.js');
const harnessPath=path.join(root,'.local/v72-source/work/regression.cjs');
const prefix=fs.readFileSync(harnessPath,'utf8').split("test('page 1 is validated first")[0].replace('const real=new Set([','const real=new Set([99009,99011,99012,99013,99014,99015,99016,7520,72316,93727,39887,10270,30804,22850,62813,72678,10454,');
const compiled=new Module(harnessPath,module);compiled.filename=harnessPath;compiled.paths=Module._nodeModulePaths(path.dirname(harnessPath));compiled._compile(prefix+'\nmodule.exports={harness};',harnessPath);
const {harness}=compiled.exports;
test('actual production Trader runActions calls v8 native search adapter and never transfer execution',async()=>{
 const h=harness(()=>[{id:'one',rareflag:123,type:'player',_auction:{tradeId:'1',expires:3559,buyNowPrice:500},getAuctionData(){return this._auction},getStaticData:()=>({name:'Fixture'})}],{bundle,productionLoop:true,nativeAdapter:true,search:{v8SnipeMaximum:900,ratingRange:[10,99],startingSearchPage:20},buy:{buyPrice:600}});
 await h.cycle();assert.equal(h.requests.length,1);assert.equal(h.requests[0].page,1);assert.equal(h.requests[0].criteria.maxBuy,600);assert.deepEqual(h.eligible,[]);assert.match(h.logs.join('\n'),/\[v8 candidate\]/);assert.match(h.logs.join('\n'),/buying=DISABLED/);
});
test('actual production Trader fails closed before search when no maximum is configured',async()=>{
 const h=harness(()=>[],{bundle,productionLoop:true,nativeAdapter:true});await h.cycle();assert.equal(h.requests.length,0);assert.equal(h.p.isStarted,false);
});
test('actual production Trader retains early in-flight lock with v8 integration',async()=>{
 let resolve;const h=harness(()=>new Promise(r=>{resolve=r}),{bundle,search:{v8SnipeMaximum:900},buy:{buyPrice:600}});
 const first=h.cycle();await Promise.resolve();await Promise.resolve();await h.cycle();
 while(!resolve)await new Promise(r=>setImmediate(r));assert.equal(h.requests.length,1);resolve([]);await first;assert.equal(h.p.isOperationInProgress,false);
});
test('stopping and restarting actual Trader discards the old response without stopping the new run',async()=>{
 let resolve;const h=harness(()=>new Promise(r=>{resolve=r}),{bundle,search:{v8SnipeMaximum:900},buy:{buyPrice:600}});
 const first=h.cycle();while(!resolve)await new Promise(r=>setImmediate(r));h.p.stop();h.p.isStarted=true;h.p.cancellationToken={isCancelled:false};resolve([]);await first;assert.equal(h.p.isStarted,true);
});
test('first v8 cycle retains the chosen filter before any legacy scheduled rotation can replace its price bounds',async()=>{
 const h=harness(()=>[],{bundle,productionLoop:true,nativeAdapter:true,search:{v8SnipeMaximum:900},buy:{buyPrice:600},filter:{currentFilter:'SCREAM',selectedFilters:['OTHER'],currentFilterRunCount:10,noOfTimesToRun:1,noOfTimesRange:[1,1]}});
 h.p.controllerInstance.viewmodel.searchCriteria.minBuy=500;h.filters.OTHER.baseSetting.searchSetting.v8SnipeMaximum=100000;h.filters.OTHER.baseSetting.buySetting.buyPrice=100000;await h.cycle();assert.equal(h.requests[0].criteria.minBuy,500);assert.ok(h.requests[0].criteria.maxBuy<=900);assert.equal(h.settings.searchSetting.v8SnipeMaximum,900);assert.deepEqual(h.loads,[]);
});
