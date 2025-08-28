import React, { createContext, useContext, useState } from "react";

type AuthCtx = { user: string | null; setUser: (u: string | null) => void };
const Ctx = createContext<AuthCtx>({ user: null, setUser: () => {} });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<string | null>(null);
  return <Ctx.Provider value={{ user, setUser }}>{children}</Ctx.Provider>;
};

export const useAuth = () => useContext(Ctx);