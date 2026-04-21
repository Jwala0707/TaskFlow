"""
Marshmallow schemas act as the contract boundary between HTTP and domain logic.
All input is validated here before touching the database.
"""
from marshmallow import Schema, fields, validate, validates, ValidationError, post_load
from app.models import TaskStatus, TaskPriority


class RegisterSchema(Schema):
    email = fields.Email(required=True)
    display_name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    password = fields.Str(required=True, load_only=True, validate=validate.Length(min=8))


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True)


class ProjectCreateSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    description = fields.Str(load_default=None, validate=validate.Length(max=2000))


class ProjectUpdateSchema(Schema):
    name = fields.Str(validate=validate.Length(min=1, max=200))
    description = fields.Str(validate=validate.Length(max=2000), allow_none=True)


class TaskCreateSchema(Schema):
    title = fields.Str(required=True, validate=validate.Length(min=1, max=500))
    description = fields.Str(load_default=None, validate=validate.Length(max=5000))
    status = fields.Str(
        load_default=TaskStatus.TODO.value,
        validate=validate.OneOf([s.value for s in TaskStatus]),
    )
    priority = fields.Str(
        load_default=TaskPriority.MEDIUM.value,
        validate=validate.OneOf([p.value for p in TaskPriority]),
    )
    due_date = fields.DateTime(load_default=None, allow_none=True)
    assignee_id = fields.Int(load_default=None, allow_none=True)
    position = fields.Int(load_default=0, validate=validate.Range(min=0))


class TaskUpdateSchema(Schema):
    title = fields.Str(validate=validate.Length(min=1, max=500))
    description = fields.Str(validate=validate.Length(max=5000), allow_none=True)
    status = fields.Str(validate=validate.OneOf([s.value for s in TaskStatus]))
    priority = fields.Str(validate=validate.OneOf([p.value for p in TaskPriority]))
    due_date = fields.DateTime(allow_none=True)
    assignee_id = fields.Int(allow_none=True)
    position = fields.Int(validate=validate.Range(min=0))


class TaskReorderSchema(Schema):
    task_ids = fields.List(fields.Int(), required=True, validate=validate.Length(min=1))
