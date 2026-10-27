"""
Standalone verification script for Phase 3:
Etymological & Cultural Knowledge Graph Engine using NetworkX.
"""
from fastapi.testclient import TestClient
from backend.main import app


def run_phase3_verification():
    client = TestClient(app)
    print("=" * 80)
    print("SWARAREKHE — NAMMA KANNADA ENGINE: PHASE 3 VERIFICATION")
    print("Etymological & Cultural Knowledge Graph Engine (NetworkX)")
    print("=" * 80)

    # 1. Topology & Graph Metrics
    print("\n[1/3] Testing GET /api/v1/graph/topology ...")
    res_topo = client.get("/api/v1/graph/topology")
    assert res_topo.status_code == 200, f"Topology query failed: {res_topo.text}"
    topo = res_topo.json()
    print(f"  Total Nodes: {topo['total_nodes']} (Target: > 90)")
    print(f"  Total Edges: {topo['total_edges']} (Target: > 150)")
    print("  Node Type Distribution:")
    for ntype, count in topo["node_type_counts"].items():
        print(f"    - {ntype}: {count}")

    print("  Top Influence & Regional Centrality Rankings:")
    for rank in topo["influence_centrality_ranking"][:6]:
        print(
            f"    * [{rank['node_type']}] {rank['label']}: "
            f"deg={rank['degree_centrality']:.4f}, betweenness={rank['betweenness_centrality']:.4f}"
        )

    assert topo["total_nodes"] > 90
    assert topo["total_edges"] > 150
    assert len(topo["node_type_counts"]) == 5

    # 2. Concept Constellation Ego-Graph Extraction
    print("\n[2/3] Testing GET /api/v1/graph/constellation?query=good and ?query=bhaal ...")
    for q in ["good", "bhaal"]:
        res_const = client.get(f"/api/v1/graph/constellation?query={q}")
        assert res_const.status_code == 200, f"Constellation failed for '{q}': {res_const.text}"
        const = res_const.json()
        print(f"  Query: '{q}' -> Center Node: '{const['matched_center_node_id']}'")
        print(f"    Sub-graph Nodes: {len(const['nodes'])} | Sub-graph Edges: {len(const['edges'])}")
        print(f"    Substrates Detected: {', '.join(const['substrate_influences'])}")
        print(f"    Narrative: {const['etymological_narrative'][:140]}...")

    # 3. Linguistic Bridge: Northern Neighbors vs Cross-Cultural Dialects
    print("\n[3/3] Testing GET /api/v1/graph/bridge ...")
    res_north = client.get("/api/v1/graph/bridge?source=hubballi_dharwad&target=kalaburagi_bidar")
    assert res_north.status_code == 200
    bridge_north = res_north.json()

    res_south = client.get("/api/v1/graph/bridge?source=hubballi_dharwad&target=arebhashe_kodagu")
    assert res_south.status_code == 200
    bridge_south = res_south.json()

    print(f"  Northern Neighbors Bridge (Hubballi-Dharwad <-> Kalaburagi-Bidar):")
    print(f"    Similarity Index:   {bridge_north['similarity_index']:.3f}")
    print(f"    Shared Substrates:  {', '.join(bridge_north['shared_substrates'])}")
    print(f"    Aligned Cognates:   {len(bridge_north['phonetic_shift_chain'])} concept pairs")
    print(f"    Shortest Path:      {' -> '.join(bridge_north['shortest_etymological_paths'][0])}")

    print(f"\n  Cross-Cultural Bridge (Hubballi-Dharwad <-> Arebhashe-Kodagu):")
    print(f"    Similarity Index:   {bridge_south['similarity_index']:.3f}")
    print(f"    Shared Substrates:  {', '.join(bridge_south['shared_substrates']) if bridge_south['shared_substrates'] else 'None'}")

    assert bridge_north["similarity_index"] > bridge_south["similarity_index"], (
        f"Northern neighbors similarity ({bridge_north['similarity_index']}) should be higher than "
        f"cross-cultural Malnad similarity ({bridge_south['similarity_index']})"
    )

    print("\n" + "=" * 80)
    print("ALL PHASE 3 VERIFICATION CHECKS PASSED (200 OK)!")
    print("=" * 80)


if __name__ == "__main__":
    run_phase3_verification()

