import { Bot, InlineKeyboard, Keyboard } from "grammy";
import pg from "pg";
import http from "http";
import fs from "fs";

const TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || "";
const WEBAPP_URL = process.env.WEBAPP_URL || "";
const DATABASE_URL = process.env.DATABASE_URL || "";
const ORDERS_FILE = process.env.ORDERS_FILE || "orders.json";

if (!TOKEN) { console.error("BOT_TOKEN yo'q"); process.exit(1); }

const pool = DATABASE_URL ? new pg.Pool({ connectionString: DATABASE_URL, max: 3, ssl: { rejectUnauthorized: false } }) : null;

async function initDb() {
  if (!pool) return;
  await pool.query(`CREATE TABLE IF NOT EXISTS bot_users (
    tg_id BIGINT PRIMARY KEY,
    name TEXT,
    username TEXT,
    lang TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  )`);
}
const getUser = async (id) => {
  if (!pool) return null;
  const r = await pool.query("SELECT * FROM bot_users WHERE tg_id=$1", [id]);
  return r.rows[0] || null;
};
const upsertUser = async (id, name, username, fields = {}) => {
  if (!pool) return;
  await pool.query(
    `INSERT INTO bot_users (tg_id, name, username, lang, phone)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (tg_id) DO UPDATE SET
       name = COALESCE(EXCLUDED.name, bot_users.name),
       username = COALESCE(EXCLUDED.username, bot_users.username),
       lang = COALESCE(EXCLUDED.lang, bot_users.lang),
       phone = COALESCE(EXCLUDED.phone, bot_users.phone)`,
    [id, fields.name ?? name, fields.username ?? username, fields.lang ?? null, fields.phone ?? null]
  );
};

const T = {
  uz: {
    hello: (n) => `👋 Assalomu alaykum, <b>${n}</b>!\n\n🐳 <b>Tekit Sushi</b>ga xush kelibsiz!\n\nAvval tilni tanlang 👇`,
    askLang: "Tilni tanlang 👇",
    askContact: (n) => `📱 <b>${n}</b>, buyurtmani tez rasmiylashtirish uchun raqamingizni ulashing.\n\nBosing — raqamingizni o'zimiz olamiz, hech narsa yozib qolmaysiz 👇`,
    skip: "Keyinroq 👋",
    contactBtn: "📱 Raqamni ulashish",
    welcome: (n) =>
      `🍣 <b>${n}, tanishganimizdan xursandmiz!</b>\n\n` +
      `Sentimental gap yo'q: bir marta tatib ko'rsang, muntazam mijozga aylanasan 😉\n\n` +
      `🥇 <i>Bizning lososimiz bilan munosabat jiddiy va uzoq muddatli.</i>\n` +
      `🥢 <i>Rollar pishgan vaqtda sevgi ham pishadi.</i>\n` +
      `🍚 <i>Bir dona sushi — ming sari hikoya.</i>\n\n` +
      `🛵 Yetkazish: 30–45 daqiqa ichida, issiq va toza\n` +
      `👨‍🍳 Har bir set qo'lda, buyurtma olganda tayyorlanadi\n\n` +
      `Menyuni oching va o'zingizni mukofotlang 🎁`,
    menuBtn: "🍱 Menyuni ochish",
    gotContact: (n, p) => `✅ Rahmat, <b>${n}</b>! Raqamingiz: <b>${p}</b>\n\nEndi eng qiziq qism — taom tanlash! 👇`,
    noContact: "Mayli, raqamsiz ham buyurtma berasiz 🙂 Menyu tayyor!",
  },
  ru: {
    hello: (n) => `👋 Здравствуйте, <b>${n}</b>!\n\nДобро пожаловать в <b>Tekit Sushi</b>!\n\nСначала выберите язык 👇`,
    askLang: "Выберите язык 👇",
    askContact: (n) => `📱 <b>${n}</b>, чтобы оформить заказ быстро, поделитесь номером телефона.\n\nНажмите кнопку — номер возьмём сами, писать ничего не нужно 👇`,
    skip: "Позже 👋",
    contactBtn: "📱 Поделиться номером",
    welcome: (n) =>
      `🍣 <b>${n}, рад знакомству!</b>\n\n` +
      `Сентиментов нет: попробуете один раз — станете постоянным гостем 😉\n\n` +
      `🥇 <i>Наши отношения с лососем — серьёзные и долгосрочные.</i>\n` +
      `🥢 <i>Роллы готовятся — и любовь созревает.</i>\n` +
      `🍚 <i>Одна порция суши — тысяча историй.</i>\n\n` +
      `🛵 Доставка: 30–45 минут, горячей и аккуратно\n` +
      `👨‍🍳 Каждый сет готовится вручную после заказа\n\n` +
      `Открывайте меню и побалуйте себя 🎁`,
    menuBtn: "🍱 Открыть меню",
    gotContact: (n, p) => `✅ Спасибо, <b>${n}</b>! Ваш номер: <b>${p}</b>\n\nТеперь самое вкусное — выбор блюд! 👇`,
    noContact: "Хорошо, закажем и без номера 🙂 Меню готово!",
  },
  en: {
    hello: (n) => `👋 Hello, <b>${n}</b>!\n\nWelcome to <b>Tekit Sushi</b>!\n\nFirst, pick your language 👇`,
    askLang: "Choose a language 👇",
    askContact: (n) => `📱 <b>${n}</b>, to make checkout quick, please share your phone number.\n\nOne tap — we'll grab the number ourselves, nothing to type 👇`,
    skip: "Later 👋",
    contactBtn: "📱 Share number",
    welcome: (n) =>
      `🍣 <b>${n}, great to meet you!</b>\n\n` +
      `No sentimental fluff: try us once and you're a regular 😉\n\n` +
      `🥇 <i>Our relationship with salmon is serious and long-term.</i>\n` +
      `🥢 <i>While the rolls set, the love sets too.</i>\n` +
      `🍚 <i>One piece of sushi, a thousand stories.</i>\n\n` +
      `🛵 Delivery: 30–45 minutes, hot and neat\n` +
      `👨‍🍳 Every set is made by hand, after you order\n\n` +
      `Open the menu and treat yourself 🎁`,
    menuBtn: "🍱 Open the menu",
    gotContact: (n, p) => `✅ Thanks, <b>${n}</b>! Number: <b>${p}</b>\n\nNow the tasty part — picking dishes! 👇`,
    noContact: "No worries, you can order without a number 🙂 Menu's ready!",
  },
};
const t = (u) => T[u?.lang] || T.uz;

