$ErrorActionPreference = 'Stop'
Push-Location -LiteralPath (Join-Path $PSScriptRoot '.site')
try {
    if (-not (Test-Path -LiteralPath 'node_modules')) {
        & npm.cmd ci --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { throw '网站组件安装失败。' }
    }
    Write-Host '本地预览：http://127.0.0.1:4000；按 Ctrl+C 结束。'
    & npm.cmd run preview
    if ($LASTEXITCODE -ne 0) { throw '预览启动失败。' }
} finally { Pop-Location }
