# Ejemplos para Probar en Postman

Todos los endpoints requieren el header:
```
Authorization: Bearer TU_JWT_TOKEN
Content-Type: application/json
```

---

## 🔍 1. BUSCAR PRODUCTO (find_product)

### INTERPRET
```
POST http://localhost:3000/ai/interpret
```
```json
{
  "user_id": 1,
  "input_type": "text",
  "payload": "Busca la hamburguesa deluxe"
}
```

### EXECUTE
```
POST http://localhost:3000/ai/execute
```
```json
{
  "user_id": 1,
  "function_name": "find_product",
  "parameters": {
    "query": "hamburguesa deluxe"
  }
}
```

**Variantes:**
```json
// Buscar por nombre específico
{
  "user_id": 1,
  "function_name": "find_product",
  "parameters": {
    "product_name": "Pizza Margarita"
  }
}
```

```json
// Buscar múltiples (por query)
{
  "user_id": 1,
  "function_name": "find_product",
  "parameters": {
    "query": "pizza"
  }
}
```

---

## ➕ 2. CREAR PRODUCTO (create_product)

### INTERPRET
```
POST http://localhost:3000/ai/interpret
```
```json
{
  "user_id": 1,
  "input_type": "text",
  "payload": "Crea un nuevo plato llamado Lasagna Bolognesa por 16.50 euros con salsa de carne y queso gratinado"
}
```

### EXECUTE
```
POST http://localhost:3000/ai/execute
```
```json
{
  "user_id": 1,
  "function_name": "create_product",
  "parameters": {
    "name": "Lasagna Bolognesa",
    "price": 16.50,
    "description": "Lasagna con salsa de carne y queso gratinado",
    "category": "2"
  }
}
```

**Variantes:**
```json
// Crear bebida
{
  "user_id": 1,
  "function_name": "create_product",
  "parameters": {
    "name": "Coca Cola Zero",
    "price": 2.50,
    "description": "Bebida sin azúcar",
    "category": "3"
  }
}
```

---

## 💰 3. ACTUALIZAR PRECIO (update_product_price)

### INTERPRET
```
POST http://localhost:3000/ai/interpret
```
```json
{
  "user_id": 1,
  "input_type": "text",
  "payload": "Cambia el precio de la lasagna bolognesa a 18 euros"
}
```

### EXECUTE
```
POST http://localhost:3000/ai/execute
```
```json
{
  "user_id": 1,
  "function_name": "update_product_price",
  "parameters": {
    "product_name": "Lasagna Bolognesa",
    "new_price": 18.00
  }
}
```

**Variantes:**
```json
// Con ID de producto
{
  "user_id": 1,
  "function_name": "update_product_price",
  "parameters": {
    "product_id": 55,
    "product_name": "Lasagna Bolognesa",
    "new_price": 17.50,
    "currency": "EUR"
  }
}
```

---

## 📝 4. ACTUALIZAR INFORMACIÓN (update_product_info)

### INTERPRET
```
POST http://localhost:3000/ai/interpret
```
```json
{
  "user_id": 1,
  "input_type": "text",
  "payload": "Cambia la descripción de la lasagna a 'Lasagna casera con ingredientes frescos y queso importado'"
}
```

### EXECUTE
```
POST http://localhost:3000/ai/execute
```
```json
{
  "user_id": 1,
  "function_name": "update_product_info",
  "parameters": {
    "product_name": "Lasagna Bolognesa",
    "new_description": "Lasagna casera con ingredientes frescos y queso importado"
  }
}
```

**Variantes:**
```json
// Actualizar nombre y precio
{
  "user_id": 1,
  "function_name": "update_product_info",
  "parameters": {
    "product_name": "Lasagna Bolognesa",
    "new_name": "Lasagna Bolognesa Premium",
    "new_price": 19.00
  }
}
```

```json
// Actualizar múltiples campos
{
  "user_id": 1,
  "function_name": "update_product_info",
  "parameters": {
    "product_name": "Lasagna Bolognesa Premium",
    "new_name": "Lasagna de la Casa",
    "new_description": "Receta secreta de la abuela",
    "new_price": 20.00
  }
}
```

---

## 🗑️ 5. ELIMINAR PRODUCTO (delete_product)

