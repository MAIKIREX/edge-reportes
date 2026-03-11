import * as XLSX from 'xlsx';
import type { DailyRow, FileMetadata, SourceRow, ValidationResult } from '@/types/results.types';
import { normalizeText } from './utils';

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
  'TIEMPO TOTAL EN FORMULARIOS': 'totalTime',
  'TIEMPO EN FORMULARIOS HRS': 'totalTime',
  'TOTAL TIME': 'totalTime',
  'TIEMPO TOTAL': 'totalTime',
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
const RECOMMENDED_COLUMNS: Array<keyof DailyRow> = ['totalPOS', 'auditorName'];

function resolveHeader(raw: string): keyof DailyRow | undefined {
  const normalized = normalizeText(raw);
  if (COLUMN_MAP[normalized]) return COLUMN_MAP[normalized];
  const trimmed = normalized.replace(/[^A-Z0-9 ]/g, '').trim();
  return COLUMN_MAP[trimmed];
}

function normalizeDate(raw: unknown): string {
  if (!raw) return '';
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

  const str = String(raw).trim();
  const ddmmyyyy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (ddmmyyyy) {
    return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }

  return str;
}

function normalizeTime(raw: unknown): string | undefined {
  if (raw === null || raw === undefined || raw === '') return undefined;
  if (raw instanceof Date) return raw.toTimeString().slice(0, 5);

  if (typeof raw === 'number') {
    const totalSeconds = Math.round(raw * 86400);
    const h = Math.floor(totalSeconds / 3600) % 24;
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  const str = String(raw).trim();
  const match = str.match(/(\d{1,2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, '0')}:${match[2]}`;
  return undefined;
}

function toNumericValue(raw: unknown): number {
  if (raw === null || raw === undefined || raw === '') return 0;
  if (typeof raw === 'number') return raw;
  const normalized = String(raw).trim().replace(/\./g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatSourceValue(header: string, raw: unknown): string | number {
  if (raw === null || raw === undefined || raw === '') return '';

  const normalizedHeader = normalizeText(header).replace(/[^A-Z0-9 ]/g, '').trim();
  const isDateColumn = normalizedHeader === 'FECHA' || normalizedHeader === 'DATE';
  const isTimeColumn = normalizedHeader.includes('HORA') || normalizedHeader.includes('TIME') || normalizedHeader.includes('TIMESTAMP');

  if (isDateColumn) {
    return normalizeDate(raw);
  }

  if (isTimeColumn) {
    return normalizeTime(raw) ?? String(raw);
  }

  if (typeof raw === 'number') {
    return Number.isInteger(raw) ? raw : Number(raw.toFixed(4));
  }

  return String(raw).trim();
}

export async function parseExcelFile(file: File): Promise<{
  rows: DailyRow[];
  sourceRows: SourceRow[];
  metadata: FileMetadata;
  validation: ValidationResult;
}> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: false });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][];

  if (rawData.length < 2) {
    return {
      rows: [],
      sourceRows: [],
      metadata: {
        filename: file.name,
        rowCount: 0,
        detectedDates: [],
        detectedCities: [],
        unmappedCities: [],
        sourceHeaders: [],
        hasTimeColumn: false,
        hasNumeroColumn: false,
      },
      validation: { valid: false, missingColumns: ['No data rows found'], warnings: [] },
    };
  }

  const headers = (rawData[0] as unknown[]).map(value => String(value ?? '').trim());
  const headerMap: Record<number, keyof DailyRow> = {};
  const foundFields = new Set<keyof DailyRow>();

  headers.forEach((header, index) => {
    const field = resolveHeader(header);
    if (field) {
      headerMap[index] = field;
      foundFields.add(field);
    }
  });

  const missingRequired = REQUIRED_COLUMNS.filter(column => !foundFields.has(column));
  const warnings = RECOMMENDED_COLUMNS
    .filter(column => !foundFields.has(column))
    .map(column => `Columna recomendada no encontrada: ${column}`);

  const hasTimeColumn = foundFields.has('taskDateTime') || headers.some(header => normalizeText(header).includes('HORA'));
  const hasNumeroColumn = foundFields.has('numero');

  if (missingRequired.length > 0) {
    return {
      rows: [],
      sourceRows: [],
      metadata: {
        filename: file.name,
        rowCount: 0,
        detectedDates: [],
        detectedCities: [],
        unmappedCities: [],
        sourceHeaders: headers,
        hasTimeColumn,
        hasNumeroColumn,
      },
      validation: { valid: false, missingColumns: missingRequired, warnings },
    };
  }

  const rows: DailyRow[] = [];
  const sourceRows: SourceRow[] = [];
  const dateSet = new Set<string>();
  const citySet = new Set<string>();

  for (let rowIndex = 1; rowIndex < rawData.length; rowIndex += 1) {
    const rawRow = rawData[rowIndex] as unknown[];
    const parsedRow: Partial<DailyRow> = {};
    const sourceRow: SourceRow = {};

    headers.forEach((header, columnIndex) => {
      sourceRow[header] = formatSourceValue(header, rawRow[columnIndex]);
    });

    for (const [indexKey, field] of Object.entries(headerMap)) {
      const index = Number(indexKey);
      const value = rawRow[index];

      if (field === 'fecha') {
        parsedRow.fecha = normalizeDate(value);
      } else if (field === 'taskDateTime') {
        parsedRow.taskDateTime = normalizeTime(value);
      } else if (field === 'cityName' || field === 'auditorName' || field === 'supervisor' || field === 'metropolitanArea' || field === 'userId' || field === 'microzonasVisitadas') {
        parsedRow[field] = String(sourceRow[headers[index]] ?? '').trim();
      } else {
        (parsedRow as Record<string, unknown>)[field] = toNumericValue(value);
      }
    }

    const finalRow: DailyRow = {
      fecha: parsedRow.fecha ?? '',
      metropolitanArea: parsedRow.metropolitanArea ?? '',
      cityName: parsedRow.cityName ?? '',
      userId: parsedRow.userId ?? '',
      auditorName: parsedRow.auditorName ?? '',
      supervisor: parsedRow.supervisor ?? '',
      totalPOS: parsedRow.totalPOS ?? 0,
      approvedPOS: parsedRow.approvedPOS ?? 0,
      partiallyRejectedPOS: parsedRow.partiallyRejectedPOS ?? 0,
      rejectedPOS: parsedRow.rejectedPOS ?? 0,
      enQCPOS: parsedRow.enQCPOS ?? 0,
      incompletePOS: parsedRow.incompletePOS ?? 0,
      refusalPOS: parsedRow.refusalPOS ?? 0,
      totalTime: parsedRow.totalTime ?? 0,
      microzonasVisitadas: parsedRow.microzonasVisitadas,
      numero: parsedRow.numero,
      taskDateTime: parsedRow.taskDateTime,
    };

    if (finalRow.cityName) citySet.add(finalRow.cityName);
    if (finalRow.fecha) dateSet.add(String(finalRow.fecha).slice(0, 10));

    rows.push(finalRow);
    sourceRows.push(sourceRow);
  }

  const detectedDates = Array.from(dateSet).sort();
  const detectedCities = Array.from(citySet).sort();
  const maxDate = detectedDates[detectedDates.length - 1];

  return {
    rows,
    sourceRows,
    metadata: {
      filename: file.name,
      rowCount: rows.length,
      detectedDates,
      detectedCities,
      unmappedCities: [],
      sourceHeaders: headers,
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