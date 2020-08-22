FROM node:11.10-alpine
# Create app directory
RUN mkdir -p /app
WORKDIR /app
RUN apk add --no-cache git
RUN npm install -g yarn

ENV CHROME_BIN="/usr/bin/chromium-browser" \
    NODE_ENV="production"

# install os dependencies
RUN apk add --no-cache redis chromium

# Install app dependencies
COPY package.json yarn.lock /app/
RUN yarn install --frozen-lockfile && yarn cache clean
# Bundle app source
COPY . /app
EXPOSE 8008
ENTRYPOINT ["sh", "entrypoint.sh"]
CMD [ "yarn", "start" ]
