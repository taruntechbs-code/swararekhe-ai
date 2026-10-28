import React from 'react';
import {
  MapPin,
  Network,
  Activity,
  BookOpenCheck,
  RefreshCw,
  Compass,
  Layers,
} from 'lucide-react';
import { PlatformStatsResponse } from '../api/swararekheClient';

export type WorkspaceTab = 'atlas' | 'graph' | 'acoustic' | 'archive' | 'all';

interface HeaderProps {
  stats: PlatformStatsResponse;
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  onRefreshStats: () => void;
  isLoadingStats?: boolean;
}

export const WorkingSheetHeader: React.FC<HeaderProps> = ({
  stats,
  activeTab,
  onTabChange,
  onRefreshStats,
  isLoadingStats,
}) => {
  return (
    <header
      style={{
        borderBottom: 'var(--dp-border-hairline) solid #9aa3a8',
        padding: '24px 28px 20px 28px',
        backgroundColor: 'var(--dp-color-chassis)',
        position: 'relative',
      }}
    >
      {/* Top Header Opening: Clean 2-Column CSS Grid (1fr auto, gap: 32px, align-items: center) */}
      <div
        className="chassis-header-opening"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: '32px',
          alignItems: 'center',
          paddingBottom: '24px',
        }}
      >
        {/* Left: Model Eyebrow Badge, Clean Bold Title, 1-Line Subtitle */}
        <div>
          <div
            style={{
              fontFamily: 'var(--dp-typography-mono)',
              fontSize: 'var(--dp-typography-label)',
              fontWeight: 600,
              color: 'var(--dp-color-label)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
            }}
          >
            <span style={{ color: 'var(--dp-color-accent)' }}>●</span>
            <span>MODEL SR-05 // SPATIO-ACOUSTIC ISOGLOSS INSTRUMENT</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', flexWrap: 'wrap' }}>
            <h1
              style={{
                fontSize: '42px',
                fontWeight: 800,
                letterSpacing: '-0.5px',
                color: 'var(--dp-color-ink)',
                margin: 0,
                lineHeight: 1.15,
              }}
            >
              SWARAREKHE
            </h1>
            <span
              className="kannada-text"
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--dp-color-label)',
              }}
            >
              (ಸ್ವರರೇಖೆ)
            </span>
            <span
              style={{
                fontFamily: 'var(--dp-typography-mono)',
                fontSize: 'var(--dp-typography-metadata)',
                color: 'var(--dp-color-label)',
                backgroundColor: 'var(--dp-color-well)',
                padding: '3px 10px',
                borderRadius: 'var(--dp-radius-key)',
                border: '1px solid #9aa3a8',
                letterSpacing: '0.04em',
              }}
            >
              CHASSIS VER 2.5
            </span>
          </div>

          <div
            style={{
              fontFamily: 'var(--dp-typography-sans)',
              fontSize: '15px',
              color: 'var(--dp-color-label)',
              marginTop: '8px',
              lineHeight: 1.5,
            }}
          >
            High-Precision Linguistic Isogloss Interpolation &amp; Etymological Graph Bay
          </div>
        </div>

        {/* Right: Compact Hardware Control Assembly with 16px gap */}
        <div
          className="chassis-header-control-column"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {/* Recessed Cooling Vent Slots */}
          <div className="chassis-vent-group" aria-hidden="true" title="Chassis Exhaust Vents">
            <div className="chassis-vent-slot" />
            <div className="chassis-vent-slot" />
            <div className="chassis-vent-slot" />
            <div className="chassis-vent-slot" />
            <div className="chassis-vent-slot" />
          </div>

          {/* Rotary Dial Hardware Action Button */}
          <div className="tooltip-wrap">
            <button
              type="button"
              className="rotary-dial-btn"
              onClick={onRefreshStats}
              title="Calibrate & refresh platform telemetry"
              aria-label="Calibrate platform telemetry"
            >
              <Compass size={22} color="var(--dp-color-ink)" />
            </button>
            <span className="tooltip-bubble">CALIBRATE TELEMETRY</span>
          </div>

          {/* Secondary Refresh Key */}
          <div className="tooltip-wrap">
            <button
              type="button"
              className="raised-icon-key"
              onClick={onRefreshStats}
              disabled={isLoadingStats}
              aria-label="Sync live platform counts"
            >
              <RefreshCw
                size={16}
                style={{
                  animation: isLoadingStats ? 'spin 1s linear infinite' : 'none',
                }}
              />
            </button>
            <span className="tooltip-bubble">SYNC TELEMETRY COUNTS</span>
          </div>
        </div>
      </div>

      {/* Recessed Telemetry Strip: Spacious 5-Column CSS Grid (#20272b) */}
      <div
        className="recessed-field-screen chassis-telemetry-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '20px',
          padding: '16px 24px',
          margin: '20px 0',
        }}
      >
        <div>
          <span
            style={{
              fontFamily: 'var(--dp-typography-mono)',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--dp-color-on-field-muted)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '6px',
            }}
          >
            REGIONS
          </span>
          <div
            style={{
              fontFamily: 'var(--dp-typography-mono)',
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--dp-color-on-field)',
              lineHeight: 1,
            }}
          >
            {String(stats.total_regions).padStart(2, '0')}
          </div>
        </div>

        <div>
          <span
            style={{
              fontFamily: 'var(--dp-typography-mono)',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--dp-color-on-field-muted)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '6px',
            }}
          >
            FIELD VARIANTS
          </span>
          <div
            style={{
              fontFamily: 'var(--dp-typography-mono)',
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--dp-color-on-field)',
              lineHeight: 1,
            }}
          >
            {String(stats.total_dialect_variants).padStart(2, '0')}
          </div>
        </div>

        <div>
          <span
            style={{
              fontFamily: 'var(--dp-typography-mono)',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--dp-color-on-field-muted)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '6px',
            }}
          >
            GRAPH NODES
          </span>
          <div
            style={{
              fontFamily: 'var(--dp-typography-mono)',
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--dp-color-on-field)',
              lineHeight: 1,
            }}
          >
            {String(stats.graph_nodes).padStart(3, '0')}
          </div>
        </div>

        <div>
          <span
            style={{
              fontFamily: 'var(--dp-typography-mono)',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--dp-color-on-field-muted)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '6px',
            }}
          >
            ETYMOLOGY EDGES
          </span>
          <div
            style={{
              fontFamily: 'var(--dp-typography-mono)',
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--dp-color-on-field)',
              lineHeight: 1,
            }}
          >
            {String(stats.graph_edges).padStart(3, '0')}
          </div>
        </div>

        <div>
          <span
            style={{
              fontFamily: 'var(--dp-typography-mono)',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--dp-color-accent)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '6px',
            }}
          >
            DSP PROFILES
          </span>
          <div
            style={{
              fontFamily: 'var(--dp-typography-mono)',
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--dp-color-accent)',
              lineHeight: 1,
            }}
          >
            {String(stats.acoustic_profiles_ready).padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Bank of Raised Hardware Navigation Keys with 12px gap & 12px 18px padding */}
      <nav
        className="chassis-nav-bank"
        aria-label="Instrument Navigation Bays"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          marginTop: '16px',
        }}
      >
        <button
          type="button"
          className={`raised-key ${activeTab === 'atlas' ? 'active' : ''}`}
          onClick={() => onTabChange('atlas')}
          style={{
            fontWeight: activeTab === 'atlas' ? 700 : 500,
            padding: '12px 18px',
          }}
        >
          <span className={`led-indicator ${activeTab === 'atlas' ? 'active' : ''}`} />
          <MapPin size={16} color="var(--dp-color-ink)" />
          <span>BAY 01 // ISOGLOSS ATLAS &amp; MORPHER</span>
        </button>

        <button
          type="button"
          className={`raised-key ${activeTab === 'graph' ? 'active' : ''}`}
          onClick={() => onTabChange('graph')}
          style={{
            fontWeight: activeTab === 'graph' ? 700 : 500,
            padding: '12px 18px',
          }}
        >
          <span className={`led-indicator ${activeTab === 'graph' ? 'active' : ''}`} />
          <Network size={16} color="var(--dp-color-ink)" />
          <span>BAY 02 // ETYMOLOGY GRAPH &amp; BRIDGE</span>
        </button>

        <button
          type="button"
          className={`raised-key ${activeTab === 'acoustic' ? 'active' : ''}`}
          onClick={() => onTabChange('acoustic')}
          style={{
            fontWeight: activeTab === 'acoustic' ? 700 : 500,
            padding: '12px 18px',
          }}
        >
          <span className={`led-indicator ${activeTab === 'acoustic' ? 'active' : ''}`} />
          <Activity size={16} color="var(--dp-color-ink)" />
          <span>BAY 03 // ACOUSTIC F0 OSCILLOSCOPE</span>
        </button>

        <button
          type="button"
          className={`raised-key ${activeTab === 'archive' ? 'active' : ''}`}
          onClick={() => onTabChange('archive')}
          style={{
            fontWeight: activeTab === 'archive' ? 700 : 500,
            padding: '12px 18px',
          }}
        >
          <span className={`led-indicator ${activeTab === 'archive' ? 'active' : ''}`} />
          <BookOpenCheck size={16} color="var(--dp-color-ink)" />
          <span>BAY 04 // LIVING FIELD ARCHIVE</span>
        </button>

        <button
          type="button"
          className={`raised-key ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => onTabChange('all')}
          style={{
            fontWeight: activeTab === 'all' ? 700 : 500,
            padding: '12px 18px',
            marginLeft: 'auto',
          }}
        >
          <span className={`led-indicator ${activeTab === 'all' ? 'active' : ''}`} />
          <Layers size={16} color="var(--dp-color-accent)" />
          <span>ALL BAYS (FULL CHASSIS VIEW)</span>
        </button>
      </nav>
    </header>
  );
};
export default WorkingSheetHeader;
