const axios = require('axios');

async function testReportesEndpoint() {
  try {
    console.log('Probando endpoint de reportes...\n');

    // Primero necesitamos hacer login para obtener el token
    console.log('1. Haciendo login...');
    const loginResponse = await axios.post('http://localhost:2000/pec/usuario/login', {
      username: 'admin',
      password: 'admin123'
    });

    const token = loginResponse.data.data.token;
    console.log('Token obtenido:', token.substring(0, 20) + '...');

    // Probar endpoint de reportes
    console.log('\n2. Probando /pec/reportes/compras:');
    const reporteResponse = await axios.get('http://localhost:2000/pec/reportes/compras?page=1&limit=20', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Status:', reporteResponse.status);
    console.log('Data:', JSON.stringify(reporteResponse.data, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testReportesEndpoint();
