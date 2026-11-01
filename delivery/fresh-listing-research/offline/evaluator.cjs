'use strict';
// OFFLINE ONLY. No network, browser-service, purchase, bid, or scheduling dependency.
class InputError extends Error { constructor(code){super(code);this.code=code;} }
const own=(o,k)=>o!=null&&Object.prototype.hasOwnProperty.call(o,k);
const object=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
const coin=n=>Number.isSafeInteger(n)&&n>=0;
const positive=n=>coin(n)&&n>0;
const text=(value,fallback)=>typeof value==='string'&&value.trim()?value.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,128):fallback;
function identifier(value){
 if(typeof value==='number')return Number.isSafeInteger(value)&&value>0?String(value):null;
 if(typeof value==='string'&&/^[1-9]\d{0,39}$/.test(value))return value;
 return null;
}
function instant(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value))return null;
 const match=value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/);
 if(!match)return null;
 const [year,month,day,hour,minute,second]=match.slice(1,7).map(Number),leap=year%4===0&&(year%100!==0||year%400===0),days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
 if(month<1||month>12||day<1||day>days[month-1]||hour>23||minute>59||second>59)return null;
 if(match[7]!=='Z'){const[zoneHour,zoneMinute]=match[7].slice(1).split(':').map(Number);if(zoneHour>14||zoneMinute>59||zoneHour===14&&zoneMinute!==0)return null}
 const time=Date.parse(value);return Number.isFinite(time)?time:null;
}
const pairKey=(id,rarity)=>id+'|'+rarity;
function validateConfig(input){
 if(!object(input))throw new InputError('configuration-required');
 if(typeof input.contextId!=='string'||!/^[A-Za-z0-9_.-]{1,80}$/.test(input.contextId))throw new InputError('invalid-context-id');
 if(!positive(input.snipeMaximum))throw new InputError('positive-integer-snipe-maximum-required');
 if(!Array.isArray(input.selectedRarityIds)||!input.selectedRarityIds.length||input.selectedRarityIds.some(n=>!coin(n)))throw new InputError('explicit-numeric-rarity-ids-required');
 const rarities=[...new Set(input.selectedRarityIds)],maxAge=input.maxSnapshotAgeSeconds??15,maxSeen=input.maxSeenTradeIds??50000;
 if(!Number.isFinite(maxAge)||maxAge<=0||maxAge>3600)throw new InputError('invalid-snapshot-age-limit');
 if(!positive(maxSeen)||maxSeen>1000000)throw new InputError('invalid-dedup-capacity');
 let roster=[];
 if(input.roster!==undefined){
  if(!object(input.roster)||!Array.isArray(input.roster.players)||instant(input.roster.asOf)===null)throw new InputError('invalid-roster');
  const keys=new Set();
  roster=input.roster.players.map(p=>{
   if(!object(p))throw new InputError('invalid-roster-player');
   const id=identifier(p.definitionId);if(!id||!coin(p.rarityId)||!rarities.includes(p.rarityId))throw new InputError('invalid-roster-player');
   const key=pairKey(id,p.rarityId);if(keys.has(key))throw new InputError('duplicate-roster-card');keys.add(key);
   return {definitionId:id,rarityId:p.rarityId,name:text(p.name,'Unnamed roster card')};
  });
 }
 return {contextId:input.contextId,snipeMaximum:input.snipeMaximum,selectedRarityIds:rarities,maxSnapshotAgeSeconds:maxAge,maxSeenTradeIds:maxSeen,roster,rosterAsOf:input.roster?.asOf??null,rosterCompleteness:'not-independently-verified',rarityMappingProvenance:input.rarityMappingProvenance==='synthetic'?'synthetic-not-a-real-promo-id':'user-supplied-not-independently-verified'};
}
function normalize(record,format){
 if(!object(record))return {invalidRecord:true};
 if(format==='ea-rest'){
  const item=object(record.itemData)?record.itemData:{};
  return {tradeId:record.tradeId,definitionId:item.resourceId,rarityId:item.cardsubtypeid,playerName:item.name,itemType:item.itemType,remainingSeconds:record.expires,buyNowPrice:record.buyNowPrice,currentBid:record.currentBid,tradeState:record.tradeState};
 }
 if(format==='fc-model'){
  const auction=object(record._auction)?record._auction:{};
  const conflict=own(auction,'tradeState')&&own(auction,'_tradeState')&&auction.tradeState!==auction._tradeState;
  return {tradeId:auction.tradeId,definitionId:record.definitionId,rarityId:record.rareflag,playerName:record.name??record._staticData?.name,itemType:record.type,remainingSeconds:auction.expires,buyNowPrice:auction.buyNowPrice,currentBid:auction.currentBid,tradeState:conflict?'conflicting':auction.tradeState??auction._tradeState};
 }
 return {tradeId:record.tradeId,definitionId:record.definitionId,rarityId:record.rarityId,playerName:record.playerName,itemType:record.itemType,remainingSeconds:record.remainingSeconds,buyNowPrice:record.buyNowPrice,currentBid:record.currentBid,tradeState:record.tradeState};
}
function extract(snapshot){
 if(!['normalized','ea-rest','fc-model'].includes(snapshot.format))throw new InputError('explicit-response-format-required');
 if(!object(snapshot.response))throw new InputError('response-object-required');
 const key=snapshot.format==='ea-rest'?'auctionInfo':snapshot.format==='fc-model'?'items':'listings';
 const items=snapshot.response[key];if(!Array.isArray(items))throw new InputError('malformed-response-array');
 if(items.length>10000)throw new InputError('snapshot-record-limit-exceeded');
 return items;
}
function requestState(snapshot){
 const status=snapshot.status;if(!object(status))return 'missing-response-status';
 if(status.success===false)return 'declared-service-error';
 if(status.httpStatus!==undefined&&status.httpStatus!==null){
  if(!Number.isInteger(status.httpStatus))return 'invalid-http-status';
  if(status.httpStatus<200||status.httpStatus>=300)return 'http-error-'+(status.httpStatus>=100&&status.httpStatus<=599?status.httpStatus:'invalid');
 }else if(status.success!==true)return 'unverified-response-status';
 return null;
}
function planRosterGroups(roster,groupSize){
 if(!Array.isArray(roster)||!positive(groupSize)||groupSize>1000)throw new InputError('invalid-roster-group-size');
 const seen=new Set();const cards=roster.map(card=>{
  const id=identifier(card?.definitionId);if(!id||!coin(card?.rarityId))throw new InputError('invalid-roster-player');
  const key=pairKey(id,card.rarityId);if(seen.has(key))throw new InputError('duplicate-roster-card');seen.add(key);
  return {definitionId:id,rarityId:card.rarityId};
 });
 const groups=[];for(let i=0;i<cards.length;i+=groupSize)groups.push({groupId:'offline-cohort-'+(groups.length+1),cards:cards.slice(i,i+groupSize),nativeMultiIdQuerySupport:'unverified',executableRequest:false});
 return {groups,plannedCardCount:cards.length,coversProvidedRoster:groups.reduce((sum,g)=>sum+g.cards.length,0)===cards.length,completeLivePlayerCoverage:false,note:'Partitions only the supplied roster; no native multi-ID request is generated or executed.'};
}
function copyPlainJSON(value,seen=new Set(),depth=0){
 if(depth>50)throw new InputError('plain-json-criteria-required');
 if(value===null||typeof value==='string'||typeof value==='boolean')return value;
 if(typeof value==='number'&&Number.isFinite(value))return value;
 if(typeof value!=='object'||seen.has(value))throw new InputError('plain-json-criteria-required');
 const proto=Object.getPrototypeOf(value);if(proto!==Object.prototype&&proto!==Array.prototype&&proto!==null)throw new InputError('plain-json-criteria-required');
 seen.add(value);const copy=Array.isArray(value)?[]:{};
 for(const[key,descriptor]of Object.entries(Object.getOwnPropertyDescriptors(value))){
  if(key==='length'&&Array.isArray(value))continue;
  if(descriptor.get||descriptor.set||!own(descriptor,'value'))throw new InputError('plain-json-criteria-required');
  const child=copyPlainJSON(descriptor.value,seen,depth+1);Object.defineProperty(copy,key,{value:child,writable:true,enumerable:true,configurable:true});
 }
 seen.delete(value);return copy;
}
function proposePriceConstrainedCriteria(criteria,snipeMaximum){
 criteria=copyPlainJSON(criteria);
 if(!object(criteria)||criteria.type!=='player')throw new InputError('player-search-criteria-required');
 if(!positive(snipeMaximum))throw new InputError('positive-integer-snipe-maximum-required');
 if(!Array.isArray(criteria.rarities)||!criteria.rarities.length||criteria.rarities.some(n=>!coin(n)))throw new InputError('explicit-numeric-rarity-ids-required');
 const previous=criteria.maxBuy;
 if(previous!==undefined&&previous!==null&&previous!==0&&!positive(previous))throw new InputError('invalid-existing-search-maximum');
 const minimum=criteria.minBuy??0;if(!coin(minimum))throw new InputError('invalid-existing-search-minimum');
 const maximum=positive(previous)?Math.min(previous,snipeMaximum):snipeMaximum;
 if(minimum>maximum)throw new InputError('empty-price-intersection');
 // Copy only plain JSON data; reject non-JSON input rather than calling custom getters or methods.
 const copy=criteria;
 copy.maxBuy=maximum;
 return {criteria:copy,coverageWarnings:(Array.isArray(copy.defId)&&copy.defId.length||positive(copy.maskedDefId))?['existing-player-filter-restricts-broad-coverage']:[],executableRequest:false,appliedToLiveSearch:false,notes:['Intersect existing search maximum with snipe maximum; do not broaden a tighter user filter.','Research proposal only: no service called; UI/DTO-to-wire mapping requires permitted validation.']};
}
class OfflineEvaluator{
 constructor(config,state){
  this.config=validateConfig(config);this.seen=new Map();this.lastEvaluation=null;this.halted=false;this.observedRoster=new Set();this.queriedRoster=new Set();this.unknownRoster=new Set();this.rosterKeys=new Set(this.config.roster.map(p=>pairKey(p.definitionId,p.rarityId)));
  if(state!==undefined){
   if(!object(state)||state.schemaVersion!==1||state.contextId!==this.config.contextId||!Array.isArray(state.seen)||state.seen.length>this.config.maxSeenTradeIds)throw new InputError('invalid-or-mismatched-dedup-state');
   for(const row of state.seen){
    const id=identifier(row?.tradeId),at=instant(row?.firstSeenAt);
    if(!id||at===null||this.seen.has(id)||row.definitionId!==null&&!identifier(row.definitionId))throw new InputError('invalid-dedup-entry');
    this.seen.set(id,{firstSeenAt:new Date(at).toISOString(),definitionId:row.definitionId});
   }
   if(state.lastEvaluationAt!==null&&state.lastEvaluationAt!==undefined){const at=instant(state.lastEvaluationAt);if(at===null)throw new InputError('invalid-state-clock');this.lastEvaluation=at}
   this.halted=state.halted===true;
  }
 }
 evaluate(snapshot,evaluationAt){
  const base={mode:'offline-evaluation',liveSuccess:false,purchaseAuthorized:false,safetyChecks:'original-price-profit-balance-purchase-middleware-not-executed',contextId:this.config.contextId,records:[],snapshotAccepted:false,coverage:this.coverage()};
  if(this.halted)return {...base,error:'dedup-capacity-reached-evaluator-halted'};
  if(!object(snapshot))return {...base,error:'snapshot-object-required'};
  const now=instant(evaluationAt),captured=instant(snapshot.capturedAt);
  if(now===null||captured===null)return {...base,error:'valid-capture-and-evaluation-timestamps-required'};
  if(captured>now)return {...base,error:'future-capture-timestamp'};
  if(this.lastEvaluation!==null&&now<this.lastEvaluation)return {...base,error:'non-monotonic-evaluation-clock'};
  if([...this.seen.values()].some(row=>instant(row.firstSeenAt)>now))return {...base,error:'dedup-state-from-future'};
  const statusError=requestState(snapshot);if(statusError)return {...base,error:statusError};
  let items;try{items=extract(snapshot)}catch(error){return {...base,error:error.code||'malformed-response'}};
  const age=(now-captured)/1000,stale=age>this.config.maxSnapshotAgeSeconds;
  const criteria=object(snapshot.criteria)?snapshot.criteria:{};
  const scope=criteria.playerDefinitionIds;
  if(scope!==undefined&&(!Array.isArray(scope)||scope.some(id=>!identifier(id))))return {...base,error:'invalid-offline-player-scope'};
  const selectedScope=new Set((scope||[]).map(identifier));
  // Query intent, not proof of search execution or complete returned results.
  if(!stale&&selectedScope.size)for(const card of this.config.roster)if(selectedScope.has(card.definitionId))this.queriedRoster.add(pairKey(card.definitionId,card.rarityId));
  const requestedCount=positive(snapshot.observedRequestCount)?snapshot.observedRequestCount:null;
  const crowding=requestedCount===null?'unknown-request-count':items.length>=requestedCount?'possibly-capacity-limited':'below-observed-request-count-not-proof-of-completeness';
  let duplicates=0,eligible=0;const observedTimes=[];
  for(const raw of items){
   const item=normalize(raw,snapshot.format),id=identifier(item.tradeId),definition=identifier(item.definitionId),reasons=[],warnings=[];
   const prior=id?this.seen.get(id):undefined;
   if(!id)reasons.push('missing-or-invalid-trade-id');
   if(!definition)reasons.push('missing-or-invalid-player-definition-id');
   if(item.itemType!=='player')reasons.push('not-confirmed-player-item');
   if(!coin(item.rarityId))reasons.push('missing-or-invalid-rarity');
   else if(!this.config.selectedRarityIds.includes(item.rarityId))reasons.push('rarity-not-selected');
   const validTime=typeof item.remainingSeconds==='number'&&Number.isFinite(item.remainingSeconds);
   const remaining=validTime?item.remainingSeconds-age:null;
   if(!validTime)reasons.push('missing-or-invalid-remaining-seconds');
   else{
    observedTimes.push(remaining);
    if(remaining<=0)reasons.push('expired');
    else if(remaining<3540||remaining>3600)reasons.push('outside-3540-3600-second-window');
   }
   if(item.tradeState!=='active')reasons.push('auction-not-active');
   if(!positive(item.buyNowPrice))reasons.push('missing-or-invalid-buy-now-price');
   else if(item.buyNowPrice>this.config.snipeMaximum)reasons.push('above-snipe-maximum');
   if(!coin(item.currentBid))reasons.push('missing-or-invalid-current-bid');
   if(stale)reasons.push('stale-snapshot');
   if(definition&&selectedScope.size&&!selectedScope.has(definition))reasons.push('outside-declared-offline-player-scope');
   const cardKey=definition&&coin(item.rarityId)?pairKey(definition,item.rarityId):null;
   if(cardKey&&item.itemType==='player'&&this.config.selectedRarityIds.includes(item.rarityId)){
    if(this.rosterKeys.has(cardKey)){this.observedRoster.add(cardKey)}else{this.unknownRoster.add(cardKey);warnings.push('outside-provided-roster-broad-scope-retained')}
   }
   if(prior){duplicates++;reasons.push('trade-already-seen');if(prior.definitionId&&definition&&prior.definitionId!==definition)reasons.push('trade-identity-conflict')}
   let newlyDiscovered=Boolean(id&&!prior);
   let firstSeenAt=prior?.firstSeenAt??(id?new Date(captured).toISOString():null);
   if(newlyDiscovered){
    if(this.seen.size>=this.config.maxSeenTradeIds){reasons.push('dedup-capacity-reached');this.halted=true;firstSeenAt=null;newlyDiscovered=false}
    else this.seen.set(id,{firstSeenAt,definitionId:definition});
   }
   if(this.halted&&!reasons.includes('dedup-capacity-reached'))reasons.push('dedup-capacity-reached');
   const snipeEligible=reasons.length===0;
   if(snipeEligible)eligible++;
   base.records.push({playerName:text(item.playerName,definition?'Unnamed player '+definition:'Unnamed player'),tradeId:id,playerDefinitionId:definition,rarityId:coin(item.rarityId)?item.rarityId:null,buyNowPrice:coin(item.buyNowPrice)?item.buyNowPrice:null,currentBid:coin(item.currentBid)?item.currentBid:null,observedRemainingSeconds:validTime?item.remainingSeconds:null,remainingSeconds:remaining,firstSeenAt,newlyDiscovered,snipeMaximum:this.config.snipeMaximum,meetsSnipePrice:positive(item.buyNowPrice)&&item.buyNowPrice<=this.config.snipeMaximum,freshWindow:validTime&&remaining>=3540&&remaining<=3600,snipeEligible,eligibilityScope:'offline-freshness-rarity-state-identity-price-only',purchaseAuthorized:false,originalSafetyPending:true,reasons:snipeEligible?['first-seen-in-window-and-within-snipe-ceiling-logging-only']:reasons,warnings,listedAtProof:'unavailable-first-seen-is-not-listing-birth-time'});
  }
  this.lastEvaluation=now;
  let ordering='insufficient-data';if(observedTimes.length>1){const ascending=observedTimes.every((v,i)=>i===0||v>=observedTimes[i-1]),descending=observedTimes.every((v,i)=>i===0||v<=observedTimes[i-1]);ordering=ascending&&descending?'equal':ascending?'nondecreasing-this-snapshot-only':descending?'nonincreasing-this-snapshot-only':'mixed-this-snapshot'}
  return {...base,snapshotAccepted:true,error:this.halted?'dedup-capacity-reached':null,capturedAt:new Date(captured).toISOString(),evaluatedAt:new Date(now).toISOString(),sourceStage:['before-client-filter','after-client-filter'].includes(snapshot.sourceStage)?snapshot.sourceStage:'unknown',declaredProvenance:snapshot.provenance==='synthetic'?'synthetic':'saved-not-independently-authenticated',snapshotAgeSeconds:age,summary:{returnedCount:items.length,observedRequestCount:requestedCount,crowding,duplicateCount:duplicates,newTradeCount:base.records.filter(r=>r.newlyDiscovered).length,offlineEligibleCount:eligible,minRemainingSeconds:observedTimes.length?Math.min(...observedTimes):null,maxRemainingSeconds:observedTimes.length?Math.max(...observedTimes):null,observedOrdering:ordering,marketCoverage:'unknown-no-ordering-or-completeness-guarantee'},coverage:this.coverage()};
 }
 coverage(){return {providedRosterCount:this.config.roster.length,queriedRosterCount:this.queriedRoster.size,observedRosterCount:this.observedRoster.size,observedCardsOutsideRoster:this.unknownRoster.size,rosterAsOf:this.config.rosterAsOf,rosterCompleteness:this.config.rosterCompleteness,allEligiblePlayersCoveredLive:false,note:'Query intent, observed cards and complete market coverage are different. Broad empty-player scope does not prove all players were returned.'}}
 exportState(){return {schemaVersion:1,contextId:this.config.contextId,lastEvaluationAt:this.lastEvaluation===null?null:new Date(this.lastEvaluation).toISOString(),halted:this.halted,seen:[...this.seen].map(([tradeId,row])=>({tradeId,...row}))}}
}
module.exports={OfflineEvaluator,InputError,validateConfig,planRosterGroups,proposePriceConstrainedCriteria};
