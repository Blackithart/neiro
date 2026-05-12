// =============================================
// НЕЙРО — Telegram бот v2.1
// Исправлено: node-fetch fallback + сброс webhook
// =============================================

const TOKEN = "8605154591:AAGV2r2mvzxrj2ZKH6IlX_z4Vyl8X5v25T4";
const OWNER_CHAT_ID = 551749665;
const API = `https://api.telegram.org/bot${TOKEN}`;

// Поддержка Node.js < 18 (без встроенного fetch)
let _fetch;
try {
  _fetch = fetch; // Node 18+
  if (typeof _fetch === "undefined") throw new Error();
} catch {
  try { _fetch = require("node-fetch"); } catch {
    console.error("❌ Установите node-fetch: npm install node-fetch");
    process.exit(1);
  }
}

// =============================================
// ХРАНИЛИЩЕ ПОЛЬЗОВАТЕЛЕЙ
// =============================================
const users = {};

function getUser(chat_id, from) {
  if (!users[chat_id]) {
    users[chat_id] = { ...from, state: "idle", contact: {}, started_at: Date.now(), unsubscribed: false };
  }
  return users[chat_id];
}

function resetUser(chat_id, from) {
  users[chat_id] = { ...from, state: "idle", contact: {}, started_at: Date.now(), unsubscribed: false };
  return users[chat_id];
}

