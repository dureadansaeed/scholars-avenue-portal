# Frontend Progress

Frontend-only build of the Scholars Avenue platform from [requirementPRD.md](requirementPRD.md). All data is **mock data** held in the repo; no backend, auth provider or database exists yet. Visual language: [saym-design](.claude/skills/saym-design/skill.md) on top of the tokens already in [globals.css](src/app/globals.css).

**Legend:** `[ ]` todo · `[~]` in progress · `[x]` done

---

## 0. Ground rules

### Decision: no in-app messaging
Student and counselor communication is handled separately on WhatsApp, so the portals carry **no message threads or internal-notes inbox**. This defers PRD MSG-001 to MSG-010 (MSG-001 to 006 are P0 in the PRD). Internal case notes (the `internalNote` on a case, shown to staff only) stay. Questions about a programme are directed to WhatsApp in the UI. Revisit if the WhatsApp integration (MSG-011) changes the plan; the `Message` type and `visibility` split are still in `src/types`.

### Design (minimal Apple)
- Light only, white canvas, near-black primary pill buttons, system blue for selection/links/focus only.
- Panels are `border border-line` hairlines, not shadows. Glass only on chrome (sidebar, sticky header, sheets).
- Status = tinted chip + dot, never colour alone. All figures `tabular-nums`. Dates always show the year.
- Build every screen from the shared kit (`src/components/ui`). If a pattern is missing, add it to the kit first.
- No inline hex, no `dark:` variants, no hand-written `-webkit-backdrop-filter`.

### Next.js 16 notes (see [AGENTS.md](AGENTS.md))
- Read the matching guide in `node_modules/next/dist/docs/01-app/` before using any API. `middleware` is now `proxy` (`16-proxy.md`); `LayoutProps<"/">` typed helpers are in use; `params`/`searchParams` are async.
- Server Components by default. `"use client"` only for interactive leaves (sidebar, sheets, filters, forms, tabs).

### Gaps in the current `globals.css` to fix in Phase 0
- References `#root` and `src/lib/motion.js` (Vite leftovers). Replace `#root` with `body > :first-child` / drop it, and add the motion module.
- `--font-sans` is Century Gothic; [layout.tsx](src/app/layout.tsx) loads Geist. Decide one: keep Century Gothic first, Geist as fallback, or switch to Geist and update the token. Geist Mono stays for mono.
- `motion` package is not installed (`npm i motion`).

### Conventions
- Types in `src/types`, mocks in `src/mocks`, one data-access module per entity in `src/lib/data` that **returns promises** (`async getStudents()`), so swapping mock for real server calls later does not touch pages.
- Mock records carry the PRD's distinctions from day one: `verificationStatus`, `sourceUrl`, `lastVerifiedAt`, `visibility: "internal" | "student"`, explicit `unknown` values (never `0`/`false` for missing). All mock universities/fees/deadlines are labelled **SAMPLE DATA** in the UI (PRD §17, §18).
- Permissions are simulated by role-scoped selectors (`getStudentsForCounselor(id)`), mirroring what the server will enforce later.

---

## Phase 0: Foundation (shared by all three panels)

### 0.1 Tooling and tokens
- [x] Install `motion`; confirm Tailwind v4 pipeline works with the existing `@theme` block (motion 14, vitest 3 added)
- [x] Clean `globals.css` Vite leftovers; settle font decision (Geist + Geist Mono via `next/font`, wired into `--font-sans` / `--font-mono`)
- [x] `src/lib/motion.ts` (springs, `springFor`, reduced-motion helper)
- [x] `src/lib/usePress.ts`
- [x] Remove default Next landing content from `src/app/page.tsx` (now the role picker)

### 0.2 UI kit (`src/components/ui`)
- [x] `Button`, `Input`, `Select`, `Textarea`, `Field`, `Checkbox`, `Switch`
- [x] `Section`, `Disclosure`, `Metric`, `Empty`, `Note`
- [x] `Status` chip, `Tag`, `HueChip` (+ `SampleTag`, and one chip per status vocabulary)
- [x] `Table` (sticky thin-glass header, bounded rows, pagination footer) (pagination footer still to add when a list needs it)
- [x] `Meter`, `ScoreRing`, `StageBar`
- [x] `Segmented`, `Sheet`, `SidePanel`, `SelectionBar`, `GlassPanel`
- [x] `Icon` set (single weight, stroke 1.6)
- [x] `PageHead` with large-title collapse
- [~] Domain components: done `Timeline`, `TaskRow`, `CriterionList`, `Avatar`, `VerificationBadge`, `CriterionChip`, `MatchChip`; document rows live in the documents page. `NotificationList` lives in the notifications page; `MessageThread` is dropped (WhatsApp)

