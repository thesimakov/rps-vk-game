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
const IS_STATIC_EXPORT = process.env.NEXT_OUTPUT_EXPORT === "export"
export const dynamic = "force-static"

type VkCatalogItem = {
  itemId: string
  amount: number
  votes: number
}

const CATALOG: VkCatalogItem[] = [
  { itemId: "coins_100", amount: 100, votes: 1 },
  { itemId: "coins_200", amount: 200, votes: 2 },
  { itemId: "coins_300", amount: 300, votes: 3 },
  { itemId: "coins_500", amount: 500, votes: 5 },
  { itemId: "coins_700", amount: 700, votes: 7 },
  { itemId: "coins_1000", amount: 1000, votes: 10 },
]

function toAppOrderId(orderId: string): number {
  const direct = Number(orderId)
  if (Number.isFinite(direct) && direct > 0) return Math.floor(direct)
  let hash = 0
  for (let i = 0; i < orderId.length; i += 1) hash = (hash * 31 + orderId.charCodeAt(i)) >>> 0
  return (hash % 900000000) + 100000000
}

export async function POST(req: Request) {
  if (IS_STATIC_EXPORT) {
    return NextResponse.json({ ok: false, error: "no_server" }, { status: 501 })
  }
  try {
    // Попробуем прочитать тело как x-www-form-urlencoded (формат нотификаций ВК).
    const text = await req.text()
    const params = new URLSearchParams(text)

    const rawNotificationType = params.get("notification_type") ?? ""
    const userId = params.get("user_id") ?? ""
    const orderId = params.get("order_id") ?? ""
    const itemId = params.get("item") ?? ""

    // Поддержка тестового режима платежей:
    // В тестовом режиме ВК добавляет к notification_type постфикс "_test",
    // например, вместо "get_item" приходит "get_item_test"
    // (см. https://dev.vk.com/ru/api/payments/testing).
    const isTest = rawNotificationType.endsWith("_test")
    const notificationType = isTest
      ? rawNotificationType.slice(0, -"_test".length)
      : rawNotificationType

    if (notificationType === "get_item") {
      const item = CATALOG.find((i) => i.itemId === itemId)
      if (!item) {
        return NextResponse.json({
          error: {
            error_code: 20,
            error_msg: `Unknown item: ${itemId}`,
            critical: false,
          },
        })
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://vk.com"
      return NextResponse.json({
        response: {
          item_id: item.itemId,
          title: `${item.amount} монет`,
          price: item.votes,
          photo_url: `${baseUrl}/logo.png`,
        },
      })
    }

    if (notificationType === "order_status_change") {
      // Подтверждаем заказ ВК. Здесь же можно начислять монеты в БД.
      return NextResponse.json({
        response: {
          order_id: orderId,
          app_order_id: toAppOrderId(orderId),
        },
      })
    }

    // Для прочих служебных типов оставляем "живой" ответ для диагностики.

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

