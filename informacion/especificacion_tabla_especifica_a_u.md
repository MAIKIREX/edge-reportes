# Especificación funcional — Tabla específica (A:U)

## 1. Objetivo

Construir dentro del proyecto actual de **Next.js** una segunda vista/tablero que, a partir del archivo diario **“Desempeño de Usuarios por Día”**, genere una tabla operativa por ciudad inspirada en la lógica del documento `especifico.md`.

Esta tabla debe mostrar las columnas **A hasta U** y permitir visualizar, por ciudad:

- avance actual,
- meta total,
- días faltantes,
- productividad por gestor,
- cantidad de gestores activos,
- proyección de cierre,
- corrección por error real,
- gestores faltantes,
- objetivos diarios,
- días estimados para cumplir,
- fecha aproximada de cierre,
- porcentaje de avance,
- faltante total.

La lógica analítica del tablero se basa en un flujo tipo:

**datos base → proyección ideal → corrección por error → necesidad operativa → fecha estimada de cierre**

---

## 2. Alcance

La página será **frontend-only**. No almacenará datos en servidor ni base de datos persistente.

Toda la información saldrá de **dos fuentes cargadas en el navegador**:

### Fuente 1 — Archivo diario
Archivo Excel descargado manualmente por el usuario desde su plataforma operativa.

Archivo ejemplo:
- `Desempeño de Usuarios por Día.xlsx`

### Fuente 2 — Configuración fija editable
Configuración manual cargada en la aplicación mediante formularios o importación de JSON/plantilla.

Esta configuración debe poder cambiar por:
- mes,
- campaña,
- ciudad,
- variaciones operativas,
- ajustes de negocio.

---

## 3. Enfoque funcional de esta tabla

A diferencia del primer tablero “GENERAL apartado 4”, esta segunda tabla es más **operativa y proyectiva**.

No solo muestra el avance real, sino que estima:

1. si con el equipo actual se llegará a la meta,
2. cuánto afecta el error histórico,
3. cuántos gestores adicionales harían falta,
4. cuántos días tomaría cerrar,
5. cuál sería la fecha aproximada de cierre.

La lógica central de la hoja se apoya en columnas como:
- avance real,
- meta,
- días faltantes,
- promedio por gestor,
- gestores activos,
- proyección,
- error real,
- ajuste por error,
- gestores faltantes,
- objetivos diarios,
- días para el objetivo,
- fecha aproximada de cierre,
- porcentaje,
- faltante total.

---

## 4. Stack esperado dentro del proyecto actual

El proyecto ya está inicializado. Codex debe trabajar sobre la base existente.

### Librerías base obligatorias
- Next.js
- Tailwind CSS
- shadcn/ui
- Zustand
- react-hook-form
- Zod
- lucide-react

### Librerías recomendadas para esta funcionalidad
- `xlsx`: lectura del archivo Excel en frontend
- `@tanstack/react-table`: tabla avanzada con ordenamiento, filtros y columnas configurables
- `date-fns`: manejo de fechas y cálculo de fecha aproximada de cierre
- `sonner`: toasts y mensajes de validación
- `clsx`
- `tailwind-merge`

### Librerías opcionales útiles
- `react-dropzone`: para arrastrar/soltar el archivo
- `recharts`: si luego se desea visualización gráfica adicional
- `papaparse`: opcional si más adelante se acepta CSV

---

## 5. Estructura conceptual de datos

La tabla final se construye por **ciudad**.

Cada fila representa una ciudad y consolida información de ambas fuentes.

### 5.1 Datos provenientes del archivo diario
Deben extraerse y agregarse por ciudad, idealmente normalizando previamente el nombre.

Campos esperados del archivo diario:
- `Date` o equivalente
- `Metropolitan Area`
- `City Name`
- `Total POS`
- `Approved POS`
- otros campos que puedan servir como apoyo si el archivo cambia

### 5.2 Datos provenientes de la configuración fija
La configuración editable debe contener, como mínimo:

