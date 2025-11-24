# 🏥 Manual de Usuario - Sistema Pharma Elite Care (PEC)

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Requisitos del Sistema](#requisitos-del-sistema)
3. [Instalación Paso a Paso](#instalación-paso-a-paso)
4. [Ejecución del Sistema](#ejecución-del-sistema)
5. [Primer Acceso](#primer-acceso)
6. [Módulos del Sistema](#módulos-del-sistema)
7. [Funcionalidades Principales](#funcionalidades-principales)
8. [Solución de Problemas](#solución-de-problemas)

---

## 🎯 Introducción

**Pharma Elite Care (PEC)** es un sistema integral de gestión farmacéutica diseñado para optimizar la administración de inventarios, entregas a pacientes, rutas de distribución y tarifarios comerciales.

### Características Principales
- ✅ Control de inventario con alertas automáticas
- ✅ Gestión completa de entregas a pacientes
- ✅ Optimización de rutas de distribución
- ✅ Administración de tarifarios por EPS/empresa
- ✅ Sistema de roles y permisos
- ✅ Reportes y estadísticas en tiempo real

---

## 💻 Requisitos del Sistema

### Software Necesario

| Software | Versión Mínima | Propósito |
|----------|----------------|-----------|
| **Node.js** | 18.0 o superior | Ejecutar backend y frontend |
| **npm** | 8.0 o superior | Gestor de paquetes (incluido con Node.js) |
| **MySQL** | 8.0 o superior | Base de datos |
| **Git** | Cualquiera | Clonar el repositorio |

### Requisitos de Hardware Recomendados
- **RAM**: 4 GB mínimo (8 GB recomendado)
- **Almacenamiento**: 2 GB de espacio libre
- **Procesador**: Dual-core o superior

### Navegadores Compatibles
- Google Chrome 90+
- Microsoft Edge 90+
- Firefox 88+
- Safari 14+

---

## 📥 Instalación Paso a Paso

### Paso 1: Verificar Node.js

Abra una terminal (CMD o PowerShell) y ejecute:

```cmd
node --version
npm --version
```

Debería ver las versiones instaladas. Si no tiene Node.js, descárguelo desde [nodejs.org](https://nodejs.org/)

### Paso 2: Clonar el Repositorio

```cmd
cd C:\Trabajos
git clone [URL_DEL_REPOSITORIO] COMPRAS
cd COMPRAS
```

### Paso 3: Configurar Base de Datos

1. **Crear la base de datos en MySQL**:
   ```sql
   CREATE DATABASE PEC CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Configurar credenciales** en `backend/.env`:
   ```env
   DATABASE_URL="mysql://usuario:contraseña@localhost:3306/PEC"
   PORT=2000
   VITE_API_URL=http://localhost:2000/pec
   
   AUTH_AES_SECRET_KEY="1234567890abcdef1234567890abcdef"
   AUTH_JW_SECRET_KEY="1234567890abcdef1234567890abcdef"
   ```

### Paso 4: Instalar Dependencias del Backend

```cmd
cd backend
npm install
```

**Nota**: Este proceso puede tardar 2-5 minutos dependiendo de su conexión a internet.

### Paso 5: Generar Cliente Prisma y Migrar Base de Datos

```cmd
npx prisma generate
npx prisma db push
```

### Paso 6: Poblar Base de Datos con Datos Iniciales

```cmd
npm run seed:full
```

Este comando crea:
- Roles y permisos
- Usuarios de prueba (admin y user)
- Laboratorios de ejemplo
- Productos de muestra
- EPS y tarifarios

### Paso 7: Instalar Dependencias del Frontend

```cmd
cd ..\frontend
npm install
```

---

## 🚀 Ejecución del Sistema

### Iniciar el Backend

Abra una terminal y ejecute:

```cmd
cd C:\Trabajos\COMPRAS\backend
npm run dev
```

**Resultado esperado**:
```
Servidor funcionando en el puerto: 2000
```

**⚠️ NO CIERRE ESTA TERMINAL** - el backend debe permanecer ejecutándose.

### Iniciar el Frontend

Abra **una segunda terminal** y ejecute:

```cmd
cd C:\Trabajos\COMPRAS\frontend
npm run dev
```

**Resultado esperado**:
```
VITE v6.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Acceder al Sistema

1. Abra su navegador
2. Vaya a: **http://localhost:5173/**
3. Verá la pantalla de inicio de sesión

---

## 🔑 Primer Acceso

### Credenciales de Administrador

```
Usuario: admin@admin.com
Contraseña: admin123
```

### Credenciales de Usuario Regular

```
Usuario: user@mail.com
Contraseña: user123
```

### ¿Olvidó su Contraseña?

Si necesita restablecer una contraseña, ejecute desde `backend/`:

```cmd
node scripts/update_admin_password.js admin@admin.com nueva_contraseña
```

---

## 📚 Módulos del Sistema

### 1. 🏠 Dashboard / Inicio
- Vista general de estadísticas clave
- Acceso rápido a todas las funcionalidades
- Indicadores de rendimiento

### 2. 👥 Gestión de Pacientes
**Ruta**: `/pacientes`

**Funcionalidades**:
- ➕ Registrar nuevo paciente
- 📝 Editar información de paciente
- 🔍 Búsqueda por nombre, identificación o teléfono
- 👁️ Ver historial de entregas
- 📊 Paginación de resultados

**Cómo registrar un paciente**:
1. Click en "Nuevo Paciente"
2. Complete los campos obligatorios:
   - Nombres
   - Apellidos
   - Tipo y número de identificación
   - Fecha de nacimiento
   - Teléfono principal
   - Dirección completa
3. Click en "Guardar"

### 3. 📦 Gestión de Inventario
**Ruta**: `/inventario`

**Funcionalidades**:
- 📊 Ver stock actual de todos los productos
- ⚠️ Alertas de stock bajo/crítico
- ➕➖ Ajustar stock manualmente
- 📋 Historial de movimientos
- 🔔 Configurar stock mínimo

**Cómo ajustar stock**:
1. Localice el producto
2. Click en "Ajustar Stock"
3. Ingrese la cantidad (positiva para sumar, negativa para restar)
4. Agregue un motivo/observación
5. Confirme el ajuste

**Alertas de Stock**:
- 🟢 Verde: Stock normal
- 🟡 Amarillo: Stock bajo (entre mínimo y crítico)
- 🔴 Rojo: Stock crítico (por debajo del mínimo)

### 4. 🚚 Gestión de Entregas
**Ruta**: `/entregas`

**Funcionalidades**:
- ➕ Crear nueva entrega
- 📋 Listar entregas con filtros
- 🔄 Cambiar estado de entrega
- ❌ Cancelar entrega (devuelve inventario)
- 📄 Ver detalles completos
- 📊 Estadísticas de entregas

**Estados de Entrega**:
1. 🟡 **Pendiente de Despacho**: Recién creada
2. 🔵 **En Preparación**: Siendo preparada
3. 🟣 **Despachado**: En camino al paciente
4. 🟢 **Entregado**: Completado exitosamente
5. 🔴 **Cancelado**: Anulada (inventario devuelto)

**Cómo crear una entrega**:
1. Click en "Nueva Entrega"
2. **Seleccione el paciente**
3. **Complete dirección de entrega**:
   - Dirección
   - Ciudad
   - Departamento
   - Barrio (opcional)
   - Fecha programada (opcional)
4. **Agregue productos**:
   - Click "Agregar Producto"
   - Seleccione producto del catálogo
   - Ingrese cantidad
   - Confirme precio unitario
5. Agregue observaciones si es necesario
6. Click en "Crear Entrega"

**⚠️ Importante**: Al crear una entrega, el stock se descuenta automáticamente del inventario.

**Cómo cancelar una entrega**:
1. Localice la entrega en la lista
2. Click en el ícono de cancelar (❌)
3. Ingrese el motivo de cancelación
4. Confirme

**Nota**: Solo se pueden cancelar entregas en estado "Pendiente" o "En Preparación". El inventario se reintegra automáticamente.

### 5. 🗺️ Optimización de Rutas
**Ruta**: `/rutas`

**Funcionalidades**:
- 📍 Crear rutas de entrega
- 👤 Asignar domiciliario
- 📋 Agregar entregas a la ruta
- 🔄 Optimizar orden de entregas
- ✅ Marcar rutas como completadas

**Cómo crear una ruta**:
1. Click en "Nueva Ruta"
2. Asigne un domiciliario
3. Seleccione las entregas pendientes
4. El sistema sugiere el orden óptimo
5. Ajuste manualmente si es necesario
6. Guarde la ruta

### 6. 💰 Gestión de Tarifarios
**Ruta**: `/tarifarios`

**Funcionalidades**:
- 📋 Ver tarifarios por EPS/empresa
- 💵 Asignar precios especiales a productos
- 🔄 Actualizar precios masivamente
- 📊 Comparar tarifarios

**Cómo asignar un precio a un tarifario**:
1. Seleccione el tarifario (EPS o empresa)
2. Click en "Agregar Producto"
3. Seleccione el producto
4. Ingrese el precio específico
5. Guarde los cambios

### 7. 🏢 Gestión de Empresas y Laboratorios
**Ruta**: `/admin/empresas` o `/admin/laboratorios`

**Funcionalidades**:
- ➕ Registrar nuevas empresas/laboratorios
- 📝 Editar información
- 🔗 Asociar laboratorios a empresas
- 🔍 Búsqueda y filtrado

### 8. 💊 Gestión de Productos
**Ruta**: `/productos`

**Funcionalidades**:
- ➕ Registrar nuevo producto
- 📝 Actualizar información (precio, presentación)
- 🔍 Búsqueda por nombre, CUM o descripción
- 📋 Ver productos por laboratorio

**Campos importantes**:
- **CUM**: Código Único de Medicamento (único e inmutable)
- **Descripción**: Nombre del producto
- **Presentación**: Forma farmacéutica y concentración
- **Precio Unidad**: Precio por unidad mínima
- **Precio Presentación**: Precio por presentación completa
- **Stock Actual**: Cantidad disponible

### 9. 👥 Administración de Usuarios y Roles
**Ruta**: `/admin/usuarios`

**Solo para Administradores**

**Funcionalidades**:
- ➕ Crear nuevos usuarios
- 👤 Asignar roles (Admin, User, etc.)
- 🔐 Gestionar permisos
- 🚫 Desactivar usuarios

**Permisos disponibles**:
- `ver_*`: Visualizar módulo
- `crear_*`: Crear registros
- `editar_*`: Modificar registros
- `eliminar_*`: Borrar registros
- `despachar_entregas`: Cambiar estado de entregas
- `cancelar_entregas`: Anular entregas

---

## 🔧 Funcionalidades Principales

### Búsqueda y Filtrado

Todos los módulos principales incluyen:
- 🔍 **Búsqueda por texto**: Busca en múltiples campos
- 🗓️ **Filtros por fecha**: Rango de fechas personalizado
- 📊 **Filtros por estado**: Filtra por estado específico
- 📄 **Paginación**: 10, 25, 50 o 100 registros por página

### Exportar Datos

Muchos módulos permiten exportar datos:
- 📊 Excel (.xlsx)
- 📄 PDF
- 📋 CSV

### Notificaciones

El sistema muestra notificaciones tipo toast:
- ✅ Verde: Operación exitosa
- ❌ Rojo: Error
- ⚠️ Amarillo: Advertencia
- ℹ️ Azul: Información

---

## ⚙️ Configuración Adicional

### Cambiar Puerto del Backend

Edite `backend/.env`:
```env
# Credenciales predeterminadas para acceder a PGAdmin
PGADMIN_DEFAULT_EMAIL="Deivid@Cardenas.com"  # Correo electrónico predeterminado para acceder a PGAdmin
PGADMIN_DEFAULT_PASSWORD="12345"  # Contraseña predeterminada para acceder a PGAdmin

# URL de conexión para la base de datos MySQL local
DATABASE_URL_LOCAL="mysql://root:12345@localhost:3306/PEC"  # Cadena de conexión para MySQL en entorno local, con base de datos 'PEC'.

# URL de conexión para la base de datos PostgreSQL en Docker
DATABASE_URL_DOCKER="postgresql://postgres:12345@pec_db:5432/pec?schema=public"  # Cadena de conexión para PostgreSQL en entorno Docker, con base de datos 'pec'.

# Claves de encriptación y firma para autenticación y seguridad

# Clave secreta para el cifrado AES (usado en funciones de encriptado/desencriptado)
AUTH_AES_SECRET_KEY="1234567890abcdef1234567890abcdef"  # Clave secreta utilizada en el cifrado AES, asegurando que solo los usuarios con esta clave puedan encriptar o desencriptar datos.

# Clave secreta para la firma y verificación de tokens JWT
AUTH_JW_SECRET_KEY="1234567890abcdef1234567890abcdef"  # Clave secreta utilizada para firmar y verificar tokens JWT (JSON Web Token). Es esencial para garantizar la integridad y autenticidad de los tokens generados.

```

### Cambiar Puerto del Frontend

Edite `frontend/vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    port: 3001  // Cambie el puerto
  }
})
```

### Configurar Variables de Entorno del Frontend

Cree `frontend/.env`:
```env
VITE_API_URL=http://localhost:2000/pec
VITE_GEMINI_API_KEY=AIzaSyAh3QDXQ6wjZppcuVJVjHpzAFVFtv2twPk
```

---

## 🐛 Solución de Problemas

### Problema: "No se pueden cargar las empresas"

**Síntomas**: La lista de empresas aparece vacía o con error.

**Solución**:
1. Verifique que el backend esté ejecutándose
2. Revise la consola del navegador (F12)
3. Verifique credenciales de autenticación

### Problema: "Error 500 al crear entrega"

**Causa**: Falta el campo `stock_anterior` en movimientos de inventario.

**Solución**: Ya corregido en la última versión del controlador.

### Problema: Backend no inicia - Error de Puerto

**Síntomas**: `Error: listen EADDRINUSE: address already in use :::2000`

**Solución**:
```cmd
# Encontrar el proceso en el puerto 2000
netstat -ano | findstr :2000

# Matar el proceso (reemplace PID con el número real)
taskkill /PID [PID] /F
```

### Problema: Errores de Prisma al generar cliente

**Síntomas**: `Error: Cannot rename query engine`

**Solución**:
```cmd
cd backend
# Cerrar todas las terminales con node ejecutándose
# Eliminar carpeta de Prisma
rmdir /s /q node_modules\.prisma
# Regenerar
npx prisma generate
```

### Problema: Base de datos con estructura incorrecta

**Síntomas**: Errores de "tabla no encontrada" o "columna no existe"

**Solución**:
```cmd
cd backend
# ADVERTENCIA: Esto borra todos los datos
npx prisma migrate reset --force
npm run seed:full
```

### Problema: Frontend muestra pantalla en blanco

**Solución**:
1. Abra la consola del navegador (F12)
2. Revise errores en la pestaña "Console"
3. Limpie caché del navegador (Ctrl + Shift + Delete)
4. Reinicie el servidor de Vite

### Problema: "Token no proporcionado" al hacer peticiones

**Causa**: Sesión expirada o token inválido.

**Solución**:
1. Cierre sesión
2. Vuelva a iniciar sesión
3. Si persiste, limpie localStorage del navegador

---

## 📖 Flujo de Trabajo Típico

### Escenario: Registrar una entrega completa

1. **Registrar paciente** (si es nuevo):
   - Ir a Pacientes → Nuevo Paciente
   - Completar información personal
   - Guardar

2. **Verificar inventario**:
   - Ir a Inventario
   - Buscar productos necesarios
   - Confirmar disponibilidad de stock

3. **Crear entrega**:
   - Ir a Entregas → Nueva Entrega
   - Seleccionar paciente
   - Agregar dirección de entrega
   - Agregar productos con cantidades
   - Crear entrega

4. **Preparar entrega**:
   - Localizar entrega en lista
   - Cambiar estado a "En Preparación"
   - Agregar observaciones si es necesario

5. **Asignar a ruta** (opcional):
   - Ir a Rutas → Nueva Ruta
   - Asignar domiciliario
   - Agregar la entrega a la ruta
   - Optimizar orden

6. **Marcar como despachado**:
   - Cambiar estado a "Despachado"
   - Registrar hora de despacho

7. **Confirmar entrega**:
   - Una vez entregado, cambiar estado a "Entregado"
   - El sistema registra automáticamente la fecha/hora

---

## 📞 Soporte y Ayuda

### Documentación Adicional

- `README.md`: Documentación técnica completa
- `DESIGN_UPGRADE_GUIDE.md`: Guía de diseño de componentes
- `SISTEMA_AUTENTICACION_RF006.md`: Detalles del sistema de autenticación

### Logs del Sistema

**Backend**: Los logs se muestran en la terminal donde ejecutó `npm run dev`

**Frontend**: Abra DevTools (F12) → pestaña Console

### Respaldos de Base de Datos

**Crear respaldo**:
```cmd
cd backend
mkdir backups
mysqldump -u root -p PEC > backups\pec_backup_%date:~-4,4%%date:~-7,2%%date:~-10,2%.sql
```

**Restaurar respaldo**:
```cmd
mysql -u root -p PEC < backups\pec_backup_YYYYMMDD.sql
```

---

## 🎓 Mejores Prácticas

1. **Realice respaldos regulares** de la base de datos
2. **Cierre sesión** cuando no use el sistema
3. **Verifique inventario** antes de crear entregas masivas
4. **Use filtros y búsqueda** para encontrar información rápidamente
5. **Agregue observaciones** detalladas en entregas y movimientos
6. **Revise las estadísticas** periódicamente
7. **Actualice precios** de tarifarios según convenios vigentes

---

## 📊 Glosario de Términos

- **CUM**: Código Único de Medicamento
- **EPS**: Entidad Promotora de Salud
- **Tarifario**: Listado de precios acordados con una entidad
- **Stock Crítico**: Cantidad por debajo del mínimo configurado
- **Movimiento de Inventario**: Registro de entrada o salida de productos
- **Entrega**: Pedido de productos para un paciente
- **Ruta**: Conjunto de entregas agrupadas para un domiciliario

---

## 🔄 Actualizaciones del Sistema

Para actualizar a una nueva versión:

```cmd
# Actualizar código
git pull origin master

# Actualizar dependencias backend
cd backend
npm install
npx prisma generate
npx prisma db push

# Actualizar dependencias frontend
cd ..\frontend
npm install
```

---

**Versión del Manual**: 1.0  
**Última Actualización**: Noviembre 2025  
**Sistema**: Pharma Elite Care (PEC)
