import { normalizeText } from './utils';
import type { DailyRow, FileMetadata, ValidationResult } from '@/types/results.types';
import * as XLSX from 'xlsx';

// ─── Column Aliases ───────────────────────────────────────────────────────────
// Maps normalized header names → field in DailyRow

const COLUMN_MAP: Record<string, keyof DailyRow> = {
  'FECHA': 'fecha',
  'DATE': 'fecha',
  'METROPOLITAN AREA': 'metropolitanArea',
  'METROPOLITAN': 'metropolitanArea',
  'CITY NAME': 'cityName',
  'CITY': 'cityName',
  'USER ID': 'userId',
  'USERID': 'userId',
  'NAME AUDITOR': 'auditorName',
  'AUDITOR NAME': 'auditorName',
  'AUDITOR': 'auditorName',
  'NOMBRE AUDITOR': 'auditorName',
  'SUPERVISOR': 'supervisor',
  'TOTAL POS': 'totalPOS',
  'TOTALPOS': 'totalPOS',
  'APPROVED POS': 'approvedPOS',
  'APPROVEDPOS': 'approvedPOS',
  'PARTIALLY REJECTED POS': 'partiallyRejectedPOS',
  'REJECTED POS': 'rejectedPOS',
  'EN QC POS': 'enQCPOS',
  'INCOMPLETE POS': 'incompletePOS',
  'REFUSAL POS': 'refusalPOS',
  'MICROZONAS VISITADAS': 'microzonasVisitadas',
  'N': 'numero',
  'N°': 'numero',
  'NO': 'numero',
  'NUM': 'numero',
  'HORA': 'taskDateTime',
  'HORA TAREA': 'taskDateTime',
  'TIMESTAMP': 'taskDateTime',
  'CREATED AT': 'taskDateTime',
  'TASK TIME': 'taskDateTime',
  'FECHA Y HORA': 'taskDateTime',
};

const REQUIRED_COLUMNS: Array<keyof DailyRow> = ['fecha', 'cityName', 'approvedPOS'];
const RECOMMENDED_COLUMNS: Array<keyof DailyRow> = ['totalPOS', 'auditorName', 'supervisor'];

// ─── Header Resolver ──────────────────────────────────────────────────────────

function resolveHeader(raw: string): keyof DailyRow | undefined {
  const normalized = normalizeText(raw);
  if (COLUMN_MAP[normalized]) return COLUMN_MAP[normalized];
  // Fuzzy: trim trailing special chars then retry
  const trimmed = normalized.replace(/[^A-Z0-9 ]/g, '').trim();
  return COLUMN_MAP[trimmed];
}

// ─── Date Normalizer ──────────────────────────────────────────────────────────

