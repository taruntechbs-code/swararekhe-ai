"""
Standalone verification script for Phase 2:
Neuro-Symbolic Dialect Morphing & Phonetic Transduction Engine.
"""
import json
from fastapi.testclient import TestClient
from backend.main import app


def run_phase2_verification():
    client = TestClient(app)
    print("=" * 80)
    print("SWARAREKHE — NAMMA KANNADA ENGINE: PHASE 2 VERIFICATION")
    print("Neuro-Symbolic Dialect Morphing & Phonetic Transduction")
    print("=" * 80)

    # 1. Direct Seed Match Test
    print("\n[1/4] Testing Direct Seed Match Morphing (e.g. 'Where are you going?' -> all 5 regions)...")
    res1 = client.post(
        "/api/v1/morph/translate",
        json={"text": "Where are you going?", "source_lang": "en", "target_region_code": "all"},
    )
    assert res1.status_code == 200, f"Failed: {res1.text}"
    data1 = res1.json()
    print(f"  Input:                 '{data1['input_text']}'")
    print(f"  Matched Seed Concept:  {data1['matched_seed_concept']}")
    print(f"  Total Regional Outputs: {len(data1['results'])}")
    for r in data1["results"]:
        print(f"    * [{r['region_code']}] {r['region_name']}:")
        print(f"      Kannada Script:  {r['morphed_kannada_script']}")
        print(f"      Roman Phonetic:  {r['morphed_phonetic_roman']}")
        print(f"      IPA:             {r['ipa_approximation']}")
        print(f"      Syllable Stress: {r['syllable_stress_breakdown']}")
        print(f"      Engine Mode:     {r['engine_mode']} (Confidence: {r['confidence_score']:.2f})")

    # 2. Unseen Composite Phrase Rule Transduction Test
    print("\n[2/4] Testing Unseen Composite Phrase Transduction in Roman Kannada...")
    composite_phrase = "Neenu ellige hoguttiddiya? Oota chennagide, tumba beku"
    print(f"  Input: '{composite_phrase}'")
    res2 = client.post(
        "/api/v1/morph/translate",
        json={"text": composite_phrase, "source_lang": "kn", "target_region_code": "all"},
    )
    assert res2.status_code == 200, f"Failed: {res2.text}"
    data2 = res2.json()
    for r in data2["results"]:
        print(f"\n    * [{r['region_code']}] {r['region_name']}:")
        print(f"      Morphed Script:  {r['morphed_kannada_script']}")
        print(f"      Morphed Roman:   {r['morphed_phonetic_roman']}")
        print(f"      Syllable Stress: {r['syllable_stress_breakdown']}")
        print(f"      Rules Applied:   {', '.join(r['morphological_rules_triggered'])}")
        print(f"      Word-by-Word Diff ({len(r['word_by_word_diff'])} items):")
        for diff in r["word_by_word_diff"][:4]:
            if diff["rule_applied"] != "identity_pass_through":
                print(f"        - '{diff['source_token']}' -> '{diff['target_token_roman']}' [{diff['rule_applied']}]: {diff['explanation']}")

    # 3. Single-Region Targeting Test
    print("\n[3/4] Testing Targeted Single-Region Morphing...")
    for target in ["hubballi_dharwad", "kundapura_mangaluru"]:
        res3 = client.post(
            "/api/v1/morph/translate",
            json={"text": "huduga ellige hoguttiddiya?", "source_lang": "kn", "target_region_code": target},
        )
        assert res3.status_code == 200
        d3 = res3.json()
        assert len(d3["results"]) == 1
        out = d3["results"][0]
        print(f"  Target: '{target}'")
        print(f"    Roman:  {out['morphed_phonetic_roman']}")
        print(f"    Script: {out['morphed_kannada_script']}")
        print(f"    Stress: {out['syllable_stress_breakdown']}")

    # 4. Rules Inspection Endpoint Test
    print("\n[4/4] Testing GET /api/v1/morph/rules ...")
    res4 = client.get("/api/v1/morph/rules")
    assert res4.status_code == 200
    d4 = res4.json()
    print(f"  Total Regions Documented: {d4['total_regions']}")
    for code, prof in d4["rulebook"].items():
        print(f"    - [{code}] {prof['region_name']}: {len(prof['lexical_substitutions'])} lexical rules, {len(prof['suffix_rules'])} suffix rules")

    print("\n" + "=" * 80)
    print("ALL PHASE 2 VERIFICATION CHECKS PASSED (200 OK)!")
    print("=" * 80)


if __name__ == "__main__":
    run_phase2_verification()

