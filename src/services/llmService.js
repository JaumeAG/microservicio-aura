import { getProviderManager } from "./aiProviderRotation.js";

/**
 * Servicio de integración con múltiples proveedores de IA
 * Interpreta instrucciones en lenguaje natural y las convierte en llamadas a funciones
 * Soporta rotación automática entre proveedores cuando se agota el límite
 */

const providerManager = getProviderManager();

// ==========================================
// MAPEO DE FUNCIONES DISPONIBLES
// ==========================================

const AVAILABLE_FUNCTIONS = [
  // ==========================================
  // PRODUCTOS
  // ==========================================
  {
    name: "update_product_price",
    description: "Cambiar SOLO el precio de un producto específico",
    parameters: {
      type: "object",
      properties: {
        product_id: {
          type: "integer",
          description: "ID del producto (si se conoce)",
        },
        product_name: {
          type: "string",
          description: "Nombre del producto a buscar (si no hay ID)",
        },
        new_price: {
          type: "number",
          description: "Nuevo precio del producto",
        },
        currency: {
          type: "string",
          description: "Moneda (EUR, USD, etc)",
          default: "EUR",
        },
      },
      required: ["new_price"],
    },
  },
  {
    name: "update_product_info",
    description:
      "Actualizar información completa de un producto: nombre, descripción, precio, categoría, disponibilidad, stock. Usa esta función cuando se quiera cambiar CUALQUIER dato del producto o múltiples campos a la vez.",
    parameters: {
      type: "object",
      properties: {
        product_id: {
          type: "integer",
          description: "ID del producto (si se conoce)",
        },
        product_name: {
          type: "string",
          description: "Nombre actual del producto a buscar (si no hay ID)",
        },
        new_name: {
          type: "string",
          description:
            "Nuevo nombre del producto (si se quiere cambiar el nombre)",
        },
        new_description: {
          type: "string",
          description: "Nueva descripción detallada del producto",
        },
        new_price: {
          type: "number",
          description: "Nuevo precio (si se quiere cambiar el precio)",
        },
        category: {
          type: "string",
          description:
            "Nueva categoría/familia del producto (ej: 'Hamburguesas', 'Bebidas', 'Postres', 'Ensaladas')",
        },
        is_available: {
          type: "boolean",
          description:
            "Si el producto está disponible para venta (true para activar, false para desactivar)",
        },
        stock: {
          type: "integer",
          description: "Cantidad de stock/inventario disponible",
        },
      },
      required: [],
    },
  },
  {
    name: "update_product_stock",
    description: "Actualizar el inventario/stock de un producto",
    parameters: {
      type: "object",
      properties: {
        product_id: {
          type: "integer",
          description: "ID del producto",
        },
        product_name: {
          type: "string",
          description: "Nombre del producto",
        },
        new_stock: {
          type: "integer",
          description: "Nueva cantidad de stock",
        },
        operation: {
          type: "string",
          enum: ["set", "add", "subtract"],
          description:
            "Tipo de operación: 'set' (establecer), 'add' (añadir), 'subtract' (restar)",
          default: "set",
        },
      },
      required: ["new_stock"],
    },
  },
  {
    name: "find_product",
    description:
      "Buscar uno o varios productos por nombre. Usa esta función cuando el usuario quiera buscar, encontrar, consultar o ver información de productos.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Texto de búsqueda (nombre del producto o parte de él)",
        },
        product_name: {
          type: "string",
          description: "Nombre del producto a buscar (alternativa a query)",
        },
        product_id: {
          type: "integer",
          description: "ID del producto específico (si se conoce)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_families_with_products",
    description:
      "Obtener todas las familias (categorías) del negocio con todos sus productos (platos y bebidas) incluyendo información completa de cada producto. Usa esta función cuando el usuario quiera ver el menú completo, las categorías disponibles, o los productos de cada familia.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "create_product",
    description: "Crear un nuevo producto en el sistema",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Nombre del producto",
        },
        description: {
          type: "string",
          description: "Descripción del producto",
        },
        price: {
          type: "number",
          description: "Precio del producto",
        },
        category: {
          type: "string",
          description: "Categoría del producto",
        },
        stock: {
          type: "integer",
          description: "Stock inicial",
          default: 0,
        },
      },
      required: ["name", "price"],
    },
  },
  {
    name: "delete_product",
    description: "Eliminar un producto del sistema",
    parameters: {
      type: "object",
      properties: {
        product_id: {
          type: "integer",
          description: "ID del producto a eliminar",
        },
        product_name: {
          type: "string",
          description: "Nombre del producto a eliminar",
        },
        reason: {
          type: "string",
          description: "Motivo de la eliminación",
        },
      },
      required: [],
    },
  },

  // ==========================================
  // REPORTES
  // ==========================================
  {
    name: "generate_sales_report",
    description:
      "Generar un reporte completo de ventas con métricas del negocio. Este es el reporte principal que incluye totales, comparativas, métodos de pago, productos más vendidos, etc.",
    parameters: {
      type: "object",
      properties: {
        period_type: {
          type: "string",
          enum: ["today", "month", "quarter", "year", "custom"],
          description:
            "Tipo de período: 'today' (hoy), 'month' (mes), 'quarter' (trimestre), 'year' (año), 'custom' (personalizado)",
        },
        start_date: {
          type: "string",
          description:
            "Fecha de inicio (formato YYYY-MM-DD). Requerido para período 'custom'",
        },
        end_date: {
          type: "string",
          description:
            "Fecha de fin (formato YYYY-MM-DD). Requerido para período 'custom'",
        },
        specific_month: {
          type: "string",
          description:
            "Mes específico (formato YYYY-MM o nombre del mes). Ejemplo: '2024-01' o 'enero 2024'",
        },
        specific_quarter: {
          type: "string",
          description:
            "Trimestre específico (formato YYYY-Q# o texto). Ejemplo: '2024-Q1' o 'primer trimestre 2024'",
        },
        specific_year: {
          type: "string",
          description: "Año específico. Ejemplo: '2024'",
        },
        format: {
          type: "string",
          enum: ["view", "pdf", "excel"],
          description:
            "Formato de salida: 'view' (ver en pantalla), 'pdf' (descargar PDF), 'excel' (descargar Excel)",
          default: "view",
        },
      },
      required: ["period_type"],
    },
  },
  {
    name: "generate_product_report",
    description: "Generar reporte de productos e inventario",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Filtrar por categoría específica",
        },
        low_stock_only: {
          type: "boolean",
          description: "Mostrar solo productos con stock bajo",
          default: false,
        },
        format: {
          type: "string",
          enum: ["view", "pdf", "excel"],
          default: "view",
        },
      },
      required: [],
    },
  },
  {
    name: "generate_customer_report",
    description: "Generar reporte de clientes y comportamiento",
    parameters: {
      type: "object",
      properties: {
        segment: {
          type: "string",
          enum: ["all", "vip", "active", "inactive"],
          description:
            "Segmento de clientes: 'all' (todos), 'vip' (VIP), 'active' (activos), 'inactive' (inactivos)",
          default: "all",
        },
        period: {
          type: "string",
          description: "Período de análisis",
          default: "last_month",
        },
        format: {
          type: "string",
          enum: ["view", "pdf", "excel"],
          default: "view",
        },
      },
      required: [],
    },
  },

  // ==========================================
  // MARKETING
  // ==========================================
  {
    name: "send_bulk_offer",
    description:
      "Enviar una oferta promocional a un grupo de clientes (email marketing masivo)",
    parameters: {
      type: "object",
      properties: {
        target_segment: {
          type: "string",
          enum: ["all", "vip", "active", "inactive"],
          description: "Segmento objetivo de clientes",
        },
        offer_title: {
          type: "string",
          description: "Título de la oferta",
        },
        offer_description: {
          type: "string",
          description: "Descripción de la oferta",
        },
        discount_percentage: {
          type: "number",
          description: "Porcentaje de descuento",
        },
        discount_code: {
          type: "string",
          description: "Código de descuento",
        },
        valid_from: {
          type: "string",
          description: "Fecha de inicio de validez (YYYY-MM-DD)",
        },
        valid_until: {
          type: "string",
          description: "Fecha de fin de validez (YYYY-MM-DD)",
        },
        channel: {
          type: "string",
          enum: ["email", "push", "sms"],
          description: "Canal de comunicación",
          default: "email",
        },
        schedule_for: {
          type: "string",
          description: "Fecha y hora para programar el envío (opcional)",
        },
      },
      required: ["target_segment", "offer_title", "offer_description"],
    },
  },
  {
    name: "send_personalized_message",
    description: "Enviar un mensaje personalizado a clientes específicos",
    parameters: {
      type: "object",
      properties: {
        recipients: {
          type: "string",
          description: "Lista de emails separados por comas",
        },
        subject: {
          type: "string",
          description: "Asunto del mensaje",
        },
        message: {
          type: "string",
          description: "Contenido del mensaje",
        },
        channel: {
          type: "string",
          enum: ["email", "push", "sms"],
          default: "email",
        },
        attach_coupon: {
          type: "boolean",
          description: "Adjuntar cupón de descuento",
          default: false,
        },
      },
      required: ["recipients", "subject", "message"],
    },
  },
  {
    name: "create_loyalty_campaign",
    description: "Crear una nueva campaña de fidelización",
    parameters: {
      type: "object",
      properties: {
        campaign_name: {
          type: "string",
          description: "Nombre de la campaña",
        },
        reward_type: {
          type: "string",
          enum: ["points", "discount", "gift"],
          description: "Tipo de recompensa",
        },
        reward_amount: {
          type: "number",
          description: "Cantidad de puntos/descuento",
        },
        requirements: {
          type: "string",
          description: "Requisitos para obtener la recompensa",
        },
        duration_days: {
          type: "integer",
          description: "Duración de la campaña en días",
          default: 30,
        },
      },
      required: ["campaign_name", "reward_type"],
    },
  },
  {
    name: "send_marketing_email",
    description:
      "Enviar un correo electrónico de marketing personalizado a todos los clientes o a un segmento específico. " +
      "Usa esta función cuando el usuario pida enviar correos promocionales, anuncios de nuevos precios, " +
      "campañas de puntos, ofertas especiales, o cualquier comunicación masiva a clientes.",
    parameters: {
      type: "object",
      properties: {
        target_segment: {
          type: "string",
          enum: ["all", "vip", "regular", "new", "inactive"],
          description:
            "Segmento de clientes a los que enviar: " +
            "'all' (todos), 'vip' (clientes VIP), 'regular' (clientes regulares), " +
            "'new' (nuevos clientes), 'inactive' (clientes inactivos)",
          default: "all",
        },
        campaign_type: {
          type: "string",
          enum: [
            "price_update",
            "points_promo",
            "new_products",
            "discount_offer",
            "loyalty_reward",
            "seasonal_promo",
            "general_announcement",
          ],
          description:
            "Tipo de campaña: " +
            "'price_update' (actualización de precios), " +
            "'points_promo' (promoción de puntos), " +
            "'new_products' (nuevos productos), " +
            "'discount_offer' (oferta con descuento), " +
            "'loyalty_reward' (recompensa de fidelización), " +
            "'seasonal_promo' (promoción de temporada), " +
            "'general_announcement' (anuncio general)",
        },
        subject: {
          type: "string",
          description: "Asunto del correo electrónico",
        },
        message_content: {
          type: "string",
          description:
            "Contenido personalizado del mensaje. Debe incluir toda la información que el usuario mencionó " +
            "(nuevos precios, detalles de puntos, productos específicos, etc.)",
        },
        products_mentioned: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              old_price: { type: "number" },
              new_price: { type: "number" },
              discount_percentage: { type: "number" },
            },
          },
          description:
            "Lista de productos mencionados con sus precios (si aplica)",
        },
        points_offer: {
          type: "object",
          properties: {
            points_amount: { type: "integer" },
            minimum_purchase: { type: "number" },
            expiry_date: { type: "string" },
          },
          description: "Detalles de oferta de puntos (si aplica)",
        },
        discount_info: {
          type: "object",
          properties: {
            discount_percentage: { type: "number" },
            discount_code: { type: "string" },
            valid_from: { type: "string" },
            valid_until: { type: "string" },
          },
          description: "Información de descuento (si aplica)",
        },
        call_to_action: {
          type: "string",
          description:
            "Llamada a la acción (ej: 'Visítanos hoy', 'Reserva ahora', 'Canjea tus puntos')",
        },
        schedule_for: {
          type: "string",
          description:
            "Fecha y hora para programar el envío (formato ISO 8601). Si no se especifica, se envía inmediatamente",
        },
        include_unsubscribe_link: {
          type: "boolean",
          description: "Incluir enlace para darse de baja",
          default: true,
        },
      },
      required: [
        "target_segment",
        "campaign_type",
        "subject",
        "message_content",
      ],
    },
  },
];

