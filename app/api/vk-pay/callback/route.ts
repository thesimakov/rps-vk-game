import { NextResponse } from "next/server"

// Callback-роут для платёжных уведомлений ВКонтакте (игры, внутренняя валюта).
// Этот URL нужно указать в настройках игры:
// «Платежи» → «Подключение» → «URL для платёжных уведомлений ВКонтакте».
//
// Минимальный каркас:
// - принимает POST-запросы от ВК в формате x-www-form-urlencoded;
// - различает боевые и тестовые уведомления по постфиксу "_test"
//   в notification_type (см. https://dev.vk.com/ru/api/payments/testing);
// - возвращает JSON-ответ с кодом 200, чтобы URL считался «живым».
//
// В боевом варианте сюда нужно добавить:
// - разбор notification_type / order_id / user_id и других параметров;
// - проверку подписи (sig) по VK_SECRET_KEY;
// - начисление средств/товаров пользователю при успешной оплате;
// - корректные ответы в формате, описанном в доке «Платежи виртуальной валютой».
//
export const dynamic = "force-static"

export async function POST(req: Request) {
  try {
    // Попробуем прочитать тело как x-www-form-urlencoded (формат нотификаций ВК).
    const text = await req.text()
    const params = new URLSearchParams(text)

    const rawNotificationType = params.get("notification_type") ?? ""
    const userId = params.get("user_id") ?? ""
    const orderId = params.get("order_id") ?? ""

    // Поддержка тестового режима платежей:
    // В тестовом режиме ВК добавляет к notification_type постфикс "_test",
    // например, вместо "get_item" приходит "get_item_test"
    // (см. https://dev.vk.com/ru/api/payments/testing).
    const isTest = rawNotificationType.endsWith("_test")
    const notificationType = isTest
      ? rawNotificationType.slice(0, -"_test".length)
      : rawNotificationType

    // Здесь можно добавить логирование или запись в отдельный лог-файл/БД.
    // Пока просто возвращаем базовый ответ, чтобы URL считался «живым».

    return NextResponse.json({
      ok: true,
      notification_type: notificationType,
      notification_type_raw: rawNotificationType,
      is_test: isTest,
      user_id: userId,
      order_id: orderId,
    })
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}

