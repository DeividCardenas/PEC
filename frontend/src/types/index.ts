// ==================== AUTH TYPES ====================

export interface User {
  id: number | null;
  email: string | null;
  rol: string | null;
  permisos: string[];
}

export interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  user: User;
  setUser: (user: User) => void;
  logout: () => void;
}

// ==================== PRODUCTO TYPES ====================

export interface Laboratorio {
  id_laboratorio: number;
  nombre: string;
}

export interface Producto {
  id_producto: number;
  cum: string;
  descripcion: string;
  concentracion?: string;
  presentacion?: string;
  registro_sanitario?: string;
  regulacion?: string;
  codigo_barras?: string;
  precio_unidad: number | string;
  precio_presentacion: number | string;
  laboratorio?: Laboratorio;
}

export interface ProductoResponse {
  totalProductos: number;
  totalPaginas: number;
  paginaActual: number;
  tamanoPagina: number;
  productos: Producto[];
}

export interface ProductParams {
  page?: number;
  limit?: number;
  cum?: string;
  descripcion?: string;
  concentracion?: string;
  registro_sanitario?: string;
  presentacion?: string;
  regulacion?: string;
  codigo_barras?: string;
  id_laboratorio?: number;
  con_regulacion?: 'regulados' | 'no_regulados';
  campos?: string;
}

// ==================== EMPRESA TYPES ====================

export interface Empresa {
  id_empresa: number;
  nombre: string;
  laboratorios?: Laboratorio[];
  tarifarios?: Tarifario[];
}

export interface EmpresaResponse {
  total: number;
  page: number;
  limit: number;
  data: Empresa[];
}

export interface EmpresaParams {
  page?: number;
  limit?: number;
  nombre?: string;
}

// ==================== LABORATORIO TYPES ====================

export interface LaboratorioResponse {
  total: number;
  page: number;
  limit: number;
  data: Laboratorio[];
  totalPages?: number;
  totalPaginas?: number;
}

export interface LaboratorioParams {
  page?: number;
  limit?: number;
  nombre?: string;
  empresa?: string;
}

// ==================== EPS TYPES ====================

export interface EPS {
  id_eps: number;
  nombre: string;
}

export interface EPSResponse {
  total: number;
  page: number;
  limit: number;
  eps: EPS[];
  totalPages?: number;
  totalPaginas?: number;
}

export interface EPSParams {
  page?: number;
  limit?: number;
  nombre?: string;
}

// ==================== TARIFARIO TYPES ====================

export interface Tarifario {
  id_tarifario: number;
  nombre: string;
  descripcion?: string;
  empresa?: Empresa;
  eps?: EPS;
}

export interface TarifarioResponse {
  tarifario: Tarifario;
  productos: Producto[];
  paginaActual: number;
  totalPaginas: number;
  totalProductos: number;
}

export interface TarifariosListResponse {
  tarifarios: Tarifario[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==================== PROVEEDOR TYPES ====================

export interface Proveedor {
  id_proveedor: number;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
}

export interface ProviderResponse {
  proveedores: Proveedor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==================== USUARIO/ADMIN TYPES ====================

export interface Usuario {
  id_usuario: number;
  username: string;
  email: string;
  rol: {
    id_rol: number;
    nombre: string;
  };
}

export interface UsuarioResponse {
  usuarios: Usuario[];
  paginaActual: number;
  totalPaginas: number;
  total: number;
}

// ==================== PAGINATION TYPES ====================

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

// ==================== MODAL TYPES ====================

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
