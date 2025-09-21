FROM node:20-alpine

# Install necessary packages
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code explicitly
COPY src/ ./src/
COPY jsconfig.json next.config.js ./

# Debug: Check the file structure
RUN echo "=== Root directory ===" && ls -la
RUN echo "=== Check if src exists ===" && test -d src && echo "src directory exists" || echo "src directory NOT found"
RUN echo "=== src directory contents ===" && ls -la src/ || echo "Cannot list src directory"
RUN echo "=== Check if src/lib exists ===" && test -d src/lib && echo "src/lib directory exists" || echo "src/lib directory NOT found"

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
