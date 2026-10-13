import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

def make_user(email: str, role: str) -> dict:
    client.post(
        "/api/auth/signup",
        json={"full_name": role.title(), "email": email, "password": "secret123", "role": role},
    )
    res = client.post("/api/auth/login", json={"email": email, "password": "secret123"})
    body = res.json()
    return {"Authorization": f"Bearer {body['access_token']}"}, body["user"]["id"]


PM_HEADERS = WORKER_HEADERS = ADMIN_HEADERS = CLIENT_HEADERS = None
PM_ID = WORKER_ID = None


@pytest.fixture(scope="module", autouse=True)
def _users():
    """Create one user per role once the shared test DB exists."""
    global PM_HEADERS, WORKER_HEADERS, ADMIN_HEADERS, CLIENT_HEADERS, PM_ID, WORKER_ID
    PM_HEADERS, PM_ID = make_user("pm@test.com", "project_manager")
    WORKER_HEADERS, WORKER_ID = make_user("worker@test.com", "worker")
    ADMIN_HEADERS, _ = make_user("admin@test.com", "admin")
    CLIENT_HEADERS, _ = make_user("client@test.com", "client")
    yield


# ---------------- Projects & milestones ----------------

def test_pm_can_create_and_list_project():
    res = client.post(
        "/api/projects/",
        headers=PM_HEADERS,
        json={"name": "Green Valley", "category": "residential", "budget": 100000},
    )
    assert res.status_code == 201
    assert res.json()["status"] == "planned"
    assert res.json()["manager_id"] == PM_ID

    listing = client.get("/api/projects/", headers=PM_HEADERS)
    assert listing.status_code == 200
    assert len(listing.json()) >= 1


def test_worker_cannot_create_project():
    res = client.post(
        "/api/projects/",
        headers=WORKER_HEADERS,
        json={"name": "Nope", "category": "commercial"},
    )
    assert res.status_code == 403


def test_invalid_project_category_rejected():
    res = client.post(
        "/api/projects/", headers=PM_HEADERS, json={"name": "Bad", "category": "spaceship"}
    )
    assert res.status_code == 422


def test_project_update_and_status_change():
    created = client.post(
        "/api/projects/", headers=PM_HEADERS, json={"name": "Tower", "category": "commercial"}
    ).json()
    res = client.put(
        f"/api/projects/{created['id']}", headers=PM_HEADERS, json={"status": "in_progress"}
    )
    assert res.status_code == 200
    assert res.json()["status"] == "in_progress"


def test_get_missing_project_returns_404():
    assert client.get("/api/projects/9999", headers=PM_HEADERS).status_code == 404


def test_add_and_update_milestone():
    project = client.post(
        "/api/projects/", headers=PM_HEADERS, json={"name": "Bridge", "category": "infrastructure"}
    ).json()
    m = client.post(
        f"/api/projects/{project['id']}/milestones",
        headers=PM_HEADERS,
        json={"title": "Foundation", "category": "foundation"},
    )
    assert m.status_code == 201
    assert m.json()["status"] == "pending"

    upd = client.patch(
        f"/api/projects/milestones/{m.json()['id']}",
        headers=PM_HEADERS,
        json={"status": "completed"},
    )
    assert upd.status_code == 200
    assert upd.json()["status"] == "completed"


# ---------------- Workforce & attendance ----------------

def test_worker_registration_and_attendance_upsert():
    project = client.post(
        "/api/projects/", headers=PM_HEADERS, json={"name": "Site A", "category": "industrial"}
    ).json()
    worker = client.post(
        "/api/workers",
        headers=PM_HEADERS,
        json={"full_name": "Ramesh Kumar", "category": "skilled", "daily_wage": 600},
    )
    assert worker.status_code == 201
    wid = worker.json()["id"]

    body = {"worker_id": wid, "project_id": project["id"], "date": "2026-09-25", "status": "present"}
    first = client.post("/api/attendance", headers=PM_HEADERS, json=body)
    assert first.status_code == 201

    # Marking the same worker/date again updates instead of duplicating
    body["status"] = "absent"
    second = client.post("/api/attendance", headers=PM_HEADERS, json=body)
    assert second.json()["id"] == first.json()["id"]
    assert second.json()["status"] == "absent"


