// /api/telegram — bot webhook handler, ported from web/api/telegram.js
// (behavior-identical). /start flow (language -> phone -> menu), /admin
// password (message deleted), shared-phone contact capture, and the legacy
// web_app_data order path. The mini app places real orders via /api/order.
import type { FastifyRequest, FastifyReply } from 'fastify';
import { pool } from '../db.js';
import { env } from '../env.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const TOKEN = env.botToken;
const WEBAPP_URL = env.webappUrl || 'https://tekit-sushi-miniapp.vercel.app/';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const T: Record<string, any> = {
  uz: {
    hello: (n: string) => `👋 Assalomu alaykum, <b>${n}</b>!\n\n🐳 <b>Tekit Sushi</b>ga xush kelibsiz!\n\nAvval tilni tanlang 👇`,
    askLang: 'Tilni tanlang 👇',
    askContact: (n: string) => `📱 <b>${n}</b>, buyurtmani tez rasmiylashtirish uchun raqamingizni ulashing.\n\nBosing — raqamingizni o'zimiz olamiz, hech narsa yozib qolmaysiz 👇`,
    skip: 'Keyinroq 👋',
    contactBtn: '📱 Raqamni ulashish',
    welcome: (n: string) =>
      `🍣 <b>${n}, tanishganimizdan xursandmiz!</b>\n\n` +
      `Sentimental gap yo'q: bir marta tatib ko'rsang, muntazam mijozga aylanasan 😉\n\n` +
      `🥇 <i>Bizning lososimiz bilan munosabat jiddiy va uzoq muddatli.</i>\n` +
      `🥢 <i>Rollar pishgan vaqtda sevgi ham pishadi.</i>\n` +
      `🍚 <i>Bir dona sushi — ming sari hikoya.</i>\n\n` +
      `🛵 Yetkazish: 30–45 daqiqa ichida, issiq va toza\n` +
      `👨‍🍳 Har bir set qo'lda, buyurtma olganda tayyorlanadi\n\n` +
      `Menyuni oching va o'zingizni mukofotlang 🎁`,
    menuBtn: '🍱 Menyuni ochish',
    gotContact: (n: string, p: string) => `✅ Rahmat, <b>${n}</b>! Raqamingiz: <b>${p}</b>\n\nEndi eng qiziq qism — taom tanlash! 👇`,
    noContact: "Mayli, raqamsiz ham buyurtma berasiz 🙂 Menyu tayyor!",
    adminPrompt: '🔐 Admin parolini /admin <parol> shaklida yuboring. Parolni yozgan xabaringiz darhol o\u02bbchiriladi.',
    adminOk: '🔓 Siz admin sifatida kirdingiz! Pastdagi tugma orqali panelni oching.',
    adminErr: '❌ Parol xato.',
    adminBtn: '🔓 Admin panel',
  },
  ru: {
    hello: (n: string) => `👋 Здравствуйте, <b>${n}</b>!\n\nДобро пожаловать в <b>Tekit Sushi</b>!\n\nСначала выберите язык 👇`,
    askLang: 'Выберите язык 👇',
    askContact: (n: string) => `📱 <b>${n}</b>, чтобы оформить заказ быстро, поделитесь номером телефона.\n\nНажмите кнопку — номер возьмём сами, писать ничего не нужно 👇`,
    skip: 'Позже 👋',
    contactBtn: '📱 Поделиться номером',
    welcome: (n: string) =>
      `🍣 <b>${n}, рад знакомству!</b>\n\n` +
      `Сентиментов нет: попробуете один раз — станете постоянным гостем 😉\n\n` +
      `🥇 <i>Наши отношения с лососем — серьёзные и долгосрочные.</i>\n` +
      `🥢 <i>Роллы готовятся — и любовь созревает.</i>\n` +
      `🍚 <i>Одна порция суши — тысяча историй.</i>\n\n` +
      `🛵 Доставка: 30–45 минут, горячей и аккуратно\n` +
      `👨‍🍳 Каждый сет готовится вручную после заказа\n\n` +
      `Открывайте меню и побалуйте себя 🎁`,
    menuBtn: '🍱 Открыть меню',
    gotContact: (n: string, p: string) => `✅ Спасибо, <b>${n}</b>! Ваш номер: <b>${p}</b>\n\nТеперь самое вкусное — выбор блюд! 👇`,
    noContact: 'Хорошо, закажем и без номера 🙂 Меню готово!',
    adminPrompt: '🔐 Отправьте пароль админа в формате /admin <пароль>. Ваше сообщение с паролём сразу удалится.',
    adminOk: '🔓 Вы вошли как администратор! Откройте панель кнопкой ниже.',
    adminErr: '❌ Неверный пароль.',
    adminBtn: '🔓 Админ панель',
  },
  en: {
    hello: (n: string) => `👋 Hello, <b>${n}</b>!\n\nWelcome to <b>Tekit Sushi</b>!\n\nFirst, pick your language 👇`,
    askLang: 'Choose a language 👇',
    askContact: (n: string) => `📱 <b>${n}</b>, to make checkout quick, please share your phone number.\n\nOne tap — we'll grab the number ourselves, nothing to type 👇`,
    skip: 'Later 👋',
    contactBtn: '📱 Share number',
    welcome: (n: string) =>
      `🍣 <b>${n}, great to meet you!</b>\n\n` +
      `No sentimental fluff: try us once and you're a regular 😉\n\n` +
      `🥇 <i>Our relationship with salmon is serious and long-term.</i>\n` +
      `🥢 <i>While the rolls set, the love sets too.</i>\n` +
      `🍚 <i>One piece of sushi, a thousand stories.</i>\n\n` +
      `🛵 Delivery: 30–45 minutes, hot and neat\n` +
      `👨‍🍳 Every set is made by hand, after you order\n\n` +
      `Open the menu and treat yourself 🎁`,
    menuBtn: '🍱 Open the menu',
    gotContact: (n: string, p: string) => `✅ Thanks, <b>${n}</b>! Number: <b>${p}</b>\n\nNow the tasty part — picking dishes! 👇`,
    noContact: "No worries, you can order without a number 🙂 Menu's ready!",
    adminPrompt: '🔐 Send the admin password as /admin <password>. Your message with the password is deleted right away.',
    adminOk: '🔓 You are in as admin! Open the panel with the button below.',
    adminErr: '❌ Wrong password.',
    adminBtn: '🔓 Admin panel',
  },
};
const t = (u: Any) => T[u?.lang] || T.uz;

