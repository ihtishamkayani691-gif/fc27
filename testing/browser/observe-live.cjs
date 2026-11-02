'use strict';
const fs=require('node:fs'),path=require('node:path'),{withServer}=require('./mcp-client.cjs');
const endpoint='http://127.0.0.1:9223';
function value(result){const text=result.content.filter(c=>c.type==='text').map(c=>c.text).join('\n'),match=text.match(/```json\s*([\s\S]*?)\s*```/);if(!match)throw Error('Expected sanitized JSON evaluation');return JSON.parse(match[1]);}
(async()=>{
 const report={scope:'authenticated-native-Trader-discovery-validation',buyingEnabled:false,realPurchasingAuthorized:false,observations:[],logs:[]};const seen=new Set();
 try{
  await withServer('playwright',endpoint,async c=>{await c.call('browser_click',{target:'role=button[name=/^Start/]',element:'Start bounded discovery-only validation'});});
  await withServer('chrome-devtools',endpoint,async c=>{
   const deadline=Date.now()+Math.min(600,Math.max(15,Number(process.argv[2])||45))*1000,maxIntents=Math.min(60,Math.max(1,Number(process.argv[3])||12));
   while(Date.now()<deadline){
    const sample=value(await c.call('evaluate_script',{pageId:1,waitForStableDom:false,function:`()=>({v8:globalThis[Symbol.for('fcEnhancer.v8.validation')]?.inspect(),nativeBidInterlockInstalled:typeof services!=='undefined'&&globalThis[Symbol.for('fcEnhancer.v8.executionGuard')]?.isServiceBlocked?.(services.Item)===true,blockedMutationAttempts:globalThis[Symbol.for('fcEnhancer.v8.executionGuard')]?.blockedCount(),logs:[...document.querySelectorAll('.process-log-messages .message')].map(e=>e.textContent).filter(t=>t.startsWith('[v8')).slice(-80)})`}));
    if(report.observations.at(-1)?.planner?.intentsIssued!==sample.v8?.planner?.intentsIssued||report.observations.at(-1)?.planner?.pendingIntentId!==sample.v8?.planner?.pendingIntentId||report.observations.at(-1)?.running!==sample.v8?.running)report.observations.push({running:sample.v8?.running,criteria:sample.v8?.criteria,maximum:sample.v8?.maximum,planner:sample.v8?.planner,nativeBidInterlockInstalled:sample.nativeBidInterlockInstalled,blockedMutationAttempts:sample.blockedMutationAttempts});
    for(const line of sample.logs)if(!seen.has(line)){seen.add(line);report.logs.push(line);}
    if(process.argv.includes('--stop-on-candidate')&&sample.logs.some(line=>line.includes('priceEligible=true')&&line.includes('nativeSafety=pass'))){report.stopReason='native-safety-passed-fresh-candidate';break;}
    if(!sample.v8?.running||sample.v8?.planner?.intentsIssued>=maxIntents&&sample.v8?.planner?.pendingIntentId===null)break;
    await new Promise(r=>setTimeout(r,2000));
   }
  });
 }catch(error){report.error=error.message;process.exitCode=1}
 finally{
  try{await withServer('playwright',endpoint,async c=>{await c.call('browser_click',{target:'role=button[name=/^Stop/]',element:'Stop bounded validation'});});report.stopped=true}catch(error){report.stopError=error.message;process.exitCode=1}
  fs.writeFileSync(path.join(__dirname,'LIVE_V8_RESULTS.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 }
})();
