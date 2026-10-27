import re
import logging
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.models import CommunitySubmission
from backend.schemas import (
    CommunitySubmissionRequest,
    CommunitySubmissionResponse,
)
from backend.services.geospatial_engine import REGIONAL_EPICENTERS, haversine_distance_km
from backend.services.knowledge_graph import knowledge_graph_service

logger = logging.getLogger("crowdsource_validator")

# Known Kannada dialect markers & suffixes
REGIONAL_MARKER_PATTERNS = [
    (r"\b(cholo|bhaal|hontir|yaakri|bekri|lagoone|hudagyaa|aytri|aatrenree|avva)\b", "Uttara Karnataka (Dharwad) lexical marker"),
    (r"\b(laayk|yathak|yathake|hoitiddiya|bodu|maani|koosa|vanas|aipini|encha|appe)\b", "Karavali Coastal marker"),
    (r"\b(mast|jaldi|khabar|nodri|likattiri|bora|pora|pori|shetee|baarish|aathu)\b", "Kalyana Karnataka (Deccan) marker"),
    (r"\b(yettak|cholo ulla|koolu|kunyi|begale|hogde|ulli)\b", "Malnad / Arebhashe marker"),
    (r"(ri|avri|paa|pa|enree|tiddira|aytha|aathri|aytri)$", "Regional honorific / aspectual enclitic"),
]

SPAM_PATTERNS = [
    r"https?://",
    r"www\.",
    r"<script",
    r"\.com\b|\.net\b|\.org\b",
    r"(.)\1{5,}",  # Excessive character repetition
    r"^[0-9\W]+$",  # Pure numbers or symbols
]


