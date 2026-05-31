export type AdminBridgeTone = 'neutral' | 'positive' | 'warning' | 'danger';

export type AdminBridgeBadge = {
  label: string;
  tone?: AdminBridgeTone;
};

const LIST_ROW_AVATAR_SYMBOL = '◇';

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char] ?? char));
}

export function badge(label: string, tone: AdminBridgeTone = 'neutral'): string {
  const toneClass = tone === 'neutral' ? '' : ` bk-badge-${tone}`;
  return `<span class="bk-badge${toneClass}">${escapeHtml(label)}</span>`;
}

export function kpi(value: string, label: string): string {
  return `<div class="bk-kpi"><div class="bk-kpi-value">${escapeHtml(value)}</div><div class="bk-kpi-label">${escapeHtml(label)}</div></div>`;
}

export function listRow(title: string, meta: string, details: string[] = [], badges: AdminBridgeBadge[] = []): string {
  const detailHtml = details.map((item) => badge(item)).join('');
  const badgeHtml = badges.map((item) => badge(item.label, item.tone)).join('');
  return `<div class="bk-list-row"><span class="bk-avatar" aria-hidden="true">${LIST_ROW_AVATAR_SYMBOL}</span><div class="bk-list-row-main"><div class="bk-list-row-title">${escapeHtml(title)}</div><div class="bk-meta">${escapeHtml(meta)}</div>${detailHtml ? `<div class="bk-chip-row">${detailHtml}</div>` : ''}</div>${badgeHtml ? `<div class="bk-chip-row">${badgeHtml}</div>` : ''}</div>`;
}

export function safeButton(label: string, route: string): string {
  return `<button class="bk-button bk-button-secondary" type="button" data-admin-route="${escapeHtml(route)}">${escapeHtml(label)}</button>`;
}

export function findCardByText(cards: HTMLElement[], needles: string[]): HTMLElement | undefined {
  return cards.find((card) => {
    const text = card.textContent || '';
    return needles.some((needle) => text.includes(needle));
  });
}

export function markHeaderApiHydrated(root: HTMLElement, datasetKey: string): void {
  const chipRow = root.querySelector<HTMLElement>('.bk-main-column .bk-page-header .bk-chip-row');
  if (!chipRow || chipRow.dataset[datasetKey] === 'true') return;
  chipRow.insertAdjacentHTML('beforeend', badge('данные из API', 'positive'));
  chipRow.dataset[datasetKey] = 'true';
}
