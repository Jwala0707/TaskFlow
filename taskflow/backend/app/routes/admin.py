"""
Admin-only endpoints. All routes require JWT + admin role.

Rules:
- Only admins can access these endpoints
- Admin cannot remove their own admin role
- Admin cannot delete themselves
- First registered user is auto-admin (handled in auth.py)
"""
from flask import Blueprint, jsonify, request, abort
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from app.models import User, Project

admin_bp = Blueprint("admin", __name__)


def _require_admin() -> User:
    """Fetch current user and abort 403 if not admin."""
    user_id = int(get_jwt_identity())
    user = db.get_or_404(User, user_id)
    if not user.is_admin():
        abort(403)
    return user


@admin_bp.get("/users")
@jwt_required()
def list_users():
    _require_admin()
    users = User.query.order_by(User.created_at.asc()).all()
    return jsonify({"users": [u.to_dict() for u in users]})


@admin_bp.delete("/users/<int:user_id>")
@jwt_required()
def delete_user(user_id: int):
    current_admin = _require_admin()

    if current_admin.id == user_id:
        return jsonify({"error": "You cannot delete your own account", "status": 400}), 400

    user = db.get_or_404(User, user_id)
    db.session.delete(user)
    db.session.commit()
    return "", 204


@admin_bp.get("/projects")
@jwt_required()
def list_all_projects():
    _require_admin()
    projects = Project.query.order_by(Project.created_at.desc()).all()
    return jsonify({"projects": [p.to_dict() for p in projects]})


@admin_bp.patch("/users/<int:user_id>/role")
@jwt_required()
def change_role(user_id: int):
    current_admin = _require_admin()

    body = request.get_json(silent=True) or {}
    new_role = body.get("role")

    if new_role not in ("user", "admin"):
        return jsonify({"error": "role must be 'user' or 'admin'", "status": 400}), 400

    # Admin apna role nahi badal sakta
    if current_admin.id == user_id and new_role == "user":
        return jsonify({"error": "You cannot remove your own admin role", "status": 400}), 400

    user = db.get_or_404(User, user_id)
    user.role = new_role
    db.session.commit()
    return jsonify({"user": user.to_dict()})
