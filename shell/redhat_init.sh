#!/bin/sh
yum update
yum install git curl screen zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/wrule/litebot/220829-core/shell/configure.sh)"
sh -c "$(curl -fsSL https://raw.githubusercontent.com/wrule/litebot/220829-core/shell/zsh_install.sh)"
