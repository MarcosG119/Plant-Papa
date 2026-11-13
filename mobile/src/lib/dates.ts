/** Absolute-date formatter for detail contexts (plant page header). */
export function formatDate(date: Date | null | undefined): string {
  if (!date) return 'never';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}
