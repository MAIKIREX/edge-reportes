import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Text Normalization ────────────────────────────────────────────────────────

/**
 * Uppercase, remove accents, collapse whitespace, trim.
 */
export function normalizeText(value: string): string {
  return value
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Format ratio as percentage: 0.523 → "52.3%" */
export function formatPct(ratio: number, decimals = 1): string {
  return `${(ratio * 100).toFixed(decimals)}%`;
}

/** Format number with up to N decimals */
export function formatNum(n: number, decimals = 2): string {
  return n.toLocaleString('es-BO', { maximumFractionDigits: decimals });
}

/** Safe division — returns 0 if denominator is 0/NaN/Infinity */
export function safeDivide(num: number, den: number): number {
  if (!den || isNaN(den) || !isFinite(den)) return 0;
  return num / den;
}
