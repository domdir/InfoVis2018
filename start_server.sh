#!/bin/sh

PWD_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

(cd "${PWD_DIR}/src" && python3 -m http.server)
