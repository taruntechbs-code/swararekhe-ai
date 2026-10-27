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

  // Topology Strip state
  const [topology, setTopology] = useState<TopologyResponse>(FALLBACK_TOPOLOGY);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // SVG dimensions
  const SVG_WIDTH = 840;
  const SVG_HEIGHT = 520;
  const CENTER_X = SVG_WIDTH / 2;
  const CENTER_Y = SVG_HEIGHT / 2;

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

  // Organic radial / force-inspired layout
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

    // Inner orbit: VARIANT nodes
    const rVariant = 145;
    variants.forEach((v, idx) => {
      const angle = (idx / Math.max(1, variants.length)) * Math.PI * 2 - Math.PI / 2;
      positions[v.id] = {
        x: Math.round(CENTER_X + rVariant * Math.cos(angle)),
        y: Math.round(CENTER_Y + rVariant * Math.sin(angle)),
      };
    });

    // Middle orbit: REGION nodes (placed in compass directions corresponding to geographical zones)
    const geoAngles: Record<string, number> = {
      'region:hubballi_dharwad': -Math.PI * 0.75, // NW
      'region:kundapura_mangaluru': -Math.PI * 0.95, // W
      'region:kalaburagi_bidar': -Math.PI * 0.25, // NE
      'region:arebhashe_kodagu': Math.PI * 0.65, // SW
      'region:bengaluru_mysuru': Math.PI * 0.35, // SE
    };

    const rRegion = 215;
    regions.forEach((r, idx) => {
      const angle = geoAngles[r.id] ?? (idx / Math.max(1, regions.length)) * Math.PI * 2 + Math.PI / 4;
      positions[r.id] = {
        x: Math.round(CENTER_X + rRegion * Math.cos(angle)),
        y: Math.round(CENTER_Y + rRegion * Math.sin(angle)),
      };
    });

    // Outer orbit: INFLUENCE_LANG & CULTURAL_MARKER
    const outerNodes = [...substrates, ...cultural, ...other];
    const rOuter = 265;
    outerNodes.forEach((node, idx) => {
      const angle = (idx / Math.max(1, outerNodes.length)) * Math.PI * 2 + Math.PI / 6;
      positions[node.id] = {
        x: Math.round(CENTER_X + rOuter * Math.cos(angle)),
        y: Math.round(CENTER_Y + rOuter * Math.sin(angle)),
      };
    });

    setNodePositions(positions);
  };

  const getNodePos = (id: string): NodePosition => {
    return nodePositions[id] || { x: CENTER_X, y: CENTER_Y };
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 2.4));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.6));
  const handleResetView = () => {
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
    const nextSrc = targetRegion;
    const nextTgt = sourceRegion;
    setSourceRegion(nextSrc);
    setTargetRegion(nextTgt);
    loadBridge(nextSrc, nextTgt);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
          padding: '14px 18px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Network size={20} color="var(--dp-color-accent)" />
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
              padding: '2px 8px',
              borderRadius: 'var(--dp-radius-key)',
            }}
          >
            {topology.total_nodes} NODES // {topology.total_edges} EDGES
          </span>
        </div>

        {/* Centrality Hub Keys */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '11px', color: 'var(--dp-color-label)' }}>
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
                padding: '3px 8px',
                height: '26px',
              }}
            >
              <span>{rank.label}</span>
              <span style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '10px', color: 'var(--dp-color-accent)' }}>
                [{rank.degree}]
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          PANEL 02A: Concept Constellation Display Well (Upper Working Band)
         ========================================================================= */}
      <div className="recessed-well" style={{ padding: '20px' }}>
        {/* Search Console & Quick Preset Concept Keys */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadConstellation(searchQuery);
            }}
            style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search root concept, English gloss, or dialect variant (e.g., 'good', 'bhaal', 'avva')..."
              className="industrial-input"
              style={{ flex: 1, fontSize: '16px', padding: '10px 14px' }}
            />

            <button
              type="submit"
              disabled={isLoadingConstellation}
              className="raised-key"
              style={{ minWidth: '140px', height: '42px', fontWeight: 700 }}
              title="Query NetworkX 2-hop ego-graph"
            >
              <Search size={16} color="var(--dp-color-accent)" />
              <span>{isLoadingConstellation ? 'EXPLORING...' : 'TRACE ROOTS'}</span>
            </button>
          </form>

          {/* Preset Concept Keys Bank */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontFamily: 'var(--dp-typography-mono)',
                fontSize: '11px',
                color: 'var(--dp-color-label)',
                marginRight: '2px',
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
                  setSearchQuery(item.query);
                  loadConstellation(item.query);
                }}
                style={{ fontSize: '12px', padding: '3px 8px', height: '26px' }}
                title={`Trace constellation for '${item.label}'`}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Constellation Screen & Adjacent Stable Readout Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(520px, 1.6fr) minmax(320px, 1fr)',
            gap: 'var(--dp-spacing-column-gap)',
            alignItems: 'stretch',
          }}
        >
          {/* Recessed Dark Telemetry Display Screen */}
          <div
            className="recessed-field-screen"
            style={{
              position: 'relative',
              overflow: 'hidden',
              minHeight: '480px',
              height: '520px',
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
                top: '12px',
                right: '12px',
                display: 'flex',
                gap: '6px',
                zIndex: 10,
              }}
            >
              <div className="tooltip-wrap">
                <button
                  type="button"
                  className="raised-icon-key"
                  onClick={handleZoomIn}
                  aria-label="Zoom in on constellation graph"
                  style={{ width: '30px', height: '30px', padding: '4px' }}
                >
                  <ZoomIn size={14} />
                </button>
                <span className="tooltip-bubble">ZOOM IN (+)</span>
              </div>

              <div className="tooltip-wrap">
                <button
                  type="button"
                  className="raised-icon-key"
                  onClick={handleZoomOut}
                  aria-label="Zoom out of constellation graph"
                  style={{ width: '30px', height: '30px', padding: '4px' }}
                >
                  <ZoomOut size={14} />
                </button>
                <span className="tooltip-bubble">ZOOM OUT (-)</span>
              </div>

              <div className="tooltip-wrap">
                <button
                  type="button"
                  className="raised-icon-key"
                  onClick={handleResetView}
                  aria-label="Reset graph view"
                  style={{ width: '30px', height: '30px', padding: '4px' }}
                >
                  <RotateCcw size={14} />
                </button>
                <span className="tooltip-bubble">RESET VIEW</span>
              </div>
            </div>

            {/* Screen Legend */}
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                backgroundColor: 'rgba(24, 30, 34, 0.9)',
                padding: '5px 10px',
                borderRadius: 'var(--dp-radius-key)',
                border: '1px solid #323a3f',
                fontSize: '11px',
                fontFamily: 'var(--dp-typography-mono)',
                zIndex: 10,
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--dp-color-accent)' }} />
                CONCEPT
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#f2f4f4' }} />
                VARIANT
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#f15b22' }} />
                SUBSTRATE
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
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
                {/* 1. Draw Edges */}
                {constellation.edges.map((edge, idx) => {
                  const s = getNodePos(edge.source);
                  const t = getNodePos(edge.target);
                  const isHovered =
                    hoveredEdge?.source === edge.source && hoveredEdge?.target === edge.target;

                  let strokeColor = '#606c74';
                  let markerEnd = 'url(#arrow-white)';
                  if (edge.relation === 'BORROWED_FROM') {
                    strokeColor = 'var(--dp-color-accent)';
                    markerEnd = 'url(#arrow-orange)';
                  } else if (edge.relation === 'CULTURAL_TIE' || edge.relation === 'COGNATE_WITH') {
                    strokeColor = '#38bdf8';
                    markerEnd = 'url(#arrow-cyan)';
                  }

                  const midX = (s.x + t.x) / 2;
                  const midY = (s.y + t.y) / 2;

                  return (
                    <g
                      key={`edge-${idx}`}
                      onMouseEnter={() => setHoveredEdge(edge)}
                      onMouseLeave={() => setHoveredEdge(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      <line
                        x1={s.x}
                        y1={s.y}
                        x2={t.x}
                        y2={t.y}
                        stroke={strokeColor}
                        strokeWidth={isHovered ? 2.5 : 1.4}
                        strokeDasharray={edge.relation === 'BORROWED_FROM' ? '5,3' : undefined}
                        markerEnd={markerEnd}
                      />
                      {(isHovered || edge.relation === 'BORROWED_FROM') && (
                        <g transform={`translate(${midX}, ${midY})`}>
                          <rect
                            x="-44"
                            y="-9"
                            width="88"
                            height="18"
                            rx="2"
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

                {/* 2. Draw Nodes */}
                {constellation.nodes.map((node) => {
                  const pos = getNodePos(node.id);
                  const isSelected = selectedNode?.id === node.id;

                  if (node.node_type === 'CONCEPT') {
                    return (
                      <g
                        key={node.id}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        onClick={() => setSelectedNode(node)}
                        onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <circle
                          r="42"
                          fill="#181e22"
                          stroke="var(--dp-color-accent)"
                          strokeWidth={isSelected ? 3.5 : 2.0}
                          strokeDasharray="4,2"
                        />
                        <circle
                          r="36"
                          fill="#283238"
                          stroke="#48555e"
                          strokeWidth={1.5}
                        />
                        <text
                          textAnchor="middle"
                          y="-5"
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
                            y="14"
                            className="kannada-text"
                            fontSize="14"
                            fontWeight="700"
                            fill="var(--dp-color-accent)"
                          >
                            {node.kannada_label}
                          </text>
                        )}
                        <text
                          textAnchor="middle"
                          y="26"
                          fontSize="9"
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
                    const boxW = Math.max(90, (node.label.length + (node.kannada_label?.length || 0)) * 6.2);
                    return (
                      <g
                        key={node.id}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        onClick={() => setSelectedNode(node)}
                        onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <rect
                          x={-boxW / 2}
                          y="-18"
                          width={boxW}
                          height="36"
                          rx="4"
                          fill="#252d32"
                          stroke={isSelected ? 'var(--dp-color-accent)' : '#4a565e'}
                          strokeWidth={isSelected ? 2.0 : 1.0}
                        />
                        <text
                          textAnchor="middle"
                          y="-1"
                          fontFamily="var(--dp-typography-sans)"
                          fontSize="14"
                          fontWeight="700"
                          fill="#f2f4f4"
                        >
                          {node.label}
                        </text>
                        {node.kannada_label && (
                          <text
                            textAnchor="middle"
                            y="13"
                            className="kannada-text"
                            fontSize="12"
                            fontWeight="600"
                            fill="#d8dee1"
                          >
                            {node.kannada_label}
                          </text>
                        )}
                      </g>
                    );
                  }

                  if (node.node_type === 'REGION') {
                    const shortName = node.label.split('/')[0].trim();
                    return (
                      <g
                        key={node.id}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        onClick={() => setSelectedNode(node)}
                        onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <rect
                          x="-50"
                          y="-14"
                          width="100"
                          height="28"
                          rx="3"
                          fill="#181e22"
                          stroke={isSelected ? '#ffffff' : '#5a6872'}
                          strokeWidth={isSelected ? 2.0 : 1.0}
                        />
                        <text
                          textAnchor="middle"
                          y="4"
                          fontFamily="var(--dp-typography-mono)"
                          fontSize="12"
                          fontWeight="700"
                          fill="#d8dee1"
                        >
                          {shortName}
                        </text>
                      </g>
                    );
                  }

                  if (node.node_type === 'INFLUENCE_LANG') {
                    return (
                      <g
                        key={node.id}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        onClick={() => setSelectedNode(node)}
                        onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <rect
                          x="-48"
                          y="-14"
                          width="96"
                          height="28"
                          rx="3"
                          fill="#2a1b15"
                          stroke="var(--dp-color-accent)"
                          strokeWidth={isSelected ? 2.0 : 1.2}
                          strokeDasharray="4,2"
                        />
                        <text
                          textAnchor="middle"
                          y="4"
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
                      onClick={() => setSelectedNode(node)}
                      onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <rect
                        x="-52"
                        y="-14"
                        width="104"
                        height="28"
                        rx="3"
                        fill="#122530"
                        stroke="#38bdf8"
                        strokeWidth={isSelected ? 2.0 : 1.0}
                      />
                      <text
                        textAnchor="middle"
                        y="4"
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

          {/* Adjacent Stable Field Readout Sheet */}
          <div
            className="recessed-field-screen"
            style={{
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              overflowY: 'auto',
              maxHeight: '520px',
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
                <span style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase' }}>
                  ETYMOLOGICAL COMMENTARY
                </span>
              </div>
              <span style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '11px', color: 'var(--dp-color-label)' }}>
                2-HOP EGO
              </span>
            </div>

            {/* Travelogue Narrative */}
            <div>
              <p style={{ fontSize: '14px', lineHeight: '1.45', color: 'var(--dp-color-on-field-muted)' }}>
                {constellation.etymological_narrative}
              </p>
            </div>

            {/* Active Substrate Influence Tags */}
            <div>
              <span
                style={{
                  fontFamily: 'var(--dp-typography-mono)',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--dp-color-accent)',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                BORDER SUBSTRATE INFLUENCES:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {constellation.substrate_influences.map((sub, sIdx) => (
                  <span
                    key={sIdx}
                    style={{
                      backgroundColor: 'rgba(241, 91, 34, 0.15)',
                      border: '1px solid var(--dp-color-accent)',
                      borderRadius: 'var(--dp-radius-key)',
                      padding: '2px 8px',
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

            {/* Selected Node Metadata Inspector */}
            {selectedNode && (
              <div
                style={{
                  backgroundColor: '#181e22',
                  border: '1px solid #323a3f',
                  borderRadius: 'var(--dp-radius-key)',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--dp-color-on-field)' }}>
                    {selectedNode.label}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: 'var(--dp-typography-mono)',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      padding: '2px 6px',
                      borderRadius: '2px',
                      color: 'var(--dp-color-on-field-muted)',
                    }}
                  >
                    {selectedNode.node_type}
                  </span>
                </div>

                {selectedNode.kannada_label && (
                  <div className="kannada-text" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--dp-color-accent)' }}>
                    {selectedNode.kannada_label}
                  </div>
                )}

                {selectedNode.metadata.ipa && (
                  <div style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '12px', color: '#38bdf8' }}>
                    IPA: <code>{selectedNode.metadata.ipa}</code>
                  </div>
                )}

                {selectedNode.metadata.rule && (
                  <div style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '11px', color: 'var(--dp-color-accent)' }}>
                    RULE: [{selectedNode.metadata.rule}]
                  </div>
                )}

                {selectedNode.metadata.era && (
                  <div style={{ fontSize: '12px', color: 'var(--dp-color-on-field-muted)' }}>
                    Era: {selectedNode.metadata.era}
                  </div>
                )}

                {selectedNode.metadata.description && (
                  <div style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--dp-color-on-field-muted)' }}>
                    {selectedNode.metadata.description}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          PANEL 02B: Linguistic Bridge Comparator Deck (Lower Working Band)
         ========================================================================= */}
      <div className="recessed-well" style={{ padding: '20px' }}>
        {/* Comparator Header & Region Selectors */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            borderBottom: '1px solid #9aa3a8',
            paddingBottom: '14px',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitBranch size={20} color="var(--dp-color-accent)" />
            <span
              style={{
                fontFamily: 'var(--dp-typography-mono)',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--dp-color-ink)',
                textTransform: 'uppercase',
              }}
            >
              LINGUISTIC BRIDGE &amp; SUBSTRATE COMPARATOR
            </span>
            {isLoadingBridge && (
              <span style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '11px', color: 'var(--dp-color-accent)' }}>
                [CALCULATING...]
              </span>
            )}
          </div>

          {/* Region Selector Keys & Swap Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <select
              value={sourceRegion}
              onChange={(e) => {
                setSourceRegion(e.target.value);
                loadBridge(e.target.value, targetRegion);
              }}
              className="industrial-select"
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
                style={{ width: '32px', height: '32px', padding: '4px' }}
              >
                <ArrowLeftRight size={14} />
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
            padding: '16px 20px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '16px',
          }}
        >
          {/* Similarity Index Metric */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                borderLeft: '3px solid var(--dp-color-accent)',
                paddingLeft: '12px',
              }}
            >
              <div style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '11px', color: 'var(--dp-color-on-field-muted)', textTransform: 'uppercase' }}>
                COGNATE ALIGNMENT SCORE
              </div>
              <div
                style={{
                  fontFamily: 'var(--dp-typography-mono)',
                  fontSize: '32px',
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
              <p style={{ fontSize: '13px', color: 'var(--dp-color-on-field)', maxWidth: '720px', lineHeight: '1.35', marginTop: '2px' }}>
                {bridgeData.bridge_summary}
              </p>
            </div>
          </div>

          {/* Substrates & Shortest Path */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '12px' }}>
              <span style={{ color: 'var(--dp-color-on-field-muted)' }}>SHARED SUBSTRATES: </span>
              <strong style={{ color: 'var(--dp-color-accent)' }}>
                {bridgeData.shared_substrates.length > 0 ? bridgeData.shared_substrates.join(', ') : 'DISTINCT LAYERS'}
              </strong>
            </div>

            {bridgeData.shortest_etymological_paths.length > 0 && (
              <div style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '11px', color: '#38bdf8' }}>
                PATH: {bridgeData.shortest_etymological_paths[0].join(' ➔ ')}
              </div>
            )}
          </div>
        </div>

        {/* Removable-Style Horizontal Modules: 14 Concepts Aligned */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div
            style={{
              fontFamily: 'var(--dp-typography-mono)',
              fontSize: '11px',
              color: 'var(--dp-color-label)',
              textTransform: 'uppercase',
              padding: '0 4px',
            }}
          >
            SIDE-BY-SIDE LEXICAL COGNATE SHIFT LEDGER ({bridgeData.phonetic_shift_chain.length} CONCEPTS MOUNTED)
          </div>

          {bridgeData.phonetic_shift_chain.map((item, idx) => (
            <div
              key={idx}
              className="removable-module"
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(140px, 0.8fr) minmax(240px, 1.2fr) 30px minmax(240px, 1.2fr)',
                gap: '12px',
                alignItems: 'center',
                padding: '10px 14px',
              }}
            >
              {/* Concept Anchor */}
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--dp-color-ink)' }}>
                  {item.concept}
                </div>
                <div style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '10px', color: 'var(--dp-color-label)' }}>
                  CANONICAL ROOT
                </div>
              </div>

              {/* Source Region Variant */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: '6px 10px',
                  borderRadius: 'var(--dp-radius-key)',
                  borderLeft: '3px solid var(--dp-color-ink)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--dp-color-ink)' }}>
                    {item.region_a_variant.phonetic}
                  </span>
                  <span className="kannada-text" style={{ fontSize: '15px', fontWeight: 600 }}>
                    ({item.region_a_variant.script})
                  </span>
                </div>
                {item.region_a_variant.rule && (
                  <div style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '10px', color: 'var(--dp-color-label)' }}>
                    [{item.region_a_variant.rule}]
                  </div>
                )}
              </div>

              {/* Transition Arrow */}
              <div style={{ textAlign: 'center', color: 'var(--dp-color-accent)', fontWeight: 700 }}>
                ➔
              </div>

              {/* Target Region Variant */}
              <div
                style={{
                  backgroundColor: 'var(--dp-color-well)',
                  padding: '6px 10px',
                  borderRadius: 'var(--dp-radius-key)',
                  borderLeft: '3px solid var(--dp-color-accent)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--dp-color-accent)' }}>
                    {item.region_b_variant.phonetic}
                  </span>
                  <span className="kannada-text" style={{ fontSize: '15px', fontWeight: 600 }}>
                    ({item.region_b_variant.script})
                  </span>
                </div>
                {item.region_b_variant.rule && (
                  <div style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '10px', color: 'var(--dp-color-label)' }}>
                    [{item.region_b_variant.rule}]
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default EtymologyGraphSheet;
