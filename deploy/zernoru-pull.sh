#!/bin/sh
set -eu

DEPLOY_DIR="${DEPLOY_DIR:-/home/vlan/ZernoRU/current}"
REMOTE="${REMOTE:-origin}"
BRANCH="${BRANCH:-main}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-zernoru}"

cd "$DEPLOY_DIR"

if [ ! -d .git ]; then
  git init -b "$BRANCH"
  git remote add "$REMOTE" https://github.com/Vlan3ik/ZernoRU.git
fi

git fetch "$REMOTE" "$BRANCH"
git checkout -B "$BRANCH" "$REMOTE/$BRANCH"
git reset --hard "$REMOTE/$BRANCH"
git clean -fdx

docker compose -p "$COMPOSE_PROJECT_NAME" -f docker-compose.prod.yml up -d --build --remove-orphans
