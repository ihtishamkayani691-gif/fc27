'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
function packageWindows(source,destination){
 source=path.resolve(source);destination=path.resolve(destination);
 if(!fs.existsSync(path.join(source,'manifest.json')))throw Error('Root manifest.json is required');
 if(destination===source||destination.startsWith(source+path.sep))throw Error('ZIP must be outside the source directory');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'fc-windows-archive-'));
 try{
  const zip=path.join(temp,'extension.zip'),verify=path.join(temp,'verify');
  const result=JSON.parse(execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-File',path.join(__dirname,'package-windows.ps1'),'-Source',source,'-Destination',zip,'-VerifyDirectory',verify],{encoding:'utf8'}).trim());
  fs.mkdirSync(path.dirname(destination),{recursive:true});fs.copyFileSync(zip,destination);return result;
 }finally{fs.rmSync(temp,{recursive:true,force:true})}
}
module.exports={packageWindows};
if(require.main===module){const root=path.resolve(__dirname,'../..');const source=process.argv[2]||path.join(root,'.local/v8-universal-final'),out=process.argv[3]||path.join(root,'delivery/v8-ready-to-install/FC_Enhancer_v8_READY_TO_INSTALL.zip');console.log(JSON.stringify({destination:path.resolve(out),...packageWindows(source,out)},null,2))}
