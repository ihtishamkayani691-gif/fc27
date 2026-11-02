'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
let api={};
try{require('../src/trader-status.js')({},api);}catch(error){if(error.code!=='MODULE_NOT_FOUND')throw error;}
class Element{
 constructor(tag){this.tagName=tag;this.children=[];this.attributes={};this.style={};this.parentNode=null;this._text='';}
 set textContent(value){this._text=String(value);this.children=[];}
 get textContent(){return this._text+this.children.map(child=>child.textContent).join('');}
 set innerHTML(value){throw Error('Unsafe HTML rendering');}
 setAttribute(name,value){this.attributes[name]=value;}
 appendChild(child){child.parentNode=this;this.children.push(child);return child;}
 insertBefore(child,before){child.parentNode=this;this.children.splice(this.children.indexOf(before),0,child);return child;}
}
function documentFixture(){const parent=new Element('div'),log=new Element('div');parent.appendChild(log);return{createElement:tag=>new Element(tag),querySelector:()=>log,parent,log};}
test('status reports native rarity, both ceilings and candidate rejection accounting',()=>{
 assert.equal(typeof api.describeStatus,'function');
 const result=api.describeStatus({state:'running',rarityLabel:'Native promo',rarityIds:[31,47],configuredMaximum:85000,effectiveMaximum:50000,freshCount:2,rejectedCount:4,rejectionReasons:{'over-maximum':3,'not-fresh':1}}).join('\n');
 for(const expected of ['Running','Native promo','31, 47','85,000','50,000','Fresh candidates: 2','Rejected candidates: 4','over-maximum: 3','not-fresh: 1','Execution: LOCKED'])assert.ok(result.includes(expected),expected);
});
test('unknown rarity remains an ID fallback and unknown ceilings remain unconfigured',()=>{
 assert.equal(typeof api.describeStatus,'function');
 const result=api.describeStatus({rarityIds:[88]}).join('\n');
 assert.match(result,/Rarity IDs: 88/);assert.match(result,/Configured maximum: Not configured/);assert.match(result,/Effective maximum: Not configured/);assert.doesNotMatch(result,/100,000|promo/i);
});
test('panel mounts once by the log and safely retains result counts after stop and error',()=>{
 assert.equal(typeof api.createStatusPanel,'function');
 const doc=documentFixture(),panel=api.createStatusPanel(doc);
 panel.mount();panel.mount();assert.equal(doc.parent.children.length,2);assert.equal(doc.parent.children[0],panel.element);
 panel.update({state:'running',freshCandidates:[{name:'<img src=x onerror=bad()>',buyNowPrice:600}],freshCount:1,rejectedCount:2,rejectionReasons:{'not-fresh':2}});
 assert.ok(panel.element.textContent.includes('<img src=x onerror=bad()>'));assert.equal(panel.element.attributes['role'],'status');
 panel.update({state:'stopped'});assert.match(panel.element.textContent,/Stopped/);assert.match(panel.element.textContent,/Fresh candidates: 1/);assert.match(panel.element.textContent,/Rejected candidates: 2/);
 panel.update({state:'error',error:'Request failed'});assert.match(panel.element.textContent,/Error/);assert.match(panel.element.textContent,/Request failed/);assert.match(panel.element.textContent,/Execution: LOCKED/);
});
