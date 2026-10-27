import React, { useState, useEffect, useCallback } from 'react';
import { WorkingSheetHeader, WorkspaceTab } from './components/WorkingSheetHeader';
import { IsoglossMapSheet } from './components/IsoglossMapSheet';
import { DialectMorphSheet } from './components/DialectMorphSheet';
import { EtymologyGraphSheet } from './components/EtymologyGraphSheet';
import {
  swararekheApi,
  FALLBACK_STATS,
  FALLBACK_GEOJSON,
  PlatformStatsResponse,
  GeoJSONFeatureCollection,
  IsoglossLocateResponse,
} from './api/swararekheClient';
import { Activity, BookOpenCheck, ArrowLeft } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('atlas');
  const [stats, setStats] = useState<PlatformStatsResponse>(FALLBACK_STATS);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [geoJson, setGeoJson] = useState<GeoJSONFeatureCollection>(FALLBACK_GEOJSON);
  const [activeRegionCode, setActiveRegionCode] = useState<string>('hubballi_dharwad');
  const [locationData, setLocationData] = useState<IsoglossLocateResponse | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState<string>('Where are you going?');

  // Load initial platform statistics and GeoJSON features
  const loadPlatformData = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const [statsData, mapData] = await Promise.all([
        swararekheApi.getPlatformStats(),
        swararekheApi.getIsoglossMap(),
      ]);
      setStats(statsData);
      setGeoJson(mapData);
    } catch (err) {
      console.warn('Using fallback state for platform data:', err);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    loadPlatformData();
    // Default initial location: Dharwad (15.4589° N, 75.0078° E)
    handleSelectCoordinate(15.4589, 75.0078);
  }, [loadPlatformData]);

  // Handle clicking on coordinates in the SVG field map or quick-jump station
  const handleSelectCoordinate = async (lat: number, lng: number) => {
    setIsLoadingLocation(true);
    try {
      const data = await swararekheApi.locateIsogloss(lat, lng, seedPhrase);
      setLocationData(data);
      if (data.dominant_region_code) {
        setActiveRegionCode(data.dominant_region_code);
      }
      if (data.interpolated_phrase_result?.source_phrase) {
        setSeedPhrase(data.interpolated_phrase_result.source_phrase);
      }
    } catch (err) {
      console.error('Error locating isogloss coordinates:', err);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleSelectRegion = (regionCode: string) => {
    setActiveRegionCode(regionCode);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--dp-color-bg)',
        color: 'var(--dp-color-ink)',
        fontFamily: 'var(--dp-typography-reading-face)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Working Sheet Header */}
      <WorkingSheetHeader
        stats={stats}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onRefreshStats={loadPlatformData}
        isLoadingStats={isLoadingStats}
      />

      {/* Main Workspace Sheet Content */}
      <main
        style={{
          flex: 1,
          padding: '28px',
          maxWidth: '1600px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {activeTab === 'atlas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Section 1: Interactive Karnataka Isogloss Field Map & IDW Blend Ledger */}
            <section aria-label="Interactive Karnataka Isogloss Field Map">
              <IsoglossMapSheet
                geoJson={geoJson}
                locationData={locationData}
                isLoadingLocation={isLoadingLocation}
                onSelectCoordinate={handleSelectCoordinate}
                activeRegionCode={activeRegionCode}
                onSelectRegion={handleSelectRegion}
              />
            </section>

            {/* Section 2: Neuro-Symbolic Dialect Morphing & Phonetic Transduction Sheet */}
            <section aria-label="Dialect Morphing Working Sheet">
              <DialectMorphSheet
                activeRegionCode={activeRegionCode}
                onSelectRegion={handleSelectRegion}
                externalSeedPhrase={seedPhrase}
              />
            </section>
          </div>
        )}

        {/* Phase 7: Interactive Etymology Knowledge Graph Tab */}
        {activeTab === 'graph' && (
          <section aria-label="Interactive Etymological Constellation Graph">
            <EtymologyGraphSheet
              initialQuery="good"
              activeRegionCode={activeRegionCode}
              onSelectRegion={handleSelectRegion}
            />
          </section>
        )}

        {/* Phase 8 Acoustic Tab Preview */}
        {activeTab === 'acoustic' && (
          <div
            className="sketch-paper-sheet"
            style={{
              padding: '40px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '18px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--dp-radius-control)',
                backgroundColor: 'var(--dp-accent-yellow-light)',
                border: 'var(--dp-border-fine-stroke) solid var(--dp-ink-pencil)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Activity size={32} color="var(--dp-accent-blue)" />
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '32px',
                margin: 0,
                color: 'var(--dp-ink-pencil)',
              }}
            >
              Acoustic Prosody & F0 Pitch Oscilloscope
            </h2>
            <p
              style={{
                maxWidth: '680px',
                fontSize: '20px',
                color: 'var(--dp-ink-pencil)',
                lineHeight: 1.5,
              }}
            >
              Synthetic DSP audio samples and F0 contour curves are prepared for all{' '}
              <strong>{stats.acoustic_profiles_ready} dialect zones</strong>. Phase 8 will provide real-time audio
              recording and dynamic pitch-contour comparison against regional prosodic templates.
            </p>
            <button
              type="button"
              className="sketch-btn sketch-btn-primary"
              onClick={() => setActiveTab('atlas')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}
            >
              <ArrowLeft size={18} />
              <span>Return to Isogloss Atlas & Morpher</span>
            </button>
          </div>
        )}

        {/* Phase 8 Archive Tab Preview */}
        {activeTab === 'archive' && (
          <div
            className="sketch-paper-sheet"
            style={{
              padding: '40px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '18px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--dp-radius-control)',
                backgroundColor: 'var(--dp-accent-yellow-light)',
                border: 'var(--dp-border-fine-stroke) solid var(--dp-ink-pencil)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpenCheck size={32} color="#10B981" />
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '32px',
                margin: 0,
                color: 'var(--dp-ink-pencil)',
              }}
            >
              Crowdsourced Living Field Archive
            </h2>
            <p
              style={{
                maxWidth: '680px',
                fontSize: '20px',
                color: 'var(--dp-ink-pencil)',
                lineHeight: 1.5,
              }}
            >
              The Living Dictionary pipeline has ingested{' '}
              <strong>{stats.community_submissions_total} community submissions</strong> with{' '}
              <strong>{stats.approved_living_entries} peer-approved entries</strong>. Phase 8 will bring the interactive
              field recorder submission form and community triage review table.
            </p>
            <button
              type="button"
              className="sketch-btn sketch-btn-primary"
              onClick={() => setActiveTab('atlas')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}
            >
              <ArrowLeft size={18} />
              <span>Return to Isogloss Atlas & Morpher</span>
            </button>
          </div>
        )}
      </main>

      {/* Footer Marginalia */}
      <footer
        style={{
          borderTop: 'var(--dp-border-fine-stroke) solid var(--dp-color-line)',
          padding: '16px 28px',
          textAlign: 'center',
          backgroundColor: 'var(--dp-color-scrap)',
          fontFamily: 'var(--dp-typography-reading-face)',
          fontSize: '18px',
          color: 'var(--dp-color-ink-muted)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>ಸ್ವರರೇಖೆ (SWARAREKHE)</span>
          <span>&bull;</span>
          <span>Kannada Dialectology &amp; Computational Linguistics Field Station</span>
        </div>
        <div>
          <span>Inverse Distance Weighting (IDW) &bull; Neuro-Symbolic Phonology &bull; Graph Etymology</span>
        </div>
      </footer>
    </div>
  );
};
export default App;
