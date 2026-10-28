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
 │    Phase 1    │             │    Phase 2    │       │    Phase 3    │              │    Phase 4    │              │    Phase 5    │
 │ Async Database│             │ Neuro-Symbolic│       │ Etymological  │              │ Acoustic DSP  │              │ Geospatial IDW│
 │ & Seed Corpus │             │ Transduction  │       │  Graph Engine │              │Cadence Coach  │              │ Living Archive│
 └──────┬────────┘             └───────┬───────┘       └───────┬───────┘              └───────┬───────┘              └───────┬───────┘
        │                              │                       │                              │                              │
  • 5 Core Regions              • Corpus Matcher        • NetworkX MultiDiGraph        • Synthetic Audio (.wav)       • IDW Spatial (p=2.0)
  • 14 Concepts (70 Variants)   • Suffix Transducer     • 105 Nodes / 258 Edges        • Librosa F0 / YIN Pitch       • GeoJSON Corridors
  • Prosody Profiles            • Stress & IPA Rules    • Ego-Constellations           • Cadence Matching (0-100)     • Phonotactic Triage
  • SQLite + aiosqlite          • Hybrid Gemini Refiner • Linguistic Bridge            • Prosody Coaching Tips        • Dynamic Graph Injection
                                                               │
                                                               ▼
                                  ┌────────────────────────────────────────────────────────┐
                                  │   SWARAREKHE INSTRUMENT CHASSIS (React 18 + TS + Vite) │
                                  │   Industrial Hardware Design System (Model SR-05)      │
                                  └────────────────────────────────────────────────────────┘
                                                               │
        ┌──────────────────────────────┬───────────────────────┴──────────────────────────────┬──────────────────────────────┐
        ▼                              ▼                                                      ▼                              ▼
 ┌──────────────────────────┐   ┌──────────────────────────┐                           ┌──────────────────────────┐   ┌──────────────────────────┐
 │          BAY 01          │   │          BAY 02          │                           │          BAY 03          │   │          BAY 04          │
 │ Isogloss Atlas & Morpher │   │ Etymology Graph & Bridge │                           │ Acoustic F0 Oscilloscope │   │ Living Archive & Triage  │
 └──────────────────────────┘   └──────────────────────────┘                           └──────────────────────────┘   └──────────────────────────┘
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

### 🎛️ Phase 6 & 7: "Industrial" Hardware Chassis Interface & Etymological Constellation Bay
- **Authoritative "Industrial" Instrument Chassis Design System**:
  - Implements a continuous cool-grey instrument housing (`#cbd0d2`) with recessed dark screens (`#20272b`), tactile raised keys (`#e7eaeb`), recessed trays (`#b6bec2`), engraved slate markings (`#414b52`), and orange LED status lamps (`#f15b22`).
  - **Typographic Stack**: **Host Grotesk** (`"Industrial Host"`, sans-serif) for high-impact bold headings, **IBM Plex Mono** (`"Industrial Plex"`, monospace) for technical telemetry metadata, and native **Noto Sans Kannada** for Kannada script.
  - Directional upper-left lighting highlights, knurled rotary dial button (`.rotary-dial-btn`), and exhaust vent slots.
- **BAY 01 // Spatial Isogloss Telemetry & Neuro-Symbolic Morphing**:
  - **Bay 01A (Geospatial Isogloss Telemetry Screen)**: Interactive SVG cartographic map of Karnataka housed inside a deep `.recessed-field-screen` (`#20272b`) with technical grid lines, high-contrast territory polygons, glowing isogloss corridors, crosshair target, and raised mechanical survey town keys.
  - **Bay 01B (Neuro-Symbolic Morphing Tray)**: Rotary dial execution button, segmented `EN / KN` register keys, and 5 removable-looking horizontal comparison modules inside a recessed tray (`#b6bec2`) with inset pressed keys, orange LED indicator lamps, and tactile `+/-` derivation disclosure keys.
