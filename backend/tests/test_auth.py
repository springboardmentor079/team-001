import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_signup_success():
    response = client.post(
        "/api/auth/signup",
        json={
            "full_name": "Jane Doe",
            "email": "jane@example.com",
            "password": "strongpass1",
            "role": "project_manager",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "jane@example.com"
    assert data["role"] == "project_manager"
    assert "hashed_password" not in data  # password must never be exposed


def test_signup_duplicate_email_fails():
    client.post(
        "/api/auth/signup",
        json={
            "full_name": "Dup User",
            "email": "dup@example.com",
            "password": "strongpass1",
        },
    )
    response = client.post(
        "/api/auth/signup",
        json={
            "full_name": "Dup User 2",
            "email": "dup@example.com",
            "password": "strongpass1",
        },
    )
    assert response.status_code == 400


def test_login_success_returns_token():
    response = client.post(
        "/api/auth/login",
        json={"email": "jane@example.com", "password": "strongpass1"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password_fails():
    response = client.post(
        "/api/auth/login",
        json={"email": "jane@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_protected_route_requires_token():
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_protected_route_with_valid_token():
    login = client.post(
        "/api/auth/login",
        json={"email": "jane@example.com", "password": "strongpass1"},
    )
    token = login.json()["access_token"]
    response = client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == "jane@example.com"


def test_role_based_access_denies_non_admin():
    login = client.post(
        "/api/auth/login",
        json={"email": "jane@example.com", "password": "strongpass1"},
    )
    token = login.json()["access_token"]
    # jane is a project_manager, not admin -> should be forbidden
    response = client.get(
        "/api/users/", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403


def test_forgot_password_generates_token():
    response = client.post(
        "/api/auth/forgot-password", json={"email": "jane@example.com"}
    )
    assert response.status_code == 200
    assert "reset_token" in response.json()


def test_forgot_password_unknown_email_fails():
    response = client.post(
        "/api/auth/forgot-password", json={"email": "nobody@example.com"}
    )
    assert response.status_code == 404


def test_reset_password_changes_login_credentials():
    forgot = client.post(
        "/api/auth/forgot-password", json={"email": "jane@example.com"}
    )
    token = forgot.json()["reset_token"]

    reset = client.post(
        "/api/auth/reset-password",
        json={"reset_token": token, "new_password": "brandnewpass1"},
    )
    assert reset.status_code == 200

    old_login = client.post(
        "/api/auth/login",
        json={"email": "jane@example.com", "password": "strongpass1"},
    )
    assert old_login.status_code == 401

    new_login = client.post(
        "/api/auth/login",
        json={"email": "jane@example.com", "password": "brandnewpass1"},
    )
    assert new_login.status_code == 200