const langKeyboard = () => ({ inline_keyboard: [
  [{ text: "🇺🇿 O'zbekcha", callback_data: 'lang:uz' }],
  [{ text: '🇷🇺 Русский', callback_data: 'lang:ru' }],
  [{ text: '🇬🇧 English', callback_data: 'lang:en' }],
] });
const contactKeyboard = (u: Any) => ({ keyboard: [[{ text: u.contactBtn, request_contact: true }], [{ text: u.skip }]], resize_keyboard: true, one_time_keyboard: true });
const menuKeyboard = (u: Any) => ({ inline_keyboard: [[{ text: u.menuBtn, web_app: { url: WEBAPP_URL } }]] });

const api = async (method: string, body?: Record<string, unknown>) => {
  try {
    const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}),
    });
    return (await r.json().catch(() => null)) as Any;
  } catch { return null; }
};

const del = (chat_id: number | string, message_id: number, delay = 0) => {
  const run = () => api('deleteMessage', { chat_id, message_id }).catch(() => {});
  if (delay) setTimeout(run, delay).unref?.(); else run();
};

const getUser = async (id: number): Promise<Any> => {
  try { const r = await pool.query('SELECT * FROM bot_users WHERE tg_id=$1', [id]); return r.rows[0] || null; } catch { return null; }
};
const upsertUser = async (id: number, name: string, username?: string, fields: Record<string, unknown> = {}) => {
  try {
    await pool.query(
      `INSERT INTO bot_users (tg_id, name, username, lang, phone)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (tg_id) DO UPDATE SET
         name = COALESCE(EXCLUDED.name, bot_users.name),
         username = COALESCE(EXCLUDED.username, bot_users.username),
         lang = COALESCE(EXCLUDED.lang, bot_users.lang),
         phone = COALESCE(EXCLUDED.phone, bot_users.phone)`,
      [id, fields.name ?? name, fields.username ?? username, fields.lang ?? null, fields.phone ?? null]);
  } catch { /* keep silent */ }
};

let roleCol: Promise<void> | null = null;
const ensureRoleCol = () => {
  if (!roleCol) roleCol = pool.query('ALTER TABLE bot_users ADD COLUMN IF NOT EXISTS role text').then(() => undefined).catch(() => undefined);
  return roleCol;
};

