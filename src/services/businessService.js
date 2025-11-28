import axios from "axios";
import dotenv from "dotenv";
import { LARAVEL_API_URL, AI_SERVICE_TOKEN } from "../config/env.js";


dotenv.config();

export async function executeAction(funcCall, userId, mode = "suggest") {
    const { name, arguments: args } = funcCall;

    console.log(`⚙️ Ejecutando acción: ${name} con args:`, args);

    if (name === "update_product_price") {
        const { product_id, new_price } = args;

        // Validación simple
        if (new_price <= 0) {
            throw new Error("El nuevo precio debe ser mayor que 0");
        }

        // Modo "execute" → llama a Laravel
        if (mode === "execute") {
            const url = `${LARAVEL_API_URL}products/${product_id}/update-price`;
            console.log("📡 Llamando a Laravel en:", url);

            try {
                const resp = await axios.post(
                    url,
                    { new_price },
                    {
                        headers: {
                            "Content-Type": "application/json"
                        }
                    }
                );

                return {
                    executed: true,
                    result: resp.data
                };
            } catch (error) {
                console.error("❌ Error al llamar a Laravel:", error.response?.data || error.message);
                throw new Error(`Error al ejecutar acción en Laravel: ${error.message}`);
            }
        }

        // Modo "suggest" → solo devuelve la sugerencia
        return {
            executed: false,
            suggestion: { product_id, new_price }
        };
    } else if (name === "sales_report_for_date") {
        const { date } = args;

        // Validación simple
        if (!date) {
            throw new Error("Debes indicar una fecha");
        }

        // Modo "execute" → llama a Laravel
        if (mode === "execute") {
            const url = `${LARAVEL_API_URL}ventas/search-by-date`;
            console.log("📡 Llamando a Laravel en:", url);

            try {

                const config = {
                    params: { date },
                    headers: {
                        "Content-Type": "application/json",
                        "X-Tenant-Slug": "restaurante1"
                    }
                };

                console.log("📡 URL final:", url);
                console.log("📦 Params:", { date });
                const resp = await axios.get(url, config);

                console.log("✅ Respuesta Laravel:", resp.data);

                return {
                    executed: true,
                    result: resp.data
                };
            } catch (error) {
                console.error("❌ Error al llamar a Laravel:", error.response?.data || error.message);
                throw new Error(`Error al ejecutar acción en Laravel: ${error.message}`);
            }
        }

        // Modo "suggest" → solo devuelve la sugerencia
        return {
            executed: false,
            suggestion: { date }
        };
    }

    throw new Error(`Función no soportada: ${name}`);
}
