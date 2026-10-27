import math
import logging
from typing import Any, Dict, List, Optional, Set, Tuple
import networkx as nx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.models import DialectRegion, DialectVariant, LexicalEntry
from backend.schemas import (
    ConstellationResponse,
    GraphEdge,
    GraphNode,
    LinguisticBridgeResponse,
    TopologyResponse,
)

logger = logging.getLogger("knowledge_graph")

INFLUENCE_LANGUAGES = [
    {
        "id": "lang:halegannada",
        "label": "Halegannada (Old Kannada)",
        "kannada_label": "ಹಳೆಗನ್ನಡ",
        "family": "Dravidian",
        "era": "Classical (450 CE - 1200 CE)",
        "traits": "Archaic p-preservation, ancient verbal affixes, geminate labials",
    },
    {
        "id": "lang:marathi",
        "label": "Marathi",
        "kannada_name": "ಮರಾಠಿ",
        "family": "Indo-Aryan",
        "era": "Medieval to Modern Contact",
        "traits": "Lexical borrowing in Uttara Karnataka (cholo, bhaal, lagoone, pora)",
    },
    {
        "id": "lang:konkani",
        "label": "Konkani",
        "kannada_name": "ಕೊಂಕಣಿ",
        "family": "Indo-Aryan",
        "era": "Coastal Contact",
        "traits": "Maritime and trade vocabulary in coastal estuaries",
    },
    {
        "id": "lang:tulu",
        "label": "Tulu",
        "kannada_name": "ತುಳು",
        "family": "Dravidian",
        "era": "Indigenous Substrate",
        "traits": "Coastal Karavali substrate (laayk, encha, appe, vanas, undu, koolu)",
    },
    {
        "id": "lang:dakhni_urdu",
        "label": "Dakhni Urdu",
        "kannada_name": "ದಖ್ಖನಿ ಉರ್ದು",
        "family": "Indo-Aryan (Perso-Arabic adstrate)",
        "era": "Bahmani / Deccan Sultanates (1347 CE onwards)",
        "traits": "Kalyana Karnataka lexis (khabar, mast, jaldi, baarish, likatthiri)",
    },
    {
        "id": "lang:telugu",
        "label": "Telugu",
        "kannada_name": "ತೆಲುಗು",
        "family": "Dravidian",
        "era": "Eastern border contact",
        "traits": "Shared Vijayanagara administrative vocabulary and eastern Dravidian cognates",
    },
    {
        "id": "lang:kodava_takk",
        "label": "Kodava Takk",
        "kannada_name": "ಕೊಡವ ತಕ್ಕ್",
        "family": "Dravidian",
        "era": "Western Ghats Highland Substrate",
        "traits": "Malnad and Arebhashe highland phonemes and kinship paradigms (kunyi, maani)",
    },
    {
        "id": "lang:tamil",
        "label": "Tamil",
        "kannada_name": "ತಮಿಳು",
        "family": "Dravidian",
        "era": "Chola / Southern border contact",
        "traits": "Southern border plains and urban metropolitan interaction",
    },
    {
        "id": "lang:sanskrit",
        "label": "Sanskrit",
        "kannada_name": "ಸಂಸ್ಕೃತ",
        "family": "Indo-Aryan",
        "era": "Ancient Liturgical / Scholastic",
        "traits": "Tatsama and Tadbhava loan formations across formal literature (barsha/varsha)",
    },
]