class CrowdsourceValidator:
    """
    Automated phonotactic and sociolinguistic triage pipeline for crowdsourced dialect phrases.
    Applies Dravidian phonotactic heuristics and injects approved living entries
    directly into the live NetworkX Knowledge Graph.
    """

    @classmethod
    def evaluate_submission(
        cls, req: CommunitySubmissionRequest
    ) -> Tuple[float, str, List[str], str]:
        """
        Calculates phonotactic validity score (0.0 - 1.0) and assigns triage status:
        - 'approved_injected': High validity (>= 0.70), auto-injected into knowledge graph
        - 'pending_review': Moderate validity (0.40 - 0.69), held for editorial review
        - 'rejected_spam': Low validity (< 0.40) or spam pattern detected
        """
        text = req.local_phrase_roman.strip()
        text_lower = text.lower()
        triage_reasons: List[str] = []
        detected_markers: List[str] = []

        # 1. Anti-Spam Check
        for pat in SPAM_PATTERNS:
            if re.search(pat, text_lower):
                return 0.05, "rejected_spam", [], "Spam or invalid character sequence detected."

        score = 0.45

        # 2. Coordinate Boundaries (Karnataka bounding box ~11.5°N - 18.6°N, 74.0°E - 78.6°E)
        if 11.5 <= req.latitude <= 18.6 and 74.0 <= req.longitude <= 78.6:
            score += 0.15
            triage_reasons.append("Coordinates verified inside Karnataka territorial bounds.")
        else:
            score -= 0.10
            triage_reasons.append("Coordinates fall outside primary Karnataka bounds.")

        # 3. Vowel-Consonant Ratio (Dravidian phonotactics typically 0.30 - 0.65)
        letters = [c for c in text_lower if c.isalpha()]
        if letters:
            vowels = [c for c in letters if c in "aeiou"]
            v_ratio = len(vowels) / len(letters)
            if 0.30 <= v_ratio <= 0.65:
                score += 0.15
                triage_reasons.append(f"Dravidian syllable vowel-consonant ratio valid ({v_ratio:.2f}).")
            else:
                score -= 0.10
                triage_reasons.append(f"Atypical vowel ratio ({v_ratio:.2f}).")

        # 4. Dialect Marker Detection
        for pat, desc in REGIONAL_MARKER_PATTERNS:
            if re.search(pat, text_lower):
                detected_markers.append(desc)
                score += 0.20
                triage_reasons.append(f"Recognized authentic marker: {desc}")
                break

        # Meaning length check
        if len(req.standard_meaning_english.strip()) >= 3:
            score += 0.05

        final_score = round(max(0.05, min(0.99, score)), 2)

        if final_score >= 0.70:
            status = "approved_injected"
            notes = "Auto-approved via phonotactic validation. Injected into live knowledge graph. " + " ".join(triage_reasons)
        elif final_score >= 0.40:
            status = "pending_review"
            notes = "Held for dialectologist review. " + " ".join(triage_reasons)
        else:
            status = "rejected_spam"
            notes = "Rejected due to insufficient phonotactic validity score. " + " ".join(triage_reasons)

        return final_score, status, detected_markers, notes

    @classmethod
    def get_nearest_region(cls, lat: float, lng: float) -> str:
        """Finds closest dialect epicenter to given coordinate."""
        nearest_code = "bengaluru_mysuru"
        min_dist = float("inf")
        for code, info in REGIONAL_EPICENTERS.items():
            dist = haversine_distance_km(lat, lng, info["lat"], info["lng"])
            if dist < min_dist:
                min_dist = dist
                nearest_code = code
        return nearest_code

    @classmethod
    async def process_and_persist(
        cls,
        session: AsyncSession,
        req: CommunitySubmissionRequest,
    ) -> CommunitySubmissionResponse:
        """
        Evaluates, persists to database, and dynamically injects approved submissions
        into the live knowledge graph.
        """
        score, status, markers, notes = cls.evaluate_submission(req)
        nearest_reg = cls.get_nearest_region(req.latitude, req.longitude)

        # 1. Persist to SQLite
        submission = CommunitySubmission(
            contributor_name=req.contributor_name,
            district_name=req.district_name,
            latitude=req.latitude,
            longitude=req.longitude,
            nearest_region_code=nearest_reg,
            local_phrase_kannada=req.local_phrase_kannada or req.local_phrase_roman,
            local_phrase_roman=req.local_phrase_roman,
            standard_meaning_english=req.standard_meaning_english,
            category=req.category,
            phonotactic_validity_score=score,
            ai_triage_status=status,
            triage_notes=notes,
        )
        session.add(submission)
        await session.flush()
        await session.commit()

        # 2. Dynamic Injection into Live Knowledge Graph if Approved
        graph_injected = False
        if status == "approved_injected" and knowledge_graph_service.is_built:
            var_node_id = f"variant:living:{submission.id}"
            reg_node_id = f"region:{nearest_reg}"

            knowledge_graph_service.graph.add_node(
                var_node_id,
                id=var_node_id,
                label=f"{submission.local_phrase_roman} (Living Community Entry)",
                kannada_label=submission.local_phrase_kannada,
                node_type="VARIANT",
                metadata={
                    "source": "crowdsourced_living_dictionary",
                    "contributor": submission.contributor_name,
                    "district": submission.district_name,
                    "latitude": submission.latitude,
                    "longitude": submission.longitude,
                    "validity_score": score,
                    "category": submission.category,
                    "meaning": submission.standard_meaning_english,
                },
            )

            # Connect VARIANT --(SPOKEN_IN)--> REGION
            knowledge_graph_service.graph.add_edge(
                var_node_id,
                reg_node_id,
                relation="SPOKEN_IN",
                weight=1.0,
                explanation=f"Living dialect contribution from {submission.district_name} by {submission.contributor_name}",
            )

            graph_injected = True
            logger.info("Injected living variant node %s into live knowledge graph.", var_node_id)

        return CommunitySubmissionResponse(
            submission_id=submission.id,
            ai_triage_status=status,
            phonotactic_validity_score=score,
            nearest_region_code=nearest_reg,
            detected_morphological_markers=markers,
            graph_node_injected=graph_injected,
            triage_notes=notes,
        )

