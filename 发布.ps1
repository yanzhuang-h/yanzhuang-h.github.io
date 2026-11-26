param(
    [string]$Message = 'Update blog notes',
    [string[]]$Path = @(),
    [switch]$Preview
)
$ErrorActionPreference = 'Stop'
Push-Location -LiteralPath $PSScriptRoot
try {
    if (-not (Test-Path -LiteralPath '.site/node_modules')) {
        & npm.cmd --prefix '.site' ci --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { throw '网站组件安装失败。' }
    }
    $selection = '.site/tools/publish-selection.mjs'
    & node $selection preview $Message @Path
    if ($LASTEXITCODE -eq 2) { return }
    if ($LASTEXITCODE -ne 0) { throw '发布清单检查未通过。' }
    if ($Preview) { return }
    & gh auth status --hostname github.com
    if ($LASTEXITCODE -ne 0) { throw '请先运行 gh auth login --hostname github.com --git-protocol https --web --scopes workflow，在浏览器中登录，再重新发布。' }
    & npm.cmd --prefix '.site' run build
    if ($LASTEXITCODE -ne 0) { throw '网站生成失败，尚未推送。' }
    $pageType = & gh api repos/yanzhuang-h/yanzhuang-h.github.io/pages --jq '.build_type'
    if ($LASTEXITCODE -ne 0) { throw '无法读取 Pages 设置，请确认当前 GitHub 账号有此仓库的管理权限。' }
    if ($pageType.Trim() -ne 'workflow') {
        & gh api --method PUT repos/yanzhuang-h/yanzhuang-h.github.io/pages -f build_type=workflow
        if ($LASTEXITCODE -ne 0) { throw 'Pages 发布方式设置失败，尚未推送。' }
    }
    & node $selection publish $Message @Path
    if ($LASTEXITCODE -ne 0) { throw '发布未完成，请查看上方原因。' }
    Write-Host '已经上传，GitHub 正在构建。完成后访问 https://huzhuangyan.com'
    Write-Host '发布进度：https://github.com/yanzhuang-h/yanzhuang-h.github.io/actions'
} finally { Pop-Location }
