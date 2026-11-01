// Exact production webpack module 65757 from inspected FC Enhancer v7.2.
module.exports = (e,t,n)=>{
Object.defineProperty(t,'__esModule',{value:true});
const api=n(13808),pre=n(1098),post=n(4364),errors=n(31679),fresh=n(99007);
t.searchMarketBG=async(criteria,page)=>{
 const isFresh=fresh.isFresh(criteria);
 const record=value=>{if(isFresh)fresh.record(criteria,value)};
 const before=await pre.runPreSearchMiddlewares(criteria);
 if(!before.response){record({kind:'pre-search-blocked'});return}
 const result=isFresh?await fresh.capture(criteria,()=>api.searchTransferMarket(criteria,page)):await api.searchTransferMarket(criteria,page);
 if(result.success===false||result.error!=null){
  record({kind:'service-error',status:typeof result.error==='number'?result.error:undefined});
  await errors.runErrorSearchMiddlewares(result.error);return;
 }
 if(!Array.isArray(result.data?.items)){record({kind:'malformed-response'});return}
 const items=isFresh?fresh.raw(criteria,result.data.items):result.data.items;
 if(isFresh)fresh.setEligible(criteria,result.data.items);
 const after=await post.runPostSearchMiddlewares(items,criteria);
 if(!after.response){record({kind:'post-search-blocked',rawCount:items.length});return}
 record({kind:'success',rawCount:items.length,endOfList:typeof result.data.endOfList==='boolean'?result.data.endOfList:undefined});return items;
};
};
