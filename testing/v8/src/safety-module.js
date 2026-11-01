'use strict';
// Production webpack factory 99010. Never invokes bid, addToCache, or runBidMiddlewares.
module.exports = function(module, exports, require) {
  const checks = [[72316,'checkIfGK'],[93727,'checkIfBasicChemistry'],[39887,'checkIfValidRatingRange'],[10270,'checkIfExpired'],[30804,'checkBuyPrice']];
  const finish=(status,reason,extra={})=>({eligible:status==='pass',status,reason,buyingDisabled:true,purchaseAuthorized:false,fullPurchaseSafety:'pending',...extra});
  exports.evaluate=async function(item,settings,data,options={}) {
    const passed=[];
    try {
      const buy=settings?.buySetting;
      const auction=item?.getAuctionData?.();
      const seconds=Number(auction?.expires), price=Number(auction?.buyNowPrice ?? item?._auction?.buyNowPrice);
      if(!buy || !settings?.searchSetting?.ratingRange || !auction || !item?._auction) return finish('unavailable','missing-native-item-or-settings');
      if(!Number.isFinite(seconds) || seconds<3540 || seconds>3600) return finish('reject','outside-fresh-window');
      if(!Number.isSafeInteger(price)||price<=0) return finish('reject','invalid-buy-now');
      const fixed=Number(options.fixedMaximum);
      if(!Number.isSafeInteger(fixed)||fixed<=0) return finish('unavailable','missing-fixed-snipe-maximum');
      let ceiling=fixed;
      for(const limit of [options.nativeMaximum,buy.buyPrice]) if(limit!==undefined && limit!==null && Number(limit)>0) ceiling=Math.min(ceiling,Number(limit));
      if(buy.findBuyPrice) {
        let dynamic=options.dynamicMaximum;
        if(dynamic===undefined && options.allowPricingLookup===true) dynamic=await require(53799).getRealTimePrice(item,buy.buyPriceSteps,buy.buyPricePercentage);
        if(!Number.isFinite(Number(dynamic))||Number(dynamic)<=0) return finish('unavailable','dynamic-price-unavailable',{ceiling});
        ceiling=Math.min(ceiling,Number(dynamic));
      }
      if(price>ceiling) return finish('reject','above-effective-price-maximum',{ceiling,price});
      if(data?.cache?.cachedBids?.has(item._auction.tradeId)) return finish('reject','native-purchase-cache-duplicate',{ceiling});
      if(buy.skipClubPlayers) {
        if(!options.squadPlayerIds || typeof options.squadPlayerIds.has!=='function') return finish('unavailable','club-ownership-unavailable',{ceiling});
        if(options.squadPlayerIds.has(item.definitionId)) return finish('reject','native-club-player',{ceiling});
      }
      const context={data:item,params:{settings,data,isReBid:false,calculatedPriceToBin:ceiling,calculatedPriceToBid:0},localizer:options.localizer,filterName:data?.cache?.filter?.currentFilter};
      for(const [id,name] of checks) {
        let continued=false;
        await require(id)[name](context,async()=>{continued=true;return {response:true};});
        if(!continued) return finish('reject','native-'+name,{ceiling,passed});
        passed.push(name);
      }
      const balance=Number(options.balance);
      if(options.balance===undefined || !Number.isFinite(balance)||balance<0) return finish('unavailable','balance-unavailable',{ceiling,passed});
      if(price>balance) return finish('reject','insufficient-balance',{ceiling,passed});
      // Discovery eligibility is never an assertion that every native execution guard passed.
      if(options.requireProfitability===true && options.profitabilityVerified!==true) return finish('unavailable','profitability-not-verified',{ceiling,passed,priceAndNativeChecksPassed:true});
      if(options.requireBudget===true && options.budgetVerified!==true) return finish('unavailable','budget-not-verified',{ceiling,passed,priceAndNativeChecksPassed:true});
      return finish('pass','logging-only-safety-checks-passed',{ceiling,passed,profitEvaluation:options.profitabilityVerified===true?'verified':'unverified/not-configured',budgetEvaluation:options.budgetVerified===true?'verified':'unverified/not-configured'});
    } catch(error) { return finish('unavailable','native-safety-check-error',{error:String(error?.message||error)}); }
  };
};
