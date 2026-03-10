# Especificación funcional y técnica — Página web para generar tabla tipo **GENERAL / apartado 4**

## 1) Objetivo del proyecto

Construir una **aplicación web solo frontend** que permita:

- cargar un archivo diario exportado desde la plataforma operativa, por ejemplo **“Desempeño de Usuarios por Día.xlsx”**;
- combinar ese archivo con una **configuración fija editable** por el usuario;
- calcular automáticamente una tabla equivalente a la del documento **GENERAL / apartado 4**;
- mostrar en pantalla los resultados de las **columnas A a la L** para cada ciudad;
- facilitar la visualización y análisis sin depender de hojas de Excel complejas o fórmulas dispersas.

La aplicación **no almacenará datos en servidor**. Todo el procesamiento será local en el navegador.

---

## 2) Alcance funcional

La aplicación debe permitir:

1. **Cargar archivo diario**
   - Subir un archivo Excel (`.xlsx`) con estructura similar a **Desempeño de Usuarios por Día**.
   - Leer sus filas localmente en el navegador.

2. **Gestionar configuración fija editable**
   - Definir parámetros por ciudad.
   - Definir reglas del periodo actual.
   - Ajustar días no laborables, descansos, metas y equivalencias.

3. **Procesar y calcular la tabla final**
   - Agrupar información por ciudad.
   - Calcular indicadores operativos y de avance.
   - Construir la tabla final con columnas A:L.

4. **Visualizar resultados**
   - Mostrar una tabla clara, ordenable y filtrable.
   - Aplicar colores o semáforos según desempeño.

5. **Exportar resultados**
   - Descargar la tabla final como Excel o CSV.
   - Opcional: exportar como PDF para compartir.

---

## 3) Restricción principal de arquitectura

Este proyecto será **solo frontend**, por lo tanto:

- no habrá backend;
- no habrá base de datos persistente en servidor;
- los archivos se procesarán en memoria o, como máximo, en almacenamiento local del navegador;
- toda la lógica de cálculo debe ejecutarse en el cliente.

### Implicaciones

- El archivo diario se procesará con una librería tipo `xlsx` o `exceljs`.
- La configuración fija podrá:
  - editarse en formularios dentro de la app;
  - importarse/exportarse como JSON;
  - guardarse opcionalmente en `localStorage` del navegador para no perderla entre sesiones.

---

## 4) Idea general del modelo de datos

La solución se basa en **dos fuentes**:

### Fuente A — Archivo diario
Es el archivo descargado desde la plataforma cada día.

Ejemplo detectado en el archivo de muestra:

- `Fecha`
- `Metropolitan Area`
- `City Name`
- `User ID`
- `Name Auditor`
- `Total POS`
- `Approved POS`
- `Partially Rejected POS`
- `Rejected POS`
- `En QC POS`
- `Incomplete POS`
- `Refusal POS`
- `Microzonas Visitadas`
- etc.

### Fuente B — Configuración fija editable
Es la configuración manual que el usuario ajusta según el mes, campaña o periodo.

Esta fuente debe definir, como mínimo:

- ciudades activas;
- meta total por ciudad (**MO**);
- fecha inicio del periodo;
- fecha fin del periodo;
- cantidad de descansos;
- regla de sábados;
- exclusión de domingos;
- equivalencias de nombres de ciudad;
- opcionalmente muestra, notas o ponderadores adicionales.

---

## 5) Qué representa la tabla final

La tabla final replica la lógica del documento **GENERAL / apartado 4**, especialmente las columnas de la **A a la L**.

## Columnas objetivo

- **A:** CIUDADES
- **B:** MO
- **C:** DÍAS EN EL MES
- **D:** OBJETIVO POR DÍA
- **E:** (reservada según lógica de negocio; si existe en el modelo original debe definirse explícitamente)
- **F:** AVANCE TOTAL (APROBADOS)
- **G:** AVANCE ESPERADO A HOY
- **H:** AVANCE GENERAL
- **I:** AVANCE ESPERADO RELATIVO
- **J:** DÉFICIT A HOY
- **K:** DÉFICIT GENERAL
- **L:** MUESTRA

