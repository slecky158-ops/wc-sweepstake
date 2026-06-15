#!/usr/bin/env python3
"""Daily World Cup sweepstake site update — runs in GitHub Actions.

Each morning at ~07:55 UK this:
  1. Pulls all WC matches from football-data.org (authoritative for fixtures,
     scores, venues, kickoffs).
  2. Partitions them into yesterday's results and today's fixtures using the
     08:00-UK day-boundary rule.
  3. Calls OpenAI (Responses API with the built-in web_search tool) to enrich
     with storylines / fun facts / analysis / H2H / odds / weather / world news.
  4. Writes daily-current.json + daily-archive.json + matches.json (the latter
     to mark yesterday's matches as completed).
  5. The workflow's commit/push step then commits the diff, which triggers a
     Vercel auto-deploy of the live site.

Designed to be robust: any single sub-step failure logs clearly and exits
non-zero so the GitHub Actions run goes red and Sam notices, but never
silently leaves bad data in place.
"""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

# ─── Config / paths ────────────────────────────────────────────────────

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "data"

FOOTBALL_DATA_KEY = os.environ.get("FOOTBALL_DATA_KEY")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
if not FOOTBALL_DATA_KEY or not OPENAI_API_KEY:
    print("ERROR: FOOTBALL_DATA_KEY or OPENAI_API_KEY missing from env", file=sys.stderr)
    sys.exit(1)

# UK is +01:00 during BST (last Sunday March → last Sunday October).
# Tournament runs entirely within BST. If you ever run this in winter, change
# UK_OFFSET to 0.
UK_OFFSET = timedelta(hours=1)
UK_TZ = timezone(UK_OFFSET)
ET_TZ = timezone(timedelta(hours=-4))  # EDT

TOURNAMENT_START = datetime(2026, 6, 11, tzinfo=UK_TZ)

now_uk = datetime.now(UK_TZ)
today_8am_uk = now_uk.replace(hour=8, minute=0, second=0, microsecond=0)
yesterday_8am_uk = today_8am_uk - timedelta(days=1)
tomorrow_8am_uk = today_8am_uk + timedelta(days=1)

today_date_str = today_8am_uk.strftime("%Y%m%d")
today_long = today_8am_uk.strftime("%A, %-d %B %Y")
today_day = today_8am_uk.strftime("%a %-d %b")
day_number = (today_8am_uk.date() - TOURNAMENT_START.date()).days + 1
date_rest = f"Tournament Day {day_number}" if day_number >= 1 else "Pre-tournament"

print(f"UK time: {now_uk.isoformat()} | window: {yesterday_8am_uk} → {today_8am_uk} → {tomorrow_8am_uk}")
print(f"date_rest: {date_rest}")

# ─── Load static data ─────────────────────────────────────────────────

teams_data = json.loads((DATA_DIR / "teams.json").read_text())
entrants_data = json.loads((DATA_DIR / "entrants.json").read_text())
matches_data = json.loads((DATA_DIR / "matches.json").read_text())

# Lookup tables
TEAMS_BY_CODE = {t["code"]: t for t in teams_data}
ENTRANT_FOR_TEAM = {}
for e in entrants_data:
    ENTRANT_FOR_TEAM[e["teamA"]] = e["name"]
    ENTRANT_FOR_TEAM[e["teamB"]] = e["name"]

# Build matchId by (teamA, teamB) — order-independent
MATCH_BY_PAIR = {}
for m in matches_data:
    if m.get("teamA") and m.get("teamB"):
        MATCH_BY_PAIR[(m["teamA"], m["teamB"])] = m
        MATCH_BY_PAIR[(m["teamB"], m["teamA"])] = m

