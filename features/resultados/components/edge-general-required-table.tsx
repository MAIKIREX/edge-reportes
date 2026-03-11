'use client';

import { MapPin, Table as TableIcon, AlertTriangle } from 'lucide-react';
import { useResultsStore } from '@/store/use-results-store';
import { simplifyCity } from '@/lib/combined-calculations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ErrorSummaryRow {
  cityName: string;
  rejectedPctSum: number;
  averageError: number;
}

interface ProjectionRow {
  cityName: string;
  approvedSum: number;
  enQcSum: number;
  averageError: number;
  projectedApprovedQc: number;
  approvedPlusQcWithError: number;
}

interface EdgeByCityRow {
  cityName: string;
  simplifiedCity: string;
  totalEdge: number;
}

interface EdgeBySimplifiedCityRow {
  simplifiedCity: string;
  totalEdge: number;
}

function toNumber(value: string | number | undefined): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const normalized = String(value).trim().replace(/\./g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString('es-BO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatPercent(value: number): string {
  return `${formatNumber(value, 2)}%`;
}

export function EdgeGeneralRequiredTable() {
  const { cityConfigs, combinedResults } = useResultsStore();

  const groupedRows = Array.from(
    cityConfigs.reduce((map, city) => {
      const simplifiedCity = (city.simplifiedCity?.trim() || city.cityLabel || '').trim();
      if (!simplifiedCity) return map;

      const current = map.get(simplifiedCity) ?? 0;
      map.set(simplifiedCity, current + (city.mo || 0));
      return map;
    }, new Map<string, number>())
  )
    .map(([simplifiedCity, mo]) => ({ simplifiedCity, mo }))
    .sort((a, b) => a.simplifiedCity.localeCompare(b.simplifiedCity));

  const table1Rows: ErrorSummaryRow[] = Array.from(
    combinedResults.reduce((map, row) => {
      const cityName = String(row.originalData['City Name'] ?? '').trim();
      if (!cityName) return map;

      const current = map.get(cityName) ?? { rejectedPctSum: 0, count: 0 };
      current.rejectedPctSum += row.porcentajeRechazados * 100;
      current.count += 1;
      map.set(cityName, current);
      return map;
    }, new Map<string, { rejectedPctSum: number; count: number }>())
  )
    .map(([cityName, values]) => ({
      cityName,
      rejectedPctSum: values.rejectedPctSum,
      averageError: values.count > 0 ? values.rejectedPctSum / values.count : 0,
    }))
    .sort((a, b) => a.cityName.localeCompare(b.cityName));

  const averageErrorByCity = new Map(table1Rows.map(row => [row.cityName, row.averageError]));

  const table2Rows: ProjectionRow[] = Array.from(
    combinedResults.reduce((map, row) => {
      const cityName = String(row.originalData['City Name'] ?? '').trim();
      if (!cityName) return map;

      const current = map.get(cityName) ?? { approvedSum: 0, enQcSum: 0 };
      current.approvedSum += toNumber(row.originalData['Approved POS']);
      current.enQcSum += toNumber(row.originalData['En QC POS']);
      map.set(cityName, current);
      return map;
    }, new Map<string, { approvedSum: number; enQcSum: number }>())
  )
    .map(([cityName, values]) => {
      const averageError = averageErrorByCity.get(cityName) ?? 0;
      const projectedApprovedQc = values.enQcSum * (1 - averageError / 100);
      return {
        cityName,
        approvedSum: values.approvedSum,
        enQcSum: values.enQcSum,
        averageError,
        projectedApprovedQc,
        approvedPlusQcWithError: values.approvedSum + projectedApprovedQc,
      };
    })
    .sort((a, b) => a.cityName.localeCompare(b.cityName));

  const table3Rows: EdgeByCityRow[] = table2Rows.map(row => ({
    cityName: row.cityName,
    simplifiedCity: simplifyCity(row.cityName),
    totalEdge: row.approvedPlusQcWithError,
  }));

  const table4Rows: EdgeBySimplifiedCityRow[] = Array.from(
    table3Rows.reduce((map, row) => {
      const current = map.get(row.simplifiedCity) ?? 0;
      map.set(row.simplifiedCity, current + row.totalEdge);
      return map;
    }, new Map<string, number>())
  )
    .map(([simplifiedCity, totalEdge]) => ({ simplifiedCity, totalEdge }))
    .sort((a, b) => a.simplifiedCity.localeCompare(b.simplifiedCity));

  if (!cityConfigs.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <MapPin className="h-10 w-10 text-muted-foreground" />
          <div className="text-center">
            <p className="font-semibold text-lg">Sin datos de ciudades</p>
            <p className="text-muted-foreground text-sm">
              Importa el Excel en Configuracion -&gt; Ciudades para generar la tabla Datos necesarios EDGE general.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TableIcon className="h-5 w-5 text-blue-600" />
            Datos necesarios EDGE general
          </CardTitle>
          <CardDescription>
            Tabla agregada por CIUDADES SIMPLIFICADO con la suma total de MO proveniente de Configuracion -&gt; Ciudades.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CIUDADES SIMPLIFICADO</TableHead>
                  <TableHead className="text-right">MO</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedRows.map(row => (
                  <TableRow key={row.simplifiedCity}>
                    <TableCell className="font-medium">{row.simplifiedCity}</TableCell>
                    <TableCell className="text-right">{row.mo.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {!combinedResults.length ? (
        <Card className="border-dashed">
          <CardContent className="flex items-start gap-3 py-8">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Falta la tabla Datos combinados</p>
              <p className="text-sm text-muted-foreground">
                Carga el Excel principal en la pestana Carga para habilitar las tablas de analisis solicitadas en Datos_necesarios_EDGE.md.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tabla 1 - Resumen de errores por ciudad</CardTitle>
              <CardDescription>Agrupado por City Name a partir de Datos combinados.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>City Name</TableHead>
                    <TableHead className="text-right">SUM de porcentaje de rechazados</TableHead>
                    <TableHead className="text-right">Promedio de error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table1Rows.map(row => (
                    <TableRow key={row.cityName}>
                      <TableCell>{row.cityName}</TableCell>
                      <TableCell className="text-right">{formatPercent(row.rejectedPctSum)}</TableCell>
                      <TableCell className="text-right">{formatPercent(row.averageError)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tabla 2 - Proyeccion de aprobaciones</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>City Name</TableHead>
                    <TableHead className="text-right">SUM de Approved POS</TableHead>
                    <TableHead className="text-right">SUM de En QC POS</TableHead>
                    <TableHead className="text-right">Error ciudad Simplificado</TableHead>
                    <TableHead className="text-right">Proyeccion aprobados QC</TableHead>
                    <TableHead className="text-right">Aprobados + QC con Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table2Rows.map(row => (
                    <TableRow key={row.cityName}>
                      <TableCell>{row.cityName}</TableCell>
                      <TableCell className="text-right">{formatNumber(row.approvedSum)}</TableCell>
                      <TableCell className="text-right">{formatNumber(row.enQcSum)}</TableCell>
                      <TableCell className="text-right">{formatPercent(row.averageError)}</TableCell>
                      <TableCell className="text-right">{formatNumber(row.projectedApprovedQc)}</TableCell>
                      <TableCell className="text-right">{formatNumber(row.approvedPlusQcWithError)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tabla 3 - Calculo Edge por ciudad</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ciudades</TableHead>
                    <TableHead>Ciudad Simplificado</TableHead>
                    <TableHead className="text-right">Total Edge</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table3Rows.map(row => (
                    <TableRow key={row.cityName}>
                      <TableCell>{row.cityName}</TableCell>
                      <TableCell>{row.simplifiedCity}</TableCell>
                      <TableCell className="text-right">{formatNumber(row.totalEdge)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tabla 4 - Total Edge por ciudad simplificada</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ciudad Simplificado</TableHead>
                    <TableHead className="text-right">Total Edge</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table4Rows.map(row => (
                    <TableRow key={row.simplifiedCity}>
                      <TableCell>{row.simplifiedCity}</TableCell>
                      <TableCell className="text-right">{formatNumber(row.totalEdge)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}