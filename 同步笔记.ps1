param([switch]$DryRun)
$ErrorActionPreference = 'Stop'
$engine = Join-Path $PSScriptRoot '.site'
if (-not (Test-Path -LiteralPath (Join-Path $engine 'node_modules'))) {
    & npm.cmd --prefix $engine ci --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw '网站组件安装失败。' }
}
$arguments = @((Join-Path $engine 'tools/import-note.mjs'), '--sync')
if ($DryRun) { $arguments += '--dry-run' }
& node @arguments
if ($LASTEXITCODE -ne 0) { throw '同步未完成，请查看上方原因。' }
