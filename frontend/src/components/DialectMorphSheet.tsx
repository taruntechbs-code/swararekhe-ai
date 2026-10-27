import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  Volume2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  X,
  ArrowRight,
  Filter,
} from 'lucide-react';
import {
  MorphTranslateResponse,
  MorphRulesResponse,
  swararekheApi,
} from '../api/swararekheClient';

interface DialectMorphSheetProps {
  activeRegionCode: string;
  onSelectRegion: (regionCode: string) => void;
  externalSeedPhrase?: string;
}

const QUICK_PROMPT_CHIPS = [
  { label: 'Where are you going?', text: 'Where are you going?', lang: 'en' as const },
  { label: 'How are you?', text: 'How are you?', lang: 'en' as const },
  { label: 'Very good / Fine', text: 'Very good, fine', lang: 'en' as const },
  { label: 'Have you eaten?', text: 'Have you eaten?', lang: 'en' as const },
  {
    label: 'ಎಲ್ಲಿಗೆ ಹೋಗುತ್ತಿದ್ದೀರಿ? ಊಟ ಚೆನ್ನಾಗಿದೆ...',
    text: 'ನೀನು ಎಲ್ಲಿಗೆ ಹೋಗುತ್ತಿದ್ದೀಯಾ? ಊಟ ಚೆನ್ನಾಗಿದೆ, ತುಂಬಾ ಬೇಕು',
    lang: 'kn' as const,
  },
];

const REGION_BADGES: Record<string, { kannada: string; color: string; short: string }> = {
  hubballi_dharwad: { kannada: 'ಉತ್ತರ ಕರ್ನಾಟಕ', color: 'var(--dp-accent-red)', short: 'Dharwad-Belagavi' },
  kundapura_mangaluru: { kannada: 'ಕರಾವಳಿ', color: '#10B981', short: 'Kundapura-Mangaluru' },
  kalaburagi_bidar: { kannada: 'ಕಲ್ಯಾಣ ಕರ್ನಾಟಕ', color: '#D97706', short: 'Kalaburagi-Bidar' },
  arebhashe_kodagu: { kannada: 'ಅರೆಭಾಷೆ', color: '#7C3AED', short: 'Malnad & Kodagu' },
  bengaluru_mysuru: { kannada: 'ಹಳೆ ಮೈಸೂರು', color: 'var(--dp-accent-blue)', short: 'Bengaluru-Mysuru' },
};

