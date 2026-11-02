'use strict';
module.exports=function(module,exports){
 exports.createControls=(document,api)=>{
  const root=document.createElement('section');root.className='fc-v8-rc-controls';root.setAttribute('aria-label','RC purchase controls');
  Object.assign(root.style,{padding:'10px',border:'2px solid #c8a643',margin:'6px 0',fontSize:'12px'});
  const heading=document.createElement('strong');heading.textContent='RC1 · Purchases OFF by default';root.appendChild(heading);
  const budgetLabel=document.createElement('label');budgetLabel.textContent=' Coin budget for this run: ';const budget=document.createElement('input');budget.type='number';budget.min='1';budget.step='1';budget.value='';budget.setAttribute('aria-label','RC run coin budget');budgetLabel.appendChild(budget);root.appendChild(budgetLabel);
  const label=document.createElement('label');const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=false;checkbox.setAttribute('aria-label','Enable RC purchases for next Trader run');label.appendChild(checkbox);label.appendChild(document.createTextNode(' Enable purchases for next Trader run'));root.appendChild(label);
  const explanation=document.createElement('div');explanation.textContent='RC is not production-verified. Requires your price, native dynamic pricing and card budget. Stop, errors, settings changes and reload disable purchases.';root.appendChild(explanation);
  const message=document.createElement('div');message.setAttribute('role','status');root.appendChild(message);let processor;
  const refresh=()=>{if(!processor)return;const s=api.status(processor);checkbox.checked=s.enabled;checkbox.disabled=processor.isStarted||s.reconciliationRequired;budget.disabled=processor.isStarted;message.textContent='Execution: '+(s.reconciliationRequired?'RECONCILIATION REQUIRED':s.enabled?s.inFlight?'EXECUTING':'USER ENABLED':'DISABLED')+' · '+s.reason+' · Spent '+s.spent+' / '+s.budget;};
  checkbox.addEventListener('change',event=>{if(!processor)return;if(event.isTrusted!==true){api.disarm(processor,'trusted-user-action-required');refresh();return}if(checkbox.checked){const result=api.arm(processor,{userEnabled:true,budget:Number(budget.value)});refresh();if(!result.response)message.textContent='Execution: DISABLED · '+result.reason}else api.disarm(processor,'user-disabled');refresh()});
  budget.addEventListener('change',()=>{if(processor)api.disarm(processor,'budget-changed');refresh()});
  document.addEventListener('change',()=>{Promise.resolve().then(refresh)},{passive:true});
  document.defaultView?.addEventListener('pagehide',()=>{if(processor)api.disarm(processor,'reload')});
  const mount=(p,near)=>{if(processor&&processor!==p)api.disarm(processor,'controller-changed');processor=p;if(near?.parentNode&&root.parentNode!==near.parentNode)near.parentNode.insertBefore(root,near);refresh()};
  return{element:root,mount,refresh};
 };
};
