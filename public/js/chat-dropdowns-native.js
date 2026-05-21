(() => {
  function enhance(root = document) {
    root.querySelectorAll('.bk-chat-thread').forEach((thread) => {
      const toolbar = thread.querySelector('.bk-chat-history-toolbar');
      if (toolbar && !toolbar.closest('.bk-chat-history-dropdown')) {
        const title = document.querySelector('.bk-chat-nav-row[aria-current="true"] .bk-list-row-title')?.textContent?.trim()
          || document.querySelector('.bk-chat-room-card .bk-list-row-title')?.textContent?.trim()
          || 'Поиск по чату';
        const details = document.createElement('details');
        details.className = 'bk-chat-history-dropdown';
        const summary = document.createElement('summary');
        summary.innerHTML = `<span>${title}</span><small>Поиск и фильтры</small>`;
        toolbar.before(details);
        details.append(summary, toolbar);
      }

      const pinned = thread.querySelector('.bk-chat-pinned-summary');
      if (pinned && !pinned.closest('.bk-chat-pinned-dropdown')) {
        const pinnedTitle = pinned.querySelector('strong')?.textContent?.trim() || 'Закреплено';
        const details = document.createElement('details');
        details.className = 'bk-chat-pinned-dropdown';
        const summary = document.createElement('summary');
        summary.innerHTML = `<span>${pinnedTitle}</span><small>Закреп</small>`;
        pinned.before(details);
        details.append(summary, pinned);
      }
    });
  }

  let raf = 0;
  const schedule = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      enhance();
    });
  };

  document.addEventListener('DOMContentLoaded', schedule);
  window.addEventListener('popstate', schedule);
  document.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('[data-route]')) {
      requestAnimationFrame(schedule);
    }
  });
  schedule();
})();
