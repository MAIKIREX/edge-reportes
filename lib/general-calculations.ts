import { addDays, format } from 'date-fns';
import { safeDivide } from '@/lib/utils';
import { calculateDiasEnMes, calculateDiasEfectivosTranscurridos, parseISODate } from '@/lib/calendar';
import { normalizeText } from '@/lib/utils';
import type {
  DailyRow,
  CityConfig,
  PeriodConfig,
  AggregatedCityData,
  CityResult,
  GlobalTotals,
} from '@/types/results.types';

// ─── City Resolver ─────────────────────────────────────────────────────────────

export function resolveCity(
  rawCityName: string,
  cityConfigs: CityConfig[]
): CityConfig | undefined {
  const normalized = normalizeText(rawCityName);
  return cityConfigs.find(c =>
    c.activo &&
    c.aliases.some(alias => normalizeText(alias) === normalized)
  );
}

// ─── Aggregation ───────────────────────────────────────────────────────────────

export function aggregateDailyRowsByCity(
  rows: DailyRow[],
  cityConfigs: CityConfig[]
): { aggregated: Map<string, AggregatedCityData>; unmapped: string[] } {
  const aggregated = new Map<string, AggregatedCityData>();
  const unmappedSet = new Set<string>();

  for (const row of rows) {
    const config = resolveCity(row.cityName, cityConfigs);
    if (!config) {
      if (row.cityName) unmappedSet.add(row.cityName);
      continue;
    }

    const existing = aggregated.get(config.cityId);
    if (existing) {
      existing.approvedTotal += row.approvedPOS;
      existing.totalPOSTotal += row.totalPOS;
      existing.rowCount += 1;
      const dateStr = String(row.fecha).slice(0, 10);
      if (!existing.fechasDetectadas.includes(dateStr)) existing.fechasDetectadas.push(dateStr);
    } else {
      aggregated.set(config.cityId, {
        cityId: config.cityId,
        cityLabel: config.cityLabel,
        approvedTotal: row.approvedPOS,
        totalPOSTotal: row.totalPOS,
        rowCount: 1,
        fechasDetectadas: [String(row.fecha).slice(0, 10)],
      });
    }
  }

  // Ensure all active cities appear even with 0 avance
  for (const city of cityConfigs) {
    if (city.activo && !aggregated.has(city.cityId)) {
      aggregated.set(city.cityId, {
        cityId: city.cityId,
        cityLabel: city.cityLabel,
        approvedTotal: 0,
        totalPOSTotal: 0,
        rowCount: 0,
        fechasDetectadas: [],
      });
    }
  }

  return { aggregated, unmapped: Array.from(unmappedSet) };
}

// ─── Per-City Result (Columns A-L) ────────────────────────────────────────────

export function calculateCityResult(
  data: AggregatedCityData,
  cityConfig: CityConfig,
  periodConfig: PeriodConfig
): CityResult {
  const mo = cityConfig.mo;
  const diasEnMes = calculateDiasEnMes(periodConfig, cityConfig.descansos ?? 0);
  const objetivoPorDia = diasEnMes > 0 ? safeDivide(mo, diasEnMes) : 0;
  const avanceTotal = data.approvedTotal;

  const diasEfectivosTranscurridos = calculateDiasEfectivosTranscurridos(
    periodConfig,
    cityConfig.descansosTranscurridos ?? 0
  );
  const avanceEsperadoHoy = Math.min(mo, Math.max(0, diasEfectivosTranscurridos * objetivoPorDia));

  const avanceGeneral = mo > 0 ? safeDivide(avanceTotal, mo) : 0;
  const avanceEsperadoRelativo = mo > 0 ? safeDivide(avanceEsperadoHoy, mo) : 0;
  const deficitHoy = Math.max(0, avanceEsperadoHoy - avanceTotal);
  const deficitGeneral = Math.max(0, mo - avanceTotal);

  // Semaphore
  const diff = avanceGeneral - avanceEsperadoRelativo;
  const estado: CityResult['estado'] = diff >= 0 ? 'green' : diff >= -0.05 ? 'yellow' : 'red';

  return {
    ciudad: cityConfig.cityLabel,
    mo,
    diasEnMes,
    objetivoPorDia,
    avanceTotal,
    avanceEsperadoHoy,
    avanceGeneral,
    avanceEsperadoRelativo,
    deficitHoy,
    deficitGeneral,
    muestra: cityConfig.muestra ?? 0,
    estado,
  };
}

// ─── Global Totals (footer) ───────────────────────────────────────────────────

export function calculateGlobalTotals(results: CityResult[]): GlobalTotals {
  const mo = results.reduce((s, r) => s + r.mo, 0);
  const avanceTotal = results.reduce((s, r) => s + r.avanceTotal, 0);
  const avanceEsperadoHoy = results.reduce((s, r) => s + r.avanceEsperadoHoy, 0);
  const deficitHoy = results.reduce((s, r) => s + r.deficitHoy, 0);
  const deficitGeneral = results.reduce((s, r) => s + r.deficitGeneral, 0);

  return {
    mo,
    avanceTotal,
    avanceEsperadoHoy,
    deficitHoy,
    deficitGeneral,
    avanceGeneral: mo > 0 ? safeDivide(avanceTotal, mo) : 0,
    avanceEsperadoRelativo: mo > 0 ? safeDivide(avanceEsperadoHoy, mo) : 0,
  };
}

// Re-export resolveCity for attendance
export { addDays, format };