# Football-data team name → our 3-letter code (covers spelling differences)
NAME_TO_CODE = {
    "Mexico": "MEX", "South Korea": "KOR", "Korea Republic": "KOR",
    "Czechia": "CZE", "Czech Republic": "CZE", "South Africa": "RSA",
    "Switzerland": "SUI", "Canada": "CAN", "Qatar": "QAT",
    "Bosnia-Herzegovina": "BIH", "Bosnia and Herzegovina": "BIH",
    "Brazil": "BRA", "Morocco": "MAR", "Scotland": "SCO", "Haiti": "HAI",
    "United States": "USA", "USA": "USA", "Türkiye": "TUR", "Turkey": "TUR",
    "Australia": "AUS", "Paraguay": "PAR",
    "Germany": "GER", "Ecuador": "ECU", "Ivory Coast": "CIV",
    "Côte d'Ivoire": "CIV", "Curaçao": "CUW", "Curacao": "CUW",
    "Netherlands": "NED", "Japan": "JPN", "Sweden": "SWE", "Tunisia": "TUN",
    "Belgium": "BEL", "Egypt": "EGY", "Iran": "IRN", "New Zealand": "NZL",
    "Spain": "ESP", "Uruguay": "URU", "Saudi Arabia": "KSA",
    "Cape Verde": "CPV", "Cabo Verde": "CPV", "Cape Verde Islands": "CPV",
    "France": "FRA", "Norway": "NOR", "Senegal": "SEN", "Iraq": "IRQ",
    "Argentina": "ARG", "Austria": "AUT", "Algeria": "ALG", "Jordan": "JOR",
    "Portugal": "POR", "Colombia": "COL", "DR Congo": "COD",
    "Democratic Republic of the Congo": "COD", "Congo DR": "COD",
    "Uzbekistan": "UZB",
    "England": "ENG", "Croatia": "CRO", "Ghana": "GHA", "Panama": "PAN",
}

def name_to_code(name: str | None) -> str | None:
    if not name:
        return None
    return NAME_TO_CODE.get(name) or NAME_TO_CODE.get(name.strip())

# ─── Fetch football-data.org matches ──────────────────────────────────

