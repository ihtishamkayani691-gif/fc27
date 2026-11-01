'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const {OfflineEvaluator,planRosterGroups,proposePriceConstrainedCriteria}=require('./evaluator.cjs');
const T='2026-11-01T12:00:00.000Z',LATER='2026-11-01T12:00:10.000Z';
const config=(overrides={})=>({contextId:'synthetic-fixture',snipeMaximum:100000,selectedRarityIds:[4242],maxSnapshotAgeSeconds:15,rarityMappingProvenance:'synthetic',roster:{asOf:T,players:[{definitionId:'1001',rarityId:4242,name:'Synthetic Alpha'},{definitionId:'1002',rarityId:4242,name:'Synthetic Beta'},{definitionId:'1003',rarityId:4242,name:'Synthetic Gamma'},{definitionId:'1004',rarityId:4242,name:'Synthetic Delta'}]},...overrides});
const listing=(tradeId='9000001',overrides={})=>({tradeId,definitionId:'1001',rarityId:4242,playerName:'Synthetic Alpha',itemType:'player',remainingSeconds:3559,buyNowPrice:75000,currentBid:0,tradeState:'active',...overrides});
const snapshot=(records,overrides={})=>({capturedAt:T,format:'normalized',status:{success:true,httpStatus:200},sourceStage:'before-client-filter',provenance:'synthetic',criteria:{playerDefinitionIds:[]},response:{listings:records},...overrides});
const evaluate=(records,cfg={},overrides={},clock=T)=>new OfflineEvaluator(config(cfg)).evaluate(snapshot(records,overrides),clock);
test('3540/3600 inclusive boundaries and 3559s accepted; 59s and 30s rejected',()=>{
 const values=[30,59,3539,3540,3559,3600,3601];const r=evaluate(values.map((v,i)=>listing(String(9000+i),{remainingSeconds:v})));assert.deepEqual(r.records.map(x=>x.snipeEligible),[false,false,false,true,true,true,false]);assert.equal(r.liveSuccess,false);assert.equal(r.purchaseAuthorized,false);
});
test('snipe maximum is inclusive and zero BIN cannot be purchased',()=>{
 const r=evaluate([listing('1',{buyNowPrice:100000}),listing('2',{buyNowPrice:100001}),listing('3',{buyNowPrice:0})]);assert.deepEqual(r.records.map(x=>x.snipeEligible),[true,false,false]);assert.ok(r.records[1].reasons.includes('above-snipe-maximum'));
});
test('duplicates across snapshots keep first-seen timestamp and never become new again',()=>{
 const e=new OfflineEvaluator(config());const first=e.evaluate(snapshot([listing()]),T);const second=e.evaluate(snapshot([listing()],{capturedAt:LATER}),LATER);assert.equal(first.records[0].snipeEligible,true);assert.equal(second.records[0].newlyDiscovered,false);assert.equal(second.records[0].firstSeenAt,T);assert.equal(second.records[0].snipeEligible,false);
});
test('overlapping duplicate records inside one response are processed only once',()=>{
 const r=evaluate([listing(),listing()]);assert.equal(r.summary.offlineEligibleCount,1);assert.equal(r.summary.duplicateCount,1);
});
test('previously seen near-expiry/overpriced/wrong-rarity listings are not later called new',()=>{
 const e=new OfflineEvaluator(config());e.evaluate(snapshot([listing('1',{remainingSeconds:30}),listing('2',{buyNowPrice:200000}),listing('3',{rarityId:1})]),T);const r=e.evaluate(snapshot([listing('1'),listing('2'),listing('3')],{capturedAt:LATER}),LATER);assert.ok(r.records.every(x=>!x.newlyDiscovered&&!x.snipeEligible));
});
test('strict rarity ID matching; no guessed generic promo ID',()=>{
 const r=evaluate([listing('1',{rarityId:55}),listing('2',{rarityId:4242}),listing('3',{rarityId:'4242'})]);assert.deepEqual(r.records.map(x=>x.snipeEligible),[false,true,false]);
});
test('expired/closed/unknown auction states are rejected even with fresh-looking duration',()=>{
 const r=evaluate([listing('1',{remainingSeconds:0}),listing('2',{remainingSeconds:-1}),listing('3',{tradeState:'closed'}),listing('4',{tradeState:undefined})]);assert.ok(r.records.every(x=>!x.snipeEligible));
});
test('missing/malformed required market fields fail closed',()=>{
 for(const key of ['tradeId','definitionId','rarityId','itemType','remainingSeconds','buyNowPrice','currentBid','tradeState']){const item=listing();delete item[key];const r=evaluate([item]);assert.equal(r.records[0].snipeEligible,false,key)}
 for(const value of [null,'3559',NaN,Infinity])assert.equal(evaluate([listing('1',{remainingSeconds:value})]).records[0].snipeEligible,false);
});
test('millisecond durations and absolute timestamps are not guessed into seconds',()=>{
 for(const value of [3559000,Date.parse(T)])assert.equal(evaluate([listing('1',{remainingSeconds:value})]).records[0].freshWindow,false);
});
test('unsafe numeric trade IDs rejected; exact large decimal string IDs preserved',()=>{
 const r=evaluate([listing(Number.MAX_SAFE_INTEGER+1),listing('98765432101234567890')]);assert.equal(r.records[0].snipeEligible,false);assert.equal(r.records[1].tradeId,'98765432101234567890');assert.equal(r.records[1].snipeEligible,true);
});
test('unsafe/negative/string prices and bids are invalid',()=>{
 for(const price of [-1,'75000',Infinity,1.5,Number.MAX_SAFE_INTEGER+1])assert.equal(evaluate([listing('1',{buyNowPrice:price})]).records[0].snipeEligible,false);
 for(const bid of [-1,'0',null])assert.equal(evaluate([listing('1',{currentBid:bid})]).records[0].snipeEligible,false);
});
test('snapshot age reduces remaining seconds at the decision time',()=>{
 const r=evaluate([listing('1',{remainingSeconds:3545})],{}, {},LATER);assert.equal(r.records[0].remainingSeconds,3535);assert.equal(r.records[0].snipeEligible,false);
});
test('old snapshots cannot establish freshness',()=>{
 const r=evaluate([listing()],{}, {},'2026-11-01T12:00:20.000Z');assert.ok(r.records[0].reasons.includes('stale-snapshot'));assert.equal(r.records[0].snipeEligible,false);
});
test('invalid/missing/future timestamps reject the snapshot',()=>{
 for(const time of [undefined,'yesterday','2026-11-01','bad'])assert.equal(evaluate([listing()],{}, {capturedAt:time}).snapshotAccepted,false);
 assert.equal(evaluate([listing()],{}, {capturedAt:LATER},T).error,'future-capture-timestamp');
});
test('out-of-order evaluation clocks cannot reset dedup history',()=>{
 const e=new OfflineEvaluator(config());e.evaluate(snapshot([listing()],{capturedAt:LATER}),LATER);const r=e.evaluate(snapshot([listing('2')]),T);assert.equal(r.error,'non-monotonic-evaluation-clock');assert.equal(e.exportState().seen.length,1);
});
test('HTTP errors/auth/rate limiting are distinct from empty successful responses',()=>{
 for(const httpStatus of [401,403,429,500]){const r=evaluate([],{}, {status:{httpStatus}});assert.equal(r.snapshotAccepted,false);assert.equal(r.error,'http-error-'+httpStatus)}
 const empty=evaluate([]);assert.equal(empty.snapshotAccepted,true);assert.equal(empty.summary.returnedCount,0);
});
test('success=false and missing status do not become valid empty results',()=>{
 assert.equal(evaluate([],{}, {status:{httpStatus:200,success:false}}).error,'declared-service-error');assert.equal(evaluate([],{}, {status:undefined}).error,'missing-response-status');
});
test('missing/nonarray response is a parsing failure, never an empty market',()=>{
 for(const response of [{},null,{listings:null},{listings:{}}])assert.equal(evaluate([],{}, {response}).snapshotAccepted,false);
});
test('null records are rejected without throwing',()=>{assert.equal(evaluate([null]).records[0].snipeEligible,false)});
test('saved REST response adapter uses resourceId/cardsubtypeid/expires/tradeId',()=>{
 const r=evaluate([],{}, {format:'ea-rest',response:{auctionInfo:[{tradeId:'700001',itemData:{resourceId:1001,cardsubtypeid:4242,itemType:'player',name:'Synthetic REST'},expires:3559,buyNowPrice:80000,currentBid:0,tradeState:'active'}]}});assert.equal(r.records[0].snipeEligible,true);assert.equal(r.records[0].playerDefinitionId,'1001');
});
test('saved FC model adapter uses definitionId/rareflag/_auction',()=>{
 const r=evaluate([],{}, {format:'fc-model',response:{items:[{definitionId:1002,rareflag:4242,type:'player',_staticData:{name:'Synthetic Model'},_auction:{tradeId:'700002',expires:3559,buyNowPrice:80000,currentBid:0,_tradeState:'active'}}]}});assert.equal(r.records[0].snipeEligible,true);
});
test('conflicting saved auction states are rejected',()=>{
 const r=evaluate([],{}, {format:'fc-model',response:{items:[{definitionId:1002,rareflag:4242,type:'player',_auction:{tradeId:'700002',expires:3559,buyNowPrice:80000,currentBid:0,_tradeState:'closed',tradeState:'active'}}]}});assert.equal(r.records[0].snipeEligible,false);
});
test('unsorted responses are fully evaluated without ordering assumptions',()=>{
 const r=evaluate([listing('1',{remainingSeconds:4000}),listing('2',{remainingSeconds:30}),listing('3',{remainingSeconds:3559})]);assert.equal(r.summary.offlineEligibleCount,1);assert.equal(r.summary.observedOrdering,'mixed-this-snapshot');
});
test('capacity-sized responses flag possible crowding rather than complete coverage',()=>{
 const r=evaluate([listing('1'),listing('2')],{}, {observedRequestCount:2});assert.equal(r.summary.crowding,'possibly-capacity-limited');assert.equal(r.coverage.allEligiblePlayersCoveredLive,false);
});
test('no fixed 21-result page size is assumed',()=>{
 assert.equal(evaluate([listing()],{}, {observedRequestCount:1}).summary.crowding,'possibly-capacity-limited');assert.equal(evaluate([listing()],{}, {observedRequestCount:10}).summary.crowding,'below-observed-request-count-not-proof-of-completeness');assert.equal(evaluate([listing()]).summary.crowding,'unknown-request-count');
});
test('synthetic narrow cohort can expose a fresh card omitted by a capped broad response',()=>{
 const e=new OfflineEvaluator(config());const broad=e.evaluate(snapshot([listing('1',{remainingSeconds:30}),listing('2',{definitionId:'1002',remainingSeconds:29})],{observedRequestCount:2}),T);
 const narrow=e.evaluate(snapshot([listing('3',{definitionId:'1003'})],{capturedAt:LATER,observedRequestCount:2,criteria:{playerDefinitionIds:['1003']}}),LATER);
 assert.equal(broad.summary.offlineEligibleCount,0);assert.equal(broad.summary.crowding,'possibly-capacity-limited');assert.equal(narrow.summary.offlineEligibleCount,1);assert.equal(narrow.liveSuccess,false);
});
test('roster partitions cover every provided card once, including the final short group',()=>{
 const cards=config().roster.players;const r=planRosterGroups(cards,3);assert.equal(r.groups.length,2);assert.deepEqual(r.groups.flatMap(g=>g.cards.map(c=>c.definitionId)),['1001','1002','1003','1004']);assert.equal(r.completeLivePlayerCoverage,false);assert.ok(r.groups.every(g=>!g.executableRequest));
});
test('declared cohort query coverage and observed coverage are separate',()=>{
 const r=evaluate([listing()],{}, {criteria:{playerDefinitionIds:['1001','1002']}});assert.equal(r.coverage.queriedRosterCount,2);assert.equal(r.coverage.observedRosterCount,1);assert.equal(r.coverage.providedRosterCount,4);
});
test('broad search does not silently count all roster players as returned',()=>{
 const r=evaluate([listing()]);assert.equal(r.coverage.queriedRosterCount,0);assert.equal(r.coverage.observedRosterCount,1);assert.equal(r.coverage.allEligiblePlayersCoveredLive,false);
});
test('fresh selected-rarity card outside an incomplete roster remains visible in broad scope',()=>{
 const r=evaluate([listing('1',{definitionId:'9999'})]);assert.equal(r.records[0].snipeEligible,true);assert.equal(r.coverage.observedCardsOutsideRoster,1);assert.ok(r.records[0].warnings.includes('outside-provided-roster-broad-scope-retained'));
});
test('an explicit offline cohort scope rejects a result for a different player',()=>{
 const r=evaluate([listing('1',{definitionId:'1002'})],{}, {criteria:{playerDefinitionIds:['1001']}});assert.equal(r.records[0].snipeEligible,false);
});
test('duplicate roster entries and invalid group sizes are rejected',()=>{
 const cards=config().roster.players;assert.throws(()=>planRosterGroups([cards[0],cards[0]],2));for(const size of [0,-1,1.5,Infinity])assert.throws(()=>planRosterGroups(cards,size));
});
test('price proposal puts snipe maximum into maxBuy without issuing a request',()=>{
 const input={type:'player',rarities:[4242],defId:[],minBuy:0,league:13};const r=proposePriceConstrainedCriteria(input,100000);assert.equal(r.criteria.maxBuy,100000);assert.equal(r.criteria.league,13);assert.equal(input.maxBuy,undefined);assert.equal(r.executableRequest,false);
});
test('price proposal never broadens an existing tighter maximum or drops a minimum',()=>{
 const r=proposePriceConstrainedCriteria({type:'player',rarities:[4242],maxBuy:75000,minBuy:50000},100000);assert.equal(r.criteria.maxBuy,75000);assert.equal(r.criteria.minBuy,50000);
});
test('empty price intersection and invalid maxima are explicit errors',()=>{
 assert.throws(()=>proposePriceConstrainedCriteria({type:'player',rarities:[4242],minBuy:150000},100000));for(const value of [0,-1,'100000',NaN])assert.throws(()=>proposePriceConstrainedCriteria({type:'player',rarities:[4242]},value));
});
test('existing player-specific search restriction is preserved but warns about coverage',()=>{
 const r=proposePriceConstrainedCriteria({type:'player',rarities:[4242],defId:[1001]},100000);assert.deepEqual(r.criteria.defId,[1001]);assert.equal(r.coverageWarnings.length,1);
});
test('plain-data proposal never invokes getters or custom serialization',()=>{
 let called=false;const input={type:'player',rarities:[4242],get maxBuy(){called=true;return 100000}};assert.throws(()=>proposePriceConstrainedCriteria(input,100000));assert.equal(called,false);
 assert.throws(()=>proposePriceConstrainedCriteria({type:'player',rarities:[4242],toJSON(){called=true}},100000));assert.equal(called,false);
});
test('seen-state export/import preserves deduplication across offline runs',()=>{
 const first=new OfflineEvaluator(config());first.evaluate(snapshot([listing()]),T);const next=new OfflineEvaluator(config(),first.exportState());const r=next.evaluate(snapshot([listing()],{capturedAt:LATER}),LATER);assert.equal(r.records[0].newlyDiscovered,false);assert.equal(r.records[0].snipeEligible,false);
});
test('wrong-context and malformed seen state are rejected',()=>{
 const e=new OfflineEvaluator(config());const state=e.exportState();state.contextId='different-market';assert.throws(()=>new OfflineEvaluator(config(),state));assert.throws(()=>new OfflineEvaluator(config(),{schemaVersion:1,contextId:'synthetic-fixture',seen:[{tradeId:Number.MAX_SAFE_INTEGER+1,firstSeenAt:T,definitionId:null}]}));
});
test('dedup capacity halts instead of forgetting old listings and calling them new',()=>{
 const e=new OfflineEvaluator(config({maxSeenTradeIds:1}));const r=e.evaluate(snapshot([listing('1'),listing('2')]),T);assert.equal(r.summary.offlineEligibleCount,1);assert.equal(r.records[1].snipeEligible,false);assert.equal(r.records[1].newlyDiscovered,false);assert.equal(e.exportState().seen.length,1);assert.equal(e.evaluate(snapshot([listing('1')]),T).error,'dedup-capacity-reached-evaluator-halted');
});
test('same trade ID changing player identity is rejected',()=>{
 const e=new OfflineEvaluator(config());e.evaluate(snapshot([listing()]),T);const r=e.evaluate(snapshot([listing('9000001',{definitionId:'1002'})],{capturedAt:LATER}),LATER);assert.ok(r.records[0].reasons.includes('trade-identity-conflict'));
});
test('auth/cookie/unknown response fields never enter output or exported state',()=>{
 const input=snapshot([listing('1',{authorization:'SECRET_A',cookie:'SECRET_B'})]);input.response.secret='SECRET_C';input.status.rawHeaders={token:'SECRET_D'};const e=new OfflineEvaluator(config());const output=JSON.stringify({result:e.evaluate(input,T),state:e.exportState()});assert.ok(!/SECRET_|authorization|cookie|rawHeaders/.test(output));
});
test('names are optional display metadata, control characters cannot forge log rows',()=>{
 const r=evaluate([listing('1',{playerName:'Synthetic\nInjected\rName'}),listing('2',{playerName:undefined})]);assert.ok(!r.records[0].playerName.includes('\n'));assert.match(r.records[1].playerName,/Unnamed player/);assert.equal(r.summary.offlineEligibleCount,2);
});
test('no test result can authorize buying or claim listing creation time',()=>{
 const r=evaluate([listing()]);assert.equal(r.purchaseAuthorized,false);assert.equal(r.liveSuccess,false);assert.equal(r.records[0].originalSafetyPending,true);assert.equal(r.records[0].listedAtProof,'unavailable-first-seen-is-not-listing-birth-time');
});
test('configuration requires positive maximum, explicit rarity selection and valid scope',()=>{
 for(const overrides of [{snipeMaximum:0},{selectedRarityIds:[]},{selectedRarityIds:['4242']},{contextId:''},{maxSeenTradeIds:0}])assert.throws(()=>new OfflineEvaluator(config(overrides)));
});
test('network and purchase functions are never used by the offline evaluator',()=>{
 const old=globalThis.fetch;globalThis.fetch=()=>{throw Error('network forbidden')};try{const r=evaluate([listing()]);assert.equal(r.records[0].snipeEligible,true)}finally{globalThis.fetch=old}
});
test('invalid calendar dates and rollover clocks are rejected instead of normalized',()=>{
 for(const time of ['2026-02-30T12:00:00.000Z','2026-11-01T24:00:00.000Z','2026-11-01T12:00:00+15:00'])assert.equal(evaluate([listing()],{}, {capturedAt:time}).snapshotAccepted,false);
});
