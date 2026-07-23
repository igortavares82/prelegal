import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthError, type AuthUser } from "@/lib/auth";
import LoginScreen from "./LoginScreen";

const login = vi.fn();
const signup = vi.fn();
vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    login: (...args: [string, string]) => login(...args),
    signup: (...args: [string, string]) => signup(...args),
  };
});

const user: AuthUser = { id: 1, email: "jane@example.com" };

describe("LoginScreen", () => {
  afterEach(() => {
    login.mockReset();
    signup.mockReset();
  });

  it("defaults to login mode", () => {
    render(<LoginScreen onLogin={vi.fn()} />);
    expect(
      screen.getByRole("heading", { name: "Log in to Prelegal" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log in" })).toBeInTheDocument();
  });

  it("submits email and password to login and calls onLogin with the returned user", async () => {
    const onLogin = vi.fn();
    login.mockResolvedValue({ user, session_token: "tok" });
    const u = userEvent.setup();

    render(<LoginScreen onLogin={onLogin} />);
    await u.type(screen.getByLabelText("Email"), "jane@example.com");
    await u.type(screen.getByLabelText("Password"), "hunter2");
    await u.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith("jane@example.com", "hunter2"),
    );
    expect(signup).not.toHaveBeenCalled();
    await waitFor(() => expect(onLogin).toHaveBeenCalledWith(user));
  });

  it("switches to signup mode and calls signup instead of login", async () => {
    const onLogin = vi.fn();
    signup.mockResolvedValue({ user, session_token: "tok" });
    const u = userEvent.setup();

    render(<LoginScreen onLogin={onLogin} />);
    await u.click(screen.getByRole("button", { name: "Need an account? Sign up" }));
    expect(
      screen.getByRole("heading", { name: "Create your Prelegal account" }),
    ).toBeInTheDocument();

    await u.type(screen.getByLabelText("Email"), "jane@example.com");
    await u.type(screen.getByLabelText("Password"), "hunter2");
    await u.click(screen.getByRole("button", { name: "Sign up" }));

    await waitFor(() =>
      expect(signup).toHaveBeenCalledWith("jane@example.com", "hunter2"),
    );
    expect(login).not.toHaveBeenCalled();
    await waitFor(() => expect(onLogin).toHaveBeenCalledWith(user));
  });

  it("shows an error and re-enables the submit button when the request fails", async () => {
    login.mockRejectedValue(new AuthError("Unable to log in. Check your email and try again."));
    const u = userEvent.setup();

    render(<LoginScreen onLogin={vi.fn()} />);
    await u.type(screen.getByLabelText("Email"), "jane@example.com");
    await u.type(screen.getByLabelText("Password"), "hunter2");
    await u.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to log in. Check your email and try again.",
    );
    expect(screen.getByRole("button", { name: "Log in" })).toBeEnabled();
  });
});
