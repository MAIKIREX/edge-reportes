# Especificación funcional — Tabla dinámica de asistencia

## 1. Objetivo

Construir dentro del proyecto actual de **Next.js** una tercera vista/tablero orientada a **asistencia operativa**, basada en el mismo archivo diario **“Desempeño de Usuarios por Día”**.

Esta vista debe comportarse de forma similar a una **tabla dinámica de Excel**, permitiendo seleccionar una fecha específica y visualizar, de forma jerárquica, la actividad operativa agrupada por:

- Fecha
- Supervisor
- City Name
- Auditor Name
- Hora Primera tarea
- Hora Última tarea

Y mostrando como valor principal:

- **Total POS (POS recolectados)**

Además, debe respetar el filtro funcional indicado:

- `N° != 0`
- `Fecha = 1 elemento visible`

---

## 2. Alcance

La página será **frontend-only**, dentro del proyecto actual de Next.js.

No almacenará datos persistentes. Todo se procesará en memoria dentro del navegador a partir del archivo Excel cargado por el usuario.

Esta tabla será una de las **3 vistas principales** del sistema.

---

## 3. Comportamiento esperado

La tabla debe permitir:

1. cargar el archivo Excel,
2. seleccionar una fecha específica,
3. filtrar registros donde `N° != 0`,
4. agrupar jerárquicamente la información como una tabla dinámica,
5. calcular:
   - hora de la primera tarea,
   - hora de la última tarea,
   - total de POS recolectados,
6. mostrar subtotales por:
   - Supervisor
   - City Name,
7. mostrar el detalle por Auditor Name.

---

## 4. Estructura de la tabla dinámica solicitada

## Filas
La jerarquía de agrupación debe ser exactamente esta:

1. **Fecha** (ascendente)
2. **Supervisor** (ascendente / mostrar totales)
3. **City Name** (ascendente / mostrar totales)
4. **Auditor Name** (ascendente)
5. **Hora Primera tarea** (ascendente)
6. **Hora Última tarea** (ascendente)

## Valores
- **Total POS** → mostrar como **POS recolectados**

## Filtros
- **N°** → el valor no es igual a `0`
- **Fecha** → mostrar solo **1 elemento** a la vez

---

## 5. Fuente de datos

La tabla usa como fuente el archivo diario:

- `Desempeño de Usuarios por Día.xlsx`

### Campos esperados mínimos
El archivo debe contener, o algo equivalente a:

- `Fecha`
- `Supervisor`
- `City Name`
- `Auditor Name`
- `Total POS`
- `N°`
- una columna de hora o timestamp de actividad

### Observación importante
Para calcular correctamente:

- **Hora Primera tarea**
- **Hora Última tarea**

el archivo debe contener una columna temporal, por ejemplo:

- `Hora`
- `Hora tarea`
- `Fecha y hora`
- `Timestamp`
- `Created At`
- `Task Time`

Si **no existe una columna de tiempo**, la tabla debe seguir funcionando, pero mostrar:

- `N/D` en Hora Primera tarea
- `N/D` en Hora Última tarea

---

## 6. Definición funcional de cada columna

## A. Fecha
### Origen
Archivo diario.

### Regla
Usar la fecha del registro, normalizada a formato único.

### Significado
Fecha operativa filtrable. Solo debe mostrarse **una fecha a la vez**.

---

## B. Supervisor
### Origen
Archivo diario.

### Regla
Agrupar en orden ascendente.

### Significado
Responsable jerárquico del equipo o auditor.

### Requisito
Debe mostrar subtotal.

---

## C. City Name
### Origen
Archivo diario.

### Regla
Agrupar dentro de cada supervisor, en orden ascendente.

### Significado
Ciudad donde se realizó la actividad.

### Requisito
Debe mostrar subtotal.

---

## D. Auditor Name
### Origen
Archivo diario.

### Regla
Agrupar dentro de City Name, en orden ascendente.

### Significado
Nombre del auditor que realizó tareas en esa fecha.

---

## E. Hora Primera tarea
### Origen
Columna temporal del archivo.

### Regla
Para cada auditor, obtener la **hora mínima** del conjunto de registros filtrados.

```ts
horaPrimeraTarea = min(taskTimes)
```

