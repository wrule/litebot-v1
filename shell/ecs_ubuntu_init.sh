#!/bin/bash
apt update
apt install curl screen
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
