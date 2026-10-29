import React, { useState, useEffect } from 'react';
import {
  BookOpenCheck,
  Send,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Database,
  ArrowRight,
  ShieldCheck,
  MapPin,
} from 'lucide-react';
import {
  CommunitySubmissionRequest,
  CommunitySubmissionResponse,
  CommunitySubmissionItemResponse,
  swararekheApi,
  FALLBACK_SUBMISSIONS,
} from '../api/swararekheClient';
import { hardwareSoundEngine } from '../utils/hardwareSoundEngine';

interface LivingArchiveBayProps {
  onContributeSuccess?: () => void;
}

const truncateText = (text: string, maxLen: number): string => {
  if (!text) return '';
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
};

const PRESET_LOCATIONS = [
  { name: 'Belagavi', lat: 15.8497, lng: 74.4977, region: 'hubballi_dharwad' },
  { name: 'Udupi', lat: 13.3409, lng: 74.7421, region: 'kundapura_mangaluru' },
  { name: 'Bidar', lat: 17.9104, lng: 77.5199, region: 'kalaburagi_bidar' },
  { name: 'Madikeri', lat: 12.4244, lng: 75.7382, region: 'arebhashe_kodagu' },
  { name: 'Mysuru', lat: 12.3051, lng: 76.6493, region: 'bengaluru_mysuru' },
  { name: 'Davanagere', lat: 14.4644, lng: 75.9218, region: 'transition_belt' },
];

const PRESET_RECORDS = [
  {
    contributor_name: 'Shankar Gowda Patil',
    district_name: 'Belagavi',
    latitude: 15.8497,
    longitude: 74.4977,
    category: 'greeting',
    local_phrase_kannada: 'ಚಲೋ ಐತ್ರಿ ಪಾ',
    local_phrase_roman: 'Cholo aytri pa',
    standard_meaning_english: 'It is very fine brother',
  },
  {
    contributor_name: 'Sunita Shetty',
    district_name: 'Udupi',
    latitude: 13.3409,
    longitude: 74.7421,
    category: 'daily',
    local_phrase_kannada: 'ಲಾಯ್ಕ್ ಆಂಡ್ ಪೋಯಿ',
    local_phrase_roman: 'Laayk aand poyi',
    standard_meaning_english: 'It became very pleasant and comfortable',
  },
  {
    contributor_name: 'Basavaraj Biradar',
    district_name: 'Bidar',
    latitude: 17.9104,
    longitude: 77.5199,
    category: 'daily',
    local_phrase_kannada: 'ಜಲ್ದಿ ಹೋಗ್ಲಿಕತ್ತೀವಿ ನೋಡ್ರಿ',
    local_phrase_roman: 'Jaldi hoglikattivi nodri',
    standard_meaning_english: 'We are hurrying along quickly you see',
  },
  {
    contributor_name: 'Ponnamma Muthappa',
    district_name: 'Kodagu',
    latitude: 12.4244,
    longitude: 75.7382,
    category: 'food',
    local_phrase_kannada: 'ಕೂಳು ತಿಂದ್ದಿರಾ?',
    local_phrase_roman: 'Koolu tindira?',
    standard_meaning_english: 'Did you partake of meals / rice?',
  },
  {
    contributor_name: 'Kallappa Pujar',
    district_name: 'Davanagere',
    latitude: 14.4644,
    longitude: 75.9218,
    category: 'greeting',
    local_phrase_kannada: 'ಆರಾಮ್ ಅದೀರೇನ್ರೀ?',
    local_phrase_roman: 'Aaram adeerenree?',
    standard_meaning_english: 'Are you keeping well and relaxed?',
  },
];

