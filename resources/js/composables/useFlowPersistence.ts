import { useForm } from '@inertiajs/vue3'
import { computed, ref, watch, type Ref } from 'vue'

const EDGE_STYLE = { stroke: '#6F3381', strokeWidth: 2 }
const EXCLUDED_DATA_KEYS = ['products', 'name']

type FlowStatus = 'draft' | 'live'

interface FlowPersistenceOptions {
    nodes: Ref<any[]>
    edges: Ref<any[]>
    initialFlowId?: number | null
    initialStatus?: FlowStatus
}

export function useFlowPersistence({ nodes, edges, initialFlowId = null, initialStatus = 'draft' }: FlowPersistenceOptions) {
    const flowId = ref<number | null>(initialFlowId)
    const status = ref<FlowStatus>(initialStatus)
    const form = useForm({
        id: flowId.value,
        product_id: null as number | null,
        trigger: null as string | null,
        nodes: [] as any[],
        edges: [] as any[],
        status: status.value as string,
    })

    function getUnconnectedOutputs() {
        const connectedOutputs = new Set(
            edges.value.map(e => e.sourceHandle ? `${e.source}:${e.sourceHandle}` : e.source)
        )
        const unconnected: { nodeId: string; handle?: string }[] = []

        nodes.value.forEach(node => {
            if (node.hidden || node.type === 'end') return

            if (node.type === 'condition') {
                if (!connectedOutputs.has(`${node.id}:source-left`)) {
                    unconnected.push({ nodeId: node.id, handle: 'source-left' })
                }
                if (!connectedOutputs.has(`${node.id}:source-right`)) {
                    unconnected.push({ nodeId: node.id, handle: 'source-right' })
                }
            } else {
                if (!connectedOutputs.has(node.id)) {
                    unconnected.push({ nodeId: node.id })
                }
            }
        })
        return unconnected
    }

    function autoConnectToEnd() {
        const unconnected = getUnconnectedOutputs()
        if (unconnected.length === 0) return

        let createdEdge = false
        unconnected.forEach(({ nodeId, handle }) => {
            const alreadyConnectedToEnd = edges.value.some(
                edge => edge.source === nodeId && edge.target === 'end' && (edge.sourceHandle ?? null) === (handle ?? null)
            )
            if (alreadyConnectedToEnd) return

            edges.value.push({
                id: `e-${nodeId}-end-${Date.now()}-${Math.random()}`,
                source: nodeId,
                target: 'end',
                sourceHandle: handle,
                animated: true,
                type: 'custom-action',
                style: EDGE_STYLE,
            })
            createdEdge = true
        })

        if (!createdEdge) return

        const endNode = nodes.value.find(n => n.id === 'end')
        if (endNode) {
            const maxY = Math.max(...nodes.value.filter(n => n.id !== 'end').map(n => n.position.y))
            const avgX = nodes.value
                .filter(n => !n.hidden && n.id !== 'end')
                .reduce((sum, n) => sum + n.position.x, 0) / nodes.value.filter(n => !n.hidden && n.id !== 'end').length

            endNode.position = { x: avgX, y: maxY + 350 }
            endNode.hidden = false
        }
    }

    function serializeNodes() {
        return nodes.value
            .filter(node => !node.hidden)
            .map(({ id, type, position, data }) => ({
                id,
                type,
                position,
                data: Object.fromEntries(
                    Object.entries(data || {}).filter(([key]) => !EXCLUDED_DATA_KEYS.includes(key))
                ),
            }))
    }

    function serializeEdges() {
        return edges.value.map(({ id, source, target, sourceHandle }) => ({
            id,
            source,
            target,
            sourceHandle,
        }))
    }

    function extractStartNodeData() {
        const startNode = nodes.value.find(n => n.type === 'start')
        if (!startNode?.data) return { product_id: null, trigger: null }
        
        const productId = startNode.data.product ? Number(startNode.data.product) : null
        const trigger = startNode.data.trigger || null
        return { product_id: productId, trigger }
    }

    function save(toggle: boolean = false, nextStatus?: FlowStatus) {
        if (form.processing) return
        const statusToPersist = nextStatus ?? status.value

        if (toggle && statusToPersist === 'live') {
            autoConnectToEnd()
        }

        const { product_id, trigger } = extractStartNodeData()
        form.id = flowId.value
        form.product_id = product_id
        form.trigger = trigger
        form.nodes = serializeNodes()
        form.edges = serializeEdges()
        form.status = statusToPersist


        form.post('/flow', {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                status.value = statusToPersist
                if (toggle && statusToPersist === 'live') {
                    window.location.reload()
                }
            },
            onFlash: (flash: any) => {
                if (flash.savedFlowId && !flowId.value) {
                    flowId.value = flash.savedFlowId as number
                }
            },
        })
    }

    function toggleStatus() {
        const nextStatus: FlowStatus = status.value === 'draft' ? 'live' : 'draft'
        save(true, nextStatus)
    }

    let saveTimeout: number | undefined
    function debouncedSave() {
        if (status.value === 'live') return
        if (saveTimeout) clearTimeout(saveTimeout)
        saveTimeout = setTimeout(save, 1000)
    }

    function startAutoSave() {
        watch([nodes, edges], debouncedSave, { deep: true })
    }

    const isLive = computed(() => status.value === 'live')

    return {
        flowId,
        status,
        isLive,
        form,
        toggleStatus,
        startAutoSave,
    }
}
