/**
 * API base URL for axios + socket.io.
 *
 * Single Render web service (recommended): leave REACT_APP_API_URL unset.
 * Browser talks to the SAME host for UI, /api, and /socket.io.
 *
 * Local CRA: uses http://localhost:5000
 * Optional split hosting: set REACT_APP_API_URL to the API origin
 */

const LOCAL_API = 'http://localhost:5000';

const normalizeBaseUrl = (value) => {
  if (value == null) return '';
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === '/') return '';
  return trimmed.replace(/\/$/, '');
};

export const getApiBaseUrl = () => {
  // Only use env when explicitly set (split services). Single-service: leave empty.
  const fromEnv = normalizeBaseUrl(process.env.REACT_APP_API_URL);
  if (fromEnv) return fromEnv;

  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

    // CRA local: API runs on :5000, UI on :3000
    if (process.env.NODE_ENV === 'development' && isLocalHost) {
      return LOCAL_API;
    }

    // Production single service / Docker / LAN proxy → same origin
    return '';
  }

  return LOCAL_API;
};

/** Absolute URL for API assets such as /uploads/... */
export const resolveApiUrl = (pathOrUrl) => {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  const base = getApiBaseUrl();

  if (!base) {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${path}`;
    }
    return path;
  }

  return `${base}${path}`;
};

export const isSecureAppContext = () =>
  typeof window === 'undefined' || window.isSecureContext;

export default getApiBaseUrl;
