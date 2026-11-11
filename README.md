# Zoney的窄门

网站地址：https://yanzhuang-h.github.io

本项目恢复自旧网站，继续使用 Hexo 和 Butterfly。`content/_posts` 中的 17 篇旧文由已发布 HTML 转回 Markdown，保留原文章地址，309 个代码块与网页中的代码逐一核对一致。文章里的旧知识内容未改写。原图片外链仍保留，可能存在已经失效的图床图片。

## 日常使用

在 Obsidian 中打开 `blogs/content/_posts` 下的文章，或用 Typora 直接编辑这些 `.md` 文件。把新文件放入这个目录表示选择将其用于博客；`content` 中其他普通文件也会作为网站资源构建，所以请把它作为专门的公开内容目录。

其他位置的笔记可以按文件导入，也可以多选；原文件保持原样。只会复制选中的 Markdown 和它引用的受支持图片、PDF、音视频附件，不会复制笔记库其他文章。导入会在本地记录所选文件，便于后续同步更新。

在此文件夹打开 PowerShell，运行：

```powershell
# 先预检查，不写入文章
powershell -ExecutionPolicy Bypass -File .\导入笔记.ps1 -Path 'D:\笔记目录\某篇笔记.md' -DryRun

# 导入选中的文章和附件
powershell -ExecutionPolicy Bypass -File .\导入笔记.ps1 -Path 'D:\笔记目录\某篇笔记.md'

# 原笔记有修改后，刷新曾经导入的文章
powershell -ExecutionPolicy Bypass -File .\同步笔记.ps1

# 启动本地预览，打开 http://127.0.0.1:4000
powershell -ExecutionPolicy Bypass -File .\预览.ps1

# 发布到 GitHub，随后由 GitHub Actions 自动更新网站
powershell -ExecutionPolicy Bypass -File .\发布.ps1
```

导入后在本地预览，确认文章内容后再发布。`publish: false` 或 `draft: true` 的外部笔记会被导入工具拒绝。这个标记用于防止误导入；直接在 `content/_posts` 中创建的文章由 Hexo 规则处理，草稿应放入 `content/_drafts`。

## Obsidian 格式支持

- 普通 Markdown、代码块、表格和标准图片链接。
- `![[图片.png]]` 会复制图片，转换成网站图片链接。
- `[[另一篇笔记]]` 只链接到已选中导入的笔记；未选中或重名无法定位时转成文字并提示。后续导入目标笔记后，再运行同步可以补齐链接。
- 两篇互相引用的笔记可通过 `-Path` 数组一起导入。
- `![[另一篇笔记]]` 这种整篇嵌入暂不支持，会报错停止导入，请先展开正文。
- 本地引用式链接应先改为内联链接，例如 `![说明](images/a.png)`。其他 Obsidian 插件语法、Dataview 和动态查询不会自动转换。
- 手动复制文章到 `content/_posts` 时，也需要复制图片并修正路径；推荐使用导入工具处理附件。
- 直接编辑博客里的副本后再同步，副本会被原笔记覆盖；每篇文章请选择一个主要编辑位置。

## 第一次发布

需要 Node.js 22 或更新版本、Git、GitHub CLI。网站运行文件放在 `.site`，Obsidian 通常不会将隐藏目录作为笔记显示。

目前本机之前保存的 GitHub 登录已失效，需要在终端运行下面的命令，并在浏览器完成 GitHub 登录；不要把密码或令牌写进文章或发送到聊天：

```powershell
gh auth login --hostname github.com --git-protocol https --web
gh auth setup-git
```

发布脚本会先生成网站，再把现有 Pages 的发布方式切换为 GitHub Actions，推送源文件到原仓库的 `main`。源仓库保留旧网站的 Git 历史，推送不使用强制覆盖。页面是否成功上线需要查看 Actions 的最终结果。

如果 Pages 环境限制了可发布分支，请在仓库 Settings → Environments → github-pages 中允许 `main`。

## 目录

- `content/_posts`：公开文章，日常编辑位置。
- `content/_drafts`：未发布草稿，可以自行创建。
- `content/assets/notes`：导入时复制的公开附件。
- `content/img`：旧站本地图像。
- `.site`：网站配置、运行组件、本地同步记录与生成结果。
- `.github/workflows/pages.yml`：推送后的自动发布流程。

`.site/imports.local.json` 只在本机保存原笔记路径，并已排除 Git 上传。源文件本身和选中发布的内容会提交到公开 GitHub 仓库。

## CSDN

待迁移主页：https://blog.csdn.net/m0_64615322

当前公开页面和文章列表读取失败，尚未抓取或迁移 CSDN 文章。已有本地 Markdown 的文章可直接通过导入工具迁入；仅在 CSDN 保存的文章需要通过可正常访问的浏览器或后台导出取得原文，再处理图片和去重。
