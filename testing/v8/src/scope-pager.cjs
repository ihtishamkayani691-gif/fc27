'use strict';
// Uses the native page argument; never constructs an offset or EA endpoint.
class ScopePager{
 constructor(limit=20){if(!Number.isSafeInteger(limit)||limit<1||limit>100)throw Error('invalid-native-page-budget');this.limit=limit;this.ceiling=limit;this.cooldown=0;this.page=1;this.base=null;this.stride=null;this.count=null;this.signatures=new Map();this.reason='baseline';}
 reject(){this.ceiling=Math.min(this.ceiling,Math.max(1,this.page-1));this.page=1;this.reason='native-page-access-unverified';return false;}
 accept({wire,ids,canSplit}){
  const page=this.page,count=wire.fields?.num??wire.fields?.count;
  const observed=['xhr','fetch'].includes(wire.transport)&&wire.status>=200&&wire.status<300&&Number.isSafeInteger(wire.offset)&&wire.offset>=0&&Number.isSafeInteger(count)&&count>0;
  const signature=ids.slice().sort().join(',');
  if(page===1){this.signatures.clear();this.base=observed?wire.offset:null;this.count=observed?count:null;}
  else{
   if(!observed||this.base===null||count!==this.count||[...this.signatures.values()].includes(signature)&&ids.length)return this.reject();
   if(page===2){if(wire.offset<=this.base)return this.reject();this.stride=wire.offset-this.base;}
   else if(!this.stride||wire.offset!==this.base+(page-1)*this.stride)return this.reject();
  }
  if(ids.length)this.signatures.set(page,signature);
  if(!ids.length){this.cooldown=3;this.page=1;this.reason='successful-empty-page-inconclusive';return true;}
  const full=observed&&ids.length>=count;
  const cooling=this.cooldown>0;if(cooling)this.cooldown--;
  this.page=full&&!canSplit&&!cooling&&page<this.ceiling?page+1:1;
  this.reason=this.page>page?'native-sequential-page-probe':'bounded-scope-refresh';return true;
 }
}
module.exports={ScopePager};
