<script setup lang="ts">
import '@vue-flow/core/dist/style.css'
import { Head } from '@inertiajs/vue3'
import { Background } from '@vue-flow/background'
import { VueFlow } from '@vue-flow/core'
import { provide } from 'vue'
import Action from '@/components/node/Action.vue'
import Condition from '@/components/node/Condition.vue'
import End from '@/components/node/End.vue'
import CustomActionButton from '@/components/node/flow/CustomActionButton.vue'
import CustomConnectionLine from '@/components/node/flow/CustomConnectionLine.vue'
import Start from '@/components/node/Start.vue'
import { useFlowConnection } from '@/composables/useFlowConnection'
import { useFlowInit } from '@/composables/useFlowInit'
import { useFlowPersistence } from '@/composables/useFlowPersistence'

interface Product {
    id: number
    name: string
}

interface Flow {
    id: number
    name: string
    nodes: any[]
    edges: any[]
    status: 'draft' | 'live'
}

const props = defineProps<{
    products: Product[]
    flow: Flow | null
}>()

const { nodes, edges } = useFlowInit({
    products: props.products,
    flow: props.flow,
})

const { form, status, isLive, toggleStatus, startAutoSave } = useFlowPersistence({
    nodes,
    edges,
    initialFlowId: props.flow?.id ?? null,
    initialStatus: props.flow?.status ?? 'draft',
})

const { onConnect } = useFlowConnection({ nodes, edges })

provide('isFlowLive', isLive)

startAutoSave()
</script>

<template>
    <Head title="Selar Flow" />
    <div>
        <div class="flex justify-between items-center p-4 bg-[#6F3381] text-white">
            <span class="font-medium">Selar Flow</span>
            <div class="flex items-center gap-4">
                <span v-if="status === 'draft'">
                    <span v-if="form.processing" class="text-sm opacity-75">Saving...</span>
                    <span v-else class="text-sm opacity-75">Auto-saved</span>
                </span>
                <button
                    @click="toggleStatus()"
                    :disabled="form.processing"
                    class="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition"
                    :class="status === 'live'
                        ? 'bg-green-500 text-white'
                        : 'bg-white/20 text-white'"
                >
                    <span class="w-2 h-2 rounded-full" :class="status === 'live' ? 'bg-white' : 'bg-white/50'" />
                    {{ status === 'live' ? 'Live' : 'Draft' }}
                </button>
            </div>
        </div>

        <div class="max-h-screen">

            <div style="width: 100vw; height: 100vh;">
                <VueFlow
                    v-model:nodes="nodes"
                    v-model:edges="edges"
                    class="custom-node-flow"
                    :default-viewport="{ x: 0, y: 0, zoom: 1 }"
                    :min-zoom="0.2"
                    :max-zoom="1.5"
                    :connection-radius="30"
                    :nodes-draggable="!isLive"
                    :nodes-connectable="!isLive"
                    :elements-selectable="!isLive"
                    @connect="onConnect"
                >
                    <Background pattern-color="#aaa" :gap="16" />

                    <template #connection-line="{ sourceX, sourceY, targetX, targetY }">
                        <CustomConnectionLine
                            :source-x="sourceX"
                            :source-y="sourceY"
                            :target-x="targetX"
                            :target-y="targetY"
                        />
                    </template>


                    <template #edge-custom-action="buttonEdgeProps">
                        <CustomActionButton
                            :id="buttonEdgeProps.id"
                            :source-x="buttonEdgeProps.sourceX"
                            :source-y="buttonEdgeProps.sourceY"
                            :target-x="buttonEdgeProps.targetX"
                            :target-y="buttonEdgeProps.targetY"
                            :source-position="buttonEdgeProps.sourcePosition"
                            :target-position="buttonEdgeProps.targetPosition"
                            :marker-end="buttonEdgeProps.markerEnd"
                            :style="buttonEdgeProps.style"
                            :selected="buttonEdgeProps.selected"
                            :disabled="isLive"
                        />
                    </template>

                    <template #node-start="props">
                        <Start :id="props.id" :data="props.data" />
                    </template>

                    <template #node-end="props">
                        <End :id="props.id" :data="props.data" />
                    </template>

                    <template #node-action="props">
                        <Action :id="props.id" :data="props.data" />
                    </template>

                    <template #node-condition="props">
                        <Condition :id="props.id" :data="props.data" />
                    </template>
                </VueFlow>
            </div>
        </div>
    </div>
</template>
