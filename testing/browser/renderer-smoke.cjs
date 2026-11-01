'use strict';
// Offline browser renderer/loader smoke. No extension installation is attempted:
// administrator policy blocks that operation in this environment.
// CLI: node renderer-smoke.cjs EXTENSION_DIR [SELF_CONTAINED_FIXTURE.cjs] [REPORT.json]
const fs=require('node:fs'),path=require('node:path');
let chromium;for(const p of ['playwright','/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright']){try{({chromium}=require(p));break}catch{}}
if(!chromium)throw Error('Playwright required');
const extension=path.resolve(process.argv[2]||'/workspace/fc-enhancer-v72/patched');
const fixturePath=process.argv[3]?path.resolve(process.argv[3]):null;
const reportPath=path.resolve(process.argv[4]||path.join(__dirname,'RENDERER_RESULTS.json'));
const report={scope:'offline-browser-loader-and-explicit-production-module-fixture',liveEA:false,accountUsed:false,marketRequestsExecuted:0,extensionInstalled:false,checks:[],consoleErrors:[],failedRequests:[],pageErrors:[],blockedExternalRequests:0,unexpectedFixtureRequests:[],limitations:['Unpacked extension installation is disabled by administrator policy; no policy bypass attempted.','App-asset markers test the content loader, not execution of the modern EA-dependent app bundles.','Only explicitly allowed production factories and supplied mocked dependencies are invoked.']};
function check(name,condition,detail){report.checks.push({name,passed:!!condition,...(detail?{detail}:{})});if(!condition)throw Error(name)}
(async()=>{let browser;
 try{
  const manifest=JSON.parse(fs.readFileSync(path.join(extension,'manifest.json'),'utf8'));
  const guardFile=path.join(extension,'js/v8-test-guard.js'),hasGuard=fs.existsSync(guardFile),expectedAssets=hasGuard?['/js/v8-test-guard.js','/js/index.js','/js/vendor.js','/js/main.js']:['/js/index.js','/js/vendor.js','/js/main.js'];
  const resources=[manifest.background.service_worker,...manifest.content_scripts.flatMap(s=>s.js),...Object.values(manifest.icons),...manifest.web_accessible_resources.flatMap(s=>s.resources)];
  check('all manifest resources exist',resources.every(file=>fs.statSync(path.join(extension,file)).isFile()));
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--disable-component-update','--disable-sync','--no-first-run','--proxy-server=http://127.0.0.1:9']});report.browser=browser.version();
  const context=await browser.newContext();
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.hostname!=='fc-offline-smoke.invalid'){report.blockedExternalRequests++;return route.abort('blockedbyclient')}
   if(url.pathname==='/')return route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Offline FC renderer smoke</title><style>.process-log-messages{height:300px;overflow:auto}</style><h1>OFFLINE SYNTHETIC FIXTURE</h1><div class="process-log-messages"></div>'});
   if(url.pathname==='/assets/index.css')return route.fulfill({status:200,contentType:'text/css',body:'.offline-fixture{color:inherit}'});
   if(hasGuard&&url.pathname==='/js/v8-test-guard.js'){await new Promise(resolve=>setTimeout(resolve,150));return route.fulfill({status:200,contentType:'application/javascript',body:fs.readFileSync(guardFile,'utf8')+'\n;(globalThis.__fcLoaderMarkers ||= []).push("/js/v8-test-guard.js");'})}
   if(['/js/index.js','/js/vendor.js','/js/main.js'].includes(url.pathname))return route.fulfill({status:200,contentType:'application/javascript',body:'(globalThis.__fcLoaderMarkers ||= []).push('+JSON.stringify(url.pathname)+');'});
   report.unexpectedFixtureRequests.push(url.pathname);return route.fulfill({status:404,contentType:'text/plain',body:'Unconfigured offline fixture path'});
  });
  context.on('console',message=>{if(message.type()==='error')report.consoleErrors.push(message.text().slice(0,500))});
  context.on('requestfailed',request=>{const url=new URL(request.url());report.failedRequests.push({origin:url.origin,path:url.pathname,error:request.failure()?.errorText})});
  const page=await context.newPage();page.on('pageerror',e=>report.pageErrors.push(e.message.slice(0,500)));
  await page.goto('https://fc-offline-smoke.invalid/',{waitUntil:'domcontentloaded'});
  await page.evaluate(version=>{globalThis.chrome={runtime:{getManifest:()=>({version}),getURL:file=>'https://fc-offline-smoke.invalid/'+file,onMessage:{addListener:fn=>{globalThis.__fcChromeListener=fn}},sendMessage:()=>Promise.resolve({})}}},manifest.version);
  await page.addScriptTag({content:fs.readFileSync(path.join(extension,'content_script.js'),'utf8')});
  await page.waitForFunction(count=>globalThis.__fcLoaderMarkers?.length===count,expectedAssets.length,{timeout:10000});
  const loaded=await page.evaluate(()=>({markers:globalThis.__fcLoaderMarkers.slice(),css:document.querySelectorAll('link[rel="stylesheet"]').length,listener:typeof globalThis.__fcChromeListener}));
  report.loaderMarkers=loaded.markers;
  check('exact content script loads all declared application assets',new Set(loaded.markers).size===expectedAssets.length&&expectedAssets.every(asset=>loaded.markers.includes(asset)));
  if(hasGuard){check('early TEST guard executes before all app assets even when guard response is delayed',loaded.markers[0]==='/js/v8-test-guard.js');const guard=await page.evaluate(()=>{const g=globalThis[Symbol.for('fcEnhancer.v8.testGuard')];return {install:typeof g?.install,isInstalled:typeof g?.isInstalled}});check('actual TEST guard exposes its expected API',guard.install==='function'&&guard.isInstalled==='function');}
  check('classic vendor executes before classic main',loaded.markers.indexOf('/js/vendor.js')<loaded.markers.indexOf('/js/main.js'));
  check('loader injects CSS and registers runtime message bridge',loaded.css===1&&loaded.listener==='function');
  // Capture webpack's factory table, never its actual browser entrypoint.
  const main=fs.readFileSync(path.join(extension,'js/main.js'),'utf8'),end=main.indexOf(',i={};function r(e)');
  check('expected webpack factory capture boundary exists',end>0);
  await page.addScriptTag({content:main.slice(0,end)+';globalThis.__fcProductionFactories=a;})();'});
  const fixture=fixturePath?require(fixturePath):null;
  const result=await page.evaluate(async fixtureSource=>{
   const checks=[],stubs={},cache=new Map(),allowed=new Set([99007,99008,99009,99010,51477]);let blockedCalls=0;
   const assert=(name,condition,detail)=>{checks.push({name,passed:!!condition,...(detail?{detail}:{})});if(!condition)throw Error(name)};
   const loadModule=id=>{
    id=Number(id);if(Object.prototype.hasOwnProperty.call(stubs,id))return stubs[id];
    if(cache.has(id))return cache.get(id).exports;
    if(!allowed.has(id))throw Error('Explicit dependency stub required: '+id);
    const factory=globalThis.__fcProductionFactories[id];if(typeof factory!=='function')throw Error('Production module unavailable: '+id);
    const m={exports:{}};cache.set(id,m);factory(m,m.exports,loadModule);return m.exports;
   };
   const denied=()=>{blockedCalls++;throw Error('Offline fixture forbids network, market and purchase calls')};
   globalThis.fetch=denied;globalThis.XMLHttpRequest=class{constructor(){denied()}};globalThis.WebSocket=class{constructor(){denied()}};
   if(fixtureSource){const run=(0,eval)('('+fixtureSource+')');await run({loadModule,assert,stubs,window,document})}
   else assert('actual production module table is present',typeof globalThis.__fcProductionFactories[61400]==='function'&&typeof globalThis.__fcProductionFactories[51477]==='function');
   return {checks,blockedCalls,messages:[...document.querySelectorAll('.process-log-messages .message')].map(e=>e.textContent),moduleCount:Object.keys(globalThis.__fcProductionFactories).length};
  },fixture?fixture.toString():null);
  report.productionFixture=result;report.checks.push(...result.checks);
  check('fixture made no forbidden network/market calls',result.blockedCalls===0);
  check('browser reports no page errors',report.pageErrors.length===0);
  check('browser reports no console errors',report.consoleErrors.length===0);
  check('fixture requests have no transport failures',report.failedRequests.length===0);
  check('loader requested no unexpected fixture paths',report.unexpectedFixtureRequests.length===0);
  await page.screenshot({path:reportPath.replace(/\.json$/i,'.png'),fullPage:true});report.passed=true;
 }catch(error){report.passed=false;report.error=error.message.slice(-1500);process.exitCode=1}
 finally{if(browser)await browser.close();fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2))}
})();
