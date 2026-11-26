<script setup lang="ts">
import BaseItemTable from 'prez-ui/app/components/ItemTable.vue';
import { publicRdfTerm, type DisplayTerm } from '../utils/publicRdf';

defineOptions({ inheritAttrs: false });
const props = defineProps<{ term: DisplayTerm }>();
const visibleTerm = computed(() => publicRdfTerm(props.term));
</script>

<template>
    <BaseItemTable v-bind="$attrs" :term="visibleTerm" />
</template>
