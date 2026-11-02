'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const file=path.join(__dirname,'../src/scope-pager.cjs');
test('bounded native scope pager is available',()=>assert.ok(fs.existsSync(file)));
if(fs.existsSync(file)){
 const {ScopePager}=require(file),wire=(offset=0)=>({offset,status:200,transport:'xhr',fields:{num:2}});
 test('pagination advances only after observing a full terminal scope and native offset',()=>{const p=new ScopePager(3);assert.equal(p.page,1);assert.equal(p.accept({wire:wire(),ids:['1','2'],canSplit:false}),true);assert.equal(p.page,2);assert.equal(p.accept({wire:wire(1),ids:['2','3'],canSplit:false}),true);assert.equal(p.page,3);assert.equal(p.accept({wire:wire(2),ids:['3','4'],canSplit:false}),true);assert.equal(p.page,1);});
 test('unknown offset or a splittable scope does not invent page access',()=>{for(const state of [{wire:{...wire(),offset:'unknown'},canSplit:false},{wire:wire(),canSplit:true}]){const p=new ScopePager();p.accept({...state,ids:['1','2']});assert.equal(p.page,1);}});
 test('replayed pages and inconsistent offsets are rejected without looping',()=>{for(const second of [{wire:wire(1),ids:['1','2']},{wire:wire(),ids:['3','4']}]){const p=new ScopePager();p.accept({wire:wire(),ids:['1','2'],canSplit:false});assert.equal(p.accept({...second,canSplit:false}),false);assert.equal(p.page,1);p.accept({wire:wire(),ids:['1','2'],canSplit:false});assert.equal(p.page,1);}});
 test('successful empty page returns to a bounded known page range',()=>{const p=new ScopePager();p.accept({wire:wire(),ids:['1','2'],canSplit:false});assert.equal(p.accept({wire:wire(1),ids:[],canSplit:false}),true);assert.equal(p.page,1);p.accept({wire:wire(),ids:['3','4'],canSplit:false});assert.equal(p.page,1);});
 test('transient emptiness permits a bounded later reprobe after fresh full baseline responses',()=>{const p=new ScopePager();p.accept({wire:wire(),ids:['1','2'],canSplit:false});p.accept({wire:wire(1),ids:[],canSplit:false});for(let i=0;i<4;i++)p.accept({wire:wire(),ids:[String(10+i*2),String(11+i*2)],canSplit:false});assert.equal(p.page,2);});
}
