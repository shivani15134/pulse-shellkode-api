import * as crypto from 'crypto';

export function buildOAuthState(returnTo?: string): string {
  const csrf = crypto.randomBytes(16).toString('hex');
  const payload = JSON.stringify({ csrf, returnTo: sanitizeReturnTo(returnTo) });
  return Buffer.from(payload).toString('base64url');
}

export function parseOAuthState(state?: string): { csrf: string; returnTo: string } | null {
  if (!state) return null;
  try {
    const payload = JSON.parse(Buffer.from(state, 'base64url').toString('utf-8'));
    if (typeof payload.csrf !== 'string' || typeof payload.returnTo !== 'string') return null;
    return { csrf: payload.csrf, returnTo: sanitizeReturnTo(payload.returnTo) };
  } catch {
    return null;
  }
}

function sanitizeReturnTo(path?: string): string {
  if (!path) return '/tasks';
  if (path.includes('://')) {
    try {
      const url = new URL(path);
      const allowed = process.env.FRONTEND_ORIGIN ?? 'http://shivani.local.com:5173';
      if (url.origin === allowed) {
		console.log('SANITIZED url:', url);
        return url.pathname + url.search;
      }
      return '/tasks';
    } catch {
      return '/tasks';
    }
  }

  if (!path.startsWith('/') || path.startsWith('//')) return '/tasks';
  return path;
}