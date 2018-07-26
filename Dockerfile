FROM node:10

WORKDIR /usr/src/app

ENV WT_CONFIG ropsten

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run createdb

CMD ["npm", "start"]

EXPOSE 8000
