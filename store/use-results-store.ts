'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { parseExcelFile } from '@/lib/excel-parser';
import { toAttendanceRawRows, groupAttendanceRows, extractAvailableDates } from '@/lib/attendance-grouping';
import { aggregateDailyRowsByCity, calculateCityResult, calculateGlobalTotals, resolveCity } from '@/lib/general-calculations';
import { buildSpecificRow } from '@/lib/specific-calculations';
import { calculateDiasFaltantesLaborales, parseISODate } from '@/lib/calendar';
import type {
  DailyRow,
  CityConfig,
  PeriodConfig,
  CityResult,
  SpecificTableRow,
  AttendanceSupervisorGroup,
  FileMetadata,
  GlobalTotals,
} from '@/types/results.types';

// ─── Default Config ────────────────────────────────────────────────────────────

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

// ─── Store Interface ──────────────────────────────────────────────────────────

interface ResultsStore {
  // Persistent config
  periodConfig: PeriodConfig;
  cityConfigs: CityConfig[];

  // File state (not persisted)
  rawFileRows: DailyRow[];
  fileMetadata: FileMetadata | null;
  isLoadingFile: boolean;
  fileError: string | null;

  // Results (not persisted)
  generalResults: CityResult[];
  globalTotals: GlobalTotals | null;
  specificResults: SpecificTableRow[];
  attendanceGroups: AttendanceSupervisorGroup[];
  availableDates: string[];
  selectedDate: string | null;
  unmappedCities: string[];

  // Actions — Config
  setPeriodConfig: (config: PeriodConfig) => void;
  setCityConfigs: (configs: CityConfig[]) => void;
  addCityConfig: (city: CityConfig) => void;
  updateCityConfig: (cityId: string, patch: Partial<CityConfig>) => void;
  removeCityConfig: (cityId: string) => void;

  // Actions — File
  loadExcelFile: (file: File) => Promise<void>;
  clearFile: () => void;

  // Actions — Processing
  processGeneralTable: () => void;
  processSpecificTable: () => void;
  setSelectedDate: (date: string) => void;

