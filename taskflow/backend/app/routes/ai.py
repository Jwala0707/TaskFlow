"""
AI-powered endpoints using Groq (llama3-8b-8192).

Two features:
1. POST /api/ai/parse-task   — natural language → structured task fields
2. POST /api/ai/suggest-tasks — project name/description → list of suggested tasks
"""
import json
import logging
import os

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from groq import Groq

ai_bp = Blueprint("ai", __name__)
logger = logging.getLogger(__name__)


def _get_client() -> Groq:
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set")
    return Groq(api_key=api_key)


@ai_bp.post("/parse-task")
@jwt_required()
def parse_task():
    """
    Convert a natural language string into structured task fields.

    Request:  { "text": "Fix login bug by Friday, high priority" }
    Response: { "title": "Fix login bug", "priority": "high",
                "due_date": "2024-...", "description": "..." }
    """
    body = request.get_json(silent=True) or {}
    text = (body.get("text") or "").strip()
    if not text:
        return jsonify({"error": "text is required", "status": 400}), 400

    prompt = f"""Extract task details from this text and return ONLY valid JSON with these fields:
- title (string, required): short task title
- description (string or null): longer description if mentioned
- priority (string): one of "low", "medium", "high" — infer from urgency words
- due_date (string or null): ISO 8601 date if a date/day is mentioned, else null

Text: "{text}"

Return ONLY the JSON object, no explanation."""

    try:
        client = _get_client()
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=300,
        )
        raw = response.choices[0].message.content.strip()

        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]

        parsed = json.loads(raw)

        # Sanitise — only return known fields
        result = {
            "title": str(parsed.get("title", text))[:500],
            "description": parsed.get("description"),
            "priority": parsed.get("priority", "medium") if parsed.get("priority") in ("low", "medium", "high") else "medium",
            "due_date": parsed.get("due_date"),
        }
        return jsonify(result)

    except RuntimeError as exc:
        return jsonify({"error": str(exc), "status": 503}), 503
    except (json.JSONDecodeError, KeyError) as exc:
        logger.warning("AI parse-task bad response: %s", exc)
        return jsonify({"error": "AI returned an unexpected response", "status": 502}), 502
    except Exception as exc:
        logger.exception("AI parse-task failed: %s", exc)
        return jsonify({"error": "AI service error", "status": 502}), 502


@ai_bp.post("/suggest-tasks")
@jwt_required()
def suggest_tasks():
    """
    Suggest tasks for a project based on its name and description.

    Request:  { "project_name": "E-commerce website",
                "description": "Online store with cart and payments" }
    Response: { "tasks": [{ "title": "...", "priority": "..." }, ...] }
    """
    body = request.get_json(silent=True) or {}
    project_name = (body.get("project_name") or "").strip()
    description = (body.get("description") or "").strip()

    if not project_name:
        return jsonify({"error": "project_name is required", "status": 400}), 400

    context = f'Project: "{project_name}"'
    if description:
        context += f'\nDescription: "{description}"'

    prompt = f"""Suggest 5 practical tasks for this software project. Return ONLY a JSON array of objects with:
- title (string): clear, actionable task title
- priority (string): "low", "medium", or "high"

{context}

Return ONLY the JSON array, no explanation."""

    try:
        client = _get_client()
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=500,
        )
        raw = response.choices[0].message.content.strip()

        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]

        tasks = json.loads(raw)
        if not isinstance(tasks, list):
            raise ValueError("Expected a list")

        sanitised = [
            {
                "title": str(t.get("title", ""))[:500],
                "priority": t.get("priority", "medium") if t.get("priority") in ("low", "medium", "high") else "medium",
            }
            for t in tasks[:8]
            if t.get("title")
        ]
        return jsonify({"tasks": sanitised})

    except RuntimeError as exc:
        return jsonify({"error": str(exc), "status": 503}), 503
    except (json.JSONDecodeError, ValueError, KeyError) as exc:
        logger.warning("AI suggest-tasks bad response: %s", exc)
        return jsonify({"error": "AI returned an unexpected response", "status": 502}), 502
    except Exception as exc:
        logger.exception("AI suggest-tasks failed: %s", exc)
        return jsonify({"error": "AI service error", "status": 502}), 502
