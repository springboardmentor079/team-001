"""Tests for the later features: documents, budget/expenses, exports,
notifications triggers, user management, profile and email flows."""
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from app.services import auth_service

client = TestClient(app)


def make_user(email: str, role: str):
    client.post(
        "/api/auth/signup",
        json={"full_name": f"{role} user", "email": email, "password": "secret123", "role": role},
    )
    body = client.post("/api/auth/login", json={"email": email, "password": "secret123"}).json()
    return {"Authorization": f"Bearer {body['access_token']}"}, body["user"]["id"]


@pytest.fixture(scope="module")
def users():
    data = {}
    for key, role in [
        ("admin", "admin"), ("pm", "project_manager"), ("eng", "site_engineer"),
        ("contractor", "contractor"), ("worker", "worker"), ("client", "client"),
    ]:
        headers, uid = make_user(f"f_{key}@test.com", role)
        data[key] = {"h": headers, "id": uid}
    return data


@pytest.fixture(scope="module")
def project(users):
    res = client.post(
        "/api/projects/", headers=users["pm"]["h"],
        json={"name": "Feature Tower", "category": "commercial", "budget": 1000},
    )
    return res.json()


def titles(headers):
    return [n["title"] for n in client.get("/api/notifications/", headers=headers).json()]


# ----------------------------------------------------------- auth & profile
def test_admin_signup_can_be_disabled(monkeypatch):
    monkeypatch.setattr(settings, "ALLOW_ADMIN_SIGNUP", False)
    res = client.post(
        "/api/auth/signup",
        json={"full_name": "Evil", "email": "evil@test.com", "password": "secret123", "role": "admin"},
    )
    assert res.status_code == 403
    ok = client.post(
        "/api/auth/signup",
        json={"full_name": "Fine", "email": "fine@test.com", "password": "secret123", "role": "worker"},
    )
    assert ok.status_code == 201


def test_profile_update_and_password_change(users):
    h = users["worker"]["h"]
    res = client.patch("/api/auth/me", headers=h, json={"full_name": "Renamed Worker"})
    assert res.status_code == 200 and res.json()["full_name"] == "Renamed Worker"

    bad = client.post("/api/auth/change-password", headers=h,
                      json={"current_password": "wrong", "new_password": "newsecret1"})
    assert bad.status_code == 400

    good = client.post("/api/auth/change-password", headers=h,
                       json={"current_password": "secret123", "new_password": "newsecret1"})
    assert good.status_code == 200
    assert client.post("/api/auth/login", json={"email": "f_worker@test.com", "password": "newsecret1"}).status_code == 200
    # restore so later tests can still log in
    client.post("/api/auth/change-password", headers=h,
                json={"current_password": "newsecret1", "new_password": "secret123"})


def test_forgot_password_dev_mode_returns_token():
    res = client.post("/api/auth/forgot-password", json={"email": "f_pm@test.com"})
    assert res.status_code == 200
    assert res.json()["email_sent"] is False and res.json()["reset_token"]


def test_forgot_password_emails_link_and_hides_token(monkeypatch):
    sent = {}

    def fake_send(to, subject, body):
        sent.update(to=to, subject=subject, body=body)
        return True

    monkeypatch.setattr(auth_service, "send_email", fake_send)
    res = client.post("/api/auth/forgot-password", json={"email": "f_pm@test.com"})
    assert res.json()["email_sent"] is True
    assert res.json()["reset_token"] is None
    assert sent["to"] == "f_pm@test.com"
    assert "/reset-password?token=" in sent["body"]


# ---------------------------------------------------------- user management
def test_admin_manages_users(users):
    admin = users["admin"]["h"]
    listing = client.get("/api/users/", headers=admin)
    assert listing.status_code == 200 and len(listing.json()) >= 6
    assert client.get("/api/users/", headers=users["pm"]["h"]).status_code == 403

    victim_headers, victim_id = make_user("victim@test.com", "worker")
    res = client.patch(f"/api/users/{victim_id}", headers=admin, json={"role": "contractor"})
    assert res.json()["role"] == "contractor"

    client.patch(f"/api/users/{victim_id}", headers=admin, json={"is_active": False})
    login = client.post("/api/auth/login", json={"email": "victim@test.com", "password": "secret123"})
    assert login.status_code == 403  # deactivated accounts cannot sign in


def test_admin_cannot_demote_self(users):
    res = client.patch(f"/api/users/{users['admin']['id']}", headers=users["admin"]["h"], json={"is_active": False})
    assert res.status_code == 400


def test_user_directory_is_limited_to_admin_and_pm(users):
    assert client.get("/api/users/directory", headers=users["pm"]["h"]).status_code == 200
    assert client.get("/api/users/directory", headers=users["worker"]["h"]).status_code == 403


