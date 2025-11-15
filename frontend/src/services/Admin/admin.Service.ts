import axios from 'axios';

// Definir un tipo para los parámetros de búsqueda
export interface AdminParams {
  page?: number;
  limit?: number;
  nombre?: string;
  rol?: number;
  empresa?: number;
}

// Definir la interfaz para las respuestas de la API
interface UsuarioResponse {
  totalUsuarios: number;
  totalPaginas: number;
  paginaActual: number;
  tamanoPagina: number;
  usuarios: Usuario[];
}

export interface Usuario {
  id_usuario: number;
  username: string;
  email: string;
  estado?: boolean;
  id_rol: number;
  rol: {
    id_rol: number;
    nombre: string;
  };
}

export interface Rol {
  id_rol: number;
  nombre: string;
}

interface EpsResponse {
  totalEps: number;
  totalPaginas: number;
  paginaActual: number;
  tamanoPagina: number;
  eps: Eps[];
}

interface Eps {
  id_eps: number;
  nombre: string;
}

interface LaboratorioResponse {
  totalLaboratorios?: number;
  totalPaginas?: number;
  paginaActual?: number;
  tamanoPagina?: number;
  laboratorios?: Laboratorio[];
  // otras formas posibles
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  data?: Laboratorio[];
}

interface Laboratorio {
  id_laboratorio: number;
  nombre: string;
}

interface EmpresaResponse {
  totalEmpresas: number;
  totalPaginas: number;
  paginaActual: number;
  tamanoPagina: number;
  empresas: Empresa[];
}

interface Empresa {
  id_empresa: number;
  nombre: string;
}

// Interfaces para actualización
export interface UserUpdateData {
  username?: string;
  email?: string;
  id_rol?: number;
  estado?: boolean;
  password?: string;
}

interface GenericUpdateData {
  nombre?: string;
}

// Alias de tipo para los parámetros de consulta
type QueryParams = Record<string, string | number | undefined>;

// Función para obtener usuarios con filtros y paginación
export const fetchUsers = async (
  filters: Partial<AdminParams>
): Promise<UsuarioResponse> => {
  try {
    const params: QueryParams = {
      ...filters,
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
    };

    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:2000';
  const response = await axios.get<UsuarioResponse>(`${baseURL}/usuario`, { params });

    return response.data;
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    throw new Error("No se pudo obtener los usuarios");
  }
};

// Función para obtener EPS con filtros y paginación
export const fetchEps = async (
  filters: Partial<AdminParams>
): Promise<EpsResponse> => {
  try {
    const params: QueryParams = {
      ...filters,
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
    };

    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:2000';
  const response = await axios.get<EpsResponse>(`${baseURL}/eps`, { params });

    return response.data;
  } catch (error) {
    console.error("Error al obtener EPS:", error);
    throw new Error("No se pudo obtener las EPS");
  }
};

// Función para obtener laboratorios con filtros y paginación
// Normaliza diferentes shapes de respuesta de laboratorios a { data, page, totalPages }
const normalizeLaboratoriosResponse = (resp: any) => {
  // Forma 1: { total, page, limit, totalPages, data }
  if (resp && Array.isArray(resp.data)) {
    return { data: resp.data, page: resp.page ?? resp.pageActual ?? resp.paginaActual ?? resp.page ?? 1, totalPages: resp.totalPages ?? Math.ceil((resp.total ?? resp.totalLaboratorios ?? 0) / (resp.limit || 10)) };
  }

  // Forma 2: { total, page, limit, totalPages, data: [] }
  if (resp && Array.isArray(resp.lista)) {
    return { data: resp.lista, page: resp.paginaActual ?? resp.page ?? 1, totalPages: resp.totalPaginas ?? resp.totalPages ?? Math.ceil((resp.totalProductos ?? 0) / (resp.tamanoPagina || 10)) };
  }

  // Forma 3: { data: { ... } } or server returning directly array
  if (resp && Array.isArray(resp)) {
    return { data: resp, page: 1, totalPages: 1 };
  }

  // Forma 4: estructura específica: { total, page, limit, totalPages, data }
  if (resp && (resp.data || resp.laboratorios || resp.lista)) {
    const dataArr = resp.data ?? resp.laboratorios ?? resp.lista ?? [];
    const page = resp.paginaActual ?? resp.page ?? resp.currentPage ?? 1;
    const totalPages = resp.totalPaginas ?? resp.totalPages ?? Math.ceil((resp.total ?? resp.totalLaboratorios ?? 0) / (resp.limit || resp.tamanoPagina || 10));
    return { data: dataArr, page, totalPages };
  }

  // Fallback: empty
  return { data: [], page: 1, totalPages: 1 };
};

export const fetchLaboratorios = async (
  filters: Partial<AdminParams>
): Promise<any> => {
  try {
    const params: QueryParams = {
      ...filters,
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
    };

    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:2000';
  const response = await axios.get<LaboratorioResponse>(`${baseURL}/laboratorio`, { params });

  // Debug: log response shape to help diagnose frontend/backend mismatches
  console.debug("fetchLaboratorios response.data:", response.data);

  // Normalize and return
  return normalizeLaboratoriosResponse(response.data);
  } catch (error) {
    console.error("Error al obtener laboratorios:", error);
    throw new Error("No se pudo obtener los laboratorios");
  }
};

// Función para obtener empresas con filtros y paginación
export const fetchEmpresas = async (
  filters: Partial<AdminParams>
): Promise<EmpresaResponse> => {
  try {
    const params: QueryParams = {
      ...filters,
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
    };

    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:2000';
  const response = await axios.get<EmpresaResponse>(`${baseURL}/empresa`, { params });

    return response.data;
  } catch (error) {
    console.error("Error al obtener empresas:", error);
    throw new Error("No se pudo obtener las empresas");
  }
};

