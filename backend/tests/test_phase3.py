from fastapi.testclient import TestClient
import pytest
from backend.main import app

client = TestClient(app)


def test_graph_topology():
    """Test 1: Topology endpoint asserts > 90 nodes, > 150 edges, and all 5 node types."""
    response = client.get("/api/v1/graph/topology")
    assert response.status_code == 200, f"Error: {response.text}"
    data = response.json()

    assert data["total_nodes"] > 90, f"Expected > 90 nodes, got {data['total_nodes']}"
    assert data["total_edges"] > 150, f"Expected > 150 edges, got {data['total_edges']}"

    node_types = data["node_type_counts"]
    expected_types = {"REGION", "CONCEPT", "VARIANT", "INFLUENCE_LANG", "CULTURAL_MARKER"}
    for t in expected_types:
        assert t in node_types, f"Node type {t} missing from node_type_counts"
        assert node_types[t] > 0, f"Count for {t} is 0"

    assert len(data["influence_centrality_ranking"]) > 0
    top_rank = data["influence_centrality_ranking"][0]
    assert "degree_centrality" in top_rank
    assert "betweenness_centrality" in top_rank


def test_graph_constellation():
    """Test 2: Constellation ego-graph extraction for 'good' and 'bhaal'."""
    # Query 'good' (concept: tumba cennagide)
    res_good = client.get("/api/v1/graph/constellation?query=good")
    assert res_good.status_code == 200, f"Error: {res_good.text}"
    data_good = res_good.json()

    assert data_good["matched_center_node_id"] != ""
    assert len(data_good["nodes"]) > 5
    assert len(data_good["edges"]) > 5
    assert len(data_good["etymological_narrative"]) > 50

    # Ensure substrate influences like Marathi, Tulu, or Dakhni Urdu are captured
    substrates_good = {s.lower() for s in data_good["substrate_influences"]}
    assert any("marathi" in s or "tulu" in s or "dakhni" in s for s in substrates_good)

    # Query 'bhaal' (variant: tumba / heccu in Dharwad)
    res_bhaal = client.get("/api/v1/graph/constellation?query=bhaal")
    assert res_bhaal.status_code == 200, f"Error: {res_bhaal.text}"
    data_bhaal = res_bhaal.json()
    assert len(data_bhaal["nodes"]) > 5
    assert len(data_bhaal["edges"]) > 5


def test_graph_constellation_not_found():
    """Test 404 on unmatchable query."""
    res = client.get("/api/v1/graph/constellation?query=xyz_nonexistent_word_12345")
    assert res.status_code == 404


def test_graph_linguistic_bridge():
    """
    Test 3: Linguistic bridge between Northern neighbors vs North-to-South-Malnad.
    Verify Northern neighbors have higher similarity index than North-to-South-Malnad.
    """
    # Northern neighbors: Hubballi-Dharwad & Kalaburagi-Bidar
    res_north = client.get("/api/v1/graph/bridge?source=hubballi_dharwad&target=kalaburagi_bidar")
    assert res_north.status_code == 200, f"Error: {res_north.text}"
    data_north = res_north.json()

    # Distant / Cross-cultural: Hubballi-Dharwad & Arebhashe-Kodagu
    res_distant = client.get("/api/v1/graph/bridge?source=hubballi_dharwad&target=arebhashe_kodagu")
    assert res_distant.status_code == 200, f"Error: {res_distant.text}"
    data_distant = res_distant.json()

    sim_north = data_north["similarity_index"]
    sim_distant = data_distant["similarity_index"]

    print(f"Similarity Dharwad-Kalaburagi: {sim_north} vs Dharwad-Kodagu: {sim_distant}")
    assert sim_north > sim_distant, (
        f"Expected Northern neighbors ({sim_north}) to have higher similarity than "
        f"North-to-South-Malnad ({sim_distant})"
    )

    # Check shared substrates for northern neighbors (both have Marathi influence)
    assert any("marathi" in s.lower() for s in data_north["shared_substrates"])
    assert len(data_north["phonetic_shift_chain"]) > 0
    assert len(data_north["shortest_etymological_paths"]) > 0
    assert data_north["bridge_summary"] != ""


def test_graph_bridge_invalid_region():
    """Test 404 on invalid region in bridge query."""
    res = client.get("/api/v1/graph/bridge?source=invalid_region&target=hubballi_dharwad")
    assert res.status_code == 404