### 0.3 App shell
- [x] Glass collapsible sidebar (224/68px, Ctrl/Cmd+B, persisted), mobile drawer, unread badges via a small client store (`badge-store.ts`)
- [x] Role layouts: plain segments `src/app/student`, `counselor`, `admin` (no route groups needed), each with its own nav; unbuilt pages show as disabled "Soon" items
- [x] Route transition, `loading.tsx`, `error.tsx`, `not-found.tsx` per portal (shared components; one root `not-found`)
- [x] Root `/` demo role picker; inside the student portal a sidebar "Demo: viewing as" switcher sets a cookie (`src/lib/session.ts`, server action in `src/app/actions.ts`). Counselor/admin identity switching comes with their panels
- [x] `/login` screen (UI only, accepts any mock credential)

### 0.4 Mock data layer (`src/mocks`, `src/types`, `src/lib/data`)
Seed once, share across all portals so a counselor action is visible to the student and admin.

| Mock file | Contents (SAMPLE DATA) |
|---|---|
| `users.ts` | 1 org; 3 admins (one with limited permissions), 6 counselors (one inactive/absent), 24 students across every case status |
| `students.ts` | profile, contact, preferences, completion %, per-section verification state |
| `academics.ts` | multiple records per student; CGPA + **separate** max scale (4.0, 5.0, 10, percentage), backlogs/gaps |
| `tests.ts` | IELTS/TOEFL/PTE/Duolingo with component scores, expiry; GRE/GMAT/TestAS; German CEFR |
| `cases.ts` | package, countries, degree levels, intake, status, assigned counselor, payment-activation flag |
| `packages.ts` | 3 sample packages with scope limits |
| `assignments.ts` | assignment + reassignment history with reasons |
| `countries.ts` | all 12 countries: ISO, currency, intake labels, grading notes, language rules, routes, per-country progress of catalog population |
| `cities.ts`, `universities.ts`, `programs.ts` | ~40 programs covering all 12 countries; multiple intakes, deadline types (fixed / rolling / **not published**), routes (Uni-Assist, direct, centralized, email), fees with currency code, mix of verified / pending / outdated / draft / archived, some with **unknown** requirements on purpose |
| `shortlists.ts` | entries across every shortlist status, internal vs student-visible notes, status history |
| `applications.ts` | applications across the 22 default statuses, route + portal reference, fee, evidence, requirement snapshot, status history |
| `documents.ts` | all categories, all 9 document statuses, versions, rejection reasons, expiry |
| `tasks.ts` | internal and student-action tasks, overdue (derived from date), deadline categories, date-only vs timezone-aware |
| `notifications.ts` | per-role feeds, read state |
| `audit.ts` | immutable-style entries with actor, action, before/after |
| `imports.ts` | sample import batches with preview rows: valid / error / duplicate / conflict (added with C5) |

- [x] Types for all entities (`src/types/index.ts`; status enums from PRD §8, application statuses from §7.9.1)
- [~] Mock files seeded: users (2 admins, 4 counselors, 6 students), 12 countries, 13 cities, 13 universities, 14 programs (all 12 countries, mixed verification, unknown deadlines/requirements on purpose), students/academics/tests/preferences, cases/packages/assignments/shortlist/applications, documents (all 9 statuses covered), tasks, notifications, timeline, audit (no messages: see the WhatsApp decision). `imports.ts` added with C5; 24 generated students in `world.ts`
- [~] Async data-access with role-scoped selectors: student-scoped module done (`src/lib/data/student.ts`; internal notes, internal tasks and unshared shortlist entries are filtered out). Counselor and admin modules come with their panels
- [x] Pure helpers: `daysUntil`, `isPast`, date formatters on a fixed demo clock (`src/lib/clock.ts`, `DEMO_NOW = 2026-11-02`, needed because Cache Components rejects a bare `new Date()`), `sectionCompletion` / `overallCompletion` (`src/lib/completion.ts`)

