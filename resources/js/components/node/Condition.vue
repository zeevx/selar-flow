<script setup lang="ts">
import { Handle, Position, useNode } from '@vue-flow/core'
import { computed, inject } from 'vue'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAddNode } from '@/composables/useAddNode'
import AddNodeDropdown from './flow/AddNodeDropdown.vue'

const props = defineProps<{
    id: string
    data: { name: string }
}>()

const { node } = useNode()
const { addActionNodeFromHandle, addConditionNodeFromHandle, hasOutgoingEdge, connectToEndFromHandle } = useAddNode()

if (node.data.operator === undefined) {
    node.data = { ...node.data, operator: 'equals' }
}

const selectedProperty = computed({
    get: () => node.data.property ?? '',
    set: (val) => { node.data = { ...node.data, property: val } }
})

const selectedOperator = computed({
    get: () => node.data.operator ?? 'equals',
    set: (val) => { node.data = { ...node.data, operator: val } }
})

const conditionValue = computed({
    get: () => node.data.value ?? '',
    set: (val) => { node.data = { ...node.data, value: val } }
})

const properties = [
    { group: 'Purchase', options: [
        { value: 'purchase_email', label: 'Customer Email' },
        { value: 'purchase_quantity', label: 'Quantity' },
        { value: 'purchase_total_price', label: 'Total Price' },
    ]},
]

const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'greater_or_equal', label: 'Greater or Equal' },
    { value: 'less_or_equal', label: 'Less or Equal' },
]

const isSelected = computed(() => node.selected)
const hasLeftEdge = computed(() => hasOutgoingEdge(props.id, 'source-left'))
const hasRightEdge = computed(() => hasOutgoingEdge(props.id, 'source-right'))
const isFlowLive = inject('isFlowLive', computed(() => false))

function handleAddActionLeft() {
    addActionNodeFromHandle(props.id, 'source-left', -100)
}

function handleAddConditionLeft() {
    addConditionNodeFromHandle(props.id, 'source-left', -100)
}

function handleAddActionRight() {
    addActionNodeFromHandle(props.id, 'source-right', 100)
}

function handleAddConditionRight() {
    addConditionNodeFromHandle(props.id, 'source-right', 100)
}

function handleAddEndLeft() {
    connectToEndFromHandle(props.id, 'source-left')
}

function handleAddEndRight() {
    connectToEndFromHandle(props.id, 'source-right')
}
</script>

<template>
    <div
        class="condition nopan overflow-hidden rounded-lg bg-white shadow min-w-[220px] transition-all duration-200 w-md"
        :class="{ 'ring-2 ring-amber-500 shadow-lg shadow-amber-200': isSelected }"
    >
        <div class="px-3 py-2 bg-amber-500 text-white font-medium">
            Condition
        </div>
        <div class="bg-gray-50 px-3 py-3 space-y-3">
            <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Property</label>
                <Select v-model="selectedProperty">
                    <SelectTrigger class="w-full">
                        <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup v-for="group in properties" :key="group.group">
                            <SelectLabel>{{ group.group }}</SelectLabel>
                            <SelectItem
                                v-for="opt in group.options"
                                :key="opt.value"
                                :value="opt.value"
                            >
                                {{ opt.label }}
                            </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
            <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Operator</label>
                <Select v-model="selectedOperator">
                    <SelectTrigger class="w-full">
                        <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem
                            v-for="op in operators"
                            :key="op.value"
                            :value="op.value"
                        >
                            {{ op.label }}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Value</label>
                <Input
                    v-model="conditionValue"
                    type="text"
                    placeholder="Enter value"
                />
            </div>
        </div>
    </div>

    <Handle class="p-2 bg-amber-500 rounded-full" id="target" type="target" :position="Position.Top" />
    <Handle class="p-2 bg-amber-500 rounded-full" id="source-left" type="source" :position="Position.Bottom" style="left: 25%" />
    <Handle class="p-2 bg-amber-500 rounded-full" id="source-right" type="source" :position="Position.Bottom" style="left: 75%" />

    <div v-if="!hasLeftEdge && !isFlowLive" class="absolute -bottom-14 nodrag nopan" style="left: 25%; transform: translateX(-50%)">
        <AddNodeDropdown :show-end="true" @add-action="handleAddActionLeft" @add-condition="handleAddConditionLeft" @add-end="handleAddEndLeft" />
    </div>

    <div v-if="!hasRightEdge && !isFlowLive" class="absolute -bottom-14 nodrag nopan" style="left: 75%; transform: translateX(-50%)">
        <AddNodeDropdown :show-end="true" @add-action="handleAddActionRight" @add-condition="handleAddConditionRight" @add-end="handleAddEndRight" />
    </div>
</template>

<style scoped>

</style>
