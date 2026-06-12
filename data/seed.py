"""Generate static JSON data files for the World Cup sweepstakes site.

Run once whenever source data changes:
    python3 data/seed.py

Outputs:
    data/teams.json     — 48 teams with flag + group
    data/entrants.json  — 24 entrants with their 2 teams (codes)
    data/matches.json   — 72 group + 32 knockout placeholder matches
    data/awards.json    — 17 awards with rules
    data/rules.json     — full rules + tiebreaker copy
"""
import json
import re
from pathlib import Path
from datetime import datetime

DATA = Path(__file__).parent

# ────────────────────────────────────────────────────────────────────────────
# 48 teams + groups
# ────────────────────────────────────────────────────────────────────────────

# (code, name, flag, group)
TEAMS = [
    # Group A
    ("MEX", "Mexico", "🇲🇽", "A"),
    ("KOR", "South Korea", "🇰🇷", "A"),
    ("CZE", "Czechia", "🇨🇿", "A"),
    ("RSA", "South Africa", "🇿🇦", "A"),
    # Group B
    ("SUI", "Switzerland", "🇨🇭", "B"),
    ("CAN", "Canada", "🇨🇦", "B"),
    ("QAT", "Qatar", "🇶🇦", "B"),
    ("BIH", "Bosnia and Herzegovina", "🇧🇦", "B"),
    # Group C
    ("BRA", "Brazil", "🇧🇷", "C"),
    ("MAR", "Morocco", "🇲🇦", "C"),
    ("SCO", "Scotland", "🏴\U000e0067\U000e0062\U000e0073\U000e0063\U000e0074\U000e007f", "C"),
    ("HAI", "Haiti", "🇭🇹", "C"),
    # Group D
    ("USA", "USA", "🇺🇸", "D"),
    ("TUR", "Türkiye", "🇹🇷", "D"),
    ("AUS", "Australia", "🇦🇺", "D"),
    ("PAR", "Paraguay", "🇵🇾", "D"),
    # Group E
    ("GER", "Germany", "🇩🇪", "E"),
    ("ECU", "Ecuador", "🇪🇨", "E"),
    ("CIV", "Ivory Coast", "🇨🇮", "E"),
    ("CUW", "Curaçao", "🇨🇼", "E"),
    # Group F
    ("NED", "Netherlands", "🇳🇱", "F"),
    ("JPN", "Japan", "🇯🇵", "F"),
    ("SWE", "Sweden", "🇸🇪", "F"),
    ("TUN", "Tunisia", "🇹🇳", "F"),
    # Group G
    ("BEL", "Belgium", "🇧🇪", "G"),
    ("EGY", "Egypt", "🇪🇬", "G"),
    ("IRN", "Iran", "🇮🇷", "G"),
    ("NZL", "New Zealand", "🇳🇿", "G"),
    # Group H
    ("ESP", "Spain", "🇪🇸", "H"),
    ("URU", "Uruguay", "🇺🇾", "H"),
    ("KSA", "Saudi Arabia", "🇸🇦", "H"),
    ("CPV", "Cape Verde", "🇨🇻", "H"),
    # Group I
    ("FRA", "France", "🇫🇷", "I"),
    ("NOR", "Norway", "🇳🇴", "I"),
    ("SEN", "Senegal", "🇸🇳", "I"),
    ("IRQ", "Iraq", "🇮🇶", "I"),
    # Group J
    ("ARG", "Argentina", "🇦🇷", "J"),
    ("AUT", "Austria", "🇦🇹", "J"),
    ("ALG", "Algeria", "🇩🇿", "J"),
    ("JOR", "Jordan", "🇯🇴", "J"),
    # Group K
    ("POR", "Portugal", "🇵🇹", "K"),
    ("COL", "Colombia", "🇨🇴", "K"),
    ("COD", "DR Congo", "🇨🇩", "K"),
    ("UZB", "Uzbekistan", "🇺🇿", "K"),
    # Group L
    ("ENG", "England", "🏴\U000e0067\U000e0062\U000e0065\U000e006e\U000e0067\U000e007f", "L"),
    ("CRO", "Croatia", "🇭🇷", "L"),
    ("GHA", "Ghana", "🇬🇭", "L"),
    ("PAN", "Panama", "🇵🇦", "L"),
]
TEAM_BY_NAME = {name: code for code, name, _flag, _group in TEAMS}
# Aliases the routine prompt also handles
ALIASES = {
    "United States": "USA",
    "Turkey": "TUR",
    "Czech Republic": "CZE",
    "Democratic Republic of the Congo": "COD",
    "Bosnia": "BIH",
    "Cabo Verde": "CPV",
    "Côte d'Ivoire": "CIV",
    "Korea Republic": "KOR",
}
for alias, code in ALIASES.items():
    TEAM_BY_NAME[alias] = code

