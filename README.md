# Zoney的窄门

网站地址：https://huzhuangyan.com

本项目恢复自旧网站。当前使用 Hexo 8.1.2 和 Butterfly 5.7.2。`content/_posts` 中的 17 篇旧文由已发布 HTML 转回 Markdown，保留原文章地址，309 个代码块与网页中的代码逐一核对一致。文章里的旧知识内容未改写。原图片外链仍保留，可能存在已经失效的图床图片。

[2026-11-22 主题升级与首页对照](docs/history/2026-11-22-butterfly/README.md)

## 日常使用

在网站工程的 `content/_posts` 中编辑公开文章，Obsidian 和 Typora 都可以打开这些 Markdown 文件。把新文件放入这个目录表示选择将其用于博客；`content` 中其他普通文件也会作为网站资源构建，所以请把它作为专门的公开内容目录。

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

# 在 PowerShell 中列出这次要公开的文件。附件填写实际导入后生成的路径。
$files = @('content/_posts/文章编号.md', 'content/assets/notes/附件编号.png')
.\发布.ps1 -Path $files -Preview
.\发布.ps1 -Path $files
```

导入后在本地预览，确认文章内容后再发布。导入器目前也接受缺少发布标记的笔记，连接私人笔记库前需要先落实逐篇公开与附件选择。导入工具会拒绝 `_drafts` 目录内的笔记，以及标记了 `publish: false`、`published: false` 或 `draft: true` 的笔记。这个标记用于防止误导入；直接在 `content/_posts` 中创建的文章由 Hexo 规则处理，草稿应放入 `content/_drafts`。

## Obsidian 格式支持

- 普通 Markdown、代码块、表格和标准图片链接。
- `![[图片.png]]` 会复制图片，转换成网站图片链接。
- `[[另一篇笔记]]` 只链接到已选中导入的笔记；未选中或重名无法定位时转成文字并提示。后续导入目标笔记后，再运行同步可以补齐链接。
- 两篇互相引用的笔记可通过 `-Path` 数组一起导入。
- `![[另一篇笔记]]` 这种整篇嵌入暂不支持，会报错停止导入，请先展开正文。
- 本地引用式链接应先改为内联链接，例如 `![说明](images/a.png)`。其他 Obsidian 插件语法、Dataview 和动态查询不会自动转换。
- 手动复制文章到 `content/_posts` 时，也需要复制图片并修正路径；推荐使用导入工具处理附件。
- 直接编辑博客里的副本后再同步，副本会被原笔记覆盖；每篇文章请选择一个主要编辑位置。

## 文字目录的体裁和主题

`/language/` 按首发时间列出所有读者文章。选定体裁后仍可按年份查阅。随笔、小说、诗歌、日记、笔记各自有第一篇公开文章时，对应入口才会出现。

导入选中的 Obsidian 文章时，工具会从主库的 `language/体裁名/` 识别体裁。在其他目录写作，或想为网站单独指定体裁，可在原稿文件头填写 `categories: [随笔]`。直接在网站工程中写作也用这个字段。主题填在 `tags`，例如一篇学习笔记可以同时填写 `categories: [笔记]` 和 `tags: [数据分析]`。含有需要排版的数学公式时，在同一处填写 `mathjax: true`。

## 写一条公开的更新记录

在 Markdown 原稿顶部的两行 `---` 之间添加 `history`。文字页用它生成「修订记录」，作品页用它生成「创作记录」。在 Obsidian 中可切换到源码模式，照这个例子填写。

```yaml
history:
  - date: '2026-11-22'
  - date: '2026-11-23'
    note: 补上了改版前后的首页对照。
    links:
      - text: 看两个版本的首页
        url: /evolution/
```

每条只需 `date`，按年、月、日填写。`note` 和 `links` 都可省略。链接可用以 `/` 开头的站内地址或完整的 HTTP、HTTPS 网址。页面按日期从早到晚排列，同一天有多条时沿用原稿中的先后顺序。

文章首次发表时保留原有发布日期。第一次想公开修订时，再写入第一条 `history`。最近修订日期来自这些记录，点击可展开文末记录。通过 Obsidian 同步文章时，直接编辑原笔记即可。

准备好发布一件作品时，在 `content/works/作品短名/index.md` 的文件头填写 `title`、`type: work`，在正文写作品介绍。填入同样的 `history` 后，作品正文下方会完整列出记录。提到网站改版时可以链接「达尔文」，发布视频后可以直接链接成片。

## 第一次发布

需要 Node.js 22 或更新版本、Git、GitHub CLI。网站运行文件放在 `.site`，Obsidian 通常不会将隐藏目录作为笔记显示。

首次发布需要登录 GitHub。如果以后登录失效，可以在终端运行下面的命令，并在浏览器完成登录；不要把密码或令牌写进文章或发送到聊天：

```powershell
gh auth login --hostname github.com --git-protocol https --web --scopes workflow
gh auth setup-git
```

发布脚本会先生成网站，再把现有 Pages 的发布方式切换为 GitHub Actions，推送源文件到原仓库的 `main`。源仓库保留旧网站的 Git 历史，推送不使用强制覆盖。页面是否成功上线需要查看 Actions 的最终结果。

每次发布的 `-Path` 都填具体文件；只有文章时可只填一个路径。清单会显示完整文件和本地已有的待推送提交。新导入的图片、PDF 等附件也需逐项选入；修改或删除的文件同样可以点名。运行 `.\发布.ps1` 会检查并推送已有提交，保留其他正在编辑和暂存的内容。脚本会检查待推送提交的历史，拦下草稿目录、本机资料与标为私密的内容，即使某份草稿随后又从网站工程中删除。

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

## 自定义域名

主域名为 `huzhuangyan.com`，`www.huzhuangyan.com` 由 GitHub Pages 自动跳转至主域名。

阿里云解析中，根域名 `@` 使用四条 A 记录：`185.199.108.153`、`185.199.109.153`、`185.199.110.153`、`185.199.111.153`；`www` 使用 CNAME 记录指向 `yanzhuang-h.github.io`。GitHub 账户验证使用的 `_github-pages-challenge-yanzhuang-h` TXT 记录应长期保留。

本项目通过 GitHub Actions 发布，域名绑定在仓库 Settings → Pages 中设置；单独放置 CNAME 文件不能代替这里的设置。域名绑定和解析生效后，还需确认 HTTPS 证书签发并启用 Enforce HTTPS。
