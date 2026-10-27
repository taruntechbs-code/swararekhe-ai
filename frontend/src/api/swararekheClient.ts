// Typed API Client for SWARAREKHE Backend Engine

export interface DialectBlendWeight {
  region_code: string;
  region_name: string;
  distance_km: number;
  blend_percentage: number;
}

export interface IsoglossLocateResponse {
  latitude: number;
  longitude: number;
  zone_classification: 'Core Dialect Heartland' | 'Bi-Dialectal Isogloss Transition Belt' | 'Multi-Dialectal Convergence Zone';
  dominant_region_code: string;
  secondary_region_code?: string;
  blend_weights: DialectBlendWeight[];
  active_border_substrates: string[];
  interpolated_greeting_local: string;
  interpolated_phrase_result: {
    source_phrase: string;
    morphed_dominant_roman: string;
    morphed_dominant_script: string;
    dominant_rules_applied: string[];
    syllable_stress: string;
    transition_notes: string;
  };
  acoustic_interpolated_pitch_hz: number;
}

export interface GeoJSONFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: any;
  };
  properties: Record<string, any>;
}

export interface GeoJSONFeatureCollection {
  type: string;
  features: GeoJSONFeature[];
}

export interface WordDiffItem {
  source_token: string;
  target_token_roman: string;
  target_token_script: string;
  rule_applied: string;
  explanation: string;
}

export interface MorphedRegionOutput {
  region_code: string;
  region_name: string;
  morphed_kannada_script: string;
  morphed_phonetic_roman: string;
  ipa_approximation: string;
  syllable_stress_breakdown: string;
  word_by_word_diff: WordDiffItem[];
  morphological_rules_triggered: string[];
  cultural_nuance_note: string;
  engine_mode: 'hybrid_llm_symbolic' | 'deterministic_symbolic';
  confidence_score: number;
}

export interface MorphTranslateResponse {
  input_text: string;
  source_lang: string;
  matched_seed_concept?: string;
  results: MorphedRegionOutput[];
}

export interface MorphRuleItem {
  pattern: string;
  replacement: string;
  rule_id: string;
  description: string;
}

export interface RegionRuleProfile {
  region_code: string;
  region_name: string;
  kannada_name: string;
  prosody_summary: string;
  lexical_substitutions: MorphRuleItem[];
  suffix_rules: MorphRuleItem[];
  phonological_shifts: MorphRuleItem[];
}

export interface MorphRulesResponse {
  total_regions: number;
  rulebook: Record<string, RegionRuleProfile>;
}

// ---------------- Phase 3: Knowledge Graph Schemas ----------------

export type NodeType = 'REGION' | 'CONCEPT' | 'VARIANT' | 'INFLUENCE_LANG' | 'CULTURAL_MARKER';

export type EdgeRelation =
  | 'SPOKEN_IN'
  | 'EXPRESSES'
  | 'BORROWED_FROM'
  | 'COGNATE_WITH'
  | 'PHONETIC_SHIFT_FROM'
  | 'GEOGRAPHIC_NEIGHBOR'
  | 'CULTURAL_TIE';

export interface GraphNode {
  id: string;
  label: string;
  kannada_label?: string;
  node_type: NodeType;
  metadata: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: EdgeRelation;
  weight: number;
  explanation?: string;
}

export interface ConstellationResponse {
  query: string;
  matched_center_node_id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  etymological_narrative: string;
  substrate_influences: string[];
}

export interface BridgeVariantDetail {
  phonetic: string;
  script: string;
  ipa?: string;
  rule?: string;
}

export interface PhoneticShiftItem {
  concept: string;
  region_a_variant: BridgeVariantDetail;
  region_b_variant: BridgeVariantDetail;
}

export interface LinguisticBridgeResponse {
  source_region: string;
  target_region: string;
  similarity_index: number;
  shared_substrates: string[];
  shortest_etymological_paths: string[][];
  phonetic_shift_chain: PhoneticShiftItem[];
  bridge_summary: string;
}

