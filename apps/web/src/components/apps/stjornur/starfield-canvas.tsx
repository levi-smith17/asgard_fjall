import { useMemo, useEffect, useCallback } from 'react'
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Panel,
  BackgroundVariant,
  MarkerType,
  useViewport,
  type Node,
  type Edge,
  type NodeDragHandler,
} from 'reactflow'
import 'reactflow/dist/style.css'
import type { SfOutpost, SfResource } from '@/lib/starfield-types'
import type { OutpostValidation } from '@/lib/starfield-validation'
import { updateOutpostPosition } from '@/lib/stjornur-api'
import { OutpostNode, type OutpostNodeData } from './outpost-node'

interface StarfieldCanvasProps {
  outposts: (SfOutpost & { id: string })[]
  resources: SfResource[]
  validations: Map<string, OutpostValidation>
  selectedOutpostId: string | null
  filterQuery?: string
  onOutpostClick: (outpostId: string) => void
  onAddOutpostResource: (outpostId: string) => void
  onEditOutpostResource: (outpostId: string, resourceId: string) => void
}

const nodeTypes = { outpost: OutpostNode }

function ZoomDisplay() {
  const { zoom } = useViewport()
  return (
    <Panel position="bottom-right">
      <span className="text-[10px] text-muted-foreground bg-card border border-border rounded px-1.5 py-0.5">
        {Math.round(zoom * 100)}%
      </span>
    </Panel>
  )
}

function outpostMatchesFilter(
  outpost: SfOutpost & { id: string },
  resources: SfResource[],
  query: string,
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return false
  if (outpost.planet?.toLowerCase().includes(q)) return true
  if (outpost.system?.toLowerCase().includes(q)) return true
  for (const entry of outpost.resources ?? []) {
    if (entry.name?.toLowerCase().includes(q)) return true
    if (entry.resourceId?.toLowerCase().includes(q)) return true
  }
  for (const resource of resources) {
    const id = resource.sk.replace(/^RESOURCE#/, '')
    const onOutpost = (outpost.resources ?? []).some((entry) => entry.resourceId === id)
    if (!onOutpost) continue
    if (resource.name?.toLowerCase().includes(q)) return true
    if (resource.abbreviation?.toLowerCase().includes(q)) return true
    if (resource.type?.toLowerCase().includes(q)) return true
  }
  return false
}

export function StarfieldCanvas({
  outposts,
  resources,
  validations,
  selectedOutpostId,
  filterQuery = '',
  onOutpostClick,
  onAddOutpostResource,
  onEditOutpostResource,
}: StarfieldCanvasProps) {
  const filterActive = filterQuery.trim().length > 0

  const buildNode = useCallback(
    (outpost: SfOutpost & { id: string }, position: { x: number; y: number }): Node<OutpostNodeData> => ({
      id: outpost.id,
      type: 'outpost',
      position,
      selected: outpost.id === selectedOutpostId,
      data: {
        outpost,
        outposts,
        resources,
        validation: validations.get(outpost.id),
        filterActive,
        filterMatched: filterActive ? outpostMatchesFilter(outpost, resources, filterQuery) : false,
        onEdit: () => onOutpostClick(outpost.id),
        onAddResource: () => onAddOutpostResource(outpost.id),
        onEditResource: (resourceId: string) => onEditOutpostResource(outpost.id, resourceId),
      },
    }),
    [
      filterActive,
      filterQuery,
      onAddOutpostResource,
      onEditOutpostResource,
      onOutpostClick,
      outposts,
      resources,
      selectedOutpostId,
      validations,
    ],
  )

  const initialNodes = useMemo<Node<OutpostNodeData>[]>(
    () => outposts.map((outpost) => buildNode(outpost, outpost.position ?? { x: 0, y: 0 })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed only
    [],
  )

  const initialEdges = useMemo<Edge[]>(() => {
    return outposts
      .filter((o) => !!o.parentId)
      .map((o) => ({
        id: `${o.id}-${o.parentId}`,
        source: o.id,
        sourceHandle: 'left',
        target: o.parentId!,
        targetHandle: 'right',
        markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
      }))
  }, [])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => {
    setNodes((prev) => {
      const prevById = new Map(prev.map((n) => [n.id, n]))
      return outposts.map((outpost) => {
        const existing = prevById.get(outpost.id)
        return buildNode(outpost, existing ? existing.position : (outpost.position ?? { x: 0, y: 0 }))
      })
    })
    setEdges(
      outposts
        .filter((o) => !!o.parentId)
        .map((o) => ({
          id: `${o.id}-${o.parentId}`,
          source: o.id,
          sourceHandle: 'left',
          target: o.parentId!,
          targetHandle: 'right',
          markerEnd: { type: MarkerType.ArrowClosed, width: 30, height: 30 },
        })),
    )
  }, [buildNode, outposts, setEdges, setNodes])

  const handleNodeDragStop: NodeDragHandler = useCallback((_, node) => {
    updateOutpostPosition(node.id, node.position).catch(console.error)
  }, [])

  if (outposts.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center px-8 text-center">
        <p className="text-sm text-muted-foreground">No outposts yet. Add one to get started.</p>
      </div>
    )
  }

  return (
    <div className="starfield-flow h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls />
        <ZoomDisplay />
      </ReactFlow>
    </div>
  )
}
