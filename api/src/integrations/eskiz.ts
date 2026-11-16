// Eskiz SMS adapter. Docs: notify.eskiz.uz
// Auth: POST /auth/login {email,password} -> bearer token (auto-refresh on 401).
// Used to confirm the ordering phone number is real: code sent, user types it
// back, order proceeds. The code store below is in-memory; move it to a DB
// table (or Redis) when the app runs on more than one process.
import type { SmsProvider } from './types.js';
import type { IntegrationResult } from '../../../shared/types.js';
import { env } from '../env.js';

interface CodeEntry { code: string; expiresAt: number; attempts: number; }

export class EskizProvider implements SmsProvider {
  readonly name = 'eskiz';
  private token: { value: string; } | null = null;
  private codes = new Map<string, CodeEntry>();
  isConfigured() { return env.eskiz.enabled && !!env.eskiz.email && !!env.eskiz.password && !!env.eskiz.sender; }

  private async getToken(force = false): Promise<string> {
    if (this.token && !force) return this.token.value;
    const res = await fetch(`${env.eskiz.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: env.eskiz.email, password: env.eskiz.password }),
    });
    if (!res.ok) throw new Error(`eskiz login failed: HTTP ${res.status}`);
    const data = (await res.json()) as { data: { token: string } };
    this.token = { value: data.data.token };
    return data.data.token;
  }

  async send(phone: string, text: string): Promise<IntegrationResult<null>> {
    if (!this.isConfigured()) return { ok: false, disabled: true, error: 'eskiz not configured' };
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const token = await this.getToken(attempt > 0);
        const res = await fetch(`${env.eskiz.baseUrl}/message/sms/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ mobile_phone: phone, message: text, from: env.eskiz.sender }),
        });
        if (res.status === 401) continue; // token expired, refresh and retry once
        if (!res.ok) return { ok: false, error: `eskiz send failed: HTTP ${res.status}` };
        return { ok: true, data: null };
      } catch (e) {
        return { ok: false, error: `eskiz send error: ${String(e)}` };
      }
    }
    return { ok: false, error: 'eskiz send failed: token refresh did not help' };
  }

  async sendCode(phone: string): Promise<IntegrationResult<null>> {
    if (!this.isConfigured()) return { ok: false, disabled: true, error: 'eskiz not configured' };
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const prev = this.codes.get(phone);
    if (prev && Date.now() < prev.expiresAt - 55_000) {
      return { ok: false, error: 'eskiz code: wait a minute before requesting again' };
    }
    this.codes.set(phone, { code, expiresAt: Date.now() + 5 * 60 * 1000, attempts: 0 });
    return this.send(phone, `Tekit Sushi: tasdiqlash kodi ${code}. Kodni hech kimga bermang.`);
  }

  verifyCode(phone: string, code: string): IntegrationResult<null> {
    if (!this.isConfigured()) return { ok: false, disabled: true, error: 'eskiz not configured' };
    const entry = this.codes.get(phone);
    if (!entry || Date.now() > entry.expiresAt) return { ok: false, error: 'eskiz code: expired, request a new one' };
    entry.attempts += 1;
    if (entry.attempts > 5) { this.codes.delete(phone); return { ok: false, error: 'eskiz code: too many attempts' }; }
    if (entry.code !== code.trim()) return { ok: false, error: 'eskiz code: wrong code' };
    this.codes.delete(phone); // single use
    return { ok: true, data: null };
  }
}