### INTERPRET
```
POST http://localhost:3000/ai/interpret
```
```json
{
  "user_id": 1,
  "input_type": "text",
  "payload": "Elimina el plato lasagna de la casa"
}
```

### EXECUTE
```
POST http://localhost:3000/ai/execute
```
```json
{
  "user_id": 1,
  "function_name": "delete_product",
  "parameters": {
    "product_name": "Lasagna de la Casa"
  }
}
```

**Variantes:**
```json
// Con ID de producto
{
  "user_id": 1,
  "function_name": "delete_product",
  "parameters": {
    "product_id": 55,
    "product_name": "Lasagna de la Casa"
  }
}
```

---

## 📊 6. REPORTE DE VENTAS (generate_sales_report)

### INTERPRET
```
POST http://localhost:3000/ai/interpret
```
```json
{
  "user_id": 1,
  "input_type": "text",
  "payload": "Dame el reporte de ventas de este mes"
}
```

### EXECUTE
```
POST http://localhost:3000/ai/execute
```
```json
{
  "user_id": 1,
  "function_name": "generate_sales_report",
  "parameters": {
    "period_type": "month",
    "format": "json"
  }
}
```

**Variantes:**
```json
// Hoy
{
  "user_id": 1,
  "function_name": "generate_sales_report",
  "parameters": {
    "period_type": "today",
    "format": "json"
  }
}
```

```json
// Año actual
{
  "user_id": 1,
  "function_name": "generate_sales_report",
  "parameters": {
    "period_type": "year",
    "format": "json"
  }
}
```

```json
// Mes específico
{
  "user_id": 1,
  "function_name": "generate_sales_report",
  "parameters": {
    "period_type": "month",
    "specific_month": "2025-12",
    "format": "json"
  }
}
```

```json
// Período personalizado
{
  "user_id": 1,
  "function_name": "generate_sales_report",
  "parameters": {
    "period_type": "custom",
    "start_date": "2025-12-01",
    "end_date": "2025-12-29",
    "format": "json"
  }
}
```

```json
// Exportar a PDF
{
  "user_id": 1,
  "function_name": "generate_sales_report",
  "parameters": {
    "period_type": "month",
    "format": "pdf"
  }
}
```

---

## 👥 7. REPORTE DE CLIENTES (generate_customer_report)

### INTERPRET
```
POST http://localhost:3000/ai/interpret
```
```json
{
  "user_id": 1,
  "input_type": "text",
  "payload": "Muéstrame el reporte de clientes VIP del último mes"
}
```

### EXECUTE
```
POST http://localhost:3000/ai/execute
```
```json
{
  "user_id": 1,
  "function_name": "generate_customer_report",
  "parameters": {
    "segment": "vip",
    "period": "last_month",
    "format": "json"
  }
}
```

**Variantes:**
```json
// Todos los clientes
{
  "user_id": 1,
  "function_name": "generate_customer_report",
  "parameters": {
    "segment": "all",
    "period": "last_month",
    "format": "json"
  }
}
```

```json
// Clientes nuevos
{
  "user_id": 1,
  "function_name": "generate_customer_report",
  "parameters": {
    "segment": "new",
    "period": "last_week",
    "format": "json"
  }
}
```

```json
// Clientes inactivos
{
  "user_id": 1,
  "function_name": "generate_customer_report",
  "parameters": {
    "segment": "inactive",
    "period": "last_year",
    "format": "json"
  }
}
```

---

## 🎯 FLUJO COMPLETO DE EJEMPLO

### 1️⃣ CREAR UN PRODUCTO
```json
POST http://localhost:3000/ai/execute

{
  "user_id": 1,
  "function_name": "create_product",
  "parameters": {
    "name": "Tarta de Queso",
    "price": 5.50,
    "description": "Tarta de queso casera con frutos rojos",
    "category": "2"
  }
}
```

### 2️⃣ BUSCAR EL PRODUCTO
```json
POST http://localhost:3000/ai/execute

{
  "user_id": 1,
  "function_name": "find_product",
  "parameters": {
    "query": "Tarta de Queso"
  }
}
```

### 3️⃣ ACTUALIZAR EL PRECIO
```json
POST http://localhost:3000/ai/execute

{
  "user_id": 1,
  "function_name": "update_product_price",
  "parameters": {
    "product_name": "Tarta de Queso",
    "new_price": 6.00
  }
}
```

