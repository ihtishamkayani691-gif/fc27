'use strict';
const fs=require('node:fs'),path=require('node:path'),{withServer}=require('./mcp-client.cjs');
const endpoint='http://127.0.0.1:9223';
function value(result){const text=result.content.filter(c=>c.type==='text').map(c=>c.text).join('\n'),match=text.match(/```json\s*([\s\S]*?)\s*```/);if(!match)throw Error('Expected sanitized JSON evaluation');return JSON.parse(match[1]);}
(async()=>{
 const report={scope:'authenticated-native-Trader-discovery-validation',startedAt:new Date().toISOString(),validationOnly:true,buyingEnabled:false,realPurchasingAuthorized:false,observations:[],logs:[]};const seen=new Set();
 try{
  // Existing Trader messages survive Stop/Start. They must never end a new test.
  await withServer('chrome-devtools',endpoint,async c=>{const prior=value(await c.call('evaluate_script',{pageId:1,waitForStableDom:false,function:`()=>({v8:globalThis[Symbol.for('fcEnhancer.v8.validation')]?.inspect(),resourceBaseline:globalThis.__fcFinalResourceBaseline=performance.now(),logs:[...document.querySelectorAll('.process-log-messages .message')].map(e=>e.textContent).filter(t=>t.startsWith('[v8'))})`}));if(process.env.FC_EXPECTED_MAXIMUM&&prior.v8?.maximum!==Number(process.env.FC_EXPECTED_MAXIMUM))throw Error('Saved test ceiling differs; refusing to start discovery');for(const line of prior.logs)seen.add(line);});
  await withServer('playwright',endpoint,async c=>{await c.call('browser_click',{target:'role=button[name=/^Start/]',element:'Start bounded discovery-only validation'});});
  await withServer('chrome-devtools',endpoint,async c=>{
   const deadline=Date.now()+Math.min(600,Math.max(15,Number(process.argv[2])||45))*1000,maxIntents=Math.min(60,Math.max(1,Number(process.argv[3])||12));
   while(Date.now()<deadline){
    const sample=value(await c.call('evaluate_script',{pageId:1,waitForStableDom:false,function:`()=>({v8:globalThis[Symbol.for('fcEnhancer.v8.validation')]?.inspect(),nativeBidInterlockInstalled:typeof services!=='undefined'&&globalThis[Symbol.for('fcEnhancer.v8.executionGuard')]?.isServiceBlocked?.(services.Item)===true,blockedMutationAttempts:globalThis[Symbol.for('fcEnhancer.v8.executionGuard')]?.blockedCount(),logs:[...document.querySelectorAll('.process-log-messages .message')].map(e=>e.textContent).filter(t=>t.startsWith('[v8')).slice(-80)})`}));
    if(report.observations.at(-1)?.planner?.intentsIssued!==sample.v8?.planner?.intentsIssued||report.observations.at(-1)?.planner?.pendingIntentId!==sample.v8?.planner?.pendingIntentId||report.observations.at(-1)?.running!==sample.v8?.running)report.observations.push({at:new Date().toISOString(),elapsedMs:Date.now()-Date.parse(report.startedAt),running:sample.v8?.running,criteria:sample.v8?.criteria,maximum:sample.v8?.maximum,status:sample.v8?.status,planner:sample.v8?.planner,nativeBidInterlockInstalled:sample.nativeBidInterlockInstalled,blockedMutationAttempts:sample.blockedMutationAttempts});
    const newLogs=sample.logs.filter(line=>!seen.has(line));for(const line of newLogs){seen.add(line);report.logs.push(line);}
    if(process.argv.includes('--stop-on-candidate')&&newLogs.some(line=>line.includes('priceEligible=true')&&line.includes('nativeSafety=pass'))){report.stopReason='native-safety-passed-fresh-candidate';break;}
    if(!sample.v8?.running||sample.v8?.planner?.intentsIssued>=maxIntents&&sample.v8?.planner?.pendingIntentId===null)break;
    await new Promise(r=>setTimeout(r,2000));
   }
  });
 }catch(error){report.error=error.message;process.exitCode=1}
 finally{
  try{await withServer('playwright',endpoint,async c=>{await c.call('browser_click',{target:'role=button[name=/^Stop/]',element:'Stop bounded validation'});});report.stopped=true}catch(error){report.stopError=error.message;process.exitCode=1}
  try{await withServer('chrome-devtools',endpoint,async c=>{report.finalState=value(await c.call('evaluate_script',{pageId:1,waitForStableDom:false,function:`()=>({v8:globalThis[Symbol.for('fcEnhancer.v8.validation')]?.inspect(),panel:document.querySelector('.fc-v8-trader-status')?.innerText,blockedMutationAttempts:globalThis[Symbol.for('fcEnhancer.v8.executionGuard')]?.blockedCount()})`}));if(report.finalState.v8?.running)throw Error('Trader did not stop');});}catch(error){report.stopVerificationError=error.message;process.exitCode=1}
  try{await withServer('chrome-devtools',endpoint,async c=>{report.nativeSearchResources=value(await c.call('evaluate_script',{pageId:1,waitForStableDom:false,function:"()=>performance.getEntriesByType('resource').filter(r=>r.name.includes('/transfermarket')&&r.startTime>=globalThis.__fcFinalResourceBaseline).map(r=>({startMs:r.startTime-globalThis.__fcFinalResourceBaseline,elapsedMs:r.duration}))"}));});}catch(error){report.timingError=error.message}report.completedAt=new Date().toISOString();fs.writeFileSync(process.env.FC_LIVE_REPORT||path.join(__dirname,'LIVE_V8_RESULTS.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 }
})();
