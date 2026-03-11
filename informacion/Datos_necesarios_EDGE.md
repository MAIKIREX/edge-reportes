## Contexto

En la pestaña **"EDGE general"** 

Debajo de esta tabla principal se deben generar **varias tablas adicionales de análisis**, calculadas dinámicamente a partir de la tabla **"Tabla de Datos Combinados"**.

Todas las agregaciones deben hacerse **agrupando por el campo**:

```
City Name
```

---

# TABLA 1 — Resumen de errores por ciudad

Debajo de la tabla principal genera una tabla con las siguientes columnas:

| City Name | SUM de porcentaje de rechazados | Promedio de error |

### Fuente de datos

Tabla:

```
Datos combinados
```

### Lógica de cálculo

#### City Name

Lista de ciudades únicas obtenidas desde el campo:

```
City Name
```

---

#### SUM de porcentaje de rechazados

Para cada ciudad:

```
SUM de porcentaje de rechazados =
SUMA del campo "% RECHAZADOS"
donde City Name sea igual a la ciudad analizada
```

---

#### Promedio de error

Se calcula como:

```
Promedio de error =
SUM de porcentaje de rechazados
/
cantidad de registros que tengan el mismo City Name
```

Es decir:

```
Promedio de error =
SUM(% RECHAZADOS por ciudad) / COUNT(ciudad)
```

---

# TABLA 2 — Proyección de aprobaciones

Generar otra tabla con las siguientes columnas:

| City Name | SUM de Approved POS | SUM de En QC POS | Error ciudad Simplificado | Proyección aprobados QC | Aprobados + QC con Error |

---

## Fuente de datos

Tabla:

```
Datos combinados
```

---

## Lógica de cálculo

### City Name

Lista de ciudades únicas del campo:

```
City Name
```

---

### SUM de Approved POS

```
SUM(Approved POS)
GROUP BY City Name
```

---

### SUM de En QC POS

```
SUM(En QC POS)
GROUP BY City Name
```

---

### Error ciudad Simplificado

Este valor debe obtenerse desde la **TABLA 1**, específicamente del campo:

```
Promedio de error
```

Debe coincidir con el **City Name** correspondiente.

---

### Proyección aprobados QC

Aplicar la siguiente fórmula:

```
Proyección aprobados QC =
SUM de En QC POS * (1 - (Error ciudad Simplificado / 100))
```

---

### Aprobados + QC con Error

Aplicar la siguiente fórmula:

```
Aprobados + QC con Error =
SUM de Approved POS + Proyección aprobados QC
```

---

# TABLA 3 — Cálculo Edge por ciudad

Generar una nueva tabla con las siguientes columnas:

| Ciudades | Ciudad Simplificado | Total Edge |

---

## Lógica

### Ciudades

Este valor corresponde al campo:

```
City Name
```

proveniente de la **TABLA 2**.

---

### Ciudad Simplificado

Este campo se calcula utilizando la siguiente lógica equivalente a Excel:

```
IFS(
City="Cobija","COBIJA",
City="Cochabamba","COCHABAMBA",
City="QUILLACOLLO","COCHABAMBA",
City="COLCAPIRHUA","COCHABAMBA",
City="VINTO","COCHABAMBA",
City="TIQUIPAYA","COCHABAMBA",
City="SIPE SIPE","COCHABAMBA",
City="SACABA","COCHABAMBA",
City="Guayaramerin","GUAYARAMERIN",
City="La Paz","LA PAZ",
City="EL ALTO","EL ALTO",
City="VIACHA","EL ALTO",
City="ACHOCALLA","LA PAZ",
City="LLALLAGUA","ORURO",
City="Oruro","ORURO",
City="Potosi","POTOSI",
City="PUNATA","COCHABAMBA",
City="Riberalta","RIBERALTA",
City="San Borja","SAN BORJA",
City="MONTERO","SANTA CRUZ",
City="SANTA CRUZ DE LA SIERRA","SANTA CRUZ",
City="WARNES","SANTA CRUZ",
City="PAILON","SANTA CRUZ",
City="LA GUARDIA","SANTA CRUZ",
City="COTOCA","SANTA CRUZ",
City="EL TORNO","SANTA CRUZ",
City="SUCRE","SUCRE",
City="TARIJA","TARIJA",
City="Trinidad","TRINIDAD",
City="Tupiza","TUPIZA",
City="Yapacani","SANTA CRUZ",
default="Otro"
)
```

---

### Total Edge

Este valor se obtiene de la **TABLA 2**, específicamente del campo:

```
Aprobados + QC con Error
```

Debe coincidir con la **misma ciudad de la fila actual**.

---

# TABLA 4 — Total Edge por ciudad simplificada

Generar una última tabla con las siguientes columnas:

| Ciudad Simplificado | Total Edge |

---

## Lógica

Esta tabla debe ser una **agregación de la TABLA 3**.

Agrupar por:

```
Ciudad Simplificado
```

Calcular:

```
Total Edge =
SUM(Total Edge)
GROUP BY Ciudad Simplificado
```

---

# Flujo completo de cálculo

El sistema debe calcular las tablas en el siguiente orden:

```
Datos combinados
        ↓
TABLA 1
Errores por ciudad
        ↓
TABLA 2
Proyección aprobados
        ↓
TABLA 3
Edge por ciudad
        ↓
TABLA 4
Edge por ciudad simplificada
```

---

# Requisitos de implementación

1. Todas las tablas deben actualizarse dinámicamente a partir de **Datos combinados**.
2. Las ciudades deben agruparse utilizando **City Name**.
3. La normalización de ciudades debe hacerse con la lógica de **Ciudad Simplificado**.
4. Las tablas deben renderizarse **debajo de la tabla principal en la pestaña "Tabla"**.

---