```ts
interface CityOperationalConfig {
  cityName: string;
  area: string;
  mo: number;
  diasFaltantes: number;
  promGestor: number;
  gestoresAyer: number;
  errorRealPct: number;
  fechaBaseCalculo?: string;
  diasOffsetCierre?: number;
  umbralAcabado?: number;
}
5.3 Notas importantes

MO no debe salir del Excel diario; debe venir de configuración.

Días faltantes no sale del Excel diario; debe venir de configuración.

Prom Gestor, Gestores Ayer y Error Real % deben ser configurables, ya que no necesariamente existirán en el Excel.

La aplicación debe permitir editar estos valores rápidamente sin reiniciar nada.

6. Relación entre ambas fuentes

La unión principal es por ciudad.

Clave lógica de unión

Excel diario → City Name

Configuración → cityName

Regla de homologación

Antes de unir, la app debe normalizar nombres de ciudad para evitar errores por diferencias de escritura.

Ejemplo de normalización:

quitar tildes,

convertir a mayúsculas,

eliminar dobles espacios,

recortar espacios al inicio y final,

aplicar diccionario de equivalencias manual.

Ejemplo:

Santa Cruz de la Sierra → SANTA CRUZ

El Alto → EL ALTO

Cochabamba → COCHABAMBA

Configuración recomendada de alias
const CITY_ALIASES: Record<string, string> = {
  "SANTA CRUZ DE LA SIERRA": "SANTA CRUZ",
  "LA PAZ": "LA PAZ",
  "EL ALTO": "EL ALTO",
  "GUAYARAMERIN": "GUAYARAMERIN",
};
7. Reglas de agregación desde el archivo diario

Por cada ciudad, la app debe consolidar al menos:

interface DailyCityAggregate {
  cityName: string;
  approvedTotal: number;
  totalPos?: number;
  rowCount?: number;
}
Regla principal

AVANCE + QC / AVANCE TOTAL REAL = suma de Approved POS por ciudad.

Importante

La app debe asumir uno de estos dos modos, seleccionable por el usuario:

Modo A — Archivo acumulado

El archivo diario ya contiene acumulado al día de corte.

Modo B — Archivo parcial/del día

El archivo contiene solo lo generado ese día.

Para la primera versión del sistema, usar por defecto:

Modo A: acumulado al corte

8. Columnas de salida de la tabla (A:U)

La tabla debe renderizar las columnas A hasta U con nombres claros y tooltips explicativos.

A. Área
Origen

Configuración fija.

Regla
area = config.area
Significado

Macro-área o región ejecutiva a la que pertenece la ciudad.

B. City Name
Origen

Nombre normalizado de la ciudad.

Regla
cityName = normalizeCityName(excelCityName || config.cityName)
Significado

Identificador principal de la fila.

C. Avance + QC
Origen

Archivo diario.

Regla
avanceQc = approvedTotal
Significado

Resultado actual real acumulado al momento del corte.

D. MO
Origen

Configuración fija.

Regla
mo = config.mo
Significado

Meta operativa total del periodo para la ciudad.

E. Días Faltantes
Origen

Configuración fija.

Regla
diasFaltantes = config.diasFaltantes
Significado

Cantidad de días operativos restantes en el horizonte de evaluación.

F. Prom Gestor
Origen

Configuración fija.

Regla principal
promGestor = config.promGestor
Fallback opcional recomendado
promGestor = config.promGestor > 0 ? config.promGestor : 4
Significado

Productividad promedio de un gestor en esa ciudad.

G. Gestores Ayer
Origen

Configuración fija.

Regla
gestoresAyer = config.gestoresAyer ?? 0
Significado

Cantidad de gestores activos recientes que sirven como base para la proyección.

H. Proyección
Regla
proyeccion = (avanceQc + (diasFaltantes * promGestor * gestoresAyer)) - mo
Significado

Diferencia entre lo que se estima lograr al cierre con el ritmo actual y la meta total.

Interpretación

> 0 → llegaría y sobraría

= 0 → llegaría exacto

< 0 → no llegaría

I. Error Real (%)
Origen

Configuración fija.

Regla
errorRealPct = config.errorRealPct ?? 0
Significado

Porcentaje histórico de error o fricción real de la operación en la ciudad.

J. Con Error REAL
Regla
conErrorReal = proyeccion > 0
  ? proyeccion * ((100 - errorRealPct) / 100)
  : proyeccion * ((100 + errorRealPct) / 100)
Significado

Versión prudente o corregida de la proyección ideal.

K. Proy Gestores
Regla
proyGestores =
  promGestor > 0 && (diasFaltantes - 2) > 0
    ? (conErrorReal / promGestor) / (diasFaltantes - 2)
    : 0
Significado

Equivalente técnico de gestores necesarios o sobrantes según la proyección corregida.

Observación

La resta de 2 días debe mantenerse como parámetro configurable.

L. Gestores FALTANTES
Regla
gestoresFaltantes =
  proyGestores < 0 ? Math.ceil(Math.abs(proyGestores)) : 0
Significado

Cantidad entera de gestores adicionales requeridos para cerrar la meta bajo la proyección corregida.

M. Proyección (%)
Regla
proyeccionPct = mo > 0 ? ((mo + conErrorReal) * 100) / mo : 0
Significado

Porcentaje final proyectado de cumplimiento considerando el error real.

N. OBJ diario
Regla
objDiario = avanceQc > mo
  ? 0
  : diasFaltantes > 0
    ? (mo - avanceQc) / diasFaltantes
    : 0
Significado

Cantidad diaria promedio requerida para cerrar la meta en el tiempo restante.

O. OBJ diario x Gestor
Regla
objDiarioPorGestor = gestoresAyer === 0
  ? objDiario
  : objDiario > 0
    ? objDiario / gestoresAyer
    : 0
Significado

Carga diaria ideal por gestor.

P. OBJ diario + Error
Regla a replicar fielmente
objDiarioMasError = errorRealPct === 0
  ? objDiario
  : objDiario + (objDiario / errorRealPct)
Significado

Objetivo diario ajustado por una penalización heurística asociada al error real.

Observación crítica

Esta fórmula no es un porcentaje clásico. Debe mantenerse como regla de negocio heredada.

Q. OBJ diario x Gestor (+ Error)
Regla
objDiarioMasErrorPorGestor = gestoresAyer === 0
  ? objDiarioMasError
  : objDiarioMasError > 0
    ? objDiarioMasError / gestoresAyer
    : 0
Significado

Carga diaria por gestor, pero considerando el ajuste de error.

R. Días para el Objetivo
Regla parametrizable
const umbralAcabado = config.umbralAcabado ?? 5;

diasParaObjetivo =
  (mo - avanceQc) <= umbralAcabado
    ? "Acabado"
    : gestoresAyer === 0
      ? "Sin Avance"
      : Math.ceil((mo - avanceQc) / (promGestor * gestoresAyer));
Significado

Estimación de días requeridos para cumplir el objetivo con la capacidad actual.

S. Fecha (Aprox) de cierre
Regla sugerida
const diasOffsetCierre = config.diasOffsetCierre ?? 2;
const fechaBase = config.fechaBaseCalculo ? new Date(config.fechaBaseCalculo) : new Date();
const fechaLimite = endOfConfiguredPeriod;

fechaAproxCierre =
  diasParaObjetivo === "Acabado"
    ? "Cerrado"
    : diasParaObjetivo === "Sin Avance"
      ? "Sin Avance"
      : addDays(fechaBase, Number(diasParaObjetivo) + diasOffsetCierre) > fechaLimite
        ? "NO CIERRA"
        : format(addDays(fechaBase, Number(diasParaObjetivo) + diasOffsetCierre), "dd/MM/yyyy");
Significado

Fecha aproximada de cierre o estado de imposibilidad de cierre dentro del periodo.

T. %
Regla
porcentajeAvance = mo > 0
  ? Math.round((avanceQc * 100) / mo) / 100
  : 0
Significado

Porcentaje de avance actual, expresado en formato decimal tipo 0.04, 0.26, 0.37.

U. FALTANTES TOTAL
Regla
faltantesTotal = mo - avanceQc
Significado

Faltante bruto actual respecto a la meta, sin considerar tiempo ni error.

9. Fórmulas resumen en TypeScript
function buildSpecificRow(input: {
  area: string;
  cityName: string;
  avanceQc: number;
  mo: number;
  diasFaltantes: number;
  promGestor: number;
  gestoresAyer: number;
  errorRealPct: number;
  fechaBaseCalculo: Date;
  fechaLimite: Date;
  diasOffsetCierre: number;
  umbralAcabado: number;
}) {
  const {
    area,
    cityName,
    avanceQc,
    mo,
    diasFaltantes,
    promGestor,
    gestoresAyer,
    errorRealPct,
    fechaBaseCalculo,
    fechaLimite,
    diasOffsetCierre,
    umbralAcabado,
  } = input;

  const proyeccion = (avanceQc + (diasFaltantes * promGestor * gestoresAyer)) - mo;

  const conErrorReal = proyeccion > 0
    ? proyeccion * ((100 - errorRealPct) / 100)
    : proyeccion * ((100 + errorRealPct) / 100);

  const proyGestores = promGestor > 0 && (diasFaltantes - 2) > 0
    ? (conErrorReal / promGestor) / (diasFaltantes - 2)
    : 0;

  const gestoresFaltantes = proyGestores < 0 ? Math.ceil(Math.abs(proyGestores)) : 0;

  const proyeccionPct = mo > 0 ? ((mo + conErrorReal) * 100) / mo : 0;

  const objDiario = avanceQc > mo
    ? 0
    : diasFaltantes > 0
      ? (mo - avanceQc) / diasFaltantes
      : 0;

  const objDiarioPorGestor = gestoresAyer === 0
    ? objDiario
    : objDiario > 0
      ? objDiario / gestoresAyer
      : 0;

  const objDiarioMasError = errorRealPct === 0
    ? objDiario
    : objDiario + (objDiario / errorRealPct);

  const objDiarioMasErrorPorGestor = gestoresAyer === 0
    ? objDiarioMasError
    : objDiarioMasError > 0
      ? objDiarioMasError / gestoresAyer
      : 0;

  const diasParaObjetivo = (mo - avanceQc) <= umbralAcabado
    ? "Acabado"
    : gestoresAyer === 0
      ? "Sin Avance"
      : Math.ceil((mo - avanceQc) / (promGestor * gestoresAyer));

  let fechaAproxCierre: string;
  if (diasParaObjetivo === "Acabado") {
    fechaAproxCierre = "Cerrado";
  } else if (diasParaObjetivo === "Sin Avance") {
    fechaAproxCierre = "Sin Avance";
  } else {
    const fecha = addDays(fechaBaseCalculo, Number(diasParaObjetivo) + diasOffsetCierre);
    fechaAproxCierre = fecha > fechaLimite ? "NO CIERRA" : format(fecha, "dd/MM/yyyy");
  }

  const porcentajeAvance = mo > 0 ? Math.round((avanceQc * 100) / mo) / 100 : 0;
  const faltantesTotal = mo - avanceQc;

  return {
    area,
    cityName,
    avanceQc,
    mo,
    diasFaltantes,
    promGestor,
    gestoresAyer,
    proyeccion,
    errorRealPct,
    conErrorReal,
    proyGestores,
    gestoresFaltantes,
    proyeccionPct,
    objDiario,
    objDiarioPorGestor,
    objDiarioMasError,
    objDiarioMasErrorPorGestor,
    diasParaObjetivo,
    fechaAproxCierre,
    porcentajeAvance,
    faltantesTotal,
  };
}
10. Estructura de UI recomendada
Pantalla / módulo

Crear un segundo módulo dentro de la misma sección del proyecto, por ejemplo:

Resultados > Tabla específica

Secciones visuales
A. Encabezado

título de la vista,

descripción corta,

fecha de procesamiento,

estado del archivo cargado.

B. Panel de entrada

carga del Excel diario,

formulario de configuración fija,

selector de fecha base,

selector de fecha límite,

acciones de recalcular / limpiar.

C. Tabla principal A:U

ordenable,

filtrable por ciudad o área,

scroll horizontal,

columnas fijadas al inicio,

tooltips por columna.

D. Resumen superior opcional

Cards con:

total de ciudades,

ciudades que sí cierran,

ciudades que no cierran,

total de gestores faltantes,

meta total,

avance total.

11. Colores e indicadores visuales sugeridos
Proyección (H)

verde: >= 0

rojo: < 0

Con Error Real (J)

verde: >= 0

rojo: < 0

Gestores Faltantes (L)

gris: 0

naranja/rojo: > 0

Fecha de cierre (S)

verde: Cerrado

amarillo: fecha válida

rojo: NO CIERRA

gris: Sin Avance

Faltantes Total (U)

verde: <= 0

rojo: > 0

12. Validaciones y reglas defensivas

La app debe evitar errores de cálculo y presentar mensajes claros.

Validaciones mínimas

si no se carga archivo, no calcular;

si faltan columnas mínimas del Excel, mostrar error;

si una ciudad existe en Excel pero no en configuración, mostrar advertencia;

si MO <= 0, marcar fila inválida;

si diasFaltantes <= 0, no dividir;

si promGestor <= 0, usar fallback o marcar advertencia;

si errorRealPct < 0, bloquear valor;

si gestoresAyer < 0, bloquear valor.

Regla de divisiones

Toda división debe usar guards para evitar Infinity, NaN o errores visuales.

13. Estado global con Zustand

Se recomienda un store con esta estructura:

interface SpecificTableStore {
  rawFileRows: any[];
  dailyAggregates: DailyCityAggregate[];
  cityConfigs: CityOperationalConfig[];
  processedRows: SpecificTableRow[];
  processingMode: "accumulated" | "daily";
  periodEndDate: string | null;
  loadExcelFile: (file: File) => Promise<void>;
  setCityConfigs: (configs: CityOperationalConfig[]) => void;
  updateCityConfig: (cityName: string, patch: Partial<CityOperationalConfig>) => void;
  processTable: () => void;
  resetAll: () => void;
}
14. Formularios con react-hook-form + zod

Crear formularios para:

A. Configuración global

fecha base de cálculo

fecha límite del periodo

modo de procesamiento

fallback promGestor

B. Configuración por ciudad

área

MO

días faltantes

promGestor

gestoresAyer

errorRealPct

umbralAcabado

días offset cierre

Schema sugerido
const cityOperationalConfigSchema = z.object({
  cityName: z.string().min(1),
  area: z.string().min(1),
  mo: z.number().nonnegative(),
  diasFaltantes: z.number().nonnegative(),
  promGestor: z.number().nonnegative(),
  gestoresAyer: z.number().nonnegative(),
  errorRealPct: z.number().min(0),
  fechaBaseCalculo: z.string().optional(),
  diasOffsetCierre: z.number().nonnegative().optional(),
  umbralAcabado: z.number().nonnegative().optional(),
});
15. Exportación

La vista debe permitir:

exportar resultado a Excel,

exportar resultado a CSV,

copiar tabla al portapapeles.

La exportación debe respetar:

orden actual,

filtros aplicados,

nombres visibles de columnas.

16. Casos límite que Codex debe contemplar
Caso 1

Ciudad presente en Excel pero ausente en configuración.

Acción:

mostrar fila en estado incompleto,

permitir completar configuración manual.

Caso 2

gestoresAyer = 0

Acción:

mostrar Sin Avance en días para objetivo,

mantener visibles objetivos diarios sin dividir por gestor.

Caso 3

avanceQc > mo

Acción:

objDiario = 0

faltantesTotal puede ser negativo

mostrar estado de meta superada.

Caso 4

errorRealPct = 0

Acción:

objDiarioMasError = objDiario

no aplicar penalización.

Caso 5

Fecha estimada supera el límite del periodo.

Acción:

mostrar NO CIERRA.

Caso 6

Valores decimales grandes.

Acción:

mostrar formato amigable con redondeo visual, pero mantener precisión interna.

17. Requisitos UX

la tabla debe ser entendible sin revisar fórmulas;

cada columna debe tener tooltip “qué significa” y “cómo se calcula”;

permitir edición rápida de configuración por ciudad;

permitir recalcular instantáneamente al cambiar parámetros;

mantener la experiencia clara aunque haya muchas ciudades;

mostrar mensajes visuales cuando una fila tiene configuración incompleta.

18. Requisitos técnicos de implementación

Codex debe:

trabajar sobre el proyecto actual, no crear uno nuevo;

usar componentes consistentes con shadcn/ui;

separar lógica de procesamiento en utilidades puras;

evitar mezclar lógica de UI con cálculos;

tipar todo con TypeScript;

crear componentes reutilizables para:

carga de archivo,

formulario de configuración,

tabla,

cards resumen,

exportación;

dejar preparada la arquitectura para una tercera tabla futura.

19. Estructura de carpetas sugerida
src/
  features/
    resultados/
      components/
        file-upload-panel.tsx
        config-global-form.tsx
        city-config-drawer.tsx
        specific-table.tsx
        summary-cards.tsx
        export-actions.tsx
      lib/
        excel-parser.ts
        city-normalizer.ts
        specific-table-calculations.ts
        specific-table-columns.tsx
        formatters.ts
      store/
        use-results-store.ts
      types/
        results.types.ts
      hooks/
        use-specific-table-processing.ts
  app/
    resultados/
      page.tsx
20. Resultado esperado

El sistema debe permitir que el usuario:

cargue el archivo diario Desempeño de Usuarios por Día,

complete o edite la configuración fija,

genere automáticamente la segunda tabla de análisis operativa,

visualice de forma clara las columnas A a U,

detecte ciudades atrasadas,

vea si cierran o no,

identifique gestores faltantes,

exporte la tabla procesada.

21. Nota final para Codex

La lógica de esta tabla debe replicar fielmente el comportamiento analítico del documento especifico.md, especialmente en estas reglas:

proyección ideal,

corrección asimétrica por error,

cálculo de gestores faltantes,

objetivo diario con error usando la regla heredada,

estados Acabado, Sin Avance, Cerrado, NO CIERRA,

porcentaje en formato decimal redondeado,

faltante bruto total.

Si alguna regla heredada parece poco ortodoxa matemáticamente, debe mantenerse como regla de negocio configurable, no corregirse sin autorización.