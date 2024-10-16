
   FROM node:18

   # Install dependencies for canvas
   RUN apt-get update && apt-get install -y \
       libcairo2-dev \
       libpango1.0-dev \
       libjpeg-dev \
       libgif-dev \
       librsvg2-dev

   WORKDIR /usr/src/app

   COPY package*.json ./

   RUN npm install

   COPY . .

   RUN npm run build

   EXPOSE 3002

   CMD ["node", "dist/index.js"]

# Use an official Node.js runtime as the base image
FROM node:18.20.4

# Set the working directory in the container
WORKDIR /usr/src/app

# Install system dependencies for canvas and other image processing libraries
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json
COPY package*.json ./

# Create the processed_images directory
RUN mkdir -p /usr/src/app/processed_images

# Install app dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose the port the app runs on
EXPOSE 3002

# Command to run the application
CMD ["node", "--expose-gc", "dist/index.js"]

