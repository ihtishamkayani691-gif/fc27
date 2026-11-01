const fs = require('node:fs');
const vm = require('node:vm');
function load(file, globals={}) {
 const s=fs.readFileSync(file,'utf8');
 const end=s.indexOf(',i={};function r(e)');
 if(end<0) throw Error('Unsupported bundle');
 const context=vm.createContext({console, Date, Map, Set, ...globals});
 vm.runInContext(s.slice(0,end)+';globalThis.modules=a;})();',context);
 return {modules:context.modules,context};
}
function moduleExports(modules,id,stubs={}) {
 const e={exports:{}};
 modules[id](e,e.exports,n=>{if(!(n in stubs))throw Error('Missing dependency '+n+' for '+id);return stubs[n]});
 return e.exports;
}
module.exports={load,moduleExports};
