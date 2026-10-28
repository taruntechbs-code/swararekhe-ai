import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MapPin,
  Compass,
  Volume2,
  Layers,
  Radio,
  Navigation,
} from 'lucide-react';
import {
  GeoJSONFeatureCollection,
  IsoglossLocateResponse,
} from '../api/swararekheClient';
import { hardwareSoundEngine } from '../utils/hardwareSoundEngine';

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

// 60FPS Client-Side IDW Engine (p = 2.0)
interface EpicenterBenchmark {
  code: string;
  name: string;
  lat: number;
  lng: number;
  basePitch: number;
  greetingKannada: string;
  greetingRoman: string;
  substrates: string[];
}

const EPICENTERS: EpicenterBenchmark[] = [
  {
    code: 'hubballi_dharwad',
    name: 'Uttara Karnataka / Dharwad-Belagavi',
    lat: 15.4589,
    lng: 75.0078,
    basePitch: 185.0,
    greetingKannada: 'ಆರಾಮ್ ಅದೀರೇನ್ರೀ ಪಾ?',
    greetingRoman: 'Aaraam adeerenri pa?',
    substrates: ['Marathi Contact', 'Sharana Vachana', 'Alveolar Flap'],
  },
  {
    code: 'kundapura_mangaluru',
    name: 'Karavali / Coastal Karnataka',
    lat: 13.6288,
    lng: 74.6920,
    basePitch: 175.0,
    greetingKannada: 'ಏನ್ ಮಾಣಿ, ಲಾಯ್ಕ್ ಅಂಡ್ ಪೋಯಿನಾ?',
    greetingRoman: 'Yen maani, laayk aand poyina?',
    substrates: ['Tulu Substrate', 'Halegannada Retention', 'Konkani Admixture'],
  },
  {
    code: 'kalaburagi_bidar',
    name: 'Kalyana Karnataka / North-East',
    lat: 17.3297,
    lng: 76.8343,
    basePitch: 142.0,
    greetingKannada: 'ಕುಶಲ್ ಅದೀರಾ ನೋಡ್ರಿ?',
    greetingRoman: 'Kushal adeeraa nodri?',
    substrates: ['Dakhni Urdu', 'Marathi Contact', 'Bahmani Persianate'],
  },
  {
    code: 'arebhashe_kodagu',
    name: 'Malnad / Arebhashe & Kodagu',
    lat: 12.4244,
    lng: 75.7382,
    basePitch: 160.0,
    greetingKannada: 'ಕೂಳು ತಿಂದ್ದಿರಾ, ಚೋಲೋ ಉಳ್ಳಿರ?',
    greetingRoman: 'Koolu tindira, cholo ullira?',
    substrates: ['Gowda Kannada', 'Kodava Takk Influence', 'Highland Accentuation'],
  },
  {
    code: 'bengaluru_mysuru',
    name: 'Old Mysuru / Southern Karnataka',
    lat: 12.9716,
    lng: 77.5946,
    basePitch: 150.0,
    greetingKannada: 'ಚೆನ್ನಾಗಿದ್ದೀರಾ ಸ್ವಾಮಿ?',
    greetingRoman: 'Chennaagiddeeraa swami?',
    substrates: ['Tamil Border Admixture', 'Courtly Hoysala Standard', 'Penultimate Stress'],
  },
];

