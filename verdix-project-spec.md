# Verdix – Project Spec & Build Handoff

**Purpose of this document:** This is a complete architecture + decision record for rebuilding Verdix (currently a Streamlit + Google Sheets app) as a Next.js + Supabase app hosted on Vercel. Hand this file to Claude Code as the source of truth for the build. All major product and technical decisions below have already been agreed with the client — do not re-litigate them without flagging the tradeoff explicitly.

---

## 1. What Verdix Is

A scoring platform for pitch competitions/accelerators/student venture showcases. Admin manages teams and judges. Judges review team profiles and pitch decks ahead of time, then score teams against a fixed rubric. Standardized (bias-corrected) scoring and a deliberation dashboard help organizers pick fair winners per track and overall.

---

## 2. Stack

- **Frontend + hosting:** Next.js, deployed on Vercel
- **Backend:** Supabase (Postgres, Auth, Row Level Security, Realtime)
- **No accounts exist yet** — Supabase project and Vercel project both need to be created as part of setup. Include `.env.local` scaffolding, Supabase CLI/migration setup, and clear instructions for where the human needs to paste in project URL/keys.

---

## 3. Authentication Model

| Role | Method | Notes |
|---|---|---|
| **Admin** | Static email + password (Supabase Auth email/password) | 1–2 admin accounts. Fast repeat login, no email round-trip needed mid-event. |
| **Judge** | Magic link (passwordless email link, Supabase Auth) | Judge's email must be **pre-registered by admin** (as part of track assignment) before a magic link will grant access. No self-signup. |

- Both roles land in a shared `profiles` table after auth, with a `role` field (`admin` | `judge`) driving route-guarding and RLS policies.
- Uninvited/unregistered emails clicking a magic link (or attempting login) should get a clear "you don't have access, contact the organizer" state — not a broken screen.
- Magic links are single-use and expire — normal Supabase behavior, no special handling needed beyond a clear "request a new link" affordance.

### RLS decision (confirmed):
**Scores stay fully blind between judges.** A judge cannot see other judges' scores or comments for any team. Only admin can see all scores, at any time, via the Deliberation Dashboard. This must be enforced at the RLS policy level, not just hidden in the UI.

---

## 4. Data Entry Model (v1)

- **No public-facing team registration.** All team data is entered by **Admin only**.
- Admin enters/edits: Team Name, Track, Team Leaders, Student ID, University, Faculty, Programme, Industries (tags), Stage, Value Proposition, Video Link (optional), Deck Link.
- Admin also creates/edits Judges: Name, Email, Assigned Track(s).
- **Manual single-entry forms** for both Teams and Judges (for one-off additions/edits).
- **CSV bulk import** for both Teams and Judges:
  1. Admin downloads a pre-built CSV template with correct headers.
  2. Admin uploads filled CSV.
  3. App parses and validates **before** committing anything — shows a preview table with per-row status (✅ valid / ⚠️ warning / ❌ error).
  4. Validation checks: missing required fields, Track name not matching an existing `tracks` row, duplicate team name within same track, malformed judge email, basic URL format check on deck link (not a live fetch).
  5. **Behavior on partial errors: insert valid rows, clearly report/skip flagged rows** (not all-or-nothing). Admin fixes and re-uploads only the flagged rows if needed.
- Deck links are **plain external links** ("open in new tab") — no embedded viewer in v1.

---

## 5. Judge Portal

Two distinct modes, both scoped to only the judge's **assigned track(s)** (assignment is admin-controlled, not self-selected).

### Prep Mode
- List of teams in the judge's assigned track(s)
- Full team profile view (not cramped into a collapsed expander): Value Proposition, Industry/Tags, Stage, Founders, Academic Background
- Deck Link — external link, opens in new tab
- **Standalone Rubric Reference tab** — all criteria with full descriptions, viewable anytime independent of the scoring form (goal: judges can pre-read everything before event day, nothing scattered)
- "Reviewed" marker/checkbox per team — lets judges (and admin, monitoring prep progress) track who has reviewed what before judging begins

