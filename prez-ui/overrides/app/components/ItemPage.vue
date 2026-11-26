<script setup lang="ts">
import BaseItemPage from 'prez-ui/app/components/ItemPage.vue';
</script>

<template>
    <BaseItemPage>
        <template #item-members="{ data }">
            <RegisterMembers v-if="data?.data.members && !data.data.rdfTypes?.some(type =>
                ['https://schema.org/Person', 'http://schema.org/Person'].includes(type.value))"
                :path="data.data.members.value" />
        </template>
    </BaseItemPage>
</template>
