export type RawRun = {
  id: string
  name: string
  color: string
  icon?: string | null
}

export type RunLeaf = {
  type: 'leaf'
  id: string
  name: string
  label: string
  color: string
  icon?: string | null
}

export type RunGroup = {
  type: 'group'
  label: string
  children: RunTreeNode[]
  id?: string
  color?: string
  icon?: string | null
}

export type RunTreeNode = RunLeaf | RunGroup

export function buildRunTree(runir: RawRun[]): RunTreeNode[] {
  const root: RunTreeNode[] = []
  for (const run of runir) {
    const parts = run.name.split('/')
    insertNode(root, parts, run)
  }
  sortNodes(root)
  return root
}

function insertNode(nodes: RunTreeNode[], parts: string[], run: RawRun): void {
  if (parts.length === 1) {
    const existingGroup = nodes.find(
      (node): node is RunGroup => node.type === 'group' && node.label === parts[0],
    )
    if (existingGroup) {
      existingGroup.id = run.id
      existingGroup.color = run.color
      existingGroup.icon = run.icon
      return
    }
    nodes.push({ type: 'leaf', id: run.id, name: run.name, label: parts[0], color: run.color, icon: run.icon })
    return
  }
  const [head, ...rest] = parts
  let group = nodes.find((node): node is RunGroup => node.type === 'group' && node.label === head)
  if (!group) {
    const existingLeafIdx = nodes.findIndex((node): node is RunLeaf => node.type === 'leaf' && node.label === head)
    if (existingLeafIdx !== -1) {
      const leaf = nodes[existingLeafIdx] as RunLeaf
      group = { type: 'group', label: head, children: [], id: leaf.id, color: leaf.color, icon: leaf.icon }
      nodes.splice(existingLeafIdx, 1, group)
    } else {
      group = { type: 'group', label: head, children: [] }
      nodes.push(group)
    }
  }
  insertNode(group.children, rest, run)
}

function sortNodes(nodes: RunTreeNode[]): void {
  nodes.sort((left, right) => {
    if (left.type !== right.type) return left.type === 'group' ? -1 : 1
    return left.label.localeCompare(right.label)
  })
  for (const node of nodes) {
    if (node.type === 'group') sortNodes(node.children)
  }
}

export function getNodesAtPath(tree: RunTreeNode[], path: string[]): RunTreeNode[] {
  if (path.length === 0) return tree
  const group = tree.find((node): node is RunGroup => node.type === 'group' && node.label === path[0])
  if (!group) return []
  return getNodesAtPath(group.children, path.slice(1))
}

export function getAllLeafIds(nodes: RunTreeNode[]): string[] {
  return nodes.flatMap((node) => {
    if (node.type === 'leaf') return [node.id]
    const childIds = getAllLeafIds(node.children)
    return node.id ? [node.id, ...childIds] : childIds
  })
}

export type FlatLeaf = { leaf: RunLeaf; path: string[] }

export function getAllLeaves(nodes: RunTreeNode[], prefix: string[] = []): FlatLeaf[] {
  return nodes.flatMap((node) => {
    if (node.type === 'leaf') return [{ leaf: node, path: [...prefix, node.label] }]
    const selfEntries: FlatLeaf[] = node.id
      ? [{ leaf: { type: 'leaf', id: node.id, name: [...prefix, node.label].join('/'), label: node.label, color: node.color!, icon: node.icon }, path: [...prefix, node.label] }]
      : []
    return [...selfEntries, ...getAllLeaves(node.children, [...prefix, node.label])]
  })
}
