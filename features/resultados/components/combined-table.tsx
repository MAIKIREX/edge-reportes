'use client';

import { Download, FileText, Clock, Calculator } from 'lucide-react';
import { useResultsStore } from '@/store/use-results-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatPct } from '@/lib/utils';
import { exportToExcel } from '@/lib/export';

const EXTRA_COLUMNS = [
  'RECHAZADOS TOTALES',
  '% RECHAZADOS',
  '% APROBADOS',
  '% AJUSTES',
  'CIUDAD SIMPLIFICADA',
  'TIEMPO PROMEDIO',
] as const;

export function CombinedTable() {
  const { combinedResults, processCombinedTable, rawFileRows, fileMetadata } = useResultsStore();
  const sourceHeaders = fileMetadata?.sourceHeaders ?? [];

  const handleExportExcel = () => {
    if (!combinedResults.length) return;

    const exportData = combinedResults.map(row => ({
      ...row.originalData,
      'RECHAZADOS TOTALES': row.rechazadosTotales,
      '% RECHAZADOS': formatPct(row.porcentajeRechazados),
      '% APROBADOS': formatPct(row.porcentajeAprobados),
      '% AJUSTES': formatPct(row.porcentajeAjustes),
      'CIUDAD SIMPLIFICADA': row.ciudadSimplificada,
      'TIEMPO PROMEDIO': row.tiempoPromedio.toFixed(2),
    }));

    exportToExcel(exportData, 'tabla_datos_combinados');
  };

  if (!rawFileRows.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <Clock className="h-10 w-10 text-muted-foreground" />
          <div className="text-center">
            <p className="font-semibold text-lg">Esperando datos</p>
            <p className="text-muted-foreground text-sm">Carga un archivo Excel para visualizar la tabla de datos combinados.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
              <FileText className="h-5 w-5" />
              Tabla de Datos Combinados
              <Badge className="bg-blue-600">Excel + calculos</Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Se respetan las columnas originales del Excel y se agregan las nuevas columnas calculadas al final.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={processCombinedTable} className="gap-2">
              <Calculator className="h-4 w-4" /> Recalcular
            </Button>
            <Button size="sm" onClick={handleExportExcel} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Download className="h-4 w-4" /> Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full border-t">
            <div className="max-h-[620px]">
              <Table className="min-w-[1400px] text-xs">
                <TableHeader>
                  <TableRow className="bg-muted/50 sticky top-0 z-20">
                    {sourceHeaders.map(header => (
                      <TableHead key={header} className="whitespace-nowrap font-bold">
                        {header}
                      </TableHead>
                    ))}
                    {EXTRA_COLUMNS.map(header => (
                      <TableHead key={header} className="whitespace-nowrap font-bold text-blue-700 bg-blue-50/40">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {combinedResults.map((row, index) => (
                    <TableRow key={index}>
                      {sourceHeaders.map(header => (
                        <TableCell key={`${index}-${header}`} className="whitespace-nowrap align-top">
                          {String(row.originalData[header] ?? '-')}
                        </TableCell>
                      ))}
                      <TableCell className="whitespace-nowrap bg-blue-50/10">{row.rechazadosTotales}</TableCell>
                      <TableCell className="whitespace-nowrap bg-blue-50/10">{formatPct(row.porcentajeRechazados)}</TableCell>
                      <TableCell className="whitespace-nowrap bg-blue-50/10">{formatPct(row.porcentajeAprobados)}</TableCell>
                      <TableCell className="whitespace-nowrap bg-blue-50/10">{formatPct(row.porcentajeAjustes)}</TableCell>
                      <TableCell className="whitespace-nowrap bg-blue-50/10">{row.ciudadSimplificada}</TableCell>
                      <TableCell className="whitespace-nowrap bg-blue-50/10">{row.tiempoPromedio.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}