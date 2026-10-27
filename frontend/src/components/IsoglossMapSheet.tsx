import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Compass,
  Volume2,
  GitBranch,
  Layers,
} from 'lucide-react';
import {
  GeoJSONFeatureCollection,
  IsoglossLocateResponse,
} from '../api/swararekheClient';

interface MapSheetProps {
  geoJson: GeoJSONFeatureCollection;
  locationData: IsoglossLocateResponse | null;
  isLoadingLocation: boolean;
  onSelectCoordinate: (lat: number, lng: number) => void;
  activeRegionCode: string;
  onSelectRegion: (regionCode: string) => void;
}

// Quick jump dialect survey stations
const SURVEY_TOWNS = [
  { name: 'Dharwad', district: 'Dharwad', lat: 15.4589, lng: 75.0078, region: 'hubballi_dharwad', type: 'hub' },
  { name: 'Kundapura', district: 'Udupi', lat: 13.6288, lng: 74.6920, region: 'kundapura_mangaluru', type: 'hub' },
  { name: 'Kalaburagi', district: 'Kalaburagi', lat: 17.3297, lng: 76.8343, region: 'kalaburagi_bidar', type: 'hub' },
  { name: 'Madikeri', district: 'Kodagu', lat: 12.4244, lng: 75.7382, region: 'arebhashe_kodagu', type: 'hub' },
  { name: 'Bengaluru', district: 'Bengaluru Urban', lat: 12.9716, lng: 77.5946, region: 'bengaluru_mysuru', type: 'hub' },
  { name: 'Davanagere', district: 'Davanagere', lat: 14.4644, lng: 75.9218, region: 'hubballi_dharwad', type: 'transition' },
  { name: 'Belagavi', district: 'Belagavi', lat: 15.8497, lng: 74.4977, region: 'hubballi_dharwad', type: 'transition' },
  { name: 'Hassan', district: 'Hassan', lat: 13.0072, lng: 76.1029, region: 'bengaluru_mysuru', type: 'transition' },
  { name: 'Shivamogga', district: 'Shivamogga', lat: 13.9299, lng: 75.5681, region: 'arebhashe_kodagu', type: 'transition' },
];

// Map Coordinate Transform
const MIN_LNG = 73.8;
const MAX_LNG = 78.8;
const MIN_LAT = 11.4;
const MAX_LAT = 18.7;
const MAP_WIDTH = 500;
const MAP_HEIGHT = 640;

