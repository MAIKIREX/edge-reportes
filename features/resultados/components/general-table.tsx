'use client';

import { Download, Table as TableIcon, TrendingUp, AlertTriangle, Target, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { exportToExcel } from '@/lib/export';
import { simplifyCity } from '@/lib/combined-calculations';
import { countWeekdaysInRange, diffDaysInclusive, parseISODate } from '@/lib/calendar';
import { formatNum, normalizeText, safeDivide } from '@/lib/utils';
import { useResultsStore } from '@/store/use-results-store';

interface GeneralDisplayRow {
  ciudad: string;
  mo: number;
  diasEnMes: number | null;
  objetivoPorDia: number;
  avanceTotal: number;
  avanceEsperadoHoy1: number;
  avanceGeneral: number;
  avanceEsperadoHoy2: number;
  deficitHoy: number;
  deficitGeneral: number;
  muestra: number;
  hasConfigError: boolean;
  estado: 'green' | 'yellow' | 'red';
}

function toNumber(value: string | number | undefined): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const normalized = String(value).trim().replace(/\./g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPctInt(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

function buildTotalEdgeBySimplified(combinedResults: ReturnType<typeof useResultsStore.getState>['combinedResults']): Map<string, number> {
  const errorByCity = Array.from(
    combinedResults.reduce((map, row) => {
      const cityName = String(row.originalData['City Name'] ?? '').trim();
      if (!cityName) return map;

      const current = map.get(cityName) ?? { rejectedPctSum: 0, count: 0 };
      current.rejectedPctSum += row.porcentajeRechazados * 100;
      current.count += 1;
      map.set(cityName, current);
      return map;
    }, new Map<string, { rejectedPctSum: number; count: number }>())
  ).map(([cityName, values]) => ({
    cityName,
    averageError: values.count > 0 ? values.rejectedPctSum / values.count : 0,
  }));

  const averageErrorByCity = new Map(errorByCity.map(row => [row.cityName, row.averageError]));

  const projectionByCity = Array.from(
    combinedResults.reduce((map, row) => {
      const cityName = String(row.originalData['City Name'] ?? '').trim();
      if (!cityName) return map;

      const current = map.get(cityName) ?? { approvedSum: 0, enQcSum: 0 };
      current.approvedSum += toNumber(row.originalData['Approved POS']);
      current.enQcSum += toNumber(row.originalData['En QC POS']);
      map.set(cityName, current);
      return map;
    }, new Map<string, { approvedSum: number; enQcSum: number }>())
  ).map(([cityName, values]) => {
    const averageError = averageErrorByCity.get(cityName) ?? 0;
    const projectedApprovedQc = values.enQcSum * (1 - averageError / 100);
    return {
      cityName,
      approvedPlusQcWithError: values.approvedSum + projectedApprovedQc,
    };
  });

  return projectionByCity.reduce((map, row) => {
    const simplifiedCity = simplifyCity(row.cityName);
    const current = map.get(simplifiedCity) ?? 0;
    map.set(simplifiedCity, current + row.approvedPlusQcWithError);
    return map;
  }, new Map<string, number>());
}

export function GeneralTable() {
  const { cityConfigs, combinedResults, periodConfig } = useResultsStore();

  const groupedBaseRows = Array.from(
    cityConfigs.reduce((map, city) => {
      const simplifiedCity = normalizeText(city.simplifiedCity?.trim() || city.cityLabel || '');
      if (!simplifiedCity) return map;

      const current = map.get(simplifiedCity) ?? 0;
      map.set(simplifiedCity, current + (city.mo || 0));
      return map;
    }, new Map<string, number>())
  )
    .map(([ciudad, mo]) => ({ ciudad, mo }))
    .sort((a, b) => a.ciudad.localeCompare(b.ciudad));

  const averageDescansosByCity = Array.from(
    cityConfigs.reduce((map, city) => {
      const simplifiedCity = normalizeText(city.simplifiedCity?.trim() || city.cityLabel || '');
      if (!simplifiedCity) return map;

      const current = map.get(simplifiedCity) ?? { total: 0, count: 0 };
      current.total += city.descansos ?? 0;
      current.count += 1;
      map.set(simplifiedCity, current);
      return map;
    }, new Map<string, { total: number; count: number }>())
  ).reduce((map, row) => {
    const [city, values] = row;
    map.set(city, values.count > 0 ? values.total / values.count : 0);
    return map;
  }, new Map<string, number>());

  const totalEdgeBySimplified = buildTotalEdgeBySimplified(combinedResults);

  const startDate = parseISODate(periodConfig.startDate);
  const endDate = parseISODate(periodConfig.endDate);
  const todayCutoff = parseISODate(periodConfig.todayCutoff);
  const effectiveToday = startDate && endDate && todayCutoff
    ? (todayCutoff > endDate ? endDate : todayCutoff)
    : null;

  const generalRows: GeneralDisplayRow[] = groupedBaseRows.map(baseRow => {
    const descansos = averageDescansosByCity.get(baseRow.ciudad) ?? 0;
    const diasBase = startDate && endDate ? diffDaysInclusive(startDate, endDate) : 0;
    const domingos = startDate && endDate ? countWeekdaysInRange(startDate, endDate, 0) : 0;
    const sabados = startDate && endDate ? countWeekdaysInRange(startDate, endDate, 6) * 0.5 : 0;
    const diasEnMesRaw = diasBase - domingos - sabados - descansos;
    const hasConfigError = !startDate || !endDate || diasEnMesRaw <= 0;
    const diasEnMes = hasConfigError ? null : diasEnMesRaw;

    const objetivoPorDia = diasEnMes ? safeDivide(baseRow.mo, diasEnMes) : 0;
    const avanceTotal = totalEdgeBySimplified.get(baseRow.ciudad) ?? 0;

    const diasBasePasados = startDate && effectiveToday ? diffDaysInclusive(startDate, effectiveToday) : 0;
    const domingosPasados = startDate && effectiveToday ? countWeekdaysInRange(startDate, effectiveToday, 0) : 0;
    const sabadosPasados = startDate && effectiveToday ? countWeekdaysInRange(startDate, effectiveToday, 6) * 0.5 : 0;
    const diasEfectivosTranscurridos = Math.max(0, diasBasePasados - domingosPasados - sabadosPasados - descansos);

    const avanceEsperadoHoy1 = Math.min(baseRow.mo, Math.max(0, diasEfectivosTranscurridos * objetivoPorDia));
    const avanceGeneral = baseRow.mo > 0 ? safeDivide(avanceTotal, baseRow.mo) : 0;
    const avanceEsperadoHoy2 = baseRow.mo > 0 ? safeDivide(avanceEsperadoHoy1, baseRow.mo) : 0;
    const deficitHoy = Math.max(0, avanceEsperadoHoy1 - avanceTotal);
    const deficitGeneral = Math.max(0, baseRow.mo - avanceTotal);
    const diff = avanceGeneral - avanceEsperadoHoy2;
    const estado: GeneralDisplayRow['estado'] = diff >= 0 ? 'green' : diff >= -0.05 ? 'yellow' : 'red';

    return {
      ciudad: baseRow.ciudad,
      mo: baseRow.mo,
      diasEnMes,
      objetivoPorDia,
      avanceTotal,
      avanceEsperadoHoy1,
      avanceGeneral,
      avanceEsperadoHoy2,
      deficitHoy,
      deficitGeneral,
      muestra: baseRow.mo,
      hasConfigError,
      estado,
    };
  });

  const totals = generalRows.reduce(
    (acc, row) => {
      acc.mo += row.mo;
      acc.avanceTotal += row.avanceTotal;
      acc.avanceEsperadoHoy1 += row.avanceEsperadoHoy1;
      acc.deficitHoy += row.deficitHoy;
      acc.deficitGeneral += row.deficitGeneral;
      return acc;
    },
    { mo: 0, avanceTotal: 0, avanceEsperadoHoy1: 0, deficitHoy: 0, deficitGeneral: 0 }
  );

  const totalAdvanceGeneral = totals.mo > 0 ? safeDivide(totals.avanceTotal, totals.mo) : 0;
  const totalExpected2 = totals.mo > 0 ? safeDivide(totals.avanceEsperadoHoy1, totals.mo) : 0;

  const handleExportExcel = () => {
    if (!generalRows.length) return;
    const exportData = generalRows.map(row => ({
      'Ciudades': row.ciudad,
      'MO': row.mo,
      'Dias En el Mes': row.diasEnMes ?? 'Error de configuracion',
      'Objetivo por dia': Math.round(row.objetivoPorDia),
      'Avance total (APROBADOS)': Math.round(row.avanceTotal),
      'AVANCE ESPERADO a hoy 1': Math.round(row.avanceEsperadoHoy1),
      'AVANCE GENERAL': formatPctInt(row.avanceGeneral),
      'AVANCE ESPERADO a hoy 2': formatPctInt(row.avanceEsperadoHoy2),
      'Deficit a Hoy': Math.round(row.deficitHoy),
      'Deficit general (mes)': Math.round(row.deficitGeneral),
      'Muestra': row.muestra,
    }));
    exportToExcel(exportData, 'tabla_general_edge');
  };

  if (!cityConfigs.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <AlertTriangle className="h-10 w-10 text-amber-500" />
          <div className="text-center">
            <p className="font-semibold text-lg">Configuracion incompleta</p>
            <p className="text-muted-foreground text-sm">Importa primero el Excel en Config -&gt; Ciudades para construir la tabla General.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-blue-50/50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/30">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Target className="h-4 w-4 text-blue-600 mb-1" />
            <p className="text-xs text-blue-600/80 font-medium font-mono uppercase tracking-wider">Meta Total (MO)</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-300 mt-1">{totals.mo.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50/50 dark:bg-green-950/10 border-green-100 dark:border-green-900/30">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <CheckCircleSummary className="h-4 w-4 text-green-600 mb-1" />
            <p className="text-xs text-green-600/80 font-medium font-mono uppercase tracking-wider">Avance Total</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-300 mt-1">{formatNum(totals.avanceTotal, 0)}</p>
          </CardContent>
        </Card>

        <Card className="bg-indigo-50/50 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-900/30">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <TrendingUp className="h-4 w-4 text-indigo-600 mb-1" />
            <p className="text-xs text-indigo-600/80 font-medium font-mono uppercase tracking-wider">Avance General</p>
            <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-300 mt-1">{formatPctInt(totalAdvanceGeneral)}</p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/30">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <AlertTriangle className="h-4 w-4 text-amber-600 mb-1" />
            <p className="text-xs text-amber-600/80 font-medium font-mono uppercase tracking-wider">Deficit a Hoy</p>
            <p className="text-2xl font-bold text-amber-900 dark:text-amber-300 mt-1">{formatNum(totals.deficitHoy, 0)}</p>
          </CardContent>
        </Card>

        <Card className="bg-rose-50/50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/30">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Calculator className="h-4 w-4 text-rose-600 mb-1" />
            <p className="text-xs text-rose-600/80 font-medium font-mono uppercase tracking-wider">Deficit General</p>
            <p className="text-2xl font-bold text-rose-900 dark:text-rose-300 mt-1">{formatNum(totals.deficitGeneral, 0)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <TableIcon className="h-5 w-5 text-blue-600" />
            Tabla General de Desempeno
            <Badge variant="outline" className="ml-2">EDGE general</Badge>
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleExportExcel} className="gap-2">
              <Download className="h-4 w-4" /> Exportar Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Ciudades</TableHead>
                  <TableHead className="text-right">MO</TableHead>
                  <TableHead className="text-right">Dias En el Mes</TableHead>
                  <TableHead className="text-right">Objetivo por dia</TableHead>
                  <TableHead className="text-right">Avance total (APROBADOS)</TableHead>
                  <TableHead className="text-right">AVANCE ESPERADO a hoy 1</TableHead>
                  <TableHead className="text-right">AVANCE GENERAL</TableHead>
                  <TableHead className="text-right">AVANCE ESPERADO a hoy 2</TableHead>
                  <TableHead className="text-right">Deficit a Hoy</TableHead>
                  <TableHead className="text-right">Deficit general (mes)</TableHead>
                  <TableHead className="text-right">Muestra</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {generalRows.map(row => (
                  <TableRow key={row.ciudad}>
                    <TableCell className="font-semibold">{row.ciudad}</TableCell>
                    <TableCell className="text-right">{formatNum(row.mo, 0)}</TableCell>
                    <TableCell className="text-right">
                      {row.hasConfigError ? (
                        <span className="text-destructive text-xs font-medium">Error de configuracion</span>
                      ) : (
                        formatNum(row.diasEnMes ?? 0)
                      )}
                    </TableCell>
                    <TableCell className="text-right">{formatNum(row.objetivoPorDia, 0)}</TableCell>
                    <TableCell className="text-right">{formatNum(row.avanceTotal, 0)}</TableCell>
                    <TableCell className="text-right">{formatNum(row.avanceEsperadoHoy1, 0)}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={row.estado === 'green' ? 'default' : row.estado === 'yellow' ? 'secondary' : 'destructive'}
                        className={row.estado === 'green' ? 'bg-green-600' : ''}
                      >
                        {formatPctInt(row.avanceGeneral)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatPctInt(row.avanceEsperadoHoy2)}</TableCell>
                    <TableCell className="text-right">{formatNum(row.deficitHoy, 0)}</TableCell>
                    <TableCell className="text-right">{formatNum(row.deficitGeneral, 0)}</TableCell>
                    <TableCell className="text-right">{formatNum(row.muestra, 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell>TOTALES</TableCell>
                  <TableCell className="text-right">{formatNum(totals.mo, 0)}</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right">{formatNum(totals.avanceTotal, 0)}</TableCell>
                  <TableCell className="text-right">{formatNum(totals.avanceEsperadoHoy1, 0)}</TableCell>
                  <TableCell className="text-right">{formatPctInt(totalAdvanceGeneral)}</TableCell>
                  <TableCell className="text-right">{formatPctInt(totalExpected2)}</TableCell>
                  <TableCell className="text-right">{formatNum(totals.deficitHoy, 0)}</TableCell>
                  <TableCell className="text-right">{formatNum(totals.deficitGeneral, 0)}</TableCell>
                  <TableCell className="text-right">{formatNum(totals.mo, 0)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CheckCircleSummary({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
