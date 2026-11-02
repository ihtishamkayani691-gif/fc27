'use strict';
const {spawn}=require('node:child_process'),path=require('node:path');
exports.withServer=async(name,endpoint,callback)=>{
 const root=path.resolve(__dirname,'../..'),file=name==='playwright'?'@playwright/mcp/cli.js':'chrome-devtools-mcp/build/src/bin/chrome-devtools-mcp.js';
 const args=name==='playwright'?['--cdp-endpoint',endpoint]:['--browserUrl',endpoint,'--categoryExtensions','--no-usage-statistics','--no-performance-crux'];
 const child=spawn(process.execPath,[path.join(root,'node_modules',file),...args],{cwd:root,stdio:['pipe','pipe','pipe'],windowsHide:true,env:{...process.env,CHROME_DEVTOOLS_MCP_NO_USAGE_STATISTICS:'1'}});
 let buffer='',sequence=0;const pending=new Map();child.stderr.resume();
 const rejectAll=error=>{for(const w of pending.values()){clearTimeout(w.timer);w.reject(error)}pending.clear()};
 child.on('error',rejectAll);child.on('exit',()=>rejectAll(Error('MCP server exited')));
 child.stdout.on('data',chunk=>{buffer+=chunk;let end;while((end=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,end);buffer=buffer.slice(end+1);let message;try{message=JSON.parse(line)}catch{continue}if(message.method==='roots/list'){child.stdin.write(JSON.stringify({jsonrpc:'2.0',id:message.id,result:{roots:[{uri:require('node:url').pathToFileURL(root).href,name:'FC Enhancer verified checkout'}]}})+'\n');continue}const w=pending.get(message.id);if(w){pending.delete(message.id);clearTimeout(w.timer);message.error?w.reject(Error(JSON.stringify(message.error))):w.resolve(message.result)}}});
 const request=(method,params)=>new Promise((resolve,reject)=>{const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(Error('MCP '+method+' timeout'))},60000);pending.set(id,{resolve,reject,timer});child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n')});
 try{await request('initialize',{protocolVersion:'2024-11-05',capabilities:{roots:{listChanged:false}},clientInfo:{name:'fc-validation',version:'1.0'}});child.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\n');return await callback({request,call:async(name,args={})=>{const result=await request('tools/call',{name,arguments:args});if(result.isError)throw Error(JSON.stringify(result));return result}})}
 finally{rejectAll(Error('MCP client closed'));child.kill()}
};
