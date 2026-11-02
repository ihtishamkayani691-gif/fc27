'use strict';
const integer=value=>Number.isSafeInteger(value)&&value>=0,positive=value=>integer(value)&&value>0;
exports.checkPreflight=function({item,maximum,settings={},data={},balance,observedAt,observedRemaining,now=Date.now(),budgetRemaining,attemptsInSearch=0,requireProfitability=false}={}){
 const deny=reason=>({response:false,reason});
 let auction;try{auction=item?.getAuctionData?.()}catch{return deny('listing-state-unavailable')}
 const price=auction?.buyNowPrice,id=auction?.tradeId,buy=settings.buySetting||{},safe=settings.safeSetting||{};
 if(typeof id!=='string'||!/^\d+$/.test(id))return deny('invalid-trade-id');
 if(!positive(maximum)||!positive(price))return deny('invalid-price-or-maximum');
 let ceiling=maximum;
 for(const limit of [settings.searchSetting?.v8SnipeMaximum,buy.buyPrice]){if(limit==null||limit===0)continue;if(!positive(limit))return deny('invalid-native-buy-maximum');ceiling=Math.min(ceiling,limit);}
 if(price>ceiling)return deny('fixed-snipe-maximum');
 if(!Number.isFinite(now)||observedAt!==undefined&&(!Number.isFinite(observedAt)||observedAt>now||now-observedAt>15000))return deny('stale-response');
 const seconds=observedRemaining??auction?.expires,remaining=seconds-(observedAt===undefined?0:(now-observedAt)/1000);
 if(typeof seconds!=='number'||!Number.isFinite(seconds)||remaining<3540||remaining>3600)return deny('outside-fresh-window');
 try{if(typeof auction.isExpired!=='function')return deny('listing-state-unavailable');if(auction.isExpired())return deny('expired-listing')}catch{return deny('listing-state-unavailable')}
 if(data.cache?.cachedBids?.has(id))return deny('duplicate-trade-id');
 if(!integer(balance))return deny('balance-unavailable');if(price>balance)return deny('insufficient-coins');
 if(buy.noOfCards!=null&&buy.noOfCards!==0){if(!positive(buy.noOfCards)||!integer(data.stats?.purchasedCardCount))return deny('native-card-budget-unavailable');if(data.stats.purchasedCardCount>=buy.noOfCards)return deny('native-card-budget-reached');}
 const perSearch=safe.maxPurchasesPerSearchRequest??1;
 if(!positive(perSearch)||!integer(attemptsInSearch))return deny('native-per-search-budget-unavailable');if(attemptsInSearch>=perSearch)return deny('native-per-search-budget-reached');
 if(budgetRemaining!==undefined){if(!integer(budgetRemaining))return deny('spend-budget-unavailable');if(price>budgetRemaining)return deny('spend-budget-exceeded');}
 if(requireProfitability&&!buy.findBuyPrice)return deny('profitability-rule-not-configured');
 return{response:true,ceiling,price,tradeId:id,remainingSeconds:remaining};
};
