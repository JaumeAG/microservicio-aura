/**
 * Servicio de validación de parámetros de funciones
 * Valida que los parámetros recibidos cumplan con las reglas de negocio
 */

export async function validateActionParameters(functionName, parameters) {
  console.log(`\n🔍 Validando parámetros para: ${functionName}`);

  const validators = {
    update_product_price: validateUpdateProductPrice,
    update_family_prices: validateUpdateFamilyPrices,
    update_product_info: validateUpdateProductInfo,
    update_product_stock: validateUpdateProductStock,
    create_product: validateCreateProduct,
    delete_product: validateDeleteProduct,
    generate_sales_report: validateGenerateSalesReport,
    generate_customer_report: validateGenerateCustomerReport,
    send_bulk_offer: validateSendBulkOffer,
    send_personalized_message: validateSendPersonalizedMessage,
    create_loyalty_campaign: validateCreateLoyaltyCampaign,
  };

  const validator = validators[functionName];

  if (!validator) {
    console.warn(`⚠️ No hay validador para: ${functionName}`);
    return {
      is_valid: true,
      errors: [],
      warnings: [
        {
          field: "function",
          message: `No hay validación específica para ${functionName}`,
        },
      ],
    };
  }

  try {
    const result = await validator(parameters);

    if (result.errors.length > 0) {
      console.error("❌ Errores de validación encontrados:");
      result.errors.forEach((error) => {
        console.error(`   - ${error.field}: ${error.message}`);
      });
    }

    if (result.warnings.length > 0) {
      console.warn("⚠️ Warnings de validación:");
      result.warnings.forEach((warning) => {
        console.warn(`   - ${warning.field}: ${warning.message}`);
      });
    }

    if (result.is_valid) {
      console.log("✅ Validación exitosa");
    }

    return result;
  } catch (error) {
    console.error("❌ Error durante validación:", error);
    return {
      is_valid: false,
      errors: [
        {
          field: "validation",
          message: `Error interno de validación: ${error.message}`,
        },
      ],
      warnings: [],
    };
  }
}

// ==========================================
// VALIDADORES - PRODUCTOS
// ==========================================

async function validateUpdateProductPrice(params) {
  const errors = [];
  const warnings = [];

  // Validar que hay identificador del producto
  if (!params.product_id && !params.product_name) {
    errors.push({
      field: "product_id/product_name",
      message: "Se requiere el ID o nombre del producto",
    });
  }

  // Validar precio
  if (params.new_price === undefined || params.new_price === null) {
    errors.push({
      field: "new_price",
      message: "El nuevo precio es requerido",
    });
  } else {
    if (typeof params.new_price !== "number" || isNaN(params.new_price)) {
      errors.push({
        field: "new_price",
        message: "El precio debe ser un número válido",
      });
    } else if (params.new_price < 0) {
      errors.push({
        field: "new_price",
        message: "El precio no puede ser negativo",
      });
    } else if (params.new_price === 0) {
      warnings.push({
        field: "new_price",
        message:
          "⚠️ Precio $0 establecido - Este producto se podrá vender gratis",
        severity: "high",
      });
    } else if (params.new_price > 1000) {
      warnings.push({
        field: "new_price",
        message: "Precio inusualmente alto. Verifica que sea correcto.",
      });
    }
  }

  // Validar moneda (opcional)
  if (params.currency) {
    const validCurrencies = ["EUR", "USD", "GBP", "MXN"];
    if (!validCurrencies.includes(params.currency.toUpperCase())) {
      warnings.push({
        field: "currency",
        message: `Moneda no estándar: ${params.currency}`,
      });
    }
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
  };
}

