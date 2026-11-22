'use strict';

const fs = require('node:fs');
const path = require('node:path');

// Only these homepage captures are part of the public history.
const captures = {
  'butterfly-5.7.2.png': '2026-11-22-butterfly/after-5.7.2.png',
  'editorial-desktop.png': '2026-11-22-editorial/desktop.png',
  'editorial-mobile.png': '2026-11-22-editorial/mobile.png',
};

hexo.extend.generator.register('evolution-images', function () {
  const history = path.resolve(hexo.base_dir, '../docs/history');
  return Object.entries(captures).map(([name, file]) => ({
    path: 'img/history/' + name,
    data: fs.readFileSync(path.join(history, file)),
  }));
});