def test_attendance_for_unknown_worker_404():
    res = client.post(
        "/api/attendance",
        headers=PM_HEADERS,
        json={"worker_id": 9999, "project_id": 1, "date": "2026-09-25", "status": "present"},
    )
    assert res.status_code == 404


def test_worker_role_cannot_register_workers():
    res = client.post(
        "/api/workers",
        headers=WORKER_HEADERS,
        json={"full_name": "Sneaky", "category": "skilled"},
    )
    assert res.status_code == 403


# ---------------- Resources & inventory ----------------

def test_resource_lifecycle():
    res = client.post(
        "/api/resources", headers=PM_HEADERS, json={"name": "Crane 1", "category": "crane"}
    )
    assert res.status_code == 201
    assert res.json()["status"] == "available"
    upd = client.patch(
        f"/api/resources/{res.json()['id']}", headers=PM_HEADERS, json={"status": "maintenance"}
    )
    assert upd.json()["status"] == "maintenance"


def test_low_stock_alert_detection():
    client.post(
        "/api/inventory",
        headers=PM_HEADERS,
        json={"material_name": "Cement", "category": "cement", "quantity": 10, "reorder_level": 50},
    )
    client.post(
        "/api/inventory",
        headers=PM_HEADERS,
        json={"material_name": "Steel", "category": "steel", "quantity": 500, "reorder_level": 50},
    )
    low = client.get("/api/inventory/alerts/low-stock", headers=PM_HEADERS).json()
    names = [i["material_name"] for i in low]
    assert "Cement" in names
    assert "Steel" not in names


# ---------------- Procurement ----------------

def test_procurement_flow_and_role_restriction():
    req = client.post(
        "/api/procurement/",
        headers=PM_HEADERS,
        json={"item_name": "Steel rods", "category": "raw_materials", "quantity": 100, "cost": 5000},
    )
    assert req.status_code == 201
    assert req.json()["status"] == "requested"

    approved = client.patch(
        f"/api/procurement/{req.json()['id']}", headers=PM_HEADERS, json={"status": "approved"}
    )
    assert approved.json()["status"] == "approved"

    forbidden = client.patch(
        f"/api/procurement/{req.json()['id']}", headers=WORKER_HEADERS, json={"status": "delivered"}
    )
    assert forbidden.status_code == 403


# ---------------- Notifications ----------------

def test_notification_only_visible_to_owner_and_can_be_read():
    created = client.post(
        "/api/notifications/",
        headers=ADMIN_HEADERS,
        json={"user_id": WORKER_ID, "title": "Deadline soon", "type": "deadline"},
    )
    assert created.status_code == 201

    mine = client.get("/api/notifications/", headers=WORKER_HEADERS).json()
    assert any(n["title"] == "Deadline soon" for n in mine)

    others = client.get("/api/notifications/", headers=PM_HEADERS).json()
    assert not any(n["title"] == "Deadline soon" for n in others)

    nid = created.json()["id"]
    read = client.patch(f"/api/notifications/{nid}/read", headers=WORKER_HEADERS)
    assert read.json()["is_read"] is True

    # Another user cannot mark it as read
    assert client.patch(f"/api/notifications/{nid}/read", headers=PM_HEADERS).status_code == 404


def test_worker_cannot_push_notifications():
    res = client.post(
        "/api/notifications/",
        headers=WORKER_HEADERS,
        json={"user_id": PM_ID, "title": "Hi"},
    )
    assert res.status_code == 403


# ---------------- Reports ----------------

def test_report_summary_reflects_data_and_is_role_protected():
    res = client.get("/api/reports/summary", headers=PM_HEADERS)
    assert res.status_code == 200
    data = res.json()
    assert data["total_projects"] >= 1
    assert data["total_workers"] >= 1
    assert data["low_stock_items"] >= 1
    assert "planned" in data["projects_by_status"]

    assert client.get("/api/reports/summary", headers=CLIENT_HEADERS).status_code == 200
    assert client.get("/api/reports/summary", headers=WORKER_HEADERS).status_code == 403
