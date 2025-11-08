-- Script SQL para Sistema Completo de Roles y Permisos (RF006)
-- Este script crea un sistema robusto de autenticación basado en roles

-- ============================================================================
-- PASO 1: LIMPIAR DATOS EXISTENTES (opcional, comentado por seguridad)
-- ============================================================================
-- DELETE FROM PermisoOnRol;
-- DELETE FROM Permiso;
-- DELETE FROM Rol;

-- ============================================================================
-- PASO 2: CREAR ROLES DEL SISTEMA
-- ============================================================================

INSERT INTO Rol (nombre, fecha_creacion, fecha_actualizacion) VALUES
('Administrador', NOW(), NOW()),
('Comprador', NOW(), NOW()),
('Despachador', NOW(), NOW()),
('Contador', NOW(), NOW()),
('Auditor', NOW(), NOW()),
('Operador', NOW(), NOW())
ON DUPLICATE KEY UPDATE fecha_actualizacion = NOW();

-- ============================================================================
-- PASO 3: CREAR PERMISOS POR MÓDULO
-- ============================================================================

-- Módulo: Usuarios
INSERT INTO Permiso (nombre, fecha_creacion, fecha_actualizacion) VALUES
('ver_usuarios', NOW(), NOW()),
('crear_usuarios', NOW(), NOW()),
('editar_usuarios', NOW(), NOW()),
('eliminar_usuarios', NOW(), NOW()),

-- Módulo: Roles y Permisos
('ver_roles', NOW(), NOW()),
('crear_roles', NOW(), NOW()),
('editar_roles', NOW(), NOW()),
('eliminar_roles', NOW(), NOW()),
('ver_permisos', NOW(), NOW()),
('asignar_permisos', NOW(), NOW()),

-- Módulo: Productos
('ver_productos', NOW(), NOW()),
('crear_productos', NOW(), NOW()),
('editar_productos', NOW(), NOW()),
('eliminar_productos', NOW(), NOW()),

-- Módulo: Proveedores
('ver_proveedores', NOW(), NOW()),
('crear_proveedores', NOW(), NOW()),
('editar_proveedores', NOW(), NOW()),
('eliminar_proveedores', NOW(), NOW()),

-- Módulo: Laboratorios
('ver_laboratorios', NOW(), NOW()),
('crear_laboratorios', NOW(), NOW()),
('editar_laboratorios', NOW(), NOW()),
('eliminar_laboratorios', NOW(), NOW()),

-- Módulo: Órdenes de Compra
('ver_ordenes', NOW(), NOW()),
('crear_ordenes', NOW(), NOW()),
('editar_ordenes', NOW(), NOW()),
('eliminar_ordenes', NOW(), NOW()),
('aprobar_ordenes', NOW(), NOW()),
('rechazar_ordenes', NOW(), NOW()),
('completar_ordenes', NOW(), NOW()),
('marcar_orden_en_proceso', NOW(), NOW()),
('ver_historial_ordenes', NOW(), NOW()),

-- Módulo: Inventario
('ver_inventario', NOW(), NOW()),
('ajustar_inventario', NOW(), NOW()),
('ver_movimientos_inventario', NOW(), NOW()),
('actualizar_stock_minimo', NOW(), NOW()),

-- Módulo: Reportes
('ver_reportes_compras', NOW(), NOW()),
('exportar_reportes', NOW(), NOW()),
('ver_resumen_ejecutivo', NOW(), NOW()),

-- Módulo: Pacientes (RF007)
('ver_pacientes', NOW(), NOW()),
('crear_pacientes', NOW(), NOW()),
('editar_pacientes', NOW(), NOW()),
('eliminar_pacientes', NOW(), NOW()),

-- Módulo: Tarifarios (ya existentes, pero los agregamos por completitud)
('ver_tarifarios', NOW(), NOW()),
('crear_tarifarios', NOW(), NOW()),
('editar_tarifarios', NOW(), NOW()),
('eliminar_tarifarios', NOW(), NOW()),

-- Módulo: EPS
('ver_eps', NOW(), NOW()),
('crear_eps', NOW(), NOW()),
('editar_eps', NOW(), NOW()),
('eliminar_eps', NOW(), NOW())
ON DUPLICATE KEY UPDATE fecha_actualizacion = NOW();

-- ============================================================================
-- PASO 4: ASIGNAR PERMISOS A ROLES
-- ============================================================================

-- ROL: ADMINISTRADOR (acceso completo a todo)
INSERT INTO PermisoOnRol (rol_id, permiso_id, fecha_creacion, fecha_actualizacion)
SELECT
    (SELECT id_rol FROM Rol WHERE nombre = 'Administrador'),
    id_permiso,
    NOW(),
    NOW()
FROM Permiso
ON DUPLICATE KEY UPDATE fecha_actualizacion = NOW();

-- ROL: COMPRADOR (gestión de compras, inventario, proveedores)
INSERT INTO PermisoOnRol (rol_id, permiso_id, fecha_creacion, fecha_actualizacion)
SELECT
    (SELECT id_rol FROM Rol WHERE nombre = 'Comprador'),
    id_permiso,
    NOW(),
    NOW()
FROM Permiso
WHERE nombre IN (
    -- Proveedores
    'ver_proveedores', 'crear_proveedores', 'editar_proveedores',
    -- Productos
    'ver_productos',
    -- Laboratorios
    'ver_laboratorios',
    -- Órdenes de Compra
    'ver_ordenes', 'crear_ordenes', 'editar_ordenes', 'eliminar_ordenes',
    'marcar_orden_en_proceso', 'ver_historial_ordenes',
    -- Inventario
    'ver_inventario', 'ver_movimientos_inventario', 'actualizar_stock_minimo',
    -- Reportes
    'ver_reportes_compras', 'exportar_reportes'
)
ON DUPLICATE KEY UPDATE fecha_actualizacion = NOW();

