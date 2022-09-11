#!/bin/bash
apt update
apt install wget curl vim zsh git screen
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