CULTURAL_MARKERS = [
    {
        "id": "culture:vachana_sahitya",
        "label": "Vachana Sahitya",
        "kannada_label": "ವಚನ ಸಾಹಿತ್ಯ",
        "associated_regions": ["hubballi_dharwad", "kalaburagi_bidar"],
        "description": "12th-century socio-religious egalitarian movement in Kalyana Karnataka led by Basaveshwara, Allama Prabhu, and Akka Mahadevi.",
    },
    {
        "id": "culture:yakshagana",
        "label": "Yakshagana",
        "kannada_label": "ಯಕ್ಷಗಾನ",
        "associated_regions": ["kundapura_mangaluru"],
        "description": "Traditional theatrical dance-drama of coastal Karnataka preserving epic narratives and rapid, musical poetic cadence.",
    },
    {
        "id": "culture:janapada_geethe",
        "label": "Janapada Geethe (Folk Oral Lore)",
        "kannada_label": "ಜಾನಪದ ಗೀತೆ",
        "associated_regions": ["bengaluru_mysuru", "arebhashe_kodagu", "hubballi_dharwad"],
        "description": "Rich agrarian oral ballads, grinding songs (beeso padagalu), and harvest celebrations across the southern and northern plains.",
    },
    {
        "id": "culture:sharana_tradition",
        "label": "Sharana Tradition & Kayaka",
        "kannada_label": "ಶರಣ ಪರಂಪರೆ ಮತ್ತು ಕಾಯಕ",
        "associated_regions": ["hubballi_dharwad", "kalaburagi_bidar"],
        "description": "Philosophy of 'Work is Worship' (Kayaka) and deep conversational warmth with 'ri' and 'avri' honorifics.",
    },
    {
        "id": "culture:karavali_daivaradhane",
        "label": "Karavali Daivaradhane",
        "kannada_label": "ಕರಾವಳಿ ದೈವಾರಾಧನೆ",
        "associated_regions": ["kundapura_mangaluru"],
        "description": "Indigenous spirit and ancestor worship (Bhoota Kola) reflecting deep Tulu-Kannada coastal syncretism.",
    },
    {
        "id": "culture:sufi_bhakti_syncretism",
        "label": "Sufi-Bhakti Syncretism",
        "kannada_label": "ಸೂಫಿ-ಭಕ್ತಿ ಸಮ್ಮಿಲನ",
        "associated_regions": ["kalaburagi_bidar", "hubballi_dharwad"],
        "description": "Deccan syncretic culture surrounding Khwaja Bande Nawaz, Shishunala Sharifa, and shared spiritual music.",
    },
    {
        "id": "culture:malnad_plantation_ecology",
        "label": "Western Ghats Highland Ecology",
        "kannada_label": "ಮಲೆನಾಡು ತೋಟಗಾರಿಕೆ ಸಂಸ್ಕೃತಿ",
        "associated_regions": ["arebhashe_kodagu"],
        "description": "Coffee, areca nut, and spice plantation agro-ecology with ancient Dravidian kinship structures.",
    },
]


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates the great-circle distance between two geo-coordinates in kilometers."""
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


class DialectKnowledgeGraph:
    """
    Spatio-Acoustic Dialect & Etymological Cultural Knowledge Graph.
    Powered by NetworkX MultiDiGraph.
    """

    def __init__(self) -> None:
        self.graph: nx.MultiDiGraph = nx.MultiDiGraph()
        self.is_built: bool = False
        self._regions_cache: Dict[str, DialectRegion] = {}

    async def build_graph(self, db: AsyncSession) -> None:
        """
        Dynamically construct knowledge graph from SQLite database and domain ontology.
        """
        self.graph.clear()
        self._regions_cache.clear()

        # 1. Fetch all regions
        reg_result = await db.execute(select(DialectRegion))
        regions = reg_result.scalars().all()
        for r in regions:
            self._regions_cache[r.code] = r
            node_id = f"region:{r.code}"
            self.graph.add_node(
                node_id,
                id=node_id,
                label=r.name,
                kannada_label=r.kannada_name,
                node_type="REGION",
                metadata={
                    "code": r.code,
                    "center_lat": r.center_lat,
                    "center_lng": r.center_lng,
                    "border_influences": r.border_influences,
                    "prosody_profile": r.prosody_profile,
                    "cultural_notes": r.cultural_notes,
                },
            )

        # 2. Add INFLUENCE_LANG nodes
        for lang in INFLUENCE_LANGUAGES:
            self.graph.add_node(
                lang["id"],
                id=lang["id"],
                label=lang["label"],
                kannada_label=lang.get("kannada_label") or lang.get("kannada_name"),
                node_type="INFLUENCE_LANG",
                metadata={
                    "family": lang["family"],
                    "era": lang["era"],
                    "traits": lang["traits"],
                },
            )

        # 3. Add CULTURAL_MARKER nodes and connect REGION --(CULTURAL_TIE)--> CULTURAL_MARKER
        for cult in CULTURAL_MARKERS:
            self.graph.add_node(
                cult["id"],
                id=cult["id"],
                label=cult["label"],
                kannada_label=cult.get("kannada_label"),
                node_type="CULTURAL_MARKER",
                metadata={
                    "description": cult["description"],
                    "associated_regions": cult["associated_regions"],
                },
            )
            for reg_code in cult["associated_regions"]:
                reg_node_id = f"region:{reg_code}"
                if self.graph.has_node(reg_node_id):
                    self.graph.add_edge(
                        reg_node_id,
                        cult["id"],
                        relation="CULTURAL_TIE",
                        weight=1.0,
                        explanation=cult["description"],
                    )

        # 4. Add GEOGRAPHIC_NEIGHBOR edges between regions
        region_list = list(regions)
        for i in range(len(region_list)):
            for j in range(i + 1, len(region_list)):
                r1 = region_list[i]
                r2 = region_list[j]
                dist_km = haversine_distance_km(r1.center_lat, r1.center_lng, r2.center_lat, r2.center_lng)
                # Proximity weight: closer regions have higher weight
                weight = round(1.0 / (1.0 + dist_km / 150.0), 4)

                self.graph.add_edge(
                    f"region:{r1.code}",
                    f"region:{r2.code}",
                    relation="GEOGRAPHIC_NEIGHBOR",
                    weight=weight,
                    explanation=f"Spatial distance: {dist_km:.1f} km across Karnataka topography",
                )
                self.graph.add_edge(
                    f"region:{r2.code}",
                    f"region:{r1.code}",
                    relation="GEOGRAPHIC_NEIGHBOR",
                    weight=weight,
                    explanation=f"Spatial distance: {dist_km:.1f} km across Karnataka topography",
                )

        # 5. Fetch Lexical Entries & Variants
        stmt = select(LexicalEntry).options(
            selectinload(LexicalEntry.variants).selectinload(DialectVariant.region)
        )
        lex_result = await db.execute(stmt)
        entries = lex_result.scalars().all()

        for entry in entries:
            concept_node_id = f"concept:{entry.standard_roman}"
            self.graph.add_node(
                concept_node_id,
                id=concept_node_id,
                label=f"{entry.english_meaning} ({entry.standard_roman})",
                kannada_label=entry.standard_kannada,
                node_type="CONCEPT",
                metadata={
                    "standard_roman": entry.standard_roman,
                    "english_meaning": entry.english_meaning,
                    "category": entry.category,
                    "grammatical_pos": entry.grammatical_pos,
                },
            )

            # Find standard variant (bengaluru_mysuru) for phonetic shift chain
            standard_var_node_id: Optional[str] = None
            for v in entry.variants:
                if v.region and v.region.code == "bengaluru_mysuru":
                    standard_var_node_id = f"variant:{entry.standard_roman}:{v.region.code}"

            for v in entry.variants:
                if not v.region:
                    continue
                var_node_id = f"variant:{entry.standard_roman}:{v.region.code}"
                reg_node_id = f"region:{v.region.code}"

                self.graph.add_node(
                    var_node_id,
                    id=var_node_id,
                    label=v.local_phonetic,
                    kannada_label=v.local_script,
                    node_type="VARIANT",
                    metadata={
                        "lexical_entry": entry.standard_roman,
                        "region_code": v.region.code,
                        "ipa": v.ipa_pronunciation,
                        "morphological_rule": v.morphological_rule,
                        "cultural_origin_note": v.cultural_origin_note,
                        "confidence_score": v.confidence_score,
                    },
                )

                # VARIANT --(EXPRESSES)--> CONCEPT
                self.graph.add_edge(
                    var_node_id,
                    concept_node_id,
                    relation="EXPRESSES",
                    weight=1.0,
                    explanation=f"Dialect form expressing core concept '{entry.english_meaning}'",
                )

                # VARIANT --(SPOKEN_IN)--> REGION
                self.graph.add_edge(
                    var_node_id,
                    reg_node_id,
                    relation="SPOKEN_IN",
                    weight=1.0,
                    explanation=f"Spoken by speech community in {v.region.name}",
                )

                # Standard -> Regional PHONETIC_SHIFT_FROM edge
                if standard_var_node_id and standard_var_node_id != var_node_id:
                    self.graph.add_edge(
                        standard_var_node_id,
                        var_node_id,
                        relation="PHONETIC_SHIFT_FROM",
                        weight=0.9,
                        explanation=f"Morphological transformation: {v.morphological_rule or 'regional_shift'}",
                    )

                # Infer substrate link VARIANT --(BORROWED_FROM / COGNATE_WITH)--> INFLUENCE_LANG
                note_low = (v.cultural_origin_note or "").lower()
                rule_low = (v.morphological_rule or "").lower()
                text_low = v.local_phonetic.lower()

                # Marathi
                if "marathi" in note_low or "marathi" in rule_low or any(w in text_low for w in ["cholo", "bhaal", "pora", "pori", "lagoone", "shetee"]):
                    self.graph.add_edge(
                        var_node_id,
                        "lang:marathi",
                        relation="BORROWED_FROM",
                        weight=0.95,
                        explanation="Northwestern Indo-Aryan Marathi substrate borrowing",
                    )

                # Dakhni Urdu
                if "dakhni" in note_low or "urdu" in note_low or any(w in text_low for w in ["khabar", "mast", "jaldi", "baarish", "likatthiri"]):
                    self.graph.add_edge(
                        var_node_id,
                        "lang:dakhni_urdu",
                        relation="BORROWED_FROM",
                        weight=0.95,
                        explanation="Deccan Sultanate / Dakhni Urdu historical lexical borrowing",
                    )

                # Tulu
                if "tulu" in note_low or "tulu" in rule_low or any(w in text_low for w in ["laayk", "encha", "appe", "vanas", "undu", "koolu"]):
                    self.graph.add_edge(
                        var_node_id,
                        "lang:tulu",
                        relation="COGNATE_WITH",
                        weight=0.92,
                        explanation="Coastal Tulu-Kannada deep Dravidian substrate cognate",
                    )

                # Halegannada (Old Kannada)
                if "halegannada" in note_low or "archaic" in note_low or any(w in text_low for w in ["bappi", "avva", "appe", "yathak"]):
                    self.graph.add_edge(
                        var_node_id,
                        "lang:halegannada",
                        relation="COGNATE_WITH",
                        weight=0.94,
                        explanation="Retention of Classical Halegannada phonemes or grammatical affixes",
                    )

                # Kodava Takk
                if "kodava" in note_low or any(w in text_low for w in ["kunyi", "maani", "koolu"]):
                    self.graph.add_edge(
                        var_node_id,
                        "lang:kodava_takk",
                        relation="COGNATE_WITH",
                        weight=0.90,
                        explanation="Highland Malnad / Kodava contact substrate",
                    )

                # Sanskrit
                if "sanskrit" in note_low or "tadbhava" in note_low or "barsha" in text_low:
                    self.graph.add_edge(
                        var_node_id,
                        "lang:sanskrit",
                        relation="BORROWED_FROM",
                        weight=0.88,
                        explanation="Sanskrit Tadbhava phonetic evolution",
                    )

        self.is_built = True
        logger.info(
            "Knowledge Graph built successfully: %d nodes, %d edges",
            self.graph.number_of_nodes(),
            self.graph.number_of_edges(),
        )

    # ==========================================================================
    # GRAPH QUERY: CONSTELLATION EGO-GRAPH
    # ==========================================================================

    def get_concept_constellation(self, query: str) -> Optional[ConstellationResponse]:
        """
        Extracts a 2-hop ego-graph around the matched CONCEPT or VARIANT node.
        Generates an etymological narrative explaining how the word travels
        across Karnataka's dialectal landscape.
        """
        if not self.is_built or self.graph.number_of_nodes() == 0:
            return None

        clean_q = query.strip().lower()
        clean_q_no_punct = "".join(c for c in clean_q if c.isalnum() or c.isspace()).strip()

        matched_center_node: Optional[str] = None
        matched_concept_data: Optional[Dict[str, Any]] = None

        # 1. Search CONCEPT nodes first
        for node_id, data in self.graph.nodes(data=True):
            if data.get("node_type") == "CONCEPT":
                eng = data.get("metadata", {}).get("english_meaning", "").lower()
                rom = data.get("metadata", {}).get("standard_roman", "").lower()
                kan = data.get("kannada_label", "")

                if (
                    clean_q in eng
                    or clean_q_no_punct in eng
                    or clean_q in rom
                    or clean_q == kan
                    or any(tok in eng.split() for tok in clean_q_no_punct.split())
                ):
                    matched_center_node = node_id
                    matched_concept_data = data
                    break

        # 2. If not found, search VARIANT nodes
        if not matched_center_node:
            for node_id, data in self.graph.nodes(data=True):
                if data.get("node_type") == "VARIANT":
                    label_low = data.get("label", "").lower()
                    kan = data.get("kannada_label", "")
                    if clean_q in label_low or clean_q == kan:
                        matched_center_node = node_id
                        # If center is a variant, trace to its parent CONCEPT
                        for _, target, edge_data in self.graph.out_edges(node_id, data=True):
                            if edge_data.get("relation") == "EXPRESSES":
                                matched_center_node = target
                                matched_concept_data = self.graph.nodes[target]
                                break
                        break

        if not matched_center_node:
            return None

        # Build undirected view for 2-hop ego-graph extraction
        undirected_view = self.graph.to_undirected(as_view=True)
        subgraph_nodes: Set[str] = set(nx.single_source_shortest_path_length(undirected_view, matched_center_node, cutoff=2).keys())

        # Collect nodes and edges
        nodes_out: List[GraphNode] = []
        edges_out: List[GraphEdge] = []
        substrates_found: Set[str] = set()

        for n_id in subgraph_nodes:
            n_data = self.graph.nodes[n_id]
            nodes_out.append(
                GraphNode(
                    id=n_id,
                    label=n_data.get("label", n_id),
                    kannada_label=n_data.get("kannada_label"),
                    node_type=n_data.get("node_type", "CONCEPT"),
                    metadata=n_data.get("metadata", {}),
                )
            )
            if n_data.get("node_type") == "INFLUENCE_LANG":
                substrates_found.add(n_data.get("label", n_id))

        for u, v, k, e_data in self.graph.edges(subgraph_nodes, data=True, keys=True):
            if v in subgraph_nodes:
                edges_out.append(
                    GraphEdge(
                        source=u,
                        target=v,
                        relation=e_data.get("relation", "COGNATE_WITH"),
                        weight=float(e_data.get("weight", 1.0)),
                        explanation=e_data.get("explanation"),
                    )
                )

        # Generate narrative
        meta = matched_concept_data.get("metadata", {}) if matched_concept_data else {}
        concept_eng = meta.get("english_meaning", query)
        concept_rom = meta.get("standard_roman", query)

        narrative_lines = [
            f"The concept '{concept_eng}' ({concept_rom}) forms a multi-dialectal constellation across Karnataka.",
            "In Old Mysuru, it anchors the canonical literary standard. Moving northwest to Hubballi-Dharwad,",
            "it incorporates vibrant acoustic rising inflections and Marathi contact markers.",
            "Along the Karavali coast, it absorbs ancient Tulu and Halegannada substrata with cascading prosody.",
            "In Kalyana Karnataka (Kalaburagi-Bidar), it synthesizes Deccan Sultanate and Dakhni Urdu historical lexical layers.",
            "In the Malnad highlands of Kodagu and Sullia, Arebhashe retains archaic Dravidian stems.",
        ]
        if substrates_found:
            narrative_lines.append(f"Key substrate contacts observed: {', '.join(sorted(list(substrates_found)))}.")

        return ConstellationResponse(
            query=query,
            matched_center_node_id=matched_center_node,
            nodes=nodes_out,
            edges=edges_out,
            etymological_narrative=" ".join(narrative_lines),
            substrate_influences=sorted(list(substrates_found)),
        )

    # ==========================================================================
    # GRAPH QUERY: LINGUISTIC BRIDGE
    # ==========================================================================

    def trace_linguistic_bridge(self, region_a: str, region_b: str) -> Optional[LinguisticBridgeResponse]:
        """
        Traces the linguistic and cultural bridge between two dialect regions.
        Calculates similarity index, shortest graph paths, shared substrates,
        and side-by-side lexical variant comparison.
        """
        reg_a_node = f"region:{region_a.strip().lower()}"
        reg_b_node = f"region:{region_b.strip().lower()}"

        if not self.graph.has_node(reg_a_node) or not self.graph.has_node(reg_b_node):
            return None

        data_a = self.graph.nodes[reg_a_node]["metadata"]
        data_b = self.graph.nodes[reg_b_node]["metadata"]

        # Substrates comparison
        subs_a = set(data_a.get("border_influences", []))
        subs_b = set(data_b.get("border_influences", []))
        shared_subs = sorted(list(subs_a & subs_b))

        jaccard_sub = len(subs_a & subs_b) / max(1, len(subs_a | subs_b))

        # Geographic proximity
        dist_km = haversine_distance_km(
            data_a.get("center_lat", 0.0),
            data_a.get("center_lng", 0.0),
            data_b.get("center_lat", 0.0),
            data_b.get("center_lng", 0.0),
        )
        geo_proximity = round(1.0 / (1.0 + dist_km / 250.0), 4)

        # Cultural overlap
        cult_a = {v for _, v, d in self.graph.out_edges(reg_a_node, data=True) if d.get("relation") == "CULTURAL_TIE"}
        cult_b = {v for _, v, d in self.graph.out_edges(reg_b_node, data=True) if d.get("relation") == "CULTURAL_TIE"}
        cult_overlap = len(cult_a & cult_b) / max(1, len(cult_a | cult_b))

        # Composite similarity index
        # Regions in same broader cultural sphere (e.g. Dharwad and Kalaburagi) share high Marathi/Vachana ties
        sim_index = round(0.40 * jaccard_sub + 0.35 * geo_proximity + 0.25 * cult_overlap, 3)
        sim_index = max(0.05, min(0.98, sim_index))

        # Shortest relational path in undirected view
        undirected_view = self.graph.to_undirected(as_view=True)
        shortest_paths: List[List[str]] = []
        try:
            paths = list(nx.all_shortest_paths(undirected_view, source=reg_a_node, target=reg_b_node))
            shortest_paths = paths[:3]
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            shortest_paths = []

        # Side-by-side lexical variant comparison
        phonetic_chain: List[Dict[str, Any]] = []
        # Query all concepts that have variants in both regions
        for n_id, n_data in self.graph.nodes(data=True):
            if n_data.get("node_type") == "CONCEPT":
                var_a_id = f"variant:{n_data['metadata'].get('standard_roman')}:{region_a}"
                var_b_id = f"variant:{n_data['metadata'].get('standard_roman')}:{region_b}"

                if self.graph.has_node(var_a_id) and self.graph.has_node(var_b_id):
                    node_a_meta = self.graph.nodes[var_a_id]["metadata"]
                    node_b_meta = self.graph.nodes[var_b_id]["metadata"]
                    phonetic_chain.append(
                        {
                            "concept": n_data.get("label"),
                            "region_a_variant": {
                                "phonetic": self.graph.nodes[var_a_id]["label"],
                                "script": self.graph.nodes[var_a_id]["kannada_label"],
                                "ipa": node_a_meta.get("ipa"),
                                "rule": node_a_meta.get("morphological_rule"),
                            },
                            "region_b_variant": {
                                "phonetic": self.graph.nodes[var_b_id]["label"],
                                "script": self.graph.nodes[var_b_id]["kannada_label"],
                                "ipa": node_b_meta.get("ipa"),
                                "rule": node_b_meta.get("morphological_rule"),
                            },
                        }
                    )

        summary = (
            f"Linguistic bridge between {self.graph.nodes[reg_a_node]['label']} and "
            f"{self.graph.nodes[reg_b_node]['label']} spans a spatial distance of {dist_km:.1f} km "
            f"with a composite similarity index of {sim_index:.2f}. "
            f"Shared substrates: {', '.join(shared_subs) if shared_subs else 'Distinct substrate layers'}. "
            f"Comparative analysis yields {len(phonetic_chain)} aligned lexical cognate pairs."
        )

        return LinguisticBridgeResponse(
            source_region=region_a,
            target_region=region_b,
            similarity_index=sim_index,
            shared_substrates=shared_subs,
            shortest_etymological_paths=shortest_paths,
            phonetic_shift_chain=phonetic_chain,
            bridge_summary=summary,
        )

    # ==========================================================================
    # GRAPH QUERY: TOPOLOGY & CENTRALITY
    # ==========================================================================

    def get_full_topology(self) -> TopologyResponse:
        """
        Calculates degree and betweenness centralities, node distribution counts,
        and serializes full graph topology for D3/force-directed visualization.
        """
        node_counts: Dict[str, int] = {}
        nodes_out: List[GraphNode] = []
        edges_out: List[GraphEdge] = []

        for n_id, n_data in self.graph.nodes(data=True):
            ntype = n_data.get("node_type", "CONCEPT")
            node_counts[ntype] = node_counts.get(ntype, 0) + 1
            nodes_out.append(
                GraphNode(
                    id=n_id,
                    label=n_data.get("label", n_id),
                    kannada_label=n_data.get("kannada_label"),
                    node_type=ntype,
                    metadata=n_data.get("metadata", {}),
                )
            )

        for u, v, k, e_data in self.graph.edges(data=True, keys=True):
            edges_out.append(
                GraphEdge(
                    source=u,
                    target=v,
                    relation=e_data.get("relation", "COGNATE_WITH"),
                    weight=float(e_data.get("weight", 1.0)),
                    explanation=e_data.get("explanation"),
                )
            )

        # Centrality ranking
        deg_centrality = nx.degree_centrality(self.graph)
        try:
            between_centrality = nx.betweenness_centrality(self.graph)
        except Exception:
            between_centrality = {}

        # Focus ranking on INFLUENCE_LANG and REGION nodes
        ranking: List[Dict[str, Any]] = []
        for n_id, n_data in self.graph.nodes(data=True):
            ntype = n_data.get("node_type")
            if ntype in ["INFLUENCE_LANG", "REGION"]:
                ranking.append(
                    {
                        "node_id": n_id,
                        "label": n_data.get("label", n_id),
                        "node_type": ntype,
                        "degree_centrality": round(deg_centrality.get(n_id, 0.0), 4),
                        "betweenness_centrality": round(between_centrality.get(n_id, 0.0), 4),
                    }
                )

        ranking.sort(key=lambda x: (x["degree_centrality"], x["betweenness_centrality"]), reverse=True)

        return TopologyResponse(
            total_nodes=len(nodes_out),
            total_edges=len(edges_out),
            node_type_counts=node_counts,
            influence_centrality_ranking=ranking,
            nodes=nodes_out,
            edges=edges_out,
        )


# Global singleton instance
knowledge_graph_service = DialectKnowledgeGraph()

