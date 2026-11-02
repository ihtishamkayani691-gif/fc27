'use strict';
const fs=require('node:fs'),path=require('node:path'),{withServer}=require('./mcp-client.cjs');
(async()=>{
 const mode=process.argv[2]||'snapshot';
 await withServer('playwright','http://127.0.0.1:9223',async client=>{
  let result;
  if(mode==='reload')result=await client.call('browser_navigate',{url:'https://www.ea.com/ea-sports-fc/ultimate-team/web-app/'});
  else if(mode==='click')result=await client.call('browser_click',{target:process.argv[3],element:process.argv[4]||'FC validation control'});
  else if(mode==='type'){result=await client.call('browser_type',{target:process.argv[3],text:process.argv[4]});await client.call('browser_press_key',{key:'Tab'});}
  else if(mode==='controls')result=await client.call('browser_evaluate',{function:`()=>[...document.querySelectorAll('*')].filter(el=>el.childElementCount===0&&el.textContent.trim().startsWith('v8 Maximum Snipe Price')).map(el=>el.parentElement.outerHTML)`});
  else if(mode==='logs')result=await client.call('browser_evaluate',{function:`()=>({v8:globalThis[Symbol.for('fcEnhancer.v8.validation')]?.inspect(),logs:[...document.querySelectorAll('.process-log-messages .message')].map(e=>e.textContent).slice(-20)})`});
  else if(mode==='saved-filter')result=await client.call('browser_evaluate',{function:`async()=>await new Promise((resolve,reject)=>{const open=indexedDB.open('27_futnext_db');open.onerror=()=>reject(Error('Filter database unavailable'));open.onsuccess=()=>{const db=open.result,request=db.transaction('futnext_ab_settings','readonly').objectStore('futnext_ab_settings').get('V8 SCREAM VALIDATION');request.onsuccess=()=>{const value=request.result;db.close();resolve({criteria:value?.criteria,maximum:value?.baseSetting?.searchSetting?.v8SnipeMaximum})};request.onerror=()=>{db.close();reject(Error('Filter read failed'))}}})`});
  // The launcher's original Playwright connection auto-dismisses native prompts.
  // Supply only this local filter name synchronously, then restore prompt.
  else if(mode==='save'){
   await client.call('browser_evaluate',{function:`()=>{globalThis.__fcValidationOriginalPrompt=window.prompt;window.prompt=()=>{window.prompt=globalThis.__fcValidationOriginalPrompt;return ${JSON.stringify(process.argv[3]||'V8 SCREAM VALIDATION')}};return{localFilterNamePrepared:true}}`});
   try{result=await client.call('browser_click',{target:'role=button[name=/^Save/]',element:'Save local validation filter'});}
   finally{await client.call('browser_evaluate',{function:`()=>{window.prompt=globalThis.__fcValidationOriginalPrompt;delete globalThis.__fcValidationOriginalPrompt;return{promptRestored:true}}`});}
  }
  else result=await client.call('browser_snapshot',{});
  // Only page UI is printed, not network headers, bodies, cookies or storage.
  console.log(JSON.stringify(result));
 });
})().catch(error=>{console.error(error.message);process.exitCode=1});
