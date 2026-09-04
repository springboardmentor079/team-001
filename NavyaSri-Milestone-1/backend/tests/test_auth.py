"""
Tests covering the Milestone 1 authentication surface:
registration, duplicate-email validation, login (valid/invalid), the
protected /auth/me endpoint, and role-based authorization.
"""


def test_register_success(client, register_payload):
    response = client.post("/api/v1/auth/register", json=register_payload)
    assert response.status_code == 201
    body = response.json()
    assert body["success"] is True
    assert body["data"]["email"] == register_payload["email"]
    assert "hashed_password" not in body["data"]


def test_register_duplicate_email_rejected(client, register_payload):
    first = client.post("/api/v1/auth/register", json=register_payload)
    assert first.status_code == 201

    second = client.post("/api/v1/auth/register", json=register_payload)
    assert second.status_code == 400
    assert second.json()["success"] is False


def test_register_password_mismatch_rejected(client, register_payload):
    register_payload["confirm_password"] = "SomethingElse123"
    response = client.post("/api/v1/auth/register", json=register_payload)
    assert response.status_code == 422


def test_register_invalid_role_rejected(client, register_payload):
    register_payload["role"] = "SUPER_ADMIN"
    response = client.post("/api/v1/auth/register", json=register_payload)
    assert response.status_code == 422


def test_login_success(client, register_payload):
    client.post("/api/v1/auth/register", json=register_payload)

    response = client.post(
        "/api/v1/auth/login",
        json={"email": register_payload["email"], "password": register_payload["password"]},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert "access_token" in body["data"]
    assert body["data"]["user"]["email"] == register_payload["email"]


def test_login_invalid_credentials_rejected(client, register_payload):
    client.post("/api/v1/auth/register", json=register_payload)

    response = client.post(
        "/api/v1/auth/login",
        json={"email": register_payload["email"], "password": "WrongPassword1"},
    )
    assert response.status_code == 401
    assert response.json()["success"] is False


def test_protected_endpoint_requires_token(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_protected_endpoint_with_valid_token(client, register_payload):
    client.post("/api/v1/auth/register", json=register_payload)
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": register_payload["email"], "password": register_payload["password"]},
    )
    token = login_response.json()["data"]["access_token"]

    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["data"]["email"] == register_payload["email"]


def test_role_based_authorization_blocks_non_admin(client, register_payload):
    """A PROJECT_MANAGER must not be able to reach an ADMIN-only endpoint."""
    client.post("/api/v1/auth/register", json=register_payload)
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": register_payload["email"], "password": register_payload["password"]},
    )
    token = login_response.json()["data"]["access_token"]

    response = client.get("/api/v1/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


def test_role_based_authorization_allows_admin(client):
    admin_payload = {
        "full_name": "Admin User",
        "email": "admin.test@example.com",
        "password": "AdminPass123",
        "confirm_password": "AdminPass123",
        "role": "ADMIN",
        "phone_number": "+1-555-1000",
    }
    client.post("/api/v1/auth/register", json=admin_payload)
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": admin_payload["email"], "password": admin_payload["password"]},
    )
    token = login_response.json()["data"]["access_token"]

    response = client.get("/api/v1/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["success"] is True
