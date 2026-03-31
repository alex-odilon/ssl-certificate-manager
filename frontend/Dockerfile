FROM node:18-alpine

WORKDIR /app

# Copy package files
FROM node:18-alpine

WORKDIR /app

# Copy package files
FROM node:18-alpine

WORKDIR /app

# Copy package files
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Disable ESLint plugin to avoid CRA 5 build issues
ENV DISABLE_ESLINT_PLUGIN=true

# Install dependencies
RUN npm install

# Copy application files
COPY . .

EXPOSE 3000

CMD ["npm", "start"]