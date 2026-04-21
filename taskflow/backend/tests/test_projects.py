class TestProjects:
    def test_create_project(self, client, auth_headers):
        resp = client.post("/api/projects", json={"name": "My Project"}, headers=auth_headers)
        assert resp.status_code == 201
        assert resp.get_json()["project"]["name"] == "My Project"

    def test_create_project_empty_name(self, client, auth_headers):
        resp = client.post("/api/projects", json={"name": ""}, headers=auth_headers)
        assert resp.status_code == 422

    def test_list_projects(self, client, auth_headers, project):
        resp = client.get("/api/projects", headers=auth_headers)
        assert resp.status_code == 200
        assert len(resp.get_json()["projects"]) == 1

    def test_get_project(self, client, auth_headers, project):
        resp = client.get(f"/api/projects/{project.id}", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.get_json()["project"]["id"] == project.id

    def test_get_project_not_found(self, client, auth_headers):
        resp = client.get("/api/projects/9999", headers=auth_headers)
        assert resp.status_code == 404

    def test_update_project(self, client, auth_headers, project):
        resp = client.patch(f"/api/projects/{project.id}", json={"name": "Updated"}, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.get_json()["project"]["name"] == "Updated"

    def test_delete_project(self, client, auth_headers, project):
        resp = client.delete(f"/api/projects/{project.id}", headers=auth_headers)
        assert resp.status_code == 204

    def test_cannot_access_other_users_project(self, client, db, project):
        from app.models import User
        other = User(email="other@example.com", display_name="Other")
        other.set_password("password123")
        db.session.add(other)
        db.session.commit()

        login = client.post("/api/auth/login", json={"email": "other@example.com", "password": "password123"})
        token = login.get_json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        resp = client.get(f"/api/projects/{project.id}", headers=headers)
        assert resp.status_code == 403