// Funciones de actualización

// Actualizar usuario
export const updateUser = async (
  userId: number, 
  userData: UserUpdateData
): Promise<any> => {
  try {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:2000';
  const response = await axios.put(`${baseURL}/usuario/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error("Error al actualizar el usuario:", error);
    throw new Error("No se pudo actualizar el usuario");
  }
};

// Actualizar EPS
export const updateEps = async (
  epsId: number,
  epsData: GenericUpdateData
): Promise<any> => {
  try {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:2000';
  const response = await axios.put(`${baseURL}/eps/${epsId}`, epsData);
    return response.data;
  } catch (error) {
    console.error("Error al actualizar la EPS:", error);
    throw new Error("No se pudo actualizar la EPS");
  }
};

// Actualizar Laboratorio
export const updateLaboratorio = async (
  labId: number,
  labData: GenericUpdateData
): Promise<any> => {
  try {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:2000';
  const response = await axios.put(`${baseURL}/laboratorio/${labId}`, labData);
    return response.data;
  } catch (error) {
    console.error("Error al actualizar el laboratorio:", error);
    throw new Error("No se pudo actualizar el laboratorio");
  }
};

// Actualizar Empresa
export const updateEmpresa = async (
  empresaId: number,
  empresaData: GenericUpdateData
): Promise<any> => {
  try {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:2000';
  const response = await axios.put(`${baseURL}/empresa/${empresaId}`, empresaData);
    return response.data;
  } catch (error) {
    console.error("Error al actualizar la empresa:", error);
    throw new Error("No se pudo actualizar la empresa");
  }
};

// Funciones de eliminación

// Eliminar usuario
export const deleteUser = async (userId: number): Promise<any> => {
  try {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:2000';
  const response = await axios.delete(`${baseURL}/usuario/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar el usuario:", error);
    throw new Error("No se pudo eliminar el usuario");
  }
};

// Eliminar EPS
export const deleteEps = async (epsId: number): Promise<any> => {
  try {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:2000';
  const response = await axios.delete(`${baseURL}/eps/${epsId}`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar la EPS:", error);
    throw new Error("No se pudo eliminar la EPS");
  }
};

// Eliminar Laboratorio
export const deleteLaboratorio = async (labId: number): Promise<any> => {
  try {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:2000';
  const response = await axios.delete(`${baseURL}/laboratorio/${labId}`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar el laboratorio:", error);
    throw new Error("No se pudo eliminar el laboratorio");
  }
};

// Eliminar Empresa
export const deleteEmpresa = async (empresaId: number): Promise<any> => {
  try {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:2000';
  const response = await axios.delete(`${baseURL}/empresa/${empresaId}`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar la empresa:", error);
    throw new Error("No se pudo eliminar la empresa");
  }
};
 
//agregar eps
export const addEps = async (epsData: GenericUpdateData): Promise<any> => {
  try {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:2000';
  const response = await axios.post(`${baseURL}/eps`, epsData);
    return response.data;
  } catch (error) {
    console.error("Error al agregar la EPS:", error);
    throw new Error("No se pudo agregar la EPS");
  }
};

//agregar laboratorio
export const addLaboratorio = async (
  labData: GenericUpdateData
): Promise<any> => {
  try {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:2000';
  const response = await axios.post(`${baseURL}/laboratorio`, labData);
    return response.data;
  } catch (error) {
    console.error("Error al agregar el laboratorio:", error);
    throw new Error("No se pudo agregar el laboratorio");
  }
};

//agregar empresa
export const addEmpresa = async (
  empresaData: GenericUpdateData
): Promise<any> => {
  try {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:2000';
  const response = await axios.post(`${baseURL}/empresa`, empresaData);
    return response.data;
  } catch (error) {
    console.error("Error al agregar la empresa:", error);
    throw new Error("No se pudo agregar la empresa");
  }
};

// Asociar una empresa con uno o más laboratorios
export const associateEmpresaLaboratorio = async (
  id_empresa: number,
  id_laboratorio: number[]
): Promise<any> => {
  try {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:2000';
    const response = await axios.post(`${baseURL}/empresa-laboratorio`, { id_empresa, id_laboratorio });
    return response.data;
  } catch (error: any) {
    console.error('Error al asociar empresa-laboratorio:', error?.response?.data || error.message);
    // Re-lanzar con información del servidor cuando esté disponible
    const msg = error?.response?.data?.msg || error?.response?.data?.mensaje || error?.message || 'No se pudo asociar la empresa con los laboratorios';
    throw new Error(msg);
  }
};

// Agregar producto (uso sencillo desde la UI)
export const addProducto = async (productoData: any): Promise<any> => {
  try {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:2000';
    const response = await axios.post(`${baseURL}/productos`, productoData);
    return response.data;
  } catch (error: any) {
    console.error('Error al agregar producto:', error?.response?.data || error.message);
    const msg = error?.response?.data?.mensaje || error?.response?.data?.msg || error?.message || 'No se pudo agregar el producto';
    throw new Error(msg);
  }
};

// Obtener todos los roles
export const fetchRoles = async (): Promise<Rol[]> => {
  try {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:2000';
    const response = await axios.get(`${baseURL}/rol`);
    return response.data.roles || response.data;
  } catch (error) {
    console.error('Error al obtener roles:', error);
    throw new Error('No se pudo obtener los roles');
  }
};