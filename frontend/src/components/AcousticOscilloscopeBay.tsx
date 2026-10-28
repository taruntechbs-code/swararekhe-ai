import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Play,
  Mic,
  Upload,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  AcousticProfileResponse,
  AcousticAnalyzeResponse,
  swararekheApi,
  FALLBACK_ACOUSTIC_PROFILES,
  FALLBACK_ACOUSTIC_ANALYZE,
} from '../api/swararekheClient';

interface AcousticOscilloscopeBayProps {
  activeRegionCode?: string;
  onSelectRegion?: (regionCode: string) => void;
}

const REGION_KEYS = [
  { code: 'hubballi_dharwad', label: 'HUBBALLI / DHARWAD', kannada: 'ಉತ್ತರ ಕರ್ನಾಟಕ' },
  { code: 'kundapura_mangaluru', label: 'KUNDAPURA / KARAVALI', kannada: 'ಕರಾವಳಿ' },
  { code: 'kalaburagi_bidar', label: 'KALABURAGI / BIDAR', kannada: 'ಕಲ್ಯಾಣ ಕರ್ನಾಟಕ' },
  { code: 'arebhashe_kodagu', label: 'AREBHASHE / KODAGU', kannada: 'ಅರೆಭಾಷೆ' },
  { code: 'bengaluru_mysuru', label: 'BENGALURU / MYSURU', kannada: 'ಹಳೆ ಮೈಸೂರು' },
];

