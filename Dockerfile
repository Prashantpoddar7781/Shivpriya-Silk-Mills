FROM node:22-slim

WORKDIR /app

# Install dependencies safely
COPY package*.json ./
RUN npm install --ignore-scripts

# Copy application source code
COPY . .

# Build Vite frontend and bundled backend server
RUN npm run build

# Default environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start production server
CMD ["node", "dist/server.cjs"]
