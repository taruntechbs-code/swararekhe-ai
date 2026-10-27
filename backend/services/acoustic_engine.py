import os
import math
import logging
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
import scipy.signal
import soundfile as sf
import librosa

from backend.schemas import (
    AcousticAnalyzeResponse,
    AcousticProfileResponse,
    CadenceMetrics,
)

logger = logging.getLogger("acoustic_engine")

AUDIO_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "audio_samples")

REGIONS_ACOUSTIC_CONFIG = {
    "hubballi_dharwad": {
        "name": "Uttara Karnataka / Dharwad-Belagavi",
        "filename": "hubballi_dharwad.wav",
        "base_f0": 155.0,
        "f0_trajectory_func": lambda t, dur: 150.0 + 15.0 * np.sin(2 * np.pi * 2.0 * t) + 70.0 * np.maximum(0.0, (t / dur - 0.70) / 0.30) ** 2,
        "duration": 2.2,
        "syllable_rate": 4.5,
        "cadence_type": "staccato_rising_terminal",
        "description": "Brisk staccato rhythm with sharp terminal pitch rise on honorific suffixes (-ri/-avri).",
    },
    "kundapura_mangaluru": {
        "name": "Karavali / Coastal Karnataka",
        "filename": "kundapura_mangaluru.wav",
        "base_f0": 178.0,
        "f0_trajectory_func": lambda t, dur: 175.0 + 30.0 * np.sin(2 * np.pi * 3.5 * t) + 10.0 * np.cos(2 * np.pi * 7.0 * t),
        "duration": 2.0,
        "syllable_rate": 5.8,
        "cadence_type": "rapid_cascading_sing_song",
        "description": "Rapid cascading flow with melodic, sing-song undulating pitch contours and high syllable density.",
    },
    "kalaburagi_bidar": {
        "name": "Kalyana Karnataka / North-East",
        "filename": "kalaburagi_bidar.wav",
        "base_f0": 138.0,
        "f0_trajectory_func": lambda t, dur: 142.0 + 10.0 * np.sin(2 * np.pi * 1.5 * t) - 35.0 * np.maximum(0.0, (t / dur - 0.75) / 0.25),
        "duration": 2.5,
        "syllable_rate": 3.3,
        "cadence_type": "deliberate_drawl_falling_terminal",
        "description": "Grounded lower fundamental frequency with deliberate syllable timing and falling terminal drawl on 'nodri'.",
    },
    "arebhashe_kodagu": {
        "name": "Malnad / Arebhashe & Kodagu",
        "filename": "arebhashe_kodagu.wav",
        "base_f0": 182.0,
        "f0_trajectory_func": lambda t, dur: 180.0 + 25.0 * np.sin(2 * np.pi * 2.8 * t) * (1.0 - 0.5 * (t / dur)),
        "duration": 1.9,
        "syllable_rate": 4.2,
        "cadence_type": "bouncing_accent_clipped",
        "description": "Lively undulating rhythm with bouncing mid-high pitch accents and clipped terminal syllable drops.",
    },
    "bengaluru_mysuru": {
        "name": "Old Mysuru / Southern Karnataka",
        "filename": "bengaluru_mysuru.wav",
        "base_f0": 168.0,
        "f0_trajectory_func": lambda t, dur: 168.0 + 12.0 * np.sin(2 * np.pi * 1.8 * t) - 10.0 * (t / dur),
        "duration": 2.1,
        "syllable_rate": 3.8,
        "cadence_type": "measured_penultimate_stress",
        "description": "Standard measured tempo with balanced pitch variance and prominent penultimate syllable stress.",
    },
}


