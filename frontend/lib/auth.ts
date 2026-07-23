import { getApiBaseUrl } from "./apiBase";

export interface AuthUser {
  id: number;
  email: string;
}

interface AuthResult {
  user: AuthUser;
  session_token: string;
}

export class AuthError extends Error {}

async function postAuth(
  path: "login" | "signup",
  email: string,
  password: string,
): Promise<AuthResult> {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new AuthError("Unable to log in. Check your email and try again.");
  }

  return response.json();
}

export function login(email: string, password: string): Promise<AuthResult> {
  return postAuth("login", email, password);
}

export function signup(email: string, password: string): Promise<AuthResult> {
  return postAuth("signup", email, password);
}
