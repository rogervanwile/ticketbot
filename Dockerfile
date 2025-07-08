# Use the official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Create necessary directories
RUN mkdir -p logs config

# Expose the port the app runs on
EXPOSE 3000

# Create a non-root user for security
RUN addgroup -g 1001 -S ticketbot && \
    adduser -S ticketbot -u 1001

# Change ownership of the app directory to the ticketbot user
RUN chown -R ticketbot:ticketbot /app

# Switch to the non-root user
USER ticketbot

# Define the command to run the application
CMD ["npm", "start"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1