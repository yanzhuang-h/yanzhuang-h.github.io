(() => {
  function prepareNavigation() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    nav.setAttribute('aria-label', '主导航');
    const mode = document.getElementById('footer-mode');
    const themeToggle = document.getElementById('darkmode');
    if (mode && themeToggle && mode.hidden) {
      mode.hidden = false;
      const updateLabel = () => {
        mode.textContent = document.documentElement.dataset.theme === 'dark' ? '日间模式' : '夜间模式';
      };
      updateLabel();
      mode.addEventListener('click', () => themeToggle.click());
      themeToggle.addEventListener('click', () => requestAnimationFrame(updateLabel));
    }
    const path = location.pathname.replace(/index\.html$/, '');
    for (const link of nav.querySelectorAll('a[href]')) {
      if (link.pathname === path) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    for (const [selector, name] of [['#search-button > .search', '搜索'], ['#local-search .search-close-button', '关闭搜索']]) {
      const control = document.querySelector(selector);
      if (!control || control.hasAttribute('data-keyboard')) continue;
      control.setAttribute('aria-label', name);
      if (!control.matches('button, a[href]')) {
        control.setAttribute('role', 'button');
        control.tabIndex = 0;
        control.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            control.click();
          }
        });
      }
      control.setAttribute('data-keyboard', '');
    }
  }
  document.addEventListener('DOMContentLoaded', prepareNavigation);
  document.addEventListener('pjax:complete', prepareNavigation);
})();
