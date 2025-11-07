/** 
 * Controlador de Producto
 * Este controlador maneja la lógica de negocio para la gestión de productos en la aplicación, 
 * incluyendo operaciones de creación, lectura, actualización y eliminación (CRUD) 
 * junto con la paginación y validación de los datos
 */

const { response, request } = require("express");
const { PrismaClient } = require("@prisma/client");
const { body, param, validationResult } = require("express-validator");

const prisma = new PrismaClient();

/**
 * Middleware para validar los errores de las solicitudes.
 * Si hay errores de validación, devuelve un mensaje de error con el código 400.
 * Si no hay errores, continúa con la siguiente función en la cadena.
 */
const validarErrores = (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errores: errores.array() });
    }
    next();
};

/**
 * Validación para la creación de un nuevo producto.
 * Asegura que los campos necesarios estén presentes y sean válidos.
 * RF003: Incluye validación de campos de inventario.
 */
const validarProducto = [
    body("cum").notEmpty().withMessage("El CUM es obligatorio"),
    body("descripcion").notEmpty().withMessage("La descripción es obligatoria"),
    body("concentracion").notEmpty().withMessage("La concentración es obligatoria"),
    body("presentacion").notEmpty().withMessage("La presentación es obligatoria"),
    body("registro_sanitario").notEmpty().withMessage("El registro sanitario es obligatorio"),
    body("id_laboratorio").isInt().withMessage("El ID del laboratorio debe ser un número entero"),
    body("precio_unidad").isFloat({ min: 0 }).withMessage("El precio por unidad debe ser un número positivo"),
    body("precio_presentacion").isFloat({ min: 0 }).withMessage("El precio por presentación debe ser un número positivo"),
    body("iva").isFloat({ min: 0 }).withMessage("El IVA debe ser un número positivo"),
    body("regulacion").optional().isString().withMessage("La regulación debe ser una cadena de texto"),
    body("codigo_barras").notEmpty().withMessage("El código de barras es obligatorio"),
    body("stock_actual").optional().isInt({ min: 0 }).withMessage("El stock actual debe ser un número entero positivo"),
    body("stock_minimo").optional().isInt({ min: 0 }).withMessage("El stock mínimo debe ser un número entero positivo"),
    body("stock_maximo").optional().isInt({ min: 0 }).withMessage("El stock máximo debe ser un número entero positivo"),
    body("unidad_medida").optional().isString().withMessage("La unidad de medida debe ser una cadena de texto"),
    validarErrores
];

/**
 * Validación para la edición de un producto.
 * Los campos son opcionales, pero si se proporcionan, deben ser válidos.
 * RF003: Incluye validación de campos de inventario.
 */
const validarEdicionProducto = [
    param("id_producto").isInt().withMessage("El ID del producto debe ser un número entero"),
    body("cum").optional().notEmpty().withMessage("El CUM no puede estar vacío"),
    body("descripcion").optional().notEmpty().withMessage("La descripción no puede estar vacía"),
    body("concentracion").optional().notEmpty().withMessage("La concentración no puede estar vacía"),
    body("presentacion").optional().notEmpty().withMessage("La presentación no puede estar vacía"),
    body("registro_sanitario").optional().notEmpty().withMessage("El registro sanitario no puede estar vacío"),
    body("id_laboratorio").optional().isInt().withMessage("El ID del laboratorio debe ser un número entero"),
    body("precio_unidad").optional().isFloat({ min: 0 }).withMessage("El precio por unidad debe ser un número positivo"),
    body("precio_presentacion").optional().isFloat({ min: 0 }).withMessage("El precio por presentación debe ser un número positivo"),
    body("iva").optional().isFloat({ min: 0 }).withMessage("El IVA debe ser un número positivo"),
    body("regulacion").optional().isString().withMessage("La regulación debe ser una cadena de texto"),
    body("codigo_barras").optional().notEmpty().withMessage("El código de barras no puede estar vacío"),
    body("stock_actual").optional().isInt({ min: 0 }).withMessage("El stock actual debe ser un número entero positivo"),
    body("stock_minimo").optional().isInt({ min: 0 }).withMessage("El stock mínimo debe ser un número entero positivo"),
    body("stock_maximo").optional().isInt({ min: 0 }).withMessage("El stock máximo debe ser un número entero positivo"),
    body("unidad_medida").optional().isString().withMessage("La unidad de medida debe ser una cadena de texto"),
    validarErrores
];

/**
 * Controlador para mostrar los productos con paginación y filtros.
 * Permite filtrar por CUM, descripción, concentración, registro sanitario, presentación,
 * código de barras, laboratorio y regulación.
 * La respuesta incluye la cantidad total de productos y la cantidad de páginas.
 */
