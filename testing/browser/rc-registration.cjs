'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{chromium}=require('playwright');
const extension=path.resolve(process.argv[2]),reportPath=path.resolve(process.argv[3]),report={liveEA:false,realTransactions:0,checks:[],errors:[]};
const check=(name,condition)=>{report.checks.push({name,passed:!!condition});if(!condition)throw Error(name)};
(async()=>{let context;const profile=fs.mkdtempSync(path.join(os.tmpdir(),'fc-rc-installed-'));
try{
 context=await chromium.launchPersistentContext(profile,{executablePath:process.env.CHROMIUM_PATH,headless:true,ignoreDefaultArgs:['--disable-extensions'],args:['--enable-unsafe-extension-debugging','--disable-background-networking','--disable-component-update','--disable-sync','--proxy-server=http://127.0.0.1:9']});
 await context.route(/^https?:/,route=>{report.errors.push('Unexpected offline network request');return route.abort()});
 const cdp=await context.browser().newBrowserCDPSession(),loaded=await cdp.send('Extensions.loadUnpacked',{path:extension});
 report.browser=context.browser().version();report.extensionId=loaded.id;const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));const url='chrome-extension://'+loaded.id+'/offline-test.html';
 const ready=async()=>{await page.waitForFunction(()=>document.documentElement.dataset.rcTestState==='ready');await page.waitForFunction(()=>document.documentElement.dataset.testState==='passed')};
 await page.goto(url);await ready();const checkbox=page.getByRole('checkbox',{name:'Enable RC purchases for next Trader run'}),budget=page.getByRole('spinbutton',{name:'RC run coin budget'});
 check('RC installed worker has distinct identity',(await page.evaluate(()=>chrome.runtime.getManifest().version))==='27.0.3.1');
 check('installed RC purchase setting defaults OFF',!(await checkbox.isChecked())&&!(await page.evaluate(()=>__fcRcInstalled.snapshot().status.enabled)));
 await page.evaluate(()=>{const input=document.querySelector('.fc-v8-rc-controls input[type=checkbox]');input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}))});
 check('synthetic checkbox event cannot authorize purchases',!(await checkbox.isChecked()));
 await page.evaluate(()=>__fcRcInstalled.setSavedFlag());await page.reload();await ready();
 check('saved enable flags and reload cannot authorize purchases',!(await checkbox.isChecked())&&!(await page.evaluate(()=>__fcRcInstalled.snapshot().status.enabled)));
 await budget.fill('1400');await budget.press('Tab');await checkbox.check();
 check('trusted explicit user checkbox enables only the stopped fixture run',await page.evaluate(()=>__fcRcInstalled.snapshot().status.enabled));
 await page.evaluate(()=>__fcRcInstalled.start());const win=await page.evaluate(()=>__fcRcInstalled.execute('1001',700));
 check('installed actual native purchase path succeeds only against mocked API',win.response&&await page.evaluate(()=>__fcRcInstalled.snapshot().calls===1&&__fcRcInstalled.snapshot().handled===1));
 const duplicate=await page.evaluate(()=>__fcRcInstalled.execute('1001',700));check('installed pipeline rejects duplicate trade ID',!duplicate.response&&await page.evaluate(()=>__fcRcInstalled.snapshot().calls===1));
 const budgetReject=await page.evaluate(()=>__fcRcInstalled.execute('1002',701));check('installed pipeline preserves remaining coin budget',budgetReject.reason==='spend-budget-exceeded'&&await page.evaluate(()=>__fcRcInstalled.snapshot().calls===1));
 await page.evaluate(()=>__fcRcInstalled.stop());check('Stop disarms installed purchase setting',!(await checkbox.isChecked())&&!(await page.evaluate(()=>__fcRcInstalled.snapshot().status.enabled)));
 check('Stop leaves controls available for explicit re-enable',await checkbox.isEnabled());await budget.fill('1400');await budget.press('Tab');await checkbox.check();await page.reload();await ready();check('reload disarms a previously user-enabled setting',!(await checkbox.isChecked()));
 await budget.fill('1400');await budget.press('Tab');await checkbox.check();await page.evaluate(()=>__fcRcInstalled.start());const again=await page.evaluate(()=>__fcRcInstalled.execute('1001',700));check('settled trade journal prevents duplicate purchase across reload',!again.response&&await page.evaluate(()=>__fcRcInstalled.snapshot().calls===0));
 await page.evaluate(()=>__fcRcInstalled.stop());await page.locator('.fc-v8-rc-controls').screenshot({path:reportPath.replace(/\.json$/i,'.png')});check('no runtime errors or external market requests',report.errors.length===0);report.passed=true;
}catch(error){report.error=error.message;report.passed=false;process.exitCode=1}
finally{if(context)await context.close();const resolved=path.resolve(profile);if(!resolved.startsWith(path.resolve(os.tmpdir())+path.sep)||!path.basename(resolved).startsWith('fc-rc-installed-'))throw Error('Unexpected temporary profile path');fs.rmSync(resolved,{recursive:true,force:true});fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
})();
