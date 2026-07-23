/**
 * In the built container the frontend is served by the same FastAPI process
 * as the API (both on :8000), so a relative path is correct. Only when
 * running `next dev` on :3000 against a separately-running backend do we
 * need to point at it explicitly.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined" && window.location.port === "3000") {
    return "http://localhost:8000";
  }
  return "";
}
