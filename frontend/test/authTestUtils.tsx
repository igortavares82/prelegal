import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";
import { vi } from "vitest";
import { AuthContextProvider, type AuthSession } from "@/lib/authContext";

export const testAuthSession: AuthSession = {
  user: { id: 1, email: "jane@example.com" },
  token: "test-token",
  logout: vi.fn(),
};

/** Renders `ui` below a real AuthContext, for components that call useAuthSession(). */
export function renderWithAuth(ui: ReactElement, options?: RenderOptions): RenderResult {
  return render(
    <AuthContextProvider value={testAuthSession}>{ui}</AuthContextProvider>,
    options,
  );
}
