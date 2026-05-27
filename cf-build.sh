#!/usr/bin/env bash
set -euo pipefail

PANDOC_VERSION="${PANDOC_VERSION:-3.6.4}"
TECTONIC_VERSION="${TECTONIC_VERSION:-0.15.0}"
TOOLS_DIR="${TOOLS_DIR:-$PWD/.tools}"
PANDOC_DIR="$TOOLS_DIR/pandoc"
TECTONIC_DIR="$TOOLS_DIR/tectonic"

mkdir -p "$PANDOC_DIR" "$TECTONIC_DIR"

export PATH="$PANDOC_DIR/bin:$TECTONIC_DIR:$PATH"
export PANDOC_PDF_ENGINE="${PANDOC_PDF_ENGINE:-tectonic}"

install_pandoc() {
  if command -v pandoc >/dev/null 2>&1; then
    return
  fi

  echo "Installing Pandoc ${PANDOC_VERSION}..."
  curl -fsSL \
    "https://github.com/jgm/pandoc/releases/download/${PANDOC_VERSION}/pandoc-${PANDOC_VERSION}-linux-amd64.tar.gz" \
    | tar -xz --strip-components=1 -C "$PANDOC_DIR"
}

install_tectonic() {
  if command -v tectonic >/dev/null 2>&1; then
    return
  fi

  echo "Installing Tectonic ${TECTONIC_VERSION}..."
  curl -fsSL \
    "https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%40${TECTONIC_VERSION}/tectonic-${TECTONIC_VERSION}-x86_64-unknown-linux-gnu.tar.gz" \
    | tar -xz -C "$TECTONIC_DIR"

  local tectonic_bin
  tectonic_bin="$(find "$TECTONIC_DIR" -type f -name tectonic | head -n 1)"
  if [ -z "$tectonic_bin" ]; then
    echo "Tectonic binary was not found after extraction." >&2
    exit 1
  fi

  if [ "$tectonic_bin" != "$TECTONIC_DIR/tectonic" ]; then
    cp "$tectonic_bin" "$TECTONIC_DIR/tectonic"
  fi
  chmod +x "$TECTONIC_DIR/tectonic"
}

install_pandoc
install_tectonic

pandoc --version
tectonic --version

npm run build:all
