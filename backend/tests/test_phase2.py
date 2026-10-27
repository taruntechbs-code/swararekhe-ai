from fastapi.testclient import TestClient
import pytest
from backend.main import app

client = TestClient(app)


def test_morph_direct_seed_match():
    """Test 1: Direct seed match morphing across all 5 regions."""
    payload = {
        "text": "Where are you going?",
        "source_lang": "en",
        "target_region_code": "all",
    }
    response = client.post("/api/v1/morph/translate", json=payload)
    assert response.status_code == 200, f"Error: {response.text}"
    data = response.json()

    assert data["input_text"] == "Where are you going?"
    assert data["matched_seed_concept"] is not None
    assert len(data["results"]) == 5

    res_by_code = {r["region_code"]: r for r in data["results"]}
    assert "hubballi_dharwad" in res_by_code
    assert "kundapura_mangaluru" in res_by_code
    assert "kalaburagi_bidar" in res_by_code
    assert "arebhashe_kodagu" in res_by_code
    assert "bengaluru_mysuru" in res_by_code

    # Verify linguistic tokens in results
    dharwad = res_by_code["hubballi_dharwad"]
    assert "hontir" in dharwad["morphed_phonetic_roman"].lower() or "hog" in dharwad["morphed_phonetic_roman"].lower()
    assert dharwad["syllable_stress_breakdown"] != ""
    assert dharwad["ipa_approximation"] != ""
    assert len(dharwad["word_by_word_diff"]) > 0

    kundapura = res_by_code["kundapura_mangaluru"]
    assert "yathak" in kundapura["morphed_phonetic_roman"].lower() or "hoit" in kundapura["morphed_phonetic_roman"].lower()

    kalaburagi = res_by_code["kalaburagi_bidar"]
    assert "hoglikattiri" in kalaburagi["morphed_phonetic_roman"].lower() or "yallig" in kalaburagi["morphed_phonetic_roman"].lower()

    arebhashe = res_by_code["arebhashe_kodagu"]
    assert "ettak" in arebhashe["morphed_phonetic_roman"].lower() or "hogde" in arebhashe["morphed_phonetic_roman"].lower()


def test_morph_unseen_composite_phrase():
    """Test 2: Unseen composite phrase rule transduction in Roman Kannada."""
    phrase = "Neenu ellige hoguttiddiya? Oota chennagide, tumba beku"
    payload = {
        "text": phrase,
        "source_lang": "kn",
        "target_region_code": "all",
    }
    response = client.post("/api/v1/morph/translate", json=payload)
    assert response.status_code == 200, f"Error: {response.text}"
    data = response.json()

    assert len(data["results"]) == 5
    res_by_code = {r["region_code"]: r for r in data["results"]}

    # Dharwad checks
    dharwad = res_by_code["hubballi_dharwad"]
    dharwad_roman = dharwad["morphed_phonetic_roman"].lower()
    assert "yallig" in dharwad_roman
    assert "cholo ayti" in dharwad_roman or "cholo" in dharwad_roman
    assert "bhaal" in dharwad_roman
    assert "bekri" in dharwad_roman
    assert dharwad["engine_mode"] in ["deterministic_symbolic", "hybrid_llm_symbolic"]
    assert len(dharwad["morphological_rules_triggered"]) >= 3

    # Kundapura checks
    kundapura = res_by_code["kundapura_mangaluru"]
    kundapura_roman = kundapura["morphed_phonetic_roman"].lower()
    assert "yathak" in kundapura_roman
    assert "hoitiddiya" in kundapura_roman
    assert "laayk" in kundapura_roman
    assert "baari" in kundapura_roman

    # Kalaburagi checks
    kalaburagi = res_by_code["kalaburagi_bidar"]
    kalaburagi_roman = kalaburagi["morphed_phonetic_roman"].lower()
    assert "yallig" in kalaburagi_roman
    assert "cholo ada" in kalaburagi_roman or "ada" in kalaburagi_roman
    assert "mast" in kalaburagi_roman
    assert "nodri" in kalaburagi_roman

    # Arebhashe checks
    arebhashe = res_by_code["arebhashe_kodagu"]
    arebhashe_roman = arebhashe["morphed_phonetic_roman"].lower()
    assert "yettak" in arebhashe_roman
    assert "hogde" in arebhashe_roman
    assert "cholo ulla" in arebhashe_roman or "ulla" in arebhashe_roman


def test_morph_single_region_targeting():
    """Test 3: Targeting specific individual regions."""
    # Hubballi-Dharwad only
    payload_dharwad = {
        "text": "chennagide tumba beku",
        "source_lang": "kn",
        "target_region_code": "hubballi_dharwad",
    }
    resp1 = client.post("/api/v1/morph/translate", json=payload_dharwad)
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert len(data1["results"]) == 1
    assert data1["results"][0]["region_code"] == "hubballi_dharwad"
    assert "cholo ayti" in data1["results"][0]["morphed_phonetic_roman"].lower()

    # Kundapura-Mangaluru only
    payload_kundapura = {
        "text": "huduga ellige hoguttiddiya?",
        "source_lang": "kn",
        "target_region_code": "kundapura_mangaluru",
    }
    resp2 = client.post("/api/v1/morph/translate", json=payload_kundapura)
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert len(data2["results"]) == 1
    assert data2["results"][0]["region_code"] == "kundapura_mangaluru"
    assert "maani" in data2["results"][0]["morphed_phonetic_roman"].lower()
    assert "yathak" in data2["results"][0]["morphed_phonetic_roman"].lower()


def test_morph_invalid_region_code():
    """Test 4: Invalid region code returns 404."""
    payload = {
        "text": "hello",
        "source_lang": "en",
        "target_region_code": "non_existent_region",
    }
    resp = client.post("/api/v1/morph/translate", json=payload)
    assert resp.status_code == 404
    assert "Invalid target_region_code" in resp.json()["detail"]


def test_get_morph_rules():
    """Test 5: Retrieve documented rulebook."""
    resp = client.get("/api/v1/morph/rules")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_regions"] == 5
    assert "hubballi_dharwad" in data["rulebook"]
    assert "kundapura_mangaluru" in data["rulebook"]

    dharwad_profile = data["rulebook"]["hubballi_dharwad"]
    assert len(dharwad_profile["lexical_substitutions"]) > 0
    assert len(dharwad_profile["suffix_rules"]) > 0
    assert dharwad_profile["prosody_summary"] != ""