function calculateRealtimeIDW(lat: number, lng: number): IsoglossLocateResponse {
  const items = EPICENTERS.map((epi) => {
    const dLat = (epi.lat - lat) * 111.0;
    const avgLatRad = ((epi.lat + lat) / 2) * (Math.PI / 180);
    const dLng = (epi.lng - lng) * 111.0 * Math.cos(avgLatRad);
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    const weight = 1.0 / Math.pow(Math.max(dist, 1.0), 2.0); // IDW p = 2.0
    return {
      epi,
      dist: Math.round(dist * 10) / 10,
      weight,
    };
  });

  const totalWeight = items.reduce((acc, it) => acc + it.weight, 0);
  const blends = items
    .map((it) => ({
      region_code: it.epi.code,
      region_name: it.epi.name,
      distance_km: it.dist,
      blend_percentage: Math.round((it.weight / totalWeight) * 1000) / 10,
    }))
    .sort((a, b) => b.blend_percentage - a.blend_percentage);

  const dominant = blends[0];
  const secondary = blends[1];
  const domEpi = EPICENTERS.find((e) => e.code === dominant.region_code)!;

  const interpolatedPitch =
    items.reduce((acc, it) => acc + it.weight * it.epi.basePitch, 0) / totalWeight;

  let zone:
    | 'Core Dialect Heartland'
    | 'Bi-Dialectal Isogloss Transition Belt'
    | 'Multi-Dialectal Convergence Zone';
  if (dominant.blend_percentage >= 65) {
    zone = 'Core Dialect Heartland';
  } else if (dominant.blend_percentage >= 40) {
    zone = 'Bi-Dialectal Isogloss Transition Belt';
  } else {
    zone = 'Multi-Dialectal Convergence Zone';
  }

  const secEpi = secondary ? EPICENTERS.find((e) => e.code === secondary.region_code) : null;
  const substrates = Array.from(
    new Set([
      ...domEpi.substrates,
      ...(secondary && secondary.blend_percentage > 18 && secEpi ? secEpi.substrates : []),
    ])
  );

  return {
    latitude: lat,
    longitude: lng,
    zone_classification: zone,
    dominant_region_code: dominant.region_code,
    secondary_region_code: secondary && secondary.blend_percentage > 18 ? secondary.region_code : undefined,
    blend_weights: blends,
    active_border_substrates: substrates,
    interpolated_greeting_local: domEpi.greetingKannada,
    interpolated_phrase_result: {
      source_phrase: 'Chennagiddeera?',
      morphed_dominant_roman: domEpi.greetingRoman,
      morphed_dominant_script: domEpi.greetingKannada,
      dominant_rules_applied: [`${domEpi.code}:primary_isogloss_centroid`],
      syllable_stress: `${domEpi.code}:standard_stress`,
      transition_notes:
        zone === 'Core Dialect Heartland'
          ? `Within the core linguistic hearth of ${domEpi.name}. High phonotactic consistency with minimal border interference.`
          : `Active dialect transition zone between ${domEpi.name} and ${secondary ? secondary.region_name : 'adjacent zones'}. Morphological suffixes and lexical loanwords show dynamic isogloss gradient.`,
    },
    acoustic_interpolated_pitch_hz: Math.round(interpolatedPitch * 10) / 10,
  };
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
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [liveCarrierActive, setLiveCarrierActive] = useState(false);
  const [liveLocationData, setLiveLocationData] = useState<IsoglossLocateResponse | null>(null);
  const [probeCoords, setProbeCoords] = useState<{ lat: number; lng: number } | null>(null);

  const isPointerDownRef = useRef(false);
  const lastDetentRegionRef = useRef<string | null>(null);

  // Sync probe coordinate when locationData arrives from server (if not scrubbing)
  useEffect(() => {
    if (!isPointerDownRef.current && locationData) {
      setProbeCoords({ lat: locationData.latitude, lng: locationData.longitude });
      setLiveLocationData(null);
    }
  }, [locationData]);

  // Clean up audio carrier if unmounted
  useEffect(() => {
    return () => {
      hardwareSoundEngine.stopCarrierTone();
    };
  }, []);

  const getCoordinatesFromEvent = (e: React.PointerEvent<SVGSVGElement> | React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const scaleX = MAP_WIDTH / rect.width;
    const scaleY = MAP_HEIGHT / rect.height;
    const svgX = clickX * scaleX;
    const svgY = clickY * scaleY;

    let lat = yToLat(svgY);
    let lng = xToLng(svgX);

    lat = Math.max(11.5, Math.min(18.6, lat));
    lng = Math.max(74.0, Math.min(78.6, lng));

    return {
      lat: Math.round(lat * 10000) / 10000,
      lng: Math.round(lng * 10000) / 10000,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.preventDefault();
    isPointerDownRef.current = true;
    setIsScrubbing(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const { lat, lng } = getCoordinatesFromEvent(e);
    setProbeCoords({ lat, lng });

    const live = calculateRealtimeIDW(lat, lng);
    setLiveLocationData(live);
    lastDetentRegionRef.current = live.dominant_region_code;

    if (liveCarrierActive) {
      hardwareSoundEngine.startCarrierTone(live.acoustic_interpolated_pitch_hz);
    } else {
      hardwareSoundEngine.playRotaryDetent();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isPointerDownRef.current) return;
    const { lat, lng } = getCoordinatesFromEvent(e);
    setProbeCoords({ lat, lng });

    const live = calculateRealtimeIDW(lat, lng);
    setLiveLocationData(live);

    // Play tick on region threshold transitions
    if (live.dominant_region_code !== lastDetentRegionRef.current) {
      lastDetentRegionRef.current = live.dominant_region_code;
      hardwareSoundEngine.playRotaryDetent();
    }

    if (liveCarrierActive) {
      hardwareSoundEngine.updateCarrierPitch(live.acoustic_interpolated_pitch_hz);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    setIsScrubbing(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (liveCarrierActive) {
      hardwareSoundEngine.stopCarrierTone();
    }
    hardwareSoundEngine.playKeyClick();

    const { lat, lng } = getCoordinatesFromEvent(e);
    onSelectCoordinate(lat, lng);
  };

  const handlePointerCancel = () => {
    if (isPointerDownRef.current) {
      isPointerDownRef.current = false;
      setIsScrubbing(false);
      if (liveCarrierActive) {
        hardwareSoundEngine.stopCarrierTone();
      }
    }
  };

  const handleToggleLiveCarrier = () => {
    const next = !liveCarrierActive;
    setLiveCarrierActive(next);
    if (!next) {
      hardwareSoundEngine.stopCarrierTone();
    }
    hardwareSoundEngine.playKeyClick();
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

  const activeData: IsoglossLocateResponse | null = liveLocationData || locationData;
  const currentProbe = probeCoords || (locationData ? { lat: locationData.latitude, lng: locationData.longitude } : null);

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

      {/* Two-Column Hardware Layout: Equal 6fr 6fr Grid (1fr 1fr, gap: 32px) */}
      <div className="bay01-grid">
        {/* Left Column: Recessed Dark Display Well with SVG Telemetry Map (padding: 24px) */}
        <div className="recessed-well" style={{ padding: '24px' }}>
          {/* Hardware Transceiver & Carrier Control Strip */}
          <div
            style={{
              marginBottom: '16px',
              padding: '12px 16px',
              backgroundColor: 'var(--dp-color-raised)',
              border: '1px solid #9aa3a8',
              borderRadius: 'var(--dp-radius-key)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={16} color="var(--dp-color-accent)" className={isScrubbing ? 'animate-pulse' : ''} />
              <span
                style={{
                  fontFamily: 'var(--dp-typography-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--dp-color-ink)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                TRANSCEIVER PROBE: {isScrubbing ? 'SCRUBBING ISOGLOSS (60 FPS)' : 'READY // CLICK & DRAG MAP'}
              </span>
            </div>

            {/* Toggleable Live Acoustic Carrier Switch */}
            <div className="tooltip-wrap">
              <button
                type="button"
                className={`raised-key ${liveCarrierActive ? 'active' : ''}`}
                onClick={handleToggleLiveCarrier}
                style={{
                  fontSize: '12px',
                  padding: '5px 12px',
                  height: '32px',
                  fontWeight: 600,
                  color: liveCarrierActive ? '#ffffff' : 'inherit',
                  backgroundColor: liveCarrierActive ? 'var(--dp-color-accent)' : undefined,
                }}
              >
                <Volume2 size={14} color={liveCarrierActive ? '#ffffff' : 'var(--dp-color-accent)'} />
                <span>CARRIER PITCH: {liveCarrierActive ? 'AUDIBLE (135–210 Hz)' : 'OFF'}</span>
              </button>
              <span className="tooltip-bubble">HEAR REGIONAL F0 RISE/FALL AS YOU DRAG</span>
            </div>
          </div>

          {/* Quick-Jump Dialect Survey Pins Bar */}
          <div
            style={{
              marginBottom: '16px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              alignItems: 'center',
              padding: '10px 14px',
              backgroundColor: 'var(--dp-color-raised)',
              border: '1px solid #b6bec2',
              borderRadius: 'var(--dp-radius-key)',
            }}
          >
            <span
              className="meta-label"
              style={{
                marginRight: '6px',
                marginBottom: 0,
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--dp-color-label)',
                whiteSpace: 'nowrap',
              }}
            >
              SURVEY PINS:
            </span>
            {SURVEY_TOWNS.map((town) => {
              const isSelected =
                activeData &&
                Math.abs(activeData.latitude - town.lat) < 0.05 &&
                Math.abs(activeData.longitude - town.lng) < 0.05;

              return (
                <button
                  key={town.name}
                  type="button"
                  className={`raised-key ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    hardwareSoundEngine.playKeyClick();
                    setProbeCoords({ lat: town.lat, lng: town.lng });
                    const live = calculateRealtimeIDW(town.lat, town.lng);
                    setLiveLocationData(live);
                    onSelectCoordinate(town.lat, town.lng);
                    if (town.type === 'hub') {
                      onSelectRegion(town.region);
                    }
                  }}
                  style={{
                    fontSize: '12px',
                    padding: '5px 10px',
                    height: '28px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <MapPin size={11} color={isSelected ? 'var(--dp-color-accent)' : 'var(--dp-color-ink)'} />
                  <span>{town.name}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive CRT/OLED Field Telemetry Screen with Draggable Transceiver Probe */}
          <div
            className="recessed-field-screen"
            style={{
              overflow: 'hidden',
              padding: '24px',
              position: 'relative',
              userSelect: 'none',
              touchAction: 'none',
            }}
          >
            <svg
              viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                backgroundColor: '#1b2125',
                cursor: isScrubbing ? 'grabbing' : 'crosshair',
                shapeRendering: 'geometricPrecision',
              }}
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

              {/* Territory Polygons with anti-aliased strokes */}
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
                    strokeWidth={isRegionActive ? 2.5 : 1.2}
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

              {/* Dialect Epicenter Hub Circles with Dark Backdrop Pill for Kannada Labels */}
              {pointFeatures.map((pt, idx) => {
                const [lng, lat] = pt.geometry.coordinates;
                const cx = lngToX(lng);
                const cy = latToY(lat);
                const isSelected = activeRegionCode === pt.properties.region_code;
                const kannadaLabel = pt.properties.kannada_name.split('/')[0].trim();
                const pillWidth = Math.max(kannadaLabel.length * 11 + 18, 90);

                return (
                  <g
                    key={`hub-${idx}`}
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      hardwareSoundEngine.playKeyClick();
                      setProbeCoords({ lat, lng });
                      const live = calculateRealtimeIDW(lat, lng);
                      setLiveLocationData(live);
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

                    {/* Dark pill backdrop behind Kannada label */}
                    <rect
                      x={cx + 10}
                      y={cy - 12}
                      width={pillWidth}
                      height="22"
                      rx="4"
                      fill="rgba(24, 30, 34, 0.88)"
                      stroke="#3a444a"
                      strokeWidth="0.8"
                    />
                    <text
                      x={cx + 18}
                      y={cy + 4}
                      className="kannada-text"
                      fontFamily="var(--dp-typography-kannada)"
                      fontSize="13"
                      fontWeight="700"
                      fill="#f2f4f4"
                    >
                      {kannadaLabel}
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

              {/* Tactile Draggable Transceiver Probe Crosshair */}
              {currentProbe && (
                <g pointerEvents="none">
                  {/* Outer Pulsing Reticle Ring */}
                  <circle
                    cx={lngToX(currentProbe.lng)}
                    cy={latToY(currentProbe.lat)}
                    r={isScrubbing ? 22 : 18}
                    fill="none"
                    stroke="var(--dp-color-accent)"
                    strokeWidth="1.8"
                    strokeDasharray="4,2"
                    style={{ transition: 'r 80ms ease' }}
                  />
                  {/* Core Reticle Ring */}
                  <circle
                    cx={lngToX(currentProbe.lng)}
                    cy={latToY(currentProbe.lat)}
                    r={7}
                    fill="var(--dp-color-accent)"
                    fillOpacity="0.3"
                    stroke="var(--dp-color-accent)"
                    strokeWidth="2"
                  />
                  {/* Center Dot */}
                  <circle
                    cx={lngToX(currentProbe.lng)}
                    cy={latToY(currentProbe.lat)}
                    r={2.5}
                    fill="#ffffff"
                  />
                  {/* Horizontal Crosshair Wires */}
                  <line
                    x1={lngToX(currentProbe.lng) - 26}
                    y1={latToY(currentProbe.lat)}
                    x2={lngToX(currentProbe.lng) - 9}
                    y2={latToY(currentProbe.lat)}
                    stroke="var(--dp-color-accent)"
                    strokeWidth="1.8"
                  />
                  <line
                    x1={lngToX(currentProbe.lng) + 9}
                    y1={latToY(currentProbe.lat)}
                    x2={lngToX(currentProbe.lng) + 26}
                    y2={latToY(currentProbe.lat)}
                    stroke="var(--dp-color-accent)"
                    strokeWidth="1.8"
                  />
                  {/* Vertical Crosshair Wires */}
                  <line
                    x1={lngToX(currentProbe.lng)}
                    y1={latToY(currentProbe.lat) - 26}
                    x2={lngToX(currentProbe.lng)}
                    y2={latToY(currentProbe.lat) - 9}
                    stroke="var(--dp-color-accent)"
                    strokeWidth="1.8"
                  />
                  <line
                    x1={lngToX(currentProbe.lng)}
                    y1={latToY(currentProbe.lat)}
                    x2={lngToX(currentProbe.lng)}
                    y2={latToY(currentProbe.lat) + 26}
                    stroke="var(--dp-color-accent)"
                    strokeWidth="1.8"
                  />

                  {/* Hardware Telemetry Badge next to Probe */}
                  <g transform={`translate(${Math.min(lngToX(currentProbe.lng) + 14, MAP_WIDTH - 145)}, ${Math.max(latToY(currentProbe.lat) - 30, 20)})`}>
                    <rect
                      x="0"
                      y="0"
                      width="135"
                      height="22"
                      rx="3"
                      fill="#181e22"
                      stroke="var(--dp-color-accent)"
                      strokeWidth="1"
                    />
                    <text
                      x="8"
                      y="15"
                      fill="#f2f4f4"
                      fontSize="9"
                      fontFamily="var(--dp-typography-mono)"
                      fontWeight="700"
                    >
                      PROBE // {currentProbe.lat.toFixed(2)}°N, {currentProbe.lng.toFixed(2)}°E
                    </text>
                  </g>
                </g>
              )}
            </svg>

            {/* Hover Tooltip Overlay on Screen */}
            {hoveredPoint && (
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  backgroundColor: 'rgba(24, 30, 34, 0.95)',
                  color: '#f2f4f4',
                  padding: '6px 12px',
                  borderRadius: 'var(--dp-radius-key)',
                  fontSize: '12px',
                  fontFamily: 'var(--dp-typography-mono)',
                  border: '1px solid #414b52',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                }}
              >
                {hoveredPoint.name} [{hoveredPoint.lat.toFixed(2)}°N, {hoveredPoint.lng.toFixed(2)}°E]
              </div>
            )}
          </div>

          {/* Coordinate Range Footer in Screen */}
          <div
            style={{
              marginTop: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontFamily: 'var(--dp-typography-mono)',
              fontSize: '11px',
              color: 'var(--dp-color-label)',
              letterSpacing: '0.04em',
            }}
          >
            <span>DRAG CROSSHAIR // REAL-TIME IDW CONTINUUM (60 FPS)</span>
            <span>BOUNDS // 11.5°N–18.6°N, 74.0°E–78.6°E</span>
          </div>
        </div>

        {/* Right Column: Spatial Telemetry & IDW Blend Readout (3 Distinct Sub-Blocks, gap: 20px, padding: 20px) */}
        <div className="recessed-well" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {isLoadingLocation && !activeData ? (
            <div
              className="recessed-field-screen"
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                minHeight: '340px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Compass size={36} style={{ animation: 'spin 2s linear infinite', color: 'var(--dp-color-accent)' }} />
              <p
                style={{
                  marginTop: '16px',
                  fontSize: '14px',
                  fontFamily: 'var(--dp-typography-mono)',
                  color: 'var(--dp-color-on-field-muted)',
                  letterSpacing: '0.04em',
                }}
              >
                CALCULATING SPATIAL IDW BLEND ACROSS COORDINATES...
              </p>
            </div>
          ) : activeData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* UNIFIED CRT CARD: Location Telemetry, Local Greeting & Transition Morph */}
              <div
                className="recessed-field-screen"
                style={{
                  padding: '20px 22px',
                  borderLeft: '4px solid var(--dp-color-accent)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {/* Header: Coordinates & Zone Classification */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Navigation size={15} color="var(--dp-color-accent)" />
                    <span style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em' }}>
                      LAT {activeData.latitude.toFixed(4)}°N, LNG {activeData.longitude.toFixed(4)}°E
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--dp-typography-mono)',
                      fontSize: '11px',
                      backgroundColor: 'rgba(241, 91, 34, 0.15)',
                      color: 'var(--dp-color-accent)',
                      padding: '3px 8px',
                      borderRadius: 'var(--dp-radius-key)',
                      border: '1px solid var(--dp-color-accent)',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {activeData.zone_classification}
                  </span>
                </div>

                {/* Primary Morphed Phrasing & Greeting */}
                <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div
                    style={{
                      fontFamily: 'var(--dp-typography-mono)',
                      fontSize: '11px',
                      color: 'var(--dp-color-on-field-muted)',
                      textTransform: 'uppercase',
                      marginBottom: '6px',
                    }}
                  >
                    INTERPOLATED LOCAL PHRASING:
                  </div>
                  <div
                    className="kannada-text"
                    style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: 'var(--dp-color-accent)',
                      lineHeight: 1.25,
                      marginBottom: '4px',
                    }}
                  >
                    {activeData.interpolated_phrase_result.morphed_dominant_script || activeData.interpolated_greeting_local}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--dp-typography-mono)',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--dp-color-on-field)',
                    }}
                  >
                    {activeData.interpolated_phrase_result.morphed_dominant_roman}
                  </div>
                </div>

                {/* Active Substrates Pills Row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', paddingTop: '4px' }}>
                  <span style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '10px', color: 'var(--dp-color-on-field-muted)', textTransform: 'uppercase' }}>
                    SUBSTRATES:
                  </span>
                  {activeData.active_border_substrates.map((sub, sIdx) => (
                    <span
                      key={sIdx}
                      style={{
                        fontFamily: 'var(--dp-typography-mono)',
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        color: 'var(--dp-color-on-field-muted)',
                        border: '1px solid #333d42',
                        fontWeight: 600,
                      }}
                    >
                      {sub}
                    </span>
                  ))}
                </div>

                {/* Concise 2-line Transition Commentary */}
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--dp-color-on-field-muted)',
                    lineHeight: '1.45',
                    margin: 0,
                    paddingTop: '6px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  {activeData.interpolated_phrase_result.transition_notes}
                </p>
              </div>

              {/* CARD 2: IDW Regional Blend Shares (P = 2.0) */}
              <div
                className="removable-module"
                style={{
                  backgroundColor: 'var(--dp-color-raised)',
                  padding: '20px 22px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '14px',
                    fontFamily: 'var(--dp-typography-mono)',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--dp-color-label)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={14} color="var(--dp-color-ink)" />
                    <span>IDW REGIONAL BLEND SHARES (P = 2.0)</span>
                  </span>
                  {isScrubbing && (
                    <span style={{ color: 'var(--dp-color-accent)', fontWeight: 700, fontSize: '10px' }}>
                      [LIVE 60FPS IDW]
                    </span>
                  )}
                </div>

                {/* 2-line row per region */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {activeData.blend_weights.map((blend) => {
                    const isDominant = blend.region_code === activeData.dominant_region_code;
                    return (
                      <div
                        key={blend.region_code}
                        style={{
                          marginBottom: '10px',
                          padding: '6px 10px',
                          backgroundColor: isDominant ? '#ffffff' : 'transparent',
                          borderRadius: 'var(--dp-radius-key)',
                          border: isDominant ? '1px solid #b6bec2' : '1px solid transparent',
                        }}
                      >
                        {/* Line 1: Region Name (left) and 47.9% • 132 km (right, nowrap) */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '13px',
                            marginBottom: '5px',
                          }}
                        >
                          <span style={{ fontWeight: isDominant ? 700 : 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className={`led-indicator ${isDominant ? 'active' : ''}`} />
                            <span>{blend.region_name}</span>
                          </span>
                          <span style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                            <strong style={{ color: isDominant ? 'var(--dp-color-accent)' : 'inherit' }}>
                              {blend.blend_percentage.toFixed(1)}%
                            </strong>{' '}
                            <span style={{ color: 'var(--dp-color-label)' }}>• {blend.distance_km} km</span>
                          </span>
                        </div>

                        {/* Line 2: Crisp 6px progress bar */}
                        <div
                          style={{
                            height: '6px',
                            backgroundColor: 'rgba(0, 0, 0, 0.08)',
                            borderRadius: '3px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${blend.blend_percentage}%`,
                              backgroundColor: isDominant ? 'var(--dp-color-accent)' : 'var(--dp-color-ink)',
                              borderRadius: '3px',
                              transition: 'width 80ms ease',
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
                    paddingTop: '12px',
                    borderTop: '1px solid #cbd0d2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontFamily: 'var(--dp-typography-mono)',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Volume2 size={14} color="var(--dp-color-accent)" />
                    <span style={{ color: 'var(--dp-color-label)' }}>INTERPOLATED F0 PITCH: </span>
                    <strong style={{ color: 'var(--dp-color-accent)' }}>
                      {activeData.acoustic_interpolated_pitch_hz.toFixed(1)} Hz
                    </strong>
                  </div>
                  {liveCarrierActive && (
                    <span style={{ color: 'var(--dp-color-accent)', fontSize: '10px', fontWeight: 700 }}>
                      [CARRIER ACTIVE]
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div
              className="recessed-field-screen"
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                minHeight: '340px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Compass size={36} color="var(--dp-color-label)" />
              <p
                style={{
                  marginTop: '16px',
                  fontSize: '14px',
                  fontFamily: 'var(--dp-typography-mono)',
                  color: 'var(--dp-color-on-field-muted)',
                  letterSpacing: '0.04em',
                }}
              >
                SELECT TELEMETRY STATION PIN OR CLICK/DRAG MAP TO INTERPOLATE
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IsoglossMapSheet;
