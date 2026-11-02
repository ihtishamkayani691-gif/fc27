'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),source=path.resolve(process.argv[2]||path.join(root,'.local/v72-source/patched'));
const output=path.join(root,'.local/v8-offline-extension');
const mainPath=path.join(source,'js/main.js'),main=fs.readFileSync(mainPath,'utf8'),boundary=main.indexOf(',i={};function r(e)');
if(boundary<0||main[boundary-1]!=='}')throw Error('Unsupported production factory boundary');
const {load}=require('./tests/bundle-loader.cjs'),{modules}=load(mainPath);
for(const id of [99008,99009,99010])if(modules[id])throw Error('Factory ID collision: '+id);
const integration=fs.readFileSync(path.join(__dirname,'src/offline-integration.js'),'utf8');
const planner=fs.readFileSync(path.join(__dirname,'src/planner.cjs'),'utf8');
const safety=fs.readFileSync(path.join(__dirname,'src/safety-module.js'),'utf8');
const factory=code=>'function(module,exports,require){const wrapper={exports:{}};(function(module,exports,require){'+code+'\n})(wrapper,wrapper.exports,require);wrapper.exports(module,exports,require)}';
const additions=',99008:'+factory(integration)+',99009:function(module,exports,require){'+planner+'\n},99010:'+factory(safety);
const manifestPath=path.join(output,'manifest.json'),manifest=JSON.parse(fs.readFileSync(path.join(source,'manifest.json')));
manifest.name='FC Enhancer v8 OFFLINE Integration TEST (NO BUYING)';manifest.version='27.0.2.0';manifest.version_name='v8 offline factory integration; live Trader wiring pending';
// This test bundle must not attach to an EA page or grant external network access.
manifest.content_scripts[0].matches=['https://fc-offline-smoke.invalid/*'];manifest.host_permissions=[];delete manifest.update_url;
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
fs.cpSync(source,output,{recursive:true,filter:entry=>path.resolve(entry)!==path.join(source,'manifest.json')});
const bundled=main.slice(0,boundary-1)+additions+'}'+main.slice(boundary);
fs.writeFileSync(path.join(output,'js/main.js'),bundled);
// An installed extension page exercises only the explicit factory allowlist,
// never the modern application entrypoint or EA globals.
fs.writeFileSync(path.join(output,'offline-factories.js'),bundled.slice(0,bundled.indexOf(',i={};function r(e)'))+';globalThis.__fcProductionFactories=a;})();');
fs.writeFileSync(path.join(output,'offline-test.html'),'<!doctype html><html><head><meta charset="utf-8"><title>FC Enhancer v8 offline integration</title></head><body><h1>FC Enhancer v8 offline integration</h1><p>Synthetic data only. Buying and bidding disabled.</p><p id="status">Running checks...</p><ul id="checks"></ul><div class="process-log-messages"></div><script src="offline-factories.js"></script><script src="offline-test.js"></script></body></html>');
const fixture=require('../browser/v8-integration-fixture.cjs');
fs.writeFileSync(path.join(output,'offline-test.js'),`'use strict';
(async()=>{
 const checks=[],stubs={},cache=new Map(),allowed=new Set([99008,99009,99010,51477,72316,93727,39887,10270,30804]);
 const assert=(name,condition,detail)=>{checks.push({name,passed:!!condition,detail});if(!condition)throw Error(name)};
 const loadModule=id=>{id=Number(id);if(Object.hasOwn(stubs,id))return stubs[id];if(cache.has(id))return cache.get(id).exports;if(!allowed.has(id))throw Error('Forbidden offline module '+id);const m={exports:{}};cache.set(id,m);globalThis.__fcProductionFactories[id](m,m.exports,loadModule);return m.exports;};
 const deny=()=>{throw Error('Offline extension fixture forbids network')};globalThis.fetch=deny;globalThis.XMLHttpRequest=class{constructor(){deny()}};globalThis.WebSocket=class{constructor(){deny()}};
 try{await (${fixture.toString()})({loadModule,assert,stubs,document,window});globalThis.__fcInstalledIntegrationResult={checks,liveEA:false,purchaseAuthorized:false};document.documentElement.dataset.testState='passed';document.getElementById('status').textContent=checks.length+' checks passed. No market requests.';}
 catch(error){document.documentElement.dataset.testState='failed';document.getElementById('status').textContent=error.message;throw error;}
 finally{for(const check of checks){const row=document.createElement('li');row.textContent=(check.passed?'PASS: ':'FAIL: ')+check.name;document.getElementById('checks').appendChild(row);}}
})();`);
console.log(output);
