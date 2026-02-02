# Análisis de Integración: Microservicio AURA ↔ Laravel FlashFood

## 🔍 Resumen de Problemas Encontrados

### ❌ PROBLEMA 1: Endpoints de Productos NO coinciden

**Microservicio espera:**
- `GET /api/products/search?name=...`
- `POST /api/products/{id}/update-price`
- `PUT /api/products/{id}`
- `POST /api/products/{id}/update-stock`
- `POST /api/products`
- `DELETE /api/products/{id}`

**Laravel tiene:**
- `GET /api/aura/productos/buscar?nombre=...` ✅
- `PUT /api/aura/productos/{tipo}/{id}/precio` ✅
- `PUT /api/aura/productos/{tipo}/{id}` ✅
- `POST /api/aura/productos/{tipo}` ✅
- `DELETE /api/aura/productos/{tipo}/{id}` ✅
- `POST /api/products/{id}/update-stock` ❌ **NO EXISTE**

### ❌ PROBLEMA 2: Endpoints de Reportes NO coinciden

**Microservicio espera:**
- `GET /api/reportes/ventas?fecha_inicio=...&fecha_fin=...`
- `GET /api/reportes/clientes?segmento=...`

**Laravel tiene:**
- `GET /api/aura/reportes/ventas?fecha_inicio=...&fecha_fin=...` ✅
- `GET /api/aura/reportes/clientes?segmento=...` ✅

### ❌ PROBLEMA 3: Endpoints de Marketing NO existen

**Microservicio espera:**
- `POST /api/marketing/bulk-offer`
- `POST /api/marketing/send-message`
- `POST /api/marketing/loyalty-campaign`

**Laravel tiene:**
- ❌ **NO EXISTEN** - Necesitan implementarse

**Solución temporal:**
- Las funciones de marketing lanzarán error informativo
- Se recomienda implementar estos endpoints en Laravel o deshabilitar estas funciones en el microservicio

### ⚠️ PROBLEMA 4: Estructura de productos diferente

**Laravel usa:**
- Productos separados en `Dish` (platos) y `Drink` (bebidas)
- Requiere `tipo` (plato/bebida) en todas las rutas
- Requiere `family_id` para crear productos

**Microservicio asume:**
- Productos genéricos con ID único
- No maneja el concepto de "tipo"

## ✅ Soluciones Necesarias

### 1. Corregir `findProductByName`
- Debe retornar `{id, tipo}` en lugar de solo `id`
- Usar endpoint correcto: `/api/aura/productos/buscar?nombre=...`

### 2. Actualizar todos los endpoints de productos
- Usar formato: `/api/aura/productos/{tipo}/{id}`
- Pasar `tipo` (plato/bebida) en todas las llamadas

### 3. Corregir endpoints de reportes
- Cambiar `/api/reportes/ventas` → `/api/aura/reportes/ventas`
- Cambiar `/api/reportes/clientes` → `/api/aura/reportes/clientes`

### 4. Implementar endpoints de marketing en Laravel
- O deshabilitar funciones de marketing en el microservicio

### 5. Manejar `update_product_stock`
- Laravel no tiene endpoint específico para stock
- Opción A: Implementar en Laravel
- Opción B: Usar `update_product_info` con campo stock

## 📋 Mapeo de Campos

### Productos
| Microservicio | Laravel | Notas |
|--------------|---------|-------|
| `name` | `nombre` | En crear/actualizar |
| `description` | `descripcion` | En crear/actualizar |
| `price` | `precio` | En crear/actualizar |
| `category` | `family_id` | Requiere conversión |
| `is_available` | `disponible` | No implementado en Laravel |
| `stock` | - | No existe en modelo |

### Reportes
| Microservicio | Laravel | Estado |
|--------------|---------|--------|
| `fecha_inicio` | `fecha_inicio` | ✅ OK |
| `fecha_fin` | `fecha_fin` | ✅ OK |
| `formato` | `formato` | ✅ OK |
| `segmento` | `segmento` | ✅ OK |

## ✅ Correcciones Aplicadas

### 1. ✅ `findProductByName` corregido
- Ahora usa: `GET /api/aura/productos/buscar?nombre=...`
- Retorna: `{id, tipo}` donde tipo es 'plato' o 'bebida'

### 2. ✅ Endpoints de productos corregidos
- `update_product_price`: `PUT /api/aura/productos/{tipo}/{id}/precio`
- `update_product_info`: `PUT /api/aura/productos/{tipo}/{id}`
- `update_product_stock`: Usa `update_product_info` (stock no existe en Laravel)
- `create_product`: `POST /api/aura/productos/{tipo}`
- `delete_product`: `DELETE /api/aura/productos/{tipo}/{id}`

### 3. ✅ Endpoints de reportes corregidos
- `generate_sales_report`: `GET /api/aura/reportes/ventas`
- `generate_customer_report`: `GET /api/aura/reportes/clientes`

### 4. ✅ Funciones de marketing
- Lanzan error informativo indicando que no están implementadas en Laravel

## ⚠️ Limitaciones Conocidas

1. **Stock**: Laravel no tiene campo de stock. `update_product_stock` usa `update_product_info` pero el campo se ignora.

2. **Tipo de producto**: El microservicio necesita determinar si un producto es "plato" o "bebida". Actualmente:
   - Si se busca por nombre, se obtiene el tipo automáticamente
   - Si solo se proporciona `product_id`, se requiere `product_name` para determinar el tipo

3. **Family ID**: Para crear productos, Laravel requiere `family_id` (número). El microservicio acepta `category` (string) pero necesita conversión.

4. **Marketing**: Las funciones de marketing no están implementadas en Laravel y lanzan error.

## 🔧 Recomendaciones

1. **Implementar endpoints de marketing en Laravel** o deshabilitar estas funciones en el microservicio
2. **Agregar campo de stock** en los modelos Dish y Drink si es necesario
3. **Mejorar búsqueda de familia** para convertir nombres de categoría a family_id
4. **Considerar agregar endpoint** que retorne tipo de producto dado solo el ID

