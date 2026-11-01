'use strict';
// Offline Chrome extension smoke only. No EA hostname is opened and all HTTP(S)
// traffic is either a fulfilled .invalid fixture or blocked. No account is used.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),vm=require('node:vm');
let chromium;for(const p of ['playwright','/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright']){try{({chromium}=require(p));break}catch{}}
if(!chromium)throw Error('Playwright is required for browser smoke');
const extension=path.resolve(process.argv[2]||'/workspace/fc-enhancer-v72/patched');
const reportPath=path.resolve(process.argv[3]||path.join(__dirname,'SMOKE_RESULTS.json'));
const report={scope:'offline-unpacked-registration-assets-and-loader-contract',liveEA:false,accountUsed:false,marketRequestsExecuted:0,browser:null,checks:[],limitations:[],pageErrors:[],workerErrors:[],blockedExternalRequests:0};
const check=(name,passed,detail)=>{report.checks.push({name,passed,...(detail?{detail}:{} )});if(!passed)throw Error(name+(detail?': '+detail:''))};
function stableId(key){return [...crypto.createHash('sha256').update(Buffer.from(key,'base64')).digest().subarray(0,16)].map(b=>String.fromCharCode(97+(b>>4))+String.fromCharCode(97+(b&15))).join('')}
(async()=>{
 let context,profile;
 try{
 const manifest=JSON.parse(fs.readFileSync(path.join(extension,'manifest.json'),'utf8'));
 check('manifest is Chrome MV3',manifest.manifest_version===3);
 const files=[manifest.background.service_worker,...Object.values(manifest.icons),...manifest.content_scripts.flatMap(s=>s.js),...manifest.web_accessible_resources.flatMap(s=>s.resources)];
 check('all manifest resources exist',files.every(file=>fs.statSync(path.join(extension,file)).isFile()));
 // Test exact content_script code in an isolated fake DOM, without running app assets.
 const appended=[],events=[],chromeMessages=[];
 const fakeHead={appendChild:element=>appended.push(element)};
 const document={head:fakeHead,documentElement:fakeHead,createElement:tag=>({tag,remove(){}}),querySelector:()=>null};
 const window={postMessage(){},addEventListener:name=>events.push(name)};
 const chrome={runtime:{getManifest:()=>manifest,getURL:file=>'chrome-extension://offline-fixture/'+file,onMessage:{addListener:fn=>chromeMessages.push(fn)},sendMessage:()=>Promise.resolve({})}};
 vm.runInNewContext(fs.readFileSync(path.join(extension,'content_script.js'),'utf8'),{window,document,chrome,console},{timeout:1500});
 const scripts=appended.filter(e=>e.tag==='script');
 const expectedAssets=fs.existsSync(path.join(extension,'js/v8-test-guard.js'))?['/js/v8-test-guard.js','/js/index.js','/js/vendor.js','/js/main.js']:['/js/index.js','/js/vendor.js','/js/main.js'];
 check('loader injects expected app assets',scripts.length===expectedAssets.length&&scripts.every((script,i)=>script.src.includes(expectedAssets[i])));
 check('loader uses module index and ordered classic bundles',scripts.find(e=>e.src.includes('/js/index.js')).type==='module'&&scripts.every(e=>e.async===false)&&scripts.filter(e=>!e.src.includes('/js/index.js')).every(e=>e.type==='text/javascript'));
 check('loader registers page and extension message bridges',events.includes('message')&&chromeMessages.length===1);
 profile=fs.mkdtempSync(path.join(os.tmpdir(),'fc-v8-smoke-'));
 context=await chromium.launchPersistentContext(profile,{
  executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,ignoreDefaultArgs:['--disable-extensions'],
  args:['--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--disable-component-update','--disable-sync','--no-first-run','--no-default-browser-check','--proxy-server=http://127.0.0.1:9',`--disable-extensions-except=${extension}`,`--load-extension=${extension}`]
 });
 report.browser=context.browser()?.version()||'Chromium persistent context';
 context.on('console',message=>{if(message.type()==='error'&&message.location().url.startsWith('chrome-extension:'))report.workerErrors.push(message.text().slice(0,300))});
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.hostname==='fc-offline-smoke.invalid')return route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Offline FC smoke</title><main id="offline">No EA account or market requests</main>'});
  if(['http:','https:'].includes(url.protocol)){report.blockedExternalRequests++;return route.abort('blockedbyclient')}
  return route.continue();
 });
 const workers=context.serviceWorkers();
 const worker=workers[0]||await context.waitForEvent('serviceworker',{timeout:15000});
 // BrowserContext console events cover worker logs; Playwright Worker has no console event.
 const workerUrl=new URL(worker.url()),extensionId=workerUrl.hostname;
 check('unpacked extension service worker registered',workerUrl.protocol==='chrome-extension:'&&workerUrl.pathname==='/'+manifest.background.service_worker);
 if(manifest.key)check('stable extension identity matches manifest key',extensionId===stableId(manifest.key));
 const runtime=await worker.evaluate(()=>({manifest:chrome.runtime.getManifest(),id:chrome.runtime.id}));
 check('runtime reports tested manifest version',runtime.manifest.version===manifest.version&&runtime.id===extensionId);
 const page=await context.newPage();page.on('pageerror',error=>report.pageErrors.push(error.message.slice(0,300)));
 await page.goto('https://fc-offline-smoke.invalid/',{waitUntil:'domcontentloaded',timeout:15000});
 check('synthetic page loads without EA navigation',(await page.title())==='Offline FC smoke');
 // Assets are loaded from the already installed extension, not arbitrary HTTP URLs.
 // Manifest WAR allows all origins. Fetch verifies actual Chromium asset availability.
 const assets=await page.evaluate(async({id,files})=>{
  const result=[];for(const file of files){try{const r=await fetch('chrome-extension://'+id+'/'+file);result.push({file,ok:r.ok,bytes:(await r.arrayBuffer()).byteLength})}catch{result.push({file,ok:false,bytes:0})}}return result;
 },{id:extensionId,files:manifest.web_accessible_resources.flatMap(g=>g.resources)});
 report.assetResults=assets;
 check('Chromium can fetch every declared web-accessible asset',assets.every(a=>a.ok&&a.bytes>0));
 check('synthetic page has no runtime page errors',report.pageErrors.length===0);
 report.limitations.push('Automatic EA-domain content-script matching was not exercised because no EA URL was opened.');
 report.limitations.push('Modern index.js and main.js require the EA Web App globals; this smoke verifies loader contract and installed assets, not an EA app session.');
 report.limitations.push('A registered worker and valid assets do not prove fresh-listing discovery, native search compatibility, or purchasing safety.');
 report.passed=true;
 }catch(error){report.passed=false;report.error=error.message.slice(-1800);process.exitCode=1}
 finally{if(context)await context.close();if(profile)fs.rmSync(profile,{recursive:true,force:true});fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2))}
})();
