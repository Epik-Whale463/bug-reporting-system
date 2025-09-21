FROM node:20-alpine

# Install necessary packages
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy ALL source files (including lib directory)
COPY . .

# Debug: Check what files were actually copied
RUN echo "=== Checking copied files ===" && \
    ls -la && \
    echo "=== src directory ===" && \
    ls -la src/ && \
    echo "=== lib directory ===" && \
    ls -la src/lib/ && \
    echo "=== api.js content ===" && \
    head -5 src/lib/api.js

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
