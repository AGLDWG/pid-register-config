const prezNamespace = 'https://prez.dev/';

// Profile resources remain selectable; implementation vocabulary does not.
export function isPrezVocabulary(value: string): boolean {
    return value.startsWith(prezNamespace) && !value.startsWith(`${prezNamespace}profile/`);
}

export interface DisplayTerm {
    value?: string;
    rdfTypes?: DisplayTerm[];
    properties?: Record<string, { objects: DisplayTerm[]; [key: string]: unknown }>;
    [key: string]: unknown;
}

export function publicRdfTerm<T extends DisplayTerm>(term: T): T {
    return {
        ...term,
        rdfTypes: term.rdfTypes?.filter(type => !isPrezVocabulary(type.value || '')),
        properties: term.properties && Object.fromEntries(Object.entries(term.properties)
            .filter(([predicate]) => !predicate.startsWith(prezNamespace))
            .flatMap(([predicate, property]) => {
                const objects = property.objects.filter(object =>
                    object.termType === 'Literal' || !isPrezVocabulary(object.value || '')).map(publicRdfTerm);
                return objects.length ? [[predicate, { ...property, objects }]] : [];
            })),
    };
}