async function validateUpdateFamilyPrices(params) {
  const errors = [];
  const warnings = [];

  if (!params.family_id && !params.family_name) {
    errors.push({
      field: "family_id/family_name",
      message: "Se requiere el ID o nombre de la familia",
    });
  }

  const validOperations = ["percent", "set_fixed"];
  if (!params.operation) {
    errors.push({
      field: "operation",
      message: "Tipo de operación requerido: 'percent' o 'set_fixed'",
    });
  } else if (!validOperations.includes(params.operation)) {
    errors.push({
      field: "operation",
      message: `Operación inválida. Usa: ${validOperations.join(", ")}`,
    });
  }

  if (params.operation === "percent") {
    if (!params.direction) {
      errors.push({
        field: "direction",
        message: "Se requiere direction: 'increase' o 'decrease'",
      });
    } else if (!["increase", "decrease"].includes(params.direction)) {
      errors.push({
        field: "direction",
        message: "direction debe ser 'increase' o 'decrease'",
      });
    }

    if (params.value === undefined || params.value === null) {
      errors.push({
        field: "value",
        message: "Se requiere el porcentaje (value)",
      });
    } else if (
      typeof params.value !== "number" ||
      isNaN(params.value) ||
      params.value <= 0 ||
      params.value > 100
    ) {
      errors.push({
        field: "value",
        message: "El porcentaje debe ser un número entre 0.01 y 100",
      });
    } else if (params.value > 50) {
      warnings.push({
        field: "value",
        message: "⚠️ Cambio de precio superior al 50%. Verifica que sea correcto.",
        severity: "high",
      });
    }
  }

  if (params.operation === "set_fixed") {
    if (params.new_price === undefined || params.new_price === null) {
      errors.push({
        field: "new_price",
        message: "Se requiere el precio fijo (new_price)",
      });
    } else if (
      typeof params.new_price !== "number" ||
      isNaN(params.new_price) ||
      params.new_price < 0
    ) {
      errors.push({
        field: "new_price",
        message: "El precio fijo debe ser un número mayor o igual a 0",
      });
    } else if (params.new_price === 0) {
      warnings.push({
        field: "new_price",
        message: "⚠️ Precio $0: todos los productos de la familia serán gratis",
        severity: "high",
      });
    }
  }

  warnings.push({
    field: "family",
    message:
      "⚠️ Esta acción afectará a TODOS los productos de la familia indicada",
    severity: "high",
  });

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
  };
}

async function validateUpdateProductInfo(params) {
  const errors = [];
  const warnings = [];

  // Validar que hay identificador del producto
  if (!params.product_id && !params.product_name) {
    errors.push({
      field: "product_id/product_name",
      message: "Se requiere el ID o nombre del producto a actualizar",
    });
  }

  // Validar que hay al menos un campo para actualizar
  const updateableFields = [
    "new_name",
    "new_description",
    "new_price",
    "category",
    "is_available",
    "stock",
  ];
  const hasUpdates = updateableFields.some(
    (field) => params[field] !== undefined && params[field] !== null
  );

  if (!hasUpdates) {
    errors.push({
      field: "updates",
      message:
        "Se requiere al menos un campo para actualizar (nombre, descripción, precio, categoría, disponibilidad o stock)",
    });
  }

  // Validar nuevo nombre
  if (params.new_name !== undefined && params.new_name !== null) {
    if (typeof params.new_name !== "string" || params.new_name.trim() === "") {
      errors.push({
        field: "new_name",
        message: "El nuevo nombre debe ser un texto no vacío",
      });
    } else if (params.new_name.length < 3) {
      warnings.push({
        field: "new_name",
        message: "El nombre es muy corto (mínimo recomendado: 3 caracteres)",
      });
    } else if (params.new_name.length > 100) {
      errors.push({
        field: "new_name",
        message: "El nombre es demasiado largo (máximo: 100 caracteres)",
      });
    }
  }

  // Validar nueva descripción
  if (params.new_description !== undefined && params.new_description !== null) {
    if (typeof params.new_description !== "string") {
      errors.push({
        field: "new_description",
        message: "La descripción debe ser un texto",
      });
    } else if (params.new_description.length > 500) {
      warnings.push({
        field: "new_description",
        message:
          "La descripción es muy larga (máximo recomendado: 500 caracteres)",
      });
    }
  }

  // Validar nuevo precio (si viene)
  if (params.new_price !== undefined && params.new_price !== null) {
    if (typeof params.new_price !== "number" || isNaN(params.new_price)) {
      errors.push({
        field: "new_price",
        message: "El precio debe ser un número válido",
      });
    } else if (params.new_price < 0) {
      errors.push({
        field: "new_price",
        message: "El precio no puede ser negativo",
      });
    } else if (params.new_price === 0) {
      warnings.push({
        field: "new_price",
        message: "⚠️ Precio $0 permitirá ventas gratis del producto",
        severity: "high",
      });
    } else if (params.new_price > 1000) {
      warnings.push({
        field: "new_price",
        message: "El precio es inusualmente alto, verifica que sea correcto",
      });
    }
  }

  // Validar categoría
  if (params.category !== undefined && params.category !== null) {
    if (typeof params.category !== "string" || params.category.trim() === "") {
      errors.push({
        field: "category",
        message: "La categoría debe ser un texto no vacío",
      });
    }
  }

  // Validar disponibilidad
  if (params.is_available !== undefined && params.is_available !== null) {
    if (typeof params.is_available !== "boolean") {
      errors.push({
        field: "is_available",
        message: "La disponibilidad debe ser true o false",
      });
    }

    if (params.is_available === false) {
      warnings.push({
        field: "is_available",
        message: "⚠️ El producto quedará NO DISPONIBLE para los clientes",
        severity: "high",
      });
    }
  }

  // Validar stock
  if (params.stock !== undefined && params.stock !== null) {
    if (typeof params.stock !== "number" || !Number.isInteger(params.stock)) {
      errors.push({
        field: "stock",
        message: "El stock debe ser un número entero",
      });
    } else if (params.stock < 0) {
      errors.push({
        field: "stock",
        message: "El stock no puede ser negativo",
      });
    } else if (params.stock === 0) {
      warnings.push({
        field: "stock",
        message: "Stock en 0: el producto aparecerá como agotado",
      });
    }
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
  };
}

