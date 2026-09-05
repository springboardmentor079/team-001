# BuildTrack — Navigation Structure

## Public Routes (no authentication required)

| Route | Screen |
|---|---|
| `/auth/login` | Login |
| `/auth/register` | Registration |
| `/auth/forgot-password` | Forgot Password |
| `/auth/reset-password` | Reset Password |

## Authenticated Shell

All routes below render inside the shared `DashboardLayoutComponent` (sticky top navbar +
responsive, role-based sidebar) and require a valid session (`authGuard`).

| Route | Screen | Guarded to role(s) |
|---|---|---|
| `/dashboard/admin` | Administrator Dashboard | ADMIN |
| `/dashboard/project-manager` | Project Manager Dashboard | PROJECT_MANAGER |
| `/dashboard/site-engineer` | Site Engineer Dashboard | SITE_ENGINEER |
| `/dashboard/contractor` | Contractor Dashboard | CONTRACTOR |
| `/dashboard/worker` | Worker Dashboard | WORKER |
| `/dashboard/client` | Client Dashboard | CLIENT |
| `/profile` | My Profile | any authenticated role |
| `/projects` | Projects (read-only, role-scoped) | any authenticated role |
| `/admin/users` | User Management | ADMIN |
| `/coming-soon/milestones` | "Coming soon" placeholder | any authenticated role |
| `/coming-soon/resources` | "Coming soon" placeholder | any authenticated role |
| `/coming-soon/workforce` | "Coming soon" placeholder | any authenticated role |
| `/coming-soon/site-progress` | "Coming soon" placeholder | any authenticated role |
| `/coming-soon/reports` | "Coming soon" placeholder | any authenticated role |
| `/coming-soon/attendance` | "Coming soon" placeholder | any authenticated role |
| `/unauthorized` | 403 Access Denied | — |

## Sidebar Navigation by Role

**Administrator**
Dashboard · Users · Projects · Reports · Profile

**Project Manager**
Dashboard · Projects · Milestones · Resources · Workforce · Profile

**Site Engineer**
Dashboard · Site Progress · Projects · Profile

**Contractor**
Dashboard · Projects · Workforce · Profile

**Worker**
Dashboard · Attendance · Profile

**Client**
Dashboard · Projects · Reports · Profile

> Sidebar items that belong to a future milestone (Milestones, Resources, Workforce, Site
> Progress, Reports, Attendance) route to the shared "Module coming in next milestone" page
> instead of fake functionality. "Projects" and, for Administrators, "Users" are real,
> API-backed screens already implemented in Milestone 1.

## Post-Login Redirection

| Role | Redirected to |
|---|---|
| ADMIN | `/dashboard/admin` |
| PROJECT_MANAGER | `/dashboard/project-manager` |
| SITE_ENGINEER | `/dashboard/site-engineer` |
| CONTRACTOR | `/dashboard/contractor` |
| WORKER | `/dashboard/worker` |
| CLIENT | `/dashboard/client` |
