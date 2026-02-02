import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { interpretInstruction } from "./services/llmService.js";
import { validateActionParameters } from "./services/validationService.js";
import { generateActionPreview } from "./services/businessService.js";
import { executeAction, callLaravelAPI } from "./services/executionService.js";
import { authenticate } from "./middleware/auth.js";
import { validateRequest } from "./middleware/validation.js";
// Importar env.js para ejecutar la validación de proveedores
import "./config/env.js";
import { formatUserFriendlyError } from "./utils/errorHandler.js";
import { PORT } from "./config/env.js";

// ==========================================
// 🔐 IMPORTANTE: FLUJO DE AUTENTICACIÓN
// ==========================================
// 1. Frontend obtiene JWT token de Laravel al hacer login
// 2. Frontend envía requests al microservicio con el JWT en Authorization header
// 3. Microservicio verifica que el token esté presente (middleware authenticate)
// 4. Microservicio reenvía el mismo token a Laravel en las peticiones API
// 5. Laravel valida el token y ejecuta la acción
// ==========================================

dotenv.config();

// ==========================================
// VALIDACIÓN DE VARIABLES DE ENTORNO CRÍTICAS
// ==========================================
// La validación de proveedores de IA se hace en env.js
// No requerimos específicamente GEMINI_API_KEY porque el sistema
// soporta rotación entre múltiples proveedores (Gemini, OpenAI, Claude, Grok)
// Si no hay ningún proveedor configurado, env.js lanzará un error y detendrá la ejecución

const app = express();

// ==========================================
// MIDDLEWARES GLOBALES
// ==========================================
app.use(cors());
app.use(express.json());

// Middleware para asegurar UTF-8 en respuestas JSON
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (data) {
    res.charset = "utf-8";
    if (!res.getHeader("Content-Type")) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
    }
    return originalJson.call(this, data);
  };
  next();
});

// Middleware de logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n${"=".repeat(60)}`);
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  console.log(`${"=".repeat(60)}`);
  next();
});

// ==========================================
// ENDPOINT: Health Check
// ==========================================
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "AURA AI Microservice",
    version: "1.0.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// ENDPOINT: Obtener familias disponibles
// ==========================================
app.get("/ai/families", authenticate, async (req, res) => {
  try {
    console.log("\n📋 Obteniendo familias disponibles...");

    const families = await callLaravelAPI(
      "/api/aura/familias",
      "GET",
      null,
      req.userToken,
    );

    const familyList = Array.isArray(families)
      ? families.map((f) => ({ id: f.id, name: f.name, type: f.type }))
      : [];

    console.log(`✅ ${familyList.length} familias encontradas`);

    res.json({
      success: true,
      families: familyList,
    });
  } catch (error) {
    console.error("\n❌ Error obteniendo familias:", error);
    const friendlyError = formatUserFriendlyError(error);

    res.status(500).json({
      success: false,
      error: friendlyError.message,
      errorTitle: friendlyError.title,
      errorSuggestion: friendlyError.suggestion,
      technicalError: friendlyError.technical,
    });
  }
});