async function validateUpdateProductStock(params) {
  const errors = [];
  const warnings = [];

  if (!params.product_id && !params.product_name) {
    errors.push({
      field: "product_id/product_name",
      message: "Se requiere el ID o nombre del producto",
    });
  }

  if (params.new_stock === undefined || params.new_stock === null) {
    errors.push({
      field: "new_stock",
      message: "La cantidad de stock es requerida",
    });
  } else {
    if (
      typeof params.new_stock !== "number" ||
      !Number.isInteger(params.new_stock)
    ) {
      errors.push({
        field: "new_stock",
        message: "El stock debe ser un número entero",
      });
    } else if (params.new_stock < 0) {
      errors.push({
        field: "new_stock",
        message: "El stock no puede ser negativo",
      });
    } else if (params.new_stock === 0) {
      warnings.push({
        field: "new_stock",
        message: "Stock en 0: el producto aparecerá como agotado",
      });
    } else if (params.new_stock > 10000) {
      warnings.push({
        field: "new_stock",
        message: "Stock muy alto. Verifica que sea correcto.",
      });
    }
  }

  if (params.operation) {
    const validOperations = ["set", "add", "subtract"];
    if (!validOperations.includes(params.operation)) {
      errors.push({
        field: "operation",
        message: `Operación inválida. Usa: ${validOperations.join(", ")}`,
      });
    }
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
  };
}

async function validateCreateProduct(params) {
  const errors = [];
  const warnings = [];

  if (
    !params.name ||
    typeof params.name !== "string" ||
    params.name.trim() === ""
  ) {
    errors.push({
      field: "name",
      message: "El nombre del producto es requerido",
    });
  } else if (params.name.length < 3) {
    warnings.push({
      field: "name",
      message: "Nombre muy corto",
    });
  }

  if (params.price === undefined || params.price === null) {
    errors.push({
      field: "price",
      message: "El precio es requerido",
    });
  } else if (typeof params.price !== "number" || params.price < 0) {
    errors.push({
      field: "price",
      message: "El precio debe ser un número positivo",
    });
  }

  if (
    params.stock !== undefined &&
    (typeof params.stock !== "number" || params.stock < 0)
  ) {
    errors.push({
      field: "stock",
      message: "El stock debe ser un número positivo",
    });
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
  };
}

async function validateDeleteProduct(params) {
  const errors = [];
  const warnings = [];

  if (!params.product_id && !params.product_name) {
    errors.push({
      field: "product_id/product_name",
      message: "Se requiere el ID o nombre del producto a eliminar",
    });
  }

  warnings.push({
    field: "delete",
    message:
      "⚠️ Esta acción es irreversible. El producto será eliminado permanentemente.",
    severity: "critical",
  });

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ==========================================
// VALIDADORES - REPORTES
// ==========================================

async function validateGenerateSalesReport(params) {
  const errors = [];
  const warnings = [];

  // AUTOPOBLAR FECHAS si es 'today' y no vienen
  if (params.period_type === "today") {
    if (!params.start_date || !params.end_date) {
      const today = new Date().toISOString().split("T")[0];
      params.start_date = today;
      params.end_date = today;
    }
  }

  const validPeriods = ["today", "month", "quarter", "year", "custom"];

  if (!params.period_type) {
    errors.push({
      field: "period_type",
      message: `Tipo de período requerido. Opciones: ${validPeriods.join(
        ", "
      )}`,
    });
  } else if (!validPeriods.includes(params.period_type)) {
    errors.push({
      field: "period_type",
      message: `Tipo de período inválido. Usa: ${validPeriods.join(", ")}`,
    });
  }

  // Solo validar fechas si es custom
  if (params.period_type === "custom") {
    if (!params.start_date || !params.end_date) {
      errors.push({
        field: "dates",
        message: "Para período custom se requiere start_date y end_date",
      });
    } else {
      const startDate = new Date(params.start_date);
      const endDate = new Date(params.end_date);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        errors.push({
          field: "dates",
          message: "Fechas inválidas. Usa formato YYYY-MM-DD",
        });
      } else if (startDate > endDate) {
        errors.push({
          field: "dates",
          message: "La fecha de inicio no puede ser posterior a la de fin",
        });
      }
    }
  }

  if (params.format) {
    const validFormats = ["view", "json", "pdf", "excel", "xlsx", "csv"];
    if (!validFormats.includes(params.format)) {
      warnings.push({
        field: "format",
        message: `Formato '${params.format}' no reconocido. Usando 'json' por defecto.`,
      });
      params.format = "json";
    }
  } else {
    params.format = "json";
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
  };
}

