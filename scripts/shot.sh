#!/bin/sh
# Screenshots a page at phone and desktop width with headless Chrome, so an
# agent can look at what it built instead of trusting the markup.
#
#   scripts/shot.sh <url-or-html-file> <out-prefix>
#
# writes <out-prefix>-mobile.png (390 wide) and <out-prefix>-desktop.png (1280).
set -eu
target=$1
out=$2
case $target in
  http://* | https://* | file://*) url=$target ;;
  *) url="file://$(cd "$(dirname "$target")" && pwd)/$(basename "$target")" ;;
esac
chrome=${CHROME:-"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"}
mkdir -p "$(dirname "$out")"
for size in mobile:390,1400 desktop:1280,1100; do
  name=${size%%:*}
  "$chrome" --headless --disable-gpu --hide-scrollbars --virtual-time-budget=2000 \
    --window-size="${size#*:}" --screenshot="$out-$name.png" "$url" >/dev/null 2>&1
  echo "$out-$name.png"
done
