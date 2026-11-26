<script setup lang="ts">
import { parseMembers, sortMembers, type MemberNode, type RegisterMember } from '../utils/memberList';

const props = defineProps<{ path: string }>();
const apiEndpoint = useGetPrezAPIEndpoint();
const route = useRoute();
const members = ref<RegisterMember[]>([]);
const loading = ref(true);
const failed = ref(false);
const page = computed(() => Math.max(1, Number(route.query.page) || 1));
const limit = computed(() => Math.max(1, Number(route.query.limit) || 100));
const sorted = computed(() => sortMembers(members.value));
const visibleMembers = computed(() => sorted.value.slice((page.value - 1) * limit.value, page.value * limit.value));

watch(() => props.path, async (path, _, onCleanup) => {
    if (!import.meta.client) return;
    const controller = new AbortController();
    onCleanup(() => controller.abort());
    loading.value = true;
    failed.value = false;
    members.value = [];
    try {
        const collected = new Map<string, RegisterMember>();
        for (let number = 1; ; number++) {
            const url = new URL(path, apiEndpoint + '/');
            url.searchParams.set('page', String(number));
            url.searchParams.set('limit', '100');
            url.searchParams.set('_profile', 'https://w3id.org/profile/mem');
            const data = await $fetch<MemberNode[]>(apiEndpoint + url.pathname, {
                query: Object.fromEntries(url.searchParams),
                headers: { Accept: 'application/anot+ld+json' }, responseType: 'json', signal: controller.signal,
            });
            const batch = parseMembers(data);
            const previousSize = collected.size;
            batch.forEach(member => collected.set(member.iri, member));
            if (batch.length < 100) break;
            if (collected.size === previousSize) throw new Error('Member pagination did not advance');
        }
        if (!controller.signal.aborted) members.value = [...collected.values()];
    } catch {
        if (!controller.signal.aborted) failed.value = true;
    } finally {
        if (!controller.signal.aborted) loading.value = false;
    }
}, { immediate: true });
</script>

<template>
    <section class="register-members mt-8" aria-label="Members">
        <h2 class="text-xl mb-4">Members</h2>
        <p v-if="loading" role="status">Loading members…</p>
        <p v-else-if="failed" role="alert">Unable to load members. Please reload the page to try again.</p>
        <template v-else>
            <ul class="divide-y">
                <li v-for="member in visibleMembers" :key="member.iri" class="py-3">
                    <NuxtLink :to="member.url">{{ member.label }}</NuxtLink>
                </li>
            </ul>
            <p v-if="!members.length">No members.</p>
            <PrezPagination v-if="members.length" :total-items="members.length"
                :pagination="{ page, limit, first: (page - 1) * limit + 1 }" :max-reached="true" />
        </template>
    </section>
</template>
