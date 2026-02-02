import { formatUserFriendlyError } from "../utils/errorHandler.js";

/**
 * Middleware de autenticación
 * Valida que existe un token JWT en el header Authorization
 * No valida el token aquí, solo verifica que esté presente
 * Laravel validará el token cuando se haga la petición
 */

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  // Validar que existe el header Authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("❌ Token faltante o formato incorrecto");
    
    const friendlyError = formatUserFriendlyError(new Error("Token 401 unauthorized missing"));
    
    return res.status(401).json({
      success: false,
      error: friendlyError.message,
      errorTitle: friendlyError.title,
      errorSuggestion: friendlyError.suggestion,
      technicalError: "Token JWT requerido",
      hint: "Incluye el header: Authorization: Bearer <tu_jwt_token_de_laravel>",
    });
  }

  // Extraer el token
  const token = authHeader.split(" ")[1];

  // Validar que el token tiene formato JWT (tiene 3 partes separadas por puntos)
  if (!token || token.split(".").length !== 3) {
    console.error("❌ Formato de token inválido (debe ser JWT)");
    
    // Forzamos el mensaje "Token" para que el formateador lo detecte como Auth
    const friendlyError = formatUserFriendlyError(new Error("Token JWT inválido (formato incorrecto)"));

    return res.status(401).json({
      success: false,
      error: friendlyError.message,
      errorTitle: friendlyError.title,
      errorSuggestion: friendlyError.suggestion,
      technicalError: "Token formato incorrecto",
    });
  }

  // Guardar el token en la request para usarlo después
  req.userToken = token;

  console.log("✅ Token JWT presente");

  // Marcar la request como autenticada
  req.authenticated = true;

  // Continuar con el siguiente middleware
  next();
}
