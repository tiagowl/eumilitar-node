#!/bin/bash

ENV_TYPE=$1
VAR_ENVS=$2
SSH_KEY=$3
SERVER=$4

DIR="/usr/share/eumilitar/$ENV_TYPE"
SERVICE="eumilitar-$ENV_TYPE"
USER_NAME="eumilitar-api"

build() {
    rm -rf ./dist
    yarn install || exit
    yarn build || exit
    yarn migrate:prepare || exit
}
echo $SERVER
send_files() {
    ssh -i $SSH_KEY $SERVER "sudo mkdir -p /tmp/eumilitar/"
    scp -i $SSH_KEY -r ./dist $SERVER:/tmp/eumilitar/dist
    scp -i $SSH_KEY ./package.json $SERVER:/tmp/eumilitar/package.json
    scp -i $SSH_KEY ./yarn.lock $SERVER:/tmp/eumilitar/yarn.lock
    scp -i $SSH_KEY ./install.sh $SERVER:/tmp/eumilitar/install.sh
    scp -i $SSH_KEY $VAR_ENVS $SERVER:/tmp/eumilitar/.env
    scp -i $SSH_KEY ./knexfile.prod.js $SERVER:/tmp/eumilitar/knexfile.js
    scp -i $SSH_KEY -r ./migrations.prod $SERVER:/tmp/eumilitar/migrations
}

build && send_files || exit
ssh -i $SSH_KEY $SERVER "sudo bash /tmp/eumilitar/install.sh $ENV_TYPE"
