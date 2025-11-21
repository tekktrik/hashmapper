# Use a base Node docker image
FROM node:25-alpine

# Set the working directory to app
WORKDIR /app

# Set environment variables
ARG VITE_GMAPS_API_KEY
ENV VITE_GMAPS_API_KEY=${VITE_GMAPS_API_KEY}

# Copy necessary folders
COPY src/ src/
COPY public/ public/

# Copy necessary files
COPY index.html index.html
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY tsconfig.json tsconfig.json
COPY tsconfig.app.json tsconfig.app.json
COPY tsconfig.node.json tsconfig.node.json
COPY vite.config.ts vite.config.ts

# Install modules
RUN npm ci

# Buuild the app
RUN npm run build

# Expose port for serve
EXPOSE 8057

# Start gunicorn and serve website
CMD ["npx", "--yes", "serve", "dist", "-l", "8000"]
