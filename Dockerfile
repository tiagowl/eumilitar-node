# Build
FROM node:alpine
WORKDIR /tmp/api
COPY . .
RUN yarn install && \
    yarn build

# Production
FROM node:lts
WORKDIR /usr/share/api
RUN mkdir dist
COPY package.json ./
COPY yarn.lock ./
COPY --from=0 /tmp/api/dist/ ./dist/
RUN yarn install --prod && \
    useradd api -ms /bin/bash && \
    chown -R api:api .
USER api
CMD [ "yarn", "start" ]