'use strict';
module.exports=async function({loadModule,assert,stubs,document,window}){
 stubs[26735]={UINotificationTypeEnum:{POSITIVE:1,NEGATIVE:2,NEUTRAL:3}};
 stubs[82125]={getCurrentTimeString:()=> '00:00:00',find:selector=>document.querySelector(selector),htmlToElement:html=>{const template=document.createElement('template');template.innerHTML=html.trim();return template.content.firstElementChild}};
 stubs[32024]={InMemoryStore:{instance:{get:key=>{if(key!=='traderSettings')throw Error('Unexpected store');return{commonSetting:{showMilliSecond:false,logTypes:['ALL']}}}}}};
 stubs[27988]={getLocalization:()=>({localizeNumber:n=>String(n),localizeAuctionTimeRemaining:n=>String(n)})};
 stubs[22869]={TraderLogType:{ALL:'ALL',INFO:'INFO',WARN:'WARN',ERROR:'ERROR',SUCCESS:'SUCCESS'}};
 stubs[44669]={translate:key=>key};
 const {Logger}=loadModule(51477);
 Logger.writeToLog('[Fresh Listing] Player: Synthetic &lt;Alpha&gt; Trade ID: 9000001 Buy Now: 75000 Remaining: 3559 Newly Discovered: TRUE Snipe Eligible: TRUE buying=DISABLED');
 await new Promise(resolve=>window.setTimeout(resolve,100));
 const message=document.querySelector('.process-log-messages .message');
 assert('exact production normal Trader Logger renders discovery diagnostics',!!message&&message.textContent.includes('Remaining: 3559')&&message.textContent.includes('buying=DISABLED'));
 assert('escaped external display text stays text in normal Trader log',message.textContent.includes('Synthetic <Alpha>')&&message.querySelector('alpha')===null);
};
