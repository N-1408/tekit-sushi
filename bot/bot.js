import { Bot, InlineKeyboard } from "grammY";
import fs from "fs";

const TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || "";
const WEBAPP_URL = process.env.WEBAPP_URL || ""; // deployed miniapp URL (https)
const ORDERS_FILE = process.env.ORDERS_FILE || "orders.json";

if (!TOKEN) { console.error("BOT_TOKEN yo'q"); process.exit(1); }

const bot = new Bot(TOKEN);
const load = () => { try { return JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8")); } catch { return []; } };
const saveOrder = (o) => { const a = load(); a.unshift(o); fs.writeFileSync(ORDERS_FILE, JSON.stringify(a, null, 2)); };

bot.command("start", async (ctx) => {
  const kb = new InlineKeyboard().webApp("🍱 Menyuni ochish", WEBAPP_URL);
  await ctx.reply(
    `👋 Assalomu alaykum, <b>${ctx.from?.first_name ?? "Siz"}</b>!\n\n` +
    `🐳 <b>Tekit Sushi</b> — yangi sushi va rollar.\n\n` +
    `Menyuni oching, taom tanlang va bir necha sekundda buyurtma bering. Full-screen ilovam yaxshi ishlaydi.\n\n` +
    `🛵 Yetkazish: 30–45 daqiqa\n📞 Bosh savol bo'lsa: yozing`,
    { parse_mode: "HTML", reply_markup: kb }
  );
});

bot.command("menu", async (ctx) => {
  await ctx.reply("Menyu 👇", { reply_markup: new InlineKeyboard().webApp("🍱 Ochish", WEBAPP_URL) });
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
bot.start();
console.log("Tekit Sushi bot ishga tushdi");
