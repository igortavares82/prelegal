"use client";

import { useEffect, useState, type ReactNode } from "react";
import { logout as logoutRequest, type AuthUser } from "@/lib/auth";
import { AuthContextProvider } from "@/lib/authContext";
import LoginScreen from "./LoginScreen";

const STORAGE_KEY = "prelegal.auth.session";

interface StoredSession {
  user: AuthUser;
  token: string;
}

interface AuthGateProps {
  children: ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const [session, setSession] = useState<StoredSession | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      // Reading localStorage (unavailable during the build-time prerender)
      // has to happen post-mount, so the login screen renders first and this
      // swaps in the persisted session right after — a deliberate one-time
      // extra render, not a synchronization loop.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSession(JSON.parse(stored));
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  function handleLogin(loggedIn: StoredSession) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedIn));
    setSession(loggedIn);
  }

  function handleLogout() {
    if (session) {
      void logoutRequest(session.token);
    }
    window.localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }

  if (!session) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-1 flex-col lg:min-h-0">
      <div className="flex shrink-0 items-center justify-end gap-3 px-6 pt-4 text-sm text-gray-text">
        <span>{session.user.email}</span>
        <button
          type="button"
          onClick={handleLogout}
          className="font-medium text-brand-blue hover:underline"
        >
          Log out
        </button>
      </div>
      <AuthContextProvider
        value={{ user: session.user, token: session.token, logout: handleLogout }}
      >
        {children}
      </AuthContextProvider>
    </div>
  );
}
