# 📧 Guía de Marketing por Email - Microservicio Aura

**Fecha de implementación:** 5 de enero de 2026  
**Versión:** 1.0  

---

## 🎯 Descripción General

El microservicio Aura ahora incluye funcionalidad completa para enviar correos electrónicos de marketing personalizados a clientes. La IA puede interpretar instrucciones en lenguaje natural y generar campañas de email automáticamente.

---

## ✨ Características Principales

- ✅ **Envío masivo de emails** a todos los clientes o segmentos específicos
- ✅ **Segmentación inteligente** (todos, VIP, regulares, nuevos, inactivos)
- ✅ **Personalización automática** del contenido por cliente
- ✅ **Tipos de campaña predefinidos** (precios, puntos, descuentos, productos nuevos, etc.)
- ✅ **Plantilla HTML responsive** con diseño profesional
- ✅ **Interpretación de IA** para generar campañas desde texto natural
- ✅ **Soporte para programación** de envíos futuros
- ✅ **Variables dinámicas** (nombre, email, puntos actuales, etc.)

---

## 🚀 Cómo Funciona

### Flujo de Trabajo

```
Usuario escribe en el chat
    ↓
IA interpreta la instrucción (Gemini)
    ↓
Microservicio ejecuta send_marketing_email
    ↓
Laravel obtiene clientes del segmento
    ↓
Laravel personaliza y envía emails
    ↓
Respuesta con confirmación
```

---

## 📋 Tipos de Campaña

| Tipo | Uso | Ejemplo |
|------|-----|---------|
| `price_update` | Actualización de precios | "Avisa que la pizza ahora cuesta 15€" |
| `points_promo` | Promoción de puntos | "Triple puntos en compras de +30€" |
| `new_products` | Productos nuevos | "Anuncio del nuevo menú de verano" |
| `discount_offer` | Ofertas con descuento | "20% de descuento con código VERANO" |
| `loyalty_reward` | Recompensas de fidelización | "Canjea 500 puntos por un postre" |
| `seasonal_promo` | Promociones de temporada | "Menú especial de Navidad" |
| `general_announcement` | Anuncios generales | "Nuevo horario de apertura" |

---

## 👥 Segmentos de Clientes

### `all` - Todos los Clientes
Todos los usuarios que han realizado al menos una compra.

### `vip` - Clientes VIP
Clientes con:
- 10 o más ventas, O
- Más de €500 gastados en total

### `regular` - Clientes Regulares
Clientes activos (compra en últimos 60 días) que NO son VIP.

### `new` - Clientes Nuevos
Usuarios registrados en los últimos 30 días.

### `inactive` - Clientes Inactivos
Clientes sin compras en los últimos 60 días.

---

## 💬 Ejemplos de Uso con IA

### Ejemplo 1: Anuncio de Nuevos Precios

**Usuario escribe:**
```
Envía un correo a todos los clientes avisando que la pizza margarita 
ahora cuesta 15 euros y la lasagna está a 18 euros
```

**La IA genera:**
```json
{
  "function": "send_marketing_email",
  "arguments": {
    "target_segment": "all",
    "campaign_type": "price_update",
    "subject": "Actualización de precios - Nuevos precios en el menú",
    "message_content": "Queremos informarte sobre los nuevos precios de algunos de nuestros platos favoritos. La Pizza Margarita ahora está a 15 euros y la Lasagna a 18 euros. ¡Ven a disfrutarlos!",
    "products_mentioned": [
      {
        "name": "Pizza Margarita",
        "new_price": 15
      },
      {
        "name": "Lasagna",
        "new_price": 18
      }
    ],
    "call_to_action": "Ver menú completo"
  }
}
```

---

### Ejemplo 2: Promoción de Puntos para VIPs

**Usuario escribe:**
```
Manda un email a los clientes VIP con una promoción de triple puntos 
en compras superiores a 30 euros hasta fin de mes
```

