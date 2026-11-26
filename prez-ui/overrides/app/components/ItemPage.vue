<script setup lang="ts">
import BaseItemPage from 'prez-ui/app/components/ItemPage.vue';
</script>

<template>
    <BaseItemPage>
        <template #item-members="{ data }">
            <!-- Keep the slot nonempty when no list is shown: an empty Vue slot
                 activates the upstream fallback Members button. -->
            <div>
                <RegisterMembers v-if="data?.data.members && data.data.rdfTypes?.some(type =>
                    ['https://schema.org/DataCatalog', 'http://schema.org/DataCatalog'].includes(type.value))"
                    :path="data.data.members.value" />
            </div>
        </template>
    </BaseItemPage>
</template>