### Scoring Mode
- Same team list, with a "Score" action per team
- Scoring form: current rubric has **7 criteria**, each scored 1–10 via slider, plus one optional free-text comments field per team
- Rubric criterion descriptions shown inline during scoring too (not just banished to the separate Prep tab — reduce friction while actively scoring)
- Rubric criteria should be **stored as configurable data**, not hardcoded, so criteria can be edited/added without a schema change (see `rubric_criteria` table below)

---

## 6. Scoring Methodology — Statistical Design

This is the core differentiator of the rebuild. Raw averaging is intentionally **not** the primary ranking method, because judge severity and scale-usage differ per judge.

### Metrics computed per team (shown side by side, never hide raw data):

| Metric | Definition | Purpose |
|---|---|---|
| **Raw Average** | Simple mean of raw scores (out of 70) across judges | What organizers intuitively expect / sanity check |
| **Judges Count** | # of judges who scored the team | Context for reliability |
| **Score Spread** | Std dev / range of raw total scores across judges | Disagreement signal |
| **Standardized Score** | Mean of per-judge z-scores: `z = (raw_score - judge_mean) / judge_stdev`, computed per judge across all teams *that judge* scored | Bias/scale-corrected comparison — this is the actual ranking metric |
| **Track Rank** | Rank by Standardized Score within the team's track | Track winner determination |
| **Cohort Rank** | Rank by Standardized Score across the full cohort (all tracks) | Overall winner determination |
| **Cohort Percentile** | Team's percentile position vs. the whole cohort | Human-readable cross-track comparison |

### Winners:
- **Track Winner** = #1 by Standardized Score within track
- **Overall Winner** = #1 by Standardized Score across full cohort
- **Minimum judge threshold** (admin-configurable per event, e.g. 2 or 3) — a team must be scored by at least this many judges to be *eligible* to win. Shown as a visible note near winner callouts.

### Transparency requirements:
- Every screen showing Standardized Score needs a plain-language "What does this mean?" explainer (not just a tooltip icon) — audience is non-technical judges/organizers.
- Cohort-wide comparison must carry a visible caveat: cross-track comparison is only as fair as judge consistency across tracks allows — present as "best available estimate," not as flawless.

---

## 7. Deliberation Dashboard (Admin-only)

Reframed from "leaderboard" to **deliberation support tool** — its job is to point organizers at exactly the cases needing human judgment, and give them the context to resolve those cases.

### Must-have (v1):
- **Disagreement Flag** — triggers when score spread exceeds a configurable threshold (std dev or max-min gap)
- **Close-Call Flag** — teams within a small standardized-score margin of the rank above/below them (distinct from Disagreement — this is "judges agree but it's still a near-tie")
- **Feedback-alongside-flag view** — when a team is flagged, show all judges' written comments together so the room can see *why* opinions diverged
- **Deliberation Notes** — free-text log tied to a flagged team, capturing the panel's discussion outcome (audit trail — matters if a team later asks why they didn't place)

### High-value (v1 if time allows, else immediately after):
- **Criterion-level breakdown** — per-criterion averages/spread per team, since disagreement often hides *which* criterion drove the total gap
- **Outlier Judge Detection** — flags a specific judge's score (not the whole team) when it's an outlier vs. other judges' scores for that same team (e.g., >2 std dev away)
- **Score exclusion with audit trail** — admin-only action to exclude a specific score from aggregation (e.g., confirmed judge error). Never silent: logs who excluded it, when, why. Standardized scores recompute live after exclusion.

### v2 / explicitly deferred:
- Radar/spider chart per team (per-criterion visual, judges overlaid)
- "What-if" recompute preview (show ranking impact before committing an exclusion)
- Judge calibration report (per-judge mean/stdev/count, admin-only, cross-event pattern tracking)
- Criterion difficulty/variance report (which criterion is most divisive across the whole cohort — a rubric-quality signal for future events)

### Dashboard views:
- **Track View** — filtered to one track, sorted by Standardized Score, shows Track Rank + Raw Average side by side, medal badges for top 3
- **Cohort/Overall View** — all teams pooled, sorted by cohort-wide Standardized Score, shows Cohort Rank + Cohort Percentile, this is where "Best Overall" is decided

