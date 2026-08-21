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

/** Public Cloudflare R2 CDN for uploaded images/documents. */
export const R2_PUBLIC_BASE_URL = (
  process.env.REACT_APP_R2_PUBLIC_URL ||
  'https://pub-ae342959899f40b29244cada8abbbafe.r2.dev'
).replace(/\/$/, '');

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

/**
 * Rewrite private R2 API host URLs (…r2.cloudflarestorage.com/bucket/key)
 * to the public r2.dev base so browsers can load objects without signed access.
 */
export const toPublicR2Url = (pathOrUrl) => {
  if (!pathOrUrl) return '';
  const raw = String(pathOrUrl).trim();

  const privateMatch = raw.match(
    /^https?:\/\/[^/]+\.r2\.cloudflarestorage\.com\/[^/]+\/(.+)$/i
  );
  if (privateMatch) {
    return `${R2_PUBLIC_BASE_URL}/${privateMatch[1].replace(/^\/+/, '')}`;
  }

  if (/^https?:\/\/pub-[^/]+\.r2\.dev\//i.test(raw)) {
    return raw;
  }

  // Bare object key from storage (e.g. verification-documents/uuid.pdf)
  if (!/^https?:\/\//i.test(raw) && !raw.startsWith('/') && raw.includes('/')) {
    return `${R2_PUBLIC_BASE_URL}/${raw.replace(/^\/+/, '')}`;
  }

  return raw;
};

/** Absolute URL for API assets such as /uploads/... and public R2 media. */
export const resolveApiUrl = (pathOrUrl) => {
  if (!pathOrUrl) return '';

  const publicR2 = toPublicR2Url(pathOrUrl);
  if (/^https?:\/\//i.test(publicR2)) return publicR2;

  const path = publicR2.startsWith('/') ? publicR2 : `/${publicR2}`;
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
