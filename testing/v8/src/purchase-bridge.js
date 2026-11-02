'use strict';
module.exports=function(module,exports,require){
 const native=require(7520),policy=require(99014).policy,{checkPreflight}=require(99016),states=new WeakMap(),outcomes=new WeakMap();
 exports.beginNativeTransaction=item=>outcomes.set(item,'submitted');
 exports.recordNativeOutcome=(item,success)=>outcomes.set(item,success===true?'won':'unknown');
 const balanceFor=options=>options.balance!==undefined?options.balance:typeof services!=='undefined'?services.User?.getUser()?.coins?.amount:undefined;
 const facts=(item,options)=>({...options,item,settings:options.processor?.traderSettings,data:options.processor?.traderData,balance:balanceFor(options),attemptsInSearch:options.perSearch?.attempts??0});
 const active=(processor,token)=>processor?.isStarted===true&&token&&!token.isCancelled&&processor.cancellationToken===token;
 exports.preview=async(item,options)=>{
  const {processor,maximum}=options,token=processor?.cancellationToken;
  if(!active(processor,token))return{response:false,reason:'cancelled',purchaseAuthorized:false};
  let checked;try{checked=checkPreflight(facts(item,options))}catch{return{response:false,reason:'native-state-unavailable',purchaseAuthorized:false}}
  if(!checked.response)return{...checked,purchaseAuthorized:false};
  try{
   const result=await native.previewBidMiddlewares(item,false,maximum);
   if(!active(processor,token))return{response:false,reason:'cancelled',purchaseAuthorized:false};
   const after=checkPreflight(facts(item,options));if(!after.response)return{...after,purchaseAuthorized:false};
   return{response:result?.response===true,reason:result?.response===true?'native-middleware-preview-passed':'native-middleware-rejected',purchaseAuthorized:false,pricingStatus:processor.traderSettings.buySetting.findBuyPrice?'native-price-limit-checked':'profitability-not-configured'};
  }catch{return{response:false,reason:'native-middleware-unavailable',purchaseAuthorized:false};}
 };
 exports.execute=async(item,options={})=>{
  const denied=reason=>({response:false,reason,purchaseAuthorized:false});
  if(policy.validationComplete!==true||policy.purchaseEnabled!==true||policy.userAuthorized!==true)return denied('TEST-build-real-purchasing-disabled');
  const {processor,orchestrator,perSearch}=options,token=processor?.cancellationToken;
  if(!active(processor,token))return denied('cancelled');
  if(!perSearch||!Number.isSafeInteger(perSearch.attempts)||perSearch.attempts<0)return denied('per-search-context-required');
  let state=states.get(processor);if(!state){state={attempted:new Set(),inFlight:false,reconciliationRequired:false};states.set(processor,state);}
  if(state.reconciliationRequired)return denied('reconciliation-required');
  if(state.inFlight)return denied('transaction-in-flight');
  let checked;try{checked=checkPreflight(facts(item,options))}catch{return denied('native-state-unavailable')}
  if(!checked.response)return denied(checked.reason);
  if(state.attempted.has(checked.tradeId))return denied('duplicate-trade-id');
  if(state.attempted.size>=50000)return denied('transaction-history-capacity');
  if(typeof orchestrator?.handleTransferResults!=='function'||typeof orchestrator?.handleWonItems!=='function')return denied('native-orchestrator-unavailable');
  state.inFlight=true;state.attempted.add(checked.tradeId);perSearch.attempts++;
  outcomes.set(item,'not-submitted');
  let won,stage='transaction';
  try{
   won=await orchestrator.handleTransferResults([item],processor.traderSettings.safeSetting,token);
   const outcome=outcomes.get(item);
   if(outcome==='submitted'||outcome==='unknown'||(outcome==='won'&&!won?.length)||(won?.length&&outcome!=='won'))throw Error('Unknown native transaction outcome');
   stage='post-purchase';
   if(won?.length){if(!active(processor,token))throw Error('Cancelled after purchase');await orchestrator.handleWonItems(won);}
   return{response:!!won?.length,purchaseAuthorized:true,nativeFlowInvoked:true,wonCount:won?.length||0,reason:won?.length?'native-flow-completed':'native-flow-no-win'};
  }catch{
   state.reconciliationRequired=true;
   return{response:false,purchaseAuthorized:true,nativeFlowInvoked:true,reason:stage==='transaction'?'transaction-outcome-unknown':'post-purchase-recovery-required',recovery:'reconcile-native-state-before-resume'};
  }finally{state.inFlight=false;}
 };
};
