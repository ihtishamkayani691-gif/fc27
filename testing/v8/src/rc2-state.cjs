'use strict';
exports.resolveNativeItem=(repository,itemId,tradeId)=>{
 if(!repository||itemId==null)return null;
 const matches=item=>item&&String(item.id)===String(itemId)&&item.getAuctionData?.()?.tradeId===tradeId;
 for(const name of ['unassigned','transfer']){try{const item=repository[name]?.get?.(itemId);if(matches(item))return item}catch{}}
 for(const method of ['getUnassignedItems','getTransferItems','getWatchedItems']){try{const items=repository[method]?.();if(Array.isArray(items)){const item=items.find(matches);if(item)return item}}catch{}}
 return null;
};
exports.hydrateNativeItem=async({repository,service,observableToPromise,timeoutMs=1200},itemId,tradeId)=>{
 let item=exports.resolveNativeItem(repository,itemId,tradeId);if(item)return item;
 if(itemId==null||typeof observableToPromise!=='function')return null;
 for(const method of ['requestUnassignedItems','requestWatchedItems','requestTransferItems']){
  if(typeof service?.[method]!=='function')continue;let timer;
  try{const response=await Promise.race([observableToPromise(service[method]()),new Promise(resolve=>{timer=setTimeout(()=>resolve(null),timeoutMs)})]);
   if(response?.success!==true)return null;
   item=exports.resolveNativeItem(repository,itemId,tradeId);if(item)return item;
   const items=response.data?.items;if(Array.isArray(items)){const exact=items.find(value=>String(value?.id)===String(itemId)&&value?.getAuctionData?.()?.tradeId===tradeId);if(exact)return exact;}
  }catch{return null}finally{clearTimeout(timer)}
 }
 return null;
};
exports.createStateReader=({native,readBalance,resolveItem=()=>null,timeoutMs=5000})=>async ctx=>{
 const unknown={state:'unknown',tradeId:ctx.id,inventoryOwned:null,balance:undefined};let timer;
 const read=async()=>{
  try{unknown.balance=readBalance();const item=ctx.item||await resolveItem(ctx.itemId,ctx.id);if(!item||typeof native.refreshAuctions!=='function')return unknown;
   const response=await native.refreshAuctions([item]);if(response?.success!==true)return unknown;
   let confirmed;
   if(Array.isArray(response.data?.items)){const matches=response.data.items.filter(candidate=>candidate?.getAuctionData?.()?.tradeId===ctx.id);if(matches.length!==1)return unknown;confirmed=matches[0];}
   else if(Array.isArray(response.data?.itemIds)&&response.data.itemIds.length===1&&item.id!=null&&String(response.data.itemIds[0])===String(item.id)&&item.getAuctionData?.()?.tradeId===ctx.id){confirmed=item;}
   else return unknown;
   const auction=confirmed.getAuctionData();if(ctx.itemId!=null&&String(confirmed.id)!==String(ctx.itemId)||ctx.item?.id!=null&&String(confirmed.id)!==String(ctx.item.id))return unknown;
   const balance=readBalance();if(!Number.isSafeInteger(balance)||balance<0||typeof auction.isWon!=='function')return unknown;
   if(auction.isWon()===true)return{state:'won',tradeId:ctx.id,inventoryOwned:true,balance,item:confirmed};
   if(auction.isWon()===false&&((typeof auction.isExpired==='function'&&auction.isExpired()===true)||(typeof auction.isClosedTrade==='function'&&auction.isClosedTrade()===true)))return{state:'lost',tradeId:ctx.id,inventoryOwned:false,balance,item:confirmed};
   return{...unknown,balance};
  }catch{return unknown}
 };
 try{return await Promise.race([read(),new Promise(resolve=>{timer=setTimeout(()=>resolve(unknown),timeoutMs)})])}finally{clearTimeout(timer)}
};
