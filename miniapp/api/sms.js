// SMS adapter: SMS_PROVIDER = mock | eskiz
// Eskiz: shartnoma bitgach ESKIZ_EMAIL + ESKIZ_PASSWORD env qo'yiladi, token avtomatik olinadi.
let eskizToken = null;
async function getEskizToken() {
  if (eskizToken) return eskizToken;
  const r = await fetch('https://notify.eskiz.uz/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.ESKIZ_EMAIL, password: process.env.ESKIZ_PASSWORD }),
  });
  const j = await r.json().catch(() => ({}));
  eskizToken = j?.data?.token || null;
  return eskizToken;
}

export async function sendSms(phone, text) {
  const provider = (process.env.SMS_PROVIDER || 'mock').trim().toLowerCase();
  if (provider === 'mock' || !provider) {
    console.log('[sms mock]', phone, text);
    return { provider: 'mock', sent: true };
  }
  if (provider === 'eskiz') {
    if (!process.env.ESKIZ_EMAIL || !process.env.ESKIZ_PASSWORD) return { provider, sent: false, reason: 'unconfigured' };
    try {
      const token = await getEskizToken();
      if (!token) return { provider, sent: false, reason: 'no_token' };
      const r = await fetch('https://notify.eskiz.uz/api/message/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mobile_phone: String(phone).replace(/^\+?998/, ''), message: text, from: '4545' }),
      });
      return { provider, sent: r.ok };
    } catch (e) {
      console.error('eskiz send', e?.message);
      return { provider, sent: false };
    }
  }
  return { provider: 'mock', sent: false };
}
