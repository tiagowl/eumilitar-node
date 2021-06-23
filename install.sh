#!/bin/bash

ENV_BRANCH=$1
ENV_TYPE=$2
EUMILITAR_REPOSITORY=$3
VAR_ENVS=$4

DIR="/usr/share/eumilitar/$ENV_TYPE"
SERVICE="eumilitar-$ENV_TYPE"
USER_NAME="eumilitar-api"

install_eumilitar() {
    useradd $USER_NAME -Ms /bin/false
    cd $DIR
    rm -rf ./node_modules ./dist
    git checkout $ENV_BRANCH
    git pull --force --progress origin $ENV_BRANCH
    yarn install
    yarn build
    yarn migrate
    rm -rf ./node_modules
    yarn install --production
    echo $VAR_ENVS >.env
    echo $(cat eumilitar.service) \n User=$USER_NAME \n ExecStart=/usr/bin/env node $DIR >$SERVICE.service
    cp -f ./$SERVICE.service /etc/systemd/system/$SERVICE.service
    chmod -R 0400 .
    chown -R $USER_NAME:$USER_NAME $DIR
}

if [ -d "$DIR/.git" ]; then
    echo "Instalação encontrada"
    echo "Atualizando..."
    install_eumilitar
    echo "Atualizado"
    systemctl restart $SERVICE
else
    echo "Instalando..."
    mkdir -p $DIR || exit
    git clone $EUMILITAR_REPOSITORY $DIR || exit
    install_eumilitar
    echo "Instalado"
    systemctl enable $SERVICE --now
fi
