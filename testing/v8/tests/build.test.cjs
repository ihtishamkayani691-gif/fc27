'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
test('failed build cannot replace the offline manifest with EA permissions',()=>{
 const root=path.resolve(__dirname,'../../..'),bad=fs.mkdtempSync(path.join(root,'.local/bad-build-'));
 const outputManifest=path.join(root,'.local/v8-offline-extension/manifest.json');
 const before=fs.readFileSync(outputManifest,'utf8');
 try {
  fs.mkdirSync(path.join(bad,'js'));fs.writeFileSync(path.join(bad,'js/main.js'),'unsupported bundle');
  fs.writeFileSync(path.join(bad,'manifest.json'),JSON.stringify({content_scripts:[{matches:['https://www.ea.com/*']}],host_permissions:['https://www.ea.com/*']}));
  const result=spawnSync(process.execPath,['testing/v8/build-offline.cjs',bad],{cwd:root,encoding:'utf8'});
  assert.notEqual(result.status,0);assert.equal(fs.readFileSync(outputManifest,'utf8'),before);
 }finally{fs.rmSync(bad,{recursive:true,force:true});}
});
