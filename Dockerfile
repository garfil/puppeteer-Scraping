FROM node:latest
WORKDIR /apps
ADD . .
RUN npm install -g nodemon
RUN npm install
CMD ["npm", "start"]
