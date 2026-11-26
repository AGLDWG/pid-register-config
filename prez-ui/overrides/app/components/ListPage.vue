<script setup lang="ts">
import BaseListPage from 'prez-ui/app/components/ListPage.vue';
const route = useRoute();
const isMembersList = computed(() => route.query._profile !== 'altr-ext:alt-profile'
    && /^\/catalogues\/[^/]+(?:\/catalogues\/[^/]+)?\/(catalogues|items)$/.test(route.path));
</script>

<template>
    <BaseListPage v-if="isMembersList">
        <template #default><RegisterMembers :path="route.path" /></template>
    </BaseListPage>
    <BaseListPage v-else />
</template>