- **BAY 02 // Etymological Constellation Graph & Linguistic Bridge**:
  - **Panel 02A (Concept Constellation Display Well)**: Bank of raised concept selector keys (`GOOD`, `BHAAL`, `WHERE`, `EAT`, `MOTHER`, `RAIN`, `QUICKLY`, `BOY`), rotary trace trigger, and a dark CRT/OLED field screen (`#20272b`, `min-height: 460px`) rendering the 2-hop NetworkX ego-graph with vector nodes (`CONCEPT`, `VARIANT`, `REGION`, `INFLUENCE_LANG`, `CULTURAL_MARKER`), directed relation edges, and pan/zoom/drag controls. Adjacent recessed readout deck displaying etymological narrative commentary, active substrate tags, and NetworkX node inspector.
  - **Panel 02B (Linguistic Bridge Comparator Deck)**: Source/Target dialect selector menus with an `ArrowLeftRight` swap key, digital readout with **Similarity Index** score (e.g. `41.8% COGNATE ALIGNMENT`), shared border substrates, shortest topological path, and removable-style comparison rows aligning 14 canonical concepts between regions.
  - **NetworkX Topology Strip**: Live node/edge counts (106 nodes, 259 edges) and top betweenness centrality hubs (Marathi, Tulu, Dharwad, Dakhni Urdu, Halegannada).

---

### 🎛️ Phase 8: Real-Time Acoustic Pitch Coach Oscilloscope, Living Field Archive & Complete 4-Bay Chassis
- **BAY 03 // Acoustic F0 Oscilloscope & Cadence Coach**:
  - Consumes `GET /api/v1/acoustic/profile/{region_code}` and `POST /api/v1/acoustic/analyze`.
  - **Dual-Trace Real-Time SVG Oscilloscope**:
    - **Target Reference Pitch Contour**: Glowing orange vector trace (`#f15b22`) representing benchmark regional $F_0$.
    - **User Acoustic Pitch Contour**: Vivid cyan vector trace (`#00f0ff`) plotting speaker pitch curve.
    - Synchronized time frames ($0.0\text{--}1.4\text{ s}$), energy envelope dB bars, Hz guide lines, and technical crosshair cursor.
  - **Harmonic Web Audio Pitch Synthesizer**:
    - Synthesizes realistic regional speech pitch sweeps via dual Web Audio oscillators (`sawtooth` fundamental + `sine` formant harmonic with low-pass biquad filtering).
  - **Transport & Capture Controls**:
    - Rotary dial `SYNTHESIZE / PLAY F0`
    - `COMPARE SAMPLE` benchmarking
    - `RECORD MIC` (browser MediaRecorder stream capture)
    - `UPLOAD WAV` custom audio file analyzer
  - **DSP Telemetry & Coaching Deck**:
    - Mean Pitch ($F_0$), Pitch Standard Deviation, Dynamic Range, Syllable Velocity, and Terminal Inflection Slope ($Hz/\text{frame}$).
    - Composite Prosody Alignment Score ($0\text{--}100\%$) and actionable linguistic coaching recommendations.
- **BAY 04 // Living Field Archive & Crowdsource Triage Deck**:
  - Consumes `POST /api/v1/explorer/contribute`, `GET /api/v1/explorer/submissions`, and `GET /api/v1/explorer/stats`.
  - **Structured Field Contribution Console**:
    - Contributor Name, District / Taluk, Lat/Lng coordinates with quick-pick presets (*Belagavi, Udupi, Bidar, Madikeri, Mysuru, Davanagere*), Category selection (*Greeting, Daily, Food, Kinship, Agriculture, Idiom*), native Kannada script phrase input, Roman phonetic transliteration, and English translation.
    - Quick-fill preset key (`LOAD SAMPLE FIELD RECORD`) with authentic curated field entries.
  - **AI Triage & Dynamic Knowledge Graph Injection Terminal**:
    - Dark CRT/OLED screen (`#20272b`) displaying real-time phonotactic decision badge (`APPROVED_INJECTED`, `PENDING_REVIEW`, `REJECTED_SPAM`).
    - Phonotactic Validity Score Meter with sub-metric breakdown (Dravidian vowel harmony, syllable onset/coda validity, morphological boundary).
    - Nearest Dialect Heartland detection and morphological marker badge chips.
    - **Live Knowledge Graph Injection Confirmation**: Automatically confirms when `variant:<phrase>:<region>` is dynamically injected into the active NetworkX MultiDiGraph!
  - **Community Submissions Chronological Ledger**:
    - Removable-style ledger table with interactive row selection, status lamps, Kannada script typography, score chips, and a server refresh sync key.
  - **Unified Instrument Chassis View**:
    - Raised toggle key `ALL BAYS (FULL CHASSIS VIEW)` allowing researchers to view all 4 bays concurrently in a single continuous instrument view separated by machined chassis seams (`.chassis-seam`).

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
- [x] **Phase 8**: Real-Time Acoustic Pitch Coach Oscilloscope, Living Field Archive & Complete 4-Bay Chassis

