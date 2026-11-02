'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),source=path.join(root,'.local/v72-source');
function run(command,args,options={}){const r=spawnSync(command,args,{cwd:root,stdio:'inherit',env:process.env,...options});if(r.error)throw r.error;if(r.status!==0)process.exit(r.status||1);}
if(!fs.existsSync(path.join(source,'patched/manifest.json'))){fs.mkdirSync(source,{recursive:true});run('tar',['-xf',path.join(root,'delivery/FC_Enhancer_v7_2_Source_Tests_Report.zip'),'-C',source]);}
process.env.FC_EXTENSION_DIR=path.join(source,'patched');
process.env.CHROMIUM_PATH||='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
run(process.execPath,['testing/v8/build-offline.cjs']);
run(process.execPath,['testing/v8/build-trader.cjs']);
run(process.execPath,['testing/v8/build-rc.cjs','--skip-test-build']);
run(process.execPath,['testing/v8/build-rc2.cjs','--skip-rc1-build']);
const tests=fs.readdirSync(path.join(root,'testing/v8/tests')).filter(f=>f.endsWith('.test.cjs')).map(f=>'testing/v8/tests/'+f);
run(process.execPath,['--test',...tests]);
run(process.execPath,['delivery/fresh-listing-research/offline/evaluator.test.cjs']);
run(process.execPath,[path.join(source,'work/baseline.cjs')]);
run(process.execPath,[path.join(source,'work/regression.cjs')]);
run(process.execPath,['testing/browser/renderer-smoke.cjs',process.env.FC_EXTENSION_DIR,'testing/browser/logger-fixture.cjs','testing/browser/LOCAL_LOGGER_RESULTS.json']);
run(process.execPath,['testing/browser/renderer-smoke.cjs','.local/v8-offline-extension','testing/browser/v8-integration-fixture.cjs','testing/browser/LOCAL_V8_RENDERER.json']);
run(process.execPath,['testing/browser/local-registration.cjs','.local/v8-offline-extension','testing/browser/LOCAL_V8_REGISTRATION.json']);
run(process.execPath,['testing/browser/local-registration.cjs','.local/v8-trader-validation','testing/browser/LOCAL_TRADER_REGISTRATION.json']);
run(process.execPath,['testing/browser/local-registration.cjs','.local/v8-release-candidate','testing/browser/RC_REGISTRATION.json']);
run(process.execPath,['testing/browser/rc-registration.cjs','.local/v8-release-candidate','testing/browser/RC_INSTALLED_RESULTS.json']);

run(process.execPath,['testing/browser/rc2-registration.cjs','.local/v8-rc2','testing/browser/RC2_INSTALLED_RESULTS.json']);
