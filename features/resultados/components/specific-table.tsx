'use client';

import { Download, Table as TableIcon, Users, Calendar, AlertCircle, TrendingUp, Compass, Clock, CheckCircle2 } from 'lucide-react';
import { useResultsStore } from '@/store/use-results-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatPct, formatNum } from '@/lib/utils';
import { exportToExcel } from '@/lib/export';
import { cn } from '@/lib/utils';

export function SpecificTable() {
  const { specificResults, processSpecificTable, rawFileRows } = useResultsStore();

  const handleExportExcel = () => {
    if (!specificResults.length) return;
    const exportData = specificResults.map(r => ({
      'ÁREA': r.area,
      'CITY NAME': r.cityName,
      'AVANCE + QC': r.avanceQc,
      'MO': r.mo,
      'DÍAS FALTANTES': r.diasFaltantes,
      'PROM GESTOR': r.promGestor,
      'GESTORES AYER': r.gestoresAyer,
      'PROYECCIÓN': r.proyeccion,
      'ERROR REAL %': formatPct(r.errorRealPct / 100),
      'CON ERROR REAL': r.conErrorReal,
      'PROY GESTORES': r.proyGestores,
      'GESTORES FALTANTES': r.gestoresFaltantes,
      'PROYECCIÓN %': formatPct(r.proyeccionPct / 100),
      'OBJ DIARIO': r.objDiario,
      'OBJ DIARIO X GESTOR': r.objDiarioPorGestor,
      'OBJ DIARIO + ERROR': r.objDiarioMasError,
      'OBJ DIARIO X GESTOR + ERROR': r.objDiarioMasErrorPorGestor,
      'DÍAS PARA OBJETIVO': r.diasParaObjetivo,
      'FECHA APROX CIERRE': r.fechaAproxCierre,
      '%': formatPct(r.porcentajeAvance),
      'FALTANTES TOTAL': r.faltantesTotal
    }));
    exportToExcel(exportData, 'tabla_especifica_a_u');
  };

  const totals = {
    gestoresFaltantes: specificResults.reduce((s, r) => s + r.gestoresFaltantes, 0),
    moTotal: specificResults.reduce((s, r) => s + r.mo, 0),
    avanceTotal: specificResults.reduce((s, r) => s + r.avanceQc, 0),
    ciudadesNoCierran: specificResults.filter(r => r.fechaAproxCierre === 'NO CIERRA').length,
    ciudadesCerradas: specificResults.filter(r => r.fechaAproxCierre === 'Cerrado').length
  };

  if (!rawFileRows.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <Clock className="h-10 w-10 text-muted-foreground" />
          <div className="text-center">
            <p className="font-semibold text-lg">Esperando datos</p>
            <p className="text-muted-foreground text-sm">Carga un archivo Excel para activar los cálculos operativos.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-950/30">
              <Users className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase">G. Faltantes Totales</p>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{totals.gestoresFaltantes}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-950/30">
              <AlertCircle className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase">C. No Cierran</p>
              <p className="text-2xl font-bold text-rose-700 dark:text-rose-400">{totals.ciudadesNoCierran}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950/30">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase">% Avance Total</p>
              <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">
                {formatPct(totals.moTotal > 0 ? totals.avanceTotal / totals.moTotal : 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950/30">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase">C. Cerradas</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">{totals.ciudadesCerradas}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2 text-indigo-700">
              <Compass className="h-5 w-5" />
              Tablero Operativo de Proyección
              <Badge className="bg-indigo-600">A:U</Badge>
            </CardTitle>
            <CardDescription className="text-xs">Flujo: Datos Base → Proyección Ideal → Corrección por Error → Necesidad Operativa → Cierre</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={processSpecificTable} className="gap-2">
              Recalcular
            </Button>
            <Button size="sm" onClick={handleExportExcel} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Download className="h-4 w-4" /> Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <TooltipProvider delayDuration={0}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 divide-x divide-zinc-200 dark:divide-zinc-800">
                    <TableHead className="sticky left-0 z-10 bg-muted/90 backdrop-blur font-bold min-w-[100px]">Área</TableHead>
                    <TableHead className="sticky left-[100px] z-10 bg-muted/90 backdrop-blur font-bold min-w-[140px]">City Name</TableHead>
                    
                    <TableHeadProps label="Avance + QC" tip="Approved POS real acumulado" />
                    <TableHeadProps label="MO" tip="Meta operativa del periodo" />
                    <TableHeadProps label="D. Falt." tip="Días operativos restantes" />
                    <TableHeadProps label="P. Gest." tip="Productividad prom. de 1 gestor" />
                    <TableHeadProps label="G. Ayer" tip="Gestores activos recientes" />
                    
                    <TableHeadProps label="Proy." tip="(Avance + D.Falt * PromG * G.Ayer) - MO" />
                    <TableHeadProps label="Err %" tip="Error histórico / Fricción" />
                    <TableHeadProps label="C/Err REAL" tip="Proyección corregida por error" />
                    <TableHeadProps label="Proy G." tip="Gestores técnicos sobrantes/faltantes" />
                    
                    <TableHead className="text-right font-bold text-orange-600 dark:text-orange-400 bg-orange-50/20">G. FALT.</TableHead>
                    
                    <TableHeadProps label="Proy %" tip="% Cumplimiento final proyectado" />
                    <TableHeadProps label="OBJ Diar" tip="Req diario para cerrar meta" />
                    <TableHeadProps label="OBJ D x G" tip="Carga diaria ideal por gestor" />
                    <TableHeadProps label="OBJ D + E" tip="Objetivo diario penalizado por error" />
                    <TableHeadProps label="OBJ G+E" tip="Carga diaria x gestor incl. error" />
                    <TableHeadProps label="D. p/ OBJ" tip="Días req con capacidad actual" />
                    
                    <TableHead className="text-right font-bold text-blue-600 dark:text-blue-400 bg-blue-50/20">FC. CIERRE</TableHead>
                    
                    <TableHeadProps label="%" tip="Avance actual % (0.xx)" />
                    <TableHeadProps label="FALTANTE" tip="MO - Avance Real" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {specificResults.map((row) => (
                    <TableRow key={row.cityName} className="divide-x divide-zinc-100 dark:divide-zinc-900 border-b">
                      <TableCell className="sticky left-0 z-10 bg-white dark:bg-zinc-950 font-medium text-xs text-muted-foreground">{row.area}</TableCell>
                      <TableCell className="sticky left-[100px] z-10 bg-white dark:bg-zinc-950 font-bold text-sm bg-indigo-50/10">{row.cityName}</TableCell>
                      
                      <TableCell className="text-right font-mono">{row.avanceQc.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono">{row.mo.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{row.diasFaltantes}</TableCell>
                      <TableCell className="text-right">{row.promGestor}</TableCell>
                      <TableCell className="text-right">{row.gestoresAyer}</TableCell>
                      
                      <TableCell className={cn("text-right font-semibold", row.proyeccion >= 0 ? "text-green-600" : "text-rose-600")}>
                        {formatNum(row.proyeccion, 0)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{row.errorRealPct}%</TableCell>
                      <TableCell className={cn("text-right font-medium", row.conErrorReal >= 0 ? "text-green-600" : "text-rose-600")}>
                        {formatNum(row.conErrorReal, 0)}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{formatNum(row.proyGestores, 1)}</TableCell>
                      
                      <TableCell className="text-right font-bold bg-orange-50/10">
                        {row.gestoresFaltantes > 0 ? (
                          <Badge variant="destructive" className="h-5 px-1.5 font-mono">{row.gestoresFaltantes}</Badge>
                        ) : '—'}
                      </TableCell>
                      
                      <TableCell className="text-right font-mono text-xs">{formatNum(row.proyeccionPct, 1)}%</TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatNum(row.objDiario, 1)}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">{formatNum(row.objDiarioPorGestor, 1)}</TableCell>
                      <TableCell className="text-right font-mono text-xs italic">{formatNum(row.objDiarioMasError, 1)}</TableCell>
                      <TableCell className="text-right font-mono text-xs italic text-muted-foreground">{formatNum(row.objDiarioMasErrorPorGestor, 1)}</TableCell>
                      
                      <TableCell className="text-right text-xs">
                        {row.diasParaObjetivo === 'Acabado' ? (
                          <span className="text-green-600 font-bold uppercase text-[10px]">Cerrado</span>
                        ) : row.diasParaObjetivo === 'Sin Avance' ? (
                          <span className="text-zinc-400 italic">Sin Avance</span>
                        ) : row.diasParaObjetivo}
                      </TableCell>
                      
                      <TableCell className="text-right font-bold bg-blue-50/10">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "h-5 px-1.5 text-[10px]",
                            row.fechaAproxCierre === 'Cerrado' ? "border-green-600 text-green-600 bg-green-50" :
                            row.fechaAproxCierre === 'NO CIERRA' ? "border-rose-600 text-rose-600 bg-rose-50" :
                            row.fechaAproxCierre === 'Sin Avance' ? "border-zinc-300 text-zinc-400" :
                            "border-blue-500 text-blue-600 font-mono"
                          )}
                        >
                          {row.fechaAproxCierre}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="text-right font-mono">{row.porcentajeAvance.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold text-zinc-700 dark:text-zinc-300">
                        {row.faltantesTotal > 0 ? row.faltantesTotal.toLocaleString() : '✓'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  );
}

function TableHeadProps({ label, tip }: { label: string; tip: string }) {
  return (
    <TableHead className="text-right">
      <Tooltip>
        <TooltipTrigger className="cursor-help uppercase text-[10px] font-bold tracking-tight">{label}</TooltipTrigger>
        <TooltipContent className="text-[10px] max-w-48">{tip}</TooltipContent>
      </Tooltip>
    </TableHead>
  );
}
