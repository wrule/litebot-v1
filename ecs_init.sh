#!/bin/bash
apt update
apt install wget curl vim zsh git screen
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
# curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
# nvm install 14
# npm install --global yarn
# npm install -g typescript
