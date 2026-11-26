<script setup lang="ts">
import BaseItemList from 'prez-ui/app/components/ItemList.vue';
import { publicProfileFormats, type ProfileRow } from '../utils/profileFormats';
import { publicRdfTerm } from '../utils/publicRdf';

defineOptions({ inheritAttrs: false });
const route = useRoute();
const props = defineProps<{ list: ProfileRow[] }>();
const visibleList = computed(() => (route.query._profile === 'altr-ext:alt-profile'
    ? publicProfileFormats(props.list) : props.list).map(publicRdfTerm));
</script>

<template>
    <BaseItemList v-bind="$attrs" :list="visibleList" />
</template>
