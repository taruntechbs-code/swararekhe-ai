# SWARAREKHE (ಸ್ವರರೇಖೆ)
### Spatio-Acoustic Dialect & Cultural Graph Engine for Namma Kannada

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![SQLAlchemy 2.0](https://img.shields.io/badge/SQLAlchemy-2.0-red.svg)](https://www.sqlalchemy.org/)
[![NetworkX](https://img.shields.io/badge/NetworkX-3.2+-orange.svg)](https://networkx.org/)
[![Librosa DSP](https://img.shields.io/badge/Librosa-0.11+-brightgreen.svg)](https://librosa.org/)
[![Tests Passing](https://img.shields.io/badge/pytest-20%20passed-success.svg)](https://docs.pytest.org/)

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

## 🛠️ Installation & Setup

### 1. Clone & Set Up Environment
```bash
git clone https://github.com/taruntechbs-code/swararekhe-ai.git
cd swararekhe-ai

python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

### 2. Seed Database
```bash
python -m backend.seed_data
```

### 3. Run Development Server
```bash
uvicorn backend.main:app --reload --port 8000
```
Interactive API documentation will be available at:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🧪 Testing & Verification

Run the full pytest suite across all 4 phases:
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
======================== 20 passed in 1.19s ========================
```

Run individual standalone phase verification scripts:
```bash
python -m backend.verify_phase1
python -m backend.verify_phase2
python -m backend.verify_phase3
python -m backend.verify_phase4
```

---

## 📡 API Reference Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health, DB connectivity, entity counts |
| `GET` | `/api/v1/regions` | All 5 dialect regions with geo and prosody profiles |
| `GET` | `/api/v1/lexicon` | Canonical lexicon with regional variants & query filters |
| `POST` | `/api/v1/morph/translate` | Neuro-symbolic dialect morphing across Karnataka |
| `GET` | `/api/v1/morph/rules` | Complete phonological & morphological transformation rulebook |
| `GET` | `/api/v1/graph/constellation` | 2-hop concept constellation ego-graph & narrative |
| `GET` | `/api/v1/graph/bridge` | Linguistic distance, shared substrates & cognate alignment |
| `GET` | `/api/v1/graph/topology` | Full graph topology & centrality rankings |
| `GET` | `/api/v1/acoustic/profile/{region}` | Benchmark $F_0$ pitch curve, energy envelope & cadence |
| `POST` | `/api/v1/acoustic/analyze` | Audio file/sample DSP analysis, match score & coaching |

---

## 🔮 Upcoming Phases Roadmap
- [x] **Phase 1**: Project Scaffolding, Async Schema & Authentic Corpus
- [x] **Phase 2**: Neuro-Symbolic Morphing & Phonetic Transduction
- [x] **Phase 3**: Etymological & Cultural Knowledge Graph (NetworkX)
- [x] **Phase 4**: Acoustic Prosody, Pitch Contour ($F_0$), and Cadence DSP
- [ ] **Phase 5**: Interactive 3D Dialect Landscape & Force-Directed Graph UI
- [ ] **Phase 6**: Multimodal Speech-to-Speech Prosody Transfer & Real-time Visual Feedback
