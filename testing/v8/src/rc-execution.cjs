'use strict';
const {checkPreflight}=require('./purchase-preflight.cjs');
const KEY='fcEnhancer.v8.rc.transactions.v1';
const positive=n=>Number.isSafeInteger(n)&&n>0;
const denied=reason=>({response:false,reason,purchaseAuthorized:false});
const signature=p=>JSON.stringify({settings:p.traderSettings,criteria:Object.fromEntries(Object.entries(p.controllerInstance?.viewmodel?.searchCriteria||{}).filter(([k,v])=>!['offset','count','num','start'].includes(k)&&typeof v!=='function'))});
exports.createExecution=function({storage,preview,readBalance,guard,now=Date.now,timeoutMs=15000,withLock=fn=>fn()}){
 const states=new WeakMap(),contexts=new WeakMap();let busy=false,journalError=false;
 const state=p=>{if(!states.has(p))states.set(p,{armed:false,spent:0,budget:0,reason:'purchase-setting-disabled',inFlight:null});return states.get(p)};
 const read=()=>{try{const raw=storage.getItem(KEY),j=raw===null?{version:1,entries:[]}:JSON.parse(raw);if(j.version!==1||!Array.isArray(j.entries)||j.entries.length>50000||j.entries.some(e=>typeof e.id!=='string'||!/^\d+$/.test(e.id)||!positive(e.price)||!['pending','won','settled','rejected','unknown'].includes(e.status)))throw Error('Invalid journal');return j}catch{journalError=true;throw Error('transaction-journal-unavailable')}};
 const write=j=>{try{storage.setItem(KEY,JSON.stringify(j))}catch{journalError=true;throw Error('transaction-journal-unavailable')}};
 const unresolved=j=>j.entries.some(e=>['pending','won','unknown'].includes(e.status));
 const persist=(ctx,status)=>{const j=read(),entry=j.entries.find(e=>e.id===ctx.id);if(entry)entry.status=status;else{if(j.entries.length>=50000)throw Error('transaction-history-capacity');j.entries.push({id:ctx.id,price:ctx.price,status})}write(j)};
 const disarm=(p,reason='stopped')=>{const s=state(p);s.armed=false;s.reason=reason;guard?.revoke();if(s.inFlight){s.inFlight.cancelled=true;if(s.inFlight.reserved){try{persist(s.inFlight,'unknown')}catch{}}}};
 const status=p=>{const s=state(p);if(s.armed&&s.signature!==signature(p))disarm(p,'configuration-changed');let needsReconciliation=journalError;try{needsReconciliation||=read().entries.some(e=>['pending','won','unknown'].includes(e.status)&&!(s.inFlight&&!s.inFlight.cancelled&&s.inFlight.id===e.id&&e.status!=='unknown'))}catch{needsReconciliation=true}return{enabled:s.armed&&!needsReconciliation,inFlight:!!s.inFlight,spent:s.spent,budget:s.budget,reconciliationRequired:needsReconciliation,reason:needsReconciliation?'reconciliation-required':s.reason}};
 const arm=(p,{userEnabled,budget}={})=>{
  disarm(p,'purchase-setting-disabled');const s=state(p),cfg=p.traderSettings?.searchSetting,buy=p.traderSettings?.buySetting,criteria=p.controllerInstance?.viewmodel?.searchCriteria;
  if(userEnabled!==true)return denied('explicit-user-setting-required');
  if(p.isStarted)return denied('stop-before-enabling-purchases');
  if(!positive(cfg?.v8SnipeMaximum)||!cfg?.autoFindNewest)return denied('positive-v8-snipe-maximum-required');
  if(buy?.findBuyPrice!==true)return denied('profitability-rule-not-configured');
  if(p.traderSettings.safeSetting?.disableSafetyLimits)return denied('native-safety-limits-must-remain-enabled');
  if(!positive(buy.noOfCards)||!positive(budget))return denied('explicit-purchase-budgets-required');
  if(criteria?.type!=='player'||JSON.stringify(criteria.rarities)!=='[151]'||criteria.defId?.length!==0||criteria.maskedDefId)return denied('all-player-Ultimate-Scream-required');
  try{const j=read();if(journalError||unresolved(j))return denied('reconciliation-required');write(j)}catch{return denied('transaction-journal-unavailable')}
  Object.assign(s,{armed:true,signature:signature(p),maximum:cfg.v8SnipeMaximum,budget,spent:0,reason:'enabled-for-next-run'});return{response:true,purchaseAuthorized:false};
 };
 const active=ctx=>{const {p,s,token}=ctx;if(ctx.cancelled||!s.armed||!p.isStarted||token.isCancelled||p.cancellationToken!==token)throw Error('cancelled');if(signature(p)!==s.signature){disarm(p,'configuration-changed');throw Error('configuration-changed')}};
 const preflight=(ctx,terminal=false)=>{
  active(ctx);const {p,s,item,options}=ctx;if(terminal){const j=read(),entries=j.entries.filter(e=>e.id===ctx.id);if(journalError||entries.length!==1||entries[0].price!==ctx.price||entries[0].status!=='pending'||j.entries.some(e=>e.id!==ctx.id&&['pending','won','unknown'].includes(e.status)))throw Error('reconciliation-required');}
  let data=p.traderData;if(terminal&&ctx.cacheOwned&&data.cache.cachedBids===ctx.cacheSet){const originalCache=data.cache.cachedBids;data={...data,cache:{...data.cache,cachedBids:{has:id=>id===ctx.id?false:originalCache.has(id)}}};}
  const checked=checkPreflight({item,maximum:Math.min(s.maximum,options.maximum),settings:p.traderSettings,data,balance:readBalance(),observedAt:options.observedAt,observedRemaining:options.observedRemaining,now:now(),budgetRemaining:s.budget-s.spent,attemptsInSearch:options.perSearch.attempts-(terminal?1:0),requireProfitability:true});
  if(!checked.response)throw Error(checked.reason);if(item.rareflag!==151)throw Error('wrong-rarity');if(terminal&&(checked.tradeId!==ctx.id||checked.price!==ctx.price))throw Error('listing-changed');return checked;
 };
 const reserveNativeCache=(item,cache)=>{const ctx=contexts.get(item);if(!ctx||!ctx.reserved||ctx.cacheOwned||cache!==ctx.p.traderData.cache.cachedBids||cache.has(ctx.id))throw Error('duplicate-trade-id');preflight(ctx,true);ctx.cacheOwned=true;ctx.cacheSet=cache;};
 const beginNativeTransaction=(item,amount,dynamicMaximum)=>{
  const ctx=contexts.get(item);if(!ctx)throw Error('native-transaction-context-required');
  const validate=(actual,price)=>{const checked=preflight(ctx,true);if(actual!==item||price!==ctx.price||amount!==ctx.price||!positive(dynamicMaximum)||price>dynamicMaximum||price>checked.ceiling)throw Error('native-BIN-price-mismatch');};
  validate(item,amount);ctx.outcome='submitted';
  guard.grant(item,amount,(actual,price)=>{if(ctx.submitted)throw Error('duplicate-native-submission');validate(actual,price);ctx.submitted=true},()=>validate(item,amount));
 };
 const recordNativeOutcome=(item,success)=>{const ctx=contexts.get(item);if(!ctx)throw Error('native-transaction-context-required');guard.revoke();ctx.outcome=success===true&&ctx.submitted?'won':'unknown';persist(ctx,ctx.cancelled?'unknown':ctx.outcome);};
 const execute=async(item,options={})=>{
  const p=options.processor;if(!p)return denied('purchase-setting-disabled');const s=state(p);
  if(!s.armed)return denied('purchase-setting-disabled');
  if(signature(p)!==s.signature){disarm(p,'configuration-changed');return denied('configuration-changed')}
  if(!p.isStarted||!p.cancellationToken||p.cancellationToken.isCancelled)return denied('cancelled');
  if(busy||s.inFlight)return denied('transaction-in-flight');
  if(!options.perSearch||!Number.isSafeInteger(options.perSearch.attempts)||options.perSearch.attempts<0)return denied('per-search-context-required');
  if(!Number.isFinite(options.observedAt)||!Number.isFinite(options.observedRemaining))return denied('fresh-observation-required');
  if(typeof options.orchestrator?.handleTransferResults!=='function'||typeof options.orchestrator?.handleWonItems!=='function')return denied('native-orchestrator-unavailable');
  return withLock(async()=>{
   const ctx={item,options,p,s,token:p.cancellationToken,cancelled:false,outcome:'not-submitted',reserved:false};
   try{const j=read();if(journalError||unresolved(j))return denied('reconciliation-required');const checked=preflight(ctx);Object.assign(ctx,{id:checked.tradeId,price:checked.price});if(j.entries.some(e=>e.id===ctx.id))return denied('duplicate-trade-id');if(j.entries.length>=50000)return denied('transaction-history-capacity')}catch(error){return denied(error.message)}
   busy=true;s.inFlight=ctx;contexts.set(item,ctx);let timer;
   const perform=async()=>{
    const result=await preview(item,options);if(!result?.response){const reason=result?.reason||'native-middleware-rejected';if(['native-middleware-unavailable','native-state-unavailable','balance-unavailable','listing-state-unavailable'].includes(reason))disarm(p,reason);return denied(reason);}preflight(ctx);
    persist(ctx,'pending');ctx.reserved=true;options.perSearch.attempts++;
    const won=await options.orchestrator.handleTransferResults([item],p.traderSettings.safeSetting,ctx.token);
    active(ctx);
    if(ctx.outcome==='not-submitted'&&!won?.length){persist(ctx,'rejected');return{response:false,reason:'native-flow-no-win',purchaseAuthorized:false}}
    if(ctx.outcome!=='won'||!Array.isArray(won)||won.length!==1||won[0]!==item)throw Error('transaction-outcome-unknown');
    await options.orchestrator.handleWonItems(won);active(ctx);s.spent+=ctx.price;persist(ctx,'settled');return{response:true,reason:'native-flow-completed',purchaseAuthorized:true,wonCount:1};
   };
   try{return await Promise.race([perform(),new Promise((resolve,reject)=>{timer=setTimeout(()=>reject(Error('transaction-timeout')),timeoutMs)})])}
   catch(error){ctx.cancelled=true;disarm(p,error.message);if(ctx.reserved||error.message==='transaction-timeout'){try{persist(ctx,'unknown')}catch{}}return{...denied(error.message),recovery:ctx.reserved?'reconcile-native-state-before-resume':'re-enable-after-review'}}
   finally{clearTimeout(timer);guard.revoke();s.inFlight=null;busy=false;}
  });
 };
 return{arm,disarm,status,execute,reserveNativeCache,beginNativeTransaction,recordNativeOutcome};
};
