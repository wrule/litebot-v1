#!/bin/bash
echo 🚀 此脚本将帮助你:
echo 1. 下载项目源代码
echo 2. 安装node,git,curl,screen,zsh等环境或工具
echo 3. 安装项目所需要的npm依赖
echo 4. 编译项目
echo 😄 如果遇到询问确认，请选择[y/yes]
sleep 5
apt update
apt install git curl screen zsh
[ ! -e package.json ] \
&& https://github.com/wrule/litebot.git \
&& cd litebot \
&& git checkout 220829-core \
&& git pull
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
nvm install 14
npm install --global yarn
npm install --global typescript
npm install
npm run build
echo ✨ 项目编译成功
echo 🚀 安装ohmyzsh中，完成后建议重新启动终端...
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
