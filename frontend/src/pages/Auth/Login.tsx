import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { loginUser } from "../../services/Auth/loginService";


const Login: React.FC = () => {
  const { setToken, setUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Limpiar error antes de hacer la petición

    try {
      const { token, usuario } = await loginUser(email, password);

      // El AuthProvider se encarga de guardar token y user en localStorage
      setToken(token);
      setUser(usuario);

      // Guardar tarifarios (esto no está gestionado por el AuthProvider)
      if (usuario.tarifarios) {
        localStorage.setItem("tarifarios", JSON.stringify(usuario.tarifarios));
      }

      navigate("/Menu");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Correo o contraseña incorrectos");
      } else {
        setError("Correo o contraseña incorrectos");
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-sky-900">
      {/* Sección Izquierda (Logo) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center text-center p-10">
        <h2 className="text-white text-5xl font-bold">Pharma Elite Care</h2>
        <p className="text-white text-lg mt-4">
          Inicia sesión para acceder a tu cuenta y gestionar tu negocio de manera eficiente.
        </p>
      </div>

      {/* Sección Derecha (Formulario) */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md bg-neutral-100 p-8 rounded-xl shadow-lg">
          <h2 className="text-3xl font-semibold text-center text-[#16347C]">Bienvenido a PEC</h2>
          <p className="text-gray-600 text-center mt-2">Inicia sesión con tus credenciales</p>

          <form onSubmit={handleLogin} className="mt-6 space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ingresa tu correo"
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            
            <button
              type="submit"
              className="w-full py-3 bg-[#16347C] text-white font-semibold rounded-lg shadow-md hover:bg-[#122A5D] transition-all transform hover:scale-105"
            >
              Iniciar sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
