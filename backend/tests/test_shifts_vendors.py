"""Shift scheduling, payroll, vendor management and invoice tracking."""
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def make_user(email: str, role: str):
    client.post("/api/auth/signup", json={"full_name": role, "email": email, "password": "secret123", "role": role})
    body = client.post("/api/auth/login", json={"email": email, "password": "secret123"}).json()
    return {"Authorization": f"Bearer {body['access_token']}"}


@pytest.fixture(scope="module")
def h():
    return {
        "admin": make_user("s_admin@test.com", "admin"),
        "pm": make_user("s_pm@test.com", "project_manager"),
        "eng": make_user("s_eng@test.com", "site_engineer"),
        "contractor": make_user("s_con@test.com", "contractor"),
        "worker": make_user("s_wrk@test.com", "worker"),
    }


@pytest.fixture(scope="module")
def setup(h):
    project = client.post("/api/projects/", headers=h["pm"], json={"name": "Payroll Site", "category": "industrial"}).json()
    w1 = client.post("/api/workers", headers=h["pm"], json={"full_name": "Aaron Payroll", "category": "skilled", "daily_wage": 1000}).json()
    w2 = client.post("/api/workers", headers=h["pm"], json={"full_name": "Beth Payroll", "category": "unskilled", "daily_wage": 400}).json()
    return {"project": project, "w1": w1, "w2": w2}


# ------------------------------------------------------------------ shifts
def test_shift_assign_and_update_same_day(h, setup):
    body = {"worker_id": setup["w1"]["id"], "project_id": setup["project"]["id"], "shift_date": "2026-11-02", "shift_type": "morning"}
    first = client.post("/api/shifts", headers=h["eng"], json=body)
    assert first.status_code == 201
    body["shift_type"] = "night"
    second = client.post("/api/shifts", headers=h["pm"], json=body)
    assert second.json()["id"] == first.json()["id"] and second.json()["shift_type"] == "night"


def test_shift_validation_and_permissions(h, setup):
    ok = {"worker_id": setup["w1"]["id"], "project_id": setup["project"]["id"], "shift_date": "2026-11-03", "shift_type": "evening"}
    assert client.post("/api/shifts", headers=h["worker"], json=ok).status_code == 403
    assert client.post("/api/shifts", headers=h["pm"], json={**ok, "shift_type": "dawn"}).status_code == 422
    assert client.post("/api/shifts", headers=h["pm"], json={**ok, "worker_id": 99999}).status_code == 404
    assert client.post("/api/shifts", headers=h["pm"], json={**ok, "project_id": 99999}).status_code == 404


def test_shift_listing_filters_and_delete(h, setup):
    pid = setup["project"]["id"]
    client.post("/api/shifts", headers=h["pm"], json={"worker_id": setup["w2"]["id"], "project_id": pid, "shift_date": "2026-12-10", "shift_type": "morning"})
    window = client.get("/api/shifts?start=2026-12-01&end=2026-12-31", headers=h["worker"]).json()
    assert len(window) >= 1 and all("2026-12" in s["shift_date"] for s in window)
    assert client.get("/api/shifts?start=2027-06-01", headers=h["pm"]).json() == []
    sid = window[0]["id"]
    assert client.delete(f"/api/shifts/{sid}", headers=h["worker"]).status_code == 403
    assert client.delete(f"/api/shifts/{sid}", headers=h["pm"]).status_code == 204
    assert client.delete(f"/api/shifts/{sid}", headers=h["pm"]).status_code == 404


# ----------------------------------------------------------------- payroll
def test_payroll_calculates_from_attendance(h, setup):
    pid = setup["project"]["id"]
    a, b = setup["w1"]["id"], setup["w2"]["id"]
    rows = [
        (a, "2027-01-01", "present"), (a, "2027-01-02", "present"), (a, "2027-01-03", "half_day"),
        (a, "2027-01-04", "absent"), (a, "2027-01-05", "leave"),
        (b, "2027-01-01", "present"), (b, "2027-01-02", "half_day"),
        (b, "2027-02-01", "present"),  # outside the payroll window
    ]
    for wid, d, st in rows:
        r = client.post("/api/attendance", headers=h["pm"], json={"worker_id": wid, "project_id": pid, "date": d, "status": st})
        assert r.status_code == 201

    res = client.get("/api/payroll?start=2027-01-01&end=2027-01-31", headers=h["pm"])
    assert res.status_code == 200
    lines = {l["worker_name"]: l for l in res.json()["lines"]}
    aaron, beth = lines["Aaron Payroll"], lines["Beth Payroll"]
    assert (aaron["present_days"], aaron["half_days"], aaron["absent_days"], aaron["leave_days"]) == (2, 1, 1, 1)
    assert aaron["payable_days"] == 2.5 and aaron["amount"] == 2500.0
    assert beth["payable_days"] == 1.5 and beth["amount"] == 600.0
    assert res.json()["total_amount"] >= 3100.0


