# vigembus's installer, which 1up's installer carries and runs (hooks.nsh): fetched from nefarius's last release
# into src-tauri/drivers, its signature and its hash checked. ci runs it before any windows build; on a windows pc,
# run it once before `cargo test` or `pnpm tauri build`
$ErrorActionPreference = 'Stop'
$url = 'https://github.com/nefarius/ViGEmBus/releases/download/v1.22.0/ViGEmBus_1.22.0_x64_x86_arm64.exe'
# the file 1up was checked with
$sha256 = '89220A7865076B342892F98865F3499FB7C4CFD673159E89D352C360FD014C6A'
$out = Join-Path $PSScriptRoot '..\drivers\vigembus-setup.exe'

if (-not (Test-Path $out) -or (Get-FileHash $out -Algorithm SHA256).Hash -ne $sha256) {
  Invoke-WebRequest $url -OutFile $out
}
$hash = (Get-FileHash $out -Algorithm SHA256).Hash
$sig = Get-AuthenticodeSignature $out
"vigembus installer: sha256 $hash, signature $($sig.Status), $($sig.SignerCertificate.Subject)"
if ($sig.Status -ne 'Valid' -or $sig.SignerCertificate.Subject -notmatch 'Nefarius Software Solutions') {
  Remove-Item $out
  throw 'not the vigembus installer nefarius signed'
}
if ($hash -ne $sha256) {
  Remove-Item $out
  throw "not the vigembus installer 1up was checked with: sha256 $hash"
}
