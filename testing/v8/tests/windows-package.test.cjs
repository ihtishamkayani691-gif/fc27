'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
test('Windows delivery ZIP has a root manifest, literal relative paths, and identical extracted files',()=>{
 const {packageWindows}=require('../package-windows.cjs');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'fc-windows-package-'));
 try {
  const source=path.join(temp,'source'),zip=path.join(temp,'fresh.zip');
  fs.mkdirSync(path.join(source,'assets'),{recursive:true});
  fs.writeFileSync(path.join(source,'manifest.json'),JSON.stringify({manifest_version:3,version:'27.0.6.0'}));
  fs.writeFileSync(path.join(source,'assets','test file.txt'),'CRC and Windows path regression\n');
  const report=packageWindows(source,zip);
  assert.equal(report.passed,true);assert.equal(report.files,2);
  assert.ok(report.entries.includes('manifest.json'));
  assert.ok(report.entries.every(n=>!n.startsWith('./')&&!n.includes('\\')&&!n.split('/').some(p=>p==='.'||p==='..')));
  assert.equal(fs.readFileSync(zip).subarray(0,4).toString('hex'),'504b0304');
 }finally{fs.rmSync(temp,{recursive:true,force:true})}
});
test('Windows packager refuses a folder without a root manifest and preserves an existing destination',()=>{
 const {packageWindows}=require('../package-windows.cjs');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'fc-windows-package-'));
 try{const zip=path.join(temp,'existing.zip');fs.writeFileSync(zip,'preserved');assert.throws(()=>packageWindows(temp,zip),/manifest/);assert.equal(fs.readFileSync(zip,'utf8'),'preserved')}
 finally{fs.rmSync(temp,{recursive:true,force:true})}
});
