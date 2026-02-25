"use client";

import { createContext, useContext, useState } from "react";

interface AuthContextType {
  role: "manager" | "supervisor";
  setRole: (role: "manager" | "supervisor") => void;
}

const AuthContext = createContext<AuthContextType>({
  role: "supervisor",
  setRole: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<"manager" | "supervisor">(
    (localStorage.getItem("role") as any) || "supervisor"
  );

  const updateRole = (newRole: "manager" | "supervisor") => {
    localStorage.setItem("role", newRole);
    setRole(newRole);
  };

  return (
    <AuthContext.Provider value={{ role, setRole: updateRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);