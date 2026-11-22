'use strict';

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
