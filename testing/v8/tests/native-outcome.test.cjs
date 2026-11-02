'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {load,moduleExports}=require('./bundle-loader.cjs');
test('actual native failed transaction is not treated as a win and a later distinct trade can recover',async()=>{
 const {modules}=load(path.resolve(__dirname,'../../../.local/v8-trader-validation/js/main.js'),{services:{User:{getUser:()=>({coins:{amount:10000}})}}});
 let success=false,calls=0;const stats={wonCount:0,lossCount:0,bidCount:0};const store={traderSettings:{buySetting:{}},traderData:{cache:{bidsByFilter:new Map(),filter:{currentFilter:'TEST'}}}};
 let bridge;const outcomes=[];const deps={99012:{beginNativeTransaction:item=>{outcomes.push('submitted');bridge?.beginNativeTransaction(item)},recordNativeOutcome:(item,success)=>{outcomes.push(success?'won':'unknown');bridge?.recordNativeOutcome(item,success)}},22869:{ExternalNotificationType:{LOST:'LOST',WON:'WON'}},32024:{InMemoryStore:{instance:{get:k=>store[k]}}},26735:{UINotificationTypeEnum:{}},13808:{bidItem:async()=>{calls++;return{success,error:success?undefined:461}}},82125:{NotificationEventPublisher:{instance:{notifyObservers(){}}}},57439:{Analytics:{instance:{fireEvent(){}}}},44669:{translate:()=>''},27988:{getLocalization:()=>({localize:()=>''})},99611:{getBidPrice:()=>100},39021:{StatsFactory:{instance:{getProcessor:()=>({incrementStat:k=>stats[k]++,getStats:()=>stats})}}},19719:{bidErrorCodeLookup:{},errorCodeLookUp:{}},41880:{updateErrorCodeCount(){}}};
 const native=moduleExports(modules,83847,deps);
 const orchestrator=moduleExports(modules,30154,{82125:{getRandomNumberInRange:()=>0,wait:async()=>{}},51477:{Logger:{writeToLog(){}}},7520:{runBidMiddlewares:item=>native.bidItem({data:item,params:{calculatedPriceToBin:900,calculatedPriceToBid:0},filterName:'TEST'},async()=>({response:true}))}});
 const item=id=>({_auction:{tradeId:id,buyNowPrice:700},getStaticData:()=>({name:'Synthetic'})});
 assert.equal(await orchestrator.handleTransferResultsBG([item('1')],{maxPurchasesPerSearchRequest:1},{isCancelled:false}),undefined);
 success=true;assert.equal((await orchestrator.handleTransferResultsBG([item('2')],{maxPurchasesPerSearchRequest:1},{isCancelled:false})).length,1);assert.equal(calls,2);assert.equal(stats.lossCount,1);assert.equal(stats.wonCount,1);assert.deepEqual(outcomes,['submitted','unknown','submitted','won']);
 bridge={};require('../src/purchase-bridge.js')({},bridge,id=>id===7520?{}:id===99014?{policy:{validationComplete:true,purchaseEnabled:true,userAuthorized:true}}:require('../src/purchase-preflight.cjs'));
 const processor=()=>({isStarted:true,cancellationToken:{isCancelled:false},traderSettings:{searchSetting:{v8SnipeMaximum:900},buySetting:{},safeSetting:{maxPurchasesPerSearchRequest:1}}});
 const listing=id=>{const value=item(id);value._auction.expires=3559;value.getAuctionData=()=>({...value._auction,isExpired:()=>false});return value};
 let handled=0;const flow={handleTransferResults:(items,safe,token)=>orchestrator.handleTransferResultsBG(items,safe,token),handleWonItems:async()=>{handled++}};
 const failedProcessor=processor(),options=p=>({processor:p,orchestrator:flow,maximum:900,balance:10000,perSearch:{attempts:0}});
 success=false;assert.equal((await bridge.execute(listing('3'),options(failedProcessor))).reason,'transaction-outcome-unknown');const failedCalls=calls;assert.equal((await bridge.execute(listing('4'),options(failedProcessor))).reason,'reconciliation-required');assert.equal(calls,failedCalls);
 success=true;assert.equal((await bridge.execute(listing('5'),options(processor()))).reason,'native-flow-completed');assert.equal(handled,1);

});
