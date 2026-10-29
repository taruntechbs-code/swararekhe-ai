import asyncio
import logging
from typing import Any, Dict, List
from sqlalchemy import select, or_, delete
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import AsyncSessionLocal, Base, engine
from backend.models import DialectRegion, DialectVariant, LexicalEntry, CommunitySubmission

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed_data")

REGIONS_DATA: List[Dict[str, Any]] = [
    {
        "code": "bengaluru_mysuru",
        "name": "Old Mysuru / Southern Karnataka",
        "kannada_name": "ಹಳೆ ಮೈಸೂರು / ಬೆಂಗಳೂರು ಕನ್ನಡ",
        "center_lat": 12.9716,
        "center_lng": 77.5946,
        "border_influences": ["Tamil", "Telugu", "Standard Bureaucratic Register"],
        "prosody_profile": {
            "tempo": "moderate",
            "pitch_range": "mid_balanced",
            "cadence": "measured",
            "terminal_inflection": "flat_to_slightly_falling",
            "stress_pattern": "penultimate_syllable",
        },
        "cultural_notes": (
            "Historical cradle of modern standard literary and administrative "
            "Kannada under the Wodeyar dynasty and modern metropolitan migration."
        ),
    },
    {
        "code": "hubballi_dharwad",
        "name": "Uttara Karnataka / Dharwad-Belagavi",
        "kannada_name": "ಉತ್ತರ ಕರ್ನಾಟಕ / ಧಾರವಾಡ ಕನ್ನಡ",
        "center_lat": 15.4589,
        "center_lng": 75.0078,
        "border_influences": ["Marathi", "Konkani", "Sanskritized Lingayat Scholastic Tradition"],
        "prosody_profile": {
            "tempo": "brisk_staccato",
            "pitch_range": "wide_dynamic",
            "cadence": "rhythmic_syncopated",
            "terminal_inflection": "sharp_rising_terminal",
            "honorific_enclitic": "ri/avri",
        },
        "cultural_notes": (
            "Rich musical heritage of Hindustani classical confluence, Sharana "
            "Vachana literature, and warm conversational honorific suffixes like 'ri' and 'avri'."
        ),
    },
    {
        "code": "kundapura_mangaluru",
        "name": "Karavali / Coastal Karnataka",
        "kannada_name": "ಕರಾವಳಿ / ಕುಂದಾಪುರ-ಮಂಗಳೂರು ಕನ್ನಡ",
        "center_lat": 13.6288,
        "center_lng": 74.6920,
        "border_influences": ["Tulu", "Konkani", "Halegannada (Old Kannada)", "Beary"],
        "prosody_profile": {
            "tempo": "rapid_cascading",
            "pitch_range": "sing-song_melodic",
            "cadence": "triplet_meter_flowing",
            "terminal_inflection": "elongated_musical_glide",
            "phonetic_traits": ["archaic_glide_epenthesis", "nasalized_diphthongs"],
        },
        "cultural_notes": (
            "Preserves archaic Halegannada verbal roots and phonemes alongside "
            "Yakshagana theatrical metrics and deep Tulu coastal substrate interaction."
        ),
    },
    {
        "code": "kalaburagi_bidar",
        "name": "Kalyana Karnataka / North-East",
        "kannada_name": "ಕಲ್ಯಾಣ ಕರ್ನಾಟಕ / ಕಲಬುರಗಿ-ಬೀದರ್ ಕನ್ನಡ",
        "center_lat": 17.3297,
        "center_lng": 76.8343,
        "border_influences": ["Dakhni Urdu", "Marathi", "Telugu", "Bahmani Historical Lexis"],
        "prosody_profile": {
            "tempo": "deliberate_elongated",
            "pitch_range": "low_to_mid_resonant",
            "cadence": "heavy_syllable_timed",
            "terminal_inflection": "falling_drawl_with_nodri",
            "aspectual_markers": ["likatthiri", "ada"],
        },
        "cultural_notes": (
            "Distinctive borderland dialect shaped by Deccan sultanates, Nizam "
            "administrative history, Dakhni loanwords, and Vachana heritage."
        ),
    },
    {
        "code": "arebhashe_kodagu",
        "name": "Malnad / Arebhashe & Kodagu",
        "kannada_name": "ಅರೆಭಾಷೆ / ಮಲೆನಾಡು-ಕೊಡಗು ಕನ್ನಡ",
        "center_lat": 12.4244,
        "center_lng": 75.7382,
        "border_influences": ["Tulu", "Kodava Takk", "Malayalam Border Substrate"],
        "prosody_profile": {
            "tempo": "lively_undulating",
            "pitch_range": "mid_high_resonance",
            "cadence": "bouncing_accent",
            "terminal_inflection": "clipped_truncated_terminal",
            "vowel_harmony": "front_centralized",
        },
        "cultural_notes": (
            "Spoken predominantly by Gowda community in Sullia, Madikeri, and "
            "Western Ghats ridges, exhibiting unique pronominal paradigms and ancient phonemes."
        ),
    },
]

