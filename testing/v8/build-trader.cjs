'use strict';
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),offline=path.join(root,'.local/v8-offline-extension'),source=path.join(root,'.local/v72-source/patched'),output=path.join(root,'.local/v8-trader-validation');
execFileSync(process.execPath,[path.join(__dirname,'build-offline.cjs'),source],{stdio:'inherit'});
const {load}=require('./tests/bundle-loader.cjs'),{modules}=load(path.join(offline,'js/main.js'));
let main=fs.readFileSync(path.join(offline,'js/main.js'),'utf8');
const replace=(old,value)=>{if(main.split(old).length!==2)throw Error('Unexpected production patch boundary: '+old.slice(0,90));main=main.replace(old,value)};
replace('t.isFresh=criteria=>freshCriteria.has(criteria);','t.isFresh=criteria=>freshCriteria.has(criteria);t.markFresh=criteria=>freshCriteria.add(criteria);t.getDiagnostics=criteria=>diagnostics.get(criteria);t.getAllowed=criteria=>allowedPages.get(criteria);');
replace('h=n(19719),fresh=n(99007);class _','h=n(19719),fresh=n(99011);class _');
replace('filters=n(17820),fresh=n(99007);','filters=n(17820),fresh=n(99011);');
replace('if(e){const t=await n.handleTransferResults(e,this.traderSettings.safeSetting,this.cancellationToken);','if(e?.length){const t=await n.handleTransferResults(e,this.traderSettings.safeSetting,this.cancellationToken);');
replace('const i=await this.checkBotState(),{tlWlCheckCycle:r}=this.statsProcessor.getTempStats();','const i=await this.checkBotState();if(this.traderSettings.searchSetting.autoFindNewest)return;const{tlWlCheckCycle:r}=this.statsProcessor.getTempStats();');
// New setting sits inside the existing Trader SearchSettingView and save lifecycle.
replace('label:"Starting Search Page"','label:"Legacy Starting Page (unused by v8)"');
replace('label:"Auto-Find Newest Listings (59–60 min)"','label:"v8 Auto-Find / Auto-Snipe (validation: buying disabled)"');
replace('await p.FilterHandler.instance.saveFilter(t),this.updateFilterDropDownList(),await(this.filtersDropDown?.setValue','await p.FilterHandler.instance.saveFilter(t),await this.updateFilterDropDownList(),await(this.filtersDropDown?.setValue');
replace('this.menuItem?.reloadSetting(),super.viewDidAppear(),e.refreshFilterList','this.menuItem?.reloadSetting(),super.viewDidAppear(),n(99011).refreshStatus(u.TraderProcessor.instance),e.refreshFilterList');
// A rejected native bid is not a won item; preserve the existing error handlers.
replace('notificationType:a.ExternalNotificationType.LOST,filterName:h}),{response:!0}}','notificationType:a.ExternalNotificationType.LOST,filterName:h}),{response:!1}}');
// Capture the terminal API outcome without interpreting an uncertain failure as a loss.
replace('t.bidItem=void 0;const a=n(22869)','t.bidItem=void 0;const v8Bridge=()=>n(99012),a=n(22869)');
replace('const{success:w,error:A}=await(0,o.bidItem)(n,C),N=','v8Bridge().beginNativeTransaction(n);const{success:w,error:A}=await(0,o.bidItem)(n,C);v8Bridge().recordNativeOutcome(n,w===true);const N=');
const settingsNeedle='this.addInputElement((0,r.createToggleInput)({label:"v8 Auto-Find / Auto-Snipe (validation: buying disabled)"';
replace(settingsNeedle,'this.addInputElement((0,r.createNumericInput)({label:"v8 Maximum Snipe Price (never raised automatically)",isNumberInput:!0,id:"ab_v8_snipe_maximum",customClass:"trader-settings-field",defaultValue:this.searchSetting.v8SnipeMaximum||0,onChange:value=>{const maximum=Number(value);this.searchSetting.v8SnipeMaximum=Number.isSafeInteger(maximum)&&maximum>0?maximum:0;this.onDataChange()}})),this.addInputElement((0,r.createToggleInput)({label:"v8 Auto-Find / Auto-Snipe (validation: buying disabled)"');
const originalBid=modules[7520].toString();
const guardedBid=originalBid.replace('y=[','y=[async(event,next)=>{const settings=a.InMemoryStore.instance.get("traderSettings"),maximum=settings.searchSetting?.v8SnipeMaximum,price=event.data?.getAuctionData?.()?.buyNowPrice;if(settings.searchSetting?.autoFindNewest&&(!Number.isSafeInteger(maximum)||maximum<=0||!Number.isSafeInteger(price)||price<=0||price>maximum))return {response:false};if(settings.searchSetting?.autoFindNewest){const buy=settings.buySetting||{},dynamic=event.params.realTimePrice;if(buy.findBuyPrice&&(!Number.isFinite(dynamic)||dynamic<=0))return {response:false};const fixed=buy.buyPrice;if(fixed!=null&&fixed!==0&&(!Number.isSafeInteger(fixed)||fixed<=0))return {response:false};event.params.calculatedPriceToBin=Math.min(maximum,fixed||maximum,buy.findBuyPrice?dynamic:maximum);event.params.calculatedPriceToBid=0;}return next(event)},');
if(guardedBid===originalBid)throw Error('Native bid guard boundary missing');
const preview=`;t.previewBidMiddlewares=async(item,isReBid,maximum)=>{
 if(!Number.isSafeInteger(maximum)||maximum<=0||!Number.isSafeInteger(item?._auction?.buyNowPrice)||item._auction.buyNowPrice<=0||item._auction.buyNowPrice>maximum)return {response:false};
 const store=a.InMemoryStore.instance,original=store.get('traderSettings'),data=store.get('traderData'),buy=original.buySetting;
 let dynamic;if(buy.findBuyPrice){dynamic=await f.getRealTimePrice(item,buy.buyPriceSteps,buy.buyPricePercentage);if(!Number.isFinite(dynamic)||dynamic<=0)return {response:false};}
 const ceiling=Math.min(maximum,Number.isSafeInteger(buy.buyPrice)&&buy.buyPrice>0?buy.buyPrice:maximum,dynamic??maximum);
 const settings={...original,buySetting:{...buy,buyPrice:ceiling,bidPrice:0,findBidPrice:false}};
 return r.runMiddlewares({data:item,params:{settings,data,isReBid,realTimePrice:dynamic,calculatedPriceToBid:0,calculatedPriceToBin:ceiling},localizer:i.getLocalization(),filterName:data.cache.filter.currentFilter},y.slice(0,-2));
}`;
replace(originalBid,guardedBid.slice(0,-1)+preview+'}');
// A v8 maximum supplies a valid fixed buying-price rule without enabling buying.
replace('return s||l||c||d?t(e):','return (n.get("traderSettings").searchSetting?.autoFindNewest&&Number.isSafeInteger(n.get("traderSettings").searchSetting.v8SnipeMaximum)&&n.get("traderSettings").searchSetting.v8SnipeMaximum>0)||s||l||c||d?t(e):');
const factory=code=>'function(module,exports,require){const wrapper={exports:{}};(function(module,exports,require){'+code+'\n})(wrapper,wrapper.exports,require);wrapper.exports(module,exports,require)}';
for(const id of [99011,99012,99013,99014,99015,99016])if(modules[id])throw Error('Factory ID collision');
const boundary=main.indexOf(',i={};function r(e)');
main=main.slice(0,boundary-1)+',99011:'+factory(fs.readFileSync(path.join(__dirname,'src/trader-integration.js'),'utf8'))+',99012:'+factory(fs.readFileSync(path.join(__dirname,'src/purchase-bridge.js'),'utf8'))+',99013:function(module,exports,require){'+fs.readFileSync(path.join(__dirname,'src/scope-pager.cjs'),'utf8')+'\n},99014:'+factory(fs.readFileSync(path.join(__dirname,'src/purchase-policy.js'),'utf8'))+',99015:'+factory(fs.readFileSync(path.join(__dirname,'src/trader-status.js'),'utf8'))+',99016:function(module,exports,require){'+fs.readFileSync(path.join(__dirname,'src/purchase-preflight.cjs'),'utf8')+'\n}}'+main.slice(boundary);
// Preserve the offline manifest until all production patches validate.
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'manifest.json'),fs.readFileSync(path.join(offline,'manifest.json')));
fs.cpSync(offline,output,{recursive:true,filter:entry=>path.resolve(entry)!==path.join(offline,'manifest.json')});
fs.writeFileSync(path.join(output,'js/main.js'),main);
fs.writeFileSync(path.join(output,'offline-factories.js'),main.slice(0,main.indexOf(',i={};function r(e)'))+';globalThis.__fcProductionFactories=a;})();');
fs.appendFileSync(path.join(output,'offline-test.js'),`\n;(()=>{const api={};globalThis.__fcProductionFactories[99015]({},api,()=>{throw Error('No status dependencies')});const panel=api.createStatusPanel(document);panel.mount();panel.update({state:'stopped',rarityLabel:'Synthetic fixture rarity',rarityIds:[4242],configuredMaximum:900,effectiveMaximum:800,freshCount:1,rejectedCount:2,rejectionReasons:{'Outside price limits':2},freshCandidates:[{name:'Synthetic <Player>',buyNowPrice:700}]});})();\n`);
fs.copyFileSync(path.join(__dirname,'src/execution-guard.js'),path.join(output,'js/v8-execution-guard.js'));
const manifest=JSON.parse(fs.readFileSync(path.join(source,'manifest.json')));
manifest.name='FC Enhancer v8 Trader Validation TEST (NO BUYING)';manifest.version='27.0.2.2';manifest.version_name='v8 reliability and safety TEST — real purchases disabled';delete manifest.update_url;
manifest.content_scripts.unshift({matches:manifest.content_scripts[0].matches,js:['js/v8-execution-guard.js'],world:'MAIN',run_at:'document_start'});
fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(output,'V8_TEST_README.txt'),`FC Enhancer v8 reliability TEST (27.0.2.2)\n\nExtract the ZIP to a permanent folder. In Chrome, open chrome://extensions, enable Developer mode, and choose Load unpacked for the folder containing manifest.json. Disable older FC Enhancer copies in that Chrome profile before loading this TEST copy.\n\nReal buying and bidding are locked in the build policy and service/transport guards. This TEST cannot authorize purchases. Any displayed validation ceilings, including 100,000 coins, are test settings and are not your purchase instructions. Set your own maximum explicitly for any permitted discovery session; zero/missing maximum prevents v8 discovery.\n\nUse the native Ultimate Scream rarity with no individual player selected. Trader displays rarity, configured/effective maximum, fresh candidates, rejected candidates and execution status. Existing native checks remain in the preview path. Fresh-window duration does not prove listing creation time or profitability.\n\nThis is not a production-ready automatic purchaser. Exhaustive pool coverage and real transaction behavior remain unproven. Separate authorization and further validation are required before any future purchase-enabled build. Unknown outcomes require native-state reconciliation, never automatic retry.\n\nSee delivery/v8/ACCEPTANCE.md in the development repository for evidence. Older included README files describe historical versions; this file governs the v8 TEST build.\n`);
console.log(output);