**La IA genera:**
```json
{
  "function": "send_marketing_email",
  "arguments": {
    "target_segment": "vip",
    "campaign_type": "points_promo",
    "subject": "¡Triple puntos para ti! - Promoción exclusiva VIP",
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

---

### Ejemplo 3: Descuento de Temporada

**Usuario escribe:**
```
Notifica a todos sobre nuestro menú de verano con 20% de descuento 
usando el código VERANO2025
```

**La IA genera:**
```json
{
  "function": "send_marketing_email",
  "arguments": {
    "target_segment": "all",
    "campaign_type": "seasonal_promo",
    "subject": "🌞 ¡Menú de Verano con 20% de descuento!",
    "message_content": "Disfruta de nuestro nuevo menú de verano con sabores frescos y refrescantes. Usa el código VERANO2025 para obtener un 20% de descuento en toda tu compra.",
    "discount_info": {
      "discount_percentage": 20,
      "discount_code": "VERANO2025"
    },
    "call_to_action": "Ver menú de verano"
  }
}
```

---

### Ejemplo 4: Precio Antiguo vs Nuevo

**Usuario escribe:**
```
Avisa a los clientes que la hamburguesa premium bajó de 12€ a 9.50€
```

**La IA genera:**
```json
{
  "function": "send_marketing_email",
  "arguments": {
    "target_segment": "all",
    "campaign_type": "price_update",
    "subject": "¡Buenas noticias! Hamburguesa Premium con precio especial",
    "message_content": "Tenemos excelentes noticias. Nuestra Hamburguesa Premium ahora tiene un precio especial: ¡solo 9.50 euros!",
    "products_mentioned": [
      {
        "name": "Hamburguesa Premium",
        "old_price": 12,
        "new_price": 9.50,
        "discount_percentage": 21
      }
    ],
    "call_to_action": "Pide ahora"
  }
}
```

---

## 🔧 Uso Directo con JSON (Postman)

### Endpoint: `/ai/interpret`

```http
POST http://localhost:3000/ai/interpret
Content-Type: application/json
Authorization: Bearer TU_JWT_TOKEN
```

```json
{
  "user_id": 1,
  "input_type": "text",
  "payload": "Envía un correo a todos avisando de los nuevos precios"
}
```

### Endpoint: `/ai/execute`

```http
POST http://localhost:3000/ai/execute
Content-Type: application/json
Authorization: Bearer TU_JWT_TOKEN
```

```json
{
  "user_id": 1,
  "function_name": "send_marketing_email",
  "parameters": {
    "target_segment": "all",
    "campaign_type": "price_update",
    "subject": "Actualización de precios",
    "message_content": "Queridos clientes, les informamos que hemos actualizado nuestros precios. La Pizza Margarita ahora cuesta 15 euros. ¡Esperamos verlos pronto!",
    "products_mentioned": [
      {
        "name": "Pizza Margarita",
        "new_price": 15,
        "old_price": 12
      }
    ],
    "call_to_action": "Ver menú completo"
  }
}
```

---

## 📊 Respuesta del Servidor

```json
{
  "success": true,
  "executed": true,
  "function": "send_marketing_email",
  "result": {
    "success": true,
    "campaign_type": "price_update",
    "target_segment": "all",
    "recipients_count": 127,
    "subject": "Actualización de precios",
    "scheduled_for": null,
    "message": "✅ Correo de marketing enviado a 127 cliente(s) del segmento \"all\"",
    "preview": {
      "subject": "Actualización de precios",
      "segment": "all",
      "campaign_type": "price_update",
      "has_products": true,
      "has_discount": false,
      "has_points": false
    }
  }
}
```

---

## 🎨 Personalización del Email

### Variables Disponibles

El contenido del email puede incluir variables que se reemplazan automáticamente:

- `{nombre}` - Nombre del cliente
- `{email}` - Email del cliente
- `{puntos_actuales}` - Puntos de fidelización actuales (si hay oferta de puntos)

**Ejemplo:**
```json
{
  "message_content": "Hola {nombre}, tienes {puntos_actuales} puntos disponibles. ¡Úsalos en tu próxima compra!"
}
```

**Resultado para Juan (con 250 puntos):**
```
Hola Juan, tienes 250 puntos disponibles. ¡Úsalos en tu próxima compra!
```

---

## 📱 Plantilla de Email

La plantilla HTML incluye:

✅ **Diseño responsive** - Se adapta a móviles y desktop  
✅ **Header con gradiente** - Diseño moderno y atractivo  
✅ **Sección de productos** - Muestra productos con precios  
✅ **Oferta de puntos** - Sección destacada para promociones de puntos  
✅ **Oferta de descuento** - Sección para códigos y descuentos  
✅ **Botón CTA** - Call to action personalizable  
✅ **Footer con unsubscribe** - Enlace para darse de baja  

---

## ⚙️ Configuración Requerida

### 1. Configurar SMTP en Laravel

Edita el archivo `.env` de Laravel:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=tu_email@gmail.com
MAIL_PASSWORD=tu_app_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=tu_email@gmail.com
MAIL_FROM_NAME="${APP_NAME}"
```

### 2. Para Gmail

