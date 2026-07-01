// ── Currency ──────────────────────────────────────────────────────────────
export function formatCurrency(amount: number, currency = 'TRY'): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ── Dates ─────────────────────────────────────────────────────────────────
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateString));
}

export function formatShortDate(dateString: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}