> Nota importante: en la hoja analizada, el núcleo funcional se apoya con mucha claridad en A, B, C, D, F, G, H, I, J, K y L.  
> La columna E debe quedar parametrizada como “campo configurable/derivado” porque en algunas variantes del modelo puede existir como valor intermedio o visual, y en otras no ser crítica para el cálculo principal.

---

## 6) Propuesta de estructura visual de la aplicación

## Vista 1 — Carga de archivo diario

Controles:

- botón para subir Excel;
- resumen del archivo cargado;
- validación de columnas obligatorias;
- fecha máxima detectada en el archivo;
- cantidad de filas importadas;
- ciudades detectadas;
- auditor(es) detectados, si se desea.

## Vista 2 — Configuración fija

Sección editable con:

- periodo:
  - fecha inicio;
  - fecha fin;
  - fecha de corte “hoy”;
- reglas calendario:
  - contar domingos como no laborables: sí/no;
  - factor para sábado;
  - descansos por ciudad;
- metas por ciudad:
  - ciudad;
  - MO;
  - muestra;
  - alias o equivalencias de nombres;
  - activo/inactivo.

## Vista 3 — Resultados

Tabla final tipo dashboard con:

- una fila por ciudad;
- columnas A:L;
- totales al pie;
- colores condicionales;
- filtro por ciudad;
- opción de ordenar por:
  - mayor déficit;
  - mejor avance;
  - mayor MO;
  - peor cumplimiento.

## Vista 4 — Exportación

Acciones:

- exportar resultados a Excel;
- exportar resultados a CSV;
- opcional: imprimir o exportar a PDF.

---

## 7) Estructura recomendada del frontend

### Stack sugerido

- **Next.js** o **React**
- **TypeScript**
- **Tailwind CSS**
- **Shadcn/ui** o componentes equivalentes
- librería para Excel:
  - `xlsx` o
  - `exceljs`

### Estructura sugerida de carpetas

```txt
src/
  app/
    page.tsx
  components/
    upload/
      FileUploader.tsx
    config/
      ConfigPanel.tsx
      CityConfigTable.tsx
      PeriodConfigForm.tsx
    results/
      ResultsTable.tsx
      SummaryCards.tsx
      ExportButtons.tsx
  features/
    performance/
      parser.ts
      normalizer.ts
      calculators.ts
      validators.ts
      types.ts
      defaults.ts
  lib/
    storage.ts
    export.ts
```

---

## 8) Modelo de datos recomendado

## 8.1. Tipo para filas del archivo diario

```ts
type DailyRow = {
  fecha: string | Date
  metropolitanArea: string
  cityName: string
  userId: string
  auditorName: string
  totalPOS: number
  approvedPOS: number
  partiallyRejectedPOS: number
  rejectedPOS: number
  enQCPOS: number
  incompletePOS: number
  refusalPOS: number
  microzonasVisitadas?: number
}
```

## 8.2. Tipo para configuración por ciudad

```ts
type CityConfig = {
  cityId: string
  cityLabel: string
  aliases: string[]
  mo: number
  muestra?: number
  descansos?: number
  activo: boolean
}
```

## 8.3. Tipo para configuración global del periodo

```ts
type PeriodConfig = {
  startDate: string
  endDate: string
  todayCutoff: string
  excludeSundays: boolean
  saturdayFactor: number
}
```

## 8.4. Tipo para resultado final por ciudad

```ts
type CityResult = {
  ciudad: string
  mo: number
  diasEnMes: number
  objetivoPorDia: number
  columnaE?: number | string | null
  avanceTotal: number
  avanceEsperadoHoy: number
  avanceGeneral: number
  avanceEsperadoRelativo: number
  deficitHoy: number
  deficitGeneral: number
  muestra?: number
}
```

---

## 9) Relación entre las dos fuentes

## 9.1. Archivo diario → aporta datos reales de ejecución

Del archivo diario saldrá, principalmente:

- avance real por ciudad;
- acumulados por ciudad;
- aprobados por ciudad;
- opcionalmente otros estados operativos.

