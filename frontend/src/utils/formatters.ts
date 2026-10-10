/**
 * Formatting helpers for statistical metrics
 */
export function formatNumber(val: number | undefined | null, decimals: number = 2): string {
  if (val === undefined || val === null || isNaN(val)) return '—';
  return val.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatScientific(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return '—';
  if (Math.abs(val) < 0.001 || Math.abs(val) > 100000) {
    return val.toExponential(3);
  }
  return formatNumber(val, 4);
}

export function formatKwh(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return '— kWh';
  return `${formatNumber(val, 2)} kWh`;
}