# ────────────────────────────────────────────────────────────────────────────
# 24 entrants
# ────────────────────────────────────────────────────────────────────────────

# (name, top-pot team, bottom-pot team)  — sourced from Entrants sheet
ENTRANTS = [
    ("Sam L",   "Mexico",                  "South Africa"),
    ("Calum",   "Brazil",                  "Czechia"),
    ("Andrew N","Switzerland",             "Curaçao"),
    ("Tyler",   "Türkiye",                 "Saudi Arabia"),
    ("Will",    "Australia",               "DR Congo"),
    ("Andrew R","Germany",                 "Egypt"),
    ("Joe",     "Argentina",               "Panama"),
    ("Peter",   "France",                  "Qatar"),
    ("Beer",    "USA",                     "Jordan"),
    ("Bank",    "Japan",                   "Uzbekistan"),
    ("Felix",   "Austria",                 "Ghana"),
    ("Ben",     "South Korea",             "New Zealand"),
    ("Harry",   "Croatia",                 "Haiti"),
    ("Archie",  "Netherlands",             "Iran"),
    ("Tom",     "Belgium",                 "Paraguay"),
    ("Dan",     "Portugal",                "Sweden"),
    ("Rebekah", "Uruguay",                 "Iraq"),
    ("James",   "Colombia",                "Ivory Coast"),
    ("Sam W",   "Morocco",                 "Tunisia"),
    ("Ned",     "Spain",                   "Scotland"),
    ("Ed",      "Algeria",                 "Canada"),
    ("Jari",    "Ecuador",                 "Cape Verde"),
    ("Spoff",   "England",                 "Bosnia and Herzegovina"),
    ("Austin",  "Senegal",                 "Norway"),
]