### Campo más importante del archivo diario

- `City Name`
- `Approved POS`
- `Fecha`

Estas tres columnas son esenciales para calcular el avance real y el corte temporal.

## 9.2. Configuración fija → aporta reglas de negocio

De la configuración fija saldrá:

- MO por ciudad;
- días laborables del periodo;
- descansos por ciudad;
- regla de sábados;
- fecha inicio y fin;
- equivalencias de nombres de ciudad;
- muestra por ciudad.

### Conclusión de la relación

**El archivo diario no basta por sí solo.**  
Sirve para el avance real, pero la lógica de la tabla final depende además de metas y reglas de calendario.

---

## 10) Normalización de ciudades

Este punto es obligatorio.

El archivo diario puede traer valores como:

- `COCHABAMBA`
- `COTOCA`
- `Santa Cruz De La Sierra`
- `ORURO`

La configuración debe permitir mapear múltiples alias a una sola ciudad operativa.

### Ejemplo

```json
[
  {
    "cityId": "santa_cruz",
    "cityLabel": "SANTA CRUZ",
    "aliases": ["SANTA CRUZ", "Santa Cruz De La Sierra", "SCZ"],
    "mo": 1200,
    "muestra": 300,
    "descansos": 1,
    "activo": true
  }
]
```

### Regla de normalización

1. Convertir a mayúsculas.
2. Eliminar tildes.
3. Recortar espacios.
4. Comparar contra alias definidos.
5. Si no se encuentra, marcar como ciudad no mapeada.

### Validación

La app debe advertir:

- qué ciudades del archivo no fueron mapeadas;
- cuántas filas quedaron fuera;
- permitir corregir alias desde la interfaz.

---

## 11) Definición detallada de cálculos

Este es el bloque más importante para Codex.

## 11.1. Columna A — CIUDADES

Valor textual correspondiente a la ciudad normalizada.

### Regla
Se toma desde la configuración fija (`cityLabel`) y no directamente del archivo crudo.

---

## 11.2. Columna B — MO

Meta operativa total de la ciudad para el periodo.

### Fuente
Configuración fija por ciudad.

### Regla
```txt
MO = configCiudad.mo
```

---

## 11.3. Columna C — DÍAS EN EL MES

Representa los **días efectivos de trabajo** del periodo para la ciudad.

No debe interpretarse como “cantidad de días calendario del mes” de forma simple.

### Variables necesarias

- `startDate`
- `endDate`
- `excludeSundays`
- `saturdayFactor`
- `descansos` por ciudad

### Fórmula conceptual

```txt
diasEnMes = diasBaseDelPeriodo - domingos - ajusteSabados - descansos
```

### Definiciones recomendadas

#### a) diasBaseDelPeriodo
Cantidad de días naturales entre `startDate` y `endDate`, incluyendo ambos extremos.

```txt
diasBaseDelPeriodo = diffDaysInclusive(startDate, endDate)
```

#### b) domingos
Si `excludeSundays = true`, contar cuántos domingos hay dentro del rango.

```txt
domingos = countWeekdayInRange(startDate, endDate, domingo)
```

#### c) ajusteSabados
Aquí debe existir una regla explícita configurable.

Ejemplo:

- si el sábado cuenta medio día:  
  `ajusteSabados = sabados * 0.5`
- si el sábado no cuenta:  
  `ajusteSabados = sabados * 1`
- si cuenta normal:  
  `ajusteSabados = 0`

La solución más flexible es usar un **factor sábado**:

```txt
valorLaborableSabado = saturdayFactor
ajusteSabados = sabados * (1 - valorLaborableSabado)
```

Ejemplos:
- `saturdayFactor = 1` → sábado cuenta completo
- `saturdayFactor = 0.5` → sábado cuenta medio
- `saturdayFactor = 0` → sábado no cuenta

#### d) descansos
Cantidad de días no laborables adicionales de esa ciudad.

```txt
descansos = configCiudad.descansos || 0
```

### Fórmula final sugerida