# ---------------------------------------------------------------- documents
def test_document_upload_download_delete(users, project):
    up = client.post(
        "/api/documents/", headers=users["pm"]["h"],
        files={"file": ("plan.txt", b"site plan v1", "text/plain")},
        data={"project_id": str(project["id"])},
    )
    assert up.status_code == 201
    doc = up.json()
    assert doc["filename"] == "plan.txt" and doc["size_bytes"] == len(b"site plan v1")

    assert any(d["id"] == doc["id"] for d in client.get("/api/documents/", headers=users["worker"]["h"]).json())
    dl = client.get(f"/api/documents/{doc['id']}/download", headers=users["worker"]["h"])
    assert dl.status_code == 200 and dl.content == b"site plan v1"

    # a worker who is not the uploader cannot delete it
    assert client.delete(f"/api/documents/{doc['id']}", headers=users["worker"]["h"]).status_code == 403
    assert client.delete(f"/api/documents/{doc['id']}", headers=users["pm"]["h"]).status_code == 204
    assert client.get(f"/api/documents/{doc['id']}/download", headers=users["pm"]["h"]).status_code == 404


def test_document_upload_validation(users, monkeypatch):
    h = users["pm"]["h"]
    bad_type = client.post("/api/documents/", headers=h, files={"file": ("virus.exe", b"x", "application/octet-stream")})
    assert bad_type.status_code == 400
    empty = client.post("/api/documents/", headers=h, files={"file": ("empty.txt", b"", "text/plain")})
    assert empty.status_code == 400
    no_project = client.post("/api/documents/", headers=h, files={"file": ("a.txt", b"x", "text/plain")},
                             data={"project_id": "99999"})
    assert no_project.status_code == 404
    forbidden = client.post("/api/documents/", headers=users["worker"]["h"], files={"file": ("a.txt", b"x", "text/plain")})
    assert forbidden.status_code == 403

    monkeypatch.setattr(settings, "MAX_UPLOAD_MB", 0)
    too_big = client.post("/api/documents/", headers=h, files={"file": ("a.txt", b"x", "text/plain")})
    assert too_big.status_code == 413


def test_document_filename_is_sanitised(users):
    res = client.post("/api/documents/", headers=users["pm"]["h"],
                      files={"file": ("../../etc/pass wd.txt", b"data", "text/plain")})
    assert res.status_code == 201
    assert "/" not in res.json()["filename"] and ".." not in res.json()["filename"]


# ------------------------------------------------------------ budget/expenses
def test_expenses_and_budget_overview(users, project):
    h = users["pm"]["h"]
    ok = client.post("/api/expenses", headers=h,
                     json={"project_id": project["id"], "category": "labor", "amount": 300, "description": "Week 1"})
    assert ok.status_code == 201
    client.post("/api/expenses", headers=h, json={"project_id": project["id"], "category": "material", "amount": 200})

    assert client.post("/api/expenses", headers=h, json={"project_id": project["id"], "category": "labor", "amount": 0}).status_code == 422
    assert client.post("/api/expenses", headers=h, json={"project_id": 99999, "category": "labor", "amount": 5}).status_code == 404
    assert client.post("/api/expenses", headers=users["worker"]["h"],
                       json={"project_id": project["id"], "category": "labor", "amount": 5}).status_code == 403

    overview = client.get("/api/budget/overview", headers=users["client"]["h"]).json()
    row = next(r for r in overview if r["project_id"] == project["id"])
    assert row["budget"] == 1000 and row["spent"] == 500 and row["remaining"] == 500
    assert row["utilisation_pct"] == 50.0
    assert row["spent_by_category"] == {"labor": 300.0, "material": 200.0}
    assert client.get("/api/budget/overview", headers=users["worker"]["h"]).status_code == 403


def test_budget_alert_at_90_percent(users, project):
    client.post("/api/expenses", headers=users["pm"]["h"],
                json={"project_id": project["id"], "category": "equipment", "amount": 450})
    assert "Budget alert" in titles(users["pm"]["h"])


def test_expense_delete(users, project):
    created = client.post("/api/expenses", headers=users["pm"]["h"],
                          json={"project_id": project["id"], "category": "administrative", "amount": 1}).json()
    assert client.delete(f"/api/expenses/{created['id']}", headers=users["pm"]["h"]).status_code == 204
    assert client.delete(f"/api/expenses/{created['id']}", headers=users["pm"]["h"]).status_code == 404


# ------------------------------------------------------- analytics & exports
def test_analytics_endpoint(users):
    res = client.get("/api/reports/analytics", headers=users["pm"]["h"])
    assert res.status_code == 200
    data = res.json()
    for key in ["projects_by_status", "budget_vs_spent", "expenses_by_category",
                "inventory_by_category", "procurement_by_status", "attendance_by_status"]:
        assert key in data
    assert client.get("/api/reports/analytics", headers=users["worker"]["h"]).status_code == 403


@pytest.mark.parametrize("fmt,signature", [("xlsx", b"PK"), ("pdf", b"%PDF"), ("csv", b"\xef\xbb\xbfID")])
def test_exports_have_valid_file_signatures(users, fmt, signature):
    res = client.get(f"/api/reports/export/projects?format={fmt}", headers=users["pm"]["h"])
    assert res.status_code == 200
    assert res.content.startswith(signature)
    assert "attachment" in res.headers["content-disposition"]


