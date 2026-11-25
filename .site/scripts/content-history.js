const fs = require('node:fs');
const path = require('node:path');
const { normalizeHistory } = require('../lib/content-history.cjs');

hexo.extend.filter.register('after_init', function () {
  const filename = 'content-history.pug';
  const template = fs.readFileSync(path.join(this.base_dir, 'layout', filename), 'utf8');
  this.theme.setView(filename, template);
});

// Decorate the individual reading page, leaving the source body used by search
// and the catalogue untouched.
hexo.extend.filter.register('template_locals', function (locals) {
  const page = locals.page;
  const isArticle = Boolean(page.__post);
  if (!isArticle && !(page.__page && page.type === 'work')) return locals;

  const entries = normalizeHistory(page.history, page.source);
  if (entries.length === 0) return locals;

  const body = page.content;
  // Butterfly also uses the article body as a fallback for social previews.
  if (!page.description && !page.excerpt) page.excerpt = body;
  page.content = this.theme.getView('content-history').renderSync({ body, entries, isArticle });
  return locals;
});
