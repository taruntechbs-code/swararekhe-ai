import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  Volume2,
  Plus,
  Minus,
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

const QUICK_PROMPT_KEYS = [
  { label: 'WHERE ARE YOU GOING?', text: 'Where are you going?', lang: 'en' as const },
  { label: 'HOW ARE YOU?', text: 'How are you?', lang: 'en' as const },
  { label: 'VERY GOOD / FINE', text: 'Very good, fine', lang: 'en' as const },
  { label: 'HAVE YOU EATEN?', text: 'Have you eaten?', lang: 'en' as const },
  {
    label: 'ಎಲ್ಲಿಗೆ ಹೋಗುತ್ತಿದ್ದೀರಿ? ಊಟ...',
    text: 'ನೀನು ಎಲ್ಲಿಗೆ ಹೋಗುತ್ತಿದ್ದೀಯಾ? ಊಟ ಚೆನ್ನಾಗಿದೆ, ತುಂಬಾ ಬೇಕು',
    lang: 'kn' as const,
  },
];

const REGION_BADGES: Record<string, { kannada: string; short: string }> = {
  hubballi_dharwad: { kannada: 'ಉತ್ತರ ಕರ್ನಾಟಕ', short: 'Dharwad-Belagavi' },
  kundapura_mangaluru: { kannada: 'ಕರಾವಳಿ', short: 'Kundapura-Mangaluru' },
  kalaburagi_bidar: { kannada: 'ಕಲ್ಯಾಣ ಕರ್ನಾಟಕ', short: 'Kalaburagi-Bidar' },
  arebhashe_kodagu: { kannada: 'ಅರೆಭಾಷೆ', short: 'Malnad & Kodagu' },
  bengaluru_mysuru: { kannada: 'ಹಳೆ ಮೈಸೂರು', short: 'Bengaluru-Mysuru' },
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

  useEffect(() => {
    handleExecuteMorph(inputText, sourceLang);
  }, []);

  useEffect(() => {
    if (externalSeedPhrase && externalSeedPhrase !== inputText) {
      setInputText(externalSeedPhrase);
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

  const handlePlayCadence = (regionCode: string) => {
    setPlayingAudioRegion(regionCode);
    setAudioFeedback(`Acoustic Cadence: ${regionCode.replace('_', ' ')}`);

    const audioUrl = `/static/audio_samples/${regionCode}.wav`;
    const audio = new Audio(audioUrl);

    audio
      .play()
      .then(() => {
        audio.onended = () => {
          setPlayingAudioRegion(null);
          setAudioFeedback(null);
        };
      })
      .catch(() => {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();

          const pitches: Record<string, number> = {
            hubballi_dharwad: 155,
            kundapura_mangaluru: 178,
            kalaburagi_bidar: 138,
            arebhashe_kodagu: 182,
            bengaluru_mysuru: 168,
          };

          const baseF = pitches[regionCode] || 160;
          osc.frequency.setValueAtTime(baseF, audioCtx.currentTime);
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
        } catch {
          setPlayingAudioRegion(null);
          setAudioFeedback(null);
        }
      });
  };

  const filteredResults =
    morphData?.results.filter((res) => {
      if (targetRegionFilter === 'all') return true;
      return res.region_code === targetRegionFilter;
    }) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Bay Header */}
      <div className="chassis-bay-header">
        <span className="bay-indicator">
          <span className="led-indicator active" />
          <span>BAY 01B</span>
        </span>
        <span>// NEURO-SYMBOLIC PHONOLOGICAL TRANSDUCTION TRAY</span>
      </div>

      {/* Input Console Well */}
      <div className="recessed-well" style={{ padding: '20px' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExecuteMorph(inputText, sourceLang);
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          {/* Controls Bar: Source Mode Keys + Region Filter + Rulebook Trigger */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '11px', color: 'var(--dp-color-label)', textTransform: 'uppercase' }}>
                SOURCE REGISTER:
              </span>
              <button
                type="button"
                className={`raised-key ${sourceLang === 'en' ? 'active' : ''}`}
                onClick={() => setSourceLang('en')}
                style={{ fontSize: '13px', padding: '4px 12px', height: '28px' }}
              >
                <span className={`led-indicator ${sourceLang === 'en' ? 'active' : ''}`} />
                <span>ENGLISH (EN)</span>
              </button>
              <button
                type="button"
                className={`raised-key ${sourceLang === 'kn' ? 'active' : ''}`}
                onClick={() => setSourceLang('kn')}
                style={{ fontSize: '13px', padding: '4px 12px', height: '28px' }}
              >
                <span className={`led-indicator ${sourceLang === 'kn' ? 'active' : ''}`} />
                <span>ಕನ್ನಡ ಪ್ರಮಾಣ (KN)</span>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Filter size={14} color="var(--dp-color-label)" />
                <span style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '11px', color: 'var(--dp-color-label)' }}>
                  SCOPE:
                </span>
                <select
                  value={targetRegionFilter}
                  onChange={(e) => setTargetRegionFilter(e.target.value)}
                  className="industrial-select"
                >
                  <option value="all">COMPARE ALL 5 DIALECTS</option>
                  <option value="hubballi_dharwad">UTTARA KARNATAKA (DHARWAD)</option>
                  <option value="kundapura_mangaluru">KARAVALI (KUNDAPURA-MANGALURU)</option>
                  <option value="kalaburagi_bidar">KALYANA KARNATAKA (KALABURAGI)</option>
                  <option value="arebhashe_kodagu">MALNAD &amp; KODAGU (AREBHASHE)</option>
                  <option value="bengaluru_mysuru">OLD MYSURU (BENGALURU)</option>
                </select>
              </div>

              <button
                type="button"
                className="raised-key"
                onClick={handleOpenRulebook}
                title="Inspect the 5-Region Phonological Rulebook"
                style={{ fontSize: '13px', padding: '4px 12px', height: '28px' }}
              >
                <BookOpen size={14} color="var(--dp-color-ink)" />
                <span>RULEBOOK</span>
              </button>
            </div>
          </div>

          {/* Main Phrase Input Field with Rotary Dial Action Button */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                sourceLang === 'en'
                  ? "Enter colloquial phrase, e.g., 'Where are you going? Did you eat?'..."
                  : "ಕನ್ನಡ ವಾಕ್ಯ ನಮೂದಿಸಿ, e.g., 'ನೀವು ಎಲ್ಲಿಗೆ ಹೋಗುತ್ತಿದ್ದೀರಿ?'..."
              }
              className="industrial-input"
              style={{
                flex: 1,
                fontSize: '17px',
                padding: '12px 16px',
              }}
            />

            <div className="tooltip-wrap">
              <button
                type="submit"
                disabled={isLoading}
                className="rotary-dial-btn"
                title="Trigger Neuro-Symbolic Phonological Morph"
                aria-label="Morph phrase across dialects"
              >
                <Sparkles size={20} color={isLoading ? 'var(--dp-color-accent)' : 'var(--dp-color-ink)'} />
              </button>
              <span className="tooltip-bubble">EXECUTE TRANSDUCTION</span>
            </div>
          </div>

          {/* Bank of Preset Prompt Keys */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            <span
              style={{
                fontFamily: 'var(--dp-typography-mono)',
                fontSize: '11px',
                color: 'var(--dp-color-label)',
                marginRight: '2px',
              }}
            >
              PRESET KEYS:
            </span>
            {QUICK_PROMPT_KEYS.map((keyItem, idx) => (
              <button
                key={idx}
                type="button"
                className="raised-key"
                onClick={() => {
                  setInputText(keyItem.text);
                  setSourceLang(keyItem.lang);
                  handleExecuteMorph(keyItem.text, keyItem.lang);
                }}
                style={{ fontSize: '12px', padding: '3px 8px', height: '26px' }}
                title={`Load and morph: "${keyItem.text}"`}
              >
                <span>{keyItem.label}</span>
              </button>
            ))}
          </div>
        </form>

        {/* Matched Canonical Seed Telemetry */}
        {morphData?.matched_seed_concept && (
          <div
            className="recessed-field-screen"
            style={{
              marginTop: '12px',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'var(--dp-typography-mono)',
              fontSize: '12px',
            }}
          >
            <CheckCircle2 size={14} color="var(--dp-color-accent)" />
            <span>
              CANONICAL ANCHOR: <strong style={{ color: 'var(--dp-color-on-field)' }}>{morphData.matched_seed_concept}</strong>
            </span>
          </div>
        )}

        {audioFeedback && (
          <div
            style={{
              marginTop: '10px',
              fontFamily: 'var(--dp-typography-mono)',
              fontSize: '12px',
              color: 'var(--dp-color-accent)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Volume2 size={14} />
            <span>{audioFeedback}</span>
          </div>
        )}
      </div>

      {/* Recessed Tray Holding the 5 Removable-Looking Comparison Modules */}
      <div className="recessed-well" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: 'var(--dp-typography-mono)',
            fontSize: '11px',
            color: 'var(--dp-color-label)',
            textTransform: 'uppercase',
            padding: '0 4px',
          }}
        >
          <span>REGIONAL COMPARISON MODULES ({filteredResults.length} ZONES MOUNTED)</span>
          <span>STRESSED SYLLABLES HIGHLIGHTED IN ORANGE READOUT</span>
        </div>

        {filteredResults.map((result) => {
          const isSelected = result.region_code === activeRegionCode;
          const badge = REGION_BADGES[result.region_code] || {
            kannada: 'ಪ್ರಾದೇಶಿಕ',
            short: result.region_name,
          };
          const isExpanded = !!expandedRegions[result.region_code];
          const isPlaying = playingAudioRegion === result.region_code;

          return (
            <div
              key={result.region_code}
              className={`removable-module ${isSelected ? 'selected' : ''}`}
            >
              {/* Module Header Bar: Inset Pressed Key / Region Identification & Actions */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  borderBottom: '1px solid #cbd0d2',
                  paddingBottom: '10px',
                  marginBottom: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {/* Inset pressed key button to focus region on map */}
                  <button
                    type="button"
                    onClick={() => onSelectRegion(result.region_code)}
                    className={`raised-key ${isSelected ? 'active' : ''}`}
                    style={{ fontSize: '14px', padding: '3px 10px', height: '28px' }}
                    title="Focus region on telemetry map"
                  >
                    <span className={`led-indicator ${isSelected ? 'active' : ''}`} />
                    <span style={{ fontWeight: 700 }}>{result.region_name}</span>
                  </button>

                  <span
                    className="kannada-text"
                    style={{
                      fontFamily: 'var(--dp-typography-kannada)',
                      fontSize: '15px',
                      fontWeight: 700,
                      color: 'var(--dp-color-label)',
                      backgroundColor: 'var(--dp-color-well)',
                      padding: '2px 8px',
                      borderRadius: 'var(--dp-radius-key)',
                      border: '1px solid #9aa3a8',
                    }}
                  >
                    {badge.kannada}
                  </span>

                  <span
                    style={{
                      fontFamily: 'var(--dp-typography-mono)',
                      fontSize: '11px',
                      color: 'var(--dp-color-label)',
                    }}
                  >
                    {result.engine_mode === 'deterministic_symbolic'
                      ? 'SYMBOLIC TRANSDUCTION'
                      : 'HYBRID LLM'}{' '}
                    [{Math.round(result.confidence_score * 100)}%]
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Cadence Playback Key */}
                  <button
                    type="button"
                    className="raised-key"
                    onClick={() => handlePlayCadence(result.region_code)}
                    title={`Play synthetic audio cadence for ${result.region_name}`}
                    style={{ fontSize: '13px', padding: '3px 10px', height: '28px' }}
                  >
                    <Volume2 size={14} color={isPlaying ? 'var(--dp-color-accent)' : 'var(--dp-color-ink)'} />
                    <span>{isPlaying ? 'PLAYING...' : 'CADENCE'}</span>
                  </button>

                  {/* Tactile +/- Disclosure Key */}
                  <button
                    type="button"
                    className="raised-icon-key"
                    onClick={() => handleToggleExpand(result.region_code)}
                    title="Toggle morphological derivation chain"
                    style={{ width: '28px', height: '28px', padding: '4px' }}
                  >
                    {isExpanded ? <Minus size={14} /> : <Plus size={14} />}
                  </button>
                </div>
              </div>

              {/* Core Output Readings (Kannada, Roman Phonetic, IPA, Stress) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '16px',
                  alignItems: 'baseline',
                }}
              >
                {/* 1. Large Kannada Script */}
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--dp-typography-mono)',
                      fontSize: '11px',
                      color: 'var(--dp-color-label)',
                      textTransform: 'uppercase',
                      marginBottom: '2px',
                    }}
                  >
                    MORPhed KANNADA SCRIPT
                  </div>
                  <div
                    className="kannada-text"
                    style={{
                      fontSize: '26px',
                      fontWeight: 700,
                      color: 'var(--dp-color-ink)',
                      lineHeight: '1.25',
                    }}
                  >
                    {result.morphed_kannada_script}
                  </div>
                </div>

                {/* 2. Phonetic Roman & Syllable Stress */}
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--dp-typography-mono)',
                      fontSize: '11px',
                      color: 'var(--dp-color-label)',
                      textTransform: 'uppercase',
                      marginBottom: '2px',
                    }}
                  >
                    PHONETIC ROMAN &amp; PROSODY
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--dp-typography-sans)',
                      fontSize: '19px',
                      fontWeight: 700,
                      color: 'var(--dp-color-ink)',
                    }}
                  >
                    {result.morphed_phonetic_roman}
                  </div>

                  <div
                    style={{
                      marginTop: '4px',
                      fontFamily: 'var(--dp-typography-mono)',
                      fontSize: '12px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '4px',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ color: 'var(--dp-color-label)' }}>STRESS:</span>
                    {result.syllable_stress_breakdown.split(/[\s-]+/).map((syl, sIdx) => {
                      const isStressed = syl === syl.toUpperCase() && syl.length > 1;
                      return (
                        <span
                          key={sIdx}
                          style={{
                            padding: '1px 5px',
                            borderRadius: '2px',
                            backgroundColor: isStressed ? 'rgba(241, 91, 34, 0.15)' : 'transparent',
                            color: isStressed ? 'var(--dp-color-accent)' : 'inherit',
                            fontWeight: isStressed ? 700 : 400,
                            border: isStressed ? '1px solid var(--dp-color-accent)' : 'none',
                          }}
                        >
                          {syl}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* 3. IPA Pronunciation Readout */}
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--dp-typography-mono)',
                      fontSize: '11px',
                      color: 'var(--dp-color-label)',
                      textTransform: 'uppercase',
                      marginBottom: '2px',
                    }}
                  >
                    IPA TRANSCRIPTION
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--dp-typography-mono)',
                      fontSize: '14px',
                      backgroundColor: 'var(--dp-color-field)',
                      color: 'var(--dp-color-on-field)',
                      padding: '4px 10px',
                      borderRadius: 'var(--dp-radius-key)',
                      display: 'inline-block',
                      border: '1px solid #111518',
                    }}
                  >
                    {result.ipa_approximation}
                  </div>
                </div>
              </div>

              {/* Cultural Context Field Note */}
              <div
                style={{
                  marginTop: '10px',
                  padding: '6px 12px',
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  borderRadius: 'var(--dp-radius-key)',
                  borderLeft: '3px solid var(--dp-color-label)',
                  fontFamily: 'var(--dp-typography-sans)',
                  fontSize: '13px',
                  color: 'var(--dp-color-ink)',
                }}
              >
                <strong>FIELD NOTE:</strong> {result.cultural_nuance_note}
              </div>

              {/* Expanded Derivation Chain */}
              {isExpanded && (
                <div
                  style={{
                    marginTop: '10px',
                    padding: '12px 14px',
                    backgroundColor: '#ffffff',
                    borderRadius: 'var(--dp-radius-key)',
                    border: '1px solid #b6bec2',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--dp-typography-mono)',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--dp-color-label)',
                      textTransform: 'uppercase',
                    }}
                  >
                    MORPHEME TRANSDUCTION CHAIN:
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {result.word_by_word_diff.map((diff, dIdx) => (
                      <div
                        key={dIdx}
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '4px 8px',
                          backgroundColor: 'var(--dp-color-raised)',
                          borderRadius: 'var(--dp-radius-key)',
                          fontSize: '13px',
                          fontFamily: 'var(--dp-typography-mono)',
                        }}
                      >
                        <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>
                          {diff.source_token}
                        </span>
                        <ArrowRight size={12} color="var(--dp-color-accent)" />
                        <span style={{ fontWeight: 700, color: 'var(--dp-color-accent)' }}>
                          {diff.target_token_roman}
                        </span>
                        <span className="kannada-text" style={{ fontWeight: 700 }}>
                          ({diff.target_token_script})
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            backgroundColor: '#ffffff',
                            padding: '1px 6px',
                            borderRadius: '2px',
                            border: '1px solid #b6bec2',
                            color: 'var(--dp-color-label)',
                          }}
                        >
                          [{diff.rule_applied}]
                        </span>
                        <span style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--dp-color-ink)' }}>
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

      {/* Hardware Chassis Rulebook Modal */}
      {isRulebookOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(24, 30, 34, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px',
          }}
          onClick={() => setIsRulebookOpen(false)}
        >
          <div
            className="chassis-housing"
            style={{
              maxWidth: '920px',
              width: '100%',
              maxHeight: '88vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #9aa3a8',
                paddingBottom: '12px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BookOpen size={20} color="var(--dp-color-accent)" />
                <h3
                  style={{
                    fontSize: '22px',
                    margin: 0,
                    color: 'var(--dp-color-ink)',
                  }}
                >
                  5-REGION PHONOLOGICAL &amp; SUFFIX TRANSDUCTION RULEBOOK
                </h3>
              </div>
              <button
                type="button"
                className="raised-icon-key"
                onClick={() => setIsRulebookOpen(false)}
                style={{ width: '32px', height: '32px', padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Rulebook Content */}
            {!rulebook ? (
              <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'var(--dp-typography-mono)', fontSize: '14px' }}>
                LOADING RULEBOOK FROM LINGUISTIC ENGINE...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {Object.entries(rulebook.rulebook).map(([code, profile]) => (
                  <div key={code} className="recessed-well" style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <h4 style={{ fontSize: '18px', margin: 0 }}>
                        {profile.region_name} ({profile.kannada_name})
                      </h4>
                      <span style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '11px', color: 'var(--dp-color-label)' }}>
                        REGION_ID: {code}
                      </span>
                    </div>

                    <p style={{ fontSize: '13px', color: 'var(--dp-color-label)', marginBottom: '10px' }}>
                      Cadence: {profile.prosody_summary}
                    </p>

                    {/* Suffix rules */}
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '10px', color: 'var(--dp-color-accent)', fontWeight: 600 }}>
                        SUFFIX RULES:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                        {profile.suffix_rules.map((rule, rIdx) => (
                          <div
                            key={rIdx}
                            style={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #9aa3a8',
                              borderRadius: 'var(--dp-radius-key)',
                              padding: '3px 8px',
                              fontFamily: 'var(--dp-typography-mono)',
                              fontSize: '11px',
                            }}
                          >
                            <span>{rule.pattern}</span>
                            <span style={{ color: 'var(--dp-color-accent)', margin: '0 4px' }}>➔</span>
                            <strong>{rule.replacement}</strong>
                            <span style={{ color: 'var(--dp-color-label)', marginLeft: '4px' }}>({rule.description})</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Lexical substitutions */}
                    <div>
                      <span style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '10px', color: 'var(--dp-color-label)', fontWeight: 600 }}>
                        LEXICAL SUBSTITUTIONS:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                        {profile.lexical_substitutions.map((rule, rIdx) => (
                          <div
                            key={rIdx}
                            style={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #9aa3a8',
                              borderRadius: 'var(--dp-radius-key)',
                              padding: '3px 8px',
                              fontFamily: 'var(--dp-typography-mono)',
                              fontSize: '11px',
                            }}
                          >
                            <span>{rule.pattern}</span>
                            <span style={{ color: 'var(--dp-color-accent)', margin: '0 4px' }}>➔</span>
                            <strong>{rule.replacement}</strong>
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
export default DialectMorphSheet;
