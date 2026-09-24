class TestLoginFlow:
    def test_login_valid_credentials_sets_cookies(self, client, support_user):
        resp = client.post(
            "/api/v1/auth/login",
            json={"login": support_user.login, "password": "TestPass123!"},
        )
        assert resp.status_code == 200
        assert "access_token" in client.cookies
        assert "refresh_token" in client.cookies

    def test_login_wrong_password_returns_401(self, client, support_user):
        resp = client.post(
            "/api/v1/auth/login",
            json={"login": support_user.login, "password": "WrongPassword!"},
        )
        assert resp.status_code == 401

    def test_get_me_without_login_returns_401(self, client):
        resp = client.get("/api/v1/users/me")
        assert resp.status_code == 401

    def test_get_me_after_login_returns_user_data(self, support_client, support_user):
        resp = support_client.get("/api/v1/users/me")
        assert resp.status_code == 200
        data = resp.json()
        assert data["login"] == support_user.login
        assert data["role"] == "support"

    def test_logout_invalidates_session(self, support_client):
        assert support_client.get("/api/v1/users/me").status_code == 200

        support_client.post("/api/v1/auth/logout")

        resp = support_client.get("/api/v1/users/me")
        assert resp.status_code == 401

    def test_refresh_issues_new_cookies_and_old_token_rejected(self, client, support_user):
        client.post(
            "/api/v1/auth/login",
            json={"login": support_user.login, "password": "TestPass123!"},
        )
        old_refresh = client.cookies.get("refresh_token")
        assert old_refresh is not None

        resp = client.post("/api/v1/auth/refresh")
        assert resp.status_code == 200
        new_refresh = client.cookies.get("refresh_token")
        assert new_refresh is not None
        assert new_refresh != old_refresh

        client.cookies.set("refresh_token", old_refresh)
        resp2 = client.post("/api/v1/auth/refresh")
        assert resp2.status_code == 401
