'use strict';
const {chromium}=require('playwright'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
(async()=>{
 const context=await chromium.launchPersistentContext(path.join(root,'.local/offline-debug-profile'),{
  executablePath:process.env.CHROMIUM_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true,
  ignoreDefaultArgs:['--disable-extensions'],
  args:['--enable-unsafe-extension-debugging','--remote-debugging-address=127.0.0.1','--remote-debugging-port=9222','--disable-background-networking','--disable-component-update','--disable-sync','--proxy-server=http://127.0.0.1:9']
 });
 context.on('page',page=>page.route('**/*',route=>['http:','https:'].includes(new URL(route.request().url()).protocol)?route.abort('blockedbyclient'):route.continue()));
 const cdp=await context.browser().newBrowserCDPSession();
 const extension=await cdp.send('Extensions.loadUnpacked',{path:path.join(root,'.local/v8-offline-extension')});
 console.log(JSON.stringify({ready:true,endpoint:'http://127.0.0.1:9222',extensionId:extension.id,profile:'isolated offline development profile',network:'HTTP(S) blocked by routing and dead proxy',pid:process.pid}));
 process.on('SIGINT',async()=>{await context.close();process.exit(0)});
 process.on('SIGTERM',async()=>{await context.close();process.exit(0)});
 context.on('close',()=>process.exit(0));
})().catch(error=>{console.error(error.message);process.exitCode=1});