### Significado
Hora en la que el auditor inició su primera actividad del día.

### Si no hay hora disponible
Mostrar `N/D`.

---

## F. Hora Última tarea
### Origen
Columna temporal del archivo.

### Regla
Para cada auditor, obtener la **hora máxima** del conjunto de registros filtrados.

```ts
horaUltimaTarea = max(taskTimes)
```

### Significado
Hora en la que el auditor registró su última actividad del día.

### Si no hay hora disponible
Mostrar `N/D`.

---

## G. POS recolectados
### Origen
Campo `Total POS`.

### Regla
Sumar los POS del auditor en la fecha seleccionada.

```ts
posRecolectados = sum(totalPos)
```

### Significado
Cantidad total de POS recolectados por el auditor en esa fecha.

---

## 7. Reglas de filtrado

## Filtro 1 — N° != 0
Solo se deben considerar filas donde:

```ts
numero !== 0
```

Si el campo viene como string, debe convertirse de forma segura.

### Ejemplo
- `0` → excluir
- `"0"` → excluir
- `1` → incluir
- `25` → incluir

---

## Filtro 2 — Fecha = 1 elemento
La vista debe permitir elegir **una sola fecha a la vez**, similar a una tabla dinámica de Excel con un único valor activo.

### Requisito UX
- usar un `select`,
- o un `date picker`,
- o una lista de fechas disponibles detectadas desde el Excel.

La tabla solo debe renderizar información de la fecha seleccionada.

---

## 8. Flujo de procesamiento

1. El usuario carga el Excel.
2. La app detecta columnas requeridas.
3. La app extrae las fechas disponibles.
4. El usuario selecciona una fecha.
5. La app filtra:
   - registros de esa fecha,
   - registros con `N° != 0`.
6. La app agrupa por:
   - Supervisor
   - City Name
   - Auditor Name
7. Por cada auditor calcula:
   - primera hora,
   - última hora,
   - suma de Total POS.
8. La app genera subtotales por:
   - City Name
   - Supervisor.
9. La app muestra la tabla jerárquica final.

---

## 9. Modelo de datos sugerido

```ts
interface AttendanceRawRow {
  fecha: string | Date;
  supervisor: string;
  cityName: string;
  auditorName: string;
  totalPos: number;
  numero: number;
  taskDateTime?: string | Date;
}
```

```ts
interface AttendanceAuditorRow {
  fecha: string;
  supervisor: string;
  cityName: string;
  auditorName: string;
  horaPrimeraTarea: string;
  horaUltimaTarea: string;
  posRecolectados: number;
}
```

```ts
interface AttendanceCityGroup {
  cityName: string;
  auditors: AttendanceAuditorRow[];
  subtotalPos: number;
}
```

```ts
interface AttendanceSupervisorGroup {
  supervisor: string;
  cities: AttendanceCityGroup[];
  subtotalPos: number;
}
```

---

## 10. Normalización recomendada

La app debe normalizar:

- fechas,
- nombres de supervisor,
- nombres de ciudad,
- nombres de auditor.

### Reglas mínimas
- trim,
- eliminar dobles espacios,
- homogeneizar mayúsculas/minúsculas si conviene,
- evitar valores vacíos.

### Ejemplo
- `" santa cruz "` → `Santa Cruz`
- `"JUAN PEREZ"` → `Juan Perez`

---

## 11. Cálculos

## 11.1 POS recolectados por auditor
```ts
posRecolectados = sum(rows.map(r => r.totalPos))
```

## 11.2 Hora primera tarea
```ts
horaPrimeraTarea = rowsWithTime.length
  ? min(rowsWithTime.map(r => r.taskDateTime))
  : "N/D"
```

## 11.3 Hora última tarea
```ts
horaUltimaTarea = rowsWithTime.length
  ? max(rowsWithTime.map(r => r.taskDateTime))
  : "N/D"
```

## 11.4 Subtotal por ciudad
```ts
subtotalCiudad = sum(auditors.map(a => a.posRecolectados))
```

## 11.5 Subtotal por supervisor
```ts
subtotalSupervisor = sum(cities.map(c => c.subtotalPos))
```

---

## 12. Estructura visual recomendada

## Encabezado
- título: `Tabla de asistencia`
- descripción breve
- fecha seleccionada
- cantidad de registros procesados

