'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{createSession}=require('../simulation/universal-session.cjs');
const bundle='.local/v8-improved/js/main.js';
const limits={maximum:900,minimumProfit:25,maximumPerPurchase:900,budget:4000,maxPurchases:1,additionalCosts:0,skipOwned:true};
async function run(spec,change=()=>{}){const h=createSession({bundle,pages:[spec]});h.bridge.configure(h.p,limits);change(h);await h.start({enable:false});await h.cycle();return h;}
test('normal installed production discovery values multiple players without arming or spending',async()=>{
 const h=await run([{id:9101,player:201},{id:9102,player:202,profitable:false}]);
 const rows=h.get(99011).getStatus(h.p).candidateRows;
 assert.equal(rows.length,2);assert.equal(rows[0].referencePrice,1000);assert.equal(rows[0].netProfit,50);assert.equal(rows[0].qualifies,true);assert.equal(rows[1].netProfit,-45);assert.equal(rows[1].qualifies,false);assert.equal(rows[1].reason,'minimum-net-profit-not-met');
 assert.equal(h.attempts(),0);assert.equal(h.coins(),5000);assert.equal(h.bridge.status(h.p).enabled,false);h.stop();
});
test('disabled valuation is explicit NOT VALUED and never confuses price eligibility with profit',async()=>{
 const h=await run([{id:9111,player:201}],h=>h.settings.buySetting.findBuyPrice=false);const row=h.get(99011).getStatus(h.p).candidateRows[0];
 assert.equal(row.valuationState,'NOT VALUED');assert.equal(row.reason,'profitability-rule-not-configured');assert.equal(row.qualifies,false);assert.equal(h.attempts(),0);h.stop();
});
test('old, wrong-rarity and over-price listings have visible exact reasons without valuation requests',async()=>{
 const h=await run([{id:9121,price:901},{id:9122,seconds:60},{id:9123,rarity:72}]);const rows=h.get(99011).getStatus(h.p).candidateRows;
 assert.deepEqual(Array.from(rows,r=>r.reason).sort(),['Outside fresh window','Outside price limits','Wrong rarity'].sort());
 assert.ok(rows.every(r=>r.valuationState==='NOT VALUED'&&!r.qualifies));assert.equal(h.events.filter(e=>e.kind==='price-quote').length,0);assert.equal(h.attempts(),0);h.stop();
});
test('quote service errors stop read-only discovery without submitting a purchase',async()=>{
 const h=await run([{id:9131,player:201,pricingError:true}]);const row=h.get(99011).getStatus(h.p).candidateRows[0];
 assert.equal(row.reason,'price-source-service-error');assert.equal(row.valuationState,'NOT VALUED');assert.equal(h.p.isStarted,false);assert.equal(h.attempts(),0);assert.equal(h.bridge.status(h.p).enabled,false);
});
test('stale observation after rate-spaced valuations is rejected rather than claimed profitable',async()=>{
 const h=await run([{id:9141,player:201},{id:9142,player:202},{id:9143,player:203},{id:9144,player:204}]);const rows=h.get(99011).getStatus(h.p).candidateRows;
 assert.ok(rows.some(r=>r.reason==='stale-response'&&!r.qualifies));assert.equal(h.attempts(),0);h.stop();
});
test('Stop during a read-only valuation cannot revive Running or authorize a purchase',async()=>{
 let enter,release;const entered=new Promise(r=>enter=r),gate=new Promise(r=>release=r);
 const h=createSession({bundle,pages:[[{id:9151,player:201}]],onQuote:async()=>{enter();await gate}});h.bridge.configure(h.p,limits);await h.start({enable:false});const pending=h.cycle();await entered;h.stop();release();await pending;
 const status=h.get(99011).getStatus(h.p);assert.equal(status.state,'stopped');assert.equal(h.p.isStarted,false);assert.equal(h.bridge.status(h.p).enabled,false);assert.equal(h.attempts(),0);assert.equal(status.candidateRows[0].qualifies,false);assert.notEqual(status.candidateRows[0].reason,'awaiting-safety-and-valuation');
});
