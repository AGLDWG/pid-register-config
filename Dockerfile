ARG PREZ_VERSION=4.23.7

FROM ghcr.io/rdflib/prez:${PREZ_VERSION}

COPY prez/config/ /app/reference_data/
COPY prez/prez_app.py prez/response_header_middleware.py /app/

CMD ["sh", "-c", "uvicorn prez_app:create_app --factory --host=${HOST:-0.0.0.0} --port=${PORT:-8000} $([ \"$(echo \"$PROXY_HEADERS\" | tr '[:upper:]' '[:lower:]')\" = \"true\" ] || [ \"$PROXY_HEADERS\" = \"1\" ] && echo \"--proxy-headers\") --forwarded-allow-ips=${FORWARDED_ALLOW_IPS:-127.0.0.1} --root-path \"${ROOT_PATH}\""]
