FROM node:20-alpine

# Install necessary packages
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Debug: Check the file structure
RUN echo "=== Root directory ===" && ls -la
RUN echo "=== src directory ===" && ls -la src/
RUN echo "=== lib directory ===" && ls -la src/lib/
RUN echo "=== Check api.js exists ===" && test -f src/lib/api.js && echo "api.js exists" || echo "api.js NOT found"
RUN echo "=== Check CommentThread.js ===" && head -3 src/components/CommentThread.js
RUN echo "=== Test Node.js module resolution ===" && node -e "console.log('Testing require resolution...'); console.log('Current working directory:', process.cwd()); const fs = require('fs'); console.log('api.js exists:', fs.existsSync('./src/lib/api.js')); console.log('CommentThread.js exists:', fs.existsSync('./src/components/CommentThread.js'));"

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
