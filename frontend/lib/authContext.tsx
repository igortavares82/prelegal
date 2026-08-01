"use client";

import { createContext, useContext } from "react";
import type { AuthUser } from "./auth";

export interface AuthSession {
  user: AuthUser;
  token: string;
  logout: () => void;
}

const AuthContext = createContext<AuthSession | null>(null);

export const AuthContextProvider = AuthContext.Provider;

/** Only usable below AuthGate, which is the sole provider of this context. */
export function useAuthSession(): AuthSession {
  const session = useContext(AuthContext);
  if (!session) {
    throw new Error("useAuthSession must be used within AuthGate");
  }
  return session;
}
