'use strict';

const { normalizeHistory } = require('./content-history.cjs');
const YAML = require('yaml');
const moment = require('moment-timezone');

function xml(value) {
  // XML 1.0 readers reject embedded control characters, even inside plain text.
  return String(value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/gu, '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function authoredTime(value, timezone) {
  if (!value) return;
  const time = moment.tz(String(value), moment.ISO_8601, true, timezone);
  if (time.isValid()) return time.valueOf();
}

function renderUpdatesFeed(config, publications, firstParagraph) {
  const home = new URL(config.root || '/', config.url);
  const self = new URL('atom.xml', home).href;
  const entries = publications.map(item => {
    const url = new URL(item.path.replace(/(?:^|\/)index\.html$/, '/'), home).href;
    const header = String(item.raw || '').match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    const fields = header ? YAML.parse(header[1]) || {} : {};
    // Hexo re-applies the site's offset even to dates with an explicit Z or UTC offset.
    const timezone = config.timezone || 'UTC';
    const publishedTime = authoredTime(fields.date, timezone) ?? item.date.valueOf();
    // Only an author-specified update should replace publication time on a fresh checkout.
    const updatedTime = fields.updated ? (authoredTime(fields.updated, timezone) ?? item.updated?.valueOf()) : null;
    const revisions = normalizeHistory(item.history, item.source);
    const revisionTime = authoredTime(revisions.at(-1)?.date, timezone);
    const updated = new Date(Math.max(publishedTime, updatedTime ?? publishedTime, revisionTime ?? publishedTime)).toISOString();
    return {
      url, published: new Date(publishedTime).toISOString(), updated, title: item.title || item.source,
      summary: item.description || firstParagraph(item.content) || item.title || item.source,
    };
  }).sort((a, b) => b.updated.localeCompare(a.updated) || a.url.localeCompare(b.url)).slice(0, 50);

  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${xml(config.language)}">
  <id>${xml(self)}</id>
  <title>${xml(config.title)}</title>
  <link rel="self" href="${xml(self)}" type="application/atom+xml"/>
  <link rel="alternate" href="${xml(home.href)}"/>
  <author><name>${xml(config.author)}</name></author>
  <updated>${entries[0]?.updated || new Date(0).toISOString()}</updated>
${entries.map(entry => `  <entry>
    <id>${xml(entry.url)}</id>
    <title>${xml(entry.title)}</title>
    <link href="${xml(entry.url)}"/>
    <published>${entry.published}</published>
    <updated>${entry.updated}</updated>
    <summary>${xml(entry.summary)}</summary>
  </entry>`).join('\n')}
</feed>
`;
}

module.exports = { renderUpdatesFeed };
