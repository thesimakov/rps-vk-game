from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List, Optional


def iso_date(ts_ms: int) -> str:
    return datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc).strftime("%Y-%m-%d")


@dataclass
class PassState:
    points: int = 0
    level: int = 0
    premium_unlocked: bool = False
    claimed_free_levels: List[int] = field(default_factory=list)
    claimed_premium_levels: List[int] = field(default_factory=list)


@dataclass
class DailyState:
    streak: int = 0
    last_claimed_date: Optional[str] = None
    restored_for_date: Optional[str] = None


@dataclass
class InventoryState:
    skins: List[str] = field(default_factory=list)
    titles: List[str] = field(default_factory=list)
    frames: List[str] = field(default_factory=list)
    effects: List[str] = field(default_factory=list)
    boosts_double_win: int = 0
    event_tokens: int = 0
    xp: int = 0


@dataclass
class StatsState:
    matches_played: int = 0
    matches_won: int = 0
    current_win_streak: int = 0
    max_win_streak: int = 0
    wins_with_rock: int = 0
    bank_captured_voices_max: int = 0
    bet_voices_total: int = 0
    throws: Dict[str, int] = field(default_factory=dict)
    boss_wins: int = 0


@dataclass
class LiveOpsState:
    season_id: str
    last_server_action_at: int
    daily: DailyState = field(default_factory=DailyState)
    pass_state: PassState = field(default_factory=PassState)
    inventory: InventoryState = field(default_factory=InventoryState)
    stats: StatsState = field(default_factory=StatsState)


class LiveOpsService:
    """
    Python backend core for daily rewards, quests, pass, and achievements.
    Intended for integration with FastAPI/Flask handlers and PostgreSQL/Firebase repositories.
    """

    def __init__(self, config: dict):
        self.config = config

    def create_default_state(self, now_ms: int) -> LiveOpsState:
        return LiveOpsState(season_id=self.config["seasonId"], last_server_action_at=now_ms)

    def claim_daily(self, state: LiveOpsState, player: dict, now_ms: int) -> dict:
        today = iso_date(now_ms)
        if state.daily.last_claimed_date == today:
            raise ValueError("daily_already_claimed")
        state.daily.streak += 1
        state.daily.last_claimed_date = today
        day_cfg = self.config["dailyRewards"][(state.daily.streak - 1) % len(self.config["dailyRewards"])]
        self._apply_rewards(player, state, day_cfg["rewards"])
        state.pass_state.points += 20
        state.pass_state.level = min(
            self.config["pass"]["maxLevel"], state.pass_state.points // self.config["pass"]["pointsPerLevel"]
        )
        return day_cfg

    def track_match(self, state: LiveOpsState, now_ms: int, won: bool, moves_used: List[str], bet_voices: int, bank_voices: int):
        state.last_server_action_at = now_ms
        state.stats.matches_played += 1
        if won:
            state.stats.matches_won += 1
            state.stats.current_win_streak += 1
            state.stats.max_win_streak = max(state.stats.max_win_streak, state.stats.current_win_streak)
        else:
            state.stats.current_win_streak = 0
        for m in moves_used:
            state.stats.throws[m] = state.stats.throws.get(m, 0) + 1
        if won and "rock" in moves_used:
            state.stats.wins_with_rock += 1
        state.stats.bet_voices_total += max(0, int(bet_voices))
        state.stats.bank_captured_voices_max = max(state.stats.bank_captured_voices_max, max(0, int(bank_voices)))

    def _apply_rewards(self, player: dict, state: LiveOpsState, rewards: List[dict]):
        for reward in rewards:
            kind = reward.get("kind")
            amount = int(reward.get("amount", 0))
            if kind == "coins":
                player["balance"] = max(0, int(player.get("balance", 0)) + amount)
            elif kind == "voices":
                player["vkVoicesBalance"] = max(0, int(player.get("vkVoicesBalance", 0)) + amount)
            elif kind == "event_tokens":
                state.inventory.event_tokens += amount
            elif kind == "xp":
                state.inventory.xp += amount
            elif kind == "boost_double_win":
                state.inventory.boosts_double_win += amount
            elif kind == "skin" and reward.get("skinId"):
                if reward["skinId"] not in state.inventory.skins:
                    state.inventory.skins.append(reward["skinId"])
            elif kind == "title" and reward.get("titleId"):
                if reward["titleId"] not in state.inventory.titles:
                    state.inventory.titles.append(reward["titleId"])
