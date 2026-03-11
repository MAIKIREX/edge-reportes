'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { parseExcelFile } from '@/lib/excel-parser';
import { toAttendanceRawRows, groupAttendanceRows, extractAvailableDates } from '@/lib/attendance-grouping';
import { aggregateDailyRowsByCity, calculateCityResult, calculateGlobalTotals, resolveCity } from '@/lib/general-calculations';
import { buildSpecificRow } from '@/lib/specific-calculations';
import { buildCombinedRows, simplifyCity } from '@/lib/combined-calculations';
import { countWeekdaysInRange, diffDaysInclusive, parseISODate } from '@/lib/calendar';
import type {
  DailyRow,
  CityConfig,
  PeriodConfig,
  CityResult,
  SpecificTableRow,
  CombinedTableRow,
  AttendanceSupervisorGroup,
  FileMetadata,
  GlobalTotals,
  SourceRow,
} from '@/types/results.types';

const TODAY = new Date().toISOString().slice(0, 10);
const FIRST_OF_MONTH = TODAY.slice(0, 8) + '01';
const LAST_OF_MONTH = new Date(
  new Date().getFullYear(),
  new Date().getMonth() + 1,
  0
).toISOString().slice(0, 10);

const DEFAULT_PERIOD: PeriodConfig = {
  startDate: FIRST_OF_MONTH,
  endDate: LAST_OF_MONTH,
  todayCutoff: TODAY,
  excludeSundays: true,
  saturdayFactor: 0.5,
};

function toLocalISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toNumber(raw: unknown): number {
  if (typeof raw === 'number') return raw;
  if (raw === null || raw === undefined || raw === '') return 0;
  const normalized = String(raw).trim().replace(/\./g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeKey(value: string): string {
  return value
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function mapAreaFromCity(cityName: string): string {
  const city = normalizeKey(cityName);

  if (city === 'COBIJA') return 'COBIJA';
  if (['COCHABAMBA', 'QUILLACOLLO', 'SIPE SIPE', 'VINTO', 'COLCAPIRHUA', 'TIQUIPAYA', 'SACABA', 'PUNATA'].includes(city)) return 'COCHABAMBA';
  if (city === 'ACHOCALLA' || city === 'LA PAZ') return 'LA PAZ';
  if (city === 'EL ALTO' || city === 'VIACHA') return 'EL ALTO';
  if (city === 'ORURO' || city === 'LLALLAGUA') return 'ORURO';
  if (city === 'POTOSI') return 'POTOSI';
  if (city === 'SAN BORJA') return 'SAN BORJA';
  if (city === 'SUCRE') return 'SUCRE';
  if (city === 'TRINIDAD') return 'TRINIDAD';
  if (city === 'TUPIZA') return 'TUPIZA';
  if (city === 'TARIJA') return 'TARIJA';
  if (city === 'RIBERALTA') return 'RIBERALTA';
  if (city === 'GUAYARAMERIN') return 'GUAYARAMERIN';
  if (['SANTA CRUZ DE LA SIERRA', 'LA GUARDIA', 'EL TORNO', 'COTOCA', 'PAILON', 'WARNES', 'MONTERO', 'YAPACANI'].includes(city)) return 'SANTA CRUZ';

  return cityName;
}

function buildAverageErrorByCity(rawRows: DailyRow[]): Map<string, number> {
  const grouped = rawRows.reduce((map, row) => {
    const city = String(row.cityName ?? '').trim();
    if (!city) return map;

    const totalPos = toNumber(row.totalPOS);
    const rejected = toNumber(row.partiallyRejectedPOS) + toNumber(row.rejectedPOS);
    const rejectedPct = totalPos > 0 ? (rejected / totalPos) * 100 : 0;

    const current = map.get(city) ?? { sum: 0, count: 0 };
    current.sum += rejectedPct;
    current.count += 1;
    map.set(city, current);
    return map;
  }, new Map<string, { sum: number; count: number }>());

  return Array.from(grouped.entries()).reduce((map, [city, values]) => {
    map.set(city, values.count > 0 ? values.sum / values.count : 0);
    return map;
  }, new Map<string, number>());
}

function buildTotalEdgeByCity(rawRows: DailyRow[], averageErrorByCity: Map<string, number>): Map<string, number> {
  const grouped = rawRows.reduce((map, row) => {
    const city = String(row.cityName ?? '').trim();
    if (!city) return map;

    const current = map.get(city) ?? { approvedSum: 0, enQcSum: 0 };
    current.approvedSum += toNumber(row.approvedPOS);
    current.enQcSum += toNumber(row.enQCPOS);
    map.set(city, current);
    return map;
  }, new Map<string, { approvedSum: number; enQcSum: number }>());

  return Array.from(grouped.entries()).reduce((map, [city, values]) => {
    const averageError = averageErrorByCity.get(city) ?? 0;
    const projectedApprovedQc = values.enQcSum * (1 - averageError / 100);
    map.set(city, values.approvedSum + projectedApprovedQc);
    return map;
  }, new Map<string, number>());
}
interface ResultsStore {
  periodConfig: PeriodConfig;
  cityConfigs: CityConfig[];

  rawFileRows: DailyRow[];
  sourceRows: SourceRow[];
  fileMetadata: FileMetadata | null;
  isLoadingFile: boolean;
  fileError: string | null;

  generalResults: CityResult[];
  globalTotals: GlobalTotals | null;
  specificResults: SpecificTableRow[];
  combinedResults: CombinedTableRow[];
  attendanceGroups: AttendanceSupervisorGroup[];
  availableDates: string[];
  selectedDate: string | null;
  unmappedCities: string[];

  setPeriodConfig: (config: PeriodConfig) => void;
  setCityConfigs: (configs: CityConfig[]) => void;
  addCityConfig: (city: CityConfig) => void;
  updateCityConfig: (cityId: string, patch: Partial<CityConfig>) => void;
  removeCityConfig: (cityId: string) => void;

  loadExcelFile: (file: File) => Promise<void>;
  clearFile: () => void;

  processGeneralTable: () => void;
  processSpecificTable: () => void;
  processCombinedTable: () => void;
  setSelectedDate: (date: string) => void;

  importConfig: (json: string) => void;
  exportConfigJson: () => string;
}

export const useResultsStore = create<ResultsStore>()(
  persist(
    (set, get) => ({
      periodConfig: DEFAULT_PERIOD,
      cityConfigs: [],

      rawFileRows: [],
      sourceRows: [],
      fileMetadata: null,
      isLoadingFile: false,
      fileError: null,
      generalResults: [],
      globalTotals: null,
      specificResults: [],
      combinedResults: [],
      attendanceGroups: [],
      availableDates: [],
      selectedDate: null,
      unmappedCities: [],

      setPeriodConfig: config => set({ periodConfig: config }),

      setCityConfigs: configs => set({ cityConfigs: configs }),

      addCityConfig: city =>
        set(state => ({ cityConfigs: [...state.cityConfigs, city] })),

      updateCityConfig: (cityId, patch) =>
        set(state => ({
          cityConfigs: state.cityConfigs.map(city =>
            city.cityId === cityId ? { ...city, ...patch } : city
          ),
        })),

      removeCityConfig: cityId =>
        set(state => ({ cityConfigs: state.cityConfigs.filter(city => city.cityId !== cityId) })),

      loadExcelFile: async file => {
        set({ isLoadingFile: true, fileError: null });
        try {
          const { rows, sourceRows, metadata, validation } = await parseExcelFile(file);

          if (!validation.valid) {
            set({
              isLoadingFile: false,
              fileError: `Columnas requeridas faltantes: ${validation.missingColumns.join(', ')}`,
            });
            return;
          }

          const { cityConfigs } = get();
          const unmapped = metadata.detectedCities.filter(city => !resolveCity(city, cityConfigs));

          set({
            rawFileRows: rows,
            sourceRows,
            fileMetadata: { ...metadata, unmappedCities: unmapped },
            isLoadingFile: false,
            fileError: null,
            unmappedCities: unmapped,
          });

          const store = get();
          store.processGeneralTable();
          store.processSpecificTable();
          store.processCombinedTable();

          const attendanceRows = toAttendanceRawRows(rows);
          const dates = extractAvailableDates(attendanceRows);
          const latestDate = dates[dates.length - 1] ?? null;
          set({ availableDates: dates, selectedDate: latestDate });

          if (latestDate) {
            const groups = groupAttendanceRows(attendanceRows, latestDate);
            set({ attendanceGroups: groups });
          }
        } catch (error) {
          set({
            isLoadingFile: false,
            fileError: `Error al leer el archivo: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      },

      clearFile: () =>
        set({
          rawFileRows: [],
          sourceRows: [],
          fileMetadata: null,
          fileError: null,
          generalResults: [],
          globalTotals: null,
          specificResults: [],
          combinedResults: [],
          attendanceGroups: [],
          availableDates: [],
          selectedDate: null,
          unmappedCities: [],
        }),

      processGeneralTable: () => {
        const { rawFileRows, cityConfigs, periodConfig } = get();
        if (!rawFileRows.length || !cityConfigs.length) return;

        const { aggregated } = aggregateDailyRowsByCity(rawFileRows, cityConfigs);
        const results: CityResult[] = [];

        for (const [, data] of aggregated) {
          const config = cityConfigs.find(city => city.cityId === data.cityId);
          if (!config || !config.activo || config.mo <= 0) continue;
          results.push(calculateCityResult(data, config, periodConfig));
        }

        results.sort((a, b) => a.ciudad.localeCompare(b.ciudad));
        const totals = calculateGlobalTotals(results);
        set({ generalResults: results, globalTotals: totals });
      },

      processSpecificTable: () => {
        const { rawFileRows, cityConfigs, periodConfig } = get();
        if (!cityConfigs.length) return;

        const averageErrorByCity = buildAverageErrorByCity(rawFileRows);
        const totalEdgeByCity = buildTotalEdgeByCity(rawFileRows, averageErrorByCity);

        const rowsByCity = rawFileRows.reduce((map, row) => {
          const city = String(row.cityName ?? '').trim();
          if (!city) return map;
          const current = map.get(city) ?? [];
          current.push(row);
          map.set(city, current);
          return map;
        }, new Map<string, DailyRow[]>());

        const startDate = parseISODate(periodConfig.startDate);
        const endDate = parseISODate(periodConfig.endDate);
        const todayCutoff = parseISODate(periodConfig.todayCutoff);
        const effectiveToday = startDate && endDate && todayCutoff
          ? (todayCutoff > endDate ? endDate : todayCutoff)
          : null;

        const yesterdayDate = effectiveToday
          ? new Date(effectiveToday.getFullYear(), effectiveToday.getMonth(), effectiveToday.getDate() - 1)
          : null;
        const yesterdayISO = yesterdayDate ? toLocalISODate(yesterdayDate) : '';

        const averageDescansosByCity = Array.from(
          cityConfigs.reduce((map, city) => {
            const key = normalizeKey(city.cityLabel);
            if (!key) return map;
            const current = map.get(key) ?? { total: 0, count: 0 };
            current.total += city.descansos ?? 0;
            current.count += 1;
            map.set(key, current);
            return map;
          }, new Map<string, { total: number; count: number }>())
        ).reduce((map, [city, values]) => {
          map.set(city, values.count > 0 ? values.total / values.count : 0);
          return map;
        }, new Map<string, number>());

        const results: SpecificTableRow[] = cityConfigs
          .filter(config => config.activo)
          .map(config => {
            const cityName = config.cityLabel;
            const cityKey = normalizeKey(cityName);
            const cityRows = rowsByCity.get(cityName) ?? [];

            const descansos = averageDescansosByCity.get(cityKey) ?? 0;
            const diasBasePeriodo = startDate && endDate ? diffDaysInclusive(startDate, endDate) : 0;
            const domingosPeriodo = startDate && endDate ? countWeekdaysInRange(startDate, endDate, 0) : 0;
            const sabadosPeriodo = startDate && endDate ? countWeekdaysInRange(startDate, endDate, 6) * 0.5 : 0;
            const diasLaboralesPeriodo = diasBasePeriodo - domingosPeriodo - sabadosPeriodo - descansos;

            const diasBaseTrans = startDate && effectiveToday ? diffDaysInclusive(startDate, effectiveToday) : 0;
            const domingosPasados = startDate && effectiveToday ? countWeekdaysInRange(startDate, effectiveToday, 0) : 0;
            const sabadosPasados = startDate && effectiveToday ? countWeekdaysInRange(startDate, effectiveToday, 6) * 0.5 : 0;
            const diasLaboralesTrans = diasBaseTrans - domingosPasados - sabadosPasados - descansos;
            const diasFaltantes = Math.max(0, diasLaboralesPeriodo - diasLaboralesTrans);

            const m = cityRows.length;
            const n = cityRows.reduce((sum, row) => sum + toNumber(row.totalPOS), 0);
            const promGestorRaw = m > 0 ? n / m : 0;
            const promGestor = promGestorRaw === 0 ? 4 : promGestorRaw;

            const auditorsYesterday = new Set(
              cityRows
                .filter(row => String(row.fecha).slice(0, 10) === yesterdayISO)
                .map(row => row.auditorName?.trim())
                .filter((name): name is string => Boolean(name))
            );
            const gestoresAyer = auditorsYesterday.size;

            const avanceQc = totalEdgeByCity.get(cityName) ?? 0;
            const errorRealPct = averageErrorByCity.get(cityName) ?? 0;

            return buildSpecificRow({
              cityConfig: {
                ...config,
                area: mapAreaFromCity(cityName),
                simplifiedCity: config.simplifiedCity ?? simplifyCity(cityName),
              },
              avanceQc,
              periodConfig,
              computed: {
                diasFaltantes,
                promGestor,
                gestoresAyer,
                errorRealPct,
              },
            });
          })
          .sort((a, b) => a.cityName.localeCompare(b.cityName));

        set({ specificResults: results });
      },

      processCombinedTable: () => {
        const { rawFileRows, sourceRows } = get();
        if (!rawFileRows.length || !sourceRows.length) return;
        const results = buildCombinedRows(rawFileRows, sourceRows);
        set({ combinedResults: results });
      },

      setSelectedDate: date => {
        const { rawFileRows } = get();
        const attendanceRows = toAttendanceRawRows(rawFileRows);
        const groups = groupAttendanceRows(attendanceRows, date);
        set({ selectedDate: date, attendanceGroups: groups });
      },

      importConfig: json => {
        try {
          const parsed = JSON.parse(json);
          if (parsed.periodConfig) set({ periodConfig: parsed.periodConfig });
          if (parsed.cities) set({ cityConfigs: parsed.cities });
        } catch {
          // ignore invalid JSON
        }
      },

      exportConfigJson: () => {
        const { periodConfig, cityConfigs } = get();
        return JSON.stringify({ periodConfig, cities: cityConfigs }, null, 2);
      },
    }),
    {
      name: 'edge-reportes-config',
      partialize: state => ({
        periodConfig: state.periodConfig,
        cityConfigs: state.cityConfigs,
      }),
    }
  )
);