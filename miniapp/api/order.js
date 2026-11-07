export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return res.status(500).json({ error: "DB sozlanmagan" });
  try {
    const o = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (!o || o.type !== "order" || !o.phone) return res.status(400).json({ error: "noto'g'ri buyurtma" });
    const payload = {
      id: o.id, tg_user_id: o.tg_user_id || null, name: o.name, phone: o.phone,
      mode: o.mode, addr: o.addr, pay: o.pay, items: o.items, sum: o.sum,
      status: "Yangi", created_at: new Date().toISOString(),
    };
    const r = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json", Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const t = await r.text();
      return res.status(r.status).json({ error: "DB xato", detail: t.slice(0, 300) });
    }
    const row = (await r.json())[0];
    return res.status(201).json({ ok: true, id: row.id });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