async function handleUpdate(u: Any) {
  if (u.message) {
    const m = u.message, from = m.from || {}, chat = m.chat || {};
    if (m.text && (m.text === '/start' || m.text.startsWith('/start '))) {
      const dbUser = await getUser(from.id);
      const tr = t(dbUser);
      await upsertUser(from.id, from.first_name || 'Siz', from.username);
      if (!dbUser || !dbUser.lang) {
        return api('sendMessage', { chat_id: chat.id, text: tr.hello(from.first_name ?? 'Siz'), parse_mode: 'HTML', reply_markup: langKeyboard() });
      }
      if (!dbUser.phone) {
        return api('sendMessage', { chat_id: chat.id, text: tr.askContact(from.first_name ?? 'Siz'), parse_mode: 'HTML', reply_markup: contactKeyboard(tr) });
      }
      return api('sendMessage', { chat_id: chat.id, text: tr.welcome(from.first_name ?? 'Siz'), parse_mode: 'HTML', reply_markup: menuKeyboard(tr) });
    }
    if (m.text && m.text.startsWith('/admin')) {
      del(chat.id, m.message_id);
      const parts = m.text.trim().split(/\s+/);
      const pass = parts.slice(1).join(' ');
      if (!pass) {
        const tr = t(await getUser(from.id));
        const r = await api('sendMessage', { chat_id: chat.id, text: tr.adminPrompt });
        if (r?.result?.message_id) del(chat.id, r.result.message_id, 30000);
        return;
      }
      const tr = t(await getUser(from.id));
      if (process.env.ADMIN_PASSWORD && pass === process.env.ADMIN_PASSWORD) {
        await ensureRoleCol();
        await upsertUser(from.id, from.first_name || 'Siz', from.username);
        try { await pool.query(`UPDATE bot_users SET role='admin' WHERE tg_id=$1`, [from.id]); } catch { /* keep silent */ }
        const adminUrl = (WEBAPP_URL || 'https://tekit-sushi-miniapp.vercel.app/').replace(/\/?$/, '/') + 'admin';
        return api('sendMessage', { chat_id: chat.id, text: tr.adminOk, reply_markup: { inline_keyboard: [[{ text: tr.adminBtn, web_app: { url: adminUrl } }]] } });
      }
      const r = await api('sendMessage', { chat_id: chat.id, text: tr.adminErr });
      if (r?.result?.message_id) del(chat.id, r.result.message_id, 15000);
      return;
    }
    if (m.text) {
      const skips = Object.values(T).map((l) => l.skip);
      if (skips.includes(m.text)) {
        const tr = t(await getUser(from.id));
        return api('sendMessage', { chat_id: chat.id, text: tr.welcome(from.first_name ?? 'Siz'), parse_mode: 'HTML', reply_markup: menuKeyboard(tr) });
      }
    }
    if (m.contact && m.contact.phone_number && (!m.contact.user_id || m.contact.user_id === from.id)) {
      const c = m.contact;
      await upsertUser(c.user_id ?? from.id, from.first_name, from.username, { phone: c.phone_number });
      const tr = t(await getUser(from.id));
      return api('sendMessage', { chat_id: chat.id, text: tr.gotContact(from.first_name ?? 'Siz', c.phone_number), parse_mode: 'HTML', reply_markup: menuKeyboard(tr) });
    }
    if (m.web_app_data) {
      try {
        const d = JSON.parse(m.web_app_data.data || '{}');
        if (d.type === 'order') {
          await pool.query(
            `INSERT INTO orders (tg_user_id, name, phone, address, branch, delivery_type, payment, items, total)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [from.id, d.name, d.phone, d.addr || '', d.mode === 'delivery' ? 'Yetkazish' : 'Olib ketish', d.pay, JSON.stringify(d.items), d.sum]);
          return api('sendMessage', { chat_id: chat.id, text: `✅ Buyurtmangiz qabul qilindi, ${d.name || ''}! Tez orada aloqaga chiqamiz. 🍣` });
        }
      } catch { /* keep silent */ }
    }
    return;
  }
  if (u.callback_query) {
    const cq = u.callback_query, from = cq.from || {};
    const data = cq.data || '';
    const chat = (cq.message && cq.message.chat) || {};
    await api('answerCallbackQuery', { callback_query_id: cq.id });
    if (/^lang:(uz|ru|en)$/.test(data)) {
      const lang = data.slice(5);
      await upsertUser(from.id, from.first_name, from.username, { lang });
      try { await api('editMessageReplyMarkup', { chat_id: chat.id, message_id: cq.message.message_id }); } catch { /* keep silent */ }
      const tr = T[lang];
      return api('sendMessage', { chat_id: chat.id, text: tr.askContact(from.first_name ?? 'Siz'), parse_mode: 'HTML', reply_markup: contactKeyboard(tr) });
    }
    if (data === 'skip') {
      const tr = t(await getUser(from.id));
      return api('sendMessage', { chat_id: chat.id, text: tr.welcome(from.first_name ?? 'Siz'), parse_mode: 'HTML', reply_markup: menuKeyboard(tr) });
    }
  }
}

export async function telegramInfo(_req: FastifyRequest, reply: FastifyReply) {
  return reply.code(200).send({ ok: true, service: 'tekit-sushi-bot', token: !!TOKEN });
}

export async function telegramHandler(req: FastifyRequest, reply: FastifyReply) {
  const st = (req.headers['x-telegram-bot-api-secret-token'] as string) || '';
  if (st !== (process.env.TELEGRAM_WEBHOOK_SECRET || 'tekitwebhook2026')) return reply.code(401).send({ ok: false });
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: Any = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    await handleUpdate(update);
  } catch (e) { console.error('telegram webhook:', (e as Error)?.message); }
  return reply.code(200).send({ ok: true });
}
