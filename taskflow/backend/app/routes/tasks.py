from flask import Blueprint, request, jsonify, abort
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from app.models import Task, Project
from app.schemas import TaskCreateSchema, TaskUpdateSchema, TaskReorderSchema

tasks_bp = Blueprint("tasks", __name__)
_create_schema = TaskCreateSchema()
_update_schema = TaskUpdateSchema()
_reorder_schema = TaskReorderSchema()


def _assert_project_access(project_id: int, user_id: int) -> Project:
    project = db.get_or_404(Project, project_id)
    if project.owner_id != user_id:
        abort(403)
    return project


def _owned_task(task_id: int, user_id: int) -> Task:
    task = db.get_or_404(Task, task_id)
    _assert_project_access(task.project_id, user_id)
    return task


@tasks_bp.get("/project/<int:project_id>")
@jwt_required()
def list_tasks(project_id: int):
    user_id = int(get_jwt_identity())
    _assert_project_access(project_id, user_id)

    status_filter = request.args.get("status")
    priority_filter = request.args.get("priority")

    query = Task.query.filter_by(project_id=project_id).order_by(Task.position)
    if status_filter:
        query = query.filter_by(status=status_filter)
    if priority_filter:
        query = query.filter_by(priority=priority_filter)

    tasks = query.all()
    return jsonify({"tasks": [t.to_dict() for t in tasks]})


@tasks_bp.post("/project/<int:project_id>")
@jwt_required()
def create_task(project_id: int):
    user_id = int(get_jwt_identity())
    _assert_project_access(project_id, user_id)
    data = _create_schema.load(request.get_json(silent=True) or {})

    # Auto-assign position to end of list if not specified
    if data.get("position", 0) == 0:
        max_pos = db.session.query(db.func.max(Task.position)).filter_by(project_id=project_id).scalar() or -1
        data["position"] = max_pos + 1

    task = Task(project_id=project_id, **data)
    db.session.add(task)
    db.session.commit()
    return jsonify({"task": task.to_dict()}), 201


@tasks_bp.get("/<int:task_id>")
@jwt_required()
def get_task(task_id: int):
    user_id = int(get_jwt_identity())
    task = _owned_task(task_id, user_id)
    return jsonify({"task": task.to_dict()})


@tasks_bp.patch("/<int:task_id>")
@jwt_required()
def update_task(task_id: int):
    user_id = int(get_jwt_identity())
    task = _owned_task(task_id, user_id)
    data = _update_schema.load(request.get_json(silent=True) or {})

    for key, value in data.items():
        setattr(task, key, value)
    db.session.commit()
    return jsonify({"task": task.to_dict()})


@tasks_bp.delete("/<int:task_id>")
@jwt_required()
def delete_task(task_id: int):
    user_id = int(get_jwt_identity())
    task = _owned_task(task_id, user_id)
    db.session.delete(task)
    db.session.commit()
    return "", 204


@tasks_bp.put("/project/<int:project_id>/reorder")
@jwt_required()
def reorder_tasks(project_id: int):
    """Accept an ordered list of task IDs and update positions accordingly."""
    user_id = int(get_jwt_identity())
    _assert_project_access(project_id, user_id)
    data = _reorder_schema.load(request.get_json(silent=True) or {})

    task_ids = data["task_ids"]
    tasks = Task.query.filter(Task.id.in_(task_ids), Task.project_id == project_id).all()

    if len(tasks) != len(task_ids):
        abort(400)

    task_map = {t.id: t for t in tasks}
    for position, task_id in enumerate(task_ids):
        task_map[task_id].position = position

    db.session.commit()
    return jsonify({"task_ids": task_ids})