function lngToX(lng: number): number {
  return ((lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * MAP_WIDTH;
}

function latToY(lat: number): number {
  return ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * MAP_HEIGHT;
}

function xToLng(x: number): number {
  return MIN_LNG + (x / MAP_WIDTH) * (MAX_LNG - MIN_LNG);
}

function yToLat(y: number): number {
  return MAX_LAT - (y / MAP_HEIGHT) * (MAX_LAT - MIN_LAT);
}

export const IsoglossMapSheet: React.FC<MapSheetProps> = ({
  geoJson,
  locationData,
  isLoadingLocation,
  onSelectCoordinate,
  activeRegionCode,
  onSelectRegion,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ name: string; lat: number; lng: number } | null>(null);

  // SVG Click Handler
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const scaleX = MAP_WIDTH / rect.width;
    const scaleY = MAP_HEIGHT / rect.height;
    const svgX = clickX * scaleX;
    const svgY = clickY * scaleY;

    const lat = yToLat(svgY);
    const lng = xToLng(svgX);

    if (lat >= 11.5 && lat <= 18.6 && lng >= 74.0 && lng <= 78.6) {
      onSelectCoordinate(Math.round(lat * 10000) / 10000, Math.round(lng * 10000) / 10000);
    }
  };

  // Extract features
  const pointFeatures = useMemo(
    () => geoJson.features.filter((f) => f.geometry.type === 'Point'),
    [geoJson]
  );
  const polygonFeatures = useMemo(
    () => geoJson.features.filter((f) => f.geometry.type === 'Polygon'),
    [geoJson]
  );
  const lineFeatures = useMemo(
    () => geoJson.features.filter((f) => f.geometry.type === 'LineString'),
    [geoJson]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Bay Header */}
      <div className="chassis-bay-header">
        <span className="bay-indicator">
          <span className="led-indicator active" />
          <span>BAY 01A</span>
        </span>
        <span>// GEOSPATIAL ISOGLOSS TELEMETRY &amp; SPATIAL IDW BLEND DECK</span>
      </div>

      {/* Two-Column Hardware Layout: Left Telemetry Display Screen & Right Readout Tray */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 'var(--dp-spacing-column-gap)',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Recessed Dark Display Well with SVG Telemetry Map */}
        <div className="recessed-well" style={{ padding: '16px' }}>
          {/* Bank of Raised Station Selector Keys */}
          <div style={{ marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            <span
              style={{
                fontFamily: 'var(--dp-typography-mono)',
                fontSize: 'var(--dp-typography-label)',
                fontWeight: 600,
                color: 'var(--dp-color-label)',
                textTransform: 'uppercase',
                marginRight: '4px',
              }}
            >
              Survey Pins:
            </span>
            {SURVEY_TOWNS.map((town) => {
              const isSelected =
                locationData &&
                Math.abs(locationData.latitude - town.lat) < 0.05 &&
                Math.abs(locationData.longitude - town.lng) < 0.05;

              return (
                <button
                  key={town.name}
                  type="button"
                  className={`raised-key ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    onSelectCoordinate(town.lat, town.lng);
                    if (town.type === 'hub') {
                      onSelectRegion(town.region);
                    }
                  }}
                  style={{
                    fontSize: '13px',
                    padding: '4px 10px',
                    height: '28px',
                  }}
                >
                  <MapPin size={12} color={isSelected ? 'var(--dp-color-accent)' : 'var(--dp-color-ink)'} />
                  <span>{town.name}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive CRT/OLED Field Telemetry Screen */}
          <div className="recessed-field-screen" style={{ overflow: 'hidden' }}>
            <svg
              viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                backgroundColor: '#1b2125',
                cursor: 'crosshair',
              }}
              onClick={handleMapClick}
              role="img"
              aria-label="Karnataka Dialect Isogloss Survey Map"
            >
              {/* Technical Telemetry Grid Lines */}
              <defs>
                <pattern id="hardwareGrid" width="25" height="25" patternUnits="userSpaceOnUse">
                  <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(216, 222, 225, 0.08)" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#hardwareGrid)" />

              {/* Territory Polygons */}
              {polygonFeatures.map((poly, idx) => {
                const ring = poly.geometry.coordinates[0];
                const pointsStr = ring.map((pt: [number, number]) => `${lngToX(pt[0])},${latToY(pt[1])}`).join(' ');
                const isRegionActive = activeRegionCode === poly.properties.region_code;

                return (
                  <polygon
                    key={idx}
                    points={pointsStr}
                    fill={poly.properties.fill}
                    fillOpacity={isRegionActive ? 0.35 : 0.12}
                    stroke={isRegionActive ? 'var(--dp-color-accent)' : poly.properties.stroke}
                    strokeWidth={isRegionActive ? 2.2 : 1.0}
                    strokeDasharray={isRegionActive ? 'none' : '4,2'}
                  />
                );
              })}

              {/* Isogloss Transition Corridors */}
              {lineFeatures.map((line, idx) => {
                const coords = line.geometry.coordinates;
                const pathStr = coords
                  .map((pt: [number, number], i: number) => `${i === 0 ? 'M' : 'L'} ${lngToX(pt[0])} ${latToY(pt[1])}`)
                  .join(' ');

                return (
                  <g key={`corridor-${idx}`}>
                    <path
                      d={pathStr}
                      fill="none"
                      stroke="#f15b22"
                      strokeWidth="2.0"
                      strokeDasharray="5,3"
                      strokeLinecap="round"
                    />
                  </g>
                );
              })}

              {/* Dialect Epicenter Hub Circles */}
              {pointFeatures.map((pt, idx) => {
                const [lng, lat] = pt.geometry.coordinates;
                const cx = lngToX(lng);
                const cy = latToY(lat);
                const isSelected = activeRegionCode === pt.properties.region_code;

                return (
                  <g
                    key={`hub-${idx}`}
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCoordinate(lat, lng);
                      onSelectRegion(pt.properties.region_code);
                    }}
                    onMouseEnter={() => setHoveredPoint({ name: pt.properties.name, lat, lng })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    {isSelected && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={16}
                        fill="none"
                        stroke="var(--dp-color-accent)"
                        strokeWidth="1.5"
                        strokeDasharray="3,3"
                      />
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? 8 : 6}
                      fill={isSelected ? 'var(--dp-color-accent)' : '#f2f4f4'}
                      stroke="#111518"
                      strokeWidth="1.5"
                    />
                    <text
                      x={cx + 12}
                      y={cy + 4}
                      fontFamily="var(--dp-typography-sans)"
                      fontSize="13"
                      fontWeight="700"
                      fill="#f2f4f4"
                    >
                      {pt.properties.kannada_name.split('/')[0]}
                    </text>
                  </g>
                );
              })}

              {/* Survey Town Dots */}
              {SURVEY_TOWNS.filter((t) => t.type === 'transition').map((town, idx) => {
                const cx = lngToX(town.lng);
                const cy = latToY(town.lat);
                return (
                  <g key={`town-${idx}`}>
                    <circle cx={cx} cy={cy} r={3.5} fill="#d8dee1" stroke="#111518" strokeWidth="1" />
                    <text
                      x={cx + 6}
                      y={cy + 3}
                      fontFamily="var(--dp-typography-mono)"
                      fontSize="11"
                      fill="#d8dee1"
                    >
                      {town.name}
                    </text>
                  </g>
                );
              })}

              {/* Selected Location Crosshair */}
              {locationData && (
                <g>
                  <circle
                    cx={lngToX(locationData.longitude)}
                    cy={latToY(locationData.latitude)}
                    r={14}
                    fill="none"
                    stroke="var(--dp-color-accent)"
                    strokeWidth="2"
                    strokeDasharray="4,2"
                  />
                  <line
                    x1={lngToX(locationData.longitude) - 18}
                    y1={latToY(locationData.latitude)}
                    x2={lngToX(locationData.longitude) + 18}
                    y2={latToY(locationData.latitude)}
                    stroke="var(--dp-color-accent)"
                    strokeWidth="1.5"
                  />
                  <line
                    x1={lngToX(locationData.longitude)}
                    y1={latToY(locationData.latitude) - 18}
                    x2={lngToX(locationData.longitude)}
                    y2={latToY(locationData.latitude) + 18}
                    stroke="var(--dp-color-accent)"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx={lngToX(locationData.longitude)}
                    cy={latToY(locationData.latitude)}
                    r={3.5}
                    fill="var(--dp-color-accent)"
                  />
                </g>
              )}
            </svg>

            {/* Hover Tooltip Overlay on Screen */}
            {hoveredPoint && (
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  backgroundColor: 'rgba(24, 30, 34, 0.95)',
                  color: '#f2f4f4',
                  padding: '4px 10px',
                  borderRadius: 'var(--dp-radius-key)',
                  fontSize: '12px',
                  fontFamily: 'var(--dp-typography-mono)',
                  border: '1px solid #414b52',
                }}
              >
                {hoveredPoint.name} [{hoveredPoint.lat.toFixed(2)}°N, {hoveredPoint.lng.toFixed(2)}°E]
              </div>
            )}
          </div>

          {/* Coordinate Range Footer in Screen */}
          <div
            style={{
              marginTop: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontFamily: 'var(--dp-typography-mono)',
              fontSize: '11px',
              color: 'var(--dp-color-label)',
            }}
          >
            <span>DASHED LINE // MAJOR ISOGLOSS CORRIDORS</span>
            <span>BOUNDS // 11.5°N–18.6°N, 74.0°E–78.6°E</span>
          </div>
        </div>

        {/* Right Column: IDW Dialect Blend Ledger Tray */}
        <div className="recessed-well" style={{ padding: '16px' }}>
          {isLoadingLocation ? (
            <div
              className="recessed-field-screen"
              style={{ textAlign: 'center', padding: '40px 20px', minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
            >
              <Compass size={32} style={{ animation: 'spin 2s linear infinite', color: 'var(--dp-color-accent)' }} />
              <p style={{ marginTop: '14px', fontSize: '15px', fontFamily: 'var(--dp-typography-mono)', color: 'var(--dp-color-on-field-muted)' }}>
                CALCULATING SPATIAL IDW BLEND ACROSS COORDINATES...
              </p>
            </div>
          ) : locationData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Header Telemetry Badge */}
              <div
                className="recessed-field-screen"
                style={{
                  padding: '14px 16px',
                  borderLeft: '4px solid var(--dp-color-accent)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={16} color="var(--dp-color-accent)" />
                    <span style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '14px', fontWeight: 600 }}>
                      LAT {locationData.latitude.toFixed(4)}°N, LNG {locationData.longitude.toFixed(4)}°E
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--dp-typography-mono)',
                      fontSize: '11px',
                      backgroundColor: 'rgba(241, 91, 34, 0.15)',
                      color: 'var(--dp-color-accent)',
                      padding: '2px 8px',
                      borderRadius: 'var(--dp-radius-key)',
                      border: '1px solid var(--dp-color-accent)',
                      fontWeight: 600,
                    }}
                  >
                    {locationData.zone_classification}
                  </span>
                </div>

                {/* Local Greeting */}
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <span style={{ fontSize: '12px', fontFamily: 'var(--dp-typography-mono)', color: 'var(--dp-color-on-field-muted)', display: 'block' }}>
                    INTERPOLATED GREETING:
                  </span>
                  <span
                    className="kannada-text"
                    style={{ fontSize: '20px', fontWeight: 700, color: 'var(--dp-color-accent)' }}
                  >
                    {locationData.interpolated_greeting_local}
                  </span>
                </div>
              </div>

              {/* IDW Dialect Blend Matrix */}
              <div
                className="removable-module"
                style={{ backgroundColor: 'var(--dp-color-raised)', padding: '14px 16px' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                    fontFamily: 'var(--dp-typography-mono)',
                    fontSize: 'var(--dp-typography-label)',
                    fontWeight: 600,
                    color: 'var(--dp-color-label)',
                    textTransform: 'uppercase',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={14} color="var(--dp-color-ink)" />
                    <span>IDW REGIONAL BLEND SHARES (P = 2.0)</span>
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {locationData.blend_weights.map((blend) => {
                    const isDominant = blend.region_code === locationData.dominant_region_code;
                    return (
                      <div
                        key={blend.region_code}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '3px',
                          padding: '6px 8px',
                          backgroundColor: isDominant ? '#ffffff' : 'transparent',
                          borderRadius: 'var(--dp-radius-key)',
                          border: isDominant ? '1px solid #b6bec2' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                          <span style={{ fontWeight: isDominant ? 700 : 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className={`led-indicator ${isDominant ? 'active' : ''}`} />
                            <span>{blend.region_name}</span>
                          </span>
                          <span style={{ fontFamily: 'var(--dp-typography-mono)' }}>
                            <strong style={{ color: isDominant ? 'var(--dp-color-accent)' : 'inherit' }}>
                              {blend.blend_percentage.toFixed(1)}%
                            </strong>{' '}
                            <span style={{ fontSize: '12px', color: 'var(--dp-color-label)' }}>
                              [{blend.distance_km} km]
                            </span>
                          </span>
                        </div>

                        {/* Segmented Meter Bar */}
                        <div
                          style={{
                            height: '6px',
                            backgroundColor: 'rgba(0, 0, 0, 0.1)',
                            borderRadius: '2px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${blend.blend_percentage}%`,
                              backgroundColor: isDominant ? 'var(--dp-color-accent)' : 'var(--dp-color-ink)',
                              borderRadius: '2px',
                              transition: 'width var(--dp-motion-key) ease',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Substrates & Interpolated Pitch */}
                <div
                  style={{
                    marginTop: '12px',
                    paddingTop: '8px',
                    borderTop: '1px solid #cbd0d2',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    gap: '10px',
                    fontFamily: 'var(--dp-typography-mono)',
                    fontSize: '12px',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--dp-color-label)' }}>SUBSTRATES: </span>
                    <strong>{locationData.active_border_substrates.join(', ')}</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Volume2 size={13} color="var(--dp-color-accent)" />
                    <span style={{ color: 'var(--dp-color-label)' }}>PITCH BASELINE: </span>
                    <strong style={{ color: 'var(--dp-color-accent)' }}>
                      {locationData.acoustic_interpolated_pitch_hz.toFixed(1)} Hz
                    </strong>
                  </div>
                </div>
              </div>

              {/* Hybrid Transition Field Notes */}
              <div
                className="removable-module"
                style={{ backgroundColor: '#ffffff', padding: '14px 16px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <GitBranch size={15} color="var(--dp-color-accent)" />
                  <span style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '11px', fontWeight: 600, color: 'var(--dp-color-label)', textTransform: 'uppercase' }}>
                    TRANSITION MORPH TELEMETRY
                  </span>
                </div>

                <p style={{ fontSize: '14px', color: 'var(--dp-color-ink)', lineHeight: '1.4' }}>
                  {locationData.interpolated_phrase_result.transition_notes}
                </p>

                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '11px', color: 'var(--dp-color-label)' }}>
                    DOMINANT:
                  </span>
                  <span
                    className="kannada-text"
                    style={{ fontSize: '18px', fontWeight: 700, color: 'var(--dp-color-ink)' }}
                  >
                    {locationData.interpolated_phrase_result.morphed_dominant_script}
                  </span>
                  <span style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '14px', color: 'var(--dp-color-label)' }}>
                    [{locationData.interpolated_phrase_result.morphed_dominant_roman}]
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="recessed-field-screen"
              style={{ textAlign: 'center', padding: '40px 20px', minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
            >
              <Compass size={36} color="var(--dp-color-label)" />
              <p style={{ marginTop: '14px', fontSize: '14px', fontFamily: 'var(--dp-typography-mono)', color: 'var(--dp-color-on-field-muted)' }}>
                SELECT TELEMETRY STATION PIN OR CLICK MAP TO INTERPOLATE
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default IsoglossMapSheet;
