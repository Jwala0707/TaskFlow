class TestTasks:
    def test_create_task(self, client, auth_headers, project):
        resp = client.post(f"/api/tasks/project/{project.id}", json={"title": "Do something"}, headers=auth_headers)
        assert resp.status_code == 201
        task = resp.get_json()["task"]
        assert task["title"] == "Do something"
        assert task["status"] == "todo"
        assert task["priority"] == "medium"

    def test_create_task_invalid_status(self, client, auth_headers, project):
        resp = client.post(
            f"/api/tasks/project/{project.id}",
            json={"title": "Bad", "status": "invalid_status"},
            headers=auth_headers,
        )
        assert resp.status_code == 422

    def test_list_tasks(self, client, auth_headers, project, db):
        from app.models import Task
        t1 = Task(title="T1", project_id=project.id, position=0)
        t2 = Task(title="T2", project_id=project.id, position=1)
        db.session.add_all([t1, t2])
        db.session.commit()

        resp = client.get(f"/api/tasks/project/{project.id}", headers=auth_headers)
        assert resp.status_code == 200
        assert len(resp.get_json()["tasks"]) == 2

    def test_filter_tasks_by_status(self, client, auth_headers, project, db):
        from app.models import Task
        db.session.add(Task(title="Todo", project_id=project.id, status="todo", position=0))
        db.session.add(Task(title="Done", project_id=project.id, status="done", position=1))
        db.session.commit()

        resp = client.get(f"/api/tasks/project/{project.id}?status=done", headers=auth_headers)
        tasks = resp.get_json()["tasks"]
        assert len(tasks) == 1
        assert tasks[0]["status"] == "done"

    def test_update_task_status(self, client, auth_headers, project, db):
        from app.models import Task
        task = Task(title="T", project_id=project.id, position=0)
        db.session.add(task)
        db.session.commit()

        resp = client.patch(f"/api/tasks/{task.id}", json={"status": "done"}, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.get_json()["task"]["status"] == "done"

    def test_delete_task(self, client, auth_headers, project, db):
        from app.models import Task
        task = Task(title="T", project_id=project.id, position=0)
        db.session.add(task)
        db.session.commit()

        resp = client.delete(f"/api/tasks/{task.id}", headers=auth_headers)
        assert resp.status_code == 204

    def test_reorder_tasks(self, client, auth_headers, project, db):
        from app.models import Task
        t1 = Task(title="T1", project_id=project.id, position=0)
        t2 = Task(title="T2", project_id=project.id, position=1)
        t3 = Task(title="T3", project_id=project.id, position=2)
        db.session.add_all([t1, t2, t3])
        db.session.commit()

        resp = client.put(
            f"/api/tasks/project/{project.id}/reorder",
            json={"task_ids": [t3.id, t1.id, t2.id]},
            headers=auth_headers,
        )
        assert resp.status_code == 200

        # Verify positions updated
        db.session.refresh(t1)
        db.session.refresh(t2)
        db.session.refresh(t3)
        assert t3.position == 0
        assert t1.position == 1
        assert t2.position == 2
