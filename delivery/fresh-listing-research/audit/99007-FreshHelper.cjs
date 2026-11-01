// Exact production webpack module 99007 from inspected FC Enhancer v7.2.
module.exports = (e,t,n)=>{
const freshCriteria=new WeakSet(), diagnostics=new WeakMap(), rawPages=new WeakMap(), allowedPages=new WeakMap();
// Passive, bounded observation only. Never changes requests or reads bodies/headers.
// A matching concurrent request makes correlation ambiguous; no server page is inferred.
let active=null,installed=false;
const wireByCriteria=new WeakMap();
const inspectURL=value=>{
 try{
  const url=new URL(String(value),globalThis.location?.href||'https://www.ea.com/');
  if(!/transfermarket/i.test(url.pathname))return null;
  const fields={};
  for(const key of ['start','offset','num','count','page','pageIndex']){
   const value=url.searchParams.get(key);
   if(value!==null&&/^\d{1,9}$/.test(value))fields[key]=Number(value);
  }
  return fields;
 }catch{return null}
};
const observe=(criteria,fields,transport)=>{
 if(!criteria||!fields)return null;
 const wire=wireByCriteria.get(criteria);if(!wire)return null;
 const entry={fields,transport,status:'unknown'};wire.push(entry);return entry;
};
function installObserver(){
 if(installed)return;installed=true;
 if(typeof XMLHttpRequest!=='undefined'){
  const proto=XMLHttpRequest.prototype,open=proto.open,send=proto.send,meta=new WeakMap();
  proto.open=function(method,url,...rest){meta.set(this,inspectURL(url));return open.call(this,method,url,...rest)};
  proto.send=function(...args){const entry=observe(active,meta.get(this),'xhr');if(entry)this.addEventListener('loadend',()=>{entry.status=this.status||'unknown'},{once:true});return send.apply(this,args)};
 }
 if(typeof globalThis.fetch==='function'){
  const fetch=globalThis.fetch;
  globalThis.fetch=function(input,...rest){
   const entry=observe(active,inspectURL(input?.url??input),'fetch');
   const response=fetch.call(this,input,...rest);
   if(entry)response.then(r=>{entry.status=r.status},()=>{});
   return response;
  };
 }
}
t.capture=async(criteria,call)=>{
 installObserver();wireByCriteria.set(criteria,[]);
 const previous=active;active=criteria;
 try{return await call()}finally{active=previous}
};
t.wire=criteria=>{
 const entries=wireByCriteria.get(criteria)||[];
 if(entries.length!==1)return{offset:'unknown',params:'unknown',status:'unknown',transport:entries.length?'ambiguous':'cache-or-unobserved'};
 const entry=entries[0];return {offset:entry.fields.start??entry.fields.offset??'unknown',params:Object.entries(entry.fields).map(([k,v])=>k+':'+v).join(',')||'unknown',status:entry.status,transport:entry.transport,fields:entry.fields};
};

t.isFresh=criteria=>freshCriteria.has(criteria);
t.captureRaw=(criteria,items)=>{if(t.isFresh(criteria)&&Array.isArray(items))rawPages.set(criteria,items.slice())};
t.raw=(criteria,fallback)=>rawPages.get(criteria)||fallback;
t.setEligible=(criteria,items)=>allowedPages.set(criteria,items);
globalThis[Symbol.for('fcEnhancer.fresh.v7')]=Object.freeze({captureRaw:t.captureRaw});
t.record=(criteria,value)=>diagnostics.set(criteria,value);
t.blockPurchase=()=>n(51477).Logger.writeToLog('[Fresh] TEST interlock blocked purchase/bid; buying=DISABLED');
const stable=value=>{
 if(value instanceof Set)return [...value].map(stable).sort();
 if(Array.isArray(value))return value.map(stable);
 if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().filter(k=>typeof value[k]!=='function').map(k=>[k,stable(value[k])]));
 return value;
};
const fingerprint=value=>{let hash=2166136261;for(const c of JSON.stringify(stable(value)))hash=Math.imul(hash^c.charCodeAt(0),16777619);return(hash>>>0).toString(16)};
const clone=criteria=>Object.assign(Object.create(Object.getPrototypeOf(criteria)),structuredClone(Object.fromEntries(Object.entries(criteria).filter(([,v])=>typeof v!=='function'))));
// The starting page is an access probe, never an assumed returned page.
// Learn offset stride from observed page-1/page-2 requests (21 results can overlap by 1).
const transportKeys=new Set(['offset','count','start','num','page','pageindex','pagenumber']);
const isTransport=key=>transportKeys.has(key.replace(/^_+/,'').toLowerCase());
const semantic=criteria=>Object.fromEntries(Object.entries(criteria).filter(([key,value])=>!isTransport(key)&&typeof value!=='function'));
t.semantic=semantic;
const changedKeys=(before,after)=>[...new Set([...Object.keys(before),...Object.keys(after)])].filter(key=>JSON.stringify(stable(before[key]))!==JSON.stringify(stable(after[key]))).map(key=>key.replace(/[^a-zA-Z0-9_]/g,'').slice(0,40)).filter(Boolean);
const observedOffset=wire=>(wire.transport==='xhr'||wire.transport==='fetch')&&wire.status>=200&&wire.status<300&&typeof wire.offset==='number';
// Ownership is the existing shared Trader data object, not a per-request DTO.
// Weak storage survives processor/controller rebinding within a run. Explicit stop ends it.
const runSessions=new WeakMap();let runSequence=0;
function sessionFor(data){
 let run=runSessions.get(data);
 if(!run){run={id:++runSequence,contexts:new Map(),active:null,visited:new Set(),noProgress:0,requests:0,trace:[],previousState:'NONE',filterDecision:'none',lifecycle:'none'};runSessions.set(data,run)}
 return run;
}
t.endRun=(processor,source)=>{
 const run=runSessions.get(processor.traderData);
 if(run)n(51477).Logger.writeToLog('[Fresh] run='+run.id+' state=STOPPED resetSource='+source+' resetReason=explicit-stop buying=DISABLED');
 runSessions.delete(processor.traderData);
};
t.controllerChanged=(processor,previous,next)=>{
 const run=runSessions.get(processor.traderData);
 if(run&&previous!==next)run.lifecycle='TraderProcessor.setControllerInstance';
};
t.filterRotationDecision=(data,settings)=>{
 if(!settings.searchSetting.autoFindNewest)return 'allow';
 const run=runSessions.get(data),state=run?.contexts.get(run.active),filter=data.cache.filter;
 if(!state)return 'allow';
 if(filter.selectedFilters.length===1&&filter.selectedFilters[0]===filter.currentFilter){run.filterDecision='same-filter-retained';return 'retain'}
 if(!state.anchor&&!state.stopped){run.filterDecision='rotation-deferred-during-discovery';return 'defer'}
 run.filterDecision='rotation-allowed';return 'allow';
};
t.noteFilterDecision=(data,decision)=>{const run=runSessions.get(data);if(run)run.filterDecision=decision};
const stateLabel=state=>state.stopped?'STOPPED':state.anchor?state.phase:state.warmup?'SEQUENTIAL_WARMUP':state.accessStage==='PROBE_START'?'PROBE_START':state.accessStage==='BASELINE'?'CALIBRATE_BASELINE':state.accessStage==='CALIBRATE'?'CALIBRATE_PAGE2':state.phase;
function attachSession(processor,context,key,start,budget){
 const run=sessionFor(processor.traderData),identity=JSON.stringify(stable(context));
 const previousContext=run.contexts.get(run.active);
 const resetFields=previousContext&&run.active!==identity?[...changedKeys(previousContext.context.criteria,context.criteria),...(previousContext.context.filter!==context.filter?['currentFilter']:[]),...(previousContext.context.start!==context.start?['startingSearchPage']:[]),...(previousContext.context.budget!==context.budget?['searchResultPageLimit']:[])].join(',')||'none':'none';
 let state=run.contexts.get(identity),resetReason='none';
 if(!state){
  state=t.create(key,budget,start);state.identity=identity;state.context=context;run.contexts.set(identity,state);
  resetReason=run.active===null?'new-run':'search-context-changed';
 }else if(run.active!==identity){
  // A real market-context switch invalidates access history, not the failed-probe latch.
  const attempted=state.directProbeAttempted,failed=state.directProbeFailed,empty=state.directEmptyPage;
  state=t.create(key,budget,start);Object.assign(state,{identity,context,directProbeAttempted:attempted,directProbeFailed:failed,directEmptyPage:empty});
  if(attempted)selectSequential(state,'return-to-context-sequential-no-reprobe');
  run.contexts.set(identity,state);resetReason='return-to-search-context';
 }else if(processor.__fcFreshNavigation!==state)resetReason='processor-pointer-restored';
 if(run.lifecycle!=='none'&&resetReason==='none')resetReason='controller-rebound-context-preserved';
 run.active=identity;run.owner=processor;processor.__fcFreshNavigation=state;
 if(run.contexts.size>8){state.stopped=true;state.phase='STOPPED';state.reason='search-context-churn-limit'}
 return {run,state,resetReason,resetFields,previousCriteria:previousContext?.key||'none',resetSource:resetReason==='none'?'none':run.lifecycle!=='none'?run.lifecycle:'99007.attachSession'};
}
function observeProgress(run,state,req,items,wire){
 run.requests++;run.trace.push(req);if(run.trace.length>12)run.trace.shift();
 const valid=state.responseAccepted!==false&&Array.isArray(items)&&items.length>0&&!state.stopped;
 state.overlapPrevious='unknown';
 if(valid){
  const ids=new Set(items.map(item=>String(item?.getAuctionData?.()?.tradeId??item?.id??'')));
  if(run.lastAccepted?.identity===state.identity&&Math.abs(run.lastAccepted.page-req)===1)state.overlapPrevious=[...ids].filter(id=>run.lastAccepted.ids.has(id)).length;
  run.lastAccepted={identity:state.identity,page:req,ids};
 }
 if(state.reason==='window-moved-rescan'){
  run.visited.clear();run.noProgress=0;run.previousState='REDISCOVERY';return 'rediscovery-reset';
 }
 if(state.anchor){run.noProgress=0;return 'monitoring-refresh'}
 const progressKey=state.identity+'#'+req;
 if(valid&&!run.visited.has(progressKey)){run.visited.add(progressKey);run.noProgress=0;return 'new-requested-page-with-distinct-listings'}
 run.noProgress++;
 if(!state.stopped&&run.noProgress>=12){state.stopped=true;state.phase='STOPPED';state.reason='discovery-progress-watchdog:no-new-valid-page-in-12-requests'}
 return valid?'revisited-page':'no-accepted-page';
}

