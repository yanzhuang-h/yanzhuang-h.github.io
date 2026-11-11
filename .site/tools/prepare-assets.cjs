const fs = require('node:fs');
const path = require('node:path');
const engine = path.resolve(__dirname, '..');
const from = path.join(engine, 'node_modules', '@fortawesome', 'fontawesome-free');
const to = path.resolve(engine, '..', 'content', 'vendor', 'fontawesome');
fs.mkdirSync(path.join(to, 'css'), { recursive: true });
fs.copyFileSync(path.join(from, 'css', 'all.min.css'), path.join(to, 'css', 'all.min.css'));
const fonts = path.join(to, 'webfonts');
fs.mkdirSync(fonts, { recursive: true });
for (const name of fs.readdirSync(path.join(from, 'webfonts'))) {
  fs.copyFileSync(path.join(from, 'webfonts', name), path.join(fonts, name));
}
fs.copyFileSync(path.join(from, 'LICENSE.txt'), path.join(to, 'LICENSE.txt'));
