'use strict';
// The TEST build contains no capability for authorizing real execution.
module.exports=function(module,exports,require){
 const native=require(7520),policy=require(99014).policy;
 exports.preview=async(item,{maximum,processor})=>{
  const auction=item?.getAuctionData?.(),price=auction?.buyNowPrice;
  if(!Number.isSafeInteger(maximum)||maximum<=0||!Number.isSafeInteger(price)||price<=0||price>maximum)return{response:false,reason:'fixed-snipe-maximum',purchaseAuthorized:false};
  if(processor.cancellationToken?.isCancelled||!processor.isStarted)return{response:false,reason:'cancelled',purchaseAuthorized:false};
  try{
   const result=await native.previewBidMiddlewares(item,false,maximum);
   return{response:result?.response===true,reason:result?.response===true?'native-middleware-preview-passed':'native-middleware-rejected',purchaseAuthorized:false};
  }catch{return{response:false,reason:'native-middleware-unavailable',purchaseAuthorized:false};}
 };
 exports.execute=async(item,{maximum,processor,orchestrator}={})=>{
  const denied=reason=>({response:false,reason,purchaseAuthorized:false});
  if(policy.validationComplete!==true||policy.purchaseEnabled!==true||policy.userAuthorized!==true)return denied('TEST-build-real-purchasing-disabled');
  const token=processor?.cancellationToken,settings=processor?.traderSettings,configured=settings?.searchSetting?.v8SnipeMaximum,price=item?.getAuctionData?.()?.buyNowPrice,nativeMaximum=settings?.buySetting?.buyPrice;
  if(!processor?.isStarted||!token||token.isCancelled)return denied('cancelled');
  if(!Number.isSafeInteger(maximum)||maximum<=0||!Number.isSafeInteger(configured)||configured<=0||!Number.isSafeInteger(price)||price<=0)return denied('invalid-fixed-snipe-maximum-or-price');
  if(nativeMaximum!=null&&nativeMaximum!==0&&(!Number.isSafeInteger(nativeMaximum)||nativeMaximum<0))return denied('invalid-native-buy-maximum');
  if(price>Math.min(maximum,configured,nativeMaximum>0?nativeMaximum:configured))return denied('fixed-snipe-maximum');
  if(typeof orchestrator?.handleTransferResults!=='function'||typeof orchestrator?.handleWonItems!=='function')return denied('native-orchestrator-unavailable');
  // The original orchestrator retains its full safety and native purchase flow.
  // Tests inject authorized policy plus mocked native transaction terminals.
  const won=await orchestrator.handleTransferResults([item],settings.safeSetting,token);
  if(!token.isCancelled&&processor.cancellationToken===token&&won?.length)await orchestrator.handleWonItems(won);
  return{response:true,purchaseAuthorized:true,nativeFlowInvoked:true,wonCount:won?.length||0};
 };
};
