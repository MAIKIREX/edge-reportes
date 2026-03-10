'use client';

import { 
  BarChart3, 
  Settings2, 
  UploadCloud, 
  Table as TableIcon,
  HelpCircle,
  FileSpreadsheet,
  Download,
  Users
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfigPanel } from '@/features/resultados/components/config-panel';
import { FileUploadPanel } from '@/features/resultados/components/file-upload-panel';
import { GeneralTable } from '@/features/resultados/components/general-table';
import { SpecificTable } from '@/features/resultados/components/specific-table';
import { AttendanceTable } from '@/features/resultados/components/attendance-table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useResultsStore } from '@/store/use-results-store';

export default function ResultsDashboard() {
  const { rawFileRows, fileMetadata } = useResultsStore();

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-zinc-950/50">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-4 mx-auto">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-500/20">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div className="flex flex-col select-none">
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                EDGE <span className="text-blue-600 dark:text-blue-500">Reportes</span>
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold -mt-0.5">
                Analytics Engine v2.0
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {rawFileRows.length > 0 && (
              <Badge variant="outline" className="hidden md:flex gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                {fileMetadata?.filename}
              </Badge>
            )}
            <HelpCircle className="h-5 w-5 text-zinc-400 cursor-help hover:text-blue-600 transition-colors" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8 mx-auto">
        <Tabs defaultValue="carga" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <TabsList className="bg-zinc-100 dark:bg-zinc-900 border p-1 rounded-xl h-auto">
              <TabsTrigger value="carga" className="rounded-lg py-2 px-4 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800">
                <UploadCloud className="h-4 w-4" /> Carga
              </TabsTrigger>
              <TabsTrigger value="config" className="rounded-lg py-2 px-4 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800">
                <Settings2 className="h-4 w-4" /> Config
              </TabsTrigger>
              <Separator orientation="vertical" className="h-6 mx-2 hidden md:block" />
              <TabsTrigger value="general" className="rounded-lg py-2 px-4 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800">
                <TableIcon className="h-4 w-4 text-blue-500" /> General
              </TabsTrigger>
              <TabsTrigger value="proyeccion" className="rounded-lg py-2 px-4 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800">
                <BarChart3 className="h-4 w-4 text-indigo-500" /> Proyección
              </TabsTrigger>
              <TabsTrigger value="asistencia" className="rounded-lg py-2 px-4 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800">
                <Users className="h-4 w-4 text-emerald-500" /> Asistencia
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
               <p className="text-xs text-muted-foreground mr-2 italic">Corte: {new Date().toLocaleDateString('es-BO')}</p>
            </div>
          </div>

          <TabsContent value="carga" className="outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <FileUploadPanel />
              </div>
              <div className="lg:col-span-4 space-y-4">
                <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-blue-200 dark:shadow-none">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                       <HelpCircle className="h-5 w-5 opacity-80" /> Instrucciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-blue-50">
                    <p>1. Carga el archivo <strong>Desempeño de Usuarios por Día.xlsx</strong>.</p>
                    <p>2. Verifica en la pestaña <strong>Config</strong> que los MO (metas) de cada ciudad sean correctos.</p>
                    <p>3. Navega por las tablas de análisis para ver avances y proyecciones automáticas.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="config" className="outline-none">
            <ConfigPanel />
          </TabsContent>

          <TabsContent value="general" className="outline-none">
            <GeneralTable />
          </TabsContent>

          <TabsContent value="proyeccion" className="outline-none">
            <SpecificTable />
          </TabsContent>

          <TabsContent value="asistencia" className="outline-none">
            <AttendanceTable />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="mt-20 border-t py-10 bg-zinc-50 dark:bg-zinc-950/20">
        <div className="container px-4 mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} EDGE Analytics Platform — Diseñado para análisis operativo premium.
          </p>
        </div>
      </footer>
    </div>
  );
}