async function validateGenerateCustomerReport(params) {
  const errors = [];
  const warnings = [];

  if (params.segment) {
    const validSegments = ["all", "vip", "active", "inactive"];
    if (!validSegments.includes(params.segment)) {
      errors.push({
        field: "segment",
        message: `Segmento inválido. Usa: ${validSegments.join(", ")}`,
      });
    }
  }

  if (params.format) {
    const validFormats = ["view", "pdf", "excel", "xlsx", "csv"];
    if (!validFormats.includes(params.format)) {
      errors.push({
        field: "format",
        message: `Formato inválido. Usa: ${validFormats.join(", ")}`,
      });
    }
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ==========================================
// VALIDADORES - MARKETING
// ==========================================

async function validateSendBulkOffer(params) {
  const errors = [];
  const warnings = [];

  const validSegments = ["all", "vip", "active", "inactive"];

  if (!params.target_segment) {
    errors.push({
      field: "target_segment",
      message: "Segmento objetivo requerido",
    });
  } else if (!validSegments.includes(params.target_segment)) {
    errors.push({
      field: "target_segment",
      message: `Segmento inválido. Usa: ${validSegments.join(", ")}`,
    });
  }

  if (!params.offer_title || params.offer_title.trim() === "") {
    errors.push({
      field: "offer_title",
      message: "Título de la oferta requerido",
    });
  }

  if (!params.offer_description || params.offer_description.trim() === "") {
    errors.push({
      field: "offer_description",
      message: "Descripción de la oferta requerida",
    });
  }

  if (params.discount_percentage !== undefined) {
    if (
      typeof params.discount_percentage !== "number" ||
      params.discount_percentage < 0 ||
      params.discount_percentage > 100
    ) {
      errors.push({
        field: "discount_percentage",
        message: "El descuento debe ser un número entre 0 y 100",
      });
    }
  }

  if (params.target_segment === "all") {
    warnings.push({
      field: "target_segment",
      message:
        "⚠️ Envío masivo a TODOS los clientes. Verifica que sea la intención.",
      severity: "medium",
    });
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
  };
}

async function validateSendPersonalizedMessage(params) {
  const errors = [];
  const warnings = [];

  if (!params.recipients || params.recipients.trim() === "") {
    errors.push({
      field: "recipients",
      message: "Lista de destinatarios requerida",
    });
  }

  if (!params.subject || params.subject.trim() === "") {
    errors.push({
      field: "subject",
      message: "Asunto del mensaje requerido",
    });
  }

  if (!params.message || params.message.trim() === "") {
    errors.push({
      field: "message",
      message: "Contenido del mensaje requerido",
    });
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
  };
}

async function validateCreateLoyaltyCampaign(params) {
  const errors = [];
  const warnings = [];

  if (!params.campaign_name || params.campaign_name.trim() === "") {
    errors.push({
      field: "campaign_name",
      message: "Nombre de la campaña requerido",
    });
  }

  const validRewardTypes = ["points", "discount", "gift"];
  if (!params.reward_type) {
    errors.push({
      field: "reward_type",
      message: "Tipo de recompensa requerido",
    });
  } else if (!validRewardTypes.includes(params.reward_type)) {
    errors.push({
      field: "reward_type",
      message: `Tipo inválido. Usa: ${validRewardTypes.join(", ")}`,
    });
  }

  if (
    params.duration_days !== undefined &&
    (typeof params.duration_days !== "number" || params.duration_days < 1)
  ) {
    errors.push({
      field: "duration_days",
      message: "La duración debe ser un número positivo",
    });
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
  };
}
