import React, { useState, useEffect, useMemo } from "react";
import { AuthContext } from "./AuthContext";
import { User } from "../types";

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<User>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : { id: null, email: null, rol: null, permisos: [] };
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  useEffect(() => {
    if (user.id) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const logout = () => {
    setToken(null);
    setUser({ id: null, email: null, rol: null, permisos: [] });
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("tarifarios");
  };

  const value = useMemo(() => ({ token, setToken, user, setUser, logout }), [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
