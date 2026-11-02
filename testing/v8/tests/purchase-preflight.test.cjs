'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const file=path.join(__dirname,'../src/purchase-preflight.cjs');
test('production purchase preflight is present',()=>assert.ok(fs.existsSync(file)));
if(fs.existsSync(file)){
 const {checkPreflight}=require(file);
 const options=()=>({item:{_auction:{tradeId:'123',buyNowPrice:700,expires:3559},getAuctionData(){return{...this._auction,isExpired:()=>false}}},maximum:900,settings:{buySetting:{buyPrice:800,noOfCards:10},safeSetting:{maxPurchasesPerSearchRequest:1}},data:{stats:{purchasedCardCount:0},cache:{cachedBids:new Set()}},balance:1000,observedAt:1000,now:1000});
 test('all price ceilings intersect and insufficient/unknown coins fail closed',()=>{for(const [key,value,reason] of [['maximum',600,'fixed-snipe-maximum'],['balance',699,'insufficient-coins'],['balance',undefined,'balance-unavailable']]){const o=options();o[key]=value;assert.equal(checkPreflight(o).reason,reason)}assert.equal(checkPreflight(options()).response,true);});
 test('native total-card and per-search budgets plus explicit monetary budget are enforced',()=>{let o=options();o.data.stats.purchasedCardCount=10;assert.equal(checkPreflight(o).reason,'native-card-budget-reached');o=options();o.attemptsInSearch=1;assert.equal(checkPreflight(o).reason,'native-per-search-budget-reached');o=options();o.budgetRemaining=699;assert.equal(checkPreflight(o).reason,'spend-budget-exceeded');});
 test('expired, duplicate and stale listings cannot reach transaction routing',()=>{let o=options();o.item.getAuctionData=()=>({...o.item._auction,isExpired:()=>true});assert.equal(checkPreflight(o).reason,'expired-listing');o=options();o.data.cache.cachedBids.add('123');assert.equal(checkPreflight(o).reason,'duplicate-trade-id');o=options();o.now=17000;assert.equal(checkPreflight(o).reason,'stale-response');o=options();o.now=11000;o.item._auction.expires=3545;assert.equal(checkPreflight(o).reason,'outside-fresh-window');});
 test('required profitability cannot silently use only a fixed ceiling',()=>{const o=options();o.requireProfitability=true;assert.equal(checkPreflight(o).reason,'profitability-rule-not-configured');o.settings.buySetting.findBuyPrice=true;assert.equal(checkPreflight(o).response,true);});
}
