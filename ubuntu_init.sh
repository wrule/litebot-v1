#!/bin/sh
apt update
apt install git curl screen zsh
echo 🚀 安装ohmyzsh中，完成后建议重新启动终端...
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
