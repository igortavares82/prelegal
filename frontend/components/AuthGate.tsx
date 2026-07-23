"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { AuthUser } from "@/lib/auth";
import LoginScreen from "./LoginScreen";

const STORAGE_KEY = "prelegal.auth.user";

interface AuthGateProps {
  children: ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      // Reading localStorage (unavailable during the build-time prerender)
      // has to happen post-mount, so the login screen renders first and this
      // swaps in the persisted session right after — a deliberate one-time
      // extra render, not a synchronization loop.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(JSON.parse(stored));
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  function handleLogin(loggedInUser: AuthUser) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  }

  function handleLogout() {
    window.localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-1 flex-col lg:min-h-0">
      <div className="flex shrink-0 items-center justify-end gap-3 px-6 pt-4 text-sm text-[#888888]">
        <span>{user.email}</span>
        <button
          type="button"
          onClick={handleLogout}
          className="font-medium text-[#209dd7] hover:underline"
        >
          Log out
        </button>
      </div>
      {children}
    </div>
  );
}
