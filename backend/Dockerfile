# Use official Node.js LTS image
FROM node:20

# Set working directory inside container
WORKDIR /app

# Copy package files first (optimises Docker cache)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the codebase
COPY . .

# Build TypeScript (compile src to dist)
RUN npm run build:backend

# Tell Cloud Run to use PORT 8080 (even though app reads process.env.PORT)
ENV PORT 8080

# Expose port (for local docker if you want)
EXPOSE 8080

# Start production server
CMD ["npm", "run", "start"]
