<script setup lang="ts">
import { Handle, Position, useNode, useVueFlow } from '@vue-flow/core'
import { computed, inject } from 'vue'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAddNode } from '@/composables/useAddNode'
import AddNodeDropdown from './flow/AddNodeDropdown.vue'

const props = defineProps<{
    id: string
    data: { name: string }
}>()

const { node } = useNode()
const { edges } = useVueFlow()
const { addActionNodeFromNode, addConditionNodeFromNode, connectToEnd } = useAddNode()

if (node.data.type === undefined) {
    node.data = { ...node.data, type: 'delay', duration: 1, unit: 'hours' }
}

const actions = [
    { value: 'delay', label: 'Delay' },
    { value: 'send_email', label: 'Send Email' },
]

const delayUnits = [
    { value: 'minutes', label: 'Minutes' },
    { value: 'hours', label: 'Hours' },
    { value: 'days', label: 'Days' },
]

const selectedAction = computed({
    get: () => node.data.type ?? 'delay',
    set: (val) => { node.data = { ...node.data, type: val } }
})

const delayDuration = computed({
    get: () => node.data.duration ?? 1,
    set: (val) => { node.data = { ...node.data, duration: val } }
})

const delayUnit = computed({
    get: () => node.data.unit ?? 'hours',
    set: (val) => { node.data = { ...node.data, unit: val } }
})

const emailSubject = computed({
    get: () => node.data.subject ?? '',
    set: (val) => { node.data = { ...node.data, subject: val } }
})

const emailBody = computed({
    get: () => node.data.body ?? '',
    set: (val) => { node.data = { ...node.data, body: val } }
})

const isSelected = computed(() => node.selected)
const hasOutgoingEdge = computed(() => edges.value.some(e => e.source === props.id))
const isFlowLive = inject('isFlowLive', computed(() => false))

function handleAddAction() {
    addActionNodeFromNode(props.id)
}

function handleAddCondition() {
    addConditionNodeFromNode(props.id)
}

function handleAddEnd() {
    connectToEnd(props.id)
}
</script>

<template>
    <div
        class="action nopan overflow-hidden rounded-lg bg-white shadow min-w-[180px] transition-all duration-200 w-md"
        :class="{ 'ring-2 ring-[#6F3381] shadow-lg shadow-purple-200': isSelected }"
    >
        <div class="px-3 py-2 bg-[#6F3381] text-white font-medium">
            Action
        </div>
        <div class="bg-gray-50 px-3 py-3 space-y-3">
            <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Action Type</label>
                <Select v-model="selectedAction">
                    <SelectTrigger class="w-full">
                        <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem
                            v-for="action in actions"
                            :key="action.value"
                            :value="action.value"
                        >
                            {{ action.label }}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <template v-if="selectedAction === 'delay'">
                <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Duration</label>
                    <div class="flex gap-2">
                        <Input
                            v-model="delayDuration"
                            type="number"
                            min="1"
                            class="w-20"
                        />
                        <Select v-model="delayUnit">
                            <SelectTrigger class="flex-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem
                                    v-for="unit in delayUnits"
                                    :key="unit.value"
                                    :value="unit.value"
                                >
                                    {{ unit.label }}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </template>

            <template v-if="selectedAction === 'send_email'">
                <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                    <Input
                        v-model="emailSubject"
                        type="text"
                        placeholder="Email subject"
                    />
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Body</label>
                    <textarea
                        v-model="emailBody"
                        rows="3"
                        placeholder="Email body"
                        class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    ></textarea>
                </div>
            </template>
        </div>
    </div>

    <Handle class="p-2 bg-[#6F3381] rounded-full" id="target" type="target" :position="Position.Top" />
    <Handle class="p-2 bg-[#6F3381] rounded-full" id="source" type="source" :position="Position.Bottom" />

    <div v-if="!hasOutgoingEdge && !isFlowLive" class="absolute left-1/2 -translate-x-1/2 -bottom-14 nodrag nopan">
        <AddNodeDropdown :show-end="true" @add-action="handleAddAction" @add-condition="handleAddCondition" @add-end="handleAddEnd" />
    </div>
</template>

<style scoped>

</style>
