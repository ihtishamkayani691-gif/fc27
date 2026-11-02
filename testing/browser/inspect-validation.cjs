'use strict';
const {withServer}=require('./mcp-client.cjs');
withServer('chrome-devtools','http://127.0.0.1:9223',async client=>{
 if(process.argv.includes('--install'))console.log(JSON.stringify(await client.call('install_extension',{path:require('node:path').resolve(__dirname,'../../.local/v8-trader-validation')})));
 const result=await client.call('evaluate_script',{pageId:1,waitForStableDom:false,function:`() => ({title:document.title,loginButtonVisible:[...document.querySelectorAll('button')].some(b=>/^(log in|login|sign in)$/i.test(b.textContent.trim())),appNavigationPresent:!!document.querySelector('.ut-navigation-container-view'),nativeServicesAvailable:typeof services!=='undefined',nativeTradeAccessAllowed:typeof services!=='undefined'&&typeof TradeAccessLevel!=='undefined'&&services.User?.getUser()?.tradeAccess===TradeAccessLevel.ALLOWED,ultimateScreamVisible:document.body.innerText.includes('Ultimate Scream'),executionGuardInstalled:!!globalThis[Symbol.for('fcEnhancer.v8.executionGuard')]?.isInstalled(),v8:globalThis[Symbol.for('fcEnhancer.v8.validation')]?.inspect()})`});
 console.log(JSON.stringify(result));
 console.log(JSON.stringify(await client.call('evaluate_script',{pageId:1,waitForStableDom:false,function:`()=>({nativeBidInterlockInstalled:typeof services!=='undefined'&&globalThis[Symbol.for('fcEnhancer.v8.executionGuard')]?.isServiceBlocked?.(services.Item)===true,blockedMutationAttempts:globalThis[Symbol.for('fcEnhancer.v8.executionGuard')]?.blockedCount()})`})));
}).catch(error=>{console.error(error.message);process.exitCode=1});