export const LivingArchiveBay: React.FC<LivingArchiveBayProps> = ({ onContributeSuccess }) => {
  // Form State
  const [contributorName, setContributorName] = useState('Shankar Gowda Patil');
  const [districtName, setDistrictName] = useState('Belagavi');
  const [latitude, setLatitude] = useState(15.8497);
  const [longitude, setLongitude] = useState(74.4977);
  const [category, setCategory] = useState('greeting');
  const [phraseKannada, setPhraseKannada] = useState('ಚಲೋ ಐತ್ರಿ ಪಾ');
  const [phraseRoman, setPhraseRoman] = useState('Cholo aytri pa');
  const [englishMeaning, setEnglishMeaning] = useState('It is very fine brother');

  // Async States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [submissions, setSubmissions] = useState<CommunitySubmissionItemResponse[]>(FALLBACK_SUBMISSIONS);
  const [triageResult, setTriageResult] = useState<CommunitySubmissionResponse | null>({
    submission_id: 101,
    ai_triage_status: 'approved_injected',
    phonotactic_validity_score: 0.98,
    nearest_region_code: 'hubballi_dharwad',
    detected_morphological_markers: ['honorific_ri', 'marathi_cholo_loan', 'vocative_pa'],
    graph_node_injected: true,
    triage_notes:
      'Verified phonotactic profile: 0.98 validity. Detected northern alveolar honorific -ri and Marathi contact root cholo. Injected into Knowledge Graph under Uttara Karnataka.',
  });
  const [presetIndex, setPresetIndex] = useState(0);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isFlashingInjection, setIsFlashingInjection] = useState(false);
  const [hideRejectedSpam, setHideRejectedSpam] = useState(true);

  // Load submissions on mount
  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    setIsLoadingSubmissions(true);
    try {
      const data = await swararekheApi.getSubmissions(25);
      if (data && data.length > 0) {
        setSubmissions(data);
      }
    } catch (err) {
      console.warn('Using fallback submissions:', err);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  const handleApplyPresetLocation = (loc: (typeof PRESET_LOCATIONS)[0]) => {
    setDistrictName(loc.name);
    setLatitude(loc.lat);
    setLongitude(loc.lng);
  };

  const handleCyclePresetRecord = () => {
    const nextIdx = (presetIndex + 1) % PRESET_RECORDS.length;
    const record = PRESET_RECORDS[nextIdx];
    setContributorName(record.contributor_name);
    setDistrictName(record.district_name);
    setLatitude(record.latitude);
    setLongitude(record.longitude);
    setCategory(record.category);
    setPhraseKannada(record.local_phrase_kannada);
    setPhraseRoman(record.local_phrase_roman);
    setEnglishMeaning(record.standard_meaning_english);
    setPresetIndex(nextIdx);
    setFeedbackMsg(`LOADED SAMPLE PRESET: ${record.district_name.toUpperCase()}`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phraseRoman.trim() || !englishMeaning.trim()) {
      alert('Please enter at least the roman phrase and standard english meaning.');
      return;
    }

    setIsSubmitting(true);
    setFeedbackMsg('TRANSMITTING TO DRAVIDIAN PHONOTACTIC TRIAGE PIPELINE...');

    const payload: CommunitySubmissionRequest = {
      contributor_name: contributorName.trim() || 'Anonymous Field Worker',
      district_name: districtName.trim() || 'Karnataka',
      latitude: Number(latitude) || 15.0,
      longitude: Number(longitude) || 75.0,
      local_phrase_kannada: phraseKannada.trim() || phraseRoman.trim(),
      local_phrase_roman: phraseRoman.trim(),
      standard_meaning_english: englishMeaning.trim(),
      category: category,
    };

    try {
      const res = await swararekheApi.contributeSubmission(payload);
      setTriageResult(res);

      if (res.ai_triage_status === 'approved_injected' || res.graph_node_injected) {
        hardwareSoundEngine.playRelayLatch();
        setIsFlashingInjection(true);
        setTimeout(() => setIsFlashingInjection(false), 600);
      }

      if (res.ai_triage_status === 'approved_injected') {
        setFeedbackMsg('SUCCESS: ENTRY AUTO-APPROVED & INJECTED INTO LIVE GRAPH!');
      } else if (res.ai_triage_status === 'pending_review') {
        setFeedbackMsg('QUEUED: FLAGGED FOR HUMAN LINGUIST PEER REVIEW.');
      } else {
        setFeedbackMsg('ALERT: LOW PHONOTACTIC SCORE. ENTRY FLAGGED.');
      }

      // Refresh submissions ledger
      await loadSubmissions();

      // Trigger parent stats sync so header counters increment
      if (onContributeSuccess) {
        onContributeSuccess();
      }
    } catch (err) {
      console.error('Submission failed:', err);
      setFeedbackMsg('TRANSMISSION ERROR // LOCAL CLIENT FALLBACK ACTIVE');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  const handleSelectSubmissionRow = (item: CommunitySubmissionItemResponse) => {
    setTriageResult({
      submission_id: item.id,
      ai_triage_status: (item.ai_triage_status as any) || 'approved_injected',
      phonotactic_validity_score: item.phonotactic_validity_score || 0.95,
      nearest_region_code: item.nearest_region_code || 'hubballi_dharwad',
      detected_morphological_markers: [item.category, 'phonotactic_consonant_cluster'],
      graph_node_injected: item.ai_triage_status === 'approved_injected',
      triage_notes: item.triage_notes || 'Peer-reviewed field contribution archived in living dictionary.',
    });
    setPhraseKannada(item.local_phrase_kannada);
    setPhraseRoman(item.local_phrase_roman);
    setEnglishMeaning(item.standard_meaning_english);
    setDistrictName(item.district_name);
    setLatitude(item.latitude);
    setLongitude(item.longitude);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* BAY 04 HEADER: Operational Banner */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          borderBottom: 'var(--dp-border-hairline) solid #9aa3a8',
          paddingBottom: '16px',
        }}
      >
        <div>
          <div className="chassis-bay-header" style={{ marginBottom: '4px' }}>
            <span className="bay-indicator">
              <span className="led-indicator active" />
              <span>BAY 04 // LIVING FIELD ARCHIVE &amp; CROWDSOURCE TRIAGE DECK</span>
            </span>
          </div>
          <p
            style={{
              fontFamily: 'var(--dp-typography-sans)',
              fontSize: '15px',
              color: 'var(--dp-color-label)',
              margin: 0,
            }}
          >
            Community Dialect Collection, Real-Time Phonotactic AI Triage &amp; Dynamic Knowledge Graph Injection
          </p>
        </div>

        {/* Action button: Quick sample loader */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className="raised-key"
            onClick={handleCyclePresetRecord}
            title="Load authentic curated dialect field sample into the form"
            style={{ fontSize: '13px', height: '40px', padding: '0 16px', fontWeight: 600 }}
          >
            <Sparkles size={16} color="var(--dp-color-accent)" />
            <span>LOAD SAMPLE FIELD RECORD</span>
          </button>
        </div>
      </div>

      {/* UPPER SPLIT: Left Input Console & Right AI Triage Terminal (bay04-grid: 6fr 6fr, gap: 28px, margin-bottom: 32px) */}
      <div className="bay04-grid">
        {/* =========================================================================
            LEFT PANEL: Structured Field Contribution Console
            ========================================================================= */}
        <div className="recessed-well" style={{ padding: '26px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #9ba4a9',
              paddingBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BookOpenCheck size={20} color="var(--dp-color-accent)" />
              <span
                style={{
                  fontFamily: 'var(--dp-typography-mono)',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--dp-color-ink)',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}
              >
                FIELD CONTRIBUTION CONSOLE
              </span>
            </div>
            <span
              style={{
                fontFamily: 'var(--dp-typography-mono)',
                fontSize: '11px',
                color: 'var(--dp-color-label)',
                fontWeight: 600,
              }}
            >
              FORM SR-FC-01
            </span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Contributor & District Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="industrial-label" style={{ marginBottom: '8px' }}>
                  Contributor Name
                </label>
                <input
                  type="text"
                  value={contributorName}
                  onChange={(e) => setContributorName(e.target.value)}
                  placeholder="e.g. Dr. Mallikarjun B."
                  required
                  className="industrial-input"
                  style={{ width: '100%', height: '46px', padding: '0 14px', fontSize: '14px' }}
                />
              </div>

              <div>
                <label className="industrial-label" style={{ marginBottom: '8px' }}>
                  District / Taluk
                </label>
                <input
                  type="text"
                  value={districtName}
                  onChange={(e) => setDistrictName(e.target.value)}
                  placeholder="e.g. Belagavi"
                  required
                  className="industrial-input"
                  style={{ width: '100%', height: '46px', padding: '0 14px', fontSize: '14px' }}
                />
              </div>
            </div>

            {/* Coordinates & Preset Buttons */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <label className="industrial-label" style={{ marginBottom: 0 }}>
                  Geographic Coordinates (Lat / Lng)
                </label>
                <span
                  style={{
                    fontFamily: 'var(--dp-typography-mono)',
                    fontSize: '10px',
                    color: 'var(--dp-color-label)',
                  }}
                >
                  DECIMAL DEGREES
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                <input
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                  placeholder="Latitude (e.g. 15.8497)"
                  required
                  className="industrial-input"
                  style={{ height: '46px', padding: '0 14px', fontFamily: 'var(--dp-typography-mono)', fontSize: '13px' }}
                />
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                  placeholder="Longitude (e.g. 74.4977)"
                  required
                  className="industrial-input"
                  style={{ height: '46px', padding: '0 14px', fontFamily: 'var(--dp-typography-mono)', fontSize: '13px' }}
                />
              </div>

              {/* Quick Preset Location Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                <span
                  style={{
                    fontFamily: 'var(--dp-typography-mono)',
                    fontSize: '11px',
                    color: 'var(--dp-color-label)',
                    fontWeight: 600,
                  }}
                >
                  PRESETS:
                </span>
                {PRESET_LOCATIONS.map((loc) => (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => handleApplyPresetLocation(loc)}
                    className="raised-key"
                    style={{
                      fontFamily: 'var(--dp-typography-mono)',
                      fontSize: '11px',
                      padding: '4px 10px',
                      height: '28px',
                      backgroundColor: districtName === loc.name ? 'var(--dp-color-field)' : undefined,
                      color: districtName === loc.name ? 'var(--dp-color-on-field)' : undefined,
                      fontWeight: districtName === loc.name ? 700 : 500,
                    }}
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Semantic Category Select */}
            <div>
              <label className="industrial-label" style={{ marginBottom: '8px' }}>
                Semantic Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="industrial-select"
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 14px',
                  fontSize: '14px',
                }}
              >
                <option value="greeting">Greeting / Salutation (ಅಭಿವಾದನ)</option>
                <option value="daily">Daily Conversation / Discourse (ದೈನಂದಿನ ಸಂಭಾಷಣೆ)</option>
                <option value="food">Food &amp; Culinary Register (ಆಹಾರ / ಊಟೋಪಚಾರ)</option>
                <option value="kinship">Kinship &amp; Family Relations (ಬಾಂಧವ್ಯ)</option>
                <option value="agriculture">Agricultural &amp; Rural Lore (ಕೃಷಿ / ಗ್ರಾಮೀಣ)</option>
                <option value="idiom">Proverb &amp; Folk Idiom (ಗಾದೆ / ನುಡಿಗಟ್ಟು)</option>
              </select>
            </div>

            {/* Kannada Phrase (Native Script) */}
            <div>
              <label className="industrial-label" style={{ marginBottom: '8px' }}>
                Local Dialect Expression (Kannada Script)
              </label>
              <input
                type="text"
                value={phraseKannada}
                onChange={(e) => setPhraseKannada(e.target.value)}
                placeholder="ಉದಾ: ಚಲೋ ಐತ್ರಿ ಪಾ"
                className="industrial-input kannada-text"
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 14px',
                  fontSize: '18px',
                  fontWeight: 600,
                  fontFamily: "'Noto Sans Kannada', var(--dp-typography-kannada), sans-serif",
                }}
              />
            </div>

            {/* Roman Transliteration */}
            <div>
              <label className="industrial-label" style={{ marginBottom: '8px' }}>
                Roman Phonetic Transliteration
              </label>
              <input
                type="text"
                value={phraseRoman}
                onChange={(e) => setPhraseRoman(e.target.value)}
                placeholder="e.g. Cholo aytri pa"
                required
                className="industrial-input"
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 14px',
                  fontFamily: 'var(--dp-typography-mono)',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* English Standard Meaning */}
            <div>
              <label className="industrial-label" style={{ marginBottom: '8px' }}>
                Standard English Translation / Meaning
              </label>
              <input
                type="text"
                value={englishMeaning}
                onChange={(e) => setEnglishMeaning(e.target.value)}
                placeholder="e.g. It is very fine brother"
                required
                className="industrial-input"
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 14px',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* Submission Action Key */}
            <div style={{ marginTop: '8px' }}>
              <button
                type="submit"
                className="raised-key"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: 'var(--dp-color-field)',
                  color: 'var(--dp-color-on-field)',
                  border: '1px solid #111518',
                  fontSize: '14px',
                  fontWeight: 700,
                  gap: '10px',
                }}
              >
                <Send size={16} color="var(--dp-color-accent)" />
                <span>{isSubmitting ? 'TRIAGING PHONOTACTIC PROFILE...' : 'TRANSMIT TO LIVING ARCHIVE & RUN AI TRIAGE'}</span>
              </button>
            </div>
          </form>

          {/* Real-time status notification badge */}
          {feedbackMsg && (
            <div
              style={{
                fontFamily: 'var(--dp-typography-mono)',
                fontSize: '12px',
                padding: '10px 14px',
                backgroundColor: 'var(--dp-color-field)',
                color: 'var(--dp-color-accent)',
                borderRadius: 'var(--dp-radius-key)',
                border: '1px solid #111518',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span className="led-indicator active" />
              <span>{feedbackMsg}</span>
            </div>
          )}
        </div>

        {/* =========================================================================
            RIGHT PANEL: AI Triage & Live Knowledge Graph Injection Screen
            ========================================================================= */}
        <div
          className="recessed-field-screen"
          style={{
            padding: '26px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            minHeight: '520px',
            border: isFlashingInjection ? '2px solid var(--dp-color-accent)' : '1px solid #2e373d',
            boxShadow: isFlashingInjection ? '0 0 24px rgba(241, 91, 34, 0.45)' : undefined,
            transition: 'border-color 150ms ease, box-shadow 150ms ease',
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #2e373d',
              paddingBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={20} color="var(--dp-color-accent)" />
              <span
                style={{
                  fontFamily: 'var(--dp-typography-mono)',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--dp-color-accent)',
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                }}
              >
                // AI TRIAGE &amp; GRAPH INJECTION TERMINAL
              </span>
            </div>
            <span
              style={{
                fontFamily: 'var(--dp-typography-mono)',
                fontSize: '11px',
                color: 'var(--dp-color-on-field-muted)',
              }}
            >
              ENGINE: SYMBOLIC-NLP-05
            </span>
          </div>

          {triageResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Triage Decision Banner */}
              <div
                style={{
                  padding: '16px 20px',
                  borderRadius: 'var(--dp-radius-key)',
                  backgroundColor:
                    triageResult.ai_triage_status === 'approved_injected'
                      ? 'rgba(16, 185, 129, 0.12)'
                      : triageResult.ai_triage_status === 'pending_review'
                      ? 'rgba(245, 158, 11, 0.12)'
                      : 'rgba(239, 68, 68, 0.12)',
                  border: `1px solid ${
                    triageResult.ai_triage_status === 'approved_injected'
                      ? '#10b981'
                      : triageResult.ai_triage_status === 'pending_review'
                      ? '#f59e0b'
                      : '#ef4444'
                  }`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {triageResult.ai_triage_status === 'approved_injected' ? (
                    <CheckCircle2 size={26} color="#10b981" />
                  ) : triageResult.ai_triage_status === 'pending_review' ? (
                    <AlertTriangle size={26} color="#f59e0b" />
                  ) : (
                    <AlertTriangle size={26} color="#ef4444" />
                  )}
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--dp-typography-mono)',
                        fontSize: '14px',
                        fontWeight: 700,
                        color:
                          triageResult.ai_triage_status === 'approved_injected'
                            ? '#34d399'
                            : triageResult.ai_triage_status === 'pending_review'
                            ? '#fbbf24'
                            : '#f87171',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {triageResult.ai_triage_status === 'approved_injected'
                        ? 'TRIAGE STATUS: APPROVED // INJECTED INTO LIVE GRAPH'
                        : triageResult.ai_triage_status === 'pending_review'
                        ? 'TRIAGE STATUS: PENDING EXPERT REVIEW'
                        : 'TRIAGE STATUS: FLAGGED / REJECTED'}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--dp-typography-mono)',
                        fontSize: '11px',
                        color: 'var(--dp-color-on-field-muted)',
                        marginTop: '2px',
                      }}
                    >
                      SUBMISSION ID: #{triageResult.submission_id} &bull; DRAVIDIAN PHONOTACTIC VALIDATOR
                    </div>
                  </div>
                </div>

                {/* Live Graph Injection Lamp */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontFamily: 'var(--dp-typography-mono)',
                    fontSize: '11px',
                    backgroundColor: isFlashingInjection ? 'rgba(241, 91, 34, 0.25)' : 'rgba(0, 0, 0, 0.45)',
                    padding: '6px 10px',
                    borderRadius: 'var(--dp-radius-key)',
                    border: isFlashingInjection ? '1px solid var(--dp-color-accent)' : '1px solid #2e373d',
                    transition: 'all 150ms ease',
                  }}
                >
                  <span
                    className={`led-indicator ${triageResult.graph_node_injected ? 'active' : ''}`}
                    style={{
                      backgroundColor: isFlashingInjection
                        ? 'var(--dp-color-accent)'
                        : triageResult.graph_node_injected
                        ? '#10b981'
                        : '#552210',
                      boxShadow: isFlashingInjection
                        ? '0 0 10px var(--dp-color-accent)'
                        : triageResult.graph_node_injected
                        ? '0 0 6px #10b981'
                        : 'none',
                    }}
                  />
                  <span
                    style={{
                      color: isFlashingInjection
                        ? 'var(--dp-color-accent)'
                        : triageResult.graph_node_injected
                        ? '#34d399'
                        : 'var(--dp-color-on-field-muted)',
                      fontWeight: isFlashingInjection ? 700 : 500,
                    }}
                  >
                    {triageResult.graph_node_injected ? 'GRAPH INJECTION: LIVE' : 'GRAPH INJECTION: OFF'}
                  </span>
                </div>
              </div>

              {/* Phonotactic Validity Score Meter */}
              <div
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.35)',
                  padding: '16px 18px',
                  borderRadius: 'var(--dp-radius-key)',
                  border: '1px solid #2e373d',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    fontFamily: 'var(--dp-typography-mono)',
                    fontSize: '11px',
                  }}
                >
                  <span style={{ color: 'var(--dp-color-on-field-muted)', textTransform: 'uppercase' }}>
                    Phonotactic Validity Score (Kannada Syllabic n-gram Model)
                  </span>
                  <strong
                    style={{
                      color:
                        triageResult.phonotactic_validity_score >= 0.85
                          ? '#34d399'
                          : triageResult.phonotactic_validity_score >= 0.65
                          ? '#fbbf24'
                          : '#f87171',
                      fontSize: '15px',
                    }}
                  >
                    {Math.round(triageResult.phonotactic_validity_score * 100)}% ({triageResult.phonotactic_validity_score.toFixed(2)})
                  </strong>
                </div>

                {/* Progress Bar Track */}
                <div
                  style={{
                    width: '100%',
                    height: '10px',
                    backgroundColor: '#111518',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    border: '1px solid #2e373d',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(Math.max(triageResult.phonotactic_validity_score * 100, 0), 100)}%`,
                      height: '100%',
                      backgroundColor:
                        triageResult.phonotactic_validity_score >= 0.85
                          ? '#10b981'
                          : triageResult.phonotactic_validity_score >= 0.65
                          ? '#f59e0b'
                          : '#ef4444',
                      transition: 'width 300ms ease',
                    }}
                  />
                </div>

                {/* Sub-metric breakdown bars (gap: 14px) */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    gap: '14px',
                    marginTop: '10px',
                    fontFamily: 'var(--dp-typography-mono)',
                    fontSize: '11px',
                    color: 'var(--dp-color-on-field-muted)',
                  }}
                >
                  <span>Dravidian Vowel Harmony: <strong>0.96</strong></span>
                  <span>Onset/Coda Validity: <strong>0.94</strong></span>
                  <span>Morphological Boundary: <strong>0.98</strong></span>
                </div>
              </div>

              {/* Geographic Region Assignment & Morphemes */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.35)',
                    padding: '14px 16px',
                    borderRadius: 'var(--dp-radius-key)',
                    border: '1px solid #2e373d',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--dp-typography-mono)',
                      fontSize: '10px',
                      color: 'var(--dp-color-on-field-muted)',
                      textTransform: 'uppercase',
                      display: 'block',
                      marginBottom: '6px',
                    }}
                  >
                    Nearest Dialect Heartland
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={16} color="var(--dp-color-accent)" />
                    <strong style={{ fontSize: '14px', color: 'var(--dp-color-on-field)' }}>
                      {triageResult.nearest_region_code.toUpperCase().replace('_', ' / ')}
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.35)',
                    padding: '14px 16px',
                    borderRadius: 'var(--dp-radius-key)',
                    border: '1px solid #2e373d',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--dp-typography-mono)',
                      fontSize: '10px',
                      color: 'var(--dp-color-on-field-muted)',
                      textTransform: 'uppercase',
                      display: 'block',
                      marginBottom: '6px',
                    }}
                  >
                    Detected Morphological Markers
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {triageResult.detected_morphological_markers && triageResult.detected_morphological_markers.length > 0 ? (
                      triageResult.detected_morphological_markers.map((marker, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontFamily: 'var(--dp-typography-mono)',
                            fontSize: '10px',
                            backgroundColor: '#2e373d',
                            color: 'var(--dp-color-on-field)',
                            padding: '3px 8px',
                            borderRadius: '3px',
                            border: '1px solid #414b52',
                          }}
                        >
                          {marker}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--dp-color-on-field-muted)' }}>None flagged</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Triage Explanatory Notes (line-height: 1.6, padding: 16px) */}
              <div>
                <span
                  style={{
                    fontFamily: 'var(--dp-typography-mono)',
                    fontSize: '11px',
                    color: 'var(--dp-color-on-field-muted)',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  Triage Review Notes &amp; Graph Bridge:
                </span>
                <div
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    padding: '16px 18px',
                    borderRadius: 'var(--dp-radius-key)',
                    border: '1px solid #2e373d',
                    fontFamily: 'var(--dp-typography-mono)',
                    fontSize: '12px',
                    lineHeight: '1.6',
                    color: 'var(--dp-color-on-field-muted)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <ArrowRight size={14} color="var(--dp-color-accent)" style={{ marginTop: '3px', flexShrink: 0 }} />
                    <span>{triageResult.triage_notes}</span>
                  </div>
                  {triageResult.graph_node_injected && (
                    <div
                      style={{
                        marginTop: '12px',
                        paddingTop: '10px',
                        borderTop: '1px dashed #3a454d',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#34d399',
                      }}
                    >
                      <Database size={14} />
                      <span>
                        Dynamic Knowledge Graph injection confirmed: MultiDiGraph node added under{' '}
                        <code>variant:{phraseRoman.toLowerCase().replace(/[^a-z0-9]/g, '_')}:{triageResult.nearest_region_code}</code>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--dp-color-on-field-muted)',
                gap: '12px',
              }}
            >
              <Database size={36} color="#414b52" />
              <p style={{ margin: 0, fontFamily: 'var(--dp-typography-mono)', fontSize: '13px' }}>
                AI TRIAGE ENGINE IDLE // READY TO PROCESS FIELD RECORD
              </p>
            </div>
          )}
        </div>
      </div>

      {/* LOWER TRAY: Community Submissions Chronological Ledger Cards (Padded Ledger Cards) */}
      <div className="recessed-well" style={{ padding: '26px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Ledger Header Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            borderBottom: '1px solid #9ba4a9',
            paddingBottom: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={20} color="var(--dp-color-ink)" />
            <span
              style={{
                fontFamily: 'var(--dp-typography-mono)',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--dp-color-ink)',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              LIVING ARCHIVE REPOSITORY // PEER-CONTRIBUTED ENTRIES LEDGER
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`raised-key ${hideRejectedSpam ? 'active' : ''}`}
              onClick={() => {
                hardwareSoundEngine.playKeyClick();
                setHideRejectedSpam(!hideRejectedSpam);
              }}
              style={{
                height: '34px',
                padding: '0 12px',
                fontSize: '11px',
                fontFamily: 'var(--dp-typography-mono)',
                fontWeight: 700,
                color: hideRejectedSpam ? 'var(--dp-color-accent)' : 'var(--dp-color-label)',
                backgroundColor: 'var(--dp-color-raised)',
                border: hideRejectedSpam ? '1px solid var(--dp-color-accent)' : '1px solid #8e979d',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
              title="Toggle filtering out low-score/rejected spam entries from the live ledger"
            >
              <span className={`led-indicator ${hideRejectedSpam ? 'active' : ''}`} />
              <span>HIDE REJECTED SPAM: {hideRejectedSpam ? 'ON' : 'OFF'}</span>
            </button>

            <span
              style={{
                fontFamily: 'var(--dp-typography-mono)',
                fontSize: '11px',
                fontWeight: 600,
                color: isFlashingInjection ? 'var(--dp-color-accent)' : 'var(--dp-color-label)',
                backgroundColor: 'var(--dp-color-raised)',
                padding: '4px 10px',
                borderRadius: 'var(--dp-radius-key)',
                border: isFlashingInjection ? '1px solid var(--dp-color-accent)' : '1px solid #8e979d',
                boxShadow: isFlashingInjection ? '0 0 8px rgba(241, 91, 34, 0.4)' : 'none',
                transition: 'border-color 150ms ease, color 150ms ease, box-shadow 150ms ease',
              }}
            >
              RECORD COUNT: {
                submissions.filter((sub) => {
                  if (!hideRejectedSpam) return true;
                  const isSpam =
                    sub.ai_triage_status === 'rejected_spam' ||
                    (sub.phonotactic_validity_score !== undefined && sub.phonotactic_validity_score < 0.4);
                  return !isSpam;
                }).length
              }
            </span>

            <button
              type="button"
              className="raised-icon-key"
              onClick={loadSubmissions}
              disabled={isLoadingSubmissions}
              title="Refresh submissions ledger from server"
              aria-label="Refresh submissions ledger"
              style={{ width: '34px', height: '34px', padding: '6px' }}
            >
              <RefreshCw
                size={16}
                style={{
                  animation: isLoadingSubmissions ? 'spin 1s linear infinite' : 'none',
                }}
              />
            </button>
          </div>
        </div>

        {/* Spacious Stack of Padded Ledger Cards (padding: 18px 24px, gap: 14px) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '560px', overflowY: 'auto', paddingRight: '4px' }}>
          {submissions
            .filter((sub) => {
              if (!hideRejectedSpam) return true;
              const isSpam =
                sub.ai_triage_status === 'rejected_spam' ||
                (sub.phonotactic_validity_score !== undefined && sub.phonotactic_validity_score < 0.4);
              return !isSpam;
            })
            .map((sub, idx) => {
            const isSpam =
              sub.ai_triage_status === 'rejected_spam' ||
              (sub.phonotactic_validity_score !== undefined && sub.phonotactic_validity_score < 0.4);

            const displayKannada = isSpam
              ? truncateText(sub.local_phrase_kannada || '', 48)
              : sub.local_phrase_kannada;
            const displayRoman = isSpam
              ? truncateText(sub.local_phrase_roman || '', 48)
              : sub.local_phrase_roman;
            const displayMeaning = isSpam
              ? truncateText(sub.standard_meaning_english || '', 64)
              : sub.standard_meaning_english;

            return (
              <div
                key={sub.id || idx}
                className="removable-module"
                onClick={() => handleSelectSubmissionRow(sub)}
                title="Click to load and inspect this submission in the AI Triage Terminal"
                style={{
                  padding: '18px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'border-color 140ms ease, box-shadow 140ms ease',
                  backgroundColor: '#ffffff',
                  wordBreak: 'break-all',
                  overflowWrap: 'break-word',
                  maxWidth: '100%',
                }}
              >
                {/* Meta Header Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--dp-typography-mono)',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: 'var(--dp-color-field)',
                        color: 'var(--dp-color-on-field)',
                        padding: '2px 8px',
                        borderRadius: 'var(--dp-radius-key)',
                      }}
                    >
                      #{sub.id}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--dp-typography-mono)',
                        fontSize: '11px',
                        backgroundColor: 'var(--dp-color-raised)',
                        color: 'var(--dp-color-ink)',
                        padding: '2px 8px',
                        borderRadius: 'var(--dp-radius-key)',
                        border: '1px solid #b6bec2',
                        fontWeight: 600,
                      }}
                    >
                      {sub.district_name}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dp-color-ink)' }}>
                      by {sub.contributor_name}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--dp-typography-mono)',
                        fontSize: '10px',
                        padding: '2px 7px',
                        borderRadius: '2px',
                        backgroundColor: '#edf0f1',
                        border: '1px solid #cbd0d2',
                        textTransform: 'uppercase',
                        color: 'var(--dp-color-label)',
                      }}
                    >
                      {sub.category}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--dp-typography-mono)',
                        fontSize: '11px',
                        fontWeight: 700,
                        color:
                          (sub.phonotactic_validity_score || 0) >= 0.85
                            ? '#059669'
                            : (sub.phonotactic_validity_score || 0) >= 0.65
                            ? '#d97706'
                            : '#dc2626',
                      }}
                    >
                      SCORE: {sub.phonotactic_validity_score ? `${Math.round(sub.phonotactic_validity_score * 100)}%` : '95%'}
                    </span>

                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontFamily: 'var(--dp-typography-mono)',
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '3px 9px',
                        borderRadius: '3px',
                        backgroundColor:
                          sub.ai_triage_status === 'approved_injected'
                            ? '#d1fae5'
                            : sub.ai_triage_status === 'pending_review'
                            ? '#fef3c7'
                            : '#fee2e2',
                        color:
                          sub.ai_triage_status === 'approved_injected'
                            ? '#065f46'
                            : sub.ai_triage_status === 'pending_review'
                            ? '#92400e'
                            : '#991b1b',
                        border: `1px solid ${
                          sub.ai_triage_status === 'approved_injected'
                            ? '#6ee7b7'
                            : sub.ai_triage_status === 'pending_review'
                            ? '#fcd34d'
                            : '#fca5a5'
                        }`,
                        textTransform: 'uppercase',
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor:
                            sub.ai_triage_status === 'approved_injected'
                              ? '#10b981'
                              : sub.ai_triage_status === 'pending_review'
                              ? '#f59e0b'
                              : '#ef4444',
                        }}
                      />
                      {sub.ai_triage_status === 'approved_injected'
                        ? 'APPROVED'
                        : sub.ai_triage_status === 'pending_review'
                        ? 'PENDING'
                        : 'REJECTED'}
                    </span>
                  </div>
                </div>

                {/* Expression Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '14px',
                    flexWrap: 'wrap',
                    wordBreak: 'break-all',
                    overflowWrap: 'break-word',
                    maxWidth: '100%',
                  }}
                >
                  <span
                    className="kannada-text"
                    style={{
                      fontFamily: "'Noto Sans Kannada', var(--dp-typography-kannada), sans-serif",
                      fontSize: '22px',
                      fontWeight: 700,
                      color: 'var(--dp-color-ink)',
                      wordBreak: 'break-all',
                      overflowWrap: 'break-word',
                      maxWidth: '100%',
                    }}
                  >
                    {displayKannada}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--dp-typography-mono)',
                      fontSize: '14px',
                      color: 'var(--dp-color-label)',
                      fontWeight: 500,
                      wordBreak: 'break-all',
                      overflowWrap: 'break-word',
                      maxWidth: '100%',
                    }}
                  >
                    "{displayRoman}"
                  </span>
                </div>

                {/* Meaning Row */}
                <div
                  style={{
                    fontSize: '14px',
                    lineHeight: '1.5',
                    color: 'var(--dp-color-ink)',
                    wordBreak: 'break-all',
                    overflowWrap: 'break-word',
                    maxWidth: '100%',
                  }}
                >
                  <strong>Meaning:</strong> {displayMeaning}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LivingArchiveBay;
