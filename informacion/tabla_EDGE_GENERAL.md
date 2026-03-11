## Objetivo

Modificar el comportamiento de la tabla **“Tabla General de Desempeño”** que se encuentra en la pestaña **“General”**.

La tabla debe mostrar exactamente estos campos, en este orden:

1. **Ciudades**
2. **MO**
3. **Días En el Mes**
4. **Objetivo por día**
5. **Avance total (APROBADOS)**
6. **AVANCE ESPERADO a hoy 1**
7. **AVANCE GENERAL**
8. **AVANCE ESPERADO a hoy 2**
9. **Deficit a Hoy**
10. **Déficit general (mes)**
11. **Muestra**

---

# Fuente de datos

Los datos de referencia para esta tabla deben salir de la pestaña:

```text
EDGE general
```

Y específicamente de estas tablas:

* **Datos necesarios EDGE genera**
* **Total Edge por ciudad simplificada**
* **Configuración** o la sección donde existan los campos:

  * `CIUDADES SIMPLIFICADO`
  * `Descansos`

---

# Estructura base de la tabla

## 1. Ciudades

Este campo debe venir directamente desde la tabla:

```text
Datos necesarios EDGE genera
```

Tomar el valor tal como está.

---

## 2. MO

Este campo también debe venir directamente desde la tabla:

```text
Datos necesarios EDGE genera
```

Tomar el valor tal como está y asociarlo a la misma fila de la ciudad correspondiente.

---

# Reglas de cálculo

## 3. Días En el Mes

Este campo representa los **días efectivos de trabajo del periodo**.

### Fórmula conceptual

```text
Días En el Mes = diasBaseDelPeriodo - domingos - sabados - descansos
```

---

## Definiciones

### a) diasBaseDelPeriodo

Cantidad de días naturales entre la **fecha de inicio** y la **fecha de fin**, incluyendo ambos extremos.

```text
diasBaseDelPeriodo = diffDaysInclusive(startDate, endDate)
```

---

### b) domingos

Cantidad de domingos dentro del rango:

```text
startDate → endDate
```

```text
domingos = countWeekdayInRange(startDate, endDate, domingo)
```

---

### c) sabados

Cantidad de sábados dentro del rango:

```text
startDate → endDate
```

Primero calcular:

```text
sabadosp1 = countWeekdayInRange(startDate, endDate, sabado)
```

Luego aplicar el ajuste:

```text
sabados = sabadosp1 * 0.5
```

---

### d) descansos

Los descansos no se toman de una sola fila fija.
Se deben calcular como el **promedio de descansos** de la sección de configuración, agrupando por ciudad simplificada.

### Regla de búsqueda

Comparar:

* el campo **Ciudades** de la tabla actual
  con
* el campo **CIUDADES SIMPLIFICADO** de la configuración

### Ejemplo

Si en configuración existen estas filas:

```text
COCHABAMBA / 1
COCHABAMBA / 2
```

Entonces:

```text
descansos = (1 + 2) / 2 = 1.5
```

### Regla

Para la ciudad actual:

```text
descansos = promedio de todos los valores "Descansos"
donde "CIUDADES SIMPLIFICADO" sea igual a "Ciudades"
```

Si no existen registros para esa ciudad, usar:

```text
descansos = 0
```

---

## Fórmula final de Días En el Mes

```text
Días En el Mes = diasBaseDelPeriodo - domingos - sabados - descansos
```

### Restricciones

* nunca debe ser menor o igual a 0
* si el resultado es 0 o negativo, mostrar **error de configuración**
* evitar dividir entre cero en cálculos posteriores

---

## 4. Objetivo por día

Representa cuánto debe producir la ciudad por cada día efectivo de trabajo.

### Fórmula

```text
Objetivo por día = MO / Días En el Mes
```

---

## 5. Avance total (APROBADOS)

Este campo debe venir de la tabla:

```text
Total Edge por ciudad simplificada
```

Tomar el valor del campo:

```text
Total Edge
```

haciendo match por ciudad con el campo:

```text
Ciudad Simplificado
```

de esa tabla, comparándolo contra el campo:

```text
Ciudades
```

de la tabla actual.

### Regla

* si existe coincidencia, usar el valor de `Total Edge`
* si no existe coincidencia, mostrar `0`

---

## 6. AVANCE ESPERADO a hoy 1

Este valor representa cuánto debería haberse avanzado hasta la fecha actual.

### Cálculos previos

#### DOMINGOS PASADOS

Cantidad de domingos transcurridos en el rango:

```text
fechaInicio → hoy
```

```text
domingosPasados = countWeekdayInRange(startDate, hoy, domingo)
```

#### SABADOS PASADOS

Cantidad de sábados transcurridos en el rango:

```text
fechaInicio → hoy
```

Aplicar el mismo criterio que en el cálculo mensual:

```text
sabadosPasados = countWeekdayInRange(fechaInicio, hoy, sabado) * 0.5
```

#### Descansos

