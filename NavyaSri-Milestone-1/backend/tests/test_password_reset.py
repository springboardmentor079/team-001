"""Tests for the development-friendly forgot-password / reset-password flow."""


def test_forgot_password_returns_token_for_existing_user(client, register_payload):
    client.post("/api/v1/auth/register", json=register_payload)

    response = client.post(
        "/api/v1/auth/forgot-password", json={"email": register_payload["email"]}
    )
    assert response.status_code == 200
    body = response.json()["data"]
    assert body["reset_token"] is not None


def test_forgot_password_unknown_email_does_not_leak_existence(client):
    response = client.post(
        "/api/v1/auth/forgot-password", json={"email": "nobody@example.com"}
    )
    assert response.status_code == 200
    body = response.json()["data"]
    assert body["reset_token"] is None


def test_reset_password_with_valid_token(client, register_payload):
    client.post("/api/v1/auth/register", json=register_payload)
    forgot_response = client.post(
        "/api/v1/auth/forgot-password", json={"email": register_payload["email"]}
    )
    reset_token = forgot_response.json()["data"]["reset_token"]

    reset_response = client.post(
        "/api/v1/auth/reset-password",
        json={
            "token": reset_token,
            "new_password": "NewPass456",
            "confirm_new_password": "NewPass456",
        },
    )
    assert reset_response.status_code == 200

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": register_payload["email"], "password": "NewPass456"},
    )
    assert login_response.status_code == 200


def test_reset_password_with_invalid_token_rejected(client):
    response = client.post(
        "/api/v1/auth/reset-password",
        json={
            "token": "not-a-real-token",
            "new_password": "NewPass456",
            "confirm_new_password": "NewPass456",
        },
    )
    assert response.status_code == 400
