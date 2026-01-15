/**
 * Middleware de validación de requests
 * Valida la estructura y campos requeridos según el tipo de request
 */

export function validateRequest(type) {
  return (req, res, next) => {
    console.log(`\n🔍 Validando request tipo: ${type}`);

    const validators = {
      interpret: validateInterpretRequest,
      execute: validateExecuteRequest,
      preview: validatePreviewRequest,
    };

    const validator = validators[type];

    if (!validator) {
      console.error(`❌ Tipo de validación desconocido: ${type}`);
      return res.status(500).json({
        success: false,
        error: `Tipo de validación no implementado: ${type}`,
      });
    }

    try {
      const validation = validator(req.body);

      if (!validation.is_valid) {
        console.error("❌ Validación fallida:");
        validation.errors.forEach((error) => {
          console.error(`   - ${error.field}: ${error.message}`);
        });

        return res.status(400).json({
          success: false,
          error: "Request inválido",
          validation_errors: validation.errors,
        });
      }

      console.log("✅ Validación exitosa");
      next();
    } catch (error) {
      console.error("❌ Error durante validación:", error);
      return res.status(500).json({
        success: false,
        error: "Error interno de validación",
        details: error.message,
      });
    }
  };
}

// ==========================================
// VALIDADORES POR TIPO DE REQUEST
// ==========================================

function validateInterpretRequest(body) {
  const errors = [];

  // Validar user_id
  if (!body.user_id) {
    errors.push({
      field: "user_id",
      message: "Campo 'user_id' requerido",
    });
  } else if (typeof body.user_id !== "number") {
    errors.push({
      field: "user_id",
      message: "Campo 'user_id' debe ser un número",
    });
  }

  // Validar input_type
  if (!body.input_type) {
    errors.push({
      field: "input_type",
      message: "Campo 'input_type' requerido",
    });
  } else if (!["text", "voice"].includes(body.input_type)) {
    errors.push({
      field: "input_type",
      message: "Campo 'input_type' debe ser 'text' o 'voice'",
    });
  }

  // Validar payload (el mensaje del usuario)
  if (!body.payload || typeof body.payload !== "string") {
    errors.push({
      field: "payload",
      message: "Campo 'payload' requerido y debe ser string",
    });
  } else if (body.payload.trim().length === 0) {
    errors.push({
      field: "payload",
      message: "El mensaje no puede estar vacío",
    });
  } else if (body.payload.length > 2000) {
    errors.push({
      field: "payload",
      message: "El mensaje es demasiado largo (máximo 2000 caracteres)",
    });
  }

  // Validar context (opcional pero debe ser objeto si existe)
  if (body.context !== undefined && typeof body.context !== "object") {
    errors.push({
      field: "context",
      message: "Campo 'context' debe ser un objeto",
    });
  }

  return {
    is_valid: errors.length === 0,
    errors,
  };
}

function validateExecuteRequest(body) {
  const errors = [];

  // Validar user_id
  if (!body.user_id) {
    errors.push({
      field: "user_id",
      message: "Campo 'user_id' requerido",
    });
  } else if (typeof body.user_id !== "number") {
    errors.push({
      field: "user_id",
      message: "Campo 'user_id' debe ser un número",
    });
  }

  // Validar función
  if (!body.function_name || typeof body.function_name !== "string") {
    errors.push({
      field: "function_name",
      message: "Campo 'function_name' requerido y debe ser string",
    });
  }

  // Validar parámetros
  if (!body.parameters || typeof body.parameters !== "object") {
    errors.push({
      field: "parameters",
      message: "Campo 'parameters' requerido y debe ser objeto",
    });
  }

  // confirmation_token es opcional
  if (
    body.confirmation_token !== undefined &&
    body.confirmation_token !== null &&
    typeof body.confirmation_token !== "string"
  ) {
    errors.push({
      field: "confirmation_token",
      message: "Campo 'confirmation_token' debe ser string o null",
    });
  }

  return {
    is_valid: errors.length === 0,
    errors,
  };
}

function validatePreviewRequest(body) {
  const errors = [];

  // Validar user_id
  if (!body.user_id) {
    errors.push({
      field: "user_id",
      message: "Campo 'user_id' requerido",
    });
  } else if (typeof body.user_id !== "number") {
    errors.push({
      field: "user_id",
      message: "Campo 'user_id' debe ser un número",
    });
  }

  // Validar función
  if (!body.function_name || typeof body.function_name !== "string") {
    errors.push({
      field: "function_name",
      message: "Campo 'function_name' requerido y debe ser string",
    });
  }

  // Validar parámetros
  if (!body.parameters || typeof body.parameters !== "object") {
    errors.push({
      field: "parameters",
      message: "Campo 'parameters' requerido y debe ser objeto",
    });
  }

  return {
    is_valid: errors.length === 0,
    errors,
  };
}
