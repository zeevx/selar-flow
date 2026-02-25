<script setup lang="ts">
import { PlusSquare, Workflow, GitBranch, CircleStop } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

defineProps<{
    showEnd?: boolean
}>()

const emit = defineEmits<{
    addAction: []
    addCondition: []
    addEnd: []
}>()
</script>

<template>
    <DropdownMenu>
        <DropdownMenuTrigger as-child>
            <Button class="bg-[#6F3381] hover:cursor-pointer hover:bg-[#6F3381]" variant="default" size="icon">
                <PlusSquare class="h-4 w-4" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-48">
            <DropdownMenuItem @click="emit('addAction')">
                <Workflow class="mr-2 h-4 w-4" />
                <span>Add Action</span>
            </DropdownMenuItem>
            <DropdownMenuItem @click="emit('addCondition')">
                <GitBranch class="mr-2 h-4 w-4" />
                <span>Add Condition</span>
            </DropdownMenuItem>
            <DropdownMenuItem v-if="showEnd" @click="emit('addEnd')">
                <CircleStop class="mr-2 h-4 w-4" />
                <span>End</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>
