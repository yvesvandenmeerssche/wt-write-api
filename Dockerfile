FROM node:10

ARG WT_CONFIG

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run createdb

CMD ["npm", "start"]

EXPOSE 8000
