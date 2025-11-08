/**
 * Validaciones Comunes con express-validator
 *
 * Este archivo contiene validaciones reutilizables para diferentes endpoints
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware para manejar errores de validación
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

/**
 * Validaciones comunes de ID
 */
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID debe ser un número entero positivo'),
  handleValidationErrors
];

/**
 * Validaciones de paginación
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe estar entre 1 y 100'),
  handleValidationErrors
];

/**
 * Validaciones para coordenadas GPS
 */
const validateCoordinates = [
  body('latitud')
    .isFloat({ min: -90, max: 90 })
    .withMessage('La latitud debe estar entre -90 y 90'),
  body('longitud')
    .isFloat({ min: -180, max: 180 })
    .withMessage('La longitud debe estar entre -180 y 180'),
  handleValidationErrors
];

/**
 * Validaciones de fechas
 */
const validateDate = (fieldName) => [
  body(fieldName)
    .optional()
    .isISO8601()
    .withMessage(`${fieldName} debe ser una fecha válida en formato ISO8601`),
  handleValidationErrors
];

/**
 * Validaciones de email
 */
const validateEmail = (fieldName = 'email') => [
  body(fieldName)
    .trim()
    .isEmail()
    .withMessage('Debe proporcionar un email válido')
    .normalizeEmail(),
  handleValidationErrors
];

/**
 * Validaciones de teléfono (Colombia)
 */
const validatePhone = (fieldName = 'telefono') => [
  body(fieldName)
    .trim()
    .matches(/^[0-9]{7,10}$/)
    .withMessage('El teléfono debe tener entre 7 y 10 dígitos'),
  handleValidationErrors
];

/**
 * Validaciones de texto requerido
 */
const validateRequiredText = (fieldName, minLength = 1, maxLength = 255) => [
  body(fieldName)
    .trim()
    .notEmpty()
    .withMessage(`${fieldName} es requerido`)
    .isLength({ min: minLength, max: maxLength })
    .withMessage(`${fieldName} debe tener entre ${minLength} y ${maxLength} caracteres`),
  handleValidationErrors
];

/**
 * Validaciones de cantidad/stock
 */
const validateQuantity = (fieldName = 'cantidad') => [
  body(fieldName)
    .isInt({ min: 1 })
    .withMessage(`${fieldName} debe ser un número entero positivo`),
  handleValidationErrors
];

/**
 * Validaciones de precio/monto
 */
const validatePrice = (fieldName = 'precio') => [
  body(fieldName)
    .isFloat({ min: 0 })
    .withMessage(`${fieldName} debe ser un número positivo`),
  handleValidationErrors
];

/**
 * Validaciones de archivo (tamaño y tipo)
 */
const validateFile = (fieldName, allowedTypes = ['image/jpeg', 'image/png'], maxSize = 5 * 1024 * 1024) => {
  return (req, res, next) => {
    if (!req.files || !req.files[fieldName]) {
      return next(); // Archivo opcional
    }

    const file = Array.isArray(req.files[fieldName])
      ? req.files[fieldName][0]
      : req.files[fieldName];

    // Validar tipo
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: `Tipo de archivo no permitido para ${fieldName}. Tipos permitidos: ${allowedTypes.join(', ')}`
      });
    }

    // Validar tamaño
    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `El archivo ${fieldName} excede el tamaño máximo permitido de ${maxSize / (1024 * 1024)}MB`
      });
    }

    next();
  };
};

/**
 * Validaciones para crear entrega
 */
const validateCreateDelivery = [
  body('id_paciente')
    .isInt({ min: 1 })
    .withMessage('El ID del paciente debe ser un número entero positivo'),
  body('direccion_entrega')
    .trim()
    .notEmpty()
    .withMessage('La dirección de entrega es requerida')
    .isLength({ max: 255 })
    .withMessage('La dirección no debe exceder 255 caracteres'),
  body('ciudad_entrega')
    .trim()
    .notEmpty()
    .withMessage('La ciudad es requerida')
    .isLength({ max: 100 })
    .withMessage('La ciudad no debe exceder 100 caracteres'),
  body('departamento_entrega')
    .trim()
    .notEmpty()
    .withMessage('El departamento es requerido')
    .isLength({ max: 100 })
    .withMessage('El departamento no debe exceder 100 caracteres'),
  body('productos')
    .isArray({ min: 1 })
    .withMessage('Debe incluir al menos un producto'),
  body('productos.*.id_producto')
    .isInt({ min: 1 })
    .withMessage('ID de producto inválido'),
  body('productos.*.cantidad')
    .isInt({ min: 1 })
    .withMessage('La cantidad debe ser un número positivo'),
  body('productos.*.precio_unitario')
    .isFloat({ min: 0 })
    .withMessage('El precio unitario debe ser un número positivo'),
  handleValidationErrors
];

/**
 * Validaciones para prueba de entrega
 */
const validateDeliveryProof = [
  body('nombre_receptor')
    .trim()
    .notEmpty()
    .withMessage('El nombre del receptor es requerido')
    .isLength({ max: 200 })
    .withMessage('El nombre no debe exceder 200 caracteres'),
  body('identificacion_receptor')
    .trim()
    .notEmpty()
    .withMessage('La identificación del receptor es requerida')
    .isLength({ max: 50 })
    .withMessage('La identificación no debe exceder 50 caracteres'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateId,
  validatePagination,
  validateCoordinates,
  validateDate,
  validateEmail,
  validatePhone,
  validateRequiredText,
  validateQuantity,
  validatePrice,
  validateFile,
  validateCreateDelivery,
  validateDeliveryProof
};
