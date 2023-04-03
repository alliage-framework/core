#!/bin/bash

source "$(dirname $(readlink -f $0))/_parameters.sh"

ALLIAGE_VERSION=$(jq -r ".devDependencies[\"$ALLIAGE_PACKAGE_NAME\"]" "$LERNA_ROOT_PATH/package.json")
DEV_DEPS=$(jq .devDependencies package.json)
jq ".peerDependencies = {\"$ALLIAGE_PACKAGE_NAME\": \"$ALLIAGE_VERSION\"} + $DEV_DEPS" package.json >package.json.new
rm package.json
mv package.json.new package.json