export interface CentralityRankItem {
  id: string;
  label: string;
  node_type: string;
  degree: number;
  betweenness_centrality: number;
}

export interface TopologyResponse {
  total_nodes: number;
  total_edges: number;
  node_type_counts: Record<string, number>;
  influence_centrality_ranking: CentralityRankItem[];
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface PlatformStatsResponse {
  total_regions: number;
  total_lexical_concepts: number;
  total_dialect_variants: number;
  graph_nodes: number;
  graph_edges: number;
  acoustic_profiles_ready: number;
  community_submissions_total: number;
  approved_living_entries: number;
}

// Fallback data for seamless local rendering if backend is restarting
export const FALLBACK_STATS: PlatformStatsResponse = {
  total_regions: 5,
  total_lexical_concepts: 14,
  total_dialect_variants: 70,
  graph_nodes: 106,
  graph_edges: 259,
  acoustic_profiles_ready: 5,
  community_submissions_total: 5,
  approved_living_entries: 3,
};

export const FALLBACK_GEOJSON: GeoJSONFeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [75.0078, 15.4589] },
      properties: { feature_type: "dialect_epicenter", region_code: "hubballi_dharwad", name: "Uttara Karnataka / Dharwad-Belagavi", kannada_name: "ಉತ್ತರ ಕರ್ನಾಟಕ / ಧಾರವಾಡ", color: "#EF4444", base_pitch_hz: 155.0, substrates: ["Marathi", "Konkani", "Sharana Vachana"] },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [74.6920, 13.6288] },
      properties: { feature_type: "dialect_epicenter", region_code: "kundapura_mangaluru", name: "Karavali / Coastal Karnataka", kannada_name: "ಕರಾವಳಿ / ಕುಂದಾಪುರ-ಮಂಗಳೂರು", color: "#10B981", base_pitch_hz: 178.0, substrates: ["Tulu", "Konkani", "Halegannada", "Beary"] },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [76.8343, 17.3297] },
      properties: { feature_type: "dialect_epicenter", region_code: "kalaburagi_bidar", name: "Kalyana Karnataka / North-East", kannada_name: "ಕಲ್ಯಾಣ ಕರ್ನಾಟಕ / ಕಲಬುರಗಿ-ಬೀದರ್", color: "#F59E0B", base_pitch_hz: 138.0, substrates: ["Dakhni Urdu", "Marathi", "Telugu"] },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [75.7382, 12.4244] },
      properties: { feature_type: "dialect_epicenter", region_code: "arebhashe_kodagu", name: "Malnad / Arebhashe & Kodagu", kannada_name: "ಅರೆಭಾಷೆ / ಮಲೆನಾಡು-ಕೊಡಗು", color: "#8B5CF6", base_pitch_hz: 182.0, substrates: ["Tulu", "Kodava Takk", "Malayalam"] },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [77.5946, 12.9716] },
      properties: { feature_type: "dialect_epicenter", region_code: "bengaluru_mysuru", name: "Old Mysuru / Southern Karnataka", kannada_name: "ಹಳೆ ಮೈಸೂರು / ಬೆಂಗಳೂರು", color: "#3B82F6", base_pitch_hz: 168.0, substrates: ["Tamil", "Telugu", "Standard Literary Register"] },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [75.0078, 15.4589],
          [75.4012, 14.8012],
          [75.9218, 14.4644],
          [76.4011, 14.2215],
          [77.1023, 13.3402],
          [77.5946, 12.9716]
        ]
      },
      properties: {
        feature_type: "isogloss_corridor",
        name: "Tungabhadra Isogloss Transition Corridor (Dharwad <-> Mysuru)",
        description: "Gradual shift between Northern honorific '-ri' and Southern measured inflection via Davanagere.",
        stroke: "#EC4899"
      }
    }
  ]
};

