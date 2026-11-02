'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {PriceScopePlanner}=require('../src/planner.cjs');
const options={criteria:{type:'player',rarities:[151],defId:[],minBuy:0,maxBuy:0},snipeMaximum:100000,verifiedRarityIds:[151],roundDown:n=>Math.floor(n/500)*500,previousStep:n=>n-500,nextStep:n=>n+500,probeUpperBoundary:true,balancedCoverage:true};
const observe=(p,i,fresh=0)=>p.observe({intentId:i.id,acceptedScope:true,rawCount:0,freshCount:fresh,newFreshCount:fresh,observedRequestCount:21,countProvenance:'wire'});
test('evidence-checked seeking reaches a measured fresh frontier sooner and fills skipped pages',()=>{
 const {ScopePager}=require('../src/scope-pager.cjs');
 const run=seekFresh=>{const p=new ScopePager(12,{seekFresh}),pages=[];let first=null;for(let n=0;n<18;n++){const page=p.page;pages.push(page);if(page>=8&&first===null)first=n+1;p.accept({wire:{transport:'xhr',status:200,offset:(page-1)*20,fields:{num:21}},ids:Array.from({length:21},(_,k)=>String(page*100+k)),canSplit:false,maxRemaining:page>=8?3559:100+page*100})}return{first,pages}};
 const old=run(false),improved=run(true);assert.equal(old.first,8);assert.equal(improved.first,4);for(let page=1;page<=12;page++)assert.ok(improved.pages.includes(page),'skipped '+page);
});
test('fresh seek rejects shifted offsets, repeated pages and unsupported wire evidence',()=>{
 const {ScopePager}=require('../src/scope-pager.cjs');for(const bad of ['offset','duplicate','wire']){const p=new ScopePager(20,{seekFresh:true});for(let n=0;n<2;n++){const page=p.page;assert.equal(p.accept({wire:{transport:'xhr',status:200,offset:(page-1)*20,fields:{num:2}},ids:[String(page*10),String(page*10+1)],maxRemaining:100,canSplit:false}),true)}assert.equal(p.page,4);assert.equal(p.accept({wire:{transport:bad==='wire'?'unknown':'xhr',status:200,offset:bad==='offset'?999:60,fields:{num:2}},ids:bad==='duplicate'?['10','11']:['40','41'],maxRemaining:3559,canSplit:false}),false);assert.equal(p.page,1)}
});
test('empty seek frontier fills every skipped page without falsely rejecting its own repeated queue entries',()=>{
 const {ScopePager}=require('../src/scope-pager.cjs'),p=new ScopePager(20,{seekFresh:true}),seen=new Set();
 for(let n=0;n<30;n++){const page=p.page;if(page===1&&n>0)break;seen.add(page);const ids=page>=16?[]:Array.from({length:21},(_,k)=>String(page*100+k));assert.equal(p.accept({wire:{transport:'xhr',status:200,offset:(page-1)*20,fields:{num:21}},ids,canSplit:false,maxRemaining:100+page}),true);assert.notEqual(p.reason,'native-page-access-unverified');}
 for(let page=1;page<16;page++)assert.ok(seen.has(page),'missing page '+page);
});
test('balanced discovery gives cheap, middle and edge bands a first turn without waiting for crowded pages',()=>{
 const p=new PriceScopePlanner(options),seen=[];
 for(let n=0;n<8;n++){const i=p.next();if(i.criteria){seen.push(i);observe(p,i)}}
 for(const price of [5000,15000,25000,50000,75000,99500])assert.ok(seen.some(i=>i.kind==='price-band'&&i.criteria.minBuy<=price&&i.criteria.maxBuy>=price),'missing band for '+price);
 assert.ok(seen.some(i=>i.criteria.minBuy===0&&i.criteria.maxBuy===100000));
 assert.ok(seen.every(i=>i.criteria.maxBuy<=100000&&i.criteria.defId.length===0&&i.criteria.rarities[0]===151));
});
test('productive scope bonus never starves other price bands or broad backstops',()=>{
 const p=new PriceScopePlanner(options),visits=new Map();let productive;
 for(let n=0;n<48;n++){const i=p.next();if(!i.criteria)continue;if(!productive&&i.kind==='price-band')productive=i.scope.id;visits.set(i.scope.id,(visits.get(i.scope.id)||0)+1);observe(p,i,i.scope.id===productive?1:0)}
 assert.ok(visits.size>=6);assert.ok([...visits.values()].every(n=>n>=2));assert.ok(visits.get(productive)>visits.get(p.root.id));
});
test('candidate report distinguishes price eligibility, unvalued evidence and after-fee rejection',()=>{
 const api={};require('../src/trader-status.js')({},api);
 const row={name:'Garner',rarityLabel:'Ultimate Scream',buyNowPrice:99500,remainingSeconds:3559,minimumProfit:15000,referencePrice:110000,netProfit:-5000,fee:5500,additionalCosts:0,reason:'minimum-net-profit-not-met',qualifies:false,valuationState:'VALUED'};
 const text=api.describeCandidate(row).join(' ');
 for(const term of ['Garner','Ultimate Scream','99,500','59m 19s','110,000','-5,000','15,000','REJECTED','minimum-net-profit-not-met'])assert.ok(text.includes(term),term);
 const missing=api.describeCandidate({...row,referencePrice:null,netProfit:null,fee:null,valuationState:'NOT VALUED',reason:'profitability-rule-not-configured'}).join(' ');
 assert.match(missing,/NOT VALUED/);assert.match(missing,/profitability-rule-not-configured/);assert.doesNotMatch(missing,/QUALIFIES/);
});
