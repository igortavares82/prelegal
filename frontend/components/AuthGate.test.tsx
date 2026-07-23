import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "@/lib/auth";
import AuthGate from "./AuthGate";

const login = vi.fn();
vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    login: (...args: [string, string]) => login(...args),
  };
});

const user: AuthUser = { id: 7, email: "jane@example.com" };
const STORAGE_KEY = "prelegal.auth.user";

describe("AuthGate", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    login.mockReset();
  });

  it("shows the login screen when no session is stored", () => {
    render(
      <AuthGate>
        <div>Protected content</div>
      </AuthGate>,
    );
    expect(
      screen.getByRole("heading", { name: "Log in to Prelegal" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("renders children directly when a session is already stored", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    render(
      <AuthGate>
        <div>Protected content</div>
      </AuthGate>,
    );
    expect(screen.getByText("Protected content")).toBeInTheDocument();
    expect(screen.getByText(user.email)).toBeInTheDocument();
  });

  it("ignores corrupt stored sessions and shows the login screen", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not-json");
    render(
      <AuthGate>
        <div>Protected content</div>
      </AuthGate>,
    );
    expect(
      screen.getByRole("heading", { name: "Log in to Prelegal" }),
    ).toBeInTheDocument();
  });

  it("persists the session and reveals children after a successful login", async () => {
    login.mockResolvedValue({ user, session_token: "tok" });
    const u = userEvent.setup();

    render(
      <AuthGate>
        <div>Protected content</div>
      </AuthGate>,
    );

    await u.type(screen.getByLabelText("Email"), user.email);
    await u.type(screen.getByLabelText("Password"), "hunter2");
    await u.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => expect(screen.getByText("Protected content")).toBeInTheDocument());
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)).toEqual(user);
  });

  it("logs out, clearing the stored session and showing the login screen again", async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    const u = userEvent.setup();

    render(
      <AuthGate>
        <div>Protected content</div>
      </AuthGate>,
    );
    await u.click(screen.getByRole("button", { name: "Log out" }));

    expect(
      screen.getByRole("heading", { name: "Log in to Prelegal" }),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
