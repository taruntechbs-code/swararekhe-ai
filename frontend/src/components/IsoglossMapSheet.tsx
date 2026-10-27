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

    // Scale to viewBox
    const scaleX = MAP_WIDTH / rect.width;
    const scaleY = MAP_HEIGHT / rect.height;
    const svgX = clickX * scaleX;
    const svgY = clickY * scaleY;

    const lat = yToLat(svgY);
    const lng = xToLng(svgX);

    // Keep within bounds
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
    <section
      style={{
        padding: '24px 28px',
        borderBottom: 'var(--dp-border-fine-stroke) solid var(--dp-color-line)',
        backgroundColor: 'var(--dp-color-ground)',
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>1A. Field Isogloss Survey Map &bull; Spatial IDW Blend</span>
          <span
            style={{
              fontSize: '15px',
              fontFamily: 'var(--dp-typography-sans-face)',
              backgroundColor: 'var(--dp-color-highlight)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: 600,
            }}
          >
            Click map or pins to interpolate
          </span>
        </h2>
        <p style={{ color: 'var(--dp-color-ink-muted)', fontSize: '20px' }}>
          Inverse-Distance Weighting ($p=2.0$) interpolating dialect boundaries, active substrate waves, and transition corridors.
        </p>
      </div>

      {/* Two-Column Working Layout: Cartographic Sheet & Field Notes */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Hand-Drawn Cartographic Map on Taped Mount */}
        <div
          style={{
            backgroundColor: 'var(--dp-color-scrap)',
            border: 'var(--dp-border-fine-stroke) solid var(--dp-color-line)',
            borderRadius: 'var(--dp-radius-control)',
            padding: '16px',
            position: 'relative',
            boxShadow: '3px 4px 0 rgba(56, 53, 47, 0.09)',
          }}
        >
          <div className="tape-strip" aria-hidden="true" />

          {/* Quick Jump Town Swatches */}
          <div style={{ marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--dp-color-ink-muted)', alignSelf: 'center' }}>
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
                  className={`sketch-button ${isSelected ? 'sketch-button-red' : ''}`}
                  onClick={() => {
                    onSelectCoordinate(town.lat, town.lng);
                    if (town.type === 'hub') {
                      onSelectRegion(town.region);
                    }
                  }}
                  style={{
                    fontSize: '16px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                  }}
                >
                  <MapPin size={13} />
                  <span>{town.name}</span>
                  {town.type === 'transition' && (
                    <span style={{ fontSize: '11px', color: 'var(--dp-color-annotation)' }}>[belt]</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Interactive SVG Cartographic Map of Karnataka */}
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--dp-color-line)' }}>
            <svg
              viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                backgroundColor: '#fbf9f4',
                cursor: 'crosshair',
              }}
              onClick={handleMapClick}
              role="img"
              aria-label="Karnataka Dialect Isogloss Survey Map"
            >
              {/* Grid Lines */}
              <defs>
                <pattern id="pencilGrid" width="25" height="25" patternUnits="userSpaceOnUse">
                  <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(179, 172, 157, 0.25)" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#pencilGrid)" />

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
                    fillOpacity={isRegionActive ? 0.35 : 0.15}
                    stroke={poly.properties.stroke}
                    strokeWidth={isRegionActive ? 2.5 : 1.2}
                    strokeDasharray={isRegionActive ? 'none' : '4,2'}
                  />
                );
              })}

              {/* Isogloss Transition Corridors */}
              {lineFeatures.map((line, idx) => {
                const coords = line.geometry.coordinates;
                const pathStr = coords.map((pt: [number, number], i: number) => `${i === 0 ? 'M' : 'L'} ${lngToX(pt[0])} ${latToY(pt[1])}`).join(' ');

                return (
                  <g key={`corridor-${idx}`}>
                    <path
                      d={pathStr}
                      fill="none"
                      stroke={line.properties.stroke || '#EC4899'}
                      strokeWidth="2.5"
                      strokeDasharray="6,4"
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
                    {/* Pulsing ring if selected */}
                    {isSelected && (
                      <circle cx={cx} cy={cy} r={16} fill="none" stroke={pt.properties.color} strokeWidth="1.5" strokeDasharray="3,3" />
                    )}
                    <circle cx={cx} cy={cy} r={isSelected ? 9 : 7} fill={pt.properties.color} stroke="#38352f" strokeWidth="1.5" />
                    <text
                      x={cx + 12}
                      y={cy + 4}
                      fontFamily="var(--dp-typography-display-face)"
                      fontSize="14"
                      fontWeight="700"
                      fill="var(--dp-color-ink)"
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
                    <circle cx={cx} cy={cy} r={4} fill="var(--dp-color-annotation)" stroke="#38352f" strokeWidth="1" />
                    <text
                      x={cx + 6}
                      y={cy + 3}
                      fontFamily="var(--dp-typography-reading-face)"
                      fontSize="13"
                      fill="var(--dp-color-annotation)"
                    >
                      {town.name}
                    </text>
                  </g>
                );
              })}

              {/* Current Selected Location Crosshair */}
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

            {/* Hover Tooltip on SVG */}
            {hoveredPoint && (
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  backgroundColor: 'var(--dp-color-ink)',
                  color: '#fff',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'var(--dp-typography-sans-face)',
                }}
              >
                {hoveredPoint.name} ({hoveredPoint.lat.toFixed(2)}°N, {hoveredPoint.lng.toFixed(2)}°E)
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '16px',
              color: 'var(--dp-color-ink-muted)',
            }}
          >
            <span>Dashed pink line: Major dialect corridors</span>
            <span>Surveyed bounds: 11.5°N–18.6°N, 74.0°E–78.6°E</span>
          </div>
        </div>

        {/* Right Column: IDW Dialect Blend Ledger & Field Notes */}
        <div>
          {isLoadingLocation ? (
            <div className="paper-scrap" style={{ textAlign: 'center', padding: '40px' }}>
              <Compass size={32} className="spin-anim" color="var(--dp-color-accent)" />
              <p style={{ marginTop: '12px', fontSize: '20px' }}>
                Interpolating spatial isogloss blend across Karnataka coordinates...
              </p>
            </div>
          ) : locationData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Header Scrap: Coordinates & Zone Badge */}
              <div
                className="paper-scrap"
                style={{
                  borderLeft: '4px solid var(--dp-color-accent)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={20} color="var(--dp-color-accent)" />
                    <span style={{ fontSize: '22px', fontWeight: 700 }}>
                      Lat {locationData.latitude.toFixed(4)}°N, Lng {locationData.longitude.toFixed(4)}°E
                    </span>
                  </div>
                  <span
                    className="yellow-highlight"
                    style={{
                      fontFamily: 'var(--dp-typography-display-face)',
                      fontSize: '18px',
                      fontWeight: 700,
                      border: '1px solid var(--dp-color-ink)',
                    }}
                  >
                    {locationData.zone_classification}
                  </span>
                </div>

                {/* Local Greeting */}
                <div style={{ marginTop: '12px', padding: '8px 12px', backgroundColor: 'var(--dp-color-ground)', borderRadius: '6px' }}>
                  <span style={{ fontSize: '16px', color: 'var(--dp-color-ink-muted)', display: 'block' }}>
                    Contextual Greeting:
                  </span>
                  <span
                    className="kannada-text"
                    style={{ fontSize: '22px', fontWeight: 600, color: 'var(--dp-color-accent)' }}
                  >
                    {locationData.interpolated_greeting_local}
                  </span>
                </div>
              </div>

              {/* IDW Dialect Blend Ledger */}
              <div className="paper-scrap">
                <h3 style={{ fontSize: '22px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={18} color="var(--dp-color-annotation)" />
                  <span>IDW Regional Blend Shares ($p=2.0$)</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {locationData.blend_weights.map((blend) => {
                    const isDominant = blend.region_code === locationData.dominant_region_code;
                    return (
                      <div
                        key={blend.region_code}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          padding: '6px 8px',
                          backgroundColor: isDominant ? 'var(--dp-color-highlight)' : 'transparent',
                          borderRadius: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px' }}>
                          <span style={{ fontWeight: isDominant ? 700 : 500 }}>
                            {blend.region_name}
                          </span>
                          <span>
                            <strong>{blend.blend_percentage.toFixed(1)}%</strong>{' '}
                            <span style={{ fontSize: '15px', color: 'var(--dp-color-ink-muted)' }}>
                              ({blend.distance_km} km)
                            </span>
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div
                          style={{
                            height: '8px',
                            backgroundColor: 'rgba(179, 172, 157, 0.35)',
                            borderRadius: '4px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${blend.blend_percentage}%`,
                              backgroundColor: isDominant ? 'var(--dp-color-accent)' : 'var(--dp-color-ink)',
                              borderRadius: '4px',
                              transition: 'width var(--dp-motion-control) ease',
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
                    marginTop: '14px',
                    paddingTop: '10px',
                    borderTop: '1px dashed var(--dp-color-line)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    gap: '12px',
                    fontSize: '18px',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--dp-color-ink-muted)' }}>Active Border Substrates: </span>
                    <strong style={{ color: 'var(--dp-color-annotation)' }}>
                      {locationData.active_border_substrates.join(', ')}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Volume2 size={16} color="var(--dp-color-accent)" />
                    <span style={{ color: 'var(--dp-color-ink-muted)' }}>Interpolated Pitch: </span>
                    <strong>{locationData.acoustic_interpolated_pitch_hz.toFixed(1)} Hz</strong>
                  </div>
                </div>
              </div>

              {/* Hybrid Transition Field Notes */}
              <div
                className="paper-scrap"
                style={{
                  backgroundColor: '#fefcf8',
                  border: '1px solid var(--dp-color-line)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <GitBranch size={18} color="var(--dp-color-accent)" />
                  <h4 style={{ fontSize: '20px' }}>Field Notes &bull; Transition Morph</h4>
                </div>

                <p style={{ fontSize: '19px', color: 'var(--dp-color-ink-muted)' }}>
                  {locationData.interpolated_phrase_result.transition_notes}
                </p>

                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '17px', color: 'var(--dp-color-annotation)' }}>
                    Dominant Variant:
                  </span>
                  <span
                    className="kannada-text"
                    style={{ fontSize: '20px', fontWeight: 600, color: 'var(--dp-color-ink)' }}
                  >
                    {locationData.interpolated_phrase_result.morphed_dominant_script}
                  </span>
                  <span style={{ fontStyle: 'italic', fontSize: '18px' }}>
                    ({locationData.interpolated_phrase_result.morphed_dominant_roman})
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="paper-scrap" style={{ textAlign: 'center', padding: '40px' }}>
              <Compass size={36} color="var(--dp-color-line)" />
              <p style={{ marginTop: '12px', fontSize: '20px', color: 'var(--dp-color-ink-muted)' }}>
                Click anywhere on Karnataka's cartographic sheet to interpolate dialect weights.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
