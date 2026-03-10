// ─── Raw Excel Row ────────────────────────────────────────────────────────────

export interface DailyRow {
  fecha: string | Date;
  metropolitanArea: string;
  cityName: string;
  userId: string;
  auditorName: string;
  supervisor: string;
  totalPOS: number;
  approvedPOS: number;
  partiallyRejectedPOS: number;
  rejectedPOS: number;
  enQCPOS: number;
  incompletePOS: number;
  refusalPOS: number;
  microzonasVisitadas?: number;
  numero?: number;            // column "N°" for attendance filter
  taskDateTime?: string | Date; // timestamp for first/last task
}

// ─── Configuration Types ─────────────────────────────────────────────────────

export interface CityConfig {
  cityId: string;
  cityLabel: string;
  aliases: string[];
  mo: number;
  muestra?: number;
  descansos?: number;
  activo: boolean;
  // Extended fields for Specific table
  area: string;
  promGestor: number;
  gestoresAyer: number;
  errorRealPct: number;
  diasFaltantes: number;
  diasOffsetCierre: number;
  umbralAcabado: number;
  descansosTranscurridos?: number;
}

export interface PeriodConfig {
  startDate: string;        // ISO date string YYYY-MM-DD
  endDate: string;
  todayCutoff: string;
  excludeSundays: boolean;
  saturdayFactor: number;   // 0=no count, 0.5=half, 1=full
}

// ─── Aggregated Data ─────────────────────────────────────────────────────────

export interface AggregatedCityData {
  cityId: string;
  cityLabel: string;
  approvedTotal: number;
  totalPOSTotal: number;
  rowCount: number;
  fechasDetectadas: string[];
}

// ─── General Table A-L ───────────────────────────────────────────────────────

export interface CityResult {
  ciudad: string;
  mo: number;
  diasEnMes: number;
  objetivoPorDia: number;
  columnaE?: number | string | null;
  avanceTotal: number;
  avanceEsperadoHoy: number;
  avanceGeneral: number;           // ratio (0-1+)
  avanceEsperadoRelativo: number;  // ratio (0-1)
  deficitHoy: number;
  deficitGeneral: number;
  muestra: number;
  // Semaphore state
  estado: 'green' | 'yellow' | 'red';
}

export interface GlobalTotals {
  mo: number;
  avanceTotal: number;
  avanceEsperadoHoy: number;
  deficitHoy: number;
  deficitGeneral: number;
  avanceGeneral: number;
  avanceEsperadoRelativo: number;
}

// ─── Specific Table A-U ──────────────────────────────────────────────────────

export interface SpecificTableRow {
  area: string;
  cityName: string;
  avanceQc: number;
  mo: number;
  diasFaltantes: number;
  promGestor: number;
  gestoresAyer: number;
  proyeccion: number;
  errorRealPct: number;
  conErrorReal: number;
  proyGestores: number;
  gestoresFaltantes: number;
  proyeccionPct: number;
  objDiario: number;
  objDiarioPorGestor: number;
  objDiarioMasError: number;
  objDiarioMasErrorPorGestor: number;
  diasParaObjetivo: number | 'Acabado' | 'Sin Avance';
  fechaAproxCierre: string;
  porcentajeAvance: number;
  faltantesTotal: number;
}

// ─── Attendance Table ─────────────────────────────────────────────────────────

export interface AttendanceRawRow {
  fecha: string;
  supervisor: string;
  cityName: string;
  auditorName: string;
  totalPos: number;
  numero: number;
  taskDateTime?: Date | string;
}

export interface AttendanceAuditorRow {
  fecha: string;
  supervisor: string;
  cityName: string;
  auditorName: string;
  horaPrimeraTarea: string;
  horaUltimaTarea: string;
  posRecolectados: number;
}

export interface AttendanceCityGroup {
  cityName: string;
  auditors: AttendanceAuditorRow[];
  subtotalPos: number;
}

export interface AttendanceSupervisorGroup {
  supervisor: string;
  cities: AttendanceCityGroup[];
  subtotalPos: number;
}

// ─── File Metadata ────────────────────────────────────────────────────────────

export interface FileMetadata {
  filename: string;
  rowCount: number;
  detectedDates: string[];
  detectedCities: string[];
  unmappedCities: string[];
  maxDate?: string;
  hasTimeColumn: boolean;
  hasNumeroColumn: boolean;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  missingColumns: string[];
  warnings: string[];
}
