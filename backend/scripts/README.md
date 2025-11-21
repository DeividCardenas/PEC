# Scripts de Seed - PEC System

Este directorio contiene scripts para poblar la base de datos con datos de prueba.

## 📋 Scripts Disponibles

### 🚀 Script Principal

#### `seed_all.js`
Ejecuta **todos los seeders** en el orden correcto de dependencias.

```bash
npm run seed:all
```

Este script ejecuta en orden:
1. Datos básicos (Laboratorios, Empresas, EPS, Tarifarios, Productos)
2. Usuarios y Roles
3. Domiciliarios
4. Pacientes
5. Proveedores
6. Órdenes de Compra
7. Inventario Simple
8. Entregas
9. Rutas

### 📦 Scripts Individuales

Puedes ejecutar cada seeder individualmente:

#### `seed_full.js` - Datos Básicos
Crea laboratorios, empresas, EPS, tarifarios y productos base.

```bash
npm run seed:full
```

**Crea:**
- 2 Laboratorios (Laboratorio Seed A y B)
- 3 Empresas (Compañía Alpha, Beta, Gamma)
- 2 EPS (EPS Salud, EPS Bienestar)
- 4 Tarifarios (para empresas y EPS)
- 6 Productos farmacéuticos

#### `seed_users.js` - Usuarios y Roles
Crea roles del sistema y usuarios de prueba.

```bash
npm run seed:users
```

**Crea:**
- 4 Roles: Administrador, Farmaceutico, Auxiliar, Contador
- 4 Usuarios con credenciales:
  - admin@pec.com / admin123
  - farmaceutico@pec.com / farmaceutico123
  - auxiliar@pec.com / auxiliar123
  - contador@pec.com / contador123

#### `seed_domiciliarios.js` - Domiciliarios
Crea domiciliarios para entregas.

```bash
npm run seed:domiciliarios
```

**Crea:** 5 domiciliarios con diferentes tipos de vehículos (Moto, Bicicleta, Auto)

#### `seed_pacientes.js` - Pacientes
Crea pacientes del sistema.

```bash
npm run seed:pacientes
```

**Crea:** 8 pacientes con diferentes EPS y datos completos

#### `seed_proveedores.js` - Proveedores
Crea proveedores de Pasto, Colombia.

```bash
npm run seed:proveedores
```

**Crea:** 8 proveedores farmacéuticos de la región

#### `seed_ordenes.js` - Órdenes de Compra
Crea órdenes de compra con diferentes estados.

```bash
npm run seed:ordenes
```

**Crea:** 15 órdenes de compra con productos y diferentes estados (Pendiente, Aprobada, Completada, etc.)

#### `seed_entregas.js` - Entregas
Crea entregas a pacientes.

```bash
npm run seed:entregas
```

**Crea:** 10 entregas con diferentes estados

#### `seed_rutas.js` - Rutas de Entrega
Crea rutas para domiciliarios.

```bash
npm run seed:rutas
```

**Crea:** 5 rutas con entregas asignadas

## 🔄 Orden de Ejecución

**⚠️ IMPORTANTE:** Los seeders deben ejecutarse en orden debido a las dependencias:

1. ✅ `seed_full.js` - Debe ejecutarse PRIMERO (crea productos y tarifarios)
2. ✅ `seed_users.js` - Debe ejecutarse SEGUNDO (requerido para órdenes y entregas)
3. ✅ `seed_domiciliarios.js` - Antes de rutas
4. ✅ `seed_pacientes.js` - Antes de entregas
5. ✅ `seed_proveedores.js` - Antes de órdenes de compra
6. ✅ `seed_ordenes.js` - Requiere proveedores y usuarios
7. ✅ `seed_entregas.js` - Requiere pacientes y usuarios
8. ✅ `seed_rutas.js` - Requiere domiciliarios y entregas

## 🔧 Configuración de Base de Datos

### Resetear Base de Datos

Antes de ejecutar seeders, puedes resetear la base de datos:

```bash
npx prisma migrate reset --force --skip-seed
```

### Sincronizar Schema (Desarrollo)

Si solo quieres sincronizar el esquema sin migraciones:

```bash
npx prisma db push --force-reset
npx prisma generate
```

### Verificar Estado de Migraciones

```bash
npx prisma migrate status
```

## 📊 Estadísticas de Datos

Después de ejecutar `seed_all.js`, tendrás:

- **4** Usuarios (con roles de Administrador, Farmacéutico, Auxiliar, Contador)
- **4** Roles
- **2** Laboratorios
- **3** Empresas
- **2** EPS
- **4** Tarifarios
- **6** Productos farmacéuticos
- **8** Proveedores
- **15** Órdenes de Compra
- **8** Pacientes
- **5** Domiciliarios
- **10** Entregas
- **5** Rutas

## 🔐 Credenciales de Acceso

Después del seeding, puedes usar estas credenciales:

| Rol | Email | Password |
|-----|-------|----------|
| **Administrador** | admin@pec.com | admin123 |
| **Farmacéutico** | farmaceutico@pec.com | farmaceutico123 |
| **Auxiliar** | auxiliar@pec.com | auxiliar123 |
| **Contador** | contador@pec.com | contador123 |

## 🛠️ Troubleshooting

### Error: "The table does not exist"

Ejecuta:
```bash
npx prisma db push --force-reset
npx prisma generate
npm run seed:all
```

### Error: Producto no encontrado

Asegúrate de ejecutar `seed_full.js` primero o usa `seed:all` que ejecuta todo en orden.

### Error: Usuario no encontrado

Ejecuta `seed_users.js` antes de los seeders que requieren usuarios (órdenes, entregas, rutas).

## 📝 Notas

- Los seeders son **idempotentes**: pueden ejecutarse múltiples veces sin crear duplicados
- Los datos son de **prueba** y representan un escenario realista de Pasto, Colombia
- Los precios están en pesos colombianos (COP)
- Las fechas son relativas para simular actividad reciente
