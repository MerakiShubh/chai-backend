# Stage 1: Build the application
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Stage 2: Create production image with Nginx
FROM node:18-alpine as base

WORKDIR /app

ENV NODE_ENV=production

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy the necessary files from the build stage
COPY --from=builder /app ./

# Install PM2 globally
RUN npm install pm2 -g

# Install Nginx
RUN apk add --no-cache nginx

# Copy Nginx configuration file
COPY nginx.conf /etc/nginx/nginx.conf

# Expose the port the app runs on
EXPOSE 80

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Use entrypoint script to start Nginx and PM2
ENTRYPOINT ["/entrypoint.sh"]
