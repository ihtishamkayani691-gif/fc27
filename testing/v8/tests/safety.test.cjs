const test=require('node:test');const assert=require('node:assert/strict');
const {load,moduleExports}=require('./bundle-loader.cjs');
const {modules}=load(require('node:path').join(process.env.FC_EXTENSION_DIR || '/workspace/fc-enhancer-v72/patched','js/main.js'),{DEFAULT_PLAYSTYLE_ID:0,ItemSubType:{TRAINING_PLAYERSTYLE_GOALKEEPER_5:9}});
let executions=0,pricing=0;
const dependencies={26735:{UINotificationTypeEnum:{}},44669:{translate:()=>''},51477:{Logger:{writeToLog(){}}},99398:{writeBuyPriceGreaterLog(){}}};
const cache={};function native(id){if(id===53799)return {getRealTimePrice:async()=>{pricing++;return 500}};if([83847,91414,7520].includes(id)){executions++;throw Error('Execution dependency forbidden')};return cache[id]??=moduleExports(modules,id,dependencies)}
const out={};require('../src/safety-module.js')({},out,native);
const settings={buySetting:{buyPrice:1000,findBuyPrice:false},searchSetting:{ratingRange:[10,99]}};
const data={cache:{cachedBids:new Set()}};
function item(price=700,time=3559){const a={buyNowPrice:price,expires:time,tradeId:'99999999999999999999',isExpired:()=>false};return {_auction:a,rating:85,preferredPosition:1,playStyle:1,getAuctionData:()=>a,getStaticData:()=>({name:'Test'})}}
const opts={fixedMaximum:900,balance:10000,profitabilityVerified:true,budgetVerified:true};
test('production safety checks pass without action side effects',async()=>{const r=await out.evaluate(item(),settings,data,opts);assert.equal(r.status,'pass');assert.equal(r.passed.length,5);assert.equal(executions,0);assert.equal(data.cache.cachedBids.size,0)});
test('fixed ceiling independently enforced',async()=>assert.equal((await out.evaluate(item(901),settings,data,opts)).reason,'above-effective-price-maximum'));
test('stricter native ceiling preserved',async()=>assert.equal((await out.evaluate(item(),settings,data,{...opts,nativeMaximum:600})).status,'reject'));
test('dynamic unavailable fails closed without networking',async()=>{assert.equal((await out.evaluate(item(),{...settings,buySetting:{...settings.buySetting,findBuyPrice:true}},data,opts)).reason,'dynamic-price-unavailable');assert.equal(pricing,0)});
test('stricter dynamic cap preserved',async()=>assert.equal((await out.evaluate(item(),{...settings,buySetting:{...settings.buySetting,findBuyPrice:true}},data,{...opts,dynamicMaximum:500})).status,'reject'));
test('59 seconds rejected, endpoints accepted',async()=>{assert.equal((await out.evaluate(item(700,59),settings,data,opts)).status,'reject');for(const t of [3540,3600])assert.equal((await out.evaluate(item(700,t),settings,data,opts)).status,'pass')});
test('original rating middleware rejects',async()=>{const i=item();i.rating=1;assert.equal((await out.evaluate(i,settings,data,opts)).reason,'native-checkIfValidRatingRange')});
test('unknown balance, budget, profitability do not fabricate approval',async()=>{for(const k of ['balance','budgetVerified','profitabilityVerified']){const o={...opts,requireBudget:true,requireProfitability:true};delete o[k];assert.equal((await out.evaluate(item(),settings,data,o)).status,'unavailable')}});
test('native purchase cache respected but never mutated',async()=>{const d={cache:{cachedBids:new Set([item()._auction.tradeId])}};assert.equal((await out.evaluate(item(),settings,d,opts)).status,'reject');assert.equal(d.cache.cachedBids.size,1)});
test('club ownership unknown fails closed without squad requests',async()=>assert.equal((await out.evaluate(item(),{...settings,buySetting:{...settings.buySetting,skipClubPlayers:true}},data,opts)).reason,'club-ownership-unavailable'));
test('unconfigured profit rule is labeled without inventing rejection',async()=>{const r=await out.evaluate(item(),settings,data,{fixedMaximum:900,balance:10000});assert.equal(r.status,'pass');assert.equal(r.profitEvaluation,'unverified/not-configured');assert.equal(r.purchaseAuthorized,false);assert.equal(r.fullPurchaseSafety,'pending')});
