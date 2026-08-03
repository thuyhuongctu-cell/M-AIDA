FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

ARG VITE_API_URL=""
ARG VITE_APP_VERSION="7.2.0-rc.1"
ARG VITE_RELEASE_CHANNEL="internal"
ARG VITE_RIGHTS_STATUS="pending-ctu-agreement"
ARG VITE_PRIVACY_POLICY_URL="/app-privacy.html"
ARG VITE_SUPPORT_URL="/app-support.html"
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV VITE_RELEASE_CHANNEL=$VITE_RELEASE_CHANNEL
ENV VITE_RIGHTS_STATUS=$VITE_RIGHTS_STATUS
ENV VITE_PRIVACY_POLICY_URL=$VITE_PRIVACY_POLICY_URL
ENV VITE_SUPPORT_URL=$VITE_SUPPORT_URL
RUN npm run typecheck && npm run test:mobile && npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/healthz >/dev/null || exit 1
CMD ["nginx", "-g", "daemon off;"]