### 4️⃣ ACTUALIZAR LA DESCRIPCIÓN
```json
POST http://localhost:3000/ai/execute

{
  "user_id": 1,
  "function_name": "update_product_info",
  "parameters": {
    "product_name": "Tarta de Queso",
    "new_description": "Deliciosa tarta de queso con base de galleta y cobertura de frutos rojos frescos"
  }
}
```

### 5️⃣ VERIFICAR CAMBIOS
```json
POST http://localhost:3000/ai/execute

{
  "user_id": 1,
  "function_name": "find_product",
  "parameters": {
    "product_name": "Tarta de Queso"
  }
}
```

### 6️⃣ ELIMINAR EL PRODUCTO
```json
POST http://localhost:3000/ai/execute

{
  "user_id": 1,
  "function_name": "delete_product",
  "parameters": {
    "product_name": "Tarta de Queso"
  }
}
```

---

## 💡 TIPS PARA TESTING

1. **Obtener JWT:** Usa el endpoint de login de Laravel primero
   ```
   POST http://localhost/api/loginadmin
   {
     "email": "admin@example.com",
     "password": "password"
   }
   ```

2. **Ver familias disponibles:** Para saber qué `family_id` usar
   ```
   GET http://localhost/api/families
   Authorization: Bearer TU_JWT_TOKEN
   ```

3. **Ver productos actuales:**
   ```json
   POST http://localhost:3000/ai/execute
   {
     "user_id": 1,
     "function_name": "find_product",
     "parameters": {
       "query": ""
     }
   }
   ```

4. **Logs:** Revisa la consola del microservicio (Node.js) para ver logs detallados

5. **Errores comunes:**
   - `Token inválido`: Tu JWT expiró, obtén uno nuevo
   - `Usuario no autenticado`: Verifica que el token sea válido
   - `Producto no encontrado`: Verifica el nombre exacto con find_product
   - `Family_id requerido`: Proporciona un family_id válido al crear productos

---

## 🚀 TESTING RÁPIDO (Copy & Paste)

### Producto Completo
```json
// 1. Crear
POST http://localhost:3000/ai/execute
{
  "user_id": 1,
  "function_name": "create_product",
  "parameters": {
    "name": "Test Product",
    "price": 10.00,
    "description": "Producto de prueba",
    "category": "2"
  }
}

// 2. Buscar
POST http://localhost:3000/ai/execute
{
  "user_id": 1,
  "function_name": "find_product",
  "parameters": {
    "query": "Test Product"
  }
}

// 3. Actualizar precio
POST http://localhost:3000/ai/execute
{
  "user_id": 1,
  "function_name": "update_product_price",
  "parameters": {
    "product_name": "Test Product",
    "new_price": 12.00
  }
}

// 4. Actualizar info
POST http://localhost:3000/ai/execute
{
  "user_id": 1,
  "function_name": "update_product_info",
  "parameters": {
    "product_name": "Test Product",
    "new_description": "Descripción actualizada"
  }
}

// 5. Eliminar
POST http://localhost:3000/ai/execute
{
  "user_id": 1,
  "function_name": "delete_product",
  "parameters": {
    "product_name": "Test Product"
  }
}
```

### Reportes
```json
// Reporte de ventas del mes
POST http://localhost:3000/ai/execute
{
  "user_id": 1,
  "function_name": "generate_sales_report",
  "parameters": {
    "period_type": "month",
    "format": "json"
  }
}

// Reporte de clientes
POST http://localhost:3000/ai/execute
{
  "user_id": 1,
  "function_name": "generate_customer_report",
  "parameters": {
    "segment": "all",
    "period": "last_month",
    "format": "json"
  }
}
```

---

## 📧 8. MARKETING - ENVIAR EMAIL (send_marketing_email)

### INTERPRET
```
POST http://localhost:3000/ai/interpret
```
```json
{
  "user_id": 1,
  "input_type": "text",
  "payload": "Envía un correo a todos los clientes avisando que la pizza margarita ahora cuesta 15 euros"
}
```

