ARG NODE_VERSION=22-alpine
ARG PNPM_VERSION=10.12.1
ARG PREZ_UI_VERSION=4.3.3
ARG NUXT_PUBLIC_PREZ_API_ENDPOINT=http://localhost:3000/api
FROM node:${NODE_VERSION} AS build
ARG PNPM_VERSION PREZ_UI_VERSION NUXT_PUBLIC_PREZ_API_ENDPOINT
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV NUXT_PUBLIC_PREZ_API_ENDPOINT=${NUXT_PUBLIC_PREZ_API_ENDPOINT}
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
# Generate the unmodified, out-of-the-box PrezUI application.
RUN pnpm dlx create-prez-app@${PREZ_UI_VERSION} /app
WORKDIR /app
COPY prez-ui/overrides/ /app/
COPY prez-ui/staticwebapp.config.json /app/public/staticwebapp.config.json
COPY agldwg-logo-ochre-150.png /app/public/agldwg-logo-ochre-150.png
RUN pnpm install
RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm generate
FROM scratch AS static-export
COPY --from=build /app/.output/public /

FROM nginx:alpine
COPY prez-ui/nginx.conf /etc/nginx/templates/nginx.conf.template
ENV NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx
COPY --from=build /app/.output/public /usr/share/nginx/html
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
