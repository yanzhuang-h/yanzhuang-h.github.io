(() => {
  const panel = document.getElementById('visit-summary');
  const endpoint = document.querySelector('meta[name="visit-endpoint"]')?.content.trim();
  if (!panel || !endpoint || !['huzhuangyan.com', 'www.huzhuangyan.com'].includes(location.hostname)) return;

  const find = id => document.getElementById(id);
  const buttons = panel.querySelectorAll('[data-visit-days]');
  const numbers = new Intl.NumberFormat('zh-CN');
  const names = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames('zh-CN', {type: 'region'}) : null;
  const labels = {unknown: '未知', other: '其他'};
  const isDate = value => typeof value === 'string' && /^\d{4}-\d\d-\d\d$/.test(value);
  const isCount = value => Number.isSafeInteger(value) && value >= 0;
  let currentRequest;

  function showSummary(data, period) {
    const {since, days, regions} = data;
    if ((since !== null && !isDate(since)) || !Array.isArray(days) || !Array.isArray(regions) ||
        days.length > period || (since === null && days.length) ||
        !days.every(day => isDate(day.date) && isCount(day.count)) ||
        !regions.every(region => /^(?:[A-Z]{2}|other|unknown)$/.test(region.name) && isCount(region.count))) {
      throw new Error('Invalid visit summary');
    }

    const total = days.reduce((sum, day) => sum + day.count, 0);
    find('visit-total').textContent = since ? `近 ${period} 天 · ${numbers.format(total)} 次浏览` : '尚无浏览记录。';
    buttons.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.visitDays) === period)));
    find('visit-breakdown').hidden = !days.length;

    const bars = find('visit-bars');
    const rows = find('visit-rows');
    const axis = find('visit-axis');
    const list = find('visit-regions');
    bars.replaceChildren();
    rows.replaceChildren();
    axis.replaceChildren();
    list.replaceChildren();
    if (days.length) {
      const peak = Math.max(1, ...days.map(day => day.count));
      for (const {date, count} of days) {
        const bar = document.createElement('span');
        bar.style.height = `${100 * count / peak}%`;
        bar.title = `${date} · ${numbers.format(count)} 次浏览`;
        bars.appendChild(bar);
        const row = rows.insertRow();
        row.insertCell().textContent = date;
        row.insertCell().textContent = numbers.format(count);
      }
      const limits = new Set([days[0].date, days[days.length - 1].date]);
      for (const date of limits) {
        const label = document.createElement('span');
        label.textContent = date.slice(5).replace('-', '/');
        axis.appendChild(label);
      }
      find('visit-since').textContent = `每柱为一天的浏览次数，统计始于 ${since}。日期按北京时间计算。`;
      for (const {name, count} of regions) {
        const item = document.createElement('li');
        item.textContent = `${labels[name] ?? names?.of(name) ?? name} · ${numbers.format(count)} 次`;
        list.appendChild(item);
      }
      find('visit-geography').hidden = !regions.length;
    }
    panel.hidden = false;
  }

  async function load(period) {
    currentRequest?.abort();
    const request = new AbortController();
    currentRequest = request;
    panel.setAttribute('aria-busy', 'true');
    try {
      const url = endpoint.replace(/\/+$/, '') + '/summary?days=' + period;
      const response = await fetch(url, {signal: request.signal, credentials: 'omit', referrerPolicy: 'no-referrer'});
      if (!response.ok) throw new Error('Summary unavailable');
      const data = await response.json();
      if (!request.signal.aborted) showSummary(data, period);
    } catch {
      if (!request.signal.aborted) panel.hidden = true;
    } finally {
      if (!request.signal.aborted) panel.removeAttribute('aria-busy');
    }
  }

  buttons.forEach(button => button.addEventListener('click', () => load(Number(button.dataset.visitDays))));
  load(30);
})();
