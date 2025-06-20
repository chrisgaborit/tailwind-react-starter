# Use official Node.js 18 image
FROM node:18

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first (for better Docker caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy remaining source files
COPY . .

# Build TypeScript code
RUN npm run build

# Environment port for Cloud Run
ENV PORT=8080

# Expose port (Cloud Run uses PORT env var automatically)
EXPOSE 8080

# Start backend using compiled code
CMD ["node", "dist/index.js"]
