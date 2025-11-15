import { axiosInstance, setBaseURL } from "../Shared/axiosInstance";
import axios from "axios";

interface LoginResponse {
  usuario: {
    id_usuario: number;
    username: string;
    email: string;
    rol: string;
    permisos: string[];
    tarifarios: number[]; // Añadimos los tarifarios
  };
  userJWT: {
    token: string;
    expiresIn: string;
  };
}

export const loginUser = async (
  email: string,
  password: string
): Promise<{
  token: string;
  usuario: { 
    id: number; 
    username: string; 
    email: string; 
    rol: string; 
    permisos: string[];
    tarifarios: number[]; 
  };
}> => {
  setBaseURL("usuario"); // Ajuste de la base URL para autenticación

  try {
    const response = await axiosInstance.post<LoginResponse>("/login", { email, password });
    const { usuario, userJWT } = response.data;

    return {
      token: userJWT.token,
      usuario: {
        id: usuario.id_usuario,
        username: usuario.username,
        email: usuario.email,
        rol: usuario.rol,
        permisos: usuario.permisos,
        tarifarios: usuario.tarifarios, // Añadimos los tarifarios al objeto devuelto
      },
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data?.msg || "Error al iniciar sesión");
    } else {
      throw new Error("Error al iniciar sesión");
    }
  }
};

export const logoutUser = async (): Promise<void> => {
  setBaseURL("usuario");
  try {
    await axiosInstance.post("/logout");
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  }
};
