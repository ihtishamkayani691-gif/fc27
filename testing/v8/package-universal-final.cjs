'use strict';
// Preserve the historical archive; new deliveries use Windows-compatible paths.
require('node:child_process').execFileSync(process.execPath,[require('node:path').join(__dirname,'package-windows.cjs'),...process.argv.slice(2)],{stdio:'inherit'});
