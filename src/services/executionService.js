/**
 * Servicio de ejecución de acciones en Laravel
 * Este servicio se comunica con el backend para ejecutar las acciones reales
 */

import { LARAVEL_API_URL } from "../config/env.js";

// ==========================================
// FUNCIÓN PRINCIPAL DE EJECUCIÓN
// ==========================================

export async function executeAction(functionName, parameters, userToken) {
  console.log(`\n⚙️ Ejecutando: ${functionName}`);
  console.log(`   Parámetros:`, JSON.stringify(parameters, null, 2));

  const executors = {
    // PRODUCTOS
    find_product: executeFindProduct,
    get_families_with_products: executeGetFamiliesWithProducts,
    update_product_price: executeUpdateProductPrice,
    update_product_info: executeUpdateProductInfo,
    update_product_stock: executeUpdateProductStock,
    create_product: executeCreateProduct,
    delete_product: executeDeleteProduct,

    // REPORTES
    generate_sales_report: executeGenerateSalesReport,
    generate_customer_report: executeGenerateCustomerReport,
    // ELIMINADO: generate_product_report

    // MARKETING
    send_bulk_offer: executeSendMarketingEmail,
    send_marketing_email: executeSendMarketingEmail,
    send_personalized_message: executeSendPersonalizedMessage,
    create_loyalty_campaign: executeCreateLoyaltyCampaign,
  };

  const executor = executors[functionName];

  if (!executor) {
    console.error(`❌ Función "${functionName}" no encontrada`);
    console.error(
      `📋 Funciones disponibles:`,
      Object.keys(executors).join(", "),
    );
    throw new Error(`Función no soportada: ${functionName}`);
  }

  try {
    const result = await executor(parameters, userToken);
    console.log("\n✅ Ejecución exitosa");
    return result;
  } catch (error) {
    console.error("\n❌ Error en ejecución:");
    console.error(error);
    throw error;
  }
}

// ==========================================
// HELPER: Llamar a Laravel API
// ==========================================

