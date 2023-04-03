#!/bin/sh

source "$(dirname $(readlink -f $0))/_parameters.sh"

FOLDER=$(basename "$PWD")
[[ $FOLDER = "core" ]] && DEPS_TYPE="dependencies" || DEPS_TYPE="devDependencies"
DEV_DEPS=$(jq ".$DEPS_TYPE" package.json || echo "")
PACKAGES_NAMES=$(echo $DEV_DEPS | jq -r 'keys | join(" ")')

MANIFEST_DEPS=''
for package in $PACKAGES_NAMES; do
  if [[ $package =~ ^$ALLIAGE_MODULE_NAME_PATTERN$ ]] && [ $package != $ALLIAGE_PACKAGE_NAME ]; then
    MANIFEST_DEPS="$MANIFEST_DEPS $package"
  fi
done

MANIFEST_DEPS_ARRAY=$(echo "\"$(echo $MANIFEST_DEPS | sed -e 's/^[[:space:]]*//')\"" | jq 'split(" ")')

jq ".alliageManifest.dependencies = $MANIFEST_DEPS_ARRAY" package.json >package.json.new
rm package.json
mv package.json.new package.json
