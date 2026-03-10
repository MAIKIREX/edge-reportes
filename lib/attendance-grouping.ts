import { normalizeText } from '@/lib/utils';
import type {
  DailyRow,
  AttendanceRawRow,
  AttendanceAuditorRow,
  AttendanceCityGroup,
  AttendanceSupervisorGroup,
} from '@/types/results.types';

// ─── Convert raw Excel rows to AttendanceRawRow ───────────────────────────────

export function toAttendanceRawRows(rows: DailyRow[]): AttendanceRawRow[] {
  return rows.map(r => ({
    fecha: String(r.fecha).slice(0, 10),
    supervisor: String(r.supervisor || 'Sin Supervisor').trim() || 'Sin Supervisor',
    cityName: String(r.cityName || '').trim(),
    auditorName: String(r.auditorName || 'Sin Auditor').trim() || 'Sin Auditor',
    totalPos: r.totalPOS ?? 0,
    numero: r.numero ?? 1,
    taskDateTime: r.taskDateTime ? String(r.taskDateTime) : undefined,
  }));
}

// ─── Group attendance data ─────────────────────────────────────────────────────

export function groupAttendanceRows(
  rows: AttendanceRawRow[],
  selectedDate: string
): AttendanceSupervisorGroup[] {
  // Filter: date match + N° != 0
  const filtered = rows.filter(r => {
    const dateMatch = r.fecha === selectedDate;
    const numeroOk = Number(r.numero) !== 0;
    return dateMatch && numeroOk;
  });

  // Group: Supervisor → City → Auditor
  const supervisorMap = new Map<string, Map<string, Map<string, AttendanceRawRow[]>>>();

  for (const row of filtered) {
    const sup = row.supervisor;
    const city = row.cityName;
    const aud = row.auditorName;

    if (!supervisorMap.has(sup)) supervisorMap.set(sup, new Map());
    const cityMap = supervisorMap.get(sup)!;
    if (!cityMap.has(city)) cityMap.set(city, new Map());
    const auditorMap = cityMap.get(city)!;
    if (!auditorMap.has(aud)) auditorMap.set(aud, []);
    auditorMap.get(aud)!.push(row);
  }

  // Build result
  const result: AttendanceSupervisorGroup[] = [];

  for (const [supervisor, cityMap] of Array.from(supervisorMap.entries()).sort(([a], [b]) => a.localeCompare(b))) {
    const cities: AttendanceCityGroup[] = [];

    for (const [cityName, auditorMap] of Array.from(cityMap.entries()).sort(([a], [b]) => a.localeCompare(b))) {
      const auditors: AttendanceAuditorRow[] = [];

      for (const [auditorName, audRows] of Array.from(auditorMap.entries()).sort(([a], [b]) => a.localeCompare(b))) {
        const times = audRows
          .map(r => r.taskDateTime)
          .filter((t): t is string => !!t)
          .sort();

        const horaPrimeraTarea = times.length > 0 ? times[0] : 'N/D';
        const horaUltimaTarea = times.length > 0 ? times[times.length - 1] : 'N/D';
        const posRecolectados = audRows.reduce((s, r) => s + (r.totalPos ?? 0), 0);

        auditors.push({
          fecha: selectedDate,
          supervisor,
          cityName,
          auditorName,
          horaPrimeraTarea,
          horaUltimaTarea,
          posRecolectados,
        });
      }

      const subtotalPos = auditors.reduce((s, a) => s + a.posRecolectados, 0);
      cities.push({ cityName, auditors, subtotalPos });
    }

    const subtotalPos = cities.reduce((s, c) => s + c.subtotalPos, 0);
    result.push({ supervisor, cities, subtotalPos });
  }

  return result;
}

/** Extract unique sorted dates from raw rows */
export function extractAvailableDates(rows: AttendanceRawRow[]): string[] {
  return Array.from(new Set(rows.map(r => r.fecha))).sort();
}

export { normalizeText };
