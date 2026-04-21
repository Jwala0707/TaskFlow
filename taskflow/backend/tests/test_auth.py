class TestRegister:
    def test_register_success(self, client, db):
        resp = client.post("/api/auth/register", json={
            "email": "new@example.com",
            "display_name": "New User",
            "password": "securepass",
        })
        assert resp.status_code == 201
        data = resp.get_json()
        assert "access_token" in data
        assert data["user"]["email"] == "new@example.com"

    def test_register_duplicate_email(self, client, user):
        resp = client.post("/api/auth/register", json={
            "email": "test@example.com",
            "display_name": "Dup",
            "password": "password123",
        })
        assert resp.status_code == 409

    def test_register_short_password(self, client, db):
        resp = client.post("/api/auth/register", json={
            "email": "x@example.com",
            "display_name": "X",
            "password": "short",
        })
        assert resp.status_code == 422

    def test_register_invalid_email(self, client, db):
        resp = client.post("/api/auth/register", json={
            "email": "not-an-email",
            "display_name": "X",
            "password": "password123",
        })
        assert resp.status_code == 422


class TestLogin:
    def test_login_success(self, client, user):
        resp = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "password123",
        })
        assert resp.status_code == 200
        assert "access_token" in resp.get_json()

    def test_login_wrong_password(self, client, user):
        resp = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "wrongpassword",
        })
        assert resp.status_code == 401

    def test_login_unknown_email(self, client, db):
        resp = client.post("/api/auth/login", json={
            "email": "nobody@example.com",
            "password": "password123",
        })
        assert resp.status_code == 401


class TestMe:
    def test_me_authenticated(self, client, auth_headers, user):
        resp = client.get("/api/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.get_json()["user"]["id"] == user.id

    def test_me_unauthenticated(self, client):
        resp = client.get("/api/auth/me")
        assert resp.status_code == 401
