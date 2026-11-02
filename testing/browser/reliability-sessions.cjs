'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
function run(file,args=[],env={}){const result=spawnSync(process.execPath,[path.join(__dirname,file),...args],{cwd:root,env:{...process.env,...env},encoding:'utf8',windowsHide:true});if(result.status!==0)throw Error((result.stderr||result.stdout).slice(-1600));return result.stdout;}
const caps=process.argv.slice(2).map(Number);if(!caps.length)caps.push(25000,50000,75000);
const reports=process.env.FC_RELIABILITY_RESUME==='1'?JSON.parse(fs.readFileSync(path.join(__dirname,'RELIABILITY_SESSIONS.json'))).sessions:[];
for(const cap of caps){
 assert.ok(Number.isSafeInteger(cap)&&cap>0);console.log('Starting validation-only session at '+cap+' coins.');
 run('validation-ui.cjs',['type','xpath=//span[starts-with(normalize-space(.),"v8 Maximum Snipe Price")]/../..//input',String(cap)]);
 run('validation-ui.cjs',['save','V8 RELIABILITY '+cap+' TEST '+Date.now()]);
 const output=path.join(root,'.local/reliability-'+cap+'.json');run('observe-live.cjs',['240','22','--stop-on-candidate'],{FC_LIVE_REPORT:output,FC_EXPECTED_MAXIMUM:String(cap)});
 const report=JSON.parse(fs.readFileSync(output));assert.ok(report.observations.some(row=>row.planner?.intentsIssued>0));assert.ok(!report.error);assert.equal(report.stopped,true);assert.equal(report.finalState.v8.running,false);assert.equal(report.finalState.blockedMutationAttempts,0);
 for(const row of report.observations){assert.equal(row.maximum,cap);assert.deepEqual(row.criteria.rarities,[151]);assert.deepEqual(row.criteria.defId,[]);assert.equal(row.criteria.maskedDefId,0);assert.equal(row.criteria.minBuy,0);assert.equal(row.blockedMutationAttempts,0);assert.equal(row.nativeBidInterlockInstalled,true);for(const item of row.status?.freshCandidates||[])assert.ok(item.buyNowPrice<=cap);}
 const candidates=report.logs.filter(line=>line.startsWith('[v8 candidate]')&&line.includes('nativeSafety=pass'));
 for(const line of candidates){assert.ok(Number(line.match(/buyNow=(\d+)/)[1])<=cap);assert.ok(line.includes('purchaseAuthorized=false buying=DISABLED'));}
 reports.push({testMaximum:cap,report});
 fs.writeFileSync(path.join(__dirname,'RELIABILITY_SESSIONS.json'),JSON.stringify({baseline:'6264458',validationOnly:true,testCapsAreNotPurchaseInstructions:true,sessions:reports},null,2)+'\n');
 console.log(JSON.stringify({testMaximum:cap,candidates:candidates.length,observedPlayers:report.finalState.v8.status.observedPlayerCount,freshPlayers:report.finalState.v8.status.freshPlayerCount,stopped:true}));
}
