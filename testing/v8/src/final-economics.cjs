'use strict';
const positive=n=>Number.isSafeInteger(n)&&n>0,nonnegative=n=>Number.isSafeInteger(n)&&n>=0;
exports.checkEconomics=({price,definitionId,quote,now=Date.now(),minimumProfit,additionalCosts,maximumPerPurchase,maxAgeMs=15000}={})=>{
 const deny=reason=>({response:false,reason});
 if(!positive(price)||!positive(maximumPerPurchase)||!positive(minimumProfit)||!nonnegative(additionalCosts))return deny('explicit-profit-and-cost-limits-required');
 if(price>maximumPerPurchase)return deny('per-purchase-maximum');
 if(!quote||quote.source!=='native-live-asks'||quote.definitionId!==definitionId||quote.rarity!==151||!positive(quote.price)||!Number.isSafeInteger(quote.sampleCount)||quote.sampleCount<3)return deny('verified-price-evidence-required');
 if(!Number.isFinite(now)||!Number.isFinite(quote.observedAt)||quote.observedAt>now||now-quote.observedAt>maxAgeMs)return deny('price-evidence-stale');
 const fee=Math.ceil(quote.price*500/10000),netProceeds=quote.price-fee,netProfit=netProceeds-price-additionalCosts;
 if(netProfit<minimumProfit)return{...deny('minimum-net-profit-not-met'),fee,netProceeds,netProfit};
 return{response:true,fee,netProceeds,netProfit,referencePrice:quote.price,source:quote.source,ageMs:now-quote.observedAt};
};
