import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, AlertCircle, Hospital } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { loginUser } from "../../services/Auth/loginService";
import Button from "../../components/Button";

const Login: React.FC = () => {
  const { setToken, setUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { token, usuario } = await loginUser(email, password);

      setToken(token);
      setUser(usuario);

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDEzNGg2MHYzMEgzNnptMzAgMzBoMzB2MzBoLTMwem0wIDBoMzB2MzBoLTMweiIvPjwvZz48L2c+PC9zdmc+')] opacity-10"></div>

      {/* Left Section - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center text-center p-12 relative z-10">
        <div className="animate-fade-in">
          <div className="mb-8 inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-sm rounded-3xl shadow-glow-primary">
            <Hospital size={48} className="text-white" />
          </div>
          <h1 className="text-white text-6xl font-bold mb-4 tracking-tight">
            Pharma Elite Care
          </h1>
          <p className="text-primary-100 text-xl max-w-md mx-auto leading-relaxed">
            Sistema integral para la gestión eficiente de compras y entregas farmacéuticas
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6 max-w-lg mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold text-white mb-1">24/7</div>
              <div className="text-primary-200 text-sm">Disponibilidad</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold text-white mb-1">100%</div>
              <div className="text-primary-200 text-sm">Seguro</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold text-white mb-1">RF010</div>
              <div className="text-primary-200 text-sm">Completo</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 md:p-12 relative z-10">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-strong p-8 md:p-10 animate-slide-up">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex lg:hidden items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
                <Hospital size={32} className="text-primary-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Bienvenido</h2>
              <p className="text-gray-600 mt-2">Inicia sesión para continuar</p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-slide-down">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="text-gray-400" size={20} />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="text-gray-400" size={20} />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                className="mt-6"
              >
                Iniciar sesión
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-500">
                Sistema PEC - Pharma Elite Care
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