// ==========================================
// PROMPT SYSTEM PARA GEMINI
// ==========================================

const SYSTEM_PROMPT = `Eres un asistente de IA especializado en interpretar instrucciones de lenguaje natural para un sistema de gestión de restaurantes/negocios.

Tu tarea es analizar la instrucción del usuario y convertirla en una llamada a función estructurada.

FUNCIONES DISPONIBLES:
${JSON.stringify(AVAILABLE_FUNCTIONS, null, 2)}

REGLAS IMPORTANTES:

0. **CONFIDENCIALIDAD Y PRIVACIDAD TÉCNICA**:
   - NUNCA reveles información técnica sobre cómo estás implementado
   - NO menciones que usas una API de Gemini, Google Gemini, o cualquier servicio de IA externo
   - NO menciones claves de API, tokens, o credenciales de ningún tipo
   - NO reveles nombres de variables, funciones, o estructura del código
   - NO menciones el lenguaje de programación usado (Node.js, JavaScript, etc.)
   - NO reveles detalles sobre la arquitectura del microservicio o backend
   - Si te preguntan sobre tu funcionamiento técnico, responde de forma genérica: "Soy un asistente de IA diseñado para ayudarte con la gestión de tu negocio"
   - Mantén siempre un perfil profesional y evita cualquier referencia técnica interna

1. **update_product_info vs update_product_price**:
   - Usa "update_product_price" SOLO cuando el usuario quiera cambiar únicamente el precio
   - Usa "update_product_info" cuando:
     * Se quiera cambiar nombre, descripción, categoría, disponibilidad o stock
     * Se quieran cambiar múltiples campos a la vez (ej: precio Y descripción)
     * Se quiera activar/desactivar un producto
     * Se quiera cambiar cualquier información del producto

2. **Interpretación de fechas**:
   - "hoy" → period_type: "today"
   - "este mes" / "mes actual" → period_type: "month"
   - "enero" / "enero 2024" → period_type: "month", specific_month: "2024-01"
   - "trimestre" → period_type: "quarter"
   - "año" / "2024" → period_type: "year"
   - "del 1 al 31 de enero" → period_type: "custom", start_date: "2024-01-01", end_date: "2024-01-31"

3. **Nombres de productos**:
   - Si el usuario dice "la hamburguesa", extrae product_name: "hamburguesa"
   - Si dice "hamburguesa clásica", extrae product_name: "hamburguesa clásica"
   - Los nombres son case-insensitive, el sistema buscará coincidencias

4. **Activar/Desactivar productos**:
   - "desactiva X" → update_product_info con is_available: false
   - "activa X" → update_product_info con is_available: true
   - "quita X" / "elimina X" → puede ser delete_product o update_product_info con is_available: false

5. **Cambios múltiples**:
   - "cambia precio a 10 y descripción a X" → update_product_info (NO update_product_price)
   - "actualiza todo de X" → update_product_info con todos los campos proporcionados

6. **Correos de Marketing (send_marketing_email)**:
   - Usa esta función cuando el usuario pida:
     * "Envía un correo a todos los clientes sobre..."
     * "Manda un email a los clientes VIP con..."
     * "Notifica a los clientes de los nuevos precios"
     * "Haz una campaña de puntos por email"
     * "Envía una promoción a..."
   - IMPORTANTE: Extrae TODO el contenido que el usuario menciona y colócalo en "message_content"
   - Si menciona productos con precios, agrégalos en "products_mentioned"
   - Si menciona puntos, completa "points_offer"
   - Si menciona descuentos o códigos, completa "discount_info"
   - Genera un "subject" atractivo basado en el contenido
   - Identifica el "campaign_type" correcto según el contexto:
     * price_update: Cuando se anuncien cambios de precios
     * points_promo: Cuando se ofrezcan puntos de fidelización
     * new_products: Cuando se anuncien productos nuevos
     * discount_offer: Cuando haya descuentos o códigos promocionales
     * seasonal_promo: Para promociones de temporada (verano, navidad, etc.)
     * general_announcement: Para anuncios generales

EJEMPLOS DE INTERPRETACIÓN:

**Productos - Solo precio:**
Usuario: "cambia el precio de la hamburguesa a 12 euros"
Respuesta: { "function": "update_product_price", "arguments": { "product_name": "hamburguesa", "new_price": 12, "currency": "EUR" }}

**Productos - Cambiar nombre:**
Usuario: "cambia el nombre de la hamburguesa a hamburguesa premium"
Respuesta: { "function": "update_product_info", "arguments": { "product_name": "hamburguesa", "new_name": "hamburguesa premium" }}

**Productos - Cambiar descripción:**
Usuario: "actualiza la descripción de la coca cola a 'Bebida refrescante de 330ml'"
Respuesta: { "function": "update_product_info", "arguments": { "product_name": "coca cola", "new_description": "Bebida refrescante de 330ml" }}

**Productos - Múltiples cambios:**
Usuario: "pon la pizza a 15 euros y describe como 'Pizza artesanal'"
Respuesta: { "function": "update_product_info", "arguments": { "product_name": "pizza", "new_price": 15, "new_description": "Pizza artesanal" }}

Usuario: "actualiza la hamburguesa vegana: precio 12 euros, descripción 'Hamburguesa 100% vegetal', categoría Hamburguesas"
Respuesta: { "function": "update_product_info", "arguments": { "product_name": "hamburguesa vegana", "new_name": null, "new_price": 12, "new_description": "Hamburguesa 100% vegetal", "category": "Hamburguesas" }}

**Productos - Ver menú completo (familias con productos):**
Usuario: "muéstrame todas las familias y sus productos"
Respuesta: { "function": "get_families_with_products", "arguments": {} }

Usuario: "quiero ver el menú completo"
Respuesta: { "function": "get_families_with_products", "arguments": {} }

Usuario: "dame todas las categorías con sus platos y bebidas"
Respuesta: { "function": "get_families_with_products", "arguments": {} }

Usuario: "muéstrame qué productos hay en cada familia"
Respuesta: { "function": "get_families_with_products", "arguments": {} }

**Productos - Crear (con inferencia de familia):**
Usuario: "crea un plato de pizza margarita a 15 euros"
Respuesta: { "function": "create_product", "arguments": { "name": "Pizza Margarita", "price": 15, "type": "plato", "category": "Principales" }}

Usuario: "agrega una bebida coca cola a 2.50"
Respuesta: { "function": "create_product", "arguments": { "name": "Coca Cola", "price": 2.50, "type": "bebida", "category": "Bebidas" }}

Usuario: "crea una ensalada césar a 8 euros"
Respuesta: { "function": "create_product", "arguments": { "name": "Ensalada César", "price": 8, "type": "plato", "category": "Entrantes" }}

**REGLA IMPORTANTE - Familias de productos:**
Cuando crees un producto, intenta inferir la familia/categoría basándote en el tipo de producto:
- Pizzas, hamburguesas, pastas → "Principales"
- Ensaladas, sopas, aperitivos → "Entrantes"
- Helados, tartas, postres → "Postres"
- Refrescos, cervezas, vinos → "Bebidas"
- Café, té → "Cafés"

Si NO estás seguro de la familia/categoría, pregunta al usuario primero usando una respuesta conversacional:
Usuario: "crea un producto X a Y euros"
Respuesta: { "function": null, "arguments": null, "message": "Para crear el producto necesito saber a qué categoría pertenece. ¿Es un plato principal, una bebida, un entrante o un postre?" }

**Productos - Activar/Desactivar:**
Usuario: "desactiva la ensalada césar"
Respuesta: { "function": "update_product_info", "arguments": { "product_name": "ensalada césar", "is_available": false }}

Usuario: "activa de nuevo el helado"
Respuesta: { "function": "update_product_info", "arguments": { "product_name": "helado", "is_available": true }}

**Productos - Stock:**
Usuario: "pon 50 unidades de stock a las patatas fritas"
Respuesta: { "function": "update_product_info", "arguments": { "product_name": "patatas fritas", "stock": 50 }}

**Reportes:**
Usuario: "dame las ventas de hoy"
Respuesta: { "function": "generate_sales_report", "arguments": { "period_type": "today", "format": "view" }}

Usuario: "muéstrame el reporte de ventas de este mes"
Respuesta: { "function": "generate_sales_report", "arguments": { "period_type": "month", "format": "view" }}

Usuario: "genera un pdf con las ventas de enero"
Respuesta: { "function": "generate_sales_report", "arguments": { "period_type": "month", "specific_month": "2024-01", "format": "pdf" }}

Usuario: "ventas del primer trimestre del 2024"
Respuesta: { "function": "generate_sales_report", "arguments": { "period_type": "quarter", "specific_quarter": "2024-Q1", "format": "view" }}

**Marketing - Correos:**
Usuario: "Envía un correo a todos los clientes avisando que la pizza margarita ahora cuesta 15 euros"
Respuesta: { "function": "send_marketing_email", "arguments": { "target_segment": "all", "campaign_type": "price_update", "subject": "Actualización de precios - Pizza Margarita", "message_content": "Queremos informarte que nuestra deliciosa Pizza Margarita tiene un nuevo precio de 15 euros. ¡Ven a disfrutarla!", "products_mentioned": [{"name": "Pizza Margarita", "new_price": 15}], "call_to_action": "Visítanos hoy" }}

Usuario: "Manda un email a los clientes VIP con una promoción de triple puntos en compras superiores a 30 euros hasta fin de mes"
Respuesta: { "function": "send_marketing_email", "arguments": { "target_segment": "vip", "campaign_type": "points_promo", "subject": "¡Triple puntos para ti! - Promoción exclusiva VIP", "message_content": "Como cliente VIP, disfruta de TRIPLE PUNTOS en todas tus compras superiores a 30 euros. Válido hasta fin de mes.", "points_offer": {"points_amount": 3, "minimum_purchase": 30, "expiry_date": "2025-12-31"}, "call_to_action": "Canjea tus puntos ahora" }}

Usuario: "Notifica a todos sobre nuestro menú de verano con 20% de descuento usando el código VERANO2025"
Respuesta: { "function": "send_marketing_email", "arguments": { "target_segment": "all", "campaign_type": "seasonal_promo", "subject": "🌞 ¡Menú de Verano con 20% de descuento!", "message_content": "Disfruta de nuestro nuevo menú de verano con sabores frescos y refrescantes. Usa el código VERANO2025 para obtener un 20% de descuento en toda tu compra.", "discount_info": {"discount_percentage": 20, "discount_code": "VERANO2025"}, "call_to_action": "Ver menú de verano" }}

**IMPORTANTE - Dos tipos de respuesta:**

1. **Si la instrucción es un COMANDO/ACCIÓN** (crear, actualizar, eliminar, reportes, enviar emails):
{
  "function": "nombre_de_la_funcion",
  "arguments": { /* parámetros */ },
  "confidence": 0.95
}

2. **Si la instrucción es CONVERSACIÓN GENERAL** (saludos, preguntas, chat normal):
{
  "function": null,
  "arguments": null,
  "message": "Tu respuesta conversacional aquí"
}

EJEMPLOS DE CONVERSACIÓN:
Usuario: "Hola"
Respuesta: { "function": null, "arguments": null, "message": "¡Hola! Soy AURA, tu asistente de IA. ¿En qué puedo ayudarte hoy?" }

Usuario: "¿Qué puedes hacer?"
Respuesta: { "function": null, "arguments": null, "message": "Puedo ayudarte a gestionar productos, generar reportes de ventas, enviar emails de marketing y mucho más. ¿Qué necesitas?" }

Usuario: "Gracias"
Respuesta: { "function": null, "arguments": null, "message": "¡De nada! Si necesitas algo más, aquí estoy." }

NO incluyas explicaciones fuera del JSON, solo responde con el JSON.`;