@pytest.mark.parametrize("kind", ["projects", "workers", "attendance", "inventory", "procurement", "expenses", "resources"])
def test_every_report_kind_exports(users, kind):
    for fmt in ("xlsx", "pdf", "csv"):
        res = client.get(f"/api/reports/export/{kind}?format={fmt}", headers=users["admin"]["h"])
        assert res.status_code == 200, f"{kind}/{fmt}"


def test_export_permissions_and_history(users):
    assert client.get("/api/reports/export/projects", headers=users["client"]["h"]).status_code == 200
    assert client.get("/api/reports/export/workers", headers=users["client"]["h"]).status_code == 403
    assert client.get("/api/reports/export/projects", headers=users["worker"]["h"]).status_code == 403
    assert client.get("/api/reports/export/nonsense", headers=users["pm"]["h"]).status_code == 404
    assert client.get("/api/reports/export/projects?format=exe", headers=users["pm"]["h"]).status_code == 422

    history = client.get("/api/reports/history", headers=users["pm"]["h"]).json()
    assert len(history) >= 1 and history[0]["file_name"].startswith("buildtrack-")
    assert client.get("/api/reports/history", headers=users["client"]["h"]).status_code == 403


# ---------------------------------------------------- notification behaviour
def test_unread_count_and_mark_all_read(users):
    h = users["worker"]["h"]
    client.post("/api/notifications/", headers=users["admin"]["h"],
                json={"user_id": users["worker"]["id"], "title": "One"})
    client.post("/api/notifications/", headers=users["admin"]["h"],
                json={"user_id": users["worker"]["id"], "title": "Two"})
    assert client.get("/api/notifications/unread-count", headers=h).json()["unread"] >= 2
    assert client.patch("/api/notifications/read-all", headers=h).json()["marked_read"] >= 2
    assert client.get("/api/notifications/unread-count", headers=h).json()["unread"] == 0


def test_notification_to_unknown_user_404(users):
    res = client.post("/api/notifications/", headers=users["admin"]["h"], json={"user_id": 99999, "title": "x"})
    assert res.status_code == 404


def test_procurement_triggers_notifications(users):
    created = client.post("/api/procurement/", headers=users["contractor"]["h"],
                          json={"item_name": "Cement bags", "category": "raw_materials", "quantity": 10, "cost": 100}).json()
    assert created["requested_by"] == users["contractor"]["id"]
    assert "New procurement request" in titles(users["pm"]["h"])

    client.patch(f"/api/procurement/{created['id']}", headers=users["pm"]["h"], json={"status": "approved"})
    assert "Procurement approved" in titles(users["contractor"]["h"])


def test_low_stock_triggers_notification(users):
    client.post("/api/inventory", headers=users["pm"]["h"],
                json={"material_name": "Sand", "category": "sand", "quantity": 1, "reorder_level": 10, "unit": "tons"})
    assert "Low stock alert" in titles(users["admin"]["h"])


def test_absent_attendance_notifies_project_manager(users, project):
    worker = client.post("/api/workers", headers=users["pm"]["h"],
                         json={"full_name": "Late Larry", "category": "unskilled"}).json()
    client.post("/api/attendance", headers=users["pm"]["h"],
                json={"worker_id": worker["id"], "project_id": project["id"], "date": "2026-09-01", "status": "absent"})
    assert "Worker absent" in titles(users["pm"]["h"])


def test_delayed_milestone_notifies_project_manager(users, project):
    m = client.post(f"/api/projects/{project['id']}/milestones", headers=users["pm"]["h"],
                    json={"title": "Roofing", "category": "structural"}).json()
    client.patch(f"/api/projects/milestones/{m['id']}", headers=users["pm"]["h"], json={"status": "delayed"})
    assert "Milestone delayed" in titles(users["pm"]["h"])


def test_generate_alerts_flags_overdue_and_is_idempotent(users, project):
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    m = client.post(f"/api/projects/{project['id']}/milestones", headers=users["pm"]["h"],
                    json={"title": "Plastering", "category": "finishing", "due_date": yesterday}).json()

    first = client.post("/api/notifications/generate-alerts", headers=users["pm"]["h"])
    assert first.status_code == 200 and first.json()["deadline_alerts"] >= 1
    assert "Milestone overdue" in titles(users["pm"]["h"])

    milestones = client.get(f"/api/projects/{project['id']}/milestones", headers=users["pm"]["h"]).json()
    assert next(x for x in milestones if x["id"] == m["id"])["status"] == "delayed"

    second = client.post("/api/notifications/generate-alerts", headers=users["pm"]["h"])
    assert second.json()["deadline_alerts"] == 0  # no duplicate alerts

    assert client.post("/api/notifications/generate-alerts", headers=users["worker"]["h"]).status_code == 403