```txt
diasEnMes = diasBaseDelPeriodo
            - (excludeSundays ? domingos : 0)
            - (sabados * (1 - saturdayFactor))
            - descansos
```

### Restricciones
- nunca debe ser menor o igual a 0;
- si es 0 o negativo, se debe mostrar error de configuración.

---

## 11.4. Columna D — OBJETIVO POR DÍA

Cuánto debe producir la ciudad por día efectivo.

### Fórmula

```txt
objetivoPorDia = MO / diasEnMes
```

### Restricción
Si `diasEnMes <= 0`, no calcular y mostrar advertencia.

---

## 11.5. Columna E — Campo derivado configurable

Como esta columna no quedó cerrada operativamente en la definición actual, debe manejarse así:

### Opción recomendada
Definirla como **campo opcional de negocio**.

Ejemplos de uso posibles:
- diferencia porcentual,
- objetivo semanal,
- días transcurridos,
- factor de corrección,
- un campo solo visual del modelo original.

### Recomendación para Codex
Implementar la columna E como:

- visible si el usuario la activa;
- configurable por fórmula simple;
- o dejar placeholder hasta que se confirme su función exacta.

```ts
columnaE?: number | string | null
```

---

## 11.6. Columna F — AVANCE TOTAL (APROBADOS)

Es el avance real acumulado observado en el archivo diario.

### Fuente
Archivo diario.

### Regla base
Sumar `Approved POS` por ciudad normalizada.

```txt
avanceTotal = SUM(approvedPOS de filas de esa ciudad)
```

### Consideración importante
Se debe decidir si el archivo diario ya es:
- un acumulado hasta la fecha, o
- solo un extracto del día.

#### Recomendación por defecto
La app debe asumir que el archivo cargado representa el estado actual completo exportado desde la plataforma.  
En ese caso, `avanceTotal` es simplemente la suma actual de aprobados por ciudad en el archivo.

#### Si en el futuro el archivo fuera solo diario
Se requeriría consolidación histórica local, pero eso queda fuera del alcance de esta versión.

---

## 11.7. Columna G — AVANCE ESPERADO A HOY

Cuánto se debería haber logrado hasta la fecha de corte.

### Variables necesarias

- `todayCutoff`
- `startDate`
- `excludeSundays`
- `saturdayFactor`
- `descansos`
- `objetivoPorDia`

### Paso 1: calcular días efectivos transcurridos

```txt
diasTranscurridosBase = diffDaysInclusive(startDate, todayCutoff)
```

Luego aplicar la misma lógica de calendario, pero solo hasta `todayCutoff`:

```txt
diasEfectivosTranscurridos =
  diasTranscurridosBase
  - domingosTranscurridos
  - ajusteSabadosTranscurridos
  - descansosConsumidos
```

### Sobre descansos consumidos
Hay dos enfoques posibles:

#### Enfoque simple recomendado para esta versión
Asumir que los descansos se distribuyen dentro del periodo y se descuentan proporcionalmente solo al final del cálculo total, o permitir que el usuario los introduzca manualmente como “descansos ya ocurridos”.

La forma más sólida es agregar este campo opcional:

```ts
descansosTranscurridos?: number
```

Si no se define, se puede usar:
```txt
descansosConsumidos = 0
```

#### Enfoque avanzado
Calendario explícito con fechas de descanso exactas.

### Fórmula final recomendada

```txt
avanceEsperadoHoy = diasEfectivosTranscurridos * objetivoPorDia
```

### Restricciones
- no debe ser menor que 0;
- no debe superar el MO;
- debe redondearse según la política definida.

```txt
avanceEsperadoHoy = min(MO, max(0, diasEfectivosTranscurridos * objetivoPorDia))
```

---

## 11.8. Columna H — AVANCE GENERAL

Porcentaje real de avance sobre la meta total.

### Fórmula

```txt
avanceGeneral = avanceTotal / MO
```

### Formato recomendado
Porcentaje.

Ejemplo:
- `0.52` → `52.0%`

### Restricción
Si `MO = 0`, mostrar error de configuración.

---

## 11.9. Columna I — AVANCE ESPERADO RELATIVO

