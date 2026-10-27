from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models import (
    CommunitySubmission,
    DialectRegion,
    DialectVariant,
    LexicalEntry,
)
from backend.schemas import (
    CommunitySubmissionItemResponse,
    CommunitySubmissionRequest,
    CommunitySubmissionResponse,
    GeoJSONFeatureCollection,
    IsoglossLocateResponse,
    PlatformStatsResponse,
)
from backend.services.acoustic_engine import acoustic_engine_service
from backend.services.crowdsource_validator import CrowdsourceValidator
from backend.services.geospatial_engine import GeospatialIsoglossEngine
from backend.services.knowledge_graph import knowledge_graph_service

router = APIRouter(prefix="/explorer", tags=["Geospatial Isogloss & Living Explorer"])


@router.get(
    "/locate",
    response_model=IsoglossLocateResponse,
    status_code=status.HTTP_200_OK,
    summary="Compute Inverse-Distance Weighted (IDW) isogloss blend weights and transition morphing",
)
async def locate_isogloss(
    lat: float = Query(..., ge=11.0, le=19.0, description="Latitude coordinate in Karnataka"),
    lng: float = Query(..., ge=74.0, le=79.0, description="Longitude coordinate in Karnataka"),
    phrase: Optional[str] = Query(None, description="Optional phrase to morph contextually for this location"),
) -> IsoglossLocateResponse:
    """
    Given any latitude/longitude coordinate across Karnataka:
    - Calculates Inverse-Distance Weighting (IDW) shares against all 5 dialect epicenters
    - Classifies location into Core Heartland, Bi-Dialectal Transition Belt, or Convergence Zone
    - Interpolates acoustic fundamental pitch (F0) baseline
    - Synthesizes hybrid dialect morphing and transition code-switching notes
    """
    return GeospatialIsoglossEngine.locate_isogloss(lat=lat, lng=lng, phrase=phrase)


@router.get(
    "/isogloss-map",
    response_model=GeoJSONFeatureCollection,
    status_code=status.HTTP_200_OK,
    summary="Export standard GeoJSON FeatureCollection with dialect territories, hubs, and corridors",
)
async def get_isogloss_map() -> GeoJSONFeatureCollection:
    """
    Returns standard GeoJSON FeatureCollection containing:
    - Point features for dialect epicenters
    - Polygon features for territorial boundaries
    - LineString features for isogloss transition corridors
    """
    return GeospatialIsoglossEngine.get_isogloss_geojson()


@router.post(
    "/contribute",
    response_model=CommunitySubmissionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a regional phrase to the crowdsourced living dictionary with automated phonotactic triage",
)
async def contribute_dialect_phrase(
    submission_req: CommunitySubmissionRequest,
    db: AsyncSession = Depends(get_db),
) -> CommunitySubmissionResponse:
    """
    Accepts crowdsourced regional phrases, evaluates phonotactic validity,
    assigns triage status ('approved_injected' | 'pending_review' | 'rejected_spam'),
    and immediately injects approved entries into the live NetworkX Knowledge Graph.
    """
    return await CrowdsourceValidator.process_and_persist(db, submission_req)


@router.get(
    "/submissions",
    response_model=List[CommunitySubmissionItemResponse],
    status_code=status.HTTP_200_OK,
    summary="List recent crowdsourced community living dictionary submissions",
)
async def list_community_submissions(
    limit: int = Query(50, ge=1, le=100),
    status_filter: Optional[str] = Query(None, description="Filter by triage status"),
    db: AsyncSession = Depends(get_db),
) -> List[CommunitySubmissionItemResponse]:
    """Retrieves chronological submissions to the living dictionary."""
    query = select(CommunitySubmission).order_by(CommunitySubmission.id.desc()).limit(limit)
    if status_filter:
        query = query.where(CommunitySubmission.ai_triage_status == status_filter.strip())

    result = await db.execute(query)
    submissions = result.scalars().all()
    return list(submissions)


@router.get(
    "/stats",
    response_model=PlatformStatsResponse,
    status_code=status.HTTP_200_OK,
    summary="Platform-wide aggregated intelligence statistics",
)
async def get_platform_stats(
    db: AsyncSession = Depends(get_db),
) -> PlatformStatsResponse:
    """
    Aggregates real-time counts across:
    - SQLite database (regions, lexical entries, variants, community submissions)
    - Live NetworkX knowledge graph nodes and edges
    - Librosa acoustic DSP reference profiles
    """
    reg_count = await db.scalar(select(func.count(DialectRegion.id))) or 0
    lex_count = await db.scalar(select(func.count(LexicalEntry.id))) or 0
    var_count = await db.scalar(select(func.count(DialectVariant.id))) or 0
    sub_count = await db.scalar(select(func.count(CommunitySubmission.id))) or 0
    appr_count = await db.scalar(
        select(func.count(CommunitySubmission.id)).where(
            CommunitySubmission.ai_triage_status == "approved_injected"
        )
    ) or 0

    if not knowledge_graph_service.is_built:
        await knowledge_graph_service.build_graph(db)

    acoustic_engine_service.ensure_synthetic_samples()

    return PlatformStatsResponse(
        total_regions=reg_count,
        total_lexical_concepts=lex_count,
        total_dialect_variants=var_count,
        graph_nodes=knowledge_graph_service.graph.number_of_nodes(),
        graph_edges=knowledge_graph_service.graph.number_of_edges(),
        acoustic_profiles_ready=len(acoustic_engine_service.profiles_cache),
        community_submissions_total=sub_count,
        approved_living_entries=appr_count,
    )

