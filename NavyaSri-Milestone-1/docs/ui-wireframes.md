# BuildTrack — UI Structure & Wireframes

This document describes the structure of each Milestone 1 screen in text-wireframe form, plus
the shared layout and design language used across the app.

## Design Language

- **Palette** — deep blue primary (`#1a3a5c`), dark-gray/white neutrals, a subtle orange
  accent (`#e8792f`) used sparingly for emphasis (badges, highlighted metrics).
- **Typography** — Roboto, Angular Material's default type scale.
- **Components** — Angular Material (form fields, buttons, tables, cards, chips, toolbar,
  sidenav) + Bootstrap grid utilities for auxiliary layout.
- **Responsiveness** — a `BreakpointObserver` switches the sidenav between a permanently
  open "side" mode (desktop/tablet) and an overlay "over" mode (mobile/handset).

## Shared Authenticated Shell

```
┌───────────────────────────────────────────────────────────────┐
│ ☰   🏗 BuildTrack                          🔔    [Avatar] Name ▾│  ← Navbar (sticky)
├───────────┬───────────────────────────────────────────────────┤
│ MAIN MENU │                                                     │
│ ▸Dashboard│                 Routed page content                 │
│ ▸Projects │                 (dashboard / profile / etc.)        │
│ ▸...      │                                                     │
│ ▸Profile  │                                                     │
│           │                                                     │
│ BuildTrack│                                                     │
│ v1.0      │                                                     │
└───────────┴───────────────────────────────────────────────────┘
```
On mobile, the sidebar collapses behind the ☰ button and opens as an overlay.

## Login Screen (`/auth/login`)

```
┌──────────────────────────────┐
│         🏗 BuildTrack          │
│  Construction Project Mgmt.   │
│                                │
│      Welcome back             │
│  Sign in to access dashboard  │
│                                │
│  [ Email                    ] │
│  [ Password            👁    ] │
│  [x] Remember me   Forgot pw? │
│                                │
│  [        Sign In           ] │
│                                │
│  Don't have an account?       │
│  Register here                │
└──────────────────────────────┘
```
Centered card on a full-bleed deep-blue gradient background. Inline field validation,
API error banner, and a loading spinner inside the submit button while the request is in flight.

## Registration Screen (`/auth/register`)

Same card style as Login, with: Full Name, Email, Phone Number, Role (dropdown of all 6
roles), Password, Confirm Password, and a Register button. Cross-field validation flags
mismatched passwords; a strength check requires upper+lower+digit.

## Forgot Password Screen (`/auth/forgot-password`)

Email field → "Send Reset Link". On success, shows a confirmation message and — since
Milestone 1 has no SMTP integration — the development reset token with a direct
"Continue to Reset Password" button (pre-fills the token).

## Reset Password Screen (`/auth/reset-password`)

Reset Token (pre-filled from the query string if arriving via the dev-mode link), New
Password, Confirm New Password, "Reset Password" button.

## Dashboards

Each role dashboard follows the same anatomy: a page title, a short description, a grid
of stat cards (icon + big number + label), and a role-specific secondary panel.

```
┌─────────────────────────────────────────────────────────┐
│ Administrator Dashboard                                   │
│ System-wide overview of users and projects.                │
│                                                             │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   │
│ │ 👥 Total   │ │ ✅ Active  │ │ 🏢 Total   │ │ 🚧 Active  │   │
│ │   Users    │ │   Users    │ │  Projects  │ │  Projects  │   │
│ │    24      │ │    22      │ │     5      │ │     3      │   │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘   │
│                                                             │
│ Recent Users                                                │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Name        Email             Role      Status  Joined│   │
│ │ ...                                                    │   │
│ └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

- **Administrator** — Total Users, Active Users, Total Projects, Active Projects + recent
  users table.
- **Project Manager** — Assigned Projects, Active Projects, Upcoming Milestones, Overall
  Progress + a progress bar.
- **Site Engineer** — Assigned Projects, Pending Site Activities, Pending Tasks, Progress
  Overview.
- **Contractor** — Assigned Work, Project Progress, Upcoming Deadlines.
- **Worker** — Assigned Project, Today's Status, Upcoming Work (tile layout).
- **Client** — My Projects, Average Progress + a chip list of project statuses.

## Profile Screen (`/profile`)

Two-column layout: a summary card (avatar initials, name, role chip, email, phone, join
date, verification status) beside an editable form (Full Name, Phone Number, Profile Image
URL; Email and Role are shown disabled with an explanatory hint).

## User Management Screen (`/admin/users`, Administrator only)

Search box + role filter above a data table (Name, Email, Role, Phone, Active toggle,
Joined, Verified badge). Toggling "Active" calls the activate/deactivate endpoint inline.

## Projects Screen (`/projects`)

A responsive card grid — one card per project (name, status chip, code, category, location,
budget, date range) — scoped server-side to what the signed-in role may see.

## "Coming Soon" Placeholder

Used for Milestones, Resources, Workforce, Site Progress, Reports (non-admin/client), and
Attendance until those modules are built in a later milestone: a centered icon, the module
name, an explanatory sentence, and a "Coming in the next milestone" badge — never fake data.
