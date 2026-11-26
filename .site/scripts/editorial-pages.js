'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { stripHTML, unescapeHTML } = require('hexo-util');
const { writingGenres } = require('../lib/writing-genres.cjs');

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

function byYear(notes) {
  const years = new Map();
  for (const note of notes) {
    if (!years.has(note.year)) years.set(note.year, []);
    years.get(note.year).push(note);
  }
  return Array.from(years, ([year, posts]) => ({ year, posts }));
}

function relatedTopics(notes, tags) {
  const ids = new Set(notes.map(note => note.id));
  const topics = tags.map(tag => {
    const posts = tag.posts.map(post => post._id).sort();
    return { name: tag.name, url: tag.path, posts, count: posts.filter(id => ids.has(id)).length };
  }).filter(topic => topic.count);
  // These two tags originally annotated every chapter of the same Python series.
  const python = topics.find(topic => topic.name === 'python');
  const analysis = topics.find(topic => topic.name === '数据分析');
  if (python && analysis && python.posts.length === analysis.posts.length
    && python.posts.every((id, i) => id === analysis.posts[i])) {
    analysis.name = 'Python 数据分析';
    topics.splice(topics.indexOf(python), 1);
  }
  return topics.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'));
}

hexo.extend.filter.register('after_init', function () {
  const template = fs.readFileSync(path.join(this.base_dir, 'layout', 'editorial-pages.pug'), 'utf8');
  this.theme.setView('editorial-pages.pug', template);

  // Post bylines and the category index link to the same catalogue as the genre navigation.
  const genreSlugs = Object.fromEntries(writingGenres.map(({ name, slug }) => [name, slug]));
  Object.assign(this.config.category_map, genreSlugs);
  const generateCategories = this.extend.generator.get('category');
  this.extend.generator.register('category', function (locals) {
    const categories = locals.categories.filter(category => !Object.hasOwn(genreSlugs, category.name));
    return generateCategories.call(this, { ...locals, categories });
  });

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
        id: post._id, title: post.title, url, iso: date.format('YYYY-MM-DD'), year: date.format('YYYY'),
        shortDate: date.format('MM.DD'), excerpt: firstParagraph(post.content),
        categories: post.categories.map(category => category.name),
      });
    }

    const selected = featuredPaths.map(url => notes.find(post => post.url === url)).filter(Boolean);
    for (const note of notes) {
      if (selected.length >= 3) break;
      if (!selected.includes(note)) selected.push(note);
    }
    const genres = writingGenres
      .map(genre => ({ ...genre, notes: notes.filter(note => note.categories.includes(genre.name)) }))
      .filter(genre => genre.notes.length);
    const catalogues = [{ name: '全部', slug: '', notes }, ...genres];
    const genreLinks = catalogues.map(({ name, slug }) => ({ name, url: slug ? 'language/' + slug + '/' : 'language/' }));

    // Only work pages deliberately placed in this site's public source join the catalogue.
    const works = locals.pages.toArray()
      .filter(page => page.type === 'work' && page.publish !== false && page.draft !== true
        && /^works\/[^/]+\/index\.md$/i.test(page.source.replaceAll('\\', '/')))
      .map(page => ({
        title: page.title || page.source.replaceAll('\\', '/').split('/')[1],
        url: page.path.replace(/^\/+/, '').replace(/\/index\.html$/, '/'),
        description: typeof page.description === 'string' ? page.description : '',
      }))
      .sort((left, right) => left.title.localeCompare(right.title, 'zh-CN', { numeric: true }));

    const page = { aside: false, top_img: false, comments: false };
    return [
      ...existing.filter(entry => this.route.format(entry.path) !== 'index.html'),
      {
        path: 'index.html', layout: 'editorial-pages',
        data: { ...page, __index: true, current: 1, layout: 'home', type: 'editorial-home', selected, firstWork: works[0] },
      },
      ...catalogues.map(({ name, slug, notes: articles }, i) => ({
        path: genreLinks[i].url + 'index.html', layout: 'editorial-pages',
        data: { ...page, title: slug ? name : '文字', type: 'editorial-language', count: articles.length,
          years: byYear(articles), genreLinks, currentGenre: name,
          topics: slug ? relatedTopics(articles, locals.tags.toArray()) : [] },
      })),
      {
        path: 'works/index.html', layout: 'editorial-pages',
        data: { ...page, title: '作品', type: 'editorial-works', works },
      },
    ];
  });
});