LEXICON_DATA: List[Dict[str, Any]] = [
    {
        "standard_kannada": "ಎಲ್ಲಿಗೆ ಹೋಗುತ್ತಿದ್ದೀರಿ?",
        "standard_roman": "ellige hoguttiddiri?",
        "english_meaning": "Where are you going?",
        "category": "question",
        "grammatical_pos": "phrase",
        "variants": {
            "bengaluru_mysuru": {
                "local_script": "ಎಲ್ಲಿಗೆ ಹೋಗ್ತಿದ್ದೀರಾ?",
                "local_phonetic": "Ellige hogtiddira?",
                "ipa_pronunciation": "[ellɪɡe hoːɡt̪id̪ːiːraː]",
                "morphological_rule": "present_continuous_contraction",
                "example_sentence_local": "ನೀವು ಇವಾಗ ಆಫೀಸ್‌ಗೆ ಎಲ್ಲಿಗೆ ಹೋಗ್ತಿದ್ದೀರಾ?",
                "example_sentence_standard": "ನೀವು ಈಗ ಎಲ್ಲಿಗೆ ಹೋಗುತ್ತಿದ್ದೀರಿ?",
                "cultural_origin_note": "Colloquial Mysuru conversational smoothing with standard honorific plural -ra.",
                "confidence_score": 0.99,
            },
            "hubballi_dharwad": {
                "local_script": "ಎಲ್ಲಿಗ್ ಹೊಂಟಿರ್ರೀ?",
                "local_phonetic": "Yallig hontirre?",
                "ipa_pronunciation": "[jəllɪɡ hoːŋt̪ɪrriː]",
                "morphological_rule": "verb_suffix_re_honorific_inflection",
                "example_sentence_local": "ಯಾವಾಗ್ದಿಂದ ಕೇಳ್ತೇನ್, ಎಲ್ಲಿಗ್ ಹೊಂಟಿರ್ರೀ ಮಾಮಾ?",
                "example_sentence_standard": "ಎಲ್ಲಿಗೆ ಹೋಗುತ್ತಿದ್ದೀರಿ ಮಾವ?",
                "cultural_origin_note": "Hallmark Uttara Karnataka inchoative 'hontirri' with alveolar trill honorific 'ri'.",
                "confidence_score": 0.98,
            },
            "kundapura_mangaluru": {
                "local_script": "ಯಾತ್ತಕ್ ಹೋಯ್ತಿದ್ದಿಯಾ?",
                "local_phonetic": "Yathak hoitiddiya?",
                "ipa_pronunciation": "[jaːt̪t̪ək hoːjt̪id̪ːija]",
                "morphological_rule": "interrogative_yathak_glide_epenthesis",
                "example_sentence_local": "ಮಂಜ, ಬ್ಯಾಗ್ ಹಿಡ್ಕಂಡ್ ಯಾತ್ತಕ್ ಹೋಯ್ತಿದ್ದಿಯಾ?",
                "example_sentence_standard": "ಮಂಜ, ಚೀಲ ಹಿಡಿದುಕೊಂಡು ಎಲ್ಲಿಗೆ ಹೋಗುತ್ತಿದ್ದೀಯ?",
                "cultural_origin_note": "Characteristic Kundapra glide insertion (-y-) and 'yathak' directional query.",
                "confidence_score": 0.97,
            },
            "kalaburagi_bidar": {
                "local_script": "ಎಲ್ಲಿಗ್ ಹೋಗ್ಲಿಕತ್ತೀರಿ?",
                "local_phonetic": "Yallig hoglikattiri?",
                "ipa_pronunciation": "[jəllɪɡ hoːɡlɪkət̪t̪iːri]",
                "morphological_rule": "aspectual_inchoative_katthiri",
                "example_sentence_local": "ದವಾಖಾನೆಗೆ ಎಲ್ಲಿಗ್ ಹೋಗ್ಲಿಕತ್ತೀರಿ ಅಣ್ಣಾ?",
                "example_sentence_standard": "ಆಸ್ಪತ್ರೆಗೆ ಎಲ್ಲಿಗೆ ಹೋಗುತ್ತಿದ್ದೀರಿ ಅಣ್ಣ?",
                "cultural_origin_note": "Kalyana Karnataka continuous marker '-likatthiri' indicating an action underway.",
                "confidence_score": 0.98,
            },
            "arebhashe_kodagu": {
                "local_script": "ಎತ್ತಕ್ ಹೋಗ್ಡೆ?",
                "local_phonetic": "Yettak hogde?",
                "ipa_pronunciation": "[jet̪t̪ək hoːɡɖe]",
                "morphological_rule": "arebhashe_interrogative_ettak_truncation",
                "example_sentence_local": "ಅಣ್ಣ, ಸಂಜೆ ಹೊತ್ತಲಿ ಎತ್ತಕ್ ಹೋಗ್ಡೆ?",
                "example_sentence_standard": "ಅಣ್ಣ, ಸಂಜೆ ವೇಳೆಯಲ್ಲಿ ಎಲ್ಲಿಗೆ ಹೋಗುತ್ತಿದ್ದೀರಿ?",
                "cultural_origin_note": "Shortened interrogative 'ettak' typical of Kodagu and Sullia Arebhashe.",
                "confidence_score": 0.96,
            },
        },
    },
    {
        "standard_kannada": "ಹೇಗಿದ್ದೀರಿ?",
        "standard_roman": "hegiddiri?",
        "english_meaning": "How are you?",
        "category": "greeting",
        "grammatical_pos": "phrase",
        "variants": {
            "bengaluru_mysuru": {
                "local_script": "ಹೇಗಿದ್ದೀರಾ?",
                "local_phonetic": "Hegiddira?",
                "ipa_pronunciation": "[heːɡid̪ːiːraː]",
                "morphological_rule": "standard_honorific_ra",
                "example_sentence_local": "ನಮಸ್ಕಾರ ಸರ್, ಎಲ್ಲ ಆರಾಮಾಗಿ ಹೇಗಿದ್ದೀರಾ?",
                "example_sentence_standard": "ನಮಸ್ಕಾರ, ಹೇಗಿದ್ದೀರಿ?",
                "cultural_origin_note": "Standard respectful salutation across Southern Karnataka plains.",
                "confidence_score": 0.99,
            },
            "hubballi_dharwad": {
                "local_script": "ಹೆಂಗದೀರ್ರೀ? ಆರಾಮ್ ಅದೀರೇನ್ರೀ?",
                "local_phonetic": "Hengadeerree? Aram adeerenree?",
                "ipa_pronunciation": "[heŋɡədiːriː aːraːm ədiːreːnriː]",
                "morphological_rule": "copula_ada_honorific_ree",
                "example_sentence_local": "ಏನ್ ಕಾಕಾ, ಭಾಳ ದಿನ ಆತ್, ಹೆಂಗದೀರ್ರೀ?",
                "example_sentence_standard": "ಏನು ಕಾಕ, ಬಹಳ ದಿನವಾಯಿತು, ಹೇಗಿದ್ದೀರಿ?",
                "cultural_origin_note": "Features the existential root 'ada' replacing standard 'iru'.",
                "confidence_score": 0.98,
            },
            "kundapura_mangaluru": {
                "local_script": "ಎಂಗಿದ್ದಿ? / ಎಂಚ ಉಲ್ಲರ್?",
                "local_phonetic": "Yengiddi? / Encha ullar?",
                "ipa_pronunciation": "[jeŋɡid̪ːi / ent͡ʃə ulːər]",
                "morphological_rule": "karavali_tulu_substrate_encha",
                "example_sentence_local": "ಮಾರಾಯ್ರೆ, ಎಂಗಿದ್ದಿ? ಊರಿಗೆ ಬಂದ್ರಾ?",
                "example_sentence_standard": "ಸ್ನೇಹಿತರೆ, ಹೇಗಿದ್ದೀರಿ? ಊರಿಗೆ ಬಂದಿರಾ?",
                "cultural_origin_note": "Direct syntactic parallel with Tulu 'encha ullar' and Kundapra 'yengiddi'.",
                "confidence_score": 0.97,
            },
            "kalaburagi_bidar": {
                "local_script": "ಖಬರ್ ಏನ್ರೀ? ಹೆಂಗದಾರ್ರಿ?",
                "local_phonetic": "Khabar yenree? Hengadaarri?",
                "ipa_pronunciation": "[xəbər jeːnriː heŋɡəd̪aːrri]",
                "morphological_rule": "dakhni_lexical_borrowing_khabar",
                "example_sentence_local": "ಅಣ್ಣಾ ಖಬರ್ ಏನ್ರೀ? ಮನೆಯಾಗ ಎಲ್ಲರೂ ಹೆಂಗದಾರ್ರಿ?",
                "example_sentence_standard": "ಅಣ್ಣಾ ಸಮಾಚಾರವೇನು? ಮನೆಯಲ್ಲಿ ಎಲ್ಲರೂ ಹೇಗಿದ್ದಾರೆ?",
                "cultural_origin_note": "Lexical fusion with Dakhni 'khabar' (news/well-being) followed by Kannada copula.",
                "confidence_score": 0.98,
            },
            "arebhashe_kodagu": {
                "local_script": "ಎಂಗುಳ್ಳಿ? / ಚೆನ್ನಾಗಿದ್ದೀರಾ?",
                "local_phonetic": "Yengulli?",
                "ipa_pronunciation": "[jeŋɡulɭi]",
                "morphological_rule": "arebhashe_copula_ulli",
                "example_sentence_local": "ಅಕ್ಕ, ಮನೆಮಂದಿ ಎಲ್ಲರೂ ಎಂಗುಳ್ಳಿ?",
                "example_sentence_standard": "ಅಕ್ಕ, ಮನೆಯವರೆಲ್ಲ ಹೇಗಿದ್ದೀರಿ?",
                "cultural_origin_note": "Use of 'ulli' root common to Sullia Arebhashe verbal morphology.",
                "confidence_score": 0.96,
            },
        },
    },
    {
        "standard_kannada": "ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ",
        "standard_roman": "tumba cennagide",
        "english_meaning": "Very good / Fine",
        "category": "emotion",
        "grammatical_pos": "phrase",
        "variants": {
            "bengaluru_mysuru": {
                "local_script": "ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ",
                "local_phonetic": "Tumba chennagide",
                "ipa_pronunciation": "[t̪umbaː t͡ʃennaːɡid̪e]",
                "morphological_rule": "standard_adverbial_tumba",
                "example_sentence_local": "ಈ ತಿಂಡಿ ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ!",
                "example_sentence_standard": "ಈ ಉಪಾಹಾರ ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ.",
                "cultural_origin_note": "Ubiquitous pan-Kannada aesthetic appreciation form.",
                "confidence_score": 0.99,
            },
            "hubballi_dharwad": {
                "local_script": "ಭಾಳ ಚಲೋ ಐತ್ರಿ",
                "local_phonetic": "Bhaal cholo aytri",
                "ipa_pronunciation": "[bʱaːɭ t͡ʃoːloː əjt̪riː]",
                "morphological_rule": "marathi_loan_cholo_copula_aytri",
                "example_sentence_local": "ಧಾರವಾಡ ಪೇಡಾ ಭಾಳ ಚಲೋ ಐತ್ರಿ!",
                "example_sentence_standard": "ಧಾರವಾಡ ಪೇಡಾ ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ.",
                "cultural_origin_note": "Shared northwestern lexis 'cholo' (good) with enclitic 'aytri'.",
                "confidence_score": 0.98,
            },
            "kundapura_mangaluru": {
                "local_script": "ಲಾಯ್ಕ್ ಆಯ್ಪಿನಿ / ಬಾರಿ ಲಾಯ್ಕ್ ಉಂಡು",
                "local_phonetic": "Laayk aipini / Baari laayk undu",
                "ipa_pronunciation": "[laːjk aːjpini / baːri laːjk unɖu]",
                "morphological_rule": "karavali_lexical_laayk_undu",
                "example_sentence_local": "ಅಡಿಗೆ ಬಾರಿ ಲಾಯ್ಕ್ ಉಂಡು ಮಾರಾಯ್ರೆ!",
                "example_sentence_standard": "ಊಟ ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ ಸ್ನೇಹಿತರೆ.",
                "cultural_origin_note": "Coastal loan 'laayk' (fine/comely) and existential 'undu'.",
                "confidence_score": 0.97,
            },
            "kalaburagi_bidar": {
                "local_script": "ಚಲೋ ಅದ ನೋಡ್ರಿ",
                "local_phonetic": "Cholo ada nodree",
                "ipa_pronunciation": "[t͡ʃoloː əd̪ə noːɖriː]",
                "morphological_rule": "deccan_copula_ada_discourse_nodri",
                "example_sentence_local": "ಜೋಳದ ರೊಟ್ಟಿ ಚಲೋ ಅದ ನೋಡ್ರಿ!",
                "example_sentence_standard": "ಜೋಳದ ರೊಟ್ಟಿ ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ ನೋಡಿ.",
                "cultural_origin_note": "Sentence-final discourse marker 'nodri' used for conversational affirmation.",
                "confidence_score": 0.97,
            },
            "arebhashe_kodagu": {
                "local_script": "ಚೊಲೋ ಉಳ್ಳ",
                "local_phonetic": "Cholo ulla",
                "ipa_pronunciation": "[t͡ʃoloː uɭɭə]",
                "morphological_rule": "arebhashe_copula_ulla",
                "example_sentence_local": "ಕಾಫಿ ಚೊಲೋ ಉಳ್ಳ ಅಕ್ಕ!",
                "example_sentence_standard": "ಕಾಫಿ ಚೆನ್ನಾಗಿದೆ ಅಕ್ಕ.",
                "cultural_origin_note": "Combination of 'cholo' with Arebhashe stative copula 'ulla'.",
                "confidence_score": 0.96,
            },
        },
    },
    {
        "standard_kannada": "ತುಂಬಾ / ಹೆಚ್ಚು",
        "standard_roman": "tumba / heccu",
        "english_meaning": "A lot / Very much",
        "category": "daily",
        "grammatical_pos": "adverb",
        "variants": {
            "bengaluru_mysuru": {
                "local_script": "ಸಿಕ್ಕಾಪಟ್ಟೆ / ತುಂಬಾ",
                "local_phonetic": "Sikkapatte / Tumba",
                "ipa_pronunciation": "[sɪkːaːpəʈːe]",
                "morphological_rule": "urban_colloquial_intensifier",
                "example_sentence_local": "ಇವತ್ತು ಮಳೆ ಸಿಕ್ಕಾಪಟ್ಟೆ ಬಂತು.",
                "example_sentence_standard": "ಇಂದು ಮಳೆ ತುಂಬಾ ಸುರಿಯಿತು.",
                "cultural_origin_note": "Urban Mysuru-Bengaluru emphatic intensifier.",
                "confidence_score": 0.99,
            },
            "hubballi_dharwad": {
                "local_script": "ಭಾಳ / ಬಾಳ",
                "local_phonetic": "Bhaal / Baala",
                "ipa_pronunciation": "[bʱaːɭ]",
                "morphological_rule": "retroflex_lateral_preservation_bhaal",
                "example_sentence_local": "ಅಲ್ಲಿ ಜನ ಭಾಳ ಸೇರಿದ್ರು ನೋಡ್ರಿ.",
                "example_sentence_standard": "ಅಲ್ಲಿ ಜನರು ತುಂಬಾ ನೆರೆದಿದ್ದರು.",
                "cultural_origin_note": "North Karnataka retention of single syllable heavy retroflex lateral.",
                "confidence_score": 0.98,
            },
            "kundapura_mangaluru": {
                "local_script": "ಬಾರಿ / ಜಜ್ಜಸ್ಟ್",
                "local_phonetic": "Baari / Jajjast",
                "ipa_pronunciation": "[baːri]",
                "morphological_rule": "tulu_coastal_intensifier_baari",
                "example_sentence_local": "ಅವಂಗೆ ಬಾರಿ ಕೋಪ ಬಂತು.",
                "example_sentence_standard": "ಅವನಿಗೆ ತುಂಬಾ ಕೋಪ ಬಂದಿತು.",
                "cultural_origin_note": "Universal coastal intensifier shared across Tulu and coastal Kannada.",
                "confidence_score": 0.98,
            },
            "kalaburagi_bidar": {
                "local_script": "ಮಸ್ತ್ / ಬಹೂತ್",
                "local_phonetic": "Mast / Bahoot",
                "ipa_pronunciation": "[məst̪]",
                "morphological_rule": "dakhni_urdu_intensifier_mast",
                "example_sentence_local": "ಜಾತ್ರೆಯಲ್ಲಿ ಮಸ್ತ್ ಜನ ಬಂದಿದ್ರು.",
                "example_sentence_standard": "ಜಾತ್ರೆಯಲ್ಲಿ ಬಹಳಷ್ಟು ಜನರು ಬಂದಿದ್ದರು.",
                "cultural_origin_note": "Dakhni Urdu loanword 'mast' entrenched in colloquial speech.",
                "confidence_score": 0.97,
            },
            "arebhashe_kodagu": {
                "local_script": "ಬಾರೀ / ಧಡ",
                "local_phonetic": "Baaree / Dhada",
                "ipa_pronunciation": "[baːriː]",
                "morphological_rule": "malnad_arebhashe_baaree",
                "example_sentence_local": "ತೋಟದಲ್ಲಿ ಬಾರೀ ಕೆಲಸ ಉಟ್ಟು.",
                "example_sentence_standard": "ತೋಟದಲ್ಲಿ ತುಂಬಾ ಕೆಲಸವಿದೆ.",
                "cultural_origin_note": "Malnad agricultural abundance descriptor.",
                "confidence_score": 0.96,
            },
        },
    },
    {
        "standard_kannada": "ಯಾಕೆ?",
        "standard_roman": "yaake?",
        "english_meaning": "Why?",
        "category": "question",
        "grammatical_pos": "adverb",
        "variants": {
            "bengaluru_mysuru": {
                "local_script": "ಯಾಕೆ?",
                "local_phonetic": "Yaake?",
                "ipa_pronunciation": "[jaːke]",
                "morphological_rule": "standard_interrogative_yaake",
                "example_sentence_local": "ಯಾಕೆ ಇಷ್ಟು ತಡವಾಗಿ ಬಂದಿರಿ?",
                "example_sentence_standard": "ಯಾಕೆ ಇಷ್ಟು ತಡವಾಗಿ ಬಂದಿರಿ?",
                "cultural_origin_note": "Literary and standard colloquial question word.",
                "confidence_score": 0.99,
            },
            "hubballi_dharwad": {
                "local_script": "ಯಾಕ್ರೀ? / ಯಾಕ?",
                "local_phonetic": "Yaakri? / Yaaka?",
                "ipa_pronunciation": "[jaːkriː]",
                "morphological_rule": "terminal_vowel_shortening_honorific_ree",
                "example_sentence_local": "ಯಾಕ್ರೀ ನಮ್ ಜೊತೆ ಮಾತಾಡಂಗಿಲ್ಲ?",
                "example_sentence_standard": "ಏಕೆ ನಮ್ಮೊಂದಿಗೆ ಮಾತನಾಡುತ್ತಿಲ್ಲ?",
                "cultural_origin_note": "Terminal vowel apocope with honorific 'ri'.",
                "confidence_score": 0.98,
            },
            "kundapura_mangaluru": {
                "local_script": "ಯಾತ್ತಕೆ? / ಯಾತ್ತಕ್?",
                "local_phonetic": "Yathake? / Yathak?",
                "ipa_pronunciation": "[jaːt̪t̪əke]",
                "morphological_rule": "dental_gemination_yathak",
                "example_sentence_local": "ಯಾತ್ತಕೆ ಹಿಂಗೆ ಮಾಡ್ದೆ?",
                "example_sentence_standard": "ಏತಕ್ಕೆ ಈ ರೀತಿ ಮಾಡಿದೆ?",
                "cultural_origin_note": "Reflects Old Kannada 'ētarke' via dental stop gemination.",
                "confidence_score": 0.97,
            },
            "kalaburagi_bidar": {
                "local_script": "ಯಾತಕ್ಪಾ? / ಕಾ?",
                "local_phonetic": "Yaatakpaa? / Kaa?",
                "ipa_pronunciation": "[jaːt̪əkpaː]",
                "morphological_rule": "interrogative_clitic_paa",
                "example_sentence_local": "ಯಾತಕ್ಪಾ ಅಳುತೀ?",
                "example_sentence_standard": "ಏತಕ್ಕೆ ಅಳುತ್ತಿದ್ದೀಯ?",
                "cultural_origin_note": "Informal solidarity enclitic '-paa' appended to question word.",
                "confidence_score": 0.97,
            },
            "arebhashe_kodagu": {
                "local_script": "ಎತ್ತಕ್?",
                "local_phonetic": "Yettak?",
                "ipa_pronunciation": "[jet̪t̪ək]",
                "morphological_rule": "initial_vowel_fronting_e_for_ya",
                "example_sentence_local": "ಎತ್ತಕ್ ಹಿಂಗೆ ತಲೆ ಕೆಡಿಸಿಕಂಡೆ?",
                "example_sentence_standard": "ಏತಕ್ಕೆ ಹೀಗೆ ಚಿಂತಿಸುತ್ತಿರುವೆ?",
                "cultural_origin_note": "Phonological shift of initial open diphthong to front mid vowel.",
                "confidence_score": 0.96,
            },
        },
    },
    {
        "standard_kannada": "ಇಲ್ಲಿಗೆ ಬನ್ನಿ",
        "standard_roman": "illige banni",
        "english_meaning": "Come here",
        "category": "daily",
        "grammatical_pos": "phrase",
        "variants": {
            "bengaluru_mysuru": {
                "local_script": "ಇಲ್ಲಿ ಬನ್ನಿ",
                "local_phonetic": "Illi banni",
                "ipa_pronunciation": "[ɪllɪ bənni]",
                "morphological_rule": "locative_dative_simplification",
                "example_sentence_local": "ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಇಲ್ಲಿ ಬನ್ನಿ.",
                "example_sentence_standard": "ದಯವಿಟ್ಟು ಇಲ್ಲಿಗೆ ಬನ್ನಿ.",
                "cultural_origin_note": "Everyday polite invitation in Southern Karnataka.",
                "confidence_score": 0.99,
            },
            "hubballi_dharwad": {
                "local_script": "ಈಕಡೆ ಬರ್ರೀ / ಇಲ್ಲಿ ಬರ್ರಿ",
                "local_phonetic": "Eekade barree / Illi barri",
                "ipa_pronunciation": "[illi bərriː]",
                "morphological_rule": "imperative_geminate_r_barri",
                "example_sentence_local": "ಏ ತಮ್ಮಾ, ಒಂದಿಷ್ಟು ಇಲ್ಲಿ ಬರ್ರಿ!",
                "example_sentence_standard": "ತಮ್ಮಾ, ಸ್ವಲ್ಪ ಇಲ್ಲಿಗೆ ಬಾ.",
                "cultural_origin_note": "Geminated vibrant r in imperative plural/honorific form.",
                "confidence_score": 0.98,
            },
            "kundapura_mangaluru": {
                "local_script": "ಇಲ್ ಬಾ / ಇಲ್ ಬಪ್ಪಿ",
                "local_phonetic": "Il baa / Il bappi",
                "ipa_pronunciation": "[ɪl bəpːi]",
                "morphological_rule": "archaic_halegannada_future_p_marker_bappi",
                "example_sentence_local": "ಮಕ್ಕಳಾ, ಇಲ್ ಬಪ್ಪಿ ಬೇಗ!",
                "example_sentence_standard": "ಮಕ್ಕಳೇ, ಇಲ್ಲಿಗೆ ಬೇಗ ಬನ್ನಿ!",
                "cultural_origin_note": "Archaic Kannada labial stop marker in polite directive 'bappi'.",
                "confidence_score": 0.97,
            },
            "kalaburagi_bidar": {
                "local_script": "ಇಲ್ಲಿಗ್ ಬರ್ರಿ ನೋಡ್ರಿ",
                "local_phonetic": "Illig barri nodri",
                "ipa_pronunciation": "[ɪllɪɡ bərriː noːɖri]",
                "morphological_rule": "dative_g_with_imperative_barri",
                "example_sentence_local": "ಅಣ್ಣಾ, ಈಚೆ ಇಲ್ಲಿಗ್ ಬರ್ರಿ ನೋಡ್ರಿ.",
                "example_sentence_standard": "ಅಣ್ಣ, ದಯವಿಟ್ಟು ಇಲ್ಲಿಗೆ ಬನ್ನಿ.",
                "cultural_origin_note": "Combines dative velar suffix '-g' with collaborative tag 'nodri'.",
                "confidence_score": 0.97,
            },
            "arebhashe_kodagu": {
                "local_script": "ಇಲ್ಲಿ ಬನ್ನಿ / ಇತ್ತ ಬಾ",
                "local_phonetic": "Itta baa / Illi banni",
                "ipa_pronunciation": "[it̪t̪ə baː]",
                "morphological_rule": "arebhashe_directional_itta",
                "example_sentence_local": "ಮಾಣಿ, ಇತ್ತ ಬಾ ಒಮ್ಮೆ!",
                "example_sentence_standard": "ಹುಡುಗನೇ, ಇತ್ತ ಕಡೆ ಬಾ ಒಮ್ಮೆ!",
                "cultural_origin_note": "Directional proximate adverb 'itta' (hither/this side).",
                "confidence_score": 0.96,
            },
        },
    },
    {
        "standard_kannada": "ಊಟ ಆಯಿತೇ?",
        "standard_roman": "oota aayithe?",
        "english_meaning": "Have you eaten? (Did you have food?)",
        "category": "food",
        "grammatical_pos": "phrase",
        "variants": {
            "bengaluru_mysuru": {
                "local_script": "ಊಟ ಆಯ್ತಾ?",
                "local_phonetic": "Oota aaytha?",
                "ipa_pronunciation": "[uːʈa aːjt̪aː]",
                "morphological_rule": "interrogative_particle_aa_clitic",
                "example_sentence_local": "ಮನೆಯಲ್ಲಿ ಎಲ್ಲರ ಊಟ ಆಯ್ತಾ?",
                "example_sentence_standard": "ಮನೆಯಲ್ಲಿ ಎಲ್ಲರ ಊಟ ಆಯಿತೇ?",
                "cultural_origin_note": "The seminal greeting of caring hospitality in Karnataka.",
                "confidence_score": 0.99,
            },
            "hubballi_dharwad": {
                "local_script": "ಊಟ ಆತೇನ್ರೀ? / ಊಟ ಆತ್ರಿನ್ರೀ?",
                "local_phonetic": "Oota aatrenree?",
                "ipa_pronunciation": "[uːʈə aːt̪reːnriː]",
                "morphological_rule": "past_verbal_contraction_aatri",
                "example_sentence_local": "ಕಾಕಾ, ಮಧ್ಯಾಹ್ನದ ಊಟ ಆತ್ರಿನ್ರೀ?",
                "example_sentence_standard": "ಕಾಕ, ಮಧ್ಯಾಹ್ನದ ಊಟ ಆಯಿತೇ?",
                "cultural_origin_note": "Syntactic amalgamation of past auxiliary 'aathu' + enclitic interrogative 'en' + 'ri'.",
                "confidence_score": 0.98,
            },
            "kundapura_mangaluru": {
                "local_script": "ಊಟ ಆತೇ? / ವನಸ್ ಆಂಡಾ?",
                "local_phonetic": "Oota aathe? / Vanas aanda?",
                "ipa_pronunciation": "[uːʈə aːt̪eː / vənəs aːɳɖaː]",
                "morphological_rule": "aspirated_dental_stop_aathe",
                "example_sentence_local": "ಮಧ್ಯಾಹ್ನದ ವನಸ್ ಆತೇ ಮಾರಾಯ್ರೆ?",
                "example_sentence_standard": "ಮಧ್ಯಾಹ್ನದ ಊಟ ಆಯಿತೇ ಸ್ನೇಹಿತರೆ?",
                "cultural_origin_note": "Use of 'vanas' (feast/meal from Sanskrit bhojana/vana) or 'oota aathe'.",
                "confidence_score": 0.97,
            },
            "kalaburagi_bidar": {
                "local_script": "ಊಟ ಆತ್ರಿ? / ಖಾನಾ ಆತಾನ್ರೀ?",
                "local_phonetic": "Oota aathree? / Khaana aatha?",
                "ipa_pronunciation": "[uːʈə aːt̪riː]",
                "morphological_rule": "interrogative_rising_intonation_ree",
                "example_sentence_local": "ಜೋಳದ ರೊಟ್ಟಿ ಊಟ ಆತ್ರಿ ಅಣ್ಣಾ?",
                "example_sentence_standard": "ಜೋಳದ ರೊಟ್ಟಿ ಊಟ ಆಯಿತೇ ಅಣ್ಣ?",
                "cultural_origin_note": "Short past marker 'aath' followed by high-pitch honorific tag.",
                "confidence_score": 0.97,
            },
            "arebhashe_kodagu": {
                "local_script": "ಊಟ ಆತಾ? / ಕೂಳು ತಿಂದ್ಯಾ?",
                "local_phonetic": "Oota aatha? / Koolu tindya?",
                "ipa_pronunciation": "[uːʈə aːt̪aː / kuːɭu t̪inɖjaː]",
                "morphological_rule": "dravidian_substrate_koolu",
                "example_sentence_local": "ಮಧ್ಯಾಹ್ನ ಕೂಳು ತಿಂದ್ಯಾ ಮಾಣಿ?",
                "example_sentence_standard": "ಮಧ್ಯಾಹ್ನ ಅನ್ನ ಊಟ ಮಾಡಿದಿರಾ ಹುಡುಗನೇ?",
                "cultural_origin_note": "Preserves Proto-Dravidian 'koolu' for boiled rice meal.",
                "confidence_score": 0.96,
            },
        },
    },
    {
        "standard_kannada": "ಏನಾಯಿತು?",
        "standard_roman": "enaayitu?",
        "english_meaning": "What happened?",
        "category": "question",
        "grammatical_pos": "phrase",
        "variants": {
            "bengaluru_mysuru": {
                "local_script": "ಏನಾಯ್ತು?",
                "local_phonetic": "Enaaythu?",
                "ipa_pronunciation": "[eːnaːjt̪u]",
                "morphological_rule": "vowel_contraction_aaythu",
                "example_sentence_local": "ಅಲ್ಲಿ ಅಷ್ಟು ಗಲಾಟೆ ಏನಾಯ್ತು?",
                "example_sentence_standard": "ಅಲ್ಲಿ ಅಷ್ಟು ಗಲಾಟೆ ಏನಾಯಿತು?",
                "cultural_origin_note": "Standard contraction of past neuter verb.",
                "confidence_score": 0.99,
            },
            "hubballi_dharwad": {
                "local_script": "ಏನಾತ್ರೀ? / ಏನಾತ?",
                "local_phonetic": "Enaatri? / Enaatha?",
                "ipa_pronunciation": "[eːnaːt̪riː]",
                "morphological_rule": "past_verbal_truncation_atri",
                "example_sentence_local": "ಯಾಕ್ರೀ ಗಾಬರಿ ಆಗೇರಿ, ಏನಾತ್ರೀ?",
                "example_sentence_standard": "ಏಕೆ ಗಾಬರಿಯಾಗಿದ್ದೀರಿ, ಏನಾಯಿತು?",
                "cultural_origin_note": "Monophthongization from 'aayitu' to 'aatha/aatri'.",
                "confidence_score": 0.98,
            },
            "kundapura_mangaluru": {
                "local_script": "ಯಾಂತ್ ಆಂಡ್? / ಏನಾತ್?",
                "local_phonetic": "Yaanth aand? / Enaath?",
                "ipa_pronunciation": "[jaːnt̪ aːnɖ]",
                "morphological_rule": "coastal_interrogative_yaanth",
                "example_sentence_local": "ಎಲಾ ಮಂಜ, ಅಲ್ಲಿ ಯಾಂತ್ ಆಂಡ್?",
                "example_sentence_standard": "ಮಂಜ, ಅಲ್ಲಿ ಏನಾಯಿತು?",
                "cultural_origin_note": "Features the coastal Kannada signature pronoun 'yaanth' (what).",
                "confidence_score": 0.98,
            },
            "kalaburagi_bidar": {
                "local_script": "ಏನಾತು ನೋಡ್ರಿ?",
                "local_phonetic": "Enaathu nodri?",
                "ipa_pronunciation": "[eːnaːt̪u noːɖri]",
                "morphological_rule": "discourse_particle_nodri",
                "example_sentence_local": "ಹೊಲದ ಕಡೆ ಏನಾಯ್ತು ನೋಡ್ರಿ?",
                "example_sentence_standard": "ಹೊಲದ ಬಳಿ ಏನಾಯಿತು ನೋಡಿ?",
                "cultural_origin_note": "Characteristic questioning lilt accompanied by 'nodri'.",
                "confidence_score": 0.97,
            },
            "arebhashe_kodagu": {
                "local_script": "ಎನ್ನಾತು?",
                "local_phonetic": "Ennaathu?",
                "ipa_pronunciation": "[ennaːt̪u]",
                "morphological_rule": "nasal_gemination_ennaathu",
                "example_sentence_local": "ಅಲ್ಲಿ ಅಷ್ಟೊತ್ತಿಗೆ ಎನ್ನಾತು?",
                "example_sentence_standard": "ಅಲ್ಲಿ ಅಷ್ಟೊತ್ತಿಗೆ ಏನಾಯಿತು?",
                "cultural_origin_note": "Geminates the alveolar nasal 'n' in the interrogative base.",
                "confidence_score": 0.96,
            },
        },
    },
    {
        "standard_kannada": "ಹುಡುಗ / ಹುಡುಗಿ",
        "standard_roman": "huduga / hudugi",
        "english_meaning": "Boy / Girl",
        "category": "daily",
        "grammatical_pos": "noun",
        "variants": {
            "bengaluru_mysuru": {
                "local_script": "ಹುಡುಗ / ಹುಡುಗಿ",
                "local_phonetic": "Huduga / Hudugi",
                "ipa_pronunciation": "[huɖuɡə / huɖuɡi]",
                "morphological_rule": "standard_aspirated_h_retention",
                "example_sentence_local": "ಆ ಹುಡುಗ ಶಾಲೆಗೆ ಹೋಗುತ್ತಿದ್ದಾನೆ.",
                "example_sentence_standard": "ಆ ಹುಡುಗ ಶಾಲೆಗೆ ಹೋಗುತ್ತಿದ್ದಾನೆ.",
                "cultural_origin_note": "Standard literary terms retained across Southern institutions.",
                "confidence_score": 0.99,
            },
            "hubballi_dharwad": {
                "local_script": "ಹುಡಗ್ಯಾ / ಹುಡಗಿ",
                "local_phonetic": "Hudagyaa / Hudagi",
                "ipa_pronunciation": "[hʊɖəɡjaː / hʊɖəɡiː]",
                "morphological_rule": "vocative_glide_suffix_yaa",
                "example_sentence_local": "ಆ ಹುಡಗ್ಯಾ ಬಹಳ ಚುರುಕ ಅದಾನ್ ನೋಡ್ರಿ.",
                "example_sentence_standard": "ಆ ಹುಡುಗ ತುಂಬಾ ಚುರುಕಾಗಿದ್ದಾನೆ ನೋಡಿ.",
                "cultural_origin_note": "Affectionate/familiar vocative inflection '-yaa' for masculine nouns.",
                "confidence_score": 0.98,
            },
            "kundapura_mangaluru": {
                "local_script": "ಮಾಣಿ / ಕೂಸ",
                "local_phonetic": "Maani / Koosa",
                "ipa_pronunciation": "[maːɳi / kuːsə]",
                "morphological_rule": "proto_dravidian_gender_lexemes",
                "example_sentence_local": "ಆ ಮಾಣಿ ಒಳ್ಳೆ ಕಲಿಯುವ ಕೂಸ.",
                "example_sentence_standard": "ಆ ಹುಡುಗ ಚೆನ್ನಾಗಿ ಓದುವ ಮಗು.",
                "cultural_origin_note": "'Maani' (young boy) and 'Koosa' (child/girl) are distinct coastal idioms.",
                "confidence_score": 0.98,
            },
            "kalaburagi_bidar": {
                "local_script": "ಪೋರ / ಪೋರಿ",
                "local_phonetic": "Pora / Pori",
                "ipa_pronunciation": "[poːrə / poːri]",
                "morphological_rule": "marathi_substrate_pora_pori",
                "example_sentence_local": "ಆ ಪೋರ ಕಾಲೇಜ್‌ಗೆ ಹೊಂಟಾನ್.",
                "example_sentence_standard": "ಆ ಹುಡುಗ ಕಾಲೇಜಿಗೆ ಹೊರಟಿದ್ದಾನೆ.",
                "cultural_origin_note": "Border Marathi lexical substrate 'pora' (boy) and 'pori' (girl).",
                "confidence_score": 0.97,
            },
            "arebhashe_kodagu": {
                "local_script": "ಮಾಣಿ / ಕುಂಞಿ",
                "local_phonetic": "Maani / Kunyi",
                "ipa_pronunciation": "[maːɳi / kuɲɲi]",
                "morphological_rule": "malnad_kodava_substrate_maani",
                "example_sentence_local": "ನಮ್ಮ ಮಾಣಿ ತೋಟಕ್ಕೆ ಹೋದ.",
                "example_sentence_standard": "ನಮ್ಮ ಹುಡುಗ ತೋಟಕ್ಕೆ ಹೋದನು.",
                "cultural_origin_note": "Shared highland Malnad and Kodagu kinship/youth designations.",
                "confidence_score": 0.96,
            },
        },
    },
    {
        "standard_kannada": "ಬೇಗ / ಶೀಘ್ರವಾಗಿ",
        "standard_roman": "bega / sheeghravaagi",
        "english_meaning": "Quickly / Fast",
        "category": "daily",
        "grammatical_pos": "adverb",
        "variants": {
            "bengaluru_mysuru": {
                "local_script": "ಬೇಗ ಬೇಗ",
                "local_phonetic": "Bega bega",
                "ipa_pronunciation": "[beːɡə beːɡə]",
                "morphological_rule": "reduplicative_standard_adverb",
                "example_sentence_local": "ಬೇಗ ಬೇಗ ರೆಡಿಯಾಗಿ, ಬಸ್ ಹೊರಡುತ್ತೆ.",
                "example_sentence_standard": "ಬೇಗ ಸಿದ್ಧರಾಗಿ, ಬಸ್ಸು ಹೊರಡುತ್ತದೆ.",
                "cultural_origin_note": "Reduplication used for urgency in standard spoken Kannada.",
                "confidence_score": 0.99,
            },
            "hubballi_dharwad": {
                "local_script": "ಲಗೂನೆ / ಬಿರುಸಿನಿಂದ",
                "local_phonetic": "Lagoone / Birsa",
                "ipa_pronunciation": "[ləɡuːne]",
                "morphological_rule": "marathi_loan_laghu_lagoon",
                "example_sentence_local": "ಲಗೂನೆ ನಡಿ, ರೈಲು ಬರ್ತದ!",
                "example_sentence_standard": "ಬೇಗನೆ ನಡೆ, ರೈಲು ಬರುತ್ತದೆ!",
                "cultural_origin_note": "North Karnataka 'lagoone' derived from Sanskrit/Marathi laghu/lagaan.",
                "confidence_score": 0.98,
            },
            "kundapura_mangaluru": {
                "local_script": "ಬೇಗನೆ / ಜುಪ್ ಅಂತ",
                "local_phonetic": "Begane / Jup antha",
                "ipa_pronunciation": "[beːɡəne]",
                "morphological_rule": "coastal_ideophonic_marker",
                "example_sentence_local": "ಜುಪ್ ಅಂತ ಓಡಿ ಹೋಗಿ ಕರಕಂಡ್ ಬಾ!",
                "example_sentence_standard": "ವೇಗವಾಗಿ ಓಡಿ ಹೋಗಿ ಕರೆದುಕೊಂಡು ಬಾ!",
                "cultural_origin_note": "Coastal ideophone 'jup antha' captures swift darting motion.",
                "confidence_score": 0.97,
            },
            "kalaburagi_bidar": {
                "local_script": "ಜಲ್ದಿ / ಗಪ್ ಚಿಪ್",
                "local_phonetic": "Jaldi / Lagane",
                "ipa_pronunciation": "[d͡ʒəldiː]",
                "morphological_rule": "urdu_loan_jaldi",
                "example_sentence_local": "ಜಲ್ದಿ ಕೆಲಸ ಮುಗಿಸಿ ಮನೆಗೆ ನಡಿ.",
                "example_sentence_standard": "ಬೇಗ ಕೆಲಸ ಮುಗಿಸಿ ಮನೆಗೆ ಹೋಗು.",
                "cultural_origin_note": "High penetration of Hindustani/Dakhni 'jaldi' across Hyderabad-Karnataka.",
                "confidence_score": 0.98,
            },
            "arebhashe_kodagu": {
                "local_script": "ಬೇಗಲೆ / ಧಡೀರಂತ",
                "local_phonetic": "Begale / Dhadeeranta",
                "ipa_pronunciation": "[beːɡəle]",
                "morphological_rule": "arebhashe_adverbial_suffix_le",
                "example_sentence_local": "ಬೇಗಲೆ ಬಂದು ಊಟ ಮಾಡು.",
                "example_sentence_standard": "ಬೇಗನೆ ಬಂದು ಊಟ ಮಾಡು.",
                "cultural_origin_note": "Adverbial suffixation with lateral '-le' in Arebhashe.",
                "confidence_score": 0.96,
            },
        },
    },
    {
        "standard_kannada": "ಹಾಗೆ / ಆ ರೀತಿ",
        "standard_roman": "haage / aa reethi",
        "english_meaning": "Like that / In that manner",
        "category": "daily",
        "grammatical_pos": "adverb",
        "variants": {
            "bengaluru_mysuru": {
                "local_script": "ಹಾಗೆ",
                "local_phonetic": "Haage",
                "ipa_pronunciation": "[haːɡe]",
                "morphological_rule": "standard_demonstrative_adverb",
                "example_sentence_local": "ಹಾಗೆ ಮಾಡಬೇಡ ಅಂತ ಹೇಳಿದ್ದೆ.",
                "example_sentence_standard": "ಆ ರೀತಿ ಮಾಡಬೇಡ ಎಂದು ಹೇಳಿದ್ದೆ.",
                "cultural_origin_note": "Standard distant demonstrative adverb of manner.",
                "confidence_score": 0.99,
            },
            "hubballi_dharwad": {
                "local_script": "ಹ್ಯಾಂಗ / ಹಾಂಗ",
                "local_phonetic": "Hyaang / Haang",
                "ipa_pronunciation": "[hjaːŋɡə]",
                "morphological_rule": "nasalized_glide_hyaang",
                "example_sentence_local": "ನೀವ್ ಹಾಂಗ ಅಂದ್ಕೂಡ್ಲೆ ನಂಗೆ ಬೇಜಾರಾತು.",
                "example_sentence_standard": "ನೀವು ಹಾಗೆ ಹೇಳಿದ ತಕ್ಷಣ ನನಗೆ ಬೇಸರವಾಯಿತು.",
                "cultural_origin_note": "Velar nasal assimilation creating 'haang'/'hyaang'.",
                "confidence_score": 0.98,
            },
            "kundapura_mangaluru": {
                "local_script": "ಹಾಂಗೇ / ಅಂಗೆ",
                "local_phonetic": "Haange / Ange",
                "ipa_pronunciation": "[haːŋɡeː]",
                "morphological_rule": "velar_nasal_cluster_aange",
                "example_sentence_local": "ಹಾಂಗೇ ನಡ್ಕಂಡ್ ಹೋಗು, ದಾರಿ ಸಿಗ್ತದೆ.",
                "example_sentence_standard": "ಹಾಗೆಯೇ ನಡೆದುಕೊಂಡು ಹೋಗು, ದಾರಿ ಸಿಗುತ್ತದೆ.",
                "cultural_origin_note": "Elongated vowel glide 'haange' ubiquitous in Coastal dialect storytelling.",
                "confidence_score": 0.98,
            },
            "kalaburagi_bidar": {
                "local_script": "ಆ ತರಾ / ಹಂಗ ನೋಡ್ರಿ",
                "local_phonetic": "Aa tharaa / Hanga",
                "ipa_pronunciation": "[aː t̪ʰəraː]",
                "morphological_rule": "dakhni_persian_thara_form",
                "example_sentence_local": "ಆ ತರಾ ಮಾತಾಡಿದ್ರೆ ಹೆಂಗ್ರೀ?",
                "example_sentence_standard": "ಆ ರೀತಿ ಮಾತನಾಡಿದರೆ ಹೇಗೆ?",
                "cultural_origin_note": "Integration of Persianate 'taraah' (way/manner) into Kannada syntax.",
                "confidence_score": 0.97,
            },
            "arebhashe_kodagu": {
                "local_script": "ಹಾಂಗೆನೇ",
                "local_phonetic": "Haangene",
                "ipa_pronunciation": "[haːŋɡeneː]",
                "morphological_rule": "arebhashe_clitic_ne",
                "example_sentence_local": "ಅವನು ಹಾಂಗೆನೇ ಹೇಳಿದ.",
                "example_sentence_standard": "ಅವನು ಹಾಗೆಯೇ ಹೇಳಿದನು.",
                "cultural_origin_note": "Emphatic suffix '-ne' attached to nasalized demonstrative stem.",
                "confidence_score": 0.96,
            },
        },
    },
    {
        "standard_kannada": "ಕೃಷಿ / ಹೊಲದ ಕೆಲಸ",
        "standard_roman": "krushi / holada kelasa",
        "english_meaning": "Agriculture / Field work",
        "category": "agrarian",
        "grammatical_pos": "noun",
        "variants": {
            "bengaluru_mysuru": {
                "local_script": "ಜಮೀನು ಕೆಲಸ / ಹೊಲದ ಕೆಲಸ",
                "local_phonetic": "Jameenu kelasa / Holada kelasa",
                "ipa_pronunciation": "[hoɭəd̪ə keləsə]",
                "morphological_rule": "standard_genitive_holada",
                "example_sentence_local": "ನಾಳೆ ಹೊಲದ ಕೆಲಸಕ್ಕೆ ಆಳುಗಳು ಬರುತ್ತಿದ್ದಾರೆ.",
                "example_sentence_standard": "ನಾಳೆ ಹೊಲದ ಕೆಲಸಕ್ಕೆ ಕೂಲಿಯಾಳುಗಳು ಬರುತ್ತಿದ್ದಾರೆ.",
                "cultural_origin_note": "Southern plains agrarian terminology reflecting tank and canal irrigation.",
                "confidence_score": 0.99,
            },
            "hubballi_dharwad": {
                "local_script": "ಹೊಲದಾಗ್ಲ ಕೆಲಸ / ಸೀಮೆ ಕೆಲ್ಸ",
                "local_phonetic": "Holadaagla kelsa / Kaayaka",
                "ipa_pronunciation": "[hoːlɖaːɡlə kelsə]",
                "morphological_rule": "north_locative_daaga_syncopation",
                "example_sentence_local": "ಈಗ ಹತ್ತಿ ಬಿಡಿಸೋ ಹೊಲದಾಗ್ಲ ಕೆಲಸ ನಡೀತದ.",
                "example_sentence_standard": "ಈಗ ಹತ್ತಿ ಬಿಡಿಸುವ ಹೊಲದ ಕೆಲಸ ನಡೆಯುತ್ತಿದೆ.",
                "cultural_origin_note": "Dryland black cotton soil farming lexis and Lingayat Kayaka philosophy.",
                "confidence_score": 0.98,
            },
            "kundapura_mangaluru": {
                "local_script": "ಬಯಲು ಕೆಲಸ / ಗದ್ದೆ ಬೇಲೆ",
                "local_phonetic": "Bayalu kelasa / Gadde bele",
                "ipa_pronunciation": "[ɡəd̪ːe beːle]",
                "morphological_rule": "tulu_cognate_bele_for_kelasa",
                "example_sentence_local": "ಮಳೆಗಾಲದಲ್ಲಿ ಗದ್ದೆ ಬೇಲೆ ಭಾರಿ ಜೋರು.",
                "example_sentence_standard": "ಮಳೆಗಾಲದಲ್ಲಿ ಗದ್ದೆಯ ಕೆಲಸ ತುಂಬಾ ತೀವ್ರ.",
                "cultural_origin_note": "Coastal paddy wetland terminology: 'bele' replaces Kannada 'kelasa'.",
                "confidence_score": 0.98,
            },
            "kalaburagi_bidar": {
                "local_script": "ಹೊಲದ ಕಾಮ್ / ಶೇತೀ ಕೆಲ್ಸ",
                "local_phonetic": "Holada kaam / Shetee kelsa",
                "ipa_pronunciation": "[ʃeːt̪iː kelsə]",
                "morphological_rule": "marathi_deccan_sheti_kaam",
                "example_sentence_local": "ತೊಗರಿ ಕಟಾವು ಶೇತೀ ಕೆಲ್ಸ ಮುಗೀತು.",
                "example_sentence_standard": "ತೊಗರಿ ಕಟಾವಿನ ಹೊಲದ ಕೆಲಸ ಮುಗಿಯಿತು.",
                "cultural_origin_note": "Red gram bowl lexis incorporating Marathi 'shet/sheti' (agricultural land).",
                "confidence_score": 0.97,
            },
            "arebhashe_kodagu": {
                "local_script": "ತೋಟದ ಬೇಲೆ / ಗದ್ದೆ ಕೆಲ್ಸ",
                "local_phonetic": "Thotada bele / Gadde kelsa",
                "ipa_pronunciation": "[t̪oːʈəd̪ə beːle]",
                "morphological_rule": "plantation_ecology_thotada_bele",
                "example_sentence_local": "ಅಡಿಕೆ ತೋಟದ ಬೇಲೆ ಮುಗಿಸಿ ಬಂದೆ.",
                "example_sentence_standard": "ಅಡಿಕೆ ತೋಟದ ಕೆಲಸ ಮುಗಿಸಿ ಬಂದೆನು.",
                "cultural_origin_note": "Western Ghats areca and coffee plantation agro-linguistic marker.",
                "confidence_score": 0.96,
            },
        },
    },
    {
        "standard_kannada": "ತಾಯಿ / ಅಮ್ಮ",
        "standard_roman": "taayi / amma",
        "english_meaning": "Mother",
        "category": "daily",
        "grammatical_pos": "noun",
        "variants": {
            "bengaluru_mysuru": {
                "local_script": "ಅಮ್ಮ",
                "local_phonetic": "Amma",
                "ipa_pronunciation": "[əmmaː]",
                "morphological_rule": "standard_familial_vocative",
                "example_sentence_local": "ಅಮ್ಮ ಊಟಕ್ಕೆ ಕರೆಯುತ್ತಿದ್ದಾರೆ.",
                "example_sentence_standard": "ತಾಯಿ ಊಟಕ್ಕೆ ಕರೆಯುತ್ತಿದ್ದಾರೆ.",
                "cultural_origin_note": "Universal maternal address across Southern Karnataka.",
                "confidence_score": 0.99,
            },
            "hubballi_dharwad": {
                "local_script": "ಅವ್ವಾ / ಮಾಯಿ",
                "local_phonetic": "Avvaa / Aayi",
                "ipa_pronunciation": "[əʋʋaː]",
                "morphological_rule": "archaic_dravidian_avva",
                "example_sentence_local": "ಅವ್ವಾ, ರೊಟ್ಟಿ ಬಡಿಸವ್ವ ನಂಗೆ ಹೊಟ್ಟೆ ಹಸಿದದ.",
                "example_sentence_standard": "ಅಮ್ಮ, ರೊಟ್ಟಿ ಬಡಿಸು ನನಗೆ ಹಸಿವಾಗಿದೆ.",
                "cultural_origin_note": "Ancient Dravidian maternal morpheme 'avva' preserved in northern Kannada.",
                "confidence_score": 0.98,
            },
            "kundapura_mangaluru": {
                "local_script": "ಅಪ್ಪೆ / ಅಬ್ಬೆ",
                "local_phonetic": "Appe / Abbe",
                "ipa_pronunciation": "[əpːe]",
                "morphological_rule": "tulu_halegannada_substrate_appe",
                "example_sentence_local": "ಅಪ್ಪೆ ಮನೇಲಿ ಕಾಫಿ ಮಾಡ್ತಿದ್ದಾರೆ.",
                "example_sentence_standard": "ಅಮ್ಮ ಮನೆಯಲ್ಲಿ ಕಾಫಿ ಮಾಡುತ್ತಿದ್ದಾರೆ.",
                "cultural_origin_note": "Direct Tulu-Dravidian maternal root 'appe'.",
                "confidence_score": 0.98,
            },
            "kalaburagi_bidar": {
                "local_script": "ಅಮ್ಮಾ / ಮಾಯೀ",
                "local_phonetic": "Amma / Maayi",
                "ipa_pronunciation": "[maːjiː]",
                "morphological_rule": "marathi_dakhni_substrate_maayi",
                "example_sentence_local": "ಮಾಯೀ ಕರೆಯಲಿಕ್ಕತ್ತಾಳ ನೋಡ್ರಿ.",
                "example_sentence_standard": "ಅಮ್ಮ ಕರೆಯುತ್ತಿದ್ದಾಳೆ ನೋಡಿ.",
                "cultural_origin_note": "Acoustic blending of Marathi 'maayi' and regional intonation.",
                "confidence_score": 0.97,
            },
            "arebhashe_kodagu": {
                "local_script": "ಅಬ್ಬೆ / ಅಮ್ಮ",
                "local_phonetic": "Abbe / Amma",
                "ipa_pronunciation": "[əbːe]",
                "morphological_rule": "arebhashe_dravidian_abbe",
                "example_sentence_local": "ಅಬ್ಬೆ ತೋಟಕ್ಕೆ ಹೋದೊ.",
                "example_sentence_standard": "ಅಮ್ಮ ತೋಟಕ್ಕೆ ಹೋದರು.",
                "cultural_origin_note": "Vocalic bilabial preservation 'abbe' in Arebhashe lineage.",
                "confidence_score": 0.96,
            },
        },
    },
    {
        "standard_kannada": "ಮಳೆ",
        "standard_roman": "male",
        "english_meaning": "Rain",
        "category": "agrarian",
        "grammatical_pos": "noun",
        "variants": {
            "bengaluru_mysuru": {
                "local_script": "ಮಳೆ",
                "local_phonetic": "Male",
                "ipa_pronunciation": "[mɐɭe]",
                "morphological_rule": "retroflex_lateral_male",
                "example_sentence_local": "ಸಂಜೆ ಜೋರಾಗಿ ಮಳೆ ಬರಬಹುದು.",
                "example_sentence_standard": "ಸಂಜೆ ಜೋರಾಗಿ ಮಳೆ ಬರಬಹುದು.",
                "cultural_origin_note": "Retains standard retroflex lateral liquid ಳ.",
                "confidence_score": 0.99,
            },
            "hubballi_dharwad": {
                "local_script": "ಮಳೀ / ಮಳಿ",
                "local_phonetic": "Mali",
                "ipa_pronunciation": "[mɐɭi]",
                "morphological_rule": "terminal_vowel_raising_e_to_i",
                "example_sentence_local": "ನಮ್ಮೂರಿಗೆ ಮಳೀ ಚಲೋ ಆಗೇದ ನೋಡ್ರಿ.",
                "example_sentence_standard": "ನಮ್ಮೂರಿಗೆ ಮಳೆ ಚೆನ್ನಾಗಿ ಆಗಿದೆ ನೋಡಿ.",
                "cultural_origin_note": "Systematic vowel raising of terminal front vowel /e/ -> /i/.",
                "confidence_score": 0.98,
            },
            "kundapura_mangaluru": {
                "local_script": "ಬರ್ಷ / ಮಳೇ",
                "local_phonetic": "Barsha / Male",
                "ipa_pronunciation": "[bərʂə]",
                "morphological_rule": "sanskrit_tadbhava_barsha",
                "example_sentence_local": "ಕರಾವಳೀಲಿ ಬರ್ಷ ಅಂದ್ರೆ ಜಲಪ್ರಳಯ!",
                "example_sentence_standard": "ಕರಾವಳಿಯಲ್ಲಿ ಮಳೆ ಎಂದರೆ ಮಹಾಪೂರ!",
                "cultural_origin_note": "Coastal Tadbhava 'barsha' (from varṣā) and elongated 'malee'.",
                "confidence_score": 0.98,
            },
            "kalaburagi_bidar": {
                "local_script": "ಬಾರೀಶ್ / ಮಳಿ",
                "local_phonetic": "Baarish / Mali",
                "ipa_pronunciation": "[baːrɪʃ]",
                "morphological_rule": "urdu_persian_loan_baarish",
                "example_sentence_local": "ಬಾರೀಶ್ ಆದ ಮ್ಯಾಲ ಬಿತ್ತನೆ ಮಾಡ್ತೇವ್ರಿ.",
                "example_sentence_standard": "ಮಳೆ ಬಂದ ನಂತರ ಬಿತ್ತನೆ ಮಾಡುತ್ತೇವೆ.",
                "cultural_origin_note": "Dakhni Urdu 'baarish' commonly used by farmers in the border districts.",
                "confidence_score": 0.97,
            },
            "arebhashe_kodagu": {
                "local_script": "ಮಳೆ / ಜೋರು ಮಳೆ",
                "local_phonetic": "Male",
                "ipa_pronunciation": "[mɐɭe]",
                "morphological_rule": "malnad_monsoon_profile",
                "example_sentence_local": "ಘಟ್ಟದಲ್ಲಿ ದಿನಪೂರ್ತಿ ಮಳೆ ಹೊಯ್ಯುದ್ದು.",
                "example_sentence_standard": "ಘಟ್ಟದಲ್ಲಿ ಇಡೀ ದಿನ ಮಳೆ ಸುರಿಯುತ್ತಿದೆ.",
                "cultural_origin_note": "Monsoon Western Ghats vocabulary emphasizing torrential nature.",
                "confidence_score": 0.96,
            },
        },
    },
]


