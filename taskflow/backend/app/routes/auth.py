from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from marshmallow import ValidationError

from app import db
from app.models import User
from app.schemas import RegisterSchema, LoginSchema

auth_bp = Blueprint("auth", __name__)
_register_schema = RegisterSchema()
_login_schema = LoginSchema()


@auth_bp.post("/register")
def register():
    data = _register_schema.load(request.get_json(silent=True) or {})

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already registered", "status": 409}), 409

    user = User(email=data["email"], display_name=data["display_name"])
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    return jsonify({"user": user.to_dict(), "access_token": access_token, "refresh_token": refresh_token}), 201


@auth_bp.post("/login")
def login():
    data = _login_schema.load(request.get_json(silent=True) or {})

    user = User.query.filter_by(email=data["email"]).first()
    if not user or not user.check_password(data["password"]):
        return jsonify({"error": "Invalid credentials", "status": 401}), 401

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    return jsonify({"user": user.to_dict(), "access_token": access_token, "refresh_token": refresh_token})


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    return jsonify({"access_token": access_token})


@auth_bp.get("/me")
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = db.get_or_404(User, user_id)
    return jsonify({"user": user.to_dict()})
