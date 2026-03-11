A continuación tienes un **reporte técnico específico** de los campos solicitados de la hoja **EDGE**:

**S, T, U, V, X y Z**.

El objetivo es explicar **qué calcula cada columna, la lógica de la fórmula y cómo se interpreta en el reporte operativo**.

---

# Reporte de Funcionamiento

---

# 1️⃣ Columna **S — Rechazados Totales**

## Función

Esta columna calcula el **total de formularios rechazados** que tiene un encuestador o registro.

Se obtiene sumando:

* formularios **parcialmente rechazados**
* formularios **rechazados completamente**

## Fórmula típica

```excel
=I34 + J34
```

Donde:

| Columna | Significado            |
| ------- | ---------------------- |
| I       | Partially Rejected POS |
| J       | Rejected POS           |

## Ejemplo

| Parcialmente rechazados | Rechazados | Total |
| ----------------------- | ---------- | ----- |
| 2                       | 3          | 5     |

Interpretación:

El encuestador tiene **5 formularios con rechazo o corrección requerida**.

---

# 2️⃣ Columna **T — Porcentaje de Rechazados**

## Función

Calcula el **porcentaje de formularios rechazados respecto al total realizado**.

Este indicador mide la **calidad del trabajo de campo**.

## Fórmula

```excel
=S34 / G34
```

Donde:

| Columna | Significado                        |
| ------- | ---------------------------------- |
| S       | Total rechazados                   |
| G       | Total POS (formularios realizados) |

## Ejemplo

| Total formularios | Rechazados | % rechazo |
| ----------------- | ---------- | --------- |
| 20                | 4          | 20%       |

Interpretación:

El **20% del trabajo fue rechazado por control de calidad**.

---

# 3️⃣ Columna **U — Porcentaje de Aprobados**

## Función

Calcula el **porcentaje de formularios aprobados**.

Este es uno de los indicadores principales de desempeño del encuestador.

## Fórmula

```excel
=H34 / G34
```

Donde:

| Columna | Significado  |
| ------- | ------------ |
| H       | Approved POS |
| G       | Total POS    |

## Ejemplo

| Aprobados | Total | %   |
| --------- | ----- | --- |
| 18        | 20    | 90% |

Interpretación:

El encuestador tiene **90% de aprobación en sus encuestas**.

---

# 4️⃣ Columna **V — Porcentaje de Ajustes**

## Función

Calcula el **porcentaje de formularios parcialmente rechazados**, es decir, encuestas que requieren corrección.

## Fórmula

```excel
=I34 / G34
```

Donde:

| Columna | Significado        |
| ------- | ------------------ |
| I       | Partially Rejected |
| G       | Total POS          |

## Ejemplo

| Ajustes | Total | %   |
| ------- | ----- | --- |
| 3       | 20    | 15% |

Interpretación:

El **15% de los formularios requieren corrección**.

---

# 5️⃣ Columna **X — Ciudad Simplificada**

## Función

Esta columna **normaliza o agrupa ciudades** en categorías más simples.

Sirve para:

* generar **reportes regionales**
* evitar variaciones en nombres de ciudades
* agrupar municipios cercanos bajo una misma región

---

## Fórmula utilizada

```excel
=IFS(
F34="Cobija"; "COBIJA";
F34="Cochabamba"; "COCHABAMBA";
F34="QUILLACOLLO"; "COCHABAMBA";
F34="COLCAPIRHUA"; "COCHABAMBA";
F34="VINTO"; "COCHABAMBA";
F34="TIQUIPAYA"; "COCHABAMBA";
F34="SIPE SIPE"; "COCHABAMBA";
F34="SACABA"; "COCHABAMBA";
F34="Guayaramerin"; "GUAYARAMERIN";
F34="La Paz"; "LA PAZ";
F34="EL ALTO"; "EL ALTO";
F34="VIACHA"; "EL ALTO";
F34="ACHOCALLA"; "LA PAZ";
F34="LLALLAGUA"; "ORURO";
F34="Oruro"; "ORURO";
F34="Potosi"; "POTOSI";
F34="PUNATA"; "COCHABAMBA";
F34="Riberalta"; "RIBERALTA";
F34="San Borja"; "SAN BORJA";
F34="MONTERO"; "SANTA CRUZ";
F34="SANTA CRUZ DE LA SIERRA"; "SANTA CRUZ";
F34="WARNES"; "SANTA CRUZ";
F34="PAILON"; "SANTA CRUZ";
F34="LA GUARDIA"; "SANTA CRUZ";
F34="COTOCA"; "SANTA CRUZ";
F34="EL TORNO"; "SANTA CRUZ";
F34="SUCRE"; "SUCRE";
F34="TARIJA"; "TARIJA";
F34="Trinidad"; "TRINIDAD";
F34="Tupiza"; "TUPIZA";
F34="Yapacani"; "SANTA CRUZ";
VERDADERO; "Otro"
)
```

---

## Cómo funciona la fórmula

La función **IFS** evalúa múltiples condiciones.

Formato:

```excel
IFS(condición1; resultado1; condición2; resultado2; ...)
```

La fórmula:

1. lee el valor de la columna **F** (ciudad original)
2. lo compara con una lista de ciudades
3. devuelve una **región normalizada**

---

## Ejemplos

| Ciudad original (F) | Resultado (X) |
| ------------------- | ------------- |
| QUILLACOLLO         | COCHABAMBA    |
| SACABA              | COCHABAMBA    |
| VIACHA              | EL ALTO       |
| WARNES              | SANTA CRUZ    |
| TARIJA              | TARIJA        |

---

## Caso por defecto

Si la ciudad no está en la lista:

```excel
VERDADERO; "Otro"
```

Se clasifica como:

```
Otro
```

---

# 6️⃣ Columna **Z — Tiempo Promedio por Encuesta**

## Función

Calcula el **tiempo promedio que tarda un encuestador en completar una encuesta**.

Sirve para medir:

* eficiencia del encuestador
* posibles encuestas fraudulentas (muy rápidas)
* encuestas mal realizadas (muy largas)

---

## Fórmula típica

```excel
=Q34 / G34
```

Donde:

| Columna | Significado                 |
| ------- | --------------------------- |
| Q       | Tiempo total en formularios |
| G       | Total formularios           |

---

## Ejemplo

| Tiempo total | Encuestas | Promedio |
| ------------ | --------- | -------- |
| 200 minutos  | 20        | 10 min   |

Interpretación:

Cada encuesta tarda **10 minutos en promedio**.

---

# Flujo funcional de estas columnas

```
Datos de encuestas
        │
        ▼
Control de calidad
S → Total rechazados
T → % rechazados
U → % aprobados
V → % ajustes
        │
        ▼
Clasificación geográfica
X → Ciudad simplificada
        │
        ▼
Análisis de eficiencia
Z → Tiempo promedio encuesta
```

---

# Conclusión

Las columnas **S, T, U, V, X y Z** cumplen tres funciones principales:

### 1️⃣ Control de calidad de encuestas

* S → Total rechazos
* T → % rechazados
* U → % aprobados
* V → % ajustes

### 2️⃣ Normalización geográfica

* X → Agrupación de ciudades para análisis regional

### 3️⃣ Medición de eficiencia

* Z → Tiempo promedio por encuesta
