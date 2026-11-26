import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import YAML from 'yaml';
import { transformOutsideCode } from '../lib/markdown-text.mjs';

// 发布.ps1 runs this at the root of the site repository.
const git = (...args) => execFileSync('git', ['--literal-pathspecs', ...args], {encoding: 'utf8', maxBuffer: 32 * 1024 * 1024});
const names = output => output.split('\0').filter(Boolean);
const root = fs.realpathSync(process.cwd());

function checkPublicPath(file) {
  if (/(?:^|\/)(?:_drafts|\.obsidian)(?:\/|$)|^本机资料(?:\/|$)|^\.site\/(?:[^/]*\.local\.json$|db\.json$|public(?:\/|$))/i.test(file)) {
    throw new Error('本地资料不能发布：' + file);
  }
}

function checkMarkdown(file, text, publicFiles) {
  const header = text.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  const data = header && YAML.parse(header[1]);
  if (data?.draft === true || data?.publish === false || data?.published === false) {
    throw new Error('文件明确标为草稿或不公开：' + file);
  }
  if (!publicFiles) return;
  transformOutsideCode(text, part => {
    for (const [, asset] of part.matchAll(/(?:\]\(<?|\b(?:src|href)=["'])\/assets\/notes\/([0-9a-f]{24}\.[a-z0-9]+)/gi)) {
      const assetPath = 'content/assets/notes/' + asset;
      if (!publicFiles.has(assetPath)) throw new Error('请核对并在 -Path 中加入这份附件：' + assetPath);
    }
    return part;
  });
}

const isMarkdown = file => /\.(?:md|markdown)$/i.test(file);

function selectFiles(inputs) {
  const tracked = new Set(names(git('ls-tree', '-rz', '--name-only', 'HEAD')));
  const selected = new Set();
  for (const input of inputs) {
    const absolute = path.resolve(root, input);
    const file = path.relative(root, absolute).split(path.sep).join('/');
    if (!file || file === '..' || file.startsWith('../') || path.isAbsolute(file)) throw new Error('请选择网站仓库内的具体文件：' + input);
    checkPublicPath(file);
    if (fs.existsSync(absolute)) {
      if (!fs.lstatSync(absolute).isFile() || fs.realpathSync(absolute).toLowerCase() !== absolute.toLowerCase()) {
        throw new Error('请选择真实文件，目录或链接不能作为发布清单：' + input);
      }
    } else if (!tracked.has(file)) {
      throw new Error('文件不存在：' + file);
    }
    selected.add(file);
  }
  const publicFiles = new Set(tracked);
  for (const file of selected) {
    if (fs.existsSync(file)) publicFiles.add(file);
    else publicFiles.delete(file);
  }
  for (const file of selected) {
    if (isMarkdown(file) && fs.existsSync(file)) {
      checkMarkdown(file, fs.readFileSync(file, 'utf8'), file.startsWith('content/') ? publicFiles : undefined);
    }
  }
  return [...selected];
}

// All commits sent to a public repository can be read, including an earlier
// commit which added a draft that was deleted in a later commit.
function reviewCommits(head) {
  const commits = git('rev-list', '--reverse', 'origin/main..' + head).trim().split(/\s+/).filter(Boolean);
  for (const commit of commits) {
    const changed = names(git('diff-tree', '-m', '--root', '--no-commit-id', '--no-renames', '--diff-filter=ACMT',
      '--name-only', '-r', '-z', commit));
    for (const file of new Set(changed)) {
      checkPublicPath(file);
      if (isMarkdown(file)) checkMarkdown(file, git('show', commit + ':' + file));
    }
    console.log(git('-c', 'core.quotepath=false', 'show', '--format=%h %s', '--name-status', '--no-renames', commit).trim());
  }
  return commits.length;
}

try {
  const [mode, message, ...inputs] = process.argv.slice(2);
  if (!['preview', 'publish'].includes(mode)) throw new Error('请选择预览或发布。');
  if (mode === 'publish') {
    git('fetch', '--no-tags', 'origin', 'refs/heads/main:refs/remotes/origin/main');
    if (git('rev-list', '-1', 'HEAD..origin/main').trim()) throw new Error('远端 main 有新的提交，请先合并后再发布。');
  }
  const selected = selectFiles(inputs);
  for (const file of names(git('diff', '--cached', '--no-renames', '--diff-filter=ACMT', '--name-only', '-z'))) {
    checkPublicPath(file);
  }
  const pending = reviewCommits('HEAD');
  for (const file of selected) console.log((fs.existsSync(file) ? '选入：' : '删除：') + file);
  if (!pending && !selected.length) {
    console.log('没有待推送的提交。请用 -Path 指定本次文章和附件，可加 -Preview 先查看清单。');
    process.exitCode = 2;
  } else if (mode === 'publish') {
    if (selected.length) {
      git('add', '--', ...selected);
      if (git('diff', '--cached', '--name-only', '-z', '--', ...selected)) {
        // Other staged work may belong to a different release.
        git('commit', '--only', '-m', message, '--', ...selected);
      }
    }
    const head = git('rev-parse', 'HEAD').trim();
    if (reviewCommits(head)) {
      git('-c', 'http.sslBackend=openssl', 'push', 'origin', head + ':refs/heads/main');
    }
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