const load = () => { try { return JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8")); } catch { return []; } };
const saveOrder = (o) => { const a = load(); a.unshift(o); fs.writeFileSync(ORDERS_FILE, JSON.stringify(a, null, 2)); };

const bot = new Bot(TOKEN);

function langKeyboard() {
  return new InlineKeyboard()
    .text("🇺🇿 O'zbekcha", "lang:uz").row()
    .text("🇷🇺 Русский", "lang:ru").row()
    .text("🇬🇧 English", "lang:en");
}
function contactKeyboard(u) {
  return new Keyboard().requestContact(u.contactBtn).row().text(u.skip).resized().oneTime();
}

bot.command("start", async (ctx) => {
  const from = ctx.from;
  const dbUser = await getUser(from.id).catch(() => null);
  const u = t(dbUser);
  await upsertUser(from.id, from.first_name || "Siz", from.username).catch(() => {});

  if (!dbUser || !dbUser.lang) {
    await ctx.reply(u.hello(from.first_name ?? "Siz"), { parse_mode: "HTML", reply_markup: langKeyboard() });
    return;
  }
  if (dbUser.lang && !dbUser.phone) {
    await ctx.reply(u.askContact(from.first_name ?? "Siz"), { parse_mode: "HTML", reply_markup: contactKeyboard(u) });
    return;
  }
  await ctx.reply(u.welcome(from.first_name ?? "Siz"), {
    parse_mode: "HTML",
    reply_markup: new InlineKeyboard().webApp(u.menuBtn, WEBAPP_URL),
  });
});

bot.callbackQuery(/^lang:(uz|ru|en)$/, async (ctx) => {
  const lang = ctx.match[1];
  const from = ctx.from;
  const u = T[lang];
  await upsertUser(from.id, from.first_name, from.username, { lang }).catch(() => {});
  await ctx.answerCallbackQuery();
  try { await ctx.editMessageReplyMarkup({ reply_markup: undefined }); } catch (e) {}
  await ctx.reply(u.askContact(from.first_name ?? "Siz"), { parse_mode: "HTML", reply_markup: contactKeyboard(u) });
});

bot.callbackQuery("skip", async (ctx) => {
  const u = t(await getUser(ctx.from.id).catch(() => null)) || T.uz;
  await ctx.answerCallbackQuery();
  await ctx.reply(u.welcome(ctx.from.first_name ?? "Siz"), {
    parse_mode: "HTML",
    reply_markup: new InlineKeyboard().webApp(u.menuBtn, WEBAPP_URL),
  });
});

bot.on("message:text", async (ctx) => {
  const skips = Object.values(T).map((l) => l.skip);
  if (!skips.includes(ctx.message.text)) return;
  const u = t(await getUser(ctx.from.id).catch(() => null)) || T.uz;
  await ctx.reply(u.welcome(ctx.from.first_name ?? "Siz"), {
    parse_mode: "HTML",
    reply_markup: new InlineKeyboard().webApp(u.menuBtn, WEBAPP_URL),
  });
});

bot.on("message:contact", async (ctx) => {
  const c = ctx.message.contact;
  if (!c.phone_number || (c.user_id && c.user_id !== ctx.from.id)) return;
  await upsertUser(c.user_id ?? ctx.from.id, ctx.from.first_name, ctx.from.username, { phone: c.phone_number }).catch(() => {});
  const u = t({ lang: ctx.from.language_code === "ru" ? "ru" : "uz" });
  const dbUser = await getUser(ctx.from.id).catch(() => null);
  const uu = t(dbUser) || u;
  await ctx.reply(uu.gotContact(ctx.from.first_name ?? "Siz", c.phone_number), {
    parse_mode: "HTML",
    reply_markup: new InlineKeyboard().webApp(uu.menuBtn, WEBAPP_URL),
  });
});

bot.command("menu", async (ctx) => {
  const u = t(await getUser(ctx.from.id).catch(() => null)) || T.uz;
  await ctx.reply(u.welcome(ctx.from.first_name ?? "Siz"), {
    parse_mode: "HTML",
    reply_markup: new InlineKeyboard().webApp(u.menuBtn, WEBAPP_URL),
  });
});

// Orders arrive from the Mini App via sendData (wrapped in "message" by Telegram)
bot.on("message:web_app_data", async (ctx) => {
  let d;
  try { d = JSON.parse(ctx.message.web_app_data.data); } catch { return; }
  if (d.type !== "order") return;
  const order = {
    id: d.id,
    tg_user: ctx.from,
    name: d.name, phone: d.phone, mode: d.mode, addr: d.addr, pay: d.pay,
    items: d.items, sum: d.sum, at: d.at, status: "Yangi",
  };
  saveOrder(order);
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO orders (tg_user_id, name, phone, address, branch, delivery_type, payment, items, total)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [ctx.from.id, d.name, d.phone, d.addr || "", d.mode === "delivery" ? "Yetkazish" : "Olib ketish", d.pay, JSON.stringify(d.items), d.sum]
      );
    } catch (e) { console.error("db order:", e.message); }
  }

  const lines = order.items.map((l) => "• " + l).join("\n");
  const text =
    `🆕 <b>YANGI BUYURTMA ${order.id}</b>\n\n` +
    `👤 ${order.name} · <a href="tg://user?id=${ctx.from.id}">${ctx.from.username ? "@" + ctx.from.username : "profil"}</a>\n` +
    `📞 ${order.phone}\n` +
    `${order.mode === "delivery" ? "🛵 Yetkazish" : "🏪 Olib ketish"}: ${order.addr}\n` +
    `💳 ${order.pay}\n\n${lines}\n\n💰 <b>${Number(order.sum).toLocaleString("ru-RU")} so'm</b>\n🕐 ${order.at}`;

  await ctx.reply(text, { parse_mode: "HTML" });
  if (ADMIN_CHAT_ID) {
    try { await bot.api.sendMessage(ADMIN_CHAT_ID, text, { parse_mode: "HTML" }); } catch (e) { console.error("admin xabar:", e.message); }
  }
  await ctx.reply(`✅ Buyurtmangiz qabul qilindi, ${order.name}! Tez orada aloqaga chiqamiz. 🍣`);
});

bot.catch((e) => console.error("bot xato:", e.message));
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  if (req.method === "POST" && (req.url || "").split("?")[0] === "/telegram/webhook") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", async () => {
      try {
        const update = JSON.parse(body || "{}");
        await bot.handleUpdate(update);
      } catch (e) { console.error("webhook:", e.message); }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end('{"ok":true}');
    });
    return;
  }
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "ok", bot: "tekit-sushi" }));
}).listen(PORT, () => console.log(`Health server ${PORT} portda`));

initDb().catch((e) => console.error("db init:", e.message)).finally(() => {
  console.log("Tekit Sushi bot ishga tushdi (webhook)");
});
