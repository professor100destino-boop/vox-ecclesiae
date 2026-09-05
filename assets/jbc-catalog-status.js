(() => {
  const apply = () => {
    document.querySelectorAll('.newspaper-card').forEach(card => {
      const title = card.querySelector('h3')?.textContent?.trim();
      if (title !== 'Jornal Brasil Central') return;
      const status = card.querySelector('.card-status');
      if (status) status.textContent = 'Catálogo documental publicado · 53 edições';
    });
  };
  apply();
  const grid = document.getElementById('newspaperGrid');
  if (grid) {
    const observer = new MutationObserver(() => apply());
    observer.observe(grid, { childList: true, subtree: true });
  }
})();
