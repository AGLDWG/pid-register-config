export interface EmbeddedMatch {
    hash: string;
    weight?: number;
    predicate: { value: string };
    match: { value: string };
}

export interface EmbeddingResource {
    iri: string;
    label: string;
    url: string;
}

export function embeddedParentsQuery(matches: EmbeddedMatch[]): string {
    // Use Prez's search-result hash, not response-scoped blank-node IDs or labels,
    // to distinguish embedded records with identical names in different PIDs.
    const rows = matches.map(result => [
        result.hash.replace(/^urn:hash:/, ''), result.predicate.value,
        result.match.value, String(result.weight ?? 0),
    ].map(value => JSON.stringify(value)).join(' '));
    return `SELECT DISTINCT ?hash ?owner ?label WHERE {
        VALUES (?hash ?predicateIri ?matchText ?weightText) {
            ${rows.map(row => `(${row})`).join('\n')}
        }
        BIND(IRI(?predicateIri) AS ?predicate)
        ?embedded ?predicate ?matchedValue .
        FILTER(isBlank(?embedded) && STR(?matchedValue) = ?matchText)
        FILTER(SHA256(CONCAT(STR(?embedded), STR(?predicate), STR(?matchedValue), ?weightText)) = ?hash)
        ?owner ?embeddingPredicate ?embedded .
        FILTER(isIRI(?owner))
        OPTIONAL { ?owner <https://schema.org/name> ?label }
    }`;
}

interface JsonLdNode {
    '@id'?: string;
    [predicate: string]: unknown;
}

export function embeddingResourceFromJsonLd(iri: string, label: string, data: JsonLdNode[]): EmbeddingResource {
    // Annotated JSON-LD can contain several entries for the same subject.
    const nodes = data.filter(node => node['@id'] === iri);
    const values = (predicate: string) => nodes.flatMap(node =>
        (node[predicate] as { '@value'?: string }[] | undefined) || []);
    return {
        iri,
        label: values('https://prez.dev/label').find(value => value['@value'])?.['@value'] || label || iri,
        url: values('https://prez.dev/link').find(value => value['@value'])?.['@value']
            || `/object?${new URLSearchParams({ iri })}`,
    };
}
