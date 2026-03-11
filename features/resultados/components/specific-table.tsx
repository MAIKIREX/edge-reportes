'use client';

import { Download, Users, AlertCircle, TrendingUp, Compass, Clock, CheckCircle2 } from 'lucide-react';
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
  const { specificResults, processSpecificTable, cityConfigs } = useResultsStore();

  const handleExportExcel = () => {
    if (!specificResults.length) return;
    const exportData = specificResults.map(r => ({
      'Area': r.area,
      'City Name': r.cityName,
      'AVANCE + QC': r.avanceQc,
      'MO': r.mo,
      'Dias Faltantes': r.diasFaltantes,
      'Prom Gestor': r.promGestor,
      'Gestores Ayer': r.gestoresAyer,
      'Proyeccion': r.proyeccion,
      'Error Real (%)': formatPct(r.errorRealPct / 100),
      'Con Error REAL': r.conErrorReal,
      'Proy Gestores': r.proyGestores,
      'Gestores FALTANTES': r.gestoresFaltantes,
      'Proyeccion %': formatPct(r.proyeccionPct / 100),
      'OBJ diario': r.objDiario,
      'OBJ diario x Gestor': r.objDiarioPorGestor,
      'OBJ diario + Error': r.objDiarioMasError,
      'OBJ diario x Gestor (Error)': r.objDiarioMasErrorPorGestor,
      'Dias para el Objetivo': r.diasParaObjetivo,
      'Fecha (Aprox) de cierre': r.fechaAproxCierre,
      '%': r.porcentajeAvance.toFixed(2),
      'FALTANTES TOTAL': r.faltantesTotal,
    }));
    exportToExcel(exportData, 'tabla_edge_especifico');
  };

  const totals = {
    gestoresFaltantes: specificResults.reduce((s, r) => s + r.gestoresFaltantes, 0),
    moTotal: specificResults.reduce((s, r) => s + r.mo, 0),
    avanceTotal: specificResults.reduce((s, r) => s + r.avanceQc, 0),
    ciudadesNoCierran: specificResults.filter(r => r.fechaAproxCierre === 'NO CIERRA').length,
    ciudadesCerradas: specificResults.filter(r => r.fechaAproxCierre === 'Cerrado').length,
  };

  if (!cityConfigs.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <Clock className="h-10 w-10 text-muted-foreground" />
          <div className="text-center">
            <p className="font-semibold text-lg">Sin configuracion de ciudades</p>
            <p className="text-muted-foreground text-sm">Importa primero ciudades en Configuracion -&gt; Ciudades para generar esta tabla.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
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
              Tablero Operativo de Proyeccion
              <Badge className="bg-indigo-600">A:U</Badge>
            </CardTitle>
            <CardDescription className="text-xs">Base: Configuracion por Ciudad + Datos combinados + EDGE general.</CardDescription>
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
                    <TableHead className="sticky left-0 z-10 bg-muted/90 backdrop-blur font-bold min-w-[110px]">Area</TableHead>
                    <TableHead className="sticky left-[110px] z-10 bg-muted/90 backdrop-blur font-bold min-w-[150px]">City Name</TableHead>
                    <TableHeadProps label="AVANCE + QC" tip="Total Edge por City Name" />
                    <TableHeadProps label="MO" tip="Meta operativa" />
                    <TableHeadProps label="Dias Faltantes" tip="Dias laborales restantes" />
                    <TableHeadProps label="Prom Gestor" tip="n/m por ciudad" />
                    <TableHeadProps label="Gestores Ayer" tip="Distinct Name Auditor en fecha ayer" />
                    <TableHeadProps label="Proyeccion" tip="((AVANCE + QC) + (Dias Faltantes * Prom Gestor * Gestores Ayer)) - MO" />
                    <TableHeadProps label="Error Real (%)" tip="Promedio de error por city" />
                    <TableHeadProps label="Con Error REAL" tip="Ajuste de proyeccion segun Error Real" />
                    <TableHeadProps label="Proy Gestores" tip="(Con Error REAL / Prom Gestor) / (Dias Faltantes - 2)" />
                    <TableHead className="text-right font-bold text-orange-600 dark:text-orange-400 bg-orange-50/20">Gestores FALTANTES</TableHead>
                    <TableHeadProps label="Proyeccion" tip="((MO + Con Error REAL) * 100) / MO" />
                    <TableHeadProps label="OBJ diario" tip="(MO - AVANCE + QC) / Dias Faltantes" />
                    <TableHeadProps label="OBJ diario x Gestor" tip="OBJ diario / Gestores Ayer" />
                    <TableHeadProps label="OBJ diario + Error" tip="OBJ diario + (OBJ diario / Error Real)" />
                    <TableHeadProps label="OBJ diario x Gestor" tip="(OBJ diario + Error) / Gestores Ayer" />
                    <TableHeadProps label="Dias para el Objetivo" tip="Acabado / Sin Avance / ceil(...)" />
                    <TableHead className="text-right font-bold text-blue-600 dark:text-blue-400 bg-blue-50/20">Fecha (Aprox) de cierre</TableHead>
                    <TableHeadProps label="%" tip="(AVANCE + QC * 100 / MO)" />
                    <TableHeadProps label="FALTANTES TOTAL" tip="MO - (AVANCE + QC)" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {specificResults.map(row => (
                    <TableRow key={row.cityName} className="divide-x divide-zinc-100 dark:divide-zinc-900 border-b">
                      <TableCell className="sticky left-0 z-10 bg-white dark:bg-zinc-950 font-medium text-xs text-muted-foreground">{row.area}</TableCell>
                      <TableCell className="sticky left-[110px] z-10 bg-white dark:bg-zinc-950 font-bold text-sm bg-indigo-50/10">{row.cityName}</TableCell>
                      <TableCell className="text-right font-mono">{formatNum(row.avanceQc, 0)}</TableCell>
                      <TableCell className="text-right font-mono">{formatNum(row.mo, 0)}</TableCell>
                      <TableCell className="text-right">{formatNum(row.diasFaltantes, 1)}</TableCell>
                      <TableCell className="text-right">{formatNum(row.promGestor, 2)}</TableCell>
                      <TableCell className="text-right">{row.gestoresAyer}</TableCell>
                      <TableCell className={cn('text-right font-semibold', row.proyeccion >= 0 ? 'text-green-600' : 'text-rose-600')}>
                        {formatNum(row.proyeccion, 0)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatNum(row.errorRealPct, 2)}%</TableCell>
                      <TableCell className={cn('text-right font-medium', row.conErrorReal >= 0 ? 'text-green-600' : 'text-rose-600')}>
                        {formatNum(row.conErrorReal, 0)}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{formatNum(row.proyGestores, 2)}</TableCell>
                      <TableCell className="text-right font-bold bg-orange-50/10">
                        {row.gestoresFaltantes > 0 ? (
                          <Badge variant="destructive" className="h-5 px-1.5 font-mono">{row.gestoresFaltantes}</Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatNum(row.proyeccionPct, 2)}%</TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatNum(row.objDiario, 2)}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">{formatNum(row.objDiarioPorGestor, 2)}</TableCell>
                      <TableCell className="text-right font-mono text-xs italic">{formatNum(row.objDiarioMasError, 2)}</TableCell>
                      <TableCell className="text-right font-mono text-xs italic text-muted-foreground">{formatNum(row.objDiarioMasErrorPorGestor, 2)}</TableCell>
                      <TableCell className="text-right text-xs">
                        {row.diasParaObjetivo === 'Acabado' ? (
                          <span className="text-green-600 font-bold uppercase text-[10px]">Cerrado</span>
                        ) : row.diasParaObjetivo === 'Sin Avance' ? (
                          <span className="text-zinc-400 italic">Sin Avance</span>
                        ) : (
                          row.diasParaObjetivo
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold bg-blue-50/10">
                        <Badge
                          variant="outline"
                          className={cn(
                            'h-5 px-1.5 text-[10px]',
                            row.fechaAproxCierre === 'Cerrado' ? 'border-green-600 text-green-600 bg-green-50' :
                            row.fechaAproxCierre === 'NO CIERRA' ? 'border-rose-600 text-rose-600 bg-rose-50' :
                            row.fechaAproxCierre === 'Sin Avance' ? 'border-zinc-300 text-zinc-400' :
                            'border-blue-500 text-blue-600 font-mono'
                          )}
                        >
                          {row.fechaAproxCierre}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{row.porcentajeAvance.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold text-zinc-700 dark:text-zinc-300">
                        {row.faltantesTotal > 0 ? formatNum(row.faltantesTotal, 0) : 'OK'}
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
        <TooltipContent className="text-[10px] max-w-56">{tip}</TooltipContent>
      </Tooltip>
    </TableHead>
  );
}