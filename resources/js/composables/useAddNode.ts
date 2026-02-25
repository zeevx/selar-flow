import { useVueFlow } from '@vue-flow/core'

const END_NODE_ID = 'end'
const VERTICAL_SPACING = 300
const HORIZONTAL_SPACING = 400

const DEFAULT_EDGE_STYLE = { stroke: '#6F3381', strokeWidth: 2 }

export function useAddNode() {
    const { addNodes, addEdges, findNode, edges, setEdges, updateNode } = useVueFlow()

    const generateId = () => `node-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

    const createEdge = (source: string, target: string, sourceHandle?: string) => ({
        id: sourceHandle ? `e-${source}-${target}-${sourceHandle}` : `e-${source}-${target}`,
        source,
        target,
        ...(sourceHandle && { sourceHandle }),
        animated: true,
        type: 'custom-action',
        style: DEFAULT_EDGE_STYLE,
    })

    const createActionNode = (id: string, x: number, y: number, name = 'Action') => ({
        id,
        type: 'action',
        label: name,
        position: { x, y },
        data: { name },
    })

    const createConditionNode = (id: string, x: number, y: number, name = 'Condition') => ({
        id,
        type: 'condition',
        label: name,
        position: { x, y },
        data: { name },
    })

    const pushNodeDown = (nodeId: string, minY: number) => {
        const node = findNode(nodeId)
        if (!node || node.id === END_NODE_ID) return
        if (node.position.y < minY) {
            updateNode(nodeId, { position: { x: node.position.x, y: minY } })
        }
    }

    const pushEndNodeDown = (newNodeY: number) => {
        const endNode = findNode(END_NODE_ID)
        if (!endNode || endNode.hidden) return
        const minEndY = newNodeY + VERTICAL_SPACING
        if (endNode.position.y < minEndY) {
            updateNode(END_NODE_ID, { position: { x: endNode.position.x, y: minEndY } })
        }
    }

    const addActionNodeFromNode = (sourceNodeId: string) => {
        const sourceNode = findNode(sourceNodeId)
        if (!sourceNode) return

        const newNodeId = generateId()
        const y = sourceNode.position.y + VERTICAL_SPACING

        addNodes([createActionNode(newNodeId, sourceNode.position.x, y)])
        addEdges([createEdge(sourceNodeId, newNodeId)])
        pushEndNodeDown(y)
    }

    const addConditionNodeFromNode = (sourceNodeId: string) => {
        const sourceNode = findNode(sourceNodeId)
        if (!sourceNode) return

        const conditionId = generateId()
        const branchId = generateId()
        const y = sourceNode.position.y + VERTICAL_SPACING

        addNodes([
            createConditionNode(conditionId, sourceNode.position.x, y),
            createActionNode(branchId, sourceNode.position.x + HORIZONTAL_SPACING, y, 'Branch'),
        ])
        addEdges([
            createEdge(sourceNodeId, conditionId),
            createEdge(conditionId, branchId, 'source-right'),
        ])
        pushEndNodeDown(y)
    }

    const addActionNodeFromEdge = (edgeId: string) => {
        const edge = edges.value.find(e => e.id === edgeId)
        if (!edge) return

        const sourceNode = findNode(edge.source)
        const targetNode = findNode(edge.target)
        if (!sourceNode) return

        const newNodeId = generateId()
        const x = sourceNode.position.x + HORIZONTAL_SPACING
        const y = sourceNode.position.y + VERTICAL_SPACING

        if (targetNode) pushNodeDown(targetNode.id, y + VERTICAL_SPACING)

        addNodes([createActionNode(newNodeId, x, y)])
        setEdges([
            ...edges.value.filter(e => e.id !== edgeId),
            createEdge(edge.source, newNodeId, edge.sourceHandle ?? undefined),
            createEdge(newNodeId, edge.target),
        ])
        pushEndNodeDown(y)
    }

    const addConditionNodeFromEdge = (edgeId: string) => {
        const edge = edges.value.find(e => e.id === edgeId)
        if (!edge) return

        const sourceNode = findNode(edge.source)
        const targetNode = findNode(edge.target)
        if (!sourceNode) return

        const conditionId = generateId()
        const branchId = generateId()
        const x = sourceNode.position.x
        const y = sourceNode.position.y + VERTICAL_SPACING

        if (targetNode) pushNodeDown(targetNode.id, y + VERTICAL_SPACING)

        addNodes([
            createConditionNode(conditionId, x, y),
            createActionNode(branchId, x + HORIZONTAL_SPACING, y, 'Branch'),
        ])
        setEdges([
            ...edges.value.filter(e => e.id !== edgeId),
            createEdge(edge.source, conditionId, edge.sourceHandle ?? undefined),
            createEdge(conditionId, edge.target, 'source-left'),
            createEdge(conditionId, branchId, 'source-right'),
        ])
        pushEndNodeDown(y)
    }

    const hasOutgoingEdge = (nodeId: string, sourceHandle?: string) => {
        return sourceHandle
            ? edges.value.some(e => e.source === nodeId && e.sourceHandle === sourceHandle)
            : edges.value.some(e => e.source === nodeId)
    }

    const addActionNodeFromHandle = (sourceNodeId: string, sourceHandle: string, offsetX = 0) => {
        const sourceNode = findNode(sourceNodeId)
        if (!sourceNode) return

        const newNodeId = generateId()
        const y = sourceNode.position.y + VERTICAL_SPACING

        addNodes([createActionNode(newNodeId, sourceNode.position.x + offsetX, y)])
        addEdges([createEdge(sourceNodeId, newNodeId, sourceHandle)])
        pushEndNodeDown(y)
    }

    const addConditionNodeFromHandle = (sourceNodeId: string, sourceHandle: string, offsetX = 0) => {
        const sourceNode = findNode(sourceNodeId)
        if (!sourceNode) return

        const conditionId = generateId()
        const branchId = generateId()
        const x = sourceNode.position.x + offsetX
        const y = sourceNode.position.y + VERTICAL_SPACING

        addNodes([
            createConditionNode(conditionId, x, y),
            createActionNode(branchId, x + HORIZONTAL_SPACING, y, 'Branch'),
        ])
        addEdges([
            createEdge(sourceNodeId, conditionId, sourceHandle),
            createEdge(conditionId, branchId, 'source-right'),
        ])
        pushEndNodeDown(y)
    }

    const connectToEnd = (sourceNodeId: string, sourceHandle?: string) => {
        const sourceNode = findNode(sourceNodeId)
        const endNode = findNode(END_NODE_ID)
        if (!sourceNode || !endNode) return

        const minY = sourceNode.position.y + VERTICAL_SPACING

        if (endNode.hidden) {
            updateNode(END_NODE_ID, {
                hidden: false,
                position: { x: sourceNode.position.x, y: minY },
            })
        } else if (endNode.position.y < minY) {
            updateNode(END_NODE_ID, { position: { x: endNode.position.x, y: minY } })
        }

        addEdges([{
            ...createEdge(sourceNodeId, END_NODE_ID, sourceHandle),
            id: `e-${sourceNodeId}-${END_NODE_ID}-${Date.now()}`,
        }])
    }

    const connectToEndFromHandle = (sourceNodeId: string, sourceHandle: string) => {
        connectToEnd(sourceNodeId, sourceHandle)
    }

    return {
        addActionNodeFromNode,
        addConditionNodeFromNode,
        addActionNodeFromEdge,
        addConditionNodeFromEdge,
        addActionNodeFromHandle,
        addConditionNodeFromHandle,
        hasOutgoingEdge,
        connectToEnd,
        connectToEndFromHandle,
    }
}
