#!/bin/bash

ENV_TYPE=$1

DIR="/usr/share/eumilitar/$ENV_TYPE"
SERVICE="eumilitar-$ENV_TYPE"
USER_NAME="eumilitar-api"
UPLOADED="/tmp/eumilitar"

prepare_dir() {
    mkdir -p $DIR
    cd $UPLOADED
    cp -rf $UPLOADED/* $DIR/
    cp -f .env $DIR/.env
    cd $DIR
}

create_user() {
    useradd $USER_NAME -Ms /bin/false || true
}

prepare() {
    yarn install --production || exit
    yarn migrate:prod || exit
}

create_service() {
    echo "$(cat eumilitar.service)
User=$USER_NAME
ExecStart=/usr/bin/env node $DIR 
    " >/etc/systemd/system/$SERVICE.service
}

post_install() {
    chmod -R 0400 $DIR
    chown -R $USER_NAME:$USER_NAME $DIR
    rm -rf $UPLOADED
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
