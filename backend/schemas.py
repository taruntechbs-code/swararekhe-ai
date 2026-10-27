from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


# ---------------- Dialect Region Schemas ----------------

class DialectRegionBase(BaseModel):
    code: str = Field(..., description="Unique machine identifier for region, e.g. hubballi_dharwad")
    name: str = Field(..., description="English name of dialect region")
    kannada_name: str = Field(..., description="Kannada script name")
    center_lat: float = Field(..., description="Latitude coordinate")
    center_lng: float = Field(..., description="Longitude coordinate")
    border_influences: List[str] = Field(default_factory=list, description="Neighboring languages influencing this dialect")
    prosody_profile: Dict[str, Any] = Field(default_factory=dict, description="Pitch, cadence, tempo, and inflection traits")
    cultural_notes: Optional[str] = Field(None, description="Ethno-linguistic context")


class DialectRegionCreate(DialectRegionBase):
    pass


class DialectRegionResponse(DialectRegionBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ---------------- Dialect Variant Schemas ----------------

class DialectVariantBase(BaseModel):
    local_script: str = Field(..., description="Local variant in Kannada script")
    local_phonetic: str = Field(..., description="Roman phonetic transcription of local pronunciation")
    ipa_pronunciation: str = Field(..., description="International Phonetic Alphabet transcription")
    morphological_rule: Optional[str] = Field(None, description="Linguistic mutation / morphological transformation tag")
    example_sentence_local: Optional[str] = Field(None, description="Usage sentence in local dialect")
    example_sentence_standard: Optional[str] = Field(None, description="Equivalent sentence in standard Kannada")
    cultural_origin_note: Optional[str] = Field(None, description="Substrate or historical context")
    confidence_score: float = Field(1.0, ge=0.0, le=1.0, description="Confidence score of authentic field record")


class DialectVariantCreate(DialectVariantBase):
    lexical_entry_id: int
    region_id: int


class DialectVariantResponse(DialectVariantBase):
    id: int
    lexical_entry_id: int
    region_id: int

    model_config = ConfigDict(from_attributes=True)


class DialectVariantWithRegionResponse(DialectVariantResponse):
    region: Optional[DialectRegionResponse] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------- Lexical Entry Schemas ----------------

class LexicalEntryBase(BaseModel):
    standard_kannada: str = Field(..., description="Canonical standard Kannada word or phrase")
    standard_roman: str = Field(..., description="Canonical Romanized Kannada transliteration")
    english_meaning: str = Field(..., description="English definition or gloss")
    category: str = Field(..., description="Semantic domain: greeting, food, question, emotion, daily, agrarian")
    grammatical_pos: str = Field(..., description="Part of speech: noun, verb, adverb, adjective, interjection, phrase")


class LexicalEntryCreate(LexicalEntryBase):
    pass


class LexicalEntryResponse(LexicalEntryBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class LexicalEntryDetailResponse(LexicalEntryResponse):
    variants: List[DialectVariantWithRegionResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


# ---------------- Health & Diagnostics ----------------

class HealthResponse(BaseModel):
    status: str
    database: str
    app_name: str
    region_count: int
    lexicon_count: int
    variant_count: int


# ---------------- Phase 2: Dialect Morphing & Transduction Schemas ----------------

class WordDiffItem(BaseModel):
    source_token: str = Field(..., description="Original input word or token")
    target_token_roman: str = Field(..., description="Transduced phonetic token in Latin/English script")
    target_token_script: str = Field(..., description="Transduced token in Kannada script")
    rule_applied: str = Field(..., description="Name or identifier of morphological/phonological rule applied")
    explanation: str = Field(..., description="Linguistic description of the transformation")


class MorphedRegionOutput(BaseModel):
    region_code: str = Field(..., description="Identifier of target dialect region")
    region_name: str = Field(..., description="Human-readable region name")
    morphed_kannada_script: str = Field(..., description="Complete generated phrase in Kannada script")
    morphed_phonetic_roman: str = Field(..., description="Romanized phonetic transcription of the morphed utterance")
    ipa_approximation: str = Field(..., description="International Phonetic Alphabet transcription")
    syllable_stress_breakdown: str = Field(..., description="Prosodic syllable-stress breakdown e.g. 'Yal-LIG hon-TIR-re'")
    word_by_word_diff: List[WordDiffItem] = Field(default_factory=list, description="Token-level derivation chain")
    morphological_rules_triggered: List[str] = Field(default_factory=list, description="List of rule tags applied")
    cultural_nuance_note: str = Field(..., description="Sociolinguistic and regional communicative context")
    engine_mode: Literal["hybrid_llm_symbolic", "deterministic_symbolic"] = Field(
        ..., description="Resolution pathway: hybrid LLM or deterministic rule-based transducer"
    )
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Transduction confidence metric")


class MorphTranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Input phrase or sentence to morph (English or Kannada/Roman Kannada)")
    source_lang: Literal["en", "kn"] = Field("en", description="Source language: 'en' for English or 'kn' for Kannada")
    target_region_code: str = Field("all", description="Target region code ('all' or specific region identifier)")


class MorphTranslateResponse(BaseModel):
    input_text: str = Field(..., description="Original input query")
    source_lang: str = Field(..., description="Detected or provided source language")
    matched_seed_concept: Optional[str] = Field(None, description="Exact or fuzzy matched lexical corpus concept if detected")
    results: List[MorphedRegionOutput] = Field(default_factory=list, description="Dialect outputs for requested region(s)")


class MorphRuleItem(BaseModel):
    pattern: str = Field(..., description="Trigger pattern or regex")
    replacement: str = Field(..., description="Output substitution or suffix")
    rule_id: str = Field(..., description="Rule identifier")
    description: str = Field(..., description="Linguistic explanation")


class RegionRuleProfile(BaseModel):
    region_code: str
    region_name: str
    kannada_name: str
    prosody_summary: str
    lexical_substitutions: List[MorphRuleItem]
    suffix_rules: List[MorphRuleItem]
    phonological_shifts: List[MorphRuleItem]


class MorphRulesResponse(BaseModel):
    total_regions: int
    rulebook: Dict[str, RegionRuleProfile]


# ---------------- Phase 3: Etymological & Cultural Knowledge Graph Schemas ----------------

NodeType = Literal["REGION", "CONCEPT", "VARIANT", "INFLUENCE_LANG", "CULTURAL_MARKER"]
EdgeRelation = Literal[
    "SPOKEN_IN",
    "EXPRESSES",
    "BORROWED_FROM",
    "COGNATE_WITH",
    "PHONETIC_SHIFT_FROM",
    "GEOGRAPHIC_NEIGHBOR",
    "CULTURAL_TIE",
]


class GraphNode(BaseModel):
    id: str = Field(..., description="Unique node identifier in knowledge graph")
    label: str = Field(..., description="English/Roman display label")
    kannada_label: Optional[str] = Field(None, description="Kannada script label if applicable")
    node_type: NodeType = Field(..., description="Semantic entity category")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Arbitrary attributes, coordinates, prosody, notes")


class GraphEdge(BaseModel):
    source: str = Field(..., description="Source node id")
    target: str = Field(..., description="Target node id")
    relation: EdgeRelation = Field(..., description="Typed relationship semantics")
    weight: float = Field(1.0, description="Edge strength or inverse distance")
    explanation: Optional[str] = Field(None, description="Linguistic or cultural rationale")


class ConstellationResponse(BaseModel):
    query: str = Field(..., description="Original search term or concept")
    matched_center_node_id: str = Field(..., description="Ego center node ID")
    nodes: List[GraphNode] = Field(default_factory=list, description="Extracted ego-graph node set")
    edges: List[GraphEdge] = Field(default_factory=list, description="Extracted ego-graph edge set")
    etymological_narrative: str = Field(..., description="Narrative commentary of shifts across Karnataka")
    substrate_influences: List[str] = Field(default_factory=list, description="Border substrate languages connected to this constellation")


class LinguisticBridgeResponse(BaseModel):
    source_region: str = Field(..., description="Source dialect region code")
    target_region: str = Field(..., description="Target dialect region code")
    similarity_index: float = Field(..., ge=0.0, le=1.0, description="Composite similarity metric between 0.0 and 1.0")
    shared_substrates: List[str] = Field(default_factory=list, description="Common border/historical language substrates")
    shortest_etymological_paths: List[List[str]] = Field(default_factory=list, description="Shortest relational chains in knowledge graph")
    phonetic_shift_chain: List[Dict[str, Any]] = Field(default_factory=list, description="Side-by-side lexical variant comparison")
    bridge_summary: str = Field(..., description="Comparative sociolinguistic summary")


class TopologyResponse(BaseModel):
    total_nodes: int
    total_edges: int
    node_type_counts: Dict[str, int]
    influence_centrality_ranking: List[Dict[str, Any]]
    nodes: List[GraphNode]
    edges: List[GraphEdge]


# ---------------- Phase 4: Acoustic Prosody & DSP Cadence Schemas ----------------

class CadenceMetrics(BaseModel):
    pitch_mean_hz: float = Field(..., description="Average Fundamental Frequency (F0) in Hertz")
    pitch_std_dev: float = Field(..., description="Standard deviation of pitch variation")
    pitch_range_hz: float = Field(..., description="Peak-to-trough F0 delta in Hertz")
    terminal_inflection_slope: float = Field(..., description="Slope of terminal 20% of F0 curve (positive = rising, negative = falling)")
    estimated_syllable_rate_hz: float = Field(..., description="Estimated syllable onsets per second")
    cadence_rhythm_type: str = Field(..., description="Descriptive cadence tag: staccato, syllable-timed, tripping, cascading, measured")


class AcousticProfileResponse(BaseModel):
    region_code: str = Field(..., description="Dialect region code")
    region_name: str = Field(..., description="Human-readable dialect region name")
    sample_audio_filename: str = Field(..., description="Audio sample filename in backend/static/audio_samples/")
    cadence_metrics: CadenceMetrics = Field(..., description="Acoustic cadence profile metrics")
    f0_pitch_curve: List[float] = Field(default_factory=list, description="Extracted pitch contour array (Hz)")
    energy_envelope: List[float] = Field(default_factory=list, description="RMS energy amplitude envelope")
    prosody_description: str = Field(..., description="Prosodic profile summary")


class AcousticAnalyzeResponse(BaseModel):
    target_region_code: str = Field(..., description="Requested regional dialect benchmark")
    matched_region_name: str = Field(..., description="Name of reference benchmark region")
    cadence_match_score: float = Field(..., ge=0.0, le=100.0, description="Overall cadence & prosody similarity score (0-100)")
    user_cadence_metrics: CadenceMetrics = Field(..., description="Acoustic metrics extracted from submitted audio")
    reference_cadence_metrics: CadenceMetrics = Field(..., description="Benchmark regional acoustic metrics")
    pitch_contour_comparison: Dict[str, Any] = Field(default_factory=dict, description="Aligned F0 contour data for visualization")
    coaching_feedback: List[str] = Field(default_factory=list, description="Linguistic prosody coaching tips")


# ---------------- Phase 5: Geospatial Isogloss & Living Crowdsource Schemas ----------------

ZoneClassification = Literal[
    "Core Dialect Heartland",
    "Bi-Dialectal Isogloss Transition Belt",
    "Multi-Dialectal Convergence Zone",
]


class DialectBlendWeight(BaseModel):
    region_code: str = Field(..., description="Dialect region identifier")
    region_name: str = Field(..., description="Human-readable dialect name")
    distance_km: float = Field(..., description="Geodesic distance to regional epicenter in kilometers")
    blend_percentage: float = Field(..., ge=0.0, le=100.0, description="Inverse-distance weighting share percentage")


class IsoglossLocateResponse(BaseModel):
    latitude: float = Field(..., description="Target latitude coordinate")
    longitude: float = Field(..., description="Target longitude coordinate")
    zone_classification: ZoneClassification = Field(..., description="Dialectal transition zone typology")
    dominant_region_code: str = Field(..., description="Nearest / highest-weighted dialect region")
    secondary_region_code: Optional[str] = Field(None, description="Adjacent secondary dialect region in transition belts")
    blend_weights: List[DialectBlendWeight] = Field(default_factory=list, description="Sorted list of regional influence blend shares")
    active_border_substrates: List[str] = Field(default_factory=list, description="Active neighboring language substrates impacting this coordinate")
    interpolated_greeting_local: str = Field(..., description="Contextual colloquial greeting for this geographic point")
    interpolated_phrase_result: Dict[str, Any] = Field(default_factory=dict, description="Morphed phrase with hybrid transition notes")
    acoustic_interpolated_pitch_hz: float = Field(..., description="Weighted target fundamental pitch baseline (Hz)")


class GeoJSONFeature(BaseModel):
    type: str = Field("Feature", description="GeoJSON feature type")
    geometry: Dict[str, Any] = Field(..., description="GeoJSON geometry (Point, Polygon, LineString)")
    properties: Dict[str, Any] = Field(default_factory=dict, description="Feature attributes, colors, and names")


class GeoJSONFeatureCollection(BaseModel):
    type: str = Field("FeatureCollection", description="GeoJSON FeatureCollection")
    features: List[GeoJSONFeature] = Field(default_factory=list, description="List of geographic features")


class CommunitySubmissionRequest(BaseModel):
    contributor_name: str = Field(..., min_length=2, max_length=128, description="Name or handle of contributor")
    district_name: str = Field(..., min_length=2, max_length=128, description="Karnataka district name e.g., Belagavi, Haveri, Udupi")
    latitude: float = Field(..., ge=11.0, le=19.0, description="Latitude within Karnataka geographic bounds")
    longitude: float = Field(..., ge=74.0, le=79.0, description="Longitude within Karnataka geographic bounds")
    local_phrase_kannada: Optional[str] = Field("", description="Phrase in Kannada script")
    local_phrase_roman: str = Field(..., min_length=2, description="Phrase in Romanized phonetics")
    standard_meaning_english: str = Field(..., min_length=2, description="English definition or gloss")
    category: str = Field("daily", description="Semantic category (greeting, food, question, emotion, daily, agrarian)")


class CommunitySubmissionResponse(BaseModel):
    submission_id: int
    ai_triage_status: Literal["approved_injected", "pending_review", "rejected_spam"]
    phonotactic_validity_score: float
    nearest_region_code: str
    detected_morphological_markers: List[str] = Field(default_factory=list)
    graph_node_injected: bool
    triage_notes: str


class CommunitySubmissionItemResponse(BaseModel):
    id: int
    contributor_name: str
    district_name: str
    latitude: float
    longitude: float
    nearest_region_code: str
    local_phrase_kannada: str
    local_phrase_roman: str
    standard_meaning_english: str
    category: str
    phonotactic_validity_score: float
    ai_triage_status: str
    triage_notes: Optional[str] = None
    created_at: Any

    model_config = ConfigDict(from_attributes=True)


class PlatformStatsResponse(BaseModel):
    total_regions: int
    total_lexical_concepts: int
    total_dialect_variants: int
    graph_nodes: int
    graph_edges: int
    acoustic_profiles_ready: int
    community_submissions_total: int
    approved_living_entries: int



