"""
Domain models. Each model enforces its own invariants — invalid states
are prevented at the database and application layer simultaneously.
"""
from __future__ import annotations

import enum
from datetime import datetime, timezone

import bcrypt
from sqlalchemy import CheckConstraint, event

from app import db


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class TaskStatus(str, enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class User(db.Model):
    __tablename__ = "users"

    id: int = db.Column(db.Integer, primary_key=True)
    email: str = db.Column(db.String(255), unique=True, nullable=False, index=True)
    display_name: str = db.Column(db.String(100), nullable=False)
    _password_hash: str = db.Column("password_hash", db.String(255), nullable=False)
    role: str = db.Column(db.String(20), nullable=False, default="user")  # "user" or "admin"
    created_at: datetime = db.Column(db.DateTime(timezone=True), default=_utcnow, nullable=False)

    projects = db.relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    assigned_tasks = db.relationship("Task", back_populates="assignee", foreign_keys="Task.assignee_id")

    def set_password(self, plaintext: str) -> None:
        if len(plaintext) < 8:
            raise ValueError("Password must be at least 8 characters")
        self._password_hash = bcrypt.hashpw(plaintext.encode(), bcrypt.gensalt()).decode()

    def check_password(self, plaintext: str) -> bool:
        return bcrypt.checkpw(plaintext.encode(), self._password_hash.encode())

    def is_admin(self) -> bool:
        return self.role == "admin"

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "email": self.email,
            "display_name": self.display_name,
            "role": self.role,
        }


class Project(db.Model):
    __tablename__ = "projects"

    id: int = db.Column(db.Integer, primary_key=True)
    name: str = db.Column(db.String(200), nullable=False)
    description: str = db.Column(db.Text, nullable=True)
    owner_id: int = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at: datetime = db.Column(db.DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at: datetime = db.Column(db.DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False)

    owner = db.relationship("User", back_populates="projects")
    tasks = db.relationship("Task", back_populates="project", cascade="all, delete-orphan", order_by="Task.position")

    def to_dict(self, include_tasks: bool = False) -> dict:
        data = {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "owner_id": self.owner_id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "task_count": len(self.tasks),
        }
        if include_tasks:
            data["tasks"] = [t.to_dict() for t in self.tasks]
        return data


class Task(db.Model):
    __tablename__ = "tasks"
    __table_args__ = (
        CheckConstraint("position >= 0", name="ck_task_position_non_negative"),
    )

    id: int = db.Column(db.Integer, primary_key=True)
    title: str = db.Column(db.String(500), nullable=False)
    description: str = db.Column(db.Text, nullable=True)
    status: str = db.Column(
        db.Enum(TaskStatus, values_callable=lambda e: [x.value for x in e]),
        nullable=False,
        default=TaskStatus.TODO.value,
    )
    priority: str = db.Column(
        db.Enum(TaskPriority, values_callable=lambda e: [x.value for x in e]),
        nullable=False,
        default=TaskPriority.MEDIUM.value,
    )
    position: int = db.Column(db.Integer, nullable=False, default=0)
    due_date: datetime = db.Column(db.DateTime(timezone=True), nullable=True)
    project_id: int = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=False)
    assignee_id: int = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_at: datetime = db.Column(db.DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at: datetime = db.Column(db.DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False)

    project = db.relationship("Project", back_populates="tasks")
    assignee = db.relationship("User", back_populates="assigned_tasks", foreign_keys=[assignee_id])

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "priority": self.priority,
            "position": self.position,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "project_id": self.project_id,
            "assignee": self.assignee.to_dict() if self.assignee else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
