'use strict';

const { escapeHTML } = require('hexo-util');

// The recovered Markdown also serves as a record of the original publication.
hexo.extend.filter.register('after_post_render', function linkKaggleNote(post) {
  if (post.source === '_posts/31824.md') {
    const url = this.extend.helper.get('url_for').call(this, 'posts/26966.html');
    post.content = post.content.replace(
      '准备写一篇有关了解Kaggle的博客',
      `准备写一篇有关了解<a href="${url}">Kaggle</a>的博客`
    );
  }
  return post;
}, 5);

function readingAuthor(page) {
  if ((page.__post || page.__page) && typeof page.author === 'string') return page.author.trim();
}

hexo.extend.filter.register('template_locals', function (locals) {
  const author = readingAuthor(locals.page);
  if (author && !locals.page.copyright_author) locals.page.copyright_author = author;
  return locals;
});

// Butterfly reads these head tags from the blog settings. Keep the footer and
// shared theme fragments under the site owner's name.
hexo.extend.filter.register('_after_html_render', function (html, { page }) {
  const author = readingAuthor(page);
  const headEnd = html.indexOf('</head>');
  if (headEnd < 0) return html;
  let head = html.slice(0, headEnd);
  // Butterfly hints at its CDN on every page, even when MathJax is disabled.
  if (!page.mathjax) head = head.replace(/<link rel="preconnect" href="\/\/cdn\.jsdelivr\.net"\s*\/?>/, '');
  if (author) {
    head = head.replace(
      /(<meta (?:name|property)="(author|article:author|copyright)" content=")[^"]*/g,
      (_, prefix, field) => prefix + escapeHTML(field === 'copyright' ? page.copyright_author || author : author)
    );
  }
  return head + html.slice(headEnd);
});
