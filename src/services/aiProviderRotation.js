/**
 * Sistema de Rotación de Proveedores de IA
 * Gestiona múltiples claves API de diferentes proveedores y rota automáticamente cuando se agota el límite
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

// ==========================================
// CONFIGURACIÓN DE PROVEEDORES
// ==========================================

class AIProviderManager {
  constructor() {
    this.providers = [];
    this.currentProviderIndex = 0;
    this.providerStats = {}; // Estadísticas de uso
    this.initialized = false;
  }

  /**
   * Asegura que los proveedores estén inicializados (lazy initialization)
   */
  ensureInitialized() {
    if (!this.initialized) {
      this.initializeProviders();
      this.initialized = true;
    }
  }

  /**
   * Inicializa todos los proveedores disponibles desde variables de entorno
   */
  initializeProviders() {
    // Gemini providers
    const geminiKeys = this.getKeysFromEnv("GEMINI_API_KEY");
    geminiKeys.forEach((key, index) => {
      this.providers.push({
        id: `gemini_${index + 1}`,
        type: "gemini",
        name: `Google Gemini ${index + 1}`,
        apiKey: key,
        active: true,
        errorCount: 0,
        lastError: null,
        model: "gemini-2.5-flash",
      });
    });

    // OpenAI providers
    const openaiKeys = this.getKeysFromEnv("OPENAI_API_KEY");
    openaiKeys.forEach((key, index) => {
      this.providers.push({
        id: `openai_${index + 1}`,
        type: "openai",
        name: `OpenAI ${index + 1}`,
        apiKey: key,
        active: true,
        errorCount: 0,
        lastError: null,
        model: "gpt-3.5-turbo",
      });
    });

    // Claude providers (Anthropic)
    const claudeKeys = this.getKeysFromEnv("CLAUDE_API_KEY");
    claudeKeys.forEach((key, index) => {
      this.providers.push({
        id: `claude_${index + 1}`,
        type: "claude",
        name: `Claude ${index + 1}`,
        apiKey: key,
        active: true,
        errorCount: 0,
        lastError: null,
        model: "claude-3-haiku-20240307",
      });
    });

    // Grok providers (xAI)
    const grokKeys = this.getKeysFromEnv("GROK_API_KEY");
    grokKeys.forEach((key, index) => {
      this.providers.push({
        id: `grok_${index + 1}`,
        type: "grok",
        name: `Grok ${index + 1}`,
        apiKey: key,
        active: true,
        errorCount: 0,
        lastError: null,
        model: "grok-beta",
      });
    });

    console.log(`\n📊 Proveedores de IA inicializados: ${this.providers.length}`);
    this.providers.forEach((p) => {
      console.log(
        `   ✅ ${p.name} (${p.id}) - API Key: ${p.apiKey.substring(0, 10)}...`
      );
    });
  }

  /**
   * Obtiene múltiples claves API desde variables de entorno
   * Formato: GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc. O una sola GEMINI_API_KEY
   */
  getKeysFromEnv(baseKey) {
    const keys = [];

    // Intentar obtener la clave sin número (GEMINI_API_KEY)
    if (process.env[baseKey]) {
      keys.push(process.env[baseKey]);
    }

    // Intentar obtener claves numeradas (GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc)
    let index = 1;
    while (process.env[`${baseKey}_${index}`]) {
      keys.push(process.env[`${baseKey}_${index}`]);
      index++;
    }

    return keys;
  }

  /**
   * Obtiene el proveedor actual activo
   */
  getCurrentProvider() {
    // Asegurar que los proveedores estén inicializados
    this.ensureInitialized();

    // Validar que haya proveedores
    if (!this.providers || this.providers.length === 0) {
      throw new Error(
        "❌ No hay proveedores de IA configurados. Verifica que tengas al menos GEMINI_API_KEY en el archivo .env"
      );
    }

    // Buscar el primer proveedor activo desde el índice actual
    for (let i = 0; i < this.providers.length; i++) {
      const index = (this.currentProviderIndex + i) % this.providers.length;
      const provider = this.providers[index];

      if (provider && provider.active) {
        this.currentProviderIndex = index;
        return provider;
      }
    }

    // Si no hay proveedores activos, intentar reactivar todos
    console.warn("⚠️ No hay proveedores activos. Reactivando todos...");
    this.providers.forEach((p) => {
      if (p) {
        p.active = true;
        p.errorCount = 0;
      }
    });

    // Validar que el primer proveedor existe después de reactivar
    if (!this.providers[0]) {
      throw new Error(
        "❌ Error crítico: No se pudo obtener ningún proveedor de IA"
      );
    }

    return this.providers[0];
  }

  /**
   * Rota al siguiente proveedor disponible
   */
  rotateToNextProvider(reason = "Manual rotation") {
    const currentProvider = this.getCurrentProvider();
    console.log(`\n🔄 Rotando proveedor...`);
    console.log(`   ❌ Proveedor actual: ${currentProvider.name} (${reason})`);

    // Marcar el proveedor actual como temporalmente inactivo
    currentProvider.active = false;
    currentProvider.lastError = new Date();
    currentProvider.errorCount++;

    // Si un proveedor falla 3 veces, lo desactivamos por más tiempo
    if (currentProvider.errorCount >= 3) {
      console.warn(
        `   ⚠️ Proveedor ${currentProvider.name} desactivado por múltiples errores`
      );
    }

    this.currentProviderIndex =
      (this.currentProviderIndex + 1) % this.providers.length;
    const nextProvider = this.getCurrentProvider();

    console.log(`   ✅ Nuevo proveedor: ${nextProvider.name}`);
    return nextProvider;
  }

  /**
   * Detecta si un error es por límite de API agotado
   */
  isQuotaError(error) {
    const errorMessage = error.message?.toLowerCase() || "";
    const errorString = error.toString().toLowerCase();

    // Patrones comunes de errores de quota
    const quotaPatterns = [
      "quota",
      "rate limit",
      "too many requests",
      "429",
      "resource exhausted",
      "limit exceeded",
      "quota exceeded",
      "billing",
      "insufficient quota",
    ];

    return quotaPatterns.some(
      (pattern) =>
        errorMessage.includes(pattern) || errorString.includes(pattern)
    );
  }

  /**
   * Llama a la IA con rotación automática en caso de error
   */
  async callWithRotation(prompt, systemPrompt = "", maxRetries = 3) {
    let lastError = null;
    let attempts = 0;

    while (attempts < maxRetries) {
      const provider = this.getCurrentProvider();
      attempts++;

      try {
        console.log(
          `\n🤖 Llamando a ${provider.name} (Intento ${attempts}/${maxRetries})`
        );

        let result;
        switch (provider.type) {
          case "gemini":
            result = await this.callGemini(provider, prompt, systemPrompt);
            break;
          case "openai":
            result = await this.callOpenAI(provider, prompt, systemPrompt);
            break;
          case "claude":
            result = await this.callClaude(provider, prompt, systemPrompt);
            break;
          case "grok":
            result = await this.callGrok(provider, prompt, systemPrompt);
            break;
          default:
            throw new Error(`Tipo de proveedor no soportado: ${provider.type}`);
        }

        // Éxito: resetear contador de errores
        provider.errorCount = 0;
        console.log(`✅ Respuesta exitosa de ${provider.name}`);

        return {
          success: true,
          response: result,
          provider: provider.name,
          providerId: provider.id,
        };
      } catch (error) {
        lastError = error;
        console.error(`❌ Error en ${provider.name}:`, error.message);

        // Si es error de quota, rotar inmediatamente
        if (this.isQuotaError(error)) {
          console.warn(
            `⚠️ Límite de API agotado en ${provider.name}. Rotando...`
          );
          this.rotateToNextProvider(`Quota agotada: ${error.message}`);
        } else {
          // Si es otro tipo de error, rotar después de 2 intentos
          if (attempts >= 2) {
            this.rotateToNextProvider(`Error: ${error.message}`);
          }
        }
      }
    }

    // Si llegamos aquí, todos los intentos fallaron
    throw new Error(
      `Todos los proveedores fallaron después de ${maxRetries} intentos. Último error: ${lastError.message}`
    );
  }

  /**
   * Llama a Google Gemini
   */
  async callGemini(provider, prompt, systemPrompt) {
    const genAI = new GoogleGenerativeAI(provider.apiKey);
    const model = genAI.getGenerativeModel({ model: provider.model });

    const fullPrompt = systemPrompt
      ? `${systemPrompt}\n\n${prompt}`
      : prompt;

    const result = await Promise.race([
      model.generateContent(fullPrompt),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout de Gemini API")), 30000)
      ),
    ]);

    const response = await result.response;
    return response.text();
  }

  /**
   * Llama a OpenAI
   */
  async callOpenAI(provider, prompt, systemPrompt) {
    const openai = new OpenAI({ apiKey: provider.apiKey });

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const completion = await openai.chat.completions.create({
      model: provider.model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    return completion.choices[0].message.content;
  }

  /**
   * Llama a Claude (Anthropic)
   */
  async callClaude(provider, prompt, systemPrompt) {
    // Nota: Requiere instalar @anthropic-ai/sdk
    // npm install @anthropic-ai/sdk
    try {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const anthropic = new Anthropic({ apiKey: provider.apiKey });

      const message = await anthropic.messages.create({
        model: provider.model,
        max_tokens: 2000,
        system: systemPrompt || undefined,
        messages: [{ role: "user", content: prompt }],
      });

      return message.content[0].text;
    } catch (importError) {
      console.warn(
        "⚠️ Claude SDK no instalado. Instala con: npm install @anthropic-ai/sdk"
      );
      throw new Error(
        "Claude SDK no disponible. El proveedor será omitido en rotación."
      );
    }
  }

  /**
   * Llama a Grok (xAI)
   */
  async callGrok(provider, prompt, systemPrompt) {
    const axios = (await import("axios")).default;
    
    const messages = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const response = await Promise.race([
      axios.post(
        "https://api.x.ai/v1/chat/completions",
        {
          model: provider.model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 2000,
        },
        {
          headers: {
            Authorization: `Bearer ${provider.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      ),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout de Grok API")), 30000)
      ),
    ]);

    return response.data.choices[0].message.content;
  }

  /**
   * Obtiene estadísticas de los proveedores
   */
  getStats() {
    this.ensureInitialized();
    
    return {
      totalProviders: this.providers.length,
      activeProviders: this.providers.filter((p) => p.active).length,
      currentProvider: this.getCurrentProvider().name,
      providers: this.providers.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        active: p.active,
        errorCount: p.errorCount,
        lastError: p.lastError,
      })),
    };
  }
}

// Instancia singleton
let providerManager = null;

export function getProviderManager() {
  if (!providerManager) {
    providerManager = new AIProviderManager();
  }
  return providerManager;
}

export default AIProviderManager;

