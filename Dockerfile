# Packages a prebuilt app: run `npm run build` first (the `build:next` CI job does it).
# Keep the node image in sync with NODE_IMAGE in .gitlab-ci.yml.
FROM public.ecr.aws/docker/library/node:24.22.0-alpine3.24
WORKDIR /app
ENV NODE_ENV=production \
  NEXT_TELEMETRY_DISABLED=1 \
  HOSTNAME=0.0.0.0 \
  PORT=3000
COPY --chown=node:node public ./public
COPY --chown=node:node .next/standalone ./
COPY --chown=node:node .next/static ./.next/static
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
  CMD wget -qO /dev/null http://127.0.0.1:3000/ || exit 1
CMD ["node", "server.js"]
