import assert from 'node:assert/strict';
import test from 'node:test';
import { embeddedParentsQuery, embeddingResourceFromJsonLd } from '../prez-ui/overrides/app/utils/embeddedParents.ts';

test('parent lookup distinguishes identical labels by the original search hash', () => {
    const match = { predicate: { value: 'https://schema.org/name' }, match: { value: 'HTML test' }, weight: 10 };
    const query = embeddedParentsQuery([{ ...match, hash: 'first' }, { ...match, hash: 'urn:hash:second' }]);
    assert.ok(query.includes('("first" "https://schema.org/name" "HTML test" "10")'));
    assert.ok(query.includes('("second" "https://schema.org/name" "HTML test" "10")'));
    assert.match(query, /SHA256\(CONCAT\(STR\(\?embedded\), STR\(\?predicate\), STR\(\?matchedValue\), \?weightText\)\) = \?hash/);
});

test('match values cannot escape their SPARQL string literals', () => {
    const value = 'A "quoted" test\nwith \\ and } UNION { ?s ?p ?o }';
    const query = embeddedParentsQuery([{ hash: 'hash', weight: 10, predicate: { value: 'https://schema.org/name' }, match: { value } }]);
    assert.ok(query.includes(JSON.stringify(value)));
    assert.ok(!query.includes(value));
});

test('canonical link and label are read across split JSON-LD subject entries', () => {
    const iri = 'https://linked.data.gov.au/pid/def/sample-location-status';
    const url = '/catalogues/reg:pids/catalogues/pids:defs/items/piddef:sample-location-status';
    const resource = embeddingResourceFromJsonLd(iri, 'Fallback', [
        { '@id': 'https://example.org/other', 'https://prez.dev/link': [{ '@value': '/wrong' }] },
        { '@id': iri, 'https://prez.dev/label': [{ '@value': 'Sample location status' }] },
        { '@id': iri, 'https://prez.dev/link': [{ '@value': url }] },
    ]);
    assert.deepEqual(resource, { iri, label: 'Sample location status', url });
});

test('generic parent link preserves the complete IRI when no canonical link exists', () => {
    const iri = 'https://example.org/item?one=1&two=2#part';
    const resource = embeddingResourceFromJsonLd(iri, 'Parent', []);
    const url = new URL(resource.url, 'http://localhost:3000');
    assert.equal(url.pathname, '/object');
    assert.equal(url.searchParams.get('iri'), iri);
    assert.equal(resource.label, 'Parent');
});