// =============================================
// УТИЛИТЫ
// =============================================
async function api(method, body = {}) {
  try {
    const res = await _fetch(`${API}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (e) {
    console.error(`API error [${method}]:`, e.message);
    return null;
  }
}

async function send(chat_id, text, extra = {}) {
  return api("sendMessage", { chat_id, text, parse_mode: "Markdown", ...extra });
}

async function answerCallback(id) {
  return api("answerCallbackQuery", { callback_query_id: id });
}

function scheduleMessage(chat_id, hours, text, keyboard) {
  setTimeout(async () => {
    const u = users[chat_id];
    if (u && !u.unsubscribed) {
      await send(chat_id, text, keyboard ? { reply_markup: keyboard } : {});
    }
  }, hours * 3600 * 1000);
}

// =============================================
// МЕНЮ
// =============================================
const MAIN_MENU = {
  inline_keyboard: [
    [
      { text: "📂 Кейсы и результаты", callback_data: "case_1" },
      { text: "✅ Чек-лист готовности", callback_data: "checklist" },
    ],
    [
      { text: "🎯 Записаться на аудит", callback_data: "start_collect" },
      { text: "💬 Задать вопрос", callback_data: "ask_question" },
    ],
    [
      { text: "🔄 Начать сначала", callback_data: "restart" },
    ],
  ],
};

// =============================================
// ПРИВЕТСТВИЕ
// =============================================
async function sendWelcome(chat_id) {
  await send(chat_id,
    `👋 Привет! Я — бот команды *НЕЙРО*.\n\n` +
    `Внедряем искусственный интеллект в российский бизнес — без иностранного ПО и санкционных рисков.\n\n` +
    `Что хотите узнать? 👇`,
    { reply_markup: MAIN_MENU }
  );
}

// =============================================
// КОНТЕНТ — КЕЙСЫ И ЧЕК-ЛИСТ
// =============================================
const CONTENT = {
  case_1: {
    text:
      `📦 *Кейс 1 — Ретейл / E-commerce*\n\n` +
      `Интернет-магазин внедрил чат-бота на GigaChat — 85% обращений без оператора.\n\n` +
      `*Результат за 3 месяца:*\n• —78% нагрузки на поддержку\n• +31% NPS клиентов\n• Запуск за 3 недели\n\n` +
      `Окупаемость — 2–3 месяца при команде от 3 человек.`,
    keyboard: { inline_keyboard: [
      [{ text: "Следующий кейс →", callback_data: "case_2" }],
      [{ text: "← Главное меню", callback_data: "main_menu" }],
    ]},
  },
  case_2: {
    text:
      `🏭 *Кейс 2 — Производство*\n\n` +
      `Завод внедрил vision-систему для проверки дефектов на конвейере.\n\n` +
      `*Результат:*\n• —94% брака до клиента\n• ×4 скорость проверки\n• —3 сотрудника в смене ОТК\n\n` +
      `Окупаемость — 8 месяцев. Работает 24/7.`,
    keyboard: { inline_keyboard: [
      [{ text: "Следующий кейс →", callback_data: "case_3" }],
      [{ text: "← Главное меню", callback_data: "main_menu" }],
    ]},
  },
  case_3: {
    text:
      `🖥 *Кейс 3 — Миграция legacy-системы*\n\n` +
      `Оператор ЖКХ с монолитом на Delphi 7 + Oracle 9i (400 000 строк, с 2003 года).\n\n` +
      `ИИ проанализировал код, восстановил документацию → Python + PostgreSQL + React.\n\n` +
      `*Результат:*\n• —71% затрат на поддержку\n• ×12 скорость обработки\n• 8 месяцев вместо 3 лет`,
    keyboard: { inline_keyboard: [
      [{ text: "🎯 Хочу такой же результат", callback_data: "start_collect" }],
      [{ text: "← Главное меню", callback_data: "main_menu" }],
    ]},
  },
  checklist: {
    text:
      `✅ *Чек-лист: «Готов ли ваш бизнес к ИИ»*\n\n` +
      `☐ Есть повторяющиеся ручные процессы\n` +
      `☐ Сотрудники тратят >2 часов/день на рутину\n` +
      `☐ Хотите снизить зависимость от человеческого фактора\n` +
      `☐ Нужно обрабатывать больше заявок без роста штата\n` +
      `☐ Хотите прогнозировать спрос или отток клиентов\n` +
      `☐ Есть устаревший IT-стек, тормозящий развитие\n\n` +
      `*2+ пункта — у вас есть потенциал для ИИ.*`,
    keyboard: { inline_keyboard: [
      [{ text: "🎯 Записаться на бесплатный аудит", callback_data: "start_collect" }],
      [{ text: "← Главное меню", callback_data: "main_menu" }],
    ]},
  },
};

// =============================================
// СБОР КОНТАКТОВ
// =============================================
async function startCollect(chat_id, user) {
  user.state = "collecting_name";
  user.contact = {};
  await send(chat_id,
    `🎯 *Запись на бесплатный аудит*\n\nЗадам 4 коротких вопроса — займёт меньше минуты.\n\nКак вас зовут? _(имя и фамилия)_`,
    { reply_markup: { inline_keyboard: [[{ text: "❌ Отмена", callback_data: "main_menu" }]] } }
  );
}

async function askIndustry(chat_id) {
  await send(chat_id, `🏭 Выберите отрасль или напишите свою:`, {
    reply_markup: { inline_keyboard: [
      [{ text: "Производство", callback_data: "industry_Производство" }, { text: "Торговля / E-com", callback_data: "industry_Торговля" }],
      [{ text: "Финансы", callback_data: "industry_Финансы" }, { text: "Логистика", callback_data: "industry_Логистика" }],
      [{ text: "Строительство", callback_data: "industry_Строительство" }, { text: "IT / Телеком", callback_data: "industry_IT" }],
      [{ text: "Другое — напишу сам", callback_data: "industry_other" }],
    ]},
  });
}

async function handleCollecting(chat_id, user, text) {
  switch (user.state) {
    case "collecting_name":
      user.contact.name = text;
      user.state = "collecting_phone";
      await send(chat_id,
        `Отлично, *${text}*! 👍\n\n📞 Укажите номер телефона:`,
        { reply_markup: { inline_keyboard: [[{ text: "❌ Отмена", callback_data: "main_menu" }]] } }
      );
      break;
    case "collecting_phone":
      user.contact.phone = text;
      user.state = "collecting_company";
      await send(chat_id, `🏢 Название вашей компании:`, {
        reply_markup: { inline_keyboard: [[{ text: "Пропустить →", callback_data: "skip_company" }]] }
      });
      break;
    case "collecting_company":
      user.contact.company = text;
      user.state = "collecting_industry";
      await askIndustry(chat_id);
      break;
    case "collecting_industry":
      user.contact.industry = text;
      await finishCollect(chat_id, user);
      break;
  }
}

async function finishCollect(chat_id, user) {
  user.state = "done";
  const c = user.contact;
  await send(OWNER_CHAT_ID,
    `🔥 *Новый лид из Telegram-бота*\n\n` +
    `👤 *Имя:* ${c.name || "—"}\n` +
    `📞 *Телефон:* ${c.phone || "—"}\n` +
    `🏢 *Компания:* ${c.company || "—"}\n` +
    `🏭 *Отрасль:* ${c.industry || "—"}\n` +
    `🔗 *Telegram:* @${user.username || "нет"}\n` +
    `🆔 *chat_id:* ${chat_id}`
  );
  await send(chat_id,
    `✅ *Заявка принята!*\n\nЭксперт свяжется с вами в течение *2 часов* в рабочее время.\n\nПока ждёте — можете посмотреть кейсы или задать вопрос 👇`,
    { reply_markup: MAIN_MENU }
  );
  scheduleMessage(chat_id, 24,
    `💡 *Пока готовимся к звонку...*\n\nКомпании, внедряющие ИИ поэтапно, получают ROI на 40% быстрее. Обсудим, с чего начать именно вам! 🚀`,
    { inline_keyboard: [[{ text: "← Меню", callback_data: "main_menu" }]] }
  );
}

// =============================================
// ОБРАБОТКА CALLBACK
// =============================================
async function handleCallback(query) {
  const chat_id = query.message.chat.id;
  const data = query.data;
  const user = getUser(chat_id, query.from);
  await answerCallback(query.id);

  if (data === "restart") { resetUser(chat_id, query.from); await send(chat_id, `🔄 Начинаем сначала!`); await sendWelcome(chat_id); return; }
  if (data === "main_menu") { user.state = "idle"; await sendWelcome(chat_id); return; }
  if (data === "start_collect") { await startCollect(chat_id, user); return; }
  if (data === "ask_question") {
    user.state = "idle";
    await send(chat_id, `💬 Напишите ваш вопрос — ответим в ближайшие часы.\n\nИли перейдите на сайт:`, {
      reply_markup: { inline_keyboard: [
        [{ text: "🌐 Перейти на сайт", url: "https://blackithart.com/#form" }],
        [{ text: "← Главное меню", callback_data: "main_menu" }],
      ]}
    });
    return;
  }
  if (data === "skip_company") { user.contact.company = "не указана"; user.state = "collecting_industry"; await askIndustry(chat_id); return; }
  if (data.startsWith("industry_")) {
    const industry = data.replace("industry_", "");
    if (industry === "other") { user.state = "collecting_industry"; await send(chat_id, `Напишите вашу отрасль:`); }
    else { user.contact.industry = industry; await finishCollect(chat_id, user); }
    return;
  }
  if (CONTENT[data]) { await send(chat_id, CONTENT[data].text, { reply_markup: CONTENT[data].keyboard }); return; }
}

// =============================================
// ОБРАБОТКА СООБЩЕНИЙ
// =============================================
async function handleMessage(msg) {
  const chat_id = msg.chat.id;
  const text = (msg.text || "").trim();
  const user = getUser(chat_id, msg.from);

  if (text === "/start") {
    resetUser(chat_id, msg.from);
    await send(OWNER_CHAT_ID,
      `🤖 *Новый пользователь*\n\n👤 ${msg.from.first_name || ""} ${msg.from.last_name || ""}\n🔗 @${msg.from.username || "нет"}\n🆔 ${chat_id}`
    );
    await sendWelcome(chat_id);
    scheduleMessage(chat_id, 24,
      `📊 Российские компании, внедрившие ИИ в 2024–2025 году, сократили расходы в среднем на 23%. Хотите узнать потенциал для вашего бизнеса?`,
      { inline_keyboard: [[{ text: "🎯 Записаться на аудит", callback_data: "start_collect" }]] }
    );
    scheduleMessage(chat_id, 72,
      `🔔 Проводим бесплатный экспресс-аудит — 45 минут, без обязательств. Покажем цифры для вашей отрасли.`,
      { inline_keyboard: [[{ text: "🎯 Записаться", callback_data: "start_collect" }, { text: "← Меню", callback_data: "main_menu" }]] }
    );
    scheduleMessage(chat_id, 168,
      `🙏 Последнее сообщение. Если тема ИИ не актуальна — не беспокоим. Если актуальна — будем рады помочь!`,
      { inline_keyboard: [[{ text: "Записаться на аудит →", callback_data: "start_collect" }]] }
    );
    return;
  }
  if (text === "/restart" || text === "/menu") { resetUser(chat_id, msg.from); await sendWelcome(chat_id); return; }
  if (text === "/stop") { user.unsubscribed = true; user.state = "idle"; await send(chat_id, `Вы отписались. Напишите /start, чтобы вернуться.`); return; }
  if (text === "/help") {
    await send(chat_id, `📋 *Команды:*\n\n/start — начало\n/restart — начать сначала\n/menu — главное меню\n/stop — отписаться\n/help — справка`);
    return;
  }

  const collectingStates = ["collecting_name", "collecting_phone", "collecting_company", "collecting_industry"];
  if (collectingStates.includes(user.state)) { await handleCollecting(chat_id, user, text); return; }

  await send(OWNER_CHAT_ID, `💬 *Сообщение от пользователя*\n\n👤 ${msg.from.first_name || ""} (@${msg.from.username || "нет"})\n🆔 ${chat_id}\n\n"${text}"`);
  await send(chat_id, `✅ Сообщение получено! Ответим в ближайшее время.\n\nПока — воспользуйтесь меню:`, { reply_markup: MAIN_MENU });
}

// =============================================
// HTTP-СЕРВЕР ДЛЯ RAILWAY
// Railway требует открытый порт, иначе убивает процесс
// =============================================
const http = require("http");
const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("НЕЙРО бот работает ✅");
}).listen(PORT, () => {
  console.log(`✅ HTTP health-check запущен на порту ${PORT}`);
});

// =============================================
// LONG POLLING — со сбросом webhook при старте
// =============================================
let offset = 0;

async function poll() {
  try {
    const res = await _fetch(`${API}/getUpdates?offset=${offset}&timeout=30`);
    const data = await res.json();
    if (data.ok && data.result.length > 0) {
      for (const update of data.result) {
        offset = update.update_id + 1;
        if (update.message) await handleMessage(update.message);
        if (update.callback_query) await handleCallback(update.callback_query);
      }
    }
  } catch (e) { console.error("Poll error:", e.message); }
  setTimeout(poll, 1000);
}

async function start() {
  console.log("🤖 НЕЙРО бот v2.1 запускается...");

  // Сбрасываем webhook — иначе long polling не работает
  const wh = await api("deleteWebhook", { drop_pending_updates: false });
  if (wh && wh.ok) console.log("✅ Webhook сброшен");
  else console.warn("⚠️  Не удалось сбросить webhook:", wh);

  // Проверяем токен
  const me = await api("getMe");
  if (!me || !me.ok) { console.error("❌ Неверный токен или нет сети"); process.exit(1); }
  console.log(`✅ Бот запущен: @${me.result.username}`);

  poll();
}

start();
