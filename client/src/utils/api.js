/**
 * Production API URL helper.
 * - Dev: uses Vite proxy when VITE_API_URL is unset (relative /api paths)
 * - Same-origin deploy: leave VITE_API_URL empty — API + UI on one domain
 * - Split deploy: set VITE_API_URL=https://your-api-host in client/.env.production
 */
const _apiUrl = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || "";
export const API_BASE = (_apiUrl && _apiUrl !== "/") ? _apiUrl.replace(/\/$/, "") : "";
export const IS_PRODUCTION = typeof import.meta !== "undefined" && import.meta.env?.PROD === true;

export function apiUrl(path) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${normalized}` : normalized;
}

export async function parseJsonResponse(res) {
  const text = await res.text();
  const trimmed = text.trim();
  if (trimmed.startsWith("<") || trimmed.toLowerCase().startsWith("<!doctype")) {
    throw new Error(
      IS_PRODUCTION
        ? "Service unavailable. Please try again later."
        : "Backend not responding. Run 'npm start' from the project root."
    );
  }
  try {
    return trimmed ? JSON.parse(text) : {};
  } catch {
    throw new Error("Invalid response from server.");
  }
}
