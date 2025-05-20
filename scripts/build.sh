#!/bin/bash

rm -rf dist
cp "$NX_WORKSPACE_ROOT/tsconfig.build.json" tsconfig.json
tsc --declaration
EXIT_CODE=$?
rm tsconfig.json
if [ $EXIT_CODE -ne 0 ]
then
  exit 1
else
  exit 0
fi
