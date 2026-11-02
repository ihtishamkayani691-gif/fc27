'use strict';
// Uses the native page argument; never constructs an offset or EA endpoint.
class ScopePager{
 constructor(limit=20,{seekFresh=false}={}){if(!Number.isSafeInteger(limit)||limit<1||limit>100)throw Error('invalid-native-page-budget');this.limit=limit;this.ceiling=limit;this.cooldown=0;this.page=1;this.base=null;this.stride=null;this.count=null;this.signatures=new Map();this.reason='baseline';this.seekFresh=seekFresh;this.missing=[];this.high=1;this.seekDone=false;this.freshAnchor=null;}
 reject(){this.ceiling=Math.min(this.ceiling,Math.max(1,this.page-1));this.page=1;this.reason='native-page-access-unverified';return false;}
 accept({wire,ids,canSplit,maxRemaining}){
  const page=this.page,count=wire.fields?.num??wire.fields?.count;
  const observed=['xhr','fetch'].includes(wire.transport)&&wire.status>=200&&wire.status<300&&Number.isSafeInteger(wire.offset)&&wire.offset>=0&&Number.isSafeInteger(count)&&count>0;
  const signature=ids.slice().sort().join(',');
  if(page===1){this.signatures.clear();this.base=observed?wire.offset:null;this.count=observed?count:null;this.missing=[];this.high=1;this.seekDone=false;}
  else{
   if(!observed||this.base===null||count!==this.count||[...this.signatures.values()].includes(signature)&&ids.length)return this.reject();
   if(page===2){if(wire.offset<=this.base)return this.reject();this.stride=wire.offset-this.base;}
   else if(!this.stride||wire.offset!==this.base+(page-1)*this.stride)return this.reject();
  }
  this.missing=this.missing.filter(queued=>queued!==page);
  if(ids.length)this.signatures.set(page,signature);
  if(!ids.length){this.cooldown=3;this.seekDone=true;this.page=this.seekFresh&&this.missing.length?this.missing.shift():1;this.reason='successful-empty-page-inconclusive';return true;}
  const full=observed&&ids.length>=count;
  if(this.seekFresh&&observed&&Number.isFinite(maxRemaining)&&this.ceiling>2){
   this.high=Math.max(this.high,page);
   if(maxRemaining>=3540&&maxRemaining<=3600){this.seekDone=true;this.freshAnchor=page;}
   let next;
   if(full&&page<this.ceiling&&!this.seekDone){
    next=page===1?2:Math.min(this.ceiling,this.freshAnchor>page?this.freshAnchor:page*2);
    for(let skipped=page+1;skipped<next;skipped++)if(!this.signatures.has(skipped)&&!this.missing.includes(skipped))this.missing.push(skipped);
   }else{
    this.seekDone=true;
    // Alternate verified frontier probes with skipped-page coverage. Empty
    // pages are inconclusive; finish skipped pages before refreshing scope.
    if(this.missing.length&&(page===this.high||!full||this.high>=this.ceiling))next=this.missing.shift();
    else if(full&&this.high<this.ceiling)next=this.high+1;
    else next=this.missing.shift()||1;
   }
   this.page=next;this.reason=this.seekDone?'fresh-frontier-and-skipped-page-coverage':'evidence-checked-fresh-window-seek';return true;
  }
  const cooling=this.cooldown>0;if(cooling)this.cooldown--;
  this.page=full&&!canSplit&&!cooling&&page<this.ceiling?page+1:1;
  this.reason=this.page>page?'native-sequential-page-probe':'bounded-scope-refresh';return true;
 }
}
module.exports={ScopePager};
