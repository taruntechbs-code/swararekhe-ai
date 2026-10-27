"""
Standalone verification script for Phase 4:
Acoustic Prosody, Pitch Contour (F0), and Dialect Cadence DSP Engine.
"""
import os
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.acoustic_engine import AUDIO_DIR, REGIONS_ACOUSTIC_CONFIG


def run_phase4_verification():
    client = TestClient(app)
    print("=" * 80)
    print("SWARAREKHE — NAMMA KANNADA ENGINE: PHASE 4 VERIFICATION")
    print("Acoustic Prosody, Pitch Contour (F0) & Cadence DSP Engine")
    print("=" * 80)

    # 1. Synthetic WAV Samples Verification
    print("\n[1/4] Verifying Synthetic Regional WAV Sample Generation...")
    print(f"  Storage Directory: {AUDIO_DIR}")
    for reg_code, cfg in REGIONS_ACOUSTIC_CONFIG.items():
        wav_path = os.path.join(AUDIO_DIR, cfg["filename"])
        assert os.path.exists(wav_path), f"Missing: {wav_path}"
        size_kb = os.path.getsize(wav_path) / 1024.0
        print(f"    * [{reg_code}] {cfg['filename']} ({size_kb:.1f} KB) - Cadence: {cfg['cadence_type']}")

    # 2. Regional Acoustic Profiles (F0 contours & Cadence Metrics)
    print("\n[2/4] Testing GET /api/v1/acoustic/profile/{region_code} ...")
    for reg_code in ["hubballi_dharwad", "kundapura_mangaluru", "kalaburagi_bidar"]:
        res_prof = client.get(f"/api/v1/acoustic/profile/{reg_code}")
        assert res_prof.status_code == 200, f"Profile failed: {res_prof.text}"
        prof = res_prof.json()
        m = prof["cadence_metrics"]
        print(f"    * [{reg_code}] {prof['region_name']}:")
        print(f"      F0 Mean: {m['pitch_mean_hz']:.1f} Hz | Range: {m['pitch_range_hz']:.1f} Hz | Std: {m['pitch_std_dev']:.1f} Hz")
        print(f"      Terminal Slope: {m['terminal_inflection_slope']:+.2f} Hz/frame | Syllable Rate: {m['estimated_syllable_rate_hz']:.1f} Hz")
        print(f"      Cadence Tag:    {m['cadence_rhythm_type']}")
        print(f"      F0 Contour:     [{', '.join(f'{v:.1f}' for v in prof['f0_pitch_curve'][:5])} ... {', '.join(f'{v:.1f}' for v in prof['f0_pitch_curve'][-3:])}]")

    # 3. DSP Cadence Analysis (Self-match vs Cross-regional mismatch)
    print("\n[3/4] Testing POST /api/v1/acoustic/analyze ...")
    # A. Dharwad self-match
    res_self = client.post(
        "/api/v1/acoustic/analyze",
        data={"sample_code": "hubballi_dharwad", "target_region_code": "hubballi_dharwad"},
    )
    assert res_self.status_code == 200
    self_data = res_self.json()
    print(f"  A. Dharwad Voice against Dharwad Benchmark:")
    print(f"     Match Score:       {self_data['cadence_match_score']:.1f}%")
    print(f"     Coaching Feedback: {self_data['coaching_feedback'][0]}")

    # B. Kalaburagi drawl vs Dharwad rising terminal
    res_cross = client.post(
        "/api/v1/acoustic/analyze",
        data={"sample_code": "kalaburagi_bidar", "target_region_code": "hubballi_dharwad"},
    )
    assert res_cross.status_code == 200
    cross_data = res_cross.json()
    print(f"\n  B. Kalaburagi Drawl against Dharwad Benchmark:")
    print(f"     Match Score:       {cross_data['cadence_match_score']:.1f}%")
    print(f"     Coaching Feedback:")
    for tip in cross_data["coaching_feedback"]:
        print(f"       - {tip}")

    assert self_data["cadence_match_score"] > cross_data["cadence_match_score"]

    # 4. Direct WAV File Upload Test
    print("\n[4/4] Testing Direct Audio File Upload via multipart/form-data ...")
    sample_wav = os.path.join(AUDIO_DIR, "kundapura_mangaluru.wav")
    with open(sample_wav, "rb") as f:
        file_bytes = f.read()

    res_upload = client.post(
        "/api/v1/acoustic/analyze",
        data={"target_region_code": "kundapura_mangaluru"},
        files={"audio_file": ("coastal_input.wav", file_bytes, "audio/wav")},
    )
    assert res_upload.status_code == 200
    upload_data = res_upload.json()
    print(f"  Uploaded 'coastal_input.wav' analyzed successfully!")
    print(f"  Match Score with Coastal Benchmark: {upload_data['cadence_match_score']:.1f}%")
    print(f"  Detected Syllable Rate:              {upload_data['user_cadence_metrics']['estimated_syllable_rate_hz']:.1f} syllables/sec")

    print("\n" + "=" * 80)
    print("ALL PHASE 4 VERIFICATION CHECKS PASSED (200 OK)!")
    print("=" * 80)


if __name__ == "__main__":
    run_phase4_verification()