def test_payroll_validation_and_permissions(h):
    assert client.get("/api/payroll?start=2027-02-01&end=2027-01-01", headers=h["pm"]).status_code == 400
    assert client.get("/api/payroll?start=2027-01-01&end=2027-01-31", headers=h["contractor"]).status_code == 403
    assert client.get("/api/payroll?start=2027-01-01&end=2027-01-31", headers=h["worker"]).status_code == 403
    assert client.get("/api/payroll?start=2027-01-01", headers=h["pm"]).status_code == 422


# ----------------------------------------------------------------- vendors
def test_vendor_crud_and_uniqueness(h):
    created = client.post("/api/vendors/", headers=h["pm"], json={
        "name": "UltraSteel Ltd", "category": "raw_materials", "contact_person": "Ravi", "email": "ravi@ultrasteel.com", "phone": "9990001111"})
    assert created.status_code == 201
    vid = created.json()["id"]

    dup = client.post("/api/vendors/", headers=h["pm"], json={"name": "ultrasteel ltd", "category": "equipment"})
    assert dup.status_code == 400  # case-insensitive duplicate

    assert client.post("/api/vendors/", headers=h["pm"], json={"name": "Bad Mail", "category": "equipment", "email": "nope"}).status_code == 422
    upd = client.patch(f"/api/vendors/{vid}", headers=h["admin"], json={"phone": "123"})
    assert upd.json()["phone"] == "123"
    assert client.patch("/api/vendors/99999", headers=h["pm"], json={"phone": "1"}).status_code == 404


def test_vendor_permissions(h):
    assert client.get("/api/vendors/", headers=h["contractor"]).status_code == 200
    assert client.get("/api/vendors/", headers=h["worker"]).status_code == 403
    assert client.post("/api/vendors/", headers=h["contractor"], json={"name": "Nope Co", "category": "equipment"}).status_code == 403


def test_vendor_with_orders_cannot_be_deleted_and_summary(h):
    v = client.post("/api/vendors/", headers=h["pm"], json={"name": "Orders Inc", "category": "machinery"}).json()
    req = client.post("/api/procurement/", headers=h["contractor"], json={
        "item_name": "Drill rig", "category": "machinery", "vendor_name": "Orders Inc", "quantity": 1, "cost": 5000}).json()
    assert client.delete(f"/api/vendors/{v['id']}", headers=h["pm"]).status_code == 400

    client.patch(f"/api/procurement/{req['id']}", headers=h["pm"], json={"invoice_number": "INV-77"})
    summary = {r["vendor_name"]: r for r in client.get("/api/vendors/summary", headers=h["pm"]).json()}
    assert summary["Orders Inc"]["orders"] == 1 and summary["Orders Inc"]["total_cost"] == 5000.0
    assert summary["Orders Inc"]["unpaid_invoices"] == 1

    client.patch(f"/api/procurement/{req['id']}", headers=h["pm"], json={"invoice_paid": True})
    summary = {r["vendor_name"]: r for r in client.get("/api/vendors/summary", headers=h["pm"]).json()}
    assert summary["Orders Inc"]["unpaid_invoices"] == 0

    unused = client.post("/api/vendors/", headers=h["pm"], json={"name": "Unused Co", "category": "office_supplies"}).json()
    assert client.delete(f"/api/vendors/{unused['id']}", headers=h["pm"]).status_code == 204


# ---------------------------------------------------------------- invoices
def test_invoice_fields_exposed_and_permission_protected(h):
    req = client.post("/api/procurement/", headers=h["contractor"], json={"item_name": "Pipes", "category": "raw_materials", "quantity": 5, "cost": 50}).json()
    assert req["invoice_number"] is None and req["invoice_paid"] is False
    assert client.patch(f"/api/procurement/{req['id']}", headers=h["contractor"], json={"invoice_paid": True}).status_code == 403
    ok = client.patch(f"/api/procurement/{req['id']}", headers=h["admin"], json={"invoice_number": "A-1", "invoice_paid": True})
    assert ok.json()["invoice_number"] == "A-1" and ok.json()["invoice_paid"] is True
    # an invoice-only edit must not trigger a status-change notification
    assert "Procurement requested" not in [n["title"] for n in client.get("/api/notifications/", headers=h["contractor"]).json()]
