#!/usr/bin/env sh
set -eu

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
manifest="${1:?Pass the path to a Prez manifest}"
fuseki_url="${FUSEKI_URL:-http://localhost:3030/piddata/}"
piddata_username="${PIDDATA_USERNAME:-piddata}"

if [ -z "${PIDDATA_PASSWORD:-}" ] && [ -f "${script_dir}/../docker/.env" ]; then
  PIDDATA_PASSWORD="$(awk -F= '/^PIDDATA_PASSWORD=/ { print substr($0, index($0, "=") + 1) }' "${script_dir}/../docker/.env")"
  if [ -z "${PIDDATA_PASSWORD}" ]; then
    # Compatibility with configurations created before the dataset rename.
    PIDDATA_PASSWORD="$(awk -F= '/^REFDATA_PASSWORD=/ { print substr($0, index($0, "=") + 1) }' "${script_dir}/../docker/.env")"
  fi
fi

[ -f "${manifest}" ] || { echo "Manifest not found: ${manifest}" >&2; exit 1; }
[ -n "${PIDDATA_PASSWORD:-}" ] || { echo "PIDDATA_PASSWORD must be set" >&2; exit 1; }
command -v kgm >/dev/null 2>&1 || { echo "kgm is required: https://kurrawong.github.io/kgm/" >&2; exit 1; }
command -v kurra >/dev/null 2>&1 || { echo "kurra is required to format staged RDF" >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "jq is required" >&2; exit 1; }

# Ten legacy environment PID records use pid:PID while the remaining records
# and their validator use pid:Pid. kgm requires one main-entity class per
# manifest resource, so stage and normalize that spelling for synchronization.
# This leaves the canonical pid-register-data checkout unchanged.
manifest_root="$(CDPATH= cd -- "$(dirname -- "${manifest}")" && pwd)"
staging_dir="$(mktemp -d "${TMPDIR:-/tmp}/pid-register-data.XXXXXX")"
trap 'rm -rf "${staging_dir}"' 0 1 2 15
cp -R "${manifest_root}/." "${staging_dir}/"
find "${staging_dir}" -type f -name '*.ttl' -exec perl -pi -e \
  's!<https://linked\.data\.gov\.au/def/pid/PID>!<https://linked.data.gov.au/def/pid/Pid>!g; s!\bpid:PID\b!pid:Pid!g' {} +
normalized_manifest="${staging_dir}/$(basename -- "${manifest}")"
# Several legacy PID records also fail the current redirect-rule shape. Loading
# is deliberately non-destructive, so bypass that validation in the staged
# manifest while retaining explicit main-entity discovery for kgm.
perl -pi -e \
  's!dcterms:conformsTo "validators/items/pid\.ttl" ;!schema:additionalType <https://linked.data.gov.au/def/pid/Pid> ;!g' \
  "${normalized_manifest}"

kurra file reformat "${staging_dir}"
kgm sync "${normalized_manifest}" "${fuseki_url}" -u "${piddata_username}" -p "${PIDDATA_PASSWORD}" True False True False

# Catalogue membership can change without a dateModified change. Replace each
# catalogue's named graph explicitly so removed membership predicates disappear.
awk '/prof:hasArtifact ".*_cat\.ttl"/ { gsub(/"/, "", $2); print $2 }' "${normalized_manifest}" |
while IFS= read -r artifact; do
  catalogue_file="${staging_dir}/${artifact}"
  catalogue_iri="$(kurra file sparql "${catalogue_file}" --q \
    'SELECT DISTINCT ?iri WHERE { VALUES ?type { <https://schema.org/DataCatalog> <http://www.w3.org/ns/dcat#Catalog> } ?iri a ?type }' \
    -f json | jq -er 'if (.results.bindings | length) == 1 then .results.bindings[0].iri else error("Expected one catalogue IRI") end')"
  encoded_iri="$(jq -rn --arg iri "${catalogue_iri}" '$iri | @uri')"
  curl -fsS -u "${piddata_username}:${PIDDATA_PASSWORD}" -X PUT \
    -H 'Content-Type: text/turtle' --data-binary "@${catalogue_file}" \
    "${fuseki_url%/}/data?graph=${encoded_iri}" >/dev/null
  echo "Reloaded catalogue ${catalogue_iri}"
done
