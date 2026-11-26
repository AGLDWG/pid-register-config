export const localDefinitionsQuery = `SELECT DISTINCT ?iri WHERE {
    VALUES ?type {
        <http://www.w3.org/2000/01/rdf-schema#Class>
        <http://www.w3.org/2002/07/owl#Class>
        <http://www.w3.org/1999/02/22-rdf-syntax-ns#Property>
        <http://www.w3.org/2002/07/owl#ObjectProperty>
        <http://www.w3.org/2002/07/owl#DatatypeProperty>
        <http://www.w3.org/2002/07/owl#AnnotationProperty>
        <http://www.w3.org/2002/07/owl#OntologyProperty>
    }
    ?iri a ?type . FILTER(isIRI(?iri))
}`;

export function definitionLink(iri: string): string {
    return `/object?${new URLSearchParams({ iri })}`;
}
