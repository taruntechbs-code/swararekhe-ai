from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.schemas import (
    ConstellationResponse,
    LinguisticBridgeResponse,
    TopologyResponse,
)
from backend.services.knowledge_graph import knowledge_graph_service

router = APIRouter(prefix="/graph", tags=["Etymological & Cultural Knowledge Graph"])


@router.get(
    "/constellation",
    response_model=ConstellationResponse,
    status_code=status.HTTP_200_OK,
    summary="Extract a 2-hop concept constellation ego-graph and etymological narrative",
)
async def get_concept_constellation(
    query: str = Query(..., min_length=1, description="Word, phrase, or English meaning to look up"),
    db: AsyncSession = Depends(get_db),
) -> ConstellationResponse:
    """
    Extracts an ego-graph around the matched lexical concept or dialect variant.
    Returns nodes, edges, connected border languages, and etymological travelogue.
    """
    if not knowledge_graph_service.is_built:
        await knowledge_graph_service.build_graph(db)

    result = knowledge_graph_service.get_concept_constellation(query)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Concept or dialect variant matching '{query}' not found in knowledge graph.",
        )
    return result


@router.get(
    "/bridge",
    response_model=LinguisticBridgeResponse,
    status_code=status.HTTP_200_OK,
    summary="Compute linguistic similarity index and trace the etymological bridge between two regions",
)
async def get_linguistic_bridge(
    source: str = Query(..., description="Source dialect region code, e.g. hubballi_dharwad"),
    target: str = Query(..., description="Target dialect region code, e.g. kalaburagi_bidar"),
    db: AsyncSession = Depends(get_db),
) -> LinguisticBridgeResponse:
    """
    Calculates composite similarity index between two dialect regions using substrate
    overlap, spatial topography, and shared cultural markers. Traces shortest graph paths
    and presents side-by-side lexical cognate alignment.
    """
    if not knowledge_graph_service.is_built:
        await knowledge_graph_service.build_graph(db)

    result = knowledge_graph_service.trace_linguistic_bridge(source, target)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Could not build bridge between '{source}' and '{target}'. Please check region codes.",
        )
    return result


@router.get(
    "/topology",
    response_model=TopologyResponse,
    status_code=status.HTTP_200_OK,
    summary="Export the complete etymological graph topology and centrality rankings",
)
async def get_graph_topology(
    db: AsyncSession = Depends(get_db),
) -> TopologyResponse:
    """
    Returns full knowledge graph serialized for force-directed / D3 visualizer,
    complete with node-type distributions and degree/betweenness centrality rankings.
    """
    if not knowledge_graph_service.is_built:
        await knowledge_graph_service.build_graph(db)

    return knowledge_graph_service.get_full_topology()
