import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY, LARAVEL_API_URL } from "../config/env.js";
import axios from "axios";

import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Aquí puedes definir las “funciones” que la IA puede invocar
const functions = [
  {
    name: "update_product_price",
    description: "Actualiza el precio de un producto en el sistema",
    parameters: {
      type: "object",
      properties: {
        product_id: { type: "integer", description: "ID del producto" },
        new_price: { type: "number", description: "Nuevo precio" }
      },
      required: ["product_id", "new_price"]
    }
  },
  {
    name: "sales_report_for_date",
    description: "Enviar un informe de ventas del día",
    parameters: {
      type: "object",
      properties: {
        date: { type: "date", description: "Fecha del día" },
      },
      required: ["date"]
    }
  }
];

export async function interpretInstruction(userInput, context = {}) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    //Prompt más contextual e inteligente
    const prompt = `
      Eres un asistente de negocio que interpreta órdenes para una aplicación de gestión de restaurantes.
      El usuario puede expresarse de muchas formas, por ejemplo:
      - "Baja el precio del producto 3 a 4,50"
      - "Cámbiame la pizza margarita a 12€"
      - "Sube las bebidas un euro"
      - "Pon el menú del día a 9.99"
      - "Dame las ventas de hoy"
      - "Dame las ventas del 15 de marzo"

      Tu tarea:
      1. Detecta si el usuario quiere cambiar un precio de producto o quiere un resultado de sus ventas.
      2. Si se menciona explícitamente un ID, úsalo.
      3. Si se menciona el nombre del producto (por ejemplo, "pizza margarita"), identifica el texto del nombre y devuélvelo como "product_name".
      4. Si se menciona una fecha (por ejemplo, "15 de marzo"), identifica la fecha y devuélvela como "date".
      5. Devuelve **solo JSON**, sin explicaciones ni texto adicional.

      Formato JSON esperado:

      {
        "name": "update_product_price",
        "arguments": {
          "product_id": <opcional>,
          "product_name": <opcional>,
          "new_price": <número>
        }
      }

      o

      {
        "name": "sales_report_for_date",
        "arguments": {
          "date": "<YYYY-MM-DD>"
        }
      }

      Si no puedes determinar la intención o falta información:
      {
        "name": null,
        "content": "No entiendo qué producto o precio quieres cambiar"
      }

      Ahora interpreta la siguiente orden:
      "${userInput}"
      `;

    const result = await model.generateContent(prompt);

    const text = result.response.text();
    // limpia si viene entre comillas o con ```json ... ```
    const textTrim = text.replace(/```json|```/g, "").trim();
    console.log("🧠 Respuesta de Gemini:", textTrim);

    let data;
    try {
      data = JSON.parse(textTrim);
    } catch (e) {
      console.warn("⚠️ No se pudo parsear JSON:", text);
      return { name: null, content: text };
    }

    //Si devuelve nombre pero no ID → buscar en Laravel
    if (data?.name === "update_product_price" && !data.arguments.product_id && data.arguments.product_name) {
      try {
        const searchUrl = `${LARAVEL_API_URL}products/search?name=${encodeURIComponent(data.arguments.product_name)}`;
        const resp = await axios.get(searchUrl);
        if (resp.data && resp.data.id) {
          data.arguments.product_id = resp.data.id;
        } else {
          data.name = null;
          data.content = `No se encontró ningún producto llamado "${data.arguments.product_name}".`;
        }
      } catch (err) {
        data.name = null;
        data.content = `Error buscando el producto: ${err.message}`;
      }
    }

    return data;

  } catch (error) {
    console.error("❌ Error en interpretInstruction:", error);
    return { name: null, content: "Error al interpretar la instrucción." };
  }
}
