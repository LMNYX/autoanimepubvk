FROM node:19

WORKDIR /usr/src/vkscrapper

COPY package*.json .

RUN npm install --save-dev

COPY . .

RUN npx babel src -d lib

CMD [ "node", "./lib/scrap.js" ]