function selectSequential(state,reason){
 state.directProbeFailed=true;state.directProbeAttempted=true;
 state.accessStage='DISCOVERY';state.access='sequential-fallback';state.page=1;state.phase='RECOVERING';state.reason=reason;
 state.warmup=state.configuredStart>1;state.discoveryBudget=state.warmup?500:state.configuredBudget;state.scanVisited.clear();state.scanDirection=0;state.seen.clear();state.empty=0;
}
function selectStart(state){
 state.accessStage='DISCOVERY';state.access='direct-probe-validated';state.discoveryBudget=state.configuredBudget;
 state.scanVisited.clear();state.scanDirection=0;state.reason='direct-probe-offset-matches-calibration';
}
t.process=(state,req,items,wire)=>{
 const stage=state.accessStage;state.responseAccepted=true;state.comparison='none';
 if(state.warmup&&req===state.directEmptyPage&&items?.length)state.comparison='direct-empty-sequential-populated-time-varying-evidence';
 if(stage==='DISCOVERY'&&state.warmup&&req===state.configuredStart){state.warmup=false;state.discoveryBudget=state.configuredBudget;state.scanVisited.clear();state.scanDirection=0;state.access='sequential-reached-configured-start';}
 if(stage==='PROBE_START'){
  const expected=state.baseOffset+(state.configuredStart-1)*state.stride;
  const baseline=[...state.seen.values()].map(value=>value.sig);
  const sig=Array.isArray(items)?items.map(item=>String(item?.getAuctionData?.()?.tradeId??item?.id??'')).sort().join(','):'';
  if(!Array.isArray(items)||!items.length||!observedOffset(wire)||wire.offset!==expected||(wire.fields?.num??wire.fields?.count)!==(state.baselineWire?.fields?.num??state.baselineWire?.fields?.count)||baseline.includes(sig)){
   if(Array.isArray(items)&&!items.length)state.directEmptyPage=req;
   state.responseAccepted=false;selectSequential(state,!items?.length?'direct-probe-empty-or-end-fallback':baseline.includes(sig)?'direct-probe-replayed-baseline-fallback':'direct-probe-offset-unverified-fallback');return;
  }
  selectStart(state);
 }
 t.advance(state,req,items);
 if(state.anchor){state.accessStage='DISCOVERY';state.warmup=false;state.discoveryBudget=state.configuredBudget;return}
 if(state.stopped||!items?.length)return;
 if(stage==='BASELINE'){
  state.baseOffset=observedOffset(wire)?wire.offset:null;state.baselineWire=wire;
  state.accessStage='CALIBRATE';state.page=2;state.phase='VALIDATING_ACCESS';state.reason='calibrate-service-page-2-before-start-probe';
 }else if(stage==='CALIBRATE'){
  const stride=state.baseOffset!==null&&observedOffset(wire)?wire.offset-state.baseOffset:0;
  const baseCount=state.baselineWire?.fields?.num??state.baselineWire?.fields?.count;
  const nextCount=wire.fields?.num??wire.fields?.count;
  if(state.configuredStart===2){state.accessStage='DISCOVERY';state.access='sequential-reached-configured-start';state.discoveryBudget=state.configuredBudget;state.scanVisited=new Set([2]);state.reason='configured-start-already-validated-sequentially';}
  else if(stride>0&&baseCount===nextCount){state.stride=stride;state.directProbeAttempted=true;state.accessStage='PROBE_START';state.page=state.configuredStart;state.phase='VALIDATING_ACCESS';state.reason='probe-configured-start-using-observed-offset-stride';}
  else{
   state.accessStage='DISCOVERY';state.access='sequential-fallback';state.warmup=state.configuredStart>2;state.discoveryBudget=state.warmup?500:state.configuredBudget;
   state.reason='no-observable-offset-calibration-sequential-warmup-to-start';
   if(state.scanVisited.size>=state.discoveryBudget){state.stopped=true;state.phase='STOPPED';state.reason='discovery-page-budget-exhausted';}
  }
 }
};