class AcousticDialectEngine:
    """
    DSP Audio Analysis & Cadence Comparison Engine.
    Powered by Librosa and SciPy signal processing.
    """

    def __init__(self, sample_rate: int = 22050) -> None:
        self.sample_rate: int = sample_rate
        self.profiles_cache: Dict[str, AcousticProfileResponse] = {}
        self.raw_curves_cache: Dict[str, Tuple[List[float], List[float], CadenceMetrics]] = {}

    def ensure_synthetic_samples(self) -> None:
        """
        Creates synthetic reference WAV audio samples for all 5 dialect regions
        if they do not already exist, and pre-extracts their DSP acoustic profiles.
        """
        os.makedirs(AUDIO_DIR, exist_ok=True)

        for reg_code, cfg in REGIONS_ACOUSTIC_CONFIG.items():
            file_path = os.path.join(AUDIO_DIR, cfg["filename"])
            if not os.path.exists(file_path):
                self._generate_synthetic_wav(file_path, cfg)
                logger.info("Generated synthetic audio sample: %s", file_path)

            # Pre-extract and cache profile
            if reg_code not in self.profiles_cache:
                self._cache_reference_profile(reg_code, file_path, cfg)

    def _generate_synthetic_wav(self, file_path: str, cfg: Dict[str, Any]) -> None:
        """
        Synthesizes a multi-harmonic audio signal modulated by regional F0 trajectory
        and syllabic amplitude envelope.
        """
        dur = cfg["duration"]
        sr = self.sample_rate
        t = np.linspace(0.0, dur, int(sr * dur), endpoint=False)

        # 1. Fundamental frequency trajectory F0(t)
        f0_t = cfg["f0_trajectory_func"](t, dur)
        f0_t = np.clip(f0_t, 80.0, 400.0)

        # 2. Phase accumulation
        phase = 2.0 * np.pi * np.cumsum(f0_t) / sr

        # 3. Harmonic speech-like synthesizer (Fundamental + 3 Formant Harmonics)
        signal = (
            0.50 * np.sin(phase)
            + 0.25 * np.sin(2.0 * phase)
            + 0.15 * np.sin(3.0 * phase)
            + 0.10 * np.sin(4.0 * phase)
        )

        # 4. Syllabic pulse modulation (mimicking phoneme bursts)
        syll_rate = cfg["syllable_rate"]
        syll_envelope = 0.35 + 0.65 * (np.sin(2.0 * np.pi * syll_rate * t) ** 2)

        # Global fade-in / fade-out window (Tukey / Hann)
        tukey_win = scipy.signal.windows.tukey(len(t), alpha=0.15)
        audio = signal * syll_envelope * tukey_win

        # Normalize to -1.0 dB
        max_val = np.max(np.abs(audio))
        if max_val > 0.0:
            audio = (audio / max_val) * 0.89

        sf.write(file_path, audio.astype(np.float32), sr, subtype="PCM_16")

    def _cache_reference_profile(self, reg_code: str, file_path: str, cfg: Dict[str, Any]) -> None:
        """Extracts and stores benchmark metrics for reference region audio."""
        f0_curve, energy_env, metrics = self.analyze_audio_buffer(file_path)
        self.raw_curves_cache[reg_code] = (f0_curve, energy_env, metrics)

        self.profiles_cache[reg_code] = AcousticProfileResponse(
            region_code=reg_code,
            region_name=cfg["name"],
            sample_audio_filename=cfg["filename"],
            cadence_metrics=metrics,
            f0_pitch_curve=f0_curve,
            energy_envelope=energy_env,
            prosody_description=cfg["description"],
        )

    def analyze_audio_buffer(
        self,
        audio_input: Union[str, np.ndarray, bytes],
        sample_rate: Optional[int] = None,
    ) -> Tuple[List[float], List[float], CadenceMetrics]:
        """
        Extracts Fundamental Frequency (F0) pitch contour, RMS energy envelope,
        and cadence metrics using Librosa.
        """
        sr = sample_rate or self.sample_rate

        if isinstance(audio_input, str):
            y, sr = librosa.load(audio_input, sr=sr)
        elif isinstance(audio_input, bytes):
            import io
            bio = io.BytesIO(audio_input)
            y, sr = sf.read(bio)
            if y.ndim > 1:
                y = np.mean(y, axis=1)
            if sr != self.sample_rate:
                y = librosa.resample(y, orig_sr=sr, target_sr=self.sample_rate)
                sr = self.sample_rate
        else:
            y = np.asarray(audio_input, dtype=np.float32)

        if len(y) == 0:
            y = np.zeros(sr, dtype=np.float32)

        duration = max(0.5, len(y) / sr)

        # 1. Extract Fundamental Frequency F0 using Librosa YIN
        hop_length = 512
        f0 = librosa.yin(
            y,
            fmin=float(librosa.note_to_hz("C2")),  # ~65 Hz
            fmax=float(librosa.note_to_hz("C7")),  # ~500 Hz
            sr=sr,
            hop_length=hop_length,
        )

        # Clean NaN or unvoiced frames
        valid_mask = ~np.isnan(f0) & (f0 > 50.0) & (f0 < 450.0)
        if np.any(valid_mask):
            f0_valid = f0[valid_mask]
            # Smooth F0 contour with a moving median
            if len(f0) >= 5:
                f0_clean = scipy.signal.medfilt(np.where(valid_mask, f0, np.nanmean(f0_valid)), kernel_size=5)
            else:
                f0_clean = np.where(valid_mask, f0, np.nanmean(f0_valid))
        else:
            f0_clean = np.full_like(f0, 160.0)
            f0_valid = f0_clean

        # 2. Extract RMS Energy Envelope
        rms = librosa.feature.rms(y=y, hop_length=hop_length)[0]
        if np.max(rms) > 0.0:
            rms_norm = rms / np.max(rms)
        else:
            rms_norm = rms

        # 3. Syllable Onset Rate
        onsets = librosa.onset.onset_detect(y=y, sr=sr, hop_length=hop_length)
        syllable_rate = float(len(onsets) / duration)

        # 4. Cadence Metrics
        mean_pitch = float(np.mean(f0_valid))
        std_pitch = float(np.std(f0_valid))
        pitch_range = float(np.ptp(f0_valid))

        # Terminal slope (linear regression on final 20% of F0)
        n_term = max(4, int(len(f0_clean) * 0.20))
        term_slice = f0_clean[-n_term:]
        x_axis = np.arange(len(term_slice))
        slope = float(np.polyfit(x_axis, term_slice, 1)[0]) if len(term_slice) > 1 else 0.0

        # Cadence rhythm classification
        if slope > 3.0:
            cadence_tag = "staccato_rising_terminal"
        elif syllable_rate > 5.0:
            cadence_tag = "rapid_cascading_sing_song"
        elif mean_pitch < 145.0 or slope < -2.0:
            cadence_tag = "deliberate_drawl_falling_terminal"
        elif std_pitch > 25.0:
            cadence_tag = "bouncing_accent_clipped"
        else:
            cadence_tag = "measured_penultimate_stress"

        metrics = CadenceMetrics(
            pitch_mean_hz=round(mean_pitch, 2),
            pitch_std_dev=round(std_pitch, 2),
            pitch_range_hz=round(pitch_range, 2),
            terminal_inflection_slope=round(slope, 3),
            estimated_syllable_rate_hz=round(syllable_rate, 2),
            cadence_rhythm_type=cadence_tag,
        )

        # Downsample curves to 50 points for efficient frontend charting
        n_target = 50
        indices = np.linspace(0, len(f0_clean) - 1, n_target, dtype=int)
        f0_curve_downsampled = [round(float(f0_clean[idx]), 2) for idx in indices]

        rms_indices = np.linspace(0, len(rms_norm) - 1, n_target, dtype=int)
        energy_downsampled = [round(float(rms_norm[idx]), 3) for idx in indices]

        return f0_curve_downsampled, energy_downsampled, metrics

    def get_region_profile(self, region_code: str) -> Optional[AcousticProfileResponse]:
        """Returns the pre-computed reference profile for a dialect region."""
        self.ensure_synthetic_samples()
        return self.profiles_cache.get(region_code)

    def compare_cadence(
        self,
        user_metrics: CadenceMetrics,
        ref_metrics: CadenceMetrics,
        user_f0: List[float],
        ref_f0: List[float],
        target_region_code: str,
    ) -> Tuple[float, List[str]]:
        """
        Compares submitted acoustic parameters with target region benchmark.
        Returns match score (0-100) and actionable prosody coaching feedback.
        """
        # Distance metrics (using Gaussian decay curves)
        s_slope = math.exp(-abs(user_metrics.terminal_inflection_slope - ref_metrics.terminal_inflection_slope) / 12.0)
        s_rate = math.exp(-abs(user_metrics.estimated_syllable_rate_hz - ref_metrics.estimated_syllable_rate_hz) / 2.2)
        s_range = math.exp(-abs(user_metrics.pitch_range_hz - ref_metrics.pitch_range_hz) / 55.0)
        s_mean = math.exp(-abs(user_metrics.pitch_mean_hz - ref_metrics.pitch_mean_hz) / 45.0)

        # Weighted composite score
        score = 100.0 * (
            0.35 * s_slope
            + 0.25 * s_rate
            + 0.20 * s_range
            + 0.20 * s_mean
        )
        score = max(15.0, min(99.0, round(score, 1)))

        # Actionable linguistic coaching feedback
        feedback: List[str] = []

        # 1. Slope / Inflection feedback
        slope_diff = user_metrics.terminal_inflection_slope - ref_metrics.terminal_inflection_slope
        if target_region_code == "hubballi_dharwad":
            if user_metrics.terminal_inflection_slope < 2.0:
                feedback.append(
                    f"Terminal Inflection: Your terminal pitch slope is flat ({user_metrics.terminal_inflection_slope:+.1f} Hz/frame). "
                    f"Hubballi-Dharwad questions demand a sharp rising inflection (+{ref_metrics.terminal_inflection_slope:+.1f} Hz/frame) "
                    "on the final honorific syllable (-ri / -avri)."
                )
            else:
                feedback.append("Excellent rising terminal pitch inflection characteristic of Uttara Karnataka!")

        elif target_region_code == "kalaburagi_bidar":
            if user_metrics.terminal_inflection_slope > 1.0:
                feedback.append(
                    f"Terminal Drawl: In Kalyana Karnataka, declarative phrases conclude with a falling drawl "
                    f"({ref_metrics.terminal_inflection_slope:+.1f} Hz/frame on 'nodri') rather than a rising terminal."
                )
            else:
                feedback.append("Accurate deliberate falling drawl matching Deccan regional cadence.")

        # 2. Syllable Rate feedback
        rate_diff = user_metrics.estimated_syllable_rate_hz - ref_metrics.estimated_syllable_rate_hz
        if abs(rate_diff) > 1.2:
            if rate_diff < 0:
                feedback.append(
                    f"Speech Cadence: Your tempo is {user_metrics.estimated_syllable_rate_hz:.1f} syllables/sec. "
                    f"Target dialect benchmark flows faster at ~{ref_metrics.estimated_syllable_rate_hz:.1f} syllables/sec."
                )
            else:
                feedback.append(
                    f"Tempo Adjustment: Slow down slightly ({user_metrics.estimated_syllable_rate_hz:.1f} vs {ref_metrics.estimated_syllable_rate_hz:.1f} syllables/sec) "
                    "to allow vowel length distinctions to enunciate clearly."
                )

        # 3. Pitch Dynamics
        if target_region_code == "kundapura_mangaluru" and user_metrics.pitch_std_dev < 18.0:
            feedback.append(
                "Melodic Range: Karavali Coastal Kannada features musical sing-song pitch undulations (Yakshagana style); "
                "try broadening your vocal inflection variance."
            )

        if not feedback:
            feedback.append("Superb prosodic match! Your pitch contour, syllable timing, and inflection align closely with authentic regional speakers.")

        return score, feedback


# Global singleton instance
acoustic_engine_service = AcousticDialectEngine()
acoustic_engine_service.ensure_synthetic_samples()
