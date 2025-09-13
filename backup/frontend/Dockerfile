# # Stage 0, "build-stage", based on Node.js, to build and compile the Next.js app
# FROM node:20 AS build-stage

# WORKDIR /app

# # Copy package files
# COPY package*.json pnpm-lock.yaml* ./

# # Install pnpm and dependencies
# RUN npm install -g pnpm
# RUN pnpm install --frozen-lockfile

# # Copy source code
# COPY ./ /app/

# # Set default environment variables for build
# ENV NEXT_PUBLIC_API_URL=http://localhost:8000
# ENV NODE_ENV=production

# # Build the Next.js application
# ARG NEXT_PUBLIC_API_URL
# RUN echo "Building with API URL: ${NEXT_PUBLIC_API_URL:-http://localhost:8000}" && \
#     pnpm run build

# # Stage 1, production stage with Node.js runtime
# FROM node:20-alpine AS production-stage

# WORKDIR /app

# # Install pnpm
# RUN npm install -g pnpm

# # Copy package files
# COPY package*.json pnpm-lock.yaml* ./

# # Install only production dependencies
# RUN pnpm install --frozen-lockfile --prod

# # Copy built application from build stage
# COPY --from=build-stage /app/.next/standalone ./
# COPY --from=build-stage /app/.next/static ./.next/static
# COPY --from=build-stage /app/public ./public

# # Expose port
# EXPOSE 3000

# # Start the application
# CMD ["node", "server.js"]
# Stage 0, "build-stage", based on Node.js, to build and compile the frontend
FROM node:24 AS build-stage

WORKDIR /app

COPY package*.json /app/

RUN pnpm install

COPY ./ /app/

ARG NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN pnpm run build


# Stage 1, based on Nginx, to have only the compiled app, ready for production with Nginx
FROM nginx:1

COPY --from=build-stage /app/dist/ /usr/share/nginx/html

COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY ./nginx-backend-not-found.conf /etc/nginx/extra-conf.d/backend-not-found.conf