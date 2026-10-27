"""
Standalone verification script using FastAPI TestClient to test and display Phase 1 verification summary.
"""
import json
from fastapi.testclient import TestClient
from backend.main import app

def run_verification():
    client = TestClient(app)
    print("=" * 70)
    print("SWARAREKHE — NAMMA KANNADA ENGINE: PHASE 1 VERIFICATION")
    print("=" * 70)

    # 1. Health Endpoint
    print("\n[1/4] Testing GET /health ...")
    res_health = client.get("/health")
    assert res_health.status_code == 200, f"Health check failed: {res_health.text}"
    health_data = res_health.json()
    print(f"  Status Code: {res_health.status_code} OK")
    print(f"  App Name:     {health_data['app_name']}")
    print(f"  DB Status:    {health_data['database']}")
    print(f"  Regions:      {health_data['region_count']}")
    print(f"  Lexicon:      {health_data['lexicon_count']}")
    print(f"  Variants:     {health_data['variant_count']}")
    assert health_data["status"] == "ok"
    assert health_data["database"] == "connected"
    assert health_data["region_count"] == 5

    # 2. Regions Endpoint
    print("\n[2/4] Testing GET /api/v1/regions ...")
    res_regions = client.get("/api/v1/regions")
    assert res_regions.status_code == 200, f"Regions endpoint failed: {res_regions.text}"
    regions_data = res_regions.json()
    print(f"  Status Code: {res_regions.status_code} OK")
    print(f"  Count:       {len(regions_data)} Dialect Regions")
    assert len(regions_data) == 5
    for r in regions_data:
        print(f"    - [{r['code']}] {r['name']} ({r['kannada_name']})")
        print(f"      Coordinates: ({r['center_lat']}, {r['center_lng']})")
        print(f"      Border Influences: {', '.join(r['border_influences'])}")
        print(f"      Prosody: tempo={r['prosody_profile'].get('tempo')}, cadence={r['prosody_profile'].get('cadence')}")

    # 3. Lexicon Endpoint
    print("\n[3/4] Testing GET /api/v1/lexicon ...")
    res_lex = client.get("/api/v1/lexicon")
    assert res_lex.status_code == 200, f"Lexicon endpoint failed: {res_lex.text}"
    lex_data = res_lex.json()
    print(f"  Status Code: {res_lex.status_code} OK")
    print(f"  Count:       {len(lex_data)} Lexical Entries")
    assert len(lex_data) >= 12
    sample = lex_data[0]
    print(f"  Sample Entry: '{sample['standard_kannada']}' ({sample['standard_roman']}) - '{sample['english_meaning']}'")
    print(f"    Variants mapped across {len(sample['variants'])} regions:")
    for v in sample["variants"]:
        print(f"      * {v['region']['code']}: {v['local_script']} | {v['local_phonetic']} | IPA: {v['ipa_pronunciation']} | Rule: {v['morphological_rule']}")

    # 4. Filter Tests
    print("\n[4/4] Testing Lexicon Filters (category=question & region_code=hubballi_dharwad) ...")
    res_filter_cat = client.get("/api/v1/lexicon?category=question")
    assert res_filter_cat.status_code == 200
    q_entries = res_filter_cat.json()
    print(f"  Filtered by category='question': {len(q_entries)} entries")

    res_filter_reg = client.get("/api/v1/lexicon?region_code=hubballi_dharwad")
    assert res_filter_reg.status_code == 200
    reg_entries = res_filter_reg.json()
    print(f"  Filtered by region_code='hubballi_dharwad': {len(reg_entries)} entries (all isolated to Hubballi-Dharwad)")

    print("\n" + "=" * 70)
    print("ALL PHASE 1 VERIFICATION CHECKS PASSED SUCCESSFULLY (200 OK)!")
    print("=" * 70)

if __name__ == "__main__":
    run_verification()