### EXECUTE
```
POST http://localhost:3000/ai/execute
```
```json
{
  "user_id": 1,
  "function_name": "send_marketing_email",
  "parameters": {
    "target_segment": "all",
    "campaign_type": "price_update",
    "subject": "Actualización de precios - Pizza Margarita",
    "message_content": "Queremos informarte que nuestra deliciosa Pizza Margarita tiene un nuevo precio de 15 euros. ¡Ven a disfrutarla!",
    "products_mentioned": [
      {
        "name": "Pizza Margarita",
        "new_price": 15
      }
    ],
    "call_to_action": "Visítanos hoy"
  }
}
```

**Variantes:**
```json
// Email con productos y precios antiguos
{
  "user_id": 1,
  "function_name": "send_marketing_email",
  "parameters": {
    "target_segment": "all",
    "campaign_type": "price_update",
    "subject": "¡Nuevos precios especiales!",
    "message_content": "Hemos ajustado nuestros precios para ofrecerte mejor valor.",
    "products_mentioned": [
      {
        "name": "Hamburguesa Deluxe",
        "old_price": 12,
        "new_price": 10,
        "discount_percentage": 17
      },
      {
        "name": "Ensalada César",
        "old_price": 8,
        "new_price": 7.50
      }
    ],
    "call_to_action": "Ver menú completo"
  }
}
```

```json
// Email con promoción de puntos para VIPs
{
  "user_id": 1,
  "function_name": "send_marketing_email",
  "parameters": {
    "target_segment": "vip",
    "campaign_type": "points_promo",
    "subject": "¡Triple puntos para ti! - Exclusivo VIP",
    "message_content": "Como cliente VIP, disfruta de TRIPLE PUNTOS en todas tus compras superiores a 30 euros. Válido hasta fin de mes.",
    "points_offer": {
      "points_amount": 3,
      "minimum_purchase": 30,
      "expiry_date": "2025-12-31"
    },
    "call_to_action": "Canjea tus puntos ahora"
  }
}
```

```json
// Email con código de descuento
{
  "user_id": 1,
  "function_name": "send_marketing_email",
  "parameters": {
    "target_segment": "all",
    "campaign_type": "discount_offer",
    "subject": "🎉 20% de descuento con código VERANO2025",
    "message_content": "Disfruta del verano con un 20% de descuento en todos nuestros platos. Usa el código VERANO2025 en tu próxima visita.",
    "discount_info": {
      "discount_percentage": 20,
      "discount_code": "VERANO2025",
      "valid_until": "2025-12-31"
    },
    "call_to_action": "Usar descuento ahora"
  }
}
```

```json
// Email para clientes nuevos
{
  "user_id": 1,
  "function_name": "send_marketing_email",
  "parameters": {
    "target_segment": "new",
    "campaign_type": "general_announcement",
    "subject": "¡Bienvenido! Te presentamos nuestro menú",
    "message_content": "¡Gracias por unirte a nuestra comunidad! Conoce nuestros platos más populares y disfruta de tu primera experiencia con nosotros.",
    "call_to_action": "Ver menú"
  }
}
```

```json
// Email para clientes inactivos
{
  "user_id": 1,
  "function_name": "send_marketing_email",
  "parameters": {
    "target_segment": "inactive",
    "campaign_type": "loyalty_reward",
    "subject": "¡Te extrañamos! 15% de descuento especial",
    "message_content": "Hace tiempo que no te vemos. Como agradecimiento por tu preferencia, disfruta de un 15% de descuento en tu próxima visita.",
    "discount_info": {
      "discount_percentage": 15,
      "discount_code": "COMEBACK15",
      "valid_until": "2025-12-31"
    },
    "call_to_action": "Volver a visitarnos"
  }
}
```

```json
// Email de temporada con productos nuevos
{
  "user_id": 1,
  "function_name": "send_marketing_email",
  "parameters": {
    "target_segment": "all",
    "campaign_type": "seasonal_promo",
    "subject": "🌞 Nuevo Menú de Verano 2025",
    "message_content": "Descubre nuestros nuevos platos de verano con ingredientes frescos de temporada. Sabores refrescantes perfectos para el calor.",
    "products_mentioned": [
      {
        "name": "Ensalada Tropical",
        "new_price": 9.50
      },
      {
        "name": "Gazpacho Andaluz",
        "new_price": 6.00
      },
      {
        "name": "Smoothie Bowl",
        "new_price": 7.50
      }
    ],
    "call_to_action": "Probar menú de verano"
  }
}
```




