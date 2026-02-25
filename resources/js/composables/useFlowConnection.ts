import type { Connection } from '@vue-flow/core'
import type { Ref } from 'vue'

const EDGE_STYLE = { stroke: '#6F3381', strokeWidth: 2 }

interface FlowConnectionOptions {
    nodes: Ref<any[]>
    edges: Ref<any[]>
}

export function useFlowConnection({ nodes, edges }: FlowConnectionOptions) {
    function isConnected(sourceId: string, targetId: string, visited: Set<string> = new Set()): boolean {
        if (visited.has(sourceId)) return false
        visited.add(sourceId)

        for (const edge of edges.value) {
            if (edge.source === sourceId) {
                if (edge.target === targetId) return true
                if (isConnected(edge.target, targetId, visited)) return true
            }
        }
        return false
    }

    function getNodeType(nodeId: string): string | undefined {
        return nodes.value.find(n => n.id === nodeId)?.type
    }

    function isValidConnection(connection: Connection): boolean {
        if (!connection.source || !connection.target) return false
        if (connection.source === connection.target) return false

        const sourceType = getNodeType(connection.source)
        const targetType = getNodeType(connection.target)

        const sourceHandles = ['source', 'source-left', 'source-right', 'start']
        const targetHandle = connection.targetHandle || 'target'
        if (sourceHandles.includes(targetHandle)) return false

        if ((sourceType === 'action' || sourceType === 'condition') && connection.sourceHandle === 'target') return false

        if (sourceType === 'start' && targetType === 'end') return false
        if (targetType === 'end' && sourceType !== 'action' && sourceType !== 'condition') return false
        if (sourceType === 'end') return false
        if (targetType === 'start') return false

        const directlyConnected = edges.value.some(
            e => e.source === connection.source && e.target === connection.target
        )
        if (directlyConnected) return false

        if (isConnected(connection.source, connection.target)) return false
        if (isConnected(connection.target, connection.source)) return false

        return true
    }

    function onConnect(connection: Connection) {
        if (!isValidConnection(connection)) return

        edges.value.push({
            ...connection,
            id: `e-${connection.source}-${connection.target}-${Date.now()}`,
            animated: true,
            type: 'custom-action',
            style: EDGE_STYLE,
        })
    }

    return {
        isValidConnection,
        onConnect,
    }
}
