param([Parameter(Mandatory=$true)][string]$Source,[Parameter(Mandatory=$true)][string]$Destination,[Parameter(Mandatory=$true)][string]$VerifyDirectory)
$ErrorActionPreference = 'Stop'
function FileHash([string]$FilePath) {
 $stream=[System.IO.File]::OpenRead($FilePath)
 $hash=[System.Security.Cryptography.SHA256]::Create()
 try { return [System.BitConverter]::ToString($hash.ComputeHash($stream)) }
 finally { $hash.Dispose(); $stream.Dispose() }
}
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression
if (-not (Test-Path -LiteralPath (Join-Path $Source 'manifest.json') -PathType Leaf)) { throw 'Root manifest.json is required' }
# Enumerate literal files: no ./ root entry, no base folder, and forward slashes
# even on Windows PowerShell's older .NET Framework.
$writer = [System.IO.Compression.ZipFile]::Open($Destination,[System.IO.Compression.ZipArchiveMode]::Create)
try {
 foreach ($file in (Get-ChildItem -LiteralPath $Source -Recurse -File | Sort-Object FullName)) {
  $relative = $file.FullName.Substring($Source.TrimEnd('\').Length + 1).Replace('\','/')
  [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($writer,$file.FullName,$relative,[System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
 }
} finally { $writer.Dispose() }
$archive = [System.IO.Compression.ZipFile]::OpenRead($Destination)
try {
 $names = @($archive.Entries | ForEach-Object { $_.FullName })
 foreach ($name in $names) {
  if ($name -match '(^/|\\|:|(^|/)\.{1,2}(/|$))') { throw "Nonportable ZIP entry: $name" }
 }
 if ($names -notcontains 'manifest.json') { throw 'ZIP root manifest missing' }
} finally { $archive.Dispose() }
[System.IO.Compression.ZipFile]::ExtractToDirectory($Destination,$VerifyDirectory)
$files = @(Get-ChildItem -LiteralPath $Source -Recurse -File)
foreach ($file in $files) {
 $relative = $file.FullName.Substring($Source.TrimEnd('\').Length + 1)
 $extracted = Join-Path $VerifyDirectory $relative
 if (-not (Test-Path -LiteralPath $extracted -PathType Leaf)) { throw "Missing file: $relative" }
 if ((FileHash $file.FullName) -ne (FileHash $extracted)) { throw "Extracted file differs: $relative" }
}
if (@(Get-ChildItem -LiteralPath $VerifyDirectory -Recurse -File).Count -ne $files.Count) { throw 'Unexpected extracted files' }
@{passed=$true;files=$files.Count;entries=$names;method='Windows .NET ZipFile; extracted SHA256 match'} | ConvertTo-Json -Depth 4 -Compress
