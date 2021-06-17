#!/bin/bash

DIR="/usr/share/eumilitar"

useradd api -Ms /bin/false

if [ -d "$DIR/.git" ]; then
    echo "Instalação encontrada"
    cd $DIR
    git pull
    yarn install
    yarn build
    systemclt restart eumilitar
else
    echo "Instalando..."
    mkdir -p $DIR || exit
    git clone $EUMILITAR_REPOSITORY $DIR
    cd $DIR
    yarn install
    yarn build
    cp ./eumilitar.service /etc/systemd/system/
    systemctl enable eumilitar --now
fi
