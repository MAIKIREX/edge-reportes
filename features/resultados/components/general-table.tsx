'use client';

import { Download, Table as TableIcon, TrendingUp, AlertTriangle, Target, Calculator } from 'lucide-react';
import { useResultsStore } from '@/store/use-results-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatPct, formatNum } from '@/lib/utils';
import { exportToCSV, exportToExcel } from '@/lib/export';

export function GeneralTable() {
  const { generalResults, globalTotals, processGeneralTable, rawFileRows } = useResultsStore();

  const handleExportExcel = () => {
    if (!generalResults.length) return;
    const exportData = generalResults.map(r => ({
      'CIUDAD': r.ciudad,
      'MO': r.mo,
      'DÍAS EN EL MES': r.diasEnMes,
      'OBJETIVO POR DÍA': r.objetivoPorDia,
      'AVANCE TOTAL (APROBADOS)': r.avanceTotal,
      'AVANCE ESPERADO A HOY': r.avanceEsperadoHoy,
      'AVANCE GENERAL %': formatPct(r.avanceGeneral),
      'AVANCE ESPERADO RELATIVO %': formatPct(r.avanceEsperadoRelativo),
      'DÉFICIT A HOY': r.deficitHoy,
      'DÉFICIT GENERAL': r.deficitGeneral,
      'MUESTRA': r.muestra
    }));
    exportToExcel(exportData, 'tabla_general_apartado_4');
  };

  if (!rawFileRows.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <AlertTriangle className="h-10 w-10 text-amber-500" />
          <div className="text-center">
            <p className="font-semibold text-lg">Archivo no cargado</p>
            <p className="text-muted-foreground text-sm">Carga un archivo Excel en la pestaña 'Carga' para ver los resultados.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {globalTotals && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-blue-50/50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/30">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <Target className="h-4 w-4 text-blue-600 mb-1" />
              <p className="text-xs text-blue-600/80 font-medium font-mono uppercase tracking-wider">Meta Total (MO)</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-300 mt-1">{globalTotals.mo.toLocaleString()}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50/50 dark:bg-green-950/10 border-green-100 dark:border-green-900/30">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <CheckCircleSummary className="h-4 w-4 text-green-600 mb-1" />
              <p className="text-xs text-green-600/80 font-medium font-mono uppercase tracking-wider">Avance Total</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-300 mt-1">{globalTotals.avanceTotal.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="bg-indigo-50/50 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-900/30">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <TrendingUp className="h-4 w-4 text-indigo-600 mb-1" />
              <p className="text-xs text-indigo-600/80 font-medium font-mono uppercase tracking-wider">% Avance Global</p>
              <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-300 mt-1">{formatPct(globalTotals.avanceGeneral)}</p>
            </CardContent>
          </Card>

          <Card className="bg-amber-50/50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/30">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <AlertTriangle className="h-4 w-4 text-amber-600 mb-1" />
              <p className="text-xs text-amber-600/80 font-medium font-mono uppercase tracking-wider">Déficit Hoy</p>
              <p className="text-2xl font-bold text-amber-900 dark:text-amber-300 mt-1">{formatNum(globalTotals.deficitHoy, 0)}</p>
            </CardContent>
          </Card>

          <Card className="bg-rose-50/50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/30">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <Calculator className="h-4 w-4 text-rose-600 mb-1" />
              <p className="text-xs text-rose-600/80 font-medium font-mono uppercase tracking-wider">Déficit General</p>
              <p className="text-2xl font-bold text-rose-900 dark:text-rose-300 mt-1">{globalTotals.deficitGeneral.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Table Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <TableIcon className="h-5 w-5 text-blue-600" />
            Tabla General de Desempeño
            <Badge variant="outline" className="ml-2">Apartado 4</Badge>
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={processGeneralTable} className="gap-2">
              <Calculator className="h-4 w-4" /> Recalcular
            </Button>
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
                  <TableHead className="font-bold underline decoration-blue-500/50">CIUDADES</TableHead>
                  <TableHead className="text-right font-bold underline decoration-blue-500/50">MO</TableHead>
                  <TableHead className="text-right font-bold underline decoration-blue-500/50">DÍAS MES</TableHead>
                  <TableHead className="text-right font-bold underline decoration-blue-500/50">OBJ X DÍA</TableHead>
                  <TableHead className="text-right font-bold font-mono bg-blue-50/50 dark:bg-blue-950/20 underline decoration-blue-500">AVANC. REAL</TableHead>
                  <TableHead className="text-right font-bold underline decoration-indigo-500/50">ESP. HOY</TableHead>
                  <TableHead className="text-right font-bold font-mono bg-green-50/50 dark:bg-green-950/20 underline decoration-green-500">AVAN. GRAL %</TableHead>
                  <TableHead className="text-right font-bold underline decoration-indigo-500/50">ESP. REL %</TableHead>
                  <TableHead className="text-right font-bold bg-amber-50/50 dark:bg-amber-950/20 underline decoration-amber-500">DÉF. HOY</TableHead>
                  <TableHead className="text-right font-bold underline decoration-rose-500/50">DÉF. GRAL</TableHead>
                  <TableHead className="text-right font-bold underline decoration-zinc-500/50">MUESTRA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {generalResults.map((row) => (
                  <TableRow key={row.ciudad} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-semibold">{row.ciudad}</TableCell>
                    <TableCell className="text-right">{row.mo.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{row.diasEnMes}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{formatNum(row.objetivoPorDia)}</TableCell>
                    <TableCell className="text-right font-semibold bg-blue-50/30 dark:bg-blue-950/10">{row.avanceTotal.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatNum(row.avanceEsperadoHoy)}</TableCell>
                    <TableCell className="text-right">
                      <Badge 
                        variant={row.estado === 'green' ? 'default' : row.estado === 'yellow' ? 'secondary' : 'destructive'}
                        className={row.estado === 'green' ? 'bg-green-600' : ''}
                      >
                        {formatPct(row.avanceGeneral)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatPct(row.avanceEsperadoRelativo)}</TableCell>
                    <TableCell className="text-right font-medium text-amber-700 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-950/10">
                      {row.deficitHoy > 0 ? formatNum(row.deficitHoy, 0) : '—'}
                    </TableCell>
                    <TableCell className="text-right text-rose-700 dark:text-rose-400">
                      {row.deficitGeneral > 0 ? row.deficitGeneral.toLocaleString() : '✓'}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{row.muestra}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              {globalTotals && (
                <TableFooter className="bg-muted/50 font-bold border-t-2">
                  <TableRow>
                    <TableCell>TOTALES</TableCell>
                    <TableCell className="text-right">{globalTotals.mo.toLocaleString()}</TableCell>
                    <TableCell className="text-right">—</TableCell>
                    <TableCell className="text-right">—</TableCell>
                    <TableCell className="text-right bg-blue-100/50 dark:bg-blue-900/20">{globalTotals.avanceTotal.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{formatNum(globalTotals.avanceEsperadoHoy)}</TableCell>
                    <TableCell className="text-right">{formatPct(globalTotals.avanceGeneral)}</TableCell>
                    <TableCell className="text-right">{formatPct(globalTotals.avanceEsperadoRelativo)}</TableCell>
                    <TableCell className="text-right bg-amber-100/50 dark:bg-amber-900/20">{formatNum(globalTotals.deficitHoy, 0)}</TableCell>
                    <TableCell className="text-right text-rose-700 dark:text-rose-300">{globalTotals.deficitGeneral.toLocaleString()}</TableCell>
                    <TableCell className="text-right">—</TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex items-center gap-2 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
        <AlertTriangle className="h-4 w-4 text-indigo-500" />
        <p className="text-[10px] text-indigo-700 dark:text-indigo-400 leading-tight">
          <strong>Lógica de semáforo:</strong> Verde si (Avance Real % - Avance Esperado %) {'>'}= 0. Amarillo si la diferencia es hasta -5%. Rojo en diferencias mayores.
        </p>
      </div>
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
      <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
    </svg>
  );
}
