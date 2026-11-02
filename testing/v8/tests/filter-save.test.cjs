'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {load,moduleExports}=require('./bundle-loader.cjs');
test('production filter save awaits refreshed options before selecting and reloading the saved rarity',async()=>{
 const {modules}=load(path.resolve(__dirname,'../../../.local/v8-trader-validation/js/main.js'),{UTMarketSearchFiltersViewController:class{},JSUtils:{inherits(){}},prompt:()=> 'V8 SCREAM VALIDATION'});
 const deps=new Proxy({17820:{FilterHandler:{instance:{saveFilter:async()=>{}}}},44669:{translate:()=> 'Name this filter'}},{get:(obj,key)=>obj[key]||{},has:()=>true});
 const {TraderController}=moduleExports(modules,83067,deps);const controller=Object.create(TraderController.prototype);let optionsReady=false,selected=false;
 controller.filterSetting={currentFilter:'default'};controller.updateFilterDropDownList=async()=>{await new Promise(r=>setImmediate(r));optionsReady=true};
 controller.filtersDropDown={setValue:async values=>{assert.equal(optionsReady,true);assert.deepEqual(Array.from(values),['V8 SCREAM VALIDATION']);selected=true}};
 assert.equal(await controller.promptAndSaveFilter(),true);assert.equal(selected,true);
});
