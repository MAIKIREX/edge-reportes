import { addDays, format } from 'date-fns';
import { safeDivide } from '@/lib/utils';
import { parseISODate } from '@/lib/calendar';
import type { CityConfig, PeriodConfig, SpecificTableRow } from '@/types/results.types';

interface BuildSpecificRowInput {
  cityConfig: CityConfig;
  avanceQc: number;
  periodConfig: PeriodConfig;
  computed?: {
    diasFaltantes?: number;
    promGestor?: number;
    gestoresAyer?: number;
    errorRealPct?: number;
  };
}

export function buildSpecificRow(input: BuildSpecificRowInput): SpecificTableRow {
  const { cityConfig, avanceQc, periodConfig, computed } = input;

  const area = cityConfig.area;
  const cityName = cityConfig.cityLabel;
  const mo = cityConfig.mo;
  const diasFaltantes = computed?.diasFaltantes ?? cityConfig.diasFaltantes;
  const promGestor = (computed?.promGestor ?? cityConfig.promGestor) > 0 ? (computed?.promGestor ?? cityConfig.promGestor) : 4;
  const gestoresAyer = computed?.gestoresAyer ?? cityConfig.gestoresAyer;
  const errorRealPct = Math.max(0, computed?.errorRealPct ?? cityConfig.errorRealPct);
  const diasOffsetCierre = cityConfig.diasOffsetCierre ?? 2;
  const umbralAcabado = cityConfig.umbralAcabado ?? 5;

  const fechaBase = parseISODate(periodConfig.todayCutoff) ?? new Date();
  const fechaLimite = parseISODate(periodConfig.endDate) ?? new Date();

  // H. Proyección
  const proyeccion = avanceQc + diasFaltantes * promGestor * gestoresAyer - mo;

  // J. Con Error Real
  const conErrorReal =
    proyeccion > 0
      ? proyeccion * ((100 - errorRealPct) / 100)
      : proyeccion * ((100 + errorRealPct) / 100);

  // K. Proy Gestores
  const proyGestores =
    promGestor > 0 && diasFaltantes - 2 > 0
      ? safeDivide(conErrorReal / promGestor, diasFaltantes - 2)
      : 0;

  // L. Gestores Faltantes
  const gestoresFaltantes = proyGestores < 0 ? Math.ceil(Math.abs(proyGestores)) : 0;

  // M. Proyección %
  const proyeccionPct = mo > 0 ? ((mo + conErrorReal) * 100) / mo : 0;

  // N. OBJ Diario
  const objDiario =
    avanceQc > mo
      ? 0
      : diasFaltantes > 0
      ? safeDivide(mo - avanceQc, diasFaltantes)
      : 0;

  // O. OBJ Diario x Gestor
  const objDiarioPorGestor =
    gestoresAyer === 0
      ? objDiario
      : objDiario > 0
      ? safeDivide(objDiario, gestoresAyer)
      : 0;

  // P. OBJ Diario + Error
  const objDiarioMasError =
    errorRealPct === 0
      ? objDiario
      : objDiario + safeDivide(objDiario, errorRealPct);

  // Q. OBJ Diario x Gestor (+ Error)
  const objDiarioMasErrorPorGestor =
    gestoresAyer === 0
      ? objDiarioMasError
      : objDiarioMasError > 0
      ? safeDivide(objDiarioMasError, gestoresAyer)
      : 0;

  // R. Días para el Objetivo
  const diasParaObjetivo: SpecificTableRow['diasParaObjetivo'] =
    mo - avanceQc <= umbralAcabado
      ? 'Acabado'
      : gestoresAyer === 0
      ? 'Sin Avance'
      : Math.ceil(safeDivide(mo - avanceQc, promGestor * gestoresAyer));

  // S. Fecha (Aprox) de Cierre
  let fechaAproxCierre: string;
  if (diasParaObjetivo === 'Acabado') {
    fechaAproxCierre = 'Cerrado';
  } else if (diasParaObjetivo === 'Sin Avance') {
    fechaAproxCierre = 'Sin Avance';
  } else {
    const fechaCalc = addDays(fechaBase, Number(diasParaObjetivo) + diasOffsetCierre);
    fechaAproxCierre = fechaCalc > fechaLimite ? 'NO CIERRA' : format(fechaCalc, 'dd/MM/yyyy');
  }

  // T. %
  const porcentajeAvance = mo > 0 ? Math.round((avanceQc * 100) / mo) / 100 : 0;

  // U. Faltantes Total
  const faltantesTotal = mo - avanceQc;

  return {
    area,
    cityName,
    avanceQc,
    mo,
    diasFaltantes,
    promGestor,
    gestoresAyer,
    proyeccion,
    errorRealPct,
    conErrorReal,
    proyGestores,
    gestoresFaltantes,
    proyeccionPct,
    objDiario,
    objDiarioPorGestor,
    objDiarioMasError,
    objDiarioMasErrorPorGestor,
    diasParaObjetivo,
    fechaAproxCierre,
    porcentajeAvance,
    faltantesTotal,
  };
}
