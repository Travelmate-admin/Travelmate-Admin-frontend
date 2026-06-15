import { createContext, useContext, useEffect, useState } from "react";
import { adminLogin, adminVerify } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => localStorage.getItem("admin_user") || null);
  const [booting, setBooting] = useState(true);

  // Validate any stored token on first load
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      setBooting(false);
      return;
    }
    adminVerify()
      .then((r) => setUser(r.admin?.username || user))
      .catch(() => {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        setUser(null);
      })
      .finally(() => setBooting(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (username, password) => {
    const res = await adminLogin(username, password);
    localStorage.setItem("admin_token", res.token);
    localStorage.setItem("admin_user", res.username);
    setUser(res.username);
    return res;
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, booting, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
