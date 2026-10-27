import os
from typing import Optional
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from backend.schemas import (
    AcousticAnalyzeResponse,
    AcousticProfileResponse,
)
from backend.services.acoustic_engine import (
    AUDIO_DIR,
    REGIONS_ACOUSTIC_CONFIG,
    acoustic_engine_service,
)

router = APIRouter(prefix="/acoustic", tags=["Acoustic Prosody & Cadence DSP"])


@router.get(
    "/profile/{region_code}",
    response_model=AcousticProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve reference acoustic pitch contour, energy envelope, and cadence metrics",
)
async def get_region_acoustic_profile(region_code: str) -> AcousticProfileResponse:
    """
    Returns reference acoustic parameters for a given dialect region,
    including F0 pitch contour, RMS energy envelope, syllable timing, and prosody traits.
    """
    code = region_code.strip().lower()
    profile = acoustic_engine_service.get_region_profile(code)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Acoustic profile for '{region_code}' not found. "
                f"Valid regions are: {list(REGIONS_ACOUSTIC_CONFIG.keys())}"
            ),
        )
    return profile


@router.post(
    "/analyze",
    response_model=AcousticAnalyzeResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze submitted audio against a regional prosody benchmark using Librosa DSP",
)
async def analyze_audio_cadence(
    target_region_code: str = Form(..., description="Target dialect region benchmark code"),
    sample_code: Optional[str] = Form(None, description="Optional code of pre-generated sample to test with"),
    audio_file: Optional[UploadFile] = File(None, description="Uploaded audio file (.wav, .mp3, etc.)"),
) -> AcousticAnalyzeResponse:
    """
    Processes voice audio using Librosa DSP feature extraction:
    - Extracts F0 pitch contour via Librosa YIN
    - Measures syllable onset rate and RMS energy
    - Quantifies terminal inflection slope
    - Computes a match score (0-100) and actionable prosody coaching tips
    """
    target = target_region_code.strip().lower()
    ref_profile = acoustic_engine_service.get_region_profile(target)
    if not ref_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target benchmark region '{target_region_code}' not found.",
        )

    # Resolve audio source
    audio_bytes: Optional[bytes] = None

    if audio_file:
        audio_bytes = await audio_file.read()
    elif sample_code:
        clean_sample = sample_code.strip().lower()
        cfg = REGIONS_ACOUSTIC_CONFIG.get(clean_sample)
        if not cfg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Sample code '{sample_code}' not found.",
            )
        sample_path = os.path.join(AUDIO_DIR, cfg["filename"])
        if not os.path.exists(sample_path):
            acoustic_engine_service.ensure_synthetic_samples()
        with open(sample_path, "rb") as f:
            audio_bytes = f.read()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either an 'audio_file' upload or a 'sample_code' must be provided for acoustic analysis.",
        )

    # Perform DSP feature extraction on user audio
    try:
        user_f0, user_energy, user_metrics = acoustic_engine_service.analyze_audio_buffer(audio_bytes)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Audio DSP feature extraction failed: {str(exc)}",
        )

    # Compare against target reference
    score, coaching = acoustic_engine_service.compare_cadence(
        user_metrics=user_metrics,
        ref_metrics=ref_profile.cadence_metrics,
        user_f0=user_f0,
        ref_f0=ref_profile.f0_pitch_curve,
        target_region_code=target,
    )

    return AcousticAnalyzeResponse(
        target_region_code=target,
        matched_region_name=ref_profile.region_name,
        cadence_match_score=score,
        user_cadence_metrics=user_metrics,
        reference_cadence_metrics=ref_profile.cadence_metrics,
        pitch_contour_comparison={
            "user_f0": user_f0,
            "reference_f0": ref_profile.f0_pitch_curve,
            "user_energy": user_energy,
            "reference_energy": ref_profile.energy_envelope,
        },
        coaching_feedback=coaching,
    )

