import dotenv from "dotenv";

// Configurar dotenv para SOBRESCRIBIR variables de entorno existentes
dotenv.config({ override: true });

// Configuración del microservicio
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
export const LARAVEL_API_URL = process.env.LARAVEL_API_URL;
export const PORT = process.env.PORT || 8001;
export const NODE_ENV = process.env.NODE_ENV || "development";

// ==========================================
// VALIDACIÓN DE PROVEEDORES DE IA
// ==========================================

/**
 * Cuenta cuántas claves están configuradas para cada proveedor
 */
function countProviderKeys(baseKey) {
  let count = 0;
  
  // Verificar clave base
  if (process.env[baseKey]) {
    count++;
  }
  
  // Verificar claves numeradas
  let index = 1;
  while (process.env[`${baseKey}_${index}`]) {
    count++;
    index++;
  }
  
  return count;
}

// Contar proveedores disponibles
const geminiKeys = countProviderKeys('GEMINI_API_KEY');
const openaiKeys = countProviderKeys('OPENAI_API_KEY');
const claudeKeys = countProviderKeys('CLAUDE_API_KEY');
const grokKeys = countProviderKeys('GROK_API_KEY');
const totalProviders = geminiKeys + openaiKeys + claudeKeys + grokKeys;

// Validar que haya al menos un proveedor
if (totalProviders === 0) {
  console.error("\n❌ ERROR: No hay ninguna API key configurada");
  console.error("\n💡 Configura al menos una de estas claves en .env:");
  console.error("   - GEMINI_API_KEY (Recomendado)");
  console.error("   - OPENAI_API_KEY");
  console.error("   - CLAUDE_API_KEY");
  console.error("   - GROK_API_KEY");
  console.error("\n📖 Ver: CONFIGURACION_PROVEEDORES_IA.md");
  process.exit(1);
}

// Mostrar información de proveedores configurados
console.log("\n✅ Configuración cargada correctamente");
console.log("\n🤖 Proveedores de IA configurados:");
if (geminiKeys > 0) {
  console.log(`   ✅ Google Gemini: ${geminiKeys} clave(s)`);
}
if (openaiKeys > 0) {
  console.log(`   ✅ OpenAI: ${openaiKeys} clave(s)`);
}
if (claudeKeys > 0) {
  console.log(`   ✅ Claude: ${claudeKeys} clave(s)`);
}
if (grokKeys > 0) {
  console.log(`   ✅ Grok: ${grokKeys} clave(s)`);
}
console.log(`   📊 Total de proveedores: ${totalProviders}`);

if (totalProviders === 1) {
  console.log("\n💡 Tienes 1 proveedor configurado. El sistema funciona normalmente.");
  console.log("   Para activar rotación automática, agrega más claves en .env");
  console.log("   Ver: CONFIGURACION_PROVEEDORES_IA.md");
} else {
  console.log("\n🔄 Sistema de rotación automática ACTIVADO");
  console.log("   El sistema rotará entre proveedores cuando uno se agote");
}
