'use strict';
// Production factory 99011. Runs on the existing Trader timer, never a new timer.
module.exports=function(module,exports,require){
 const legacy=require(99007),{PriceScopePlanner}=require(99009),{ScopePager}=require(99013),purchase=require(99012);
 const sessions=new WeakMap();Object.assign(exports,legacy);
 let observedProcessor=null;
 exports.controllerChanged=(processor,previous,next)=>{observedProcessor=processor;return legacy.controllerChanged(processor,previous,next)};
 if(typeof globalThis!=='undefined')globalThis[Symbol.for('fcEnhancer.v8.validation')]=Object.freeze({inspect:()=>{
  const p=observedProcessor,c=p?.controllerInstance?.viewmodel?.searchCriteria,s=p?.traderSettings;
  return{running:p?.isStarted===true,criteria:c?{type:c.type,rarities:c.rarities,defId:c.defId,maskedDefId:c.maskedDefId,minBuy:c.minBuy,maxBuy:c.maxBuy}:null,filter:p?{current:p.traderData.cache.filter.currentFilter,selected:p.traderData.cache.filter.selectedFilters}:null,maximum:s?.searchSetting?.v8SnipeMaximum,autoFind:s?.searchSetting?.autoFindNewest,nativeBuyMaximum:s?.buySetting?.buyPrice,realPurchasingEnabled:false,planner:p?sessions.get(p.traderData)?.planner.diagnostics():null};
 }});
 const positive=n=>Number.isSafeInteger(n)&&n>0;
 const escape=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().filter(k=>typeof v[k]!=='function').map(k=>[k,canonical(v[k])])):v;
 const key=(criteria,settings)=>JSON.stringify(canonical({criteria:legacy.semantic?legacy.semantic(criteria):criteria,maximum:settings.searchSetting.v8SnipeMaximum,buy:settings.buySetting}));
 const effective=criteria=>{
  const copy=Object.assign(Object.create(Object.getPrototypeOf(criteria)),structuredClone(Object.fromEntries(Object.entries(criteria).filter(([,v])=>typeof v!=='function'))));
  const enhancer=require(32024).InMemoryStore.instance.get('enhancerSettings');
  if(copy.defId?.length===0&&copy.rarities?.length===0&&enhancer.multiRarities?.size)copy.rarities=[...enhancer.multiRarities];
  return copy;
 };
 exports.endRun=(processor,source)=>{const session=sessions.get(processor.traderData);session?.planner.stop();sessions.delete(processor.traderData);legacy.endRun(processor,source)};
 exports.filterRotationDecision=(data,settings)=>settings.searchSetting.autoFindNewest?'retain':legacy.filterRotationDecision(data,settings);
 exports.run=async(processor,criteria,orchestrator,log)=>{
  const settings=processor.traderSettings,cfg=settings.searchSetting,data=processor.traderData;
  if(!cfg.autoFindNewest)return legacy.run(processor,criteria,orchestrator,log);
  let session=sessions.get(data);
  const fail=reason=>{if(session&&sessions.get(data)!==session)return{items:[]};exports.endRun(processor,'v8-stop');log('[v8] state=STOPPED reason='+escape(reason)+' buying=DISABLED');return{items:[],stop:true}};
  if(session?.inFlight)return{items:[]};
  try{
   if(typeof window!=='undefined'){
    const guard=globalThis[Symbol.for('fcEnhancer.v8.executionGuard')];
    if(typeof services==='undefined'||!guard?.installServices(services.Item,typeof UTItemService!=='undefined'?UTItemService.prototype:null))return fail('native-purchase-interlock-unavailable');
   }
   if(!positive(cfg.v8SnipeMaximum))return fail('positive-v8-snipe-maximum-required');
   if(settings.buySetting?.buyPrice!=null&&settings.buySetting.buyPrice!==0&&!positive(settings.buySetting.buyPrice))return fail('invalid-native-buy-maximum');
   if(cfg.filterRating)return fail('individual-player-rating-rotation-incompatible');
   const current=effective(criteria),identity=key(current,settings);
   if(!session||session.identity!==identity){
    session?.planner.stop();const helpers=require(27988);
    const nativeMaximum=positive(settings.buySetting?.buyPrice)?Math.min(settings.buySetting.buyPrice,cfg.v8SnipeMaximum):cfg.v8SnipeMaximum;
    const roundDown=typeof helpers.roundToNearestStep==='function'&&typeof helpers.getBeforeStepValue==='function'?value=>{const rounded=helpers.roundToNearestStep(value);return rounded>value?helpers.getBeforeStepValue(rounded):rounded}:null;
    const planner=new PriceScopePlanner({criteria:current,snipeMaximum:nativeMaximum,verifiedRarityIds:current.rarities,roundDown,previousStep:helpers.getBeforeStepValue,nextStep:helpers.getNextStepValue,probeUpperBoundary:true});
    session={identity,planner,seen:new Set(),pages:new Map(),inFlight:false};sessions.set(data,session);
    log('[v8] state=DISCOVERY rarityIds='+current.rarities.join(',')+' raritySource=native-selected-filter allPlayerIntent=true maxBuy='+planner.effectiveMaximum+' coverageComplete=false buying=DISABLED');
   }
   const intent=session.planner.next(session.continuationScope??null);if(!intent||intent.kind==='idle')return{items:[]};session.continuationScope=null;
   const request=intent.criteria,expected=JSON.stringify(canonical(legacy.semantic?legacy.semantic(request):request)),scopeKey=intent.scope.minBuy+'|'+intent.scope.maxBuy;
   if(!session.pages.has(scopeKey))session.pages.set(scopeKey,new ScopePager(intent.scope.id===session.planner.root.id?2:20));
   const pager=session.pages.get(scopeKey),page=pager.page;
   legacy.markFresh(request);data.cache.nextPageNumber=page;session.inFlight=true;const token=processor.cancellationToken;
   const items=await orchestrator.searchMarket(request,page);
   const ended=()=>!processor.isStarted||token?.isCancelled||processor.cancellationToken!==token||sessions.get(data)!==session;
   const discard=()=>{if(sessions.get(data)===session)session.planner.observe({intentId:intent.id,acceptedScope:false});return{items:[]}};
   const changed=()=>session.identity!==key(effective(processor.controllerInstance?.viewmodel.searchCriteria||criteria),settings);
   if(ended())return discard();if(changed())return fail('search-context-changed');
   const diagnostics=legacy.getDiagnostics(request);
   if(page>1&&diagnostics?.kind==='service-error'&&[400,416].includes(diagnostics.status)){pager.reject();session.planner.observe({intentId:intent.id,acceptedScope:false});log('[v8] page='+page+' nativePageAccess=unavailable http='+diagnostics.status+' buying=DISABLED');return{items:[]};}
   if(diagnostics?.kind!=='success'||!Array.isArray(items))return fail(diagnostics?.kind||'missing-native-response');
   if(expected!==JSON.stringify(canonical(legacy.semantic?legacy.semantic(request):request)))return fail('native-search-filter-mutated');
   const wire=legacy.wire(request),capacity=wire.fields?.num??wire.fields?.count,scope=session.planner.scopes.get(intent.scope.id);
   const ids=items.map(item=>item?.getAuctionData?.()?.tradeId);
   if(ids.some(id=>typeof id!=='string'||!/^\d+$/.test(id)))return fail('exact-trade-id-unavailable');
   if(!pager.accept({wire,ids,canSplit:false})){session.planner.observe({intentId:intent.id,acceptedScope:false});log('[v8] page='+page+' nativePageAccess=unverified responseDiscarded=true buying=DISABLED');return{items:[]};}
   const enhancer=require(32024).InMemoryStore.instance.get('enhancerSettings'),allowed=legacy.getAllowed(request);
   const filtered=require(71446).filterResult(allowed?items.filter(item=>allowed.includes(item)):items.slice(),enhancer);
   const filteredSet=new Set(filtered);let freshCount=0,newFreshCount=0,newTradeCount=0,priceEligible=0;
   for(const item of items){
    if(ended())return discard();if(changed())return fail('search-context-changed');
    const auction=item?.getAuctionData?.(),id=auction?.tradeId;
    if(typeof id!=='string'||!/^\d+$/.test(id))return fail('exact-trade-id-unavailable');
    if(session.seen.has(id))continue;
    if(session.seen.size>=50000)return fail('dedup-capacity-reached');session.seen.add(id);newTradeCount++;
    const seconds=auction.expires,price=auction.buyNowPrice,rarity=item.rareflag;
    if(typeof seconds!=='number'||!Number.isFinite(seconds)||seconds<3540||seconds>3600||!currentRarities(session).includes(rarity)||!filteredSet.has(item))continue;
    freshCount++;newFreshCount++;
    const withinScope=positive(price)&&price<=intent.criteria.maxBuy&&price>=intent.criteria.minBuy&&price<=cfg.v8SnipeMaximum;
    if(!withinScope){log('[v8 candidate] tradeId='+id+' price='+escape(price)+' priceEligible=false buying=DISABLED');continue;}
    priceEligible++;
    const preview=await purchase.preview(item,{maximum:Math.min(cfg.v8SnipeMaximum,intent.criteria.maxBuy),processor});
    if(ended())return discard();if(changed())return fail('search-context-changed');
    const execution=preview.response===true?await purchase.execute(item,{maximum:Math.min(cfg.v8SnipeMaximum,intent.criteria.maxBuy),processor,orchestrator}):null;
    if(ended())return discard();if(changed())return fail('search-context-changed');
    log('[v8 candidate] Player: '+escape(item.getStaticData?.()?.name??'Unnamed player')+' tradeId='+id+' buyNow='+price+' remaining='+seconds+' newlyDiscovered=true listingBirthProven=false priceEligible=true nativeSafety='+escape(preview.response===true?'pass':preview.reason||'reject')+' purchaseAuthorized='+(execution?.purchaseAuthorized===true)+' buying='+(execution?.purchaseAuthorized===true?'ENABLED':'DISABLED'));
   }
   session.planner.observe({intentId:intent.id,acceptedScope:true,rawCount:items.length,freshCount,newFreshCount,newPageObserved:page>1&&newTradeCount>0,observedRequestCount:capacity,countProvenance:['xhr','fetch'].includes(wire.transport)&&wire.status>=200&&wire.status<300?'wire':'unknown'});
   if(pager.page>page&&(scope.leaf||scope.id===session.planner.root.id))session.continuationScope=intent.scope.id;
   const durations=items.map(item=>item?.getAuctionData?.()?.expires).filter(Number.isFinite),prices=items.map(item=>item?.getAuctionData?.()?.buyNowPrice).filter(Number.isFinite);
   log('[v8] state=DISCOVERY page='+page+' offset='+wire.offset+' count='+items.length+' minBuy='+intent.criteria.minBuy+' maxBuy='+intent.criteria.maxBuy+' minSec='+(durations.length?Math.min(...durations):'unknown')+' maxSec='+(durations.length?Math.max(...durations):'unknown')+' minPrice='+(prices.length?Math.min(...prices):'unknown')+' maxPrice='+(prices.length?Math.max(...prices):'unknown')+' observedCount='+(capacity??'unknown')+' http='+wire.status+' freshCandidates='+freshCount+' priceEligible='+priceEligible+' scopes='+session.planner.diagnostics().scopeCount+' pageEvidence='+pager.reason+' coverageComplete=false buying=DISABLED');
   return {items:[],diagnostics:session.planner.diagnostics()};
  }catch(error){return fail(error.code||error.message||'native-discovery-error')}
  finally{if(session)session.inFlight=false;}
 };
 const currentRarities=session=>session.planner.base.rarities;
};
