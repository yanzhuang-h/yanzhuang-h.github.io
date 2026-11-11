param([string]$Message = 'Update blog notes')
$ErrorActionPreference = 'Stop'
Push-Location -LiteralPath $PSScriptRoot
try {
    & gh auth status --hostname github.com
    if ($LASTEXITCODE -ne 0) { throw '请先运行 gh auth login --hostname github.com --git-protocol https --web --scopes workflow，在浏览器中登录，再重新发布。' }
    if (-not (Test-Path -LiteralPath '.site/node_modules')) {
        & npm.cmd --prefix '.site' ci --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { throw '网站组件安装失败。' }
    }
    & npm.cmd --prefix '.site' run build
    if ($LASTEXITCODE -ne 0) { throw '网站生成失败，尚未推送。' }
    $pageType = & gh api repos/yanzhuang-h/yanzhuang-h.github.io/pages --jq '.build_type'
    if ($LASTEXITCODE -ne 0) { throw '无法读取 Pages 设置，请确认当前 GitHub 账号有此仓库的管理权限。' }
    if ($pageType.Trim() -ne 'workflow') {
        & gh api --method PUT repos/yanzhuang-h/yanzhuang-h.github.io/pages -f build_type=workflow
        if ($LASTEXITCODE -ne 0) { throw 'Pages 发布方式设置失败，尚未推送。' }
    }
    & git add --all -- content .site .github .gitignore README.md *.ps1
    if ($LASTEXITCODE -ne 0) { throw '无法暂存博客文件。' }
    & git diff --cached --quiet
    if ($LASTEXITCODE -eq 1) {
        & git commit -m $Message
        if ($LASTEXITCODE -ne 0) { throw '保存版本失败，请检查 Git 的用户名和邮箱设置。' }
    } elseif ($LASTEXITCODE -ne 0) { throw '无法检查待发布改动。' }
    & git -c http.sslBackend=openssl push origin HEAD:main
    if ($LASTEXITCODE -ne 0) { throw '上传失败，网站尚未更新。若远端有新改动，请先处理差异；不要强制推送。' }
    Write-Host '已经上传，GitHub 正在构建。完成后访问 https://yanzhuang-h.github.io'
    Write-Host '发布进度：https://github.com/yanzhuang-h/yanzhuang-h.github.io/actions'
} finally { Pop-Location }
