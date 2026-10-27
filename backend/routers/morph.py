from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.schemas import (
    MorphRulesResponse,
    MorphTranslateRequest,
    MorphTranslateResponse,
)
from backend.services.dialect_morpher import (
    REGIONAL_RULES,
    DialectMorpherService,
)

router = APIRouter(prefix="/morph", tags=["Neuro-Symbolic Dialect Morphing"])

VALID_REGION_CODES = set(REGIONAL_RULES.keys())


@router.post(
    "/translate",
    response_model=MorphTranslateResponse,
    status_code=status.HTTP_200_OK,
    summary="Morph and phonetically transduce input text into regional Karnataka dialects",
)
async def morph_translate(
    request: MorphTranslateRequest,
    db: AsyncSession = Depends(get_db),
) -> MorphTranslateResponse:
    """
    Accepts text in English or Standard/Colloquial Kannada and morphs it
    into target regional dialects (or all 5 regions if target_region_code == 'all').

    Utilizes:
    - Corpus Semantic & Fuzzy Matcher for exact field records
    - Deterministic Suffix & Phonological Transducer for composite/unseen phrases
    - Syllable Stress & IPA synthesis
    - Optional Hybrid Gemini LLM grounding
    """
    target = request.target_region_code.strip().lower()
    if target != "all" and target not in VALID_REGION_CODES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Invalid target_region_code '{request.target_region_code}'. "
                f"Valid regions are: 'all' or one of {sorted(list(VALID_REGION_CODES))}"
            ),
        )

    matched_concept, results = await DialectMorpherService.morph_text(
        session=db,
        text=request.text,
        source_lang=request.source_lang,
        target_region_code=target,
    )

    return MorphTranslateResponse(
        input_text=request.text,
        source_lang=request.source_lang,
        matched_seed_concept=matched_concept,
        results=results,
    )


@router.get(
    "/rules",
    response_model=MorphRulesResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve the comprehensive phonological and suffix transformation rulebook",
)
async def get_morphology_rules() -> MorphRulesResponse:
    """
    Exposes the deterministic phonological shift, suffix transduction,
    and lexical mutation rulebook for all 5 dialect regions.
    """
    return DialectMorpherService.get_documented_rules()