def slugify(name: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

# ────────────────────────────────────────────────────────────────────────────
# 72 group matches — from Sam's pre-tournament ranking
# Format: (rank, group, teamA, teamB, date "YYYY-MM-DD", time "HH:MM", elo, balance, total)
# ────────────────────────────────────────────────────────────────────────────

GROUP_MATCHES_RAW = """
#1 | K | Colombia | Portugal | 2026-06-28 | 00:30 | 1986 | 99 | 84.4
#2 | E | Ecuador | Germany | 2026-06-26 | 21:00 | 1935 | 99.1 | 80
#3 | L | England | Croatia | 2026-06-17 | 21:00 | 1968 | 84 | 76.8
#4 | I | Norway | France | 2026-06-26 | 20:00 | 1989 | 78.7 | 76.6
#5 | F | Netherlands | Japan | 2026-06-14 | 21:00 | 1907 | 88.1 | 73.1
#6 | I | Norway | Senegal | 2026-06-23 | 01:00 | 1885 | 91.6 | 72.5
#7 | H | Uruguay | Spain | 2026-06-27 | 01:00 | 2018 | 60.1 | 71.7
#8 | I | France | Senegal | 2026-06-16 | 20:00 | 1959 | 70.3 | 70.6
#9 | C | Brazil | Morocco | 2026-06-13 | 23:00 | 1915 | 78.1 | 69.8
#10 | D | Türkiye | USA | 2026-06-26 | 03:00 | 1841 | 91.1 | 68.5
#11 | E | Germany | Ivory Coast | 2026-06-20 | 21:00 | 1866 | 81.1 | 66.7
#12 | E | Ivory Coast | Ecuador | 2026-06-15 | 00:00 | 1869 | 80.3 | 66.6
#13 | F | Japan | Sweden | 2026-06-26 | 00:00 | 1826 | 88.9 | 66.2
#14 | A | Mexico | South Korea | 2026-06-19 | 02:00 | 1800 | 94.3 | 66.1
#15 | F | Netherlands | Sweden | 2026-06-20 | 18:00 | 1868 | 77 | 65.1
#16 | D | USA | Australia | 2026-06-19 | 20:00 | 1788 | 93.6 | 64.7
#17 | D | Australia | Türkiye | 2026-06-13 | 05:00 | 1819 | 84.7 | 63.9
#18 | C | Scotland | Morocco | 2026-06-19 | 23:00 | 1798 | 88.6 | 63.6
#19 | J | Argentina | Austria | 2026-06-22 | 18:00 | 1954 | 54 | 63.6
#20 | G | Egypt | Iran | 2026-06-27 | 04:00 | 1734 | 98.9 | 62.1
#21 | C | Scotland | Brazil | 2026-06-25 | 23:00 | 1875 | 66.7 | 61.6
#22 | G | Belgium | Egypt | 2026-06-15 | 20:00 | 1791 | 85 | 61.5
#23 | G | Belgium | Iran | 2026-06-21 | 20:00 | 1787 | 83.9 | 60.7
#24 | K | Portugal | DR Congo | 2026-06-17 | 18:00 | 1867 | 65.1 | 60.4
#25 | K | Colombia | DR Congo | 2026-06-24 | 03:00 | 1864 | 66.1 | 60.4
#26 | J | Algeria | Austria | 2026-06-28 | 03:00 | 1757 | 89.6 | 60.3
#27 | F | Sweden | Tunisia | 2026-06-15 | 03:00 | 1745 | 88 | 58.7
#28 | L | Croatia | Ghana | 2026-06-28 | 22:00 | 1811 | 71.1 | 57.8
#29 | F | Tunisia | Japan | 2026-06-21 | 05:00 | 1784 | 76.9 | 57.7
#30 | D | Paraguay | Australia | 2026-06-26 | 03:00 | 1727 | 89 | 57.4
#31 | D | USA | Paraguay | 2026-06-13 | 02:00 | 1749 | 82.6 | 56.9
#32 | B | Switzerland | Bosnia and Herzegovina | 2026-06-18 | 20:00 | 1793 | 72.1 | 56.6
#33 | F | Tunisia | Netherlands | 2026-06-26 | 00:00 | 1826 | 65 | 56.6
#34 | L | England | Ghana | 2026-06-23 | 21:00 | 1867 | 55.1 | 56.4
#35 | A | South Korea | Czechia | 2026-06-12 | 03:00 | 1729 | 85.4 | 56.2
#36 | J | Argentina | Algeria | 2026-06-17 | 02:00 | 1918 | 43.6 | 56.2
#37 | D | Türkiye | Paraguay | 2026-06-20 | 04:00 | 1780 | 73.7 | 56.1
#38 | A | Czechia | Mexico | 2026-06-25 | 02:00 | 1749 | 79.7 | 55.7
#39 | K | DR Congo | Uzbekistan | 2026-06-28 | 00:30 | 1698 | 86.4 | 53.8
#40 | H | Saudi Arabia | Uruguay | 2026-06-15 | 23:00 | 1772 | 69.6 | 53.7
#41 | B | Canada | Bosnia and Herzegovina | 2026-06-12 | 20:00 | 1668 | 92.1 | 53.5
#42 | L | Ghana | Panama | 2026-06-18 | 00:00 | 1669 | 88.3 | 52.1
#43 | A | Czechia | South Africa | 2026-06-18 | 17:00 | 1647 | 91 | 51.2
#44 | B | Switzerland | Canada | 2026-06-24 | 20:00 | 1765 | 64.3 | 51
#45 | K | Uzbekistan | Colombia | 2026-06-18 | 03:00 | 1816 | 52.6 | 50.8
#46 | K | Portugal | Uzbekistan | 2026-06-23 | 18:00 | 1820 | 51.6 | 50.7
#47 | B | Canada | Qatar | 2026-06-18 | 23:00 | 1620 | 94.3 | 50.1
#48 | H | Spain | Saudi Arabia | 2026-06-21 | 17:00 | 1911 | 29.7 | 50.1
#49 | A | South Africa | South Korea | 2026-06-25 | 02:00 | 1698 | 76.4 | 49.8
#50 | L | Panama | Croatia | 2026-06-24 | 00:00 | 1770 | 59.4 | 49.5
#51 | B | Bosnia and Herzegovina | Qatar | 2026-06-24 | 20:00 | 1648 | 86.4 | 49.4
#52 | A | Mexico | South Africa | 2026-06-11 | 20:00 | 1718 | 70.7 | 49.3
#53 | L | Panama | England | 2026-06-28 | 22:00 | 1826 | 43.4 | 48
#54 | H | Cape Verde | Saudi Arabia | 2026-06-27 | 01:00 | 1623 | 87.9 | 47.8
#55 | B | Qatar | Switzerland | 2026-06-13 | 20:00 | 1745 | 58.6 | 46.9
#56 | I | Senegal | Iraq | 2026-06-26 | 20:00 | 1724 | 62.4 | 46.6
#57 | I | Iraq | Norway | 2026-06-16 | 23:00 | 1753 | 54 | 45.8
#58 | J | Jordan | Algeria | 2026-06-23 | 04:00 | 1643 | 77.9 | 45.5
#59 | H | Uruguay | Cape Verde | 2026-06-21 | 23:00 | 1729 | 57.4 | 45
#60 | J | Austria | Jordan | 2026-06-17 | 05:00 | 1679 | 67.4 | 44.6
#61 | I | France | Iraq | 2026-06-22 | 22:00 | 1828 | 32.7 | 43.9
#62 | C | Haiti | Scotland | 2026-06-14 | 02:00 | 1644 | 67.4 | 41.5
#63 | H | Spain | Cape Verde | 2026-06-15 | 17:00 | 1869 | 17.6 | 41.5
#64 | C | Morocco | Haiti | 2026-06-25 | 23:00 | 1684 | 56 | 40.5
#65 | J | Jordan | Argentina | 2026-06-28 | 03:00 | 1840 | 21.4 | 40.5
#66 | G | Iran | New Zealand | 2026-06-16 | 02:00 | 1620 | 68.6 | 39.8
#67 | G | New Zealand | Egypt | 2026-06-22 | 02:00 | 1624 | 67.4 | 39.7
#68 | C | Brazil | Haiti | 2026-06-20 | 01:30 | 1761 | 34.1 | 38.5
#69 | G | New Zealand | Belgium | 2026-06-27 | 04:00 | 1677 | 52.4 | 38.4
#70 | E | Curaçao | Ivory Coast | 2026-06-25 | 21:00 | 1640 | 54.3 | 35.9
#71 | E | Germany | Curaçao | 2026-06-14 | 18:00 | 1706 | 35.4 | 34.2
#72 | E | Ecuador | Curaçao | 2026-06-21 | 01:00 | 1709 | 34.6 | 34.1
"""

# ────────────────────────────────────────────────────────────────────────────
# 17 awards
# ────────────────────────────────────────────────────────────────────────────

AWARDS = [
    ("first-place",       "1st place team",                  "team",     "Final winner.",                                                                "trophy"),
    ("second-place",      "2nd place team",                  "team",     "Runner-up.",                                                                   "trophy"),
    ("third-place",       "3rd place team",                  "team",     "3rd-place play-off winner.",                                                   "trophy"),
    ("top-scorer",        "Top scorer (player)",             "player",   "Most goals across the tournament.",                                            "boot"),
    ("top-scoring-team",  "Top scoring team",                "team",     "Most goals scored in the group stage only.",                                  "boot"),
    ("most-clean-sheets", "Most clean sheets (team)",        "team",     "Most clean sheets across the whole tournament.",                              "shield"),
    ("first-red",         "First red card (by mins played)", "team",     "Determined by cumulative tournament minutes played at moment of red, so teams playing earlier in the tournament don't benefit.", "card"),
    ("first-og",          "First own goal (by mins played)", "team",     "Cumulative tournament minutes basis, same logic as the red-card award.",      "card"),
    ("worst-team",        "Worst team",                      "team",     "Lowest points → then worst goal difference → then fewest goals scored.",      "wooden-spoon"),
    ("first-shootout",    "First team to lose a shootout",   "team",     "Knockout-stage penalty shootout loss.",                                       "penalty"),
    ("designated-injury", "Designated player injured out",   "player",   "Player nominated pre-tournament; must be confirmed out for the rest of the tournament.", "injury"),
    ("worst-disciplined", "Worst disciplined team",          "team",     "Most cards + fouls per 90 (exact weighting to be locked before kickoff).",    "card"),
    ("iran-multiplier",   "Iran Multiplier",                 "modifier", "If Iran no-shows the tournament, the entrant who drew Iran gets a 1.5x multiplier on all rewards from their OTHER team EXCEPT 1st place.", "star"),
    ("trump-bash",        "Trump bash award",                "team",     "First team whose NATIONAL TEAM specifically is insulted by Trump. Country-wide insults do NOT count.", "megaphone"),
    ("first-missed-pen",  "First missed penalty (by mins)",  "team",     "Cumulative tournament minutes basis. Confirm in-play vs shootout scope before kickoff.", "penalty"),
    ("most-assists",      "Most assists (player)",           "player",   "Tournament assists leader.",                                                  "boot"),
    ("shithouse",         "Shithouse award",                 "team",     "Most wins in which the winning team took fewer shots than their opponent.",   "trophy"),
]

# ────────────────────────────────────────────────────────────────────────────
# Build outputs
# ────────────────────────────────────────────────────────────────────────────

def build_teams():
    return [
        {"code": code, "name": name, "flag": flag, "group": group}
        for code, name, flag, group in TEAMS
    ]

def build_entrants():
    out = []
    for name, top_name, bot_name in ENTRANTS:
        top_code = TEAM_BY_NAME[top_name]
        bot_code = TEAM_BY_NAME[bot_name]
        out.append({
            "name": name,
            "slug": slugify(name),
            "teamA": top_code,
            "teamB": bot_code,
        })
    return out

def build_group_matches():
    out = []
    for line in GROUP_MATCHES_RAW.strip().splitlines():
        m = re.match(r"#(\d+)\s*\|\s*(\w+)\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(\d{2}:\d{2})\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)", line)
        if not m:
            print(f"WARN: could not parse: {line}")
            continue
        rank, group, ta, tb, date, time_, elo, balance, total = m.groups()
        ta = ta.strip(); tb = tb.strip()
        # Convert kickoff (BST = UTC+1) to ISO with offset
        kickoff_uk_iso = f"{date}T{time_}:00+01:00"
        out.append({
            "id": f"G{rank.zfill(3)}",
            "stage": "group",
            "group": group,
            "round": None,
            "rank": int(rank),
            "kickoffUk": kickoff_uk_iso,
            "teamA": TEAM_BY_NAME[ta],
            "teamB": TEAM_BY_NAME[tb],
            "venue": None,
            "broadcast": None,
            "status": "scheduled",
            "result": None,
            "quality": {"elo": float(elo), "balance": float(balance), "total": float(total)},
        })
    out.sort(key=lambda x: x["kickoffUk"])
    return out

def build_knockout_placeholders():
    """Knockout structure for WC2026: R32 (16) → R16 (8) → QF (4) → SF (2) → 3rd-place (1) → Final (1)."""
    rounds = [
        ("R32", 16, "2026-06-30", "2026-07-03"),
        ("R16", 8,  "2026-07-04", "2026-07-07"),
        ("QF",  4,  "2026-07-09", "2026-07-11"),
        ("SF",  2,  "2026-07-14", "2026-07-15"),
        ("3rd", 1,  "2026-07-18", "2026-07-18"),
        ("F",   1,  "2026-07-19", "2026-07-19"),
    ]
    out = []
    counter = 1
    for code, n, _start, _end in rounds:
        for i in range(1, n + 1):
            out.append({
                "id": f"K{counter:03d}",
                "stage": "knockout",
                "group": None,
                "round": code,
                "matchNo": i,
                "rank": None,
                "kickoffUk": None,
                "teamA": None,
                "teamB": None,
                "venue": None,
                "broadcast": None,
                "status": "tbd",
                "result": None,
            })
            counter += 1
    return out

def build_awards():
    return [
        {"id": id_, "title": title, "type": type_, "rule": rule, "icon": icon, "currentLeader": None, "winnerEntrant": None}
        for id_, title, type_, rule, icon in AWARDS
    ]

def build_rules():
    return {
        "title": "World Cup 2026 Sweepstake Rules",
        "entryFee": 10,
        "currency": "£",
        "entrants": 24,
        "potTotal": 240,
        "draw": "Each entrant gets one team from the Top-24 pot and one team from the Bottom-24 pot.",
        "awards": [a["id"] for a in build_awards()],
        "tiebreaker": {
            "headline": "Combined shots prediction",
            "detail": "Each entrant guesses the TOTAL combined shots their two teams will take across the entire tournament. The closest guess wins any tied awards or any awards that go unawarded.",
        },
        "iranMultiplier": "If Iran does not show up to the tournament, the entrant who drew Iran gets a 1.5x multiplier on all rewards earned by their OTHER team, EXCEPT 1st place.",
        "notes": [
            "First red card / first OG / first missed penalty are decided by cumulative tournament minutes played, NOT calendar time, to avoid bias toward teams playing earlier.",
            "Top scoring team is GROUP STAGE ONLY.",
            "Worst team tiebreakers: fewest points → worst goal difference → fewest goals scored.",
            "Worst disciplined team formula: most cards + fouls per 90 (exact weighting locked before kickoff).",
            "Trump bash award: must be aimed at the national team specifically — country-wide insults do not count.",
        ],
    }

def main():
    teams = build_teams()
    entrants = build_entrants()
    group_matches = build_group_matches()
    ko_matches = build_knockout_placeholders()
    matches = group_matches + ko_matches
    awards = build_awards()
    rules = build_rules()

    for name, payload in [
        ("teams", teams),
        ("entrants", entrants),
        ("matches", matches),
        ("awards", awards),
        ("rules", rules),
    ]:
        out = DATA / f"{name}.json"
        out.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
        n = len(payload) if isinstance(payload, list) else 1
        print(f"  wrote data/{name}.json — {n} item{'s' if n != 1 else ''}")

if __name__ == "__main__":
    main()
