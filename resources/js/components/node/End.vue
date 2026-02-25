<script setup lang="ts">
import { Handle, Position, useNode } from '@vue-flow/core'
import { computed } from 'vue'

const { node } = useNode()
const isSelected = computed(() => node.selected)
</script>

<template>
    <div
        class="end nopan overflow-hidden rounded-lg bg-white shadow transition-all duration-200 w-md"
        :class="{ 'ring-2 ring-[#6F3381] shadow-lg shadow-purple-200': isSelected }"
    >
        <div class="px-3 py-2">
            End
        </div>
        <div class="bg-gray-50 px-3 py-2 text-sm">
            We use less vertical padding on card footers at all sizes than on headers or body sections
        </div>
    </div>

    <Handle class="p-2 bg-[#6F3381] rounded-full" id="end" type="target" :position="Position.Top" />
</template>

<style scoped>

</style>
