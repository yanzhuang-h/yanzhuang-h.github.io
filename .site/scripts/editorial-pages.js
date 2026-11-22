'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { stripHTML, unescapeHTML } = require('hexo-util');

// The original Hexo welcome and image-test pages remain reachable at their old URLs.
const utilityPosts = new Set(['posts/16107.html', 'posts/63534.html']);
const featuredPaths = ['posts/31824.html', 'posts/26966.html', 'posts/55839.html'];

function firstParagraph(html) {
  const match = String(html || '').match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
  if (!match) return '';
  const text = unescapeHTML(stripHTML(match[1])).replace(/\s+/g, ' ').trim();
  const characters = Array.from(text);
  return characters.length > 78 ? characters.slice(0, 76).join('') + '…' : text;
}

hexo.extend.filter.register('after_init', function () {
  const template = fs.readFileSync(path.join(this.base_dir, 'layout', 'editorial-pages.pug'), 'utf8');
  this.theme.setView('editorial-pages.pug', template);

  // Reuse the configured Hexo index generator for every legacy pagination route.
  const generateIndex = this.extend.generator.get('index');
  this.extend.generator.register('index', async function (locals) {
    const existing = await generateIndex.call(this, locals);
    const notes = [];
    for (const post of locals.posts.sort('-date').toArray()) {
      const url = post.path.replace(/^\/+/, '');
      if (post.published === false || utilityPosts.has(url)) continue;
      const date = post.date.clone();
      if (this.config.timezone) date.tz(this.config.timezone);
      notes.push({
        title: post.title, url, iso: date.format('YYYY-MM-DD'), year: date.format('YYYY'),
        shortDate: date.format('MM.DD'), excerpt: firstParagraph(post.content),
      });
    }

    const selected = featuredPaths.map(url => notes.find(post => post.url === url)).filter(Boolean);
    for (const note of notes) {
      if (selected.length >= 3) break;
      if (!selected.includes(note)) selected.push(note);
    }
    const years = new Map();
    for (const note of notes) {
      if (!years.has(note.year)) years.set(note.year, []);
      years.get(note.year).push(note);
    }

    const page = { aside: false, top_img: false, comments: false };
    return [
      ...existing.filter(entry => this.route.format(entry.path) !== 'index.html'),
      {
        path: 'index.html', layout: 'editorial-pages',
        data: { ...page, __index: true, current: 1, layout: 'home', type: 'editorial-home', selected },
      },
      {
        path: 'language/index.html', layout: 'editorial-pages',
        data: { ...page, title: '文字', type: 'editorial-language', count: notes.length,
          years: Array.from(years, ([year, posts]) => ({ year, posts })) },
      },
    ];
  });
});
