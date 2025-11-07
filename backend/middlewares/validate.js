// Importa la librería crypto-js para manejar operaciones de cifrado y descifrado
const CryptoJS = require("crypto-js");

/**
 * Función para encriptar datos usando AES con una clave secreta.
 * @param {string} data - El texto plano que se desea encriptar.
 * @returns {string} - El texto encriptado en formato base64.
 * @throws {Error} - Si la clave secreta no está definida en las variables de entorno.
 */
const Encrypt = (data) => {
  if (!process.env.AUTH_AES_SECRET_KEY) {
    throw new Error("AUTH_AES_SECRET_KEY no está definida");
  }
  return CryptoJS.AES.encrypt(data, process.env.AUTH_AES_SECRET_KEY).toString();
};

/**
 * Función para desencriptar datos previamente cifrados con AES.
 * @param {string} data - El texto encriptado (formato base64).
 * @returns {string} - El texto desencriptado en texto plano.
 * @throws {Error} - Si la clave secreta no está definida en las variables de entorno.
 */
const Decrypt = (data) => {
  if (!process.env.AUTH_AES_SECRET_KEY) {
    throw new Error("AUTH_AES_SECRET_KEY no está definida");
  }
  const bytes = CryptoJS.AES.decrypt(data, process.env.AUTH_AES_SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

/**
 * Función de prueba para verificar el correcto funcionamiento de Encrypt y Decrypt.
 * Muestra el flujo completo: texto original → encriptado → desencriptado.
 *
 * NOTA: Esta función está comentada en producción por seguridad.
 * Para testear, ejecutar manualmente en entorno de desarrollo.
 * NUNCA imprimir la clave secreta en logs.
 */
const TestEncryption = () => {
  try {
    const testData = "texto de prueba";
    const encrypted = Encrypt(testData);
    const decrypted = Decrypt(encrypted);

    if (testData === decrypted) {
      // Solo en modo desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log("✓ Encriptado y desencriptado funcionando correctamente.");
      }
      return true;
    } else {
      console.error("✗ Error: el texto desencriptado no coincide con el original.");
      return false;
    }
  } catch (error) {
    console.error("✗ Error al verificar el funcionamiento:", error.message);
    return false;
  }
};

// COMENTADO: No ejecutar automáticamente en producción
// TestEncryption();

// Exporta las funciones de encriptación y desencriptación para uso externo
module.exports = {
  Encrypt,
  Decrypt,
};