Usar el mismo valor calculado previamente para esa ciudad.

---

### Variable intermedia

Calcular:

```text
diasEfectivosTranscurridos = hoy - fechaInicio - domingosPasados - sabadosPasados - descansos
```

Asegurarse de no permitir valores negativos.

---

### Fórmula final

```text
AVANCE ESPERADO a hoy 1 = min(MO, max(0, diasEfectivosTranscurridos * Objetivo por día))
```

---

## 7. AVANCE GENERAL

Representa el porcentaje real de avance respecto al objetivo mensual.

### Fórmula

```text
AVANCE GENERAL = Avance total (APROBADOS) / MO
```

### Consideración

Si `MO` es 0, evitar error y mostrar `0` o un valor seguro.

---

## 8. AVANCE ESPERADO a hoy 2

Representa el porcentaje esperado de avance respecto al objetivo mensual.

### Fórmula

```text
AVANCE ESPERADO a hoy 2 = (AVANCE ESPERADO a hoy 1) / MO
```

### Consideración

Si `MO` es 0, evitar error y mostrar `0`.

---

## 9. Deficit a Hoy

Calcula cuánto falta hoy respecto al avance esperado.

### Fórmula conceptual

```text
Deficit a Hoy = AVANCE ESPERADO a hoy 1 - Avance total (APROBADOS)
```

### Regla

Si el resultado es menor o igual a 0, mostrar 0.

### Fórmula final

```text
Deficit a Hoy = max(0, AVANCE ESPERADO a hoy 1 - Avance total (APROBADOS))
```

---

## 10. Déficit general (mes)

Calcula cuánto falta para cumplir la meta mensual total.

### Fórmula conceptual

```text
Déficit general (mes) = MO - Avance total (APROBADOS)
```

### Regla

Si el resultado es negativo, mostrar 0.

### Fórmula final

```text
Déficit general (mes) = max(0, MO - Avance total (APROBADOS))
```

---

## 11. Muestra

Este campo debe ser igual a:

```text
Muestra = MO
```

---

# Reglas de relación entre tablas

## Tabla base de filas

La tabla **“Tabla General de Desempeño”** debe construirse tomando como base las filas de:

```text
Datos necesarios EDGE genera
```

Es decir, cada fila de esa tabla debe generar una fila en la tabla final.

---

## Cruce con configuración

Para calcular `descansos`, buscar en configuración por:

```text
Ciudades == CIUDADES SIMPLIFICADO
```

y obtener el **promedio** de todos los descansos encontrados.

---

## Cruce con Total Edge

Para calcular `Avance total (APROBADOS)`, buscar en:

```text
Total Edge por ciudad simplificada
```

comparando:

```text
Ciudades == Ciudad Simplificado
```

y traer el valor de:

```text
Total Edge
```

Si no hay coincidencia, usar `0`.

---

# Reglas de implementación

1. La tabla debe renderizarse en la pestaña **“General”**.
2. Debe reemplazar el comportamiento actual de **“Tabla General de Desempeño”**.
3. Los cálculos deben ser dinámicos.
4. No se deben hardcodear valores.
5. Validar divisiones por cero.
6. Validar fechas faltantes.
7. Si `Días En el Mes <= 0`, mostrar error de configuración para esa fila.
8. Los porcentajes pueden mostrarse en formato decimal o porcentaje según el estilo ya usado por la app, pero el cálculo debe hacerse correctamente.
9. Mantener la coherencia de nombres de ciudades entre tablas.

---

# Orden recomendado de cálculo

Codex debe calcular en este orden para evitar dependencias rotas:

1. Leer filas base desde **Datos necesarios EDGE genera**
2. Obtener `Ciudades` y `MO`
3. Calcular `descansos` promedio desde configuración
4. Calcular `Días En el Mes`
5. Calcular `Objetivo por día`
6. Buscar `Avance total (APROBADOS)` desde **Total Edge por ciudad simplificada**
7. Calcular `AVANCE ESPERADO a hoy 1`
8. Calcular `AVANCE GENERAL`
9. Calcular `AVANCE ESPERADO a hoy 2`
10. Calcular `Deficit a Hoy`
11. Calcular `Déficit general (mes)`
12. Asignar `Muestra = MO`

---

# Comportamiento esperado por fila

Para cada ciudad de la tabla base, la fila final debe quedar conceptualmente así:

```text
Ciudades
MO
Días En el Mes
Objetivo por día
Avance total (APROBADOS)
AVANCE ESPERADO a hoy 1
AVANCE GENERAL
AVANCE ESPERADO a hoy 2
Deficit a Hoy
Déficit general (mes)
Muestra
```

---

# Nota importante

El campo **Ciudades** de la tabla actual debe tratarse como la clave principal de cruce para:

* obtener descansos promedio desde configuración
* obtener `Total Edge` desde la tabla agregada por ciudad simplificada

Por tanto, la normalización y coincidencia de nombres debe ser estricta y consistente.
