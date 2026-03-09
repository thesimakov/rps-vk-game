(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/lib/vk-bridge.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getBridgeReady",
    ()=>getBridgeReady,
    "getVKUser",
    ()=>getVKUser,
    "initVKBridge",
    ()=>initVKBridge,
    "isVKEnvironment",
    ()=>isVKEnvironment,
    "joinVKGroup",
    ()=>joinVKGroup,
    "purchaseVKVoices",
    ()=>purchaseVKVoices,
    "requestWithdraw",
    ()=>requestWithdraw,
    "showFriendsPicker",
    ()=>showFriendsPicker,
    "showInviteBox",
    ()=>showInviteBox,
    "showVKPayment",
    ()=>showVKPayment,
    "showWallPostBox",
    ()=>showWallPostBox
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"use client";
let bridgeReady = false;
async function initVKBridge() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        const vkBridge = await __turbopack_context__.A("[project]/node_modules/.pnpm/@vkontakte+vk-bridge@2.15.11/node_modules/@vkontakte/vk-bridge/dist/index.umd.js [app-client] (ecmascript, async loader)");
        await vkBridge.default.send("VKWebAppInit");
        bridgeReady = true;
    } catch  {
        bridgeReady = false;
    }
}
function getBridgeReady() {
    return bridgeReady;
}
async function getVKUser() {
    if (!bridgeReady) {
        return {
            id: 1,
            first_name: "Игрок",
            last_name: "",
            photo_100: "",
            photo_200: ""
        };
    }
    try {
        const vkBridge = await __turbopack_context__.A("[project]/node_modules/.pnpm/@vkontakte+vk-bridge@2.15.11/node_modules/@vkontakte/vk-bridge/dist/index.umd.js [app-client] (ecmascript, async loader)");
        const data = await vkBridge.default.send("VKWebAppGetUserInfo");
        return data;
    } catch  {
        return null;
    }
}
async function purchaseVKVoices(amount) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    if (!bridgeReady) return true // dev: вне ВК симулируем успех
    ;
    try {
        const vkBridge = await __turbopack_context__.A("[project]/node_modules/.pnpm/@vkontakte+vk-bridge@2.15.11/node_modules/@vkontakte/vk-bridge/dist/index.umd.js [app-client] (ecmascript, async loader)");
        const payload = {
            action: "pay-to-service",
            amount
        };
        // В продакшене: const { app_id, hash } = await fetchFromBackend('/payment/sign', { amount }); payload.app_id = app_id; payload.hash = hash;
        const res = await vkBridge.default.send("VKWebAppOpenPayForm", payload);
        const result = res && typeof res === "object" ? res.result : undefined;
        return result !== false;
    } catch  {
        try {
            await (await __turbopack_context__.A("[project]/node_modules/.pnpm/@vkontakte+vk-bridge@2.15.11/node_modules/@vkontakte/vk-bridge/dist/index.umd.js [app-client] (ecmascript, async loader)")).default.send("VKWebAppShowOrderBox", {
                type: "item",
                item: `voices_${amount}`
            });
            return true;
        } catch  {
            return false;
        }
    }
}
async function showVKPayment(amount) {
    return purchaseVKVoices(amount);
}
async function requestWithdraw(amount) {
    if (amount < 10) return false;
    if (!bridgeReady) return new Promise((r)=>setTimeout(()=>r(true), 1200)) // dev
    ;
    // В продакшене: const ok = await fetch('/api/withdraw', { method: 'POST', body: JSON.stringify({ amount, user_id: vkUserId }) }).then(r => r.ok);
    return new Promise((resolve)=>setTimeout(()=>resolve(true), 1200));
}
function isVKEnvironment() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return window.location.search.includes("vk_") || bridgeReady;
}
async function showFriendsPicker() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    if (!bridgeReady) {
        // В dev без ВК — мок: возвращаем пустой массив или тестовых друзей
        return [];
    }
    try {
        const vkBridge = await __turbopack_context__.A("[project]/node_modules/.pnpm/@vkontakte+vk-bridge@2.15.11/node_modules/@vkontakte/vk-bridge/dist/index.umd.js [app-client] (ecmascript, async loader)");
        const res = await vkBridge.default.send("VKWebAppGetFriends", {
            multi: true
        });
        const data = res && typeof res === "object" ? res : undefined;
        return data?.users ?? null;
    } catch  {
        return null;
    }
}
async function joinVKGroup() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    if (!bridgeReady) return true // dev-окружение: считаем, что подписка прошла
    ;
    const rawId = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_VK_GROUP_ID;
    const groupId = rawId ? Number(rawId) : NaN;
    if (!Number.isFinite(groupId) || groupId <= 0) return false;
    try {
        const vkBridge = await __turbopack_context__.A("[project]/node_modules/.pnpm/@vkontakte+vk-bridge@2.15.11/node_modules/@vkontakte/vk-bridge/dist/index.umd.js [app-client] (ecmascript, async loader)");
        await vkBridge.default.send("VKWebAppJoinGroup", {
            group_id: groupId
        });
        return true;
    } catch  {
        return false;
    }
}
async function showInviteBox() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    if (!bridgeReady) return true;
    try {
        const vkBridge = await __turbopack_context__.A("[project]/node_modules/.pnpm/@vkontakte+vk-bridge@2.15.11/node_modules/@vkontakte/vk-bridge/dist/index.umd.js [app-client] (ecmascript, async loader)");
        await vkBridge.default.send("VKWebAppShowInviteBox", {});
        return true;
    } catch  {
        return false;
    }
}
async function showWallPostBox(message, attachments) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    if (!bridgeReady) return 1;
    try {
        const vkBridge = await __turbopack_context__.A("[project]/node_modules/.pnpm/@vkontakte+vk-bridge@2.15.11/node_modules/@vkontakte/vk-bridge/dist/index.umd.js [app-client] (ecmascript, async loader)");
        const payload = {
            message
        };
        if (attachments) payload.attachments = attachments;
        const res = await vkBridge.default.send("VKWebAppShowWallPostBox", payload);
        const data = res && typeof res === "object" ? res : undefined;
        return data?.post_id ?? null;
    } catch  {
        return null;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/vk-oauth.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "VK_OAUTH_MESSAGE_TYPE",
    ()=>VK_OAUTH_MESSAGE_TYPE,
    "clearVKOAuthSession",
    ()=>clearVKOAuthSession,
    "fetchVKUserByToken",
    ()=>fetchVKUserByToken,
    "getStoredVKOAuthSession",
    ()=>getStoredVKOAuthSession,
    "getVKOAuthPopupCallbackUrl",
    ()=>getVKOAuthPopupCallbackUrl,
    "getVKOAuthRedirectUrl",
    ()=>getVKOAuthRedirectUrl,
    "isVKOAuthConfigured",
    ()=>isVKOAuthConfigured,
    "openVKOAuthPopup",
    ()=>openVKOAuthPopup,
    "parseVKHashFragment",
    ()=>parseVKHashFragment,
    "saveVKOAuthSession",
    ()=>saveVKOAuthSession
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"use client";
const VK_OAUTH_STORAGE_KEY = "rps_vk_oauth";
const VK_API_VERSION = "5.199";
function getAppId() {
    return typeof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_VK_APP_ID === "string" ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_VK_APP_ID : "";
}
/** Полный Redirect URI из .env — должен **дословно** совпадать с настройками приложения ВК (иначе Security Error). */ function getConfiguredRedirectUri() {
    const env = typeof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_VK_REDIRECT_URI === "string" ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_VK_REDIRECT_URI.trim() : "";
    return env || null;
}
function getVKOAuthRedirectUrl(redirectUri) {
    const clientId = getAppId();
    if (!clientId) {
        console.warn("NEXT_PUBLIC_VK_APP_ID не задан — вход через ВК на своём сервере недоступен");
    }
    const base = ("TURBOPACK compile-time truthy", 1) ? window.location.origin + window.location.pathname : "TURBOPACK unreachable";
    const redirect = redirectUri ?? base;
    const params = new URLSearchParams({
        client_id: clientId || "0",
        redirect_uri: redirect,
        response_type: "token",
        scope: "",
        v: VK_API_VERSION,
        revoke: "1"
    });
    return `https://oauth.vk.com/authorize?${params.toString()}`;
}
function getVKOAuthPopupCallbackUrl() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const configured = getConfiguredRedirectUri();
    if (configured) return configured;
    const origin = window.location.origin.replace(/\/$/, "");
    return `${origin}/vk-callback`;
}
const VK_OAUTH_MESSAGE_TYPE = "rps_vk_oauth_result";
function openVKOAuthPopup() {
    return new Promise((resolve)=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        const callbackUrl = getVKOAuthPopupCallbackUrl();
        const authUrl = getVKOAuthRedirectUrl(callbackUrl);
        const width = 600;
        const height = 500;
        const left = Math.round((window.screen.width - width) / 2);
        const top = Math.round((window.screen.height - height) / 2);
        const popup = window.open(authUrl, "vk_oauth", `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`);
        if (!popup) {
            resolve({
                blocked: true
            });
            return;
        }
        const handleMessage = (event)=>{
            if (event.origin !== window.location.origin) return;
            const data = event.data;
            if (data?.type !== VK_OAUTH_MESSAGE_TYPE) return;
            cleanup();
            try {
                popup.close();
            } catch  {
            // ignore
            }
            resolve({
                access_token: data.access_token,
                user_id: data.user_id,
                expires_in: data.expires_in ?? 0
            });
        };
        const checkClosed = setInterval(()=>{
            if (popup.closed) {
                cleanup();
                resolve(null); // пользователь закрыл окно без авторизации
            }
        }, 300);
        const cleanup = ()=>{
            clearInterval(checkClosed);
            window.removeEventListener("message", handleMessage);
        };
        window.addEventListener("message", handleMessage);
    });
}
function parseVKHashFragment(hash) {
    if (!hash || !hash.startsWith("#")) return null;
    const params = new URLSearchParams(hash.slice(1));
    const access_token = params.get("access_token");
    const user_id = params.get("user_id");
    const expires_in = params.get("expires_in");
    if (!access_token || !user_id) return null;
    const uid = parseInt(user_id, 10);
    const exp = expires_in ? parseInt(expires_in, 10) : 0;
    if (!Number.isFinite(uid)) return null;
    return {
        access_token,
        user_id: uid,
        expires_in: exp
    };
}
async function fetchVKUserByToken(accessToken, userId) {
    const url = new URL("https://api.vk.com/method/users.get");
    url.searchParams.set("user_ids", String(userId));
    url.searchParams.set("fields", "photo_100,photo_200");
    url.searchParams.set("access_token", accessToken);
    url.searchParams.set("v", VK_API_VERSION);
    try {
        const res = await fetch(url.toString());
        const data = await res.json();
        const user = data?.response?.[0];
        if (!user) return null;
        return {
            id: user.id,
            first_name: user.first_name ?? "",
            last_name: user.last_name ?? "",
            photo_100: user.photo_100 ?? "",
            photo_200: user.photo_200 ?? user.photo_100 ?? ""
        };
    } catch  {
        return null;
    }
}
const SESSION_KEY = "rps_vk_oauth_session";
function saveVKOAuthSession(session) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch  {
    // ignore
    }
}
function getStoredVKOAuthSession() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        const raw = window.localStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const session = JSON.parse(raw);
        if (!session?.access_token || !session?.user || !session.expires_at) return null;
        if (session.expires_at * 1000 < Date.now()) {
            clearVKOAuthSession();
            return null;
        }
        return session;
    } catch  {
        return null;
    }
}
function clearVKOAuthSession() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        window.localStorage.removeItem(SESSION_KEY);
    } catch  {
    // ignore
    }
}
function isVKOAuthConfigured() {
    return !!getAppId();
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/game-context.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BOT_AVATAR_URL",
    ()=>BOT_AVATAR_URL,
    "GameProvider",
    ()=>GameProvider,
    "MIN_BETS_DISPLAY",
    ()=>MIN_BETS_DISPLAY,
    "getFillerBetEntries",
    ()=>getFillerBetEntries,
    "useGame",
    ()=>useGame
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$vk$2d$bridge$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/vk-bridge.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$vk$2d$oauth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/vk-oauth.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
const BOT_AVATAR_URL = (seed)=>{
    const num = parseInt(seed.replace(/\D/g, ""), 10) || 0;
    const portraitId = num % 99 + 1;
    const gender = num % 2 ? "women" : "men";
    return `https://randomuser.me/api/portraits/${gender}/${portraitId}.jpg`;
};
_c = BOT_AVATAR_URL;
const GameContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(null);
/** 50 ботов для матчей, ставок и рейтинга: русские имена + имена стран СНГ */ const BOT_NAMES = [
    {
        name: "Алексей",
        avatar: "А",
        vip: false
    },
    {
        name: "Мария",
        avatar: "М",
        vip: true
    },
    {
        name: "Дмитрий",
        avatar: "Д",
        vip: false
    },
    {
        name: "Оксана",
        avatar: "О",
        vip: true
    },
    {
        name: "Никита",
        avatar: "Н",
        vip: false
    },
    {
        name: "Ольга",
        avatar: "О",
        vip: true
    },
    {
        name: "Сергей",
        avatar: "С",
        vip: false
    },
    {
        name: "Анна",
        avatar: "А",
        vip: false
    },
    {
        name: "Тарас",
        avatar: "Т",
        vip: false
    },
    {
        name: "Елена",
        avatar: "Е",
        vip: false
    },
    {
        name: "Нурлан",
        avatar: "Н",
        vip: false
    },
    {
        name: "Татьяна",
        avatar: "Т",
        vip: true
    },
    {
        name: "Асель",
        avatar: "А",
        vip: false
    },
    {
        name: "Наталья",
        avatar: "Н",
        vip: false
    },
    {
        name: "Михаил",
        avatar: "М",
        vip: false
    },
    {
        name: "Юлия",
        avatar: "Ю",
        vip: true
    },
    {
        name: "Ерлан",
        avatar: "Е",
        vip: false
    },
    {
        name: "Светлана",
        avatar: "С",
        vip: false
    },
    {
        name: "Александр",
        avatar: "А",
        vip: true
    },
    {
        name: "Динара",
        avatar: "Д",
        vip: true
    },
    {
        name: "Роман",
        avatar: "Р",
        vip: false
    },
    {
        name: "Виктория",
        avatar: "В",
        vip: false
    },
    {
        name: "Артём",
        avatar: "А",
        vip: false
    },
    {
        name: "Нигора",
        avatar: "Н",
        vip: false
    },
    {
        name: "Максим",
        avatar: "М",
        vip: true
    },
    {
        name: "Рустам",
        avatar: "Р",
        vip: false
    },
    {
        name: "Кирилл",
        avatar: "К",
        vip: false
    },
    {
        name: "Алина",
        avatar: "А",
        vip: false
    },
    {
        name: "Армен",
        avatar: "А",
        vip: false
    },
    {
        name: "Валерия",
        avatar: "В",
        vip: true
    },
    {
        name: "Егор",
        avatar: "Е",
        vip: false
    },
    {
        name: "Лусине",
        avatar: "Л",
        vip: false
    },
    {
        name: "Даниил",
        avatar: "Д",
        vip: false
    },
    {
        name: "Марина",
        avatar: "М",
        vip: false
    },
    {
        name: "Георгий",
        avatar: "Г",
        vip: false
    },
    {
        name: "София",
        avatar: "С",
        vip: true
    },
    {
        name: "Николай",
        avatar: "Н",
        vip: false
    },
    {
        name: "Нино",
        avatar: "Н",
        vip: false
    },
    {
        name: "Станислав",
        avatar: "С",
        vip: false
    },
    {
        name: "Эльдар",
        avatar: "Э",
        vip: false
    },
    {
        name: "Глеб",
        avatar: "Г",
        vip: false
    },
    {
        name: "Севиль",
        avatar: "С",
        vip: false
    },
    {
        name: "Фёдор",
        avatar: "Ф",
        vip: false
    },
    {
        name: "Олеся",
        avatar: "О",
        vip: false
    },
    {
        name: "Лев",
        avatar: "Л",
        vip: true
    },
    {
        name: "Янина",
        avatar: "Я",
        vip: false
    },
    {
        name: "Захар",
        avatar: "З",
        vip: false
    },
    {
        name: "Айдай",
        avatar: "А",
        vip: false
    },
    {
        name: "Богдан",
        avatar: "Б",
        vip: false
    },
    {
        name: "Регина",
        avatar: "Р",
        vip: false
    }
];
/** Детерминированные значения по индексу (без Math.random/Date.now), чтобы SSR и клиент совпадали при гидратации */ function buildBots() {
    return BOT_NAMES.map((b, i)=>{
        const id = `bot-${i}`;
        const wins = 10 + i * 17 % 90;
        return {
            id,
            name: b.name,
            avatar: b.avatar,
            avatarUrl: BOT_AVATAR_URL(id),
            balance: 300 + i * 37 % 1000,
            wins,
            losses: 5 + i * 11 % 50,
            weekWins: Math.floor(wins / 3),
            weekEarnings: 50 + i * 23 % 400,
            vip: b.vip
        };
    });
}
function buildLeaderboardFromBots(bots) {
    return bots.map((b, i)=>({
            id: `lb-${b.id}`,
            name: b.name,
            avatar: b.avatar,
            avatarUrl: b.avatarUrl,
            wins: b.wins + i * 7 % 20,
            earnings: b.weekEarnings * 8 + i * 13 % 500,
            vip: b.vip
        }));
}
/** Базовая метка времени для createdAt (фиксированная, чтобы не ломать гидратацию) */ const MOCK_BETS_BASE_TIME = 1000000000000;
function buildMockBetsFromBots(bots) {
    return bots.slice(0, 20).map((b, i)=>({
            id: `bet-${b.id}-${i}`,
            creatorId: b.id,
            creatorName: b.name,
            creatorAvatar: b.avatar,
            creatorAvatarUrl: b.avatarUrl,
            creatorWins: b.wins,
            amount: [
                25,
                50,
                100,
                150,
                200
            ][i % 5],
            createdAt: MOCK_BETS_BASE_TIME - (i + 1) * 60000,
            vip: b.vip
        }));
}
const OPPONENTS = buildBots();
const STATIC_LEADERBOARD = buildLeaderboardFromBots(OPPONENTS);
_c1 = STATIC_LEADERBOARD;
const MOCK_BETS = buildMockBetsFromBots(OPPONENTS);
_c2 = MOCK_BETS;
const MIN_BETS_DISPLAY = 10;
const BET_AMOUNTS = [
    25,
    50,
    100,
    150,
    200
];
function getFillerBetEntries(count) {
    if (count <= 0) return [];
    const base = Date.now();
    return Array.from({
        length: count
    }, (_, i)=>{
        const bot = OPPONENTS[i % OPPONENTS.length];
        return {
            id: `filler-${i}-${bot.id}`,
            creatorId: bot.id,
            creatorName: bot.name,
            creatorAvatar: bot.avatar,
            creatorAvatarUrl: bot.avatarUrl,
            creatorWins: bot.wins,
            amount: BET_AMOUNTS[i % BET_AMOUNTS.length],
            createdAt: base - (i + 1) * 1000,
            vip: bot.vip
        };
    });
}
/** Интервал обновления рейтинга — каждые 30 секунд (видно изменение голосов и мест) */ const LEADERBOARD_UPDATE_MS = 30 * 1000;
/** Сохранение в localStorage: версия для совместимости при будущих обновлениях */ const SAVE_STORAGE_KEY = "rps_vk_save";
const SAVE_VERSION = 2;
const DEFAULT_PLAYER = {
    id: "player1",
    name: "Игрок",
    avatar: "И",
    avatarUrl: "",
    balance: 100,
    wins: 0,
    losses: 0,
    weekWins: 0,
    weekEarnings: 0,
    vip: false,
    ratingPoints: 0,
    totalPurchases: 0,
    groupSubscribedRewardClaimed: false
};
function loadSavedState() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        const raw = window.localStorage.getItem(SAVE_STORAGE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (!data || data.version != null && data.version > SAVE_VERSION) return null;
        const player = {
            ...DEFAULT_PLAYER,
            ...data.player
        };
        const withdrawState = data.withdrawState && typeof data.withdrawState.amount === "number" ? {
            date: String(data.withdrawState.date ?? ""),
            amount: Number(data.withdrawState.amount)
        } : {
            date: "",
            amount: 0
        };
        const lavaCardStock = typeof data.lavaCardStock === "number" ? Math.max(0, data.lavaCardStock) : 3;
        return {
            player,
            withdrawState,
            lavaCardStock
        };
    } catch  {
        return null;
    }
}
function saveState(player, withdrawState, lavaCardStock) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify({
            version: SAVE_VERSION,
            player: {
                id: player.id,
                name: player.name,
                avatar: player.avatar,
                avatarUrl: player.avatarUrl,
                balance: player.balance,
                wins: player.wins,
                losses: player.losses,
                weekWins: player.weekWins,
                weekEarnings: player.weekEarnings,
                vip: player.vip,
                ratingPoints: player.ratingPoints,
                totalPurchases: player.totalPurchases,
                fastMatchBoosts: player.fastMatchBoosts,
                victoryAnimation: player.victoryAnimation,
                cardSkin: player.cardSkin,
                avatarFrame: player.avatarFrame,
                tournamentEntry: player.tournamentEntry,
                hideVkAvatar: player.hideVkAvatar,
                lavaCardUses: player.lavaCardUses,
                waterCardUses: player.waterCardUses,
                invitedFriends: player.invitedFriends,
                invitedRewardClaimed: player.invitedRewardClaimed,
                wallPostRewardClaimed: player.wallPostRewardClaimed,
                groupSubscribedRewardClaimed: player.groupSubscribedRewardClaimed,
                lastDailyGiftClaimedAt: player.lastDailyGiftClaimedAt,
                dailyRewardIndex: player.dailyRewardIndex
            },
            withdrawState: {
                date: withdrawState.date,
                amount: withdrawState.amount
            },
            lavaCardStock
        }));
    } catch  {
    // ignore
    }
}
function shuffleEarnings(entries) {
    return entries.map((e)=>({
            ...e,
            earnings: Math.max(0, e.earnings + Math.floor((Math.random() - 0.5) * 80)),
            wins: Math.max(0, e.wins + Math.floor((Math.random() - 0.5) * 4))
        }));
}
function GameProvider({ children }) {
    _s();
    const [screen, setScreen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("entry");
    const [vkUser, setVkUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [player, setPlayer] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(DEFAULT_PLAYER);
    const [opponent, setOpponent] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [currentBet, setCurrentBet] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(5);
    const [lastResult, setLastResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [bets, setBets] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(MOCK_BETS);
    const [pendingBet, setPendingBet] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [betResponse, setBetResponse] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [leaderboardVersion, setLeaderboardVersion] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [totalRounds, setTotalRounds] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const [withdrawState, setWithdrawState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        date: "",
        amount: 0
    });
    const [lavaCardStock, setLavaCardStock] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(3);
    const [hasLoadedSave, setHasLoadedSave] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const leaderboardDataRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(STATIC_LEADERBOARD.map({
        "GameProvider.useRef[leaderboardDataRef]": (e)=>({
                ...e
            })
    }["GameProvider.useRef[leaderboardDataRef]"]));
    const betResponseTimeoutRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    /** Таймер: через 1 мин без принятия ставки робот подхватывает, если сумма ≤ 100 */ const botAutoAcceptTimeoutRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const pendingBetRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GameProvider.useEffect": ()=>{
            pendingBetRef.current = pendingBet;
        }
    }["GameProvider.useEffect"], [
        pendingBet
    ]);
    const lastBotBetAddedRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    const screenRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])("entry");
    // Динамика ставок: у роботов botExpiresAt ~15 сек, потом ставка исчезает и список подтягивается; периодически добавляется новая
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GameProvider.useEffect": ()=>{
            const now = Date.now();
            setBets({
                "GameProvider.useEffect": (prev)=>prev.map({
                        "GameProvider.useEffect": (b)=>{
                            if (b.botExpiresAt != null || b.creatorId === player.id) return b;
                            return {
                                ...b,
                                botExpiresAt: now + 10000 + Math.random() * 10000
                            };
                        }
                    }["GameProvider.useEffect"])
            }["GameProvider.useEffect"]);
        }
    }["GameProvider.useEffect"], [
        player.id
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GameProvider.useEffect": ()=>{
            const interval = setInterval({
                "GameProvider.useEffect.interval": ()=>{
                    const now = Date.now();
                    setBets({
                        "GameProvider.useEffect.interval": (prev)=>{
                            let next = prev.filter({
                                "GameProvider.useEffect.interval.next": (b)=>!b.botExpiresAt || b.botExpiresAt > now
                            }["GameProvider.useEffect.interval.next"]);
                            if (now - lastBotBetAddedRef.current >= 8000 + Math.random() * 10000) {
                                lastBotBetAddedRef.current = now;
                                const r = OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)];
                                const amounts = [
                                    25,
                                    50,
                                    100,
                                    150,
                                    200
                                ];
                                const newBet = {
                                    id: `bet-bot-${now}-${Math.floor(Math.random() * 1000)}`,
                                    creatorId: r.id,
                                    creatorName: r.name,
                                    creatorAvatar: r.avatar,
                                    creatorAvatarUrl: r.avatarUrl,
                                    creatorWins: r.wins,
                                    amount: amounts[Math.floor(Math.random() * amounts.length)],
                                    createdAt: now,
                                    vip: r.vip,
                                    botExpiresAt: now + 10000 + Math.random() * 10000
                                };
                                next = [
                                    newBet,
                                    ...next
                                ];
                            }
                            return next;
                        }
                    }["GameProvider.useEffect.interval"]);
                }
            }["GameProvider.useEffect.interval"], 1000);
            return ({
                "GameProvider.useEffect": ()=>clearInterval(interval)
            })["GameProvider.useEffect"];
        }
    }["GameProvider.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GameProvider.useEffect": ()=>{
            screenRef.current = screen;
        }
    }["GameProvider.useEffect"], [
        screen
    ]);
    // Загрузка сохранённых данных (совместимость с будущими версиями: новые поля берутся из дефолтов)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GameProvider.useEffect": ()=>{
            const saved = loadSavedState();
            if (saved) {
                setPlayer(saved.player);
                setWithdrawState(saved.withdrawState);
                setLavaCardStock(saved.lavaCardStock);
            }
            setHasLoadedSave(true);
        }
    }["GameProvider.useEffect"], []);
    // Сохранение в localStorage при изменении игрока, вывода и остатка карты «Лава»
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GameProvider.useEffect": ()=>{
            if (!hasLoadedSave) return;
            saveState(player, withdrawState, lavaCardStock);
        }
    }["GameProvider.useEffect"], [
        hasLoadedSave,
        player,
        withdrawState,
        lavaCardStock
    ]);
    // Инициализация VK Bridge; при запуске на своём сервере — проверка OAuth callback или сохранённой сессии
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GameProvider.useEffect": ()=>{
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$vk$2d$bridge$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["initVKBridge"])().finally({
                "GameProvider.useEffect": ()=>setIsLoading(false)
            }["GameProvider.useEffect"]);
        }
    }["GameProvider.useEffect"], []);
    // На своём сервере (без Bridge): обработать возврат из VK OAuth или восстановить сессию из localStorage
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GameProvider.useEffect": ()=>{
            if (isLoading || (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$vk$2d$bridge$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getBridgeReady"])()) return;
            const hash = ("TURBOPACK compile-time truthy", 1) ? window.location.hash : "TURBOPACK unreachable";
            const parsed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$vk$2d$oauth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseVKHashFragment"])(hash);
            if (parsed) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$vk$2d$oauth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchVKUserByToken"])(parsed.access_token, parsed.user_id).then({
                    "GameProvider.useEffect": (user)=>{
                        if (user) {
                            const expires_at = parsed.expires_in ? Math.floor(Date.now() / 1000) + parsed.expires_in : 0;
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$vk$2d$oauth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["saveVKOAuthSession"])({
                                access_token: parsed.access_token,
                                user_id: parsed.user_id,
                                expires_at,
                                user
                            });
                            setVkUser(user);
                            setPlayer({
                                "GameProvider.useEffect": (p)=>({
                                        ...p,
                                        id: `vk_${user.id}`,
                                        name: user.first_name,
                                        avatar: user.first_name.charAt(0).toUpperCase(),
                                        avatarUrl: user.photo_200 || user.photo_100 || "",
                                        hideVkAvatar: p.hideVkAvatar ?? false
                                    })
                            }["GameProvider.useEffect"]);
                            setScreen("menu");
                            window.history.replaceState(null, "", window.location.pathname + window.location.search);
                        }
                    }
                }["GameProvider.useEffect"]);
                return;
            }
            const session = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$vk$2d$oauth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getStoredVKOAuthSession"])();
            if (session) {
                setVkUser(session.user);
                setPlayer({
                    "GameProvider.useEffect": (p)=>({
                            ...p,
                            id: `vk_${session.user.id}`,
                            name: session.user.first_name,
                            avatar: session.user.first_name.charAt(0).toUpperCase(),
                            avatarUrl: session.user.photo_200 || session.user.photo_100 || "",
                            hideVkAvatar: p.hideVkAvatar ?? false
                        })
                }["GameProvider.useEffect"]);
                setScreen("menu");
            }
        }
    }["GameProvider.useEffect"], [
        isLoading
    ]);
    const loginWithVK = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "GameProvider.useCallback[loginWithVK]": async ()=>{
            const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$vk$2d$bridge$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getVKUser"])();
            if (user) {
                setVkUser(user);
                setPlayer({
                    "GameProvider.useCallback[loginWithVK]": (p)=>({
                            ...p,
                            id: `vk_${user.id}`,
                            name: user.first_name,
                            avatar: user.first_name.charAt(0).toUpperCase(),
                            avatarUrl: user.photo_200 || user.photo_100 || "",
                            hideVkAvatar: p.hideVkAvatar ?? false
                        })
                }["GameProvider.useCallback[loginWithVK]"]);
                setScreen("menu");
            }
        }
    }["GameProvider.useCallback[loginWithVK]"], []);
    const logoutWithVK = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "GameProvider.useCallback[logoutWithVK]": ()=>{
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$vk$2d$oauth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clearVKOAuthSession"])();
            setVkUser(null);
            setPlayer({
                "GameProvider.useCallback[logoutWithVK]": (p)=>({
                        ...p,
                        id: "player1",
                        name: "Игрок",
                        avatar: "И",
                        avatarUrl: ""
                    })
            }["GameProvider.useCallback[logoutWithVK]"]);
            setScreen("entry");
        }
    }["GameProvider.useCallback[logoutWithVK]"], []);
    const pickRandomOpponent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "GameProvider.useCallback[pickRandomOpponent]": ()=>{
            const idx = Math.floor(Math.random() * OPPONENTS.length);
            setOpponent(OPPONENTS[idx]);
        }
    }["GameProvider.useCallback[pickRandomOpponent]"], []);
    const handleSetScreen = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "GameProvider.useCallback[handleSetScreen]": (s)=>{
            if (s === "matchmaking") {
                pickRandomOpponent();
            }
            setScreen(s);
        }
    }["GameProvider.useCallback[handleSetScreen]"], [
        pickRandomOpponent
    ]);
    // Динамический рейтинг: обновление каждые 30 минут с анимацией
    const [displayLeaderboard, setDisplayLeaderboard] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "GameProvider.useState": ()=>{
            const playerEntry = {
                id: player.id,
                name: player.name,
                avatar: player.avatar,
                avatarUrl: player.avatarUrl,
                wins: player.wins,
                earnings: player.ratingPoints ?? 0,
                vip: player.vip,
                isPlayer: true
            };
            const all = [
                ...leaderboardDataRef.current,
                playerEntry
            ].sort({
                "GameProvider.useState.all": (a, b)=>b.earnings - a.earnings
            }["GameProvider.useState.all"]);
            return all.map({
                "GameProvider.useState": (e, i)=>({
                        ...e,
                        rank: i + 1
                    })
            }["GameProvider.useState"]);
        }
    }["GameProvider.useState"]);
    const updateLeaderboardData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "GameProvider.useCallback[updateLeaderboardData]": ()=>{
            const playerEntry = {
                id: player.id,
                name: player.name,
                avatar: player.avatar,
                avatarUrl: player.avatarUrl,
                wins: player.wins,
                earnings: player.ratingPoints ?? 0,
                vip: player.vip,
                isPlayer: true
            };
            const base = leaderboardDataRef.current.filter({
                "GameProvider.useCallback[updateLeaderboardData].base": (e)=>e.id !== player.id
            }["GameProvider.useCallback[updateLeaderboardData].base"]);
            const shuffled = shuffleEarnings(base);
            leaderboardDataRef.current = shuffled;
            const all = [
                ...shuffled,
                playerEntry
            ].sort({
                "GameProvider.useCallback[updateLeaderboardData].all": (a, b)=>b.earnings - a.earnings
            }["GameProvider.useCallback[updateLeaderboardData].all"]);
            const ranked = all.map({
                "GameProvider.useCallback[updateLeaderboardData].ranked": (e, i)=>({
                        ...e,
                        rank: i + 1
                    })
            }["GameProvider.useCallback[updateLeaderboardData].ranked"]);
            setDisplayLeaderboard(ranked);
            setLeaderboardVersion({
                "GameProvider.useCallback[updateLeaderboardData]": (v)=>v + 1
            }["GameProvider.useCallback[updateLeaderboardData]"]);
        }
    }["GameProvider.useCallback[updateLeaderboardData]"], [
        player.id,
        player.name,
        player.avatar,
        player.avatarUrl,
        player.wins,
        player.ratingPoints,
        player.vip
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GameProvider.useEffect": ()=>{
            const playerEntry = {
                id: player.id,
                name: player.name,
                avatar: player.avatar,
                avatarUrl: player.avatarUrl,
                wins: player.wins,
                earnings: player.ratingPoints ?? 0,
                vip: player.vip,
                isPlayer: true
            };
            const base = leaderboardDataRef.current.filter({
                "GameProvider.useEffect.base": (e)=>e.id !== player.id
            }["GameProvider.useEffect.base"]);
            const all = [
                ...base,
                playerEntry
            ].sort({
                "GameProvider.useEffect.all": (a, b)=>b.earnings - a.earnings
            }["GameProvider.useEffect.all"]);
            setDisplayLeaderboard(all.map({
                "GameProvider.useEffect": (e, i)=>({
                        ...e,
                        rank: i + 1
                    })
            }["GameProvider.useEffect"]));
        }
    }["GameProvider.useEffect"], [
        player.wins,
        player.ratingPoints,
        player.id,
        player.name,
        player.avatar,
        player.avatarUrl,
        player.vip
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GameProvider.useEffect": ()=>{
            const t = setInterval(updateLeaderboardData, LEADERBOARD_UPDATE_MS);
            return ({
                "GameProvider.useEffect": ()=>clearInterval(t)
            })["GameProvider.useEffect"];
        }
    }["GameProvider.useEffect"], [
        updateLeaderboardData
    ]);
    const { leaderboard, playerRank } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "GameProvider.useMemo": ()=>{
            const pRank = displayLeaderboard.findIndex({
                "GameProvider.useMemo": (e)=>e.isPlayer
            }["GameProvider.useMemo"]) + 1;
            return {
                leaderboard: displayLeaderboard,
                playerRank: pRank || displayLeaderboard.length + 1
            };
        }
    }["GameProvider.useMemo"], [
        displayLeaderboard
    ]);
    const rankTrendRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [rankTrend, setRankTrend] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GameProvider.useEffect": ()=>{
            const earnings = player.ratingPoints ?? 0;
            const prev = rankTrendRef.current;
            if (prev === null) {
                rankTrendRef.current = {
                    rank: playerRank,
                    earnings
                };
                setRankTrend(null);
                return;
            }
            if (playerRank < prev.rank || earnings > prev.earnings) setRankTrend("up");
            else if (playerRank > prev.rank || earnings < prev.earnings) setRankTrend("down");
            else setRankTrend(null);
            rankTrendRef.current = {
                rank: playerRank,
                earnings
            };
        }
    }["GameProvider.useEffect"], [
        playerRank,
        player.ratingPoints
    ]);
    const purchaseRankBoost = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "GameProvider.useCallback[purchaseRankBoost]": ()=>{
            const cost = 250;
            const bonus = 100;
            if (player.balance < cost) return false;
            setPlayer({
                "GameProvider.useCallback[purchaseRankBoost]": (p)=>({
                        ...p,
                        balance: p.balance - cost,
                        ratingPoints: Math.min(1000, (p.ratingPoints ?? 0) + bonus)
                    })
            }["GameProvider.useCallback[purchaseRankBoost]"]);
            return true;
        }
    }["GameProvider.useCallback[purchaseRankBoost]"], [
        player.balance
    ]);
    const BOT_AUTO_ACCEPT_AFTER_MS = 30 * 1000;
    const createBet = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "GameProvider.useCallback[createBet]": (amount, duration = "once")=>{
            if (player.balance < amount) return;
            if (betResponseTimeoutRef.current) {
                clearTimeout(betResponseTimeoutRef.current);
                betResponseTimeoutRef.current = null;
            }
            if (botAutoAcceptTimeoutRef.current) {
                clearTimeout(botAutoAcceptTimeoutRef.current);
                botAutoAcceptTimeoutRef.current = null;
            }
            const now = Date.now();
            const id = `pending-${now}`;
            setPendingBet({
                id,
                amount,
                createdAt: now
            });
            const expiresAt = duration === "1h" ? now + 60 * 60 * 1000 : undefined;
            const myBet = {
                id,
                creatorId: player.id,
                creatorName: player.name,
                creatorAvatar: player.avatar,
                creatorWins: player.wins,
                amount,
                createdAt: now,
                expiresAt,
                vip: player.vip
            };
            setBets({
                "GameProvider.useCallback[createBet]": (prev)=>[
                        myBet,
                        ...prev
                    ]
            }["GameProvider.useCallback[createBet]"]);
            const r = OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)];
            const responseId = `resp-${Date.now()}`;
            const hasLivePlayers = Math.random() < 0.7;
            const delayMs = hasLivePlayers ? 2500 : BOT_AUTO_ACCEPT_AFTER_MS;
            betResponseTimeoutRef.current = setTimeout({
                "GameProvider.useCallback[createBet]": ()=>{
                    betResponseTimeoutRef.current = null;
                    setBetResponse({
                        id: responseId,
                        betId: id,
                        responderId: r.id,
                        responderName: r.name,
                        responderAvatar: r.avatar,
                        responderWins: r.wins,
                        amount
                    });
                }
            }["GameProvider.useCallback[createBet]"], delayMs);
            // Через 30 секунд, если ставку не приняли — робот подхватывает сам.
            const scheduleBotAutoAccept = {
                "GameProvider.useCallback[createBet].scheduleBotAutoAccept": (delayMs)=>{
                    botAutoAcceptTimeoutRef.current = setTimeout({
                        "GameProvider.useCallback[createBet].scheduleBotAutoAccept": ()=>{
                            const current = pendingBetRef.current;
                            if (!current || current.id !== id) return;
                            const currentScreen = screenRef.current;
                            // Если игрок в этот момент играет — ждём завершения игры.
                            if (currentScreen === "arena" || currentScreen === "matchmaking") {
                                scheduleBotAutoAccept(10 * 1000);
                                return;
                            }
                            botAutoAcceptTimeoutRef.current = null;
                            if (betResponseTimeoutRef.current) {
                                clearTimeout(betResponseTimeoutRef.current);
                                betResponseTimeoutRef.current = null;
                            }
                            const bot = OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)];
                            setOpponent({
                                ...bot,
                                balance: 500,
                                weekWins: Math.floor(bot.wins / 2),
                                weekEarnings: amount * 5
                            });
                            setCurrentBet(amount);
                            setBets({
                                "GameProvider.useCallback[createBet].scheduleBotAutoAccept": (prev)=>prev.filter({
                                        "GameProvider.useCallback[createBet].scheduleBotAutoAccept": (b)=>b.id !== id
                                    }["GameProvider.useCallback[createBet].scheduleBotAutoAccept"])
                            }["GameProvider.useCallback[createBet].scheduleBotAutoAccept"]);
                            setPendingBet(null);
                            setBetResponse(null);
                            setTotalRounds(1);
                            setScreen("arena");
                        }
                    }["GameProvider.useCallback[createBet].scheduleBotAutoAccept"], delayMs);
                }
            }["GameProvider.useCallback[createBet].scheduleBotAutoAccept"];
            scheduleBotAutoAccept(BOT_AUTO_ACCEPT_AFTER_MS);
        }
    }["GameProvider.useCallback[createBet]"], [
        player.balance,
        player.id,
        player.name,
        player.avatar,
        player.wins,
        setScreen,
        setOpponent,
        setCurrentBet,
        setTotalRounds
    ]);
    const removeBet = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "GameProvider.useCallback[removeBet]": (betId)=>{
            setBets({
                "GameProvider.useCallback[removeBet]": (prev)=>prev.filter({
                        "GameProvider.useCallback[removeBet]": (b)=>b.id !== betId
                    }["GameProvider.useCallback[removeBet]"])
            }["GameProvider.useCallback[removeBet]"]);
        }
    }["GameProvider.useCallback[removeBet]"], []);
    const MIN_BET_AMOUNT = 5;
    const updatePendingBetAmount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "GameProvider.useCallback[updatePendingBetAmount]": (newAmount)=>{
            if (!pendingBet || newAmount < MIN_BET_AMOUNT) return false;
            const diff = newAmount - pendingBet.amount;
            if (diff === 0) return true;
            if (diff > 0 && player.balance < newAmount) return false;
            setPendingBet({
                "GameProvider.useCallback[updatePendingBetAmount]": (p)=>p ? {
                        ...p,
                        amount: newAmount
                    } : null
            }["GameProvider.useCallback[updatePendingBetAmount]"]);
            setBets({
                "GameProvider.useCallback[updatePendingBetAmount]": (prev)=>prev.map({
                        "GameProvider.useCallback[updatePendingBetAmount]": (b)=>b.id === pendingBet.id ? {
                                ...b,
                                amount: newAmount
                            } : b
                    }["GameProvider.useCallback[updatePendingBetAmount]"])
            }["GameProvider.useCallback[updatePendingBetAmount]"]);
            return true;
        }
    }["GameProvider.useCallback[updatePendingBetAmount]"], [
        pendingBet,
        player.balance
    ]);
    // Очистка таймера отклика и ожидающей ставки только при переходе на экраны,
    // где список ставок точно не нужен (например, вывод средств). На menu/bets/bet-select/arena ставка должна оставаться.
    const screensThatClearPendingBet = [
        "withdraw"
    ];
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GameProvider.useEffect": ()=>{
            if (screensThatClearPendingBet.includes(screen)) {
                if (betResponseTimeoutRef.current) {
                    clearTimeout(betResponseTimeoutRef.current);
                    betResponseTimeoutRef.current = null;
                }
                if (botAutoAcceptTimeoutRef.current) {
                    clearTimeout(botAutoAcceptTimeoutRef.current);
                    botAutoAcceptTimeoutRef.current = null;
                }
                if (pendingBet) {
                    setBets({
                        "GameProvider.useEffect": (prev)=>prev.filter({
                                "GameProvider.useEffect": (b)=>b.id !== pendingBet.id
                            }["GameProvider.useEffect"])
                    }["GameProvider.useEffect"]);
                    setPendingBet(null);
                    setBetResponse(null);
                }
            }
            return ({
                "GameProvider.useEffect": ()=>{
                    if (betResponseTimeoutRef.current) {
                        clearTimeout(betResponseTimeoutRef.current);
                        betResponseTimeoutRef.current = null;
                    }
                    if (botAutoAcceptTimeoutRef.current) {
                        clearTimeout(botAutoAcceptTimeoutRef.current);
                        botAutoAcceptTimeoutRef.current = null;
                    }
                }
            })["GameProvider.useEffect"];
        }
    }["GameProvider.useEffect"], [
        screen,
        pendingBet
    ]);
    const acceptBetResponse = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "GameProvider.useCallback[acceptBetResponse]": ()=>{
            if (!betResponse) return;
            if (botAutoAcceptTimeoutRef.current) {
                clearTimeout(botAutoAcceptTimeoutRef.current);
                botAutoAcceptTimeoutRef.current = null;
            }
            setBets({
                "GameProvider.useCallback[acceptBetResponse]": (prev)=>prev.filter({
                        "GameProvider.useCallback[acceptBetResponse]": (b)=>b.id !== betResponse.betId
                    }["GameProvider.useCallback[acceptBetResponse]"])
            }["GameProvider.useCallback[acceptBetResponse]"]);
            const bot = OPPONENTS.find({
                "GameProvider.useCallback[acceptBetResponse].bot": (o)=>o.id === betResponse.responderId
            }["GameProvider.useCallback[acceptBetResponse].bot"]);
            setOpponent(bot ? {
                ...bot,
                balance: 500,
                weekWins: Math.floor(betResponse.responderWins / 2),
                weekEarnings: betResponse.amount * 5
            } : {
                id: betResponse.responderId,
                name: betResponse.responderName,
                avatar: betResponse.responderAvatar,
                avatarUrl: BOT_AVATAR_URL(betResponse.responderId),
                balance: 500,
                wins: betResponse.responderWins,
                losses: 20,
                weekWins: Math.floor(betResponse.responderWins / 2),
                weekEarnings: betResponse.amount * 5,
                vip: false
            });
            setCurrentBet(betResponse.amount);
            setBetResponse(null);
            setPendingBet(null);
            setTotalRounds(1);
            setScreen("arena");
        }
    }["GameProvider.useCallback[acceptBetResponse]"], [
        betResponse,
        setScreen,
        setOpponent,
        setCurrentBet,
        setTotalRounds
    ]);
    const declineBetResponse = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "GameProvider.useCallback[declineBetResponse]": ()=>{
            if (!betResponse) return;
            if (botAutoAcceptTimeoutRef.current) {
                clearTimeout(botAutoAcceptTimeoutRef.current);
                botAutoAcceptTimeoutRef.current = null;
            }
            setBetResponse(null);
            setPendingBet(null);
        }
    }["GameProvider.useCallback[declineBetResponse]"], [
        betResponse
    ]);
    const clearPendingBet = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "GameProvider.useCallback[clearPendingBet]": ()=>{
            if (botAutoAcceptTimeoutRef.current) {
                clearTimeout(botAutoAcceptTimeoutRef.current);
                botAutoAcceptTimeoutRef.current = null;
            }
            if (pendingBet) {
                setBets({
                    "GameProvider.useCallback[clearPendingBet]": (prev)=>prev.filter({
                            "GameProvider.useCallback[clearPendingBet]": (b)=>b.id !== pendingBet.id
                        }["GameProvider.useCallback[clearPendingBet]"])
                }["GameProvider.useCallback[clearPendingBet]"]);
            }
            setPendingBet(null);
            setBetResponse(null);
        }
    }["GameProvider.useCallback[clearPendingBet]"], [
        pendingBet
    ]);
    const recordWithdraw = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "GameProvider.useCallback[recordWithdraw]": (amount)=>{
            const today = new Date().toISOString().slice(0, 10);
            setWithdrawState({
                "GameProvider.useCallback[recordWithdraw]": (prev)=>prev.date !== today ? {
                        date: today,
                        amount
                    } : {
                        date: today,
                        amount: prev.amount + amount
                    }
            }["GameProvider.useCallback[recordWithdraw]"]);
        }
    }["GameProvider.useCallback[recordWithdraw]"], []);
    const LAVA_CARD_PRICE = 120_000;
    const purchaseLavaCard = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "GameProvider.useCallback[purchaseLavaCard]": ()=>{
            if (lavaCardStock <= 0 || player.balance < LAVA_CARD_PRICE) return false;
            setLavaCardStock({
                "GameProvider.useCallback[purchaseLavaCard]": (s)=>s - 1
            }["GameProvider.useCallback[purchaseLavaCard]"]);
            setPlayer({
                "GameProvider.useCallback[purchaseLavaCard]": (p)=>({
                        ...p,
                        balance: p.balance - LAVA_CARD_PRICE,
                        lavaCardUses: (p.lavaCardUses ?? 0) + 5
                    })
            }["GameProvider.useCallback[purchaseLavaCard]"]);
            return true;
        }
    }["GameProvider.useCallback[purchaseLavaCard]"], [
        lavaCardStock,
        player.balance
    ]);
    const WATER_CARD_PRICE = 20;
    const purchaseWaterCard = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "GameProvider.useCallback[purchaseWaterCard]": ()=>{
            if (player.balance < WATER_CARD_PRICE) return false;
            setPlayer({
                "GameProvider.useCallback[purchaseWaterCard]": (p)=>({
                        ...p,
                        balance: p.balance - WATER_CARD_PRICE,
                        waterCardUses: (p.waterCardUses ?? 0) + 3
                    })
            }["GameProvider.useCallback[purchaseWaterCard]"]);
            return true;
        }
    }["GameProvider.useCallback[purchaseWaterCard]"], [
        player.balance
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(GameContext.Provider, {
        value: {
            screen,
            setScreen: handleSetScreen,
            player,
            setPlayer,
            opponent,
            setOpponent,
            currentBet,
            setCurrentBet,
            lastResult,
            setLastResult,
            leaderboard,
            playerRank,
            rankTrend,
            leaderboardVersion,
            purchaseRankBoost,
            vkUser,
            loginWithVK,
            logoutWithVK,
            isLoading,
            bets,
            pendingBet,
            betResponse,
            createBet,
            removeBet,
            updatePendingBetAmount,
            acceptBetResponse,
            declineBetResponse,
            clearPendingBet,
            totalRounds,
            setTotalRounds,
            withdrawState,
            recordWithdraw,
            lavaCardStock,
            purchaseLavaCard,
            purchaseWaterCard
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/lib/game-context.tsx",
        lineNumber: 915,
        columnNumber: 5
    }, this);
}
_s(GameProvider, "CUbquyUuqSo11TNmvnbMTZzk80Q=");
_c3 = GameProvider;
function useGame() {
    _s1();
    const ctx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(GameContext);
    if (!ctx) throw new Error("useGame must be inside GameProvider");
    return ctx;
}
_s1(useGame, "/dMy7t63NXD4eYACoT93CePwGrg=");
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "BOT_AVATAR_URL");
__turbopack_context__.k.register(_c1, "STATIC_LEADERBOARD");
__turbopack_context__.k.register(_c2, "MOCK_BETS");
__turbopack_context__.k.register(_c3, "GameProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/format-amount.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Форматирование сумм: 1000 → 1к, 10 000 → 10к, 120 000 → 120к.
 * Отрицательные: -1000 → -1к.
 */ __turbopack_context__.s([
    "formatAmount",
    ()=>formatAmount
]);
function formatAmount(n) {
    const abs = Math.abs(n);
    const sign = n < 0 ? "-" : "";
    if (abs >= 1_000_000) {
        const v = abs / 1_000_000;
        return sign + (v % 1 === 0 ? v : v.toFixed(1).replace(/\.0$/, "")) + "м";
    }
    if (abs >= 1000) {
        const v = abs / 1000;
        return sign + (v % 1 === 0 ? v : v.toFixed(1).replace(/\.0$/, "")) + "к";
    }
    return String(n);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$clsx$40$2$2e$1$2e$1$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$tailwind$2d$merge$40$3$2e$4$2e$0$2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/tailwind-merge@3.4.0/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$tailwind$2d$merge$40$3$2e$4$2e$0$2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$clsx$40$2$2e$1$2e$1$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Page
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$game$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/game-context.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$vk$2d$bridge$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/vk-bridge.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$main$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/main-menu.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$bet$2d$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/bet-select.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$matchmaking$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/matchmaking.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$game$2d$arena$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/game-arena.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$result$2d$screen$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/result-screen.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$leaderboard$2d$screen$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/leaderboard-screen.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$profile$2d$screen$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/profile-screen.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shop$2d$screen$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/shop-screen.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$bottom$2d$nav$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/bottom-nav.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$weekly$2d$ranking$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/weekly-ranking.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$bets$2d$sidebar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/bets-sidebar.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$bets$2d$screen$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/bets-screen.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$bet$2d$response$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/bet-response-dialog.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$particles$2d$bg$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/particles-bg.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$withdraw$2d$screen$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/withdraw-screen.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$entry$2d$screen$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/entry-screen.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$background$2d$music$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/background-music.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
function GameScreen() {
    _s();
    const { screen, vkUser } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$game$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useGame"])();
    const isEntry = screen === "entry" || screen === "menu" && !vkUser;
    const isScrollableScreen1 = ![
        "menu",
        "entry"
    ].includes(screen);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            isEntry && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$entry$2d$screen$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EntryScreen"], {}, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 33,
                columnNumber: 19
            }, this),
            screen === "menu" && vkUser && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$main$2d$menu$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MainMenu"], {}, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 34,
                columnNumber: 39
            }, this),
            screen === "bets" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$bets$2d$screen$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BetsScreen"], {}, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 35,
                columnNumber: 29
            }, this),
            screen === "bet-select" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$bet$2d$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BetSelect"], {}, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 36,
                columnNumber: 35
            }, this),
            screen === "matchmaking" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$matchmaking$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matchmaking"], {}, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 37,
                columnNumber: 36
            }, this),
            screen === "arena" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$game$2d$arena$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GameArena"], {}, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 38,
                columnNumber: 30
            }, this),
            screen === "result" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$result$2d$screen$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResultScreen"], {}, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 39,
                columnNumber: 31
            }, this),
            screen === "leaderboard" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$leaderboard$2d$screen$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LeaderboardScreen"], {}, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 40,
                columnNumber: 36
            }, this),
            screen === "profile" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$profile$2d$screen$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ProfileScreen"], {}, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 41,
                columnNumber: 32
            }, this),
            screen === "withdraw" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$withdraw$2d$screen$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WithdrawScreen"], {}, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 42,
                columnNumber: 33
            }, this),
            screen === "shop" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$shop$2d$screen$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ShopScreen"], {}, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 43,
                columnNumber: 29
            }, this)
        ]
    }, void 0, true);
}
_s(GameScreen, "BXKeVAhktU2T26DcuHCZppQ/fRI=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$game$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useGame"]
    ];
});
_c = GameScreen;
function GameLayout() {
    _s1();
    const { screen, vkUser, player, setPlayer } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$game$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useGame"])();
    const hideNav = [
        "matchmaking",
        "result",
        "withdraw",
        "entry"
    ].includes(screen);
    const showLeftSidebar = !hideNav && screen !== "bets" && screen !== "withdraw" && vkUser != null;
    const showRightSidebar = !hideNav && vkUser != null;
    const showBottomNav = !hideNav && vkUser != null;
    const [hideLowBalanceHint, setHideLowBalanceHint] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const showLowBalanceHint = vkUser != null && player.balance < 50 && !hideLowBalanceHint;
    const handleLowBalanceInvite = async ()=>{
        try {
            const users = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$vk$2d$bridge$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["showFriendsPicker"])();
            if (users && users.length) {
                const reward = users.length * 10;
                setPlayer((p)=>({
                        ...p,
                        balance: p.balance + reward
                    }));
                setHideLowBalanceHint(true);
            }
        } catch  {
        // игнорируем ошибки VK Bridge
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative min-h-screen",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$particles$2d$bg$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ParticlesBg"], {}, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 73,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$bet$2d$response$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BetResponseDialog"], {}, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 74,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$background$2d$music$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BackgroundMusic"], {}, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 75,
                columnNumber: 7
            }, this),
            showLowBalanceHint && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pointer-events-none fixed inset-x-0 top-4 z-40 flex justify-center",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "pointer-events-auto max-w-md mx-auto rounded-2xl bg-slate-900/95 border border-amber-400/60 px-4 py-3 shadow-xl flex items-center gap-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-xs sm:text-sm text-white/90 leading-snug",
                                    children: "Добавь друга, получи за него 10 голосов. Чем больше друзей зашли, тем больше голосов получи."
                                }, void 0, false, {
                                    fileName: "[project]/app/page.tsx",
                                    lineNumber: 81,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: handleLowBalanceInvite,
                                    className: "mt-2 inline-flex items-center justify-center rounded-full bg-amber-400 text-amber-950 px-3 py-1 text-[11px] font-bold uppercase tracking-wide hover:bg-amber-300 transition-colors",
                                    children: "Добавить друзей"
                                }, void 0, false, {
                                    fileName: "[project]/app/page.tsx",
                                    lineNumber: 84,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/page.tsx",
                            lineNumber: 80,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: "ml-2 text-xs text-amber-300 hover:text-amber-100",
                            onClick: ()=>setHideLowBalanceHint(true),
                            children: "Закрыть"
                        }, void 0, false, {
                            fileName: "[project]/app/page.tsx",
                            lineNumber: 92,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/page.tsx",
                    lineNumber: 79,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 78,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative z-10 flex min-h-screen",
                children: [
                    showLeftSidebar && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                        className: "hidden lg:flex w-64 flex-shrink-0",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-full sticky top-0 h-screen overflow-y-auto border-r border-border/40 bg-card/30 backdrop-blur-md",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$bets$2d$sidebar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BetsSidebar"], {}, void 0, false, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 107,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/page.tsx",
                            lineNumber: 106,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 105,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                        className: "flex-1 flex justify-center",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `w-full max-w-md px-3 ${isScrollableScreen ? "min-h-screen max-h-screen overflow-y-auto" : "min-h-screen"} ${showBottomNav ? "pb-20" : ""}`,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(GameScreen, {}, void 0, false, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 118,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/page.tsx",
                            lineNumber: 113,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 112,
                        columnNumber: 9
                    }, this),
                    showRightSidebar && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                        className: "hidden lg:flex w-72 flex-shrink-0",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-full sticky top-0 h-screen overflow-y-auto border-l border-border/40 bg-card/30 backdrop-blur-md",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$weekly$2d$ranking$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WeeklyRanking"], {}, void 0, false, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 125,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/page.tsx",
                            lineNumber: 124,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 123,
                        columnNumber: 11
                    }, this),
                    showBottomNav && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$bottom$2d$nav$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BottomNav"], {}, void 0, false, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 130,
                        columnNumber: 27
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 103,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/page.tsx",
        lineNumber: 72,
        columnNumber: 5
    }, this);
}
_s1(GameLayout, "Pw8NAS2F5rVyaN+vp4gHBRuglrA=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$game$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useGame"]
    ];
});
_c1 = GameLayout;
function Page() {
    const basePath = (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
    const makeUrl = (file)=>`url("${basePath}${file}")`;
    const styleVars = {
        "--card-back-image": makeUrl("/card-back.webp"),
        "--card-rock-image": makeUrl("/card-rock.webp"),
        "--card-paper-image": makeUrl("/card-paper.webp"),
        "--card-scissors-image": makeUrl("/card-scissors.webp")
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$game$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GameProvider"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: styleVars,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(GameLayout, {}, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 149,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/page.tsx",
            lineNumber: 148,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/page.tsx",
        lineNumber: 147,
        columnNumber: 5
    }, this);
}
_c2 = Page;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "GameScreen");
__turbopack_context__.k.register(_c1, "GameLayout");
__turbopack_context__.k.register(_c2, "Page");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_16c51fd6._.js.map