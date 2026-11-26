<script setup lang="ts">
import BaseNode from 'prez-ui/app/components/Node.vue';
import { definitionLink, localDefinitionsQuery } from '../utils/localDefinitions';
import { isPrezVocabulary } from '../utils/publicRdf';

defineOptions({ inheritAttrs: false });
const props = defineProps<{ term: { value: string; termType?: string; [key: string]: unknown } }>();
const apiEndpoint = useGetPrezAPIEndpoint();
// A single shared request checks actual type declarations in the data repository.
// Labels supplied by Prez's annotation vocabulary do not make a term local.
const { data: definitions } = useAsyncData(`local-definitions:${apiEndpoint}`, async () => {
    const result = await $fetch<{ results: { bindings: { iri: { value: string } }[] } }>(`${apiEndpoint}/sparql`, {
        method: 'POST',
        headers: { Accept: 'application/sparql-results+json' },
        body: new URLSearchParams({ query: localDefinitionsQuery }),
    });
    return result.results.bindings.map(row => row.iri.value);
}, { server: false, dedupe: 'defer' });
const linkedTerm = computed(() => definitions.value?.includes(props.term.value)
    ? { ...props.term, links: [{ value: definitionLink(props.term.value) }] }
    : props.term);
</script>

<template>
    <BaseNode v-if="!isPrezVocabulary(term.value)" :key="linkedTerm.links?.[0]?.value || term.value" v-bind="$attrs" :term="linkedTerm">
        <template v-for="(_, name) in $slots" #[name]="slotProps">
            <slot :name="name" v-bind="slotProps || {}" />
        </template>
    </BaseNode>
</template>
