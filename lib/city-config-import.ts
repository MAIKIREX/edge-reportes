import * as XLSX from 'xlsx';
import { normalizeText } from '@/lib/utils';
import type { CityConfig } from '@/types/results.types';

const REQUIRED_COLUMNS = {
  area: ['AREA'],
  cityName: ['CITY NAME', 'CITYNAME'],
  mo: ['MO'],
} as const;

const DEDUP_STRATEGY: 'keep-first' | 'keep-last' = 'keep-first';

interface ParsedCityConfigResult {
  cityConfigs: CityConfig[];
  totalRows: number;
  skippedEmptyRows: number;
  skippedInvalidRows: number;
  duplicateRows: number;
}

function buildCityId(value: string): string {
  const id = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return id || 'city';
}

function parseMo(raw: unknown): number | null {
  const clean = String(raw ?? '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^\d,.-]/g, '')
    .replace(',', '.');
  if (!clean) return null;
  const value = Number(clean);
  return Number.isFinite(value) ? value : null;
}

function findColumnIndex(headers: string[], aliases: readonly string[]): number {
  return headers.findIndex((header) => aliases.includes(normalizeText(header)));
}

export async function parseCityConfigExcel(file: File): Promise<ParsedCityConfigResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' }) as unknown[][];

  if (rows.length < 2) {
    return { cityConfigs: [], totalRows: 0, skippedEmptyRows: 0, skippedInvalidRows: 0, duplicateRows: 0 };
  }

  const headers = (rows[0] ?? []).map((value) => String(value ?? '').trim());
  const areaIdx = findColumnIndex(headers, REQUIRED_COLUMNS.area);
  const cityIdx = findColumnIndex(headers, REQUIRED_COLUMNS.cityName);
  const moIdx = findColumnIndex(headers, REQUIRED_COLUMNS.mo);

  const missing: string[] = [];
  if (areaIdx === -1) missing.push('Area');
  if (cityIdx === -1) missing.push('City name');
  if (moIdx === -1) missing.push('MO');
  if (missing.length > 0) {
    throw new Error(`Faltan columnas requeridas en el Excel: ${missing.join(', ')}`);
  }

  const byCity = new Map<string, CityConfig>();
  let skippedEmptyRows = 0;
  let skippedInvalidRows = 0;
  let duplicateRows = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] ?? [];
    const cityRaw = String(row[cityIdx] ?? '').trim();
    const areaRaw = String(row[areaIdx] ?? '').trim();
    const mo = parseMo(row[moIdx]);

    if (!cityRaw && !areaRaw && mo === null) {
      skippedEmptyRows += 1;
      continue;
    }

    if (!cityRaw || !areaRaw || mo === null) {
      skippedInvalidRows += 1;
      continue;
    }

    const cityLabel = normalizeText(cityRaw);
    const key = cityLabel;
    const item: CityConfig = {
      cityId: buildCityId(cityLabel),
      cityLabel,
      aliases: [cityLabel],
      mo,
      activo: true,
      area: normalizeText(areaRaw),
      promGestor: 4,
      gestoresAyer: 0,
      errorRealPct: 0,
      diasFaltantes: 0,
      descansos: 0,
      diasOffsetCierre: 2,
      umbralAcabado: 5,
    };

    if (byCity.has(key)) {
      duplicateRows += 1;
      if (DEDUP_STRATEGY === 'keep-last') byCity.set(key, item);
      continue;
    }

    byCity.set(key, item);
  }

  return {
    cityConfigs: Array.from(byCity.values()),
    totalRows: rows.length - 1,
    skippedEmptyRows,
    skippedInvalidRows,
    duplicateRows,
  };
}
