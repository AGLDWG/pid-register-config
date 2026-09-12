<script lang="ts" setup>
interface ResourceLink {
    value: string;
    parents?: { url: string; label?: { value: string } }[];
}

interface ResourceType {
    value: string;
    curie?: string;
    label?: { value: string };
    identifiers?: { value: string }[];
    links?: ResourceLink[];
}

// Structural fields used here; prez-components is a dependency of the upstream layer only.
interface SearchResult {
    hash: string;
    weight?: number;
    resource: {
        termType: string;
        value: string;
        label?: { value: string };
        description?: { value: string };
        links?: ResourceLink[];
        rdfTypes?: ResourceType[];
        properties?: Record<string, { objects: ResourceType[] }>;
    };
    predicate: { value: string; label?: { value: string } };
    match: { value: string };
}

const props = defineProps<{ results: SearchResult[] }>();
const sortedResults = computed(() => [...props.results].sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0)));
const embeddedMatches = computed(() => props.results.filter(result => result.resource.termType === 'BlankNode'));
const { parents: embeddingParents, loading: parentsLoading, failed: parentsFailed } = useEmbeddedParents(embeddedMatches);
const parentsFor = (result: SearchResult) => embeddingParents.value[result.hash.replace(/^urn:hash:/, '')] || [];
const resourceUrl = (resource: SearchResult["resource"] | ResourceType) =>
    resource.links?.[0]?.value || { path: '/object', query: { iri: resource.value } };
const resourceTypes = (result: SearchResult) => (result.resource.rdfTypes?.length
    ? result.resource.rdfTypes
    : result.resource.properties?.['http://www.w3.org/1999/02/22-rdf-syntax-ns#type']?.objects || [])
    .filter(type => !/^https?:\/\/olis\.dev[\/#]/.test(type.value)
        && !type.value.startsWith('olis:')
        && !type.curie?.startsWith('olis:')
        && !type.identifiers?.some(identifier => identifier.value.startsWith('olis:')));
const typeName = (type: ResourceType) => {
    const identifier = type.curie || type.identifiers?.[0]?.value;
    if (identifier) return identifier;
    // Some API type annotations have a label but omit their compact identifier.
    const namespaces = [
        ['https://schema.org/', 'schema'],
        ['http://schema.org/', 'schema'],
        ['https://olis.dev/', 'olis'],
    ];
    const namespace = namespaces.find(([iri]) => type.value.startsWith(iri!));
    return namespace ? `${namespace[1]}:${type.value.slice(namespace[0]!.length)}` : type.label?.value || type.value;
};
const parentPath = (result: SearchResult) => {
    const link = result.resource.links?.[0];
    return link?.parents?.filter(parent => parent.label && parent.url !== link.value) || [];
};
</script>

<template>
    <ul class="pid-search-results" aria-label="Search results">
        <li v-for="result in sortedResults" :key="result.hash">
            <div class="pid-search-result-header">
                <div class="pid-search-result-title">
                    <span v-for="parent in parentPath(result)" :key="parent.url" class="pid-search-parent">
                        <NuxtLink :to="parent.url">{{ parent.label?.value }}</NuxtLink>
                        <span aria-hidden="true"> › </span>
                    </span>
                    <NuxtLink
                        v-if="result.resource.termType === 'NamedNode'"
                        :to="resourceUrl(result.resource)"
                    >{{ result.resource.label?.value || result.resource.value }}</NuxtLink>
                    <NuxtLink v-else-if="parentsFor(result).length" :to="parentsFor(result)[0]!.url">
                        {{ result.resource.label?.value || result.match.value || 'Matching record' }}
                    </NuxtLink>
                    <span v-else>{{ result.resource.label?.value || result.match.value || 'Matching record' }}</span>
                </div>
                <div v-if="resourceTypes(result).length" class="pid-search-types" aria-label="Resource types">
                    <NuxtLink
                        v-for="type in resourceTypes(result)"
                        :key="type.value"
                        :to="type.links?.[0]?.value || type.value"
                        :title="`${type.label?.value || typeName(type)} (${type.value})`"
                    >{{ typeName(type) }}</NuxtLink>
                </div>
            </div>
            <div v-if="result.resource.termType === 'NamedNode'" class="pid-search-resource-links">
                <p v-for="link in result.resource.links" :key="link.value">
                    Path: <NuxtLink :to="link.value">{{ link.value }}</NuxtLink>
                </p>
                <p>IRI: <a :href="result.resource.value">{{ result.resource.value }}</a></p>
            </div>
            <div v-else class="pid-search-resource-links">
                <div v-for="parent in parentsFor(result)" :key="parent.iri">
                    <p>Embedded in: <NuxtLink :to="parent.url">{{ parent.label }}</NuxtLink></p>
                    <p>Path: <NuxtLink :to="parent.url">{{ parent.url }}</NuxtLink></p>
                </div>
                <p v-if="!parentsFor(result).length">
                    {{ parentsLoading ? 'Finding containing resource…' : parentsFailed ? 'Unable to load containing resource links.' : 'No containing resource found.' }}
                </p>
            </div>
            <p v-if="result.resource.description">{{ result.resource.description.value }}</p>
            <p class="pid-search-match">
                Matched on {{ result.predicate.label?.value || result.predicate.value }}:
                {{ result.match.value }}
            </p>
        </li>
    </ul>
</template>