Porcentaje que se debería llevar a la fecha.

### Fórmula

```txt
avanceEsperadoRelativo = avanceEsperadoHoy / MO
```

### Formato recomendado
Porcentaje.

---

## 11.10. Columna J — DÉFICIT A HOY

Mide cuánto falta hoy para ir al ritmo esperado.

### Regla de negocio
Solo debe existir déficit si el avance esperado es mayor que el avance real.

### Fórmula

```txt
deficitHoy = max(0, avanceEsperadoHoy - avanceTotal)
```

### Interpretación
- `0` → no está atrasado al día de hoy;
- valor positivo → está por debajo del ritmo esperado.

---

## 11.11. Columna K — DÉFICIT GENERAL

Cuánto falta para cerrar completamente la meta del periodo.

### Fórmula

```txt
deficitGeneral = max(0, MO - avanceTotal)
```

### Interpretación
- `0` → meta alcanzada o superada;
- valor positivo → faltante para completar la meta total.

---

## 11.12. Columna L — MUESTRA

Campo auxiliar proveniente de configuración fija.

### Fuente
Configuración por ciudad.

### Regla
```txt
muestra = configCiudad.muestra || 0
```

### Nota
Si en el modelo original la muestra se calcula, puede evolucionar después.  
Para esta versión se recomienda manejarla como un valor configurable.

---

## 12) Funciones auxiliares necesarias

Codex debe implementar funciones puras y reutilizables.

## 12.1. Normalización de texto

```ts
normalizeText(value: string): string
```

Debe:
- pasar a mayúsculas;
- quitar tildes;
- colapsar espacios;
- trim.

## 12.2. Resolver ciudad por alias

```ts
resolveCity(rawCityName: string, cityConfigs: CityConfig[]): string | null
```

Debe devolver el `cityId` o `cityLabel` correspondiente.

## 12.3. Contar días dentro de un rango

```ts
countWeekdaysInRange(start: Date, end: Date, weekday: number): number
```

Ejemplo:
- domingo = 0
- sábado = 6

## 12.4. Diferencia inclusiva de días

```ts
diffDaysInclusive(start: Date, end: Date): number
```

## 12.5. Agregación por ciudad

```ts
aggregateDailyRowsByCity(rows: DailyRow[], cityConfigs: CityConfig[]): Map<string, AggregatedCityData>
```

Debe producir, al menos:

```ts
type AggregatedCityData = {
  ciudad: string
  approvedTotal: number
  totalPOSTotal: number
  rowCount: number
  fechasDetectadas: string[]
}
```

## 12.6. Cálculo final por ciudad

```ts
calculateCityResult(
  aggregatedData: AggregatedCityData,
  cityConfig: CityConfig,
  periodConfig: PeriodConfig
): CityResult
```

---

## 13) Flujo completo de procesamiento

1. El usuario sube el archivo Excel.
2. La app identifica la hoja válida.
3. La app valida encabezados mínimos.
4. La app convierte filas a `DailyRow`.
5. La app normaliza ciudades.
6. La app agrupa por ciudad.
7. La app toma configuración fija por ciudad.
8. La app calcula:
   - MO,
   - días en el mes,
   - objetivo por día,
   - avance total,
   - avance esperado,
   - porcentajes,
   - déficits,
   - muestra.
9. La app construye la tabla final.
10. La app muestra alertas si hay errores de mapeo o configuración.
11. La app permite exportar el resultado.

---

## 14) Validaciones obligatorias

## 14.1. Del archivo diario

La aplicación debe validar que existan las columnas mínimas:

- `Fecha`
- `City Name`
- `Approved POS`

Recomendadas:
- `Total POS`
- `Name Auditor`
- `User ID`

### Si faltan columnas
Debe mostrarse un error claro indicando cuáles faltan.

---

## 14.2. De configuración fija

Por cada ciudad activa debe existir:

- nombre de ciudad;
- MO;
- alias válidos;
- estado activo.

Opcionales:
- muestra;
- descansos.