---

## 8. Database Schema (sketch — finalize exact types/constraints during migration writing)

```
profiles
  id            (FK -> auth.users)
  role          enum('admin','judge')
  name          text
  email         text

tracks
  id
  name                    text
  min_judges_required     int
  created_at

teams
  id
  team_name               text
  track_id                FK -> tracks
  team_leaders            text
  student_id              text
  university              text
  faculty                 text
  programme               text
  industries              text[]        -- simple array column, confirmed (not a join table)
  stage                   text
  value_proposition       text
  video_link              text (nullable)
  deck_link               text
  created_at
  updated_at

judge_track_assignments  (join table)
  id
  judge_id                FK -> profiles
  track_id                FK -> tracks

rubric_criteria
  id
  label                   text
  description             text
  sort_order              int

scores                   -- long format: one row per (judge, team, criterion)
  id
  judge_id                FK -> profiles
  team_id                 FK -> teams
  criterion_id            FK -> rubric_criteria
  value                   int (1-10)
  created_at

score_comments           -- one per (judge, team) — separate from per-criterion scores
  id
  judge_id                FK -> profiles
  team_id                 FK -> teams
  comments                text
  created_at

score_exclusions          -- audit trail for admin overrides
  id
  score_id / (team_id + judge_id)
  excluded_by              FK -> profiles (admin)
  reason                   text
  excluded_at

deliberation_notes
  id
  team_id                 FK -> teams
  admin_id                FK -> profiles
  note                    text
  created_at

team_review_status        -- Prep Mode "reviewed" checkbox
  id
  judge_id                FK -> profiles
  team_id                 FK -> teams
  reviewed_at
```

**Standardized scores, rankings, percentiles, disagreement/close-call flags are NOT stored** — compute via a SQL view (or materialized view refreshed periodically) reading from `scores`. Keeps source data pure and dashboard always current with no manual recompute step. `scores` stored in long format (one row per criterion) specifically so rubric criteria can change without a schema migration, and to support criterion-level breakdown/variance reporting.

---

## 9. Confirmed RLS Policy Direction

- Judges: can only read teams/tracks they're assigned to via `judge_track_assignments`. Can INSERT their own scores/comments/review-status. **Cannot** read other judges' `scores` or `score_comments` rows, for any team, at any time (fully blind — not revealed post-submission).
- Admin: full read/write on all tables, including exclusions and deliberation notes.
- Enforce at the Postgres RLS level, not just via frontend route-guarding, so direct API access can't bypass the UI.

---

## 10. Build Order (confirmed)

1. **Schema + RLS policies** — all tables above, migrations, policy definitions
2. **Admin panel** — teams CRUD, judges CRUD, track config, CSV bulk import (with validation preview) for both teams and judges
3. **Judge portal** — Prep Mode (team list, profile view, rubric reference tab, reviewed marker), scoped by track assignment
4. **Scoring** — scoring form (7-criterion sliders + comments), tied to `scores` + `score_comments`
5. **Deliberation dashboard** — Track View + Cohort View, standardized score computation (views), disagreement/close-call flags, feedback view, deliberation notes, score exclusion with audit trail

Each layer should have real seed/test data before moving to the next, so later layers aren't built against an empty database.

---

## 11. Explicitly Out of Scope for v1 (do not build unless re-requested)

- Public team self-registration
- Embedded deck viewer (external link only)
- Judges seeing each other's scores/comments
- Radar charts, what-if recompute, judge calibration report, criterion difficulty report (all v2)
- Real-time leaderboard push to a public-facing screen (not discussed/confirmed yet — ask before building)

---

## 12. Open Items Still Needing Setup (not decisions, just setup steps)

- Create Supabase project (client doesn't have one yet)
- Create Vercel project (client doesn't have one yet)
- Populate `.env.local` with Supabase URL + anon/service keys
- Set up Supabase CLI + migrations workflow for schema changes going forward
