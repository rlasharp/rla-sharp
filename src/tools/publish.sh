#!/usr/bin/env bash
# Manual publish: build, run the full site check, then copy + stamp exactly like the automatic run does.
# Never copies anything if the check fails.   usage: bash src/tools/publish.sh
set -e
cd "$(dirname "$0")/.."; ROOT="$(cd .. && pwd)"
bash build.sh > /dev/null
node tools/check.js "$PWD/index.html" || { echo "publish: site check FAILED — nothing published" >&2; exit 1; }
AT=$(bash tools/publish_copy.sh "$ROOT" "${1:-site}")
echo "publish: OK ($AT)"
