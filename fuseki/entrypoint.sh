#!/bin/sh

set -eu

for variable_name in ADMIN_PASSWORD PIDDATA_USERNAME PIDDATA_PASSWORD; do
  eval "variable_value=\${${variable_name}:-}"
  if [ -z "${variable_value}" ]; then
    echo "${variable_name} must be set" >&2
    exit 1
  fi

  carriage_return="$(printf '\r')"
  line_feed='
'
  case "${variable_value}" in
    *","*|*"${carriage_return}"*|*"${line_feed}"*|[[:space:]]*|*[[:space:]])
      echo "${variable_name} must not contain commas, line breaks, or leading/trailing whitespace" >&2
      exit 1
      ;;
  esac
done

shiro_tmp="$(umask 077 && mktemp "${FUSEKI_BASE}/shiro.ini.tmp.XXXXXX")"
trap 'rm -f "${shiro_tmp}"' 0 1 2 15
envsubst '${ADMIN_PASSWORD} ${PIDDATA_USERNAME} ${PIDDATA_PASSWORD}' \
  < "${FUSEKI_HOME}/shiro.ini" > "${shiro_tmp}"
chmod 600 "${shiro_tmp}"
mv "${shiro_tmp}" "${FUSEKI_BASE}/shiro.ini"
trap - 0 1 2 15

mkdir -p "${FUSEKI_BASE}/configuration"
cp -r /opt/fuseki/configuration/. "${FUSEKI_BASE}/configuration/"

exec \
  "${JAVA_HOME}/bin/java" \
  ${JAVA_OPTS:-} \
  -Xshare:off \
  -Dlog4j.configurationFile="${FUSEKI_HOME}/log4j2.properties" \
  -cp "${FUSEKI_HOME}/fuseki-server.jar:${FUSEKI_HOME}/lib/*" \
  org.apache.jena.fuseki.main.cmds.FusekiServerCmd
