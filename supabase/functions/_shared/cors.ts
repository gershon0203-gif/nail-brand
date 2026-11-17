// CORS allowlist for the create-order Edge Function.
// FAIL CLOSED: a request from any origin not in these lists receives NO
// Access-Control-Allow-Origin header, so the browser blocks it.

const LOCAL_ORIGINS = new Set<string>([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
]);

// >>> ACTION REQUIRED BEFORE DEPLOYMENT <<<
// Replace the placeholder below with your real production frontend origin,
// e.g. 'https://norwood-co.vercel.app' or 'https://shop.yourdomain.com'.
// Include the exact scheme and host, with NO trailing slash.
const PRODUCTION_ORIGINS = new Set<string>([
  'https://YOUR_PRODUCTION_DOMAIN.example',
]);

const ALLOWED_ORIGINS = new Set<string>([...LOCAL_ORIGINS, ...PRODUCTION_ORIGINS]);

export function corsHeadersFor(req: Request): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  const origin = req.headers.get('origin');
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}
