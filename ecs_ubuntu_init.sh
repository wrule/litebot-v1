#!/bin/bash
apt update
apt install curl git zsh screen
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
source ~/.bashrc
nvm install 14
npm install --global yarn
npm install --global typescript
npm install
