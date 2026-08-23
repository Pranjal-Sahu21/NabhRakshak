FROM node:18-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
COPY package-lock.json* ./
COPY yarn.lock* ./

RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 3000

# Start React dev server
CMD ["npm", "start"]
