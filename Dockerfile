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
