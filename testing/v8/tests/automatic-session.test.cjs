'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{createSession}=require('../simulation/universal-session.cjs');
const limits={maximum:100000,minimumProfit:15000,maximumPerPurchase:100000,budget:100000,maxPurchases:1,additionalCosts:0,skipOwned:true};
function make(pages,extra={}){const h=createSession({bundle:process.env.FC_AUTOMATIC_BUNDLE||'.local/v8-automatic/js/main.js',coins:250000,purchaseCeiling:100000,pages,...extra});h.settings.buySetting.buyPrice=100000;h.bridge.configure(h.p,limits);return h}
const card=(id,extra={})=>({id,player:id,price:100000,reference:125000,...extra});
async function start(h){const r=h.bridge.arm(h.p,{...limits,userEnabled:true});assert.equal(r.response,true,r.reason);await h.start({enable:false})}
test('automatic session buys one qualifying card without exact-card consent then confirms and stops immediately',async()=>{
 const h=make([[card(9201),card(9202)]]);assert.equal(h.bridge.automaticSessionMode,true);await start(h);await h.cycle();const s=h.bridge.status(h.p);
 assert.equal(h.attempts(),1);assert.equal(s.successes,1);assert.equal(h.coins(),150000);assert.deepEqual([...h.inventory],[9201]);assert.equal(h.p.isStarted,false);assert.equal(s.enabled,false);assert.equal(s.lastTransaction.result,'CONFIRMED OWNED');assert.equal(s.lastTransaction.updatedBalance,150000);assert.equal(s.lastTransaction.estimatedNetProfit,18750);assert.equal(s.lastTransaction.purchasePrice,100000);assert.equal(s.lastTransaction.referencePrice,125000);
});
test('automatic authorization rejects weaker limits and requires explicit session enablement',()=>{
 for(const bad of [{maximum:100001},{minimumProfit:14999},{maximumPerPurchase:100001},{budget:100001},{maxPurchases:2},{userEnabled:false}]){const h=make([]);const r=h.bridge.arm(h.p,{...limits,userEnabled:true,...bad});assert.equal(r.response,false,JSON.stringify(bad));assert.equal(h.bridge.status(h.p).enabled,false);assert.equal(h.attempts(),0)}
});
test('unprofitable and over-price cards cannot spend, while a later qualifying player may buy once',async()=>{
 const h=make([[card(9211,{reference:110000}),card(9212,{price:100500})],[card(9213)]]);await start(h);await h.cycle();assert.equal(h.attempts(),0);await h.cycle();assert.equal(h.attempts(),1);assert.equal(h.p.isStarted,false);assert.equal(h.bridge.status(h.p).successes,1);
});
test('uncertain native result stops, disarms, and cannot blindly retry',async()=>{
 const h=make([[card(9221,{outcome:'accepted-no-confirmation'}),card(9222)]]);await start(h);await h.cycle();assert.equal(h.attempts(),1);assert.equal(h.p.isStarted,false);assert.equal(h.bridge.status(h.p).enabled,false);assert.equal(h.bridge.status(h.p).successes,0);assert.equal(h.bridge.status(h.p).lastTransaction.result,'UNCERTAIN');assert.equal(h.bridge.arm(h.p,{...limits,userEnabled:true}).response,false);
});
test('session deadline rejects execution and stops even without a qualifying card',async()=>{
 const h=make([]);await start(h);await h.get(82125).wait(301);await assert.rejects(async()=>h.bridge.beforeSearch(h.p),/session-authorization-expired/);assert.equal(h.p.isStarted,false);assert.equal(h.bridge.status(h.p).enabled,false);assert.equal(h.attempts(),0);
});
test('Stop cancels authorization and restart alone cannot buy',async()=>{
 const h=make([[card(9231)]]);await start(h);h.stop();await h.start({enable:false});await h.cycle();assert.equal(h.attempts(),0);assert.equal(h.bridge.status(h.p).enabled,false);h.stop();
});
test('inventory or balance safety failures stop and revoke the automatic session',async()=>{
 for(const extra of [{inventoryUnavailable:true},{inventoryFull:true},{coins:99999}]){const h=make([[card(9241)]],extra);await start(h);await h.cycle();assert.equal(h.attempts(),0);assert.equal(h.p.isStarted,false);assert.equal(h.bridge.status(h.p).enabled,false);assert.equal(h.bridge.status(h.p).successes,0)}
});
test('authorization expiring inside valuation is enforced again before native submission',async()=>{
 let h;h=make([[card(9251)]],{onQuote:async()=>h.get(82125).wait(301)});await start(h);await h.cycle();assert.equal(h.attempts(),0);assert.equal(h.p.isStarted,false);assert.equal(h.bridge.status(h.p).enabled,false);
});
test('positive native response with missing coins or inventory is never called a successful purchase',async()=>{
 for(const outcome of ['accepted-no-coins','accepted-no-inventory','malformed']){const h=make([[card(9261,{outcome})]]);await start(h);await h.cycle();const s=h.bridge.status(h.p);assert.equal(h.attempts(),1);assert.equal(s.successes,0);assert.equal(s.enabled,false);assert.equal(s.lastTransaction.result,'UNCERTAIN');assert.equal(h.p.isStarted,false)}
});
