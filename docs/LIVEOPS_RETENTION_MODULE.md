# LiveOps: 30-day retention module

This module adds a complete monthly retention layer for VK Mini Apps RPS:

- Daily rewards with streak and paid streak restore (VK voices).
- Quests (daily/weekly/monthly) with XP and event token rewards.
- 30-level event pass with free and premium reward tracks.
- Weekly events for 4 weeks (`elements_tournament`, `time_is_money`, `blind_luck`, `boss_week`).
- Permanent achievements with title rewards.
- Server-time validation (no trust in device clock).
- Admin-editable JSON config without redeploy.

## Files added

- `config/liveops-month-1.json` - full monthly content config.
- `lib/liveops/types.ts` - core interfaces.
- `lib/liveops/config.ts` - config load/save + runtime cache.
- `lib/liveops/engine.ts` - core liveops logic.
- `lib/liveops/vk-sync.ts` - VK API sync adapter for voices/VK ID/subscription.
- `lib/liveops/client.ts` - Mini App API client helpers.
- `app/api/liveops/*` - backend endpoints for claims/progress.
- `app/api/admin/liveops/config/route.ts` - admin config API.
- `backend/python/liveops_module.py` - Python backend core (FastAPI/Flask friendly).

## API contract

All responses are `Cache-Control: no-store`.

- `POST /api/liveops/state` `{ userId }`
- `POST /api/liveops/claim-daily` `{ userId }`
- `POST /api/liveops/restore-streak` `{ userId }`
- `POST /api/liveops/track-action` `{ userId, action, clientTimestamp }`
- `POST /api/liveops/claim-quest` `{ userId, questId }`
- `POST /api/liveops/claim-achievement` `{ userId, achievementId, setActive? }`
- `POST /api/liveops/unlock-pass-premium` `{ userId }`
- `POST /api/liveops/claim-pass-reward` `{ userId, level, premium }`
- `GET /api/liveops/weekly-rules`
- `GET /api/admin/liveops/config`
- `POST /api/admin/liveops/config` `{ config }`

## Player storage extensions

`StoredPlayer` now supports:

- `vkVoicesBalance?: number`
- `liveOpsState?: LiveOpsState`
- `activeTitleId?: string`

## VK integration notes

`lib/liveops/vk-sync.ts` is a server adapter seam.
Replace internals with production calls to VK:

- verify VK ID/session signature;
- sync/charge voices via VK billing backend;
- verify community subscription.

## Security/anti-cheat model

- All reward decisions use server `Date.now()` only.
- `clientTimestamp` is sanity-checked and cannot move server logic forward.
- Daily streak reset/restore is date-based in UTC.
- Duplicate claim protection via `claimedAt` markers.
- Weekly rule endpoint returns server-authoritative restrictions for UI/matchmaking.

## Next integration steps

1. Call `sendMatchResult()` from match-finalization flow.
2. Show quest/pass/daily UI (you already have sidebars and profile panels).
3. Hook premium pass purchase to real VK payment confirmation pipeline.
4. Move player storage from JSON file to PostgreSQL/Firebase repository preserving schema.
