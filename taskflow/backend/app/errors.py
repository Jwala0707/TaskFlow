"""
Centralised error handling. Every error returns a consistent JSON envelope
so the frontend can handle errors uniformly.
"""
import logging
from flask import Flask, jsonify
from marshmallow import ValidationError
from werkzeug.exceptions import HTTPException

logger = logging.getLogger(__name__)


def _error_response(message: str, status: int, details: dict | None = None):
    body = {"error": message, "status": status}
    if details:
        body["details"] = details
    return jsonify(body), status


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(ValidationError)
    def handle_validation_error(exc: ValidationError):
        return _error_response("Validation failed", 422, exc.messages)

    @app.errorhandler(400)
    def bad_request(exc):
        return _error_response(str(exc.description), 400)

    @app.errorhandler(401)
    def unauthorized(exc):
        return _error_response("Authentication required", 401)

    @app.errorhandler(403)
    def forbidden(exc):
        return _error_response("Access denied", 403)

    @app.errorhandler(404)
    def not_found(exc):
        return _error_response("Resource not found", 404)

    @app.errorhandler(HTTPException)
    def handle_http(exc: HTTPException):
        return _error_response(exc.description, exc.code)

    @app.errorhandler(Exception)
    def handle_unexpected(exc: Exception):
        logger.exception("Unhandled exception: %s", exc)
        return _error_response("An unexpected error occurred", 500)
