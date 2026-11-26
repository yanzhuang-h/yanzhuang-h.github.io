'use strict';

const { escapeHTML, full_url_for, url_for } = require('hexo-util');

// These two paths were linked by the six original Python articles.
const oldCategories = [
  ['categories/python/', 'python'],
  ['categories/python/数据分析/', '数据分析'],
];

hexo.extend.generator.register('legacy-topic-links', function (locals) {
  const categories = new Set(locals.categories.filter(category => category.length).map(category => category.path));
  return oldCategories.filter(([path]) => !categories.has(path)).map(([path, name]) => {
    const tag = locals.tags.findOne({ name });
    const target = tag?.path || this.config.tag_dir + '/';
    const href = escapeHTML(url_for.call(this, target));
    const canonical = escapeHTML(full_url_for.call(this, target));
    return {
      path: path + 'index.html',
      data: '<!doctype html><html lang="zh-CN"><meta charset="utf-8">' +
        '<title>' + name + '</title><link rel="canonical" href="' + canonical + '">' +
        '<meta http-equiv="refresh" content="0;url=' + href + '">' +
        '<a href="' + href + '">查看' + name + '主题文章</a></html>',
    };
  });
});