  // Actions — JSON config import/export
  importConfig: (json: string) => void;
  exportConfigJson: () => string;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useResultsStore = create<ResultsStore>()(
  persist(
    (set, get) => ({
      // Persistent
      periodConfig: DEFAULT_PERIOD,
      cityConfigs: [],

      // Non-persistent
      rawFileRows: [],
      fileMetadata: null,
      isLoadingFile: false,
      fileError: null,
      generalResults: [],
      globalTotals: null,
      specificResults: [],
      attendanceGroups: [],
      availableDates: [],
      selectedDate: null,
      unmappedCities: [],

      // ── Config actions ──────────────────────────────────────────────────────

      setPeriodConfig: (config) => set({ periodConfig: config }),

      setCityConfigs: (configs) => set({ cityConfigs: configs }),

      addCityConfig: (city) =>
        set(s => ({ cityConfigs: [...s.cityConfigs, city] })),

      updateCityConfig: (cityId, patch) =>
        set(s => ({
          cityConfigs: s.cityConfigs.map(c =>
            c.cityId === cityId ? { ...c, ...patch } : c
          ),
        })),

      removeCityConfig: (cityId) =>
        set(s => ({ cityConfigs: s.cityConfigs.filter(c => c.cityId !== cityId) })),

      // ── File loading ────────────────────────────────────────────────────────

      loadExcelFile: async (file) => {
        set({ isLoadingFile: true, fileError: null });
        try {
          const { rows, metadata, validation } = await parseExcelFile(file);

          if (!validation.valid) {
            set({
              isLoadingFile: false,
              fileError: `Columnas requeridas faltantes: ${validation.missingColumns.join(', ')}`,
            });
            return;
          }

          // Detect unmapped cities
          const { cityConfigs } = get();
          const unmapped = metadata.detectedCities.filter(
            city => !resolveCity(city, cityConfigs)
          );

          set({
            rawFileRows: rows,
            fileMetadata: { ...metadata, unmappedCities: unmapped },
            isLoadingFile: false,
            fileError: null,
            unmappedCities: unmapped,
          });

          // Auto-process tables
          const store = get();
          store.processGeneralTable();
          store.processSpecificTable();

          // Auto attendance dates
          const attRows = toAttendanceRawRows(rows);
          const dates = extractAvailableDates(attRows);
          const latestDate = dates[dates.length - 1] ?? null;
          set({ availableDates: dates, selectedDate: latestDate });

          if (latestDate) {
            const groups = groupAttendanceRows(attRows, latestDate);
            set({ attendanceGroups: groups });
          }
        } catch (err) {
          set({
            isLoadingFile: false,
            fileError: `Error al leer el archivo: ${err instanceof Error ? err.message : String(err)}`,
          });
        }
      },

      clearFile: () =>
        set({
          rawFileRows: [],
          fileMetadata: null,
          fileError: null,
          generalResults: [],
          globalTotals: null,
          specificResults: [],
          attendanceGroups: [],
          availableDates: [],
          selectedDate: null,
          unmappedCities: [],
        }),

      // ── Table processing ────────────────────────────────────────────────────

      processGeneralTable: () => {
        const { rawFileRows, cityConfigs, periodConfig } = get();
        if (!rawFileRows.length || !cityConfigs.length) return;

        const { aggregated } = aggregateDailyRowsByCity(rawFileRows, cityConfigs);
        const results: CityResult[] = [];

        for (const [, data] of aggregated) {
          const config = cityConfigs.find(c => c.cityId === data.cityId);
          if (!config || !config.activo || config.mo <= 0) continue;
          results.push(calculateCityResult(data, config, periodConfig));
        }

        results.sort((a, b) => a.ciudad.localeCompare(b.ciudad));
        const totals = calculateGlobalTotals(results);
        set({ generalResults: results, globalTotals: totals });
      },

      processSpecificTable: () => {
        const { rawFileRows, cityConfigs, periodConfig } = get();
        if (!rawFileRows.length || !cityConfigs.length) return;

        const { aggregated } = aggregateDailyRowsByCity(rawFileRows, cityConfigs);
        const cityRowsMap = new Map<string, DailyRow[]>();

        for (const row of rawFileRows) {
          const config = resolveCity(row.cityName, cityConfigs);
          if (!config) continue;
          const current = cityRowsMap.get(config.cityId) ?? [];
          current.push(row);
          cityRowsMap.set(config.cityId, current);
        }

        const cutoffDate = parseISODate(periodConfig.todayCutoff) ?? new Date();
        const yesterday = new Date(cutoffDate);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayISO = toLocalISODate(yesterday);

        const results: SpecificTableRow[] = [];

        for (const config of cityConfigs) {
          if (!config.activo) continue;
          const data = aggregated.get(config.cityId);
          const avanceQc = data?.approvedTotal ?? 0;
          const cityRows = cityRowsMap.get(config.cityId) ?? [];
          const m = cityRows.length;
          const totalPos = cityRows.reduce((sum, row) => sum + (row.totalPOS || 0), 0);
          const rejectedPartial = cityRows.reduce((sum, row) => sum + (row.partiallyRejectedPOS || 0), 0);
          const rejectedTotal = cityRows.reduce((sum, row) => sum + (row.rejectedPOS || 0), 0);

          const promGestorRaw = m > 0 ? totalPos / m : 0;
          const promGestor = promGestorRaw === 0 ? 4 : promGestorRaw;

          const auditorsYesterday = new Set(
            cityRows
              .filter(row => String(row.fecha).slice(0, 10) === yesterdayISO)
              .map(row => row.auditorName?.trim())
              .filter((name): name is string => Boolean(name))
          );
          const gestoresAyer = auditorsYesterday.size;

          const errorRealPct = totalPos > 0 && m > 0
            ? (((rejectedPartial + rejectedTotal) / totalPos) / m) * 100
            : 0;

          const diasFaltantes = calculateDiasFaltantesLaborales(periodConfig, config.descansos ?? 0);

          results.push(
            buildSpecificRow({
              cityConfig: config,
              avanceQc,
              periodConfig,
              computed: { diasFaltantes, promGestor, gestoresAyer, errorRealPct },
            })
          );
        }

        results.sort((a, b) => a.cityName.localeCompare(b.cityName));
        set({ specificResults: results });
      },

      setSelectedDate: (date) => {
        const { rawFileRows } = get();
        const attRows = toAttendanceRawRows(rawFileRows);
        const groups = groupAttendanceRows(attRows, date);
        set({ selectedDate: date, attendanceGroups: groups });
      },

      // ── JSON config ─────────────────────────────────────────────────────────

      importConfig: (json) => {
        try {
          const parsed = JSON.parse(json);
          if (parsed.periodConfig) set({ periodConfig: parsed.periodConfig });
          if (parsed.cities) set({ cityConfigs: parsed.cities });
        } catch { /* ignore */ }
      },

      exportConfigJson: () => {
        const { periodConfig, cityConfigs } = get();
        return JSON.stringify({ periodConfig, cities: cityConfigs }, null, 2);
      },
    }),
    {
      name: 'edge-reportes-config',
      partialize: (state) => ({
        periodConfig: state.periodConfig,
        cityConfigs: state.cityConfigs,
      }),
    }
  )
);
