// =============================================
// НЕЙРО — Telegram прогрев-бот
// Деплой: Railway.app (бесплатно) — см. README
// =============================================

const TOKEN = "8605154591:AAGV2r2mvzxrj2ZKH6IlX_z4Vyl8X5v25T4";
const OWNER_CHAT_ID = 551749665;
const API = `https://api.telegram.org/bot${TOKEN}`;

// Хранилище пользователей (в памяти — для продакшна замените на БД)
const users = {};

// =============================================
// СЦЕНАРИЙ ПРОГРЕВА
// =============================================
const WARMUP_SEQUENCE = [
  {
    delay: 0,
    text: `👋 Привет! Я — бот команды *НЕЙРО*.

Мы внедряем искусственный интеллект в российский бизнес — без иностранного ПО и санкционных рисков.

Вот 3 вещи, которые я пришлю вам прямо сейчас:
• Кейс: как ретейлер сократил нагрузку на поддержку на 78%
• Кейс: контроль качества на заводе через компьютерное зрение
• Чек-лист: «Готов ли ваш бизнес к ИИ»

Начнём? 👇`,
    keyboard: {
      inline_keyboard: [[
        { text: "Да, интересно →", callback_data: "case_1" }
      ]]
    }
  }
];

const CASES = {
  case_1: {
    text: `📦 *Кейс 1 — Ретейл / E-commerce*

Интернет-магазин получил чат-бота на GigaChat, который обрабатывает 85% обращений без участия оператора.

*Результат за 3 месяца:*
• —78% нагрузки на поддержку
• +31% NPS клиентов
• Запуск за 3 недели

Похожий бот стоит от 180 000 ₽ и окупается за 2–3 месяца при команде поддержки от 3 человек.`,
    keyboard: {
      inline_keyboard: [[
        { text: "Следующий кейс →", callback_data: "case_2" }
      ]]
    }
  },
  case_2: {
    text: `🏭 *Кейс 2 — Производство*

Завод по производству металлоконструкций внедрил vision-систему для автоматической проверки дефектов на конвейере.

*Результат:*
• —94% брака до клиента
• ×4 скорость проверки
• —3 сотрудника в смене ОТК

Система работает 24/7 и не устаёт. Средний срок окупаемости — 8 месяцев.`,
    keyboard: {
      inline_keyboard: [[
        { text: "Получить чек-лист →", callback_data: "checklist" }
      ]]
    }
  },
  checklist: {
    text: `✅ *Чек-лист: «Готов ли ваш бизнес к ИИ»*

Отметьте пункты, которые актуальны для вас:

☐ Есть повторяющиеся ручные процессы (документы, звонки, сортировка)
☐ Сотрудники тратят >2 часов/день на рутину
☐ Хотите снизить зависимость от человеческого фактора
☐ Нужно обрабатывать больше заявок без роста штата
☐ Хотите прогнозировать спрос или отток клиентов

*Если отметили 2+ пункта — у вас есть потенциал для внедрения ИИ.*

Хотите узнать, сколько это будет стоить и окупится ли в вашем случае?`,
    keyboard: {
      inline_keyboard: [[
        { text: "🎯 Записаться на бесплатный аудит", callback_data: "book_audit" }
      ]]
    }
  },
  book_audit: {
    text: `🎯 *Бесплатный экспресс-аудит — 45 минут*

На консультации мы:
• Разберём ваши процессы и найдём точки автоматизации
• Покажем кейсы из вашей отрасли
• Дадим оценку ROI и сроков

*Это бесплатно и ни к чему не обязывает.*

Оставьте ваш контакт — и мы свяжемся в течение 2 часов:`,
    keyboard: {
      inline_keyboard: [[
        { text: "📞 Оставить заявку на сайте", url: "https://blackithart.com/#form" }
      ]]
    }
  }
};

// Отложенные сообщения (прогрев)
const DELAYED_MESSAGES = [
  {
    hours: 24,
    text: `💡 *Один вопрос*

Вчера вы смотрели наши кейсы по ИИ.

Часто компании откладывают внедрение, потому что кажется — это дорого, долго, сложно.

На самом деле первый работающий ИИ-инструмент можно запустить за 2–4 недели и окупить за 2–3 месяца.

Если хотите — расскажу, как это выглядит конкретно для вашей отрасли. Просто напишите сферу вашего бизнеса 👇`
  },
  {
    hours: 72,
    text: `📊 *Цифра дня*

Российские компании, внедрившие ИИ в 2024–2025 году, в среднем сократили операционные расходы на 23% за первый год.

Самые популярные направления:
1. Автоматизация документооборота
2. ИИ-поддержка клиентов
3. Предиктивная аналитика

Хотите узнать, что из этого подойдёт именно вам?`,
    keyboard: {
      inline_keyboard: [[
        { text: "Да, хочу узнать →", callback_data: "book_audit" }
      ]]
    }
  },
  {
    hours: 168,
    text: `🔔 *Последнее сообщение от нас*

Мы не хотим спамить — поэтому это последнее автоматическое сообщение.

Если тема ИИ для бизнеса актуальна — мы готовы провести бесплатный аудит и показать конкретные цифры для вашего случая.

Если не актуально — просто проигнорируйте это сообщение, мы больше не побеспокоим.

Спасибо, что уделили время! 🙏`,
      keyboard: {
        inline_keyboard: [[
          { text: "Всё-таки хочу аудит →", callback_data: "book_audit" }
        ]]
      }
    }
];

