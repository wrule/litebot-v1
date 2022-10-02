#!/bin/sh
# 一键部署命令
# sh -c "$(curl -fsSL https://raw.githubusercontent.com/wrule/litebot/220829-core/shell/debian_init.sh)"
apt update
apt install git curl screen zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/wrule/litebot/220829-core/shell/configure.sh)"
sh -c "$(curl -fsSL https://raw.githubusercontent.com/wrule/litebot/220829-core/shell/zsh_install.sh)"
