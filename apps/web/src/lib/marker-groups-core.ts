export type RawMarker = {
  id: string
  name: string
  color: string
  icon?: string | null
}

export type MarkerLeaf = {
  type: 'leaf'
  id: string
  name: string
  label: string
  color: string
  icon?: string | null
}

export type MarkerGroup = {
  type: 'group'
  label: string
  children: MarkerTreeNode[]
  id?: string
  color?: string
  icon?: string | null
}

export type MarkerTreeNode = MarkerLeaf | MarkerGroup

export function buildMarkerTree(markers: RawMarker[]): MarkerTreeNode[] {
  const root: MarkerTreeNode[] = []
  for (const marker of markers) {
    const parts = marker.name.split('/')
    insertNode(root, parts, marker)
  }
  sortNodes(root)
  return root
}

function insertNode(nodes: MarkerTreeNode[], parts: string[], marker: RawMarker): void {
  if (parts.length === 1) {
    const existingGroup = nodes.find(
      (node): node is MarkerGroup => node.type === 'group' && node.label === parts[0],
    )
    if (existingGroup) {
      existingGroup.id = marker.id
      existingGroup.color = marker.color
      existingGroup.icon = marker.icon
      return
    }
    nodes.push({ type: 'leaf', id: marker.id, name: marker.name, label: parts[0], color: marker.color, icon: marker.icon })
    return
  }
  const [head, ...rest] = parts
  let group = nodes.find((node): node is MarkerGroup => node.type === 'group' && node.label === head)
  if (!group) {
    const existingLeafIdx = nodes.findIndex((node): node is MarkerLeaf => node.type === 'leaf' && node.label === head)
    if (existingLeafIdx !== -1) {
      const leaf = nodes[existingLeafIdx] as MarkerLeaf
      group = { type: 'group', label: head, children: [], id: leaf.id, color: leaf.color, icon: leaf.icon }
      nodes.splice(existingLeafIdx, 1, group)
    } else {
      group = { type: 'group', label: head, children: [] }
      nodes.push(group)
    }
  }
  insertNode(group.children, rest, marker)
}

function sortNodes(nodes: MarkerTreeNode[]): void {
  nodes.sort((left, right) => {
    if (left.type !== right.type) return left.type === 'group' ? -1 : 1
    return left.label.localeCompare(right.label)
  })
  for (const node of nodes) {
    if (node.type === 'group') sortNodes(node.children)
  }
}

export function getNodesAtPath(tree: MarkerTreeNode[], path: string[]): MarkerTreeNode[] {
  if (path.length === 0) return tree
  const group = tree.find((node): node is MarkerGroup => node.type === 'group' && node.label === path[0])
  if (!group) return []
  return getNodesAtPath(group.children, path.slice(1))
}

export function getAllLeafIds(nodes: MarkerTreeNode[]): string[] {
  return nodes.flatMap((node) => {
    if (node.type === 'leaf') return [node.id]
    const childIds = getAllLeafIds(node.children)
    return node.id ? [node.id, ...childIds] : childIds
  })
}

export type FlatLeaf = { leaf: MarkerLeaf; path: string[] }

export function getAllLeaves(nodes: MarkerTreeNode[], prefix: string[] = []): FlatLeaf[] {
  return nodes.flatMap((node) => {
    if (node.type === 'leaf') return [{ leaf: node, path: [...prefix, node.label] }]
    const selfEntries: FlatLeaf[] = node.id
      ? [{ leaf: { type: 'leaf', id: node.id, name: [...prefix, node.label].join('/'), label: node.label, color: node.color!, icon: node.icon }, path: [...prefix, node.label] }]
      : []
    return [...selfEntries, ...getAllLeaves(node.children, [...prefix, node.label])]
  })
}
