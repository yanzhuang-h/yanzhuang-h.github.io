import { handleLetters } from './letters.mjs';

const siteOrigins = new Set(['https://huzhuangyan.com', 'https://www.huzhuangyan.com']);
const dayMillis = 86_400_000;
const beijingClock = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit'
});

async function summarize(db, end, period) {
  const endMillis = Date.parse(end + 'T00:00:00Z');
  const startMillis = endMillis - (period - 1) * dayMillis;
  const start = new Date(startMillis).toISOString().slice(0, 10);
  const [first, daily, countries] = await db.batch([
    db.prepare('SELECT MIN(day) AS since FROM daily_visits'),
    db.prepare(`SELECT day, SUM(views) AS count FROM daily_visits
      WHERE day BETWEEN ? AND ? GROUP BY day`).bind(start, end),
    db.prepare(`SELECT country, SUM(views) AS count FROM daily_visits
      WHERE day BETWEEN ? AND ? GROUP BY country`).bind(start, end)
  ]);
  const since = first.results[0].since;
  if (!since) return { since: null, days: [], regions: [] };

  const counts = new Map(daily.results.map(row => [row.day, row.count]));
  const days = [];
  for (let time = startMillis; time <= endMillis; time += dayMillis) {
    const date = new Date(time).toISOString().slice(0, 10);
    if (date >= since) days.push({ date, count: counts.get(date) ?? 0 });
  }
  const totals = new Map();
  for (const { country, count } of countries.results) {
    const name = country !== 'unknown' && count < 5 ? 'other' : country;
    totals.set(name, (totals.get(name) ?? 0) + count);
  }
  const regions = Array.from(totals, ([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return { since, days, regions };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const headers = new Headers({ 'Cache-Control': 'no-store', 'Vary': 'Origin' });
    if (siteOrigins.has(origin)) headers.set('Access-Control-Allow-Origin', origin);

    const visit = url.pathname === '/visit';
    const letters = url.pathname === '/letters';
    if (!visit && !letters && url.pathname !== '/summary') return new Response(null, { status: 404, headers });
    if ((visit || origin || (letters && request.method === 'POST')) && !siteOrigins.has(origin)) {
      return new Response(null, { status: 403, headers });
    }
    const methods = letters ? ['GET', 'POST'] : [visit ? 'POST' : 'GET'];
    if (request.method === 'OPTIONS') {
      headers.set('Access-Control-Allow-Methods', methods.join(', '));
      if (letters) headers.set('Access-Control-Allow-Headers', 'Content-Type');
      return new Response(null, { status: 204, headers });
    }
    if (!methods.includes(request.method)) {
      headers.set('Allow', [...methods, 'OPTIONS'].join(', '));
      return new Response(null, { status: 405, headers });
    }

    const day = beijingClock.format(Date.now());
    try {
      if (letters) return await handleLetters(request, env, headers, day);
      if (visit) {
        const location = request.cf?.country;
        const country = /^[A-Z]{2}$/.test(location) && location !== 'XX' ? location : 'unknown';
        await env.DB.prepare(`INSERT INTO daily_visits (day, country) VALUES (?, ?)
          ON CONFLICT (day, country) DO UPDATE SET views = views + 1`).bind(day, country).run();
        return new Response(null, { status: 204, headers });
      }
      const period = url.searchParams.get('days') ?? '30';
      if (period !== '7' && period !== '30') return new Response(null, { status: 400, headers });
      const data = await summarize(env.DB, day, Number(period));
      headers.set('Cache-Control', 'public, max-age=60');
      return Response.json(data, { headers });
    } catch {
      return new Response(null, { status: 503, headers });
    }
  }
};
