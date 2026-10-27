from fastapi.testclient import TestClient
import pytest
from backend.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"
    assert data["region_count"] == 5
    assert data["lexicon_count"] >= 12
    assert data["variant_count"] >= 60


def test_get_dialect_regions():
    response = client.get("/api/v1/regions")
    assert response.status_code == 200
    regions = response.json()
    assert len(regions) == 5

    expected_codes = {
        "bengaluru_mysuru",
        "hubballi_dharwad",
        "kundapura_mangaluru",
        "kalaburagi_bidar",
        "arebhashe_kodagu",
    }
    returned_codes = {r["code"] for r in regions}
    assert returned_codes == expected_codes

    for r in regions:
        assert "center_lat" in r and 11.0 <= r["center_lat"] <= 19.0
        assert "center_lng" in r and 74.0 <= r["center_lng"] <= 79.0
        assert "border_influences" in r and isinstance(r["border_influences"], list)
        assert "prosody_profile" in r and isinstance(r["prosody_profile"], dict)
        assert len(r["prosody_profile"]) > 0


def test_get_lexicon():
    response = client.get("/api/v1/lexicon")
    assert response.status_code == 200
    lexicon = response.json()
    assert len(lexicon) >= 12

    for entry in lexicon:
        assert "standard_kannada" in entry
        assert "standard_roman" in entry
        assert "english_meaning" in entry
        assert "category" in entry
        assert "variants" in entry
        assert len(entry["variants"]) == 5, f"Entry {entry['standard_roman']} should have variants for all 5 regions"

        for v in entry["variants"]:
            assert "local_script" in v
            assert "local_phonetic" in v
            assert "ipa_pronunciation" in v
            assert "region" in v and v["region"]["code"] in {
                "bengaluru_mysuru",
                "hubballi_dharwad",
                "kundapura_mangaluru",
                "kalaburagi_bidar",
                "arebhashe_kodagu",
            }


def test_lexicon_filtering_by_category():
    response = client.get("/api/v1/lexicon?category=question")
    assert response.status_code == 200
    entries = response.json()
    assert len(entries) > 0
    for e in entries:
        assert e["category"] == "question"


def test_lexicon_filtering_by_region_code():
    response = client.get("/api/v1/lexicon?region_code=hubballi_dharwad")
    assert response.status_code == 200
    entries = response.json()
    assert len(entries) >= 12
    for e in entries:
        assert len(e["variants"]) == 1
        assert e["variants"][0]["region"]["code"] == "hubballi_dharwad"

