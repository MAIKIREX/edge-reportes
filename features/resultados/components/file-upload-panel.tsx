'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useResultsStore } from '@/store/use-results-store';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function FileUploadPanel() {
  const { loadExcelFile, clearFile, fileMetadata, isLoadingFile, fileError } = useResultsStore();

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) loadExcelFile(accepted[0]);
  }, [loadExcelFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 
      'application/vnd.ms-excel': ['.xls'] 
    },
    multiple: false,
  });

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200',
          isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'border-border hover:border-blue-400 hover:bg-muted/40',
          isLoadingFile && 'pointer-events-none opacity-60'
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        {isDragActive ? (
          <p className="text-blue-600 font-medium">Suelta el archivo aquí...</p>
        ) : (
          <>
            <p className="font-semibold text-foreground">Arrastra tu archivo Excel aquí</p>
            <p className="text-sm text-muted-foreground mt-1">o haz clic para buscar</p>
            <p className="text-xs text-muted-foreground mt-2">Archivos .xlsx soportados — "Desempeño de Usuarios por Día.xlsx"</p>
          </>
        )}
        {isLoadingFile && (
          <div className="mt-3 flex items-center justify-center gap-2 text-blue-600">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <span className="text-sm">Procesando archivo...</span>
          </div>
        )}
      </div>

      {/* Error */}
      {fileError && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive text-sm">Error al cargar el archivo</p>
            <p className="text-sm text-destructive/80 mt-1">{fileError}</p>
          </div>
        </div>
      )}

      {/* File Metadata */}
      {fileMetadata && !fileError && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-sm truncate max-w-xs">{fileMetadata.filename}</span>
              <Badge variant="secondary" className="text-xs">{fileMetadata.rowCount.toLocaleString()} filas</Badge>
            </div>
            <button onClick={clearFile} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Fecha máxima</p>
              <p className="font-semibold mt-1">{fileMetadata.maxDate ?? 'N/D'}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Fechas detectadas</p>
              <p className="font-semibold mt-1">{fileMetadata.detectedDates.length}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Ciudades</p>
              <p className="font-semibold mt-1">{fileMetadata.detectedCities.length}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Columna tiempo</p>
              <p className="font-semibold mt-1 flex items-center gap-1">
                {fileMetadata.hasTimeColumn ? (
                  <><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Sí</>
                ) : (
                  <><AlertCircle className="h-3.5 w-3.5 text-amber-500" /> No</>
                )}
              </p>
            </div>
          </div>

          {/* Detected cities */}
          {fileMetadata.detectedCities.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Ciudades en el archivo</p>
              <div className="flex flex-wrap gap-1.5">
                {fileMetadata.detectedCities.map(c => (
                  <Badge key={c} variant={fileMetadata.unmappedCities.includes(c) ? 'destructive' : 'secondary'} className="text-xs">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Unmapped warning */}
          {fileMetadata.unmappedCities.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <span className="font-medium">{fileMetadata.unmappedCities.length} ciudad(es) sin configuración:</span>{' '}
                {fileMetadata.unmappedCities.join(', ')}. Configúralas en la pestaña <strong>Configuración</strong>.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
