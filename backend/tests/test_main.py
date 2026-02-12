"""
Unit tests for the visitor_counter Cloud Function.

Uses unittest.mock to stub out Firestore so tests run without
a real GCP project / emulator.
"""

import json
import unittest
from unittest.mock import MagicMock, patch


class FakeRequest:
    """Minimal stand-in for a Flask/functions-framework request."""

    def __init__(self, method="GET"):
        self.method = method


class TestVisitorCounter(unittest.TestCase):
    """Tests for the visitor_counter Cloud Function."""

    @patch("main.firestore")
    def test_get_returns_current_count(self, mock_firestore):
        """GET should return the current counter value."""
        # Arrange
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {"count": 42}

        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_doc

        mock_collection = MagicMock()
        mock_collection.document.return_value = mock_doc_ref

        mock_client = MagicMock()
        mock_client.collection.return_value = mock_collection
        mock_firestore.Client.return_value = mock_client

        # Re-import so the patched client is used
        import importlib
        import main as module
        module.db = mock_client

        # Act
        body, status, headers = module.visitor_counter(FakeRequest("GET"))
        data = json.loads(body)

        # Assert
        self.assertEqual(status, 200)
        self.assertEqual(data["count"], 42)
        self.assertIn("Access-Control-Allow-Origin", headers)

    @patch("main.firestore")
    def test_post_increments_count(self, mock_firestore):
        """POST should increment the counter by 1."""
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {"count": 10}

        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_doc

        mock_collection = MagicMock()
        mock_collection.document.return_value = mock_doc_ref

        mock_client = MagicMock()
        mock_client.collection.return_value = mock_collection
        mock_firestore.Client.return_value = mock_client

        import main as module
        module.db = mock_client

        body, status, headers = module.visitor_counter(FakeRequest("POST"))
        data = json.loads(body)

        self.assertEqual(status, 200)
        self.assertEqual(data["count"], 11)
        mock_doc_ref.update.assert_called_once_with({"count": 11})

    @patch("main.firestore")
    def test_options_returns_204(self, mock_firestore):
        """OPTIONS (CORS preflight) should return 204 with CORS headers."""
        mock_client = MagicMock()
        mock_firestore.Client.return_value = mock_client

        import main as module
        module.db = mock_client

        body, status, headers = module.visitor_counter(FakeRequest("OPTIONS"))

        self.assertEqual(status, 204)
        self.assertEqual(body, "")
        self.assertIn("Access-Control-Allow-Origin", headers)
        self.assertIn("Access-Control-Allow-Methods", headers)

    @patch("main.firestore")
    def test_get_creates_counter_if_missing(self, mock_firestore):
        """GET on a fresh Firestore should create the counter at 0."""
        mock_doc = MagicMock()
        mock_doc.exists = False

        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_doc

        mock_collection = MagicMock()
        mock_collection.document.return_value = mock_doc_ref

        mock_client = MagicMock()
        mock_client.collection.return_value = mock_collection
        mock_firestore.Client.return_value = mock_client

        import main as module
        module.db = mock_client

        body, status, _ = module.visitor_counter(FakeRequest("GET"))
        data = json.loads(body)

        self.assertEqual(status, 200)
        self.assertEqual(data["count"], 0)
        mock_doc_ref.set.assert_called_once_with({"count": 0})


if __name__ == "__main__":
    unittest.main()
