import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function checkModels() {
  console.log("🔍 Verificando modelos Gemini 2.x...\n");

  const modelsToTest = [
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-2.5-pro",
  ];

  for (const modelName of modelsToTest) {
    try {
      console.log(`🧪 Probando: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await model.generateContent("Di solo 'OK'");
      const text = result.response.text();

      console.log(`✅ ${modelName} funciona:`, text.trim());
      console.log(`💡 Puedes usar este modelo en llmService.js\n`);
    } catch (err) {
      console.error(`❌ ${modelName} falló:`, err.message, "\n");
    }
  }
}

checkModels();
