# Especificación de Cálculos para la Aplicación

Este documento describe cómo deben calcularse ciertos indicadores dentro de la aplicación a partir de los datos del archivo Excel base **"Desempeño de Usuarios por Día"**.

Los cálculos se realizan principalmente **agrupando por ciudad** y considerando el **periodo de fechas definido en el sistema**.

---

# 1. Promedio de Gestores (Prom G.)

Este indicador representa el **promedio de gestores activos por ciudad**.

## Variables

### m

Cantidad de registros que existen para una ciudad específica dentro de la tabla.

Ejemplo:

| Ciudad |
|------|
| COCHABAMBA |
| COCHABAMBA |
| LA PAZ |

Para **COCHABAMBA**

m = 2

---

### n

Suma de la columna **Total POS** para todos los registros de esa ciudad.

Ejemplo:

| Ciudad | Total POS |
|------|------|
| COCHABAMBA | 20 |
| COCHABAMBA | 10 |

n = 20 + 10 = 30

---

## Fórmula

Promedio Gestores = n / m

### Reglas especiales

- Si **m = 0**, el valor será **0**
- Si el resultado del promedio es **0**, se mostrará **4** como valor mínimo.

Expresión equivalente en Excel:

=SI(SI(m=0;0;(n/m))=0;4;SI(m=0;0;(n/m)))

---

# 2. Gestores Ayer (G. Ayer)

Este indicador muestra **cuántos gestores trabajaron el día anterior**.

## Procedimiento

1. Obtener la **fecha actual del sistema**.

Ejemplo:

Hoy = 10/03/2026

2. Calcular la fecha del día anterior.

Ayer = 09/03/2026

3. Filtrar la tabla usando esa fecha.

Fecha = Ayer

4. Contar la cantidad de **auditores distintos** por ciudad.

Se utiliza la columna:

Auditor Name

5. El resultado es el número de gestores que trabajaron ayer en esa ciudad.

Ejemplo:

| Fecha | Ciudad | Auditor |
|------|------|------|
| 09/03 | LA PAZ | Juan |
| 09/03 | LA PAZ | Pedro |

Resultado:

Gestores Ayer = 2

---

# 3. Porcentaje de Rechazo (En R%)

Este indicador mide el porcentaje de formularios rechazados respecto al total.

## Variables

**Total POS**  
Total de formularios procesados.

**Partially Rejected POS**  
Formularios parcialmente rechazados.

**Rejected POS**  
Formularios rechazados.

---

## Cálculo

Primero se calcula el porcentaje de rechazo:

Rechazo = (Partially Rejected POS + Rejected POS) / Total POS

Luego se divide entre la cantidad de registros de la ciudad (**m**).

---

## Fórmula

En R% = ((Partially Rejected POS + Rejected POS) / Total POS) / m * 100

### Reglas

- Si **Total POS = 0**, el resultado será **0**
- Si **m = 0**, el resultado será **0**

---

# 4. Días Faltantes

Este indicador muestra **cuántos días laborales quedan en el periodo de trabajo**.

Para el cálculo **no se consideran sábados ni domingos**, ni los días definidos como descanso.

---

## Variables

### Fecha inicio

Fecha en la que comienza el periodo de trabajo.

### Fecha final

Fecha en la que termina el periodo.

### Hoy

Fecha actual del sistema.

---

## Domingos

Cantidad de domingos entre:

Fecha inicio → Fecha final

---

## Sábados

Cantidad de sábados entre:

Fecha inicio → Fecha final

---

## Domingos pasados

Cantidad de domingos entre:

Fecha inicio → Hoy

---

## Sábados pasados

Cantidad de sábados entre:

Fecha inicio → Hoy

---

## Días disponibles

Cantidad total de días laborales posibles dentro del periodo.

dias disponibles = (fecha final - fecha inicio) - domingos - sabados - descansos

---

## Días activos

Días laborales que ya han transcurrido.

dias activos = (hoy - fecha inicio) - domingos pasados - sabados pasados - descansos

---

## Días faltantes

Cantidad de días laborales restantes.

dias faltantes = dias disponibles - dias activos

---

# Conclusión

Los indicadores calculados en la aplicación serán:

- Promedio de gestores por ciudad
- Gestores activos el día anterior
- Porcentaje de rechazo
- Días laborales restantes del periodo

Todos los valores deben calcularse dinámicamente a partir de los datos del archivo Excel base.
en configuracion se debe de añadir un campo para colocar el valor de "descansos".