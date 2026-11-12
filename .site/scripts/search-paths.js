'use strict';

// Hexo 8 may expose a leading slash in post.path. SearchDB also prefixes
// config.root, producing //posts/... links that browsers treat as another host.
hexo.extend.filter.register('after_generate', async function () {
  const search = hexo.config.search;
  if (!search || !search.path || !search.path.endsWith('.xml')) return;
  const stream = hexo.route.get(search.path);
  if (!stream) return;
  let xml = '';
  for await (const chunk of stream) xml += chunk.toString();
  const fixed = xml.replace(/<url>\/{2,}/g, '<url>/');
  if (fixed !== xml) hexo.route.set(search.path, fixed);
});
