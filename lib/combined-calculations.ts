import type { CombinedTableRow, DailyRow, SourceRow } from '@/types/results.types';

export function simplifyCity(city: string): string {
  const normalizedCity = (city || '').toUpperCase().trim();

  if (normalizedCity === 'COBIJA') return 'COBIJA';
  if (['COCHABAMBA', 'QUILLACOLLO', 'COLCAPIRHUA', 'VINTO', 'TIQUIPAYA', 'SIPE SIPE', 'SACABA', 'PUNATA'].includes(normalizedCity)) return 'COCHABAMBA';
  if (normalizedCity === 'GUAYARAMERIN') return 'GUAYARAMERIN';
  if (['LA PAZ', 'ACHOCALLA'].includes(normalizedCity)) return 'LA PAZ';
  if (['EL ALTO', 'VIACHA'].includes(normalizedCity)) return 'EL ALTO';
  if (['ORURO', 'LLALLAGUA'].includes(normalizedCity)) return 'ORURO';
  if (normalizedCity === 'POTOSI') return 'POTOSI';
  if (normalizedCity === 'RIBERALTA') return 'RIBERALTA';
  if (normalizedCity === 'SAN BORJA') return 'SAN BORJA';
  if (['MONTERO', 'SANTA CRUZ DE LA SIERRA', 'WARNES', 'PAILON', 'LA GUARDIA', 'COTOCA', 'EL TORNO', 'YAPACANI'].includes(normalizedCity)) return 'SANTA CRUZ';
  if (normalizedCity === 'SUCRE') return 'SUCRE';
  if (normalizedCity === 'TARIJA') return 'TARIJA';
  if (normalizedCity === 'TRINIDAD') return 'TRINIDAD';
  if (normalizedCity === 'TUPIZA') return 'TUPIZA';

  return 'Otro';
}

export function buildCombinedRows(rawRows: DailyRow[], sourceRows: SourceRow[]): CombinedTableRow[] {
  return rawRows.map((row, index) => {
    const totalPOS = row.totalPOS || 0;
    const partiallyRejected = row.partiallyRejectedPOS || 0;
    const rejected = row.rejectedPOS || 0;
    const approved = row.approvedPOS || 0;
    const totalTime = row.totalTime || 0;

    const rechazadosTotales = partiallyRejected + rejected;
    const porcentajeRechazados = totalPOS > 0 ? rechazadosTotales / totalPOS : 0;
    const porcentajeAprobados = totalPOS > 0 ? approved / totalPOS : 0;
    const porcentajeAjustes = totalPOS > 0 ? partiallyRejected / totalPOS : 0;
    const tiempoPromedio = totalPOS > 0 ? totalTime / totalPOS : 0;
    const ciudadSimplificada = simplifyCity(row.cityName);

    return {
      originalData: sourceRows[index] ?? {},
      rechazadosTotales,
      porcentajeRechazados,
      porcentajeAprobados,
      porcentajeAjustes,
      ciudadSimplificada,
      tiempoPromedio,
    };
  });
}