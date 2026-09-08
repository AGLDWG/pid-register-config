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

kgm sync "${normalized_manifest}" "${fuseki_url}" -u "${piddata_username}" -p "${PIDDATA_PASSWORD}" True False True False
