import type { PeriodConfig } from '@/types/results.types';

// ─── Day Counting Helpers ─────────────────────────────────────────────────────

/** Returns inclusive count of days from start to end */
export function diffDaysInclusive(start: Date, end: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = Math.round((end.getTime() - start.getTime()) / msPerDay);
  return diff + 1; // inclusive
}

/**
 * Count occurrences of a specific weekday (0=Sun..6=Sat) in [start, end].
 */
export function countWeekdaysInRange(start: Date, end: Date, weekday: number): number {
  let count = 0;
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const endClean = new Date(end);
  endClean.setHours(0, 0, 0, 0);
  while (cursor <= endClean) {
    if (cursor.getDay() === weekday) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

// ─── Main Calendar Calculations ───────────────────────────────────────────────

/**
 * Columna C — Días efectivos del periodo para una ciudad.
 */
export function calculateDiasEnMes(
  period: PeriodConfig,
  descansos: number = 0
): number {
  const start = parseISODate(period.startDate);
  const end = parseISODate(period.endDate);
  if (!start || !end) return 0;

  const diasBase = diffDaysInclusive(start, end);
  const domingos = period.excludeSundays ? countWeekdaysInRange(start, end, 0) : 0;
  const sabados = countWeekdaysInRange(start, end, 6);
  const ajusteSabados = sabados * (1 - period.saturdayFactor);

  const resultado = diasBase - domingos - ajusteSabados - descansos;
  return Math.max(0, resultado);
}

/**
 * Columna G — Días efectivos transcurridos hasta todayCutoff.
 */
export function calculateDiasEfectivosTranscurridos(
  period: PeriodConfig,
  descansosTranscurridos: number = 0
): number {
  const start = parseISODate(period.startDate);
  const today = parseISODate(period.todayCutoff);
  if (!start || !today) return 0;

  const diasBase = diffDaysInclusive(start, today);
  const domingos = period.excludeSundays ? countWeekdaysInRange(start, today, 0) : 0;
  const sabados = countWeekdaysInRange(start, today, 6);
  const ajusteSabados = sabados * (1 - period.saturdayFactor);

  const resultado = diasBase - domingos - ajusteSabados - descansosTranscurridos;
  return Math.max(0, resultado);
}

// ─── Date Parse Helpers ───────────────────────────────────────────────────────

export function parseISODate(str: string): Date | null {
  if (!str) return null;
  const d = new Date(str + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}

function countBusinessDaysMonToFri(start: Date, end: Date): number {
  if (end < start) return 0;
  let count = 0;
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const endClean = new Date(end);
  endClean.setHours(0, 0, 0, 0);

  while (cursor <= endClean) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}

export function calculateDiasFaltantesLaborales(
  period: PeriodConfig,
  descansos: number = 0
): number {
  const start = parseISODate(period.startDate);
  const end = parseISODate(period.endDate);
  const today = parseISODate(period.todayCutoff);
  if (!start || !end || !today) return 0;

  const diasDisponibles = Math.max(0, countBusinessDaysMonToFri(start, end) - descansos);

  let diasActivos = 0;
  if (today >= start) {
    const activeEnd = today > end ? end : today;
    diasActivos = countBusinessDaysMonToFri(start, activeEnd);
  }

  return Math.max(0, diasDisponibles - diasActivos);
}
