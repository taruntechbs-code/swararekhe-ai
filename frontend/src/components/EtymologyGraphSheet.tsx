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

const QUICK_CONCEPT_CHIPS = [
  { label: 'Good / Fine', query: 'good' },
  { label: 'Much / Bhaal', query: 'bhaal' },
  { label: 'Where (Ellige)', query: 'where' },
  { label: 'Eat / Meal', query: 'eat' },
  { label: 'Mother (Avva)', query: 'mother' },
  { label: 'Rain (Male)', query: 'rain' },
  { label: 'Quickly (Bega)', query: 'quickly' },
  { label: 'Boy (Huduga)', query: 'boy' },
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
      // Auto-select center or first node
      const center = data.nodes.find((n) => n.id === data.matched_center_node_id) || data.nodes[0] || null;
      setSelectedNode(center);
      // Compute initial organic positions
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

    // Categorize other nodes
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

  // Node position helper
  const getNodePos = (id: string): NodePosition => {
    return nodePositions[id] || { x: CENTER_X, y: CENTER_Y };
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 2.4));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.6));
  const handleResetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    layoutGraph(constellation.nodes, constellation.edges, constellation.matched_center_node_id);
  };

  // Pan controls
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

  // Node drag start
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
    <div className="sketch-page-content" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Topology & Platform Centrality Strip */}
      <div
        className="paper-scrap"
        style={{
          padding: '16px 22px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          backgroundColor: 'var(--dp-color-scrap)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Network size={24} color="var(--dp-color-accent)" />
          <h2
            style={{
              fontSize: '24px',
              margin: 0,
              color: 'var(--dp-color-ink)',
            }}
          >
            Etymology Constellation &amp; Cultural Knowledge Graph
          </h2>
          <span
            style={{
              fontSize: '14px',
              fontFamily: 'var(--dp-typography-sans-face)',
              backgroundColor: 'var(--dp-color-highlight)',
              color: 'var(--dp-color-ink)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: 600,
            }}
          >
            NetworkX MultiDiGraph Active
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
          <span className="blue-note" style={{ fontSize: '16px' }}>
            Centrality Hubs:
          </span>
          {topology.influence_centrality_ranking.slice(0, 5).map((rank) => (
            <button
              key={rank.id}
              type="button"
              className="sketch-button"
              onClick={() => {
                setSearchQuery(rank.label);
                loadConstellation(rank.label);
              }}
              title={`Explore ego-graph for ${rank.label} (Centrality: ${rank.betweenness_centrality})`}
              style={{
                fontSize: '15px',
                padding: '3px 10px',
                backgroundColor: rank.node_type === 'INFLUENCE_LANG' ? '#ffffff' : 'var(--dp-color-scrap)',
                color: rank.node_type === 'INFLUENCE_LANG' ? 'var(--dp-color-accent)' : 'var(--dp-color-ink)',
              }}
            >
              <span>{rank.label}</span>
              <span style={{ opacity: 0.6, fontSize: '13px' }}>({rank.degree})</span>
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          SECTION A: Concept Constellation Explorer (Upper Working Band)
         ========================================================================= */}
      <div
        className="paper-scrap"
        style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          position: 'relative',
        }}
      >
        <div className="tape-strip" aria-hidden="true" />

        {/* Search Console & Quick Concept Chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadConstellation(searchQuery);
            }}
            style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
          >
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search root concept, English gloss, or regional variant (e.g., 'good', 'bhaal', 'avva')..."
                className="sketch-input"
                style={{
                  width: '100%',
                  fontSize: '21px',
                  padding: '10px 16px',
                  backgroundColor: '#ffffff',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoadingConstellation}
              className="sketch-button sketch-button-red"
              style={{ minWidth: '150px' }}
              title="Query NetworkX 2-hop ego-graph"
            >
              <Search size={18} />
              <span>{isLoadingConstellation ? 'Exploring...' : 'Trace Roots'}</span>
            </button>
          </form>

          {/* Quick Concept Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'var(--dp-typography-reading-face)',
                fontSize: '17px',
                color: 'var(--dp-color-ink-muted)',
              }}
            >
              Quick Ego Centers:
            </span>
            {QUICK_CONCEPT_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                className="sketch-button"
                onClick={() => {
                  setSearchQuery(chip.query);
                  loadConstellation(chip.query);
                }}
                style={{ fontSize: '16px', padding: '4px 12px' }}
                title={`Trace constellation for '${chip.label}'`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Constellation Canvas & Field Etymology Note Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(520px, 1.6fr) minmax(320px, 1fr)',
            gap: '24px',
            alignItems: 'stretch',
          }}
        >
          {/* Interactive Mind-Map SVG Diagram */}
          <div
            style={{
              border: 'var(--dp-border-fine-stroke) solid var(--dp-color-ink)',
              borderRadius: 'var(--dp-radius-control)',
              backgroundColor: '#ffffff',
              boxShadow: '2px 3px 0 var(--dp-color-ink)',
              position: 'relative',
              overflow: 'hidden',
              minHeight: '480px',
              height: '520px',
              cursor: isPanning ? 'grabbing' : 'grab',
            }}
          >
            {/* Graph Paper Grid Background */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage:
                  'radial-gradient(rgba(179, 172, 157, 0.4) 1px, transparent 1px), linear-gradient(to right, rgba(179, 172, 157, 0.1) 1px, transparent 1px)',
                backgroundSize: '20px 20px, 100% 20px',
                pointerEvents: 'none',
              }}
            />

            {/* Canvas Toolbar Controls */}
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
                  className="sketch-icon-btn"
                  onClick={handleZoomIn}
                  aria-label="Zoom In on Constellation Graph"
                >
                  <ZoomIn size={18} />
                </button>
                <span className="tooltip-bubble">Zoom in (+)</span>
              </div>

              <div className="tooltip-wrap">
                <button
                  type="button"
                  className="sketch-icon-btn"
                  onClick={handleZoomOut}
                  aria-label="Zoom Out of Constellation Graph"
                >
                  <ZoomOut size={18} />
                </button>
                <span className="tooltip-bubble">Zoom out (-)</span>
              </div>

              <div className="tooltip-wrap">
                <button
                  type="button"
                  className="sketch-icon-btn"
                  onClick={handleResetView}
                  aria-label="Reset Graph View & Re-center"
                >
                  <RotateCcw size={18} />
                </button>
                <span className="tooltip-bubble">Reset view</span>
              </div>
            </div>

            {/* Map Legend Pill */}
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                backgroundColor: 'rgba(252, 248, 239, 0.92)',
                padding: '6px 12px',
                borderRadius: 'var(--dp-radius-control)',
                border: '1px solid var(--dp-color-line)',
                fontSize: '13px',
                fontFamily: 'var(--dp-typography-sans-face)',
                zIndex: 10,
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--dp-color-highlight)',
                    border: '1px solid var(--dp-color-ink)',
                  }}
                />
                Concept Center
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--dp-color-ink)',
                  }}
                />
                Field Variant
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--dp-color-accent)',
                  }}
                />
                Substrate Language
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    backgroundColor: 'rgba(52, 76, 105, 0.1)',
                    border: '1px solid var(--dp-color-annotation)',
                  }}
                />
                Cultural Marker
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
                {/* Arrowhead markers */}
                <marker id="arrow-ink" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--dp-color-ink)" />
                </marker>
                <marker id="arrow-red" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--dp-color-accent)" />
                </marker>
                <marker id="arrow-blue" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--dp-color-annotation)" />
                </marker>
              </defs>

              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {/* 1. Draw Edges */}
                {constellation.edges.map((edge, idx) => {
                  const s = getNodePos(edge.source);
                  const t = getNodePos(edge.target);
                  const isHovered =
                    hoveredEdge?.source === edge.source && hoveredEdge?.target === edge.target;

                  // Pick stroke color based on relation
                  let strokeColor = 'var(--dp-color-ink)';
                  let markerEnd = 'url(#arrow-ink)';
                  if (edge.relation === 'BORROWED_FROM') {
                    strokeColor = 'var(--dp-color-accent)';
                    markerEnd = 'url(#arrow-red)';
                  } else if (edge.relation === 'CULTURAL_TIE' || edge.relation === 'COGNATE_WITH') {
                    strokeColor = 'var(--dp-color-annotation)';
                    markerEnd = 'url(#arrow-blue)';
                  } else if (edge.relation === 'SPOKEN_IN') {
                    strokeColor = 'var(--dp-color-line)';
                  }

                  // Midpoint for relation label
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
                        strokeWidth={isHovered ? 2.8 : 1.6}
                        strokeDasharray={edge.relation === 'BORROWED_FROM' ? '5,3' : undefined}
                        markerEnd={markerEnd}
                        style={{ transition: 'stroke-width 100ms ease' }}
                      />
                      {/* Edge Label pill on hover or for key relations */}
                      {(isHovered || edge.relation === 'BORROWED_FROM') && (
                        <g transform={`translate(${midX}, ${midY})`}>
                          <rect
                            x="-44"
                            y="-9"
                            width="88"
                            height="18"
                            rx="4"
                            fill="#ffffff"
                            stroke={strokeColor}
                            strokeWidth="1"
                          />
                          <text
                            textAnchor="middle"
                            y="3"
                            fontSize="10"
                            fontFamily="var(--dp-typography-sans-face)"
                            fill={strokeColor}
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
                        {/* Double concentric circle hub with yellow highlight */}
                        <circle
                          r="42"
                          fill="var(--dp-color-highlight)"
                          stroke="var(--dp-color-ink)"
                          strokeWidth={isSelected ? 3.5 : 2.2}
                          strokeDasharray="4,2"
                        />
                        <circle
                          r="36"
                          fill="var(--dp-color-highlight)"
                          stroke="var(--dp-color-ink)"
                          strokeWidth={1.5}
                        />
                        <text
                          textAnchor="middle"
                          y="-6"
                          fontFamily="var(--dp-typography-display-face)"
                          fontSize="17"
                          fontWeight="bold"
                          fill="var(--dp-color-ink)"
                        >
                          {node.label}
                        </text>
                        {node.kannada_label && (
                          <text
                            textAnchor="middle"
                            y="14"
                            className="kannada-text"
                            fontSize="15"
                            fontWeight="bold"
                            fill="var(--dp-color-ink)"
                          >
                            {node.kannada_label}
                          </text>
                        )}
                        <text
                          textAnchor="middle"
                          y="26"
                          fontSize="9"
                          fontFamily="var(--dp-typography-sans-face)"
                          fill="var(--dp-color-annotation)"
                          letterSpacing="0.5px"
                        >
                          EGO CENTER
                        </text>
                      </g>
                    );
                  }

                  if (node.node_type === 'VARIANT') {
                    const boxW = Math.max(100, (node.label.length + (node.kannada_label?.length || 0)) * 6.5);
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
                          y="-20"
                          width={boxW}
                          height="40"
                          rx="10"
                          ry="10"
                          fill="#ffffff"
                          stroke={isSelected ? 'var(--dp-color-accent)' : 'var(--dp-color-ink)'}
                          strokeWidth={isSelected ? 2.5 : 1.5}
                          style={{ filter: 'drop-shadow(1px 2px 0 rgba(56,53,47,0.12))' }}
                        />
                        <text
                          textAnchor="middle"
                          y="-2"
                          fontFamily="var(--dp-typography-display-face)"
                          fontSize="15"
                          fontWeight="bold"
                          fill="var(--dp-color-ink)"
                        >
                          {node.label}
                        </text>
                        {node.kannada_label && (
                          <text
                            textAnchor="middle"
                            y="14"
                            className="kannada-text"
                            fontSize="13"
                            fontWeight="600"
                            fill="var(--dp-color-ink-muted)"
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
                          x="-55"
                          y="-16"
                          width="110"
                          height="32"
                          rx="6"
                          fill="#fbf0ee"
                          stroke="var(--dp-color-accent)"
                          strokeWidth={isSelected ? 2.5 : 1.5}
                        />
                        <text
                          textAnchor="middle"
                          y="4"
                          fontFamily="var(--dp-typography-display-face)"
                          fontSize="14"
                          fontWeight="bold"
                          fill="var(--dp-color-accent)"
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
                          x="-50"
                          y="-16"
                          width="100"
                          height="32"
                          rx="4"
                          fill="#ffffff"
                          stroke="var(--dp-color-accent)"
                          strokeWidth={isSelected ? 2.5 : 1.5}
                          strokeDasharray="4,2"
                        />
                        <text
                          textAnchor="middle"
                          y="4"
                          fontFamily="var(--dp-typography-display-face)"
                          fontSize="14"
                          fontWeight="bold"
                          fill="var(--dp-color-accent)"
                        >
                          ★ {node.label}
                        </text>
                      </g>
                    );
                  }

                  // CULTURAL_MARKER or default
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      onClick={() => setSelectedNode(node)}
                      onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <rect
                        x="-54"
                        y="-16"
                        width="108"
                        height="32"
                        rx="6"
                        fill="rgba(52, 76, 105, 0.08)"
                        stroke="var(--dp-color-annotation)"
                        strokeWidth={isSelected ? 2.5 : 1.5}
                      />
                      <text
                        textAnchor="middle"
                        y="4"
                        fontFamily="var(--dp-typography-reading-face)"
                        fontSize="14"
                        fontWeight="bold"
                        fill="var(--dp-color-annotation)"
                      >
                        ✦ {node.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* Adjacent Stable Field Etymology Note Sheet */}
          <div
            style={{
              border: 'var(--dp-border-fine-stroke) solid var(--dp-color-ink)',
              borderRadius: 'var(--dp-radius-control)',
              backgroundColor: 'var(--dp-color-scrap)',
              boxShadow: '2px 3px 0 var(--dp-color-ink)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              overflowY: 'auto',
              maxHeight: '520px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: 'var(--dp-border-fine-stroke) dashed var(--dp-color-line)',
                paddingBottom: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--dp-color-accent)" />
                <h3
                  style={{
                    fontSize: '22px',
                    margin: 0,
                    color: 'var(--dp-color-ink)',
                  }}
                >
                  Field Etymology Note
                </h3>
              </div>
              <span className="blue-note" style={{ fontSize: '15px' }}>
                2-Hop Ego Graph
              </span>
            </div>

            {/* Etymological Narrative Commentary */}
            <div>
              <div
                style={{
                  fontFamily: 'var(--dp-typography-display-face)',
                  fontSize: '17px',
                  fontWeight: 'bold',
                  color: 'var(--dp-color-ink)',
                  marginBottom: '4px',
                }}
              >
                Etymological Travelogue across Karnataka:
              </div>
              <p
                style={{
                  fontFamily: 'var(--dp-typography-reading-face)',
                  fontSize: '18px',
                  lineHeight: '1.4',
                  color: 'var(--dp-color-ink)',
                }}
              >
                {constellation.etymological_narrative}
              </p>
            </div>

            {/* Active Substrate Influences */}
            <div>
              <div
                style={{
                  fontFamily: 'var(--dp-typography-display-face)',
                  fontSize: '17px',
                  fontWeight: 'bold',
                  color: 'var(--dp-color-accent)',
                  marginBottom: '6px',
                }}
              >
                Active Border Substrates:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {constellation.substrate_influences.map((sub, sIdx) => (
                  <span
                    key={sIdx}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid var(--dp-color-accent)',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontSize: '15px',
                      color: 'var(--dp-color-accent)',
                      fontFamily: 'var(--dp-typography-display-face)',
                      fontWeight: 600,
                    }}
                  >
                    ★ {sub}
                  </span>
                ))}
              </div>
            </div>

            {/* Selected Node Inspector */}
            {selectedNode && (
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--dp-color-line)',
                  borderRadius: 'var(--dp-radius-control)',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--dp-typography-display-face)',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: 'var(--dp-color-ink)',
                    }}
                  >
                    {selectedNode.label}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      fontFamily: 'var(--dp-typography-sans-face)',
                      backgroundColor: 'rgba(56, 53, 47, 0.08)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      color: 'var(--dp-color-ink)',
                    }}
                  >
                    {selectedNode.node_type}
                  </span>
                </div>

                {selectedNode.kannada_label && (
                  <div className="kannada-text" style={{ fontSize: '20px', fontWeight: 700 }}>
                    {selectedNode.kannada_label}
                  </div>
                )}

                {selectedNode.metadata.ipa && (
                  <div className="blue-note" style={{ fontSize: '15px' }}>
                    IPA: <code>{selectedNode.metadata.ipa}</code>
                  </div>
                )}

                {selectedNode.metadata.rule && (
                  <div className="red-action" style={{ fontSize: '15px' }}>
                    Rule: [{selectedNode.metadata.rule}]
                  </div>
                )}

                {selectedNode.metadata.era && (
                  <div style={{ fontSize: '15px', color: 'var(--dp-color-ink-muted)' }}>
                    Contact Era: {selectedNode.metadata.era}
                  </div>
                )}

                {selectedNode.metadata.description && (
                  <div style={{ fontSize: '15px', fontStyle: 'italic', color: 'var(--dp-color-ink)' }}>
                    {selectedNode.metadata.description}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION B: Linguistic Bridge & Substrate Comparator (Lower Working Band)
         ========================================================================= */}
      <div
        className="paper-scrap"
        style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Comparator Header & Region Selectors */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            borderBottom: 'var(--dp-border-fine-stroke) solid var(--dp-color-line)',
            paddingBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GitBranch size={24} color="var(--dp-color-accent)" />
            <h3
              style={{
                fontSize: '26px',
                margin: 0,
                color: 'var(--dp-color-ink)',
              }}
            >
              Linguistic Bridge &amp; Substrate Comparator
              {isLoadingBridge && (
                <span style={{ fontSize: '16px', color: 'var(--dp-color-annotation)', marginLeft: '8px' }}>
                  (Tracing bridge...)
                </span>
              )}
            </h3>
          </div>

          {/* Region Selector Controls with Swap Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <select
              value={sourceRegion}
              onChange={(e) => {
                setSourceRegion(e.target.value);
                loadBridge(e.target.value, targetRegion);
              }}
              className="sketch-select"
              style={{ fontSize: '17px', padding: '6px 12px' }}
            >
              {REGION_OPTIONS.map((reg) => (
                <option key={`src-${reg.code}`} value={reg.code}>
                  Source: {reg.label}
                </option>
              ))}
            </select>

            <div className="tooltip-wrap">
              <button
                type="button"
                className="sketch-icon-btn"
                onClick={handleSwapRegions}
                aria-label="Swap Source and Target Regions"
              >
                <ArrowLeftRight size={18} />
              </button>
              <span className="tooltip-bubble">Swap dialect regions</span>
            </div>

            <select
              value={targetRegion}
              onChange={(e) => {
                setTargetRegion(e.target.value);
                loadBridge(sourceRegion, e.target.value);
              }}
              className="sketch-select"
              style={{ fontSize: '17px', padding: '6px 12px' }}
            >
              {REGION_OPTIONS.map((reg) => (
                <option key={`tgt-${reg.code}`} value={reg.code}>
                  Target: {reg.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bridge Score & Metrics Banner */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: 'var(--dp-border-fine-stroke) solid var(--dp-color-ink)',
            borderRadius: 'var(--dp-radius-control)',
            padding: '18px 22px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '1.5px 2px 0 var(--dp-color-ink)',
          }}
        >
          {/* Similarity Index Metric */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="drawn-bracket" style={{ padding: '6px 16px' }}>
              <div
                style={{
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: 'var(--dp-color-annotation)',
                }}
              >
                Linguistic Similarity
              </div>
              <div
                style={{
                  fontFamily: 'var(--dp-typography-display-face)',
                  fontSize: '36px',
                  fontWeight: 'bold',
                  color: 'var(--dp-color-accent)',
                  lineHeight: '1',
                }}
              >
                {Math.round(bridgeData.similarity_index * 100)}%
              </div>
            </div>

            <div>
              <div
                style={{
                  fontFamily: 'var(--dp-typography-display-face)',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: 'var(--dp-color-ink)',
                }}
              >
                Comparative Bridge Summary:
              </div>
              <p
                style={{
                  fontSize: '17px',
                  color: 'var(--dp-color-ink)',
                  maxWidth: '750px',
                  lineHeight: '1.35',
                  marginTop: '2px',
                }}
              >
                {bridgeData.bridge_summary}
              </p>
            </div>
          </div>

          {/* Shared Substrates & Shortest Path */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="blue-note" style={{ fontSize: '15px' }}>
                Shared Substrates:
              </span>
              {bridgeData.shared_substrates.length > 0 ? (
                bridgeData.shared_substrates.map((s, idx) => (
                  <span
                    key={idx}
                    className="yellow-highlight"
                    style={{ fontSize: '15px', fontWeight: 'bold' }}
                  >
                    {s}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '15px', color: 'var(--dp-color-ink-muted)' }}>
                  Distinct Substrate Layers
                </span>
              )}
            </div>

            {bridgeData.shortest_etymological_paths.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span className="blue-note" style={{ fontSize: '15px' }}>
                  Shortest Path:
                </span>
                <span
                  style={{
                    fontFamily: 'var(--dp-typography-sans-face)',
                    fontSize: '13px',
                    backgroundColor: 'rgba(52, 76, 105, 0.08)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    color: 'var(--dp-color-annotation)',
                  }}
                >
                  {bridgeData.shortest_etymological_paths[0].join(' ➔ ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Side-by-Side Cognate Shift Ledger (Broad Comparison Rows) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 4px',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--dp-typography-display-face)',
                fontSize: '22px',
                color: 'var(--dp-color-ink)',
                fontWeight: 'bold',
              }}
            >
              Side-by-Side Lexical Cognate Shift Ledger ({bridgeData.phonetic_shift_chain.length} Concepts Aligned)
            </span>
            <span className="blue-note" style={{ fontSize: '16px' }}>
              * Morphological and phonetic rules mapped between regions
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {bridgeData.phonetic_shift_chain.map((item, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#ffffff',
                  border: 'var(--dp-border-fine-stroke) solid var(--dp-color-line)',
                  borderRadius: 'var(--dp-radius-control)',
                  padding: '14px 18px',
                  display: 'grid',
                  gridTemplateColumns: 'minmax(160px, 0.9fr) minmax(260px, 1.3fr) 40px minmax(260px, 1.3fr)',
                  gap: '14px',
                  alignItems: 'center',
                  boxShadow: '1px 2px 0 rgba(56, 53, 47, 0.06)',
                }}
              >
                {/* 1. Standard Concept Label */}
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--dp-typography-display-face)',
                      fontSize: '19px',
                      fontWeight: 'bold',
                      color: 'var(--dp-color-ink)',
                    }}
                  >
                    {item.concept}
                  </div>
                  <div className="blue-note" style={{ fontSize: '14px' }}>
                    Canonical Anchor
                  </div>
                </div>

                {/* 2. Region A Variant */}
                <div
                  style={{
                    backgroundColor: 'var(--dp-color-scrap)',
                    padding: '8px 12px',
                    borderRadius: 'var(--dp-radius-control)',
                    borderLeft: '3px solid var(--dp-color-ink)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--dp-typography-display-face)',
                        fontSize: '21px',
                        fontWeight: 'bold',
                        color: 'var(--dp-color-ink)',
                      }}
                    >
                      {item.region_a_variant.phonetic}
                    </span>
                    <span className="kannada-text" style={{ fontSize: '18px', fontWeight: 600 }}>
                      ({item.region_a_variant.script})
                    </span>
                  </div>
                  {item.region_a_variant.ipa && (
                    <div className="blue-note" style={{ fontSize: '14px' }}>
                      IPA: <code>{item.region_a_variant.ipa}</code>
                    </div>
                  )}
                  {item.region_a_variant.rule && (
                    <div style={{ fontSize: '13px', color: 'var(--dp-color-ink-muted)' }}>
                      Rule: {item.region_a_variant.rule}
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div style={{ textAlign: 'center', color: 'var(--dp-color-accent)', fontWeight: 'bold' }}>
                  ➔
                </div>

                {/* 3. Region B Variant */}
                <div
                  style={{
                    backgroundColor: '#fbf0ee',
                    padding: '8px 12px',
                    borderRadius: 'var(--dp-radius-control)',
                    borderLeft: '3px solid var(--dp-color-accent)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--dp-typography-display-face)',
                        fontSize: '21px',
                        fontWeight: 'bold',
                        color: 'var(--dp-color-accent)',
                      }}
                    >
                      {item.region_b_variant.phonetic}
                    </span>
                    <span className="kannada-text" style={{ fontSize: '18px', fontWeight: 600 }}>
                      ({item.region_b_variant.script})
                    </span>
                  </div>
                  {item.region_b_variant.ipa && (
                    <div className="blue-note" style={{ fontSize: '14px' }}>
                      IPA: <code>{item.region_b_variant.ipa}</code>
                    </div>
                  )}
                  {item.region_b_variant.rule && (
                    <div style={{ fontSize: '13px', color: 'var(--dp-color-accent)' }}>
                      Rule: {item.region_b_variant.rule}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default EtymologyGraphSheet;
