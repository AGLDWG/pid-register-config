<script lang="ts" setup>
const route = useRoute();
const props = defineProps<{
    totalItems: number;
    pagination: { limit: number; page: number; first: number };
    maxReached: boolean;
}>();

// A count can be a lower bound. maxReached indicates whether it is the final total.
const lastKnownPage = computed(() => Math.max(1, Math.ceil(props.totalItems / props.pagination.limit)));
const hasNext = computed(() => !props.maxReached || props.pagination.page < lastKnownPage.value);
const pageLink = (page: number) => ({ path: route.path, query: { ...route.query, page: String(page) } });
</script>

<template>
    <div class="pagination pid-pagination">
        <nav v-if="pagination.page > 1 || hasNext" aria-label="Pagination">
            <NuxtLink v-if="pagination.page > 1" :to="pageLink(1)">First</NuxtLink>
            <NuxtLink v-if="pagination.page > 1" :to="pageLink(pagination.page - 1)">Previous</NuxtLink>
            <span aria-current="page">Page {{ pagination.page }}</span>
            <NuxtLink v-if="hasNext" :to="pageLink(pagination.page + 1)">Next</NuxtLink>
            <NuxtLink v-if="maxReached && pagination.page < lastKnownPage" :to="pageLink(lastKnownPage)">Last</NuxtLink>
        </nav>
        <PageLimitSelect :limit="pagination.limit" />
        <p v-if="totalItems >= pagination.first" class="pagination-text">
            Showing {{ pagination.first }} to {{ Math.min(pagination.first + pagination.limit - 1, totalItems) }}
            of {{ totalItems }}{{ maxReached ? '' : '+' }} items
        </p>
        <p v-else>No items on this page.</p>
    </div>
</template>
