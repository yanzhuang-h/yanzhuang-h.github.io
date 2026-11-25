(() => {
  function prepareSearch(trigger) {
    const dialog = document.querySelector('#local-search .search-dialog');
    if (!dialog || !trigger) return;

    dialog.id = 'site-search-dialog';
    trigger.setAttribute('aria-controls', dialog.id);
    trigger.setAttribute('aria-haspopup', 'dialog');
    if (dialog.hasAttribute('data-focus-managed')) return;
    dialog.setAttribute('data-focus-managed', '');
    const title = dialog.querySelector('.search-dialog-title');
    const input = dialog.querySelector('.local-search-input input');
    const stats = dialog.querySelector('#local-search-stats');
    title.id = 'site-search-title';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', title.id);
    dialog.tabIndex = -1;
    input.setAttribute('aria-label', '搜索文章标题或正文');
    stats.setAttribute('role', 'status');
    stats.setAttribute('aria-atomic', 'true');

    // Butterfly changes display when opening and after its closing animation.
    let open = false;
    const openButton = () => document.querySelector('#search-button > .search');
    const observer = new MutationObserver(() => {
      const visible = dialog.style.display === 'block';
      if (visible === open) return;
      open = visible;
      if (open) {
        (getComputedStyle(input).visibility === 'visible' ? input : dialog).focus({preventScroll: true});
      } else {
        openButton()?.focus({preventScroll: true});
      }
    });
    observer.observe(dialog, {attributes: true, attributeFilter: ['style']});

    window.addEventListener('search:loaded', () => {
      queueMicrotask(() => {
        if (open && document.activeElement === dialog) input.focus({preventScroll: true});
      });
    }, {once: true});

    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const controls = [...dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), a[href]')]
        .filter(node => node.getClientRects().length && getComputedStyle(node).visibility === 'visible');
      if (!controls.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  function showLinkedRevisions() {
    if (location.hash !== '#revision-history') return;
    const list = document.getElementById('revision-history');
    const history = list?.closest('details.content-history--article');
    if (history && !history.open) {
      history.open = true;
      list.scrollIntoView();
    }
  }

  function prepareNavigation() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    nav.setAttribute('aria-label', '主导航');
    const revisionLink = document.querySelector('#post #article-container > .history-meta');
    const postMeta = document.querySelector('#post-info #post-meta');
    if (revisionLink && postMeta) {
      postMeta.append(revisionLink);
      const history = document.querySelector('details.content-history--article');
      revisionLink.querySelector('a').addEventListener('click', event => {
        if (history && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) history.open = true;
      });
    }
    showLinkedRevisions();
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
    prepareSearch(nav.querySelector('#search-button > .search'));
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
  window.addEventListener('hashchange', showLinkedRevisions);
  document.addEventListener('DOMContentLoaded', prepareNavigation);
  document.addEventListener('pjax:complete', prepareNavigation);
})();