const MostrarProductos = [
    validarErrores,
    async (req = request, res = response) => {
        try {
            // Extracción de filtros y parámetros de la consulta
            const { 
                cum, descripcion, concentracion, registro_sanitario, presentacion, regulacion, 
                codigo_barras, id_laboratorio, con_regulacion, campos 
            } = req.query;

            // Configuración de paginación
            const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
            let limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
            const maxLimit = 50; // Limite máximo de registros por página
            limit = Math.min(limit, maxLimit);
            const skip = (page - 1) * limit;

            // Construcción de condiciones de filtrado
            const condiciones = {};
            if (cum) condiciones.cum = { contains: cum };
            if (descripcion) condiciones.descripcion = { contains: descripcion };
            if (concentracion) condiciones.concentracion = { contains: concentracion };
            if (registro_sanitario) condiciones.registro_sanitario = { contains: registro_sanitario };
            if (presentacion) condiciones.presentacion = { contains: presentacion };
            if (codigo_barras) condiciones.codigo_barras = { contains: codigo_barras };
            if (id_laboratorio) {
                const laboratorioId = parseInt(id_laboratorio, 10);
                if (!isNaN(laboratorioId)) {
                    condiciones.id_laboratorio = laboratorioId;
                }
            }
            if (con_regulacion === "regulados") {
                condiciones.regulacion = { not: null };
            } else if (con_regulacion === "no_regulados") {
                condiciones.regulacion = null;
            } else if (regulacion) {
                condiciones.regulacion = { contains: regulacion};
            }

            // Definir campos base obligatorios (incluye campos de inventario RF003)
            const selectFields = {
                id_producto: true, cum: true, descripcion: true, concentracion: true,
                id_laboratorio: true, precio_unidad: true, precio_presentacion: true,
                iva: true, stock_actual: true, stock_minimo: true, stock_maximo: true,
                unidad_medida: true, createdAt: true, updatedAt: true,
                laboratorio: { select: { nombre: true } },
            };

            // Agregar campos opcionales si se especifican
            const extraFields = ["presentacion", "registro_sanitario", "regulacion", "codigo_barras"];
            if (campos) {
                campos.split(",").map(campo => campo.trim()).forEach(field => {
                    if (extraFields.includes(field)) selectFields[field] = true;
                });
            }

            // Consulta con paginación
            const [productos, totalProductos] = await Promise.all([
                prisma.producto.findMany({
                    where: condiciones,
                    select: selectFields,
                    take: limit,
                    skip,
                }),
                prisma.producto.count({ where: condiciones })
            ]);

            // Respuesta con los productos paginados
            res.json({ 
                totalProductos, 
                totalPaginas: Math.ceil(totalProductos / limit), 
                paginaActual: page, 
                tamanoPagina: limit, 
                productos 
            });
        } catch (error) {
            res.status(500).json({ mensaje: "Error al obtener los productos", error: error.message });
        }
    }
];

/**
 * Controlador para crear un nuevo producto.
 * Verifica si el laboratorio especificado existe antes de agregar el producto.
 */
const CrearProducto = async (req, res) => {
    try {
        const {
            cum, descripcion, concentracion, presentacion, registro_sanitario,
            id_laboratorio, precio_unidad, precio_presentacion, iva, regulacion, codigo_barras
        } = req.body;

        // Verificar si el laboratorio existe
        const laboratorioExiste = await prisma.laboratorio.findUnique({
            where: { id_laboratorio }
        });

        if (!laboratorioExiste) {
            return res.status(400).json({ mensaje: "El laboratorio especificado no existe" });
        }

        // Crear el producto
        const nuevoProducto = await prisma.producto.create({
            data: {
                cum,
                descripcion,
                concentracion,
                presentacion,
                registro_sanitario,
                id_laboratorio,
                precio_unidad,
                precio_presentacion,
                iva,
                regulacion,
                codigo_barras
            }
        });

        return res.status(201).json({
            mensaje: "Producto agregado con éxito",
            producto: nuevoProducto
        });

    } catch (error) {
        console.error("Error al crear producto:", error);
        return res.status(500).json({
            mensaje: "Error al agregar el producto",
            error: error.message
        });
    }
};

/**
 * Controlador para editar un producto.
 * Verifica que el producto exista antes de actualizarlo y que el laboratorio especificado sea válido.
 */
const EditarProducto = async (req, res) => {
    try {
        const { id_producto } = req.params;
        const datosActualizados = req.body;

        // Verificar si el producto existe
        const productoExistente = await prisma.producto.findUnique({
            where: { id_producto: parseInt(id_producto, 10) }
        });

        if (!productoExistente) {
            return res.status(404).json({ mensaje: "El producto especificado no existe" });
        }

        // Verificar si el laboratorio existe (si se proporciona un nuevo laboratorio)
        if (datosActualizados.id_laboratorio) {
            const laboratorioExiste = await prisma.laboratorio.findUnique({
                where: { id_laboratorio: datosActualizados.id_laboratorio }
            });
            if (!laboratorioExiste) {
                return res.status(400).json({ mensaje: "El laboratorio especificado no existe" });
            }
        }

        // Actualizar el producto
        const productoActualizado = await prisma.producto.update({
            where: { id_producto: parseInt(id_producto, 10) },
            data: datosActualizados
        });

        res.json({ mensaje: "Producto actualizado con éxito", producto: productoActualizado });
    } catch (error) {
        console.error("Error al actualizar producto:", error);
        res.status(500).json({ mensaje: "Error al actualizar el producto", error: error.message });
    }
};

/**
 * Controlador para eliminar un producto.
 * Verifica que el ID del producto sea válido y lo elimina de la base de datos.
 */
const EliminarProducto = [
    param("id_producto").isInt().withMessage("El ID del producto debe ser un número entero"),
    validarErrores,
    async (req = request, res = response) => {
        try {
            const { id_producto } = req.params;
            await prisma.producto.delete({ where: { id_producto: parseInt(id_producto, 10) } });
            res.json({ mensaje: "Producto eliminado con éxito" });
        } catch (error) {
            res.status(500).json({ mensaje: "Error al eliminar el producto", error: error.message });
        }
    }
];

module.exports = { 
    MostrarProductos, 
    CrearProducto, 
    EditarProducto, 
    EliminarProducto,
    validarProducto,
    validarEdicionProducto
};
