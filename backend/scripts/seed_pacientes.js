const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedPacientes() {
  try {
    console.log('Creando pacientes de prueba...\n');

    const pacientes = [
      {
        tipo_identificacion: 'CC',
        numero_identificacion: '1085123456',
        nombres: 'María Elena',
        apellidos: 'González Rodríguez',
        fecha_nacimiento: new Date('1985-03-15'),
        genero: 'Femenino',
        telefono_principal: '3201234567',
        telefono_secundario: '7281234',
        email: 'maria.gonzalez@email.com',
        direccion: 'Calle 18 # 25-34',
        ciudad: 'Pasto',
        departamento: 'Nariño',
        codigo_postal: '520001',
        barrio: 'Centro',
        eps: 'Compensar',
        tipo_afiliacion: 'Contributivo',
        observaciones: 'Paciente con tratamiento crónico',
        activo: true
      },
      {
        tipo_identificacion: 'CC',
        numero_identificacion: '1085234567',
        nombres: 'Carlos Andrés',
        apellidos: 'Martínez López',
        fecha_nacimiento: new Date('1992-07-22'),
        genero: 'Masculino',
        telefono_principal: '3112345678',
        email: 'carlos.martinez@email.com',
        direccion: 'Carrera 27 # 15-45',
        ciudad: 'Pasto',
        departamento: 'Nariño',
        codigo_postal: '520002',
        barrio: 'Pandiaco',
        eps: 'Sanitas',
        tipo_afiliacion: 'Contributivo',
        activo: true
      },
      {
        tipo_identificacion: 'CC',
        numero_identificacion: '1085345678',
        nombres: 'Ana Patricia',
        apellidos: 'Córdoba Benavides',
        fecha_nacimiento: new Date('1978-11-30'),
        genero: 'Femenino',
        telefono_principal: '3123456789',
        telefono_secundario: '7282345',
        email: 'ana.cordoba@email.com',
        direccion: 'Avenida Estudiantes # 10-20',
        ciudad: 'Pasto',
        departamento: 'Nariño',
        barrio: 'Torobajo',
        eps: 'Sura',
        tipo_afiliacion: 'Contributivo',
        observaciones: 'Requiere atención especializada',
        activo: true
      },
      {
        tipo_identificacion: 'TI',
        numero_identificacion: '1085456789',
        nombres: 'Santiago',
        apellidos: 'Guerrero Muñoz',
        fecha_nacimiento: new Date('2010-05-10'),
        genero: 'Masculino',
        telefono_principal: '3134567890',
        direccion: 'Calle 20 # 30-15',
        ciudad: 'Pasto',
        departamento: 'Nariño',
        barrio: 'La Alameda',
        eps: 'Coomeva',
        tipo_afiliacion: 'Subsidiado',
        activo: true
      },
      {
        tipo_identificacion: 'CC',
        numero_identificacion: '1085567890',
        nombres: 'Luis Fernando',
        apellidos: 'Insuasty Portilla',
        fecha_nacimiento: new Date('1965-02-28'),
        genero: 'Masculino',
        telefono_principal: '3145678901',
        email: 'luis.insuasty@email.com',
        direccion: 'Carrera 32 # 18-50',
        ciudad: 'Pasto',
        departamento: 'Nariño',
        codigo_postal: '520003',
        barrio: 'Las Mercedes',
        eps: 'Nueva EPS',
        tipo_afiliacion: 'Contributivo',
        activo: true
      },
      {
        tipo_identificacion: 'CC',
        numero_identificacion: '1085678901',
        nombres: 'Diana Carolina',
        apellidos: 'Chaves Delgado',
        fecha_nacimiento: new Date('1988-09-14'),
        genero: 'Femenino',
        telefono_principal: '3156789012',
        telefono_secundario: '7283456',
        email: 'diana.chaves@email.com',
        direccion: 'Calle 25 # 40-22',
        ciudad: 'Pasto',
        departamento: 'Nariño',
        barrio: 'Santa Mónica',
        eps: 'Salud Total',
        tipo_afiliacion: 'Contributivo',
        activo: true
      },
      {
        tipo_identificacion: 'CC',
        numero_identificacion: '1085789012',
        nombres: 'Roberto',
        apellidos: 'Paz Rosero',
        fecha_nacimiento: new Date('1995-12-05'),
        genero: 'Masculino',
        telefono_principal: '3167890123',
        direccion: 'Avenida Colombia # 5-30',
        ciudad: 'Pasto',
        departamento: 'Nariño',
        barrio: 'San Juan de Pasto',
        eps: 'Cafesalud',
        tipo_afiliacion: 'Subsidiado',
        observaciones: 'Paciente nuevo',
        activo: true
      },
      {
        tipo_identificacion: 'CC',
        numero_identificacion: '1085890123',
        nombres: 'Gloria Stella',
        apellidos: 'Ruiz Hernández',
        fecha_nacimiento: new Date('1972-04-18'),
        genero: 'Femenino',
        telefono_principal: '3178901234',
        email: 'gloria.ruiz@email.com',
        direccion: 'Carrera 35 # 22-18',
        ciudad: 'Pasto',
        departamento: 'Nariño',
        codigo_postal: '520004',
        barrio: 'El Progreso',
        eps: 'Compensar',
        tipo_afiliacion: 'Contributivo',
        activo: true
      }
    ];

    for (const paciente of pacientes) {
      await prisma.paciente.create({
        data: paciente
      });
      console.log(`✓ Paciente creado: ${paciente.nombres} ${paciente.apellidos}`);
    }

    console.log(`\n✓ Total de pacientes creados: ${pacientes.length}`);

    // Verificar
    const total = await prisma.paciente.count();
    console.log(`✓ Total de pacientes en BD: ${total}`);

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

seedPacientes();
