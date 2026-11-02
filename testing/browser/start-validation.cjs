'use strict';
// User performs EA authentication directly. Never log cookies, tokens or bodies.
const {chromium}=require('playwright'),path=require('node:path');
(async()=>{
 const context=await chromium.launchPersistentContext(path.resolve(__dirname,'../../.local/ea-validation-profile'),{
  executablePath:process.env.CHROMIUM_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:false,
  ignoreDefaultArgs:['--disable-extensions'],
  args:['--enable-unsafe-extension-debugging','--remote-debugging-address=127.0.0.1','--remote-debugging-port=9223','--disable-component-update','--disable-sync']
 });
 context.on('page',page=>page.on('dialog',()=>{}));
 const page=context.pages()[0]||await context.newPage();page.on('dialog',()=>{});
 await page.goto('https://www.ea.com/ea-sports-fc/ultimate-team/web-app/',{waitUntil:'domcontentloaded',timeout:60000});
 console.log(JSON.stringify({ready:true,title:await page.title(),origin:new URL(page.url()).origin,debugger:'http://127.0.0.1:9223',extensionLoaded:false,marketAutomationStarted:false}));
 context.on('close',()=>process.exit(0));
 process.on('SIGINT',async()=>{await context.close();process.exit(0)});
})().catch(e=>{console.error(e.message);process.exitCode=1});
