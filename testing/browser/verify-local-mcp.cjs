'use strict';
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..');
async function verify(name,file,args){
 const child=spawn(process.execPath,[path.join(root,'node_modules',file),...args],{cwd:root,stdio:['pipe','pipe','pipe'],windowsHide:true,env:{...process.env,CHROME_DEVTOOLS_MCP_NO_USAGE_STATISTICS:'1'}});
 let buffer='',sequence=0;const pending=new Map();
 child.stderr.resume();
 child.stdout.on('data',chunk=>{buffer+=chunk;let end;while((end=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,end);buffer=buffer.slice(end+1);let message;try{message=JSON.parse(line)}catch{continue}const waiter=pending.get(message.id);if(waiter){pending.delete(message.id);clearTimeout(waiter.timer);message.error?waiter.reject(Error(JSON.stringify(message.error))):waiter.resolve(message.result)}}});
 function request(method,params){return new Promise((resolve,reject)=>{const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(Error(name+': '+method+' timed out'));},30000);pending.set(id,{resolve,reject,timer});child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');});}
 try{
  const init=await request('initialize',{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'fc-offline-verifier',version:'1.0'}});
  child.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\n');
  const listed=await request('tools/list',{}),tool=name==='playwright'?'browser_tabs':'list_pages';
  if(!listed.tools.some(t=>t.name===tool))throw Error('Expected browser inspection tool unavailable');
  const inspected=await request('tools/call',{name:tool,arguments:name==='playwright'?{action:'list'}:{}});
  if(inspected.isError)throw Error(JSON.stringify(inspected));
  return {name,server:init.serverInfo,toolCount:listed.tools.length,browserInspectionTool:tool,browserConnected:true,passed:true};
 }finally{for(const w of pending.values())clearTimeout(w.timer);child.kill();}
}
(async()=>{let context;const profile=fs.mkdtempSync(path.join(os.tmpdir(),'fc-mcp-'));
const report={endpoint:'http://127.0.0.1:9222',liveEA:false,marketRequestsExecuted:0,servers:[]};
try{
 context=await chromium.launchPersistentContext(profile,{executablePath:process.env.CHROMIUM_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true,args:['--remote-debugging-address=127.0.0.1','--remote-debugging-port=9222','--disable-background-networking','--disable-component-update','--disable-sync','--proxy-server=http://127.0.0.1:9']});
 report.servers.push(await verify('playwright','@playwright/mcp/cli.js',['--cdp-endpoint',report.endpoint]));
 report.servers.push(await verify('chrome-devtools','chrome-devtools-mcp/build/src/bin/chrome-devtools-mcp.js',['--browserUrl',report.endpoint,'--categoryExtensions','--no-usage-statistics','--no-performance-crux']));
 report.passed=true;
}catch(e){report.passed=false;report.error=e.message;process.exitCode=1}
finally{if(context)await context.close();fs.rmSync(profile,{recursive:true,force:true});fs.writeFileSync(path.join(__dirname,'LOCAL_MCP_RESULTS.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
})();