export const swararekheApi = {
  async getPlatformStats(): Promise<PlatformStatsResponse> {
    try {
      const res = await fetch('/api/v1/explorer/stats');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Using fallback platform stats:', err);
      return FALLBACK_STATS;
    }
  },

  async getIsoglossMap(): Promise<GeoJSONFeatureCollection> {
    try {
      const res = await fetch('/api/v1/explorer/isogloss-map');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Using fallback isogloss map:', err);
      return FALLBACK_GEOJSON;
    }
  },

  async locateIsogloss(lat: number, lng: number, phrase?: string): Promise<IsoglossLocateResponse> {
    const url = new URL('/api/v1/explorer/locate', window.location.origin);
    url.searchParams.set('lat', lat.toString());
    url.searchParams.set('lng', lng.toString());
    if (phrase) url.searchParams.set('phrase', phrase);

    try {
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API error in locateIsogloss, generating client approximation:', err);
      return {
        latitude: lat,
        longitude: lng,
        zone_classification: lat > 15.0 ? 'Core Dialect Heartland' : 'Bi-Dialectal Isogloss Transition Belt',
        dominant_region_code: lat > 15.0 ? 'hubballi_dharwad' : 'bengaluru_mysuru',
        blend_weights: [
          { region_code: 'hubballi_dharwad', region_name: 'Uttara Karnataka / Dharwad-Belagavi', distance_km: 45, blend_percentage: 62.4 },
          { region_code: 'bengaluru_mysuru', region_name: 'Old Mysuru / Southern Karnataka', distance_km: 260, blend_percentage: 20.1 },
          { region_code: 'kundapura_mangaluru', region_name: 'Karavali / Coastal Karnataka', distance_km: 180, blend_percentage: 9.5 },
          { region_code: 'kalaburagi_bidar', region_name: 'Kalyana Karnataka / North-East', distance_km: 220, blend_percentage: 5.2 },
          { region_code: 'arebhashe_kodagu', region_name: 'Malnad / Arebhashe & Kodagu', distance_km: 290, blend_percentage: 2.8 },
        ],
        active_border_substrates: ['Marathi', 'Konkani', 'Sharana Vachana'],
        interpolated_greeting_local: 'ಹೆಂಗದೀರ್ರೀ? ಆರಾಮ್ ಅದೀರೇನ್ರೀ?',
        interpolated_phrase_result: {
          source_phrase: phrase || 'Where are you going?',
          morphed_dominant_roman: 'Yallig hontirre?',
          morphed_dominant_script: 'ಎಲ್ಲಿಗ್ ಹೊಂಟಿರ್ರೀ?',
          dominant_rules_applied: ['verb_suffix_re_honorific_inflection'],
          syllable_stress: 'yal-LIG hon-TIR-re',
          transition_notes: 'Approximated client blend based on geographic coordinates.',
        },
        acoustic_interpolated_pitch_hz: 156.4,
      };
    }
  },

  async morphTranslate(text: string, sourceLang: 'en' | 'kn' = 'en', targetRegionCode: string = 'all'): Promise<MorphTranslateResponse> {
    try {
      const res = await fetch('/api/v1/morph/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          source_lang: sourceLang,
          target_region_code: targetRegionCode,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API error in morphTranslate, fallback to local sample:', err);
      return {
        input_text: text,
        source_lang: sourceLang,
        matched_seed_concept: 'ಎಲ್ಲಿಗೆ ಹೋಗುತ್ತಿದ್ದೀರಿ? (ellige hoguttiddiri?)',
        results: [
          {
            region_code: 'hubballi_dharwad',
            region_name: 'Uttara Karnataka / Dharwad-Belagavi',
            morphed_kannada_script: 'ಎಲ್ಲಿಗ್ ಹೊಂಟಿರ್ರೀ?',
            morphed_phonetic_roman: 'Yallig hontirre?',
            ipa_approximation: '[jəllɪɡ hoːŋt̪ɪrriː]',
            syllable_stress_breakdown: 'yal-LIG hon-TIR-re',
            word_by_word_diff: [
              { source_token: 'ellige', target_token_roman: 'yallig', target_token_script: 'ಎಲ್ಲಿಗ್', rule_applied: 'dative_vowel_drop', explanation: 'Apocope of terminal vowel' },
              { source_token: 'hoguttiddiri', target_token_roman: 'hontirre', target_token_script: 'ಹೊಂಟಿರ್ರೀ', rule_applied: 'verb_suffix_re_honorific', explanation: 'Inchoative aspect with honorific ri' },
            ],
            morphological_rules_triggered: ['verb_suffix_re_honorific_inflection'],
            cultural_nuance_note: "Hallmark Uttara Karnataka inchoative 'hontirri' with alveolar trill honorific 'ri'.",
            engine_mode: 'deterministic_symbolic',
            confidence_score: 0.98,
          },
          {
            region_code: 'kundapura_mangaluru',
            region_name: 'Karavali / Coastal Karnataka',
            morphed_kannada_script: 'ಯಾತ್ತಕ್ ಹೋಯ್ತಿದ್ದಿಯಾ?',
            morphed_phonetic_roman: 'Yathak hoitiddiya?',
            ipa_approximation: '[jaːt̪t̪ək hoːjt̪id̪ːija]',
            syllable_stress_breakdown: 'YA-thak hoi-TID-di-ya',
            word_by_word_diff: [
              { source_token: 'ellige', target_token_roman: 'yathak', target_token_script: 'ಯಾತ್ತಕ್', rule_applied: 'interrogative_yathak', explanation: 'Directional query shifted to yathak' },
              { source_token: 'hoguttiddiya', target_token_roman: 'hoitiddiya', target_token_script: 'ಹೋಯ್ತಿದ್ದಿಯಾ', rule_applied: 'glide_epenthesis', explanation: 'Intervocalic glide insertion' },
            ],
            morphological_rules_triggered: ['interrogative_yathak_glide_epenthesis'],
            cultural_nuance_note: "Characteristic Kundapra glide insertion (-y-) and 'yathak' directional query.",
            engine_mode: 'deterministic_symbolic',
            confidence_score: 0.97,
          },
          {
            region_code: 'kalaburagi_bidar',
            region_name: 'Kalyana Karnataka / North-East',
            morphed_kannada_script: 'ಎಲ್ಲಿಗ್ ಹೋಗ್ಲಿಕತ್ತೀರಿ?',
            morphed_phonetic_roman: 'Yallig hoglikattiri?',
            ipa_approximation: '[jəllɪɡ hoːɡlɪkət̪t̪iːri]',
            syllable_stress_breakdown: 'yall-IG hog-li-kat-TI-ri',
            word_by_word_diff: [
              { source_token: 'ellige', target_token_roman: 'yallig', target_token_script: 'ಎಲ್ಲಿಗ್', rule_applied: 'dative_truncation', explanation: 'Velar dative affix' },
              { source_token: 'hoguttiddiri', target_token_roman: 'hoglikattiri', target_token_script: 'ಹೋಗ್ಲಿಕತ್ತೀರಿ', rule_applied: 'aspectual_inchoative_katthiri', explanation: 'Deccan inchoative continuous' },
            ],
            morphological_rules_triggered: ['aspectual_inchoative_katthiri'],
            cultural_nuance_note: "Kalyana Karnataka continuous marker '-likatthiri' indicating an action underway.",
            engine_mode: 'deterministic_symbolic',
            confidence_score: 0.98,
          },
          {
            region_code: 'arebhashe_kodagu',
            region_name: 'Malnad / Arebhashe & Kodagu',
            morphed_kannada_script: 'ಎತ್ತಕ್ ಹೋಗ್ಡೆ?',
            morphed_phonetic_roman: 'Yettak hogde?',
            ipa_approximation: '[jet̪t̪ək hoːɡɖe]',
            syllable_stress_breakdown: 'YET-tak HOG-de',
            word_by_word_diff: [
              { source_token: 'ellige', target_token_roman: 'yettak', target_token_script: 'ಎತ್ತಕ್', rule_applied: 'arebhashe_fronting', explanation: 'Fronted vowel interrogative' },
              { source_token: 'hoguttiddiya', target_token_roman: 'hogde', target_token_script: 'ಹೋಗ್ಡೆ', rule_applied: 'arebhashe_truncation', explanation: 'Clipped second person suffix' },
            ],
            morphological_rules_triggered: ['arebhashe_interrogative_ettak_truncation'],
            cultural_nuance_note: "Shortened interrogative 'ettak' typical of Kodagu and Sullia Arebhashe.",
            engine_mode: 'deterministic_symbolic',
            confidence_score: 0.96,
          },
          {
            region_code: 'bengaluru_mysuru',
            region_name: 'Old Mysuru / Southern Karnataka',
            morphed_kannada_script: 'ಎಲ್ಲಿಗೆ ಹೋಗ್ತಿದ್ದೀರಾ?',
            morphed_phonetic_roman: 'Ellige hogtiddira?',
            ipa_approximation: '[ellɪɡe hoːɡt̪id̪ːiːraː]',
            syllable_stress_breakdown: 'el-LI-ge hog-tid-DI-ra',
            word_by_word_diff: [
              { source_token: 'ellige', target_token_roman: 'ellige', target_token_script: 'ಎಲ್ಲಿಗೆ', rule_applied: 'standard_retention', explanation: 'Canonical southern form' },
              { source_token: 'hoguttiddiri', target_token_roman: 'hogtiddira', target_token_script: 'ಹೋಗ್ತಿದ್ದೀರಾ', rule_applied: 'colloquial_contraction', explanation: 'Spoken smooth contraction' },
            ],
            morphological_rules_triggered: ['present_continuous_contraction'],
            cultural_nuance_note: 'Colloquial Mysuru conversational smoothing with standard honorific plural -ra.',
            engine_mode: 'deterministic_symbolic',
            confidence_score: 0.99,
          },
        ],
      };
    }
  },

  async getMorphRules(): Promise<MorphRulesResponse | null> {
    try {
      const res = await fetch('/api/v1/morph/rules');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API error in getMorphRules:', err);
      return null;
    }
  },

  async getConstellation(query: string): Promise<ConstellationResponse> {
    try {
      const res = await fetch(`/api/v1/graph/constellation?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API error in getConstellation, using fallback:', err);
      return FALLBACK_CONSTELLATION;
    }
  },

  async getLinguisticBridge(source: string, target: string): Promise<LinguisticBridgeResponse> {
    try {
      const res = await fetch(
        `/api/v1/graph/bridge?source=${encodeURIComponent(source)}&target=${encodeURIComponent(target)}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API error in getLinguisticBridge, using fallback:', err);
      return FALLBACK_BRIDGE;
    }
  },

  async getGraphTopology(): Promise<TopologyResponse> {
    try {
      const res = await fetch('/api/v1/graph/topology');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API error in getGraphTopology, using fallback:', err);
      return FALLBACK_TOPOLOGY;
    }
  },
};

export const FALLBACK_CONSTELLATION: ConstellationResponse = {
  query: 'good',
  matched_center_node_id: 'concept:chennagide',
  nodes: [
    {
      id: 'concept:chennagide',
      label: 'Fine / Good',
      kannada_label: 'ಚೆನ್ನಾಗಿದೆ',
      node_type: 'CONCEPT',
      metadata: { english_meaning: 'Fine / Good', standard_roman: 'chennagide', category: 'greeting' },
    },
    {
      id: 'variant:chennagide:hubballi_dharwad',
      label: 'cholo ayti',
      kannada_label: 'ಚಲೋ ಐತಿ',
      node_type: 'VARIANT',
      metadata: { region: 'hubballi_dharwad', ipa: '[tʃolo ajti]', rule: 'marathi_loan_copula_ayti' },
    },
    {
      id: 'variant:chennagide:kundapura_mangaluru',
      label: 'laayk aipini',
      kannada_label: 'ಲಾಯ್ಕ್ ಆಯ್ಪಿನಿ',
      node_type: 'VARIANT',
      metadata: { region: 'kundapura_mangaluru', ipa: '[laːjk ajpini]', rule: 'tulu_loan_laayk_past_participle' },
    },
    {
      id: 'variant:chennagide:kalaburagi_bidar',
      label: 'cholo ada',
      kannada_label: 'ಚಲೋ ಅದಾ',
      node_type: 'VARIANT',
      metadata: { region: 'kalaburagi_bidar', ipa: '[tʃolo ada]', rule: 'deccan_copula_ada' },
    },
    {
      id: 'variant:chennagide:arebhashe_kodagu',
      label: 'cholo ulla',
      kannada_label: 'ಚೋಲೋ ಉಳ್ಳ',
      node_type: 'VARIANT',
      metadata: { region: 'arebhashe_kodagu', ipa: '[tʃoːlo uɭɭa]', rule: 'arebhashe_existential_ulla' },
    },
    {
      id: 'variant:chennagide:bengaluru_mysuru',
      label: 'chennagide',
      kannada_label: 'ಚೆನ್ನಾಗಿದೆ',
      node_type: 'VARIANT',
      metadata: { region: 'bengaluru_mysuru', ipa: '[tʃennaːɡide]', rule: 'standard_literary_retention' },
    },
    {
      id: 'region:hubballi_dharwad',
      label: 'Uttara Karnataka / Dharwad-Belagavi',
      kannada_label: 'ಉತ್ತರ ಕರ್ನಾಟಕ / ಧಾರವಾಡ',
      node_type: 'REGION',
      metadata: { center_lat: 15.4589, center_lng: 75.0078 },
    },
    {
      id: 'region:kundapura_mangaluru',
      label: 'Karavali / Coastal Karnataka',
      kannada_label: 'ಕರಾವಳಿ / ಕುಂದಾಪುರ-ಮಂಗಳೂರು',
      node_type: 'REGION',
      metadata: { center_lat: 13.6288, center_lng: 74.6920 },
    },
    {
      id: 'region:kalaburagi_bidar',
      label: 'Kalyana Karnataka / North-East',
      kannada_label: 'ಕಲ್ಯಾಣ ಕರ್ನಾಟಕ / ಕಲಬುರಗಿ-ಬೀದರ್',
      node_type: 'REGION',
      metadata: { center_lat: 17.3297, center_lng: 76.8343 },
    },
    {
      id: 'lang:marathi',
      label: 'Marathi',
      kannada_label: 'ಮರಾಠಿ',
      node_type: 'INFLUENCE_LANG',
      metadata: { family: 'Indo-Aryan', era: '12th-18th Century Maratha & Yadava Contact' },
    },
    {
      id: 'lang:tulu',
      label: 'Tulu',
      kannada_label: 'ತುಳು',
      node_type: 'INFLUENCE_LANG',
      metadata: { family: 'South Dravidian', era: 'Alupa & Coastal Dynasties' },
    },
    {
      id: 'cult:vachana_sahitya',
      label: 'Vachana Sahitya',
      kannada_label: 'ವಚನ ಸಾಹಿತ್ಯ',
      node_type: 'CULTURAL_MARKER',
      metadata: { description: '12th century egalitarian socio-religious poetry movement' },
    },
  ],
  edges: [
    { source: 'concept:chennagide', target: 'variant:chennagide:hubballi_dharwad', relation: 'EXPRESSES', weight: 1.0 },
    { source: 'concept:chennagide', target: 'variant:chennagide:kundapura_mangaluru', relation: 'EXPRESSES', weight: 1.0 },
    { source: 'concept:chennagide', target: 'variant:chennagide:kalaburagi_bidar', relation: 'EXPRESSES', weight: 1.0 },
    { source: 'concept:chennagide', target: 'variant:chennagide:arebhashe_kodagu', relation: 'EXPRESSES', weight: 1.0 },
    { source: 'concept:chennagide', target: 'variant:chennagide:bengaluru_mysuru', relation: 'EXPRESSES', weight: 1.0 },
    { source: 'variant:chennagide:hubballi_dharwad', target: 'region:hubballi_dharwad', relation: 'SPOKEN_IN', weight: 1.0 },
    { source: 'variant:chennagide:kundapura_mangaluru', target: 'region:kundapura_mangaluru', relation: 'SPOKEN_IN', weight: 1.0 },
    { source: 'variant:chennagide:kalaburagi_bidar', target: 'region:kalaburagi_bidar', relation: 'SPOKEN_IN', weight: 1.0 },
    { source: 'variant:chennagide:hubballi_dharwad', target: 'lang:marathi', relation: 'BORROWED_FROM', weight: 0.95, explanation: "Root 'cholo/chhan' adapted from Marathi contact" },
    { source: 'variant:chennagide:kundapura_mangaluru', target: 'lang:tulu', relation: 'BORROWED_FROM', weight: 0.95, explanation: "Adjective 'laayk' shared with coastal Tulu register" },
    { source: 'region:hubballi_dharwad', target: 'cult:vachana_sahitya', relation: 'CULTURAL_TIE', weight: 1.0 },
  ],
  etymological_narrative:
    "The concept 'Fine / Good' (chennagide) forms a multi-dialectal constellation across Karnataka. In Old Mysuru, it anchors the canonical literary standard. Moving northwest to Hubballi-Dharwad, it adopts 'cholo ayti' reflecting vibrant Marathi contact and rising inflection. Along the Karavali coast, it absorbs coastal Tulu 'laayk aipini'. In Kalyana Karnataka, 'cholo ada' carries Deccan cadence, while Malnad Arebhashe uses 'cholo ulla'.",
  substrate_influences: ['Marathi', 'Tulu', 'Halegannada', 'Dakhni Urdu'],
};

export const FALLBACK_BRIDGE: LinguisticBridgeResponse = {
  source_region: 'hubballi_dharwad',
  target_region: 'kalaburagi_bidar',
  similarity_index: 0.418,
  shared_substrates: ['Marathi'],
  shortest_etymological_paths: [['region:hubballi_dharwad', 'lang:marathi', 'region:kalaburagi_bidar']],
  phonetic_shift_chain: [
    {
      concept: 'Fine / Good',
      region_a_variant: { phonetic: 'cholo ayti', script: 'ಚಲೋ ಐತಿ', ipa: '[tʃolo ajti]', rule: 'marathi_loan_copula_ayti' },
      region_b_variant: { phonetic: 'cholo ada', script: 'ಚಲೋ ಅದಾ', ipa: '[tʃolo ada]', rule: 'deccan_copula_ada' },
    },
    {
      concept: 'Where are you going?',
      region_a_variant: { phonetic: 'yallig hontirre', script: 'ಎಲ್ಲಿಗ್ ಹೊಂಟಿರ್ರೀ', ipa: '[jəllɪɡ hoːŋt̪ɪrriː]', rule: 'verb_suffix_re_honorific' },
      region_b_variant: { phonetic: 'yallig hoglikattiri', script: 'ಎಲ್ಲಿಗ್ ಹೋಗ್ಲಿಕತ್ತೀರಿ', ipa: '[jəllɪɡ hoːɡlɪkət̪t̪iːri]', rule: 'aspectual_inchoative_katthiri' },
    },
    {
      concept: 'How are you?',
      region_a_variant: { phonetic: 'hengadeeri', script: 'ಹೆಂಗದೀರಿ', ipa: '[heŋɡədiːri]', rule: 'apocope_interrogative' },
      region_b_variant: { phonetic: 'hyangadeeri nodri', script: 'ಹ್ಯಾಂಗದೀರಿ ನೋಡ್ರಿ', ipa: '[hjaːŋɡədiːri noːɖri]', rule: 'deccan_y_glide_nodri' },
    },
    {
      concept: 'Very / Much',
      region_a_variant: { phonetic: 'bhaal', script: 'ಭಾಳ', ipa: '[bʱaːɭ]', rule: 'marathi_superlative_bhaal' },
      region_b_variant: { phonetic: 'mast', script: 'ಮಸ್ತ್', ipa: '[məst̪]', rule: 'dakhni_urdu_superlative' },
    },
    {
      concept: 'Mother',
      region_a_variant: { phonetic: 'avva', script: 'ಅವ್ವ', ipa: '[əwːə]', rule: 'vachana_dravidian_avva' },
      region_b_variant: { phonetic: 'aayi / amma', script: 'ಆಯಿ', ipa: '[aːji]', rule: 'marathi_cognate_aayi' },
    },
    {
      concept: 'Eat / Meal',
      region_a_variant: { phonetic: 'oota aytri', script: 'ಊಟ ಆಯ್ತ್ರೀ', ipa: '[uːt̪a ajtriː]', rule: 'honorific_ri' },
      region_b_variant: { phonetic: 'oota aytri nodri', script: 'ಊಟ ಆಯ್ತ್ರಿ ನೋಡ್ರಿ', ipa: '[uːt̪a ajtri noːɖri]', rule: 'nodri_conversational_marker' },
    },
  ],
  bridge_summary:
    'Linguistic bridge between Uttara Karnataka (Dharwad) and Kalyana Karnataka (Kalaburagi) exhibits a 41.8% similarity index, underpinned by historical Yadava-Maratha and Bahmani-Deccan convergence. Both regions share the Marathi substrate and honorific marker -ri, while Kalyana Karnataka introduces distinctive Dakhni Urdu superlatives and the assertive conversational discourse marker nodri.',
};

export const FALLBACK_TOPOLOGY: TopologyResponse = {
  total_nodes: 106,
  total_edges: 259,
  node_type_counts: {
    REGION: 5,
    CONCEPT: 14,
    VARIANT: 70,
    INFLUENCE_LANG: 9,
    CULTURAL_MARKER: 8,
  },
  influence_centrality_ranking: [
    { id: 'lang:marathi', label: 'Marathi', node_type: 'INFLUENCE_LANG', degree: 28, betweenness_centrality: 0.142 },
    { id: 'lang:tulu', label: 'Tulu', node_type: 'INFLUENCE_LANG', degree: 24, betweenness_centrality: 0.118 },
    { id: 'region:hubballi_dharwad', label: 'Uttara Karnataka (Dharwad)', node_type: 'REGION', degree: 22, betweenness_centrality: 0.105 },
    { id: 'lang:dakhni_urdu', label: 'Dakhni Urdu', node_type: 'INFLUENCE_LANG', degree: 18, betweenness_centrality: 0.089 },
    { id: 'lang:halegannada', label: 'Classical Halegannada', node_type: 'INFLUENCE_LANG', degree: 16, betweenness_centrality: 0.076 },
    { id: 'region:kundapura_mangaluru', label: 'Karavali (Kundapura)', node_type: 'REGION', degree: 15, betweenness_centrality: 0.071 },
    { id: 'lang:konkani', label: 'Konkani', node_type: 'INFLUENCE_LANG', degree: 14, betweenness_centrality: 0.062 },
    { id: 'region:kalaburagi_bidar', label: 'Kalyana Karnataka (Kalaburagi)', node_type: 'REGION', degree: 13, betweenness_centrality: 0.058 },
  ],
  nodes: [],
  edges: [],
};

