'use strict';
// Native-criteria-only price-scope planner. It issues no requests and performs no purchases.
class PlannerError extends Error {
  constructor(code){super(code);this.name='PlannerError';this.code=code;}
}
const integer=value=>Number.isSafeInteger(value)&&value>=0;
const positive=value=>integer(value)&&value>0;
const plainCopy=value=>{
  if(typeof structuredClone!=='function')throw new PlannerError('structured-clone-unavailable');
  try{return structuredClone(value)}catch{throw new PlannerError('criteria-not-cloneable')}
};
const copyCriteria=criteria=>{
  const entries=Object.entries(criteria).filter(([,value])=>typeof value!=='function');
  return Object.assign(Object.create(Object.getPrototypeOf(criteria)),plainCopy(Object.fromEntries(entries)));
};
const sameIDs=(left,right)=>left.length===right.length&&left.every(id=>right.includes(id));
class PriceScopePlanner {
  constructor(options){
    if(!options||typeof options!=='object'||!options.criteria||typeof options.criteria!=='object')throw new PlannerError('search-criteria-required');
    const c=options.criteria;
    if(c.type!==(options.playerType??'player'))throw new PlannerError('player-search-required');
    if(options.playerSelected===true)throw new PlannerError('named-player-restricts-all-player-intent');
    if(c.defId!=null&&(!Array.isArray(c.defId)||c.defId.length))throw new PlannerError('named-player-restricts-all-player-intent');
    if(c.maskedDefId!=null&&c.maskedDefId!==0||c.definitionId!=null&&c.definitionId!==0)throw new PlannerError('named-player-restricts-all-player-intent');
    if(!Array.isArray(c.rarities)||!c.rarities.length||c.rarities.some(id=>!integer(id)))throw new PlannerError('selected-promo-rarity-required');
    const verified=options.verifiedRarityIds;
    if(!Array.isArray(verified)||!verified.length||verified.some(id=>!integer(id))||!sameIDs([...new Set(c.rarities)],[...new Set(verified)]))throw new PlannerError('selected-rarity-metadata-unverified');
    if(!positive(options.snipeMaximum))throw new PlannerError('positive-fixed-snipe-maximum-required');
    const nativeMaximum=c.maxBuy;
    if(nativeMaximum!=null&&nativeMaximum!==0&&!positive(nativeMaximum))throw new PlannerError('invalid-native-search-maximum');
    const nativeMinimum=c.minBuy??0;
    if(!integer(nativeMinimum))throw new PlannerError('invalid-native-search-minimum');
    let cap=positive(nativeMaximum)?Math.min(nativeMaximum,options.snipeMaximum):options.snipeMaximum;
    this.roundDown=typeof options.roundDown==='function'?options.roundDown:null;
    this.nextStep=typeof options.nextStep==='function'?options.nextStep:null;
    this.previousStep=typeof options.previousStep==='function'?options.previousStep:null;
    if(this.roundDown){
      const rounded=this.roundDown(cap);
      if(!integer(rounded)||rounded>cap)throw new PlannerError('native-rounding-broadened-snipe-limit');
      cap=rounded;
    }
    if(!positive(cap))throw new PlannerError('snipe-maximum-below-native-valid-price');
    if(nativeMinimum>cap)throw new PlannerError('contradictory-native-price-range');
    if(options.minimumBuyNow!==undefined&&!positive(options.minimumBuyNow))throw new PlannerError('invalid-native-minimum-price');
    if(options.minimumBuyNow>cap)throw new PlannerError('snipe-maximum-below-native-minimum');
    this.config={maxScopes:options.maxScopes??32,backstopEvery:options.backstopEvery??8,cooldownAfter:options.cooldownAfter??3,maxCooldownTicks:options.maxCooldownTicks??32};
    if(!positive(this.config.maxScopes)||this.config.maxScopes>128||!positive(this.config.backstopEvery)||!positive(this.config.cooldownAfter)||!positive(this.config.maxCooldownTicks))throw new PlannerError('invalid-planner-bounds');
    this.base=copyCriteria(c);this.base.maxBuy=cap;
    this.snipeMaximum=options.snipeMaximum;this.effectiveMaximum=cap;this.minimumBuyNow=options.minimumBuyNow??0;
    this.scopes=new Map();this.bounds=new Set();this.queue=[];this.sequence=0;this.tick=0;this.issued=0;this.lastBroadTick=-Infinity;this.pending=null;this.stopped=false;
    this.lastCountProvenance='unknown';this.capacityKnown=false;this.countWarnings=new Set();this.terminalReasons=new Set();
    this.restrictedFields=[];
    for(const key of ['league','leagueId','team','teamId','club','clubId','nation','nationId','position','preferredPosition','zone','playStyle','playStyles','level','ovrMin','ovrMax']){
      const value=c[key];if(value!==undefined&&value!==null&&value!==0&&value!==-1&&value!==''&&value!=='any'&&!(Array.isArray(value)&&value.length===0))this.restrictedFields.push(key);
    }
    this.root=this.addScope(nativeMinimum,cap,'root');this.queue.push(this.root.id);
    if(options.probeUpperBoundary===true&&this.previousStep&&this.config.maxScopes>=3){
      const lower=this.previousStep(cap);
      if(integer(lower)&&lower>nativeMinimum&&lower<cap){const edge=this.addScope(lower,cap,this.root.id);this.queue.unshift(edge.id);}
    }
    this.balancedCoverage=options.balancedCoverage===true;
    if(this.balancedCoverage&&this.roundDown&&this.previousStep&&this.config.maxScopes>=6){
      const cuts=[nativeMinimum,...[1,2,3].map(n=>this.roundDown(nativeMinimum+(cap-nativeMinimum)*n/4)),cap];
      if(cuts.every((v,n)=>integer(v)&&(n===0||v>cuts[n-1]))){
        this.root.leaf=false;
        for(let n=0;n<4;n++){
          const minimum=n===0?nativeMinimum:Math.max(nativeMinimum,this.previousStep(cuts[n]));
          const band=this.addScope(minimum,cuts[n+1],this.root.id);this.queue.push(band.id);
        }
      }
    }
  }
  addScope(minimum,maximum,parent){
    const scope={id:'price-scope-'+(++this.sequence),minimum,maximum,parent,leaf:true,visits:0,acceptedVisits:0,noFreshVisits:0,nextEligibleTick:0,lastRawCount:null,lastCapacity:null,lastFreshCount:0,lastNewFreshCount:0,terminalReason:null};
    this.scopes.set(scope.id,scope);this.bounds.add(minimum+'|'+maximum);return scope;
  }
  next(preferredScopeId=null){
    if(this.stopped)return null;
    if(this.pending)throw new PlannerError('scope-request-already-in-flight');
    this.tick++;
    let scope,kind;
    if(preferredScopeId!==null){
      scope=this.scopes.get(preferredScopeId);
      if(!scope||!scope.leaf&&scope.id!==this.root.id)throw new PlannerError('invalid-continuation-scope');
      if(scope.nextEligibleTick>this.tick)return {kind:'idle',id:null,criteria:null,waitTicks:scope.nextEligibleTick-this.tick,reason:'continuation-scope-on-bounded-cooldown'};
      kind=scope.id===this.root.id?'broad-backstop':'price-band';this.queue=this.queue.filter(id=>id!==scope.id);
      if(kind==='broad-backstop')this.lastBroadTick=this.tick;
    }else if(this.tick-this.lastBroadTick>=this.config.backstopEvery&&this.root.nextEligibleTick<=this.tick){
      scope=this.root;kind='broad-backstop';this.lastBroadTick=this.tick;
    }else{
      // At most one productive bonus per four turns; FIFO and broad backstops
      // retain bounded turns for cheaper and unproductive scopes.
      if(this.balancedCoverage&&this.tick%4===0){
        const productive=[...this.scopes.values()].filter(s=>s.leaf&&(s.lastNewFreshCount>0||s.seekingFresh)&&s.nextEligibleTick<=this.tick&&this.tick-(s.lastIssuedTick||0)>=3).sort((a,b)=>Number(b.lastNewFreshCount>0)-Number(a.lastNewFreshCount>0)||(b.lastMaxRemaining||0)-(a.lastMaxRemaining||0)||(b.lastProductiveTick||0)-(a.lastProductiveTick||0))[0];
        if(productive){scope=productive;kind='price-band';this.queue=this.queue.filter(id=>id!==scope.id);}
      }
      const length=this.queue.length;
      for(let i=0;!scope&&i<length;i++){
        const candidate=this.scopes.get(this.queue.shift());
        if(!candidate?.leaf)continue;
        if(candidate.nextEligibleTick>this.tick){this.queue.push(candidate.id);continue}
        scope=candidate;kind=candidate.id===this.root.id?'broad-backstop':'price-band';break;
      }
    }
    if(!scope){
      const deadlines=[...this.scopes.values()].filter(s=>s.leaf).map(s=>s.nextEligibleTick);
      return {kind:'idle',id:null,criteria:null,waitTicks:deadlines.length?Math.max(1,Math.min(...deadlines)-this.tick):1,reason:'all-price-scopes-on-bounded-cooldown'};
    }
    if(kind==='broad-backstop')this.queue=this.queue.filter(id=>id!==scope.id);
    const criteria=copyCriteria(this.base);criteria.minBuy=scope.minimum;criteria.maxBuy=scope.maximum;
    const id='intent-'+(++this.issued);this.pending={id,scopeId:scope.id,kind};
    scope.lastIssuedTick=this.tick;
    return {id,kind,criteria,scope:{id:scope.id,minBuy:scope.minimum,maxBuy:scope.maximum},epoch:this.tick,allPlayerIntent:true,coverageComplete:false};
  }
  split(scope){
    if(!this.roundDown||!this.previousStep||!this.nextStep){scope.terminalReason='native-price-helpers-unavailable';this.terminalReasons.add(scope.terminalReason);return false}
    if(this.scopes.size+2>this.config.maxScopes){scope.terminalReason='bounded-price-scope-capacity';this.terminalReasons.add(scope.terminalReason);return false}
    const logicalMinimum=Math.max(scope.minimum,this.minimumBuyNow);
    const middle=this.roundDown((logicalMinimum+scope.maximum)/2);
    if(!positive(middle)||middle<=logicalMinimum||middle>=scope.maximum){scope.terminalReason='crowded-atomic-or-unsplittable-price-band';this.terminalReasons.add(scope.terminalReason);return false}
    const overlappingMinimum=this.previousStep(middle),next=this.nextStep(middle);
    // Preserve native valid-price boundaries and overlap rather than invent +/-1 coin limits.
    if(!integer(overlappingMinimum)||overlappingMinimum<=scope.minimum||overlappingMinimum>=middle||!positive(next)||next<=middle||next>scope.maximum){scope.terminalReason='crowded-atomic-or-unsplittable-price-band';this.terminalReasons.add(scope.terminalReason);return false}
    const keys=[scope.minimum+'|'+middle,overlappingMinimum+'|'+scope.maximum];
    if(keys.some(key=>this.bounds.has(key))){scope.terminalReason='duplicate-price-scope-boundaries';this.terminalReasons.add(scope.terminalReason);return false}
    const left=this.addScope(scope.minimum,middle,scope.id),right=this.addScope(overlappingMinimum,scope.maximum,scope.id);
    scope.leaf=false;scope.children=[left.id,right.id];this.queue=this.queue.filter(id=>id!==scope.id);this.queue.push(left.id,right.id);return true;
  }
  observe(stats){
    if(!this.pending)throw new PlannerError('no-scope-request-in-flight');
    if(!stats||stats.intentId!==this.pending.id)throw new PlannerError('stale-or-mismatched-scope-response');
    const intent=this.pending;this.pending=null;const scope=this.scopes.get(intent.scopeId);scope.visits++;
    if(stats.acceptedScope!==true){scope.noFreshVisits++;scope.nextEligibleTick=this.tick+this.config.cooldownAfter;if(scope.leaf)this.queue.push(scope.id);return this.diagnostics()}
    if(!integer(stats.rawCount))throw new PlannerError('invalid-raw-result-count');
    scope.acceptedVisits++;scope.lastRawCount=stats.rawCount;
    scope.lastFreshCount=integer(stats.freshCount)?stats.freshCount:0;
    scope.lastNewFreshCount=integer(stats.newFreshCount)?stats.newFreshCount:0;
    scope.lastMaxRemaining=Number.isFinite(stats.maxRemaining)?stats.maxRemaining:null;scope.seekingFresh=stats.seekingFresh===true;
    if(scope.lastNewFreshCount>0)scope.lastProductiveTick=this.tick;
    scope.noFreshVisits=scope.lastNewFreshCount>0||stats.newPageObserved===true?0:scope.noFreshVisits+1;
    const capacity=positive(stats.observedRequestCount)&&['wire','sdk'].includes(stats.countProvenance)?stats.observedRequestCount:null;
    scope.lastCapacity=capacity;
    if(capacity!==null){this.capacityKnown=true;this.lastCountProvenance=stats.countProvenance}else this.countWarnings.add('response-capacity-unobserved');
    const crowded=capacity!==null&&stats.rawCount>=capacity;
    const didSplit=crowded&&scope.leaf?this.split(scope):false;
    if(scope.noFreshVisits>=this.config.cooldownAfter){
      const delay=Math.min(this.config.maxCooldownTicks,2**Math.min(20,scope.noFreshVisits-this.config.cooldownAfter+1));scope.nextEligibleTick=this.tick+delay;
    }else scope.nextEligibleTick=this.tick;
    if(!didSplit&&scope.leaf&&!this.queue.includes(scope.id))this.queue.push(scope.id);
    return this.diagnostics();
  }
  stop(){this.stopped=true;this.pending=null}
  diagnostics(){
    const leafScopes=[...this.scopes.values()].filter(scope=>scope.leaf);
    return {mode:'native-price-scopes',allPlayerIntent:true,selectedRarityIds:[...this.base.rarities],fixedSnipeMaximum:this.snipeMaximum,effectiveSearchMaximum:this.effectiveMaximum,nativeMinimum:this.base.minBuy??0,restrictedNativeFields:[...this.restrictedFields],allSelectedPromoPlayersUnrestricted:this.restrictedFields.length===0,scopeCount:this.scopes.size,leafScopeCount:leafScopes.length,observedLeafScopeCount:leafScopes.filter(scope=>scope.acceptedVisits>0).length,intentsIssued:this.issued,tick:this.tick,pendingIntentId:this.pending?.id??null,lastCapacityProvenance:this.lastCountProvenance,responseCapacityObserved:this.capacityKnown,incompleteReasons:[...new Set(['server-ordering-and-range-boundary-semantics-unverified',...(this.restrictedFields.length?['preserved-native-filters-restrict-player-coverage']:[]),...this.countWarnings,...this.terminalReasons])],coverageComplete:false,liveDiscoveryProven:false,scopes:leafScopes.map(scope=>({id:scope.id,minBuy:scope.minimum,maxBuy:scope.maximum,visits:scope.visits,acceptedVisits:scope.acceptedVisits,lastRawCount:scope.lastRawCount,lastCapacity:scope.lastCapacity,lastFreshCount:scope.lastFreshCount,lastNewFreshCount:scope.lastNewFreshCount,nextEligibleTick:scope.nextEligibleTick,terminalReason:scope.terminalReason}))};
  }
}
module.exports={PriceScopePlanner,PlannerError};
