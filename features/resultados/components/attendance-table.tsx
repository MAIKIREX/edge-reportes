'use client';

import React, { useState } from 'react';
import { 
  Users, Calendar, Clock, MapPin, ChevronDown, ChevronRight, 
  Download, Filter, ArrowRightCircle, ListChecks
} from 'lucide-react';
import { useResultsStore } from '@/store/use-results-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { exportToExcel } from '@/lib/export';

export function AttendanceTable() {
  const { 
    attendanceGroups, availableDates, selectedDate, setSelectedDate,
    rawFileRows, fileMetadata
  } = useResultsStore();
  const safeAvailableDates = availableDates.filter((date) => date.trim() !== '');
  const safeSelectedDate = selectedDate && selectedDate.trim() !== '' ? selectedDate : undefined;

  const [expandedSupervisors, setExpandedSupervisors] = useState<Set<string>>(new Set());
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());

  const toggleSupervisor = (sup: string) => {
    const next = new Set(expandedSupervisors);
    if (next.has(sup)) next.delete(sup);
    else next.add(sup);
    setExpandedSupervisors(next);
  };

  const toggleCity = (city: string) => {
    const next = new Set(expandedCities);
    if (next.has(city)) next.delete(city);
    else next.add(city);
    setExpandedCities(next);
  };

  const handleExport = () => {
    if (!attendanceGroups.length) return;
    const flatData: any[] = [];
    
    attendanceGroups.forEach(group => {
      group.cities.forEach(city => {
        city.auditors.forEach(auditor => {
          flatData.push({
            'FECHA': selectedDate,
            'SUPERVISOR': group.supervisor,
            'CIUDAD': city.cityName,
            'AUDITOR': auditor.auditorName,
            'PRIMERA TAREA': auditor.horaPrimeraTarea,
            'ÚLTIMA TAREA': auditor.horaUltimaTarea,
            'POS RECOLECTADOS': auditor.posRecolectados
          });
        });
      });
    });
    
    exportToExcel(flatData, `asistencia_${selectedDate}`);
  };

  const totalPos = attendanceGroups.reduce((s, g) => s + g.subtotalPos, 0);

  if (!rawFileRows.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <Calendar className="h-10 w-10 text-muted-foreground" />
          <div className="text-center">
            <p className="font-semibold text-lg">Sin datos operativos</p>
            <p className="text-muted-foreground text-sm">Carga el Excel diario para visualizar la asistencia por fecha.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Header */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
              <Filter className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase">Filtro de Asistencia</p>
              <div className="flex items-center gap-2 mt-1">
                <Select value={safeSelectedDate} onValueChange={setSelectedDate}>
                  <SelectTrigger className="w-48 h-9 border-blue-200 dark:border-blue-800">
                    <SelectValue placeholder="Seleccionar fecha" />
                  </SelectTrigger>
                  <SelectContent>
                    {safeAvailableDates.map(date => (
                      <SelectItem key={date} value={date}>{date}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedDate && <Badge variant="secondary" className="font-mono">{selectedDate}</Badge>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground font-bold uppercase">Total POS Recolectados</p>
              <p className="text-xl font-black text-blue-700 dark:text-blue-400">{totalPos.toLocaleString()}</p>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <Button onClick={handleExport} size="sm" className="gap-2 bg-blue-700 hover:bg-blue-800">
              <Download className="h-4 w-4" /> Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Hierarchical Table */}
      <Card>
        <CardHeader className="py-4 bg-muted/20 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-blue-600" />
            Tabla Dinámica de Asistencia
          </CardTitle>
          <CardDescription className="text-xs">
            Jerarquía: Fecha → Supervisor → Ciudad → Auditor. Filtro: N° != 0.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="min-w-[200px] font-bold">FECHA / ESTRUCTURA</TableHead>
                  <TableHead className="text-center font-bold">HORA PRIMERA</TableHead>
                  <TableHead className="text-center font-bold">HORA ÚLTIMA</TableHead>
                  <TableHead className="text-right font-bold pr-6">POS RECOLECTADOS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">
                      No hay registros para la fecha seleccionada.
                    </TableCell>
                  </TableRow>
                ) : (
                  attendanceGroups.map((group) => {
                    const supKey = group.supervisor;
                    const supExpanded = expandedSupervisors.has(supKey);
                    
                    return (
                      <React.Fragment key={supKey}>
                        {/* Supervisor Level */}
                        <TableRow 
                          className="bg-zinc-50 dark:bg-zinc-900 cursor-pointer group"
                          onClick={() => toggleSupervisor(supKey)}
                        >
                          <TableCell className="text-center">
                            {supExpanded ? <ChevronDown className="h-4 w-4 text-zinc-500" /> : <ChevronRight className="h-4 w-4 text-zinc-500" />}
                          </TableCell>
                          <TableCell className="font-bold flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-600" />
                            {group.supervisor}
                          </TableCell>
                          <TableCell colSpan={2}></TableCell>
                          <TableCell className="text-right pr-6 font-bold text-blue-700 dark:text-blue-400">
                            {group.subtotalPos.toLocaleString()}
                          </TableCell>
                        </TableRow>

                        {/* City Level */}
                        {supExpanded && group.cities.map((city) => {
                          const cityKey = `${supKey}-${city.cityName}`;
                          const cityExpanded = expandedCities.has(cityKey);

                          return (
                            <React.Fragment key={cityKey}>
                              <TableRow 
                                className="bg-blue-50/20 dark:bg-blue-950/5 cursor-pointer pl-4"
                                onClick={() => toggleCity(cityKey)}
                              >
                                <TableCell className="text-center pl-4">
                                  {cityExpanded ? <ChevronDown className="h-4 w-4 text-zinc-400" /> : <ChevronRight className="h-4 w-4 text-zinc-400" />}
                                </TableCell>
                                <TableCell className="font-semibold text-sm pl-8 flex items-center gap-2">
                                  <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                                  {city.cityName}
                                </TableCell>
                                <TableCell colSpan={2}></TableCell>
                                <TableCell className="text-right pr-6 font-semibold">
                                  {city.subtotalPos.toLocaleString()}
                                </TableCell>
                              </TableRow>

                              {/* Auditor Level */}
                              {cityExpanded && city.auditors.map((auditor) => (
                                <TableRow key={auditor.auditorName} className="hover:bg-zinc-100 dark:hover:bg-zinc-900/50">
                                  <TableCell></TableCell>
                                  <TableCell className="pl-16 text-sm text-muted-foreground flex items-center gap-2">
                                    <ArrowRightCircle className="h-3 w-3 text-zinc-300" />
                                    {auditor.auditorName}
                                  </TableCell>
                                  <TableCell className="text-center font-mono text-xs">
                                    <div className="flex items-center justify-center gap-1.5">
                                      {auditor.horaPrimeraTarea !== 'N/D' && <Clock className="h-3 w-3 text-zinc-400" />}
                                      {auditor.horaPrimeraTarea}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center font-mono text-xs">
                                    <div className="flex items-center justify-center gap-1.5">
                                      {auditor.horaUltimaTarea !== 'N/D' && <Clock className="h-3 w-3 text-zinc-400" />}
                                      {auditor.horaUltimaTarea}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right pr-6 font-mono text-sm">
                                    {auditor.posRecolectados.toLocaleString()}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </React.Fragment>
                          );
                        })}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 border border-amber-100 dark:border-amber-900/30">
        <div className="flex items-start gap-3">
          <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-800 dark:text-amber-400 leading-tight">
            <strong>Nota sobre las horas:</strong> Se obtienen los valores mínimo (Primera) y máximo (Última) de los registros de cada auditor en la fecha seleccionada. Si el archivo no tiene columna de tiempo, se mostrará N/D.
          </p>
        </div>
      </div>
    </div>
  );
}
