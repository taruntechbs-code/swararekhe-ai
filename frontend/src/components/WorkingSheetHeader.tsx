import React from 'react';
import {
  MapPin,
  Network,
  Activity,
  BookOpenCheck,
  RefreshCw,
  Compass,
} from 'lucide-react';
import { PlatformStatsResponse } from '../api/swararekheClient';

export type WorkspaceTab = 'atlas' | 'graph' | 'acoustic' | 'archive';

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
        borderBottom: 'var(--dp-border-fine-stroke) solid var(--dp-color-line)',
        padding: '24px 28px 18px 28px',
        backgroundColor: 'var(--dp-color-scrap)',
        position: 'relative',
      }}
    >
      <div className="tape-strip" aria-hidden="true" />

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        {/* Brand & Title */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Compass size={28} color="var(--dp-color-accent)" strokeWidth={2.2} />
            <h1
              style={{
                fontSize: '36px',
                letterSpacing: 0,
                color: 'var(--dp-color-ink)',
                display: 'inline-flex',
                alignItems: 'baseline',
                gap: '8px',
              }}
            >
              <span className="hand-underline-red">SWARAREKHE</span>
              <span
                className="kannada-text"
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: 'var(--dp-color-accent)',
                }}
              >
                (ಸ್ವರರೇಖೆ)
              </span>
            </h1>
          </div>
          <p
            style={{
              fontFamily: 'var(--dp-typography-reading-face)',
              fontSize: '20px',
              color: 'var(--dp-color-ink-muted)',
              marginTop: '4px',
            }}
          >
            Spatio-Acoustic Dialect & Cultural Graph Working Sheet • Namma Kannada
          </p>
        </div>

        {/* Live Platform Facts in a Drawn Bracket */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="drawn-bracket" title="Verified dialect field corpus counts">
            <strong>{stats.total_regions}</strong> Dialect Zones &bull;{' '}
            <strong>{stats.total_dialect_variants}</strong> Field Variants &bull;{' '}
            <strong>{stats.graph_nodes}</strong> Graph Nodes &bull;{' '}
            <strong>{stats.graph_edges}</strong> Etymological Edges &bull;{' '}
            <strong>{stats.acoustic_profiles_ready}</strong> Acoustic Profiles
          </div>

          <div className="tooltip-wrap">
            <button
              type="button"
              className="sketch-icon-btn"
              onClick={onRefreshStats}
              disabled={isLoadingStats}
              aria-label="Refresh platform statistics"
            >
              <RefreshCw
                size={18}
                className={isLoadingStats ? 'spin-anim' : ''}
              />
            </button>
            <span className="tooltip-bubble">Sync live platform stats</span>
          </div>
        </div>
      </div>

      {/* Workspace Navigation Tabs */}
      <nav
        aria-label="Workspace Views"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginTop: '18px',
        }}
      >
        <button
          type="button"
          className={`sketch-button ${activeTab === 'atlas' ? 'sketch-button-red' : ''}`}
          onClick={() => onTabChange('atlas')}
          style={{
            fontSize: '19px',
            padding: '6px 16px',
            fontWeight: activeTab === 'atlas' ? 700 : 500,
          }}
        >
          <MapPin size={18} strokeWidth={2.2} />
          <span>Isogloss Field Atlas &amp; Morpher</span>
        </button>

        <button
          type="button"
          className={`sketch-button ${activeTab === 'graph' ? 'sketch-button-red' : ''}`}
          onClick={() => onTabChange('graph')}
          style={{
            fontSize: '19px',
            padding: '6px 16px',
            fontWeight: activeTab === 'graph' ? 700 : 500,
          }}
        >
          <Network size={18} strokeWidth={2.2} />
          <span>Etymology Constellation Graph</span>
          <span
            style={{
              fontSize: '13px',
              fontFamily: 'var(--dp-typography-sans-face)',
              backgroundColor: 'var(--dp-color-highlight)',
              color: 'var(--dp-color-ink)',
              padding: '1px 6px',
              borderRadius: '4px',
            }}
          >
            Phase 7
          </span>
        </button>

        <button
          type="button"
          className={`sketch-button ${activeTab === 'acoustic' ? 'sketch-button-red' : ''}`}
          onClick={() => onTabChange('acoustic')}
          style={{
            fontSize: '19px',
            padding: '6px 16px',
            fontWeight: activeTab === 'acoustic' ? 700 : 500,
          }}
        >
          <Activity size={18} strokeWidth={2.2} />
          <span>Acoustic F0 Oscilloscope</span>
          <span
            style={{
              fontSize: '13px',
              fontFamily: 'var(--dp-typography-sans-face)',
              backgroundColor: 'var(--dp-color-highlight)',
              color: 'var(--dp-color-ink)',
              padding: '1px 6px',
              borderRadius: '4px',
            }}
          >
            Phase 8
          </span>
        </button>

        <button
          type="button"
          className={`sketch-button ${activeTab === 'archive' ? 'sketch-button-red' : ''}`}
          onClick={() => onTabChange('archive')}
          style={{
            fontSize: '19px',
            padding: '6px 16px',
            fontWeight: activeTab === 'archive' ? 700 : 500,
          }}
        >
          <BookOpenCheck size={18} strokeWidth={2.2} />
          <span>Living Field Archive</span>
          <span
            style={{
              fontSize: '13px',
              fontFamily: 'var(--dp-typography-sans-face)',
              backgroundColor: 'var(--dp-color-highlight)',
              color: 'var(--dp-color-ink)',
              padding: '1px 6px',
              borderRadius: '4px',
            }}
          >
            Phase 8
          </span>
        </button>
      </nav>
    </header>
  );
};
