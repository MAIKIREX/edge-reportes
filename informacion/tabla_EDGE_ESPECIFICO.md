## Modificación de la tabla **Tablero Operativo de Proyección**

---

# 1. Objetivo

Modificar el comportamiento de la tabla **Tablero Operativo de Proyección** ubicada en la pestaña:

```
Proyección
```

La tabla debe mostrar **exactamente las siguientes columnas en este orden**:

| Col | Campo                   |
| --- | ----------------------- |
| A   | Area                    |
| B   | City Name               |
| C   | AVANCE + QC             |
| D   | MO                      |
| E   | Dias Faltantes          |
| F   | Prom Gestor             |
| G   | Gestores Ayer           |
| H   | Proyección              |
| I   | Error Real (%)          |
| J   | Con Error REAL          |
| K   | Proy Gestores           |
| L   | Gestores FALTANTES      |
| M   | Proyección              |
| N   | OBJ diario              |
| O   | OBJ diario x Gestor     |
| P   | OBJ diario + Error      |
| Q   | OBJ diario x Gestor     |
| R   | Días para el Objetivo   |
| S   | Fecha (Aprox) de cierre |
| T   | %                       |
| U   | FALTANTES TOTAL         |

---

# 2. Fuente de datos base

Los registros base de la tabla deben construirse a partir de la tabla **Configuracion por Ciudad**:

```
City Name
MO
```

Cada fila de esta configuración generará **una fila en la tabla final**.

---

# 3. Campo Area

El campo **Area** se obtiene mediante un mapeo basado en el valor de **City Name**.

### Regla

Aplicar el siguiente mapeo:

| City Name               | Area         |
| ----------------------- | ------------ |
| COBIJA                  | COBIJA       |
| COCHABAMBA              | COCHABAMBA   |
| QUILLACOLLO             | COCHABAMBA   |
| SIPE SIPE               | COCHABAMBA   |
| VINTO                   | COCHABAMBA   |
| COLCAPIRHUA             | COCHABAMBA   |
| TIQUIPAYA               | COCHABAMBA   |
| SACABA                  | COCHABAMBA   |
| ACHOCALLA               | LA PAZ       |
| EL ALTO                 | EL ALTO      |
| LA PAZ                  | LA PAZ       |
| VIACHA                  | EL ALTO      |
| ORURO                   | ORURO        |
| POTOSI                  | POTOSI       |
| PUNATA                  | COCHABAMBA   |
| SAN BORJA               | SAN BORJA    |
| SUCRE                   | SUCRE        |
| TRINIDAD                | TRINIDAD     |
| LLALLAGUA               | ORURO        |
| TUPIZA                  | TUPIZA       |
| TARIJA                  | TARIJA       |
| RIBERALTA               | RIBERALTA    |
| GUAYARAMERIN            | GUAYARAMERIN |
| SANTA CRUZ DE LA SIERRA | SANTA CRUZ   |
| LA GUARDIA              | SANTA CRUZ   |
| EL TORNO                | SANTA CRUZ   |
| COTOCA                  | SANTA CRUZ   |
| PAILON                  | SANTA CRUZ   |
| WARNES                  | SANTA CRUZ   |
| MONTERO                 | SANTA CRUZ   |
| YAPACANI                | SANTA CRUZ   |

Ejemplo:

```
City Name = EL TORNO
Area = SANTA CRUZ
```

---

# 4. AVANCE + QC

Este valor se obtiene de la tabla:

```
EDGE general → Tabla 3 - Calculo Edge por ciudad
```

Campo a usar:

```
Total Edge
```

Relación:

```
City Name actual == City Name de Tabla 3
```

Si no existe coincidencia:

```
AVANCE + QC = 0
```

---

# 5. Cálculos de fechas (lógica común)

Los cálculos de fechas deben utilizar estas variables globales.

## Variables

```
fechaInicio
fechaFin
hoy
```

---

# Conteos de días

## Domingos del periodo

```
domingosPeriodo = countWeekday(fechaInicio, fechaFin, domingo)
```

## Sábados del periodo

```
sabadosPeriodo = countWeekday(fechaInicio, fechaFin, sabado)
sabadosPeriodo = sabadosPeriodo * 0.5
```

---

## Domingos transcurridos

```
domingosPasados = countWeekday(fechaInicio, hoy, domingo)
```

---

## Sábados transcurridos

```
sabadosPasados = countWeekday(fechaInicio, hoy, sabado)
sabadosPasados = sabadosPasados * 0.5
```

---

# Descansos

Se obtienen desde la **configuración de ciudades**.

Si existen múltiples valores de descansos para una ciudad:

```
descansos = promedio(descansos)
```

Ejemplo:

```
COCHABAMBA → [1,2]

descansos = (1+2)/2 = 1.5
```

---

