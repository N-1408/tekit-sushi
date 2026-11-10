// Mijozga Telegram xabari (bepul, SMS o'rniga asosiy kanal)
export async function notifyUser(tgUserId, text) {
  const token = process.env.BOT_TOKEN;
  if (!token || !tgUserId) return { sent: false };
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: tgUserId, text, parse_mode: 'HTML' }),
    });
    return { sent: r.ok };
  } catch (e) {
    console.error('notifyUser', e?.message);
    return { sent: false };
  }
}
