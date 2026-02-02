/**
 * Utilidad para formatear errores técnicos en mensajes amigables para el usuario final de AURA
 */

export function formatUserFriendlyError(error) {
  const errorMessage = error.message || String(error);

  // 1. Errores de Conexión con Laravel (Backend)
  if (
    errorMessage.includes("ECONNREFUSED") ||
    errorMessage.includes("Network Error") ||
    errorMessage.includes("fetch failed")
  ) {
    return {
      title: "🔌 Error de Conexión",
      message:
        "No pude conectar con el sistema central (Laravel). Parece que el servidor está apagado o no responde.",
      suggestion:
        "Por favor, contacta con soporte técnico o verifica que el backend esté funcionando.",
      technical: errorMessage,
    };
  }

  // 2. Errores de API Key / Cuota de IA (Gemini/OpenAI)
  if (
    errorMessage.includes("quota") ||
    errorMessage.includes("429") ||
    errorMessage.includes("billing") ||
    errorMessage.includes("insufficient_quota") ||
    errorMessage.includes("API key not valid")
  ) {
    return {
      title: "🧠 Cerebro Agotado",
      message:
        "He alcanzado mi límite de pensamiento por hoy o hay un problema con mi llave de acceso a la IA.",
      suggestion:
        "Intenta de nuevo mañana o contacta al administrador para revisar el plan de facturación de la IA.",
      technical: errorMessage,
    };
  }

  // 3. Error: Función no encontrada
  if (
    errorMessage.includes("Función no encontrada") ||
    errorMessage.includes("Función no soportada")
  ) {
    return {
      title: "🤔 Habilidad Desconocida",
      message:
        "Entendí tu intención, pero no tengo una herramienta específica programada para realizar esa acción.",
      suggestion:
        "Intenta reformular tu petición o verifica si tengo permisos para hacer eso.",
      technical: errorMessage,
    };
  }

  // 4a. Errores de Validación de Laravel (422) o Internos
  if (
    errorMessage.includes("Faltan parámetros") ||
    errorMessage.includes("parámetros inválidos") ||
    errorMessage.includes("Validation Error") ||
    errorMessage.includes("The given data was invalid")
  ) {
    return {
      title: "📝 Información Incompleta",
      message: "Algunos datos no son correctos o faltan detalles.",
      suggestion: "Revisa la información e intenta de nuevo.",
      technical: errorMessage,
    };
  }

  // 4b. Recurso no encontrado (404)
  if (
    errorMessage.includes("Recurso no encontrado") ||
    errorMessage.includes("No query results for model")
  ) {
    return {
      title: "🔍 No Encontrado",
      message:
        "No pude encontrar el recurso (producto, cliente, etc.) que mencionaste.",
      suggestion: "Verifica que el nombre o ID sea correcto.",
      technical: errorMessage,
    };
  }

  // 5. Errores del Backend (Laravel 500, etc)
  if (
    errorMessage.includes("Error al generar archivo") ||
    errorMessage.includes("Error HTML de Laravel")
  ) {
    return {
      title: "🔥 Error en el Sistema",
      message:
        "El sistema central tuvo un problema interno al procesar tu solicitud.",
      suggestion:
        "Intenta de nuevo en unos minutos. Si persiste, es posible que haya un bug en el código del servidor.",
      technical: errorMessage,
    };
  }

  // 6. Base de Datos
  if (
    errorMessage.includes("SQL") ||
    errorMessage.includes("database") ||
    errorMessage.includes("base de datos") ||
    errorMessage.includes("Connection refused") ||
    errorMessage.includes("SQLSTATE")
  ) {
    return {
      title: "🗄️ Problema de Datos",
      message: "No pude acceder a la información en la base de datos.",
      suggestion: "Verifica la conexión a la base de datos del sistema.",
      technical: errorMessage,
    };
  }

  // 7. Token / Autenticación
  if (
    errorMessage.includes("Token") ||
    errorMessage.includes("token") ||
    errorMessage.includes("unauthorized") ||
    errorMessage.includes("401") ||
    errorMessage.includes("403")
  ) {
    return {
      title: "🔒 Acceso Denegado",
      message:
        "No tengo permiso para realizar esta acción o tu sesión ha expirado.",
      suggestion: "Prueba recargando la página o iniciando sesión nuevamente.",
      technical: errorMessage,
    };
  }

  // 8. Timeout
  if (errorMessage.includes("timeout") || errorMessage.includes("time out")) {
    return {
      title: "⏱️ Tiempo de Espera Agotado",
      message: "La operación tardó demasiado y tuve que cancelarla.",
      suggestion:
        "Intenta con una petición más sencilla o divide la tarea en partes.",
      technical: errorMessage,
    };
  }

  // Fallback Genérico
  return {
    title: "⚠️ Algo salió mal",
    message: "Tuve un problema inesperado al intentar ayudarte.",
    suggestion:
      "Por favor intenta de nuevo. Si el error continúa, contacta a soporte.",
    technical: errorMessage,
  };
}
