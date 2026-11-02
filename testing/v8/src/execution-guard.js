// Runs in MAIN world at document_start, before the enhancer application loader.
(()=>{
 'use strict';
 const symbol=Symbol.for('fcEnhancer.v8.executionGuard');if(globalThis[symbol])return;
 let blocked=0;const isBlocked=(url,method)=>{
  try{return !['GET','HEAD','OPTIONS'].includes(String(method||'GET').toUpperCase())&&/\/(?:trade\/[^/]+\/bid|auctionhouse)(?:\/|$)/i.test(new URL(String(url),globalThis.location?.href||'https://www.ea.com/').pathname)}catch{return false}
 };
 const deny=()=>{blocked++;throw Error('FC v8 TEST: real buying, bidding and listing mutations are disabled')};
 const protectedServices=new WeakSet();
 const installServices=(...targets)=>{
  try{for(const target of targets.filter(Boolean)){if(protectedServices.has(target))continue;Object.defineProperty(target,'bid',{get:()=>deny,set:()=>{},configurable:false});protectedServices.add(target);}return targets.some(Boolean)}catch{return false}
 };
 if(typeof globalThis.fetch==='function'){
  const original=globalThis.fetch;
  globalThis.fetch=function(input,init){if(isBlocked(input?.url??input,init?.method??input?.method))return Promise.reject((()=>{try{deny()}catch(error){return error}})());return original.apply(this,arguments)};
 }
 if(typeof XMLHttpRequest!=='undefined'){
  const prototype=XMLHttpRequest.prototype,open=prototype.open,send=prototype.send,requests=new WeakMap();
  prototype.open=function(method,url){requests.set(this,{method,url});return open.apply(this,arguments)};
  prototype.send=function(){const request=requests.get(this);if(request&&isBlocked(request.url,request.method))deny();return send.apply(this,arguments)};
 }
 Object.defineProperty(globalThis,symbol,{value:Object.freeze({isInstalled:()=>true,blockedCount:()=>blocked,installServices,isServiceBlocked:target=>protectedServices.has(target)&&target.bid===deny,realPurchasingEnabled:false}),configurable:false,writable:false});
})();
