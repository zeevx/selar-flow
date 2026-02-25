<script setup lang="ts">
import { Handle, Position, useNode, useVueFlow } from '@vue-flow/core'
import { computed, inject } from 'vue'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAddNode } from '@/composables/useAddNode'
import AddNodeDropdown from './flow/AddNodeDropdown.vue'

interface Product {
    id: number
    name: string
}

const props = defineProps<{
    id: string
    data?: { name: string; products?: Product[]; selectedProduct?: number | null; selectedTrigger?: string }
}>()

const { node } = useNode()
const { edges } = useVueFlow()

if (node.data.trigger === undefined) {
    node.data = { ...node.data, trigger: 'purchased' }
}

const selectedProduct = computed({
    get: () => node.data.product ?? null,
    set: (val) => { node.data = { ...node.data, product: val } }
})

const selectedTrigger = computed({
    get: () => node.data.trigger,
    set: (val) => { node.data = { ...node.data, trigger: val } }
})

const triggers = [
    { value: 'purchased', label: 'Purchased' },
    { value: 'abandoned', label: 'Abandoned' },
]

const { addActionNodeFromNode, addConditionNodeFromNode } = useAddNode()

const isSelected = computed(() => node.selected)
const hasOutgoingEdge = computed(() => edges.value.some(e => e.source === props.id))
const isFlowLive = inject('isFlowLive', computed(() => false))

function handleAddAction() {
    addActionNodeFromNode(props.id)
}

function handleAddCondition() {
    addConditionNodeFromNode(props.id)
}

</script>
<template>
    <div
        class="start nopan overflow-hidden rounded-lg bg-white shadow transition-all duration-200 w-md"
        :class="{ 'ring-2 ring-[#6F3381] shadow-lg shadow-purple-200': isSelected }"
    >
        <div class="px-3 py-2 font-medium">
            Trigger
        </div>
        <div class="bg-gray-50 px-3 py-3 space-y-3">
            <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Product</label>
                <Select v-model="selectedProduct">
                    <SelectTrigger class="w-full">
                        <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem
                            v-for="product in props.data?.products"
                            :key="product.id"
                            :value="String(product.id)"
                        >
                            {{ product.name }}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Trigger</label>
                <Select v-model="selectedTrigger">
                    <SelectTrigger class="w-full">
                        <SelectValue placeholder="Select trigger" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem
                            v-for="trigger in triggers"
                            :key="trigger.value"
                            :value="trigger.value"
                        >
                            {{ trigger.label }}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    </div>

    <Handle class="p-2 bg-[#6F3381] rounded-full" id="start" type="source" :position="Position.Bottom" />

    <div v-if="!hasOutgoingEdge && !isFlowLive" class="absolute left-1/2 -translate-x-1/2 -bottom-14 nodrag nopan">
        <AddNodeDropdown @add-action="handleAddAction" @add-condition="handleAddCondition" />
    </div>
</template>

<style scoped>

</style>