AUTHENTIC_COMMUNITY_SUBMISSIONS: List[Dict[str, Any]] = [
    {
        "contributor_name": "Shankar Gowda Patil",
        "district_name": "Belagavi",
        "latitude": 15.8497,
        "longitude": 74.4977,
        "nearest_region_code": "hubballi_dharwad",
        "local_phrase_kannada": "ಚಲೋ ಐತ್ರಿ ಪಾ",
        "local_phrase_roman": "Cholo aytri pa",
        "standard_meaning_english": "It is very fine brother",
        "category": "greeting",
        "phonotactic_validity_score": 0.98,
        "ai_triage_status": "approved_injected",
        "triage_notes": "Verified phonotactic profile: 0.98 validity. Detected northern alveolar honorific -ri and Marathi contact root cholo. Injected into Knowledge Graph under Uttara Karnataka.",
    },
    {
        "contributor_name": "Sunita Shetty",
        "district_name": "Udupi",
        "latitude": 13.3409,
        "longitude": 74.7421,
        "nearest_region_code": "kundapura_mangaluru",
        "local_phrase_kannada": "ಲಾಯ್ಕ್ ಆಂಡ್ ಪೋಯಿ",
        "local_phrase_roman": "Laayk aand poyi",
        "standard_meaning_english": "It became very pleasant and comfortable",
        "category": "daily",
        "phonotactic_validity_score": 0.96,
        "ai_triage_status": "approved_injected",
        "triage_notes": "Verified Tulu-Kannada coastal substrate adjective laayk and participial connector.",
    },
    {
        "contributor_name": "Basavaraj Biradar",
        "district_name": "Kalaburagi",
        "latitude": 17.3297,
        "longitude": 76.8343,
        "nearest_region_code": "kalaburagi_bidar",
        "local_phrase_kannada": "ಜಲ್ದಿ ಹೋಗ್ಲಿಕತ್ತೀವಿ ನೋಡ್ರಿ",
        "local_phrase_roman": "Jaldi hoglikattivi nodri",
        "standard_meaning_english": "We are hurrying along quickly you see",
        "category": "daily",
        "phonotactic_validity_score": 0.95,
        "ai_triage_status": "approved_injected",
        "triage_notes": "Deccan inchoative aspectual marker -likattivi and attention-focal nodri validated.",
    },
    {
        "contributor_name": "Ponnamma Muthappa",
        "district_name": "Kodagu",
        "latitude": 12.4244,
        "longitude": 75.7382,
        "nearest_region_code": "arebhashe_kodagu",
        "local_phrase_kannada": "ಕೂಳು ತಿಂದ್ದಿರಾ?",
        "local_phrase_roman": "Koolu tindira?",
        "standard_meaning_english": "Did you partake of meals / rice?",
        "category": "food",
        "phonotactic_validity_score": 0.94,
        "ai_triage_status": "approved_injected",
        "triage_notes": "Arebhashe/Kodava ancestral dietary lexeme koolu and interrogative verbal inflection validated.",
    },
]


