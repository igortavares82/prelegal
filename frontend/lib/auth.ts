import { getApiBaseUrl } from "./apiBase";

export interface AuthUser {
  id: number;
  email: string;
}

export interface AuthResult {
  user: AuthUser;
  session_token: string;
}

export class AuthError extends Error {}

async function readErrorDetail(response: Response): Promise<string | undefined> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "detail" in body) {
      const detail = (body as { detail: unknown }).detail;
      return typeof detail === "string" ? detail : undefined;
    }
  } catch {
    // Response wasn't JSON — fall through to the generic message.
  }
  return undefined;
}

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
    const detail = await readErrorDetail(response);
    throw new AuthError(detail ?? "Unable to log in. Check your email and try again.");
  }

  return response.json();
}

export function login(email: string, password: string): Promise<AuthResult> {
  return postAuth("login", email, password);
}

export function signup(email: string, password: string): Promise<AuthResult> {
  return postAuth("signup", email, password);
}

export async function logout(token: string): Promise<void> {
  await fetch(`${getApiBaseUrl()}/api/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {
    // Best-effort: the client forgets the token regardless of whether the
    // server-side session row was successfully deleted.
  });
}
