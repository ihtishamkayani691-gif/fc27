'use strict';
module.exports=function(){
 const logContainer=document.querySelector('.process-log-messages');const delayed=new URL(location.href).searchParams.has('delayed');if(delayed)logContainer.remove();
 const nativeStorage=globalThis.localStorage;const journal={get:key=>nativeStorage.getItem(key),set:(key,value)=>nativeStorage.setItem(key,value)};
 globalThis.__fcRenderLog=text=>{const row=document.createElement('div');row.className='message';row.textContent=text;logContainer.appendChild(row)};
 const base=Number(new URL(location.href).searchParams.get('run'))||2000;const h=globalThis.__fcRc2CreateSession({...(new URL(location.href).searchParams.get('scenario')==='market-error'?{marketError:{at:1,code:503}}:{}),bundle:'installed-UNIVERSAL',journal,followSelectedRarity:true,driveTimer:new URL(location.href).searchParams.has('nativeTimer'),metadata:()=>globalThis.__fcUniversalNativeRarities,pages:[[{id:base+1,player:201},{id:base+2,player:202,outcome:'sold'},{id:base+3,player:203,profitable:false},{id:base+4,price:901}],[{id:base+5,player:205}]]});
 globalThis.__fcRc2Session=h;
 h.p.setControllerInstance(h.p.controllerInstance);if(delayed)queueMicrotask(()=>document.body.appendChild(logContainer));
 const result=document.getElementById('simulation-result');const paint=()=>{const s=h.summary();result.textContent='Simulated coins '+s.coins+' · Inventory '+s.inventory.join(', ')+' · Attempts '+s.attempts;globalThis.__fcRc2Result=s;};
 document.getElementById('fixture-start').addEventListener('click',async()=>{try{await h.start({enable:false});for(let i=0;i<2&&h.p.isStarted;i++)await h.cycle();paint()}catch(error){console.error(error.message);result.textContent=error.message}});
 document.getElementById('fixture-stop').addEventListener('click',()=>{h.stop();paint()});
 const maximum=document.getElementById('fixture-maximum');maximum.addEventListener('change',()=>{h.settings.searchSetting.v8SnipeMaximum=Number(maximum.value);h.bridge.disarm(h.p,'configuration-changed');h.get(99011).refreshStatus(h.p);paint()});
 paint();document.documentElement.dataset.universalTestState='ready';
};
