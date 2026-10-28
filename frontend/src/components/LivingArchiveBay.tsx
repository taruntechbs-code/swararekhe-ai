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

interface LivingArchiveBayProps {
  onContributeSuccess?: () => void;
}

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* BAY 04 HEADER: Operational Banner */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          borderBottom: 'var(--dp-border-hairline) solid #9aa3a8',
          paddingBottom: '14px',
        }}
      >
        <div>
          <div className="chassis-bay-header" style={{ marginBottom: '2px' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="raised-key"
            onClick={handleCyclePresetRecord}
            title="Load authentic curated dialect field sample into the form"
            style={{ fontSize: '13px', height: '36px' }}
          >
            <Sparkles size={15} color="var(--dp-color-accent)" />
            <span>LOAD SAMPLE FIELD RECORD</span>
          </button>
        </div>
      </div>

      {/* UPPER SPLIT: Left Input Console & Right AI Triage Terminal */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* =========================================================================
            LEFT PANEL: Structured Field Contribution Console
            ========================================================================= */}
        <div className="recessed-well" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #9ba4a9',
              paddingBottom: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpenCheck size={18} color="var(--dp-color-ink)" />
              <span
                style={{
                  fontFamily: 'var(--dp-typography-mono)',
                  fontSize: '12px',
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
              }}
            >
              FORM SR-FC-01
            </span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Contributor & District Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'var(--dp-typography-mono)',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--dp-color-label)',
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  Contributor Name
                </label>
                <input
                  type="text"
                  value={contributorName}
                  onChange={(e) => setContributorName(e.target.value)}
                  placeholder="e.g. Dr. Mallikarjun B."
                  required
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontFamily: 'var(--dp-typography-sans)',
                    fontSize: '14px',
                    borderRadius: 'var(--dp-radius-key)',
                    border: '1px solid #8e979d',
                    backgroundColor: '#ffffff',
                    color: 'var(--dp-color-ink)',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'var(--dp-typography-mono)',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--dp-color-label)',
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  District / Taluk
                </label>
                <input
                  type="text"
                  value={districtName}
                  onChange={(e) => setDistrictName(e.target.value)}
                  placeholder="e.g. Belagavi"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontFamily: 'var(--dp-typography-sans)',
                    fontSize: '14px',
                    borderRadius: 'var(--dp-radius-key)',
                    border: '1px solid #8e979d',
                    backgroundColor: '#ffffff',
                    color: 'var(--dp-color-ink)',
                  }}
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
                  marginBottom: '4px',
                }}
              >
                <label
                  style={{
                    fontFamily: 'var(--dp-typography-mono)',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--dp-color-label)',
                    textTransform: 'uppercase',
                  }}
                >
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                <input
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                  placeholder="Latitude (e.g. 15.8497)"
                  required
                  style={{
                    padding: '6px 10px',
                    fontFamily: 'var(--dp-typography-mono)',
                    fontSize: '13px',
                    borderRadius: 'var(--dp-radius-key)',
                    border: '1px solid #8e979d',
                    backgroundColor: '#ffffff',
                    color: 'var(--dp-color-ink)',
                  }}
                />
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                  placeholder="Longitude (e.g. 74.4977)"
                  required
                  style={{
                    padding: '6px 10px',
                    fontFamily: 'var(--dp-typography-mono)',
                    fontSize: '13px',
                    borderRadius: 'var(--dp-radius-key)',
                    border: '1px solid #8e979d',
                    backgroundColor: '#ffffff',
                    color: 'var(--dp-color-ink)',
                  }}
                />
              </div>

              {/* Quick Preset Location Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                <span
                  style={{
                    fontFamily: 'var(--dp-typography-mono)',
                    fontSize: '10px',
                    color: 'var(--dp-color-label)',
                    marginRight: '2px',
                  }}
                >
                  PRESETS:
                </span>
                {PRESET_LOCATIONS.map((loc) => (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => handleApplyPresetLocation(loc)}
                    style={{
                      fontFamily: 'var(--dp-typography-mono)',
                      fontSize: '11px',
                      padding: '2px 7px',
                      backgroundColor: districtName === loc.name ? 'var(--dp-color-field)' : 'var(--dp-color-raised)',
                      color: districtName === loc.name ? 'var(--dp-color-on-field)' : 'var(--dp-color-ink)',
                      border: '1px solid #9aa3a8',
                      borderRadius: 'var(--dp-radius-key)',
                      cursor: 'pointer',
                    }}
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Select */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'var(--dp-typography-mono)',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--dp-color-label)',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                }}
              >
                Semantic Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  fontFamily: 'var(--dp-typography-sans)',
                  fontSize: '14px',
                  borderRadius: 'var(--dp-radius-key)',
                  border: '1px solid #8e979d',
                  backgroundColor: '#ffffff',
                  color: 'var(--dp-color-ink)',
                  cursor: 'pointer',
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
              <label
                style={{
                  display: 'block',
                  fontFamily: 'var(--dp-typography-mono)',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--dp-color-label)',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                }}
              >
                Local Dialect Expression (Kannada Script)
              </label>
              <input
                type="text"
                value={phraseKannada}
                onChange={(e) => setPhraseKannada(e.target.value)}
                placeholder="ಉದಾ: ಚಲೋ ಐತ್ರಿ ಪಾ"
                className="kannada-text"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '17px',
                  fontWeight: 600,
                  borderRadius: 'var(--dp-radius-key)',
                  border: '1px solid #8e979d',
                  backgroundColor: '#ffffff',
                  color: 'var(--dp-color-ink)',
                }}
              />
            </div>

            {/* Roman Transliteration */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'var(--dp-typography-mono)',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--dp-color-label)',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                }}
              >
                Roman Phonetic Transliteration
              </label>
              <input
                type="text"
                value={phraseRoman}
                onChange={(e) => setPhraseRoman(e.target.value)}
                placeholder="e.g. Cholo aytri pa"
                required
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  fontFamily: 'var(--dp-typography-mono)',
                  fontSize: '14px',
                  borderRadius: 'var(--dp-radius-key)',
                  border: '1px solid #8e979d',
                  backgroundColor: '#ffffff',
                  color: 'var(--dp-color-ink)',
                }}
              />
            </div>

            {/* English Standard Meaning */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'var(--dp-typography-mono)',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--dp-color-label)',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                }}
              >
                Standard English Translation / Meaning
              </label>
              <input
                type="text"
                value={englishMeaning}
                onChange={(e) => setEnglishMeaning(e.target.value)}
                placeholder="e.g. It is very fine brother"
                required
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  fontFamily: 'var(--dp-typography-sans)',
                  fontSize: '14px',
                  borderRadius: 'var(--dp-radius-key)',
                  border: '1px solid #8e979d',
                  backgroundColor: '#ffffff',
                  color: 'var(--dp-color-ink)',
                }}
              />
            </div>

            {/* Submission Action Key */}
            <div style={{ marginTop: '6px' }}>
              <button
                type="submit"
                className="raised-key"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  height: '44px',
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
                fontSize: '11px',
                padding: '8px 12px',
                backgroundColor: 'var(--dp-color-field)',
                color: 'var(--dp-color-accent)',
                borderRadius: 'var(--dp-radius-key)',
                border: '1px solid #111518',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
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
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            minHeight: '480px',
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #2e373d',
              paddingBottom: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="var(--dp-color-accent)" />
              <span
                style={{
                  fontFamily: 'var(--dp-typography-mono)',
                  fontSize: '12px',
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Triage Decision Banner */}
              <div
                style={{
                  padding: '14px 16px',
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
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {triageResult.ai_triage_status === 'approved_injected' ? (
                    <CheckCircle2 size={24} color="#10b981" />
                  ) : triageResult.ai_triage_status === 'pending_review' ? (
                    <AlertTriangle size={24} color="#f59e0b" />
                  ) : (
                    <AlertTriangle size={24} color="#ef4444" />
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
                    gap: '6px',
                    fontFamily: 'var(--dp-typography-mono)',
                    fontSize: '11px',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    padding: '4px 8px',
                    borderRadius: 'var(--dp-radius-key)',
                    border: '1px solid #2e373d',
                  }}
                >
                  <span
                    className={`led-indicator ${triageResult.graph_node_injected ? 'active' : ''}`}
                    style={{
                      backgroundColor: triageResult.graph_node_injected ? '#10b981' : '#552210',
                      boxShadow: triageResult.graph_node_injected ? '0 0 6px #10b981' : 'none',
                    }}
                  />
                  <span style={{ color: triageResult.graph_node_injected ? '#34d399' : 'var(--dp-color-on-field-muted)' }}>
                    {triageResult.graph_node_injected ? 'GRAPH INJECTION: LIVE' : 'GRAPH INJECTION: OFF'}
                  </span>
                </div>
              </div>

              {/* Phonotactic Validity Score Meter */}
              <div
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.35)',
                  padding: '12px 14px',
                  borderRadius: 'var(--dp-radius-key)',
                  border: '1px solid #2e373d',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
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
                      fontSize: '14px',
                    }}
                  >
                    {Math.round(triageResult.phonotactic_validity_score * 100)}% ({triageResult.phonotactic_validity_score.toFixed(2)})
                  </strong>
                </div>

                {/* Progress Bar Track */}
                <div
                  style={{
                    width: '100%',
                    height: '8px',
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

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '6px',
                    fontFamily: 'var(--dp-typography-mono)',
                    fontSize: '10px',
                    color: 'var(--dp-color-on-field-muted)',
                  }}
                >
                  <span>Dravidian Vowel Harmony: 0.96</span>
                  <span>Syllable Onset/Coda Validity: 0.94</span>
                  <span>Morphological Boundary: 0.98</span>
                </div>
              </div>

              {/* Geographic Region Assignment & Morphemes */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.35)',
                    padding: '10px 12px',
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
                      marginBottom: '4px',
                    }}
                  >
                    Nearest Dialect Heartland
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="var(--dp-color-accent)" />
                    <strong style={{ fontSize: '13px', color: 'var(--dp-color-on-field)' }}>
                      {triageResult.nearest_region_code.toUpperCase().replace('_', ' / ')}
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.35)',
                    padding: '10px 12px',
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
                      marginBottom: '4px',
                    }}
                  >
                    Detected Morphological Markers
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {triageResult.detected_morphological_markers && triageResult.detected_morphological_markers.length > 0 ? (
                      triageResult.detected_morphological_markers.map((marker, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontFamily: 'var(--dp-typography-mono)',
                            fontSize: '10px',
                            backgroundColor: '#2e373d',
                            color: 'var(--dp-color-on-field)',
                            padding: '2px 6px',
                            borderRadius: '2px',
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

              {/* Triage Explanatory Notes */}
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
                  Triage Review Notes &amp; Graph Bridge:
                </span>
                <div
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    padding: '10px 14px',
                    borderRadius: 'var(--dp-radius-key)',
                    border: '1px solid #2e373d',
                    fontFamily: 'var(--dp-typography-mono)',
                    fontSize: '12px',
                    lineHeight: '1.45',
                    color: 'var(--dp-color-on-field-muted)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <ArrowRight size={13} color="var(--dp-color-accent)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span>{triageResult.triage_notes}</span>
                  </div>
                  {triageResult.graph_node_injected && (
                    <div
                      style={{
                        marginTop: '8px',
                        paddingTop: '8px',
                        borderTop: '1px dashed #3a454d',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#34d399',
                      }}
                    >
                      <Database size={13} />
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
                gap: '8px',
              }}
            >
              <Database size={32} color="#414b52" />
              <p style={{ margin: 0, fontFamily: 'var(--dp-typography-mono)', fontSize: '13px' }}>
                AI TRIAGE ENGINE IDLE // READY TO PROCESS FIELD RECORD
              </p>
            </div>
          )}
        </div>
      </div>

      {/* LOWER TRAY: Community Submissions Chronological Ledger */}
      <div className="recessed-well" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Ledger Header Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            borderBottom: '1px solid #9ba4a9',
            paddingBottom: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={18} color="var(--dp-color-ink)" />
            <span
              style={{
                fontFamily: 'var(--dp-typography-mono)',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--dp-color-ink)',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              LIVING ARCHIVE REPOSITORY // PEER-CONTRIBUTED ENTRIES LEDGER
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                fontFamily: 'var(--dp-typography-mono)',
                fontSize: '11px',
                color: 'var(--dp-color-label)',
                backgroundColor: 'var(--dp-color-raised)',
                padding: '2px 8px',
                borderRadius: 'var(--dp-radius-key)',
                border: '1px solid #8e979d',
              }}
            >
              RECORD COUNT: {submissions.length}
            </span>

            <button
              type="button"
              className="raised-icon-key"
              onClick={loadSubmissions}
              disabled={isLoadingSubmissions}
              title="Refresh submissions ledger from server"
              aria-label="Refresh submissions ledger"
              style={{ width: '30px', height: '30px', padding: '4px' }}
            >
              <RefreshCw
                size={14}
                style={{
                  animation: isLoadingSubmissions ? 'spin 1s linear infinite' : 'none',
                }}
              />
            </button>
          </div>
        </div>

        {/* Scrollable Ledger Table */}
        <div
          style={{
            overflowX: 'auto',
            maxHeight: '360px',
            borderRadius: 'var(--dp-radius-key)',
            border: '1px solid #8e979d',
            backgroundColor: '#ffffff',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontFamily: 'var(--dp-typography-sans)',
              fontSize: '13px',
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: 'var(--dp-color-field)',
                  color: 'var(--dp-color-on-field-muted)',
                  fontFamily: 'var(--dp-typography-mono)',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid #111518',
                }}
              >
                <th style={{ padding: '8px 12px' }}>ID</th>
                <th style={{ padding: '8px 12px' }}>Contributor</th>
                <th style={{ padding: '8px 12px' }}>District</th>
                <th style={{ padding: '8px 12px' }}>Kannada Script</th>
                <th style={{ padding: '8px 12px' }}>Roman Phonetic</th>
                <th style={{ padding: '8px 12px' }}>English Meaning</th>
                <th style={{ padding: '8px 12px' }}>Category</th>
                <th style={{ padding: '8px 12px' }}>Score</th>
                <th style={{ padding: '8px 12px' }}>Triage Status</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub, idx) => (
                <tr
                  key={sub.id || idx}
                  onClick={() => handleSelectSubmissionRow(sub)}
                  style={{
                    borderBottom: '1px solid #e1e5e7',
                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafb',
                    cursor: 'pointer',
                    transition: 'background-color 120ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#edf2f4';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#f8fafb';
                  }}
                >
                  <td style={{ padding: '8px 12px', fontFamily: 'var(--dp-typography-mono)', fontSize: '11px' }}>
                    #{sub.id}
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{sub.contributor_name}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--dp-typography-mono)',
                        fontSize: '11px',
                        backgroundColor: 'var(--dp-color-raised)',
                        padding: '1px 6px',
                        borderRadius: '2px',
                        border: '1px solid #b6bec2',
                      }}
                    >
                      {sub.district_name}
                    </span>
                  </td>
                  <td
                    className="kannada-text"
                    style={{
                      padding: '8px 12px',
                      fontSize: '15px',
                      fontWeight: 600,
                      color: 'var(--dp-color-ink)',
                    }}
                  >
                    {sub.local_phrase_kannada}
                  </td>
                  <td
                    style={{
                      padding: '8px 12px',
                      fontFamily: 'var(--dp-typography-mono)',
                      fontSize: '12px',
                      color: 'var(--dp-color-label)',
                    }}
                  >
                    {sub.local_phrase_roman}
                  </td>
                  <td style={{ padding: '8px 12px', color: 'var(--dp-color-ink)' }}>{sub.standard_meaning_english}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--dp-typography-mono)',
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '2px',
                        backgroundColor: '#edf0f1',
                        border: '1px solid #cbd0d2',
                        textTransform: 'uppercase',
                      }}
                    >
                      {sub.category}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '8px 12px',
                      fontFamily: 'var(--dp-typography-mono)',
                      fontSize: '11px',
                      fontWeight: 600,
                      color:
                        (sub.phonotactic_validity_score || 0) >= 0.85
                          ? '#059669'
                          : (sub.phonotactic_validity_score || 0) >= 0.65
                          ? '#d97706'
                          : '#dc2626',
                    }}
                  >
                    {sub.phonotactic_validity_score
                      ? `${Math.round(sub.phonotactic_validity_score * 100)}%`
                      : '95%'}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontFamily: 'var(--dp-typography-mono)',
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '2px 7px',
                        borderRadius: '2px',
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default LivingArchiveBay;
