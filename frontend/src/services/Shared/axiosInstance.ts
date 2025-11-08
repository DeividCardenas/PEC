import axios from 'axios';

// Crea una instancia de Axios con la base URL común
export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Usa la variable de entorno
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de request para añadir token de autenticación
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de response para manejar errores de autenticación
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el token ha expirado o no es válido (401)
    if (error.response?.status === 401) {
      // Limpiar datos de autenticación
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('tarifarios');

      // Redirigir al login solo si no estamos ya en la página de login
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Función para actualizar dinámicamente la baseURL
export const setBaseURL = (service: string) => {
  const baseURL = import.meta.env.VITE_API_URL;
  
  if (!baseURL) {
    console.error('La variable VITE_API_URL no está definida');
    return;
  }

  switch (service) {
    case 'usuario':
      axiosInstance.defaults.baseURL = `${baseURL}/usuario`;
      break;
    case 'rol':
      axiosInstance.defaults.baseURL = `${baseURL}/rol`;
      break;
    case 'permiso':
      axiosInstance.defaults.baseURL = `${baseURL}/permiso`;
      break;
    case 'permiso-rol':
      axiosInstance.defaults.baseURL = `${baseURL}/permiso-rol`;
      break;
    case 'producto':
      axiosInstance.defaults.baseURL = `${baseURL}/producto`;
      break;
    case 'empresa':
      axiosInstance.defaults.baseURL = `${baseURL}/empresa`;
      break;
    case 'laboratorio':
      axiosInstance.defaults.baseURL = `${baseURL}/laboratorio`;
      break;
    case 'empresa-laboratorio':
      axiosInstance.defaults.baseURL = `${baseURL}/empresa-laboratorio`;
      break;
    case 'eps':
      axiosInstance.defaults.baseURL = `${baseURL}/eps`;
      break;
    case 'tarifario':
      axiosInstance.defaults.baseURL = `${baseURL}/tarifario`;
      break;
    case 'permiso-tarifario':
      axiosInstance.defaults.baseURL = `${baseURL}/permiso-tarifario`;
      break;
    case 'proveedores':
      axiosInstance.defaults.baseURL = `${baseURL}/proveedores`;
      break;
    case 'tarifario-producto':
      axiosInstance.defaults.baseURL = `${baseURL}/tarifario-producto`;
      break;
    case 'ordenes-compra':
      axiosInstance.defaults.baseURL = `${baseURL}/ordenes-compra`;
      break;
    case 'inventario':
      axiosInstance.defaults.baseURL = `${baseURL}/inventario`;
      break;
    case 'reportes':
      axiosInstance.defaults.baseURL = `${baseURL}/reportes`;
      break;
    case 'pacientes':
      axiosInstance.defaults.baseURL = `${baseURL}/pacientes`;
      break;
    case 'entregas':
      axiosInstance.defaults.baseURL = `${baseURL}/entregas`;
      break;
    case 'domiciliarios':
      axiosInstance.defaults.baseURL = `${baseURL}/domiciliarios`;
      break;
    case 'rutas':
      axiosInstance.defaults.baseURL = `${baseURL}/rutas`;
      break;
    case 'seguimiento':
      axiosInstance.defaults.baseURL = `${baseURL}/seguimiento`;
      break;
    case 'prueba-entrega':
      axiosInstance.defaults.baseURL = `${baseURL}/prueba-entrega`;
      break;
    case 'compare':
      axiosInstance.defaults.baseURL = `${baseURL}/compare`;
      break;
    default:
      console.error('Servicio no encontrado');
  }
};
