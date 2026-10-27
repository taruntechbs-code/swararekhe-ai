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
import { Activity, BookOpenCheck, ArrowLeft, Terminal } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('atlas');
  const [stats, setStats] = useState<PlatformStatsResponse>(FALLBACK_STATS);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [geoJson, setGeoJson] = useState<GeoJSONFeatureCollection>(FALLBACK_GEOJSON);
  const [activeRegionCode, setActiveRegionCode] = useState<string>('hubballi_dharwad');
  const [locationData, setLocationData] = useState<IsoglossLocateResponse | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState<string>('Where are you going?');

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
    handleSelectCoordinate(15.4589, 75.0078);
  }, [loadPlatformData]);

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
        padding: '20px 16px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}
    >
      {/* Continuous Industrial Instrument Chassis Housing */}
      <div
        className="chassis-housing"
        style={{
          width: '100%',
          maxWidth: '1640px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top Instrument Chassis Header & Navigation Bank */}
        <WorkingSheetHeader
          stats={stats}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onRefreshStats={loadPlatformData}
          isLoadingStats={isLoadingStats}
        />

        {/* Chassis Narrow Seam Line */}
        <div className="chassis-seam" />

        {/* Main Operational Bay Container */}
        <main
          style={{
            flex: 1,
            padding: '0 24px 28px 24px',
            width: '100%',
          }}
        >
          {activeTab === 'atlas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* BAY 01A: Geospatial Isogloss Telemetry Screen */}
              <section aria-label="Bay 01A Geospatial Telemetry">
                <IsoglossMapSheet
                  geoJson={geoJson}
                  locationData={locationData}
                  isLoadingLocation={isLoadingLocation}
                  onSelectCoordinate={handleSelectCoordinate}
                  activeRegionCode={activeRegionCode}
                  onSelectRegion={handleSelectRegion}
                />
              </section>

              {/* Bay Seam */}
              <div className="chassis-seam" style={{ margin: '8px 0' }} />

              {/* BAY 01B: Neuro-Symbolic Phonological Transduction Tray */}
              <section aria-label="Bay 01B Dialect Morphing Tray">
                <DialectMorphSheet
                  activeRegionCode={activeRegionCode}
                  onSelectRegion={handleSelectRegion}
                  externalSeedPhrase={seedPhrase}
                />
              </section>
            </div>
          )}

          {/* BAY 02: Etymology Constellation Graph & Linguistic Bridge Bay */}
          {activeTab === 'graph' && (
            <section aria-label="Bay 02 Etymology Constellation Graph & Linguistic Bridge">
              <EtymologyGraphSheet
                initialQuery="good"
                activeRegionCode={activeRegionCode}
                onSelectRegion={handleSelectRegion}
              />
            </section>
          )}

          {/* BAY 03: Acoustic F0 Oscilloscope Preview Deck */}
          {activeTab === 'acoustic' && (
            <div className="recessed-well" style={{ padding: '36px', textAlign: 'center' }}>
              <div
                className="recessed-field-screen"
                style={{
                  maxWidth: '780px',
                  margin: '0 auto',
                  padding: '36px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={28} color="var(--dp-color-accent)" />
                  <span
                    style={{
                      fontFamily: 'var(--dp-typography-mono)',
                      fontSize: '13px',
                      color: 'var(--dp-color-accent)',
                      letterSpacing: '1px',
                    }}
                  >
                    // BAY 03 // ACOUSTIC PROSODY &amp; F0 OSCILLOSCOPE DECK
                  </span>
                </div>

                <h2 style={{ fontSize: '24px', color: 'var(--dp-color-on-field)', margin: 0 }}>
                  Acoustic Cadence DSP &amp; Harmonic Contour Analyzer
                </h2>

                <p
                  style={{
                    fontSize: '15px',
                    color: 'var(--dp-color-on-field-muted)',
                    lineHeight: '1.45',
                    maxWidth: '620px',
                  }}
                >
                  Synthetic DSP audio samples and F0 contour curves are prepared for all{' '}
                  <strong style={{ color: 'var(--dp-color-on-field)' }}>
                    {stats.acoustic_profiles_ready} dialect zones
                  </strong>
                  . Phase 8 will provide real-time audio recording and dynamic pitch-contour comparison against regional prosodic templates.
                </p>

                <button
                  type="button"
                  className="raised-key"
                  onClick={() => setActiveTab('atlas')}
                  style={{ height: '36px', fontSize: '13px', marginTop: '6px' }}
                >
                  <ArrowLeft size={14} />
                  <span>RETURN TO BAY 01</span>
                </button>
              </div>
            </div>
          )}

          {/* BAY 04: Living Field Archive Preview Deck */}
          {activeTab === 'archive' && (
            <div className="recessed-well" style={{ padding: '36px', textAlign: 'center' }}>
              <div
                className="recessed-field-screen"
                style={{
                  maxWidth: '780px',
                  margin: '0 auto',
                  padding: '36px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpenCheck size={28} color="var(--dp-color-accent)" />
                  <span
                    style={{
                      fontFamily: 'var(--dp-typography-mono)',
                      fontSize: '13px',
                      color: 'var(--dp-color-accent)',
                      letterSpacing: '1px',
                    }}
                  >
                    // BAY 04 // LIVING CROWDSOURCED FIELD ARCHIVE
                  </span>
                </div>

                <h2 style={{ fontSize: '24px', color: 'var(--dp-color-on-field)', margin: 0 }}>
                  Community Dialect Ingestion &amp; Dravidian Phonotactic Triage
                </h2>

                <p
                  style={{
                    fontSize: '15px',
                    color: 'var(--dp-color-on-field-muted)',
                    lineHeight: '1.45',
                    maxWidth: '620px',
                  }}
                >
                  The Living Dictionary pipeline has ingested{' '}
                  <strong style={{ color: 'var(--dp-color-on-field)' }}>
                    {stats.community_submissions_total} community submissions
                  </strong>{' '}
                  with{' '}
                  <strong style={{ color: 'var(--dp-color-on-field)' }}>
                    {stats.approved_living_entries} peer-approved entries
                  </strong>
                  . Phase 8 will bring the interactive field recorder submission form and community triage review table.
                </p>

                <button
                  type="button"
                  className="raised-key"
                  onClick={() => setActiveTab('atlas')}
                  style={{ height: '36px', fontSize: '13px', marginTop: '6px' }}
                >
                  <ArrowLeft size={14} />
                  <span>RETURN TO BAY 01</span>
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Chassis Footer Housing */}
        <footer
          style={{
            borderTop: 'var(--dp-border-hairline) solid #9aa3a8',
            padding: '14px 24px',
            backgroundColor: 'var(--dp-color-chassis)',
            fontFamily: 'var(--dp-typography-mono)',
            fontSize: '11px',
            color: 'var(--dp-color-label)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={14} color="var(--dp-color-accent)" />
            <span>INSTRUMENT SERIAL // SR-2026-KA</span>
            <span>&bull;</span>
            <span>SWARAREKHE (ಸ್ವರರೇಖೆ) SPATIO-ACOUSTIC ENGINE</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>DSP: LIBROSA-YIN</span>
            <span>&bull;</span>
            <span>GRAPH: NETWORKX-MULTIDIGRAPH</span>
            <span>&bull;</span>
            <span>IDW: P=2.0 SPATIAL</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
export default App;
