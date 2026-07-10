import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Verdict } from '@/types'

export type { Verdict }

/** Merge Tailwind classes with conditional logic. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** Parse a value into a finite number, returning null when invalid/empty. */
export function parseNum(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

/** Format a number with up to `digits` fractional digits, trimming trailing zeros. */
export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—'
  const fixed = value.toFixed(digits)
  return fixed.replace(/\.?0+$/, '') || '0'
}

/** Format a 0-1 ratio as a percentage string with given digits. */
export function formatPercent(ratio: number, digits = 1): string {
  if (!Number.isFinite(ratio)) return '—'
  return `${formatNumber(ratio * 100, digits)}%`
}

/**
 * Classify a signed discount ratio (paid/official − 1) into a verdict.
 * `flatBand` is the half-width of the "flat" band (default 0.2 → ±20% for
 * price-table pills; pass 0.005 for tight reverse-badge "持平").
 */
export function classifyVerdict(
  ratio: number | null,
  flatBand = 0.2,
): Verdict {
  if (ratio === null || !Number.isFinite(ratio)) return 'na'
  if (ratio < -flatBand) return 'cheaper'
  if (ratio > flatBand) return 'expensive'
  return 'flat'
}

/** Format a signed percentage, e.g. "比官方便宜 12.3%" / "比官方贵 12.3%" / "与官方持平". */
export function formatDiscount(ratio: number, digits = 1): {
  text: string
  sign: Verdict
} {
  const sign = classifyVerdict(ratio, 0.005)
  if (!Number.isFinite(ratio)) return { text: '—', sign: 'na' }
  if (sign === 'flat') return { text: '与官方持平', sign: 'flat' }
  const pct = formatNumber(Math.abs(ratio) * 100, digits)
  return sign === 'cheaper'
    ? { text: `比官方便宜 ${pct}%`, sign: 'cheaper' }
    : { text: `比官方贵 ${pct}%`, sign: 'expensive' }
}

/** Format a CNY price like "¥25" / "¥12.34". */
export function formatCNY(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—'
  return `¥${formatNumber(value, digits)}`
}

/** Format a USD price like "$5" / "$6.25". */
export function formatUSD(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—'
  return `$${formatNumber(value, digits)}`
}

/** Safe division: returns null when inputs are missing or divisor is 0. */
export function safeDiv(a: number | null, b: number | null): number | null {
  if (a === null || b === null || b === 0) return null
  const r = a / b
  return Number.isFinite(r) ? r : null
}

