#!/bin/sh
# 一键部署命令
# sh -c "$(curl -fsSL https://raw.githubusercontent.com/wrule/litebot/220829-core/shell/redhat_init.sh)"
yum update
yum install git curl screen zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/wrule/litebot/220829-core/shell/configure.sh)"
echo 🚀 安装ohmyzsh中，完成后建议重新启动终端...
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