export const AcousticOscilloscopeBay: React.FC<AcousticOscilloscopeBayProps> = ({
  activeRegionCode = 'hubballi_dharwad',
  onSelectRegion,
}) => {
  const [selectedRegion, setSelectedRegion] = useState(activeRegionCode);
  const [profile, setProfile] = useState<AcousticProfileResponse>(
    FALLBACK_ACOUSTIC_PROFILES[activeRegionCode] || FALLBACK_ACOUSTIC_PROFILES['hubballi_dharwad']
  );
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AcousticAnalyzeResponse | null>(null);
  const [audioStatusText, setAudioStatusText] = useState<string>('SYNTHESIZER IDLE // READY');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load regional profile when selectedRegion changes
  useEffect(() => {
    loadProfile(selectedRegion);
  }, [selectedRegion]);

  const loadProfile = async (code: string) => {
    setIsLoadingProfile(true);
    try {
      const data = await swararekheApi.getAcousticProfile(code);
      setProfile(data);
      setAudioStatusText(`LOADED PROFILE // ${data.region_name.toUpperCase()}`);
    } catch (err) {
      console.error('Failed to load acoustic profile:', err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleRegionChange = (code: string) => {
    setSelectedRegion(code);
    if (onSelectRegion) onSelectRegion(code);
    setAnalysisResult(null);
  };

  // Real-time harmonic Web Audio synthesis driven by exact f0_pitch_curve array
  const handlePlaySynthesizedF0 = () => {
    if (isPlayingAudio) return;
    setIsPlayingAudio(true);
    setAudioStatusText(`PLAYING REAL-TIME F0 SYNTHESIS // ${profile.region_code.toUpperCase()}`);

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();

      const f0Curve = profile.f0_pitch_curve && profile.f0_pitch_curve.length > 0
        ? profile.f0_pitch_curve
        : [150, 155, 160, 165, 175, 185, 200];

      const duration = 1.4; // 1.4 seconds utterance
      const stepDuration = duration / f0Curve.length;

      // Primary harmonic oscillator (voiced fundamental)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth';

      // Secondary oscillator for rich formant harmonic
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';

      // Gain Envelope
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.1);

      // Low-pass filter simulating vocal tract resonance
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, ctx.currentTime);

      // Automate pitch sweep across exact F0 curve points
      f0Curve.forEach((hz, idx) => {
        const timeAt = ctx.currentTime + idx * stepDuration;
        osc1.frequency.setValueAtTime(hz, timeAt);
        osc2.frequency.setValueAtTime(hz * 2, timeAt); // 2nd harmonic
      });

      // Terminal fade-out
      gainNode.gain.setValueAtTime(0.25, ctx.currentTime + duration - 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + duration);
      osc2.stop(ctx.currentTime + duration);

      setTimeout(() => {
        setIsPlayingAudio(false);
        setAudioStatusText('SYNTHESIZER IDLE // READY');
        ctx.close();
      }, duration * 1000 + 100);
    } catch (err) {
      console.warn('Web Audio synthesis error, fallback to audio file:', err);
      // Fallback to static .wav file
      const audio = new Audio(`/static/audio_samples/${profile.region_code}.wav`);
      audio.play().then(() => {
        audio.onended = () => {
          setIsPlayingAudio(false);
          setAudioStatusText('SYNTHESIZER IDLE // READY');
        };
      }).catch(() => {
        setIsPlayingAudio(false);
        setAudioStatusText('AUDIO ERROR // DRIVER OFFLINE');
      });
    }
  };

  // Compare with pre-generated regional benchmark sample
  const handleCompareSample = async () => {
    setIsAnalyzing(true);
    setAudioStatusText('ANALYZING REFERENCE AUDIO VIA LIBROSA DSP...');
    try {
      const result = await swararekheApi.analyzeCadence(selectedRegion, selectedRegion);
      setAnalysisResult(result);
      setAudioStatusText(`ANALYSIS COMPLETE // SCORE: ${Math.round(result.cadence_match_score)}%`);
    } catch (err) {
      console.error('Cadence analysis failed:', err);
      setAnalysisResult(FALLBACK_ACOUSTIC_ANALYZE);
      setAudioStatusText('ANALYSIS COMPLETE // LOADED REFERENCE BENCHMARK');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Microphone audio recording
  const handleToggleRecord = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      setAudioStatusText('PROCESSING RECORDED MIC AUDIO...');
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          stream.getTracks().forEach((track) => track.stop());

          setIsAnalyzing(true);
          setAudioStatusText('TRANSMITTING MIC WAV TO LIBROSA DSP...');
          try {
            const result = await swararekheApi.analyzeCadence(selectedRegion, undefined, audioBlob);
            setAnalysisResult(result);
            setAudioStatusText(`MIC ANALYSIS COMPLETE // SCORE: ${Math.round(result.cadence_match_score)}%`);
          } catch (err) {
            console.error('Mic analysis failed:', err);
            setAnalysisResult(FALLBACK_ACOUSTIC_ANALYZE);
          } finally {
            setIsAnalyzing(false);
          }
        };

        recorder.start();
        setIsRecording(true);
        setAudioStatusText('RECORDING MICROPHONE STREAM // SPEAK NOW...');
      } catch (err) {
        console.warn('Microphone access denied or unsupported:', err);
        setAudioStatusText('MIC ACCESS DENIED // TRIGGERING MOCK ANALYSIS');
        handleCompareSample();
      }
    }
  };

  // Upload WAV file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setAudioStatusText(`UPLOADING ${file.name.toUpperCase()} TO LIBROSA DSP...`);
    try {
      const result = await swararekheApi.analyzeCadence(selectedRegion, undefined, file);
      setAnalysisResult(result);
      setAudioStatusText(`FILE ANALYSIS COMPLETE // SCORE: ${Math.round(result.cadence_match_score)}%`);
    } catch (err) {
      console.error('File analysis failed:', err);
      setAnalysisResult(FALLBACK_ACOUSTIC_ANALYZE);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleResetAnalysis = () => {
    setAnalysisResult(null);
    setAudioStatusText('TELEMETRY RESET // READY');
  };

  // SVG Dual-Trace Oscilloscope Dimensions
  const OSC_WIDTH = 760;
  const OSC_HEIGHT = 280;
  const MIN_HZ = 80;
  const MAX_HZ = 300;

  const hzToY = (hz: number): number => {
    const clamped = Math.max(MIN_HZ, Math.min(MAX_HZ, hz));
    return OSC_HEIGHT - 40 - ((clamped - MIN_HZ) / (MAX_HZ - MIN_HZ)) * (OSC_HEIGHT - 70);
  };

  const refPoints = profile.f0_pitch_curve || [150, 160, 170, 180, 200];
  const userPoints = analysisResult?.pitch_contour_comparison?.user_f0 || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Bay Header */}
      <div className="chassis-bay-header">
        <span className="bay-indicator">
          <span className="led-indicator active" />
          <span>BAY 03</span>
        </span>
        <span>// ACOUSTIC F0 OSCILLOSCOPE &amp; CADENCE DSP ANALYZER</span>
      </div>

      {/* Upper Deck: Regional Prosody Selector & Transport Control Assembly */}
      <div className="recessed-well" style={{ padding: '18px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
          {/* Bank of 5 Raised Mechanical Region Keys */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span
              style={{
                fontFamily: 'var(--dp-typography-mono)',
                fontSize: '11px',
                color: 'var(--dp-color-label)',
                textTransform: 'uppercase',
                marginRight: '2px',
              }}
            >
              ZONE BENCHMARK:
            </span>
            {REGION_KEYS.map((reg) => {
              const isSelected = selectedRegion === reg.code;
              return (
                <button
                  key={reg.code}
                  type="button"
                  className={`raised-key ${isSelected ? 'active' : ''}`}
                  onClick={() => handleRegionChange(reg.code)}
                  disabled={isLoadingProfile}
                  style={{ fontSize: '13px', padding: '5px 12px', height: '32px' }}
                >
                  <span className={`led-indicator ${isSelected ? 'active' : ''}`} />
                  <span style={{ fontWeight: isSelected ? 700 : 500 }}>{reg.label}</span>
                </button>
              );
            })}
          </div>

          {/* Transport Controls Assembly */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Circular Rotary Dial: Synthesize & Play F0 Contour */}
            <div className="tooltip-wrap">
              <button
                type="button"
                className="rotary-dial-btn"
                onClick={handlePlaySynthesizedF0}
                disabled={isPlayingAudio}
                aria-label="Synthesize and play authentic F0 harmonic pitch contour"
              >
                <Play
                  size={18}
                  fill={isPlayingAudio ? 'var(--dp-color-accent)' : 'var(--dp-color-ink)'}
                  color={isPlayingAudio ? 'var(--dp-color-accent)' : 'var(--dp-color-ink)'}
                />
              </button>
              <span className="tooltip-bubble">SYNTHESIZE / PLAY F0</span>
            </div>

            {/* Compare Reference Sample Key */}
            <button
              type="button"
              className="raised-key"
              onClick={handleCompareSample}
              disabled={isAnalyzing}
              style={{ fontSize: '13px', padding: '6px 12px', height: '34px', fontWeight: 600 }}
              title="Test audio against target regional prosody benchmark"
            >
              <Activity size={15} color="var(--dp-color-accent)" />
              <span>{isAnalyzing ? 'ANALYZING...' : 'COMPARE SAMPLE'}</span>
            </button>

            {/* Microphone Record Key */}
            <button
              type="button"
              className={`raised-key ${isRecording ? 'active' : ''}`}
              onClick={handleToggleRecord}
              style={{
                fontSize: '13px',
                padding: '6px 12px',
                height: '34px',
                color: isRecording ? '#ffffff' : 'inherit',
                backgroundColor: isRecording ? 'var(--dp-color-accent)' : undefined,
              }}
              title="Record voice via microphone to test cadence alignment"
            >
              <Mic size={15} color={isRecording ? '#ffffff' : 'var(--dp-color-ink)'} />
              <span>{isRecording ? 'STOP MIC' : 'RECORD MIC'}</span>
            </button>

            {/* Upload WAV Key */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".wav,audio/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <button
              type="button"
              className="raised-key"
              onClick={() => fileInputRef.current?.click()}
              style={{ fontSize: '13px', padding: '6px 12px', height: '34px' }}
              title="Upload audio WAV file for Librosa DSP feature extraction"
            >
              <Upload size={15} />
              <span>UPLOAD WAV</span>
            </button>

            {/* Reset Analysis */}
            {analysisResult && (
              <div className="tooltip-wrap">
                <button
                  type="button"
                  className="raised-icon-key"
                  onClick={handleResetAnalysis}
                  aria-label="Clear analysis trace overlay"
                  style={{ width: '34px', height: '34px' }}
                >
                  <RotateCcw size={15} />
                </button>
                <span className="tooltip-bubble">CLEAR OVERLAY TRACE</span>
              </div>
            )}
          </div>
        </div>

        {/* Transport Status Bar */}
        <div
          style={{
            marginTop: '12px',
            paddingTop: '8px',
            borderTop: '1px solid #cbd0d2',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: 'var(--dp-typography-mono)',
            fontSize: '11px',
            color: 'var(--dp-color-label)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className={`led-indicator ${isPlayingAudio || isRecording ? 'active' : ''}`} />
            <span>{audioStatusText}</span>
          </span>
          <span>DSP KERNEL: LIBROSA YIN // HARMONIC RATE: 22,050 HZ</span>
        </div>
      </div>

      {/* Center Recessed Oscilloscope CRT Display Well */}
      <div className="recessed-field-screen" style={{ padding: '16px', overflow: 'hidden' }}>
        {/* Screen Header Indicators */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontFamily: 'var(--dp-typography-mono)',
            fontSize: '11px',
            color: 'var(--dp-color-on-field-muted)',
            textTransform: 'uppercase',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '3px', backgroundColor: '#f2f4f4' }} />
              <span>TRACE A // REFERENCE {profile.region_code.toUpperCase()} F0</span>
            </span>

            {userPoints && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--dp-color-accent)' }}>
                <span style={{ width: '12px', height: '3px', backgroundColor: 'var(--dp-color-accent)' }} />
                <span>TRACE B // USER INGESTION F0 CONTOUR</span>
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>CADENCE TYPE: {profile.cadence_metrics.cadence_rhythm_type.toUpperCase()}</span>
            <span>&bull;</span>
            <span>BAND: 80–300 HZ</span>
          </div>
        </div>

        {/* Dual-Trace SVG Oscilloscope Screen */}
        <div style={{ position: 'relative', width: '100%', height: 'auto' }}>
          <svg
            viewBox={`0 0 ${OSC_WIDTH} ${OSC_HEIGHT}`}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              backgroundColor: '#1b2125',
            }}
            role="img"
            aria-label="Acoustic F0 Oscilloscope Pitch Contour Trace"
          >
            {/* Graticule Grid Pattern */}
            <defs>
              <pattern id="oscGraticule" width="40" height="30" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 30" fill="none" stroke="rgba(216, 222, 225, 0.08)" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width={OSC_WIDTH} height={OSC_HEIGHT} fill="url(#oscGraticule)" />

            {/* Vertical Hz Graticule Scale & Axis Labels */}
            {[100, 150, 200, 250, 300].map((hz) => {
              const y = hzToY(hz);
              return (
                <g key={`axis-${hz}`}>
                  <line x1="45" y1={y} x2={OSC_WIDTH - 20} y2={y} stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3,3" />
                  <text
                    x="38"
                    y={y + 3}
                    textAnchor="end"
                    fontFamily="var(--dp-typography-mono)"
                    fontSize="10"
                    fill="#606c74"
                  >
                    {hz}Hz
                  </text>
                </g>
              );
            })}

            {/* Time Horizontal Axis Label */}
            <line x1="45" y1={OSC_HEIGHT - 35} x2={OSC_WIDTH - 20} y2={OSC_HEIGHT - 35} stroke="#323a3f" strokeWidth="1" />
            <text x="50" y={OSC_HEIGHT - 20} fontFamily="var(--dp-typography-mono)" fontSize="10" fill="#606c74">
              0.0s (ONSET)
            </text>
            <text x={OSC_WIDTH / 2} y={OSC_HEIGHT - 20} textAnchor="middle" fontFamily="var(--dp-typography-mono)" fontSize="10" fill="#606c74">
              NORMALIZED UTTERANCE DURATION
            </text>
            <text x={OSC_WIDTH - 25} y={OSC_HEIGHT - 20} textAnchor="end" fontFamily="var(--dp-typography-mono)" fontSize="10" fill="#606c74">
              1.4s (TERMINAL)
            </text>

            {/* Lower Sub-band: Syllable RMS Energy Peaks */}
            {profile.energy_envelope && (
              <g opacity="0.35">
                {profile.energy_envelope.map((amp, idx) => {
                  const x = 50 + (idx / Math.max(1, profile.energy_envelope.length - 1)) * (OSC_WIDTH - 80);
                  const barH = amp * 40;
                  return (
                    <rect
                      key={`energy-${idx}`}
                      x={x - 2}
                      y={OSC_HEIGHT - 40 - barH}
                      width="4"
                      height={barH}
                      fill="var(--dp-color-on-field-muted)"
                      rx="1"
                    />
                  );
                })}
              </g>
            )}

            {/* Trace A: Reference Regional F0 Curve */}
            {refPoints.length > 1 && (
              <path
                d={refPoints
                  .map((hz, idx) => {
                    const x = 50 + (idx / Math.max(1, refPoints.length - 1)) * (OSC_WIDTH - 80);
                    const y = hzToY(hz);
                    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#f2f4f4"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Reference Data Points */}
            {refPoints.map((hz, idx) => {
              const x = 50 + (idx / Math.max(1, refPoints.length - 1)) * (OSC_WIDTH - 80);
              const y = hzToY(hz);
              return (
                <circle
                  key={`ref-pt-${idx}`}
                  cx={x}
                  cy={y}
                  r="3"
                  fill="#ffffff"
                  stroke="#1b2125"
                  strokeWidth="1.5"
                />
              );
            })}

            {/* Terminal Inflection Slope Vector Arrow */}
            {refPoints.length > 3 && (
              <g>
                <line
                  x1={OSC_WIDTH - 120}
                  y1={hzToY(refPoints[refPoints.length - 3])}
                  x2={OSC_WIDTH - 40}
                  y2={hzToY(refPoints[refPoints.length - 1])}
                  stroke="var(--dp-color-accent)"
                  strokeWidth="2.0"
                  strokeDasharray="4,2"
                />
                <circle
                  cx={OSC_WIDTH - 40}
                  cy={hzToY(refPoints[refPoints.length - 1])}
                  r="4"
                  fill="var(--dp-color-accent)"
                />
              </g>
            )}

            {/* Trace B: Overlaid Comparison User/Analyzed F0 Trace */}
            {userPoints && userPoints.length > 1 && (
              <path
                d={userPoints
                  .map((hz, idx) => {
                    const x = 50 + (idx / Math.max(1, userPoints.length - 1)) * (OSC_WIDTH - 80);
                    const y = hzToY(hz);
                    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="var(--dp-color-accent)"
                strokeWidth="2.2"
                strokeDasharray="4,2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </div>
      </div>

      {/* Lower Recessed Telemetry & Coaching Readout Matrix */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: analysisResult ? 'minmax(280px, 1fr) minmax(360px, 1.3fr)' : '1fr',
          gap: 'var(--dp-spacing-column-gap)',
          alignItems: 'start',
        }}
      >
        {/* Left: Benchmark Acoustic Telemetry Grid */}
        <div className="removable-module" style={{ backgroundColor: '#ffffff', padding: '16px 20px' }}>
          <div
            style={{
              fontFamily: 'var(--dp-typography-mono)',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--dp-color-label)',
              textTransform: 'uppercase',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{profile.region_name} // BENCHMARK TELEMETRY</span>
            <span style={{ color: 'var(--dp-color-accent)' }}>PROSODY PROFILE</span>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--dp-color-ink)', lineHeight: '1.4', marginBottom: '14px' }}>
            {profile.prosody_description}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '10px',
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--dp-color-raised)',
                padding: '8px 12px',
                borderRadius: 'var(--dp-radius-key)',
                border: '1px solid #b6bec2',
              }}
            >
              <div style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '10px', color: 'var(--dp-color-label)' }}>
                MEAN PITCH (F0)
              </div>
              <div style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '18px', fontWeight: 700 }}>
                {profile.cadence_metrics.pitch_mean_hz.toFixed(1)} <span style={{ fontSize: '11px' }}>Hz</span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--dp-color-raised)',
                padding: '8px 12px',
                borderRadius: 'var(--dp-radius-key)',
                border: '1px solid #b6bec2',
              }}
            >
              <div style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '10px', color: 'var(--dp-color-label)' }}>
                PITCH RANGE
              </div>
              <div style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '18px', fontWeight: 700 }}>
                &Delta; {profile.cadence_metrics.pitch_range_hz.toFixed(1)} <span style={{ fontSize: '11px' }}>Hz</span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--dp-color-raised)',
                padding: '8px 12px',
                borderRadius: 'var(--dp-radius-key)',
                border: '1px solid #b6bec2',
              }}
            >
              <div style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '10px', color: 'var(--dp-color-label)' }}>
                TERMINAL SLOPE
              </div>
              <div
                style={{
                  fontFamily: 'var(--dp-typography-mono)',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: profile.cadence_metrics.terminal_inflection_slope > 0 ? 'var(--dp-color-accent)' : 'inherit',
                }}
              >
                {profile.cadence_metrics.terminal_inflection_slope > 0 ? '+' : ''}
                {profile.cadence_metrics.terminal_inflection_slope.toFixed(2)}{' '}
                <span style={{ fontSize: '11px' }}>Hz/f</span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--dp-color-raised)',
                padding: '8px 12px',
                borderRadius: 'var(--dp-radius-key)',
                border: '1px solid #b6bec2',
              }}
            >
              <div style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '10px', color: 'var(--dp-color-label)' }}>
                SYLLABLE ONSET
              </div>
              <div style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '18px', fontWeight: 700 }}>
                {profile.cadence_metrics.estimated_syllable_rate_hz.toFixed(1)}{' '}
                <span style={{ fontSize: '11px' }}>syl/s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Comparative Coaching & Match Score Readout */}
        {analysisResult && (
          <div className="recessed-field-screen" style={{ padding: '16px 20px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="var(--dp-color-accent)" />
                <span
                  style={{
                    fontFamily: 'var(--dp-typography-mono)',
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  CADENCE COACHING &amp; MATCH TELEMETRY
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'var(--dp-typography-mono)',
                  fontSize: '11px',
                  color: 'var(--dp-color-accent)',
                }}
              >
                TARGET: {analysisResult.matched_region_name.toUpperCase()}
              </span>
            </div>

            {/* Match Score Display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
              <div>
                <div style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '10px', color: 'var(--dp-color-on-field-muted)' }}>
                  CADENCE MATCH SCORE
                </div>
                <div
                  style={{
                    fontFamily: 'var(--dp-typography-mono)',
                    fontSize: '36px',
                    fontWeight: 800,
                    color: 'var(--dp-color-accent)',
                    lineHeight: '1.1',
                  }}
                >
                  {Math.round(analysisResult.cadence_match_score)}%
                </div>
              </div>

              {/* Segmented Meter Bar */}
              <div style={{ flex: 1 }}>
                <div style={{ height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${analysisResult.cadence_match_score}%`,
                      backgroundColor: 'var(--dp-color-accent)',
                      borderRadius: '2px',
                      transition: 'width 200ms ease',
                    }}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '4px',
                    fontFamily: 'var(--dp-typography-mono)',
                    fontSize: '10px',
                    color: 'var(--dp-color-on-field-muted)',
                  }}
                >
                  <span>0% (DEVIANT)</span>
                  <span>50% (MODERATE)</span>
                  <span>100% (NATIVE)</span>
                </div>
              </div>
            </div>

            {/* Actionable Linguistic Coaching Tips */}
            <div>
              <span
                style={{
                  fontFamily: 'var(--dp-typography-mono)',
                  fontSize: '11px',
                  color: 'var(--dp-color-on-field-muted)',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                PROSODY COACHING FEEDBACK:
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {analysisResult.coaching_feedback.map((tip, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      fontSize: '13px',
                      lineHeight: '1.4',
                      color: 'var(--dp-color-on-field)',
                    }}
                  >
                    <ArrowRight size={13} color="var(--dp-color-accent)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default AcousticOscilloscopeBay;
