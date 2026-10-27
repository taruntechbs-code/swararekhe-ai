import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator, List, Optional

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.config import get_settings
from backend.database import AsyncSessionLocal, Base, engine, get_db
from backend.models import DialectRegion, DialectVariant, LexicalEntry
from backend.routers.acoustic import router as acoustic_router
from backend.routers.graph import router as graph_router
from backend.routers.morph import router as morph_router
from backend.schemas import (
    DialectRegionResponse,
    HealthResponse,
    LexicalEntryDetailResponse,
)
from backend.services.acoustic_engine import acoustic_engine_service, AUDIO_DIR
from backend.services.knowledge_graph import knowledge_graph_service

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan context manager to initialize database schema, graph engine, and acoustic samples on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Pre-build knowledge graph
    async with AsyncSessionLocal() as session:
        await knowledge_graph_service.build_graph(session)

    # Ensure synthetic audio samples and DSP acoustic profiles are cached
    acoustic_engine_service.ensure_synthetic_samples()

    yield
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    description="Spatio-Acoustic Dialect & Cultural Graph Engine for the Kannada language.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(morph_router, prefix=settings.API_V1_PREFIX)
app.include_router(graph_router, prefix=settings.API_V1_PREFIX)
app.include_router(acoustic_router, prefix=settings.API_V1_PREFIX)

# Static audio samples serving
os.makedirs(AUDIO_DIR, exist_ok=True)
app.mount("/static/audio_samples", StaticFiles(directory=AUDIO_DIR), name="audio_samples")


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["Diagnostics"],
    summary="Health check & database connectivity diagnostic",
)
async def health_check(db: AsyncSession = Depends(get_db)) -> HealthResponse:
    """Verifies that the API service is operational and the SQLite/Async database is connected."""
    try:
        reg_count = await db.scalar(select(func.count(DialectRegion.id))) or 0
        lex_count = await db.scalar(select(func.count(LexicalEntry.id))) or 0
        var_count = await db.scalar(select(func.count(DialectVariant.id))) or 0
        db_status = "connected"
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection error: {str(exc)}",
        )

    return HealthResponse(
        status="ok",
        database=db_status,
        app_name=settings.APP_NAME,
        region_count=reg_count,
        lexicon_count=lex_count,
        variant_count=var_count,
    )


@app.get(
    f"{settings.API_V1_PREFIX}/regions",
    response_model=List[DialectRegionResponse],
    tags=["Dialect Regions"],
    summary="Retrieve all Kannada dialect regions with prosody profiles",
)
async def get_dialect_regions(
    db: AsyncSession = Depends(get_db),
) -> List[DialectRegionResponse]:
    """Returns all 5 core Kannada dialect regions along with geo-coordinates, border influences, and prosody profiles."""
    query = select(DialectRegion).order_by(DialectRegion.id)
    result = await db.execute(query)
    regions = result.scalars().all()
    return list(regions)


@app.get(
    f"{settings.API_V1_PREFIX}/lexicon",
    response_model=List[LexicalEntryDetailResponse],
    tags=["Linguistic Corpus"],
    summary="Retrieve lexical entries with nested regional variants",
)
async def get_lexicon(
    category: Optional[str] = Query(
        None,
        description="Filter by semantic domain (greeting, food, question, emotion, daily, agrarian)",
    ),
    region_code: Optional[str] = Query(
        None,
        description="Filter variants to a specific dialect region code (e.g., hubballi_dharwad, karavali, etc.)",
    ),
    db: AsyncSession = Depends(get_db),
) -> List[LexicalEntryDetailResponse]:
    """
    Returns lexical concepts mapped across Karnataka's dialect landscape.
    Allows optional filtering by semantic category and specific region code.
    """
    query = (
        select(LexicalEntry)
        .options(
            selectinload(LexicalEntry.variants).selectinload(DialectVariant.region)
        )
        .order_by(LexicalEntry.id)
    )

    if category:
        query = query.where(LexicalEntry.category == category.strip().lower())

    result = await db.execute(query)
    entries = result.scalars().all()

    # If region_code filter is applied, filter variants for each entry
    if region_code:
        filtered_entries: List[LexicalEntry] = []
        target_code = region_code.strip().lower()

        for entry in entries:
            # Match variants for this specific region code
            matching_variants = [
                v for v in entry.variants if v.region and v.region.code.lower() == target_code
            ]
            if matching_variants:
                # Create a shallow copy with filtered variants to preserve response model format
                filtered_entries.append(
                    LexicalEntry(
                        id=entry.id,
                        standard_kannada=entry.standard_kannada,
                        standard_roman=entry.standard_roman,
                        english_meaning=entry.english_meaning,
                        category=entry.category,
                        grammatical_pos=entry.grammatical_pos,
                        variants=matching_variants,
                    )
                )
        return filtered_entries

    return list(entries)

