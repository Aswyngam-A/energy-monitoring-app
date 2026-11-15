# Stage 1: build the static files with Node (this stage is thrown away afterwards).
FROM node:22-alpine AS build
WORKDIR /app
# Copy the manifests first: `npm ci` is cached until dependencies change.
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: nginx serves the built files; Node is not needed at runtime.
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
