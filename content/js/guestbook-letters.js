(() => {
  const form = document.getElementById('guestbook-form');
  const configured = document.querySelector('meta[name="visit-endpoint"]')?.content.trim();
  if (!form || !configured) return;
  const url = new URL(configured.replace(/\/+$/, '') + '/letters', location.href);
  const production = ['https://huzhuangyan.com', 'https://www.huzhuangyan.com'].includes(location.origin);
  const loopback = host => ['127.0.0.1', 'localhost', '[::1]'].includes(host);
  if (!production && !(loopback(location.hostname) && loopback(url.hostname))) return;

  const fields = form.elements;
  const fieldset = form.querySelector('fieldset');
  const status = document.getElementById('letter-status');
  let lastPayload;
  let submissionId;

  function request(options) {
    return fetch(url, {
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: AbortSignal.timeout(12000),
      ...options
    });
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (fieldset.disabled) return;
    const message = fields.message.value.trim();
    if (!message) {
      status.textContent = '先写下你想说的话吧。';
      fields.message.focus();
      return;
    }
    const visibility = fields.allowPublic.checked ? 'public' : 'private';
    const payload = {message, signature: fields.signature.value.trim(), visibility, website: fields.website.value};
    const serialized = JSON.stringify(payload);
    if (serialized !== lastPayload) {
      lastPayload = serialized;
      submissionId = window.crypto?.randomUUID?.();
    }
    fieldset.disabled = true;
    status.textContent = '正在寄出…';
    try {
      const response = await request({
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({...payload, submissionId})
      });
      if (response.status === 201) {
        form.reset();
        lastPayload = undefined;
        submissionId = undefined;
        status.textContent = visibility === 'public' ? '留言已收到，审核后可以出现在这里。' : '留言已收到，只有我能看到。';
      } else if (response.status === 429) {
        status.textContent = '寄得有些频繁，请稍等一分钟再寄。';
      } else if ([400, 413, 422].includes(response.status)) {
        status.textContent = '请检查留言和署名的内容及长度，再寄一次。';
      } else {
        status.textContent = '暂时无法确认是否寄达。留言仍在这里，请稍后再试。';
      }
    } catch {
      status.textContent = '暂时无法确认是否寄达。留言仍在这里，请稍后再试。';
    } finally {
      fieldset.disabled = false;
    }
  });
  form.hidden = false;

  async function loadLetters() {
    const response = await request();
    if (!response.ok) return;
    const data = await response.json();
    if (!Array.isArray(data?.letters)) return;
    const list = document.getElementById('public-letters-list');
    for (const letter of data.letters) {
      if (typeof letter?.message !== 'string' || !letter.message.trim() || !/^\d{4}-\d\d-\d\d$/.test(letter.date)) continue;
      const item = document.createElement('li');
      const body = document.createElement('p');
      body.className = 'letter-body';
      body.textContent = letter.message;
      const credit = document.createElement('p');
      credit.className = 'quiet letter-credit';
      const signature = document.createElement('span');
      signature.textContent = letter.signature || '未署名';
      const date = document.createElement('time');
      date.dateTime = letter.date;
      date.textContent = letter.date.replaceAll('-', '.');
      credit.append(signature, date);
      item.append(body, credit);
      list.appendChild(item);
    }
    document.getElementById('public-letters').hidden = list.childElementCount === 0;
  }
  loadLetters().catch(() => {});
})();
