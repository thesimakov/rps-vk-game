import { NextResponse } from "next/server"

// Callback-роут для платёжных уведомлений ВКонтакте (игры, голоса).
// Этот URL нужно указать в настройках игры:
// «Платежи» → «Подключение» → «URL для платёжных уведомлений ВКонтакте».
//
// Сейчас реализован минимальный каркас:
// - принимает любые POST-запросы от ВК,
// - возвращает { ok: true } с кодом 200.
//
// В боевом варианте сюда нужно добавить:
// - разбор notification_type / order_id / user_id и других параметров;
// - проверку подписи (sig) по VK_SECRET_KEY;
// - начисление голосов/товаров пользователю при успешной оплате;
// - корректные ответы в формате, описанном в доке «Платежи виртуальной валютой».

export const dynamic = "force-static"

export async function POST(req: Request) {
  try {
    // Попробуем прочитать тело как x-www-form-urlencoded (формат нотификаций ВК).
    const text = await req.text()
    const params = new URLSearchParams(text)

    const notificationType = params.get("notification_type") ?? ""
    const userId = params.get("user_id") ?? ""
    const orderId = params.get("order_id") ?? ""

    // Здесь можно добавить логирование или запись в отдельный лог-файл/БД.
    // Пока просто возвращаем базовый ответ, чтобы URL считался «живым».

    return NextResponse.json({
      ok: true,
      notification_type: notificationType,
      user_id: userId,
      order_id: orderId,
    })
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}

