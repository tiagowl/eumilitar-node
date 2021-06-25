#!/bin/bash

ENV_TYPE=$1
ROOT_DIR="/usr/share/eumilitar"
DIR="$ROOT_DIR/$ENV_TYPE"
SERVICE="eumilitar-$ENV_TYPE"
USER_NAME="eumilitar-api"
UPLOADED="/tmp/eumilitar"

prepare_dir() {
    rm -r $DIR
    mkdir -p $DIR
    cd $UPLOADED
    cp -rf $UPLOADED/* $DIR/
    cp -f .env $DIR/.env
    cd $DIR
}

create_user() {
    userdel $USER_NAME
    useradd $USER_NAME -Ms /bin/sh || true
}

prepare() {
    rm -rf ./node_modules
    yarn install --production || exit
    yarn migrate:prod || exit
}

create_service() {
    echo "$(cat eumilitar.service)
User=$USER_NAME
WorkingDirectory=$DIR 
ExecStart=/usr/bin/env node $DIR
    " >/etc/systemd/system/$SERVICE.service
}

post_install() {
    chown -Rc $USER_NAME:$USER_NAME $ROOT_DIR
    chown -Rc $USER_NAME:$USER_NAME $DIR/*
    chmod 0400 .env
    rm -rf $UPLOADED
    systemctl daemon-reload
}

install_eumilitar() {
    prepare_dir &&
        create_user &&
        prepare &&
        create_service &&
        post_install || exit
}

if [ -d "$DIR" ]; then
    echo "Instalação encontrada"
    echo "Atualizando..."
    install_eumilitar
    echo "Atualizado"
    systemctl restart $SERVICE
else
    echo "Instalando..."
    install_eumilitar
    echo "Instalado"
    systemctl enable $SERVICE --now
fi
