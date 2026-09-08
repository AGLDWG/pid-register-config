ARG FUSEKI_VERSION=6.2.0-0
FROM ghcr.io/kurrawong/fuseki:${FUSEKI_VERSION}

COPY --chown=fuseki:fuseki config-piddata.ttl /opt/fuseki/configuration/piddata.ttl
COPY --chown=fuseki:fuseki shiro.ini /opt/fuseki/shiro.ini
COPY --chown=fuseki:fuseki entrypoint.sh /opt/fuseki/piddata-entrypoint.sh

RUN chmod +x /opt/fuseki/piddata-entrypoint.sh

CMD ["/opt/fuseki/piddata-entrypoint.sh"]