// =============================================
// УТИЛИТЫ
// =============================================
async function send(chat_id, text, extra = {}) {
  await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id, text, parse_mode: "Markdown", ...extra })
  });
}

async function notifyOwner(user) {
  const msg =
    `🤖 *Новый пользователь в боте*\n\n` +
    `👤 ${user.first_name || ""} ${user.last_name || ""}\n` +
    `🔗 @${user.username || "нет username"}\n` +
    `🆔 chat_id: ${user.id}`;
  await send(OWNER_CHAT_ID, msg);
}

function scheduleMessage(chat_id, hours, text, keyboard) {
  const ms = hours * 60 * 60 * 1000;
  setTimeout(async () => {
    if (users[chat_id] && !users[chat_id].unsubscribed) {
      await send(chat_id, text, keyboard ? { reply_markup: keyboard } : {});
    }
  }, ms);
}

// =============================================
// ОБРАБОТКА СОБЫТИЙ
// =============================================
async function handleStart(msg) {
  const chat_id = msg.chat.id;
  const user = msg.from;

  if (!users[chat_id]) {
    users[chat_id] = { ...user, started_at: Date.now() };
    await notifyOwner(user);

    // Первое сообщение
    const first = WARMUP_SEQUENCE[0];
    await send(chat_id, first.text, { reply_markup: first.keyboard });

    // Планируем отложенные сообщения
    for (const m of DELAYED_MESSAGES) {
      scheduleMessage(chat_id, m.hours, m.text, m.keyboard);
    }
  } else {
    await send(chat_id, "Рад снова вас видеть! 👋\n\nИспользуйте кнопки ниже или напишите /help");
  }
}

async function handleCallback(query) {
  const chat_id = query.message.chat.id;
  const data = query.data;

  // Подтверждаем нажатие
  await fetch(`${API}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: query.id })
  });

  const response = CASES[data];
  if (response) {
    await send(chat_id, response.text, response.keyboard ? { reply_markup: response.keyboard } : {});
  }
}

async function handleMessage(msg) {
  const chat_id = msg.chat.id;
  const text = msg.text || "";

  if (text === "/start") return handleStart(msg);
  if (text === "/stop") {
    users[chat_id] = { ...users[chat_id], unsubscribed: true };
    await send(chat_id, "Вы отписались от рассылки. Если захотите вернуться — напишите /start");
    return;
  }
  if (text === "/help") {
    await send(chat_id,
      `📋 *Команды бота:*\n\n` +
      `/start — начать\n` +
      `/stop — отписаться от рассылки\n\n` +
      `Или просто напишите нам — мы живые люди 😊`
    );
    return;
  }

  // Пересылаем сообщение владельцу
  await send(OWNER_CHAT_ID,
    `💬 *Сообщение от пользователя*\n\n` +
    `👤 ${msg.from.first_name || ""} (@${msg.from.username || "нет"})\n` +
    `chat_id: ${chat_id}\n\n` +
    `"${text}"\n\n` +
    `Ответить: нажмите Reply на это сообщение (используйте отдельный бот для ответов)`
  );
  await send(chat_id, "✅ Ваше сообщение получено! Мы ответим в ближайшее время.");
}

// =============================================
// LONG POLLING
// =============================================
let offset = 0;

async function poll() {
  try {
    const res = await fetch(`${API}/getUpdates?offset=${offset}&timeout=30`);
    const data = await res.json();

    if (data.ok && data.result.length > 0) {
      for (const update of data.result) {
        offset = update.update_id + 1;

        if (update.message) await handleMessage(update.message);
        if (update.callback_query) await handleCallback(update.callback_query);
      }
    }
  } catch (e) {
    console.error("Poll error:", e.message);
  }
  setTimeout(poll, 1000);
}

console.log("🤖 НЕЙРО бот запущен...");
poll();
