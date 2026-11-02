'use strict';
// Factory 99008: explicit offline replay only. No scheduler or request adapter.
module.exports=function(module,exports,require){
 const {PriceScopePlanner}=require(99009),safety=require(99010),{Logger}=require(51477);
 const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 exports.OfflineIntegration=class {
  constructor(options){this.planner=new PriceScopePlanner(options);this.seen=new Set();this.pending=null;this.busy=false;this.stopped=false;this.maxSeen=50000;}
  next(){if(this.stopped)return null;const intent=this.planner.next();this.pending=intent?.id?intent:null;return intent;}
  stop(){this.stopped=true;this.pending=null;this.planner.stop();}
  async replay({intentId,items,settings,data,safetyOptions={}}){
   if(this.stopped)throw Error('offline-session-stopped');
   if(this.busy||!this.pending||this.pending.id!==intentId)throw Error('offline-intent-mismatch-or-in-flight');
   if(!Array.isArray(items))throw Error('offline-items-required');
   this.busy=true;const intent=this.pending,records=[];
   try {
    for(const item of items){
     if(this.stopped)throw Error('offline-session-stopped');
     const a=item?.getAuctionData?.(),id=a?.tradeId;
     if(typeof id!=='string'||!/^\d+$/.test(id))throw Error('exact-decimal-trade-id-required');
     if(this.seen.has(id))continue;
     if(this.seen.size>=this.maxSeen){this.stop();throw Error('offline-dedup-capacity-reached');}
     const result=await safety.evaluate(item,settings,data,{...safetyOptions,fixedMaximum:this.planner.effectiveMaximum,nativeMaximum:intent.criteria.maxBuy,allowPricingLookup:false});
     if(this.stopped)throw Error('offline-session-stopped');
     this.seen.add(id);
     const row={tradeId:id,safety:result,purchaseAuthorized:false,buyingDisabled:true};records.push(row);
     Logger.writeToLog('[v8 OFFLINE] Player: '+escape(item.getStaticData?.()?.name??'Synthetic player')+' Trade ID: '+id+' Buy Now: '+escape(a.buyNowPrice)+' Remaining: '+escape(a.expires)+' Native safety: '+escape(result.status)+' buying=DISABLED');
    }
    const diagnostics=this.planner.observe({intentId,acceptedScope:true,rawCount:items.length,freshCount:records.filter(r=>r.safety.status==='pass').length,newFreshCount:records.filter(r=>r.safety.status==='pass').length});
    this.pending=null;
    return {scope:'explicit-offline-native-item-replay',records,diagnostics,purchaseAuthorized:false,marketRequestsExecuted:0,liveDiscoveryProven:false};
   }catch(error){this.stop();throw error;}finally{this.busy=false;}
  }
 };
};
