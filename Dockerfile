FROM node:14.17
WORKDIR /app
COPY ./package*.json ./
RUN yarn install
COPY src ./src
CMD ["npm", "start"]