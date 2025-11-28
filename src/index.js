import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { interpretInstruction } from "./services/llmService.js";
import { executeAction } from "./services/businessService.js";
// import { interpretInstructionMock } from "./services/llmservice.mock.js"; // opcional si quieres usar el mock

dotenv.config();

const app = express();
app.use(bodyParser.json());

app.post("/v1/process", async (req, res) => {
  try {
    const { user_id, input_type, payload, mode = "suggest" } = req.body;

    let text;

    if (input_type === "voice") {
      // si en el futuro añades reconocimiento de voz (sttService)
      const { transcribe } = await import("./services/sttService.js");
      text = await transcribe(payload);
    } else {
      text = payload;
    }

    // Llamamos al servicio de IA (Gemini)
    const funcCall = await interpretInstruction(text);
    // const funcCall = await interpretInstructionMock(text);

    console.log("🛠️ Función interpretada:", funcCall);

    if (!funcCall?.name) {
      // el modelo no determinó función concreta → enviar aclaración
      return res.json({
        needsClarification: true,
        message: funcCall?.content || "No se entendió la instrucción."
      });
    }

    // Ejecutar la acción correspondiente en Laravel
    const actionResult = await executeAction(funcCall, user_id, mode);

    return res.json({
      executed: actionResult.executed,
      func: funcCall.name,
      params: funcCall.arguments,
      result: actionResult
    });

  } catch (err) {
    console.error("❌ Error en /v1/process:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 8001;
app.listen(PORT, () => {
  console.log(`🚀 AI MCP Service listening on port ${PORT}`);
});