### 0.5 Eligibility engine (pure TypeScript, mock-fed, no UI dependency)
Needed by the counselor and student panels, so it lands before them. Rules per PRD §7.7.1.
- [x] `matchProgram(student, program, intake)` returns per-criterion state + explanation
- [x] Never compares grades across different scales without an explicit conversion rule
- [x] Missing/unverified data returns `unknown`, never a positive or auto-reject
- [x] Component-level language score comparison; test validity at the deadline
- [x] Overall result is derived from the criteria and never collapses a hard failure into a percentage
- [x] Unit tests (fixtures for each grade-scale and language-state edge case) (`npm test`: 12 passing in `src/lib/eligibility.test.ts`)

**Phase 0 status:** shells, kit, student-side mocks, engine and tests are in. Open: the `/dev/kit` gallery page (not built), the `imports.ts` mock, and the admin data module. The counselor module is `src/lib/data/counselor.ts`; `src/mocks/world.ts` adds 24 generated students (30 in total) on top of the six hand-written ones.

---

## Panel A: Student Portal (`/student`)

Scope: PRD §4.1, §6.1–6.6 (student side), STU/DOC/TSK/MSG/NOT. Sees only its own mock student; internal notes and unshared shortlist entries are filtered out by the selector.

### A1. Home and onboarding
- [x] `/student` dashboard: greeting, case status chip, profile completion ring, "needs your action" list (requests, tasks, corrections), next deadline, assigned counselor card
- [x] First-run onboarding checklist (profile sections + required documents), shown as "Profile progress" on the dashboard with links into each section
- [x] Empty states for a brand-new account (invited / profile incomplete) (try "Tariq Ahmed" in the demo switcher: no counselor, no tasks, activation notice)

