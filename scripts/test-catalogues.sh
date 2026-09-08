#!/usr/bin/env sh
set -eu

manifest="${1:-../pid-register-data/resources/manifest.ttl}"
fuseki_query_url="${FUSEKI_QUERY_URL:-http://localhost:3030/piddata/sparql}"
prez_base_url="${PREZ_BASE_URL:-http://localhost:8000}"
script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
env_file="${script_dir}/../docker/.env"
piddata_username="${PIDDATA_USERNAME:-piddata}"

if [ -z "${PIDDATA_PASSWORD:-}" ] && [ -f "${env_file}" ]; then
  PIDDATA_PASSWORD="$(awk -F= '/^PIDDATA_PASSWORD=/ { print substr($0, index($0, "=") + 1) }' "${env_file}")"
  [ -n "${PIDDATA_PASSWORD}" ] || PIDDATA_PASSWORD="$(awk -F= '/^REFDATA_PASSWORD=/ { print substr($0, index($0, "=") + 1) }' "${env_file}")"
fi

[ -f "${manifest}" ] || { echo "Manifest not found: ${manifest}" >&2; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "curl is required" >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "jq is required" >&2; exit 1; }

expected_count="$(awk '/prof:hasArtifact ".*_cat\.ttl"/ { count++ } END { print count + 0 }' "${manifest}")"
[ "${expected_count}" -gt 0 ] || { echo "The manifest declares no catalogues" >&2; exit 1; }

sparql='PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX schema: <https://schema.org/>
SELECT (COUNT(DISTINCT ?catalogue) AS ?count)
WHERE { VALUES ?type { dcat:Catalog schema:DataCatalog } ?catalogue a ?type }'

actual_count="$(curl -fsS -u "${piddata_username}:${PIDDATA_PASSWORD}" -G --data-urlencode "query=${sparql}" \
  -H 'Accept: application/sparql-results+json' "${fuseki_query_url}" \
  | jq -er '.results.bindings[0].count.value | tonumber')"

if [ "${actual_count}" -ne "${expected_count}" ]; then
  echo "Fuseki exposes ${actual_count} catalogues; manifest declares ${expected_count}" >&2
  exit 1
fi

assert_members() {
  request_path="$1"
  expected_members="$2"
  response="$(curl -fsS -H 'Accept: application/ld+json' "${prez_base_url}${request_path}")"
  actual_members="$(printf '%s' "${response}" | jq -er '
    if type != "array" then error("expected an array") else
      map(.["@id"] // .id) | sort | join("\n")
    end')"

  if [ "${actual_members}" != "${expected_members}" ]; then
    echo "Unexpected members at ${request_path}" >&2
    echo "Expected:\n${expected_members}" >&2
    echo "Actual:\n${actual_members}" >&2
    exit 1
  fi
}

assert_nonempty() {
  request_path="$1"
  count="$(curl -fsS -H 'Accept: application/ld+json' "${prez_base_url}${request_path}?limit=1" \
    | jq -er 'if type == "array" then length else 0 end')"
  if [ "${count}" -lt 1 ]; then
    echo "Prez returned no items at ${request_path}" >&2
    exit 1
  fi
}

top_catalogues='https://linked.data.gov.au/reg/models
https://linked.data.gov.au/reg/orgs
https://linked.data.gov.au/reg/pids
https://linked.data.gov.au/reg/vals'
pid_catalogues='https://linked.data.gov.au/reg/pids/datasets
https://linked.data.gov.au/reg/pids/defs
https://linked.data.gov.au/reg/pids/envs
https://linked.data.gov.au/reg/pids/orgs'
model_members='https://linked.data.gov.au/def/pid'
validator_members='https://linked.data.gov.au/def/agldwg-org
https://linked.data.gov.au/def/pid/shapes'
model_items='https://linked.data.gov.au/def/pid/Pid
https://linked.data.gov.au/def/pid/RedirectTest
https://linked.data.gov.au/def/pid/from
https://linked.data.gov.au/def/pid/headers
https://linked.data.gov.au/def/pid/redirectRules
https://linked.data.gov.au/def/pid/redirectTest
https://linked.data.gov.au/def/pid/to'

assert_members '/catalogues?limit=100' "${top_catalogues}"
assert_members '/catalogues/reg:pids/catalogues?limit=100' "${pid_catalogues}"
assert_members '/catalogues/reg1:/catalogues?limit=100' "${model_members}"
assert_members '/catalogues/reg:vals/catalogues?limit=100' "${validator_members}"
assert_members '/catalogues/reg1:/catalogues/ont:/items?limit=100' "${model_items}"

org_count_query='SELECT (COUNT(DISTINCT ?org) AS ?count) WHERE {
  <https://linked.data.gov.au/reg/orgs> <https://schema.org/hasPart> ?org
}'
expected_org_count="$(curl -fsS -u "${piddata_username}:${PIDDATA_PASSWORD}" -G \
  --data-urlencode "query=${org_count_query}" -H 'Accept: application/sparql-results+json' "${fuseki_query_url}" \
  | jq -er '.results.bindings[0].count.value | tonumber')"
actual_org_count="$(curl -fsS -H 'Accept: application/ld+json' \
  "${prez_base_url}/catalogues/reg:orgs/catalogues?limit=1000" | jq -er 'length')"
[ "${actual_org_count}" -eq "${expected_org_count}" ] || {
  echo "Prez returned ${actual_org_count} of ${expected_org_count} organisations" >&2
  exit 1
}

for catalogue_id in datasets defs envs orgs; do
  curl -fsS "${prez_base_url}/catalogues/reg:pids/catalogues/pids:${catalogue_id}?_mediatype=application/anot%2Bturtle" >/dev/null
  assert_nonempty "/catalogues/reg:pids/catalogues/pids:${catalogue_id}/items"
done

echo "OK: Fuseki contains all ${expected_count} catalogues and Prez exposes the nested catalogue hierarchy"