t.target=item=>{const v=item?.getAuctionData?.()?.expires;return typeof v==='number'&&Number.isFinite(v)&&v>=3540&&v<=3600};
t.create=(key,budget,start=1)=>({key,limit:500,configuredBudget:budget,discoveryBudget:start>1?500:budget,configuredStart:start,directProbeAttempted:false,directProbeFailed:false,accessStage:start>1?'BASELINE':'DISCOVERY',access:'sequential',scanVisited:new Set(),scanDirection:0,page:1,phase:'INITIALIZING',empty:0,anchor:0,targetPages:new Set(),invalidUntil:new Map(),edgeFailures:new Map(),tick:0,turn:0,seen:new Map(),missing:0,stopped:false});
t.advance=(s,req,items,now=Date.now())=>{
 s.tick++;
 const halt=reason=>{s.stopped=true;s.phase='PAGINATION_UNAVAILABLE';s.reason=reason};
 if(!Array.isArray(items)){halt('malformed-items');return}
 if(!items.length){
  if(++s.empty<3){s.phase='RECOVERING';s.reason='successful-empty-retry';return}
  s.empty=0;s.destination=null;
  if(s.anchor){
   const failures=(s.edgeFailures.get(req)||0)+1;s.edgeFailures.set(req,failures);s.invalidUntil.set(req,s.tick+12);
   if(failures>=2)s.invalidUntil.set(req,Infinity);
   s.page=Math.abs(s.anchor-req)>1?req+Math.sign(s.anchor-req):s.anchor;s.phase='MONITORING';s.reason=failures>=2?'empty-boundary-skipped-monitor-valid-target':'neighbour-empty-return-cooldown';return
  }
  halt(req===1?'empty-first-page':'end-or-navigation-unavailable');return;
 }
 s.empty=0;
 const seconds=items.map(i=>i?.getAuctionData?.()?.expires);
 if(seconds.some(v=>typeof v!=='number'||!Number.isFinite(v))){halt('invalid-duration');return}
 const ids=items.map(i=>String(i?.getAuctionData?.()?.tradeId??i?.id??''));
 if(ids.some(id=>!id)){halt('missing-listing-identity');return}
 const sig=ids.slice().sort().join(',');
 const durationSig=seconds.join(',');
 for(const [page,old]of s.seen){if(page!==req&&old.sig===sig){halt('repeated-listings-across-pages');return}}
 const previous=s.seen.get(req);
 if(previous&&previous.sig===sig&&previous.durationSig===durationSig&&now-previous.at>15000){halt('stale-duration-or-cache');return}
 s.seen.set(req,{sig,durationSig,at:previous?.sig===sig&&previous.durationSig===durationSig?previous.at:now});
 const targets=items.filter(t.target);
 if(targets.length){const monitoring=!!s.anchor;s.targetPages.add(req);s.anchor=req;s.missing=0;s.phase=monitoring?'MONITORING':'TARGET_FOUND'}else if(s.anchor){s.targetPages.delete(req);s.missing++;s.phase='PROBING_NEIGHBOUR'}else s.phase='DISCOVERING';
 if(s.anchor){
  // Round robin both neighbours; no ordering, jumps, or binary-search assumptions.
  if(s.missing>=6){s.anchor=0;s.destination=null;s.targetPages.clear();s.page=1;s.seen.clear();s.scanVisited.clear();s.scanDirection=0;s.invalidUntil.clear();s.edgeFailures.clear();s.accessStage='DISCOVERY';s.discoveryBudget=s.configuredBudget;s.missing=0;s.phase='RECOVERING';s.reason='window-moved-rescan';return}
  const band=s.targetPages.size?[...s.targetPages].sort((a,b)=>a-b):[s.anchor];
  const pages=[...new Set([...band,Math.max(1,band[0]-1),Math.min(s.limit,band.at(-1)+1)])];
  const available=pages.filter(p=>(s.invalidUntil.get(p)||0)<=s.tick);
  if(s.destination==null||s.destination===req||!available.includes(s.destination))s.destination=available[s.turn++%available.length]??s.anchor;
  const desired=s.destination;
  s.page=Math.abs(desired-req)>1?req+Math.sign(desired-req):desired;s.reason=targets.length?'target-and-neighbour-monitor':'probe-neighbour';return;
 }
 s.scanVisited.add(req);
 if(s.scanVisited.size>=s.discoveryBudget){s.stopped=true;s.phase='STOPPED';s.reason='discovery-page-budget-exhausted';return}
 if(!s.scanDirection)s.scanDirection=seconds.every(v=>v>3600)&&req>1?-1:1;
 let next=req+s.scanDirection;
 if(next<1||next>s.limit){s.scanDirection*=-1;next=req+s.scanDirection;}
 s.page=next;s.reason=s.scanDirection>0?'below-target-or-unordered-advance':'above-target-probe-earlier';
};
t.run=async(processor,criteria,orchestrator,log)=>{
 const cfg=processor.traderSettings.searchSetting;
 const existingRun=runSessions.get(processor.traderData);
 if(cfg.autoFindNewest&&existingRun?.inFlight){log('[Fresh] run='+existingRun.id+' state=REQUEST_IN_FLIGHT reason=shared-session-request-deferred source=99007.run buying=DISABLED');return {items:[]}}
 if(!cfg.autoFindNewest){processor.__fcFreshNavigation=null;const req=Math.max(1,Number(processor.traderData.cache.nextPageNumber)||1);const items=await orchestrator.searchMarket(criteria,req);const limit=Math.max(1,Number(cfg.searchResultPageLimit)||1);processor.traderData.cache.nextPageNumber=Array.isArray(items)&&items.length&&req<limit?req+1:1;return{items:items||[]}}
 const enhancer=n(32024).InMemoryStore.instance.get('enhancerSettings');
 const effective=clone(criteria);
 if(effective.defId?.length===0&&effective.rarities?.length===0&&enhancer.multiRarities?.size)effective.rarities=[...enhancer.multiRarities];
 const start=Math.max(1,Math.min(500,Math.floor(Number(cfg.startingSearchPage)||1)));
 const context={criteria:semantic(effective),filter:processor.traderData.cache.filter.currentFilter,budget:cfg.searchResultPageLimit,start};
 const key=fingerprint(context);
 const attachment=attachSession(processor,context,key,start,Math.max(1,Math.min(500,Math.floor(Number(cfg.searchResultPageLimit)||1))));
 const {run,state,resetReason,resetSource,resetFields,previousCriteria}=attachment;
 if(resetReason!=='none')log('[Fresh] run='+run.id+' mode='+stateLabel(state)+' criteria='+key+' resetReason='+resetReason+' resetSource='+resetSource+' resetFields='+resetFields+' previousCriteria='+previousCriteria+' directProbeFailed='+state.directProbeFailed+' warmupTo='+(state.warmup?state.configuredStart:'none')+' targetSec=3540-3600 buying=DISABLED');
 if(state.stopped)return{items:[],stop:true};
 if(state.directProbeFailed&&['BASELINE','CALIBRATE','PROBE_START'].includes(state.accessStage)){selectSequential(state,'failed-probe-latch-prevented-recalibration');log('[Fresh] run='+run.id+' state=SEQUENTIAL_WARMUP reason=failed-probe-latch-prevented-recalibration resetSource=99007.run directProbeFailed=true warmupTo='+state.configuredStart+' buying=DISABLED');}
 const previousState=run.previousState,currentState=stateLabel(state);
 const req=state.page;
 const request=effective;freshCriteria.add(request);
 const before=clone(request);const requestSemantic=JSON.stringify(stable(semantic(before)));
 state.phase='VALIDATING_PAGE';
 processor.traderData.cache.nextPageNumber=req;
 let items,diag;run.inFlight=true;
 try{
  if(cfg.filterRating)throw Error('individual-player-rating-rotation-incompatible');
  items=await orchestrator.searchMarket(request,req);
  diag=diagnostics.get(request)||{kind:'missing-service-diagnostics'};
  if(processor.cancellationToken?.isCancelled||runSessions.get(processor.traderData)!==run){run.inFlight=false;const lateWire=t.wire(request);const lateDurations=Array.isArray(items)?items.map(item=>item?.getAuctionData?.()?.expires).filter(value=>typeof value==='number'&&Number.isFinite(value)):[];log('[Fresh] requested='+req+' confirmed=unknown offset='+lateWire.offset+' observedCount='+(lateWire.fields?.num??lateWire.fields?.count??'unknown')+' http='+lateWire.status+' count='+(Array.isArray(items)?items.length:'unknown')+' filteredCount='+(allowedPages.get(request)?.length??'unknown')+' minSec='+(lateDurations.length?Math.min(...lateDurations):'unknown')+' maxSec='+(lateDurations.length?Math.max(...lateDurations):'unknown')+' target='+(Array.isArray(items)?items.filter(t.target).length:0)+' eligible=0 nextRequested=STOP criteria='+key+' previousState='+previousState+' state='+currentState+' nextState=STOPPED mode=STOPPED next=STOP reason=cancelled run='+run.id+' warmupTo='+(state.warmup?state.configuredStart:'none')+' directProbeFailed='+state.directProbeFailed+' progress=cancelled resetReason=run-ended resetSource=TraderProcessor.stop buying=DISABLED');return{items:[]}}
  const currentCriteria=clone(processor.controllerInstance?.viewmodel.searchCriteria||criteria);
  if(currentCriteria.defId?.length===0&&currentCriteria.rarities?.length===0&&enhancer.multiRarities?.size)currentCriteria.rarities=[...enhancer.multiRarities];
  const liveContext={criteria:semantic(currentCriteria),filter:processor.traderData.cache.filter.currentFilter,budget:cfg.searchResultPageLimit,start:Math.max(1,Math.min(500,Math.floor(Number(cfg.startingSearchPage)||1)))};
  const liveContextChanged=JSON.stringify(stable(liveContext))!==state.identity;
  const changes=changedKeys(before,request);state.mutations=changes.join(',')||'none';
  state.ignoredTransportMutations=changes.filter(isTransport).join(',')||'none';
  if(liveContextChanged){state.responseAccepted=false;state.stopped=true;state.phase='STOPPED';state.reason='search-context-changed-while-awaiting-response'}
  else if(requestSemantic!==JSON.stringify(stable(semantic(request)))){state.stopped=true;state.phase='STOPPED';state.reason='search-filter-mutated:'+changes.filter(key=>!isTransport(key)).join(',')}
  else if(diag.kind!=='success'){
   if(state.accessStage==='PROBE_START'&&diag.kind==='service-error'&&[400,416].includes(diag.status))selectSequential(state,'direct-probe-rejected-fallback');
   else{state.stopped=true;state.phase='STOPPED';state.reason=diag.kind}
  }
  else{
   const observed=t.wire(request);
   if(state.accessStage!=='PROBE_START'&&state.stride>0&&observedOffset(observed)&&observed.offset!==state.baseOffset+(req-1)*state.stride){
    state.responseAccepted=false;state.stopped=true;state.phase='STOPPED';state.reason='observed-sequential-request-offset-mismatch';
   }else t.process(state,req,items,observed);
  }
 }catch(error){diag={kind:'exception',status:'unknown'};state.stopped=true;state.phase='PAGINATION_UNAVAILABLE';state.reason=cfg.filterRating?'individual-player-rating-rotation-incompatible':'service-or-parse-exception';}
 run.inFlight=false;
 const wire=t.wire(request);
 const progress=observeProgress(run,state,req,items,wire);
 const nextState=stateLabel(state);
 const durations=Array.isArray(items)?items.map(i=>i?.getAuctionData?.()?.expires).filter(v=>typeof v==='number'&&Number.isFinite(v)):[];
 const targets=Array.isArray(items)?items.filter(t.target):[];
 const allowed=allowedPages.get(request);
 const eligible=state.stopped||state.responseAccepted===false?[]:n(71446).filterResult(allowed?targets.filter(item=>allowed.includes(item)):targets,enhancer);
 log('[Fresh] requested='+req+' confirmed=unknown servicePage='+req+' offset='+wire.offset+' wire='+wire.params+' transport='+wire.transport+' http='+wire.status+' count='+(Array.isArray(items)?items.length:'unknown')+' minSec='+(durations.length?Math.min(...durations):'unknown')+' maxSec='+(durations.length?Math.max(...durations):'unknown')+' source='+(rawPages.has(request)?'index-pre-filter':'service-response')+' filteredCount='+(allowedPages.get(request)?.length??'unknown')+' target='+targets.length+' eligible='+eligible.length+' eligibleAfterClientFilters='+eligible.length+' safetyEvaluation=original-middleware-pending criteria='+key+' mode='+state.phase+' next='+(state.stopped?'STOP':state.page)+' reason='+state.reason+' status='+(typeof diag?.status==='number'?diag.status:diag?.kind||'unknown')+' access='+state.access+' stage='+state.accessStage+' warmupTo='+(state.warmup?state.configuredStart:'none')+' scanned='+state.scanVisited.size+'/'+state.configuredBudget+' mutations='+(state.mutations||'none')+' ignoredTransport='+(state.ignoredTransportMutations||'none')+' run='+run.id+' previousState='+previousState+' state='+currentState+' nextState='+nextState+' nextRequested='+(state.stopped?'STOP':state.page)+' overlapPrevious='+(state.overlapPrevious??'unknown')+' observedCount='+(wire.fields?.num??wire.fields?.count??'unknown')+' emptyClass='+(Array.isArray(items)&&!items.length?'successful-empty-inconclusive':'not-empty')+' directProbeAttempted='+state.directProbeAttempted+' directProbeFailed='+state.directProbeFailed+' progress='+progress+' noProgress='+run.noProgress+' recentPages='+run.trace.join(',')+' resetReason='+resetReason+' resetSource='+resetSource+' resetFields='+resetFields+' previousCriteria='+previousCriteria+' filterDecision='+run.filterDecision+' comparison='+(state.comparison||'none')+' serviceEndOfList='+(typeof diag?.endOfList==='boolean'?diag.endOfList:'unknown')+' transitionSource=99007.process/advance targetSec=3540-3600 pageEvidence=request-offset-and-listing-identities confirmedSource=unavailable buying=DISABLED');
 run.previousState=nextState;run.lifecycle='none';
 processor.traderData.cache.nextPageNumber=state.page;
 return {items:eligible,stop:state.stopped};
};
};
