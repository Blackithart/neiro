// =============================================
// НЕЙРО — Telegram бот v3
// Skills: community-marketing + sales-enablement
// =============================================

const TOKEN = process.env.BOT_TOKEN || "8605154591:AAGo3GeD-cMkYa6Q7D5872flQbP0y1NY4qE";
const OWNER_CHAT_ID = 551749665;
const API = `https://api.telegram.org/bot${TOKEN}`;

let _fetch;
try { _fetch = fetch; if (typeof _fetch === "undefined") throw new Error(); }
catch { try { _fetch = require("node-fetch"); } catch { console.error("npm install node-fetch"); process.exit(1); } }

// =============================================
// ХРАНИЛИЩЕ
// =============================================
const users = {};

function getUser(chat_id, from) {
  if (!users[chat_id]) users[chat_id] = { ...from, state: "idle", persona: null, contact: {}, started_at: Date.now(), unsubscribed: false };
  return users[chat_id];
}
function resetUser(chat_id, from) {
  users[chat_id] = { ...from, state: "idle", persona: null, contact: {}, started_at: Date.now(), unsubscribed: false };
  return users[chat_id];
}

// =============================================
// УТИЛИТЫ
// =============================================
async function api(method, body = {}) {
  try {
    const res = await _fetch(`${API}/${method}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return await res.json();
  } catch (e) { console.error(`[${method}]`, e.message); return null; }
}
async function send(chat_id, text, extra = {}) { return api("sendMessage", { chat_id, text, parse_mode: "Markdown", ...extra }); }
async function answerCallback(id) { return api("answerCallbackQuery", { callback_query_id: id }); }
function schedule(chat_id, hours, text, keyboard) {
  setTimeout(async () => { const u = users[chat_id]; if (u && !u.unsubscribed) await send(chat_id, text, keyboard ? { reply_markup: keyboard } : {}); }, hours * 3600 * 1000);
}

// =============================================
// МЕНЮ
// =============================================
const MAIN_MENU = {
  inline_keyboard: [
    [{ text: "📂 Кейсы и результаты", callback_data: "case_1" }, { text: "✅ Чек-лист готовности", callback_data: "checklist" }],
    [{ text: "🎯 Записаться на аудит", callback_data: "start_collect" }, { text: "💭 Есть вопросы и сомнения", callback_data: "objections" }],
    [{ text: "🔄 Начать сначала", callback_data: "restart" }],
  ],
};

// =============================================
// PERSONA-BASED ПРИВЕТСТВИЕ (community-marketing: shared identity)
// =============================================
const PERSONA_SELECT = {
  inline_keyboard: [
    [{ text: "👔 Я директор / владелец бизнеса", callback_data: "persona_director" }],
    [{ text: "💻 Я IT-директор / CTO / разработчик", callback_data: "persona_cto" }],
    [{ text: "📊 Я руководитель отдела / менеджер", callback_data: "persona_manager" }],
  ],
};

const PERSONA_MESSAGES = {
  persona_director: {
    label: "директор",
    text:
      `Отлично. Тогда говорим на вашем языке — *ROI, сроки, риски*.\n\n` +
      `Вы уже среди тех руководителей, кто понимает: ИИ — это не мода, а инструмент снижения издержек. Компании из вашей отрасли экономят от 20 до 70% на ручных процессах уже в первый год.\n\n` +
      `Что вас интересует больше всего?`,
  },
  persona_cto: {
    label: "CTO",
    text:
      `Отлично. Говорим технически — *стек, архитектура, интеграция*.\n\n` +
      `Работаем на российском и open-source стеке: GigaChat, YandexGPT, LLaMA, собственные модели. Всё on-premise или в российском облаке. Никаких санкционных рисков.\n\n` +
      `Что вас интересует?`,
  },
  persona_manager: {
    label: "менеджер",
    text:
      `Отлично. Тогда покажем, как ИИ снимает нагрузку с вашего отдела — *без замены команды и сложного обучения*.\n\n` +
      `Наши клиенты говорят, что после внедрения люди наконец занимаются работой, а не заполнением таблиц.\n\n` +
      `Что вас интересует?`,
  },
};

// =============================================
// ОТРАБОТКА ВОЗРАЖЕНИЙ (sales-enablement: objection handling)
// =============================================
const OBJECTIONS_MENU = {
  inline_keyboard: [
    [{ text: "💰 Это дорого / нет бюджета", callback_data: "obj_budget" }],
    [{ text: "😬 Пробовали — не взлетело", callback_data: "obj_failed" }],
    [{ text: "🔒 Санкции / иностранный софт", callback_data: "obj_sanctions" }],
    [{ text: "⏰ Сейчас не лучшее время", callback_data: "obj_timing" }],
    [{ text: "🤝 Нужно согласовать внутри", callback_data: "obj_approval" }],
    [{ text: "← Главное меню", callback_data: "main_menu" }],
  ],
};

const OBJECTIONS = {
  obj_budget: {
    text:
      `💰 *«Это дорого / нет бюджета»*\n\n` +
      `Понимаем. Поэтому мы не предлагаем «внедрить ИИ во всём» сразу.\n\n` +
      `Начинаем с *одного процесса* — стоимость от 150 000 ₽. На бесплатном аудите считаем конкретную экономию в рублях. Если она меньше стоимости проекта — честно скажем «не стоит».\n\n` +
      `Наш средний клиент окупает вложения за *2–3 месяца*.`,
  },
  obj_failed: {
    text:
      `😬 *«Пробовали автоматизацию — не взлетело»*\n\n` +
      `Это частая история. 80% неудач — это неправильно выбранный процесс или решение без интеграции в реальную работу команды.\n\n` +
      `Мы начинаем с аудита именно поэтому. Фиксируем метрики *до* старта — вы видите реальный результат, а не обещания.\n\n` +
      `Расскажите, что именно не сработало — и мы разберём почему.`,
  },
  obj_sanctions: {
    text:
      `🔒 *«А как с санкциями и иностранным ПО?»*\n\n` +
      `Только российский и open-source стек:\n` +
      `• GigaChat API (Сбер)\n• YandexGPT (Яндекс)\n• LLaMA, Mistral (открытые модели)\n• Собственные дообученные модели\n\n` +
      `Всё разворачивается на *ваших серверах* или в российском облаке. Данные не покидают периметр. Никаких зависимостей от зарубежных сервисов.`,
  },
  obj_timing: {
    text:
      `⏰ *«Сейчас не лучшее время»*\n\n` +
      `Понимаем. Но вот что важно: пока вы ждёте — *ваши конкуренты не ждут*.\n\n` +
      `Мы не торопим. Начните с бесплатного аудита — это 45 минут, без обязательств. Вы просто узнаете потенциал и стоимость. Дальше решение за вами.\n\n` +
      `Многие наши клиенты говорят: «Жаль, что не пришли раньше».`,
  },
  obj_approval: {
    text:
      `🤝 *«Нужно согласовать с руководством»*\n\n` +
      `Мы поможем. После аудита подготовим для вас:\n` +
      `• Расчёт ROI и срок окупаемости\n` +
      `• Кейсы из вашей отрасли\n` +
      `• Оценку рисков и план миграции\n\n` +
      `Это всё, что нужно для внутренней защиты бюджета. Многие наши проекты начинались именно так — аудит → презентация руководству → старт.`,
  },
};

// =============================================
// КОНТЕНТ — КЕЙСЫ
// =============================================
const CONTENT = {
  case_1: {
    text:
      `📦 *Кейс 1 — Ретейл / E-commerce*\n\n` +
      `Интернет-магазин внедрил чат-бота на GigaChat — 85% обращений без оператора.\n\n` +
      `*Результат:* —78% нагрузки на поддержку · +31% NPS · запуск за 3 недели`,
    keyboard: { inline_keyboard: [[{ text: "Следующий кейс →", callback_data: "case_2" }], [{ text: "← Меню", callback_data: "main_menu" }]] },
  },
  case_2: {
    text:
      `🏭 *Кейс 2 — Производство*\n\n` +
      `Завод: vision-система для проверки дефектов на конвейере.\n\n` +
      `*Результат:* —94% брака · ×4 скорость проверки · —3 сотрудника в смене`,
    keyboard: { inline_keyboard: [[{ text: "Следующий кейс →", callback_data: "case_3" }], [{ text: "← Меню", callback_data: "main_menu" }]] },
  },
  case_3: {
    text:
      `🖥 *Кейс 3 — Миграция с Delphi (ЖКХ)*\n\n` +
      `Монолит на Delphi 7 + Oracle 9i, 400 000 строк кода с 2003 года → Python + PostgreSQL + React.\n\n` +
      `*Результат:* —71% затрат на поддержку · ×12 скорость · 8 месяцев вместо 3 лет`,
    keyboard: { inline_keyboard: [[{ text: "🎯 Хочу такой же результат", callback_data: "start_collect" }], [{ text: "← Меню", callback_data: "main_menu" }]] },
  },
  checklist: {
    text:
      `✅ *Чек-лист: готов ли ваш бизнес к ИИ*\n\n` +
      `☐ Есть повторяющиеся ручные процессы\n` +
      `☐ Сотрудники тратят >2 часов/день на рутину\n` +
      `☐ Хотите снизить зависимость от человеческого фактора\n` +
      `☐ Нужно больше заявок без роста штата\n` +
      `☐ Хотите прогнозировать спрос или отток\n` +
      `☐ Есть устаревший IT-стек, тормозящий развитие\n\n` +
      `*2+ пункта — у вас есть потенциал. Давайте посчитаем экономию.*`,
    keyboard: { inline_keyboard: [[{ text: "🎯 Записаться на аудит", callback_data: "start_collect" }], [{ text: "← Меню", callback_data: "main_menu" }]] },
  },
};

// =============================================
// СБОР КОНТАКТОВ — с discovery-вопросами (sales-enablement)
// =============================================
async function startCollect(chat_id, user) {
  user.state = "discovery";
  user.contact = {};
  await send(chat_id,
    `🎯 *Бесплатный аудит — 45 минут*\n\nПрежде чем договариваться о звонке — один вопрос:\n\n*Что сейчас больше всего тормозит ваш бизнес?*`,
    { reply_markup: { inline_keyboard: [
      [{ text: "📄 Ручной документооборот", callback_data: "disc_docs" }],
      [{ text: "📞 Перегруженная поддержка", callback_data: "disc_support" }],
      [{ text: "🏭 Качество / контроль производства", callback_data: "disc_production" }],
      [{ text: "💾 Устаревшая IT-система", callback_data: "disc_legacy" }],
      [{ text: "📊 Нет аналитики / прогнозирования", callback_data: "disc_analytics" }],
      [{ text: "❌ Отмена", callback_data: "main_menu" }],
    ]}}
  );
}

async function afterDiscovery(chat_id, user, problem) {
  user.contact.problem = problem;
  user.state = "collecting_name";
  await send(chat_id,
    `Понял. Это как раз то, с чем мы работаем.\n\nКак вас зовут?`,
    { reply_markup: { inline_keyboard: [[{ text: "❌ Отмена", callback_data: "main_menu" }]] } }
  );
}

async function askIndustry(chat_id) {
  await send(chat_id, `🏭 Ваша отрасль:`, { reply_markup: { inline_keyboard: [
    [{ text: "Производство", callback_data: "industry_Производство" }, { text: "Торговля / E-com", callback_data: "industry_Торговля" }],
    [{ text: "Финансы", callback_data: "industry_Финансы" }, { text: "Логистика", callback_data: "industry_Логистика" }],
    [{ text: "Строительство", callback_data: "industry_Строительство" }, { text: "IT / Телеком", callback_data: "industry_IT" }],
    [{ text: "Другое — напишу сам", callback_data: "industry_other" }],
  ]}});
}

async function handleCollecting(chat_id, user, text) {
  switch (user.state) {
    case "collecting_name":
      user.contact.name = text;
      user.state = "collecting_phone";
      await send(chat_id, `Отлично, *${text}*! 📞 Номер телефона:`,
        { reply_markup: { inline_keyboard: [[{ text: "❌ Отмена", callback_data: "main_menu" }]] } });
      break;
    case "collecting_phone":
      user.contact.phone = text;
      user.state = "collecting_company";
      await send(chat_id, `🏢 Название компании:`,
        { reply_markup: { inline_keyboard: [[{ text: "Пропустить →", callback_data: "skip_company" }]] } });
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
    `🔥 *Новый лид — бот*\n\n` +
    `👤 *Имя:* ${c.name || "—"}\n` +
    `📞 *Телефон:* ${c.phone || "—"}\n` +
    `🏢 *Компания:* ${c.company || "—"}\n` +
    `🏭 *Отрасль:* ${c.industry || "—"}\n` +
    `❗ *Проблема:* ${c.problem || "—"}\n` +
    `👤 *Персона:* ${user.persona || "—"}\n` +
    `🔗 *Telegram:* @${user.username || "нет"}\n` +
    `🆔 *chat_id:* ${chat_id}`
  );

  await send(chat_id,
    `✅ *Заявка принята!*\n\nЭксперт свяжется в течение *2 часов* в рабочее время.\n\n` +
    `Вы уже среди 40+ компаний, которые выбрали осознанный подход к автоматизации. Хорошее решение. 👍`,
    { reply_markup: MAIN_MENU }
  );

  // Прогрев — через 24 часа
  schedule(chat_id, 24,
    `💡 *Пока готовимся к звонку*\n\nКомпании, начавшие с одного процесса, получают ROI на 40% быстрее тех, кто ждёт «идеального момента». Обсудим, с чего начать именно вам. 🚀`,
    { inline_keyboard: [[{ text: "← Меню", callback_data: "main_menu" }]] }
  );
}

// =============================================
// CALLBACK
// =============================================
async function handleCallback(query) {
  const chat_id = query.message.chat.id;
  const data = query.data;
  const user = getUser(chat_id, query.from);
  await answerCallback(query.id);

  // Системные
  if (data === "restart") { resetUser(chat_id, query.from); await sendWelcome(chat_id); return; }
  if (data === "main_menu") { user.state = "idle"; await sendWelcome(chat_id); return; }
  if (data === "start_collect") { await startCollect(chat_id, user); return; }
  if (data === "objections") { await send(chat_id, `Что вас беспокоит?`, { reply_markup: OBJECTIONS_MENU }); return; }

  // Персоны (sales-enablement: persona routing)
  if (data.startsWith("persona_")) {
    const p = PERSONA_MESSAGES[data];
    if (p) { user.persona = p.label; await send(chat_id, p.text, { reply_markup: MAIN_MENU }); }
    return;
  }

  // Discovery
  const discMap = {
    disc_docs: "Ручной документооборот",
    disc_support: "Перегруженная поддержка",
    disc_production: "Качество / контроль производства",
    disc_legacy: "Устаревшая IT-система",
    disc_analytics: "Нет аналитики / прогнозирования",
  };
  if (data in discMap) { await afterDiscovery(chat_id, user, discMap[data]); return; }

  // Возражения (sales-enablement: objection handling)
  if (data in OBJECTIONS) {
    const o = OBJECTIONS[data];
    await send(chat_id, o.text, { reply_markup: { inline_keyboard: [
      [{ text: "🎯 Записаться на аудит", callback_data: "start_collect" }],
      [{ text: "← Другой вопрос", callback_data: "objections" }],
    ]}});
    return;
  }

  // Вопрос
  if (data === "ask_question") {
    await send(chat_id, `💬 Напишите вопрос — ответим в ближайшие часы.\n\nИли переходите на сайт:`, { reply_markup: { inline_keyboard: [
      [{ text: "🌐 Перейти на сайт", url: "https://blackithart.com/#form" }],
      [{ text: "← Главное меню", callback_data: "main_menu" }],
    ]}});
    return;
  }

  if (data === "skip_company") { user.contact.company = "не указана"; user.state = "collecting_industry"; await askIndustry(chat_id); return; }

  if (data.startsWith("industry_")) {
    const industry = data.replace("industry_", "");
    if (industry === "other") { user.state = "collecting_industry"; await send(chat_id, `Напишите вашу отрасль:`); }
    else { user.contact.industry = industry; await finishCollect(chat_id, user); }
    return;
  }

  // Контент
  if (CONTENT[data]) { await send(chat_id, CONTENT[data].text, { reply_markup: CONTENT[data].keyboard }); return; }
}

// =============================================
// ПРИВЕТСТВИЕ с persona selection (community-marketing)
// =============================================
async function sendWelcome(chat_id) {
  await send(chat_id,
    `👋 Привет! Я бот команды *НЕЙРО*.\n\nВнедряем ИИ в российский бизнес — без иностранного ПО.\n\nЧтобы говорить конкретно — кто вы?`,
    { reply_markup: PERSONA_SELECT }
  );
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
    await api("sendMessage", { chat_id: OWNER_CHAT_ID, text: `🤖 Новый пользователь\n👤 ${msg.from.first_name || ""} (@${msg.from.username || "нет"})\n🆔 ${chat_id}`, parse_mode: "Markdown" });
    await sendWelcome(chat_id);
    schedule(chat_id, 24,
      `📊 Компании, внедрившие ИИ в 2024–2025, сократили расходы в среднем на 23% за первый год. Хотите узнать потенциал для вашего бизнеса?`,
      { inline_keyboard: [[{ text: "🎯 Записаться на аудит", callback_data: "start_collect" }]] }
    );
    schedule(chat_id, 72,
      `🔔 Всё ещё думаете? Проводим бесплатный аудит — 45 минут, без обязательств. Покажем цифры для вашей отрасли.`,
      { inline_keyboard: [[{ text: "🎯 Записаться", callback_data: "start_collect" }, { text: "← Меню", callback_data: "main_menu" }]] }
    );
    schedule(chat_id, 168,
      `🙏 Последнее сообщение. Если тема ИИ пока не актуальна — не беспокоим. Если актуальна — будем рады!`,
      { inline_keyboard: [[{ text: "Записаться →", callback_data: "start_collect" }]] }
    );
    return;
  }

  if (text === "/restart" || text === "/menu") { resetUser(chat_id, msg.from); await sendWelcome(chat_id); return; }
  if (text === "/stop") { user.unsubscribed = true; await send(chat_id, `Вы отписались. Напишите /start чтобы вернуться.`); return; }
  if (text === "/help") { await send(chat_id, `/start — начало\n/restart — сначала\n/menu — меню\n/stop — отписаться`); return; }

  // Discovery state
  if (user.state === "discovery") { await afterDiscovery(chat_id, user, text); return; }

  // Collecting states
  const collecting = ["collecting_name", "collecting_phone", "collecting_company", "collecting_industry"];
  if (collecting.includes(user.state)) { await handleCollecting(chat_id, user, text); return; }

  // Любое сообщение
  await api("sendMessage", { chat_id: OWNER_CHAT_ID, text: `💬 Сообщение\n👤 ${msg.from.first_name || ""} (@${msg.from.username || "нет"})\n🆔 ${chat_id}\n\n"${text}"`, parse_mode: "Markdown" });
  await send(chat_id, `✅ Получили! Ответим в ближайшее время.`, { reply_markup: MAIN_MENU });
}

// =============================================
// LONG POLLING
// =============================================
let offset = 0;
async function poll() {
  try {
    const res = await _fetch(`${API}/getUpdates?offset=${offset}&timeout=30`);
    const data = await res.json();
    if (data.ok && data.result.length > 0) {
      for (const u of data.result) {
        offset = u.update_id + 1;
        if (u.message) await handleMessage(u.message);
        if (u.callback_query) await handleCallback(u.callback_query);
      }
    }
  } catch (e) { console.error("Poll:", e.message); }
  setTimeout(poll, 1000);
}

// HTTP health-check для Railway
const http = require("http");
http.createServer((req, res) => { res.writeHead(200); res.end("OK"); }).listen(process.env.PORT || 3000);

async function start() {
  console.log("🤖 НЕЙРО бот v3 запускается...");
  const wh = await api("deleteWebhook", { drop_pending_updates: false });
  if (wh?.ok) console.log("✅ Webhook сброшен");
  const me = await api("getMe");
  if (!me?.ok) { console.error("❌ Токен неверный"); process.exit(1); }
  console.log(`✅ Бот: @${me.result.username}`);
  poll();
}

start();
