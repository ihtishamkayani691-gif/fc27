'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {chromium}=require('playwright');
const extension=path.resolve(process.argv[2]),reportPath=path.resolve(process.argv[3]);
const report={liveEA:false,marketRequestsExecuted:0,checks:[],errors:[]};
const check=(name,pass,detail)=>{report.checks.push({name,passed:!!pass,detail});if(!pass)throw Error(name)};
(async()=>{let context;const profile=fs.mkdtempSync(path.join(os.tmpdir(),'fc-local-register-'));
try{
 context=await chromium.launchPersistentContext(profile,{executablePath:process.env.CHROMIUM_PATH,headless:true,ignoreDefaultArgs:['--disable-extensions'],args:['--enable-unsafe-extension-debugging','--disable-background-networking','--disable-component-update','--disable-sync','--proxy-server=http://127.0.0.1:9']});
 report.browser=context.browser().version();context.on('console',m=>{if(m.type()==='error')report.errors.push(m.text().slice(0,500))});
 const cdp=await context.browser().newBrowserCDPSession();
 // Supported debugging API; an explicit administrator rejection is fatal.
 const loaded=await cdp.send('Extensions.loadUnpacked',{path:extension});report.extensionId=loaded.id;
 const worker=context.serviceWorkers().find(w=>w.url().includes(loaded.id))||await context.waitForEvent('serviceworker',{predicate:w=>w.url().includes(loaded.id),timeout:15000});
 worker.on('close',()=>{});
 report.workerUrl=worker.url();
 const inspector=await context.newPage();await inspector.goto('chrome-extension://'+loaded.id+'/manifest.json');
 const runtime=await inspector.evaluate(()=>({id:chrome.runtime.id,name:chrome.runtime.getManifest().name,version:chrome.runtime.getManifest().version}));report.runtime=runtime;
 const manifest=JSON.parse(fs.readFileSync(path.join(extension,'manifest.json')));
 check('unpacked worker registered with expected identity',runtime.id===loaded.id&&runtime.name===manifest.name&&runtime.version===manifest.version,runtime);
 const session=await cdp.send('Target.getTargets');report.targets=session.targetInfos.filter(t=>t.url.startsWith('chrome-extension://')).map(({type,url})=>({type,url}));
 check('CDP exposes extension service worker',report.targets.some(t=>t.type==='service_worker'));
 const workerSession=await context.newCDPSession(await context.newPage());await workerSession.detach();
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('chrome-extension://'+loaded.id+'/manifest.json');
 check('installed extension assets are readable',(await page.locator('body').innerText()).includes(manifest.name));
 await page.goto('chrome-extension://'+loaded.id+'/offline-test.html');
 await page.waitForFunction(()=>document.documentElement.dataset.testState==='passed',{timeout:10000});
 const integration=await page.evaluate(()=>globalThis.__fcInstalledIntegrationResult);report.installedIntegration=integration;
 check('installed extension runs v8 integration checks',integration.checks.length>=7&&integration.checks.every(c=>c.passed));
 check('installed integration renders through production Trader logger',(await page.locator('.process-log-messages .message').innerText()).includes('[v8 OFFLINE]'));
 await page.screenshot({path:reportPath.replace(/\.json$/i,'.png'),fullPage:true});
 check('no page runtime errors',report.errors.length===0);report.passed=true;
}catch(error){report.passed=false;report.error=error.message;process.exitCode=1}
finally{if(context)await context.close();fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));fs.rmSync(profile,{recursive:true,force:true});}
})();