export async function callLaravelAPI(
  endpoint,
  method = "GET",
  data = null,
  userToken,
) {
  const url = `${LARAVEL_API_URL}${endpoint}`;

  console.log(`📡 Llamando a Laravel: ${method} ${url}`);
  console.log(
    `🔑 Token JWT enviado: ${
      userToken ? userToken.substring(0, 20) + "..." : "NO HAY TOKEN"
    }`,
  );

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${userToken}`,
    },
  };

  if (data && method !== "GET") {
    options.body = JSON.stringify(data);
    console.log(`📤 Body enviado:`, JSON.stringify(data, null, 2));
  }

  try {
    const response = await fetch(url, options);

    console.log(
      `📥 Respuesta de Laravel: ${response.status} ${response.statusText}`,
    );

    // Detectar si la respuesta es un archivo (CSV, PDF, Excel)
    const contentType = response.headers.get("content-type") || "";
    const contentDisposition =
      response.headers.get("content-disposition") || "";

    console.log(`🔍 Verificando si es archivo:`);
    console.log(`   Content-Type: ${contentType}`);
    console.log(`   Content-Disposition: ${contentDisposition}`);

    // Detectar si es archivo por Content-Type o Content-Disposition
    const isFileResponse =
      contentType.includes("text/csv") ||
      contentType.includes("application/csv") ||
      contentType.includes("text/comma-separated-values") ||
      contentType.includes("application/pdf") ||
      contentType.includes(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ) ||
      contentType.includes("application/vnd.ms-excel") ||
      contentType.includes("application/octet-stream") ||
      contentType.includes("application/force-download") ||
      contentDisposition.includes("attachment") ||
      contentDisposition.includes("filename") ||
      (contentDisposition && !contentDisposition.includes("inline"));

    console.log(`   ¿Es archivo?: ${isFileResponse}`);

    if (!response.ok) {
      // Si es un archivo y hay error, intentar leer el error como texto primero
      if (isFileResponse) {
        const errorText = await response.text().catch(() => "");
        throw new Error(
          `Error al generar archivo: ${errorText || response.statusText}`,
        );
      }

      // Si es HTML (error 500 con debug), capturar el HTML completo
      if (contentType.includes("text/html") && response.status === 500) {
        const errorHtml = await response.text().catch(() => "");
        console.error(`❌ Error HTML de Laravel (500):`);
        console.error(`📄 Tamaño del HTML: ${errorHtml.length} caracteres`);

        if (errorHtml.length > 0) {
          console.error(`📄 Primeros 2000 caracteres del error:`);
          console.error(errorHtml.substring(0, 2000));

          // Guardar en archivo para debug
          const fs = require("fs");
          const path = require("path");
          try {
            const errorFilePath = path.join(
              process.cwd(),
              "laravel_error_debug.html",
            );
            fs.writeFileSync(errorFilePath, errorHtml, "utf8");
            console.error(`📁 Error guardado en: ${errorFilePath}`);
          } catch (e) {
            console.error(
              `⚠️ No se pudo guardar el error en archivo: ${e.message}`,
            );
          }

          // Intentar extraer el mensaje de error del HTML
          const messageMatch = errorHtml.match(/<h1[^>]*>(.*?)<\/h1>/i);
          if (messageMatch) {
            throw new Error(messageMatch[1].replace(/<[^>]+>/g, ""));
          }

          // Buscar mensaje de error de otra forma
          const titleMatch = errorHtml.match(/<title>(.*?)<\/title>/i);
          if (titleMatch) {
            throw new Error(titleMatch[1]);
          }
        }

        throw new Error("Error interno del servidor en Laravel (sin detalles)");
      }

      const errorData = await response.json().catch(() => ({}));
      console.error(`❌ Error de Laravel:`, errorData);

      // Si el error es 401, el token es inválido
      if (response.status === 401) {
        throw new Error(
          `Token JWT inválido o expirado. Verifica que el token del usuario sea válido. ${
            errorData.message || ""
          }`,
        );
      }

      // Si el error es 404, recurso no encontrado
      if (response.status === 404) {
        throw new Error(
          errorData.message || "Recurso no encontrado en Laravel",
        );
      }

      // Si el error es 500, puede ser varios tipos de error
      if (response.status === 500) {
        const errorMessage = errorData.message || "";

        // Detectar errores de SQL (más comunes)
        if (
          errorMessage.includes("SQLSTATE") ||
          errorMessage.includes("Column not found") ||
          errorMessage.includes("Unknown column") ||
          errorMessage.includes("Table") ||
          errorMessage.includes("SQL:")
        ) {
          throw new Error(`Error de base de datos en Laravel: ${errorMessage}`);
        }

        // Solo si es un error específico de autenticación (sin mencionar SQL)
        if (
          errorMessage.includes("Usuario no autenticado") ||
          errorMessage.includes("Administrador no encontrado") ||
          errorMessage.includes("sin negocio asociado")
        ) {
          throw new Error(
            `Usuario no autenticado correctamente. ${errorMessage}`,
          );
        }

        // Error 500 genérico
        throw new Error(
          errorMessage || "Error interno del servidor en Laravel",
        );
      }

      // Otros errores HTTP
      throw new Error(
        errorData.message || `Error HTTP ${response.status} en Laravel`,
      );
    }

    // Si es un archivo, devolver la URL de descarga
    if (isFileResponse) {
      console.log(`📁 Respuesta detectada como archivo: ${contentType}`);
      console.log(`📁 Content-Disposition: ${contentDisposition}`);

      // Extraer el nombre del archivo del header Content-Disposition
      let filename = "archivo";
      const filenameMatch = contentDisposition.match(
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
      );
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, "");
        // Decodificar si está codificado
        try {
          filename = decodeURIComponent(filename);
        } catch (e) {
          // Si falla, usar el nombre tal cual
        }
      }

      console.log(`📁 Nombre de archivo extraído: ${filename}`);

      // IMPORTANTE: No leer el cuerpo de la respuesta si es un archivo
      // Solo necesitamos la URL para que el frontend haga la descarga

      // La URL ya está completa (incluye LARAVEL_API_URL)
      return {
        success: true,
        is_file: true,
        download_url: url, // URL completa con dominio
        filename: filename,
        content_type: contentType,
      };
    }

    // Respuesta JSON normal
    console.log(`📄 Respuesta detectada como JSON`);

    // Verificar que realmente es JSON antes de parsear
    const text = await response.text();
    console.log(
      `📄 Contenido de respuesta (primeros 200 chars):`,
      text.substring(0, 200),
    );

    try {
      const result = JSON.parse(text);
      return result;
    } catch (e) {
      console.error(`❌ Error parseando JSON:`, e);
      console.error(`   Contenido completo:`, text);
      throw new Error(
        `La respuesta no es un JSON válido: ${text.substring(0, 100)}`,
      );
    }
  } catch (error) {
    console.error("❌ Error llamando a Laravel:", error);
    throw new Error(`Error comunicándose con Laravel: ${error.message}`);
  }
}

// ==========================================
// HELPER: Buscar producto por nombre
// ==========================================

/**
 * Buscar producto por nombre
 * Retorna {id, tipo} donde tipo es 'plato' o 'bebida'
 */
async function findProductByName(productName, userToken) {
  console.log(`🔍 Buscando producto: "${productName}"`);

  try {
    const result = await callLaravelAPI(
      `/api/aura/productos/buscar?nombre=${encodeURIComponent(productName)}`,
      "GET",
      null,
      userToken,
    );

    if (result.success && result.data && result.data.length > 0) {
      const product = result.data[0];
      console.log(
        `✅ Producto encontrado: ${product.nombre} (ID: ${product.id}, Tipo: ${product.tipo})`,
      );
      return { id: product.id, tipo: product.tipo };
    }

    throw new Error(`Producto "${productName}" no encontrado`);
  } catch (error) {
    console.error(`❌ Error buscando producto: ${error.message}`);
    throw error;
  }
}

// ==========================================
// EJECUTORES - PRODUCTOS
// ==========================================

/**
 * Buscar producto(s) por nombre o criterios
 * Esta es la versión ejecutora pública de findProductByName
 */
async function executeFindProduct(params, userToken) {
  console.log(`🔍 Buscando producto(s):`, params);

  const { query, product_name, product_id } = params;
  const searchQuery = query || product_name;

  if (!searchQuery && !product_id) {
    throw new Error(
      "Se requiere 'query', 'product_name' o 'product_id' para buscar productos",
    );
  }

  try {
    // Si se proporciona ID, buscar producto específico por ID
    if (product_id) {
      console.log(`🔍 Buscando producto por ID: ${product_id}`);
      // Para buscar por ID necesitamos el tipo, así que usamos el nombre también
      if (!searchQuery) {
        throw new Error(
          "Para buscar por ID también se necesita el nombre del producto",
        );
      }
      const producto = await findProductByName(searchQuery, userToken);
      return {
        success: true,
        found: true,
        product: producto,
        message: `✅ Producto encontrado: ${producto.nombre || searchQuery}`,
      };
    }

    // Buscar por nombre/query
    const result = await callLaravelAPI(
      `/api/aura/productos/buscar?nombre=${encodeURIComponent(searchQuery)}`,
      "GET",
      null,
      userToken,
    );

    if (result.success && result.data && result.data.length > 0) {
      const productos = result.data;
      console.log(`✅ Se encontraron ${productos.length} producto(s)`);

      return {
        success: true,
        found: true,
        count: productos.length,
        products: productos,
        message: `✅ Se encontraron ${productos.length} producto(s) que coinciden con "${searchQuery}"`,
      };
    }

    console.log(
      `❌ No se encontraron productos con la búsqueda: "${searchQuery}"`,
    );
    return {
      success: true,
      found: false,
      count: 0,
      products: [],
      message: `No se encontraron productos que coincidan con "${searchQuery}"`,
    };
  } catch (error) {
    console.error(`❌ Error buscando producto:`, error);
    throw error;
  }
}

// ==========================================
// OBTENER FAMILIAS CON PRODUCTOS
// ==========================================

async function executeGetFamiliesWithProducts(params, userToken) {
  console.log(`📋 Obteniendo familias con productos...`);

  try {
    const response = await callLaravelAPI(
      `/api/aura/familias-con-productos`,
      "GET",
      null,
      userToken,
    );

    if (!response.success) {
      throw new Error(
        response.error || "Error al obtener familias con productos",
      );
    }

    const familias = response.familias || [];
    const totalFamilias = response.total_familias || familias.length;

    console.log(
      `✅ Se obtuvieron ${totalFamilias} familia(s) con sus productos`,
    );

    // Formatear la respuesta para que sea más legible
    let message = `📋 **Menú completo del negocio**\n\n`;
    message += `Total de familias: ${totalFamilias}\n\n`;

    if (familias.length === 0) {
      message += "No hay familias registradas en el negocio.";
    } else {
      familias.forEach((familia, index) => {
        message += `**${index + 1}. ${familia.name}**`;
        if (familia.description) {
          message += ` - ${familia.description}`;
        }
        message += `\n`;
        message += `   Tipo: ${familia.type || "N/A"} | Total productos: ${familia.total_productos}\n`;

        // Mostrar platos
        if (familia.platos && familia.platos.length > 0) {
          message += `   **Platos (${familia.platos.length}):**\n`;
          familia.platos.forEach((plato) => {
            message += `   - ${plato.name} - €${plato.price.toFixed(2)}`;
            if (plato.description) {
              message += ` (${plato.description})`;
            }
            message += ` ${plato.available ? "✅" : "❌"}\n`;
          });
        }

        // Mostrar bebidas
        if (familia.bebidas && familia.bebidas.length > 0) {
          message += `   **Bebidas (${familia.bebidas.length}):**\n`;
          familia.bebidas.forEach((bebida) => {
            message += `   - ${bebida.name} - €${bebida.price.toFixed(2)}`;
            if (bebida.description) {
              message += ` (${bebida.description})`;
            }
            message += ` ${bebida.available ? "✅" : "❌"}\n`;
          });
        }

        message += `\n`;
      });
    }

    return {
      success: true,
      familias: familias,
      total_familias: totalFamilias,
      message: message,
      data: response,
    };
  } catch (error) {
    console.error(`❌ Error obteniendo familias con productos:`, error);
    throw new Error(
      `Error obteniendo familias con productos: ${error.message}`,
    );
  }
}

async function executeUpdateProductPrice(params, userToken) {
  console.log(`💰 Actualizando precio de producto:`, params);

  const { product_id, product_name, new_price, currency } = params;

  // Validación de parámetros
  if (!new_price || isNaN(new_price) || new_price < 0) {
    throw new Error(`El precio debe ser un número válido mayor o igual a 0`);
  }

  let productInfo = { id: product_id, tipo: null };

  // Si no hay ID, buscar por nombre
  if (!productInfo.id && product_name) {
    console.log(`🔍 Buscando producto por nombre: "${product_name}"`);
    productInfo = await findProductByName(product_name, userToken);
  }

  // Si tenemos ID pero no tipo, necesitamos buscarlo
  if (productInfo.id && !productInfo.tipo && product_name) {
    console.log(`🔍 Determinando tipo de producto ID ${productInfo.id}`);
    const found = await findProductByName(product_name, userToken);
    productInfo.tipo = found.tipo;
  }

  if (!productInfo.id || !productInfo.tipo) {
    throw new Error(
      "Se requiere product_id o product_name. Si usas product_id, también necesitas product_name para determinar el tipo.",
    );
  }

  console.log(
    `💰 Actualizando precio del ${productInfo.tipo} ${productInfo.id} a €${new_price}`,
  );

  const result = await callLaravelAPI(
    `/api/aura/productos/${productInfo.tipo}/${productInfo.id}/precio`,
    "PUT",
    {
      precio: parseFloat(new_price),
    },
    userToken,
  );

  console.log(`✅ Precio actualizado exitosamente`);

  return {
    success: true,
    product_id: productInfo.id,
    product_tipo: productInfo.tipo,
    product_name: result.data?.nombre || product_name,
    old_price: result.data?.precio_anterior,
    new_price: parseFloat(new_price),
    message: `✅ Precio de "${result.data?.nombre || product_name}" actualizado a €${new_price}`,
  };
}

async function executeUpdateProductInfo(params, userToken) {
  console.log(`📝 Actualizando información de producto:`, params);

  const {
    product_id,
    product_name,
    new_name,
    new_description,
    new_price,
    category,
    is_available,
    stock,
  } = params;

  let productInfo = { id: product_id, tipo: null };

  // Si no hay ID, buscar por nombre
  if (!productInfo.id && product_name) {
    console.log(`🔍 Buscando producto por nombre: "${product_name}"`);
    productInfo = await findProductByName(product_name, userToken);
  }

  // Si tenemos ID pero no tipo, necesitamos buscarlo
  if (productInfo.id && !productInfo.tipo && product_name) {
    console.log(`🔍 Determinando tipo de producto ID ${productInfo.id}`);
    const found = await findProductByName(product_name, userToken);
    productInfo.tipo = found.tipo;
  }

  if (!productInfo.id || !productInfo.tipo) {
    throw new Error(
      "Se requiere product_id o product_name. Si usas product_id, también necesitas product_name para determinar el tipo.",
    );
  }

  // Mapear campos al formato de Laravel
  const updateData = {};
  if (new_name !== undefined && new_name !== null) {
    updateData.nombre = String(new_name).trim();
  }
  if (new_description !== undefined && new_description !== null) {
    updateData.descripcion = String(new_description).trim();
  }
  if (new_price !== undefined && new_price !== null) {
    if (isNaN(new_price) || new_price < 0) {
      throw new Error(`El precio debe ser un número válido mayor o igual a 0`);
    }
    updateData.precio = parseFloat(new_price);
  }

  // Advertencias para campos no implementados
  if (is_available !== undefined) {
    updateData.disponible = is_available;
    console.warn(
      "⚠️ Campo 'disponible' puede no estar implementado en Laravel",
    );
  }
  if (stock !== undefined) {
    console.warn(
      "⚠️ Campo 'stock' no está implementado en Laravel. Se ignora.",
    );
  }
  if (category !== undefined) {
    console.warn(
      "⚠️ Campo 'category' no se puede actualizar en este endpoint. Use la API de Laravel directamente.",
    );
  }

  // Validar que haya al menos un campo para actualizar
  if (Object.keys(updateData).length === 0) {
    throw new Error("No se proporcionaron campos para actualizar");
  }

  console.log(
    `📝 Actualizando ${productInfo.tipo} ID ${productInfo.id} con:`,
    updateData,
  );

  const result = await callLaravelAPI(
    `/api/aura/productos/${productInfo.tipo}/${productInfo.id}`,
    "PUT",
    updateData,
    userToken,
  );

  const changedFields = Object.keys(updateData).map((key) => {
    const fieldNames = {
      nombre: "nombre",
      descripcion: "descripción",
      precio: "precio",
      disponible: "disponibilidad",
    };
    return fieldNames[key] || key;
  });

  console.log(
    `✅ Producto actualizado exitosamente: ${changedFields.join(", ")}`,
  );

  return {
    success: true,
    product_id: productInfo.id,
    product_tipo: productInfo.tipo,
    product_name: result.data?.nombre || new_name || product_name,
    updated_fields: changedFields,
    changes: updateData,
    message: `✅ Producto "${result.data?.nombre || product_name}" actualizado: ${changedFields.join(", ")}`,
  };
}

async function executeUpdateProductStock(params, userToken) {
  const { product_id, product_name, new_stock, operation } = params;

  // NOTA: Laravel no tiene endpoint específico para stock
  // Usamos update_product_info como alternativa
  console.warn(
    "⚠️ Laravel no tiene endpoint específico para stock. Usando update_product_info.",
  );

  return await executeUpdateProductInfo(
    {
      product_id,
      product_name,
      stock: new_stock,
    },
    userToken,
  );
}

async function executeCreateProduct(params, userToken) {
  const { name, description, price, category, stock, family_id } = params;

  // Determinar tipo de producto basado en category o nombre
  // Por defecto, si category contiene "bebida" o el nombre sugiere bebida, es bebida
  let tipo = "plato"; // Por defecto
  const categoryLower = (category || "").toLowerCase();
  const nameLower = (name || "").toLowerCase();

  if (
    categoryLower.includes("bebida") ||
    categoryLower.includes("drink") ||
    nameLower.includes("bebida") ||
    nameLower.includes("refresco") ||
    nameLower.includes("agua") ||
    nameLower.includes("cerveza") ||
    nameLower.includes("vino")
  ) {
    tipo = "bebida";
  }

  console.log(`➕ Creando nuevo ${tipo}: ${name}`);

  // Obtener family_id
  let finalFamilyId = null;

  // Prioridad 1: Si viene family_id directamente, usarlo
  if (family_id !== undefined && family_id !== null) {
    finalFamilyId = parseInt(family_id);
  }
  // Prioridad 2: Si category es un número, usarlo como family_id
  else if (category !== undefined && category !== null) {
    // Convertir category a string para verificar si es numérico
    const categoryStr = String(category).trim();
    if (typeof category === "number" || /^\d+$/.test(categoryStr)) {
      finalFamilyId = parseInt(categoryStr);
      console.log(
        `✅ Category "${category}" detectado como número. Usando como family_id: ${finalFamilyId}`,
      );
    } else {
      // Si category es string (nombre), buscar la familia
      console.log(`🔍 Buscando familia por nombre: "${category}"`);
      try {
        const response = await callLaravelAPI(
          `/api/aura/familias`,
          "GET",
          null,
          userToken,
        );

        console.log(`📦 Tipo de respuesta:`, typeof response);
        console.log(`📦 Es array:`, Array.isArray(response));
        console.log(
          `📦 Familias recibidas:`,
          JSON.stringify(response, null, 2),
        );

        // Manejar diferentes estructuras de respuesta
        let families = response;
        if (response && response.data) {
          families = response.data;
        }

        if (!Array.isArray(families)) {
          console.warn(`⚠️ Familias no es un array, intentando convertir...`);
          families = [];
        }

        console.log(`📊 Total de familias: ${families.length}`);

        // Buscar familia por nombre (case-insensitive)
        // Laravel puede devolver 'name' o 'nombre'
        const foundFamily = families.find((f) => {
          const familyName = f.name || f.nombre || "";
          return familyName.toLowerCase() === category.toLowerCase();
        });

        if (foundFamily) {
          finalFamilyId = foundFamily.id;
          const familyName = foundFamily.name || foundFamily.nombre;
          console.log(
            `✅ Familia encontrada: ${familyName} (ID: ${finalFamilyId})`,
          );
        } else {
          // No se encontró la familia, devolver lista de familias disponibles
          const availableFamilies = families
            .map((f) => f.name || f.nombre || "Sin nombre")
            .filter((name) => name !== "Sin nombre")
            .join(", ");

          throw new Error(
            `No se encontró una familia llamada "${category}". Familias disponibles: ${availableFamilies || "ninguna"}.`,
          );
        }
      } catch (error) {
        throw new Error(`Error buscando familia: ${error.message}`);
      }
    }
  }

  // Si aún no tenemos family_id, mostrar familias disponibles al usuario
  if (!finalFamilyId) {
    console.warn(
      "⚠️ No se proporcionó family_id ni category. Solicitando al usuario...",
    );
    try {
      const response = await callLaravelAPI(
        `/api/aura/familias`,
        "GET",
        null,
        userToken,
      );

      let families = response;
      if (response && response.data) {
        families = response.data;
      }

      if (!Array.isArray(families)) {
        families = [];
      }

      const availableFamilies = families
        .map((f) => f.name || f.nombre || "Sin nombre")
        .filter((name) => name !== "Sin nombre")
        .join(", ");

      throw new Error(
        `Para crear el producto "${name}" necesito saber a qué categoría pertenece. Familias disponibles: ${availableFamilies || "ninguna"}. Por favor, especifica la categoría.`,
      );
    } catch (error) {
      if (error.message.includes("Familias disponibles")) {
        throw error;
      }
      throw new Error(
        `Se requiere especificar la categoría del producto. ${error.message}`,
      );
    }
  }

  const createData = {
    nombre: name,
    precio: price,
    family_id: finalFamilyId,
  };

  if (description) createData.descripcion = description;

  console.log(`📤 Enviando datos a Laravel:`, createData);
  console.log(
    `📍 Endpoint completo: ${LARAVEL_API_URL}/api/aura/productos/${tipo}`,
  );

  const result = await callLaravelAPI(
    `/api/aura/productos/${tipo}`,
    "POST",
    createData,
    userToken,
  );

  console.log(
    `✅ Respuesta de Laravel recibida:`,
    JSON.stringify(result, null, 2),
  );

  if (stock !== undefined && stock > 0) {
    console.warn(
      "⚠️ Campo 'stock' no está implementado en Laravel. Se ignora.",
    );
  }

  return {
    success: true,
    product_id: result.data?.id,
    product_tipo: tipo,
    product_name: result.data?.nombre || name,
    family_id: finalFamilyId,
    message: `✅ ${
      tipo.charAt(0).toUpperCase() + tipo.slice(1)
    } "${name}" creado exitosamente`,
  };
}

async function executeDeleteProduct(params, userToken) {
  console.log(`🗑️ Eliminando producto:`, params);

  const { product_id, product_name } = params;

  let productInfo = { id: product_id, tipo: null };

  // Si no hay ID, buscar por nombre
  if (!productInfo.id && product_name) {
    console.log(`🔍 Buscando producto por nombre: "${product_name}"`);
    productInfo = await findProductByName(product_name, userToken);
  }

  // Si tenemos ID pero no tipo, necesitamos buscarlo
  if (productInfo.id && !productInfo.tipo && product_name) {
    console.log(`🔍 Determinando tipo de producto ID ${productInfo.id}`);
    const found = await findProductByName(product_name, userToken);
    productInfo.tipo = found.tipo;
  }

  if (!productInfo.id || !productInfo.tipo) {
    throw new Error(
      "Se requiere product_id o product_name. Si usas product_id, también necesitas product_name para determinar el tipo.",
    );
  }

  console.log(
    `🗑️ Eliminando ${productInfo.tipo} ID ${productInfo.id} "${product_name || "sin nombre"}"`,
  );

  const result = await callLaravelAPI(
    `/api/aura/productos/${productInfo.tipo}/${productInfo.id}`,
    "DELETE",
    null,
    userToken,
  );

  console.log(`✅ Producto eliminado exitosamente`);

  const tipoCapitalizado =
    productInfo.tipo.charAt(0).toUpperCase() + productInfo.tipo.slice(1);

  return {
    success: true,
    product_id: productInfo.id,
    product_tipo: productInfo.tipo,
    product_name: product_name,
    message:
      result.message ||
      `✅ ${tipoCapitalizado} "${product_name || productInfo.id}" eliminado permanentemente`,
  };
}

// ==========================================
// EJECUTORES - REPORTES
// ==========================================

/**
 * Genera reporte de ventas consultando Laravel
 * AUTOPOBLA fechas según period_type
 */
async function executeGenerateSalesReport(params, userToken) {
  console.log(`📊 Generando reporte de ventas:`, params);

  try {
    // 1. AUTOPOBLAR FECHAS según period_type
    const dateRange = calculateDateRange(params);
    console.log(`📅 Fechas calculadas:`, dateRange);

    // Validar que las fechas sean válidas
    if (!dateRange.start || !dateRange.end) {
      throw new Error(
        "No se pudieron calcular las fechas del período solicitado",
      );
    }

    let format = params.format || "json";

    // Normalizar formato (excel -> xlsx)
    if (format === "excel") {
      format = "xlsx";
    }

    // Validar formato
    const validFormats = ["json", "view", "pdf", "xlsx", "csv"];
    if (!validFormats.includes(format)) {
      console.warn(`⚠️ Formato "${format}" no válido, usando "json"`);
      format = "json";
    }

    // 2. Construir query params para Laravel
    const queryParams = new URLSearchParams({
      fecha_inicio: dateRange.start,
      fecha_fin: dateRange.end,
      formato: format,
    });

    // Si es un formato de descarga (PDF, Excel, CSV), agregar flag download=1
    if (format === "pdf" || format === "xlsx" || format === "csv") {
      queryParams.append("download", "1");
    }

    // 3. ENDPOINT CORREGIDO (Laravel usa /api/aura/reportes/ventas)
    const endpoint = `/api/aura/reportes/ventas?${queryParams.toString()}`;

    console.log(`🔗 Llamando a Laravel: ${endpoint}`);
    console.log(`📅 Período: ${dateRange.start} a ${dateRange.end}`);

    // 4. Laravel hace las consultas a la BD
    const laravelResponse = await callLaravelAPI(
      endpoint,
      "GET",
      null,
      userToken,
    );

    console.log(`✅ Reporte de ventas recibido de Laravel`);

    // 5. Procesar respuesta según formato
    if (format === "view" || format === "json") {
      const resumen = laravelResponse.data?.resumen;
      if (resumen) {
        console.log(`💰 Total ventas: €${resumen.total_ventas || 0}`);
        console.log(`🎫 Total tickets: ${resumen.total_tickets || 0}`);
      }

      // Generar mensaje con el reporte y pregunta sobre exportación
      const reportMessage = formatReportSummaryMessage(
        laravelResponse,
        params,
        dateRange,
      );
      const messageWithPrompt = `${reportMessage}\n\n📄 ¿Deseas exportar este reporte?\n- **Excel** (.xlsx) - Con formato y múltiples hojas\n- **CSV** (.csv) - Excel simple, compatible con todo\n- **PDF** (.pdf) - Para imprimir o compartir\n\n¿Qué formato prefieres?`;

      return {
        success: true,
        message: messageWithPrompt,
        data: laravelResponse.data || laravelResponse,
        display_type: "report_view",
        period: {
          start: dateRange.start,
          end: dateRange.end,
          description: getPeriodDescription(params, dateRange),
        },
        // Indicador para que el LLM sepa que debe esperar respuesta sobre formato
        expects_format_response: true,
        available_formats: ["xlsx", "csv", "pdf"],
      };
    } else {
      // PDF, Excel o CSV - Laravel devuelve el archivo directamente
      console.log(`\n========================================`);
      console.log(`📥 FORMATO DE DESCARGA: ${format.toUpperCase()}`);
      console.log(`========================================`);
      console.log(`📥 Respuesta de Laravel (tipo):`, typeof laravelResponse);
      console.log(
        `📥 Respuesta de Laravel (keys):`,
        Object.keys(laravelResponse || {}),
      );
      console.log(
        `📥 Respuesta completa:`,
        JSON.stringify(laravelResponse, null, 2),
      );
      console.log(`📥 ¿Es archivo? (is_file):`, laravelResponse.is_file);
      console.log(`📥 URL de descarga:`, laravelResponse.download_url);
      console.log(`📥 Nombre de archivo:`, laravelResponse.filename);
      console.log(`========================================\n`);

      // Si Laravel devolvió información del archivo
      if (laravelResponse.is_file) {
        console.log(
          `✅ ARCHIVO DETECTADO - Devolviendo respuesta con botón de descarga`,
        );

        const response = {
          success: true,
          message: `✅ Reporte ${format.toUpperCase()} generado exitosamente. Haz clic en el botón de descarga para obtener el archivo.`,
          download_url: laravelResponse.download_url,
          filename:
            laravelResponse.filename ||
            `reporte_ventas_${dateRange.start}_${dateRange.end}.${format}`,
          display_type: "download",
          period: {
            start: dateRange.start,
            end: dateRange.end,
            description: getPeriodDescription(params, dateRange),
          },
        };

        console.log(
          `✅ Respuesta que se enviará al frontend:`,
          JSON.stringify(response, null, 2),
        );
        return response;
      }

      // Fallback: si no se detectó como archivo pero es un formato de descarga,
      // puede ser que Laravel devolvió JSON con la URL de descarga
      if (laravelResponse.download_url) {
        console.log(`✅ URL DE DESCARGA ENCONTRADA EN JSON (fallback 1)`);

        const response = {
          success: true,
          message: `✅ Reporte ${format.toUpperCase()} generado exitosamente. Haz clic en el botón de descarga para obtener el archivo.`,
          download_url: laravelResponse.download_url,
          filename:
            laravelResponse.filename ||
            `reporte_ventas_${dateRange.start}_${dateRange.end}.${format}`,
          display_type: "download",
          period: {
            start: dateRange.start,
            end: dateRange.end,
            description: getPeriodDescription(params, dateRange),
          },
        };

        console.log(
          `✅ Respuesta (fallback 1):`,
          JSON.stringify(response, null, 2),
        );
        return response;
      }

      // Último fallback: construir URL de descarga completa
      console.log(`⚠️ NO SE DETECTÓ ARCHIVO NI HAY URL - Usando fallback 2`);
      const downloadUrl = `${LARAVEL_API_URL}${endpoint}`;
      console.log(`   URL construida: ${downloadUrl}`);

      const response = {
        success: true,
        message: `✅ Reporte ${format.toUpperCase()} generado exitosamente. Haz clic en el botón de descarga para obtener el archivo.`,
        download_url: downloadUrl,
        filename: `reporte_ventas_${dateRange.start}_${dateRange.end}.${format}`,
        display_type: "download",
        period: {
          start: dateRange.start,
          end: dateRange.end,
          description: getPeriodDescription(params, dateRange),
        },
      };

      console.log(
        `✅ Respuesta (fallback 2):`,
        JSON.stringify(response, null, 2),
      );
      return response;
    }
  } catch (error) {
    console.error(`❌ Error generando reporte de ventas:`, error);
    throw new Error(`Error generando reporte de ventas: ${error.message}`);
  }
}

// ==========================================
// FUNCIONES AUXILIARES PARA FECHAS
// ==========================================

/**
 * Calcula rango de fechas según period_type
 */
function calculateDateRange(params) {
  const { period_type } = params;

  switch (period_type) {
    case "today": {
      const today = new Date().toISOString().split("T")[0];
      return { start: today, end: today };
    }

    case "month": {
      if (params.specific_month) {
        return getMonthRangeFromString(params.specific_month);
      }
      return getCurrentMonthRange();
    }

    case "quarter": {
      if (params.specific_quarter) {
        return getQuarterRangeFromString(params.specific_quarter);
      }
      return getCurrentQuarterRange();
    }

    case "year": {
      if (params.specific_year) {
        return getYearRangeFromString(params.specific_year);
      }
      return getCurrentYearRange();
    }

    case "custom": {
      return {
        start: params.start_date,
        end: params.end_date,
      };
    }

    default: {
      const now = new Date().toISOString().split("T")[0];
      return { start: now, end: now };
    }
  }
}

function getCurrentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const firstDay = `${year}-${month}-01`;
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  const endDay = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;
  return { start: firstDay, end: endDay };
}

function getMonthRangeFromString(monthStr) {
  let year, month;

  if (monthStr.includes("-")) {
    [year, month] = monthStr.split("-");
  } else {
    const monthNames = {
      enero: "01",
      febrero: "02",
      marzo: "03",
      abril: "04",
      mayo: "05",
      junio: "06",
      julio: "07",
      agosto: "08",
      septiembre: "09",
      octubre: "10",
      noviembre: "11",
      diciembre: "12",
    };
    const parts = monthStr.toLowerCase().split(" ");
    month = monthNames[parts[0]] || "01";
    year = parts[1] || new Date().getFullYear();
  }

  const lastDay = new Date(year, parseInt(month), 0).getDate();
  return {
    start: `${year}-${month}-01`,
    end: `${year}-${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

function getCurrentQuarterRange() {
  const now = new Date();
  const year = now.getFullYear();
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  return getQuarterRangeFromString(`${year}-Q${quarter}`);
}

function getQuarterRangeFromString(quarterStr) {
  let year, quarter;

  if (quarterStr.includes("Q")) {
    const parts = quarterStr.split(/[-\s]/);
    year = parts.find((p) => p.length === 4);
    quarter =
      parseInt(
        parts
          .find((p) => p.startsWith("Q") || /^[1-4]$/.test(p))
          ?.replace("Q", ""),
      ) || 1;
  } else {
    const quarterNames = {
      primer: 1,
      primero: 1,
      segundo: 2,
      tercer: 3,
      tercero: 3,
      cuarto: 4,
    };
    const parts = quarterStr.toLowerCase().split(" ");
    quarter = quarterNames[parts[0]] || 1;
    year = parts.find((p) => p.length === 4) || new Date().getFullYear();
  }

  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = startMonth + 2;
  const lastDay = new Date(year, endMonth, 0).getDate();

  return {
    start: `${year}-${String(startMonth).padStart(2, "0")}-01`,
    end: `${year}-${String(endMonth).padStart(2, "0")}-${String(
      lastDay,
    ).padStart(2, "0")}`,
  };
}

function getCurrentYearRange() {
  const year = new Date().getFullYear();
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

function getYearRangeFromString(yearStr) {
  const year = yearStr.toString();
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

function getPeriodDescription(params, dateRange) {
  const { period_type } = params;

  switch (period_type) {
    case "today":
      return "Hoy";
    case "month":
      if (params.specific_month) {
        return `Mes: ${formatMonthName(params.specific_month)}`;
      }
      return "Mes actual";
    case "quarter":
      if (params.specific_quarter) {
        return `Trimestre: ${params.specific_quarter}`;
      }
      return "Trimestre actual";
    case "year":
      if (params.specific_year) {
        return `Año: ${params.specific_year}`;
      }
      return "Año actual";
    case "custom":
      return `Del ${formatDate(dateRange.start)} al ${formatDate(
        dateRange.end,
      )}`;
    default:
      return "Período personalizado";
  }
}

function formatMonthName(monthStr) {
  if (monthStr.includes("-")) {
    const [year, month] = monthStr.split("-");
    const monthNames = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }
  return monthStr;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Formatea mensaje resumen del reporte
 * Estructura esperada de Laravel:
 * {
 *   "success": true,
 *   "data": {
 *     "resumen": { total_ventas, total_tickets, ticket_promedio, items_vendidos },
 *     "por_metodo_pago": [...],
 *     "productos_mas_vendidos": [...],
 *     "comparativa_periodo_anterior": { porcentaje, tendencia }
 *   }
 * }
 */
function formatReportSummaryMessage(laravelData, params, dateRange) {
  const data = laravelData.data || laravelData;
  const resumen = data.resumen || {};

  let message = `✅ **Reporte generado exitosamente**\n\n`;
  message += `📊 **Período: ${getPeriodDescription(params, dateRange)}**\n`;
  message += `📅 Del ${dateRange.start} al ${dateRange.end}\n\n`;

  if (resumen) {
    message += `💰 **Total ventas:** ${
      resumen.total_ventas?.toFixed(2) || "0.00"
    }€\n`;
    message += `🎫 **Tickets:** ${resumen.total_tickets || 0}\n`;
    message += `📊 **Ticket promedio:** ${
      resumen.ticket_promedio?.toFixed(2) || "0.00"
    }€\n`;
    message += `📦 **Items vendidos:** ${resumen.items_vendidos || 0}\n\n`;
  }

  const topProductos = data.productos_mas_vendidos || [];
  if (topProductos.length > 0) {
    message += `🔝 **Top 5 Productos:**\n`;
    topProductos.slice(0, 5).forEach((p, i) => {
      message += `${i + 1}. ${p.nombre} - ${p.cantidad} uds`;
      if (p.total) message += ` (${p.total.toFixed(2)}€)`;
      message += "\n";
    });
    message += "\n";
  }

  const metodosPago = data.por_metodo_pago || [];
  if (metodosPago.length > 0) {
    message += `💳 **Métodos de pago:**\n`;
    metodosPago.forEach((m) => {
      message += `- ${m.metodo}: ${m.total?.toFixed(2) || "0.00"}€`;
      if (m.porcentaje) message += ` (${m.porcentaje.toFixed(1)}%)`;
      message += "\n";
    });
    message += "\n";
  }

  const comparativa = data.comparativa_periodo_anterior;
  if (comparativa !== null && comparativa !== undefined) {
    const porcentaje =
      typeof comparativa === "object" ? comparativa.porcentaje : comparativa;
    const emoji = porcentaje > 0 ? "📈" : "📉";
    const texto = porcentaje > 0 ? "más" : "menos";
    message += `${emoji} **Comparativa:** ${Math.abs(porcentaje).toFixed(
      1,
    )}% ${texto} que período anterior\n`;
  }

  return message.trim();
}

async function executeGenerateCustomerReport(params, userToken) {
  console.log(`👥 Generando reporte de clientes:`, params);

  const { segment, period, format } = params;

  // Valores por defecto y validación
  const validSegments = ["all", "vip", "regular", "new", "inactive"];
  const validPeriods = ["last_week", "last_month", "last_year"];
  const validFormats = ["json", "pdf", "excel"];

  const finalSegment = segment || "all";
  const finalPeriod = period || "last_month";
  const finalFormat = format || "json";

  if (!validSegments.includes(finalSegment)) {
    console.warn(`⚠️ Segmento "${finalSegment}" no válido, usando "all"`);
  }
  if (!validPeriods.includes(finalPeriod)) {
    console.warn(`⚠️ Período "${finalPeriod}" no válido, usando "last_month"`);
  }
  if (!validFormats.includes(finalFormat)) {
    console.warn(`⚠️ Formato "${finalFormat}" no válido, usando "json"`);
  }

  const queryParams = new URLSearchParams({
    segmento: finalSegment,
    periodo: finalPeriod,
    formato: finalFormat,
  });

  const endpoint = `/api/aura/reportes/clientes?${queryParams}`;
  console.log(`🔗 Llamando a Laravel: ${endpoint}`);

  try {
    const result = await callLaravelAPI(endpoint, "GET", null, userToken);

    console.log(`✅ Reporte de clientes recibido de Laravel`);

    const totalClientes = result.data?.total_clientes || 0;
    const clientes = result.data?.clientes || [];

    console.log(`👥 Total clientes en reporte: ${totalClientes}`);

    return {
      success: true,
      report_type: "customers",
      segment: finalSegment,
      period: finalPeriod,
      total_customers: totalClientes,
      data: result.data,
      message: `✅ Reporte de clientes generado: ${totalClientes} cliente(s) en segmento "${finalSegment}"`,
    };
  } catch (error) {
    console.error(`❌ Error generando reporte de clientes:`, error);
    throw new Error(`Error generando reporte de clientes: ${error.message}`);
  }
}

// ==========================================
// EJECUTORES - MARKETING
// ==========================================

/**
 * Enviar email de marketing personalizado a clientes
 * Esta es la función principal que maneja send_bulk_offer y send_marketing_email
 */
async function executeSendMarketingEmail(params, userToken) {
  console.log(`📧 Enviando campaña de marketing por email:`, params);

  const {
    target_segment,
    campaign_type,
    subject,
    message_content,
    products_mentioned,
    points_offer,
    discount_info,
    call_to_action,
    schedule_for,
    include_unsubscribe_link,
    // Campos de send_bulk_offer (compatibilidad)
    offer_title,
    offer_description,
    discount_percentage,
    discount_code,
    valid_from,
    valid_until,
  } = params;

  // Validaciones
  const finalSubject = subject || offer_title;
  const finalContent = message_content || offer_description;

  if (!finalSubject || finalSubject.trim().length === 0) {
    throw new Error("El asunto del correo no puede estar vacío");
  }

  if (!finalContent || finalContent.trim().length === 0) {
    throw new Error("El contenido del mensaje no puede estar vacío");
  }

  const validSegments = ["all", "vip", "regular", "new", "inactive"];
  const finalSegment = target_segment || "all";

  if (!validSegments.includes(finalSegment)) {
    throw new Error(
      `Segmento no válido. Debe ser uno de: ${validSegments.join(", ")}`,
    );
  }

  // Mapear discount_info si viene de send_bulk_offer
  let finalDiscountInfo = discount_info;
  if (!finalDiscountInfo && (discount_percentage || discount_code)) {
    finalDiscountInfo = {
      discount_percentage: discount_percentage,
      discount_code: discount_code,
      valid_from: valid_from,
      valid_until: valid_until,
    };
  }

  // Preparar datos para enviar a Laravel
  const emailCampaignData = {
    segmento: finalSegment,
    tipo_campana: campaign_type || "general_announcement",
    asunto: finalSubject.trim(),
    contenido: finalContent.trim(),
    productos: products_mentioned || [],
    oferta_puntos: points_offer || null,
    info_descuento: finalDiscountInfo || null,
    llamada_accion: call_to_action || "Visítanos pronto",
    programado_para: schedule_for || null,
    incluir_baja: include_unsubscribe_link !== false,
  };

  console.log(`📧 Segmento objetivo: ${finalSegment}`);
  console.log(`📋 Tipo de campaña: ${emailCampaignData.tipo_campana}`);
  console.log(`📝 Asunto: "${finalSubject}"`);
  if (products_mentioned && products_mentioned.length > 0) {
    console.log(`🍔 Productos mencionados: ${products_mentioned.length}`);
  }
  if (points_offer) {
    console.log(`⭐ Oferta de puntos: ${points_offer.points_amount}x`);
  }
  if (finalDiscountInfo) {
    console.log(`💰 Descuento: ${finalDiscountInfo.discount_percentage}%`);
  }

  try {
    const result = await callLaravelAPI(
      `/api/aura/marketing/enviar-email`,
      "POST",
      emailCampaignData,
      userToken,
    );

    console.log(`✅ Campaña de email enviada exitosamente`);

    const recipientsCount = result.data?.recipients_count || 0;
    const scheduledInfo = schedule_for
      ? ` (programado para ${schedule_for})`
      : "";

    return {
      success: true,
      campaign_type: emailCampaignData.tipo_campana,
      target_segment: finalSegment,
      recipients_count: recipientsCount,
      subject: finalSubject,
      scheduled_for: schedule_for || null,
      message: `✅ Correo de marketing enviado a ${recipientsCount} cliente(s) del segmento "${finalSegment}"${scheduledInfo}`,
      preview: {
        subject: finalSubject,
        segment: finalSegment,
        campaign_type: emailCampaignData.tipo_campana,
        has_products: products_mentioned && products_mentioned.length > 0,
        has_discount: !!finalDiscountInfo,
        has_points: !!points_offer,
      },
    };
  } catch (error) {
    console.error(`❌ Error enviando campaña de email:`, error);
    throw new Error(`Error enviando campaña de marketing: ${error.message}`);
  }
}

async function executeSendPersonalizedMessage(params, userToken) {
  console.log(`📧 Enviando mensaje personalizado:`, params);

  // Usar la misma función pero con segmento personalizado
  return await executeSendMarketingEmail(
    {
      ...params,
      target_segment: "all", // Se puede ajustar según recipients
      campaign_type: "general_announcement",
      subject: params.subject,
      message_content: params.message,
    },
    userToken,
  );
}

async function executeCreateLoyaltyCampaign(params, userToken) {
  console.log(`🎁 Creando campaña de fidelización:`, params);

  const {
    campaign_name,
    reward_type,
    reward_amount,
    requirements,
    duration_days,
  } = params;

  // Generar contenido para email de la campaña
  const subject = `Nueva campaña de fidelización: ${campaign_name}`;
  const message_content = `¡Participa en nuestra nueva campaña "${campaign_name}"!\n\n${requirements || "Participa y gana recompensas."}\n\nRecompensa: ${reward_type} ${reward_amount ? `(${reward_amount})` : ""}\nDuración: ${duration_days || 30} días`;

  // Enviar email anunciando la campaña
  return await executeSendMarketingEmail(
    {
      target_segment: "all",
      campaign_type: "loyalty_reward",
      subject: subject,
      message_content: message_content,
      points_offer:
        reward_type === "points" ? { points_amount: reward_amount } : null,
      discount_info:
        reward_type === "discount"
          ? { discount_percentage: reward_amount }
          : null,
      call_to_action: "Participa ahora",
    },
    userToken,
  );
}