## Panel de control
- carga de archivo
- selector de fecha
- indicador de columnas detectadas
- botón recalcular
- botón limpiar

## Tabla principal
Vista jerárquica tipo pivot con:

- grupo Supervisor
- grupo City Name
- detalle Auditor Name
- hora primera tarea
- hora última tarea
- POS recolectados

## Subtotales visibles
- subtotal por ciudad
- subtotal por supervisor
- total general opcional

---

## 13. Requisitos UX

La tabla debe ser clara y fácil de leer, incluso con muchos registros.

### Recomendaciones
- filas expandibles/colapsables,
- indentación visual por nivel,
- subtotales resaltados,
- columna POS alineada a la derecha,
- fecha visible arriba,
- exportación simple.

### Orden requerido
- Fecha ascendente
- Supervisor ascendente
- City Name ascendente
- Auditor Name ascendente
- Hora Primera tarea ascendente
- Hora Última tarea ascendente

---

## 14. Estado global con Zustand

```ts
interface AttendanceStore {
  rawRows: AttendanceRawRow[];
  availableDates: string[];
  selectedDate: string | null;
  processedGroups: AttendanceSupervisorGroup[];
  loadExcelFile: (file: File) => Promise<void>;
  setSelectedDate: (date: string) => void;
  processAttendanceTable: () => void;
  resetAttendance: () => void;
}
```

---

## 15. Validaciones

La app debe validar:

- que el archivo fue cargado,
- que exista una columna equivalente a `Fecha`,
- que exista una columna equivalente a `Supervisor`,
- que exista una columna equivalente a `City Name`,
- que exista una columna equivalente a `Auditor Name`,
- que exista una columna equivalente a `Total POS`,
- que exista una columna equivalente a `N°`.

### Regla si falta la columna temporal
No bloquear la tabla. Solo mostrar `N/D` en horas.

### Regla si falta una columna crítica
Bloquear el procesamiento y mostrar error claro.

---

## 16. Casos límite

## Caso 1 — No hay registros para la fecha
Mostrar tabla vacía con mensaje:
- `No existen registros para la fecha seleccionada.`

## Caso 2 — Todos los N° son 0
Mostrar:
- `No hay registros válidos después del filtro N° != 0.`

## Caso 3 — No existe columna de hora
Permitir cálculo solo de POS.
Horas:
- `N/D`

## Caso 4 — Auditor con un solo registro
- Hora primera tarea = hora última tarea

## Caso 5 — Valores nulos en Supervisor o Auditor
Usar fallback:
- `Sin Supervisor`
- `Sin Auditor`

---

## 17. Exportación

La tabla debe permitir:

- exportar a Excel,
- exportar a CSV,
- copiar la vista actual.

La exportación debe incluir:
- fecha seleccionada,
- detalle por auditor,
- subtotales por ciudad,
- subtotales por supervisor.

---

## 18. Estructura de carpetas sugerida

```txt
src/
  features/
    resultados/
      components/
        attendance-date-filter.tsx
        attendance-table.tsx
        attendance-summary.tsx
      lib/
        attendance-parser.ts
        attendance-grouping.ts
        attendance-formatters.ts
      store/
        use-results-store.ts
      types/
        results.types.ts
```

---

## 19. Implementación esperada para Codex

Codex debe:

1. trabajar sobre el proyecto actual, no crear uno nuevo;
2. integrar esta tabla dentro del módulo general de resultados;
3. reutilizar store, utilidades y componentes donde tenga sentido;
4. separar:
   - parsing del Excel,
   - filtrado,
   - agrupación,
   - renderizado;
5. usar TypeScript estricto;
6. mantener la arquitectura preparada para convivir con las otras 2 tablas.

---

## 20. Nota final para Codex

Esta tercera tabla debe comportarse como una **tabla dinámica de asistencia** centrada en una única fecha visible, replicando la lógica de Excel indicada por el usuario:

- filtro por `N° != 0`,
- una fecha a la vez,
- agrupación jerárquica:
  - Fecha
  - Supervisor
  - City Name
  - Auditor Name
  - Hora Primera tarea
  - Hora Última tarea
- valor:
  - POS recolectados

Debe priorizar claridad operativa, lectura rápida y subtotales visibles.
