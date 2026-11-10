import pg from 'pg';

const TOKEN = process.env.BOT_TOKEN || '';
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://tekit-sushi-miniapp.vercel.app/';

let pool = null;
function getPool() {
  if (!pool && process.env.DATABASE_URL) {
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 3, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

const T = {
  uz: {
    hello: (n) => `👋 Assalomu alaykum, <b>${n}</b>!\n\n🐳 <b>Tekit Sushi</b>ga xush kelibsiz!\n\nAvval tilni tanlang 👇`,
    askLang: 'Tilni tanlang 👇',
    askContact: (n) => `📱 <b>${n}</b>, buyurtmani tez rasmiylashtirish uchun raqamingizni ulashing.\n\nBosing — raqamingizni o'zimiz olamiz, hech narsa yozib qolmaysiz 👇`,
    skip: 'Keyinroq 👋',
    contactBtn: '📱 Raqamni ulashish',
    welcome: (n) =>
      `🍣 <b>${n}, tanishganimizdan xursandmiz!</b>\n\n` +
      `Sentimental gap yo'q: bir marta tatib ko'rsang, muntazam mijozga aylanasan 😉\n\n` +
      `🥇 <i>Bizning lososimiz bilan munosabat jiddiy va uzoq muddatli.</i>\n` +
      `🥢 <i>Rollar pishgan vaqtda sevgi ham pishadi.</i>\n` +
      `🍚 <i>Bir dona sushi — ming sari hikoya.</i>\n\n` +
      `🛵 Yetkazish: 30–45 daqiqa ichida, issiq va toza\n` +
      `👨‍🍳 Har bir set qo'lda, buyurtma olganda tayyorlanadi\n\n` +
      `Menyuni oching va o'zingizni mukofotlang 🎁`,
    menuBtn: '🍱 Menyuni ochish',
    gotContact: (n, p) => `✅ Rahmat, <b>${n}</b>! Raqamingiz: <b>${p}</b>\n\nEndi eng qiziq qism — taom tanlash! 👇`,
    noContact: "Mayli, raqamsiz ham buyurtma berasiz 🙂 Menyu tayyor!",
    adminPrompt: '🔐 Admin parolini /admin <parol> shaklida yuboring. Parolni yozgan xabaringiz darhol o\u02bbchiriladi.',
    adminOk: '🔓 Siz admin sifatida kirdingiz! Pastdagi tugma orqali panelni oching.',
    adminErr: '❌ Parol xato.',
    adminBtn: '🔓 Admin panel',
  },
  ru: {
    hello: (n) => `👋 Здравствуйте, <b>${n}</b>!\n\nДобро пожаловать в <b>Tekit Sushi</b>!\n\nСначала выберите язык 👇`,
    askLang: 'Выберите язык 👇',
    askContact: (n) => `📱 <b>${n}</b>, чтобы оформить заказ быстро, поделитесь номером телефона.\n\nНажмите кнопку — номер возьмём сами, писать ничего не нужно 👇`,
    skip: 'Позже 👋',
    contactBtn: '📱 Поделиться номером',
    welcome: (n) =>
      `🍣 <b>${n}, рад знакомству!</b>\n\n` +
      `Сентиментов нет: попробуете один раз — станете постоянным гостем 😉\n\n` +
      `🥇 <i>Наши отношения с лососем — серьёзные и долгосрочные.</i>\n` +
      `🥢 <i>Роллы готовятся — и любовь созревает.</i>\n` +
      `🍚 <i>Одна порция суши — тысяча историй.</i>\n\n` +
      `🛵 Доставка: 30–45 минут, горячей и аккуратно\n` +
      `👨‍🍳 Каждый сет готовится вручную после заказа\n\n` +
      `Открывайте меню и побалуйте себя 🎁`,
    menuBtn: '🍱 Открыть меню',
    gotContact: (n, p) => `✅ Спасибо, <b>${n}</b>! Ваш номер: <b>${p}</b>\n\nТеперь самое вкусное — выбор блюд! 👇`,
    noContact: 'Хорошо, закажем и без номера 🙂 Меню готово!',
    adminPrompt: '🔐 Отправьте пароль админа в формате /admin <пароль>. Ваше сообщение с паролём сразу удалится.',
    adminOk: '🔓 Вы вошли как администратор! Откройте панель кнопкой ниже.',
    adminErr: '❌ Неверный пароль.',
    adminBtn: '🔓 Админ панель',
  },
  en: {
    hello: (n) => `👋 Hello, <b>${n}</b>!\n\nWelcome to <b>Tekit Sushi</b>!\n\nFirst, pick your language 👇`,
    askLang: 'Choose a language 👇',
    askContact: (n) => `📱 <b>${n}</b>, to make checkout quick, please share your phone number.\n\nOne tap — we'll grab the number ourselves, nothing to type 👇`,
    skip: 'Later 👋',
    contactBtn: '📱 Share number',
    welcome: (n) =>
      `🍣 <b>${n}, great to meet you!</b>\n\n` +
      `No sentimental fluff: try us once and you're a regular 😉\n\n` +
      `🥇 <i>Our relationship with salmon is serious and long-term.</i>\n` +
      `🥢 <i>While the rolls set, the love sets too.</i>\n` +
      `🍚 <i>One piece of sushi, a thousand stories.</i>\n\n` +
      `🛵 Delivery: 30–45 minutes, hot and neat\n` +
      `👨‍🍳 Every set is made by hand, after you order\n\n` +
      `Open the menu and treat yourself 🎁`,
    menuBtn: '🍱 Open the menu',
    gotContact: (n, p) => `✅ Thanks, <b>${n}</b>! Number: <b>${p}</b>\n\nNow the tasty part — picking dishes! 👇`,
    noContact: "No worries, you can order without a number 🙂 Menu's ready!",
    adminPrompt: '🔐 Send the admin password as /admin <password>. Your message with the password is deleted right away.',
    adminOk: '🔓 You are in as admin! Open the panel with the button below.',
    adminErr: '❌ Wrong password.',
    adminBtn: '🔓 Admin panel',
  },
};
const t = (u) => T[u?.lang] || T.uz;

const langKeyboard = () => ({ inline_keyboard: [
  [{ text: "🇺🇿 O'zbekcha", callback_data: 'lang:uz' }],
  [{ text: '🇷🇺 Русский', callback_data: 'lang:ru' }],
  [{ text: '🇬🇧 English', callback_data: 'lang:en' }],
]});
const contactKeyboard = (u) => ({ keyboard: [[{ text: u.contactBtn, request_contact: true }], [{ text: u.skip }]], resize_keyboard: true, one_time_keyboard: true });
const menuKeyboard = (u) => ({ inline_keyboard: [[{ text: u.menuBtn, web_app: { url: WEBAPP_URL } }]] });

const ensureRoleCol = (() => { let p = null; return () => { if (!p && getPool()) { p = getPool().query('ALTER TABLE bot_users ADD COLUMN IF NOT EXISTS role text').catch(() => {}); } return p; }; })();
const del = (chat_id, message_id, delay = 0) => {
  const run = () => api('deleteMessage', { chat_id, message_id }).catch(() => {});
  delay ? setTimeout(run, delay).unref?.() : run();
};

const api = async (method, body) => {
  try {
    const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}),
    });
    return await r.json().catch(() => null);
  } catch { return null; }
};

