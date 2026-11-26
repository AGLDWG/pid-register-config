interface Value { '@value'?: string; '@id'?: string }
export interface MemberNode { '@id': string; [predicate: string]: string | Value[] }
export interface RegisterMember { iri: string; label: string; url: string }

export function parseMembers(nodes: MemberNode[]): RegisterMember[] {
    const subjects = new Map<string, Record<string, Value[]>>();
    for (const node of nodes) {
        const subject = subjects.get(node['@id']) || {};
        for (const [predicate, values] of Object.entries(node)) {
            if (Array.isArray(values)) subject[predicate] = [...(subject[predicate] || []), ...values];
        }
        subjects.set(node['@id'], subject);
    }
    return [...subjects].filter(([, values]) => values['https://prez.dev/type']?.some(value => value['@id'] === 'https://prez.dev/FocusNode'))
        .map(([iri, values]) => ({
            iri,
            label: [...(values['https://prez.dev/label'] || []), ...(values['https://schema.org/name'] || [])]
                .find(value => value['@value'] && value['@value'] !== iri)?.['@value'] || iri,
            url: values['https://prez.dev/link']?.[0]?.['@value'] || `/object?${new URLSearchParams({ iri })}`,
        }));
}

export function sortMembers(members: RegisterMember[]): RegisterMember[] {
    const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });
    return [...members].sort((a, b) => collator.compare(a.label, b.label) || collator.compare(a.iri, b.iri));
}
