export type ExcelCellValue = string | number;

export interface SourceRow {
  [header: string]: ExcelCellValue;
}

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
  totalTime?: number;
  microzonasVisitadas?: string;
  numero?: number;
  taskDateTime?: string | Date;
}

export interface CityConfig {
  cityId: string;
  cityLabel: string;
  aliases: string[];
  mo: number;
  muestra?: number;
  descansos?: number;
  activo: boolean;
  area: string;
  simplifiedCity?: string;
  promGestor: number;
  gestoresAyer: number;
  errorRealPct: number;
  diasFaltantes: number;
  diasOffsetCierre: number;
  umbralAcabado: number;
  descansosTranscurridos?: number;
}

export interface PeriodConfig {
  startDate: string;
  endDate: string;
  todayCutoff: string;
  excludeSundays: boolean;
  saturdayFactor: number;
}

export interface AggregatedCityData {
  cityId: string;
  cityLabel: string;
  approvedTotal: number;
  totalPOSTotal: number;
  rowCount: number;
  fechasDetectadas: string[];
}

export interface CityResult {
  ciudad: string;
  mo: number;
  diasEnMes: number;
  objetivoPorDia: number;
  columnaE?: number | string | null;
  avanceTotal: number;
  avanceEsperadoHoy: number;
  avanceGeneral: number;
  avanceEsperadoRelativo: number;
  deficitHoy: number;
  deficitGeneral: number;
  muestra: number;
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

export interface SpecificTableRow {
  area: string;
  simplifiedCity?: string;
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

export interface CombinedTableRow {
  originalData: SourceRow;
  rechazadosTotales: number;
  porcentajeRechazados: number;
  porcentajeAprobados: number;
  porcentajeAjustes: number;
  ciudadSimplificada: string;
  tiempoPromedio: number;
}

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

export interface FileMetadata {
  filename: string;
  rowCount: number;
  detectedDates: string[];
  detectedCities: string[];
  unmappedCities: string[];
  sourceHeaders: string[];
  maxDate?: string;
  hasTimeColumn: boolean;
  hasNumeroColumn: boolean;
}

export interface ValidationResult {
  valid: boolean;
  missingColumns: string[];
  warnings: string[];
}