# BuildTrack — Database Schema

Milestone 1 creates the complete initial schema for the platform (10 tables). Only `users`
and `projects` (read-only) are exercised by Milestone 1 endpoints; the remaining tables are
in place so later milestones can build directly on top of them without further migrations.

## Entity-Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ PROJECTS : "manages (project_manager_id)"
    USERS ||--o{ PROJECTS : "owns as client (client_id)"
    USERS ||--o| WORKERS : "has worker profile"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ REPORTS : "generates"

    PROJECTS ||--o{ PROJECT_MILESTONES : "has"
    PROJECTS ||--o{ RESOURCES : "has assigned"
    PROJECTS ||--o{ WORKERS : "has assigned"
    PROJECTS ||--o{ ATTENDANCE : "logs"
    PROJECTS ||--o{ PROCUREMENTS : "requests"
    PROJECTS ||--o{ REPORTS : "generates"

    WORKERS ||--o{ ATTENDANCE : "records"

    USERS {
        int id PK
        string full_name
        string email UK
        string hashed_password
        enum role
        string phone_number
        string profile_image
        bool is_active
        bool is_verified
        datetime created_at
        datetime updated_at
    }

    PROJECTS {
        int id PK
        string project_name
        string project_code UK
        text description
        enum category
        string location
        date start_date
        date expected_end_date
        date actual_end_date
        numeric budget
        enum status
        int project_manager_id FK
        int client_id FK
        datetime created_at
        datetime updated_at
    }

    PROJECT_MILESTONES {
        int id PK
        int project_id FK
        string title
        text description
        date planned_start_date
        date planned_end_date
        date actual_completion_date
        int progress_percentage
        enum status
        datetime created_at
        datetime updated_at
    }

    RESOURCES {
        int id PK
        string name
        enum category
        int quantity
        enum availability_status
        numeric utilization_percentage
        int assigned_project_id FK
        date maintenance_date
        datetime created_at
        datetime updated_at
    }

    INVENTORY {
        int id PK
        string material_name
        enum category
        numeric quantity_available
        numeric minimum_stock_level
        string unit
        string location
        datetime last_updated
        datetime created_at
        datetime updated_at
    }

    WORKERS {
        int id PK
        int user_id FK
        enum worker_category
        string skill
        int assigned_project_id FK
        date joining_date
        enum status
        datetime created_at
        datetime updated_at
    }

    ATTENDANCE {
        int id PK
        int worker_id FK
        int project_id FK
        date attendance_date
        datetime check_in
        datetime check_out
        enum status
        datetime created_at
        datetime updated_at
    }

    PROCUREMENTS {
        int id PK
        int project_id FK
        string item_name
        enum category
        string vendor_name
        int quantity
        numeric estimated_cost
        numeric actual_cost
        enum status
        date request_date
        date expected_delivery_date
        datetime created_at
        datetime updated_at
    }

    NOTIFICATIONS {
        int id PK
        int user_id FK
        string title
        text message
        enum notification_type
        bool is_read
        datetime created_at
    }

    REPORTS {
        int id PK
        int project_id FK
        enum report_type
        string title
        int generated_by FK
        string file_path
        datetime generated_at
    }
```

## Tables

### users
Primary key: `id`. Unique: `email`. Indexed: `id`, `email`, `role`.
Every authenticated principal — regardless of role — is a row in this table.

### projects
Primary key: `id`. Unique: `project_code`. Foreign keys: `project_manager_id → users.id`
(`ON DELETE SET NULL`), `client_id → users.id` (`ON DELETE SET NULL`).

### project_milestones
Primary key: `id`. Foreign key: `project_id → projects.id` (`ON DELETE CASCADE`).

### resources
Primary key: `id`. Foreign key: `assigned_project_id → projects.id` (`ON DELETE SET NULL`).

### inventory
Primary key: `id`. Standalone stock table (no foreign keys in Milestone 1).

### workers
Primary key: `id`. Foreign keys: `user_id → users.id` (unique, `ON DELETE CASCADE` — one
worker profile per user), `assigned_project_id → projects.id` (`ON DELETE SET NULL`).

### attendance
Primary key: `id`. Foreign keys: `worker_id → workers.id` (`ON DELETE CASCADE`),
`project_id → projects.id` (`ON DELETE CASCADE`).

### procurements
Primary key: `id`. Foreign key: `project_id → projects.id` (`ON DELETE CASCADE`).

### notifications
Primary key: `id`. Foreign key: `user_id → users.id` (`ON DELETE CASCADE`).

### reports
Primary key: `id`. Foreign keys: `project_id → projects.id` (`ON DELETE CASCADE`),
`generated_by → users.id` (`ON DELETE SET NULL`).

## Enumerations

| Enum | Values |
|---|---|
| `UserRole` | `ADMIN`, `PROJECT_MANAGER`, `SITE_ENGINEER`, `CONTRACTOR`, `WORKER`, `CLIENT` |
| `ProjectCategory` | `RESIDENTIAL`, `COMMERCIAL`, `INDUSTRIAL`, `INFRASTRUCTURE`, `GOVERNMENT` |
| `ProjectStatus` | `PLANNED`, `IN_PROGRESS`, `ON_HOLD`, `COMPLETED`, `CANCELLED` |
| `MilestoneStatus` | `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `DELAYED` |
| `ResourceCategory` | `EXCAVATORS`, `CONCRETE_MIXERS`, `CRANES`, `DUMP_TRUCKS`, `GENERATORS`, `SAFETY_EQUIPMENT` |
| `AvailabilityStatus` | `AVAILABLE`, `IN_USE`, `UNDER_MAINTENANCE`, `OUT_OF_SERVICE` |
| `MaterialCategory` | `CEMENT`, `STEEL`, `BRICKS`, `SAND`, `CONCRETE`, `ELECTRICAL_MATERIALS`, `PLUMBING_MATERIALS` |
| `WorkerCategory` | `ENGINEERS`, `SUPERVISORS`, `CONTRACTORS`, `SKILLED_WORKERS`, `UNSKILLED_WORKERS`, `CONSULTANTS` |
| `WorkerStatus` | `ACTIVE`, `ON_LEAVE`, `RELEASED` |
| `AttendanceStatus` | `PRESENT`, `ABSENT`, `HALF_DAY`, `ON_LEAVE` |
| `ProcurementCategory` | `RAW_MATERIALS`, `EQUIPMENT`, `MACHINERY`, `SAFETY_EQUIPMENT`, `OFFICE_SUPPLIES` |
| `ProcurementStatus` | `REQUESTED`, `APPROVED`, `ORDERED`, `DELIVERED`, `REJECTED` |
| `NotificationType` | `INFO`, `WARNING`, `ALERT`, `SUCCESS` |
| `ReportType` | `PROGRESS`, `FINANCIAL`, `RESOURCE`, `SAFETY`, `CUSTOM` |

## Migrations

The full schema is created by a single Alembic migration:
`backend/alembic/versions/0001_initial_schema.py`. Run it with:

```bash
alembic upgrade head
```
