/**
 * Servicio de lógica de negocio
 * Genera previews de acciones antes de ejecutarlas
 * Calcula impacto y riesgos
 */

export async function generateActionPreview(functionName, parameters, userId) {
  console.log(`\n📊 Generando preview para: ${functionName}`);

  switch (functionName) {
    // ==========================================
    // PRODUCTOS
    // ==========================================

    case "update_product_price": {
      const priceChange =
        parameters.new_price > 0 ? parameters.new_price : "Nuevo precio";

      return {
        title: "💰 Cambiar Precio de Producto",
        description: `Actualizar precio de "${
          parameters.product_name || `producto #${parameters.product_id}`
        }" a ${priceChange} ${parameters.currency || "EUR"}`,

        current_state: {
          product_identifier:
            parameters.product_name || `ID: ${parameters.product_id}`,
          note: "Se obtendrá el precio actual al ejecutar",
        },

        proposed_changes: [
          {
            field: "Precio",
            from: "Precio actual",
            to: `${parameters.new_price} ${parameters.currency || "EUR"}`,
            change: "update",
          },
        ],

        impact: {
          business: `Cambio de precio afecta directamente los ingresos`,
          users: `Los clientes verán el nuevo precio inmediatamente`,
          system: "Actualización directa en base de datos",
        },

        risks: [
          ...(parameters.new_price === 0
            ? ["⚠️ Precio $0 permitirá ventas gratuitas del producto"]
            : []),
          ...(parameters.new_price > 100
            ? ["⚠️ Precio muy alto, puede afectar ventas"]
            : []),
        ],

        requires_confirmation: true,
        confirmation_level:
          parameters.new_price === 0 || parameters.new_price > 500
            ? "high"
            : "medium",

        next_steps: [
          "Revisar el nuevo precio propuesto",
          "Confirmar el cambio",
          "El sistema actualizará el precio inmediatamente",
          "Los clientes verán el cambio en tiempo real",
        ],

        estimated_duration: "< 1 segundo",
      };
    }

    case "update_product_info": {
      const changes = [];

      // Construir lista de cambios
      if (parameters.new_name) {
        changes.push({
          field: "Nombre",
          to: parameters.new_name,
          icon: "✏️",
        });
      }

      if (parameters.new_description) {
        changes.push({
          field: "Descripción",
          to:
            parameters.new_description.length > 50
              ? parameters.new_description.substring(0, 50) + "..."
              : parameters.new_description,
          icon: "📝",
        });
      }

      if (parameters.new_price !== undefined) {
        changes.push({
          field: "Precio",
          to: `${parameters.new_price}€`,
          icon: "💰",
        });
      }

      if (parameters.category) {
        changes.push({
          field: "Categoría",
          to: parameters.category,
          icon: "📂",
        });
      }

      if (parameters.is_available !== undefined) {
        changes.push({
          field: "Disponibilidad",
          to: parameters.is_available ? "✅ Disponible" : "❌ No disponible",
          icon: "🔄",
        });
      }

      if (parameters.stock !== undefined) {
        changes.push({
          field: "Stock",
          to: `${parameters.stock} unidades`,
          icon: "📦",
        });
      }

      // Determinar nivel de confirmación
      let confirmationLevel = "medium";
      const criticalChanges = [
        parameters.is_available === false,
        parameters.new_price === 0,
        parameters.stock === 0,
      ];

      if (criticalChanges.some((c) => c)) {
        confirmationLevel = "high";
      }

      return {
        title: "📝 Actualizar Información del Producto",
        description: `Se actualizarán ${changes.length} campo${
          changes.length !== 1 ? "s" : ""
        } de "${
          parameters.product_name || `producto #${parameters.product_id}`
        }"`,

        current_state: {
          product_identifier:
            parameters.product_name || `ID: ${parameters.product_id}`,
          note: "Se obtendrán los datos actuales al ejecutar",
        },

        proposed_changes: changes,

        impact: {
          business:
            changes.length === 1
              ? `Se modificará ${changes[0].field.toLowerCase()} del producto`
              : `Se modificarán múltiples datos del producto`,
          users:
            parameters.is_available === false
              ? "❌ Los clientes NO podrán ver/comprar este producto"
              : parameters.new_price
                ? "Los clientes verán el nuevo precio inmediatamente"
                : "Los clientes verán la información actualizada",
          system: "Actualización directa en base de datos",
        },

        risks: [
          ...(parameters.is_available === false
            ? ["⚠️ El producto quedará oculto para los clientes"]
            : []),
          ...(parameters.new_price === 0
            ? ["⚠️ Precio $0 permitirá ventas gratis"]
            : []),
          ...(parameters.stock === 0
            ? ["⚠️ Stock en 0: producto aparecerá como agotado"]
            : []),
          ...(parameters.new_name && parameters.new_name.length < 3
            ? ["⚠️ Nombre muy corto"]
            : []),
        ],

        requires_confirmation: true,
        confirmation_level: confirmationLevel,

        next_steps: [
          "Revisar los cambios propuestos",
          "Confirmar la actualización",
          "El sistema actualizará el producto inmediatamente",
          "Los cambios serán visibles para los clientes al instante",
        ],

        details: {
          changes_count: changes.length,
          affects_price: parameters.new_price !== undefined,
          affects_availability: parameters.is_available !== undefined,
          affects_inventory: parameters.stock !== undefined,
        },

        estimated_duration: "< 1 segundo",
      };
    }

    case "update_product_stock": {
      const operation = parameters.operation || "set";
      const operationText = {
        set: "Establecer",
        add: "Añadir",
        subtract: "Restar",
      };

      return {
        title: "📦 Actualizar Stock de Producto",
        description: `${operationText[operation]} ${
          parameters.new_stock
        } unidades de stock para "${
          parameters.product_name || `producto #${parameters.product_id}`
        }"`,

        current_state: {
          product_identifier:
            parameters.product_name || `ID: ${parameters.product_id}`,
          current_stock: "Se obtendrá el stock actual al ejecutar",
        },

        proposed_changes: [
          {
            field: "Stock",
            from: "Stock actual",
            to: `${parameters.new_stock} unidades`,
            operation: operation,
          },
        ],

        impact: {
          business: "El stock disponible afecta la capacidad de venta",
          users:
            parameters.new_stock === 0
              ? "Producto aparecerá como AGOTADO"
              : "Stock actualizado para ventas",
          system: "Actualización de inventario",
        },

        risks: [
          ...(parameters.new_stock === 0
            ? ["⚠️ Stock en 0: No se podrán realizar más ventas"]
            : []),
          ...(parameters.new_stock > 1000
            ? ["⚠️ Stock muy alto, verifica que sea correcto"]
            : []),
        ],

        requires_confirmation: parameters.new_stock === 0,
        confirmation_level: parameters.new_stock === 0 ? "high" : "low",

        next_steps: [
          "Verificar la cantidad de stock",
          operation === "set"
            ? "El stock se establecerá al valor indicado"
            : operation === "add"
              ? "Se añadirá al stock existente"
              : "Se restará del stock existente",
          "Confirmar la operación",
        ],

        estimated_duration: "< 1 segundo",
      };
    }

    case "create_product": {
      return {
        title: "📦 Crear Nuevo Producto",
        description: `Crear producto "${parameters.name}" con precio ${parameters.price}€`,

        proposed_changes: [
          { field: "Nombre", value: parameters.name },
          { field: "Precio", value: `${parameters.price}€` },
          ...(parameters.description
            ? [{ field: "Descripción", value: parameters.description }]
            : []),
          ...(parameters.category
            ? [{ field: "Categoría", value: parameters.category }]
            : []),
          ...(parameters.stock
            ? [
                {
                  field: "Stock inicial",
                  value: `${parameters.stock} unidades`,
                },
              ]
            : []),
        ],

        impact: {
          business: "Nuevo producto disponible para venta",
          users: "El producto aparecerá en el catálogo para los clientes",
          system: "Se creará un nuevo registro en la base de datos",
        },

        risks: [
          ...(parameters.price === 0
            ? ["⚠️ Precio en $0: Producto gratis"]
            : []),
        ],

        requires_confirmation: true,
        confirmation_level: "medium",

        next_steps: [
          "Revisar los datos del producto",
          "Confirmar la creación",
          "El producto estará disponible inmediatamente",
          "Podrás editarlo después desde el catálogo",
        ],

        estimated_duration: "< 1 segundo",
      };
    }

    case "delete_product": {
      return {
        title: "🗑️ Eliminar Producto",
        description: `Eliminar permanentemente "${
          parameters.product_name || `producto #${parameters.product_id}`
        }"`,

        current_state: {
          product_identifier:
            parameters.product_name || `ID: ${parameters.product_id}`,
          warning: "⚠️ Esta acción NO se puede deshacer",
        },

        impact: {
          business: "El producto no estará disponible para ventas futuras",
          users: "Los clientes no podrán ver ni comprar este producto",
          system: "Eliminación permanente del registro",
          history: "El historial de ventas previas se mantiene para reportes",
        },

        risks: [
          "❌ ACCIÓN IRREVERSIBLE - No se puede recuperar",
          "⚠️ Pedidos históricos mantendrán referencia al producto",
          "⚠️ Verifica que sea el producto correcto antes de confirmar",
        ],

        requires_confirmation: true,
        confirmation_level: "critical",

        next_steps: [
          "⚠️ VERIFICA que sea el producto correcto",
          "Esta acción NO se puede deshacer",
          "Confirma SOLO si estás completamente seguro",
          "Considera desactivar en lugar de eliminar",
        ],

        alternative: {
          suggestion:
            "💡 Alternativa: En lugar de eliminar, puedes DESACTIVAR el producto para ocultarlo sin perder datos",
          command: 'Usa: "desactiva [producto]" para ocultarlo temporalmente',
        },

        estimated_duration: "< 1 segundo",
      };
    }

    // ==========================================
    // REPORTES
    // ==========================================

    case "generate_sales_report": {
      const periodText = {
        today: "HOY",
        month: parameters.specific_month
          ? `del mes ${parameters.specific_month}`
          : "del mes actual",
        quarter: parameters.specific_quarter
          ? `del ${parameters.specific_quarter}`
          : "del trimestre actual",
        year: parameters.specific_year
          ? `del año ${parameters.specific_year}`
          : "del año actual",
        custom: `del ${parameters.start_date} al ${parameters.end_date}`,
      };

      const formatText = {
        view: "Ver en pantalla",
        pdf: "Descargar PDF",
        excel: "Descargar Excel",
      };

      return {
        title: "📊 Reporte de Ventas",
        description: `Generar reporte completo de ventas ${
          periodText[parameters.period_type]
        }`,

        report_details: {
          period: periodText[parameters.period_type],
          format: formatText[parameters.format || "view"],
          includes: [
            "📈 Total de ventas e ingresos",
            "📊 Comparativa con período anterior",
            "💳 Desglose por método de pago",
            "🏆 Productos más vendidos",
            "📅 Ventas por día/hora",
            "👥 Clientes nuevos vs recurrentes",
            "💰 Ticket promedio",
            "📉 Análisis de tendencias",
          ],
        },

        impact: {
          business: "Análisis de rendimiento del negocio",
          users: "No afecta a los clientes",
          system: "Consulta de datos (solo lectura)",
        },

        requires_confirmation: false,
        confirmation_level: "none",

        next_steps: [
          "Generando reporte con datos en tiempo real",
          "Calculando métricas y estadísticas",
          parameters.format === "pdf"
            ? "Preparando documento PDF para descarga"
            : parameters.format === "excel"
              ? "Exportando datos a Excel"
              : "Mostrando resultados en pantalla",
        ],

        estimated_duration:
          parameters.period_type === "year" ? "2-5 segundos" : "1-2 segundos",
      };
    }

    case "generate_product_report": {
      return {
        title: "📦 Reporte de Productos",
        description: parameters.category
          ? `Reporte de productos en categoría "${parameters.category}"`
          : parameters.low_stock_only
            ? "Reporte de productos con stock bajo"
            : "Reporte completo de productos",

        report_details: {
          filters: [
            ...(parameters.category
              ? [`Categoría: ${parameters.category}`]
              : []),
            ...(parameters.low_stock_only
              ? ["Solo productos con stock bajo"]
              : []),
          ],
          includes: [
            "📊 Total de productos activos",
            "⚠️ Productos con stock bajo",
            "❌ Productos sin stock",
            "💰 Valoración total del inventario",
            "📈 Productos más rentables",
            "📉 Productos menos vendidos",
          ],
        },

        impact: {
          business: "Análisis de inventario y catálogo",
          users: "No afecta a los clientes",
          system: "Consulta de datos (solo lectura)",
        },

        requires_confirmation: false,
        confirmation_level: "none",

        next_steps: [
          "Analizando inventario actual",
          "Calculando métricas de productos",
          "Generando reporte detallado",
        ],

        estimated_duration: "1-2 segundos",
      };
    }

    case "generate_customer_report": {
      const segmentText = {
        all: "todos los clientes",
        vip: "clientes VIP",
        active: "clientes activos",
        inactive: "clientes inactivos",
      };

      return {
        title: "👥 Reporte de Clientes",
        description: `Análisis de ${segmentText[parameters.segment || "all"]}`,

        report_details: {
          segment: segmentText[parameters.segment || "all"],
          includes: [
            "👥 Total de clientes",
            "🌟 Clientes VIP (alta frecuencia/gasto)",
            "✅ Clientes activos (último mes)",
            "⏸️ Clientes inactivos (+3 meses)",
            "💰 Gasto promedio por cliente",
            "📊 Frecuencia de compra",
            "🎯 Oportunidades de fidelización",
          ],
        },

        impact: {
          business: "Insights para estrategias de marketing",
          users: "No afecta a los clientes",
          system: "Consulta de datos (solo lectura)",
        },

        requires_confirmation: false,
        confirmation_level: "none",

        next_steps: [
          "Analizando base de datos de clientes",
          "Segmentando por comportamiento",
          "Generando insights y recomendaciones",
        ],

        estimated_duration: "1-3 segundos",
      };
    }

    // ==========================================
    // MARKETING
    // ==========================================

    case "send_bulk_offer": {
      const segmentText = {
        all: "TODOS los clientes",
        vip: "clientes VIP",
        active: "clientes activos",
        inactive: "clientes inactivos",
      };

      return {
        title: "📧 Campaña de Oferta Masiva",
        description: `Enviar oferta "${parameters.offer_title}" a ${
          segmentText[parameters.target_segment]
        }`,

        campaign_details: {
          target: segmentText[parameters.target_segment],
          offer_title: parameters.offer_title,
          offer_description: parameters.offer_description,
          discount: parameters.discount_percentage
            ? `${parameters.discount_percentage}% de descuento`
            : "N/A",
          discount_code: parameters.discount_code || "Sin código",
          validity: parameters.valid_from
            ? `Del ${parameters.valid_from} al ${parameters.valid_until}`
            : "Sin fecha de expiración",
          channel: parameters.channel || "email",
        },

        impact: {
          business: `Campaña de marketing a ${
            segmentText[parameters.target_segment]
          }`,
          users: `Los clientes recibirán la oferta por ${
            parameters.channel || "email"
          }`,
          system: `Envío ${
            parameters.schedule_for ? "programado" : "inmediato"
          } vía ${parameters.channel || "email"}`,
        },

        risks: [
          ...(parameters.target_segment === "all"
            ? [
                "⚠️ ENVÍO MASIVO a toda la base de clientes",
                "⚠️ Verifica que el mensaje sea correcto",
              ]
            : []),
          ...(parameters.discount_percentage > 50
            ? ["⚠️ Descuento muy alto, impactará márgenes"]
            : []),
        ],

        requires_confirmation: true,
        confirmation_level:
          parameters.target_segment === "all" ? "high" : "medium",

        next_steps: [
          "Revisar el contenido de la oferta",
          "Verificar el segmento objetivo",
          parameters.schedule_for
            ? `Programar envío para ${parameters.schedule_for}`
            : "Enviar inmediatamente",
          "Los clientes recibirán la oferta según el canal seleccionado",
        ],

        estimated_duration: parameters.schedule_for
          ? "Programado"
          : "5-30 segundos",
      };
    }

    case "send_personalized_message": {
      const recipientsCount = parameters.recipients
        ? parameters.recipients.split(",").length
        : 0;

      return {
        title: "✉️ Mensaje Personalizado",
        description: `Enviar mensaje personalizado a ${recipientsCount} destinatario${
          recipientsCount !== 1 ? "s" : ""
        }`,

        message_details: {
          recipients: `${recipientsCount} destinatario${
            recipientsCount !== 1 ? "s" : ""
          }`,
          subject: parameters.subject,
          preview:
            parameters.message.length > 100
              ? parameters.message.substring(0, 100) + "..."
              : parameters.message,
          channel: parameters.channel || "email",
          includes_coupon: parameters.attach_coupon ? "Sí" : "No",
        },

        impact: {
          business: "Comunicación directa con clientes específicos",
          users: `${recipientsCount} cliente${
            recipientsCount !== 1 ? "s" : ""
          } recibirá${recipientsCount !== 1 ? "n" : ""} el mensaje`,
          system: `Envío por ${parameters.channel || "email"}`,
        },

        requires_confirmation: true,
        confirmation_level: recipientsCount > 10 ? "medium" : "low",

        next_steps: [
          "Revisar el mensaje y destinatarios",
          "Confirmar el envío",
          "Los clientes recibirán el mensaje inmediatamente",
        ],

        estimated_duration: "1-5 segundos",
      };
    }

    case "create_loyalty_campaign": {
      const rewardTypeText = {
        points: "Puntos de fidelidad",
        discount: "Descuento",
        gift: "Regalo",
      };

      return {
        title: "🎁 Nueva Campaña de Fidelización",
        description: `Crear campaña "${
          parameters.campaign_name
        }" con recompensa de ${rewardTypeText[parameters.reward_type]}`,

        campaign_details: {
          name: parameters.campaign_name,
          reward_type: rewardTypeText[parameters.reward_type],
          reward_amount: parameters.reward_amount
            ? `${parameters.reward_amount} ${
                parameters.reward_type === "points"
                  ? "puntos"
                  : parameters.reward_type === "discount"
                    ? "%"
                    : ""
              }`
            : "N/A",
          requirements: parameters.requirements || "Sin requisitos específicos",
          duration: `${parameters.duration_days || 30} días`,
        },

        impact: {
          business: "Nueva estrategia de fidelización de clientes",
          users: "Los clientes podrán participar en la campaña",
          system: "Se activará la campaña inmediatamente",
        },

        requires_confirmation: true,
        confirmation_level: "medium",

        next_steps: [
          "Revisar los detalles de la campaña",
          "Confirmar la creación",
          "La campaña se activará automáticamente",
          "Podrás monitorear el rendimiento desde el panel",
        ],

        estimated_duration: "< 1 segundo",
      };
    }

    // ==========================================
    // DEFAULT
    // ==========================================

    // ==========================================
    // MARKETING
    // ==========================================

    case "send_marketing_email":
    case "send_bulk_offer": {
      // Determinar segmento
      const segmentNames = {
        all: "Todos los clientes",
        vip: "Clientes VIP",
        regulares: "Clientes regulares",
        nuevos: "Clientes nuevos",
        inactivos: "Clientes inactivos",
      };

      const targetSegment =
        segmentNames[parameters.target_segment] ||
        parameters.target_segment ||
        "Todos los clientes";

      // Construir detalles del correo
      const emailDetails = [];

      emailDetails.push(`📧 **Asunto:** ${parameters.subject || "Sin asunto"}`);
      emailDetails.push(`👥 **Destinatarios:** ${targetSegment}`);

      if (parameters.message_content) {
        const contentPreview =
          parameters.message_content.length > 150
            ? parameters.message_content.substring(0, 150) + "..."
            : parameters.message_content;
        emailDetails.push(`\n📝 **Contenido:**\n${contentPreview}`);
      }

      // Productos mencionados
      if (
        parameters.products_mentioned &&
        parameters.products_mentioned.length > 0
      ) {
        emailDetails.push(`\n🛒 **Productos destacados:**`);
        parameters.products_mentioned.forEach((prod) => {
          if (prod.new_price && prod.old_price) {
            const discount = Math.round(
              ((prod.old_price - prod.new_price) / prod.old_price) * 100,
            );
            emailDetails.push(
              `  • ${prod.name}: €${prod.new_price} (antes €${prod.old_price}) - ${discount}% de descuento`,
            );
          } else if (prod.new_price) {
            emailDetails.push(`  • ${prod.name}: €${prod.new_price}`);
          } else {
            emailDetails.push(`  • ${prod.name}`);
          }
        });
      }

      // Oferta de puntos
      if (parameters.points_offer) {
        const { points_amount, minimum_purchase, expiry_date } =
          parameters.points_offer;
        emailDetails.push(`\n🎁 **Oferta de puntos:**`);
        emailDetails.push(`  • Multiplica tus puntos x${points_amount}`);
        if (minimum_purchase) {
          emailDetails.push(`  • Compra mínima: €${minimum_purchase}`);
        }
        if (expiry_date) {
          emailDetails.push(
            `  • Válido hasta: ${new Date(expiry_date).toLocaleDateString("es-ES")}`,
          );
        }
      }

      // Información de descuento
      if (parameters.discount_info) {
        emailDetails.push(`\n💰 **Descuento:**`);
        if (parameters.discount_info.discount_percentage) {
          emailDetails.push(
            `  • ${parameters.discount_info.discount_percentage}% de descuento`,
          );
        }
        if (parameters.discount_info.discount_code) {
          emailDetails.push(
            `  • Código: ${parameters.discount_info.discount_code}`,
          );
        }
        if (parameters.discount_info.description) {
          emailDetails.push(`  • ${parameters.discount_info.description}`);
        }
      }

      // Call to action
      if (parameters.call_to_action) {
        emailDetails.push(
          `\n🔔 **Llamada a la acción:** ${parameters.call_to_action}`,
        );
      }

      return {
        title: "📧 Enviar Email de Marketing",
        description: `Se enviará un email de campaña de marketing a: ${targetSegment}`,

        summary: emailDetails.join("\n"),

        details: emailDetails.join("\n"),

        impact: {
          business: `Campaña de marketing dirigida a ${targetSegment}`,
          users: `Los clientes recibirán un correo electrónico promocional`,
          system: "Se enviará el correo usando el sistema de email configurado",
        },

        risks: [
          parameters.target_segment === "all"
            ? "⚠️ Se enviará a TODOS los clientes registrados"
            : "",
          !parameters.subject || parameters.subject.length < 5
            ? "⚠️ El asunto del correo es muy corto"
            : "",
          !parameters.message_content || parameters.message_content.length < 20
            ? "⚠️ El contenido del mensaje es muy breve"
            : "",
        ].filter(Boolean),

        requires_confirmation: true,
        confirmation_level:
          parameters.target_segment === "all" ? "high" : "medium",

        next_steps: [
          "Revisar el asunto y contenido del correo",
          "Verificar los destinatarios",
          "Confirmar el envío",
          "El sistema enviará el email inmediatamente",
        ],

        estimated_duration:
          parameters.target_segment === "all"
            ? "Puede tomar varios minutos según la cantidad de clientes"
            : "< 30 segundos",

        confirmable: true,
      };
    }

    default: {
      console.warn(`⚠️ No hay preview definido para: ${functionName}`);

      return {
        title: "⚙️ Acción Pendiente",
        description: `Se ejecutará la función: ${functionName}`,

        details: {
          function: functionName,
          parameters: parameters,
        },

        impact: {
          business: "Acción del sistema",
          users: "Puede afectar a los usuarios",
          system: "Se ejecutará la operación solicitada",
        },

        requires_confirmation: true,
        confirmation_level: "medium",

        next_steps: [
          "Revisar los parámetros",
          "Confirmar la ejecución",
          "El sistema procesará la solicitud",
        ],

        estimated_duration: "Desconocido",
      };
    }
  }
}

/**
 * Calcular el nivel de riesgo de una acción
 */
export function calculateRiskLevel(functionName, parameters) {
  const riskLevels = {
    // Alto riesgo
    delete_product: "critical",
    send_bulk_offer: "high",

    // Riesgo medio
    update_product_price: "medium",
    update_product_info: "medium",
    create_loyalty_campaign: "medium",

    // Bajo riesgo
    update_product_stock: "low",
    send_personalized_message: "low",

    // Sin riesgo
    generate_sales_report: "none",
    generate_product_report: "none",
    generate_customer_report: "none",
  };

  return riskLevels[functionName] || "medium";
}

/**
 * Determinar si una acción requiere confirmación
 */
export function requiresConfirmation(functionName, parameters) {
  // Todas las acciones de escritura requieren confirmación
  const writeActions = [
    "update_product_price",
    "update_product_info",
    "update_product_stock",
    "create_product",
    "delete_product",
    "send_bulk_offer",
    "send_personalized_message",
    "create_loyalty_campaign",
  ];

  if (writeActions.includes(functionName)) {
    return true;
  }

  // Reportes no requieren confirmación
  return false;
}
