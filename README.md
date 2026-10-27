# SWARAREKHE (ಸ್ವರರೇಖೆ)
### Spatio-Acoustic Dialect & Cultural Graph Engine for Namma Kannada

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![SQLAlchemy 2.0](https://img.shields.io/badge/SQLAlchemy-2.0-red.svg)](https://www.sqlalchemy.org/)
[![NetworkX](https://img.shields.io/badge/NetworkX-3.2+-orange.svg)](https://networkx.org/)
[![Librosa DSP](https://img.shields.io/badge/Librosa-0.11+-brightgreen.svg)](https://librosa.org/)
[![Tests Passing](https://img.shields.io/badge/pytest-26%20passed-success.svg)](https://docs.pytest.org/)

**SWARAREKHE** (*Spatio-Acoustic Dialect & Cultural Graph Engine*) is an advanced neuro-symbolic and acoustic intelligence platform preserving, morphing, and analyzing the rich regional dialects of the Kannada language across Karnataka's diverse geographic, historical, and acoustic landscape.

---

## 🏛️ System Architecture

```
                                  ┌────────────────────────────────────────────────────────┐
                                  │           SWARAREKHE BACKEND (FastAPI)                 │
                                  └────────────────────────────────────────────────────────┘
                                                               │
        ┌──────────────────────────────┬───────────────────────┼──────────────────────────────┬──────────────────────────────┐
        ▼                              ▼                       ▼                              ▼                              ▼
 ┌───────────────┐             ┌───────────────┐       ┌───────────────┐              ┌───────────────┐              ┌───────────────┐
 │    Phase 1    │             │    Phase 2    │       │    Phase 3    │              │    Phase 4    │              │    Phase 5+   │
 │ Async Database│             │ Neuro-Symbolic│       │ Etymological  │              │ Acoustic DSP  │              │ UI & Graph    │
 │ & Seed Corpus │             │ Transduction  │       │  Graph Engine │              │Cadence Coach  │              │ Visualizer    │
 └──────┬────────┘             └───────┬───────┘       └───────┬───────┘              └───────┬───────┘              └───────┬───────┘
        │                              │                       │                              │                              │
  • 5 Core Regions              • Corpus Matcher        • NetworkX MultiDiGraph        • Synthetic Audio (.wav)       • (Upcoming)
  • 14 Concepts (70 Variants)   • Suffix Transducer     • 105 Nodes / 258 Edges        • Librosa F0 / YIN Pitch
  • Prosody Profiles            • Stress & IPA Rules    • Ego-Constellations           • Cadence Matching (0-100)
  • SQLite + aiosqlite          • Hybrid Gemini Refiner • Linguistic Bridge            • Prosody Coaching Tips
```

---

## 🗺️ The 5 Dialect Regions of Karnataka

| Region Code | Region Name | Kannada Name | Coordinates | Border Influences | Primary Acoustic Cadence |
|---|---|---|---|---|---|
| `bengaluru_mysuru` | **Old Mysuru / Southern** | ಹಳೆ ಮೈಸೂರು / ಬೆಂಗಳೂರು | (12.9716, 77.5946) | Tamil, Telugu, Literary Register | Moderate tempo, penultimate syllable stress |
| `hubballi_dharwad` | **Uttara Karnataka / Dharwad** | ಉತ್ತರ ಕರ್ನಾಟಕ / ಧಾರವಾಡ | (15.4589, 75.0078) | Marathi, Konkani, Sharana Vachana | Brisk staccato, sharp rising terminal inflection (`-ri`) |
| `kundapura_mangaluru` | **Karavali / Coastal** | ಕರಾವಳಿ / ಕುಂದಾಪುರ-ಮಂಗಳೂರು | (13.6288, 74.6920) | Tulu, Konkani, Halegannada, Beary | Rapid cascading, melodic sing-song undulations |
| `kalaburagi_bidar` | **Kalyana Karnataka / North-East**| ಕಲ್ಯಾಣ ಕರ್ನಾಟಕ / ಕಲಬುರಗಿ-ಬೀದರ್ | (17.3297, 76.8343) | Dakhni Urdu, Marathi, Telugu | Syllable-timed deliberate flow, falling drawl on `nodri` |
| `arebhashe_kodagu` | **Malnad / Arebhashe & Kodagu** | ಅರೆಭಾಷೆ / ಮಲೆನಾಡು-ಕೊಡಗು | (12.4244, 75.7382) | Tulu, Kodava Takk, Malayalam | Bouncing mid-high accents, clipped terminal syllables |

---

## 🚀 Phases Implemented & Verified

### 📍 Phase 1: Project Scaffolding, Async Schema & Seed Corpus
- **Async Database Stack**: SQLAlchemy 2.0 with `aiosqlite` and Pydantic v2 schemas (`from_attributes=True`).
- **Data Models**:
  - `DialectRegion`: Geospatial centroids, prosody profiles (tempo, pitch range, cadence, terminal inflection), and border influences.
  - `LexicalEntry`: Standard Kannada, Romanized transliteration, English gloss, semantic category, and grammatical POS.
  - `DialectVariant`: Regional script, Roman phonetic, IPA pronunciation, morphological rules, example sentences, and confidence scores.
- **Corpus Seeding**: Idempotent database seeder (`backend/seed_data.py`) populating 5 regions and 14 core concepts (70 authentic regional variants).
- **Core Endpoints**:
  - `GET /health` — Service diagnostics and real-time entity counts.
  - `GET /api/v1/regions` — All dialect regions with prosodic and geographical metadata.
  - `GET /api/v1/lexicon` — Complete lexicon with optional `?category=` and `?region_code=` filters.

---

### 🔀 Phase 2: Neuro-Symbolic Dialect Morphing & Phonetic Transduction
- **A. Corpus Semantic & Fuzzy Matcher**:
  - Automatically maps common English/Kannada concepts (*"Where are you going?"*, *"How are you?"*, *"Have you eaten?"*) directly to authentic field variants.
- **B. Deterministic Suffix & Phonological Transducer (`RuleBasedTransducer`)**:
  - Transduces unseen and composite sentences (e.g., *"Neenu ellige hoguttiddiya? Oota chennagide, tumba beku"*):
    - **Hubballi-Dharwad**: `chennagide` $\to$ `cholo ayti`, `tumba` $\to$ `bhaal`, `ellige` $\to$ `yallig`, `hoguttiddiya` $\to$ `hontirri`, `beku` $\to$ `bekri`.
    - **Kundapura-Mangaluru**: `ellige` $\to$ `yathak`, `hoguttiddiya` $\to$ `hoitiddiya`, `chennagide` $\to$ `laayk aipini`, `tumba` $\to$ `baari`, `huduga` $\to$ `maani`.
    - **Kalaburagi-Bidar**: `hoguttiddiri` $\to$ `hoglikattiri`, `chennagide` $\to$ `cholo ada`, `tumba` $\to$ `mast`, `begane` $\to$ `jaldi`, affirmative conversational marker `nodri`.
    - **Arebhashe-Kodagu**: `ellige` $\to$ `yettak`, `hoguttiddiya` $\to$ `hogde`, `chennagide` $\to$ `cholo ulla`, `oota` $\to$ `koolu`.
- **C. Prosody Synthesis**:
  - Dynamic syllable stress generator (e.g. `Yal-LIG hon-TIR-re`, `MAAN-i YATH-ak HOIT-idd-iya`).
  - Automatic phonetic-to-IPA approximation mapping.
  - Token-level derivation explanation chain (`WordDiffItem`).
- **D. Hybrid Gemini LLM Grounding**:
  - When `GEMINI_API_KEY` is present, uses `gemini-2.5-flash` via `google-genai` to polish syntax while strictly preserving regional suffix rules.
  - Seamlessly falls back to 100% offline deterministic symbolic mode (`"deterministic_symbolic"`) if key is absent.
- **Endpoints**:
  - `POST /api/v1/morph/translate` — Morph text across `"all"` 5 regions or a specific region code.
  - `GET /api/v1/morph/rules` — Exposes the complete linguistic transformation rulebook.

---

### 🕸️ Phase 3: Etymological & Cultural Knowledge Graph Engine
- **NetworkX MultiDiGraph**:
  - **105 Nodes**: 5 `REGION`, 14 `CONCEPT`, 70 `VARIANT`, 9 `INFLUENCE_LANG`, and 7 `CULTURAL_MARKER` entities.
  - **258 Typed Edges**: `EXPRESSES`, `SPOKEN_IN`, `BORROWED_FROM`, `COGNATE_WITH`, `PHONETIC_SHIFT_FROM`, `GEOGRAPHIC_NEIGHBOR`, and `CULTURAL_TIE`.
- **Graph Algorithms & Analytics**:
  - **Concept Constellation Ego-Graphs (`GET /api/v1/graph/constellation?query={word}`)**: Extracts a 2-hop ego-graph around matched concepts/variants, highlighting substrate influences and narrative etymological shift commentary.
  - **Linguistic Bridge Analytics (`GET /api/v1/graph/bridge?source={r1}&target={r2}`)**: Computes composite similarity index ($0.0 - 1.0$) based on shared substrate languages (Jaccard index), geographic Haversine distance, and cultural ties. Generates side-by-side lexical cognate comparisons.
  - **Full Topology Export (`GET /api/v1/graph/topology`)**: Serializes full graph structure with degree and betweenness centrality rankings for D3/force-directed visualization.

---

### 🎙️ Phase 4: Acoustic Prosody, Pitch Contour ($F_0$), and Cadence DSP
- **Harmonic Synthetic Audio Synthesis (22,050 Hz)**:
  - Generates authentic `.wav` audio files in `backend/static/audio_samples/`:
    - `hubballi_dharwad.wav`: Base $F_0 \approx 155\text{ Hz}$ with sharp $+4.5\text{ Hz/frame}$ rising terminal inflection on honorifics (`-ri`/`-avri`).
    - `kundapura_mangaluru.wav`: High-density cadence ($7.5\text{ syllables/sec}$) with sing-song melodic undulation ($160\text{--}205\text{ Hz}$).
    - `kalaburagi_bidar.wav`: Grounded lower register ($138\text{ Hz}$) with deliberate timing and falling terminal drawl on `nodri`.
    - `arebhashe_kodagu.wav`: Bouncing highland rhythm ($182\text{ Hz}$) with clipped terminal syllable drops.
    - `bengaluru_mysuru.wav`: Measured standard tempo ($3.8\text{ syllables/sec}$) with penultimate syllable stress.
- **Librosa DSP Feature Extractor**:
  - Extracts Fundamental Frequency ($F_0$) pitch curves via Librosa YIN with median smoothing and unvoiced frame filtering.
  - Computes RMS energy envelope via `librosa.feature.rms`.
  - Measures syllable onset rate via `librosa.onset.onset_detect`.
  - Linear regression on the final 20% of the $F_0$ contour to quantify terminal inflection slope.
- **Cadence Matcher & Prosody Coaching**:
  - Computes composite similarity score ($0 - 100\%$).
  - Delivers actionable coaching tips (e.g. advising learners to sharpen their terminal rise for Dharwad or slow down for Deccan vowel enunciation).
- **Endpoints**:
  - `GET /api/v1/acoustic/profile/{region_code}` — Reference pitch contour array, energy envelope, and cadence metrics.
  - `POST /api/v1/acoustic/analyze` — Multipart file upload (`audio_file`) or test `sample_code` analysis with coaching feedback.
  - `GET /static/audio_samples/{filename}` — Static file serving of regional synthetic audio.

---

### 🌐 Phase 5: Geospatial Isogloss Interpolation & Living Crowdsourced Dictionary
- **Inverse-Distance Weighting (IDW) Engine**:
  - Implements $w_i = \frac{1}{(d_i + \epsilon)^p} / \sum \frac{1}{(d_k + \epsilon)^p}$ with power $p = 2.0$ to calculate fine-grained dialect blend percentages from any arbitrary `(lat, lng)` point in Karnataka to the 5 core epicenters.
  - Typological Classification:
    - `Core Dialect Heartland`: Dominant share $\ge 65\%$ (e.g. Dharwad hub $\to 100\%$).
    - `Bi-Dialectal Isogloss Transition Belt`: Top two shares sum $\ge 70\%$ and delta $\le 30\%$ (e.g. Davanagere Tungabhadra corridor).
    - `Multi-Dialectal Convergence Zone`: Intersecting regional transition waves.
  - Interpolates hybrid acoustic pitch baselines ($F_{0,\text{interp}}$) and synthesizes code-switching transition notes.
- **Cartographic GeoJSON Representation**:
  - Standard GeoJSON `FeatureCollection` including regional hub Points, boundary territorial Polygons, and major isogloss transition corridors (*Tungabhadra Corridor, Western Ghats Escarpment, Deccan Basin Corridor, Southern Kaveri Plains*).
- **Living Crowdsourced Dictionary & Automated Phonotactic Triage**:
  - Evaluates user submissions using deterministic Dravidian phonotactic heuristics (vowel-consonant ratios, authentic regional markers `-ri`, `-avri`, `-likattiri`, `-aipini`, `-ulla`, `cholo`, `bhaal`, `laayk`, `mast`, coordinate checks, anti-spam filters).
  - High-confidence submissions (score $\ge 0.70$) receive `"approved_injected"` status and are **dynamically injected into the live NetworkX Knowledge Graph as new living `VARIANT` nodes and edges in real time**!
- **Endpoints**:
  - `GET /api/v1/explorer/locate?lat={lat}&lng={lng}` — IDW blend weights, zone classification, and hybrid phrase morphing.
  - `GET /api/v1/explorer/isogloss-map` — Standard GeoJSON FeatureCollection.
  - `POST /api/v1/explorer/contribute` — Living dictionary submission with automated phonotactic evaluation.
  - `GET /api/v1/explorer/submissions` — Chronological listing of crowdsourced dialect submissions.
  - `GET /api/v1/explorer/stats` — Platform-wide intelligence counts across SQLite, NetworkX, and DSP engines.

---

### 🎨 Phase 6: Frontend Foundation, Interactive Karnataka Isogloss Map & Morphing Working Sheet
- **Linguist's Sketch Design System**:
  - Built with React 18, TypeScript, and Vite following the authentic Sketch design aesthetic: warm paper ground (`#f7f2e7`), dark pencil ink (`#38352f`), blue notes (`#344c69`), red actions/marks (`#9e3a2e`), paper scraps, and erased-line rules.
  - Typographic stack: **Kalam**, **Caveat**, **Patrick Hand**, and crisp **Noto Sans Kannada**.
  - Immediate operational working sheet — no artificial marketing cards or nested containers.
- **Interactive SVG Karnataka Isogloss Field Map**:
  - Precision coordinate projection across Karnataka ($11.4^\circ\text{N} - 18.7^\circ\text{N}$, $73.8^\circ\text{E} - 78.8^\circ\text{E}$).
  - Displays territorial dialect polygons and the 4 major transition corridors (*Tungabhadra, Deccan Basin, Western Ghats, Southern Kaveri*).
  - Clickable coordinates with dynamic survey town pins (Dharwad, Kundapura, Kalaburagi, Madikeri, Bengaluru, Davanagere, Belagavi, Hassan, Shivamogga).
  - Real-time IDW dialect blend breakdown ledger with pencil-ink progress bars and active border substrate markers.
- **Neuro-Symbolic Morphing Working Sheet**:
  - Dual English / Standard Kannada input bar with quick prompt chips.
  - 5 broad horizontal comparison rows across all dialect zones with active region highlighting.
  - Large Kannada script, Roman phonetic transcription, blue IPA pronunciation, and hand-underlined Syllable Stress notation.
  - Expandable word-by-word morphological derivation breakdown with pencil strikethroughs and rule tags.
  - Field notes in blue ink marginalia styling.
  - Audio Cadence playback with fallback Web Audio API pitch sweep oscillator.
  - 5-Region Phonological & Suffix Transduction Rulebook modal/drawer.

---

### 🕸️ Phase 7: Interactive Etymological Constellation Graph & Linguistic Bridge Working Sheet
- **Interactive SVG Mind-Map Constellation Explorer**:
  - Consumes `/api/v1/graph/constellation?query=...` to render a 2-hop ego-graph looking like a field linguist's hand-drawn mind map on taped graph paper.
  - Distinct Sketch node styles by semantic type:
    - `CONCEPT`: Double concentric circle center hub with yellow highlight (`#f0dfa0`).
    - `VARIANT`: Outlined paper scrap pill showing Romanized phonetic and Kannada script.
    - `REGION`: Stamped district tag in light red tint.
    - `INFLUENCE_LANG`: Red-outlined substrate badge with star marker (*Marathi*, *Tulu*, *Konkani*, *Dakhni Urdu*, *Halegannada*, *Kodava*).
    - `CULTURAL_MARKER`: Blue annotation tag (*Vachana Sahitya*, *Yakshagana*, *Deccan Court Poetry*).
  - Directed edges with relation pills (`BORROWED_FROM`, `COGNATE_WITH`, `SPOKEN_IN`, `EXPRESSES`, `CULTURAL_TIE`).
  - Interactive pan, zoom (`ZoomIn`, `ZoomOut`), reset (`RotateCcw`), and interactive node drag-and-drop.
  - Stable adjacent **Field Etymology Note** panel presenting narrative travelogue, active substrate tags, and dynamic node metadata inspector without layout shifting.
- **Linguistic Bridge & Substrate Comparator**:
  - Dual region dropdown selector with swap icon button (`ArrowLeftRight`).
  - Consumes `/api/v1/graph/bridge?source={r1}&target={r2}` to display:
    - **Linguistic Similarity Index**: Large marker score (e.g. `41.8% Match`) in a hand-drawn bracket.
    - Shared border substrates and shortest relational graph paths.
    - **Side-by-Side Cognate Shift Ledger**: Broad horizontal comparative rows tracing canonical concepts and morphological rules between the two selected regions.
- **NetworkX Graph Topology Centrality Strip**:
  - Consumes `/api/v1/graph/topology` to display a compact horizontal strip of entity counts and top-ranked influence substrates and regional hubs by degree/betweenness centrality.

---

## 🛠️ Installation & Setup

### 1. Backend Setup
```bash
git clone https://github.com/taruntechbs-code/swararekhe-ai.git
cd swararekhe-ai

python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
python -m backend.seed_data
uvicorn backend.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser. Vite proxies API requests to `http://127.0.0.1:8000`.

To create an optimized production build:
```bash
npm run build
```
Interactive API documentation will be available at:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🧪 Testing & Verification

Run the full pytest suite across all 5 phases:
```bash
pytest backend/tests/ -v
```

Output:
```
backend/tests/test_phase1.py::test_health_endpoint PASSED
backend/tests/test_phase1.py::test_get_dialect_regions PASSED
backend/tests/test_phase1.py::test_get_lexicon PASSED
backend/tests/test_phase1.py::test_lexicon_filtering_by_category PASSED
backend/tests/test_phase1.py::test_lexicon_filtering_by_region_code PASSED
backend/tests/test_phase2.py::test_morph_direct_seed_match PASSED
backend/tests/test_phase2.py::test_morph_unseen_composite_phrase PASSED
backend/tests/test_phase2.py::test_morph_single_region_targeting PASSED
backend/tests/test_phase2.py::test_morph_invalid_region_code PASSED
backend/tests/test_phase2.py::test_get_morph_rules PASSED
backend/tests/test_phase3.py::test_graph_topology PASSED
backend/tests/test_phase3.py::test_graph_constellation PASSED
backend/tests/test_phase3.py::test_graph_constellation_not_found PASSED
backend/tests/test_phase3.py::test_graph_linguistic_bridge PASSED
backend/tests/test_phase3.py::test_graph_bridge_invalid_region PASSED
backend/tests/test_phase4.py::test_synthetic_wav_files_presence PASSED
backend/tests/test_phase4.py::test_get_acoustic_profile PASSED
backend/tests/test_phase4.py::test_get_acoustic_profile_invalid PASSED
backend/tests/test_phase4.py::test_analyze_cadence_sample_code PASSED
backend/tests/test_phase4.py::test_analyze_cadence_file_upload PASSED
backend/tests/test_phase5.py::test_isogloss_locate_core_heartland PASSED
backend/tests/test_phase5.py::test_isogloss_locate_transition_belt PASSED
backend/tests/test_phase5.py::test_isogloss_geojson_map PASSED
backend/tests/test_phase5.py::test_community_submission_living_dictionary PASSED
backend/tests/test_phase5.py::test_community_submission_spam_rejection PASSED
backend/tests/test_phase5.py::test_list_submissions PASSED
======================== 26 passed in 1.15s ========================
```

Run master verification covering all 15 endpoints:
```bash
python -m backend.verify_all_phases
```

---

## 📡 API Reference Summary (15 Endpoints)

| Method | Endpoint | Phase | Description |
|---|---|---|---|
| `GET` | `/health` | Phase 1 | Service health, DB connectivity, entity counts |
| `GET` | `/api/v1/regions` | Phase 1 | All 5 dialect regions with geo and prosody profiles |
| `GET` | `/api/v1/lexicon` | Phase 1 | Canonical lexicon with regional variants & query filters |
| `POST` | `/api/v1/morph/translate` | Phase 2 | Neuro-symbolic dialect morphing across Karnataka |
| `GET` | `/api/v1/morph/rules` | Phase 2 | Complete phonological & morphological transformation rulebook |
| `GET` | `/api/v1/graph/constellation` | Phase 3 | 2-hop concept constellation ego-graph & narrative |
| `GET` | `/api/v1/graph/bridge` | Phase 3 | Linguistic distance, shared substrates & cognate alignment |
| `GET` | `/api/v1/graph/topology` | Phase 3 | Full graph topology & centrality rankings |
| `GET` | `/api/v1/acoustic/profile/{region}` | Phase 4 | Benchmark $F_0$ pitch curve, energy envelope & cadence |
| `POST` | `/api/v1/acoustic/analyze` | Phase 4 | Audio file/sample DSP analysis, match score & coaching |
| `GET` | `/static/audio_samples/{filename}` | Phase 4 | Static audio file serving for reference recordings |
| `GET` | `/api/v1/explorer/locate` | Phase 5 | IDW isogloss blend weights, transition belt & pitch interpolation |
| `GET` | `/api/v1/explorer/isogloss-map` | Phase 5 | GeoJSON FeatureCollection of epicenters, zones & corridors |
| `POST` | `/api/v1/explorer/contribute` | Phase 5 | Living dictionary crowdsourced submission with auto-triage |
| `GET` | `/api/v1/explorer/submissions` | Phase 5 | Recent chronological crowdsourced submissions |
| `GET` | `/api/v1/explorer/stats` | Phase 5 | Aggregated platform intelligence counts |

---

## 🔮 Roadmap
- [x] **Phase 1**: Project Scaffolding, Async Schema & Authentic Corpus
- [x] **Phase 2**: Neuro-Symbolic Morphing & Phonetic Transduction
- [x] **Phase 3**: Etymological & Cultural Knowledge Graph (NetworkX)
- [x] **Phase 4**: Acoustic Prosody, Pitch Contour ($F_0$), and Cadence DSP
- [x] **Phase 5**: Geospatial IDW Isogloss, Living Crowdsource Dictionary & Master Suite
- [x] **Phase 6**: Frontend Foundation, Interactive Karnataka Isogloss Map & Morphing Working Sheet
- [x] **Phase 7**: Interactive Etymological Constellation Graph & Linguistic Bridge Working Sheet
- [ ] **Phase 8**: Real-Time Acoustic Pitch Coach Oscilloscope & Field Submission Console

