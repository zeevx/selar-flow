<script setup lang="ts">
import type { Position } from '@vue-flow/core';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@vue-flow/core'
import { computed } from 'vue'
import { useAddNode } from '@/composables/useAddNode'
import AddNodeDropdown from './AddNodeDropdown.vue'

const props = defineProps({
    id: {
        type: String,
        required: true,
    },
    sourceX: {
        type: Number,
        required: true,
    },
    sourceY: {
        type: Number,
        required: true,
    },
    targetX: {
        type: Number,
        required: true,
    },
    targetY: {
        type: Number,
        required: true,
    },
    sourcePosition: {
        type: String,
        required: true,
    },
    targetPosition: {
        type: String,
        required: true,
    },
    markerEnd: {
        type: String,
        required: false,
    },
    style: {
        type: Object,
        required: false,
    },
    selected: {
        type: Boolean,
        required: false,
        default: false,
    },
    disabled: {
        type: Boolean,
        required: false,
        default: false,
    },
})

const { addActionNodeFromEdge, addConditionNodeFromEdge } = useAddNode()

const path = computed(() => getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition as Position,
    targetPosition: props.targetPosition as Position,
}))

function handleAddAction() {
    addActionNodeFromEdge(props.id)
}

function handleAddCondition() {
    addConditionNodeFromEdge(props.id)
}
</script>

<template>
    <BaseEdge
        :id="id"
        :path="path[0]"
        :marker-end="markerEnd"
        :style="{
            ...style,
            stroke: selected ? '#9333ea' : style?.stroke,
            strokeWidth: selected ? 3 : style?.strokeWidth,
            filter: selected ? 'drop-shadow(0 0 4px rgba(147, 51, 234, 0.5))' : 'none',
            transition: 'stroke 0.2s ease, stroke-width 0.2s ease, filter 0.2s ease',
        }"
    />

    <EdgeLabelRenderer v-if="!disabled">
        <div
            :style="{
        pointerEvents: 'all',
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${path[1]}px,${path[2]}px)`,
      }"
            class="nodrag nopan"
        >
            <AddNodeDropdown @add-action="handleAddAction" @add-condition="handleAddCondition" />
        </div>
    </EdgeLabelRenderer>
</template>

<style scoped>

</style>