### A2. Profile
- [x] `/student/profile` sectioned form with per-section completion and save-and-continue-later (edits persist in this browser's `localStorage`; the server-rendered dashboard reads the mock copy, so its completion ring does not reflect those local edits until a backend exists)
- [x] Personal and contact (passport number masked until "Show to edit"; emergency contact optional)
- [x] Academic records: add/edit multiple; grade and max scale as separate fields; backlogs/gaps/thesis
- [x] Language tests: add/edit multiple; component scores; expiry warning
- [x] Other tests (GRE/GMAT/TestAS/CEFR)
- [x] Study preferences: countries (from the 12), degree, subject, intake, mode, cities, tuition range, scholarship interest
- [x] Field-level verification badges (verified / unverified / correction requested) with the counselor's reason
- [x] Editing a verified field shows "will need re-verification" and keeps previous value in a history popover
- [x] Inline validation with readable errors; required vs optional distinguishable

### A3. Documents
- [x] `/student/documents` checklist grouped by what needs doing (action / with counselor / verified / not needed), each row with category label and status chip
- [x] Upload sheet (type/size validation messages, drag and drop, mocked progress)
- [x] Replace file (shows version history), view/download (mock), rejection reason + "replacement required" call to action
- [x] Expiry indicators

### A4. Shortlist and programs
- [x] `/student/programs` only entries with status "shared" or later; counselor's student-visible note shown, internal never (selection reason and counselor notes are stripped in the data layer, not just hidden)
- [x] Program detail sheet: requirements, deadlines (unknown shown as "not published", never "open"), fees, source link, last-verified, SAMPLE DATA tag (side panel)
- [x] Approve / decline a programme with an optional reason (persists in this browser). "Ask a question" was removed: questions go to the counselor on WhatsApp

### A5. Applications
- [x] `/student/applications` list with student-friendly status labels (separate from internal labels) (`src/lib/student-labels.ts`)
- [x] `/student/applications/[id]`: status, route, portal reference, key dates, application checklist, student-visible timeline (checklist separates "You" from "Handled by your counselor"; another student's id returns the not-found page with no data)
- [x] Confirm-before-submit acknowledgement step (UI for PRD open decision 18, behind a mock flag) (`src/lib/flags.ts`)

### A6. Tasks, notifications, timeline
- [x] `/student/tasks`: open/completed, due dates, mark complete with optional note
- [-] ~~`/student/messages`~~ removed by decision (WhatsApp). Built earlier and deleted again
- [x] `/student/notifications` with mark-all-read and deep links to the student's own records. Sidebar unread badges are done: Notifications, Tasks and Documents show a count (a tiny blue dot when the sidebar is collapsed), subtracting what this browser has already read or finished
- [x] `/student/timeline`: consolidated student-visible events (case events + application status changes + document reviews; internal events excluded)

### A7. Polish
- [~] Built in: mobile drawer nav, stacked grids, skip-to-content link, dialog focus trap + Esc + focus restore, reduced-motion handling in `springFor`, reduced-transparency / high-contrast rules from `globals.css`. **Not verified in a browser** (see below)
- [x] Skeletons (`loading.tsx`) and error states (`error.tsx`, no error details shown) for each portal

---

> **Counselor panel status:** B1 to B8 built. All seven student tabs are live (Overview, Profile, Documents, Shortlist, Applications, Tasks, Timeline). **Limitation:** counselor review decisions, document requests, shortlist changes, decisions and applications are saved in the counselor's browser (`localStorage`) and are not read by the student pages, so a verification or request made here does not yet show up for the student. They should be wired through the same data layer once there is a backend.

> **Student panel status:** A1 to A6 built (minus messaging, by decision); A7 partly. Left over: the browser-based checks listed under Verification.

---

## Panel B: Counselor Portal (`/counselor`)

Scope: PRD §4.2, §6.2–6.6, STU-008/013, MAT, SHL, APP, TSK. Messaging is excluded (WhatsApp). Sees only mock students assigned to the signed-in mock counselor (plus one explicitly shared case to demonstrate shared access).

### B1. Dashboard
- [x] `/counselor` metrics: assigned students, active applications, pending reviews, overdue tasks
- [x] "Today" list: overdue and due-soon tasks, approaching application deadlines, new student uploads (replies dropped with messaging)
- [x] Own-workload summary (meter against the admin-set limit) and a help / reassignment request sheet (stored in this browser for now)
- [x] Demo switcher: sign in as Sana Malik, Daniel Weber or Priya Nair (away). A "Students needing attention" list is included

### B2. My students
- [x] `/counselor/students` table: search, filters (status, country, package, completion, needs attention), pagination of 10
- [x] Row badges: awaiting review, correction open, unverified, test expired/expiring, overdue tasks, missing count; sidebar badge shows items waiting for review
- [~] `/counselor/students/[id]` tabbed workspace. Built: Overview, Profile, Documents. Shown disabled as "Soon": Shortlist, Applications, Tasks, Timeline. Access is by assigned or explicitly shared case; anything else is the not-found page (Sana can open Hina Raza as a shared case, not Omar Siddiqui)

### B3. Profile and document review
- [x] Profile tab with per-item verify / request correction (reason required) / undo; shows who reviewed and when. Passport, date of birth and emergency contact are masked until shown, and each reveal is logged
- [x] Gaps panel: missing, incomplete, expired, expiring (90 days), open corrections, unverified
- [x] Documents tab: review queue plus allowed status transitions only; reason required for reject and replacement
- [x] Structured document request sheet (type, due date, note). It creates the request in the counselor's view; the student side does not see it yet (see limitation below)
- [x] Version history per document (preview is a demo stub: no files are stored)

### B4. Program bank and matching
- [x] `/counselor/programs` search + filters: free text (programme, university, subject, city), country, degree, subject, intake, language, city, route, deadline (open / within 30 days / passed / not published), record status, public/private, scholarship, max tuition, include archived. One row per programme **and intake**. A fee that is unknown is kept when a budget is set (`src/lib/program-search.ts`, tested)
- [x] Student-context mode: pick a student (or arrive with `?student=`), each row gets a match chip; sort by best match, deadline or country
- [x] Program detail (SidePanel): requirements, every intake with deadline / route / fee / tuition, sources and last-verified, and plain warnings for unverified, stale (180 days), outdated and not-recorded data
- [x] Match breakdown: every criterion with state and reason; "Meets all checked criteria" / "Possible match, needs review" / "Known mismatch", never "eligible"
- [x] Counselor decision (accept as potential match / not suitable) with required reason, stored and shown apart from the system result
- [x] Grade-scale helper shown only when scales differ: straight proportion with the formula, labelled not official and not used in the match. **Source:** none yet. A real helper needs a configured, source-backed conversion rule per country (Admin C4)
- [x] Compare view (2 to 4 intakes, from the bank or the shortlist): facts side by side, unknowns highlighted, per-criterion match when a student is chosen

### B5. Shortlisting
- [x] Add to shortlist sheet (reason required, staff eligibility notes pre-filled from the match concerns, note for the student). Starts as an internal proposal
- [x] Duplicate guard (same student, programme and intake) with a required justification to add anyway
- [x] Status pipeline with only valid moves (`SHORTLIST_NEXT`, tested). Reason required to remove, mark unsuitable, or record a student decline; a proposal cannot be marked as the student's decision before it is shared
- [x] Record the student's feedback and decision (from WhatsApp or in person); history of every move with reasons; staff-only and student-visible notes shown separately

### B6. Applications
- [x] `/counselor/applications` list (grouped filters, search) and a read-only board by status group; warns when active applications have no next action
- [x] Create application from a shortlist entry: one per programme and intake, route and portal recorded, checklist generated from the programme's requirements, **requirement snapshot captured**, package limit warning with an explicit exception
- [x] `/counselor/applications/[id]`: route, portal URL, reference, fee and paid state, key dates, evidence (file name or reason; files are not stored in the demo)
- [x] Status change sheet: only valid next statuses, separate student-facing label, reasons required for terminal outcomes, blocks Submitted without evidence or a stated reason, and without the student's confirmation unless an override reason is recorded (`src/lib/application-rules.ts`, tested)
- [x] Checklist (student items and your items), next action with due date and a warning when missing, staff notes
- [x] Outcomes through the status sheet: offer, conditional offer (conditions required), waitlist, rejected, withdrawn, closed, offer accepted or declined; resubmission after an information request
- [x] Full status history with actor date and reason. Student's tab lists their applications and package usage

### B7. Tasks and notifications
- [x] `/counselor/tasks` and each student's Tasks tab: your tasks and student actions, category chips, overdue derived from the due date, create (date-only or with a UTC time), change status, completion note
- [x] `/counselor/notifications`: assignments, uploads waiting for review, deadlines within 14 days, overdue tasks; mark read; unread count in the sidebar
- [x] `/counselor/agenda`: dates from tasks, application deadlines, test expiries and document requests, grouped Overdue / This week / Next 30 days / Later (a list, no calendar integration). Plus each student's **Timeline** tab, which marks every event as "student can see" or "staff only"

### B8. Polish
- [x] Verified in a real browser (headless Chromium via Playwright, kept outside the repo): all routes crawled for console errors, 26 interaction flows, mobile-width overflow, and an axe WCAG 2.1 A/AA audit of 26 routes. See Verification.
- [x] Fixes that came out of it: filter dropdowns were full width (`w-full` beat `w-auto`); shortlist cards were cramped; the student home scrolled sideways on a phone (grids now start from one `minmax(0,1fr)` column); a React error in the upload sheet; Next.js "instant navigation" errors on every dynamic page (params are now awaited inside Suspense); link blue on pastel cards was under 4.5:1 (new `--color-link`, `#0066cc`); `<dl>` markup in Metric; inline links needed an underline; the count badge contrast.
- [x] Reduced motion, `prefers-contrast: more` and forced colours were exercised in the browser with C7 (see Admin C7). Still open across the app: a screen-reader pass and a real-device test

---

> **Admin panel status:** C1 to C7 built. **Limitation:** admin changes (accounts, assignments, case status, catalog edits) live in this browser's `localStorage` like the counselor's, so they are not yet seen by the counselor or student portals, and the counselor's program bank still reads the original catalog. Admin settings are stored and audited but not yet applied to other screens. A backend makes all of this one shared record.

## Panel C: Admin Portal (`/admin`)

Scope: PRD §4.3, §6.3, AUTH/ASN/PRG/ADM/RPT/IMP/AUD. Includes a limited-permission mock admin to show permission-gated controls disabled with an explanation.

### C1. Overview
- [x] `/admin` metrics: total students, active cases, unassigned cases, active applications
- [x] Applications by status group, workload by counselor, deadlines in the next 30 days and missed-before-submission, overdue tasks, delayed applications (not submitted and past deadline or untouched 21 days)
- [x] Attention queue: unassigned students (reflects assignments made in this browser), programme data to review, counselors needing cover (away/inactive with cases, or over limit)

### C2. Users and access
- [x] `/admin/users` table (role, state, search, pagination), invite staff (counselor or admin with chosen permissions), create student (account + invited case); duplicate email refused (AUTH-011)
- [x] Deactivate / reactivate with a required reason; history kept and stated; you cannot deactivate yourself
- [x] `/admin/users/[id]`: account state, case summary for students, availability and workload limit for counselors, per-permission switches for admins (not on yourself), activity log
- [x] Permission-scoped demo: sidebar switcher between Imran Qureshi (all permissions) and Zara Hussain (limited: assignments and audit only). Controls she cannot use are disabled with the permission named, plus a read-only note

### C3. Students, cases and assignment
- [x] `/admin/students` org-wide table: Active / Unassigned / Closed / All, search, counselor (incl. unassigned), country, package, status, opened-from/to dates, pagination
- [x] Unassigned view and assign sheet: each counselor's load before and after, country match, away flag; going over the limit needs an explicit "assign anyway" (ASN-007)
- [x] Reassign with a required reason; full assignment history shown and never overwritten
- [x] Case actions: activate, pause, resume, close, reopen (reason required); mark package paid with an optional reference, which activates an invited case
- [x] `/admin/counselors`: availability, load meters, away toggle; away or inactive counselors list their cases with a Reassign link

### C4. Program catalog management
- [x] `/admin/catalog/countries`: 12 seeded, add/edit, enable/disable with a reason (history kept), panels for grading, language rules, process, documents, fees, routes, intake labels, source + checked date; live programme/verified counts
- [x] `/admin/catalog/cities`: add/edit, IANA time-zone check, duplicate guard, living information labelled as guidance with its source and date
- [x] `/admin/catalog/universities`: campuses, type (or not recorded), website and admissions URL, ranking only as publisher + year + position together, duplicate-name guard, archive instead of delete
- [x] Programmes: list (current / needs attention / archived) and `/admin/catalog/programs/[id]` editor (also `new`): identity, every requirement as Required / Not required / **Unknown**, accepted language tests with per-skill minimums, intakes with fixed / rolling / not-published deadlines, route, fees and tuition (empty = unknown), notes, source
- [x] "Which rules apply" panel: intake → programme → university → country guidance, most specific wins; country notes are never copied into the programme
- [x] Verification workflow (`src/lib/catalog-rules.ts`, tested): only allowed moves, no verify without an official source, reason for needs-update / outdated / archive, verify stamps date and reviewer, 180-day stale flag; editing a verified record sends it back to pending review
- [x] Change history per programme: editor, date, reason and a field-by-field before/after (reason required on every edit of an existing record)
- [x] Archive instead of delete; linked applications shown and kept; an intake with linked applications cannot be removed

### C5. Import / export
- [x] `/admin/import` wizard: upload (CSV, 2 MB / 2,000 rows) or the sample file → automatic column mapping you can change → every row checked → apply. Whole file is validated before anything is applied (`src/lib/program-import.ts`, tested)
- [x] Rows are valid / error / duplicate (in the file or already in the catalog) / conflict (clashes with the catalog, never overwritten). Problem report downloads as CSV. Imported records are pending review, tagged with their batch, requirements not in the file stay unknown
- [x] Import batch history: file, who, when, what happened to each row
- [x] Exports generated in the browser as CSV: programmes (import page), each report (reports page), the audit log. Exports need the export permission, say which filters they used, guard against spreadsheet formula injection, and are written to the audit log

### C6. Applications, reports, audit, settings
- [x] `/admin/applications` org-wide, read-only: filters for country, university, programme, intake, route, counselor, stage and exact status; detail panel with history; includes applications counselors created in this browser
- [x] `/admin/reports`: stage, outcomes, country, university, intake, counselor, profile completion, documents waiting, tasks and deadlines, catalog coverage. Date range and filters are shown; every report says how it is counted; pending and final are always separate (`src/lib/reports.ts`, tested)
- [x] `/admin/audit`: search, record type, who, date range; field-by-field before/after; no edit or delete controls; needs the audit permission; CSV export
- [x] `/admin/settings`: student-facing status labels, packages, document categories, degree levels, languages, routes, notification templates (unknown placeholders rejected), reminder days, default workload limit, catalog review interval. Each area validates and saves on its own and is audited. **Note:** other screens still read the built-in values in this demo

### C7. Polish
- [x] Checked in a real browser: no console errors on any route, axe WCAG 2.1 AA clean on all key routes across the three portals, no sideways scrolling at 390px, keyboard (skip link first, visible focus ring, dialogs trap focus and give it back on Esc), reduced motion (no press scaling), `prefers-contrast: more` (darker hairlines), Windows forced colours
- [x] Fixes from it: status chips, selected nav item and selected segment now keep an edge or underline in forced colours; segmented controls scroll inside themselves on narrow screens; load meters coloured by load instead of score
- [ ] Not done: a screen-reader pass (NVDA/VoiceOver) and a real-device test

---

## Suggested order

1. Phase 0 (all of it, including the kit gallery and engine tests)
2. Counselor B1–B6 first: it is the core workflow and exercises the most of the kit and mocks
3. Student A1–A6: consumes what the counselor creates
4. Admin C1–C6
5. B7/A-polish/C7 and cross-panel consistency pass (status labels mean the same thing everywhere)

## Out of scope for this frontend pass
Real auth, database, file storage, email/WhatsApp, payment, portal integrations, server-side authorization and automated tests of it (PRD §10, §11, §17). Mock role scoping is a stand-in only. Every screen must keep its data access behind `src/lib/data` so those can be added without rewriting pages.

## Verification so far
- **Automated:** 29 unit tests (engine, application rules, programme search, overlay and shortlist transitions), `tsc` and `eslint` clean, `next build` passes.
- **In a real browser** (headless Chromium, scripts in the session scratchpad, not in the repo), against `next dev`:
  - every route loads with no console errors or warnings (this is how the hydration and Next.js instant-navigation errors were found);
  - 26 end-to-end flows pass: student profile validation and save, focus staying in a field while typing in a sheet, document upload rules, programme decisions, task completion with live sidebar badges, application confirmation; counselor review and rejection with a required reason, document request, program bank match and compare, add to shortlist, duplicate guard, share, create application, the status rules (blocked without the student's confirmation, blocked as Submitted without evidence), applications list and board, task creation, agenda, notifications, timeline;
  - no page scrolls sideways at 390px wide on the four pages checked;
  - axe (WCAG 2.1 A and AA) over 26 routes: no violations after the fixes listed under B8.
- Access control, checked against the running server: a counselor cannot open another counselor's student, shortlist or application (not-found, no name); the shared case opens; student pages contain no staff-only text. **Caveat:** not-found pages return HTTP 200 because they stream; a real backend must return 404/403.
- Admin panel: 33 flows (C1 to C4) and 27 (C5 to C7) pass in the browser, including the limited administrator, import end to end, report filters and exports, audit and settings.
- **Not covered:** screen readers; browsers other than Chromium; real devices. `prefers-reduced-transparency` cannot be emulated by the browser tool, so only its CSS was reviewed.

## Changelog
- 2026-11-02: plan created.
- 2026-11-02: Phase 0 (except the items noted above) and student A1 to A3 built.
- 2026-11-02: Student A4 to A6 built, A7 partly. Shell now uses `template.tsx` for page transitions and a Suspense-wrapped active-nav (required by Cache Components for dynamic routes). Mock data: added a shared programme awaiting decision (`sl-5`), a second application awaiting student confirmation (`app-2`), application checklists.
- 2026-11-02: Removed in-app messaging (WhatsApp instead). Added sidebar badges. Counselor B1 to B3 built, with 24 generated students (`src/mocks/world.ts`).
- 2026-11-03: Counselor B4 to B6 built (program bank + matching, shortlisting, applications). Fixed a bug in the shared dialog hook that re-focused the first field on every keystroke when a sheet was given an inline close handler; sheets opened from a side panel now close one at a time. 29 tests passing.
- 2026-11-03: Counselor B7 and B8 built (tasks, agenda, notifications, per-student Tasks and Timeline). First real-browser pass: found and fixed the issues listed under B8.
- 2026-11-06: Admin C1 to C4 built (overview, users and access, students/cases/assignment and counselors, programme catalog with countries, cities, universities and a structured programme editor). Demo admin switcher with a limited administrator. 39 unit tests.
- 2026-11-06: Admin C5 to C7 built (import/export, org-wide applications, reports, audit log, settings) and the accessibility pass. 52 unit tests; 86 browser flows across the three portals.
