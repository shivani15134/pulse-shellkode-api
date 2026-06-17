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

// Blocks open-redirect attempts — only same-app relative paths allowed
function sanitizeReturnTo(path?: string): string {
  if (!path) return '/taskboard';

  // If it's an absolute URL, only accept it when the origin matches the
  // configured FRONTEND_ORIGIN. This lets SPA frontends pass a full URL
  // while still preventing open redirects to arbitrary domains.
  if (path.includes('://')) {
    try {
      const url = new URL(path);
      const allowed = process.env.FRONTEND_ORIGIN ?? 'http://shivani.local.com:5173';
      if (url.origin === allowed) {
        // preserve path + search
        return url.pathname + url.search;
      }
      return '/taskboard';
    } catch {
      return '/taskboard';
    }
  }

  // Reject protocol-relative URLs and paths that don't start with '/'
  if (!path.startsWith('/') || path.startsWith('//')) return '/taskboard';

  return path;
}