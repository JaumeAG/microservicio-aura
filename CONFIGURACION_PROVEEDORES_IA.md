# 🤖 Configuración de Proveedores de IA - Sistema de Rotación Automática

## 📋 Descripción

El microservicio AURA ahora soporta **múltiples proveedores de IA** con **rotación automática**. Cuando un proveedor se queda sin créditos o alcanza su límite, el sistema automáticamente cambia al siguiente proveedor disponible.

## ✨ Características

- ✅ **Rotación Automática**: Detecta errores de quota y rota inmediatamente
- ✅ **Múltiples Proveedores**: Soporta Gemini, OpenAI, Claude y más
- ✅ **Múltiples Claves**: Configura varias claves del mismo proveedor
- ✅ **Sin Downtime**: Si un proveedor falla, usa otro automáticamente
- ✅ **Estadísticas**: Monitorea el estado de cada proveedor

## 🔧 Configuración del `.env`

### Ejemplo Básico (Solo Gemini)

```env
# Google Gemini
GEMINI_API_KEY=AIzaSyDj9J9K2_UQ86gyBSlZ3Hk_EFaK3Qsj174
PORT=8001
NODE_ENV=development
LARAVEL_API_URL=http://localhost:8000
AI_SERVICE_TOKEN=AURA_TOKEN_23
```

### Ejemplo Avanzado (Múltiples Proveedores)

```env
# Google Gemini - Cuenta 1 (Recomendado)
GEMINI_API_KEY=AIzaSyDj9J9K2_UQ86gyBSlZ3Hk_EFaK3Qsj174

# Google Gemini - Claves adicionales
GEMINI_API_KEY_1=AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXX
GEMINI_API_KEY_2=AIzaSyDYYYYYYYYYYYYYYYYYYYYYYYYYYYY

# OpenAI (Opcional)
OPENAI_API_KEY=sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
OPENAI_API_KEY_1=sk-YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY

# Claude / Anthropic (Opcional)
CLAUDE_API_KEY=sk-ant-XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
CLAUDE_API_KEY_1=sk-ant-YYYYYYYYYYYYYYYYYYYYYYYYYYY

PORT=8001
NODE_ENV=development
LARAVEL_API_URL=http://localhost:8000
AI_SERVICE_TOKEN=AURA_TOKEN_23
```

## 🌐 Proveedores Soportados

### 1. Google Gemini (⭐ RECOMENDADO)

- **Límite Gratuito**: 60 requests/minuto
- **Modelo**: gemini-2.0-flash-exp
- **Obtener Clave**: https://makersuite.google.com/app/apikey
- **Ventajas**: 
  - Límite generoso
  - Respuestas rápidas
  - Muy confiable
- **Cómo obtener más claves**:
  - Crear múltiples cuentas de Google
  - Cada cuenta puede tener su propia API key

### 2. OpenAI

- **Límite Gratuito**: $5 créditos iniciales (se agotan rápido)
- **Modelo**: gpt-3.5-turbo
- **Obtener Clave**: https://platform.openai.com/api-keys
- **Ventajas**:
  - Muy preciso
  - Buena comprensión de contexto
- **Desventajas**:
  - Créditos gratuitos limitados
  - Requiere tarjeta para continuar

### 3. Claude (Anthropic)

- **Límite Gratuito**: $5 créditos iniciales
- **Modelo**: claude-3-haiku-20240307
- **Obtener Clave**: https://console.anthropic.com/
- **Ventajas**:
  - Muy inteligente
  - Bueno para tareas complejas
- **Desventajas**:
  - Requiere instalación de SDK: `npm install @anthropic-ai/sdk`

## 📊 Endpoints de Gestión

### Ver Estadísticas de Proveedores

```bash
GET /ai/providers/stats
Authorization: Bearer tu_jwt_token
```

**Respuesta**:
```json
{
  "success": true,
  "stats": {
    "totalProviders": 5,
    "activeProviders": 4,
    "currentProvider": "Google Gemini 1",
    "providers": [
      {
        "id": "gemini_1",
        "name": "Google Gemini 1",
        "type": "gemini",
        "active": true,
        "errorCount": 0,
        "lastError": null
      },
      {
        "id": "gemini_2",
        "name": "Google Gemini 2",
        "type": "gemini",
        "active": true,
        "errorCount": 0,
        "lastError": null
      }
    ]
  }
}
```

### Rotar Proveedores Manualmente

```bash
POST /ai/providers/rotate
Authorization: Bearer tu_jwt_token
```

