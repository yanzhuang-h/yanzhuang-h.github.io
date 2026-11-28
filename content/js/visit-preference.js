(() => {
  const key = 'visits.exclude';
  const checkbox = document.getElementById('exclude-visits');
  const status = document.getElementById('visit-preference-status');
  let skipForThisPage = false;

  function excluded() {
    try {
      return skipForThisPage || localStorage.getItem(key) === '1';
    } catch {
      return true;
    }
  }

  function updatePreference() {
    if (!checkbox || !status) return;
    try {
      const saved = localStorage.getItem(key) === '1';
      checkbox.checked = saved || skipForThisPage;
      checkbox.disabled = false;
      status.textContent = skipForThisPage ? '本次已排除，浏览器未能保存设置。'
        : saved ? '已排除此浏览器在全站的访问。' : '偏好只保存在当前浏览器。';
    } catch {
      checkbox.checked = true;
      checkbox.disabled = true;
      status.textContent = '本地存储不可用，本次访问已排除。';
    }
  }

  function savePreference(value) {
    try {
      if (value) localStorage.setItem(key, '1');
      else localStorage.removeItem(key);
      skipForThisPage = false;
    } catch {
      skipForThisPage = true;
    }
    updatePreference();
  }

  function handleExclusionLink() {
    if (location.hash !== '#exclude-me') return;
    savePreference(true);
    const settings = document.getElementById('visit-preferences');
    if (settings) {
      settings.open = true;
      settings.scrollIntoView({ block: 'nearest' });
    }
    history.replaceState(history.state, '', location.pathname + location.search);
  }

  checkbox?.addEventListener('change', () => savePreference(checkbox.checked));
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) updatePreference();
  });
  window.addEventListener('hashchange', handleExclusionLink);
  handleExclusionLink();
  updatePreference();

  function countView() {
    const endpoint = document.querySelector('meta[name="visit-endpoint"]')?.content;
    if (location.origin !== 'https://huzhuangyan.com' || !endpoint || excluded()) return;
    fetch(endpoint + '/visit', {
      method: 'POST',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      keepalive: true
    }).catch(() => {});
  }

  if (document.prerendering) {
    document.addEventListener('prerenderingchange', countView, { once: true });
  } else {
    countView();
  }
  window.addEventListener('pageshow', event => {
    if (event.persisted) {
      updatePreference();
      countView();
    }
  });
})();