1. Activa la verificación en 2 pasos en tu cuenta de Google
2. Genera una "Contraseña de aplicación" en [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Usa esa contraseña en `MAIL_PASSWORD`

### 3. Probar Configuración

```bash
cd backend
php artisan tinker
```

```php
Mail::raw('Test email', function($msg) {
    $msg->to('test@example.com')->subject('Test');
});
```

---

## 🧪 Testing

### Test 1: Email Simple a Todos

```json
{
  "user_id": 1,
  "function_name": "send_marketing_email",
  "parameters": {
    "target_segment": "all",
    "campaign_type": "general_announcement",
    "subject": "¡Hola desde Aura!",
    "message_content": "Este es un email de prueba desde el sistema de marketing de Aura.",
    "call_to_action": "Visítanos"
  }
}
```

### Test 2: Email con Productos a VIPs

```json
{
  "user_id": 1,
  "function_name": "send_marketing_email",
  "parameters": {
    "target_segment": "vip",
    "campaign_type": "new_products",
    "subject": "Exclusivo para VIP: Nuevo menú premium",
    "message_content": "Como cliente VIP, eres el primero en conocer nuestro nuevo menú premium.",
    "products_mentioned": [
      {
        "name": "Filete Angus Premium",
        "new_price": 28.50
      },
      {
        "name": "Langostinos al Ajillo",
        "new_price": 22.00
      }
    ],
    "call_to_action": "Reserva tu mesa"
  }
}
```

### Test 3: Email con Descuento

```json
{
  "user_id": 1,
  "function_name": "send_marketing_email",
  "parameters": {
    "target_segment": "regular",
    "campaign_type": "discount_offer",
    "subject": "15% de descuento especial para ti",
    "message_content": "Disfruta de un 15% de descuento en tu próxima visita. Solo para clientes como tú.",
    "discount_info": {
      "discount_percentage": 15,
      "discount_code": "GRACIAS15",
      "valid_until": "2025-12-31"
    },
    "call_to_action": "Usar descuento"
  }
}
```

---

## 📈 Métricas y Logs

### Ver Logs de Envío

```bash
cd backend
tail -f storage/logs/laravel.log
```

### Información Logueada

- ✅ Segmento objetivo
- ✅ Total de clientes en el segmento
- ✅ Emails enviados exitosamente
- ✅ Errores de envío por cliente
- ✅ Tipo de campaña
- ✅ Fecha de programación (si aplica)

---

## ⚠️ Limitaciones Actuales

1. **Programación de envíos:** Implementado pero requiere sistema de colas (Laravel Queue)
2. **Tracking de aperturas:** No implementado (requiere servicio externo)
3. **Estadísticas de campaña:** No implementado (requiere base de datos adicional)
4. **A/B Testing:** No implementado
5. **Adjuntos:** No soportado actualmente

---

## 🔜 Próximas Mejoras

- [ ] Sistema de colas para envíos programados
- [ ] Dashboard de estadísticas de campañas
- [ ] Tracking de aperturas y clicks
- [ ] Templates personalizables desde el admin
- [ ] Historial de campañas enviadas
- [ ] Preview del email antes de enviar
- [ ] Límite de envíos por día/hora
- [ ] Integración con servicios de email marketing (SendGrid, Mailgun, etc.)

---

## 🛠️ Troubleshooting

### Problema: "Connection could not be established with host"

**Solución:**
- Verifica las credenciales SMTP en `.env`
- Asegúrate que el puerto 587 esté abierto
- Si usas Gmail, genera una contraseña de aplicación

### Problema: "No hay clientes en el segmento seleccionado"

**Solución:**
- Verifica que haya ventas registradas en la base de datos
- Prueba con el segmento `all` primero
- Revisa que la tabla `users` tenga emails válidos

### Problema: "Class 'App\Mail\MarketingCampaign' not found"

**Solución:**
```bash
cd backend
composer dump-autoload
```

### Problema: "View [emails.marketing-campaign] not found"

**Solución:**
- Verifica que el archivo exista en `resources/views/emails/marketing-campaign.blade.php`
- Ejecuta `php artisan view:clear`

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs del microservicio (consola de Node.js)
2. Revisa los logs de Laravel (`storage/logs/laravel.log`)
3. Verifica la configuración de SMTP
4. Prueba con un email de prueba primero

---

## ✅ Checklist de Implementación

- [x] Función `send_marketing_email` en llmService.js
- [x] Reglas de IA en SYSTEM_PROMPT
- [x] Ejecutores en executionService.js
- [x] Ruta en Laravel api.php
- [x] Método `enviarEmailMarketing` en AuraController
- [x] Mailable `MarketingCampaign`
- [x] Vista HTML del email
- [ ] Configurar SMTP en Laravel `.env`
- [ ] Probar envío de email

---

**¡La funcionalidad de marketing por email está lista para usar! 🎉**

