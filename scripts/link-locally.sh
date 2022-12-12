PACKAGES=$(lerna ls --ndjson)
for package in $PACKAGES; do
  NAME=$(echo $package | jq ".name" -r)
  LOCATION=$(echo $package | jq ".location" -r)
  LINK_FILE="./node_modules/$NAME"

  if [ ! -f "$LINK_FILE" ]; then
    ln -s "$LOCATION" "$LINK_FILE"
  fi
done