### Reglas
- `MO > 0`
- `diasEnMes > 0`
- alias sin duplicados conflictivos
- una misma ciudad del archivo no puede mapear a dos ciudades diferentes

---

## 14.3. Del periodo

- `startDate <= todayCutoff <= endDate`
- `saturdayFactor` debe estar entre `0` y `1`
- fechas válidas

---

## 15) Manejo de errores y advertencias

La app debe mostrar advertencias no bloqueantes cuando:

- existan ciudades sin mapear;
- existan filas con `Approved POS` vacío o inválido;
- haya ciudades activas sin datos en el archivo;
- el archivo tenga varias hojas y no se identifique claramente la correcta.

Debe bloquear el cálculo cuando:

- falten columnas mínimas;
- no exista configuración válida;
- `startDate`, `endDate` o `todayCutoff` sean inconsistentes;
- alguna ciudad tenga `MO <= 0`;
- `diasEnMes <= 0`.

---

## 16) Consideraciones de UX

La tabla debe ser mucho más clara que el Excel original.

### Recomendaciones

- cabecera fija;
- ordenación por columnas;
- búsqueda por ciudad;
- indicadores visuales:
  - verde: `avanceGeneral >= avanceEsperadoRelativo`
  - amarillo: diferencia pequeña
  - rojo: retraso importante
- tarjetas resumen arriba:
  - total MO;
  - total aprobados;
  - total esperado a hoy;
  - déficit total;
  - % global de avance.

---

## 17) Totales globales

Además de la tabla por ciudad, la app debe calcular una fila total.

### Fórmulas sugeridas

```txt
MO_total = suma(MO)
avanceTotal_global = suma(avanceTotal)
avanceEsperadoHoy_global = suma(avanceEsperadoHoy)
deficitHoy_global = suma(deficitHoy)
deficitGeneral_global = suma(deficitGeneral)
avanceGeneral_global = avanceTotal_global / MO_total
avanceEsperadoRelativo_global = avanceEsperadoHoy_global / MO_total
```

---

## 18) Política de redondeo

Para evitar diferencias visuales con Excel, debe definirse una política consistente.

### Recomendación

- `MO`: entero
- `Días en el mes`: permitir decimal si el sábado pesa medio día
- `Objetivo por día`: 2 decimales
- `Avance total`: entero
- `Avance esperado a hoy`: 2 decimales o entero redondeado, según preferencia del usuario
- `%`: 1 o 2 decimales

### Recomendación por defecto
- números absolutos: 2 decimales si derivan de cálculos;
- porcentajes: 1 decimal.

---

## 19) Configuración persistente local

Aunque el proyecto no guardará datos en servidor, es recomendable guardar la configuración en el navegador.

### Qué guardar en `localStorage`

- configuración de ciudades;
- configuración del periodo;
- alias de ciudades;
- preferencia de redondeo;
- visibilidad de columna E.

### Qué no guardar
- archivo diario completo;
- resultados pesados;
- datos sensibles del origen si no es necesario.

---

## 20) Importar y exportar configuración

La app debe permitir:

### Importar JSON de configuración
Para cargar:
- ciudades,
- metas,
- alias,
- descansos,
- reglas del periodo.

### Exportar JSON de configuración
Para reutilizarla el siguiente mes o compartirla.

### Ejemplo de estructura JSON

```json
{
  "periodConfig": {
    "startDate": "2026-03-01",
    "endDate": "2026-03-31",
    "todayCutoff": "2026-03-09",
    "excludeSundays": true,
    "saturdayFactor": 0.5
  },
  "cities": [
    {
      "cityId": "cochabamba",
      "cityLabel": "COCHABAMBA",
      "aliases": ["COCHABAMBA"],
      "mo": 2289,
      "muestra": 300,
      "descansos": 1,
      "activo": true
    }
  ]
}
```

---

## 21) Reglas de compatibilidad con el archivo diario

Como el archivo diario puede variar, Codex debe diseñar el parser de forma tolerante.

### Estrategias recomendadas

- buscar encabezados por nombre normalizado, no solo por posición;
- soportar diferencias menores como:
  - `Approved POS`
  - `ApprovedPOS`
  - `Approved Pos`
