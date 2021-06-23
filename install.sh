#!/bin/bash

export DIR="/usr/share/eumilitar/$ENV_TYPE"
export SERVICE="eumilitar-$ENV_TYPE"
export USER_NAME="eumilitar-api"

install_eumilitar() {
    useradd $USER_NAME -Ms /bin/false
    cd $DIR
    rm -rf ./node_modules ./dist
    git checkout $ENV_BRANCH
    git pull --force --no-commit --rebase origin $ENV_BRANCH
    yarn install
    yarn build
    echo $VAR_ENVS >.env
    echo "ExecStart=/usr/bin/env node $DIR" >>eumilitar.service
    cp -f ./eumilitar.service /etc/systemd/system/$SERVICE.service
    chmod -R 0400 .
    chown -R $USER_NAME:$USER_NAME $DIR
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
    git clone $EUMILITAR_REPOSITORY $DIR || exit
    install_eumilitar
    echo "Instalado"
    systemctl enable $SERVICE --now
fi
