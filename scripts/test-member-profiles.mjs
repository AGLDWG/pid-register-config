import assert from 'node:assert/strict';
import { parseMembers } from '../prez-ui/overrides/app/utils/memberList.ts';

const base = process.env.PREZ_BASE_URL || 'http://localhost:3000/api';
const currentProfile = data => data.flatMap(node => node['https://prez.dev/currentProfile'] || []).map(value => value['@id']);
async function read(path, query = {}) {
    const response = await fetch(`${base}${path}?${new URLSearchParams(query)}`, {
        headers: { Accept: 'application/anot+ld+json' }, signal: AbortSignal.timeout(30_000),
    });
    assert.equal(response.status, 200, path);
    return response.json();
}

for (const id of ['defs', 'orgs', 'datasets', 'envs']) {
    const path = `/catalogues/reg:pids/catalogues/pids:${id}/items`;
    for (const query of [{}, { _profile: 'https://w3id.org/profile/mem' }]) {
        const data = await read(path, { limit: '100', ...query });
        assert.ok(currentProfile(data).includes('https://w3id.org/profile/mem'), `${id}: Members must be the selected listing profile`);
        const members = parseMembers(data);
        assert.ok(members.length > 0, `${id}: expected member resources`);
        assert.ok(members.every(member => !member.iri.includes('connegp/altr-ext#') && !member.iri.startsWith('https://prez.dev/profile/')),
            `${id}: profiles must not appear as members`);
    }
    console.log(`OK: ${id} default and explicit member lists`);
}

const path = '/catalogues/reg:pids/catalogues/pids:defs/items';
const first = parseMembers(await read(path, { page: '1', limit: '100' }));
const second = parseMembers(await read(path, { page: '2', limit: '100' }));
assert.equal(first.length, 100);
assert.equal(second.length, 100);
assert.ok(second.every(member => !first.some(previous => previous.iri === member.iri)), 'Pagination must advance');

for (const objectPath of ['/catalogues/reg:pids', '/catalogues/reg:pids/catalogues/pids:defs']) {
    const alternates = await read(objectPath, { _profile: 'altr-ext:alt-profile' });
    assert.ok(currentProfile(alternates).includes('http://www.w3.org/ns/dx/connegp/altr-ext#alt-profile'));
    assert.ok(alternates.some(node => node['@id'] === 'https://prez.dev/profile/open-object'
        && node['http://purl.org/dc/terms/title']), 'Explicit alternates must still return profile rows');
}
console.log('OK: member pagination and explicit alternate-profile tables');
