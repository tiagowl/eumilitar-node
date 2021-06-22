#!/bin/bash

DIR="/usr/share/eumilitar/$ENV_TYPE"
SERVICE="eumilitar-$ENV_TYPE"

useradd eumilitar-api -Ms /bin/false

install_eumilitar() {
    cd $DIR
    rm -rf ./node_modules ./dist
    git checkout $ENV_BRANCH
    git pull --force --no-commit --rebase origin $ENV_BRANCH
    yarn install
    yarn build
    echo $VAR_ENVS >.env
    echo "ExecStart=/usr/bin/env node $DIR" >>eumilitar.service
    cp -f ./eumilitar.service /etc/systemd/system/$SERVICE.service
}

if [ -d "$DIR/.git" ]; then
    echo "Instalação encontrada"
    echo "Atualizando..."
    install_eumilitar
    echo "Atualizado"
    systemclt restart $SERVICE
else
    echo "Instalando..."
    mkdir -p $DIR || exit
    git clone $EUMILITAR_REPOSITORY $DIR
    install_eumilitar
    echo "Instalado"
    systemctl enable $SERVICE --now
fi
