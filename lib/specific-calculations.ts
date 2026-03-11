import { addDays, format } from 'date-fns';
import { safeDivide } from '@/lib/utils';
import { countWeekdaysInRange, parseISODate } from '@/lib/calendar';
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
  const diasFaltantes = Math.max(0, computed?.diasFaltantes ?? cityConfig.diasFaltantes);
  const promGestorBase = computed?.promGestor ?? cityConfig.promGestor;
  const promGestor = promGestorBase > 0 ? promGestorBase : 4;
  const gestoresAyer = computed?.gestoresAyer ?? cityConfig.gestoresAyer;
  const errorRealPct = Math.max(0, computed?.errorRealPct ?? cityConfig.errorRealPct);
  const umbralAcabado = cityConfig.umbralAcabado ?? 5;

  const fechaBase = parseISODate(periodConfig.todayCutoff) ?? new Date();
  const fechaInicio = parseISODate(periodConfig.startDate) ?? fechaBase;
  const fechaLimite = parseISODate(periodConfig.endDate) ?? fechaBase;

  const proyeccion = avanceQc + diasFaltantes * promGestor * gestoresAyer - mo;

  const conErrorReal =
    proyeccion > 0
      ? proyeccion * ((100 - errorRealPct) / 100)
      : proyeccion * ((100 + errorRealPct) / 100);

  const divisorGestores = diasFaltantes - 2;
  const proyGestores =
    promGestor > 0 && divisorGestores !== 0
      ? safeDivide(conErrorReal / promGestor, divisorGestores)
      : 0;

  const gestoresFaltantes =
    proyGestores < 0
      ? Math.ceil(Math.abs(safeDivide(conErrorReal / promGestor, divisorGestores || 1)))
      : 0;

  const proyeccionPct = mo > 0 ? ((mo + conErrorReal) * 100) / mo : 0;

  const objDiario =
    avanceQc > mo
      ? 0
      : diasFaltantes > 0
      ? safeDivide(mo - avanceQc, diasFaltantes)
      : 0;

  const objDiarioPorGestor =
    gestoresAyer === 0
      ? objDiario
      : objDiario > 0
      ? safeDivide(objDiario, gestoresAyer)
      : 0;

  const objDiarioMasError =
    errorRealPct === 0
      ? objDiario
      : objDiario + safeDivide(objDiario, errorRealPct);

  const objDiarioMasErrorPorGestor =
    gestoresAyer === 0
      ? objDiarioMasError
      : objDiarioMasError > 0
      ? safeDivide(objDiarioMasError, gestoresAyer)
      : 0;

  const diasParaObjetivo: SpecificTableRow['diasParaObjetivo'] =
    mo - avanceQc <= umbralAcabado
      ? 'Acabado'
      : gestoresAyer === 0
      ? 'Sin Avance'
      : Math.ceil(safeDivide(mo - avanceQc, promGestor * gestoresAyer));

  let fechaAproxCierre: string;
  if (diasParaObjetivo === 'Acabado') {
    fechaAproxCierre = 'Cerrado';
  } else if (diasParaObjetivo === 'Sin Avance') {
    fechaAproxCierre = 'Sin Avance';
  } else {
    const fechaTentativa = addDays(fechaBase, Number(diasParaObjetivo));
    const domingosHastaCierre = countWeekdaysInRange(fechaInicio, fechaTentativa, 0);
    const domingosHastaHoy = countWeekdaysInRange(fechaInicio, fechaBase, 0);
    const domingosFaltantes = Math.max(0, domingosHastaCierre - domingosHastaHoy);
    const fechaConDomingos = addDays(fechaBase, Number(diasParaObjetivo) + domingosFaltantes);

    fechaAproxCierre = fechaConDomingos > fechaLimite
      ? 'NO CIERRA'
      : format(fechaConDomingos, 'dd/MM/yyyy');
  }

  const porcentajeAvance = mo > 0 ? Number(((avanceQc * 100) / mo).toFixed(2)) : 0;
  const faltantesTotal = mo - avanceQc;

  return {
    area,
    simplifiedCity: cityConfig.simplifiedCity,
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