async def purge_spam_submissions(session: AsyncSession) -> int:
    """Purge test spam and invalid entries from community submissions ledger."""
    stmt = delete(CommunitySubmission).where(
        or_(
            CommunitySubmission.local_phrase_roman.ilike("%spam-casino%"),
            CommunitySubmission.local_phrase_roman.ilike("%1111111%"),
            CommunitySubmission.local_phrase_kannada.ilike("%spam-casino%"),
            CommunitySubmission.local_phrase_kannada.ilike("%1111111%"),
        )
    )
    result = await session.execute(stmt)
    await session.commit()
    purged_count = result.rowcount or 0
    if purged_count > 0:
        logger.info("Purged %d test spam submissions from database.", purged_count)
    return purged_count


async def seed_community_submissions(session: AsyncSession) -> int:
    """Seed authentic, approved community dialect field records if not already present."""
    seeded = 0
    for item in AUTHENTIC_COMMUNITY_SUBMISSIONS:
        result = await session.execute(
            select(CommunitySubmission).where(
                CommunitySubmission.district_name == item["district_name"],
                CommunitySubmission.local_phrase_roman == item["local_phrase_roman"],
            )
        )
        existing = result.scalars().first()
        if not existing:
            sub = CommunitySubmission(**item)
            session.add(sub)
            seeded += 1
    if seeded > 0:
        await session.commit()
        logger.info("Seeded %d authentic community dialect submissions.", seeded)
    return seeded


