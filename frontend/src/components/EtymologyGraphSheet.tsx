import React, { useState, useEffect, useRef } from 'react';
import {
  Network,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ArrowLeftRight,
  GitBranch,
  Sparkles,
  Volume2,
} from 'lucide-react';
import {
  GraphNode,
  GraphEdge,
  ConstellationResponse,
  LinguisticBridgeResponse,
  TopologyResponse,
  swararekheApi,
  FALLBACK_CONSTELLATION,
  FALLBACK_BRIDGE,
  FALLBACK_TOPOLOGY,
} from '../api/swararekheClient';
import { hardwareSoundEngine } from '../utils/hardwareSoundEngine';

interface EtymologyGraphSheetProps {
  initialQuery?: string;
  activeRegionCode?: string;
  onSelectRegion?: (regionCode: string) => void;
}

const QUICK_CONCEPT_KEYS = [
  { label: 'GOOD / FINE', query: 'good' },
  { label: 'MUCH / BHAAL', query: 'bhaal' },
  { label: 'WHERE (ELLIGE)', query: 'where' },
  { label: 'EAT / MEAL', query: 'eat' },
  { label: 'MOTHER (AVVA)', query: 'mother' },
  { label: 'RAIN (MALE)', query: 'rain' },
  { label: 'QUICKLY (BEGA)', query: 'quickly' },
  { label: 'BOY (HUDUGA)', query: 'boy' },
];

const REGION_OPTIONS = [
  { code: 'hubballi_dharwad', label: 'Uttara Karnataka (Dharwad-Belagavi)', kannada: 'ಉತ್ತರ ಕರ್ನಾಟಕ' },
  { code: 'kundapura_mangaluru', label: 'Karavali (Kundapura-Mangaluru)', kannada: 'ಕರಾವಳಿ' },
  { code: 'kalaburagi_bidar', label: 'Kalyana Karnataka (Kalaburagi-Bidar)', kannada: 'ಕಲ್ಯಾಣ ಕರ್ನಾಟಕ' },
  { code: 'arebhashe_kodagu', label: 'Malnad & Kodagu (Arebhashe)', kannada: 'ಅರೆಭಾಷೆ' },
  { code: 'bengaluru_mysuru', label: 'Old Mysuru (Southern Karnataka)', kannada: 'ಹಳೆ ಮೈಸೂರು' },
];

interface NodePosition {
  x: number;
  y: number;
}

