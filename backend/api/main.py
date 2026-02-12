"""
Cloud Resume Challenge — Visitor & Interaction API
Google Cloud Function (2nd gen) backed by Firestore.

Routes (path-based):
  /                → site visitor counter  (GET = read, POST = increment)
  /blog            → blog page view counter (GET = read, POST = increment)
  /interactions     → blog post reactions   (GET = read all, POST = toggle)
"""

import functions_framework
from google.cloud import firestore
import json


# Firestore client — initialized once per cold start
db = firestore.Client()


# --------------------------------------------------
# CORS
# --------------------------------------------------
def _cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }


def _json_response(data, status=200):
    headers = {**_cors_headers(), "Content-Type": "application/json"}
    return (json.dumps(data), status, headers)


# --------------------------------------------------
# Generic counter helpers  (used for site + blog views)
# --------------------------------------------------
def _get_count(collection, document):
    doc_ref = db.collection(collection).document(document)
    doc = doc_ref.get()
    if doc.exists:
        return doc.to_dict().get("count", 0)
    doc_ref.set({"count": 0})
    return 0


def _increment_count(collection, document):
    doc_ref = db.collection(collection).document(document)
    doc = doc_ref.get()
    if not doc.exists:
        doc_ref.set({"count": 1})
        return 1
    doc_ref.update({"count": firestore.Increment(1)})
    updated = doc_ref.get()
    return updated.to_dict().get("count", 0)


# --------------------------------------------------
# Interaction helpers  (likes, thumbs-up, etc.)
# --------------------------------------------------
INTERACTIONS_COLLECTION = "interactions"


def _get_interactions():
    """Return all interaction counts as {postId_type: count}."""
    docs = db.collection(INTERACTIONS_COLLECTION).stream()
    result = {}
    for doc in docs:
        data = doc.to_dict()
        result[doc.id] = data.get("count", 0)
    return result


def _toggle_interaction(post_id, reaction_type, action):
    """Increment or decrement a reaction count. Returns new count."""
    doc_id = f"{post_id}_{reaction_type}"
    doc_ref = db.collection(INTERACTIONS_COLLECTION).document(doc_id)
    doc = doc_ref.get()

    if action == "add":
        if not doc.exists:
            doc_ref.set({"count": 1, "post_id": post_id, "type": reaction_type})
            return 1
        doc_ref.update({"count": firestore.Increment(1)})
    else:  # "remove"
        if not doc.exists:
            doc_ref.set({"count": 0, "post_id": post_id, "type": reaction_type})
            return 0
        doc_ref.update({"count": firestore.Increment(-1)})

    updated = doc_ref.get()
    return max(0, updated.to_dict().get("count", 0))


# --------------------------------------------------
# Cloud Function entry point
# --------------------------------------------------
@functions_framework.http
def visitor_counter(request):
    headers = _cors_headers()

    if request.method == "OPTIONS":
        return ("", 204, headers)

    path = request.path.rstrip("/") or "/"

    try:
        # --- Blog view counter ---
        if path == "/blog":
            if request.method == "POST":
                count = _increment_count("counters", "blog_views")
                return _json_response({"count": count})
            count = _get_count("counters", "blog_views")
            return _json_response({"count": count})

        # --- Download counter ---
        if path == "/downloads":
            if request.method == "POST":
                count = _increment_count("counters", "pdf_downloads")
                return _json_response({"count": count})
            count = _get_count("counters", "pdf_downloads")
            return _json_response({"count": count})

        # --- Blog interactions (likes, thumbs-up, etc.) ---
        if path == "/interactions":
            if request.method == "POST":
                body = request.get_json(silent=True) or {}
                post_id = body.get("postId", "")
                reaction_type = body.get("type", "")
                action = body.get("action", "add")  # "add" or "remove"
                if not post_id or not reaction_type:
                    return _json_response({"error": "postId and type required"}, 400)
                count = _toggle_interaction(post_id, reaction_type, action)
                return _json_response({"postId": post_id, "type": reaction_type, "count": count})
            # GET → return all interactions
            data = _get_interactions()
            return _json_response(data)

        # --- Default: site visitor counter ---
        if request.method == "POST":
            count = _increment_count("counters", "visitor_count")
            return _json_response({"count": count})
        count = _get_count("counters", "visitor_count")
        return _json_response({"count": count})

    except Exception as e:
        return _json_response({"error": str(e)}, 500)
