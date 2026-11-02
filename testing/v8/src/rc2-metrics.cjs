'use strict';
const samples=new Map();const clock=()=>globalThis.performance?.now?.()??Date.now();
exports.record=(name,start)=>{const values=samples.get(name)||[];values.push(Math.max(0,clock()-start));if(values.length>256)values.shift();samples.set(name,values)};
exports.clock=clock;
exports.measure=async(name,fn)=>{const start=clock();try{return await fn()}finally{exports.record(name,start)}};
exports.snapshot=()=>Object.fromEntries([...samples].map(([name,values])=>{const sorted=values.slice().sort((a,b)=>a-b),round=x=>Math.round(x*1000)/1000;return[name,{count:values.length,minMs:round(sorted[0]),medianMs:round(sorted[Math.floor(sorted.length/2)]),p95Ms:round(sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))]),maxMs:round(sorted.at(-1)),totalMs:round(values.reduce((a,b)=>a+b,0))}]}));
exports.clear=()=>samples.clear();
