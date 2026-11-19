// iiko Cloud API connection check. Diagnostika uchun: token, tashkilotlar,
// terminal guruhlari. Hech qanday maxfiy qiymatni javobga chiqarmaydi.
import { cors } from './_verify.js';

const BASE = (process.env.IIKO_BASE_URL || 'https://api-ru.iiko.services').replace(/\/$/, '');

function mask(v) { return v ? v.slice(0, 4) + '…' : null; }

async function post(path, token, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body || {}),
  });
  let data = null;
  try { data = await res.json(); } catch { /* no body */ }
  return { status: res.status, data };
}

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const env = {
    iikoApiLoginSet: !!process.env.IIKO_API_LOGIN,
    iikoOrganizationIdSet: !!process.env.IIKO_ORGANIZATION_ID,
    iikoTerminalGroupIdSet: !!process.env.IIKO_TERMINAL_GROUP_ID,
    baseUrl: BASE,
  };

  if (!env.iikoApiLoginSet) {
    return res.status(200).json({ ok: false, stage: 'env', env, error: 'IIKO_API_LOGIN is not set in the Vercel environment variables' });
  }

  // 1) Token: v1 birinchi, agar kalit faqat v2 bo'lsa v2 ga o'tamiz
  const v1 = await post('/api/1/access_token', null, { apiLogin: process.env.IIKO_API_LOGIN });
  let tok = v1;
  let version = 'v1';
  if (v1.status !== 200 || !v1.data || !v1.data.token) {
    const v2 = await post('/api/v2/access_token', null, { apiLogin: process.env.IIKO_API_LOGIN });
    if (v2.status === 200 && v2.data && v2.data.token) { tok = v2; version = 'v2'; }
    else {
      return res.status(200).json({
        ok: false, stage: 'token', env,
        error: 'iiko rejected the apiLogin on both v1 and v2 token endpoints',
        v1: { httpStatus: v1.status, detail: v1.data && (v1.data.errorDescription || v1.data.description || JSON.stringify(v1.data)) || undefined },
        v2: { httpStatus: v2.status, detail: v2.data && (v2.data.errorDescription || v2.data.description || JSON.stringify(v2.data)) || undefined },
      });
    }
  }
  if (tok.status !== 200 || !tok.data || !tok.data.token) {
    return res.status(200).json({
      ok: false, stage: 'token', env,
      httpStatus: tok.status,
      error: 'iiko rejected the apiLogin (token request failed)',
      detail: tok.data && tok.data.errorDescription ? tok.data.errorDescription : undefined,
    });
  }
  const token = tok.data.token;

  // 2) Tashkilotlar
  const orgs = await post('/api/1/organizations', token, { organizationIds: null, returnAdditionalInfo: false });
  const orgList = (orgs.status === 200 && Array.isArray(orgs.data))
    ? orgs.data.map((o) => ({ id: o.id, name: o.name }))
    : [];

  // 3) Terminal guruhlar (faqat agar IIKO_ORGANIZATION_ID berilgan bo'lsa)
  let terminals = [];
  let terminalError;
  if (env.iikoOrganizationIdSet) {
    const tg = await post('/api/1/terminal_groups', token, { organizationIds: [process.env.IIKO_ORGANIZATION_ID] });
    if (tg.status === 200 && tg.data && Array.isArray(tg.data.terminalGroups)) {
      terminals = tg.data.terminalGroups.flatMap((g) => (g.items || []).map((t) => ({ id: t.id, name: t.name })));
    } else if (tg.status !== 200) {
      terminalError = `terminal_groups failed: HTTP ${tg.status}`;
    }
  }

  const orgMatched = env.iikoOrganizationIdSet && orgList.some((o) => o.id === process.env.IIKO_ORGANIZATION_ID);

  return res.status(200).json({
    ok: true,
    stage: 'done',
    env,
    apiLoginMasked: mask(process.env.IIKO_API_LOGIN),
    organizationIdMasked: env.iikoOrganizationIdSet ? mask(process.env.IIKO_ORGANIZATION_ID) : null,
    organizations: orgList,
    organizationIdMatches: env.iikoOrganizationIdSet ? orgMatched : null,
    terminalGroups: terminals,
    terminalError,
  });
}
