// Ported from web/api/_notify.js (behavior-identical).
// Customer notification over Telegram (free; SMS is only the number check).
export async function notifyUser(tgUserId: number | string, text: string): Promise<{ sent: boolean }> {
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
    console.error('notifyUser', (e as Error)?.message);
    return { sent: false };
  }
}