async def seed_database(session: AsyncSession) -> Dict[str, int]:
    """
    Idempotently seed the 5 core DialectRegions and 14 authentic LexicalEntries
    with dialect variants across all regions.
    """
    # 1. Seed Dialect Regions
    region_id_map: Dict[str, int] = {}
    regions_upserted = 0

    for reg_data in REGIONS_DATA:
        result = await session.execute(
            select(DialectRegion).where(DialectRegion.code == reg_data["code"])
        )
        existing_reg = result.scalar_one_or_none()

        if existing_reg:
            existing_reg.name = reg_data["name"]
            existing_reg.kannada_name = reg_data["kannada_name"]
            existing_reg.center_lat = reg_data["center_lat"]
            existing_reg.center_lng = reg_data["center_lng"]
            existing_reg.border_influences = reg_data["border_influences"]
            existing_reg.prosody_profile = reg_data["prosody_profile"]
            existing_reg.cultural_notes = reg_data["cultural_notes"]
            region_id = existing_reg.id
        else:
            new_reg = DialectRegion(**reg_data)
            session.add(new_reg)
            await session.flush()
            region_id = new_reg.id
            regions_upserted += 1

        region_id_map[reg_data["code"]] = region_id

    # 2. Seed Lexical Entries and Variants
    lexicon_upserted = 0
    variants_upserted = 0

    for entry_data in LEXICON_DATA:
        result = await session.execute(
            select(LexicalEntry).where(
                LexicalEntry.standard_roman == entry_data["standard_roman"]
            )
        )
        existing_entry = result.scalar_one_or_none()

        if existing_entry:
            existing_entry.standard_kannada = entry_data["standard_kannada"]
            existing_entry.english_meaning = entry_data["english_meaning"]
            existing_entry.category = entry_data["category"]
            existing_entry.grammatical_pos = entry_data["grammatical_pos"]
            entry_id = existing_entry.id
        else:
            new_entry = LexicalEntry(
                standard_kannada=entry_data["standard_kannada"],
                standard_roman=entry_data["standard_roman"],
                english_meaning=entry_data["english_meaning"],
                category=entry_data["category"],
                grammatical_pos=entry_data["grammatical_pos"],
            )
            session.add(new_entry)
            await session.flush()
            entry_id = new_entry.id
            lexicon_upserted += 1

        # Seed Variants for this Lexical Entry
        for reg_code, var_data in entry_data["variants"].items():
            reg_id = region_id_map.get(reg_code)
            if not reg_id:
                continue

            var_result = await session.execute(
                select(DialectVariant).where(
                    DialectVariant.lexical_entry_id == entry_id,
                    DialectVariant.region_id == reg_id,
                )
            )
            existing_var = var_result.scalar_one_or_none()

            if existing_var:
                existing_var.local_script = var_data["local_script"]
                existing_var.local_phonetic = var_data["local_phonetic"]
                existing_var.ipa_pronunciation = var_data["ipa_pronunciation"]
                existing_var.morphological_rule = var_data.get("morphological_rule")
                existing_var.example_sentence_local = var_data.get("example_sentence_local")
                existing_var.example_sentence_standard = var_data.get("example_sentence_standard")
                existing_var.cultural_origin_note = var_data.get("cultural_origin_note")
                existing_var.confidence_score = var_data.get("confidence_score", 1.0)
            else:
                new_var = DialectVariant(
                    lexical_entry_id=entry_id,
                    region_id=reg_id,
                    local_script=var_data["local_script"],
                    local_phonetic=var_data["local_phonetic"],
                    ipa_pronunciation=var_data["ipa_pronunciation"],
                    morphological_rule=var_data.get("morphological_rule"),
                    example_sentence_local=var_data.get("example_sentence_local"),
                    example_sentence_standard=var_data.get("example_sentence_standard"),
                    cultural_origin_note=var_data.get("cultural_origin_note"),
                    confidence_score=var_data.get("confidence_score", 1.0),
                )
                session.add(new_var)
                variants_upserted += 1

    await session.commit()

    # 3. Purge spam and seed authentic community submissions
    await purge_spam_submissions(session)
    await seed_community_submissions(session)

    # Query total counts
    total_regions = len(
        (await session.execute(select(DialectRegion.id))).all()
    )
    total_lexicon = len(
        (await session.execute(select(LexicalEntry.id))).all()
    )
    total_variants = len(
        (await session.execute(select(DialectVariant.id))).all()
    )

    summary = {
        "regions_total": total_regions,
        "lexicon_total": total_lexicon,
        "variants_total": total_variants,
        "new_regions": regions_upserted,
        "new_lexicon": lexicon_upserted,
        "new_variants": variants_upserted,
    }
    logger.info("Database seeding completed successfully: %s", summary)
    return summary


async def main() -> None:
    """Initialize DB tables and run seed routine."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        summary = await seed_database(session)
        print("=" * 60)
        print("NAMMA KANNADA SEED CORPUS SUMMARY")
        print("=" * 60)
        print(f"Dialect Regions: {summary['regions_total']}")
        print(f"Lexical Entries: {summary['lexicon_total']}")
        print(f"Dialect Variants: {summary['variants_total']}")
        print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())

