import dotenv from "dotenv";

dotenv.config();

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const OPENAI_MODEL = process.env.OPENAI_MODEL;
export const LARAVEL_API_URL = process.env.LARAVEL_API_URL;
export const AI_SERVICE_TOKEN = process.env.AI_SERVICE_TOKEN;
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
export const PORT = process.env.PORT || 8001;
