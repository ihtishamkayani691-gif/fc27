'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),built=path.join(root,'.local/v8-trader-validation'),extracted=path.join(root,'.local/final-zip-check');
const zip=path.join(root,'delivery/v8/FC_Enhancer_v8_Trader_Validation_TEST.zip');
let files=0;function walk(directory,relative=''){for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const rel=path.join(relative,entry.name),source=path.join(directory,entry.name);if(entry.isDirectory())walk(source,rel);else{assert.ok(fs.readFileSync(source).equals(fs.readFileSync(path.join(extracted,rel))),rel);files++;}}}walk(built);
const manifest=JSON.parse(fs.readFileSync(path.join(built,'manifest.json')));
const resources=[manifest.background.service_worker,...Object.values(manifest.icons),...manifest.content_scripts.flatMap(s=>s.js),...manifest.web_accessible_resources.flatMap(s=>s.resources)];
for(const file of resources)assert.ok(fs.statSync(path.join(built,file)).isFile(),file);
assert.ok(manifest.content_scripts.some(s=>s.world==='MAIN'&&s.run_at==='document_start'&&s.js.includes('js/v8-execution-guard.js')));
const {load,moduleExports}=require('./tests/bundle-loader.cjs'),{modules}=load(path.join(built,'js/main.js'));
const {policy}=moduleExports(modules,99014);assert.equal(Object.isFrozen(policy),true);for(const flag of ['validationComplete','purchaseEnabled','userAuthorized'])assert.equal(policy[flag],false);
const reports={};for(const name of ['LOCAL_LOGGER_RESULTS','LOCAL_V8_RENDERER','LOCAL_TRADER_REGISTRATION','LOCAL_MCP_RESULTS']){const report=JSON.parse(fs.readFileSync(path.join(root,'testing/browser',name+'.json')));assert.equal(report.passed,true,name);reports[name]='passed';}
const live=JSON.parse(fs.readFileSync(path.join(root,'testing/browser/LIVE_V8_RESULTS.json')));
assert.equal(live.stopped,true);assert.equal(live.realPurchasingAuthorized,false);assert.ok(!live.error);assert.equal(live.stopReason,'native-safety-passed-fresh-candidate');
const candidates=live.logs.filter(line=>line.startsWith('[v8 candidate]')&&line.includes('nativeSafety=pass'));assert.ok(candidates.length>0);
for(const row of live.observations){assert.equal(row.maximum,100000);assert.deepEqual(row.criteria.defId,[]);assert.deepEqual(row.criteria.rarities,[151]);assert.equal(row.criteria.minBuy,0);assert.equal(row.blockedMutationAttempts,0);}
const testOutput=fs.readFileSync(path.join(root,'.local/V8_PRODUCTION_TEST_OUTPUT.txt'),'utf8'),counts=[...testOutput.matchAll(/ℹ tests (\d+)/g)].map(m=>Number(m[1])),failures=[...testOutput.matchAll(/ℹ fail (\d+)/g)].map(m=>Number(m[1]));assert.equal(counts.length,4);assert.equal(failures.length,4);assert.ok(failures.every(n=>n===0));
const summary={build:'FC Enhancer v8 Trader Validation TEST',version:manifest.version,archive:path.basename(zip),sha256:crypto.createHash('sha256').update(fs.readFileSync(zip)).digest('hex'),bytes:fs.statSync(zip).size,filesMatchTestedBuild:files,manifestResourcesChecked:resources.length,purchasePolicy:policy,tests:{v8:counts[0],evaluator:counts[1],baseline:counts[2],productionRegression:counts[3],total:counts.reduce((a,b)=>a+b,0)},browserReports:reports,latestLiveCandidates:candidates.length,latestLiveRunStopped:true,realPurchasingEnabled:false,limitations:['No real purchase or bid was performed.','Candidate durations do not prove listing creation time.','Exhaustive full-pool coverage and live profitability/budget behavior remain unproven.']};
fs.writeFileSync(path.join(root,'delivery/v8/VERIFICATION.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary,null,2));
