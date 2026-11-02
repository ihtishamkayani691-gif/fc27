'use strict';
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),base=path.join(root,'.local/v8-universal-final'),out=path.join(root,'.local/v8-improved');
if(!process.argv.includes('--skip-final-build'))execFileSync(process.execPath,[path.join(__dirname,'build-universal-final.cjs')],{stdio:'inherit'});
const {modules}=require('./tests/bundle-loader.cjs').load(path.join(base,'js/main.js'));
let main=fs.readFileSync(path.join(base,'js/main.js'),'utf8');
const before=modules[99012].toString(),after=before.replace('exports.discoveryImprovements=false','exports.discoveryImprovements=true');
if(after===before||main.split(before).length!==2)throw Error('Improved discovery boundary');
main=main.replace(before,after);
for(const [id,from,to]of [[99015,'Trader · v8 UNIVERSAL FINAL','Trader · v8 IMPROVED 27.0.7.0'],[99018,'Universal v8 FINAL ·','Universal v8 IMPROVED 27.0.7.0 ·']]){
 const original=modules[id].toString(),updated=original.replaceAll(from,to);if(original===updated||main.split(original).length!==2)throw Error('Improved heading boundary '+id);main=main.replace(original,updated);
}
fs.rmSync(out,{recursive:true,force:true});fs.cpSync(base,out,{recursive:true});
fs.writeFileSync(path.join(out,'js/main.js'),main);
fs.writeFileSync(path.join(out,'offline-factories.js'),main.slice(0,main.indexOf(',i={};function r(e)'))+';globalThis.__fcProductionFactories=a;})();');
const m=JSON.parse(fs.readFileSync(path.join(base,'manifest.json')));m.name='FC Enhancer v8 IMPROVED (purchases OFF by default)';m.version='27.0.7.0';m.version_name='v8 Improved — candidate economics and fair price coverage';fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(m,null,2)+'\n');
fs.writeFileSync(path.join(out,'INSTALL_IMPROVED.txt'),'FC Enhancer v8 IMPROVED 27.0.7.0\nDisable other FC Enhancer copies. Open chrome://extensions, enable Developer mode, Load unpacked, select this folder containing manifest.json. Reload EA Web App and open Trader.\nSelect your rarity, enter YOUR maximum, minimum net profit, per-card maximum, total budget and count. Enable native dynamic Buy Now pricing for valuation; this does not enable purchasing. Save this rarity profile. Keep purchases OFF and press Start universal discovery. Candidate economics and exact rejections appear directly in Trader; NOT VALUED explains unavailable evidence. Stop ends scanning. Emergency disable prevents purchase submission. Reload always disables purchases.\nPrice bands rotate across the entire native price range up to your maximum. Broad backstops, bounded native pagination and productive scope revisits remain; no fixed page is assumed newest. Fresh window is observed remaining time, not proof of listing creation or exhaustive market coverage. Comparable asks are estimates, not guaranteed realized profits. No real purchase validation was performed.\n');
console.log(out);
