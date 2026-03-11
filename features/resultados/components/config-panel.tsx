'use client';

import { useState } from 'react';
import { Plus, Trash2, Download, Upload, Settings2, MapPin } from 'lucide-react';
import { useResultsStore } from '@/store/use-results-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { parseCityConfigExcel } from '@/lib/city-config-import';
import { toast } from 'sonner';
import type { CityConfig } from '@/types/results.types';

export function ConfigPanel() {
  const {
    periodConfig, setPeriodConfig,
    cityConfigs, setCityConfigs, addCityConfig, updateCityConfig, removeCityConfig,
    exportConfigJson, importConfig,
  } = useResultsStore();

  const [newCityName, setNewCityName] = useState('');
  const [isImportingCities, setIsImportingCities] = useState(false);

  const handleAddCity = () => {
    if (!newCityName.trim()) return;

    const normalizedCity = newCityName.toUpperCase();
    const newCity: CityConfig = {
      cityId: newCityName.toLowerCase().replace(/\s+/g, '_'),
      cityLabel: normalizedCity,
      aliases: [normalizedCity],
      mo: 0,
      activo: true,
      area: '',
      simplifiedCity: normalizedCity,
      promGestor: 4,
      gestoresAyer: 0,
      errorRealPct: 0,
      diasFaltantes: 0,
      descansos: 0,
      diasOffsetCierre: 2,
      umbralAcabado: 5,
    };

    addCityConfig(newCity);
    setNewCityName('');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const content = ev.target?.result as string;
      importConfig(content);
    };
    reader.readAsText(file);
  };

  const handleCityExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.xlsx') && !lowerName.endsWith('.xls')) {
      toast.error('Formato invalido. Sube un archivo .xlsx o .xls');
      return;
    }

    setIsImportingCities(true);
    try {
      const result = await parseCityConfigExcel(file);
      if (result.cityConfigs.length === 0) {
        toast.warning('Archivo valido, pero no contiene filas utiles para importar.');
        return;
      }

      setCityConfigs(result.cityConfigs);

      const details: string[] = [];
      if (result.duplicateRows > 0) details.push(`${result.duplicateRows} duplicadas ignoradas`);
      if (result.skippedInvalidRows > 0) details.push(`${result.skippedInvalidRows} invalidas omitidas`);
      if (result.skippedEmptyRows > 0) details.push(`${result.skippedEmptyRows} vacias omitidas`);

      toast.success(
        `Archivo cargado correctamente. Se importaron ${result.cityConfigs.length} ciudades.`,
        { description: details.length ? details.join(' | ') : undefined }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al importar el Excel de ciudades';
      toast.error(message);
    } finally {
      setIsImportingCities(false);
    }
  };

  const handleExport = () => {
    const json = exportConfigJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `config_periodo_${periodConfig.startDate}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Tabs defaultValue="periodo" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="periodo" className="gap-2">
          <Settings2 className="h-4 w-4" /> Periodo
        </TabsTrigger>
        <TabsTrigger value="ciudades" className="gap-2">
          <MapPin className="h-4 w-4" /> Ciudades
        </TabsTrigger>
      </TabsList>

      <TabsContent value="periodo">
        <Card>
          <CardHeader>
            <CardTitle>Configuracion del Periodo</CardTitle>
            <CardDescription>Define las fechas y reglas de calendario para los calculos de hoy.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha Inicio</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={periodConfig.startDate}
                  onChange={e => setPeriodConfig({ ...periodConfig, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Fecha Fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={periodConfig.endDate}
                  onChange={e => setPeriodConfig({ ...periodConfig, endDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="todayCutoff">Fecha de Corte (Hoy)</Label>
                <Input
                  id="todayCutoff"
                  type="date"
                  value={periodConfig.todayCutoff}
                  onChange={e => setPeriodConfig({ ...periodConfig, todayCutoff: e.target.value })}
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Regla de Domingos</Label>
                <Select
                  value={periodConfig.excludeSundays ? 'exclude' : 'include'}
                  onValueChange={val => setPeriodConfig({ ...periodConfig, excludeSundays: val === 'exclude' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exclude">Excluir Domingos (No laborables)</SelectItem>
                    <SelectItem value="include">Incluir Domingos (Laborables)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Factor Sabados</Label>
                <Select
                  value={String(periodConfig.saturdayFactor)}
                  onValueChange={val => setPeriodConfig({ ...periodConfig, saturdayFactor: parseFloat(val) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Sabados cuentan como 1 dia</SelectItem>
                    <SelectItem value="0.5">Sabados cuentan como 0.5 dia</SelectItem>
                    <SelectItem value="0">Sabados no cuentan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" className="gap-2" onClick={() => document.getElementById('import-config')?.click()}>
                <Upload className="h-4 w-4" /> Importar JSON
                <input id="import-config" type="file" accept=".json" className="hidden" onChange={handleImport} />
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleExport}>
                <Download className="h-4 w-4" /> Exportar JSON
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="ciudades">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Configuracion por Ciudad</CardTitle>
              <CardDescription>
                Importa el Excel base con columnas exactas: Metropolitan Area, City Name, MO y CIUDADES SIMPLIFICADO.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => document.getElementById('import-city-excel')?.click()}
                disabled={isImportingCities}
              >
                <Upload className={`h-4 w-4 ${isImportingCities ? 'animate-spin' : ''}`} />
                {isImportingCities ? 'Importando...' : 'Importar Excel'}
                <input
                  id="import-city-excel"
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  className="hidden"
                  onChange={handleCityExcelImport}
                />
              </Button>
              <Input
                placeholder="Nombre de ciudad..."
                className="w-48"
                value={newCityName}
                onChange={e => setNewCityName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCity()}
              />
              <Button size="icon" onClick={handleAddCity}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metropolitan Area</TableHead>
                    <TableHead>City Name</TableHead>
                    <TableHead>MO</TableHead>
                    <TableHead>CIUDADES SIMPLIFICADO</TableHead>
                    <TableHead>Aliases</TableHead>
                    <TableHead className="w-24 text-right">Descansos</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cityConfigs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground italic">
                        No hay ciudades configuradas. Importa el Excel o agrega una arriba.
                      </TableCell>
                    </TableRow>
                  ) : (
                    cityConfigs.map(city => (
                      <TableRow key={city.cityId}>
                        <TableCell>
                          <Input
                            className="h-8"
                            value={city.area}
                            onChange={e => updateCityConfig(city.cityId, { area: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8"
                            value={city.cityLabel}
                            onChange={e => updateCityConfig(city.cityId, { cityLabel: e.target.value.toUpperCase() })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="h-8 text-right"
                            value={city.mo}
                            onChange={e => updateCityConfig(city.cityId, { mo: parseInt(e.target.value, 10) || 0 })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8"
                            value={city.simplifiedCity ?? ''}
                            onChange={e => updateCityConfig(city.cityId, { simplifiedCity: e.target.value.toUpperCase() })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8 text-xs"
                            value={city.aliases.join(', ')}
                            onChange={e => updateCityConfig(city.cityId, { aliases: e.target.value.split(',').map(alias => alias.trim()).filter(Boolean) })}
                            placeholder="Alias separados por coma"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="h-8 text-right"
                            value={city.descansos ?? 0}
                            onChange={e => updateCityConfig(city.cityId, { descansos: parseInt(e.target.value, 10) || 0 })}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive h-8 w-8"
                            onClick={() => removeCityConfig(city.cityId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <p className="text-[10px] text-muted-foreground mt-4">
              * La importacion respeta los nombres originales del Excel base y usa esas columnas para cargar la configuracion inicial de ciudades.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}