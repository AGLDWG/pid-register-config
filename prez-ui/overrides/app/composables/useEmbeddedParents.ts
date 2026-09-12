import { embeddedParentsQuery, embeddingResourceFromJsonLd, type EmbeddedMatch, type EmbeddingResource } from '../utils/embeddedParents';

interface ParentBinding {
    hash: { value: string };
    owner: { value: string };
    label?: { value: string };
}

export function useEmbeddedParents(matches: Ref<EmbeddedMatch[]>) {
    const apiEndpoint = useGetPrezAPIEndpoint();
    const parents = ref<Record<string, EmbeddingResource[]>>({});
    const loading = ref(false);
    const failed = ref(false);
    const cache = useState<Record<string, { resource: EmbeddingResource; fetchedAt: number }>>('embedding-resource-links', () => ({}));

    watch(matches, async (results, _, onCleanup) => {
        if (!import.meta.client) return;
        const controller = new AbortController();
        onCleanup(() => controller.abort());
        parents.value = {};
        failed.value = false;
        loading.value = results.length > 0;
        if (!results.length) return;
        try {
            const data = await $fetch<{ results: { bindings: ParentBinding[] } }>(`${apiEndpoint}/sparql`, {
                method: 'POST',
                headers: { Accept: 'application/sparql-results+json' },
                body: new URLSearchParams({ query: embeddedParentsQuery(results) }),
                signal: controller.signal,
            });
            const owners = [...new Map(data.results.bindings.map(row => [row.owner.value, row])).values()];
            const resolved: Record<string, EmbeddingResource> = {};
            // Fetch each distinct parent's canonical link once, with bounded concurrency.
            for (let index = 0; index < owners.length; index += 4) {
                await Promise.all(owners.slice(index, index + 4).map(async row => {
                    const iri = row.owner.value;
                    const key = `${apiEndpoint}|${iri}`;
                    const cached = cache.value[key];
                    if (cached && Date.now() - cached.fetchedAt < 600_000) {
                        resolved[iri] = cached.resource;
                        return;
                    }
                    const label = row.label?.value || iri;
                    try {
                        const item = await $fetch<Parameters<typeof embeddingResourceFromJsonLd>[2]>(`${apiEndpoint}/object`, {
                            query: { iri },
                            headers: { Accept: 'application/anot+ld+json' },
                            // ofetch does not infer JSON for Prez's double-suffix media type.
                            responseType: 'json',
                            signal: controller.signal,
                        });
                        const resource = embeddingResourceFromJsonLd(iri, label, item);
                        resolved[iri] = resource;
                        cache.value[key] = { resource, fetchedAt: Date.now() };
                    } catch (error) {
                        if (controller.signal.aborted) throw error;
                        // The verified parent IRI still provides a working generic resource link.
                        resolved[iri] = embeddingResourceFromJsonLd(iri, label, []);
                    }
                }));
            }
            if (controller.signal.aborted) return;
            const grouped: Record<string, EmbeddingResource[]> = {};
            for (const row of data.results.bindings) {
                const entries = grouped[row.hash.value] ||= [];
                const resource = resolved[row.owner.value]!;
                if (!entries.some(entry => entry.iri === resource.iri)) entries.push(resource);
            }
            parents.value = grouped;
        } catch {
            if (!controller.signal.aborted) failed.value = true;
        } finally {
            if (!controller.signal.aborted) loading.value = false;
        }
    }, { immediate: true });

    return { parents, loading, failed };
}
