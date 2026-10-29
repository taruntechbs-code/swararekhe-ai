from fastapi.testclient import TestClient
import pytest
from backend.main import app

client = TestClient(app)


def test_isogloss_locate_core_heartland():
    """Test 1: Locate directly at Dharwad epicenter -> Core Dialect Heartland with >85% weight."""
    response = client.get("/api/v1/explorer/locate?lat=15.4589&lng=75.0078&phrase=Where are you going?")
    assert response.status_code == 200, f"Error: {response.text}"
    data = response.json()

    assert data["zone_classification"] == "Core Dialect Heartland"
    assert data["dominant_region_code"] == "hubballi_dharwad"
    top_weight = data["blend_weights"][0]
    assert top_weight["region_code"] == "hubballi_dharwad"
    assert top_weight["blend_percentage"] >= 85.0
    assert "hontir" in data["interpolated_phrase_result"]["morphed_dominant_roman"].lower() or "yallig" in data["interpolated_phrase_result"]["morphed_dominant_roman"].lower()
    assert abs(data["acoustic_interpolated_pitch_hz"] - 155.0) < 5.0


def test_isogloss_locate_transition_belt():
    """Test 2: Locate in transition corridor (Davanagere: 14.4644, 75.9218) -> Balanced blend weights."""
    response = client.get("/api/v1/explorer/locate?lat=14.4644&lng=75.9218&phrase=Where are you going?")
    assert response.status_code == 200, f"Error: {response.text}"
    data = response.json()

    assert data["zone_classification"] in [
        "Bi-Dialectal Isogloss Transition Belt",
        "Multi-Dialectal Convergence Zone",
    ]
    top_weight = data["blend_weights"][0]
    # No single region should possess over 65% in this intermediate corridor
    assert top_weight["blend_percentage"] < 65.0
    assert len(data["blend_weights"]) == 5
    assert len(data["active_border_substrates"]) > 0
    assert "transition" in data["interpolated_phrase_result"]["transition_notes"].lower() or "convergence" in data["interpolated_phrase_result"]["transition_notes"].lower()


def test_isogloss_geojson_map():
    """Test 3: Verify isogloss map exports standard GeoJSON with Points, Polygons, and LineStrings."""
    response = client.get("/api/v1/explorer/isogloss-map")
    assert response.status_code == 200, f"Error: {response.text}"
    data = response.json()

    assert data["type"] == "FeatureCollection"
    features = data["features"]
    assert len(features) >= 14

    geom_types = {f["geometry"]["type"] for f in features}
    assert "Point" in geom_types
    assert "Polygon" in geom_types
    assert "LineString" in geom_types


def test_community_submission_living_dictionary():
    """Test 4: Submit authentic regional phrase -> Auto-triaged & injected into NetworkX graph."""
    # First get baseline graph node count
    initial_stats = client.get("/api/v1/explorer/stats").json()
    initial_nodes = initial_stats["graph_nodes"]

    payload = {
        "contributor_name": "Ramesh Patil",
        "district_name": "Belagavi",
        "latitude": 15.8497,
        "longitude": 74.4977,
        "local_phrase_kannada": "ಚಲೋ ಐತ್ರಿ ಪಾ",
        "local_phrase_roman": "Cholo aytri pa",
        "standard_meaning_english": "It is very fine brother",
        "category": "greeting",
    }
    response = client.post("/api/v1/explorer/contribute", json=payload)
    assert response.status_code == 201, f"Error: {response.text}"
    data = response.json()

    assert data["ai_triage_status"] == "approved_injected"
    assert data["phonotactic_validity_score"] >= 0.70
    assert data["graph_node_injected"] is True
    assert data["nearest_region_code"] == "hubballi_dharwad"
    assert len(data["detected_morphological_markers"]) > 0

    # Verify that graph node count immediately increased by 1
    updated_stats = client.get("/api/v1/explorer/stats").json()
    assert updated_stats["graph_nodes"] == initial_nodes + 1
    assert updated_stats["community_submissions_total"] >= 1
    assert updated_stats["approved_living_entries"] >= 1

    # Cleanup test created row to maintain idempotency
    sub_id = data.get("submission_id")
    if sub_id:
        import sqlite3
        conn = sqlite3.connect("namma_kannada.db")
        c = conn.cursor()
        c.execute("DELETE FROM community_submissions WHERE id = ?", (sub_id,))
        conn.commit()
        conn.close()


def test_community_submission_spam_rejection():
    """Test 5: Spam text submitted -> Rejected as spam and not injected into graph."""
    spam_payload = {
        "contributor_name": "Spammer",
        "district_name": "Unknown",
        "latitude": 15.0,
        "longitude": 75.0,
        "local_phrase_roman": "http://spam-casino.com click here 1111111",
        "standard_meaning_english": "spam",
    }
    response = client.post("/api/v1/explorer/contribute", json=spam_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["ai_triage_status"] == "rejected_spam"
    assert data["graph_node_injected"] is False

    # Cleanup test spam row immediately so it never pollutes the live database
    sub_id = data.get("submission_id")
    if sub_id:
        import sqlite3
        conn = sqlite3.connect("namma_kannada.db")
        c = conn.cursor()
        c.execute("DELETE FROM community_submissions WHERE id = ?", (sub_id,))
        conn.commit()
        conn.close()


def test_list_submissions():
    """Test 6: Retrieve community submission list."""
    response = client.get("/api/v1/explorer/submissions")
    assert response.status_code == 200
    submissions = response.json()
    assert len(submissions) >= 1
    assert any(s["contributor_name"] == "Ramesh Patil" for s in submissions)

