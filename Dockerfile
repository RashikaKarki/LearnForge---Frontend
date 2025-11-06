# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Accept build arguments
ARG VITE_API_BASE_URL
ARG VITE_WEBSOCKET_HOST
ARG VITE_WEBSOCKET_PROTOCOL
ARG VITE_WEBSOCKET_API_VERSION
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_MESSAGING_SENDER_ID

# Set as environment variables for Vite build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WEBSOCKET_HOST=$VITE_WEBSOCKET_HOST
ENV VITE_WEBSOCKET_PROTOCOL=$VITE_WEBSOCKET_PROTOCOL
ENV VITE_WEBSOCKET_API_VERSION=$VITE_WEBSOCKET_API_VERSION
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID

# Copy package files
COPY package*.json ./
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage - use Node.js with serve
FROM node:20-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Start serve
CMD ["serve", "-s", "dist", "-l", "8080"]
