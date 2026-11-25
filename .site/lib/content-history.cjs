'use strict';

function normalizeHistory(value, source = 'Markdown') {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new Error(source + ' 的 history 必须是列表。');

  return value.map((entry, index) => {
    const field = source + ' 的 history[' + (index + 1) + ']';
    const rawDate = entry?.date;
    // Hexo parses unquoted YAML dates as Date; Obsidian imports supply strings.
    const date = rawDate instanceof Date && Number.isFinite(rawDate.getTime())
      ? rawDate.toISOString().slice(0, 10)
      : rawDate;
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(field + '.date 需填写 YYYY-MM-DD。');
    }
    const parsed = new Date(date + 'T00:00:00Z');
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
      throw new Error(field + '.date 不是有效日期：' + date);
    }
    const record = { date };
    if (entry.note != null) {
      if (typeof entry.note !== 'string') throw new Error(field + '.note 需填写纯文本。');
      if (entry.note.trim()) record.note = entry.note.trim();
    }
    if (entry.links != null) {
      if (!Array.isArray(entry.links)) throw new Error(field + '.links 必须是列表。');
      if (entry.links.length) record.links = entry.links.map((link, linkIndex) => {
        const label = field + '.links[' + (linkIndex + 1) + ']';
        if (typeof link?.text !== 'string' || !link.text.trim()) {
          throw new Error(label + '.text 需填写链接文字。');
        }
        const url = typeof link.url === 'string' ? link.url.trim() : '';
        const rooted = /^\/(?!\/)/.test(url);
        if (/[\\\u0000-\u001f\u007f]/.test(url) ||
            !(rooted || (/^https?:\/\//i.test(url) && URL.canParse(url)))) {
          throw new Error(label + '.url 需填写站内 / 路径或完整的 HTTP(S) 网址。');
        }
        return { text: link.text.trim(), url };
      });
    }
    return record;
  }).sort((left, right) => left.date.localeCompare(right.date));
}

module.exports = { normalizeHistory };