// ==========================================
// ENDPOINT: Estadísticas de proveedores de IA
// ==========================================
app.get("/ai/providers/stats", authenticate, async (req, res) => {
  try {
    const { getProviderManager } =
      await import("./services/aiProviderRotation.js");
    const providerManager = getProviderManager();
    const stats = providerManager.getStats();

    res.json({
      success: true,
      stats: stats,
    });
  } catch (error) {
    console.error("❌ Error obteniendo estadísticas:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==========================================
// ENDPOINT: Rotar proveedores manualmente
// ==========================================
app.post("/ai/providers/rotate", authenticate, async (req, res) => {
  try {
    const { getProviderManager } =
      await import("./services/aiProviderRotation.js");
    const providerManager = getProviderManager();
    const newProvider = providerManager.rotateToNextProvider(
      "Rotación manual solicitada",
    );

    res.json({
      success: true,
      message: `Proveedor rotado a ${newProvider.name}`,
      currentProvider: newProvider.name,
      providerId: newProvider.id,
    });
  } catch (error) {
    console.error("❌ Error rotando proveedor:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==========================================
// ENDPOINT: Interpretar instrucción en lenguaje natural
// ==========================================
app.post(
  "/ai/interpret",
  authenticate,
  validateRequest("interpret"),
  async (req, res) => {
    try {
      const { payload, user_id, context } = req.body;

      console.log("\n🤖 Interpretando instrucción:");
      console.log(`   Usuario: ${user_id}`);
      console.log(`   PAyload: "${payload}"`);
      console.log(`   Contexto:`, JSON.stringify(context, null, 2));

      // Paso 1: Interpretar con LLM
      console.log("\n📡 Llamando a Gemini AI...");
      const interpretation = await interpretInstruction(payload, context);

      console.log("\n✅ Interpretación recibida:");
      console.log(JSON.stringify(interpretation, null, 2));

      // Verificar si es conversación general o función específica
      if (interpretation.type === "conversation") {
        console.log("\n💬 Respuesta de conversación general");
        return res.json({
          success: true,
          interpreted: false,
          type: "conversation",
          message: interpretation.message,
          confidence: interpretation.confidence || 1.0,
        });
      }

      // Es una llamada a función
      console.log("\n⚙️ Es una llamada a función");

      // Paso 2: Validar parámetros
      console.log("\n🔍 Validando parámetros...");
      const validation = await validateActionParameters(
        interpretation.function_name,
        interpretation.parameters,
      );

      if (!validation.is_valid) {
        console.error("\n❌ Validación fallida:");
        validation.errors.forEach((error) => {
          console.error(`   - ${error.field}: ${error.message}`);
        });

        return res.status(400).json({
          success: false,
          interpreted: false,
          error: "Parámetros inválidos",
          validation_errors: validation.errors,
        });
      }

      if (validation.warnings.length > 0) {
        console.warn("\n⚠️ Warnings de validación:");
        validation.warnings.forEach((warning) => {
          console.warn(`   - ${warning.field}: ${warning.message}`);
        });
      }

      // Paso 3: Generar preview
      console.log("\n📊 Generando preview de la acción...");
      const preview = await generateActionPreview(
        interpretation.function_name,
        interpretation.parameters,
        user_id,
      );

      console.log("\n✅ Preview generado exitosamente");

      // Respuesta final para función
      const response = {
        success: true,
        interpreted: true,
        function: interpretation.function_name,
        arguments: interpretation.parameters,
        confidence: interpretation.confidence || 0.9,
        confirmation_required: preview.requires_confirmation || false,
        preview: {
          summary:
            preview.title ||
            preview.summary ||
            preview.description ||
            "Acción preparada",
          details: preview.description || preview.details || "",
          confirmable: preview.confirmable || true,
        },
      };

      console.log("\n📤 Enviando respuesta al cliente");
      res.json(response);
    } catch (error) {
      console.error("\n❌ Error en /ai/interpret:");
      console.error(error);

      const friendlyError = formatUserFriendlyError(error);

      res.status(500).json({
        success: false,
        error: friendlyError.message,
        errorTitle: friendlyError.title,
        errorSuggestion: friendlyError.suggestion,
        technicalError: friendlyError.technical,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  },
);

// ==========================================
// ENDPOINT: Ejecutar acción
// ==========================================
app.post(
  "/ai/execute",
  authenticate,
  validateRequest("execute"),
  async (req, res) => {
    try {
      const { function_name, parameters, user_id } = req.body;

      console.log("\n⚙️ Ejecutando acción:");
      console.log(`   Función: ${function_name}`);
      console.log(`   Usuario: ${user_id}`);
      console.log(`   Parámetros:`, JSON.stringify(parameters, null, 2));

      // Validar que la función existe
      const validFunctions = [
        "find_product",
        "get_families_with_products",
        "update_product_price",
        "update_product_info",
        "update_product_stock",
        "create_product",
        "delete_product",
        "generate_sales_report",
        "generate_product_report",
        "generate_customer_report",
        "send_bulk_offer",
        "send_marketing_email",
        "send_personalized_message",
        "create_loyalty_campaign",
      ];

      if (!validFunctions.includes(function_name)) {
        console.error(`❌ Función no soportada: ${function_name}`);
        return res.status(400).json({
          success: false,
          error: `Función no soportada: ${function_name}`,
          valid_functions: validFunctions,
        });
      }

      // Validar parámetros antes de ejecutar
      console.log("\n🔍 Validando parámetros...");
      const validation = await validateActionParameters(
        function_name,
        parameters,
      );

      if (!validation.is_valid) {
        console.error("\n❌ Validación fallida:");
        validation.errors.forEach((error) => {
          console.error(`   - ${error.field}: ${error.message}`);
        });

        return res.status(400).json({
          success: false,
          error: "Parámetros inválidos",
          validation_errors: validation.errors,
        });
      }

      // Ejecutar la acción
      // El token JWT ya está en req.userToken (guardado por el middleware authenticate)
      const userToken = req.userToken;

      if (!userToken) {
        return res.status(401).json({
          success: false,
          error: "Token JWT del usuario requerido.",
          hint: "Incluye el header: Authorization: Bearer <tu_jwt_token_de_laravel>",
        });
      }

      console.log("\n🚀 Ejecutando en Laravel...");
      const result = await executeAction(function_name, parameters, userToken);

      console.log("\n✅ Ejecución exitosa");
      console.log(JSON.stringify(result, null, 2));

      res.json({
        success: true,
        executed: true,
        function: function_name,
        result: result,
      });
    } catch (error) {
      console.error("\n❌ Error en /ai/execute:");
      console.error(error);

      const friendlyError = formatUserFriendlyError(error);

      res.status(500).json({
        success: false,
        executed: false,
        error: friendlyError.message,
        errorTitle: friendlyError.title,
        errorSuggestion: friendlyError.suggestion,
        technicalError: friendlyError.technical,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  },
);

// ==========================================
// ENDPOINT: Generar preview sin ejecutar
// ==========================================
app.post(
  "/ai/preview",
  authenticate,
  validateRequest("preview"),
  async (req, res) => {
    try {
      const { function_name, parameters, user_id } = req.body;

      console.log("\n🔍 Generando preview:");
      console.log(`   Función: ${function_name}`);
      console.log(`   Parámetros:`, JSON.stringify(parameters, null, 2));

      const preview = await generateActionPreview(
        function_name,
        parameters,
        user_id,
      );

      res.json({
        success: true,
        preview: preview,
      });
    } catch (error) {
      console.error("\n❌ Error en /ai/preview:");
      console.error(error);

      const friendlyError = formatUserFriendlyError(error);

      res.status(500).json({
        success: false,
        error: friendlyError.message,
        errorTitle: friendlyError.title,
        errorSuggestion: friendlyError.suggestion,
        technicalError: friendlyError.technical,
      });
    }
  },
);

// ==========================================
// MANEJO DE ERRORES 404
// ==========================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint no encontrado",
    available_endpoints: [
      "GET /health",
      "POST /ai/interpret",
      "POST /ai/execute",
      "POST /ai/preview",
    ],
  });
});

// ==========================================
// MANEJO DE ERRORES GLOBAL
// ==========================================
app.use((err, req, res, next) => {
  console.error("\n❌ Error no manejado:");
  console.error(err);

  const friendlyError = formatUserFriendlyError(err);

  res.status(500).json({
    success: false,
    error: friendlyError.message,
    errorTitle: friendlyError.title,
    errorSuggestion: friendlyError.suggestion,
    technicalError: friendlyError.technical,
    details: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
app.listen(PORT, () => {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 AURA AI Microservice");
  console.log("=".repeat(60));
  console.log(`✅ Servidor corriendo en: http://localhost:${PORT}`);
  console.log(`✅ Entorno: ${process.env.NODE_ENV || "development"}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log("=".repeat(60) + "\n");
});

export default app;
