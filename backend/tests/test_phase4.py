import os
from fastapi.testclient import TestClient
import pytest
from backend.main import app
from backend.services.acoustic_engine import AUDIO_DIR, REGIONS_ACOUSTIC_CONFIG

client = TestClient(app)


def test_synthetic_wav_files_presence():
    """Test 1: Verify all 5 regional synthetic WAV samples are created on startup."""
    assert os.path.isdir(AUDIO_DIR), f"Directory {AUDIO_DIR} does not exist"

    for reg_code, cfg in REGIONS_ACOUSTIC_CONFIG.items():
        wav_path = os.path.join(AUDIO_DIR, cfg["filename"])
        assert os.path.exists(wav_path), f"Sample file {wav_path} not found"
        file_size = os.path.getsize(wav_path)
        assert file_size > 1000, f"File {wav_path} is suspiciously small ({file_size} bytes)"


def test_get_acoustic_profile():
    """Test 2: Retrieve reference pitch contour and cadence metrics for hubballi_dharwad."""
    response = client.get("/api/v1/acoustic/profile/hubballi_dharwad")
    assert response.status_code == 200, f"Error: {response.text}"
    data = response.json()

    assert data["region_code"] == "hubballi_dharwad"
    assert data["sample_audio_filename"] == "hubballi_dharwad.wav"
    assert len(data["f0_pitch_curve"]) == 50
    assert len(data["energy_envelope"]) == 50

    metrics = data["cadence_metrics"]
    assert metrics["pitch_mean_hz"] > 100.0
    assert metrics["pitch_std_dev"] > 0.0
    assert metrics["pitch_range_hz"] > 20.0
    assert metrics["estimated_syllable_rate_hz"] > 1.0
    assert "rising" in metrics["cadence_rhythm_type"] or metrics["terminal_inflection_slope"] > 0.0


def test_get_acoustic_profile_invalid():
    """Test invalid region code returns 404."""
    response = client.get("/api/v1/acoustic/profile/non_existent_zone")
    assert response.status_code == 404


def test_analyze_cadence_sample_code():
    """Test 3: POST /api/v1/acoustic/analyze with sample_code against target region."""
    # Analyze Dharwad sample against Dharwad benchmark
    res_dharwad = client.post(
        "/api/v1/acoustic/analyze",
        data={
            "sample_code": "hubballi_dharwad",
            "target_region_code": "hubballi_dharwad",
        },
    )
    assert res_dharwad.status_code == 200, f"Error: {res_dharwad.text}"
    dharwad_data = res_dharwad.json()

    assert dharwad_data["cadence_match_score"] >= 80.0
    assert len(dharwad_data["coaching_feedback"]) > 0
    assert "user_f0" in dharwad_data["pitch_contour_comparison"]
    assert "reference_f0" in dharwad_data["pitch_contour_comparison"]

    # Cross-regional analysis: Kalaburagi sample vs Dharwad benchmark (drawl vs sharp rise)
    res_mismatch = client.post(
        "/api/v1/acoustic/analyze",
        data={
            "sample_code": "kalaburagi_bidar",
            "target_region_code": "hubballi_dharwad",
        },
    )
    assert res_mismatch.status_code == 200
    mismatch_data = res_mismatch.json()

    # Mismatched region should score lower
    assert mismatch_data["cadence_match_score"] < dharwad_data["cadence_match_score"]
    # Check for specific actionable coaching feedback
    feedback_text = " ".join(mismatch_data["coaching_feedback"])
    assert "Inflection" in feedback_text or "Tempo" in feedback_text or "Cadence" in feedback_text


def test_analyze_cadence_file_upload():
    """Test 4: POST /api/v1/acoustic/analyze with uploaded audio bytes."""
    sample_file = os.path.join(AUDIO_DIR, "kundapura_mangaluru.wav")
    assert os.path.exists(sample_file)

    with open(sample_file, "rb") as f:
        file_bytes = f.read()

    response = client.post(
        "/api/v1/acoustic/analyze",
        data={"target_region_code": "kundapura_mangaluru"},
        files={"audio_file": ("kundapura.wav", file_bytes, "audio/wav")},
    )
    assert response.status_code == 200, f"Error: {response.text}"
    data = response.json()
    assert data["target_region_code"] == "kundapura_mangaluru"
    assert data["cadence_match_score"] >= 80.0

