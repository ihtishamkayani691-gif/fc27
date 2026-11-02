'use strict';
// Factory 99015. The adapter supplies snapshots on its existing lifecycle.
module.exports=function(module,exports){
 const number=value=>Number.isSafeInteger(value)&&value>=0?value.toLocaleString('en-US'):null;
 const maximum=value=>Number.isSafeInteger(value)&&value>0?number(value):'Not configured';
 exports.describeStatus=(snapshot={})=>{
  const ids=Array.isArray(snapshot.rarityIds)?snapshot.rarityIds.map(String).join(', '):'';
  const state={running:'Running',stopped:'Stopped',error:'Error'}[snapshot.state]||'Stopped';
  const candidates=Array.isArray(snapshot.freshCandidates)?snapshot.freshCandidates:[];
  const lines=[state+' · Execution: LOCKED',
   snapshot.rarityLabel?'Active rarity: '+String(snapshot.rarityLabel):'Active rarity: '+(ids?'Rarity IDs: '+ids:'Not selected')];
  if(snapshot.rarityLabel)lines.push('Rarity IDs: '+(ids||'None'));
  lines.push('Configured maximum: '+maximum(snapshot.configuredMaximum)+' · Effective maximum: '+maximum(snapshot.effectiveMaximum));
  lines.push('Fresh candidates: '+(number(snapshot.freshCount)??number(candidates.length))+' · Rejected candidates: '+(number(snapshot.rejectedCount)??'0'));
  const reasons=snapshot.rejectionReasons&&typeof snapshot.rejectionReasons==='object'?Object.entries(snapshot.rejectionReasons).filter(([,count])=>Number.isSafeInteger(count)&&count>0):[];
  lines.push('Rejection reasons: '+(reasons.length?reasons.map(([reason,count])=>String(reason)+': '+number(count)).join(' · '):'None'));
  if(candidates.length)lines.push('Fresh: '+candidates.slice(0,5).map(candidate=>String(candidate.name||'Unnamed player')+(number(candidate.buyNowPrice)!==null?' ('+number(candidate.buyNowPrice)+')':'')).join(' · ')+(candidates.length>5?' · …':''));
  if(snapshot.state==='error'&&snapshot.error)lines.push('Error: '+String(snapshot.error));
  return lines;
 };
 exports.createStatusPanel=document=>{
  const element=document.createElement('section');
  element.className='fc-v8-trader-status';
  element.setAttribute('role','status');element.setAttribute('aria-live','polite');element.setAttribute('aria-label','Trader v8 validation status');
  Object.assign(element.style,{padding:'8px 10px',margin:'6px 0',border:'1px solid currentColor',borderRadius:'4px',fontSize:'12px',lineHeight:'1.45',overflowWrap:'anywhere',whiteSpace:'normal'});
  let snapshot={state:'stopped'};
  const update=partial=>{
   snapshot={...snapshot,...partial};element.textContent='';
   const heading=document.createElement('strong');heading.textContent='Trader · v8 TEST';element.appendChild(heading);
   for(const line of exports.describeStatus(snapshot)){const row=document.createElement('div');row.textContent=line;element.appendChild(row);}
   return element;
  };
  const mount=nearLog=>{
   const log=nearLog||document.querySelector('.process-log-messages');
   if(log?.parentNode&&element.parentNode!==log.parentNode)log.parentNode.insertBefore(element,log);
   return element;
  };
  update({});return{element,update,mount};
 };
};
