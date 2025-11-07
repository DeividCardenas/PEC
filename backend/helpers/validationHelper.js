/**
 * Utilidades para validación de datos
 * Funciones reutilizables para validar entradas comunes
 */

/**
 * Valida que un ID sea un número entero positivo
 * @param {*} id - ID a validar
 * @returns {boolean} true si es válido
 */
const isValidId = (id) => {
  const numId = Number(id);
  return Number.isInteger(numId) && numId > 0;
};

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {boolean} true si es válido
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida longitud de string
 * @param {string} str - String a validar
 * @param {number} min - Longitud mínima
 * @param {number} max - Longitud máxima
 * @returns {boolean} true si es válido
 */
const isValidLength = (str, min, max) => {
  if (typeof str !== 'string') return false;
  const length = str.trim().length;
  return length >= min && length <= max;
};

/**
 * Sanitiza un string eliminando caracteres peligrosos
 * @param {string} str - String a sanitizar
 * @returns {string} String sanitizado
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
};

/**
 * Valida que un objeto tenga todas las propiedades requeridas
 * @param {Object} obj - Objeto a validar
 * @param {Array} requiredFields - Array de nombres de campos requeridos
 * @returns {Object} { valid: boolean, missing: Array }
 */
const validateRequiredFields = (obj, requiredFields) => {
  const missing = requiredFields.filter(field =>
    obj[field] === undefined || obj[field] === null || obj[field] === ''
  );

  return {
    valid: missing.length === 0,
    missing
  };
};

/**
 * Valida formato de número decimal
 * @param {*} value - Valor a validar
 * @param {number} min - Valor mínimo (opcional)
 * @param {number} max - Valor máximo (opcional)
 * @returns {boolean} true si es válido
 */
const isValidDecimal = (value, min = null, max = null) => {
  const num = parseFloat(value);
  if (isNaN(num)) return false;

  if (min !== null && num < min) return false;
  if (max !== null && num > max) return false;

  return true;
};

/**
 * Valida array de IDs
 * @param {Array} arr - Array a validar
 * @returns {boolean} true si todos los elementos son IDs válidos
 */
const isValidIdArray = (arr) => {
  if (!Array.isArray(arr)) return false;
  return arr.every(id => isValidId(id));
};

module.exports = {
  isValidId,
  isValidEmail,
  isValidLength,
  sanitizeString,
  validateRequiredFields,
  isValidDecimal,
  isValidIdArray
};