def fd_get(path: str) -> dict:
    req = urllib.request.Request(
        f"https://api.football-data.org/v4{path}",
        headers={"X-Auth-Token": FOOTBALL_DATA_KEY},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

print("Fetching matches from football-data.org…")
try:
    fd_data = fd_get("/competitions/WC/matches")
except urllib.error.HTTPError as e:
    print(f"ERROR: football-data.org returned HTTP {e.code}", file=sys.stderr)
    sys.exit(2)

fd_matches = fd_data.get("matches", [])
print(f"  got {len(fd_matches)} matches")


def utc_to_uk(utc_str: str) -> datetime:
    return datetime.fromisoformat(utc_str.replace("Z", "+00:00")).astimezone(UK_TZ)


def fd_to_daily(fd_m: dict, *, completed: bool) -> dict | None:
    """Convert a football-data match into our DailyMatch shape (without AI extras)."""
    a_code = name_to_code(fd_m.get("homeTeam", {}).get("name"))
    b_code = name_to_code(fd_m.get("awayTeam", {}).get("name"))
    if not a_code or not b_code:
        print(f"  WARN: unmapped teams {fd_m.get('homeTeam',{}).get('name')} vs {fd_m.get('awayTeam',{}).get('name')}")
        return None
    local = MATCH_BY_PAIR.get((a_code, b_code))
    if not local:
        # Knockout match maybe; build a placeholder
        local = {"id": f"FD{fd_m['id']}", "rank": None, "group": None, "stage": "knockout", "round": None,
                 "venue": None, "broadcast": None}

    kickoff_utc = datetime.fromisoformat(fd_m["utcDate"].replace("Z", "+00:00"))
    kickoff_uk = kickoff_utc.astimezone(UK_TZ)
    kickoff_et = kickoff_utc.astimezone(ET_TZ)

    venue = local.get("venue")
    if not venue and fd_m.get("venue"):
        venue = {"stadium": fd_m["venue"], "city": "?", "country": "?"}
    if not venue:
        venue = {"stadium": "TBC", "city": "TBC", "country": "?"}

    out = {
        "matchId": local["id"],
        "rank": local.get("rank"),
        "group": local.get("group"),
        "stage": local.get("stage", "group"),
        "round": local.get("round"),
        "kickoffUk": kickoff_uk.isoformat(),
        "timeUk": kickoff_uk.strftime("%H:%M") + " UK",
        "timeEt": kickoff_et.strftime("%H:%M") + " ET",
        "venue": venue,
        "broadcast": local.get("broadcast") or {"uk": "TBC", "us": "TBC"},
        "teamA": a_code,
        "teamB": b_code,
    }
    if completed:
        full = fd_m.get("score", {}).get("fullTime", {})
        score_a = full.get("home")
        score_b = full.get("away")
        if score_a is not None and score_b is not None:
            out["scoreA"] = score_a
            out["scoreB"] = score_b
            out["score"] = f"{score_a}-{score_b}"
    return out


yesterday_local: list[dict] = []
today_local: list[dict] = []
for fd_m in fd_matches:
    try:
        kickoff_uk = utc_to_uk(fd_m["utcDate"])
    except Exception:
        continue
    if yesterday_8am_uk <= kickoff_uk < today_8am_uk:
        m = fd_to_daily(fd_m, completed=True)
        if m and m.get("scoreA") is not None:
            yesterday_local.append(m)
    elif today_8am_uk <= kickoff_uk < tomorrow_8am_uk:
        m = fd_to_daily(fd_m, completed=False)
        if m:
            today_local.append(m)

print(f"Yesterday matches: {len(yesterday_local)} | Today matches: {len(today_local)}")

# ─── Pull previously-used news headlines and per-team facts from archive ──
# We feed these into the prompt as a blocklist so OpenAI can't repeat
# yesterday's world-news angle or recycle the same "fun fact" about a team
# every time it plays. Survives even if the archive grows large — we just
# truncate to the most recent N entries per dimension.

prev_archive_path = DATA_DIR / "daily-archive.json"
try:
    prev_archive = json.loads(prev_archive_path.read_text()) if prev_archive_path.exists() else {}
except Exception:
    prev_archive = {}

# Most-recent-first iteration over archive entries (keys are YYYYMMDD strings)
sorted_keys = sorted(prev_archive.keys(), reverse=True)

previous_news_headlines: list[str] = []
previous_news_bodies: list[str] = []
previous_facts_by_team: dict[str, list[str]] = {}
previous_storyline_headlines: list[str] = []

for k in sorted_keys:
    entry = prev_archive[k] or {}
    n = entry.get("news") or {}
    if n.get("headline"):
        previous_news_headlines.append(n["headline"])
    if n.get("body"):
        previous_news_bodies.append(n["body"])
    for sk in ("yesterdayStoryline", "todayStoryline"):
        sl = entry.get(sk) or {}
        if sl.get("headline"):
            previous_storyline_headlines.append(sl["headline"])
    for tm in (entry.get("today") or []):
        facts = tm.get("facts") or {}
        if facts.get("home") and tm.get("teamA"):
            previous_facts_by_team.setdefault(tm["teamA"], []).append(facts["home"])
        if facts.get("away") and tm.get("teamB"):
            previous_facts_by_team.setdefault(tm["teamB"], []).append(facts["away"])

# Truncate so prompt stays reasonably small even mid-tournament
previous_news_headlines = previous_news_headlines[:30]
previous_news_bodies = previous_news_bodies[:10]
previous_storyline_headlines = previous_storyline_headlines[:20]
for code in previous_facts_by_team:
    previous_facts_by_team[code] = previous_facts_by_team[code][:8]

# Build the per-team-fact blocklist string, only for teams playing today
todays_team_codes = []
for m in today_local:
    todays_team_codes.append(m["teamA"])
    todays_team_codes.append(m["teamB"])

facts_blocklist_lines = []
seen_codes: set[str] = set()
for code in todays_team_codes:
    if code in seen_codes:
        continue
    seen_codes.add(code)
    used = previous_facts_by_team.get(code) or []
    if used:
        nice = TEAMS_BY_CODE.get(code, {}).get("name", code)
        facts_blocklist_lines.append(f"  {code} ({nice}): " + " | ".join(used))
facts_blocklist = "\n".join(facts_blocklist_lines) or "  (none — first day for these teams)"

news_blocklist = "\n".join(f"  - {h}" for h in previous_news_headlines) or "  (none yet)"
storylines_blocklist = "\n".join(f"  - {h}" for h in previous_storyline_headlines) or "  (none yet)"

print(f"  blocklist: {len(previous_news_headlines)} news headlines, "
      f"{sum(len(v) for v in previous_facts_by_team.values())} prior team angles")

# ─── Ask OpenAI to enrich with storylines / facts / analysis / news ────

def team_name(code: str) -> str:
    t = TEAMS_BY_CODE.get(code)
    return t["name"] if t else code


def summary_yesterday(m: dict) -> str:
    return (f"- matchId={m['matchId']} | {team_name(m['teamA'])} vs {team_name(m['teamB'])} "
            f"(Group {m.get('group') or '?'}) FINAL {m.get('scoreA')}-{m.get('scoreB')}")


def summary_today(m: dict) -> str:
    return (f"- matchId={m['matchId']} | {team_name(m['teamA'])} vs {team_name(m['teamB'])} "
            f"(Group {m.get('group') or '?'}, kickoff {m.get('timeUk')} / {m.get('timeEt')}, "
            f"venue {m['venue']['stadium']} in {m['venue']['city']})")


yesterday_summary = "\n".join(summary_yesterday(m) for m in yesterday_local) or "(none — pre-tournament or rest day)"
today_summary = "\n".join(summary_today(m) for m in today_local) or "(none — rest day)"

system_prompt = (
    "You are a sports editor writing for a World Cup 2026 sweepstake companion site. "
    "Restrained broadcast tone for analysis and storylines — no hype, no exclamation marks. "
    "BUT the per-team 'facts' field is different: it should be short, fun, and quirky — "
    "weird trivia, oddball habits, pet stories, pre-football jobs, training-ground tics, "
    "tabloid silliness, famous quotes, agent meltdowns over birthday cakes, players caught "
    "doing strange things on camera. Surprising and amusing, NOT scandal-heavy or grim. "
    "Verifiable from real reporting (BBC, Guardian, ESPN, Athletic, Sky, FIFA.com, tabloids "
    "for the silly stuff). Never fabricate. Always return strict JSON matching the requested shape."
)

user_prompt = f"""Today is {today_long}, Tournament Day {day_number}.

YESTERDAY'S RESULTS (already concluded — match data is authoritative from football-data.org, do not change scores):
{yesterday_summary}

TODAY'S FIXTURES:
{today_summary}

Research each match and return ONLY a JSON object with this exact shape (omit any field you can't verify rather than guessing):

{{
  "yesterdayStoryline": {{"headline": "≤12-word headline", "subtitle": "≤24-word subtitle"}} OR null,
  "todayStoryline": {{"headline": "≤12-word headline", "subtitle": "≤24-word subtitle"}} OR null,
  "yesterdayDetails": [
    {{
      "matchId": "<exact ID from above>",
      "scorers": "Player 12', Player 67' (TEAM_CODE) · Player 45' (TEAM_CODE)",
      "note": "🟥 Player 78' (TEAM_CODE)" OR null,
      "analysis": {{
        "lines": ["sentence ≤20 words about how the game was played", "sentence ≤20 words about its consequence"],
        "source": "BBC Sport match report"
      }}
    }}
  ],
  "todayDetails": [
    {{
      "matchId": "<exact ID from above>",
      "weather": "22°C · scattered showers · 75% rain · 8 mph N",
      "h2h": "Played 9 · 🇺🇸 5W 2D 2L · last 2-1 USA (2025)" OR "First meeting",
      "odds": {{
        "match": {{"home": "1.83", "draw": "3.65", "away": "4.70"}},
        "extra": {{"label": "O2.5", "value": "2.25"}},
        "fgs": {{"name": "Lozano", "odds": "5.50"}}
      }},
      "facts": {{
        "home": "ONE short fun-trivia line about the home team (10-17 words, one sentence). See FACTS RULES below. REQUIRED — never null.",
        "away": "ONE short fun-trivia line about the away team (10-17 words, one sentence). See FACTS RULES below. REQUIRED — never null."
      }}
    }}
  ],
  "news": {{
    "kicker": "REUTERS · POLITICS",
    "headline": "headline of the biggest non-football world story in the last 24h",
    "body": "Two-sentence neutral summary. Second sentence here.",
    "source": "Source: Reuters, {now_uk.strftime('%-d %b %Y')}"
  }}
}}

Constraints:
- Use Celsius for weather.
- Use UK decimal odds.
- H2H is from the HOME team's (teamA listed first in the fixture summary) perspective.
- News must NOT be football — pick hard news, no celebrity gossip.
- matchId values MUST exactly match the IDs listed above.
- If yesterdayDetails or todayDetails is empty, return [].
- If you cannot find verified analysis for a yesterday match, omit the 'analysis' field for that match — never invent.
- GROUP LETTERS — when writing storyline headlines/subtitles or yesterday analysis lines, you may ONLY reference group letters that appear in the match summaries above. Do NOT guess group letters from memory of the real-world FIFA draw — our match data is the source of truth and may differ. If you cannot remember which group a team is in, look it up in the summaries above. Never invent a group letter.

FACTS RULES (apply to every 'facts.home' and 'facts.away'):

0. HARD CONTENT BAN — never write about: racism, racial abuse, race-related controversies, ethnic discrimination, hate speech, religious-identity rows, anti-LGBT incidents, hate crimes. Also AVOID grim/heavy subject matter: deaths, war atrocities, serious assaults. If the most famous angle for a team is in one of those categories, IGNORE IT and pick something fun instead.

1. TONE — short, fun, quirky one-liner. Trivia and oddities, not deep scandal. The goal is "did you know…" rather than "in 2019 the federation president was indicted for…". Examples of the vibe we want:
   - Famous players doing weird things on camera (nose-picking on the touchline, picking grass, falling asleep on the bench)
   - Pet stories (Memphis Depay's pet lion, Mario Balotelli setting off fireworks)
   - Pre-football jobs (Jamie Vardy in a factory, players who studied unusual things)
   - Agent meltdowns over silly things (Yaya Touré's birthday cake)
   - Training-ground quirks (Kroos's flip phone, a player who eats only one food)
   - Iconic quotes, viral moments, oddball superstitions, weird tattoos, jersey numbers chosen for strange reasons
   - Cute trivia: "country X has a population smaller than a London borough", "team X's keeper speaks six languages", "their striker once worked in his dad's ice-cream van"

2. LENGTH — one sentence, 10-17 words. One line on the card. NEVER more than 17 words.

3. Use web search. Do not write a fact unless you can locate it in a real reporting source (BBC, Guardian, ESPN, Athletic, Sky, FIFA.com, mainstream tabloids like the Sun/Mail/Bild for the silly stuff). Never fabricate. If you cannot find a fun verifiable angle, fall back to a SURPRISING but verifiable historical trivia point.

4. BAD examples (too long, too grim, too vague, or invented):
   - "Germany was embroiled in a doping scandal with several players under suspicion." (vague, grim)
   - "Tunisia's 2023 football crisis peaked when federation president Wadie Jary was detained over alleged financial corruption." (too long, too grim — exactly the OLD style we left behind)
   - "Japan experienced significant disruption due to a managerial change in early 2026." (invented + boring)

5. GOOD examples (THIS is the new target style — short, fun, one line):
   - GERMANY: "Joachim Löw was filmed picking his nose on live World Cup TV more than once in 2018."
   - CURAÇAO: "Curaçao is the smallest nation ever to qualify — population around 150,000, less than a London borough."
   - NETHERLANDS: "Memphis Depay once kept a pet lion called Trinity until animal-welfare groups convinced him otherwise."
   - JAPAN: "Japanese fans famously tidy stadiums after their team's games — the squad cleans the dressing room too."
   - IVORY COAST: "Yaya Touré's agent once publicly complained Manchester City gave his star a 'disrespectfully small' birthday cake."
   - ECUADOR: "Ecuador play home qualifiers at 2,850m in Quito, leaving visiting teams gasping by halftime."
   - SWEDEN: "Zlatan Ibrahimović has held a taekwondo black belt since he was 17."
   - TUNISIA: "Tunisia were the first African nation to win a World Cup match, beating Mexico 3-1 in 1978."

6. NEVER reference an event after {now_uk.year} that you cannot verify from a real published source.

NO-REPEAT RULES — these are hard rules, not preferences:

1. The world-news headline MUST NOT be the same story as, or a rewording of, any of these previously-used headlines (most-recent first). If today's biggest story IS one of these, pick the next-biggest verifiable non-football story instead:
{news_blocklist}

2. The yesterday/today storyline headlines should not duplicate these prior storyline headlines (rewording is fine if the underlying event is new; otherwise pick a fresh angle):
{storylines_blocklist}

3. The per-team 'facts' angles MUST NOT repeat any of these previously-used angles for the SAME team — pick a different scandal/feud/story each time (most-recent first):
{facts_blocklist}
"""

OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-5.5")
print(f"Calling OpenAI ({OPENAI_MODEL} + web_search_preview)…")

try:
    from openai import OpenAI
except ImportError:
    print("Installing openai package…")
    os.system(f"{sys.executable} -m pip install --quiet openai")
    from openai import OpenAI

client = OpenAI(api_key=OPENAI_API_KEY)

ai_text = ""
try:
    response = client.responses.create(
        model=OPENAI_MODEL,
        instructions=system_prompt,
        input=user_prompt,
        tools=[{"type": "web_search_preview"}],
    )
    ai_text = response.output_text
except Exception as e:
    print(f"ERROR: OpenAI call failed: {e}", file=sys.stderr)
    sys.exit(3)


def strip_citations(text: str) -> str:
    """gpt-5+ inserts inline markdown citations like ([bbc.co.uk](https://...))
    and bold markers like **1982**. Strip both — site already shows 'Source: …'.
    """
    if not isinstance(text, str):
        return text
    # Strip markdown link citations: ([domain](url)) or (domain.com)
    text = re.sub(r"\s*\(\[[^\]]+\]\([^)]+\)\)", "", text)
    text = re.sub(r"\s*\([^()]*utm_source=openai[^()]*\)", "", text)
    # Strip bold markers
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    # Collapse double spaces
    text = re.sub(r"  +", " ", text).strip()
    return text


def deep_strip(obj):
    if isinstance(obj, str):
        return strip_citations(obj)
    if isinstance(obj, list):
        return [deep_strip(x) for x in obj]
    if isinstance(obj, dict):
        return {k: deep_strip(v) for k, v in obj.items()}
    return obj


# Parse JSON — Responses API may wrap in markdown fences
try:
    m = re.search(r"\{.*\}", ai_text, re.DOTALL)
    if not m:
        raise ValueError("no JSON object found in response")
    raw = m.group(0)
    # Pre-strip citations from the raw JSON text so they don't break parsing
    # (citations are inside string values so JSON is still valid, but we want
    # them out regardless)
    ai_data = json.loads(raw)
    ai_data = deep_strip(ai_data)
    print(f"  parsed OpenAI JSON ({OPENAI_MODEL})")
except Exception as e:
    print(f"ERROR: could not parse JSON from OpenAI response: {e}", file=sys.stderr)
    print(f"  raw response begins: {ai_text[:500]}", file=sys.stderr)
    sys.exit(4)

# ─── Merge AI extras into each match ──────────────────────────────────

ai_yesterday_by_id = {d["matchId"]: d for d in ai_data.get("yesterdayDetails", []) if d.get("matchId")}
ai_today_by_id = {d["matchId"]: d for d in ai_data.get("todayDetails", []) if d.get("matchId")}

for m in yesterday_local:
    d = ai_yesterday_by_id.get(m["matchId"], {})
    if d.get("scorers"):
        m["scorers"] = d["scorers"]
    if d.get("note"):
        m["note"] = d["note"]
    if d.get("analysis"):
        m["analysis"] = d["analysis"]

for m in today_local:
    d = ai_today_by_id.get(m["matchId"], {})
    if d.get("weather"):
        m["weather"] = d["weather"]
    if d.get("h2h"):
        m["h2h"] = d["h2h"]
    if d.get("odds"):
        m["odds"] = d["odds"]
    if d.get("facts"):
        m["facts"] = d["facts"]

# ─── Build the daily payload ──────────────────────────────────────────

def count_label(n: int, pre_tournament_fallback: str = "Pre-tournament") -> str:
    if n == 0:
        return pre_tournament_fallback if day_number < 1 else "Rest day"
    if n == 1:
        return "1 match"
    return f"{n} matches"


payload = {
    "generatedAt": now_uk.isoformat(),
    "dateLong": today_long,
    "dateDay": today_day,
    "dateRest": date_rest,
    "yesterdayCount": count_label(len(yesterday_local)),
    "todayCount": count_label(len(today_local)),
    "yesterdayStoryline": ai_data.get("yesterdayStoryline"),
    "todayStoryline": ai_data.get("todayStoryline"),
    "yesterday": yesterday_local,
    "today": today_local,
    "news": ai_data.get("news") or {
        "kicker": "WORLD",
        "headline": "World news pending",
        "body": "Today's update could not fetch a non-football world headline.",
        "source": f"Source: pending, {now_uk.strftime('%-d %b %Y')}",
    },
    "footerNote": "All times converted from official kickoffs",
}

# ─── Write the JSON files ─────────────────────────────────────────────

(DATA_DIR / "daily-current.json").write_text(
    json.dumps(payload, indent=2, ensure_ascii=False) + "\n"
)
print("  wrote data/daily-current.json")

archive_path = DATA_DIR / "daily-archive.json"
archive = json.loads(archive_path.read_text()) if archive_path.exists() else {}
archive[today_date_str] = payload
archive_path.write_text(json.dumps(archive, indent=2, ensure_ascii=False) + "\n")
print(f"  wrote data/daily-archive.json ({len(archive)} entries)")

# Update matches.json — flip yesterday matches to status=completed with result
yesterday_by_id = {m["matchId"]: m for m in yesterday_local}
matches_updated = 0
for m in matches_data:
    y = yesterday_by_id.get(m["id"])
    if y and y.get("scoreA") is not None:
        m["status"] = "completed"
        notes = []
        if y.get("note"):
            notes.append(y["note"])
        m["result"] = {
            "scoreA": y["scoreA"],
            "scoreB": y["scoreB"],
            "scorers": y.get("scorers", ""),
            "notes": notes,
        }
        matches_updated += 1

(DATA_DIR / "matches.json").write_text(
    json.dumps(matches_data, indent=2, ensure_ascii=False) + "\n"
)
print(f"  wrote data/matches.json ({matches_updated} results updated)")

print("\n✓ Daily update complete")
print(f"  Yesterday storyline: {payload['yesterdayStoryline']['headline'] if payload['yesterdayStoryline'] else '(none)'}")
print(f"  Today storyline:     {payload['todayStoryline']['headline'] if payload['todayStoryline'] else '(none)'}")
print(f"  World news:          {payload['news']['headline']}")
