#!/bin/sh
# 一键部署命令
# sh -c "$(curl -fsSL https://raw.githubusercontent.com/wrule/litebot/220829-core/shell/debian_zsh_init.sh)"
apt update
apt install git curl screen zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/wrule/litebot/220829-core/shell/configure.sh)"
echo 🚀 安装ohmyzsh中...
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