function normalizeDate(raw: unknown): string {
  if (!raw) return '';
  // Excel numeric date (days since 1900-01-01)
  if (typeof raw === 'number') {
    const date = XLSX.SSF.parse_date_code(raw);
    if (date) {
      const y = date.y;
      const m = String(date.m).padStart(2, '0');
      const d = String(date.d).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }
  if (raw instanceof Date) {
    return raw.toISOString().slice(0, 10);
  }
  // String: try parsing common formats
  const str = String(raw).trim();
  // DD/MM/YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2,'0')}-${ddmmyyyy[1].padStart(2,'0')}`;
  // YYYY-MM-DD already
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  return str;
}

// ─── Time Normalizer ──────────────────────────────────────────────────────────

function normalizeTime(raw: unknown): string | undefined {
  if (!raw) return undefined;
  if (raw instanceof Date) return raw.toTimeString().slice(0, 5);
  if (typeof raw === 'number') {
    // Excel fractional day
    const totalSeconds = Math.round(raw * 86400);
    const h = Math.floor(totalSeconds / 3600) % 24;
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }
  const str = String(raw).trim();
  // HH:MM or HH:MM:SS
  const match = str.match(/(\d{1,2}):(\d{2})/);
  if (match) return `${match[1].padStart(2,'0')}:${match[2]}`;
  return undefined;
}

// ─── Main Parser ──────────────────────────────────────────────────────────────

export async function parseExcelFile(file: File): Promise<{
  rows: DailyRow[];
  metadata: FileMetadata;
  validation: ValidationResult;
}> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: false });

  // Pick first sheet
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][];

  if (rawData.length < 2) {
    return {
      rows: [],
      metadata: { filename: file.name, rowCount: 0, detectedDates: [], detectedCities: [], unmappedCities: [], hasTimeColumn: false, hasNumeroColumn: false },
      validation: { valid: false, missingColumns: ['No data rows found'], warnings: [] },
    };
  }

  // Build header map: index → DailyRow field
  const headers = rawData[0] as string[];
  const headerMap: Record<number, keyof DailyRow> = {};
  const foundFields = new Set<keyof DailyRow>();

  headers.forEach((h, i) => {
    const field = resolveHeader(String(h));
    if (field) {
      headerMap[i] = field;
      foundFields.add(field);
    }
  });

  // Validate
  const missingRequired = REQUIRED_COLUMNS.filter(c => !foundFields.has(c));
  const warnings: string[] = RECOMMENDED_COLUMNS
    .filter(c => !foundFields.has(c))
    .map(c => `Columna recomendada no encontrada: ${c}`);
  const hasTimeColumn = foundFields.has('taskDateTime');
  const hasNumeroColumn = foundFields.has('numero');

  if (missingRequired.length > 0) {
    return {
      rows: [],
      metadata: { filename: file.name, rowCount: 0, detectedDates: [], detectedCities: [], unmappedCities: [], hasTimeColumn, hasNumeroColumn },
      validation: { valid: false, missingColumns: missingRequired, warnings },
    };
  }

  // Parse rows
  const rows: DailyRow[] = [];
  const dateSet = new Set<string>();
  const citySet = new Set<string>();

  for (let r = 1; r < rawData.length; r++) {
    const raw = rawData[r] as unknown[];
    const row: Partial<DailyRow> = {};

    for (const [idxStr, field] of Object.entries(headerMap)) {
      const idx = Number(idxStr);
      const val = raw[idx];

      if (field === 'fecha') {
        row.fecha = normalizeDate(val);
      } else if (field === 'taskDateTime') {
        row.taskDateTime = normalizeTime(val);
      } else if (field === 'cityName' || field === 'auditorName' || field === 'supervisor' || field === 'metropolitanArea' || field === 'userId') {
        row[field] = String(val ?? '').trim();
      } else {
        // numeric fields
        const n = parseFloat(String(val ?? '0').replace(',', '.'));
        (row as Record<string, unknown>)[field] = isNaN(n) ? 0 : n;
      }
    }

    // Fill defaults
    const finalRow: DailyRow = {
      fecha: row.fecha ?? '',
      metropolitanArea: row.metropolitanArea ?? '',
      cityName: row.cityName ?? '',
      userId: row.userId ?? '',
      auditorName: row.auditorName ?? '',
      supervisor: row.supervisor ?? '',
      totalPOS: row.totalPOS ?? 0,
      approvedPOS: row.approvedPOS ?? 0,
      partiallyRejectedPOS: row.partiallyRejectedPOS ?? 0,
      rejectedPOS: row.rejectedPOS ?? 0,
      enQCPOS: row.enQCPOS ?? 0,
      incompletePOS: row.incompletePOS ?? 0,
      refusalPOS: row.refusalPOS ?? 0,
      microzonasVisitadas: row.microzonasVisitadas,
      numero: row.numero,
      taskDateTime: row.taskDateTime,
    };

    if (finalRow.cityName) citySet.add(finalRow.cityName);
    if (finalRow.fecha) dateSet.add(String(finalRow.fecha).slice(0, 10));
    rows.push(finalRow);
  }

  const detectedDates = Array.from(dateSet).sort();
  const detectedCities = Array.from(citySet).sort();
  const maxDate = detectedDates[detectedDates.length - 1];

  return {
    rows,
    metadata: {
      filename: file.name,
      rowCount: rows.length,
      detectedDates,
      detectedCities,
      unmappedCities: [], // filled later after city normalization
      maxDate,
      hasTimeColumn,
      hasNumeroColumn,
    },
    validation: {
      valid: true,
      missingColumns: [],
      warnings,
    },
  };
}
