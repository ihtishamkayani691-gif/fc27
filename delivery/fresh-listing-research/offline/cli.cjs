#!/usr/bin/env node
'use strict';
const fs=require('node:fs');const {OfflineEvaluator,planRosterGroups,proposePriceConstrainedCriteria}=require('./evaluator.cjs');
function readJSON(file){if(fs.statSync(file).size>32*1024*1024)throw Error('input-file-too-large');return JSON.parse(fs.readFileSync(file,'utf8'))}
try{
 const args=process.argv.slice(2),file=args[0];
 if(!file||args.slice(1).some(x=>x!=='--replay'))throw Error('usage: node cli.cjs input.json [--replay]');
 const doc=readJSON(file);if(doc.schemaVersion!==1||!Array.isArray(doc.snapshots))throw Error('invalid-input-document');
 const evaluator=new OfflineEvaluator(doc.config,doc.initialState),replay=args.includes('--replay');
 const batches=doc.snapshots.map(snapshot=>evaluator.evaluate(snapshot,replay?snapshot.evaluatedAt:new Date().toISOString()));
 const report={mode:replay?'offline-replay-explicit-fixture-clock':'offline-saved-data-evaluation-at-current-clock',liveSuccess:false,purchaseAuthorized:false,rarityMappingProvenance:evaluator.config.rarityMappingProvenance,proposedSearch:doc.searchCriteria?proposePriceConstrainedCriteria(doc.searchCriteria,evaluator.config.snipeMaximum):null,rosterPlan:planRosterGroups(evaluator.config.roster,doc.groupSize??2),batches,finalSeenState:evaluator.exportState()};
 process.stdout.write(JSON.stringify(report,null,2)+'\n');if(batches.some(batch=>!batch.snapshotAccepted||batch.error))process.exitCode=2;
}catch(error){
 // Never echo input data, arbitrary JSON fragments, auth values, or file contents in errors.
 const safe=error.code&&/^[a-z-]+$/.test(error.code)?error.code:/^(usage:|input-file-too-large|invalid-input-document)/.test(error.message)?error.message:'invalid-input-or-file';
 process.stderr.write(JSON.stringify({mode:'offline-only',error:safe,liveSuccess:false,purchaseAuthorized:false})+'\n');process.exitCode=1;
}