-- ROL: DESPACHADOR (gestión de inventario y completar órdenes)
INSERT INTO PermisoOnRol (rol_id, permiso_id, fecha_creacion, fecha_actualizacion)
SELECT
    (SELECT id_rol FROM Rol WHERE nombre = 'Despachador'),
    id_permiso,
    NOW(),
    NOW()
FROM Permiso
WHERE nombre IN (
    -- Productos (solo ver)
    'ver_productos',
    -- Proveedores (solo ver)
    'ver_proveedores',
    -- Laboratorios (solo ver)
    'ver_laboratorios',
    -- Órdenes de Compra
    'ver_ordenes', 'completar_ordenes', 'marcar_orden_en_proceso', 'ver_historial_ordenes',
    -- Inventario
    'ver_inventario', 'ajustar_inventario', 'ver_movimientos_inventario',
    -- Pacientes (para gestionar entregas)
    'ver_pacientes', 'crear_pacientes', 'editar_pacientes'
)
ON DUPLICATE KEY UPDATE fecha_actualizacion = NOW();

-- ROL: CONTADOR (aprobación de órdenes, reportes, solo lectura de inventario)
INSERT INTO PermisoOnRol (rol_id, permiso_id, fecha_creacion, fecha_actualizacion)
SELECT
    (SELECT id_rol FROM Rol WHERE nombre = 'Contador'),
    id_permiso,
    NOW(),
    NOW()
FROM Permiso
WHERE nombre IN (
    -- Productos (solo ver)
    'ver_productos',
    -- Proveedores (solo ver)
    'ver_proveedores',
    -- Laboratorios (solo ver)
    'ver_laboratorios',
    -- Órdenes de Compra
    'ver_ordenes', 'aprobar_ordenes', 'rechazar_ordenes', 'ver_historial_ordenes',
    -- Inventario (solo ver)
    'ver_inventario', 'ver_movimientos_inventario',
    -- Reportes
    'ver_reportes_compras', 'exportar_reportes', 'ver_resumen_ejecutivo'
)
ON DUPLICATE KEY UPDATE fecha_actualizacion = NOW();

-- ROL: AUDITOR (solo lectura de todo)
INSERT INTO PermisoOnRol (rol_id, permiso_id, fecha_creacion, fecha_actualizacion)
SELECT
    (SELECT id_rol FROM Rol WHERE nombre = 'Auditor'),
    id_permiso,
    NOW(),
    NOW()
FROM Permiso
WHERE nombre LIKE 'ver_%'
ON DUPLICATE KEY UPDATE fecha_actualizacion = NOW();

-- ROL: OPERADOR (acceso básico limitado)
INSERT INTO PermisoOnRol (rol_id, permiso_id, fecha_creacion, fecha_actualizacion)
SELECT
    (SELECT id_rol FROM Rol WHERE nombre = 'Operador'),
    id_permiso,
    NOW(),
    NOW()
FROM Permiso
WHERE nombre IN (
    'ver_productos',
    'ver_proveedores',
    'ver_ordenes',
    'ver_inventario'
)
ON DUPLICATE KEY UPDATE fecha_actualizacion = NOW();

-- ============================================================================
-- PASO 5: VERIFICACIÓN
-- ============================================================================

-- Ver roles creados
SELECT 'ROLES CREADOS:' as info;
SELECT id_rol, nombre FROM Rol ORDER BY id_rol;

-- Ver permisos creados
SELECT 'PERMISOS CREADOS:' as info;
SELECT COUNT(*) as total_permisos FROM Permiso;

-- Ver asignaciones por rol
SELECT 'PERMISOS POR ROL:' as info;
SELECT
    r.nombre as rol,
    COUNT(pr.id_permiso) as cantidad_permisos
FROM Rol r
LEFT JOIN PermisoOnRol pr ON r.id_rol = pr.rol_id
GROUP BY r.id_rol, r.nombre
ORDER BY r.nombre;

-- Ver detalle de permisos por rol
SELECT 'DETALLE DE PERMISOS:' as info;
SELECT
    r.nombre as rol,
    p.nombre as permiso
FROM Rol r
JOIN PermisoOnRol pr ON r.id_rol = pr.rol_id
JOIN Permiso p ON pr.id_permiso = p.id_permiso
ORDER BY r.nombre, p.nombre;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
--
-- MATRIZ DE ROLES Y RESPONSABILIDADES:
--
-- ADMINISTRADOR:
--   - Acceso completo al sistema
--   - Gestión de usuarios, roles y permisos
--   - Todas las operaciones CRUD en todos los módulos
--
-- COMPRADOR:
--   - Crear y gestionar órdenes de compra
--   - Gestionar proveedores
--   - Ver inventario y productos
--   - Generar reportes de compras
--   - NO puede aprobar órdenes (separación de responsabilidades)
--
-- DESPACHADOR:
--   - Completar órdenes de compra recibidas
--   - Ajustar inventario físico
--   - Gestionar movimientos de inventario
--   - Solo lectura de productos y proveedores
--
-- CONTADOR:
--   - Aprobar o rechazar órdenes de compra
--   - Ver reportes financieros y estadísticas
--   - Solo lectura de inventario
--   - NO puede crear órdenes (separación de responsabilidades)
--
-- AUDITOR:
--   - Solo lectura de todo el sistema
--   - Acceso a todos los reportes
--   - No puede modificar nada
--
-- OPERADOR:
--   - Acceso básico de solo lectura
--   - Ver productos, proveedores, órdenes e inventario
--   - Rol para usuarios con mínimos privilegios
--
-- ============================================================================