# 6. Dias Faltantes

Representa los **días laborales restantes del periodo**.

### Paso 1 — días laborales totales

```
diasLaboralesPeriodo =
(fechaFin - fechaInicio)
- domingosPeriodo
- sabadosPeriodo
- descansos
```

---

### Paso 2 — días laborales ya transcurridos

```
diasLaboralesTranscurridos =
(hoy - fechaInicio)
- domingosPasados
- sabadosPasados
- descansos
```

---

### Fórmula final

```
Dias Faltantes =
diasLaboralesPeriodo - diasLaboralesTranscurridos
```

Restricciones:

```
Si Dias Faltantes < 0 → usar 0
```

---

# 7. Prom Gestor

Promedio de gestores activos en la ciudad.

## Variables

```
m = cantidad de registros de la ciudad en la tabla "Tabla de Datos Combinados"
n = suma de Total POS de esa ciudad
```

---

## Fórmula

```
Prom Gestor = n / m
```

Reglas:

```
Si m = 0 → resultado = 0
Si resultado = 0 → mostrar 4
```

Equivalente Excel:

```
=SI(SI(m=0;0;(n/m))=0;4;SI(m=0;0;(n/m)))
```

---

# 8. Gestores Ayer

Número de auditores distintos que trabajaron ayer.

### Procedimiento

```
ayer = hoy - 1
```

Filtrar tabla:

```
Tabla de Datos Combinados
```

Condición:

```
fecha = ayer
city = ciudad actual
```

Contar:

```
distinct(Name Auditor)
```

Resultado:

```
Gestores Ayer
```

---

# 9. Proyección (columna H)

```
Proyección =
((AVANCE + QC) + (Dias Faltantes * Prom Gestor * Gestores Ayer)) - MO
```

---

# 10. Error Real (%)

Fuente:

```
EDGE general → Tabla 1 - Resumen de errores por ciudad
```

Campo:

```
Promedio de error
```

Relación:

```
City Name
```

Si no existe valor:

```
Error Real (%) = 0
```

---

# 11. Con Error REAL

```
Si Proyección > 0

Con Error REAL =
Proyección * ((100 - Error Real)/100)

Si Proyección <= 0

Con Error REAL =
Proyección * ((100 + Error Real)/100)
```

---

# 12. Proy Gestores

```
Proy Gestores =
(Con Error REAL / Prom Gestor) / (Dias Faltantes - 2)
```

---

# 13. Gestores FALTANTES

```
Si Proy Gestores < 0

Gestores FALTANTES =
ceil(abs((Con Error REAL / Prom Gestor) / (Dias Faltantes - 2)))

Si no

0
```

---

# 14. Proyección (columna M)

```
Proyección =
((MO + Con Error REAL) * 100) / MO
```

---

# 15. OBJ diario

```
OBJ diario =
Si AVANCE + QC > MO

0

Si no

(MO - AVANCE + QC) / Dias Faltantes
```

---

# 16. OBJ diario x Gestor

```
Si Gestores Ayer = 0

OBJ diario

Si no

OBJ diario / Gestores Ayer
```

---

# 17. OBJ diario + Error

```
Si Error Real = 0

OBJ diario

Si no

OBJ diario + (OBJ diario / Error Real)
```

---

# 18. OBJ diario x Gestor (con error)

```
Si Gestores Ayer = 0

OBJ diario + Error

Si no

(OBJ diario + Error) / Gestores Ayer
```

---

# 19. Días para el Objetivo

```
Si MO - AVANCE + QC <= 5

"Acabado"

Si Gestores Ayer = 0

"Sin Avance"

Si no

ceil((MO - AVANCE + QC) / (Prom Gestor * Gestores Ayer))
```

---

# 20. Fecha aproximada de cierre

Calcular:

```
domingosFaltantes =
domingos(fechaInicio → fechaCierre)
-
domingos(fechaInicio → hoy)
```

Fórmula:

```
Si R = "Acabado"
"Cerrado"

Si R = "Sin Avance"
"Sin Avance"

Si hoy + R > fechaFin
"NO CIERRA"

Si no
hoy + R + domingosFaltantes
```

---

# 21. %

```
% = (AVANCE + QC * 100 / MO)
```

Mostrar con 2 decimales.

---

# 22. FALTANTES TOTAL

```
FALTANTES TOTAL = MO - (AVANCE + QC)
```

---

# Reglas generales

1. Validar divisiones por cero.
2. Validar ciudades inexistentes.
3. Validar fechas inválidas.
4. Todos los cálculos deben ser dinámicos.
5. No usar valores hardcodeados.

---

💡 Si quieres, puedo **convertirte todo esto en una especificación ultra clara para Codex con pseudocódigo y funciones TypeScript**, lo que reduce muchísimo los errores de implementación.
