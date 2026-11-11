import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const engine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(engine, '..');
const posts = path.join(root, 'content', '_posts');
const manifestPath = path.join(engine, 'imports.local.json');
const media = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp', '.pdf', '.mp3', '.wav', '.ogg', '.mp4', '.webm']);
const args = process.argv.slice(2);
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : { version: 1, notes: {} };
const key = p => path.resolve(p).replaceAll('\\', '/').toLowerCase();
const hash = s => crypto.createHash('sha256').update(s).digest('hex');
const inside = (base, p) => { const rel = path.relative(base, p); return rel === '' || (!rel.startsWith('..' + path.sep) && rel !== '..' && !path.isAbsolute(rel)); };
const read = p => fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '');
function frontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  return match ? { data: YAML.parse(match[1]) || {}, body: text.slice(match[0].length) } : { data: {}, body: text };
}
function findVault(source) {
  let p = path.dirname(source);
  while (true) {
    if (fs.existsSync(path.join(p, '.obsidian'))) return p;
    const next = path.dirname(p); if (next === p) return path.dirname(source); p = next;
  }
}
function transformOutsideCode(text, transform) {
  let fence = null;
  return text.split(/(?<=\n)/).map(line => {
    const match = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (match) {
      if (!fence) fence = match[1];
      else if (match[1][0] === fence[0] && match[1].length >= fence.length) fence = null;
      return line;
    }
    if (fence || /^(?:\t| {4})/.test(line)) return line;
    return line.split(/(`+[^`]*`+)/g).map((part, i) => i % 2 ? part : transform(part)).join('');
  }).join('');
}
function listFiles(dir, found = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) listFiles(p, found);
    else if (e.isFile()) found.push(p);
  }
  return found;
}

try {
  const dryRun = args.includes('--dry-run');
  const sync = args.includes('--sync');
  const vaultIndex = args.indexOf('--vault');
  if (vaultIndex >= 0 && !args[vaultIndex + 1]) throw new Error('--vault 后需要笔记库路径。');
  const sources = sync ? Object.values(manifest.notes).map(x => x.source) : args.filter((v, i) => !v.startsWith('--') && (vaultIndex < 0 || i !== vaultIndex + 1));
  if (!sources.length) throw new Error(sync ? '还没有导入过笔记。请先运行 导入笔记.ps1。' : '请提供要发布的 Markdown 文件路径。');
  const explicitVault = vaultIndex >= 0 ? fs.realpathSync(path.resolve(args[vaultIndex + 1])) : null;
  const pending = sources.map(value => {
    const source = fs.realpathSync(path.resolve(value));
    if (path.extname(source).toLowerCase() !== '.md') throw new Error('仅接受 Markdown：' + source);
    if (inside(path.join(root, 'content'), source)) throw new Error('这篇文章已在博客内，请直接编辑，无须再次导入。');
    const vault = explicitVault || manifest.notes[key(source)]?.vault || findVault(source);
    if (!inside(vault, source)) throw new Error('所选笔记不在指定笔记库中：' + source);
    const old = manifest.notes[key(source)];
    const id = old?.id || hash(path.relative(vault, source).replaceAll('\\', '/')).slice(0, 16);
    return { source, vault, id, old };
  });
  const selected = { ...manifest.notes };
  for (const note of pending) selected[key(note.source)] = note;
  const vaultIndexes = new Map();
  const plans = [];
  for (const note of pending) {
    const { source, vault, id, old } = note;
    const { data, body } = frontmatter(read(source));
    if (data.publish === false || data.draft === true) throw new Error('笔记标记为 publish: false 或 draft: true，已停止导入：' + source);
    const dest = path.join(posts, id + '.md');
    const previous = fs.existsSync(dest) ? frontmatter(read(dest)).data : {};
    if (!old && fs.existsSync(dest)) throw new Error('目标文章已存在，无法确定是否属于此笔记：' + dest);
    const metadata = {
      title: String(data.title || body.match(/^#\s+(.+)$/m)?.[1] || path.basename(source, '.md')),
      date: data.date || previous.date || new Date().toISOString(), updated: new Date().toISOString(),
      permalink: 'posts/' + id + '.html', tags: data.tags || [], categories: data.categories || [],
    };
    if (data.mathjax !== undefined) metadata.mathjax = data.mathjax;
    const assets = new Map();
    const warnings = [];
    function resolveLocal(target, allowSearch = false) {
      let decoded; try { decoded = decodeURIComponent(target); } catch { decoded = target; }
      decoded = decoded.replaceAll('\\', '/');
      const direct = path.resolve(path.dirname(source), decoded);
      const fromRoot = path.resolve(vault, decoded.replace(/^\//, ''));
      for (const p of [direct, fromRoot]) {
        if (inside(vault, p) && fs.existsSync(p) && fs.statSync(p).isFile()) {
          const real = fs.realpathSync(p);
          if (inside(fs.realpathSync(vault), real)) return real;
        }
      }
      if (allowSearch) {
        if (!vaultIndexes.has(vault)) vaultIndexes.set(vault, listFiles(vault));
        const matches = vaultIndexes.get(vault).filter(p => path.basename(p).toLowerCase() === decoded.toLowerCase());
        if (matches.length > 1) throw new Error('附件重名，请使用相对路径：' + target);
        if (matches.length === 1) return matches[0];
      }
      throw new Error('找不到附件或目标超出笔记库范围：' + target);
    }
    function asset(target, allowSearch = false) {
      if (/^(?:https?:|data:|\/\/)/i.test(target)) return target;
      const file = resolveLocal(target.split('#')[0], allowSearch);
      const ext = path.extname(file).toLowerCase();
      if (!media.has(ext)) throw new Error('不自动导入此类附件：' + target);
      const bytes = fs.readFileSync(file);
      const name = hash(bytes).slice(0, 24) + ext;
      assets.set(name, bytes);
      return '/assets/notes/' + name;
    }
    function noteLink(target, label, wiki = false) {
      if (/^(?:https?:|mailto:|tel:|\/\/|#)/i.test(target) || target.startsWith('/posts/')) return `[${label}](${target})`;
      const [name, anchor] = target.split('#');
      const wanted = /\.md$/i.test(name) ? name : name + '.md';
      let decoded; try { decoded = decodeURIComponent(wanted); } catch { decoded = wanted; }
      const direct = selected[key(path.resolve(path.dirname(source), decoded))];
      const fromRoot = selected[key(path.resolve(vault, decoded))];
      const matches = Object.values(selected).filter(n => path.basename(n.source).toLowerCase() === path.basename(decoded).toLowerCase());
      const record = direct || fromRoot || (wiki && matches.length === 1 ? matches[0] : null);
      if (!record) { warnings.push('未选中发布的笔记链接已转为文字：' + target); return label; }
      return `[${label}](/posts/${record.id}.html${anchor ? '#' + encodeURIComponent(anchor) : ''})`;
    }
    const converted = transformOutsideCode(body, part => {
      part = part.replace(/!\[\[([^\]]+)\]\]/g, (_, value) => {
        const [target, alt = path.basename(value)] = value.split('|');
        return `![${/^\d+(?:x\d+)?$/.test(alt) ? path.basename(target) : alt}](${asset(target, true)})`;
      });
      part = part.replace(/(?<!!)\[\[([^\]]+)\]\]/g, (_, value) => { const [target, alias] = value.split('|'); return noteLink(target, alias || path.basename(target).replace(/\.md$/i, ''), true); });
      part = part.replace(/(!?)\[([^\]]*)\]\((<[^>]+>|(?:[^\s()]|\([^()]*\))+)(?:\s+["']([^"']*)["'])?\)/g, (original, bang, label, value, title) => {
        const target = value.replace(/^<|>$/g, '');
        if (target.startsWith('/assets/notes/')) return original;
        if (bang) return `![${label}](${asset(target)}${title ? ' "' + title + '"' : ''})`;
        return /\.md(?:#.*)?$/i.test(target) ? noteLink(target, label) : original;
      });
      part = part.replace(/(<img\b[^>]*\bsrc=["'])([^"']+)(["'])/gi, (_, before, target, after) => before + asset(target) + after);
      return part;
    });
    // Reference-style local images must be resolved explicitly rather than silently breaking.
    if (/^ {0,3}\[[^\]]+\]:\s*(?!https?:|data:|\/\/)(\S+)/mi.test(converted)) throw new Error('含本地引用式链接，请先改成内联 Markdown 链接后导入：' + source);
    plans.push({ note, dest, assets, warnings, text: '---\n' + YAML.stringify(metadata) + '---\n\n' + converted.trimStart() });
  }
  for (const plan of plans) {
    console.log(`${dryRun ? '预检查' : '导入'}：${path.basename(plan.note.source)}；附件 ${plan.assets.size} 个`);
    for (const warning of plan.warnings) console.log('提示：' + warning);
    if (dryRun) continue;
    for (const [name, bytes] of plan.assets) {
      const folder = path.join(root, 'content', 'assets', 'notes'); fs.mkdirSync(folder, { recursive: true }); fs.writeFileSync(path.join(folder, name), bytes);
    }
    fs.mkdirSync(posts, { recursive: true }); fs.writeFileSync(plan.dest, plan.text, 'utf8');
    manifest.notes[key(plan.note.source)] = { source: plan.note.source, vault: plan.note.vault, id: plan.note.id };
  }
  if (!dryRun) fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(dryRun ? '预检查通过，未写入任何文章。' : '完成。原笔记保持原样；预览后再发布。');
} catch (err) { console.error('导入失败：' + err.message); process.exitCode = 1; }
