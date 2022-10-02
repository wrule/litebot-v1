#!/bin/sh
# 一键部署命令
# sh -c "$(curl -fsSL https://raw.githubusercontent.com/wrule/litebot/220829-core/shell/configure.sh)"
BRANCH=220829-core
echo 🚀 此脚本将帮助你:
echo 1. 安装nodejs环境
echo 2. 下载项目源代码
echo 3. 安装项目所需要的npm依赖
echo 4. 编译项目
echo 😄 如果遇到询问确认，请选择[y/yes]
sleep 5
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
nvm install 14
npm install --global yarn
npm install --global typescript
[ ! -e package.json ] && git clone https://github.com/wrule/litebot.git && cd litebot
git checkout $BRANCH && git pull
npm install
npm run build
echo ✨ 项目编译成功
echo 📢 请重新启动终端，或手动运行命令: source ~/.bashrc