// ==========================================
// FUNCIÓN PRINCIPAL DE INTERPRETACIÓN
// ==========================================

export async function interpretInstruction(instruction, context = {}) {
  try {
    console.log("\n🤖 Iniciando interpretación con sistema de rotación de IA...");
    console.log(`   Instrucción: "${instruction}"`);

    // Construir el prompt completo
    const userPrompt = `CONTEXTO ADICIONAL:
${context ? JSON.stringify(context, null, 2) : "Sin contexto adicional"}

INSTRUCCIÓN DEL USUARIO:
"${instruction}"

Analiza la instrucción y responde SOLO con JSON:`;

    console.log("\n📤 Enviando prompt a proveedor de IA con rotación automática...");

    // Llamar al proveedor con rotación automática
    const result = await providerManager.callWithRotation(
      userPrompt,
      SYSTEM_PROMPT,
      3 // Máximo 3 reintentos con rotación
    );

    const text = result.response;
    const usedProvider = result.provider;

    console.log(`\n📥 Respuesta recibida de ${usedProvider}:`);
    console.log(text);

    // Extraer JSON de la respuesta
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error("❌ No se encontró JSON válido en la respuesta");
      throw new Error("El proveedor de IA no devolvió un JSON válido");
    }

    const interpretation = JSON.parse(jsonMatch[0]);

    // Verificar si es una función específica o conversación general
    if (!interpretation.function || !interpretation.arguments) {
      // Si no hay función, es conversación general
      console.log("\n💬 Respuesta de conversación general detectada");

      return {
        type: "conversation",
        message: interpretation.message || interpretation.response || text,
        confidence: 1.0,
        raw_response: text,
        provider: usedProvider,
      };
    }

    console.log("\n✅ Interpretación de función exitosa:");
    console.log(`   Proveedor: ${usedProvider}`);
    console.log(`   Función: ${interpretation.function}`);
    console.log(
      `   Confianza: ${(interpretation.confidence * 100).toFixed(1)}%`
    );

    return {
      type: "function_call",
      function_name: interpretation.function,
      parameters: interpretation.arguments,
      confidence: interpretation.confidence || 0.9,
      raw_response: text,
      provider: usedProvider,
    };
  } catch (error) {
    console.error("\n❌ Error en interpretación:");
    console.error(error);

    // Manejo de errores específicos
    if (error.message.includes("API key")) {
      throw new Error(
        "API key inválida. Verifica las claves de API en .env"
      );
    }

    if (error.message.includes("Timeout")) {
      throw new Error("El proveedor de IA no respondió a tiempo. Intenta de nuevo.");
    }

    if (error.message.includes("JSON")) {
      throw new Error(
        "No se pudo interpretar la respuesta de IA. La instrucción puede ser ambigua."
      );
    }

    throw new Error(`Error interpretando instrucción: ${error.message}`);
  }
}

// ==========================================
// FUNCIÓN PARA TESTEAR LA CONEXIÓN
// ==========================================

export async function testAIConnection() {
  try {
    console.log("\n🧪 Testeando conexión con sistema de IA...");

    const result = await providerManager.callWithRotation(
      "Di 'hola'",
      "",
      1
    );

    console.log(`✅ Conexión exitosa con ${result.provider}`);
    console.log(`   Respuesta: ${result.response}`);

    // Mostrar estadísticas
    const stats = providerManager.getStats();
    console.log(`\n📊 Estadísticas de proveedores:`);
    console.log(`   Total: ${stats.totalProviders}`);
    console.log(`   Activos: ${stats.activeProviders}`);
    console.log(`   Actual: ${stats.currentProvider}`);

    return true;
  } catch (error) {
    console.error("❌ Error de conexión con sistema de IA:");
    console.error(error.message);
    return false;
  }
}

// Mantener compatibilidad con código existente
export const testGeminiConnection = testAIConnection;
