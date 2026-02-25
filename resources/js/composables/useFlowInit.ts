import { Position } from '@vue-flow/core'
import { ref } from 'vue'

const EDGE_STYLE = { stroke: '#6F3381', strokeWidth: 2 }

interface Product {
    id: number
    name: string
}

interface Flow {
    id: number
    name: string
    nodes: any[]
    edges: any[]
}

interface FlowInitOptions {
    products: Product[]
    flow: Flow | null
}

export function useFlowInit({ products, flow }: FlowInitOptions) {
    const defaultNodes = [
        {
            id: '1',
            type: 'start',
            label: 'Start',
            position: { x: 500, y: 50 },
            data: { name: 'Entry', products },
            deletable: false,
        },
        {
            id: 'end',
            type: 'end',
            label: 'End',
            position: { x: 450, y: 600 },
            data: { name: 'End' },
            targetPosition: Position.Top,
            deletable: false,
            hidden: true,
        },
    ]

    const endNode = defaultNodes[1]

    function initEdges() {
        return (flow?.edges ?? []).map(edge => ({
            ...edge,
            animated: true,
            type: 'custom-action',
            style: EDGE_STYLE,
        }))
    }

    const loadedEdges = initEdges()
    const hasEndConnection = loadedEdges.some(e => e.target === 'end')

    function initNodes() {
        if (!flow?.nodes) return defaultNodes

        const loadedNodes = flow.nodes
        const hasEnd = loadedNodes.some(n => n.id === 'end')
        
        const endNodeWithVisibility = {
            ...endNode,
            hidden: !hasEndConnection,
        }
        
        const nodesWithEnd = hasEnd ? loadedNodes : [...loadedNodes, endNodeWithVisibility]

        const startNode = nodesWithEnd.find(n => n.type === 'start')
        if (startNode && !startNode.data?.products) {
            startNode.data = { ...startNode.data, products }
        }

        const endNodeInList = nodesWithEnd.find(n => n.id === 'end')
        if (endNodeInList && hasEndConnection) {
            endNodeInList.hidden = false
        }

        return nodesWithEnd
    }

    const nodes = ref(initNodes())
    const edges = ref<any[]>(loadedEdges)

    return {
        nodes,
        edges,
    }
}
