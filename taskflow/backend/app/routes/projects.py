from flask import Blueprint, request, jsonify, abort
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from app.models import Project
from app.schemas import ProjectCreateSchema, ProjectUpdateSchema

projects_bp = Blueprint("projects", __name__)
_create_schema = ProjectCreateSchema()
_update_schema = ProjectUpdateSchema()


def _owned_project(project_id: int, user_id: int) -> Project:
    """Fetch a project and assert ownership, aborting with 404/403 as appropriate."""
    project = db.get_or_404(Project, project_id)
    if project.owner_id != user_id:
        abort(403)
    return project


@projects_bp.get("")
@jwt_required()
def list_projects():
    user_id = int(get_jwt_identity())
    projects = Project.query.filter_by(owner_id=user_id).order_by(Project.created_at.desc()).all()
    return jsonify({"projects": [p.to_dict() for p in projects]})


@projects_bp.post("")
@jwt_required()
def create_project():
    user_id = int(get_jwt_identity())
    data = _create_schema.load(request.get_json(silent=True) or {})

    project = Project(owner_id=user_id, **data)
    db.session.add(project)
    db.session.commit()
    return jsonify({"project": project.to_dict()}), 201


@projects_bp.get("/<int:project_id>")
@jwt_required()
def get_project(project_id: int):
    user_id = int(get_jwt_identity())
    project = _owned_project(project_id, user_id)
    return jsonify({"project": project.to_dict(include_tasks=True)})


@projects_bp.patch("/<int:project_id>")
@jwt_required()
def update_project(project_id: int):
    user_id = int(get_jwt_identity())
    project = _owned_project(project_id, user_id)
    data = _update_schema.load(request.get_json(silent=True) or {})

    for key, value in data.items():
        setattr(project, key, value)
    db.session.commit()
    return jsonify({"project": project.to_dict()})


@projects_bp.delete("/<int:project_id>")
@jwt_required()
def delete_project(project_id: int):
    user_id = int(get_jwt_identity())
    project = _owned_project(project_id, user_id)
    db.session.delete(project)
    db.session.commit()
    return "", 204
