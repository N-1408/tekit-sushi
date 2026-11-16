// Ported from web/api/_verify.js (behavior-identical).
// Telegram initData verification (HMAC-SHA256 with BOT_TOKEN), IP rate
// limiting and admin fail guard, in-memory (fine for one VPS process).
import crypto from 'node:crypto';
import type { FastifyRequest } from 'fastify';
import { env } from '../env.js';

export function verifyInitData(initData?: string): { id: number; [k: string]: unknown } | null {
  if (!initData || typeof initData !== 'string') return null;
  const token = env.botToken;
  if (!token) return null;
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return null;
    params.delete('hash');
    params.delete('sig');
    const dataCheck = [...params.entries()].map(([k, v]) => `${k}=${v}`).sort().join('\n');
    const secret = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
    const h = crypto.createHmac('sha256', secret).update(dataCheck).digest('hex');
    if (h !== hash) return null;
    const authDate = Number(params.get('auth_date') || 0);
    if (!authDate || Date.now() / 1000 - authDate > 86400) return null;
    let user: unknown = null;
    try { user = JSON.parse(params.get('user') || 'null'); } catch { /* keep null */ }
    if (!user || typeof (user as { id?: unknown }).id !== 'number') return null;
    return user as { id: number; [k: string]: unknown };
  } catch {
    return null;
  }
}

export function tgUserFrom(req: FastifyRequest) {
  return verifyInitData(req.headers['x-init-data'] as string | undefined);
}

const ipOf = (req: FastifyRequest) =>
  String((req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || 'x').split(',')[0].trim();

const hits = new Map<string, number[]>();
export function rateLimit(req: FastifyRequest, key: string, max: number, windowMs: number): boolean {
  const k = `${key}:${ipOf(req)}`;
  const now = Date.now();
  const arr = (hits.get(k) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) return false;
  arr.push(now);
  hits.set(k, arr);
  return true;
}

const fails = new Map<string, number[]>();
export function failGuard(req: FastifyRequest, key: string, max = 8, windowMs = 15 * 60 * 1000): boolean {
  const k = `${key}:${ipOf(req)}`;
  const now = Date.now();
  const arr = (fails.get(k) || []).filter((t) => now - t < windowMs);
  fails.set(k, arr);
  return arr.length >= max;
}
export function recordFail(req: FastifyRequest, key: string): void {
  const k = `${key}:${ipOf(req)}`;
  const arr = fails.get(k) || [];
  arr.push(Date.now());
  fails.set(k, arr);
}

// Origins allowed to call the API (comma-separated in env; defaults to the
// current Vercel app). One domain on the VPS adds app/api/admin subdomains here.
export const ALLOWED_ORIGINS = (process.env.WEBAPP_ORIGIN
  ? process.env.WEBAPP_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
  : ['https://tekit-sushi-miniapp.vercel.app']);
