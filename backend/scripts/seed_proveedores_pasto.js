const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedProveedoresPasto() {
  try {
    console.log('🌱 Creando proveedores de Pasto, Colombia...\n');

    const proveedores = [
      {
        nombre: 'Drogas La Rebaja Pasto',
        laboratorio: 'Varios',
        tipo: 'Droguería Mayorista',
        titular: 'Carlos Andrés Muñoz',
        direccion: 'Calle 18 # 25-34, Centro',
        telefono: '(602) 7231456',
        email: 'ventas.pasto@drogaslarebaja.com',
        nit: '900123456-1',
        ciudad: 'Pasto',
        pais: 'Colombia',
        activo: true,
        notas: 'Proveedor principal de medicamentos genéricos'
      },
      {
        nombre: 'Distribuidora Farmacéutica del Sur',
        laboratorio: 'Tecnoquímicas',
        tipo: 'Distribuidor Autorizado',
        titular: 'María Elena Guerrero',
        direccion: 'Carrera 27 # 16A-50, Barrio Pandiaco',
        telefono: '(602) 7234567',
        email: 'gerencia@farmasur.com.co',
        nit: '900234567-2',
        ciudad: 'Pasto',
        pais: 'Colombia',
        activo: true,
        notas: 'Especializado en medicamentos de alta complejidad'
      },
      {
        nombre: 'Cooperativa de Farmacias de Nariño - COOFARNARIÑO',
        laboratorio: 'Múltiples',
        tipo: 'Cooperativa',
        titular: 'Jorge Luis Pantoja',
        direccion: 'Avenida Los Estudiantes # 22-15',
        telefono: '(602) 7245678',
        email: 'coordinacion@coofanarino.coop',
        nit: '891234567-3',
        ciudad: 'Pasto',
        pais: 'Colombia',
        activo: true,
        notas: 'Red de farmacias cooperativas con buenos precios'
      },
      {
        nombre: 'Laboratorios Pastenses LABOPAST',
        laboratorio: 'Producción Propia',
        tipo: 'Fabricante Local',
        titular: 'Dr. Hernando Córdoba',
        direccion: 'Vía Catambuco Km 2, Parque Industrial',
        telefono: '(602) 7256789',
        email: 'comercial@labopast.com',
        nit: '900345678-4',
        ciudad: 'Pasto',
        pais: 'Colombia',
        activo: true,
        notas: 'Producción local de medicamentos y suplementos'
      },
      {
        nombre: 'Cruz Verde Pasto',
        laboratorio: 'Varios',
        tipo: 'Cadena Nacional',
        titular: 'Laura Patricia Santander',
        direccion: 'Centro Comercial Unicentro, Local 105',
        telefono: '(602) 7267890',
        email: 'pasto@cruzverde.com.co',
        nit: '860034594-5',
        ciudad: 'Pasto',
        pais: 'Colombia',
        activo: true,
        notas: 'Sucursal de cadena nacional con amplio inventario'
      },
      {
        nombre: 'Distribuciones Médicas del Galeras',
        laboratorio: 'Pfizer, Bayer',
        tipo: 'Distribuidor',
        titular: 'Roberto Insuasty',
        direccion: 'Carrera 35 # 20-45, Las Mercedes',
        telefono: '(602) 7278901',
        email: 'ventas@medgaleras.com',
        nit: '900456789-6',
        ciudad: 'Pasto',
        pais: 'Colombia',
        activo: true,
        notas: 'Importador directo de medicamentos internacionales'
      },
      {
        nombre: 'Farmacias Economicas del Sur',
        laboratorio: 'Genéricos',
        tipo: 'Cadena Regional',
        titular: 'Ana María Moncayo',
        direccion: 'Calle 16 # 23-28, Centro Histórico',
        telefono: '(602) 7289012',
        email: 'administracion@farmaeconomica.com',
        nit: '900567890-7',
        ciudad: 'Pasto',
        pais: 'Colombia',
        activo: true,
        notas: 'Especializado en medicamentos de bajo costo'
      },
      {
        nombre: 'Sumedco Nariño',
        laboratorio: 'Varios',
        tipo: 'Suministros Médicos',
        titular: 'Ing. Pedro Bastidas',
        direccion: 'Calle 18 # 32-16, Bolivariano',
        telefono: '(602) 7290123',
        email: 'gerente@sumedco-narino.com',
        nit: '900678901-8',
        ciudad: 'Pasto',
        pais: 'Colombia',
        activo: true,
        notas: 'Suministros médicos e insumos hospitalarios'
      }
    ];

    let created = 0;
    let existing = 0;

    for (const prov of proveedores) {
      const existingProv = await prisma.proveedor.findFirst({
        where: { nit: prov.nit }
      });

      if (!existingProv) {
        await prisma.proveedor.create({ data: prov });
        console.log(`✅ ${prov.nombre} - ${prov.nit}`);
        created++;
      } else {
        console.log(`⚠️  Ya existe: ${prov.nombre}`);
        existing++;
      }
    }

    console.log('\n🎉 Seed de proveedores completado!');
    console.log(`✅ Creados: ${created}`);
    console.log(`ℹ️  Ya existían: ${existing}`);
    console.log(`📍 Todos los proveedores son de Pasto, Nariño, Colombia\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedProveedoresPasto();
