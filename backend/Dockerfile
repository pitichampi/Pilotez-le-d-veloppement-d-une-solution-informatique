FROM node:20-alpine

WORKDIR /app

# Installer les dépendances de build nécessaires pour certains modules
RUN apk add --no-cache python3 make g++

# Créer le répertoire uploads pour la persistance des fichiers
RUN mkdir -p /app/uploads

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start:prod"]