export const EtymologyGraphSheet: React.FC<EtymologyGraphSheetProps> = ({
  initialQuery = 'good',
  activeRegionCode = 'hubballi_dharwad',
}) => {
  // Constellation state
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [constellation, setConstellation] = useState<ConstellationResponse>(FALLBACK_CONSTELLATION);
  const [isLoadingConstellation, setIsLoadingConstellation] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<GraphEdge | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // SVG Pan & Zoom state
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Node Dragging state
  const [nodePositions, setNodePositions] = useState<Record<string, NodePosition>>({});
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Linguistic Bridge state
  const [sourceRegion, setSourceRegion] = useState(activeRegionCode || 'hubballi_dharwad');
  const [targetRegion, setTargetRegion] = useState(
    activeRegionCode === 'kalaburagi_bidar' ? 'hubballi_dharwad' : 'kalaburagi_bidar'
  );
  const [bridgeData, setBridgeData] = useState<LinguisticBridgeResponse>(FALLBACK_BRIDGE);
  const [isLoadingBridge, setIsLoadingBridge] = useState(false);

  // Interactive Cognate Shift Ledger selection & audio audition
  const [activeCognateIndex, setActiveCognateIndex] = useState<number | null>(null);
  const [playingShiftConcept, setPlayingShiftConcept] = useState<string | null>(null);

  // Topology Strip state
  const [topology, setTopology] = useState<TopologyResponse>(FALLBACK_TOPOLOGY);

  // Interactive Impulse Pulse Tracer state
  const [isPulsing, setIsPulsing] = useState<boolean>(false);
  const [pulsePhase, setPulsePhase] = useState<'idle' | 'center' | 'variants' | 'substrates'>('idle');
  const [pulseProgress, setPulseProgress] = useState<number>(0);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Generous SVG dimensions with wide radial margins
  const SVG_WIDTH = 1040;
  const SVG_HEIGHT = 640;
  const CENTER_X = SVG_WIDTH / 2;
  const CENTER_Y = SVG_HEIGHT / 2;

  const handleTriggerEtymologyPulse = () => {
    if (isPulsing) return;
    setIsPulsing(true);
    setPulsePhase('center');
    setPulseProgress(0);
    hardwareSoundEngine.playKeyClick();
    hardwareSoundEngine.playRelayLatch();

    const startTime = performance.now();
    const DURATION_MS = 2000;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / DURATION_MS);
      setPulseProgress(progress);

      if (progress < 0.28) {
        setPulsePhase('center');
      } else if (progress < 0.65) {
        setPulsePhase('variants');
      } else if (progress < 1.0) {
        setPulsePhase('substrates');
      } else {
        setIsPulsing(false);
        setPulsePhase('idle');
        setPulseProgress(0);
        return;
      }

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);

    // Audio milestone triggers during physical wave propagation
    setTimeout(() => {
      hardwareSoundEngine.playRotaryDetent();
    }, 550);

    setTimeout(() => {
      hardwareSoundEngine.playRelayLatch();
    }, 1300);
  };

  // Load initial graph data
  useEffect(() => {
    loadConstellation(searchQuery);
    loadBridge(sourceRegion, targetRegion);
    loadTopology();
  }, []);

  const loadConstellation = async (q: string) => {
    if (!q.trim()) return;
    setIsLoadingConstellation(true);
    try {
      const data = await swararekheApi.getConstellation(q.trim());
      setConstellation(data);
      const center = data.nodes.find((n) => n.id === data.matched_center_node_id) || data.nodes[0] || null;
      setSelectedNode(center);
      layoutGraph(data.nodes, data.edges, data.matched_center_node_id);
    } catch (err) {
      console.error('Failed to load constellation:', err);
    } finally {
      setIsLoadingConstellation(false);
    }
  };

  const loadBridge = async (src: string, tgt: string) => {
    setIsLoadingBridge(true);
    try {
      const data = await swararekheApi.getLinguisticBridge(src, tgt);
      setBridgeData(data);
    } catch (err) {
      console.error('Failed to load bridge:', err);
    } finally {
      setIsLoadingBridge(false);
    }
  };

  const loadTopology = async () => {
    try {
      const data = await swararekheApi.getGraphTopology();
      setTopology(data);
    } catch (err) {
      console.error('Failed to load topology:', err);
    }
  };

  // Helper to calculate approximate bounding box for collision repulsion
  const getNodeBoxDimensions = (node: GraphNode): { w: number; h: number } => {
    if (node.node_type === 'CONCEPT') {
      return { w: 96, h: 96 };
    }
    if (node.node_type === 'VARIANT') {
      const raw = node.label;
      const display = raw.length > 24 ? raw.slice(0, 22) + '…' : raw;
      const w = Math.min(190, Math.max(110, display.length * 7 + 28));
      const h = node.kannada_label ? 44 : 36;
      return { w, h };
    }
    if (node.node_type === 'REGION') {
      const short = node.label.split('/')[0].trim();
      const display = short.length > 20 ? short.slice(0, 18) + '…' : short;
      const w = Math.min(140, Math.max(90, display.length * 7 + 24));
      return { w, h: 36 };
    }
    if (node.node_type === 'INFLUENCE_LANG') {
      return { w: 116, h: 36 };
    }
    if (node.node_type === 'CULTURAL_MARKER') {
      return { w: 122, h: 36 };
    }
    return { w: 105, h: 36 };
  };

  // Organic radial layout with strict 72°/36° angular intervals & 30-iteration bounding-box repulsion
  const layoutGraph = (nodes: GraphNode[], _edges: GraphEdge[], centerId: string) => {
    const positions: Record<string, NodePosition> = {};

    const centerNode = nodes.find((n) => n.id === centerId) || nodes[0];
    if (centerNode) {
      positions[centerNode.id] = { x: CENTER_X, y: CENTER_Y };
    }

    const variants = nodes.filter((n) => n.node_type === 'VARIANT' && n.id !== centerId);
    const regions = nodes.filter((n) => n.node_type === 'REGION' && n.id !== centerId);
    const substrates = nodes.filter((n) => n.node_type === 'INFLUENCE_LANG' && n.id !== centerId);
    const cultural = nodes.filter((n) => n.node_type === 'CULTURAL_MARKER' && n.id !== centerId);
    const other = nodes.filter(
      (n) =>
        n.id !== centerId &&
        n.node_type !== 'VARIANT' &&
        n.node_type !== 'REGION' &&
        n.node_type !== 'INFLUENCE_LANG' &&
        n.node_type !== 'CULTURAL_MARKER'
    );

    // Inner orbit: VARIANT nodes at strict 72° (2π / 5) intervals around center
    const rVariant = 205;
    const numVariants = Math.max(1, variants.length);
    variants.forEach((v, idx) => {
      const angle = (idx * 2 * Math.PI) / numVariants - Math.PI / 2;
      positions[v.id] = {
        x: Math.round(CENTER_X + rVariant * Math.cos(angle)),
        y: Math.round(CENTER_Y + rVariant * Math.sin(angle)),
      };
    });

    // Middle orbit: REGION nodes offset by +36° (π / 5) so region boxes never sit directly along the same ray as variant boxes
    const rRegion = 315;
    const numRegions = Math.max(1, regions.length);
    regions.forEach((r, idx) => {
      const angle = (idx * 2 * Math.PI) / numRegions - Math.PI / 2 + Math.PI / 5;
      positions[r.id] = {
        x: Math.round(CENTER_X + rRegion * Math.cos(angle)),
        y: Math.round(CENTER_Y + rRegion * Math.sin(angle)),
      };
    });

    // Outer orbit: INFLUENCE_LANG & CULTURAL_MARKER
    const outerNodes = [...substrates, ...cultural, ...other];
    const rOuter = 425;
    const numOuter = Math.max(1, outerNodes.length);
    outerNodes.forEach((node, idx) => {
      const angle = (idx * 2 * Math.PI) / numOuter + Math.PI / 10;
      positions[node.id] = {
        x: Math.round(CENTER_X + rOuter * Math.cos(angle)),
        y: Math.round(CENTER_Y + rOuter * Math.sin(angle)),
      };
    });

    // 30-iteration bounding-box repulsion pass:
    // Ensures wide boxes (width > 180px) push apart vertically/horizontally by at least 18px padding
    // and NEVER overlap each other (fixing 'Laayk aipini' / 'Bhaal cholo aytri' & 'Karavali' / 'Cholo ulla')
    const PADDING = 18;
    const ITERATIONS = 30;

    const nodeBoxMap: Record<string, { w: number; h: number }> = {};
    nodes.forEach((n) => {
      nodeBoxMap[n.id] = getNodeBoxDimensions(n);
    });

    for (let iter = 0; iter < ITERATIONS; iter++) {
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];
        const posA = positions[nodeA.id];
        if (!posA) continue;
        const boxA = nodeBoxMap[nodeA.id];

        for (let j = i + 1; j < nodes.length; j++) {
          const nodeB = nodes[j];
          const posB = positions[nodeB.id];
          if (!posB) continue;
          const boxB = nodeBoxMap[nodeB.id];

          const reqDx = (boxA.w + boxB.w) / 2 + PADDING;
          const reqDy = (boxA.h + boxB.h) / 2 + PADDING;

          const dx = posB.x - posA.x;
          const dy = posB.y - posA.y;
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);

          if (absDx < reqDx && absDy < reqDy) {
            const overlapX = reqDx - absDx;
            const overlapY = reqDy - absDy;

            const isCenterA = nodeA.id === centerId;
            const isCenterB = nodeB.id === centerId;

            if (overlapX < overlapY) {
              const sign = dx >= 0 ? 1 : -1;
              const shift = overlapX * 0.5;
              if (!isCenterB) posB.x += shift * sign;
              if (!isCenterA) posA.x -= shift * sign;
            } else {
              const sign = dy >= 0 ? 1 : -1;
              const shift = overlapY * 0.5;
              if (!isCenterB) posB.y += shift * sign;
              if (!isCenterA) posA.y -= shift * sign;
            }
          }
        }
      }

      // Keep nodes bounded inside canvas & maintain clearance from center node
      nodes.forEach((node) => {
        if (node.id === centerId) {
          positions[node.id] = { x: CENTER_X, y: CENTER_Y };
          return;
        }
        const pos = positions[node.id];
        const box = nodeBoxMap[node.id];
        const minX = box.w / 2 + 16;
        const maxX = SVG_WIDTH - box.w / 2 - 16;
        const minY = box.h / 2 + 16;
        const maxY = SVG_HEIGHT - box.h / 2 - 16;

        pos.x = Math.max(minX, Math.min(maxX, pos.x));
        pos.y = Math.max(minY, Math.min(maxY, pos.y));

        const distCenter = Math.hypot(pos.x - CENTER_X, pos.y - CENTER_Y);
        if (distCenter < 112) {
          const angle = Math.atan2(pos.y - CENTER_Y, pos.x - CENTER_X) || (Math.PI / 4);
          pos.x = Math.round(CENTER_X + 115 * Math.cos(angle));
          pos.y = Math.round(CENTER_Y + 115 * Math.sin(angle));
        }
      });
    }

    setNodePositions(positions);
  };

  const getNodePos = (id: string): NodePosition => {
    return nodePositions[id] || { x: CENTER_X, y: CENTER_Y };
  };

  const handleZoomIn = () => {
    hardwareSoundEngine.playKeyClick();
    setZoom((prev) => Math.min(prev + 0.2, 2.4));
  };
  const handleZoomOut = () => {
    hardwareSoundEngine.playKeyClick();
    setZoom((prev) => Math.max(prev - 0.2, 0.6));
  };
  const handleResetView = () => {
    hardwareSoundEngine.playKeyClick();
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    layoutGraph(constellation.nodes, constellation.edges, constellation.matched_center_node_id);
  };

  const handleMouseDownSvg = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggingNodeId) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMoveSvg = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    } else if (draggingNodeId) {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const currentSvgX = (e.clientX - rect.left - pan.x) / zoom;
      const currentSvgY = (e.clientY - rect.top - pan.y) / zoom;
      setNodePositions((prev) => ({
        ...prev,
        [draggingNodeId]: {
          x: Math.round(currentSvgX - dragOffset.x),
          y: Math.round(currentSvgY - dragOffset.y),
        },
      }));
    }
  };

  const handleMouseUpSvg = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const pos = getNodePos(nodeId);
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clickSvgX = (e.clientX - rect.left - pan.x) / zoom;
    const clickSvgY = (e.clientY - rect.top - pan.y) / zoom;
    setDraggingNodeId(nodeId);
    setDragOffset({ x: clickSvgX - pos.x, y: clickSvgY - pos.y });
  };

  const handleSwapRegions = () => {
    hardwareSoundEngine.playKeyClick();
    const nextSrc = targetRegion;
    const nextTgt = sourceRegion;
    setSourceRegion(nextSrc);
    setTargetRegion(nextTgt);
    loadBridge(nextSrc, nextTgt);
  };

  const handleSelectCognateCard = (concept: string, idx: number) => {
    hardwareSoundEngine.playKeyClick();
    setActiveCognateIndex(idx);
    setSearchQuery(concept);
    loadConstellation(concept);
    handleTriggerEtymologyPulse();
  };

  const handleAuditionShift = (e: React.MouseEvent, concept: string) => {
    e.stopPropagation();
    hardwareSoundEngine.playKeyClick();
    setPlayingShiftConcept(concept);
    hardwareSoundEngine.playAcousticShift(sourceRegion, targetRegion, () => {
      setPlayingShiftConcept(null);
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
      {/* Bay Header */}
      <div className="chassis-bay-header">
        <span className="bay-indicator">
          <span className="led-indicator active" />
          <span>BAY 02</span>
        </span>
        <span>// ETYMOLOGY CONSTELLATION GRAPH &amp; LINGUISTIC BRIDGE BAY</span>
      </div>

      {/* Topology Strip inside Recessed Well */}
      <div
        className="recessed-well"
        style={{
          padding: '18px 22px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Network size={22} color="var(--dp-color-accent)" />
          <span
            style={{
              fontFamily: 'var(--dp-typography-mono)',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--dp-color-ink)',
              textTransform: 'uppercase',
            }}
          >
            NetworkX MultiDiGraph Active:
          </span>
          <span
            style={{
              fontFamily: 'var(--dp-typography-mono)',
              fontSize: '12px',
              backgroundColor: 'var(--dp-color-field)',
              color: 'var(--dp-color-on-field)',
              padding: '4px 10px',
              borderRadius: 'var(--dp-radius-key)',
              letterSpacing: '0.04em',
            }}
          >
            {topology.total_nodes} NODES // {topology.total_edges} EDGES
          </span>
        </div>

        {/* Centrality Hub Keys */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '11px', color: 'var(--dp-color-label)', fontWeight: 600 }}>
            CENTRALITY HUBS:
          </span>
          {topology.influence_centrality_ranking.slice(0, 5).map((rank) => (
            <button
              key={rank.id}
              type="button"
              className="raised-key"
              onClick={() => {
                setSearchQuery(rank.label);
                loadConstellation(rank.label);
              }}
              title={`Trace ego constellation for ${rank.label} (Betweenness: ${rank.betweenness_centrality})`}
              style={{
                fontSize: '12px',
                padding: '4px 10px',
                height: '28px',
              }}
            >
              <span>{rank.label}</span>
              <span style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '10px', color: 'var(--dp-color-accent)', marginLeft: '4px' }}>
                [{rank.degree}]
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          PANEL 02A: Concept Constellation Display Well (Upper Working Band)
         ========================================================================= */}
      <div className="recessed-well" style={{ padding: '28px 32px' }}>
        {/* Search Console & Quick Preset Concept Keys Toolbar */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            padding: '18px 22px',
            marginBottom: '24px',
            backgroundColor: 'var(--dp-color-raised)',
            border: '1px solid #9aa3a8',
            borderRadius: 'var(--dp-radius-key)',
          }}
        >
          <form
            className="constellation-search-form"
            onSubmit={(e) => {
              e.preventDefault();
              hardwareSoundEngine.playKeyClick();
              loadConstellation(searchQuery);
            }}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search root concept, English gloss, or dialect variant (e.g., 'good', 'bhaal', 'avva', 'rain')..."
              className="industrial-input"
              style={{
                width: '100%',
                fontSize: '15px',
                padding: '0 16px',
                height: '44px',
              }}
            />

            <button
              type="submit"
              disabled={isLoadingConstellation}
              className="raised-key"
              style={{
                position: 'static',
                width: 'auto',
                minWidth: 'max-content',
                padding: '10px 20px',
                margin: 0,
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                height: '44px',
                fontWeight: 700,
              }}
              title="Query NetworkX 2-hop ego-graph"
            >
              <Search size={16} color="var(--dp-color-accent)" />
              <span>{isLoadingConstellation ? 'EXPLORING...' : 'TRACE ROOTS'}</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerEtymologyPulse}
              disabled={isPulsing || isLoadingConstellation}
              className={`raised-key ${isPulsing ? 'active' : ''}`}
              style={{
                position: 'static',
                width: 'auto',
                minWidth: 'max-content',
                padding: '10px 20px',
                margin: 0,
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                height: '44px',
                fontWeight: 700,
                color: isPulsing ? 'var(--dp-color-accent)' : undefined,
              }}
              title="Propagate physical etymological impulse pulse from root concept through variant edges to substrate origins"
            >
              <Sparkles size={16} color="var(--dp-color-accent)" />
              <span>{isPulsing ? `IMPULSE: ${pulsePhase.toUpperCase()}` : 'TRACE ETYMOLOGY PULSE'}</span>
            </button>
          </form>

          {/* Preset Concept Keys Bank */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', paddingTop: '4px' }}>
            <span
              style={{
                fontFamily: 'var(--dp-typography-mono)',
                fontSize: '11px',
                color: 'var(--dp-color-label)',
                marginRight: '4px',
                fontWeight: 600,
              }}
            >
              EGO CENTERS:
            </span>
            {QUICK_CONCEPT_KEYS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                className="raised-key"
                onClick={() => {
                  hardwareSoundEngine.playKeyClick();
                  setSearchQuery(item.query);
                  loadConstellation(item.query);
                }}
                style={{ fontSize: '12px', padding: '4px 10px', height: '28px' }}
                title={`Trace constellation for '${item.label}'`}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Constellation Screen & 3 Spacious Sub-Cards (bay02-grid: 7fr 5fr) */}
        <div className="bay02-grid">
          {/* Recessed Dark Telemetry Display Screen */}
          <div
            className="recessed-field-screen"
            style={{
              position: 'relative',
              overflow: 'hidden',
              minHeight: '520px',
              height: '640px',
              cursor: isPanning ? 'grabbing' : 'grab',
            }}
          >
            {/* Screen Grid Pattern */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage:
                  'radial-gradient(rgba(216, 222, 225, 0.12) 1px, transparent 1px), linear-gradient(to right, rgba(216, 222, 225, 0.04) 1px, transparent 1px)',
                backgroundSize: '24px 24px, 100% 24px',
                pointerEvents: 'none',
              }}
            />

            {/* Screen Zoom & View Controls */}
            <div
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                zIndex: 10,
              }}
            >
              <div className="tooltip-wrap" style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="raised-icon-key"
                  onClick={handleZoomIn}
                  aria-label="Zoom in on constellation graph"
                  style={{ width: '32px', height: '32px', padding: '6px' }}
                >
                  <ZoomIn size={15} />
                </button>
                <span className="tooltip-bubble">ZOOM IN (+)</span>
              </div>

              <div className="tooltip-wrap" style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="raised-icon-key"
                  onClick={handleZoomOut}
                  aria-label="Zoom out of constellation graph"
                  style={{ width: '32px', height: '32px', padding: '6px' }}
                >
                  <ZoomOut size={15} />
                </button>
                <span className="tooltip-bubble">ZOOM OUT (-)</span>
              </div>

              <div className="tooltip-wrap" style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="raised-icon-key"
                  onClick={handleResetView}
                  aria-label="Reset graph view"
                  style={{ width: '32px', height: '32px', padding: '6px' }}
                >
                  <RotateCcw size={15} />
                </button>
                <span className="tooltip-bubble">RESET VIEW</span>
              </div>

              <div className="tooltip-wrap" style={{ position: 'relative' }}>
                <button
                  type="button"
                  className={`raised-icon-key ${isPulsing ? 'active' : ''}`}
                  onClick={handleTriggerEtymologyPulse}
                  disabled={isPulsing}
                  aria-label="Fire etymology impulse signal pulse"
                  style={{ width: '32px', height: '32px', padding: '6px' }}
                >
                  <Sparkles size={15} color="var(--dp-color-accent)" />
                </button>
                <span className="tooltip-bubble">TRACE IMPULSE PULSE</span>
              </div>
            </div>

            {/* Screen Legend */}
            <div
              style={{
                position: 'absolute',
                bottom: '14px',
                left: '14px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                backgroundColor: 'rgba(24, 30, 34, 0.92)',
                padding: '6px 12px',
                borderRadius: 'var(--dp-radius-key)',
                border: '1px solid #323a3f',
                fontSize: '11px',
                fontFamily: 'var(--dp-typography-mono)',
                zIndex: 10,
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--dp-color-accent)' }} />
                CONCEPT
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#f2f4f4' }} />
                VARIANT
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#f15b22' }} />
                SUBSTRATE
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#38bdf8' }} />
                CULTURAL
              </span>
            </div>

            {/* SVG Canvas Area */}
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
              onMouseDown={handleMouseDownSvg}
              onMouseMove={handleMouseMoveSvg}
              onMouseUp={handleMouseUpSvg}
              style={{ display: 'block', width: '100%', height: '100%' }}
            >
              <defs>
                <marker id="arrow-white" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#d8dee1" />
                </marker>
                <marker id="arrow-orange" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--dp-color-accent)" />
                </marker>
                <marker id="arrow-cyan" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                </marker>
              </defs>

              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {/* 1. Draw Edges with Focus / Dimming */}
                {constellation.edges.map((edge, idx) => {
                  const s = getNodePos(edge.source);
                  const t = getNodePos(edge.target);
                  
                  const isConnected =
                    (hoveredNodeId && (edge.source === hoveredNodeId || edge.target === hoveredNodeId)) ||
                    (selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id)) ||
                    (hoveredEdge && (edge.source === hoveredEdge.source && edge.target === hoveredEdge.target));
                  const hasFocus = Boolean(hoveredNodeId || selectedNode || hoveredEdge);
                  const edgeOpacity = hasFocus ? (isConnected ? 1.0 : 0.25) : 0.75;
                  const strokeWidth = isConnected ? 2.5 : 1.4;

                  let strokeColor = isConnected ? 'var(--dp-color-accent)' : '#606c74';
                  let markerEnd = isConnected ? 'url(#arrow-orange)' : 'url(#arrow-white)';

                  if (!isConnected) {
                    if (edge.relation === 'BORROWED_FROM') {
                      strokeColor = 'var(--dp-color-accent)';
                      markerEnd = 'url(#arrow-orange)';
                    } else if (edge.relation === 'CULTURAL_TIE' || edge.relation === 'COGNATE_WITH') {
                      strokeColor = '#38bdf8';
                      markerEnd = 'url(#arrow-cyan)';
                    }
                  }

                  const midX = (s.x + t.x) / 2;
                  const midY = (s.y + t.y) / 2;

                  const showEdgeBadge = Boolean(
                    isConnected ||
                    (isPulsing && pulsePhase !== 'idle')
                  );

                  return (
                    <g
                      key={`edge-${idx}`}
                      opacity={edgeOpacity}
                      onMouseEnter={() => setHoveredEdge(edge)}
                      onMouseLeave={() => setHoveredEdge(null)}
                      style={{ cursor: 'pointer', transition: 'opacity 140ms ease' }}
                    >
                      <line
                        x1={s.x}
                        y1={s.y}
                        x2={t.x}
                        y2={t.y}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={edge.relation === 'BORROWED_FROM' ? '5,3' : undefined}
                        markerEnd={markerEnd}
                      />
                      {showEdgeBadge && (
                        <g transform={`translate(${midX}, ${midY})`}>
                          <rect
                            x="-44"
                            y="-9"
                            width="88"
                            height="18"
                            rx="4"
                            fill="#181e22"
                            stroke={strokeColor}
                            strokeWidth="1"
                          />
                          <text
                            textAnchor="middle"
                            y="3"
                            fontSize="9"
                            fontFamily="var(--dp-typography-mono)"
                            fill="#f2f4f4"
                            fontWeight="600"
                          >
                            {edge.relation}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* 1.5 Interactive Etymology Impulse Wave & Traveling Energy Packets */}
                {isPulsing && (
                  <g pointerEvents="none">
                    {/* Tier 0: Concept Core Expanding Shockwave */}
                    {pulseProgress < 0.38 && (
                      <g>
                        <circle
                          cx={getNodePos(constellation.matched_center_node_id || constellation.nodes[0]?.id).x}
                          cy={getNodePos(constellation.matched_center_node_id || constellation.nodes[0]?.id).y}
                          r={44 + pulseProgress * 95}
                          fill="none"
                          stroke="var(--dp-color-accent)"
                          strokeWidth="3.2"
                          opacity={Math.max(0, 1 - pulseProgress * 2.6)}
                        />
                        <circle
                          cx={getNodePos(constellation.matched_center_node_id || constellation.nodes[0]?.id).x}
                          cy={getNodePos(constellation.matched_center_node_id || constellation.nodes[0]?.id).y}
                          r={32 + pulseProgress * 65}
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="2.0"
                          opacity={Math.max(0, 1 - pulseProgress * 2.8)}
                        />
                      </g>
                    )}

                    {/* Tier 1: Traveling Energy Packets (Concept -> Variants) */}
                    {pulseProgress >= 0.15 && pulseProgress <= 0.68 && (
                      <g>
                        {constellation.edges
                          .filter(
                            (e) =>
                              e.source === (constellation.matched_center_node_id || constellation.nodes[0]?.id) ||
                              e.target === (constellation.matched_center_node_id || constellation.nodes[0]?.id)
                          )
                          .map((edge, idx) => {
                            const centerId = constellation.matched_center_node_id || constellation.nodes[0]?.id;
                            const s = getNodePos(edge.source === centerId ? edge.source : edge.target);
                            const t = getNodePos(edge.source === centerId ? edge.target : edge.source);
                            const t1 = Math.max(0, Math.min(1, (pulseProgress - 0.15) / 0.5));
                            const px = s.x + (t.x - s.x) * t1;
                            const py = s.y + (t.y - s.y) * t1;

                            return (
                              <g key={`pulse-t1-${idx}`}>
                                <circle
                                  cx={px}
                                  cy={py}
                                  r="7"
                                  fill="var(--dp-color-accent)"
                                  stroke="#ffffff"
                                  strokeWidth="2"
                                />
                                <circle
                                  cx={px - (t.x - s.x) * 0.06}
                                  cy={py - (t.y - s.y) * 0.06}
                                  r="4.5"
                                  fill="var(--dp-color-accent)"
                                  opacity="0.65"
                                />
                              </g>
                            );
                          })}
                      </g>
                    )}

                    {/* Tier 2: Traveling Energy Packets (Variants -> Substrates / External) */}
                    {pulseProgress >= 0.48 && (
                      <g>
                        {constellation.edges
                          .filter(
                            (e) =>
                              e.source !== (constellation.matched_center_node_id || constellation.nodes[0]?.id) &&
                              e.target !== (constellation.matched_center_node_id || constellation.nodes[0]?.id)
                          )
                          .map((edge, idx) => {
                            const s = getNodePos(edge.source);
                            const t = getNodePos(edge.target);
                            const t2 = Math.max(0, Math.min(1, (pulseProgress - 0.48) / 0.5));
                            const px = s.x + (t.x - s.x) * t2;
                            const py = s.y + (t.y - s.y) * t2;

                            return (
                              <g key={`pulse-t2-${idx}`}>
                                <circle
                                  cx={px}
                                  cy={py}
                                  r="6.5"
                                  fill="#38bdf8"
                                  stroke="#ffffff"
                                  strokeWidth="1.8"
                                />
                                <circle
                                  cx={px - (t.x - s.x) * 0.06}
                                  cy={py - (t.y - s.y) * 0.06}
                                  r="4"
                                  fill="#38bdf8"
                                  opacity="0.65"
                                />
                              </g>
                            );
                          })}
                      </g>
                    )}
                  </g>
                )}

                {/* 2. Draw Nodes with Dark Pill Backdrops */}
                {constellation.nodes.map((node) => {
                  const pos = getNodePos(node.id);
                  const isSelected = selectedNode?.id === node.id;
                  const isHovered = hoveredNodeId === node.id;

                  if (node.node_type === 'CONCEPT') {
                    return (
                      <g
                        key={node.id}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        onClick={() => {
                          hardwareSoundEngine.playKeyClick();
                          setSelectedNode(node);
                        }}
                        onMouseEnter={() => setHoveredNodeId(node.id)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Halo during impulse initiation */}
                        {isPulsing && pulseProgress < 0.38 && (
                          <circle
                            r="50"
                            fill="none"
                            stroke="var(--dp-color-accent)"
                            strokeWidth="3.2"
                            opacity={0.9}
                          />
                        )}
                        <circle
                          r="44"
                          fill="#181e22"
                          stroke={isSelected || isHovered ? 'var(--dp-color-accent)' : '#606c74'}
                          strokeWidth={isSelected ? 3.5 : 2.0}
                          strokeDasharray="4,2"
                        />
                        <circle
                          r="38"
                          fill="#22292e"
                          stroke={isSelected ? 'var(--dp-color-accent)' : '#44515a'}
                          strokeWidth={1.5}
                        />
                        <rect
                          x="-42"
                          y="-24"
                          width="84"
                          height="48"
                          rx="6"
                          fill="#181e22"
                          fillOpacity="0.88"
                        />
                        <text
                          textAnchor="middle"
                          y="-6"
                          fontFamily="var(--dp-typography-sans)"
                          fontSize="15"
                          fontWeight="700"
                          fill="#ffffff"
                        >
                          {node.label}
                        </text>
                        {node.kannada_label && (
                          <text
                            textAnchor="middle"
                            y="12"
                            className="kannada-text"
                            fontSize="13"
                            fontWeight="700"
                            fill="var(--dp-color-accent)"
                          >
                            {node.kannada_label}
                          </text>
                        )}
                        <text
                          textAnchor="middle"
                          y="22"
                          fontSize="8"
                          fontFamily="var(--dp-typography-mono)"
                          fill="#a3abb0"
                          letterSpacing="0.5px"
                        >
                          EGO CENTER
                        </text>
                      </g>
                    );
                  }

                  if (node.node_type === 'VARIANT') {
                    const rawLabel = node.label;
                    let line1 = rawLabel;
                    let line2 = node.kannada_label || '';

                    if (rawLabel.includes('/') && !line2) {
                      const parts = rawLabel.split('/');
                      line1 = parts[0].trim();
                      line2 = parts.slice(1).join('/').trim();
                    } else if (rawLabel.length > 24) {
                      line1 = rawLabel.slice(0, 22) + '…';
                    }

                    const boxW = Math.min(190, Math.max(108, Math.max(line1.length, line2.length) * 6.8 + 24));
                    const boxH = line2 ? 42 : 34;

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        onClick={() => {
                          hardwareSoundEngine.playKeyClick();
                          setSelectedNode(node);
                        }}
                        onMouseEnter={() => setHoveredNodeId(node.id)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Halo during variants arrival */}
                        {isPulsing && pulseProgress >= 0.35 && pulseProgress <= 0.78 && (
                          <rect
                            x={-boxW / 2 - 4}
                            y={-boxH / 2 - 4}
                            width={boxW + 8}
                            height={boxH + 8}
                            rx="8"
                            fill="none"
                            stroke="var(--dp-color-accent)"
                            strokeWidth="2.5"
                            opacity={0.95}
                          />
                        )}
                        <rect
                          x={-boxW / 2}
                          y={-boxH / 2}
                          width={boxW}
                          height={boxH}
                          rx="6"
                          fill="#1a2024"
                          stroke={isSelected ? 'var(--dp-color-accent)' : isHovered ? '#f2f4f4' : '#4a565e'}
                          strokeWidth={isSelected ? 2.2 : 1.2}
                        />
                        <text
                          textAnchor="middle"
                          y={line2 ? -2 : 4}
                          fontFamily="var(--dp-typography-sans)"
                          fontSize="13"
                          fontWeight="700"
                          fill="#f2f4f4"
                        >
                          {line1}
                        </text>
                        {line2 && (
                          <text
                            textAnchor="middle"
                            y={13}
                            className="kannada-text"
                            fontSize="11"
                            fontWeight="600"
                            fill="#d8dee1"
                          >
                            {line2}
                          </text>
                        )}
                      </g>
                    );
                  }

                  if (node.node_type === 'REGION') {
                    const shortName = node.label.split('/')[0].trim();
                    const displayShort = shortName.length > 20 ? shortName.slice(0, 18) + '…' : shortName;
                    const boxW = Math.min(140, Math.max(90, displayShort.length * 7 + 24));
                    const boxH = 32;

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        onClick={() => {
                          hardwareSoundEngine.playKeyClick();
                          setSelectedNode(node);
                        }}
                        onMouseEnter={() => setHoveredNodeId(node.id)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Halo during outer substrate/region arrival */}
                        {isPulsing && pulseProgress >= 0.65 && (
                          <rect
                            x={-boxW / 2 - 4}
                            y={-boxH / 2 - 4}
                            width={boxW + 8}
                            height={boxH + 8}
                            rx="8"
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth="2.4"
                            opacity={0.95}
                          />
                        )}
                        <rect
                          x={-boxW / 2}
                          y={-boxH / 2}
                          width={boxW}
                          height={boxH}
                          rx="6"
                          fill="#161b1e"
                          stroke={isSelected ? '#ffffff' : isHovered ? 'var(--dp-color-accent)' : '#5a6872'}
                          strokeWidth={isSelected ? 2.0 : 1.0}
                        />
                        <text
                          textAnchor="middle"
                          y="4"
                          fontFamily="var(--dp-typography-mono)"
                          fontSize="11"
                          fontWeight="700"
                          fill="#d8dee1"
                        >
                          {displayShort}
                        </text>
                      </g>
                    );
                  }

                  if (node.node_type === 'INFLUENCE_LANG') {
                    return (
                      <g
                        key={node.id}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        onClick={() => {
                          hardwareSoundEngine.playKeyClick();
                          setSelectedNode(node);
                        }}
                        onMouseEnter={() => setHoveredNodeId(node.id)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Halo during substrate arrival */}
                        {isPulsing && pulseProgress >= 0.65 && (
                          <rect
                            x="-56"
                            y="-20"
                            width="112"
                            height="40"
                            rx="8"
                            fill="none"
                            stroke="var(--dp-color-accent)"
                            strokeWidth="2.4"
                            opacity={0.95}
                          />
                        )}
                        <rect
                          x="-52"
                          y="-16"
                          width="104"
                          height="32"
                          rx="6"
                          fill="#2a1b15"
                          stroke="var(--dp-color-accent)"
                          strokeWidth={isSelected ? 2.0 : 1.2}
                          strokeDasharray="4,2"
                        />
                        <text
                          textAnchor="middle"
                          y="5"
                          fontFamily="var(--dp-typography-mono)"
                          fontSize="12"
                          fontWeight="700"
                          fill="var(--dp-color-accent)"
                        >
                          ★ {node.label}
                        </text>
                      </g>
                    );
                  }

                  // CULTURAL_MARKER
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      onClick={() => {
                        hardwareSoundEngine.playKeyClick();
                        setSelectedNode(node);
                      }}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Halo during cultural marker arrival */}
                      {isPulsing && pulseProgress >= 0.65 && (
                        <rect
                          x="-60"
                          y="-20"
                          width="120"
                          height="40"
                          rx="8"
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2.4"
                          opacity={0.95}
                        />
                      )}
                      <rect
                        x="-56"
                        y="-16"
                        width="112"
                        height="32"
                        rx="6"
                        fill="#122530"
                        stroke="#38bdf8"
                        strokeWidth={isSelected ? 2.0 : 1.0}
                      />
                      <text
                        textAnchor="middle"
                        y="5"
                        fontFamily="var(--dp-typography-sans)"
                        fontSize="12"
                        fontWeight="600"
                        fill="#38bdf8"
                      >
                        ✦ {node.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* Right Column: 3 Spacious Sub-Cards (gap: 20px, padding: 22px each) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Card 1: Node Inspector Card (Shows full text on hover or click) */}
            {(() => {
              const activeDisplayNode = hoveredNodeId
                ? constellation.nodes.find((n) => n.id === hoveredNodeId) || selectedNode
                : selectedNode;

              return (
                <div
                  className="recessed-field-screen"
                  style={{
                    padding: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      paddingBottom: '8px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--dp-typography-mono)',
                        fontSize: '12px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: 'var(--dp-color-accent)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      ACTIVE NODE TELEMETRY
                    </span>
                    {activeDisplayNode && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontFamily: 'var(--dp-typography-mono)',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          padding: '2px 8px',
                          borderRadius: '3px',
                          color: 'var(--dp-color-on-field-muted)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {activeDisplayNode.node_type}
                      </span>
                    )}
                  </div>

                  {activeDisplayNode ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--dp-color-on-field)' }}>
                          {activeDisplayNode.label}
                        </span>
                      </div>

                      {activeDisplayNode.kannada_label && (
                        <div className="kannada-text" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--dp-color-accent)' }}>
                          {activeDisplayNode.kannada_label}
                        </div>
                      )}

                      {activeDisplayNode.metadata.ipa && (
                        <div style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '13px', color: '#38bdf8' }}>
                          IPA: <code>{activeDisplayNode.metadata.ipa}</code>
                        </div>
                      )}

                      {activeDisplayNode.metadata.rule && (
                        <div style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '11px', color: 'var(--dp-color-accent)' }}>
                          RULE: [{activeDisplayNode.metadata.rule}]
                        </div>
                      )}

                      {activeDisplayNode.metadata.era && (
                        <div style={{ fontSize: '12px', color: 'var(--dp-color-on-field-muted)' }}>
                          Era: {activeDisplayNode.metadata.era}
                        </div>
                      )}

                      {activeDisplayNode.metadata.description && (
                        <div style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--dp-color-on-field-muted)', lineHeight: '1.4' }}>
                          {activeDisplayNode.metadata.description}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '13px', color: 'var(--dp-color-on-field-muted)', fontStyle: 'italic' }}>
                      Select or hover any node in the constellation diagram to inspect phonological derivation rules, historical substrates, and IPA notation.
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Card 2: Etymological Commentary & Travelogue Narrative Card */}
            <div
              className="recessed-field-screen"
              style={{
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingBottom: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="var(--dp-color-accent)" />
                  <span style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--dp-color-on-field)' }}>
                    ETYMOLOGICAL COMMENTARY &amp; TRAJECTORY
                  </span>
                </div>
                <span style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '11px', color: 'var(--dp-color-label)' }}>
                  2-HOP EGO
                </span>
              </div>

              <div>
                <p style={{ fontSize: '15px', lineHeight: '1.65', color: 'var(--dp-color-on-field-muted)' }}>
                  {constellation.etymological_narrative}
                </p>
              </div>
            </div>

            {/* Card 3: Border Substrates & Hubs Card */}
            <div
              className="recessed-field-screen"
              style={{
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div
                style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingBottom: '8px',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--dp-typography-mono)',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--dp-color-accent)',
                    textTransform: 'uppercase',
                    display: 'block',
                  }}
                >
                  BORDER SUBSTRATE INFLUENCES:
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {constellation.substrate_influences.map((sub, sIdx) => (
                  <span
                    key={sIdx}
                    style={{
                      backgroundColor: 'rgba(241, 91, 34, 0.15)',
                      border: '1px solid var(--dp-color-accent)',
                      borderRadius: 'var(--dp-radius-key)',
                      padding: '4px 10px',
                      fontSize: '12px',
                      color: 'var(--dp-color-accent)',
                      fontFamily: 'var(--dp-typography-mono)',
                      fontWeight: 600,
                    }}
                  >
                    ★ {sub}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          PANEL 02B: Linguistic Bridge Comparator Deck (Lower Working Band)
         ========================================================================= */}
      <div className="recessed-well" style={{ padding: '28px 32px' }}>
        {/* Comparator Header & Region Selectors (4-Column Toolbar) */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            padding: '20px 24px',
            backgroundColor: 'var(--dp-color-raised)',
            border: '1px solid #9aa3a8',
            borderRadius: 'var(--dp-radius-key)',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GitBranch size={22} color="var(--dp-color-accent)" />
            <span
              style={{
                fontFamily: 'var(--dp-typography-mono)',
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--dp-color-ink)',
                textTransform: 'uppercase',
              }}
            >
              LINGUISTIC BRIDGE &amp; SUBSTRATE COMPARATOR
            </span>
            {isLoadingBridge && (
              <span style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '11px', color: 'var(--dp-color-accent)', fontWeight: 600 }}>
                [CALCULATING...]
              </span>
            )}
          </div>

          {/* Region Selector Keys & Swap Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <select
              value={sourceRegion}
              onChange={(e) => {
                setSourceRegion(e.target.value);
                loadBridge(e.target.value, targetRegion);
              }}
              className="industrial-select"
              style={{ height: '42px', padding: '0 14px', fontSize: '14px' }}
            >
              {REGION_OPTIONS.map((reg) => (
                <option key={`src-${reg.code}`} value={reg.code}>
                  SRC: {reg.label}
                </option>
              ))}
            </select>

            <div className="tooltip-wrap">
              <button
                type="button"
                className="raised-icon-key"
                onClick={handleSwapRegions}
                aria-label="Swap source and target regions"
                style={{ width: '38px', height: '38px', padding: '6px' }}
              >
                <ArrowLeftRight size={16} />
              </button>
              <span className="tooltip-bubble">SWAP REGIONS</span>
            </div>

            <select
              value={targetRegion}
              onChange={(e) => {
                setTargetRegion(e.target.value);
                loadBridge(sourceRegion, e.target.value);
              }}
              className="industrial-select"
              style={{ height: '42px', padding: '0 14px', fontSize: '14px' }}
            >
              {REGION_OPTIONS.map((reg) => (
                <option key={`tgt-${reg.code}`} value={reg.code}>
                  TGT: {reg.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Digital Readout Banner */}
        <div
          className="recessed-field-screen"
          style={{
            padding: '20px 24px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            marginBottom: '24px',
          }}
        >
          {/* Similarity Index Metric */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div
              style={{
                borderLeft: '4px solid var(--dp-color-accent)',
                paddingLeft: '14px',
              }}
            >
              <div style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '11px', color: 'var(--dp-color-on-field-muted)', textTransform: 'uppercase' }}>
                COGNATE ALIGNMENT SCORE
              </div>
              <div
                style={{
                  fontFamily: 'var(--dp-typography-mono)',
                  fontSize: '36px',
                  fontWeight: 800,
                  color: 'var(--dp-color-accent)',
                  lineHeight: '1.1',
                }}
              >
                {Math.round(bridgeData.similarity_index * 100)}%
              </div>
            </div>

            <div>
              <div style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '11px', color: 'var(--dp-color-on-field-muted)', textTransform: 'uppercase' }}>
                SOCIOLINGUISTIC SUMMARY:
              </div>
              <p style={{ fontSize: '14px', color: 'var(--dp-color-on-field)', maxWidth: '720px', lineHeight: '1.6', marginTop: '4px' }}>
                {bridgeData.bridge_summary}
              </p>
            </div>
          </div>

          {/* Substrates & Shortest Path */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '12px' }}>
              <span style={{ color: 'var(--dp-color-on-field-muted)' }}>SHARED SUBSTRATES: </span>
              <strong style={{ color: 'var(--dp-color-accent)' }}>
                {bridgeData.shared_substrates.length > 0 ? bridgeData.shared_substrates.join(', ') : 'DISTINCT LAYERS'}
              </strong>
            </div>

            {bridgeData.shortest_etymological_paths.length > 0 && (
              <div style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '12px', color: '#38bdf8' }}>
                PATH: {bridgeData.shortest_etymological_paths[0].join(' ➔ ')}
              </div>
            )}
          </div>
        </div>

        {/* 2-Column Responsive Grid of Cognate Cards (bay02-bridge-grid) */}
        <div>
          <div
            style={{
              fontFamily: 'var(--dp-typography-mono)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--dp-color-label)',
              textTransform: 'uppercase',
              marginBottom: '14px',
              padding: '0 4px',
            }}
          >
            SIDE-BY-SIDE LEXICAL COGNATE SHIFT LEDGER ({bridgeData.phonetic_shift_chain.length} CONCEPTS MOUNTED)
          </div>

          <div className="bay02-bridge-grid">
            {bridgeData.phonetic_shift_chain.map((item, idx) => {
              const isCardActive =
                activeCognateIndex === idx ||
                searchQuery.toLowerCase().trim() === item.concept.toLowerCase().trim();
              const isAuditioning = playingShiftConcept === item.concept;

              return (
                <div
                  key={idx}
                  onClick={() => handleSelectCognateCard(item.concept, idx)}
                  className={`removable-module ${isCardActive ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    padding: '20px 22px',
                    cursor: 'pointer',
                    border: isCardActive ? '1px solid var(--dp-color-accent)' : undefined,
                    boxShadow: isCardActive ? '0 0 14px rgba(241, 91, 34, 0.22)' : undefined,
                    transition: 'all 140ms ease',
                  }}
                >
                  {/* Top Row: English Meaning Title + Canonical Root + Audition Shift button */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                      borderBottom: '1px solid #c2c9cc',
                      paddingBottom: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`led-indicator ${isCardActive ? 'active' : ''}`} />
                      <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--dp-color-ink)' }}>
                        {item.concept}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontFamily: 'var(--dp-typography-mono)',
                          fontSize: '11px',
                          color: 'var(--dp-color-label)',
                          backgroundColor: 'var(--dp-color-raised)',
                          padding: '3px 8px',
                          borderRadius: 'var(--dp-radius-key)',
                          border: '1px solid #b6bec2',
                          fontWeight: 600,
                        }}
                      >
                        CANONICAL ROOT
                      </span>

                      <button
                        type="button"
                        className="raised-key"
                        onClick={(e) => handleAuditionShift(e, item.concept)}
                        title="Audition acoustic F0 pitch transition (Source -> 150ms -> Target)"
                        style={{
                          fontSize: '11px',
                          padding: '4px 10px',
                          height: '28px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: isAuditioning ? 'var(--dp-color-accent)' : undefined,
                        }}
                      >
                        <Volume2 size={13} color="var(--dp-color-accent)" />
                        <span>{isAuditioning ? 'SHIFTING...' : 'AUDITION SHIFT'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Comparison Body: Spacious 1fr auto 1fr row */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto 1fr',
                      gap: '12px',
                      alignItems: 'center',
                    }}
                  >
                    {/* Source Region Variant */}
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        padding: '14px 16px',
                        borderRadius: 'var(--dp-radius-key)',
                        border: '1px solid #cbd0d2',
                        borderLeft: '4px solid var(--dp-color-ink)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div
                        style={{
                          fontFamily: 'var(--dp-typography-mono)',
                          fontSize: '10px',
                          color: 'var(--dp-color-label)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        SRC: {REGION_OPTIONS.find((r) => r.code === sourceRegion)?.label.split('(')[0].trim() || 'SOURCE'}
                      </div>
                      <div
                        className="kannada-text"
                        style={{
                          fontSize: '20px',
                          fontWeight: 700,
                          color: 'var(--dp-color-ink)',
                          lineHeight: 1.25,
                        }}
                      >
                        {item.region_a_variant.script}
                      </div>
                      <div
                        style={{
                          fontSize: '15px',
                          fontWeight: 700,
                          color: 'var(--dp-color-accent)',
                          fontFamily: 'var(--dp-typography-sans)',
                        }}
                      >
                        {item.region_a_variant.phonetic}
                      </div>
                      {item.region_a_variant.rule && (
                        <div
                          style={{
                            fontFamily: 'var(--dp-typography-mono)',
                            fontSize: '10px',
                            color: 'var(--dp-color-label)',
                            marginTop: '2px',
                            backgroundColor: 'var(--dp-color-raised)',
                            padding: '2px 6px',
                            borderRadius: '2px',
                            width: 'fit-content',
                          }}
                        >
                          [{item.region_a_variant.rule}]
                        </div>
                      )}
                    </div>

                    {/* Transition Arrow */}
                    <div style={{ textAlign: 'center', color: 'var(--dp-color-accent)', fontWeight: 800, fontSize: '18px' }}>
                      ➔
                    </div>

                    {/* Target Region Variant */}
                    <div
                      style={{
                        backgroundColor: 'var(--dp-color-well)',
                        padding: '14px 16px',
                        borderRadius: 'var(--dp-radius-key)',
                        border: '1px solid #9aa3a8',
                        borderLeft: '4px solid var(--dp-color-accent)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div
                        style={{
                          fontFamily: 'var(--dp-typography-mono)',
                          fontSize: '10px',
                          color: 'var(--dp-color-label)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        TGT: {REGION_OPTIONS.find((r) => r.code === targetRegion)?.label.split('(')[0].trim() || 'TARGET'}
                      </div>
                      <div
                        className="kannada-text"
                        style={{
                          fontSize: '20px',
                          fontWeight: 700,
                          color: 'var(--dp-color-ink)',
                          lineHeight: 1.25,
                        }}
                      >
                        {item.region_b_variant.script}
                      </div>
                      <div
                        style={{
                          fontSize: '15px',
                          fontWeight: 700,
                          color: 'var(--dp-color-accent)',
                          fontFamily: 'var(--dp-typography-sans)',
                        }}
                      >
                        {item.region_b_variant.phonetic}
                      </div>
                      {item.region_b_variant.rule && (
                        <div
                          style={{
                            fontFamily: 'var(--dp-typography-mono)',
                            fontSize: '10px',
                            color: 'var(--dp-color-label)',
                            marginTop: '2px',
                            backgroundColor: 'var(--dp-color-raised)',
                            padding: '2px 6px',
                            borderRadius: '2px',
                            width: 'fit-content',
                          }}
                        >
                          [{item.region_b_variant.rule}]
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EtymologyGraphSheet;
