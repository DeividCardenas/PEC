# Guía de Seguridad - Backend PEC

Este documento describe las medidas de seguridad implementadas y las configuraciones recomendadas para el backend del proyecto PEC.

---

## 🔐 Medidas de Seguridad Implementadas

### 1. Helmet.js
**Configuración:** `/backend/models/server.js`

Helmet ayuda a proteger la aplicación configurando varios headers HTTP de seguridad:
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Strict-Transport-Security (HSTS)
- Content-Security-Policy (CSP)

### 2. CORS (Cross-Origin Resource Sharing)
**Configuración:** `/backend/models/server.js`

CORS está configurado para:
- Permitir origins específicos (configurables via variable de entorno)
- Permitir credenciales
- Restringir métodos HTTP permitidos
- Validar headers permitidos

**Variable de entorno:**
```env
ALLOWED_ORIGINS=http://localhost:3000,https://tudominio.com
```

### 3. Rate Limiting
**Configuración:** `/backend/models/server.js`

Implementado con `express-rate-limit`:

- **Rate Limiting Global:**
  - 1000 requests por IP cada 15 minutos
  - Aplica a todas las rutas

- **Rate Limiting de Autenticación:**
  - 10 intentos de login por IP cada 15 minutos
  - Aplica a: `/pec/usuario/login` y `/pec/token`
  - No cuenta requests exitosos

### 4. Encriptación de Contraseñas
**Implementación:** bcrypt con 10 salt rounds

Todas las contraseñas se hashean antes de guardar en BD:
```javascript
const hashedPassword = await bcrypt.hash(password, 10);
```

### 5. JWT (JSON Web Tokens)
**Configuración:** `/backend/middlewares/jwt.js`

- Algoritmo: HS256
- Duración: 8 horas
- Incluye: id_usuario, rol, permisos, tarifarios

**Secret Key:** Configurada en `.env` como `AUTH_JW_SECRET_KEY`

### 6. Encriptación AES
**Configuración:** `/backend/middlewares/validate.js`

Usado para encriptar datos sensibles con CryptoJS:
- Algoritmo: AES
- Secret Key: Configurada en `.env` como `AUTH_AES_SECRET_KEY`

### 7. Manejo Seguro de Errores
**Configuración:** `/backend/models/server.js`

- No expone stack traces en producción
- Logs detallados solo en desarrollo
- Mensajes de error genéricos al cliente
- 404 para rutas no encontradas

---

## ⚙️ Configuración de Variables de Entorno

### Variables Requeridas

```env
# Base de Datos
DATABASE_URL_LOCAL=mysql://root:STRONG_PASSWORD@localhost:3306/PEC
DATABASE_URL_DOCKER=postgresql://postgres:STRONG_PASSWORD@pec_db:5432/pec

# Autenticación y Seguridad
AUTH_AES_SECRET_KEY=use-a-strong-32-character-key-here
AUTH_JW_SECRET_KEY=use-another-strong-32-char-key

# Configuración del Servidor
PORT=2000
NODE_ENV=production

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Admin (PostgreSQL)
PGADMIN_DEFAULT_EMAIL=admin@yourdomain.com
PGADMIN_DEFAULT_PASSWORD=use-a-strong-password-here
```

### ⚠️ Nunca en Producción:
- ❌ Contraseñas simples como "12345"
- ❌ Secret keys predecibles o repetitivas
- ❌ ALLOWED_ORIGINS='*' (permitir todas las origins)
- ❌ NODE_ENV='development'

---

## 🛡️ Control de Acceso

### Sistema RBAC (Role-Based Access Control)

El sistema implementa control de acceso basado en:

1. **Roles:** Administrador, Editor, Usuario
2. **Permisos:** crear_tarifario, editar_tarifario, eliminar_tarifario
3. **Tarifarios:** Acceso específico por usuario

**Middleware:** `/backend/middlewares/authMiddleware.js`

```javascript
VerificarAcceso(roles = [], permisos = [], validarTarifario = false)
```

### Protección de Endpoints

Todos los endpoints críticos están protegidos con:
- Verificación de token JWT
- Validación de rol
- Validación de permisos
- Validación de acceso a tarifarios (si aplica)

---

## 📝 Mejores Prácticas Implementadas

### 1. Validación de Entrada
- ✅ Uso de `express-validator` en todas las rutas
- ✅ Validación de tipos de datos
- ✅ Sanitización de inputs
- ✅ Validación de longitud de strings

### 2. Logging Seguro
- ✅ No se loggean contraseñas
- ✅ No se loggean tokens
- ✅ Stack traces solo en desarrollo
- ✅ Logs estructurados

### 3. Base de Datos
- ✅ Uso de Prisma ORM (previene SQL injection)
- ✅ Prepared statements automáticos
- ✅ Validación de relaciones
- ✅ Constraints de BD configurados

### 4. Sesiones y Tokens
- ✅ Tokens con expiración
- ✅ No se almacenan tokens en BD
- ✅ Tokens firmados y verificados
- ✅ Logout limpia tokens del cliente

---

## 🚨 Checklist Pre-Producción

Antes de desplegar a producción, verificar:

- [ ] Cambiar todas las contraseñas por passwords fuertes
- [ ] Generar nuevas secret keys aleatorias (32+ caracteres)
- [ ] Configurar `ALLOWED_ORIGINS` con dominios específicos
- [ ] Configurar `NODE_ENV=production`
- [ ] Revisar que no queden console.log con datos sensibles
- [ ] Configurar HTTPS en el servidor
- [ ] Configurar backup automático de BD
- [ ] Implementar monitoreo de logs
- [ ] Configurar alertas de intentos de login fallidos
- [ ] Revisar permisos de archivos en servidor
- [ ] Habilitar firewall en servidor
- [ ] Configurar rate limiting más agresivo si es necesario

---

## 🔍 Auditoría de Seguridad

### Herramientas Recomendadas:
- `npm audit` - Vulnerabilidades en dependencias
- `snyk` - Análisis de seguridad continuo
- OWASP ZAP - Testing de penetración

### Ejecutar Auditoría:
```bash
npm audit
npm audit fix
```

---

## 📚 Recursos Adicionales

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Checklist](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)

---

## 📞 Reporte de Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad, por favor NO la reportes públicamente. Contacta al equipo de desarrollo directamente.

**Última actualización:** 2025-11-07
