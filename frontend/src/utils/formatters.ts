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

export function formatGwh(valKwh: number | undefined | null): string {
  if (valKwh === undefined || valKwh === null || isNaN(valKwh)) return '— GWh';
  const gwh = valKwh / 1_000_000;
  return `${formatNumber(gwh, 2)} GWh`;
}

export function formatMwh(valKwh: number | undefined | null): string {
  if (valKwh === undefined || valKwh === null || isNaN(valKwh)) return '— MWh';
  const mwh = valKwh / 1_000;
  return `${formatNumber(mwh, 1)} MWh`;
}

export function formatPercent(val: number | undefined | null, decimals: number = 1): string {
  if (val === undefined || val === null || isNaN(val)) return '—%';
  return `${formatNumber(val, decimals)}%`;
}

export function formatCompactNumber(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return '—';
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}k`;
  return val.toLocaleString();
}