const getUser = async (id) => {
  const p = getPool(); if (!p) return null;
  try { const r = await p.query('SELECT * FROM bot_users WHERE tg_id=$1', [id]); return r.rows[0] || null; } catch { return null; }
};
const upsertUser = async (id, name, username, fields = {}) => {
  const p = getPool(); if (!p) return;
  try {
    await p.query(
      `INSERT INTO bot_users (tg_id, name, username, lang, phone)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (tg_id) DO UPDATE SET
         name = COALESCE(EXCLUDED.name, bot_users.name),
         username = COALESCE(EXCLUDED.username, bot_users.username),
         lang = COALESCE(EXCLUDED.lang, bot_users.lang),
         phone = COALESCE(EXCLUDED.phone, bot_users.phone)`,
      [id, fields.name ?? name, fields.username ?? username, fields.lang ?? null, fields.phone ?? null]);
  } catch {}
};

async function handleUpdate(u) {
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
        const p = getPool();
        if (p) { try { await p.query(`UPDATE bot_users SET role='admin' WHERE tg_id=$1`, [from.id]); } catch {} }
        const adminUrl = (process.env.WEBAPP_URL || 'https://tekit-sushi-miniapp.vercel.app/').replace(/\/?$/, '/') + 'admin';
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
          const p = getPool();
          if (p) {
            await p.query(
              `INSERT INTO orders (tg_user_id, name, phone, address, branch, delivery_type, payment, items, total)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
              [from.id, d.name, d.phone, d.addr || '', d.mode === 'delivery' ? 'Yetkazish' : 'Olib ketish', d.pay, JSON.stringify(d.items), d.sum]);
          }
          return api('sendMessage', { chat_id: chat.id, text: `✅ Buyurtmangiz qabul qilindi, ${d.name || ''}! Tez orada aloqaga chiqamiz. 🍣` });
        }
      } catch {}
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
      try { await api('editMessageReplyMarkup', { chat_id: chat.id, message_id: cq.message.message_id }); } catch {}
      const tr = T[lang];
      return api('sendMessage', { chat_id: chat.id, text: tr.askContact(from.first_name ?? 'Siz'), parse_mode: 'HTML', reply_markup: contactKeyboard(tr) });
    }
    if (data === 'skip') {
      const tr = t(await getUser(from.id));
      return api('sendMessage', { chat_id: chat.id, text: tr.welcome(from.first_name ?? 'Siz'), parse_mode: 'HTML', reply_markup: menuKeyboard(tr) });
    }
  }
}

export default async function handler(req, res) {
  const st = req.headers['x-telegram-bot-api-secret-token'] || '';
  if (st !== (process.env.TELEGRAM_WEBHOOK_SECRET || 'tekitwebhook2026')) return res.status(401).json({ ok: false });
  if (req.method !== 'POST') { res.status(200).json({ ok: true, service: 'tekit-sushi-bot', token: !!TOKEN }); return; }
  try {
    const update = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    await handleUpdate(update);
  } catch (e) { console.error('telegram webhook:', e?.message); }
  res.status(200).json({ ok: true });
}
