import math
import logging
from typing import Any, Dict, List, Optional, Tuple
from backend.schemas import (
    DialectBlendWeight,
    GeoJSONFeature,
    GeoJSONFeatureCollection,
    IsoglossLocateResponse,
    ZoneClassification,
)
from backend.services.acoustic_engine import REGIONS_ACOUSTIC_CONFIG
from backend.services.dialect_morpher import (
    ENGLISH_TO_KANNADA_CONCEPT_MAP,
    RuleBasedTransducer,
)

logger = logging.getLogger("geospatial_engine")

REGIONAL_EPICENTERS = {
    "bengaluru_mysuru": {
        "name": "Old Mysuru / Southern Karnataka",
        "kannada_name": "ಹಳೆ ಮೈಸೂರು / ಬೆಂಗಳೂರು",
        "lat": 12.9716,
        "lng": 77.5946,
        "base_f0": 168.0,
        "color": "#3B82F6",  # Blue
        "substrates": ["Tamil", "Telugu", "Standard Literary Register"],
        "default_greeting": "ಹೇಗಿದ್ದೀರಾ? ಆರಾಮಾಗಿದ್ದೀರಾ? (Hegiddira?)",
    },
    "hubballi_dharwad": {
        "name": "Uttara Karnataka / Dharwad-Belagavi",
        "kannada_name": "ಉತ್ತರ ಕರ್ನಾಟಕ / ಧಾರವಾಡ",
        "lat": 15.4589,
        "lng": 75.0078,
        "base_f0": 155.0,
        "color": "#EF4444",  # Red
        "substrates": ["Marathi", "Konkani", "Sharana Vachana"],
        "default_greeting": "ಹೆಂಗದೀರ್ರೀ? ಆರಾಮ್ ಅದೀರೇನ್ರೀ? (Hengadeerree?)",
    },
    "kundapura_mangaluru": {
        "name": "Karavali / Coastal Karnataka",
        "kannada_name": "ಕರಾವಳಿ / ಕುಂದಾಪುರ-ಮಂಗಳೂರು",
        "lat": 13.6288,
        "lng": 74.6920,
        "base_f0": 178.0,
        "color": "#10B981",  # Emerald
        "substrates": ["Tulu", "Konkani", "Halegannada", "Beary"],
        "default_greeting": "ಮಾರಾಯ್ರೆ, ಎಂಗಿದ್ದಿ? ಎಂಚ ಉಲ್ಲರ್? (Yengiddi? / Encha ullar?)",
    },
    "kalaburagi_bidar": {
        "name": "Kalyana Karnataka / North-East",
        "kannada_name": "ಕಲ್ಯಾಣ ಕರ್ನಾಟಕ / ಕಲಬುರಗಿ-ಬೀದರ್",
        "lat": 17.3297,
        "lng": 76.8343,
        "base_f0": 138.0,
        "color": "#F59E0B",  # Amber
        "substrates": ["Dakhni Urdu", "Marathi", "Telugu"],
        "default_greeting": "ಖಬರ್ ಏನ್ರೀ? ಹೆಂಗದಾರ್ರಿ? (Khabar yenree?)",
    },
    "arebhashe_kodagu": {
        "name": "Malnad / Arebhashe & Kodagu",
        "kannada_name": "ಅರೆಭಾಷೆ / ಮಲೆನಾಡು-ಕೊಡಗು",
        "lat": 12.4244,
        "lng": 75.7382,
        "base_f0": 182.0,
        "color": "#8B5CF6",  # Purple
        "substrates": ["Tulu", "Kodava Takk", "Malayalam"],
        "default_greeting": "ಎಂಗುಳ್ಳಿ? ಮನೆಮಂದಿ ಎಲ್ಲಾ ಚೆನ್ನಾಗಿದ್ದೀರಾ? (Yengulli?)",
    },
}


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates geodesic distance between two points in kilometers."""
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


class GeospatialIsoglossEngine:
    """
    Inverse-Distance Weighting (IDW) Interpolation and Dialect Boundary Corridors.
    Maps arbitrary Karnataka coordinates to dialect blend weights, transition belts,
    and hybrid acoustic pitch targets.
    """

    @classmethod
    def locate_isogloss(
        cls,
        lat: float,
        lng: float,
        phrase: Optional[str] = None,
    ) -> IsoglossLocateResponse:
        """
        Computes IDW dialect blend weights and transition classification for (lat, lng).
        Interpolates acoustic pitch target and synthesizes hybrid transition morphing.
        """
        test_phrase = phrase.strip() if phrase and phrase.strip() else "Where are you going?"

        # 1. Compute Haversine distances to the 5 epicenters
        distances: Dict[str, float] = {}
        for code, info in REGIONAL_EPICENTERS.items():
            dist = haversine_distance_km(lat, lng, info["lat"], info["lng"])
            distances[code] = dist

        # 2. Inverse-Distance Weighting (p = 2.0, epsilon = 0.01 km)
        p = 2.0
        epsilon = 0.01
        inv_weights: Dict[str, float] = {
            code: 1.0 / ((d + epsilon) ** p) for code, d in distances.items()
        }
        total_inv_weight = sum(inv_weights.values())

        blend_list: List[DialectBlendWeight] = []
        for code, inv_w in inv_weights.items():
            norm_share = (inv_w / total_inv_weight) * 100.0
            blend_list.append(
                DialectBlendWeight(
                    region_code=code,
                    region_name=REGIONAL_EPICENTERS[code]["name"],
                    distance_km=round(distances[code], 2),
                    blend_percentage=round(norm_share, 2),
                )
            )

        # Sort descending by blend percentage
        blend_list.sort(key=lambda x: x.blend_percentage, reverse=True)

        top1 = blend_list[0]
        top2 = blend_list[1]
        dominant_code = top1.region_code
        secondary_code: Optional[str] = None

        # 3. Zone Classification
        if top1.blend_percentage >= 65.0:
            classification: ZoneClassification = "Core Dialect Heartland"
            secondary_code = None
        elif (top1.blend_percentage + top2.blend_percentage) >= 70.0 and (top1.blend_percentage - top2.blend_percentage) <= 30.0:
            classification = "Bi-Dialectal Isogloss Transition Belt"
            secondary_code = top2.region_code
        else:
            classification = "Multi-Dialectal Convergence Zone"
            secondary_code = top2.region_code

        # 4. Active Substrates
        substrates: List[str] = []
        for b in blend_list[:2]:
            for s in REGIONAL_EPICENTERS[b.region_code]["substrates"]:
                if s not in substrates:
                    substrates.append(s)

        # 5. Acoustic Pitch Target Interpolation
        # Weighted average of base F0 across regions
        interp_pitch = sum(
            (b.blend_percentage / 100.0) * REGIONAL_EPICENTERS[b.region_code]["base_f0"]
            for b in blend_list
        )

        # 6. Colloquial Greeting & Phrase Morphing
        clean_low = test_phrase.strip().lower()
        clean_no_punct = "".join(c for c in clean_low if c.isalnum() or c.isspace()).strip()
        mapped_phrase = (
            ENGLISH_TO_KANNADA_CONCEPT_MAP.get(clean_low)
            or ENGLISH_TO_KANNADA_CONCEPT_MAP.get(clean_no_punct)
            or test_phrase
        )

        dom_morph = RuleBasedTransducer.transduce_region(mapped_phrase, dominant_code)
        dom_greeting = REGIONAL_EPICENTERS[dominant_code]["default_greeting"]

        hybrid_notes = ""
        if classification == "Bi-Dialectal Isogloss Transition Belt" and secondary_code:
            sec_morph = RuleBasedTransducer.transduce_region(mapped_phrase, secondary_code)
            hybrid_notes = (
                f"Transition corridor detected between {REGIONAL_EPICENTERS[dominant_code]['name']} ({top1.blend_percentage:.1f}%) "
                f"and {REGIONAL_EPICENTERS[secondary_code]['name']} ({top2.blend_percentage:.1f}%). "
                f"Speakers exhibit code-switching: dominant variant '{dom_morph.morphed_phonetic_roman}' "
                f"co-exists with secondary variant '{sec_morph.morphed_phonetic_roman}'."
            )
        elif classification == "Multi-Dialectal Convergence Zone":
            hybrid_notes = (
                f"Convergence zone where multiple regional influence waves intersect. "
                f"Dominant tendency: {REGIONAL_EPICENTERS[dominant_code]['name']} with peripheral blending."
            )
        else:
            hybrid_notes = (
                f"Located securely within the core speech community of {REGIONAL_EPICENTERS[dominant_code]['name']} "
                f"({top1.blend_percentage:.1f}% geographic affinity)."
            )

        interpolated_phrase_result = {
            "source_phrase": test_phrase,
            "morphed_dominant_roman": dom_morph.morphed_phonetic_roman,
            "morphed_dominant_script": dom_morph.morphed_kannada_script,
            "dominant_rules_applied": dom_morph.morphological_rules_triggered,
            "syllable_stress": dom_morph.syllable_stress_breakdown,
            "transition_notes": hybrid_notes,
        }

        return IsoglossLocateResponse(
            latitude=round(lat, 4),
            longitude=round(lng, 4),
            zone_classification=classification,
            dominant_region_code=dominant_code,
            secondary_region_code=secondary_code,
            blend_weights=blend_list,
            active_border_substrates=substrates,
            interpolated_greeting_local=dom_greeting,
            interpolated_phrase_result=interpolated_phrase_result,
            acoustic_interpolated_pitch_hz=round(interp_pitch, 2),
        )

    @classmethod
    def get_isogloss_geojson(cls) -> GeoJSONFeatureCollection:
        """
        Builds a comprehensive GeoJSON FeatureCollection containing:
        - Points: Regional epicenters / dialect hubs
        - Polygons: Dialect territory approximations across Karnataka
        - LineStrings: Major isogloss transition corridors
        """
        features: List[GeoJSONFeature] = []

        # 1. Point Features for Dialect Epicenters
        for code, info in REGIONAL_EPICENTERS.items():
            features.append(
                GeoJSONFeature(
                    type="Feature",
                    geometry={
                        "type": "Point",
                        "coordinates": [info["lng"], info["lat"]],
                    },
                    properties={
                        "feature_type": "dialect_epicenter",
                        "region_code": code,
                        "name": info["name"],
                        "kannada_name": info["kannada_name"],
                        "color": info["color"],
                        "base_pitch_hz": info["base_f0"],
                        "substrates": info["substrates"],
                    },
                )
            )

        # 2. Polygon Features for Regional Territories
        territory_polygons = [
            {
                "code": "hubballi_dharwad",
                "name": "Uttara Karnataka Dialect Zone",
                "color": "#EF4444",
                "coordinates": [
                    [
                        [74.05, 14.85],
                        [74.30, 16.20],
                        [75.40, 16.90],
                        [76.30, 16.50],
                        [76.10, 14.80],
                        [75.10, 14.50],
                        [74.05, 14.85],
                    ]
                ],
            },
            {
                "code": "kalaburagi_bidar",
                "name": "Kalyana Karnataka Dialect Zone",
                "color": "#F59E0B",
                "coordinates": [
                    [
                        [76.10, 16.50],
                        [76.80, 18.10],
                        [77.60, 18.00],
                        [77.40, 16.30],
                        [76.80, 15.80],
                        [76.10, 16.50],
                    ]
                ],
            },
            {
                "code": "kundapura_mangaluru",
                "name": "Karavali Coastal Dialect Zone",
                "color": "#10B981",
                "coordinates": [
                    [
                        [74.05, 14.90],
                        [74.55, 14.20],
                        [74.85, 13.10],
                        [75.15, 12.60],
                        [74.70, 12.80],
                        [74.30, 14.10],
                        [74.05, 14.90],
                    ]
                ],
            },
            {
                "code": "arebhashe_kodagu",
                "name": "Malnad & Arebhashe Dialect Zone",
                "color": "#8B5CF6",
                "coordinates": [
                    [
                        [75.15, 12.60],
                        [75.40, 13.40],
                        [76.10, 13.00],
                        [76.20, 12.10],
                        [75.60, 11.90],
                        [75.15, 12.60],
                    ]
                ],
            },
            {
                "code": "bengaluru_mysuru",
                "name": "Old Mysuru / Southern Karnataka Zone",
                "color": "#3B82F6",
                "coordinates": [
                    [
                        [76.10, 14.80],
                        [76.80, 14.20],
                        [77.90, 13.80],
                        [78.40, 13.10],
                        [77.80, 12.10],
                        [76.30, 11.90],
                        [76.10, 13.00],
                        [76.10, 14.80],
                    ]
                ],
            },
        ]

        for poly in territory_polygons:
            features.append(
                GeoJSONFeature(
                    type="Feature",
                    geometry={
                        "type": "Polygon",
                        "coordinates": poly["coordinates"],
                    },
                    properties={
                        "feature_type": "dialect_zone_territory",
                        "region_code": poly["code"],
                        "name": poly["name"],
                        "stroke": poly["color"],
                        "fill": poly["color"],
                        "fill-opacity": 0.20,
                    },
                )
            )

        # 3. LineString Features for Major Isogloss Corridors
        corridors = [
            {
                "name": "Tungabhadra Isogloss Transition Corridor (Dharwad <-> Mysuru)",
                "description": "Gradual shift between Northern honorific '-ri' and Southern measured inflection via Davanagere & Chitradurga.",
                "coordinates": [
                    [75.0078, 15.4589],  # Dharwad
                    [75.4012, 14.8012],  # Haveri
                    [75.9218, 14.4644],  # Davanagere
                    [76.4011, 14.2215],  # Chitradurga
                    [77.1023, 13.3402],  # Tumakuru
                    [77.5946, 12.9716],  # Bengaluru
                ],
            },
            {
                "name": "Western Ghats Escarpment Isogloss (Karavali <-> Malnad)",
                "description": "Sharp topographic boundary separating rapid coastal triplet rhythm from highland Arebhashe accents.",
                "coordinates": [
                    [74.6920, 13.6288],  # Kundapura
                    [74.9812, 13.5123],  # Agumbe Pass
                    [75.3211, 13.2104],  # Sringeri
                    [75.7382, 12.4244],  # Madikeri / Kodagu
                ],
            },
            {
                "name": "Deccan Basin Isogloss Corridor (Uttara <-> Kalyana Karnataka)",
                "description": "Transition across the Krishna basin between Marathi-inflected Dharwad and Dakhni-infused Kalaburagi.",
                "coordinates": [
                    [75.0078, 15.4589],  # Dharwad
                    [75.7123, 15.8214],  # Bagalkote
                    [76.3214, 16.4012],  # Vijayapura
                    [76.8343, 17.3297],  # Kalaburagi
                ],
            },
            {
                "name": "Southern Kaveri Plains Corridor (Mysuru <-> Kodagu)",
                "description": "Gradual blending of standard Wodeyar courtly Kannada with Arebhashe plantation vocabulary.",
                "coordinates": [
                    [77.5946, 12.9716],  # Bengaluru
                    [76.6548, 12.3052],  # Mysuru
                    [76.1245, 12.3512],  # Hunsur
                    [75.7382, 12.4244],  # Madikeri
                ],
            },
        ]

        for corr in corridors:
            features.append(
                GeoJSONFeature(
                    type="Feature",
                    geometry={
                        "type": "LineString",
                        "coordinates": corr["coordinates"],
                    },
                    properties={
                        "feature_type": "isogloss_corridor",
                        "name": corr["name"],
                        "description": corr["description"],
                        "stroke": "#EC4899",  # Pink
                        "stroke-width": 3,
                        "stroke-dasharray": "5,5",
                    },
                )
            )

        return GeoJSONFeatureCollection(
            type="FeatureCollection",
            features=features,
        )
