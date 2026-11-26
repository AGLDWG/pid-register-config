export function isAnnotatedFormat(value: string): boolean {
    return /^(application|text)\/anot[+_]/i.test(value);
}

interface FormatTerm { value: string; [key: string]: unknown }
interface ProfileProperty { objects: FormatTerm[]; [key: string]: unknown }
export interface ProfileRow { properties?: Record<string, ProfileProperty>; [key: string]: unknown }

export function publicProfileFormats(rows: ProfileRow[]): ProfileRow[] {
    const formatPredicates = new Set([
        'http://www.w3.org/ns/dx/connegp/altr-ext#hasResourceFormat',
        'http://www.w3.org/ns/dx/connegp/altr-ext#hasDefaultResourceFormat',
    ]);
    return rows.map(row => ({
        ...row,
        properties: row.properties && Object.fromEntries(Object.entries(row.properties).map(([predicate, property]) => [
            predicate,
            formatPredicates.has(predicate)
                ? { ...property, objects: property.objects.filter(term => !isAnnotatedFormat(term.value)) }
                : property,
        ])),
    }));
}