export const DialectMorphSheet: React.FC<DialectMorphSheetProps> = ({
  activeRegionCode,
  onSelectRegion,
  externalSeedPhrase,
}) => {
  const [inputText, setInputText] = useState('Where are you going?');
  const [sourceLang, setSourceLang] = useState<'en' | 'kn'>('en');
  const [targetRegionFilter, setTargetRegionFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [morphData, setMorphData] = useState<MorphTranslateResponse | null>(null);
  const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>({
    hubballi_dharwad: true,
  });
  const [isRulebookOpen, setIsRulebookOpen] = useState(false);
  const [rulebook, setRulebook] = useState<MorphRulesResponse | null>(null);
  const [playingAudioRegion, setPlayingAudioRegion] = useState<string | null>(null);
  const [audioFeedback, setAudioFeedback] = useState<string | null>(null);

  // Trigger initial morph on mount
  useEffect(() => {
    handleExecuteMorph(inputText, sourceLang);
  }, []);

  // Sync when external seed phrase changes (from map selection)
  useEffect(() => {
    if (externalSeedPhrase && externalSeedPhrase !== inputText) {
      setInputText(externalSeedPhrase);
      // Auto-detect language if contains Kannada characters
      const isKn = /[\u0C80-\u0CFF]/.test(externalSeedPhrase);
      const detectedLang = isKn ? 'kn' : 'en';
      setSourceLang(detectedLang);
      handleExecuteMorph(externalSeedPhrase, detectedLang);
    }
  }, [externalSeedPhrase]);

  const handleExecuteMorph = async (textToMorph: string, lang: 'en' | 'kn') => {
    if (!textToMorph.trim()) return;
    setIsLoading(true);
    try {
      const response = await swararekheApi.morphTranslate(textToMorph.trim(), lang, targetRegionFilter);
      setMorphData(response);
    } catch (err) {
      console.error('Morph translation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleExpand = (regionCode: string) => {
    setExpandedRegions((prev) => ({
      ...prev,
      [regionCode]: !prev[regionCode],
    }));
  };

  const handleOpenRulebook = async () => {
    setIsRulebookOpen(true);
    if (!rulebook) {
      const data = await swararekheApi.getMorphRules();
      if (data) setRulebook(data);
    }
  };

  // Play audio sample or fallback oscillator cadence
  const handlePlayCadence = (regionCode: string) => {
    setPlayingAudioRegion(regionCode);
    setAudioFeedback(`Acoustic Cadence: ${regionCode.replace('_', ' ')}`);

    // Try playing synthetic backend sample
    const audioUrl = `/static/audio_samples/${regionCode}.wav`;
    const audio = new Audio(audioUrl);

    audio.play().then(() => {
      audio.onended = () => {
        setPlayingAudioRegion(null);
        setAudioFeedback(null);
      };
    }).catch(() => {
      // Audio fallback synthesizer using Web Audio API
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        // Approximate regional base pitch
        const pitches: Record<string, number> = {
          hubballi_dharwad: 155,
          kundapura_mangaluru: 178,
          kalaburagi_bidar: 138,
          arebhashe_kodagu: 182,
          bengaluru_mysuru: 168,
        };

        const baseF = pitches[regionCode] || 160;
        osc.frequency.setValueAtTime(baseF, audioCtx.currentTime);
        // Add cadence pitch sweep
        if (regionCode === 'hubballi_dharwad') {
          osc.frequency.linearRampToValueAtTime(baseF * 1.3, audioCtx.currentTime + 0.6);
        } else if (regionCode === 'kundapura_mangaluru') {
          osc.frequency.setValueAtTime(baseF * 1.15, audioCtx.currentTime + 0.2);
          osc.frequency.setValueAtTime(baseF * 0.9, audioCtx.currentTime + 0.4);
        } else {
          osc.frequency.linearRampToValueAtTime(baseF * 0.95, audioCtx.currentTime + 0.6);
        }

        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.8);

        setTimeout(() => {
          setPlayingAudioRegion(null);
          setAudioFeedback(null);
        }, 850);
      } catch (synthErr) {
        setPlayingAudioRegion(null);
        setAudioFeedback(null);
      }
    });
  };

  const filteredResults = morphData?.results.filter((res) => {
    if (targetRegionFilter === 'all') return true;
    return res.region_code === targetRegionFilter;
  }) || [];

  return (
    <div className="sketch-page-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Field Morph Header Ledger Banner */}
      <div
        className="sketch-paper-sheet"
        style={{
          padding: '18px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--dp-radius-control)',
              border: 'var(--dp-border-fine-stroke) solid var(--dp-ink-pencil)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--dp-accent-yellow-light)',
            }}
          >
            <Sparkles size={22} color="var(--dp-ink-pencil)" />
          </div>
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '26px',
                margin: 0,
                color: 'var(--dp-ink-pencil)',
                lineHeight: 1.1,
              }}
            >
              Neuro-Symbolic Dialect Morphing & Phonetic Transduction Ledger
            </h2>
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '17px',
                color: 'var(--dp-ink-blue)',
                marginTop: '2px',
              }}
            >
              Cross-dialect syntactic rewriting with phonological mutation tracking and syllable stress marks.
            </div>
          </div>
        </div>

        {/* Action button to open Phonological Rulebook */}
        <button
          className="sketch-btn sketch-btn-secondary"
          onClick={handleOpenRulebook}
          title="Inspect the deterministic phonetic shifts, suffix rules, and lexical substitution tables"
          style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <BookOpen size={18} />
          <span>Inspect 5-Region Rulebook</span>
        </button>
      </div>

      {/* Input Console & Linguistic Prompt Workbench */}
      <div
        className="sketch-paper-sheet"
        style={{
          padding: '24px',
          position: 'relative',
        }}
      >
        <div className="sketch-tape-top-right" />

        {/* Input Bar form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExecuteMorph(inputText, sourceLang);
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            {/* Language Segmented Control */}
            <div
              style={{
                display: 'inline-flex',
                border: 'var(--dp-border-fine-stroke) solid var(--dp-ink-pencil)',
                borderRadius: 'var(--dp-radius-control)',
                overflow: 'hidden',
                backgroundColor: 'var(--dp-paper-scrap)',
              }}
            >
              <button
                type="button"
                onClick={() => setSourceLang('en')}
                style={{
                  padding: '8px 16px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '18px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: sourceLang === 'en' ? 'var(--dp-ink-pencil)' : 'transparent',
                  color: sourceLang === 'en' ? 'var(--dp-paper-white)' : 'var(--dp-ink-pencil)',
                  transition: 'background-color var(--dp-motion-control) ease',
                }}
              >
                English Source
              </button>
              <button
                type="button"
                onClick={() => setSourceLang('kn')}
                style={{
                  padding: '8px 16px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '18px',
                  border: 'none',
                  borderLeft: 'var(--dp-border-fine-stroke) solid var(--dp-ink-pencil)',
                  cursor: 'pointer',
                  backgroundColor: sourceLang === 'kn' ? 'var(--dp-ink-pencil)' : 'transparent',
                  color: sourceLang === 'kn' ? 'var(--dp-paper-white)' : 'var(--dp-ink-pencil)',
                  transition: 'background-color var(--dp-motion-control) ease',
                }}
              >
                ಕನ್ನಡ ಪ್ರಮಾಣ (Standard)
              </button>
            </div>

            {/* Region Filter Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={18} color="var(--dp-ink-blue)" />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--dp-ink-pencil)' }}>
                Dialect Scope:
              </span>
              <select
                value={targetRegionFilter}
                onChange={(e) => setTargetRegionFilter(e.target.value)}
                className="sketch-select"
                style={{ fontSize: '17px', padding: '6px 14px' }}
              >
                <option value="all">Compare All 5 Dialects Simultaneously</option>
                <option value="hubballi_dharwad">Uttara Karnataka (Dharwad)</option>
                <option value="kundapura_mangaluru">Karavali (Kundapura-Mangaluru)</option>
                <option value="kalaburagi_bidar">Kalyana Karnataka (Kalaburagi)</option>
                <option value="arebhashe_kodagu">Malnad & Kodagu (Arebhashe)</option>
                <option value="bengaluru_mysuru">Old Mysuru (Bengaluru)</option>
              </select>
            </div>
          </div>

          {/* Main Phrase Input Field with Search Button */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  sourceLang === 'en'
                    ? "Enter colloquial phrase, e.g., 'Where are you going? Did you eat?'..."
                    : "ಕನ್ನಡ ವಾಕ್ಯ ನಮೂದಿಸಿ, e.g., 'ನೀವು ಎಲ್ಲಿಗೆ ಹೋಗುತ್ತಿದ್ದೀರಿ?'..."
                }
                className="sketch-input"
                style={{
                  width: '100%',
                  fontSize: '22px',
                  padding: '12px 18px',
                  backgroundColor: '#ffffff',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="sketch-btn sketch-btn-primary"
              title="Execute neuro-symbolic transduction across dialect phonology"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                minWidth: '150px',
                justifyContent: 'center',
              }}
            >
              {isLoading ? (
                <span>Transducing...</span>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>Morph Phrase</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Prompt Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span
              style={{
                fontFamily: 'var(--font-reading)',
                fontSize: '17px',
                color: 'var(--dp-ink-pencil-light)',
                marginRight: '4px',
              }}
            >
              Field Notebook Samples:
            </span>
            {QUICK_PROMPT_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                className="sketch-chip"
                onClick={() => {
                  setInputText(chip.text);
                  setSourceLang(chip.lang);
                  handleExecuteMorph(chip.text, chip.lang);
                }}
                title={`Click to analyze: "${chip.text}"`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </form>

        {/* Matched Seed / Derivation Note */}
        {morphData?.matched_seed_concept && (
          <div
            style={{
              marginTop: '16px',
              padding: '8px 14px',
              borderRadius: 'var(--dp-radius-control)',
              backgroundColor: 'var(--dp-accent-yellow-light)',
              border: 'var(--dp-border-fine-stroke) dashed var(--dp-ink-pencil)',
              fontFamily: 'var(--font-body)',
              fontSize: '18px',
              color: 'var(--dp-ink-pencil)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <CheckCircle2 size={18} color="var(--dp-accent-blue)" />
            <span>
              <strong>Corpus Concept Match:</strong> Standard Canonical Anchor:{' '}
              <em>{morphData.matched_seed_concept}</em>
            </span>
          </div>
        )}

        {audioFeedback && (
          <div
            style={{
              marginTop: '12px',
              padding: '6px 12px',
              backgroundColor: 'var(--dp-accent-yellow)',
              borderRadius: 'var(--dp-radius-control)',
              fontFamily: 'var(--font-body)',
              fontSize: '16px',
              color: 'var(--dp-ink-pencil)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Volume2 size={16} />
            <span>{audioFeedback}</span>
          </div>
        )}
      </div>

      {/* 5 Broad Comparison Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '22px',
              color: 'var(--dp-ink-pencil)',
            }}
          >
            Regional Phonetic & Syntactic Comparison Ledger ({filteredResults.length} Regions)
          </span>
          <span
            style={{
              fontFamily: 'var(--font-reading)',
              fontSize: '16px',
              color: 'var(--dp-ink-blue)',
            }}
          >
            * Stressed syllables indicated with uppercase & red accent underline
          </span>
        </div>

        {filteredResults.map((result) => {
          const isSelected = result.region_code === activeRegionCode;
          const badge = REGION_BADGES[result.region_code] || {
            kannada: 'ಪ್ರಾದೇಶಿಕ',
            color: 'var(--dp-ink-pencil)',
            short: result.region_name,
          };
          const isExpanded = !!expandedRegions[result.region_code];
          const isPlaying = playingAudioRegion === result.region_code;

          return (
            <div
              key={result.region_code}
              className={`sketch-dialect-row ${isSelected ? 'selected' : ''}`}
              style={{
                backgroundColor: isSelected ? 'var(--dp-accent-yellow-light)' : 'var(--dp-paper-scrap)',
                border: isSelected
                  ? '2px solid var(--dp-ink-pencil)'
                  : 'var(--dp-border-fine-stroke) solid var(--dp-rule-erased)',
                borderRadius: 'var(--dp-radius-control)',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                position: 'relative',
                boxShadow: isSelected ? '2px 3px 0px rgba(56, 53, 47, 0.15)' : 'none',
                transition: 'all var(--dp-motion-control) ease',
              }}
            >
              {isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '20px',
                    backgroundColor: 'var(--dp-accent-red)',
                    color: '#ffffff',
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    padding: '2px 10px',
                    borderRadius: '4px',
                    letterSpacing: '0.5px',
                  }}
                >
                  MAP ACTIVE DIALECT
                </div>
              )}

              {/* Row Header: Region Title, Kannada script tag, Audio, and Selection trigger */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  borderBottom: 'var(--dp-border-fine-stroke) dashed var(--dp-rule-erased)',
                  paddingBottom: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => onSelectRegion(result.region_code)}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      textAlign: 'left',
                    }}
                    title="Click to focus this region on the isogloss map"
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '24px',
                        color: 'var(--dp-ink-pencil)',
                        fontWeight: 'bold',
                        textDecoration: isSelected ? 'underline var(--dp-accent-red) 2px' : 'none',
                      }}
                    >
                      {result.region_name}
                    </span>
                  </button>

                  <span
                    className="kannada-text"
                    style={{
                      backgroundColor: 'rgba(56, 53, 47, 0.08)',
                      padding: '3px 10px',
                      borderRadius: 'var(--dp-radius-control)',
                      fontSize: '18px',
                      fontWeight: 600,
                      color: 'var(--dp-ink-pencil)',
                      border: '1px solid rgba(56, 53, 47, 0.15)',
                    }}
                  >
                    {badge.kannada}
                  </span>

                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '15px',
                      color: 'var(--dp-ink-blue)',
                      backgroundColor: 'rgba(52, 76, 105, 0.08)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    {result.engine_mode === 'deterministic_symbolic'
                      ? 'Symbolic Rule Transduction'
                      : 'Hybrid LLM + Symbolic'}{' '}
                    ({Math.round(result.confidence_score * 100)}%)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Audio Cadence preview button */}
                  <button
                    type="button"
                    className="sketch-btn sketch-btn-secondary"
                    onClick={() => handlePlayCadence(result.region_code)}
                    title={`Play synthetic audio cadence for ${result.region_name}`}
                    style={{
                      padding: '5px 12px',
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: isPlaying ? 'var(--dp-accent-yellow)' : undefined,
                    }}
                  >
                    <Volume2 size={16} color={isPlaying ? 'var(--dp-accent-red)' : 'var(--dp-ink-pencil)'} />
                    <span>{isPlaying ? 'Playing...' : 'Play Cadence'}</span>
                  </button>

                  {/* Toggle Derivation Diff button */}
                  <button
                    type="button"
                    className="sketch-btn sketch-btn-secondary"
                    onClick={() => handleToggleExpand(result.region_code)}
                    title="Toggle word-by-word morphological derivation breakdown"
                    style={{
                      padding: '5px 10px',
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>Derivations</span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Core Phonetic Display Block */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(280px, 1.2fr) minmax(240px, 1fr) minmax(220px, 0.8fr)',
                  gap: '20px',
                  alignItems: 'baseline',
                }}
              >
                {/* 1. Kannada Script Rendering */}
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-reading)',
                      fontSize: '15px',
                      color: 'var(--dp-ink-pencil-light)',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Morphed Kannada Script
                  </div>
                  <div
                    className="kannada-text"
                    style={{
                      fontSize: '32px',
                      lineHeight: '1.3',
                      fontWeight: 700,
                      color: 'var(--dp-ink-pencil)',
                      wordBreak: 'break-word',
                    }}
                  >
                    {result.morphed_kannada_script}
                  </div>
                </div>

                {/* 2. Roman Phonetic & Syllable Stress */}
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-reading)',
                      fontSize: '15px',
                      color: 'var(--dp-ink-pencil-light)',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Phonetic Roman & Prosody
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '24px',
                      color: 'var(--dp-ink-pencil)',
                      lineHeight: '1.2',
                    }}
                  >
                    {result.morphed_phonetic_roman}
                  </div>
                  {/* Syllable stress with hand-marked emphasis */}
                  <div
                    style={{
                      marginTop: '6px',
                      fontFamily: 'var(--font-code)',
                      fontSize: '16px',
                      color: 'var(--dp-ink-pencil)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ color: 'var(--dp-ink-blue)', fontSize: '14px' }}>Stress:</span>
                    {result.syllable_stress_breakdown.split(/[\s-]+/).map((syl, sIdx) => {
                      const isStressed = syl === syl.toUpperCase() && syl.length > 1;
                      return (
                        <span
                          key={sIdx}
                          style={{
                            padding: '1px 5px',
                            borderRadius: '3px',
                            backgroundColor: isStressed ? 'rgba(158, 58, 46, 0.12)' : 'transparent',
                            borderBottom: isStressed ? '2px solid var(--dp-accent-red)' : 'none',
                            color: isStressed ? 'var(--dp-accent-red)' : 'var(--dp-ink-pencil)',
                            fontWeight: isStressed ? 'bold' : 'normal',
                          }}
                        >
                          {syl}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* 3. IPA Notation */}
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-reading)',
                      fontSize: '15px',
                      color: 'var(--dp-ink-pencil-light)',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    International Phonetic Alphabet (IPA)
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-code)',
                      fontSize: '20px',
                      color: 'var(--dp-ink-blue)',
                      backgroundColor: 'rgba(52, 76, 105, 0.06)',
                      padding: '4px 10px',
                      borderRadius: 'var(--dp-radius-control)',
                      border: '1px solid rgba(52, 76, 105, 0.2)',
                      display: 'inline-block',
                    }}
                  >
                    {result.ipa_approximation}
                  </div>
                </div>
              </div>

              {/* Field Linguist Handwritten Marginalia Note */}
              <div
                style={{
                  fontFamily: 'var(--font-note)',
                  fontSize: '22px',
                  color: 'var(--dp-ink-blue)',
                  backgroundColor: 'rgba(52, 76, 105, 0.04)',
                  padding: '8px 16px',
                  borderRadius: 'var(--dp-radius-control)',
                  borderLeft: '3px solid var(--dp-ink-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>✎</span>
                <span>
                  <strong>Field Note:</strong> {result.cultural_nuance_note}
                </span>
              </div>

              {/* Expandable Hand-Marked Derivation Breakdown (WordDiff) */}
              {isExpanded && (
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    borderRadius: 'var(--dp-radius-control)',
                    border: 'var(--dp-border-fine-stroke) solid var(--dp-rule-erased)',
                    padding: '14px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '17px',
                      color: 'var(--dp-ink-pencil)',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>Morpheme-by-Morpheme Derivation & Rules Triggered:</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {result.word_by_word_diff.map((diff, dIdx) => (
                      <div
                        key={dIdx}
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--dp-paper-scrap)',
                          borderLeft: '2px solid var(--dp-accent-red)',
                          fontFamily: 'var(--font-body)',
                          fontSize: '18px',
                        }}
                      >
                        {/* Strikethrough source token in pencil ink */}
                        <span
                          style={{
                            textDecoration: 'line-through',
                            color: 'var(--dp-ink-pencil-light)',
                            fontFamily: 'var(--font-heading)',
                            fontSize: '20px',
                          }}
                        >
                          {diff.source_token}
                        </span>

                        <ArrowRight size={16} color="var(--dp-accent-red)" />

                        {/* Morphed replacement token in red pencil */}
                        <span
                          style={{
                            color: 'var(--dp-accent-red)',
                            fontWeight: 'bold',
                            fontFamily: 'var(--font-heading)',
                            fontSize: '22px',
                          }}
                        >
                          {diff.target_token_roman}
                        </span>

                        <span
                          className="kannada-text"
                          style={{
                            color: 'var(--dp-ink-pencil)',
                            fontSize: '20px',
                            fontWeight: 'bold',
                          }}
                        >
                          ({diff.target_token_script})
                        </span>

                        {/* Rule Name Pill */}
                        <span
                          style={{
                            backgroundColor: 'rgba(158, 58, 46, 0.1)',
                            color: 'var(--dp-accent-red)',
                            padding: '2px 8px',
                            borderRadius: '3px',
                            fontSize: '14px',
                            fontFamily: 'var(--font-code)',
                          }}
                        >
                          [{diff.rule_applied}]
                        </span>

                        {/* Explanation */}
                        <span
                          style={{
                            fontFamily: 'var(--font-reading)',
                            fontSize: '16px',
                            color: 'var(--dp-ink-pencil)',
                            fontStyle: 'italic',
                          }}
                        >
                          — {diff.explanation}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Phonological Rulebook Modal / Drawer */}
      {isRulebookOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(56, 53, 47, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px',
          }}
          onClick={() => setIsRulebookOpen(false)}
        >
          <div
            className="sketch-paper-sheet"
            style={{
              maxWidth: '920px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              position: 'relative',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: 'var(--dp-border-fine-stroke) solid var(--dp-ink-pencil)',
                paddingBottom: '14px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BookOpen size={24} color="var(--dp-accent-red)" />
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '28px',
                    margin: 0,
                    color: 'var(--dp-ink-pencil)',
                  }}
                >
                  5-Region Phonological & Suffix Transduction Rulebook
                </h3>
              </div>
              <button
                type="button"
                className="sketch-btn sketch-btn-secondary"
                onClick={() => setIsRulebookOpen(false)}
                style={{ padding: '6px 12px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Rulebook Content */}
            {!rulebook ? (
              <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'var(--font-body)', fontSize: '20px' }}>
                Loading phonological rules from linguistic engine...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {Object.entries(rulebook.rulebook).map(([code, profile]) => (
                  <div
                    key={code}
                    style={{
                      border: 'var(--dp-border-fine-stroke) solid var(--dp-rule-erased)',
                      borderRadius: 'var(--dp-radius-control)',
                      padding: '18px',
                      backgroundColor: 'var(--dp-paper-scrap)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <h4
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: '24px',
                          margin: 0,
                          color: 'var(--dp-ink-pencil)',
                        }}
                      >
                        {profile.region_name} ({profile.kannada_name})
                      </h4>
                      <span
                        style={{
                          fontFamily: 'var(--font-code)',
                          fontSize: '14px',
                          color: 'var(--dp-ink-blue)',
                        }}
                      >
                        Region ID: {code}
                      </span>
                    </div>

                    <p
                      style={{
                        fontFamily: 'var(--font-reading)',
                        fontSize: '16px',
                        color: 'var(--dp-ink-pencil)',
                        marginBottom: '14px',
                        fontStyle: 'italic',
                      }}
                    >
                      Cadence: {profile.prosody_summary}
                    </p>

                    {/* Suffix rules */}
                    <div style={{ marginBottom: '12px' }}>
                      <div
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          color: 'var(--dp-accent-red)',
                          marginBottom: '4px',
                        }}
                      >
                        Suffix & Inflection Rules:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {profile.suffix_rules.map((rule, rIdx) => (
                          <div
                            key={rIdx}
                            style={{
                              backgroundColor: '#ffffff',
                              border: '1px solid var(--dp-rule-erased)',
                              borderRadius: '4px',
                              padding: '4px 10px',
                              fontFamily: 'var(--font-code)',
                              fontSize: '14px',
                            }}
                          >
                            <span style={{ color: 'var(--dp-ink-pencil-light)' }}>{rule.pattern}</span>
                            <span style={{ color: 'var(--dp-accent-red)', margin: '0 4px' }}>→</span>
                            <span style={{ fontWeight: 'bold', color: 'var(--dp-ink-pencil)' }}>{rule.replacement}</span>
                            <span style={{ color: 'var(--dp-ink-blue)', marginLeft: '6px' }}>({rule.description})</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Lexical substitutions */}
                    <div>
                      <div
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          color: 'var(--dp-ink-blue)',
                          marginBottom: '4px',
                        }}
                      >
                        Hallmark Lexical Substitutions:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {profile.lexical_substitutions.map((rule, rIdx) => (
                          <div
                            key={rIdx}
                            style={{
                              backgroundColor: '#ffffff',
                              border: '1px solid var(--dp-rule-erased)',
                              borderRadius: '4px',
                              padding: '4px 10px',
                              fontFamily: 'var(--font-code)',
                              fontSize: '14px',
                            }}
                          >
                            <span style={{ color: 'var(--dp-ink-pencil-light)' }}>{rule.pattern}</span>
                            <span style={{ color: 'var(--dp-ink-blue)', margin: '0 4px' }}>→</span>
                            <span style={{ fontWeight: 'bold', color: 'var(--dp-ink-pencil)' }}>{rule.replacement}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