**Respuesta**:
```json
{
  "success": true,
  "message": "Proveedor rotado a Google Gemini 2",
  "currentProvider": "Google Gemini 2",
  "providerId": "gemini_2"
}
```

## 🔄 Cómo Funciona la Rotación

1. **Detección Automática**: El sistema detecta cuando una API responde con:
   - Error 429 (Too Many Requests)
   - "quota exceeded"
   - "rate limit"
   - "resource exhausted"

2. **Rotación Inmediata**: Cambia al siguiente proveedor disponible

3. **Reactivación**: Los proveedores desactivados se reactivan después de un tiempo

4. **Máximo 3 Reintentos**: Si todos fallan después de 3 intentos, devuelve error

## 💡 Estrategias para Maximizar Uso Gratuito

### Estrategia 1: Múltiples Cuentas Gemini (Fácil)

```env
# 3 cuentas de Google = 180 requests/minuto gratis
GEMINI_API_KEY=cuenta1_key
GEMINI_API_KEY_1=cuenta2_key
GEMINI_API_KEY_2=cuenta3_key
```

### Estrategia 2: Combinar Proveedores (Intermedio)

```env
# Usar Gemini como principal, OpenAI y Claude como respaldo
GEMINI_API_KEY=primary_gemini
GEMINI_API_KEY_1=secondary_gemini
OPENAI_API_KEY=backup_openai
CLAUDE_API_KEY=backup_claude
```

### Estrategia 3: Rotación Completa (Avanzado)

```env
# Máxima cobertura: 6 proveedores
GEMINI_API_KEY=gemini1
GEMINI_API_KEY_1=gemini2
OPENAI_API_KEY=openai1
OPENAI_API_KEY_1=openai2
CLAUDE_API_KEY=claude1
CLAUDE_API_KEY_1=claude2
```

## 🚀 Instalación

### 1. Instalar Dependencias (si usas Claude)

```bash
npm install @anthropic-ai/sdk
```

### 2. Configurar `.env`

Copia tu configuración actual y agrega las claves adicionales:

```env
# Tu configuración actual
GEMINI_API_KEY=tu_clave_actual

# Agregar nuevas claves (opcional)
GEMINI_API_KEY_1=nueva_clave_2
GEMINI_API_KEY_2=nueva_clave_3
```

### 3. Reiniciar el Microservicio

```bash
npm start
```

## 📈 Monitoreo

Ver logs en consola para monitorear la rotación:

```
🤖 Llamando a Google Gemini 1 (Intento 1/3)
✅ Respuesta exitosa de Google Gemini 1

⚠️ Límite de API agotado en Google Gemini 1. Rotando...
🔄 Rotando proveedor...
   ❌ Proveedor actual: Google Gemini 1 (Quota agotada)
   ✅ Nuevo proveedor: Google Gemini 2
```

## ❓ Preguntas Frecuentes

**P: ¿Cuántas claves puedo agregar?**
R: Sin límite. Agrega tantas como quieras usando el formato `_1`, `_2`, `_3`, etc.

**P: ¿Qué proveedor es mejor?**
R: Gemini es el mejor para uso gratuito (60 req/min vs $5 iniciales de otros)

**P: ¿Cómo obtengo más claves de Gemini?**
R: Crea múltiples cuentas de Google. Cada cuenta puede generar su propia API key.

**P: ¿Funciona sin configurar proveedores adicionales?**
R: Sí, sigue funcionando con tu clave de Gemini actual.

**P: ¿Hay costos adicionales?**
R: No, todos los proveedores tienen opciones gratuitas.

## 🔧 Troubleshooting

### Error: "Todos los proveedores fallaron"

1. Verifica que al menos una API key sea válida
2. Revisa las estadísticas: `GET /ai/providers/stats`
3. Los proveedores se reactivan automáticamente después de un tiempo

### Proveedor no rota automáticamente

1. Verifica que el error sea de tipo "quota" (revisa logs)
2. Confirma que tienes múltiples proveedores configurados
3. Reinicia el microservicio

### Claude no funciona

1. Instala el SDK: `npm install @anthropic-ai/sdk`
2. Verifica que la API key sea válida
3. Reinicia el servidor

## 📝 Notas

- La rotación es automática y transparente para el frontend
- Las respuestas se normalizan independientemente del proveedor usado
- El sistema aprende qué proveedores son más confiables

---

¿Necesitas ayuda? Revisa los logs del microservicio para información detallada de depuración.