- permitir seleccionar hoja si hay varias;
- mostrar preview de primeras filas antes de confirmar.

---

## 22) Casos límite que deben contemplarse

1. Ciudad activa con MO, pero sin ninguna fila en el archivo:
   - `avanceTotal = 0`

2. Ciudad en archivo, pero sin configuración:
   - advertencia de ciudad no mapeada

3. Archivo con varias fechas:
   - usar todo el archivo como estado actual
   - detectar fecha máxima para mostrar referencia

4. Archivo vacío:
   - bloquear cálculo

5. `MO = 0`:
   - bloquear o marcar error grave

6. `todayCutoff` fuera del rango:
   - bloquear cálculo

7. `avanceTotal > MO`:
   - permitido
   - `deficitGeneral = 0`
   - `avanceGeneral > 100%`

8. `avanceEsperadoHoy > MO`:
   - recortar a `MO`

---

## 23) Fórmulas resumidas para implementación

```txt
A ciudad = cityLabel

B MO = config.mo

C diasEnMes =
  diasBasePeriodo
  - domingos
  - (sabados * (1 - saturdayFactor))
  - descansos

D objetivoPorDia = MO / diasEnMes

E columnaE = configurable / opcional

F avanceTotal = suma(Approved POS por ciudad)

G avanceEsperadoHoy =
  min(MO, diasEfectivosTranscurridos * objetivoPorDia)

H avanceGeneral = avanceTotal / MO

I avanceEsperadoRelativo = avanceEsperadoHoy / MO

J deficitHoy = max(0, avanceEsperadoHoy - avanceTotal)

K deficitGeneral = max(0, MO - avanceTotal)

L muestra = config.muestra
```

---

## 24) Requisito de mantenibilidad

Codex debe evitar lógica acoplada directamente a la UI.

### Recomendación

Separar claramente:

- parser de Excel;
- normalización;
- agregación;
- reglas de calendario;
- fórmulas de negocio;
- presentación visual.

Esto permitirá:

- cambiar formato de entrada sin reescribir la UI;
- validar cálculos por pruebas unitarias;
- adaptar la tabla a nuevos periodos o campañas.

---

## 25) Requisito de testing

Se recomienda que Codex genere pruebas unitarias para:

- `normalizeText`
- `resolveCity`
- `diffDaysInclusive`
- `countWeekdaysInRange`
- `calculateDiasEnMes`
- `calculateAvanceEsperadoHoy`
- `calculateCityResult`

### Casos de prueba mínimos

- mes con 4 domingos y sábados a medio día;
- ciudad con 0 descansos;
- ciudad con descansos;
- ciudad sin datos en archivo;
- ciudad con avance superior al esperado;
- ciudad con avance superior a la meta.

---

## 26) MVP mínimo viable

La primera versión debe incluir sí o sí:

1. carga del Excel diario;
2. configuración editable por ciudad;
3. configuración del periodo;
4. cálculo de columnas A:L;
5. tabla de resultados;
6. exportación a CSV o Excel;
7. guardado local de configuración.

---

## 27) Mejoras futuras sugeridas

No son obligatorias para el MVP, pero conviene dejarlas previstas.

- múltiples archivos diarios;
- histórico local por fechas;
- comparación entre días;
- gráficos por ciudad;
- ranking de ciudades;
- alertas automáticas;
- importación de configuración mensual desde plantilla;
- soporte para varias campañas o proyectos.

---

## 28) Instrucción final para implementación por Codex

Codex debe construir una aplicación frontend que:

- procese un Excel diario localmente;
- use una configuración fija editable;
- calcule una tabla operativa por ciudad;
- replique de forma clara la lógica del documento GENERAL / apartado 4;
- haga los cálculos mediante funciones puras y comprobables;
- no dependa de backend;
- esté preparada para cambios mensuales de configuración;
- priorice claridad visual, validaciones fuertes y facilidad de uso.

La meta no es copiar el Excel tal cual, sino **reproducir su lógica de negocio de forma más limpia, mantenible y visualmente clara**.
